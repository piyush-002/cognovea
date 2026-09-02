/**
 * Refuses to publish a playbook figure that nothing supports.
 *
 * The whole premise of this section is that a reader can check it. That premise
 * survives exactly until the first unsourced percentage goes up, and the way
 * unsourced percentages get in is not dishonesty — it is someone writing "around
 * 30% of projects" from memory at the end of a long afternoon.
 *
 * So: every number that reads like a claim about the world must be traceable to
 * a Source object. Numbers that are obviously not claims — a count of items in a
 * list, a year in a citation — are allowed, and the rules for that are stated
 * below rather than guessed at.
 *
 * This also checks the parts that quietly rot: a source with no URL, a findings
 * entry nothing references, a use case with no failure mode. The last one
 * matters because a playbook where nothing ever fails is a brochure.
 *
 *   node tools/check-playbooks.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require_ = createRequire(import.meta.url);

let ts;
try {
  ts = require_('typescript');
} catch {
  console.log('SKIP  typescript is not installed here. Run `npm install` first.');
  process.exit(0);
}

const compile = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: rel,
  }).outputText;

const FILES = {
  '@/lib/playbooks/sources': 'src/lib/playbooks/sources.ts',
  '@/lib/playbooks': 'src/lib/playbooks/index.ts',
};

const cache = {};
const load = (key) => {
  if (key in cache) return cache[key];
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const m = { exports: {} };
  cache[key] = m.exports;
  new Function('exports', 'require', 'module', compile(FILES[key]))(m.exports, load, m);
  return (cache[key] = m.exports);
};

const { PLAYBOOKS, PLANNED_PLAYBOOKS } = load('@/lib/playbooks');
const { SOURCES, FINDINGS } = load('@/lib/playbooks/sources');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

/* --- the sources themselves ----------------------------------------------- */
for (const [id, s] of Object.entries(SOURCES)) {
  ok(`${id}: has a resolvable-looking URL`, /^https?:\/\/\S+$/.test(s.url || ''), s.url);
  ok(`${id}: names a publisher`, Boolean(s.publisher?.trim()));
  ok(`${id}: has a year that is plausible`, s.year >= 1980 && s.year <= new Date().getFullYear(), String(s.year));
  // The method is the point. A source whose method is "a report" cannot be weighed.
  ok(`${id}: states how the finding was arrived at`, (s.method || '').length > 60, `${(s.method || '').length} chars`);
  ok(`${id}: declares its standing`,
    ['peer-reviewed', 'official', 'vendor-research', 'editorial'].includes(s.standing), s.standing);
  // Vendor research without a caveat is the exact failure this section exists to
  // avoid: a marketing number laundered into a citation.
  if (s.standing === 'vendor-research') {
    ok(`${id}: vendor research carries a caveat`, Boolean(s.caveat?.trim()));
  }
}

/* --- findings are attached to sources ------------------------------------- */
for (const [key, f] of Object.entries(FINDINGS)) {
  ok(`finding ${key}: has a source`, Boolean(f.source?.id));
  ok(`finding ${key}: its source is registered`, Boolean(SOURCES[f.source?.id]), f.source?.id);
  ok(`finding ${key}: the claim is quotable on its own`, (f.claim || '').length > 40);
}

/* --- no unsourced numbers in the prose ------------------------------------ */
/*
 * What counts as a claim about the world, and what does not.
 *
 * Allowed without a source: ordinals and small counts that describe this
 * document rather than reality ("six use cases"), years inside a citation, and
 * the illustrative arithmetic used to explain why an accuracy figure misleads —
 * "fails on 2% of days, so 98% accurate" is a worked example, not a measurement,
 * and it is immediately explained as one.
 *
 * Everything else — a percentage, a currency figure, a large round number —
 * must sit in a field that carries a Finding, or in text that names its source.
 */
const NUMERIC = /(?:\$[\d,.]+\s*(?:trillion|billion|million|thousand)?|\b\d[\d,.]*\s*%|\b\d[\d,.]{3,}\b)/gi;

/** Text that names where it came from, so the figure in it is accounted for. */
const ATTRIBUTED =
  /(senseye|siemens|applied sciences|mdpi|powell|journal of|reviewed|published|study|studies|survey|interviews|report|according to|worked example|for example)/i;

for (const p of PLAYBOOKS) {
  const fields = [
    ['standfirst', p.standfirst],
    ['description', p.description],
    ['audience', p.audience],
    ...p.useCases.flatMap((u) => [
      [`${u.id}.what`, u.what],
      [`${u.id}.summary`, u.summary],
      [`${u.id}.proof`, u.proof],
      [`${u.id}.fails`, u.fails],
      ...u.needs.map((n, i) => [`${u.id}.needs[${i}]`, n]),
    ]),
    ...p.readiness.map((r) => [`readiness:${r.name.slice(0, 24)}`, r.detail]),
    ...p.faq.flatMap((f, i) => [
      [`faq[${i}].question`, f.question],
      [`faq[${i}].answer`, f.answer],
    ]),
  ];

  for (const [where, text] of fields) {
    const numbers = String(text || '').match(NUMERIC) || [];
    if (numbers.length === 0) continue;
    ok(
      `${p.slug} ${where}: its figures name a source`,
      ATTRIBUTED.test(String(text)),
      `found ${numbers.join(', ')} with nothing attributing it`,
    );
  }
}

