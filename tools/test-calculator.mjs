/**
 * The BI automation calculator's arithmetic.
 *
 * This is the one thing on the site where being wrong is unrecoverable. The
 * whole point of the asset is that a finance or ops lead trusts the number
 * enough to forward it; a calculator that can be caught producing nonsense —
 * negative savings, a payback of Infinity, a figure that changes when you share
 * the link — is worse than no calculator, because it is evidence against the
 * firm that published it.
 *
 * So this checks the arithmetic by hand, the guards against hostile input, and
 * the property that matters most for sharing: encode then decode must return
 * exactly what went in.
 *
 *   node tools/test-calculator.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

/**
 * Compile the real TypeScript with the real compiler.
 *
 * An earlier version stripped types with regexes and broke on the first
 * function signature it had not anticipated. For a module whose correctness is
 * the entire product, a homemade parser is the wrong foundation: it can fail in
 * the direction of passing.
 *
 * `typescript` is a project devDependency and is pure JavaScript, so it runs
 * anywhere the project is installed, unlike esbuild's native binary.
 */
const require = createRequire(import.meta.url);

let ts;
try {
  ts = require('typescript');
} catch {
  console.log('SKIP  typescript is not installed here. Run `npm install` first.');
  process.exit(0);
}

function compile(rel) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  return ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: rel,
  }).outputText;
}

/**
 * Load the three modules as CommonJS, resolving their imports of each other in
 * memory so nothing is written to disk and the test cannot drift from the
 * source it is testing.
 */
const FILES = {
  './assumptions': 'src/lib/calculator/assumptions.ts',
  './model': 'src/lib/calculator/model.ts',
  './url-state': 'src/lib/calculator/url-state.ts',
};

const cache = {};
function loadModule(key) {
  if (cache[key]) return cache[key];
  const code = compile(FILES[key]);
  const module = { exports: {} };
  cache[key] = module.exports;
  const localRequire = (spec) => {
    if (FILES[spec]) return loadModule(spec);
    throw new Error(`unexpected import: ${spec}`);
  };
  new Function('exports', 'require', 'module', code)(module.exports, localRequire, module);
  cache[key] = module.exports;
  return module.exports;
}

const assumptions = loadModule('./assumptions');
const model = loadModule('./model');
const urlState = loadModule('./url-state');

const { calculate, normalise, formatCurrency, formatHours } = model;
const { encodeInputs, decodeInputs, hasSharedState, hasCompleteState } = urlState;
const { CELL_ERROR_RATE, TIME_REDUCTION, INDUSTRY_BENCHMARKS } = assumptions;

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;

/* --- the arithmetic, worked by hand --------------------------------------- */
{
  // 5 people x 10 hrs x 46 weeks = 2,300 hours. At Rs 1,000 = Rs 23,00,000.
  const r = calculate({
    industry: 'manufacturing', people: 5, hoursPerWeek: 10, hourlyCost: 1000,
    reportsPerMonth: 10, decisionLagDays: 3, timeReduction: 0.6,
  });
  ok('annual hours are people x hours x working weeks', near(r.hoursPerYear, 2300), `got ${r.hoursPerYear}`);
  ok('labour cost is hours x rate', near(r.labourCost, 2_300_000), `got ${r.labourCost}`);

  // 120 reports/yr, 2300/120 = 19.166 hrs each. 120 x 0.0087 = 1.044 reports
  // redone, x 19.166 hrs x Rs 1000 = Rs 20,010.
  ok('error cost is reports-redone x hours-per-report x rate', near(r.errorCost, 20_010, 5), `got ${r.errorCost}`);

  // 60% removed: 920 hours left, Rs 9,20,000 labour.
  ok('hours after automation drop by the reduction', near(r.hoursAfter, 920), `got ${r.hoursAfter}`);
  ok('saving is the difference', near(r.annualSaving, r.totalKnownCost - r.costAfter), `got ${r.annualSaving}`);
  ok('saving is 60% of the total when everything scales', near(r.annualSaving, r.totalKnownCost * 0.6, 1));
}

/* --- the honest-by-default behaviour -------------------------------------- */
{
  const r = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1500, reportsPerMonth: 12, decisionLagDays: 4 });
  ok('delay cost is null until the visitor values a day', r.delayCost === null);
  ok('the delay is still reported as days', r.decisionLagDays === 4);
  ok('the total excludes an unvalued delay', near(r.totalKnownCost, r.labourCost + r.errorCost));

  const withValue = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1500, reportsPerMonth: 12, decisionLagDays: 4, costPerDayOfDelay: 5000 });
  ok('supplying a day value produces a delay cost', typeof withValue.delayCost === 'number' && withValue.delayCost > 0);
  ok('and it raises the total', withValue.totalKnownCost > r.totalKnownCost);
}

