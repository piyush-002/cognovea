/**
 * Verifies that position: sticky actually sticks.
 *
 * This exists because all three sticky elements on the site were silently dead
 * for weeks. They were declared correctly; `body { overflow-x: hidden }` turned
 * the body into a scroll container, and sticky descendants then anchor to that
 * instead of the viewport. Nothing errors, nothing logs, the CSS looks right in
 * devtools. The only way to catch it is to scroll and measure.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { requirePlaywright } from './lib/playwright.mjs';

const require = createRequire(import.meta.url);

/**
 * Resolve Playwright from wherever it happens to live rather than a fixed path.
 * A test that only runs on the machine it was written on proves nothing, so if
 * it is genuinely unavailable this skips loudly instead of failing.
 */
const { chromium, launchOpts } = await requirePlaywright('test-sticky');

const here = path.dirname(new URL(import.meta.url).pathname);
const dir = path.resolve(here, '..', '..', 'preview');
if (!fs.existsSync(dir)) {
  console.log('SKIP  No preview build found. Run: node tools/build-preview.mjs && node .preview-bundle.cjs');
  process.exit(0);
}
const MIME = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  const f = path.join(dir, (q.url || '/').split('?')[0]);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.writeHead(404).end();
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(r);
});
await new Promise((r) => server.listen(5599, r));

const browser = await chromium.launch(launchOpts);
let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ': ' + detail : ''}`);
  }
};

const pages = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));

// --- 1. The nav pins to the top of the viewport on every page ---------------
for (const pg of pages) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`http://127.0.0.1:5599/${pg}`, { waitUntil: 'load' });
  await p.evaluate(() => {
    document.querySelectorAll('.rv').forEach((e) => e.classList.add('is-in'));
    document.documentElement.style.scrollBehavior = 'auto';
  });

  const height = await p.evaluate(() => document.body.scrollHeight);
  if (height < 2000) {
    await p.close();
    continue;
  }

  await p.evaluate(() => window.scrollTo(0, 1500));
  await p.waitForTimeout(200);
  const navTop = await p.evaluate(() => {
    const n = document.querySelector('.c-nav');
    return n ? Math.round(n.getBoundingClientRect().top) : null;
  });
  check(`nav stays pinned on ${pg}`, navTop !== null && Math.abs(navTop) <= 2, `top=${navTop}px after scrolling 1500px`);
  await p.close();
}

// --- 2. The rail's step list holds while its panels scroll ------------------
for (const pg of pages) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`http://127.0.0.1:5599/${pg}`, { waitUntil: 'load' });
  await p.evaluate(() => {
    document.querySelectorAll('.rv').forEach((e) => e.classList.add('is-in'));
    document.documentElement.style.scrollBehavior = 'auto';
  });

  const hasRail = await p.evaluate(() => Boolean(document.querySelector('.rail__nav')));
  if (!hasRail) {
    await p.close();
    continue;
  }

  const result = await p.evaluate(async () => {
    const rail = document.querySelector('.rail');
    const nav = document.querySelector('.rail__nav');
    const railBox = rail.getBoundingClientRect();
    const start = window.scrollY + railBox.top - 200;

    const tops = [];
    // Walk down through the rail, sampling where the step list sits.
    for (let i = 0; i < 6; i++) {
      window.scrollTo(0, start + i * 260);
      await new Promise((r) => setTimeout(r, 120));
      tops.push(Math.round(nav.getBoundingClientRect().top));
    }
    return { tops, railHeight: Math.round(railBox.height) };
  });

  // Once stuck, the list should hold one constant offset rather than sliding up.
  const settled = result.tops.slice(2);
  const spread = Math.max(...settled) - Math.min(...settled);
  check(
    `rail step list sticks on ${pg}`,
    spread <= 4,
    `offsets ${result.tops.join(', ')} (spread ${spread}px, rail ${result.railHeight}px tall)`,
  );
  await p.close();
}

// --- 3. A feature image tracks its prose instead of sitting in a hole -------
for (const pg of pages) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`http://127.0.0.1:5599/${pg}`, { waitUntil: 'load' });
  await p.evaluate(() => {
    document.querySelectorAll('.rv').forEach((e) => e.classList.add('is-in'));
    document.documentElement.style.scrollBehavior = 'auto';
  });

  const res = await p.evaluate(async () => {
    const media = [...document.querySelectorAll('.feature__media')].find((m) => {
      const f = m.closest('.feature');
      return f && f.getBoundingClientRect().height > 700;
    });
    if (!media) return null;

    // A sticky element only holds while its containing block still has room
    // beneath it. Sampling at fixed intervals walked past the end of the
    // section and then reported the perfectly correct release as a failure.
    const section = media.closest('.feature');
    const travel = section.getBoundingClientRect().height - media.getBoundingClientRect().height;
    if (travel < 200) return null;

    const box = section.getBoundingClientRect();
    const start = window.scrollY + box.top - 150;
    const step = Math.floor((travel - 40) / 3);

    const tops = [];
    for (let i = 0; i < 4; i++) {
      window.scrollTo(0, start + i * step);
      await new Promise((r) => setTimeout(r, 120));
      tops.push(Math.round(media.getBoundingClientRect().top));
    }
    return tops;
  });

  if (res) {
    const settled = res.slice(1);
    const spread = Math.max(...settled) - Math.min(...settled);
    check(`feature image sticks on ${pg}`, spread <= 6, `offsets ${res.join(', ')} (spread ${spread}px)`);
  }
  await p.close();
}

// --- 4. Changing body overflow must not reintroduce horizontal scrolling ----
for (const w of [390, 768, 1440]) {
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  for (const pg of pages) {
    await p.goto(`http://127.0.0.1:5599/${pg}`, { waitUntil: 'load' });
    await p.evaluate(() => {
    document.querySelectorAll('.rv').forEach((e) => e.classList.add('is-in'));
    document.documentElement.style.scrollBehavior = 'auto';
  });
    const over = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    check(`no horizontal overflow ${w}px ${pg}`, !over);
  }
  await p.close();
}

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
