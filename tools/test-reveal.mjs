/**
 * Proves the reveal observer reveals content taller than the viewport.
 *
 * The bug this exists for: IntersectionObserver's `threshold` is a fraction of
 * the OBSERVED ELEMENT's area, not of the viewport. An article body is a single
 * `.rv` element that can be many thousands of pixels tall, and a phone can only
 * ever show a few percent of it at once. With `threshold: 0.08` that fraction
 * was never reached, the callback never fired, and the entire article stayed at
 * opacity 0 while the page returned a perfectly healthy 200.
 *
 * It survived because it depends on both a long article and a narrow screen.
 * Desktop was fine. A short article was fine on both.
 *
 * The observer options are parsed out of the real Reveal.tsx rather than
 * duplicated here, so reintroducing a fractional threshold fails this test.
 *
 *   node tools/test-reveal.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { requirePlaywright } from './lib/playwright.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

const { chromium, launchOpts } = await requirePlaywright('test-reveal');

// --- read the real options out of the component -----------------------------
const reveal = fs.readFileSync(path.join(root, 'src/components/Reveal.tsx'), 'utf8');
const match = reveal.match(/\{\s*rootMargin:\s*'([^']+)',\s*threshold:\s*([\d.]+)\s*\}/);
if (!match) {
  console.log('FAIL  Could not find the IntersectionObserver options in Reveal.tsx.');
  console.log('      If they were refactored, update this test to match.');
  process.exit(1);
}
const [, rootMargin, thresholdRaw] = match;
const threshold = Number(thresholdRaw);

console.log(`Reveal.tsx uses rootMargin: '${rootMargin}', threshold: ${threshold}`);

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

// A fractional threshold is the defect itself, regardless of what the browser
// then does with it. Stated separately so the reason is legible on failure.
ok(
  'threshold is 0, so element height cannot prevent a reveal',
  threshold === 0,
  `threshold ${threshold} needs ${(threshold * 100).toFixed(0)}% of the element on screen; ` +
    `an article ${Math.round(743 / threshold || 0)}px tall or more can never reach that on a phone`,
);

// --- and prove it in a real browser -----------------------------------------
const page = (paragraphs) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { margin: 0; font: 16px/1.6 system-ui; }
  .spacer { height: 100vh; background: #eee; }
  .rv { opacity: 0; transform: translateY(26px); transition: opacity .3s, transform .3s; }
  .rv[data-rv='in'] { opacity: 1; transform: none; }
  .measure { max-width: 46rem; margin: 0 auto; padding: 0 1rem; }
</style></head><body>
  <div class="spacer">hero</div>
  <div class="rv measure" id="article">
    ${'<p>Body copy that makes this element considerably taller than the viewport.</p>'.repeat(paragraphs)}
  </div>
  <script>
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.setAttribute('data-rv','in'); });
    }, { rootMargin: '${rootMargin}', threshold: ${threshold} });
    document.querySelectorAll('.rv').forEach((n) => io.observe(n));
  </script>
</body></html>`;

const browser = await chromium.launch(launchOpts);

async function revealsAt(width, height, paragraphs) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();
  await p.setContent(page(paragraphs));
  // Scroll the article into view, as a reader would.
  await p.evaluate(() => document.getElementById('article').scrollIntoView());
  await p.waitForTimeout(400);
  const result = await p.evaluate(() => {
    const el = document.getElementById('article');
    return {
      isIn: el.getAttribute('data-rv') === 'in',
      opacity: getComputedStyle(el).opacity,
      heightPx: el.getBoundingClientRect().height,
    };
  });
  await ctx.close();
  return result;
}

// The real-world case: a long article on a phone.
{
  const r = await revealsAt(390, 844, 400);
  ok(
    `a ${Math.round(r.heightPx)}px article reveals on a 390px phone`,
    r.isIn && r.opacity === '1',
    `data-rv: ${r.isIn}, opacity: ${r.opacity} — this is the reported bug`,
  );
}

// An extreme length, to be sure the fix is not merely a bigger margin.
{
  const r = await revealsAt(390, 844, 2000);
  ok(
    `a ${Math.round(r.heightPx)}px article still reveals on a phone`,
    r.isIn && r.opacity === '1',
    `data-rv: ${r.isIn}, opacity: ${r.opacity}`,
  );
}

// The case that always worked, which must keep working.
{
  const r = await revealsAt(1440, 900, 400);
  ok('a long article reveals on a 1440px desktop', r.isIn && r.opacity === '1');
}

// A short element, the ordinary case.
{
  const r = await revealsAt(390, 844, 3);
  ok('a short block reveals on a phone', r.isIn && r.opacity === '1');
}

/* --- hydration safety ------------------------------------------------------

   The reveal runs from an IntersectionObserver, which for anything inside a
   <Suspense> boundary can fire before React has hydrated that node. Anything it
   writes that React also renders is then a hydration mismatch: React finds an
   attribute it did not produce, reports it, and declines to patch it up. That
   is exactly what happened when the state was a class — the streamed testimonial
   card was revealed before it was hydrated.

   So the invariant is not "use a data attribute" but "touch nothing React
   owns". Asserted two ways, because the source check alone would pass on a
   component that had grown a second, sneakier write. */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.setContent(page(3));
  const before = await p.evaluate(() => {
    const el = document.getElementById('article');
    return { cls: el.getAttribute('class'), style: el.getAttribute('style') };
  });
  await p.evaluate(() => document.getElementById('article').scrollIntoView());
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => {
    const el = document.getElementById('article');
    return {
      cls: el.getAttribute('class'),
      style: el.getAttribute('style'),
      revealed: el.getAttribute('data-rv') === 'in',
      opacity: getComputedStyle(el).opacity,
    };
  });
  await ctx.close();

  ok('the reveal actually happened', after.revealed && after.opacity === '1');
  ok(
    'revealing leaves className byte-identical',
    before.cls === after.cls,
    `before "${before.cls}" -> after "${after.cls}" — React owns this prop`,
  );
  ok(
    'revealing writes no style attribute',
    before.style === after.style,
    `an element with no style prop that gains one is the same hydration hazard`,
  );
}

/* And the component itself, so a future edit cannot reintroduce the write in a
   path this harness does not exercise. */
{
  const body = reveal.slice(reveal.indexOf('useEffect'));
  ok(
    'Reveal.tsx never writes a class to a revealable element',
    !/classList\.(add|remove|toggle)\s*\(\s*['"`](?!rv-ready)/.test(body),
    'className is a React-owned prop on .rv elements',
  );
  ok(
    'Reveal.tsx never writes inline style to a revealable element',
    !/\bel\.style\b|\bn\.style\b/.test(body),
    'the stagger belongs in the stylesheet, keyed off data-rv-i',
  );
  ok(
    'the stylesheet has a delay rule for every index Reveal can emit',
    (() => {
      const cap = Number(reveal.match(/Math\.min\(Math\.max\(index, 0\), (\d+)\)/)?.[1] ?? -1);
      if (cap < 1) return false;
      const css = fs.readFileSync(path.join(root, 'src/app/(frontend)/globals.css'), 'utf8');
      for (let i = 1; i <= cap; i++) if (!css.includes(`[data-rv-i='${i}']`)) return false;
      return true;
    })(),
    'an index with no rule silently loses its stagger',
  );
}

await browser.close();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
