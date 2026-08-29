/**
 * Nothing may make the page wider than the phone it is on.
 *
 * The bug: `.btn { white-space: nowrap }` gave every button a min-content width
 * it would not go below. The longest label on the site, "Get Started With an AI
 * Readiness Assessment", measured 327px; with the page's 18px padding either
 * side that pinned the layout at 364px. On any viewport narrower than that the
 * whole page — heading, nav, everything — was pushed right and clipped by
 * `body { overflow-x: clip }`.
 *
 * That clip is why it went unnoticed. Without it the page would scroll
 * sideways, which anyone would spot; with it, the overflow is silent and the
 * only symptom is content cut off at the edge on small phones.
 *
 * So this measures rather than looks: every button label on the site is
 * rendered at the narrowest viewport worth supporting and checked against it.
 *
 *   node tools/test-overflow.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { requirePlaywright } from './lib/playwright.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');
const { chromium, launchOpts } = await requirePlaywright('test-overflow');

/** Every button label in the source, so this tracks the real copy. */
function buttonLabels() {
  const found = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx$/.test(e.name)) {
        const text = fs.readFileSync(full, 'utf8');
        // <Link className="btn …">Label</Link> and label={'…'} on CtaBand.
        for (const m of text.matchAll(/className="btn[^"]*"[^>]*>\s*([^<{][^<]*?)\s*(?:<|$)/g)) {
          const label = m[1].replace(/\s+/g, ' ').trim();
          if (label && label.length > 2) found.add(label);
        }
        for (const m of text.matchAll(/label:\s*'([^']{4,})'/g)) found.add(m[1]);
      }
    }
  };
  walk(path.join(root, 'src'));
  return [...found];
}

const labels = buttonLabels();

// 320px is the narrowest screen still in real use (iPhone SE 1st gen, and any
// phone at larger text sizes). Supporting it costs nothing here.
const VIEWPORTS = [320, 360, 375, 390, 414, 430];

const page = (label) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style></head><body>
<section class="band"><div class="wrap">
  <div class="btn-row">
    <a class="btn btn--primary" id="t" href="/x">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</a>
  </div>
</div></section></body></html>`;

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
  }
};

const browser = await chromium.launch(launchOpts);

console.log(`Checking ${labels.length} button labels at ${VIEWPORTS.length} widths.\n`);

let worst = { over: 0 };
for (const label of labels) {
  for (const w of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    const p = await ctx.newPage();
    await p.setContent(page(label));
    await p.waitForTimeout(30);
    const r = await p.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      wrap: Math.round(document.querySelector('.wrap').getBoundingClientRect().width),
      btnRight: Math.round(document.querySelector('#t').getBoundingClientRect().right),
      body: Math.round(document.body.getBoundingClientRect().width),
    }));
    await ctx.close();

    const over = Math.max(r.doc - w, r.wrap - w, r.btnRight - w, r.body - w);
    if (over > worst.over) worst = { over, label, w };

    ok(
      `"${label.slice(0, 44)}" fits at ${w}px`,
      over <= 1,
      `page is ${over}px wider than the viewport (wrap ${r.wrap}, button right edge ${r.btnRight})`,
    );
  }
}

await browser.close();

/* --- and the rule that caused it must not come back ----------------------- */
{
  // Strip comments first. The rule's own explanation names the property it
  // no longer uses, and a check that reads prose as code fails on the very
  // documentation added to stop this recurring. Third time this session.
  const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const btnBlock = cssCode.match(/\n\.btn \{([\s\S]*?)\n\}/)?.[1] ?? '';
  ok(
    '.btn does not use white-space: nowrap',
    !/white-space:\s*nowrap/.test(btnBlock),
    'nowrap gives a button a min-content width it cannot go below, which is what pushed the page wider than the screen',
  );
  ok(
    '.btn is capped at the width of its container',
    /max-inline-size:\s*100%|max-width:\s*100%/.test(btnBlock),
  );
}

console.log(
  worst.over > 1
    ? `\nWorst: "${worst.label}" overflows by ${worst.over}px at ${worst.w}px.`
    : '\nNo label makes the page wider than the screen at any tested width.',
);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
