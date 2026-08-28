/**
 * The scroll cue in an inner-page hero must never print through the hero's own
 * content.
 *
 * It used to be `position: absolute; bottom: …`, which put it outside the flow
 * and therefore outside anything the layout could reason about. The copy is
 * vertically centred, so on a short phone it grew downwards into a cue that had
 * no idea it was there. Measured at 360x640 the cue overlapped the hero buttons
 * by 9px; an iPhone SE cleared them by 3.
 *
 * Nothing warns about this. It is not an error, the page is valid, and it does
 * not reproduce at any desktop size.
 *
 * The hero copy is read out of the page files rather than restated here, so
 * this keeps testing the real headlines as they are edited.
 *
 *   node tools/test-hero.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {}
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return await import(`file://${path.join(globalRoot, 'playwright', 'index.mjs')}`);
  } catch {}
  return null;
}

const pw = await loadPlaywright();
if (!pw) {
  console.log('SKIP  Playwright is not available here (checked the project and the global npm root).');
  console.log('      npm i -D playwright && npx playwright install chromium');
  process.exit(0);
}
const { chromium } = pw;

const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');

/** Pull the real hero copy out of each page. */
function heroesFromSource() {
  const pagesDir = path.join(root, 'src/app/(frontend)');
  const found = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'page.tsx') {
        const src = fs.readFileSync(full, 'utf8');
        const open = src.indexOf('<PageHero');
        if (open === -1) continue;
        // Everything up to the closing tag, so `children` is included.
        const close = src.indexOf('</PageHero>', open);
        const block = src.slice(open, close === -1 ? src.indexOf('/>', open) + 2 : close);

        // A compact hero has no cue at all, so there is nothing to collide.
        if (/\bcompact\b/.test(block)) continue;

        const grab = (name) => {
          const m = block.match(new RegExp(`${name}=(?:"([^"]*)"|\\{'([^']*)'\\})`));
          return m ? (m[1] ?? m[2]) : '';
        };

        found.push({
          route: path.relative(pagesDir, dir).replace(/\\/g, '/') || '/',
          eyebrow: grab('eyebrow'),
          title: grab('title'),
          intro: grab('intro'),
          hasButtons: /className="btn-row"/.test(block),
        });
      }
    }
  };

  walk(pagesDir);
  return found;
}

const heroes = heroesFromSource();

const page = (h) => `<!doctype html><html><head><meta charset="utf-8"><style>
${css}
.rv { opacity: 1 !important; transform: none !important; }
</style></head><body>
<section class="c-phero">
  <div class="wrap c-phero__in">
    <nav aria-label="Breadcrumb"><ol class="crumbs">
      <li><a href="/">Home</a></li><li aria-current="page">${h.eyebrow || 'Page'}</li>
    </ol></nav>
    <p class="eyebrow">${h.eyebrow}</p>
    <h1 class="h-xl" style="margin-top:1rem">${h.title}</h1>
    ${h.intro ? `<p class="lede" style="margin-top:1.3em">${h.intro}</p>` : ''}
    ${
      h.hasButtons
        ? `<div class="btn-row">
             <a class="btn btn--primary" href="/contact">Schedule an Enterprise Consultation</a>
             <a class="btn btn--ghost" href="/dhc">Start with a Data Health Check</a>
           </div>`
        : ''
    }
  </div>
  <span class="c-phero__cue" aria-hidden="true">Scroll
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 2v12M3 9l5 5 5-5"/></svg>
  </span>
</section>
</body></html>`;

// Deliberately includes short and cramped viewports. The bug lived at 360x640,
// which is a real Android size and one nobody opens on a desktop.
const VIEWPORTS = [
  [1440, 900], [1280, 800], [1024, 768], [834, 1112], [768, 1024],
  [430, 932], [414, 896], [390, 844], [375, 667], [360, 640], [320, 568],
];

const browser = await chromium.launch();
let pass = 0;
let fail = 0;

for (const h of heroes) {
  for (const [w, hh] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: hh } });
    const p = await ctx.newPage();
    await p.setContent(page(h));
    await p.waitForTimeout(60);

    const r = await p.evaluate(() => {
      const cue = document.querySelector('.c-phero__cue');
      const inner = document.querySelector('.c-phero__in');
      if (!cue || !inner) return null;
      if (getComputedStyle(cue).display === 'none') return { hidden: true };

      const c = cue.getBoundingClientRect();
      // Check against the last thing in the copy, whatever it is: buttons where
      // a page has them, otherwise the closing paragraph.
      const kids = [...inner.children];
      const last = kids[kids.length - 1];
      const b = last.getBoundingClientRect();
      return {
        hidden: false,
        gap: c.top - b.bottom,
        overlapsH: c.left < b.right && c.right > b.left,
      };
    });
    await ctx.close();

    if (!r || r.hidden) { pass++; continue; }

    const clear = !(r.gap < 0 && r.overlapsH);
    if (clear) pass++;
    else {
      fail++;
      console.log(
        `  FAIL  /${h.route} at ${w}x${hh}: the scroll cue overlaps the hero content by ${Math.abs(r.gap).toFixed(0)}px`,
      );
    }
  }
}

// A stress case, so this holds for copy nobody has written yet.
{
  const long = {
    route: '(synthetic long headline)',
    eyebrow: 'Data Engineering',
    title: 'Enterprise Data Engineering Consulting Services and Solutions for Organisations That Need Their Numbers to Agree With Each Other',
    intro:
      'A deliberately overlong introduction, several sentences of it, to be sure the hero survives copy longer than anything currently on the site. ' +
      'The point is not that anyone would write this, but that the layout should not break if they did, and that the failure would only ever appear on a phone.',
    hasButtons: true,
  };
  for (const [w, hh] of [[360, 640], [375, 667], [320, 568]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: hh } });
    const p = await ctx.newPage();
    await p.setContent(page(long));
    await p.waitForTimeout(60);
    const r = await p.evaluate(() => {
      const cue = document.querySelector('.c-phero__cue');
      const inner = document.querySelector('.c-phero__in');
      if (getComputedStyle(cue).display === 'none') return { hidden: true };
      const c = cue.getBoundingClientRect();
      const kids = [...inner.children];
      const b = kids[kids.length - 1].getBoundingClientRect();
      return { hidden: false, gap: c.top - b.bottom, overlapsH: c.left < b.right && c.right > b.left };
    });
    await ctx.close();
    if (r.hidden || !(r.gap < 0 && r.overlapsH)) pass++;
    else {
      fail++;
      console.log(`  FAIL  ${long.route} at ${w}x${hh}: overlaps by ${Math.abs(r.gap).toFixed(0)}px`);
    }
  }
}

await browser.close();

console.log(`\n${heroes.length} hero(es) x ${VIEWPORTS.length} viewports, plus 3 stress cases`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
