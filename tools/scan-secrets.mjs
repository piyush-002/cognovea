/**
 * Secret scan: source, git history, client bundle exposure, and logging.
 *
 * Findings are printed with values masked. A scanner that prints the secret it
 * found has published it again, into a terminal, a CI log and whatever scrapes
 * either.
 *
 *   node tools/scan-secrets.mjs
 *
 * Exit 1 on anything that must be fixed before pushing, 0 otherwise.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sh = (cmd) => {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

const mask = (s) => {
  const t = String(s);
  if (t.length <= 8) return '*'.repeat(t.length);
  return `${t.slice(0, 4)}…${t.slice(-2)} (${t.length} chars)`;
};

const critical = [];
const warnings = [];
const notes = [];

/* ---------------------------------------------------------------------------
   1. Known credential formats in tracked source.
   Patterns are anchored to real vendor prefixes rather than generic entropy,
   which keeps this quiet enough that people keep running it.
--------------------------------------------------------------------------- */
const PATTERNS = [
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['AWS secret access key', /\baws_secret_access_key\s*[=:]\s*['"][A-Za-z0-9/+=]{40}['"]/i],
  ['Stripe secret key', /\bsk_(live|test)_[A-Za-z0-9]{16,}\b/],
  ['Stripe restricted key', /\brk_(live|test)_[A-Za-z0-9]{16,}\b/],
  ['Stripe publishable key', /\bpk_(live|test)_[A-Za-z0-9]{16,}\b/],
  ['Supabase / JWT (service role risk)', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['OpenAI key', /\bsk-(proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['Anthropic key', /\bsk-ant-[A-Za-z0-9_-]{20,}\b/],
  ['SendGrid key', /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/],
  ['Twilio account SID', /\bAC[0-9a-f]{32}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Vercel Blob token', /\bvercel_blob_rw_[A-Za-z0-9_]{20,}\b/],
  ['Private key block', /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['Postgres/MySQL/Mongo URL with credentials', /\b(postgres(ql)?|mysql|mongodb(\+srv)?):\/\/[^\s'"]*:[^\s'"@]+@[^\s'"]+/],
  ['Basic auth in a URL', /\bhttps?:\/\/[^\s'"/]+:[^\s'"@]+@/],
];

/**
 * A connection string whose credentials are obviously invented.
 *
 * Judged on the password, since that is the part that matters: real ones are
 * long and random, fixtures are `p`, `pass`, `password`. A short password in a
 * committed file is not a leak worth alarming about, and treating it as one
 * buries the real finding among four false ones.
 */
const DUMMY_SECRETS = new Set(['p', 'pass', 'password', 'passwd', 'secret', 'user', 'u', 'test', 'dummy', 'fake', 'x', 'pw']);

function isDummyConnection(value) {
  const m = String(value).match(/:\/\/([^:/@]*):([^@]*)@/);
  if (!m) return false;
  const password = decodeURIComponent(m[2]);
  if (DUMMY_SECRETS.has(password.toLowerCase())) return true;
  // Anything this short cannot be a credential anyone actually provisioned.
  if (password.length < 8) return true;
  // A single repeated character, e.g. "xxxxxxxxxx".
  if (/^(.)\1+$/.test(password)) return true;
  return false;
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'preview', 'dist', 'build', '.vercel']);
const TEXT_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.css', '.scss',
  '.html', '.yml', '.yaml', '.sh', '.env', '.example', '.txt', '.sql',
]);

const tracked = sh('git ls-files').split('\n').filter(Boolean);

/**
 * Refuse to report a clean result off an empty file list.
 *
 * The first run of this scanner printed "0 critical" having scanned nothing at
 * all, because it was pointed at a directory that was not a git repository. A
 * security check that passes when it did no work is worse than no check: it
 * produces the paperwork without the inspection.
 */
if (tracked.length === 0) {
  console.error('ERROR  git ls-files returned nothing, so there is nothing to scan.');
  console.error('       Run this inside the repository. Refusing to report a clean result.');
  process.exit(2);
}

function scanFile(rel) {
  const full = path.join(root, rel);
  let stat;
  try {
    stat = fs.statSync(full);
  } catch {
    return;
  }
  if (!stat.isFile() || stat.size > 2_000_000) return;

  const ext = path.extname(rel);
  const base = path.basename(rel);
  if (ext && !TEXT_EXT.has(ext) && !base.startsWith('.env')) return;

  let text;
  try {
    text = fs.readFileSync(full, 'utf8');
  } catch {
    return;
  }

  text.split('\n').forEach((line, i) => {
    for (const [name, re] of PATTERNS) {
      const m = line.match(re);
      if (!m) continue;

      // A pattern inside this scanner is the pattern, not a secret.
      if (rel === 'tools/scan-secrets.mjs') continue;
      // Placeholders in the example file are the point of that file, and test
      // fixtures need a realistic SHAPE without being a real credential.
      // Flagging those trains people to ignore the scanner, which is the only
      // failure mode that actually loses a secret.
      const looksPlaceholder =
        /(xxx+|placeholder|your[_-]?|example|changeme|<[^>]+>|\.\.\.|\byyy)/i.test(line) ||
        /^[A-Z_]+=\s*$/.test(line.trim()) ||
        isDummyConnection(m[0]);
      const bucket = looksPlaceholder ? notes : critical;
      bucket.push({
        kind: name,
        where: `${rel}:${i + 1}`,
        sample: mask(m[0]),
        placeholder: looksPlaceholder,
      });
    }
  });
}

tracked.forEach(scanFile);

/* ---------------------------------------------------------------------------
   2. Env files: ignored, and not tracked.
--------------------------------------------------------------------------- */
const gitignore = fs.existsSync(path.join(root, '.gitignore'))
  ? fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
  : '';

const ignoresEnv = /^\s*\.env\*?(\.local)?\s*$/m.test(gitignore) || /^\s*\.env/m.test(gitignore);
if (!ignoresEnv) critical.push({ kind: '.env is not gitignored', where: '.gitignore', sample: '—' });

const trackedEnv = tracked.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'));
for (const f of trackedEnv) {
  critical.push({ kind: 'env file is tracked by git', where: f, sample: '—' });
}

if (!fs.existsSync(path.join(root, '.env.example'))) {
  critical.push({ kind: '.env.example is missing', where: '.env.example', sample: '—' });
}

/* ---------------------------------------------------------------------------
   3. Git history. A secret removed from HEAD is still in every clone.
--------------------------------------------------------------------------- */
const historyEnv = sh('git log --all --name-only --pretty=format: -- ".env" ".env.*" "!.env.example"')
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => s && !s.endsWith('.example'));

for (const f of [...new Set(historyEnv)]) {
  critical.push({ kind: 'env file appears in git history', where: `history: ${f}`, sample: '—' });
}

/**
 * Confirm the history search works before trusting a clean result from it.
 *
 * `git log -G` over every blob is exactly the kind of check that can return
 * nothing because the invocation is wrong rather than because the repository
 * is clean, and the two outcomes look identical. So it is first asked for
 * something that is definitely present.
 */
const historyProbe = sh(`git log --all -G'buildConfig' --pretty=format:'%h' -- . | head -1`).trim();
if (!historyProbe) {
  warnings.push({
    kind: 'the git history search returned nothing even for a string known to be present',
    where: 'git log -G',
    sample: 'treat the history result below as UNVERIFIED',
  });
} else {
  notes.push({ kind: 'git history search verified working', where: `probe matched commit ${historyProbe}`, sample: '—' });
}

// Search every blob ever committed. ONE pass over the history with the
// patterns combined, not one pass per pattern: sixteen separate `git log -G`
// walks took minutes on this repository, and a check nobody waits for is a
// check nobody runs.
const historyHits = [];
{
  const combined = PATTERNS.filter(([name]) =>
    name !== 'Postgres/MySQL/Mongo URL with credentials' && name !== 'Basic auth in a URL',
  )
    .map(([, re]) => re.source.replace(/\\b/g, ''))
    .join('|');

  const out = sh(`git log --all -p -G'${combined.replace(/'/g, "'\\''")}' --pretty=format:'@@%h %s' | head -400`);

  if (out.trim()) {
    // Report the commits, and which pattern each added line matched, without
    // ever printing the matched text.
    let commit = '(unknown)';
    const seen = new Set();
    for (const line of out.split('\n')) {
      if (line.startsWith('@@')) {
        commit = line.slice(2).trim();
        continue;
      }
      if (!line.startsWith('+') || line.startsWith('+++')) continue;
      for (const [name, re] of PATTERNS) {
        if (name === 'Postgres/MySQL/Mongo URL with credentials' || name === 'Basic auth in a URL') continue;
        const m = line.match(re);
        if (!m) continue;
        const key = `${name}::${commit}`;
        if (seen.has(key)) continue;
        seen.add(key);
        historyHits.push({ name, commit, sample: mask(m[0]) });
      }
    }
  }
}

for (const h of historyHits) {
  critical.push({
    kind: `"${h.name}" was committed at some point and is still in git history`,
    where: `commit ${h.commit}`,
    sample: h.sample,
  });
}

/* ---------------------------------------------------------------------------
   4. Client exposure. NEXT_PUBLIC_ ships to the browser, always.
--------------------------------------------------------------------------- */
const SENSITIVE_WORDS = /(secret|password|passwd|private|service_role|token|credential|_key$|apikey|api_key|signing|salt|dsn|uri|url_unpooled)/i;
const PUBLIC_SAFE = new Set([
  'NEXT_PUBLIC_SERVER_URL',
  'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_VERCEL_URL',
]);

const publicVars = new Set();
for (const rel of tracked) {
  const ext = path.extname(rel);
  if (!TEXT_EXT.has(ext) && !path.basename(rel).startsWith('.env')) continue;
  let text;
  try {
    text = fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    continue;
  }
  for (const m of text.matchAll(/\b(NEXT_PUBLIC_[A-Z0-9_]+|REACT_APP_[A-Z0-9_]+)\b/g)) publicVars.add(m[1]);
}
for (const v of publicVars) {
  if (PUBLIC_SAFE.has(v)) continue;
  if (SENSITIVE_WORDS.test(v)) {
    critical.push({ kind: 'sensitive-looking name is exposed to the browser', where: v, sample: '—' });
  } else {
    notes.push({ kind: 'browser-exposed variable (review that it is public-safe)', where: v, sample: '—' });
  }
}

/* ---------------------------------------------------------------------------
   5. Server-only secrets referenced from client components.
--------------------------------------------------------------------------- */
const SERVER_ONLY = /process\.env\.(?!NEXT_PUBLIC_)([A-Z0-9_]+)/g;
for (const rel of tracked) {
  if (!/\.(tsx|ts|jsx|js)$/.test(rel)) continue;
  let text;
  try {
    text = fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    continue;
  }
  const isClient = /^\s*['"]use client['"]/m.test(text.split('\n').slice(0, 3).join('\n'));
  if (!isClient) continue;
  for (const m of text.matchAll(SERVER_ONLY)) {
    critical.push({
      kind: `server-only env var read in a client component`,
      where: `${rel} → process.env.${m[1]}`,
      sample: '—',
    });
  }
}

/* ---------------------------------------------------------------------------
   6. Logging and responses.
--------------------------------------------------------------------------- */
const LOG_RE = /(console\.(log|info|warn|error|debug)|res\.json|NextResponse\.json|Response\.json)\s*\([^)]*\b(process\.env|connectionString|DATABASE_URI|PAYLOAD_SECRET|BLOB_READ_WRITE_TOKEN|secret|token|password)\b/i;
for (const rel of tracked) {
  if (!/\.(tsx|ts|jsx|js|mjs|cjs)$/.test(rel)) continue;
  if (rel.startsWith('tools/')) continue;
  let text;
  try {
    text = fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    continue;
  }
  text.split('\n').forEach((line, i) => {
    // Strip string literals before testing.
    //
    // console.error('DATABASE_URI is not set') NAMES the variable; it does not
    // print it. Flagging that is a false positive on a line whose whole job is
    // to help somebody fix a missing value — and a scanner that cries wolf on
    // every run is one people stop reading, which is the failure mode this
    // whole file exists to avoid.
    //
    // What is still caught is the dangerous shape: the identifier appearing as
    // an expression, e.g. console.log(process.env.DATABASE_URI).
    const code = line
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`(?:[^`\\$]|\\.|\$(?!\{))*`/g, '``');
    if (LOG_RE.test(code)) {
      warnings.push({ kind: 'a log or response references a secret-ish value', where: `${rel}:${i + 1}`, sample: line.trim().slice(0, 110) });
    }
  });
}

/* ------------------------------------------------------------------------- */
const section = (title, rows) => {
  console.log(`\n${title}  (${rows.length})`);
  if (rows.length === 0) {
    console.log('  none');
    return;
  }
  for (const r of rows) console.log(`  - ${r.kind}\n      at ${r.where}${r.sample && r.sample !== '—' ? `\n      value ${r.sample}` : ''}`);
};

console.log(`Scanned ${tracked.length} tracked files.`);
section('MUST FIX BEFORE PUSHING', critical);
section('REVIEW', warnings);
section('NOTES', notes);

console.log(`\n${critical.length} critical, ${warnings.length} to review, ${notes.length} notes`);
process.exit(critical.length > 0 ? 1 : 0);
