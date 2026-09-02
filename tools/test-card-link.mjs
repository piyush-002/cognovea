/**
 * The tool cards are clickable across their whole area, and only once.
 *
 * Two ways to get this wrong, both of which look identical in a screenshot.
 * Wrapping the card in an <a> makes the link's accessible name the entire card
 * contents, so a screen reader reads a paragraph where it should read a title.
 * An onClick on the article is invisible to the keyboard and kills middle-click
 * and open-in-new-tab. The stretched-pseudo-element approach avoids both, but
 * only if the overlay actually resolves against the card — which depends on
 * .card staying position: relative and nothing in between being positioned.
 * That is a silent, CSS-level dependency, so it is asserted here by hit-testing
 * real corners rather than by reading the stylesheet.
 *
 *   node tools/test-card-link.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { requirePlaywright } from './lib/playwright.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);
let ts, React, renderToStaticMarkup;
try {
  ts = require('typescript'); React = require('react');
  ({ renderToStaticMarkup } = require('react-dom/server'));
} catch { console.log('SKIP  typescript/react not installed.'); process.exit(0); }

const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');
const compile = (rel) => ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;

const FILES = {
  '@/lib/site': 'src/lib/site.ts', './site': 'src/lib/site.ts',
  '@/lib/host-redirect.mjs': 'src/lib/host-redirect.mjs', './host-redirect.mjs': 'src/lib/host-redirect.mjs',
  '@/lib/seo': 'src/lib/seo.ts', '@/lib/schema': 'src/lib/schema.ts',
  '@/components/Bits': 'src/components/Bits.tsx',
  '@/app/tools': 'src/app/(frontend)/tools/page.tsx',
};
const ALIAS = { './site': '@/lib/site', './host-redirect.mjs': '@/lib/host-redirect.mjs' };
const cache = {};
const load = (spec) => {
  const k = ALIAS[spec] || spec;
  if (k in cache) return cache[k];
  if (k === 'react') return (cache[k] = React);
  if (k === 'react/jsx-runtime') return (cache[k] = require('react/jsx-runtime'));
  if (k === 'next/link') return (cache[k] = { __esModule: true, default: ({ href, children, ...r }) => React.createElement('a', { href, ...r }, children) });
  if (k === 'next/image') return (cache[k] = { __esModule: true, default: (p) => React.createElement('img', p) });
  if (k === '@/components/JsonLd') return (cache[k] = { __esModule: true, default: () => null });
  if (k === '@/components/Mark') return (cache[k] = { __esModule: true, default: () => null });
  if (k === '@/lib/mark-dots') return (cache[k] = { BANDS: 8, DOTS: [] });
  if (!FILES[k]) throw new Error('unexpected import: ' + k);
  const m = { exports: {} }; cache[k] = m.exports;
  new Function('exports', 'require', 'module', compile(FILES[k]))(m.exports, load, m);
  return (cache[k] = m.exports);
};

const Page = load('@/app/tools').default;
const body = renderToStaticMarkup(await Page());

let pass = 0, fail = 0;
const ok = (n, c, d = '') => { if (c) { pass++; console.log('  ok    ' + n); } else { fail++; console.log('  FAIL  ' + n + (d ? '\n        ' + d : '')); } };

const { chromium, launchOpts } = await requirePlaywright('test-card-link');
const browser = await chromium.launch(launchOpts);
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}
/* the reveal system, as it lands after hydration */
.rv{opacity:1!important;transform:none!important}</style></head><body>${body}</body></html>`, { waitUntil: 'load' });

const r = await page.evaluate(() => {
  const card = document.querySelector('.card');
  if (!card) return { error: 'no .card rendered' };
  const b = card.getBoundingClientRect();
  const inset = 6;
  const pts = {
    'top-left': [b.left + inset, b.top + inset],
    'top-right': [b.right - inset, b.top + inset],
    'bottom-left': [b.left + inset, b.bottom - inset],
    'bottom-right': [b.right - inset, b.bottom - inset],
    'dead centre': [b.left + b.width / 2, b.top + b.height / 2],
    'empty space under the blurb': [b.right - 40, b.bottom - 30],
  };
  const hits = {};
  for (const [name, [x, y]] of Object.entries(pts)) {
    const el = document.elementFromPoint(x, y);
    hits[name] = el ? (el.closest('a') ? 'link' : el.tagName.toLowerCase() + '.' + (el.className || '')) : 'nothing';
  }
  const links = [...card.querySelectorAll('a')];
  return {
    hits,
    linkCount: links.length,
    linkName: links[0] ? links[0].textContent.trim() : null,
    linkHref: links[0] ? links[0].getAttribute('href') : null,
    cardPosition: getComputedStyle(card).position,
    // Anything aria-hidden must contain no focusable element.
    hiddenFocusable: [...card.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button')].length,
  };
});

if (r.error) { console.log('  FAIL  ' + r.error); process.exit(1); }
console.log('');
for (const [where, what] of Object.entries(r.hits)) console.log(`  ${where.padEnd(30)} -> ${what}`);
console.log('');
ok('every corner of the card is the link', Object.values(r.hits).every((h) => h === 'link'),
   JSON.stringify(r.hits));
ok('the card holds exactly one link', r.linkCount === 1, `found ${r.linkCount}`);
ok('the link is named for the tool, not "Open the tool"', /calculator/i.test(r.linkName || ''), `named "${r.linkName}"`);
ok('it points where the card says it does', (r.linkHref || '').includes('/tools/'), r.linkHref);
ok('.card is the positioning context the overlay needs', r.cardPosition === 'relative', r.cardPosition);
ok('nothing focusable is hidden from screen readers', r.hiddenFocusable === 0, `${r.hiddenFocusable} focusable inside aria-hidden`);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
