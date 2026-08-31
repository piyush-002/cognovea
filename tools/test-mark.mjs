/**
 * The mark on the site is the mark in the logo file.
 *
 * This exists because it was not. The header carried a seeded random scatter
 * tuned by eye to resemble the Cognovea C, and nothing anywhere asserted a
 * relationship between it and public/logo.png — so it drifted from the brand
 * without failing anything. "Looks about right" is not a test.
 *
 * So: render src/lib/mark-dots.ts, render the mark out of public/logo.png at
 * the same size, and compare them pixel by pixel. A logo replaced without
 * rerunning the tracer fails here, as does a hand-edit of the generated data.
 *
 *   node tools/test-mark.mjs
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

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

const compile = (rel) =>
  ts.transpileModule(fs.readFileSync(path.join(root, rel), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;

const FILES = {
  '@/lib/mark-dots': 'src/lib/mark-dots.ts',
  '@/components/Mark': 'src/components/Mark.tsx',
};
const cache = {};
const load = (key) => {
  if (key in cache) return cache[key];
  if (key === 'react') return (cache[key] = React);
  if (key === 'react/jsx-runtime') return (cache[key] = require('react/jsx-runtime'));
  if (!FILES[key]) throw new Error(`unexpected import: ${key}`);
  const m = { exports: {} };
  cache[key] = m.exports;
  new Function('exports', 'require', 'module', compile(FILES[key]))(m.exports, load, m);
  return (cache[key] = m.exports);
};

const { DOTS, BANDS } = load('@/lib/mark-dots');
const Mark = load('@/components/Mark').default;

/* --- the data itself ------------------------------------------------------ */

ok('the mark has a real number of dots', DOTS.length > 150, `got ${DOTS.length}`);
ok(
  'every dot has a colour lifted from the artwork, not a computed ramp',
  DOTS.every((d) => /^#[0-9a-f]{6}$/.test(d.c)),
);
ok(
  'every dot sits inside the 100x100 box',
  DOTS.every((d) => d.x - d.r >= -0.5 && d.x + d.r <= 100.5 && d.y - d.r >= -0.5 && d.y + d.r <= 100.5),
);
ok(
  'every dot is in a band the stylesheet has a delay for',
  DOTS.every((d) => Number.isInteger(d.b) && d.b >= 0 && d.b < BANDS),
);

/* Every band the component can emit must have a delay rule, or a whole ring of
   the mark animates on top of the others. */
const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');
const used = [...new Set(DOTS.map((d) => d.b))].sort();
ok(
  'the stylesheet stages every band that actually has dots in it',
  used.every((b) => css.includes(`.mark__band--${b}`)),
  `bands in use: ${used.join(', ')}`,
);
ok(
  'nothing still animates the dots that no longer carry offsets',
  !css.includes('mark__dot') && !css.includes('--dx'),
);

/* The wordmark's ramp.

   var(--grad) is a 96deg site-wide gradient. Over a word about 14px tall it
   travels almost entirely top-to-bottom, so "vea" rendered as one flat blue
   and the violet the logo opens on never appeared. This asserts the lockup
   keeps its own near-horizontal ramp. */
const em = css.slice(css.indexOf('.logo__word em'), css.indexOf('.logo__tag'));
const angle = Number((em.match(/linear-gradient\((-?[\d.]+)deg/) || [])[1]);
ok(
  'the wordmark ramp runs across the word, not down it',
  Number.isFinite(angle) && Math.abs(angle - 90) <= 15,
  `"vea" gradient angle is ${Number.isFinite(angle) ? angle + 'deg' : 'not a fixed angle'}`,
);
ok(
  'the wordmark ramp starts on the violet the logo starts on',
  /#7433fc/i.test(em),
);

/* --- the rendered mark against the artwork -------------------------------- */

const { chromium, launchOpts } = await requirePlaywright('test-mark');
const browser = await chromium.launch(launchOpts);
const page = await (await browser.newContext({ viewport: { width: 420, height: 240 } })).newPage();

const SIZE = 200;
const svg = renderToStaticMarkup(React.createElement(Mark, { className: 'm' }))
  .replace('<svg ', `<svg width="${SIZE}" height="${SIZE}" `);
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'public/logo.png')).toString('base64');

await page.setContent(
  `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff">
     <div id="a" style="position:absolute;left:0;top:0;width:${SIZE}px;height:${SIZE}px">${svg}</div>
     <canvas id="b" width="${SIZE}" height="${SIZE}" style="position:absolute;left:${SIZE + 20}px;top:0"></canvas>
     <img id="src" src="${logo}" style="display:none">
   </body>`,
  { waitUntil: 'load' },
);

/**
 * Draw the logo's mark region into the second canvas, fitted the same way the
 * tracer normalised it: tight bounding box of the ink above the wordmark gap,
 * centred in a square. Both pictures then describe the same thing at the same
 * scale, and any difference is a difference in the mark.
 */
