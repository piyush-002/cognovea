/**
 * The top navigation, driven in a browser.
 *
 * Two dropdowns became three, which is the point at which "opening one closes
 * the others" stops being obviously true. The component encodes that as a single
 * `openMenu` value rather than a boolean per menu, so two panels overlapping is
 * unrepresentable — but only until somebody adds a fourth menu with a boolean
 * because it seemed simpler. This checks the property, not the implementation.
 *
 * It also checks the things a nav quietly gets wrong: that every link in a panel
 * goes somewhere, that the trigger reports its state to a screen reader, that
 * Escape closes, and that the current section is marked.
 *
 *   node tools/test-nav.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { requirePlaywright } from './lib/playwright.mjs';
import { buildPage } from './lib/mount-react.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');

const MODULES = {
  '@/lib/site': 'src/lib/site.ts',
  '@/lib/host-redirect.mjs': 'src/lib/host-redirect.mjs',
  '@/components/Logo': 'src/components/Logo.tsx',
  '@/components/Mark': 'src/components/Mark.tsx',
  '@/lib/mark-dots': 'src/lib/mark-dots.ts',
  '@/components/Nav': 'src/components/Nav.tsx',
};

const html = buildPage({ projectRoot: root, css, modules: MODULES, entry: '@/components/Nav' });

const { chromium, launchOpts } = await requirePlaywright('test-nav');
const browser = await chromium.launch(launchOpts);

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await page.route('**/*', (route) =>
  route.request().url().includes('example.test')
    ? route.fulfill({ status: 200, contentType: 'text/html', body: html })
    : route.continue(),
);
await page.goto('https://example.test/');
await page.waitForFunction(() => window.__mounted === true || (window.__err && window.__err.length), null, { timeout: 15000 });

ok('the nav mounts with no runtime error', (await page.evaluate(() => window.__err)).length === 0,
  (await page.evaluate(() => window.__err)).join('\n'));

/** The trigger button whose label matches. */
const trigger = (label) => page.locator('.c-nav__trigger', { hasText: label }).first();

/* --- the dropdown exists and holds what it should ------------------------- */
{
  const t = trigger('Resources');
  ok('there is a Resources trigger', (await t.count()) === 1);
  ok('it is a button, so it is keyboard reachable', (await t.evaluate((el) => el.tagName)) === 'BUTTON');
  ok('it starts closed', (await t.getAttribute('aria-expanded')) === 'false');
  ok('it announces that it opens a menu', (await t.getAttribute('aria-haspopup')) === 'true');

  await t.click();
  ok('clicking opens it', (await t.getAttribute('aria-expanded')) === 'true');

  const panel = page.locator('.c-nav__item.is-open .c-nav__menu').first();
  const links = await panel.locator('a').all();
  const hrefs = await Promise.all(links.map((l) => l.getAttribute('href')));
  const labels = await Promise.all(links.map((l) => l.locator('strong').innerText()));

  ok('it holds exactly two entries', links.length === 2, `${links.length}: ${labels.join(', ')}`);
  ok('the tools page is one of them', hrefs.includes('/tools'), hrefs.join(', '));
  ok('the playbooks page is the other', hrefs.includes('/playbooks'), hrefs.join(', '));
  ok('every entry has somewhere to go', hrefs.every((h) => h && h.startsWith('/')), hrefs.join(', '));
  ok('every entry is labelled', labels.every((l) => l.trim().length > 2), labels.join(', '));
  // The panel renders a <small> blurb when one exists; without it the dropdown
  // is two bare words and gives a visitor no reason to pick either.
  const blurbs = await panel.locator('small').count();
  ok('both entries explain themselves', blurbs === 2, `${blurbs} blurbs`);
}

/* --- one open at a time, which is the property the design turns on -------- */
{
  const resources = trigger('Resources');
  const company = trigger('Company');

  await company.click();
  ok('opening Company closes Resources',
    (await resources.getAttribute('aria-expanded')) === 'false' &&
      (await company.getAttribute('aria-expanded')) === 'true');

  await resources.click();
  ok('and opening Resources closes Company',
    (await company.getAttribute('aria-expanded')) === 'false' &&
      (await resources.getAttribute('aria-expanded')) === 'true');

  ok('never more than one panel open', (await page.locator('.c-nav__item.is-open').count()) === 1);
}

/* --- it closes the ways people expect ------------------------------------- */
{
  const t = trigger('Resources');
  await page.keyboard.press('Escape');
  ok('Escape closes it', (await t.getAttribute('aria-expanded')) === 'false');

  await t.click();
  await page.mouse.click(640, 700);
  ok('a click outside closes it', (await t.getAttribute('aria-expanded')) === 'false');

  await t.click();
  await t.click();
  ok('clicking the trigger again closes it', (await t.getAttribute('aria-expanded')) === 'false');
}

/* --- the top row stayed short --------------------------------------------- */
{
  /*
   * Both bounds, and the lower one matters more.
   *
   * The first version of this asserted only `items <= 6` — against a selector
   * that matched nothing, so it passed on zero elements and told me the row was
   * fine while the test could not see the row at all. A ceiling with no floor
   * is not a measurement.
   */
  const items = await page.locator('.c-nav__links > li').count();
  ok('the top row was actually found', items >= 4, `${items} items`);
  ok('and is still short enough to scan', items <= 6, `${items} items`);

  const bar = await page.locator('.c-nav__links').first().boundingBox();
  ok('it fits on one line at 1280px', bar !== null && bar.height < 70, JSON.stringify(bar));
}

/* --- nothing overflows on a phone ----------------------------------------- */
/*
 * Measured as the document's own scrollWidth, the way tools/test-overflow.mjs
 * does it, rather than by walking elements and comparing rects.
 *
 * The rect walk reported a 3px overflow at 320px, and the culprit was an SVG
 * <path> inside the chevron. A path's bounding box is its geometry, not its
 * layout — the parent <svg> clips it to its viewBox and nothing scrolls. Asking
 * the browser whether the page scrolls sideways is both simpler and the thing
 * the visitor would actually experience.
 */
for (const width of [320, 360, 390, 430]) {
  await page.setViewportSize({ width, height: 800 });
  const m = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  ok(`${width}px: the header does not make the page scroll sideways`,
    m.scroll <= m.client + 1, `scrollWidth ${m.scroll} vs ${m.client}`);
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
