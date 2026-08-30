/**
 * The gated one-pager must actually be one page.
 *
 * "One-page summary" is a promise printed on the button. A document that runs
 * to two pages — with a lone bar chart or a dangling assumptions list on the
 * second — is the sort of thing a finance lead notices before they notice
 * anything else on it, and this is the artefact that goes out under the firm's
 * name with a stranger's figures on it.
 *
 * The page count is read out of the PDF itself, not inferred. An earlier
 * version of this check measured the body's scroll height and called the
 * difference "slack", which reported comfortable headroom on a document that
 * was printing on two pages. Chromium paginates; a height in CSS pixels does
 * not. So: print to a real PDF, count the /Type /Page objects in it.
 *
 * The real server component is rendered — not a fixture of it. The mock-up this
 * layout was signed off from was standalone HTML, and standalone HTML cannot
 * tell you that the component grew a row since.
 *
 *   node tools/test-summary-print.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { requirePlaywright } from './lib/playwright.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const require = createRequire(import.meta.url);

let ts;
let React;
let renderToStaticMarkup;
try {
  ts = require('typescript');
  React = require('react');
  ({ renderToStaticMarkup } = require('react-dom/server'));
} catch {
  console.log('SKIP  typescript/react are not installed here. Run `npm install` first.');
  process.exit(0);
}

const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');

const compile = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: rel.replace(/\.mjs$/, '.ts'),
  }).outputText;

const FILES = {
  '@/lib/calculator/assumptions': 'src/lib/calculator/assumptions.ts',
  '@/lib/calculator/model': 'src/lib/calculator/model.ts',
  '@/lib/calculator/url-state': 'src/lib/calculator/url-state.ts',
  '@/app/summary': 'src/app/(frontend)/tools/bi-automation-calculator/summary/page.tsx',
  // Stubbed to always allow; the limiter has its own suite.
  '@/lib/rate-limit': 'tools/stubs/rate-limit.ts',
  './assumptions': 'src/lib/calculator/assumptions.ts',
  './model': 'src/lib/calculator/model.ts',
  './url-state': 'src/lib/calculator/url-state.ts',
};
const CANONICAL_KEY = {
  './assumptions': '@/lib/calculator/assumptions',
  './model': '@/lib/calculator/model',
  './url-state': '@/lib/calculator/url-state',
};

const cache = {};
function load(spec) {
  const key = CANONICAL_KEY[spec] || spec;
  if (key in cache) return cache[key];
  // PrintTrigger only calls window.print(); in a static render it is nothing.
  // __esModule matters: without it TypeScript's __importDefault helper wraps
  // the object again and `PrintTrigger.default` comes back as the module.
  if (key === '@/components/calculator/PrintTrigger') {
    return (cache[key] = { __esModule: true, default: () => null });
  }
  if (key === 'react') return (cache[key] = React);
  if (key === 'react/jsx-runtime') return (cache[key] = require('react/jsx-runtime'));
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const module = { exports: {} };
  cache[key] = module.exports;
  new Function('exports', 'require', 'module', compile(FILES[key]))(module.exports, load, module);
  return (cache[key] = module.exports);
}

const SummaryPage = load('@/app/summary').default;
const { encodeInputs, decodeInputs } = load('@/lib/calculator/url-state');
const { normalise } = load('@/lib/calculator/model');
const { INDUSTRIES } = load('@/lib/calculator/assumptions');

const { chromium, launchOpts } = await requirePlaywright('test-summary-print');
const browser = await chromium.launch(launchOpts);

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

/** Render the real component for a query and wrap it in the real stylesheet. */
async function render(query) {
  const params = {};
  for (const [k, v] of new URLSearchParams(query)) params[k] = v;
  const element = await SummaryPage({ searchParams: Promise.resolve(params) });
  const body = renderToStaticMarkup(element);
  // `body` is kept apart from `page`: the stylesheet is inlined, so asking
  // whether the whole document "contains .sheet__brand" is answered by the CSS
  // rather than by the markup, and the check passes on a page that never
  // rendered the element.
  return {
    body,
    page: `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`,
  };
}

