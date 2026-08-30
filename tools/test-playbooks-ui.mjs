/**
 * The playbook pages, rendered and measured at real viewport widths.
 *
 * The desktop layout is a three-column grid with pinned rows, which is exactly
 * the kind of thing that looks right at 1280px and falls apart at 360px — and
 * the kind of mistake about to be replicated five more times, so it is worth a
 * check that outlives this afternoon.
 *
 * Both server components are rendered for real, not approximated. The mistakes
 * this catches are the ones a fixture would render past: the rail landing in
 * the wrong grid row, the contents staying sticky on a phone, an element
 * pushing the document sideways.
 *
 *   node tools/test-playbooks-ui.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { requirePlaywright } from './lib/playwright.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: rel.replace(/\.mjs$/, '.ts'),
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
  '@/app/index': 'src/app/(frontend)/playbooks/page.tsx',
  '@/app/playbook': 'src/app/(frontend)/playbooks/[slug]/page.tsx',
};
const ALIAS = {
  './sources': '@/lib/playbooks/sources',
  './site': '@/lib/site',
  './host-redirect.mjs': '@/lib/host-redirect.mjs',
};

/**
 * The accordion, rendering every panel.
 *
 * Matches the real component in the one respect that matters here: it keeps
 * collapsed content in the DOM rather than omitting it, so this measures the
 * same amount of text the browser lays out.
 */
const FaqStub = ({ items, defaultOpen }) =>
  React.createElement(
    'div',
    { className: 'acc' },
    items.map((it, i) =>
      React.createElement(
        'div',
        { key: it.q, className: 'acc__item' + (i === defaultOpen ? ' is-open' : '') },
        React.createElement(
          'h3',
          { style: { margin: 0 } },
          React.createElement(
            'button',
            { type: 'button', className: 'acc__btn', 'aria-expanded': i === defaultOpen },
            React.createElement('span', null, it.q),
            React.createElement('span', { className: 'acc__ico' }),
          ),
        ),
        React.createElement(
          'div',
          { className: 'acc__panel' },
          React.createElement('div', null, React.createElement('p', null, it.a)),
        ),
      ),
    ),
  );

const cache = {};
const load = (spec) => {
  const key = ALIAS[spec] || spec;
  if (key in cache) return cache[key];
  if (key === 'react') return (cache[key] = React);
  if (key === 'react/jsx-runtime') return (cache[key] = require('react/jsx-runtime'));
  if (key === 'next/link')
    return (cache[key] = {
      __esModule: true,
      default: ({ href, children, ...rest }) => React.createElement('a', { href, ...rest }, children),
    });
  if (key === 'next/image')
    return (cache[key] = { __esModule: true, default: (props) => React.createElement('img', props) });
  if (key === 'next/navigation')
    return (cache[key] = { notFound: () => { throw new Error('notFound'); } });
  if (key === '@/components/JsonLd') return (cache[key] = { __esModule: true, default: () => null });
  if (key === '@/components/Faq') return (cache[key] = { __esModule: true, default: FaqStub });
  if (key === '@/components/Mark') return (cache[key] = { __esModule: true, default: () => null });
  if (key === '@/lib/mark') return (cache[key] = { markPath: () => '' });
  if (key === '@/lib/content') return (cache[key] = {});
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const m = { exports: {} };
  cache[key] = m.exports;
  new Function('exports', 'require', 'module', compile(FILES[key]))(m.exports, load, m);
  return (cache[key] = m.exports);
};

const IndexPage = load('@/app/index').default;
const PlaybookPage = load('@/app/playbook').default;