/* --- the shape that makes it useful rather than promotional --------------- */
for (const p of PLAYBOOKS) {
  /*
   * The 62-character rule lives in tools/test-titles.mjs, and this route slips
   * past it: that check parses static `metadata` exports, and a playbook builds
   * its title in generateMetadata from this object. So the rule is enforced
   * here instead, where the string actually is.
   */
  ok(`${p.slug}: has a title that could be searched for`, (p.title || '').length > 25);
  ok(
    `${p.slug}: the title fits what a search result displays`,
    (p.title || '').length <= 62,
    `${(p.title || '').length} chars: "${p.title}"`,
  );
  // Two of the six use cases involve no machine learning, so the set is not
  // "AI" — but the phrase people search still has to survive inside the title.
  /* The rule is that the title claims data as well as AI — not that it uses one
     exact phrasing. "Data Analytics and AI Use Cases in Manufacturing Industry"
     satisfies it more explicitly than "Data and AI" does, and a regex that
     rejected it would be enforcing a wording rather than the point. Still fails
     a title that says only AI, which is what this exists for. */
  ok(
    `${p.slug}: the title says data and AI, not just AI`,
    /\bdata\b[^.]*\band ai\b/i.test(p.title || ''),
    p.title,
  );
  ok(
    `${p.slug}: and still contains the phrase people type`,
    /ai use cases in /i.test(p.title || ''),
    p.title,
  );
  ok(`${p.slug}: says who it is for`, (p.audience || '').length > 60);
  ok(`${p.slug}: has at least four use cases`, p.useCases.length >= 4, String(p.useCases.length));
  ok(`${p.slug}: has readiness criteria`, p.readiness.length >= 3, String(p.readiness.length));
  ok(`${p.slug}: has an FAQ, which is what gets quoted back`, p.faq.length >= 3, String(p.faq.length));

  // The opening paragraph should name the subject, not describe the document.
  ok(
    `${p.slug}: the standfirst names use cases rather than describing itself`,
    !/^(most|this document|this page|the honest)/i.test(p.standfirst.trim()),
    p.standfirst.slice(0, 70),
  );
  ok(`${p.slug}: records when it was last updated`, /^\d{4}-\d{2}-\d{2}$/.test(p.updated || ''), p.updated);

  for (const u of p.useCases) {
    // Every one of these is a field a brochure would omit.
    ok(`${p.slug}/${u.id}: says what data it needs`, u.needs.length >= 2, String(u.needs.length));
    ok(`${p.slug}/${u.id}: says how you would know it worked`, (u.proof || '').length > 80);
    ok(`${p.slug}/${u.id}: admits where it fails`, (u.fails || '').length > 80);
  }

  const ids = p.useCases.map((u) => u.id);
  ok(`${p.slug}: use case ids are unique`, new Set(ids).size === ids.length, ids.join(', '));
}

/* --- the index cannot advertise a page that does not exist ---------------- */
{
  const publishedSlugs = new Set(PLAYBOOKS.filter((p) => p.published).map((p) => p.slug));
  const plannedSlugs = PLANNED_PLAYBOOKS.map((p) => p.slug);
  ok('no planned playbook collides with a published one',
    plannedSlugs.every((s) => !publishedSlugs.has(s)), plannedSlugs.join(', '));
  ok('every planned entry names its industry', PLANNED_PLAYBOOKS.every((p) => Boolean(p.industry?.trim())));
}

/* --- a published playbook must be reachable and submitted ----------------- */
{
  const sitemap = fs.readFileSync(path.join(root, 'src/app/sitemap.ts'), 'utf8');
  const site = fs.readFileSync(path.join(root, 'src/lib/site.ts'), 'utf8');

  /*
   * Derived rather than listed, deliberately, and checked here so it stays that
   * way. src/lib/site.ts used to carry a hand-written line per playbook, which
   * works exactly until somebody publishes the sixth one and forgets — and a
   * page missing from the sitemap is a page that was written to be linked to
   * and never submitted.
   */
  ok('the sitemap builds playbook entries from the content module',
    /publishedPlaybooks\(\)/.test(sitemap), 'no publishedPlaybooks() call in sitemap.ts');
  ok('and site.ts does not hand-list individual playbooks',
    !/path: '\/playbooks\/[a-z]/.test(site), 'found a hardcoded playbook route in routes[]');
  ok('the section index is still listed', /path: '\/playbooks'/.test(site));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
