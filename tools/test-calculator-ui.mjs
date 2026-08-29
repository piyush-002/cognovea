/**
 * Drives the real Calculator component in a real browser.
 *
 * tools/test-calculator.mjs proves the arithmetic. This proves the thing a
 * visitor actually touches: that the fields start empty, that Calculate is
 * refused until it can produce an answer, that changing an input afterwards
 * moves the result, that Start again really clears it, and — the one that
 * matters commercially — that a shared link reproduces the sender's numbers
 * exactly.
 *
 * The component is compiled from source and mounted, not reimplemented. A
 * fixture that mimics it would pass while the real one passed the wrong props.
 *
 *   node tools/test-calculator-ui.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { requirePlaywright } from './lib/playwright.mjs';
import { buildPage } from './lib/mount-react.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');

const MODULES = {
  '@/lib/calculator/assumptions': 'src/lib/calculator/assumptions.ts',
  '@/lib/calculator/model': 'src/lib/calculator/model.ts',
  '@/lib/calculator/url-state': 'src/lib/calculator/url-state.ts',
  '@/components/calculator/Results': 'src/components/calculator/Results.tsx',
  '@/components/calculator/InfoTip': 'src/components/calculator/InfoTip.tsx',
  '@/components/calculator/Calculator': 'src/components/calculator/Calculator.tsx',
};

const html = buildPage({
  projectRoot: root,
  css,
  modules: MODULES,
  entry: '@/components/calculator/Calculator',
});

const { chromium, launchOpts } = await requirePlaywright('test-calculator-ui');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

const browser = await chromium.launch(launchOpts);

/** A fresh page at a given URL, with the component mounted. */
async function open(query = '') {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  // A real URL, so the component's own history and search handling is exercised
  // rather than bypassed.
  await page.route('**/tools/bi-automation-calculator*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }),
  );
  await page.goto(`https://example.test/tools/bi-automation-calculator${query}`);
  await page.waitForFunction(() => window.__mounted === true || (window.__err && window.__err.length), null, { timeout: 15000 });
  const errs = await page.evaluate(() => window.__err);
  return { ctx, page, errs };
}

const fill = async (page, id, value) => {
  await page.fill(`#${id}`, String(value));
};

/* --- it mounts at all ------------------------------------------------------ */
{
  const { ctx, page, errs } = await open();
  ok('the component mounts with no runtime error', errs.length === 0, errs.join('\n        '));

  /* --- empty by default --------------------------------------------------- */
  const values = await page.evaluate(() =>
    ['people', 'hours', 'cost', 'reports', 'lag'].map((id) => document.getElementById(id)?.value),
  );
  ok('every numeric field starts empty', values.every((v) => v === ''), JSON.stringify(values));

  const placeholders = await page.evaluate(() =>
    ['people', 'hours', 'cost'].map((id) => document.getElementById(id)?.placeholder),
  );
  ok('and each shows an example instead', placeholders.every((p) => p && p.startsWith('e.g.')), JSON.stringify(placeholders));

  ok('no result is shown yet', (await page.locator('.calc-res').count()) === 0);
  ok('the empty state explains what will appear', (await page.locator('.calc__empty').count()) === 1);

  /* --- Calculate is refused until it can answer ---------------------------- */
  ok('Calculate starts disabled', await page.locator('button[type=submit]').isDisabled());

  await fill(page, 'people', 4);
  await fill(page, 'hours', 8);
  await fill(page, 'cost', 1600);
  ok('still disabled with three of the four', await page.locator('button[type=submit]').isDisabled());

  await fill(page, 'reports', 12);
  ok('enabled once the fourth is in', await page.locator('button[type=submit]').isEnabled());

  ok('and still nothing has been calculated', (await page.locator('.calc-res').count()) === 0,
    'a result appearing before it is asked for is the behaviour this replaced');

  /* --- the first calculation ---------------------------------------------- */
  await page.click('button[type=submit]');
  await page.waitForSelector('.calc-res', { timeout: 5000 });

  const headline = (await page.locator('.calc-res__big').textContent())?.trim();
  // 4 x 8 x 46 = 1472 hrs; x 1600 = 23,55,200 labour, plus rework.
  ok('the headline matches the model', headline === 'Rs 23,75,690', `got ${headline}`);

  const hours = await page.locator('.calc-res__sub').first().textContent();
  ok('the hours are stated and correct', (hours ?? '').includes('1,472 hrs'), hours ?? '');

  /* --- live updates afterwards -------------------------------------------- */
  await fill(page, 'people', 8);
  await page.waitForFunction(
    () => document.querySelector('.calc-res__big')?.textContent?.trim() !== 'Rs 23,75,690',
    null, { timeout: 5000 },
  );
  const doubled = (await page.locator('.calc-res__big').textContent())?.trim();
  ok('doubling the people roughly doubles the cost', doubled === 'Rs 47,51,380', `got ${doubled}`);

  /* --- Start again -------------------------------------------------------- */
  ok('Calculate has become Start again', (await page.locator('button[type=submit]').count()) === 0);
  await page.click('text=Start again');
  await page.waitForTimeout(200);
  const cleared = await page.evaluate(() =>
    ['people', 'hours', 'cost', 'reports'].map((id) => document.getElementById(id)?.value),
  );
  ok('Start again empties every field', cleared.every((v) => v === ''), JSON.stringify(cleared));
  ok('and removes the result', (await page.locator('.calc-res').count()) === 0);
  ok('and clears the query string', (await page.evaluate(() => window.location.search)) === '');

  await ctx.close();
}

