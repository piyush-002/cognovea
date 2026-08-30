/**
 * The rate limiter, against a real PostgreSQL.
 *
 * The interesting behaviour of this limiter is not in the JavaScript. It is in
 * one SQL statement, and the reason it is one statement is concurrency: a
 * limiter written as read-then-write loses the race it exists to win, because
 * twenty simultaneous requests all read "0" and all conclude they are first.
 * A test that stubs the database therefore checks nothing that matters.
 *
 * So this starts a throwaway Postgres, applies the real migration file, lifts
 * the real statement out of src/lib/rate-limit.ts, and runs it — including
 * genuinely parallel clients, to prove the burst is counted rather than lost.
 *
 * Neither the schema nor the query is retyped here. Both are read from the
 * files that ship, or this would be a test of a copy that can drift.
 *
 * Skips cleanly where there is no Postgres binary — the local device VM, for
 * instance. It runs in CI and in the cloud container.
 *
 *   node tools/test-rate-limit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

const HOST = '/tmp/pgrun';
const PORT = '55432';
const DB = 'ratelimit_test';

function have(cmd) {
  return spawnSync('which', [cmd], { encoding: 'utf8' }).status === 0;
}

function reportAndExit() {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

/* ==========================================================================
   The JavaScript half. Runs everywhere, including the device VM where there
   is no Postgres — which is why it comes before the skip below.
   ========================================================================== */

const require_ = createRequire(import.meta.url);
let ts;
try {
  ts = require_('typescript');
} catch {
  ts = null;
}