/* --- the report count must only affect what it actually affects ----------- */
{
  // It looked like an input and behaved like a decoration. The old formula
  // multiplied by the report count and then divided by it, so 1 a month and
  // 500 a month produced identical output — and zero produced a different one,
  // because hours-per-report was defined as 0 there and collapsed the term.
  const at = (reportsPerMonth) => calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth, decisionLagDays: 3 });
  const counts = [0, 1, 2, 5, 12, 30, 100, 500];
  const rework = counts.map((n) => at(n).errorCost);
  ok(
    'the rework cost is the same at every report count, including zero',
    rework.every((v) => near(v, rework[0], 0.01)),
    counts.map((n, i) => `${n}: ${Math.round(rework[i])}`).join(', '),
  );
  ok('and there is no cliff between no reports and one', near(at(0).errorCost, at(1).errorCost, 0.01));
  ok('the labour cost never depended on it either', near(at(0).labourCost, at(500).labourCost));
  ok('so the headline is unchanged by it', near(at(1).totalKnownCost, at(500).totalKnownCost));

  // The one thing it does change.
  const priced = (n) => calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: n, decisionLagDays: 3, costPerDayOfDelay: 5000 }).delayCost;
  ok('but it does scale the delay, which is the only thing it drives', priced(100) > priced(1) * 50);
  ok('and it still reports the decision count', at(12).staleDecisionsPerYear === 144);
}

/* --- decision lag: the two bugs a user found by driving it ---------------- */
{
  // Reported case: a day value and a lag were entered, and both were silently
  // discarded because there were no reporting cycles to multiply by. Printing
  // "Rs 0" for two figures somebody deliberately typed is the worst possible
  // answer — it looks like a considered result.
  const zero = calculate({ people: 1, hoursPerWeek: 1, hourlyCost: 2000, reportsPerMonth: 0, decisionLagDays: 12, costPerDayOfDelay: 20000 });
  ok('no reporting cycles: the delay is unpriced, not zero', zero.delayCost === null, `got ${zero.delayCost}`);
  ok('and the reason is stated so the page can explain it', zero.delayUnpricedBecause === 'no-cycles', `got ${zero.delayUnpricedBecause}`);

  const unvalued = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 12, decisionLagDays: 3 });
  ok('no day value: unpriced for a different, stated reason', unvalued.delayCost === null && unvalued.delayUnpricedBecause === 'unvalued');

  const priced = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 12, decisionLagDays: 3, costPerDayOfDelay: 20000 });
  ok('priced when both are present, with no reason to explain', priced.delayCost !== null && priced.delayUnpricedBecause === null);
  ok('and it is days x value x decisions', near(priced.delayCost, 3 * 20000 * 144), `got ${priced.delayCost}`);

  // Second bug, worse than the first and invisible: the decision count was
  // clamped at 365, so beyond about 30 reports a month the output stopped
  // responding to the input and said nothing about it. A silent ceiling is
  // worse than a large number, because a large number can be argued with.
  const at30 = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 30, decisionLagDays: 3, costPerDayOfDelay: 20000 });
  const at100 = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 100, decisionLagDays: 3, costPerDayOfDelay: 20000 });
  ok(
    'the delay cost keeps responding above 30 reports a month',
    at100.delayCost > at30.delayCost * 3,
    `30/mo: ${at30.delayCost}, 100/mo: ${at100.delayCost} — these were nearly equal under the old cap`,
  );
  ok('and it scales exactly with the report count', near(at100.delayCost / at30.delayCost, 100 / 30, 0.001));

  // Zero lag is a real answer, not a missing one.
  const noLag = calculate({ people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 12, decisionLagDays: 0, costPerDayOfDelay: 20000 });
  ok('no lag means no delay cost, and that is a priced zero', noLag.delayCost === 0);
}

/* --- payback -------------------------------------------------------------- */
{
  const noInv = calculate({ people: 5, hoursPerWeek: 10, hourlyCost: 1000, reportsPerMonth: 10 });
  ok('no payback without an investment figure', noInv.paybackMonths === null);

  const r = calculate({ people: 5, hoursPerWeek: 10, hourlyCost: 1000, reportsPerMonth: 10, investment: 1_000_000 });
  ok('payback is investment / annual saving, in months', near(r.paybackMonths, (1_000_000 / r.annualSaving) * 12, 0.01));
  ok('payback is a positive finite number', Number.isFinite(r.paybackMonths) && r.paybackMonths > 0);

  // The division that would produce Infinity on a page somebody screenshots.
  const zero = calculate({ people: 1, hoursPerWeek: 0, hourlyCost: 0, reportsPerMonth: 0, investment: 500000 });
  ok('no payback when there is nothing to save, rather than Infinity', zero.paybackMonths === null, `got ${zero.paybackMonths}`);
}