/* --- the share link, which is the whole distribution mechanic -------------- */
{
  const { ctx, page } = await open();
  await fill(page, 'people', 7);
  await fill(page, 'hours', 9.5);
  await fill(page, 'cost', 2100);
  await fill(page, 'reports', 22);
  await fill(page, 'lag', 5);
  await page.click('button[type=submit]');
  await page.waitForSelector('.calc-res');

  const search = await page.evaluate(() => window.location.search);
  ok('the URL carries the inputs once calculated', search.includes('p=7') && search.includes('h=9.5') && search.includes('c=2100'), search);

  const sent = (await page.locator('.calc-res__big').textContent())?.trim();
  await ctx.close();

  // Open that URL cold, as a recipient would.
  const recip = await open(search);
  ok('a shared link mounts without error', recip.errs.length === 0, recip.errs.join('\n'));
  await recip.page.waitForSelector('.calc-res', { timeout: 5000 });

  const received = (await recip.page.locator('.calc-res__big').textContent())?.trim();
  ok('the recipient sees the sender’s number, not a default', received === sent, `sent ${sent}, received ${received}`);
  ok('and lands on a result, not an empty form', (await recip.page.locator('.calc__empty').count()) === 0);

  const fields = await recip.page.evaluate(() =>
    ['people', 'hours', 'cost', 'reports', 'lag'].map((id) => document.getElementById(id)?.value),
  );
  ok('every field is repopulated', JSON.stringify(fields) === JSON.stringify(['7', '9.5', '2100', '22', '5']), JSON.stringify(fields));
  await recip.ctx.close();
}

/* --- the bug the user found, through the interface ------------------------ */
{
  const { ctx, page } = await open();
  await fill(page, 'people', 1);
  await fill(page, 'hours', 1);
  await fill(page, 'cost', 2000);
  await fill(page, 'reports', 0);
  await fill(page, 'lag', 12);
  await page.click('button[type=submit]');
  await page.waitForSelector('.calc-res');
  await page.click('.calc__toggle');
  await fill(page, 'daycost', 20000);
  await page.waitForTimeout(250);

  const unpriced = await page.locator('.calc-bar--unpriced').count();
  ok('no reporting cycles: the delay is shown as unpriced', unpriced === 1);

  const note = (await page.locator('.calc-bar--unpriced .calc-bar__note').textContent()) ?? '';
  ok('and the note explains why rather than printing Rs 0', /no recurring reports/i.test(note), note.slice(0, 120));

  const anyZero = await page.evaluate(() =>
    [...document.querySelectorAll('.calc-bar__value')].some((el) => el.textContent?.trim() === 'Rs 0'),
  );
  ok('nothing anywhere reads "Rs 0" for a figure the visitor supplied', !anyZero);

  // And it fills in once there are cycles to apply it to.
  await fill(page, 'reports', 12);
  await page.waitForTimeout(250);
  const nowPriced = await page.locator('.calc-bar--unpriced').count();
  ok('setting reports a month prices it', nowPriced === 0);

  const arithmetic = (await page.locator('.calc-bar').nth(2).textContent()) ?? '';
  ok('and the multiplication is shown in full', /12 days late/.test(arithmetic) && /144 decisions/.test(arithmetic), arithmetic.slice(0, 160));
  await ctx.close();
}

