/**
 * Bundles tools/nav-test.tsx for the browser, runs it in Chromium, and asserts
 * that .rv sections reveal both on first load AND after a simulated client-side
 * route change (the bug: they only revealed after a hard refresh).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const TSX = '/home/claude/.npm-global/lib/node_modules/tsx';
const esbuild = require(require.resolve('esbuild', { paths: [TSX] }));
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const root = process.cwd();
const tmp = '/tmp/navtest';
fs.mkdirSync(tmp, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'tools', 'nav-test.tsx')],
  outfile: path.join(tmp, 'app.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  loader: { '.css': 'empty' },
  alias: { '@': path.join(root, 'src') },
  logLevel: 'warning',
});

fs.copyFileSync(path.join(root, 'src', 'app', 'globals.css'), path.join(tmp, 'globals.css'));
fs.writeFileSync(
  path.join(tmp, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="./globals.css"></head>
<body><div id="root"></div><script src="./app.js"></script></body></html>`,
);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`file://${tmp}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(900);

const state = async (id) =>
  page.evaluate((sel) => {
    const el = document.getElementById(sel);
    if (!el) return 'MISSING';
    return {
      isIn: el.classList.contains('is-in'),
      opacity: getComputedStyle(el).opacity,
    };
  }, id);

const results = [];
results.push(['first load, section a-0', await state('a-0')]);

await page.click('#go');
// Long enough for the 0.85s reveal transition plus its stagger delay to finish.
await page.waitForTimeout(1700);

results.push(['after route change, section b-0', await state('b-0')]);
results.push(['after route change, section b-1', await state('b-1')]);

// Scroll down to confirm the observer is live on the new route too.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
// 0.8s transition + up to 0.4s stagger delay, wait past both before reading opacity.
await page.waitForTimeout(1600);
results.push(['after scrolling new route, section b-3', await state('b-3')]);

await browser.close();

let failed = 0;
for (const [label, r] of results) {
  // Tolerance rather than an exact '1': computed opacity lands on values like
  // 0.999975 at the tail of the transition, which is visually complete.
  const ok = r !== 'MISSING' && r.isIn === true && parseFloat(r.opacity) > 0.98;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} → ${JSON.stringify(r)}`);
}
if (errors.length) {
  failed++;
  console.log('page errors:', errors);
}

console.log(failed === 0 ? '\nRoute-change reveal works.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