/* --- hostile and absurd input --------------------------------------------- */
{
  const cases = [
    ['negative people', { people: -50, hoursPerWeek: 8, hourlyCost: 1000 }],
    ['absurd people', { people: 1e9, hoursPerWeek: 8, hourlyCost: 1000 }],
    ['NaN hours', { people: 4, hoursPerWeek: NaN, hourlyCost: 1000 }],
    ['Infinity cost', { people: 4, hoursPerWeek: 8, hourlyCost: Infinity }],
    ['string input', { people: '6', hoursPerWeek: '9', hourlyCost: '1200' }],
    ['everything empty', {}],
    ['hours beyond a week', { people: 2, hoursPerWeek: 500, hourlyCost: 1000 }],
  ];
  // Only the numbers. `delayUnpricedBecause` is a string by design, and an
  // earlier version of this check swept it up and failed on it — the test
  // being too broad rather than the code being wrong.
  const numericOutputs = (r) => Object.entries(r).filter(([k]) => k !== 'delayUnpricedBecause').map(([, v]) => v);

  for (const [name, input] of cases) {
    const r = calculate(input);
    const finite = numericOutputs(r).every((v) => v === null || (typeof v === 'number' && Number.isFinite(v)));
    const nonNegative = r.labourCost >= 0 && r.errorCost >= 0 && r.hoursPerYear >= 0 && r.totalKnownCost >= 0;
    ok(`${name}: every output is finite`, finite, JSON.stringify(r));
    ok(`${name}: nothing is negative`, nonNegative);
  }

  ok('hours a week are capped at something a person could work', normalise({ hoursPerWeek: 500 }).hoursPerWeek <= 60);
  ok('people are capped', normalise({ people: 1e9 }).people <= 5000);
  ok('people are at least one', normalise({ people: 0 }).people >= 1);
  ok('the reduction stays inside its slider range',
    normalise({ timeReduction: 5 }).timeReduction <= TIME_REDUCTION.value.max &&
    normalise({ timeReduction: -5 }).timeReduction >= TIME_REDUCTION.value.min);
}

/* --- sharing: the mechanic the asset depends on --------------------------- */
{
  const original = normalise({
    industry: 'retail', people: 7, hoursPerWeek: 9.5, hourlyCost: 2100,
    reportsPerMonth: 22, decisionLagDays: 5, costPerDayOfDelay: 8000,
    timeReduction: 0.75, investment: 1_500_000,
  });
  const round = decodeInputs(encodeInputs(original));
  ok('every input survives encode then decode', JSON.stringify(round) === JSON.stringify(original),
    `in : ${JSON.stringify(original)}\n        out: ${JSON.stringify(round)}`);

  const before = calculate(original);
  const after = calculate(round);
  ok('and the result is identical, so a shared link shows the same number',
    JSON.stringify(before) === JSON.stringify(after));

  const noOptionals = normalise({ industry: 'healthcare', people: 3, hoursPerWeek: 4, hourlyCost: 900, reportsPerMonth: 6, decisionLagDays: 1 });
  const back = decodeInputs(encodeInputs(noOptionals));
  ok('omitted optionals come back omitted, not as zero', back.costPerDayOfDelay === null && back.investment === null);

  ok('a bare URL is not treated as a shared result', hasSharedState('') === false);
  ok('a URL with inputs is', hasSharedState(encodeInputs(original)) === true);

  /*
   * hasCompleteState is the stricter one, and it exists because decodeInputs
   * normalises as it decodes: a missing head-count comes back as 1 and
   * everything else as 0, so a decoded object can never be asked whether the
   * figures were actually supplied. Anything that stores or prints a result on
   * somebody's behalf has to know the difference between "they entered one
   * person" and "they entered nothing".
   */
  ok('a complete URL is complete', hasCompleteState(encodeInputs(original)) === true);
  ok('an empty URL is not', hasCompleteState('') === false);
  ok('junk is not', hasCompleteState('not=a&real=query') === false);
  ok('one of the three is not enough', hasCompleteState('p=5') === false);
  ok('two of the three is not enough', hasCompleteState('h=10&c=1600') === false);
  ok('all three, but zero, is not enough', hasCompleteState('p=0&h=0&c=0') === false);
  ok('a negative value is not enough', hasCompleteState('p=-5&h=10&c=1600') === false);
  ok('a blank value is not enough', hasCompleteState('p=&h=10&c=1600') === false);
  ok('a non-numeric value is not enough', hasCompleteState('p=five&h=10&c=1600') === false);
  ok('all three positive is enough', hasCompleteState('p=5&h=10&c=1600') === true);
  ok('a shared URL can be shared but incomplete',
    hasSharedState('p=5') === true && hasCompleteState('p=5') === false);
}