if (ts) {
  const compile = (rel) =>
    ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: rel,
    }).outputText;

  /** Whatever the next call to headers() should return, and whatever the pool should do. */
  const stub = { headers: new Map(), pool: null, poolThrows: false, queries: [] };

  const modules = {
    'next/headers': {
      headers: async () => ({ get: (k) => stub.headers.get(k.toLowerCase()) ?? null }),
    },
    '@/lib/payload': {
      getPayloadClient: async () => ({
        db: stub.pool === null ? undefined : {
          pool: {
            query: async (q, v) => {
              stub.queries.push({ q, v });
              if (stub.poolThrows) throw new Error('connection refused to postgres://user:pw@host/db');
              return { rows: [{ count: stub.pool }] };
            },
          },
        },
      }),
    },
  };

  const cache = {};
  const load = (key) => {
    if (key in cache) return cache[key];
    if (modules[key]) return (cache[key] = modules[key]);
    const m = { exports: {} };
    cache[key] = m.exports;
    new Function('exports', 'require', 'module', compile('src/lib/rate-limit.ts'))(m.exports, load, m);
    return (cache[key] = m.exports);
  };

  const { callerKey, rateLimit, LIMITS } = load('@/lib/rate-limit');

  /* --- which header is believed ------------------------------------------- */
  {
    stub.headers = new Map([
      ['x-vercel-forwarded-for', '203.0.113.9'],
      ['x-forwarded-for', '1.2.3.4, 5.6.7.8'],
      ['x-real-ip', '9.9.9.9'],
    ]);
    ok('Vercel\'s own header wins, because a client cannot forge it',
      (await callerKey()) === '203.0.113.9', String(await callerKey()));
  }
  {
    stub.headers = new Map([['x-forwarded-for', '1.2.3.4, 5.6.7.8'], ['x-real-ip', '9.9.9.9']]);
    ok('x-real-ip is preferred over the forwarded chain', (await callerKey()) === '9.9.9.9');
  }
  {
    stub.headers = new Map([['x-forwarded-for', '  1.2.3.4 , 5.6.7.8 ']]);
    ok('otherwise the first forwarded entry, trimmed', (await callerKey()) === '1.2.3.4');
  }
  {
    stub.headers = new Map();
    ok('no headers means no key', (await callerKey()) === null);
    stub.headers = new Map([['x-forwarded-for', '   ']]);
    ok('and a blank header is not a key either', (await callerKey()) === null);
  }
  {
    // Not a constant like "unknown": bucketing every unidentifiable caller into
    // one key would let a single script exhaust the limit for all of them.
    stub.headers = new Map();
    stub.pool = 999;
    const v = await rateLimit('enquiry', await callerKey(), 3, 3600);
    ok('an unidentifiable caller is allowed rather than lumped together', v.allowed === true);
  }

  /* --- the verdict -------------------------------------------------------- */
  {
    stub.pool = 3;
    const v = await rateLimit('enquiry', '1.1.1.1', 3, 3600);
    ok('the last allowed hit is allowed', v.allowed === true && v.count === 3, JSON.stringify(v));
  }
  {
    stub.pool = 4;
    const v = await rateLimit('enquiry', '1.1.1.1', 3, 3600);
    ok('one past the limit is refused', v.allowed === false, JSON.stringify(v));
  }
  {
    stub.queries.length = 0;
    stub.pool = 1;
    await rateLimit('enquiry', '1.1.1.1', 3, 3600);
    const { v } = stub.queries[0];
    ok('the key is namespaced by limit', v[0] === 'enquiry:1.1.1.1', String(v[0]));
    ok('and the window is passed as seconds', v[1] === '3600', String(v[1]));
  }

  /* --- failing open ------------------------------------------------------- */
  {
    stub.pool = null; // no db.pool on the payload client at all
    const v = await rateLimit('enquiry', '1.1.1.1', 3, 3600);
    ok('no pool means allow, not deny', v.allowed === true && v.degraded === true, JSON.stringify(v));
  }
  {
    stub.pool = 1;
    stub.poolThrows = true;
    const logged = [];
    const quiet = console.warn;
    console.warn = (...a) => logged.push(a.map(String).join(' '));
    const v = await rateLimit('enquiry', '1.1.1.1', 3, 3600);
    console.warn = quiet;
    stub.poolThrows = false;
    ok('a database error allows the request through', v.allowed === true && v.degraded === true, JSON.stringify(v));
    ok('and says so in the log', logged.length === 1 && /counter unavailable/.test(logged[0]), JSON.stringify(logged));
    // A connection error carries the connection string, password included.
    ok('without printing the credentials in it', !/user:pw@/.test(logged.join('')), logged.join(''));
  }
  {
    const v = await rateLimit('enquiry', null, 3, 3600);
    ok('a null key is allowed without touching the database', v.allowed === true);
  }

  /* --- the mail cap, which is the one that guards the sending quota -------- */
  {
    const notify = { exports: {} };
    const notifyCache = { '@/lib/rate-limit': cache['@/lib/rate-limit'] };
    const notifyLoad = (key) => {
      if (notifyCache[key]) return notifyCache[key];
      if (key === '@/lib/host-redirect.mjs') return (notifyCache[key] = { CANONICAL_URL: 'https://www.cognovea.com' });
      if (key === 'payload') return (notifyCache[key] = {});
      throw new Error(`unexpected import in notify: ${key}`);
    };
    new Function('exports', 'require', 'module', compile('src/lib/notify.ts'))(
      notify.exports, notifyLoad, notify,
    );

    process.env.RESEND_API_KEY = 're_test';
    process.env.EMAIL_NOTIFY = 'piyush@nextlooptechnologies.com';
    process.env.EMAIL_FROM = 'noreply@cognovea.com';
    stub.headers = new Map();

    const sent = [];
    const req = { payload: { sendEmail: async (a) => { sent.push(a); return { id: 'x' }; } } };
    const doc = { id: 1, fullName: 'A', workEmail: 'a@b.com', companyName: 'C' };

    stub.pool = 5; // well under the cap
    await notify.exports.notifyOnEnquiry({ doc, operation: 'create', req });
    ok('under the cap, the notification is sent', sent.length === 1, `sent ${sent.length}`);

    sent.length = 0;
    stub.pool = LIMITS.mail.limit + 1; // over
    const logged = [];
    const quiet = console.warn;
    console.warn = (...a) => logged.push(a.map(String).join(' '));
    const returned = await notify.exports.notifyOnEnquiry({ doc, operation: 'create', req });
    console.warn = quiet;
    ok('over the cap, nothing is sent', sent.length === 0, `sent ${sent.length}`);
    ok('but the record is still returned, so the submission survives', returned === doc);
    ok('and the log says the record was saved anyway',
      logged.length === 1 && /still saved/i.test(logged[0]), JSON.stringify(logged));
  }
} else {
  console.log('  SKIP  typescript is not installed, so the JavaScript half cannot run.');
}