/* --- a hostile shared URL must not reach the output ----------------------- */
{
  const { ctx, page, errs } = await open('?i=%3Cscript%3E&p=99999999&h=1e9&c=-4000&r=abc&tr=99');
  ok('a hostile URL mounts without error', errs.length === 0, errs.join('\n'));
  await page.waitForSelector('.calc-res', { timeout: 5000 });
  const big = (await page.locator('.calc-res__big').textContent()) ?? '';
  ok('the headline is a real number, not NaN or Infinity', /^Rs [\d,]+$/.test(big.trim()), big);
  const people = await page.evaluate(() => document.getElementById('people')?.value);
  ok('an absurd people count is clamped before it renders', Number(people) <= 5000, people);
  await ctx.close();
}

/* --- the whole form must clear a laptop fold ------------------------------ */
{
  // A control below the fold is a control a share of visitors never reach, and
  // the one below it here is the button that produces the answer.
  for (const [w, h, label] of [[1280, 700, '13" laptop'], [1440, 780, '14" laptop'], [1512, 850, 'MacBook 14"']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.route('**/tools/bi-automation-calculator*', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await page.goto('https://example.test/tools/bi-automation-calculator');
    await page.waitForFunction(() => window.__mounted === true, null, { timeout: 15000 });
    await page.waitForTimeout(150);
    const bottom = await page.evaluate(() =>
      Math.round(document.querySelector('.calc__submit').getBoundingClientRect().bottom));
    ok(`every control fits above the fold on a ${label}`, bottom <= h, `submit ends at ${bottom}px in ${h}px`);
    await ctx.close();
  }
}

/* --- mobile: no overflow, and the tooltips reachable by touch ------------- */
{
  for (const [w, h, name] of [[320, 568, 'small Android'], [360, 640, 'Android'], [390, 844, 'iPhone 14'], [430, 932, 'Pro Max']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.route('**/tools/bi-automation-calculator*', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await page.goto('https://example.test/tools/bi-automation-calculator');
    await page.waitForFunction(() => window.__mounted === true, null, { timeout: 15000 });

    for (const [id, v] of [['people','6'],['hours','9'],['cost','2400'],['reports','18'],['lag','4']]) await page.fill('#' + id, v);
    await page.click('button[type=submit]');
    await page.waitForSelector('.calc-res', { timeout: 5000 });

    const over = await page.evaluate((vw) => {
      let worst = 0;
      for (const el of document.querySelectorAll('.calc *')) {
        const b = el.getBoundingClientRect();
        if (b.width === 0) continue;
        worst = Math.max(worst, Math.round(b.right - vw), Math.round(-b.left));
      }
      return Math.max(worst, document.documentElement.scrollWidth - vw);
    }, w);
    ok(`${name} ${w}px: nothing runs past the edge`, over <= 1, `worst overhang ${over}px`);

    // A hover-only tooltip is unreachable on a touch screen, and the first
    // version of this component was exactly that: the tap opened it and the
    // synthesised mouseleave closed it again before anything rendered.
    await page.locator('.tip__btn').first().click();
    await page.waitForTimeout(150);
    const bubble = await page.locator('.tip__bubble').first().boundingBox();
    ok(`${name} ${w}px: a tooltip opens on tap`, bubble !== null);
    if (bubble) {
      ok(`${name} ${w}px: and stays on screen`, bubble.x >= -0.5 && bubble.x + bubble.width <= w + 0.5,
        `x ${Math.round(bubble.x)}, width ${Math.round(bubble.width)}, viewport ${w}`);
    }

    const target = await page.evaluate(() => {
      const b = document.querySelector('.tip__btn').getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height) };
    });
    ok(`${name} ${w}px: the info button is a real tap target`, target.h >= 32 && target.w >= 32, JSON.stringify(target));
    await ctx.close();
  }
}

/* --- it must survive a context with no addressable URL -------------------- */
{
  // An agency embedding this in a sandboxed iframe has an opaque origin, where
  // history.replaceState throws. Unguarded, that threw inside an effect and
  // took the entire result down: the calculator produced nothing at all.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.setContent(html);
  await page.waitForFunction(() => window.__mounted === true, null, { timeout: 15000 });
  for (const [id, v] of [['people','4'],['hours','8'],['cost','1600'],['reports','12']]) await page.fill('#' + id, v);
  await page.click('button[type=submit]');
  const appeared = await page.locator('.calc-res').count().catch(() => 0) ||
    await page.waitForSelector('.calc-res', { timeout: 4000 }).then(() => 1).catch(() => 0);
  ok('it still calculates where the URL cannot be written', appeared === 1,
    'replaceState throws on an opaque origin; the result must not depend on it');
  await ctx.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