const result = await page.evaluate(async ({ SIZE, dots }) => {
  const img = document.getElementById('src');
  await img.decode();
  const W = img.width;
  const H = img.height;
  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const tctx = tmp.getContext('2d', { willReadFrequently: true });
  tctx.drawImage(img, 0, 0);
  const px = tctx.getImageData(0, 0, W, H).data;
  const ink = (x, y) => {
    const o = (y * W + x) * 4;
    return 255 - Math.min(px[o], px[o + 1], px[o + 2]) > 40;
  };

  const rowHas = [];
  for (let y = 0; y < H; y++) {
    let has = false;
    for (let x = 0; x < W && !has; x++) has = ink(x, y);
    rowHas.push(has);
  }
  const first = rowHas.indexOf(true);
  const last = rowHas.lastIndexOf(true);
  let gap = { start: -1, len: 0 };
  for (let y = first, run = -1; y <= last; y++) {
    if (!rowHas[y]) {
      if (run < 0) run = y;
      if (y - run + 1 > gap.len) gap = { start: run, len: y - run + 1 };
    } else run = -1;
  }
  let minX = W, maxX = 0, minY = gap.start, maxY = first;
  for (let y = first; y < gap.start; y++)
    for (let x = 0; x < W; x++)
      if (ink(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  const side = Math.max(maxX - minX, maxY - minY) + 1;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const b = document.getElementById('b');
  const bctx = b.getContext('2d', { willReadFrequently: true });
  bctx.fillStyle = '#fff';
  bctx.fillRect(0, 0, SIZE, SIZE);
  bctx.drawImage(img, cx - side / 2, cy - side / 2, side, side, 0, 0, SIZE, SIZE);

  // Rasterise the SVG through the same pipeline so antialiasing is comparable.
  const host = document.getElementById('a');
  const blob = new Blob([new XMLSerializer().serializeToString(host.firstElementChild)], {
    type: 'image/svg+xml',
  });
  const url = URL.createObjectURL(blob);
  const svgImg = new Image();
  svgImg.src = url;
  await svgImg.decode();
  const a = document.createElement('canvas');
  a.width = SIZE;
  a.height = SIZE;
  const actx = a.getContext('2d', { willReadFrequently: true });
  actx.fillStyle = '#fff';
  actx.fillRect(0, 0, SIZE, SIZE);
  actx.drawImage(svgImg, 0, 0, SIZE, SIZE);
  URL.revokeObjectURL(url);

  const A = actx.getImageData(0, 0, SIZE, SIZE).data;
  const B = bctx.getImageData(0, 0, SIZE, SIZE).data;

  const isInk = (D, i) => {
    const o = i * 4;
    return 255 - Math.min(D[o], D[o + 1], D[o + 2]) > 40;
  };

  let inkA = 0;
  let inkB = 0;
  let both = 0;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const a = isInk(A, i);
    const b = isInk(B, i);
    if (a) inkA++;
    if (b) inkB++;
    if (a && b) both++;
  }

  /* Colour is checked per dot, against the artwork, at the dot's own position.

     Comparing the two pictures pixel by pixel measures antialiasing instead:
     the artwork's discs are raster with rims blended toward white, these are
     vector, and every dot therefore disagrees along a one-pixel ring whatever
     colour it is. Reading logo.png at the point each dot was taken from asks
     the question directly — is this dot the colour that is there. */
  const worstDot = [];
  for (const d of dots) {
    const sx = Math.round(cx - side / 2 + (d.x / 100) * side);
    const sy = Math.round(cy - side / 2 + (d.y / 100) * side);
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) {
      worstDot.push({ d: 999, at: `${d.x},${d.y}`, reason: 'outside the artwork' });
      continue;
    }
    const o = (sy * W + sx) * 4;
    const want = [px[o], px[o + 1], px[o + 2]];
    const got = [
      parseInt(d.c.slice(1, 3), 16),
      parseInt(d.c.slice(3, 5), 16),
      parseInt(d.c.slice(5, 7), 16),
    ];
    const diff = Math.max(...want.map((v, k) => Math.abs(v - got[k])));
    worstDot.push({ d: diff, at: `${d.x},${d.y}`, want, got });
  }
  worstDot.sort((p, q) => q.d - p.d);

  return {
    inkA,
    inkB,
    both,
    total: SIZE * SIZE,
    meanDot: worstDot.reduce((s, w) => s + w.d, 0) / worstDot.length,
    offColour: worstDot.filter((w) => w.d > 60).length / worstDot.length,
    worstDots: worstDot.slice(0, 3),
  };
}, { SIZE, dots: DOTS.map((d) => ({ x: d.x, y: d.y, c: d.c })) });

/* An exact match is not achievable — the artwork's discs are antialiased raster
   and these are vector — so the assertions are about shape, coverage and
   colour, at thresholds a lookalike cannot pass. The old generated mark scored
   under 0.5 on overlap against this same comparison. */
const overlap = result.both / Math.max(result.inkA, result.inkB);
const coverage = Math.min(result.inkA, result.inkB) / Math.max(result.inkA, result.inkB);

ok(
  'the rendered mark covers the same area as the artwork',
  coverage > 0.9,
  `ink: rendered ${result.inkA}px vs artwork ${result.inkB}px`,
);
ok(
  'the dots land where the artwork puts them',
  overlap > 0.85,
  `${(overlap * 100).toFixed(1)}% of the ink coincides`,
);
ok(
  'each dot is the colour the artwork has at that point',
  result.meanDot < 10,
  `mean difference ${result.meanDot.toFixed(1)} per dot`,
);
ok(
  'no dot is the wrong colour',
  result.offColour < 0.02,
  `${(result.offColour * 100).toFixed(1)}% of dots differ by more than 60 — worst: ${JSON.stringify(
    result.worstDots,
  )}`,
);

await browser.close();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