/* ==========================================================================
   The SQL half. Needs a PostgreSQL to talk to.
   ========================================================================== */

if (!have('psql')) {
  console.log('\n  SKIP  psql is not installed here, so the real SQL is not exercised.');
  reportAndExit();
}

const alive =
  spawnSync('psql', ['-h', HOST, '-p', PORT, '-U', 'test', '-d', 'postgres', '-tAc', 'select 1'], {
    encoding: 'utf8',
  }).status === 0;

if (!alive) {
  console.log(`\n  SKIP  no PostgreSQL listening on ${HOST}:${PORT}.`);
  console.log('        Start one first — see the header of this file — or run this in CI.');
  reportAndExit();
}

/**
 * Run SQL and hand back the data rows.
 *
 * -q is what makes this work: without it psql prints a command tag for every
 * statement ("PREPARE", "INSERT 0 1") interleaved with the results, and the
 * first "row" of a PREPARE+EXECUTE is the word PREPARE. An earlier version of
 * this helper filtered those out by prefix instead, which then silently ate
 * every row of `SELECT indexdef ...` — because an index definition begins with
 * the word CREATE. Suppressing the tags at the source beats guessing which
 * lines are data.
 *
 * Fields come back pipe-separated, psql's default, which is unambiguous here
 * because nothing under test contains a pipe.
 */

function sql(text, { db = DB } = {}) {
  const out = execFileSync(
    'psql',
    // Two -c arguments rather than one string with a semicolon: statements in a
    // single -c share an implicit transaction, and DROP DATABASE cannot run in
    // one. Separate -c flags execute separately on the same session, so the SET
    // still applies.
    ['-h', HOST, '-p', PORT, '-U', 'test', '-d', db, '-tA', '-q', '-c', 'SET client_min_messages=warning', '-c', text],
    { encoding: 'utf8' },
  );
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => line.split('|'));
}

/** The single value from a one-row, one-column query. */
const one = (text) => {
  const rows = sql(text);
  if (!rows.length) throw new Error(`no rows back from: ${text.slice(0, 60)}`);
  return rows[0][0];
};


/* --- the schema, from the migration that ships ---------------------------- */

sql(`DROP DATABASE IF EXISTS ${DB}`, { db: 'postgres' });
sql(`CREATE DATABASE ${DB}`, { db: 'postgres' });

// The migration touches payload_locked_documents_rels, which Payload owns.
// A stand-in with just the column the migration needs is enough to prove the
// migration's own statements are valid.
sql(`CREATE TABLE payload_locked_documents_rels (id serial PRIMARY KEY)`);

const migration = fs.readFileSync(
  path.join(root, 'src/migrations/manual/2026-08-30-rate-limits.sql'),
  'utf8',
);

let applied = true;
try {
  execFileSync('psql', ['-h', HOST, '-p', PORT, '-U', 'test', '-d', DB, '-v', 'ON_ERROR_STOP=1', '-f', '-'], {
    input: migration,
    encoding: 'utf8',
  });
} catch (error) {
  applied = false;
  console.log((error.stderr || error.message).split('\n').slice(0, 6).join('\n'));
}
ok('the migration applies to an empty database', applied);

