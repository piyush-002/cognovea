/**
 * Core Web Vitals, measured on a real render rather than argued about.
 *
 * Every other performance change in this project so far has been reasoned
 * from first principles: self-host the fonts, lazy-load below the fold, keep
 * the bundle small. All sensible, none of it measured. This renders a real
 * page in a real browser at a real viewport and reports what the browser
 * actually experiences.
 *
 * What it cannot do: reach the dev server or production. It renders the
 * server components directly with the real stylesheet, which covers markup,
 * CSS, layout and images — and excludes the client bundle, hydration and
 * network latency. So treat CLS and layout as authoritative here, and LCP as
 * a floor: the real number can only be worse.
 *
 *   node tools/test-vitals.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { requirePlaywright } from './lib/playwright.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);

let ts, React, renderToStaticMarkup;
try {
  ts = require('typescript');
  React = require('react');
  ({ renderToStaticMarkup } = require('react-dom/server'));
} catch {
  console.log('SKIP  typescript/react are not installed here.');
  process.exit(0);
}

const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');
const compile = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;

const FILES = {
  '@/lib/playbooks': 'src/lib/playbooks/index.ts',
  '@/lib/playbooks/sources': 'src/lib/playbooks/sources.ts',
  './sources': 'src/lib/playbooks/sources.ts',
  '@/lib/site': 'src/lib/site.ts',
  './site': 'src/lib/site.ts',
  '@/lib/host-redirect.mjs': 'src/lib/host-redirect.mjs',
  './host-redirect.mjs': 'src/lib/host-redirect.mjs',
  '@/lib/seo': 'src/lib/seo.ts',
  '@/lib/schema': 'src/lib/schema.ts',
  '@/components/Bits': 'src/components/Bits.tsx',
  '@/app/playbook': 'src/app/(frontend)/playbooks/[slug]/page.tsx',
};
const ALIAS = { './sources': '@/lib/playbooks/sources', './site': '@/lib/site', './host-redirect.mjs': '@/lib/host-redirect.mjs' };
const Faq = ({ items }) =>
  React.createElement('div', { className: 'acc' },
    items.map((it) => React.createElement('div', { key: it.q, className: 'acc__item' },
      React.createElement('h3', { style: { margin: 0 } },
        React.createElement('button', { type: 'button', className: 'acc__btn' }, it.q)),
      React.createElement('div', { className: 'acc__panel' },
        React.createElement('div', null, React.createElement('p', null, it.a))))));

const cache = {};
const load = (spec) => {
  const key = ALIAS[spec] || spec;
  if (key in cache) return cache[key];
  if (key === 'react') return (cache[key] = React);
  if (key === 'react/jsx-runtime') return (cache[key] = require('react/jsx-runtime'));
  if (key === 'next/link') return (cache[key] = { __esModule: true, default: ({ href, children, ...r }) => React.createElement('a', { href, ...r }, children) });
  if (key === 'next/image') return (cache[key] = { __esModule: true, default: (p) => React.createElement('img', p) });
  if (key === 'next/navigation') return (cache[key] = { notFound: () => { throw new Error('notFound'); } });
  if (key === '@/components/JsonLd') return (cache[key] = { __esModule: true, default: () => null });
  if (key === '@/components/Faq') return (cache[key] = { __esModule: true, default: Faq });
  if (key === '@/components/Mark') return (cache[key] = { __esModule: true, default: () => null });
  if (key === '@/lib/mark-dots') return (cache[key] = { BANDS: 8, DOTS: [] });
  if (key === '@/lib/content') return (cache[key] = {});
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const m = { exports: {} };
  cache[key] = m.exports;
  new Function('exports', 'require', 'module', compile(FILES[key]))(m.exports, load, m);
  return (cache[key] = m.exports);
};

const Playbook = load('@/app/playbook').default;
const slug = load('@/lib/playbooks').publishedPlaybooks()[0].slug;
const body = renderToStaticMarkup(await Playbook({ params: Promise.resolve({ slug }) }));

/* The reveal system starts .rv elements at opacity 0 and a client component
   reveals them. Without that script nothing below the fold is ever painted,
   so LCP would be measured against a half-blank page. This mirrors what
   Reveal.tsx does, at the same moment hydration would do it. */
const page = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}</style>
<script>
  window.__lcp = 0; window.__cls = 0; window.__shifts = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = e.element ? (e.element.className || e.element.tagName) : 'unknown'; } })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) {
        window.__cls += e.value;
        window.__shifts.push({ value: +e.value.toFixed(4), sources: (e.sources || []).map(s => s.node && s.node.className).filter(Boolean).slice(0, 2) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (err) { window.__obsError = String(err); }
</script>
</head><body>${body}
<script>
  addEventListener('load', () => {
    document.documentElement.classList.add('rv-ready');
    document.querySelectorAll('.rv').forEach(n => n.setAttribute('data-rv','in'));
  });
</script>
</body></html>`;

const { chromium, launchOpts } = await requirePlaywright('test-vitals');
const browser = await chromium.launch(launchOpts);

async function measure(label, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 500 ? 3 : 2 });
  const page_ = await ctx.newPage();
  await page_.setContent(page, { waitUntil: 'load' });
  await page_.waitForTimeout(1600);
  // Scroll the page, which is when a reveal-animated site does its shifting.
  await page_.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60));
    }
  });
  await page_.waitForTimeout(600);
  const r = await page_.evaluate(() => ({
    lcp: Math.round(window.__lcp || 0),
    cls: +(window.__cls || 0).toFixed(4),
    shifts: window.__shifts.sort((a, b) => b.value - a.value).slice(0, 3),
    lcpEl: window.__lcpEl || 'unknown',
    obsError: window.__obsError || null,
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  await ctx.close();
  return { label, ...r };
}

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

console.log(`\nMeasured on /playbooks/${slug}, markup + CSS only (no client bundle).\n`);
for (const [label, vp] of [['phone  390x844', { width: 390, height: 844 }], ['desktop 1440x900', { width: 1440, height: 900 }]]) {
  const r = await measure(label, vp);
  console.log(`  ${label}   LCP ${String(r.lcp).padStart(5)}ms   CLS ${r.cls.toFixed(4)}   LCP element: ${String(r.lcpEl).slice(0, 46)}`);
  if (r.shifts.length) for (const s of r.shifts) console.log(`      shift ${s.value}  ${s.sources.join(', ') || '(unattributed)'}`);
  ok(`${label}: CLS is within the "good" threshold (<0.10)`, r.cls < 0.1, `CLS ${r.cls}`);
  ok(`${label}: nothing pushes the page sideways`, !r.sideways);
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
