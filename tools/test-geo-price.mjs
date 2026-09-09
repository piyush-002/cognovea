/**
 * The regional price swap, in a real browser, at six timezones.
 *
 * test-currency.mjs proves the three files agree with each other by reading
 * them. It cannot prove the agreement produces the right pixels: that the
 * inline script parses, that the browser reports the timezone in the form the
 * script matches, that the CSS specificity wins, or that the hidden figure
 * occupies no width. Those are browser facts, so this loads the real script and
 * the real stylesheet into Chromium and reads what a person would.
 *
 * Both are extracted from the source files rather than copied, so this cannot
 * pass against a stale duplicate of either.
 *
 * Needs playwright, which lives in the sandbox rather than the repo.
 *
 *   node tools/test-geo-price.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { chromium } = require_(
  process.env.PLAYWRIGHT_PATH ||
    (() => {
      for (const dir of [
        `${process.env.HOME}/.npm-global/lib/node_modules/playwright`,
        '/usr/local/lib/node_modules_global/playwright',
        'playwright',
      ]) {
        try {
          require_.resolve(dir);
          return dir;
        } catch {
          /* try the next one */
        }
      }
      throw new Error('playwright not found; set PLAYWRIGHT_PATH');
    })(),
);

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const layout = read('src/app/(frontend)/layout.tsx');
const css = read('src/app/(frontend)/globals.css');

/* The script is authored as adjacent string literals across several lines so it
   stays readable in the layout; take the expression as written and let the JS
   engine concatenate it rather than unpicking the quoting here. The layout has
   two dangerouslySetInnerHTML blocks and the <noscript> reveal fallback comes
   first, so select by content, not by position. */
const blocks = [...layout.matchAll(/__html:\s*([\s\S]*?),\n\s*\}\}\s*\n\s*\/>/g)]
  .map((m) => m[1].trim().replace(/,$/, ''))
  .filter((src) => /resolvedOptions/.test(src));
if (blocks.length !== 1) throw new Error(`expected exactly one geo script in layout.tsx, found ${blocks.length}`);
const geoScript = eval(`(${blocks[0]})`);

const priceCss = css.slice(css.indexOf('/* --- Regional pricing'));
if (priceCss.length < 50) throw new Error('could not find the regional pricing rules in globals.css');

const USD = `$${(2499).toLocaleString('en-US')}`;
const INR = `Rs ${(150000).toLocaleString('en-IN')}`;

/* The markup Price.tsx emits, plus the counter variant from the homepage stat
   row, which nests a span inside each half. */
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>body{font:16px system-ui;margin:0}</style>
<style>${priceCss}</style>
<script>${geoScript}</script>
</head><body>
<p id="prose">From <span class="price"><span class="price__usd">${USD}</span><span class="price__inr">${INR}</span></span>.</p>
<div id="stat"><span class="price"><span class="price__usd"><span>${USD}</span></span><span class="price__inr"><span>${INR}</span></span></span></div>
<div id="geoAtParse"></div>
<script>document.getElementById('geoAtParse').textContent=document.documentElement.getAttribute('data-geo')||'none'</script>
</body></html>`;

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
  }
};

const cases = [
  { tz: 'Asia/Kolkata', expect: INR, geo: 'in', who: 'a visitor in Bengaluru' },
  { tz: 'Asia/Calcutta', expect: INR, geo: 'in', who: 'the older spelling of the same zone' },
  { tz: 'America/New_York', expect: USD, geo: 'none', who: 'a visitor in New York' },
  { tz: 'Europe/London', expect: USD, geo: 'none', who: 'a visitor in London' },
  { tz: 'Asia/Dubai', expect: USD, geo: 'none', who: 'a visitor in Dubai' },
  { tz: 'Asia/Colombo', expect: USD, geo: 'none', who: 'Colombo, which shares +5:30 but is not India' },
];

const browser = await chromium.launch();
for (const c of cases) {
  const ctx = await browser.newContext({ timezoneId: c.tz });
  const p = await ctx.newPage();
  await p.setContent(page, { waitUntil: 'load' });

  const seen = await p.evaluate(() => ({
    prose: document.getElementById('prose').innerText.trim(),
    stat: document.getElementById('stat').innerText.trim(),
    atParse: document.getElementById('geoAtParse').textContent,
    usdW: document.querySelector('#prose .price__usd').getBoundingClientRect().width,
    inrW: document.querySelector('#prose .price__inr').getBoundingClientRect().width,
  }));

  ok(`${c.who} reads ${c.expect}`, seen.prose === `From ${c.expect}.`, `saw "${seen.prose}"`);
  ok('  ...and the same in the stat counter', seen.stat === c.expect, `saw "${seen.stat}"`);
  ok(
    '  ...decided before the body parsed, so nothing swaps under them',
    seen.atParse === c.geo,
    `data-geo was "${seen.atParse}" partway down the document`,
  );
  const hidden = c.expect === INR ? seen.usdW : seen.inrW;
  const shown = c.expect === INR ? seen.inrW : seen.usdW;
  ok('  ...the other figure takes no width', hidden === 0 && shown > 0, `hidden ${hidden}px, shown ${shown}px`);
  await ctx.close();
}

/* Without the script at all: what a crawler, or a reader with JavaScript off,
   is served. This is the case that decides which price gets indexed. */
const ctx = await browser.newContext({ timezoneId: 'Asia/Kolkata', javaScriptEnabled: false });
const p = await ctx.newPage();
await p.setContent(page, { waitUntil: 'load' });
ok(
  'with JavaScript off, even in India, the dollar price is what is served',
  (await p.locator('#prose').innerText()).trim() === `From ${USD}.`,
);
await ctx.close();
await browser.close();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