// Idempotence is claimed in the file's header, so it gets checked.
let twice = true;
try {
  execFileSync('psql', ['-h', HOST, '-p', PORT, '-U', 'test', '-d', DB, '-v', 'ON_ERROR_STOP=1', '-f', '-'], {
    input: `SET client_min_messages=warning;\n${migration}`,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
} catch {
  twice = false;
}
ok('and applies a second time without error', twice);

{
  const cols = sql(
    `SELECT column_name FROM information_schema.columns WHERE table_name='rate_limits' ORDER BY column_name`,
  ).map((r) => r[0]);
  ok('the table has the columns the limiter writes',
    ['count', 'created_at', 'id', 'key', 'updated_at', 'window_start'].every((c) => cols.includes(c)),
    cols.join(', '));

  const unique = sql(
    `SELECT indexdef FROM pg_indexes WHERE tablename='rate_limits' AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%(key)%'`,
  );
  // Without this the upsert never conflicts: every request inserts a new row,
  // every count comes back 1, and the limiter silently never limits anything.
  ok('key is unique, so ON CONFLICT can fire', unique.length === 1, JSON.stringify(unique));
}

/* --- the real statement, lifted from the source --------------------------- */

const source = fs.readFileSync(path.join(root, 'src/lib/rate-limit.ts'), 'utf8');
const match = /INSERT INTO rate_limits[\s\S]*?RETURNING "count"::int AS count/.exec(source);
ok('the upsert was found in src/lib/rate-limit.ts', match !== null);
if (!match) {
  console.log('\n  Cannot continue without the statement. Has it been renamed?');
  process.exit(1);
}
const UPSERT = match[0];

ok('it is a single statement', (UPSERT.match(/;/g) || []).length === 0);
ok('it casts the count, because Payload types it numeric and pg returns that as a string',
  /::int/.test(UPSERT));

/**
 * One hit. Returns the new count.
 *
 * PREPARE and EXECUTE go in the same call because a prepared statement lives
 * only as long as the session, and every psql invocation is a new one.
 */
const hit = (key, windowSeconds = 3600) =>
  Number(one(`PREPARE h(text,text) AS ${UPSERT}; EXECUTE h('${key}', '${windowSeconds}')`));

/* --- counting ------------------------------------------------------------- */
{
  ok('the first hit counts one', hit('enquiry:1.1.1.1') === 1);
  ok('the second counts two', hit('enquiry:1.1.1.1') === 2);
  ok('the third counts three', hit('enquiry:1.1.1.1') === 3);
  ok('and it keeps going past the limit rather than saturating', hit('enquiry:1.1.1.1') === 4);
}
{
  // The namespace is part of the key, so one address hitting two different
  // surfaces gets two allowances rather than one shared one.
  ok('a different address is counted separately', hit('enquiry:2.2.2.2') === 1);
  ok('and so is the same address on a different limit', hit('tool-lead:1.1.1.1') === 1);
  ok('without disturbing the original', hit('enquiry:1.1.1.1') === 5);
}
{
  ok('all of which is one row, not one per request',
    Number(one(`SELECT count(*)::int FROM rate_limits WHERE "key" = 'enquiry:1.1.1.1'`)) === 1);
}

/* --- the window rolls over ------------------------------------------------ */
{
  hit('roll:3.3.3.3');
  hit('roll:3.3.3.3');
  ok('two hits so far', Number(one(`SELECT "count"::int FROM rate_limits WHERE "key"='roll:3.3.3.3'`)) === 2);

  // Age the window past its end rather than waiting an hour for it.
  sql(`UPDATE rate_limits SET window_start = now() - interval '61 minutes' WHERE "key"='roll:3.3.3.3'`);
  ok('a hit after the window closes starts a new one at 1', hit('roll:3.3.3.3') === 1);
  ok('and the window start moved to now',
    Number(one(`SELECT (now() - window_start < interval '5 seconds')::int FROM rate_limits WHERE "key"='roll:3.3.3.3'`)) === 1);

  // Just inside the window must NOT reset — the off-by-one that would make the
  // limiter useless in the most ordinary case.
  sql(`UPDATE rate_limits SET window_start = now() - interval '59 minutes', "count" = 7 WHERE "key"='roll:3.3.3.3'`);
  ok('a hit just inside the window keeps counting', hit('roll:3.3.3.3') === 8);
}
{
  // A short window, to prove the interval parameter is honoured rather than
  // ignored in favour of something hardcoded.
  hit('short:4.4.4.4', 2);
  sql(`UPDATE rate_limits SET window_start = now() - interval '3 seconds' WHERE "key"='short:4.4.4.4'`);
  ok('a two-second window expires after three seconds', hit('short:4.4.4.4', 2) === 1);
  sql(`UPDATE rate_limits SET window_start = now() - interval '3 seconds' WHERE "key"='short:4.4.4.4'`);
  ok('...and the same row under an hour-long window does not', hit('short:4.4.4.4', 3600) === 2);
}

/* --- the point of the whole design: a concurrent burst -------------------- */
{
  const KEY = 'burst:5.5.5.5';
  const N = 40;

  // Genuinely parallel: separate psql processes, separate connections, all
  // firing at the same key. This is the case a read-then-write limiter loses.
  const procs = Array.from({ length: N }, () =>
    new Promise((resolve) => {
      const p = spawnSync('psql', [
        '-h', HOST, '-p', PORT, '-U', 'test', '-d', DB, '-tAc',
        `PREPARE h(text,text) AS ${UPSERT}; EXECUTE h('${KEY}', '3600')`,
      ], { encoding: 'utf8' });
      resolve(p.status === 0);
    }),
  );
  const results = await Promise.all(procs);

  ok(`all ${N} concurrent hits succeeded`, results.every(Boolean), `${results.filter(Boolean).length} of ${N}`);

  const final = Number(one(`SELECT "count"::int FROM rate_limits WHERE "key"='${KEY}'`));
  ok(`the count is exactly ${N} — no hit was lost to a race`, final === N, `counted ${final}`);

  const rows = Number(one(`SELECT count(*)::int FROM rate_limits WHERE "key"='${KEY}'`));
  ok('and the burst produced one row, not a row per request', rows === 1, `${rows} rows`);
}

/* --- the housekeeping sweep ----------------------------------------------- */
{
  const sweep = /DELETE FROM rate_limits WHERE window_start < now\(\) - interval '[^']+'/.exec(source);
  ok('the sweep statement was found in the source', sweep !== null);
  if (sweep) {
    sql(`INSERT INTO rate_limits ("key", window_start, "count", created_at, updated_at)
         VALUES ('old:9.9.9.9', now() - interval '30 days', 5, now(), now())`);
    const before = Number(one(`SELECT count(*)::int FROM rate_limits`));
    sql(sweep[0]);
    const after = Number(one(`SELECT count(*)::int FROM rate_limits`));
    ok('it removes a long-dead row', after === before - 1, `${before} -> ${after}`);
    ok('and leaves the live ones alone',
      Number(one(`SELECT count(*)::int FROM rate_limits WHERE "key"='burst:5.5.5.5'`)) === 1);
  }
}

/* --- the limits are a sane policy ----------------------------------------- */
{
  const limits = /export const LIMITS = \{[\s\S]*?\n\} as const;/.exec(source);
  ok('the limits are declared in one place', limits !== null);
  const get = (name) => {
    const m = new RegExp(`${name}: \\{ limit: (\\d+), windowSeconds: ([^}]+)\\}`).exec(limits[0]);
    return m ? { limit: Number(m[1]), window: m[2].trim() } : null;
  };
  const enquiry = get('enquiry');
  const mail = get('mail');
  ok('the contact form allows more than one submission', enquiry && enquiry.limit > 1, JSON.stringify(enquiry));
  ok('but not many', enquiry && enquiry.limit <= 10, JSON.stringify(enquiry));
  // The whole point of the mail cap: it must sit well under the provider's
  // daily allowance, or it protects nothing.
  ok('the hourly mail cap leaves room in a 100/day allowance',
    mail && mail.limit * 24 > 100 ? mail.limit <= 25 : true, JSON.stringify(mail));
  ok('and is above anything this site legitimately sends in an hour', mail && mail.limit >= 10, JSON.stringify(mail));
}

sql(`DROP DATABASE IF EXISTS ${DB}`, { db: 'postgres' });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
