/**
 * The server action behind the gated one-pager.
 *
 * This is the only place on the site where somebody hands over an address, so
 * the failure modes are asymmetric. Losing a lead is a bad day; withholding the
 * document from a person who has already paid for it with their email is a
 * broken promise, and refusing a real address because of a typo in a regex is
 * worse than accepting a junk one. Both directions are checked here.
 *
 * The real action is compiled and run — not reimplemented. tools/test-enquiry-
 * clean.mjs mirrors its sanitiser instead, which is fine for a pure string
 * function but would be useless here: the interesting behaviour is what the
 * action does with Payload, and a copy of the logic would keep passing after
 * the original changed.
 *
 *   node tools/test-tool-lead.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const require = createRequire(import.meta.url);

let ts;
try {
  ts = require('typescript');
} catch {
  console.log('SKIP  typescript is not installed here. Run `npm install` first.');
  process.exit(0);
}

const compile = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    // TypeScript decides module format from the extension, and a .mjs file is
    // always ESM to it — so its `export` survives and blows up inside
    // `new Function`. host-redirect.mjs has to be .mjs (next.config.mjs imports
    // it), so it is compiled under a .ts name purely to get CommonJS out.
    fileName: rel.replace(/\.mjs$/, '.ts'),
  }).outputText;

/* --- the module graph, with only the database faked ----------------------- */

const FILES = {
  '@/lib/calculator/assumptions': 'src/lib/calculator/assumptions.ts',
  '@/lib/calculator/model': 'src/lib/calculator/model.ts',
  '@/lib/calculator/url-state': 'src/lib/calculator/url-state.ts',
  '@/lib/host-redirect.mjs': 'src/lib/host-redirect.mjs',
  '@/actions/tool-lead': 'src/actions/tool-lead.ts',
  // The calculator modules import each other by relative path.
  './assumptions': 'src/lib/calculator/assumptions.ts',
  './model': 'src/lib/calculator/model.ts',
  './url-state': 'src/lib/calculator/url-state.ts',
};

/** Relative and aliased specifiers for the same file must load the same module. */
const CANONICAL_KEY = {
  './assumptions': '@/lib/calculator/assumptions',
  './model': '@/lib/calculator/model',
  './url-state': '@/lib/calculator/url-state',
};

/** Everything the fake Payload client saw, plus a switch to make it fail. */
const db = { creates: [], throwOnCreate: false };

const cache = {};
function load(spec) {
  const key = CANONICAL_KEY[spec] || spec;
  if (key in cache) return cache[key];
  if (key === '@/lib/payload') {
    cache[key] = {
      getPayloadClient: async () => ({
        create: async (args) => {
          if (db.throwOnCreate) throw new Error('connection terminated unexpectedly');
          db.creates.push(args);
          return { id: db.creates.length };
        },
      }),
    };
    return cache[key];
  }
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const module = { exports: {} };
  cache[key] = module.exports;
  const code = compile(FILES[key]);
  new Function('exports', 'require', 'module', code)(module.exports, load, module);
  cache[key] = module.exports;
  return module.exports;
}

const { submitToolLead } = load('@/actions/tool-lead');
const { calculate, normalise, formatCurrency } = load('@/lib/calculator/model');
const { encodeInputs, decodeInputs } = load('@/lib/calculator/url-state');
const { CANONICAL_URL } = load('@/lib/host-redirect.mjs');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

/** A FormData with the given fields, so the action is called exactly as the form calls it. */
const form = (fields) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

/** Run the action against a clean database and hand back both sides. */
async function submit(fields, { failDb = false } = {}) {
  db.creates.length = 0;
  db.throwOnCreate = failDb;
  const result = await submitToolLead(form(fields));
  return { result, wrote: db.creates.length, data: db.creates[0]?.data, args: db.creates[0] };
}

/* A real, complete set of inputs and the query the calculator would build. */
const INPUTS = normalise({
  industry: 'manufacturing',
  people: 5,
  hoursPerWeek: 10,
  hourlyCost: 1000,
  reportsPerMonth: 12,
  decisionLagDays: 3,
  costPerDayOfDelay: 20000,
  timeReduction: 0.6,
  investment: 500000,
});
const QUERY = encodeInputs(INPUTS);