async function html(element) {
  const body = renderToStaticMarkup(await element);
  // setContent serves from no origin, so a root-relative src never resolves.
  const inlined = body.replace(/src="(\/img\/[^"]+)"/g, (_, p0) => {
    const svg = fs.readFileSync(path.join(root, 'public', p0), 'utf8');
    return `src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"`;
  });
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${inlined}</body></html>`;
}

const { chromium, launchOpts } = await requirePlaywright('test-playbooks-ui');
const browser = await chromium.launch(launchOpts);

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

const PHONES = [320, 360, 390, 430];
const DESKTOP = 1280;

async function open(markup, width) {
  const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  await page.setContent(markup, { waitUntil: 'load' });
  return page;
}

/** Nothing may push the document wider than the viewport. */
async function sideways(page) {
  return page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    // The widest thing that is actually over the edge, to name the culprit.
    culprit: (() => {
      const w = document.documentElement.clientWidth;
      let worst = null;
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('svg')) continue; // a path's box is geometry, not layout
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > w + 1 && (!worst || r.right > worst.right)) {
          worst = { right: Math.round(r.right), cls: String(el.className || el.tagName).slice(0, 40) };
        }
      }
      return worst;
    })(),
  }));
}

const { publishedPlaybooks: all } = load('@/lib/playbooks');
const SLUGS = all().map((p) => p.slug);

/* Every published playbook, not just the first. They share a template, so a
   layout fault is shared too — but the content is not, and it is the content
   that decides whether something overflows. */
const playbookHtml = await html(PlaybookPage({ params: Promise.resolve({ slug: SLUGS[0] }) }));
const indexHtml = await html(IndexPage());

/* --- desktop: three columns, all starting level --------------------------- */
{
  const page = await open(playbookHtml, DESKTOP);
  const m = await page.evaluate(() => {
    const top = (s) => {
      const el = document.querySelector(s);
      return el ? Math.round(window.scrollY + el.getBoundingClientRect().top) : null;
    };
    const side = document.querySelector('.pb-side');
    return {
      cols: getComputedStyle(document.querySelector('.pb-layout')).gridTemplateColumns.split(' ').length,
      sideTop: top('.pb-side'),
      mainTop: top('.pb'),
      railTop: top('.pb-rail'),
      sticky: getComputedStyle(side).position,
      railLeft: Math.round(document.querySelector('.pb-rail').getBoundingClientRect().left),
      mainLeft: Math.round(document.querySelector('.pb').getBoundingClientRect().left),
      mainWidth: Math.round(document.querySelector('.pb').getBoundingClientRect().width),
    };
  });
  ok('desktop: three columns', m.cols === 3, `${m.cols}`);
  // The row must be pinned. Left to auto-placement the rail drops to row 2 and
  // the note ends up level with the middle of the article.
  ok('desktop: all three columns start level', m.sideTop === m.mainTop && m.mainTop === m.railTop,
    JSON.stringify({ side: m.sideTop, main: m.mainTop, rail: m.railTop }));
  ok('desktop: the rail is to the right of the article', m.railLeft > m.mainLeft + m.mainWidth - 1,
    `rail ${m.railLeft}, article ends ${m.mainLeft + m.mainWidth}`);
  ok('desktop: the contents are sticky', m.sticky === 'sticky', m.sticky);
  ok('desktop: the article keeps a readable measure', m.mainWidth >= 560 && m.mainWidth <= 780, `${m.mainWidth}px`);
  await page.close();
}

/* --- phones: every playbook, because the content differs ------------------ */
const allPlaybooks = [];
for (const slug of SLUGS) {
  allPlaybooks.push([slug, await html(PlaybookPage({ params: Promise.resolve({ slug }) }))]);
}

for (const [label, markup] of [...allPlaybooks, ['index', indexHtml]]) {
  for (const width of PHONES) {
    const page = await open(markup, width);
    const s = await sideways(page);
    ok(`${label} @ ${width}: does not scroll sideways`, s.scroll <= s.client + 1,
      `scrollWidth ${s.scroll} vs ${s.client}${s.culprit ? ` — widest over the edge: ${s.culprit.cls} at ${s.culprit.right}` : ''}`);
    await page.close();
  }
}

/* --- the phone stack ------------------------------------------------------ */
{
  const page = await open(playbookHtml, 390);
  const m = await page.evaluate(() => {
    const top = (s) => {
      const el = document.querySelector(s);
      return el ? Math.round(window.scrollY + el.getBoundingClientRect().top) : null;
    };
    const side = document.querySelector('.pb-side');
    const rail = document.querySelector('.pb-rail');
    const main = document.querySelector('.pb');
    const w = (el) => Math.round(el.getBoundingClientRect().width);
    return {
      order: [top('.pb-side'), top('.pb-rail'), top('.pb')],
      sticky: getComputedStyle(side).position,
      cols: getComputedStyle(document.querySelector('.pb-layout')).gridTemplateColumns.split(' ').length,
      widths: { side: w(side), rail: w(rail), main: w(main) },
      client: document.documentElement.clientWidth,
    };
  });
  ok('phone: one column', m.cols === 1, `${m.cols}`);
  // Source order is contents, then who-it-is-for, then the article — so the
  // note is read before the thing it introduces rather than at the very end.
  ok('phone: contents, then the audience note, then the article',
    m.order[0] < m.order[1] && m.order[1] < m.order[2], JSON.stringify(m.order));
  // A sidebar that follows you down a phone screen is a nuisance, not navigation.
  ok('phone: the contents stop being sticky', m.sticky === 'static', m.sticky);
  ok('phone: every column fills the width', Object.values(m.widths).every((v) => v > m.client * 0.8),
    JSON.stringify(m.widths));
  await page.close();
}

/* --- things that get missed on a phone ------------------------------------ */
{
  const page = await open(playbookHtml, 360);
  const m = await page.evaluate(() => {
    const smallest = (sel) =>
      [...document.querySelectorAll(sel)].reduce((min, el) => {
        const size = parseFloat(getComputedStyle(el).fontSize);
        return min === null || size < min ? size : min;
      }, null);
    const tap = [...document.querySelectorAll('.acc__btn, .pb__toc a')].map((el) => {
      const r = el.getBoundingClientRect();
      return Math.min(r.height, 999);
    });
    // The two-up columns inside a use case have to be one column on a phone, or
    // each holds about twenty characters.
    const cols = document.querySelector('.pb__cols');
    return {
      bodySize: smallest('.pb__case > p'),
      listSize: smallest('.pb__col li'),
      minTap: tap.length ? Math.min(...tap) : null,
      caseCols: cols ? getComputedStyle(cols).gridTemplateColumns.split(' ').length : null,
    };
  });
  ok('phone: body text is not shrunk below 15px', m.bodySize >= 15, `${m.bodySize}px`);
  ok('phone: list text stays legible', m.listSize >= 14, `${m.listSize}px`);
  ok('phone: tappable rows are at least 40px tall', m.minTap >= 40, `${m.minTap}px`);
  ok('phone: the two-up columns collapse to one', m.caseCols === 1, `${m.caseCols}`);
  await page.close();
}

/* --- the index grid ------------------------------------------------------- */
for (const width of [360, DESKTOP]) {
  const page = await open(indexHtml, width);
  const m = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.pb-card')];
    return {
      count: cards.length,
      cols: new Set(cards.map((c) => Math.round(c.getBoundingClientRect().left))).size,
      note: (() => {
        const n = document.querySelector('.pb-notes');
        const g = document.querySelector('.pb-grid');
        return n && g ? Math.abs(n.getBoundingClientRect().width - g.getBoundingClientRect().width) < 2 : false;
      })(),
    };
  });
  ok(`index @ ${width}: all six cards render`, m.count === 6, `${m.count}`);
  ok(`index @ ${width}: ${width === 360 ? 'one card per row' : 'more than one per row'}`,
    width === 360 ? m.cols === 1 : m.cols > 1, `${m.cols} columns`);
  ok(`index @ ${width}: the footnote spans the grid`, m.note === true);
  await page.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