/**
 * Print to PDF and count the pages inside the file.
 *
 * A PDF's page tree names its leaves `/Type /Page` (never `/Pages`, which is
 * the node). Counting those on the raw bytes is crude but it is the document
 * itself talking, which is the whole point.
 */
async function pdfPages(html) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const buf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.close();
  const bytes = buf.toString('latin1');
  const count = (bytes.match(/\/Type\s*\/Page(?![s])/g) || []).length;
  return { count, bytes: buf.length };
}

/** A complete input set with the given overrides. */
const q = (over = {}) =>
  encodeInputs(
    normalise({
      industry: 'manufacturing',
      people: 5,
      hoursPerWeek: 10,
      hourlyCost: 1600,
      reportsPerMonth: 12,
      decisionLagDays: 3,
      timeReduction: 0.6,
      ...over,
    }),
  );

/* --- the count itself, on the cases that make the page longest ------------ */

const variants = [
  ['a plain result', q()],
  ['delay priced, so a third bar appears', q({ costPerDayOfDelay: 25000 })],
  ['an investment, so payback appears', q({ investment: 750000 })],
  ['both, the longest version of the sheet', q({ costPerDayOfDelay: 25000, investment: 750000 })],
  // The industry label sits in the header; the longest one is the widest header.
  [
    'the longest industry label',
    q({
      industry: [...INDUSTRIES].sort((a, b) => b.label.length - a.label.length)[0].id,
      costPerDayOfDelay: 25000,
      investment: 750000,
    }),
  ],
  // Big numbers are wider numbers, and width becomes height when things wrap.
  ['the largest figures the model allows', q({ people: 5000, hoursPerWeek: 40, hourlyCost: 100000, reportsPerMonth: 500, decisionLagDays: 60, costPerDayOfDelay: 10000000, investment: 100000000 })],
  ['the smallest real figures', q({ people: 1, hoursPerWeek: 1, hourlyCost: 1, reportsPerMonth: 1, decisionLagDays: 1 })],
  ['almost no time removed', q({ timeReduction: 0.2, costPerDayOfDelay: 25000, investment: 750000 })],
  ['almost all time removed', q({ timeReduction: 0.95, costPerDayOfDelay: 25000, investment: 750000 })],
];

for (const [name, query] of variants) {
  const { count } = await pdfPages((await render(query)).page);
  ok(`${name}: prints on exactly one page`, count === 1, `printed ${count} pages`);
}

/* --- the figures on the sheet are the ones in the link -------------------- */
{
  const query = q({ costPerDayOfDelay: 25000, investment: 750000 });
  const { body: html } = await render(query);
  const model = load('@/lib/calculator/model');
  const r = model.calculate(normalise(decodeInputs(query)));
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&#x20B9;|&nbsp;/g, ' ');
  const has = (s) => text.includes(s);
  ok('the headline is the model’s total', has(model.formatCurrency(r.totalKnownCost)), model.formatCurrency(r.totalKnownCost));
  ok('the annual saving is the model’s', has(model.formatCurrency(r.annualSaving)));
  ok('the labour line is the model’s', has(model.formatCurrency(r.labourCost)));
  ok('the delay line is priced when a day rate was given', has(model.formatCurrency(r.delayCost)));
  ok('the hours are the model’s', has(model.formatHours(r.hoursPerYear)));
  ok('the published error rate is cited on the page', /0\.87\s*%|0\.87%/.test(text), 'no citation found');
  ok('nothing rendered as NaN', !/NaN/.test(html));
  ok('nothing rendered as undefined', !/undefined/.test(html));
}

/* --- an empty link must not become a branded document --------------------- */
for (const [name, query] of [
  ['no query at all', ''],
  ['junk', 'not=a&real=query'],
  ['hours and rate but no head-count', 'h=10&c=1600'],
  ['zeroes', 'p=0&h=0&c=0'],
]) {
  const { body: html } = await render(query);
  const text = html.replace(/<[^>]+>/g, ' ');
  ok(`${name}: says the link has no figures`, /no figures in it/i.test(text), text.slice(0, 160));
  ok(`${name}: prints no headline number`, !/Costing you now/i.test(text));
  ok(`${name}: is not dressed as letterhead`, !html.includes('sheet__brand'));
  ok(`${name}: offers the way back`, html.includes('/tools/bi-automation-calculator/'));
}