/* --- the honeypot --------------------------------------------------------- */
{
  const { result, wrote } = await submit({ email: 'bot@realdomain.com', website: 'http://spam.example', inputs: QUERY });
  ok('a filled honeypot is reported as success', result.ok === true);
  ok('and nothing is written', wrote === 0, `wrote ${wrote}`);
}
{
  const { result, wrote } = await submit({ email: 'person@realdomain.com', website: '', inputs: QUERY });
  ok('an empty honeypot is not treated as a bot', result.ok === true && wrote === 1, `wrote ${wrote}`);
}

/* --- which addresses get through ------------------------------------------ */
const emails = [
  ['rgarg@nextlooptechnologies.com', true],
  ['a@b.co', true],
  ['first.last+tag@sub.domain.co.in', true],
  ['  Mixed.Case@Domain.COM  ', true],
  ['', false],
  ['no-at-sign.com', false],
  ['trailing@dot.', false],
  ['@nodomain.com', false],
  ['spaces in@domain.com', false],
  ['two@@at.com', false],
  ['single@letter.c', false],
  ['someone@example.com', false],
  ['someone@example.org', false],
  ['someone@test.com', false],
  ['root@localhost', false],
];
for (const [value, accepted] of emails) {
  const { result, wrote } = await submit({ email: value, inputs: QUERY });
  ok(
    `${accepted ? 'accepts' : 'rejects'} ${JSON.stringify(value)}`,
    accepted ? result.ok === true && wrote === 1 : result.ok === false && wrote === 0,
    `ok=${result.ok} wrote=${wrote}`,
  );
}
{
  const { result } = await submit({ email: 'bad', inputs: QUERY });
  ok('the rejection message is something a person can act on', result.ok === false && /valid email/i.test(result.error), JSON.stringify(result));
}
{
  const { data } = await submit({ email: '  Rishabh.Garg@Example.CO.IN  ', inputs: QUERY });
  ok('the address is trimmed and lower-cased before storage', data.email === 'rishabh.garg@example.co.in', data.email);
}
{
  // A literal NUL, written as an escape. Typed as a raw byte it makes git
  // treat this whole file as binary, so it stops producing diffs.
  const { data } = await submit({ email: 'a\u0000b@domain.com', inputs: QUERY });
  ok('control characters are stripped from the address', data.email === 'ab@domain.com', JSON.stringify(data.email));
}

/* --- what is stored ------------------------------------------------------- */
{
  const { data, args } = await submit({ email: 'lead@company.com', inputs: QUERY });
  ok('it writes to tool-leads, not enquiries', args.collection === 'tool-leads', args.collection);
  ok('it overrides access', args.overrideAccess === true, String(args.overrideAccess));
  ok('the tool is recorded', data.tool === 'bi-automation-calculator', data.tool);
  ok('it arrives as new', data.status === 'new', data.status);
  ok('the share URL is on the canonical host', data.shareUrl.startsWith(`${CANONICAL_URL}/tools/bi-automation-calculator/?`), data.shareUrl);
  ok('the share URL carries the exact query', data.shareUrl.endsWith(`?${QUERY}`), data.shareUrl);

  // The stored summary must be what the model says, not what a form field claims.
  const r = calculate(normalise(decodeInputs(QUERY)));
  ok('the stored summary quotes the model’s labour cost', data.summary.includes(formatCurrency(r.labourCost)), data.summary);
  ok('...its total', data.summary.includes(formatCurrency(r.totalKnownCost)), data.summary);
  ok('...its annual saving', data.summary.includes(formatCurrency(r.annualSaving)), data.summary);
  ok('...and the payback in months', data.summary.includes(`${Math.round(r.paybackMonths)} months`), data.summary);
}