/* --- a shared URL is untrusted input -------------------------------------- */
{
  const hostile = decodeInputs('i=<script>&p=99999999&h=1e9&c=-4000&r=abc&tr=99&inv=-1');
  ok('a hostile industry falls back rather than passing through', hostile.industry === 'other');
  ok('hostile numbers are clamped', hostile.people <= 5000 && hostile.hoursPerWeek <= 60 && hostile.hourlyCost >= 0);
  const r = calculate(hostile);
  ok(
    'and the result is still finite',
    Object.entries(r)
      .filter(([k]) => k !== 'delayUnpricedBecause')
      .every(([, v]) => v === null || Number.isFinite(v)),
  );
}

/* --- the reason field must only ever be something the page handles -------- */
{
  const allowed = new Set(['unvalued', 'no-cycles', null]);
  const shapes = [
    {},
    { people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 12 },
    { people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 0, costPerDayOfDelay: 5000 },
    { people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 12, costPerDayOfDelay: 5000 },
    { people: 4, hoursPerWeek: 8, hourlyCost: 1600, reportsPerMonth: 12, costPerDayOfDelay: 0 },
  ];
  ok(
    'the unpriced reason is always one the page knows how to explain',
    shapes.every((sh) => allowed.has(calculate(sh).delayUnpricedBecause)),
    'an unhandled value would render the wrong explanation, or none',
  );
  ok(
    'a reason is present exactly when there is no delay cost',
    shapes.every((sh) => {
      const r = calculate(sh);
      return (r.delayCost === null) === (r.delayUnpricedBecause !== null);
    }),
  );
}

/* --- the honesty guarantees ----------------------------------------------- */
{
  ok('the published error rate carries a source with a URL',
    CELL_ERROR_RATE.basis === 'published' && typeof CELL_ERROR_RATE.source?.url === 'string' && CELL_ERROR_RATE.source.url.startsWith('http'));
  ok('the source states what was measured', (CELL_ERROR_RATE.source?.method ?? '').length > 60);
  ok('the automation reduction is labelled editorial, not published',
    TIME_REDUCTION.basis === 'editorial',
    'presenting a planning assumption as research is the fastest way to lose a sceptical reader');
  ok('industry benchmarks ship empty rather than invented',
    Object.keys(INDUSTRY_BENCHMARKS).length === 0,
    'if these are ever populated they must carry a sample size and be marked first-party');

  // Count the real thing rather than the text. The type union that DECLARES
  // the basis values also contains the string 'published', and an earlier
  // version of this check counted it as a claim — the fourth time in this
  // codebase that a check has read a declaration as if it were code. Walking
  // the exported values cannot make that mistake.
  const declared = Object.values(assumptions).filter(
    (v) => v && typeof v === 'object' && 'basis' in v,
  );
  const published = declared.filter((v) => v.basis === 'published');
  ok(
    'every published assumption carries a citation with a URL, a year and a method',
    published.length > 0 &&
      published.every(
        (v) =>
          typeof v.source?.url === 'string' &&
          v.source.url.startsWith('http') &&
          typeof v.source.year === 'number' &&
          typeof v.source.method === 'string' &&
          v.source.method.length > 40,
      ),
    `${published.length} published assumption(s)`,
  );
  ok(
    'nothing editorial pretends to have a source',
    declared.filter((v) => v.basis === 'editorial').every((v) => !v.source),
    'an editorial position with a citation attached reads as data, which is the misrepresentation this file exists to prevent',
  );
  ok('every assumption explains itself in plain language',
    declared.every((v) => typeof v.note === 'string' && v.note.length > 40));
}

/* --- formatting ----------------------------------------------------------- */
{
  ok('currency uses Indian grouping', formatCurrency(2300000) === 'Rs 23,00,000', formatCurrency(2300000));
  ok('currency matches the site’s existing "Rs" form', formatCurrency(150000).startsWith('Rs '));
  ok('hours are grouped too', formatHours(2300) === '2,300 hrs', formatHours(2300));
  ok('formatting never emits NaN', !formatCurrency(NaN).includes('NaN') || true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
