/**
 * Verifies the scroll-reveal safety net.
 *
 * globals.css starts .rv elements at opacity 0. layout.tsx cancels that with a
 * <noscript> style so a JS-less reader never gets a blank page. This loads the
 * same markup twice, once with JavaScript enabled, once disabled. And asserts
 * the rule flips as intended.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const root = process.cwd();
const tmp = '/tmp/noscripttest';
fs.mkdirSync(tmp, { recursive: true });
fs.copyFileSync(path.join(root, 'src', 'app', 'globals.css'), path.join(tmp, 'globals.css'));

// The <noscript> block is read straight out of layout.tsx so the test can never
// drift from what the app actually ships.
const layout = fs.readFileSync(path.join(root, 'src', 'app', 'layout.tsx'), 'utf8');
const m = layout.match(/__html:\s*'(<style>[^']*<\/style>)'/);
if (!m) {
  console.error('FAIL  could not find the <noscript> style block in layout.tsx');
  process.exit(1);
}
const noscriptStyle = m[1];

fs.writeFileSync(
  path.join(tmp, 'index.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="./globals.css">
<noscript>${noscriptStyle}</noscript>
</head><body><section class="rv" id="s">content</section></body></html>`,
);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const checks = [];

for (const jsEnabled of [true, false]) {
  const ctx = await browser.newContext({ javaScriptEnabled: jsEnabled });
  const page = await ctx.newPage();
  await page.goto(`file://${tmp}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(250);

  // getComputedStyle needs JS, so read it from a JS-enabled page pointed at the
  // same DOM state is impossible, instead assert via a screenshot pixel probe.
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 60, height: 20 } });
  const hasInk = shot.length > 0 && (await page.evaluate(() => 1).catch(() => 1));
  await ctx.close();
  checks.push({ jsEnabled, shotBytes: shot.length, hasInk });
}

// A page rendering visible text produces a materially larger PNG than a blank one.
const withJs = checks.find((c) => c.jsEnabled);
const withoutJs = checks.find((c) => !c.jsEnabled);

await browser.close();

const pass = withoutJs.shotBytes > withJs.shotBytes;
console.log(`JS on  (element hidden, expected smaller PNG): ${withJs.shotBytes} bytes`);
console.log(`JS off (noscript reveals it, expected larger): ${withoutJs.shotBytes} bytes`);
console.log(pass ? 'PASS, noscript fallback reveals content when JS is off.' : 'FAIL, no difference between JS on and off.');
process.exit(pass ? 0 : 1);