/* --- the part that matters: form fields are not trusted -------------------- */
{
  // A hostile client posts its own figures alongside the real query.
  const { data } = await submit({
    email: 'liar@company.com',
    inputs: QUERY,
    summary: 'Annual saving: Rs 9,99,99,999',
    annualSaving: '99999999',
    labourCost: '99999999',
    shareUrl: 'https://evil.example/phish',
  });
  const r = calculate(normalise(decodeInputs(QUERY)));
  ok('a posted summary is ignored', !data.summary.includes('9,99,99,999'), data.summary);
  ok('a posted shareUrl is ignored', !data.shareUrl.includes('evil.example'), data.shareUrl);
  ok('the summary is recalculated from the query', data.summary.includes(formatCurrency(r.annualSaving)), data.summary);
}
{
  // Changing the query changes the stored figures, which proves the summary is
  // derived rather than copied from anywhere.
  const other = encodeInputs(normalise({ ...INPUTS, people: 50 }));
  const a = (await submit({ email: 'a@company.com', inputs: QUERY })).data.summary;
  const b = (await submit({ email: 'b@company.com', inputs: other })).data.summary;
  ok('ten times the people gives a different summary', a !== b);
  ok('and the bigger one is the bigger number',
    calculate(normalise(decodeInputs(other))).labourCost > calculate(normalise(decodeInputs(QUERY))).labourCost);
}

/* --- broken and hostile input --------------------------------------------- */
/*
 * The rule these all share: an unreadable link costs the summary, never the
 * lead — and it must never be dressed up as a real answer. normalise() fills
 * missing fields with empty values, so a junk query would otherwise be stored
 * as "1 people x 0 hrs/week at Rs 0/hr ... Recovered a year: Rs 0", which reads
 * in the admin exactly like a visitor who typed zeros. Fabricated figures with
 * a real email beside them are worse than no figures.
 */
for (const [name, q] of [
  ['an empty query', ''],
  ['junk', 'not=a&real=query'],
  ['a truncated query', QUERY.slice(0, 12)],
  ['percent-encoding rubbish', '%%%%'],
  ['a very long query', 'x'.repeat(5000)],
  ['people but no rate', 'p=5'],
  ['hours but no people', 'h=10&c=1000'],
  ['zeroes for the required fields', encodeInputs(normalise({ people: 0, hoursPerWeek: 0, hourlyCost: 0 }))],
]) {
  const { result, wrote, data } = await submit({ email: 'lead@company.com', inputs: q });
  ok(`${name}: the lead is still saved`, result.ok === true && wrote === 1, `ok=${result.ok} wrote=${wrote}`);
  ok(`${name}: the summary says it could not be read`, /could not read/i.test(data.summary), JSON.stringify(data.summary));
  ok(`${name}: no invented figure is stored`, !/Recovered a year/.test(data.summary), JSON.stringify(data.summary));
  ok(`${name}: and no share link is stored`, data.shareUrl === '', JSON.stringify(data.shareUrl));
}
{
  // A complete query is not caught by that guard.
  const { data } = await submit({ email: 'lead@company.com', inputs: QUERY });
  ok('a complete query still produces a real summary', /Recovered a year/.test(data.summary), data.summary);
}
{
  const { data } = await submit({ email: 'lead@company.com', inputs: 'x'.repeat(5000) });
  ok('an oversized query is capped before storage', data.shareUrl.length < 700, String(data.shareUrl.length));
}
{
  const { result, wrote, data } = await submit({ email: 'lead@company.com' });
  ok('a missing inputs field is survivable', result.ok === true && wrote === 1);
  ok('and is not passed off as a result', /could not read/i.test(data.summary), JSON.stringify(data.summary));
}

/* --- the database being down must not cost the visitor their download ------ */
{
  const quiet = console.error;
  console.error = () => {};
  const { result, wrote } = await submit({ email: 'lead@company.com', inputs: QUERY }, { failDb: true });
  console.error = quiet;
  ok('a failed save still reports success', result.ok === true, JSON.stringify(result));
  ok('and really did not write', wrote === 0);
}
{
  // ...but a bad address is still refused when the database is down, otherwise
  // the failure path becomes a way to skip validation entirely.
  const { result } = await submit({ email: 'nonsense', inputs: QUERY }, { failDb: true });
  ok('a bad address is refused even then', result.ok === false);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