/* --- the printed geometry, measured rather than read off the stylesheet ----- */
{
  /*
   * This block exists because the previous version of it was useless.
   *
   * It regexed globals.css for `.sheet { ... padding: 24mm }` and passed — while
   * an @media print rule further down reset that padding to 0 and removed the
   * width cap, so the live document printed edge to edge with its right-hand
   * column cut off the page. The page count stayed at 1 throughout, because
   * horizontal overflow does not add pages; it just loses the text.
   *
   * Reading the stylesheet tells you what somebody wrote. Only the computed
   * layout tells you what the browser did with it. So: emulate print media,
   * size the viewport to A4, and measure.
   */
  const A4_WIDTH_PX = 794;   // 210mm at 96dpi
  const A4_HEIGHT_PX = 1123; // 297mm

  const page = await browser.newPage({ viewport: { width: A4_WIDTH_PX, height: A4_HEIGHT_PX } });
  await page.emulateMedia({ media: 'print' });
  await page.setContent((await render(q({ costPerDayOfDelay: 25000, investment: 750000 }))).page, {
    waitUntil: 'load',
  });

  const m = await page.evaluate((pageWidth) => {
    const sheet = document.querySelector('.sheet');
    const cs = getComputedStyle(sheet);
    const box = sheet.getBoundingClientRect();

    // The furthest right any descendant reaches. This is the number that decides
    // whether text is cut off the page.
    let right = 0;
    let left = Infinity;
    let widest = null;
    for (const el of document.querySelectorAll('.sheet *')) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0) continue;
      if (r.right > right) { right = r.right; widest = el.className || el.tagName; }
      if (r.left < left) left = r.left;
    }
    return {
      padTop: parseFloat(cs.paddingTop),
      padLeft: parseFloat(cs.paddingLeft),
      sheetHeight: box.height,
      contentLeft: left,
      contentRight: right,
      widest: String(widest),
      docScrollWidth: document.documentElement.scrollWidth,
      pageWidth,
    };
  }, A4_WIDTH_PX);
  await page.close();

  /*
   * The sheet box is the full page width now, so its own left edge sits at 0 —
   * measuring the box would prove nothing. What matters is where the ink lands,
   * so these measure the extents of the content inside it. 12mm and 15mm at
   * 96dpi are about 45px and 57px; the assertions are loose because the claim
   * is "there is a real margin", not a subpixel value.
   */
  ok('the sheet keeps its block padding when printing', m.padTop > 35, `${m.padTop}px`);
  ok('and its inline padding', m.padLeft > 45, `${m.padLeft}px`);
  ok('no content reaches the left edge of the page', m.contentLeft >= 40, `nearest content at ${m.contentLeft.toFixed(1)}px`);
  ok('no content reaches the right edge of the page',
    m.contentRight <= m.pageWidth - 40,
    `widest element (${m.widest}) reaches ${m.contentRight.toFixed(1)}px of ${m.pageWidth}px`);
  ok('the document does not scroll sideways when printing',
    m.docScrollWidth <= m.pageWidth + 1, `scrollWidth ${m.docScrollWidth} vs page ${m.pageWidth}`);
  ok('and it still fits the height of one sheet',
    m.sheetHeight <= A4_HEIGHT_PX, `${m.sheetHeight.toFixed(0)}px of ${A4_HEIGHT_PX}px`);
}

/* --- and the @page rule still suppresses the browser's own header ---------- */
{
  // Chrome draws the document title and URL in the page margins, and omits them
  // only when there is no margin to draw them in.
  const rule = /@page\s*\{[^}]*\}/.exec(css);
  ok('the stylesheet has an @page rule', rule !== null);
  const margin = rule && /margin:\s*([^;}]+)/.exec(rule[0]);
  ok('and its margin is zero, so no browser header is drawn',
    margin !== null && /^0[a-z]*$/.test(margin[1].trim()), margin ? margin[1].trim() : 'none declared');
}

/* --- and the sheet is not indexable --------------------------------------- */
{
  const mod = load('@/app/summary');
  ok('the summary route is noindex', mod.metadata?.robots?.index === false, JSON.stringify(mod.metadata?.robots));
  ok('...and nofollow', mod.metadata?.robots?.follow === false);
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
