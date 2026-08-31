/**
 * Automated audit of the rendered site.
 *
 * Two halves, because they can see different things:
 *
 *   DOM checks   run against the real rendered pages in a browser, where
 *                computed styles, sizes and stacking are available.
 *   Source checks parse the page files, because Next's metadata (titles,
 *                canonicals, Open Graph) never reaches the preview harness's
 *                own HTML shell and cannot be inspected in the DOM.
 *
 * Findings are grouped by severity so a real defect is not buried under
 * stylistic noise.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  try {
    ({ chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright'));
  } catch {
    console.log('SKIP  Playwright not installed.');
    process.exit(0);
  }
}

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const preview = path.resolve(root, '..', 'preview');
const launchOpts = fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};

const findings = [];
const add = (severity, area, where, message) => findings.push({ severity, area, where, message });

// ---------------------------------------------------------------- source ---

const frontend = path.join(root, 'src', 'app', '(frontend)');
const pageFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'page.tsx') pageFiles.push(p);
  }
})(frontend);

const titles = new Map();
const descriptions = new Map();

for (const file of pageFiles) {
  const rel = file.replace(frontend + '/', '').replace('/page.tsx', '') || '/';
  const src = fs.readFileSync(file, 'utf8');
  const isDynamic = rel.includes('[');

  const hasMetadata = /export const metadata|export async function generateMetadata/.test(src);
  if (!hasMetadata) add('high', 'seo', rel, 'no metadata export: the page inherits the site default title and description');

  if (!isDynamic) {
    const t = src.match(/title:\s*'([^']+)'|title:\s*"([^"]+)"/);
    const title = t && (t[1] || t[2]);
    if (title) {
      if (title.length > 60) add('low', 'seo', rel, `title is ${title.length} chars, Google truncates around 60: "${title}"`);
      if (titles.has(title)) add('high', 'seo', rel, `duplicate title, also used by ${titles.get(title)}`);
      titles.set(title, rel);
    }

    const d = src.match(/description:\s*\n?\s*'([^']+)'/);
    const desc = d && d[1];
    if (desc) {
      if (desc.length > 165) add('low', 'seo', rel, `meta description is ${desc.length} chars, truncated around 160`);
      if (desc.length < 70) add('low', 'seo', rel, `meta description is only ${desc.length} chars`);
      if (descriptions.has(desc)) add('high', 'seo', rel, `duplicate meta description, also used by ${descriptions.get(desc)}`);
      descriptions.set(desc, rel);
    }

    if (!/alternates:\s*{\s*canonical/.test(src)) add('med', 'seo', rel, 'no canonical URL declared');
    if (!/openGraph/.test(src) && rel !== 'privacy-policy') add('low', 'seo', rel, 'no Open Graph block, social shares fall back to the site default');
  }
}

// Routes declared for the sitemap vs routes that actually exist on disk.
const siteSrc = fs.readFileSync(path.join(root, 'src', 'lib', 'site.ts'), 'utf8');
const declared = [...siteSrc.matchAll(/\{\s*path:\s*'([^']+)'/g)].map((m) => m[1]);
const onDisk = pageFiles
  .map((f) => f.replace(frontend, '').replace('/page.tsx', ''))
  .map((p) => (p === '' ? '/' : p))
  .filter((p) => !p.includes('['));

for (const p of declared) {
  if (!onDisk.includes(p)) add('high', 'routing', p, 'listed in the sitemap but no page file exists');
}
for (const p of onDisk) {
  if (!declared.includes(p)) add('med', 'seo', p, 'page exists but is not in the sitemap, search engines will not be told about it');
}

// ------------------------------------------------------------------- DOM ---

const MIME = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  const f = path.join(preview, (q.url || '/').split('?')[0]);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.writeHead(404).end();
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(r);
});
await new Promise((r) => server.listen(5610, r));

const browser = await chromium.launch(launchOpts);
const pages = fs.readdirSync(preview).filter((f) => f.endsWith('.html'));

// Say so when the real typefaces are unavailable. Every size and height below
// is then measured against a fallback face, which is close but not exact.
{
  const probe = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await probe.goto(`http://127.0.0.1:5610/${pages[0]}`, { waitUntil: 'load' });
  await probe.waitForTimeout(800);
  const realFont = await probe.evaluate(() => {
    const mk = (f) => {
      const s = document.createElement('span');
      s.textContent = 'Cognovea Data Intelligence';
      s.style.cssText = `position:absolute;visibility:hidden;font-size:40px;font-family:${f}`;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return Math.round(w);
    };
    return mk("'Sora'") !== mk('serif');
  });
  if (!realFont) {
    console.log(
      'NOTE  Sora/Inter did not load in this environment, so text is measured with\n' +
        '      fallback metrics. Sizes and heights below are approximate; contrast,\n' +
        '      structure and link checks are unaffected.',
    );
  }
  await probe.close();
}
const knownRoutes = new Set([...onDisk, '/']);

for (const width of [1440, 390]) {
for (const pg of pages) {
  const name = pg.replace('.html', '');
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  await p.goto(`http://127.0.0.1:5610/${pg}`, { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('.rv').forEach((e) => e.setAttribute('data-rv','in')));

  const res = await p.evaluate(() => {
    const out = {};
    const txt = (el) => (el.textContent || '').trim();

    out.imagesNoAlt = [...document.querySelectorAll('img')]
      .filter((i) => !i.hasAttribute('alt'))
      .map((i) => i.getAttribute('src'));

    out.imagesNoDims = [...document.querySelectorAll('img')]
      .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
      .filter((i) => {
        const cs = getComputedStyle(i);
        return cs.position !== 'absolute';
      })
      .map((i) => i.getAttribute('src'));

    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    out.duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);

    out.h1s = [...document.querySelectorAll('h1')].map(txt);

    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
      level: Number(h.tagName[1]),
      text: txt(h).slice(0, 48),
    }));
    out.headingSkips = [];
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].level - levels[i - 1].level > 1) {
        out.headingSkips.push(`h${levels[i - 1].level} -> h${levels[i].level} at "${levels[i].text}"`);
      }
    }

    out.emptyLinks = [...document.querySelectorAll('a')]
      .filter((a) => !txt(a) && !a.querySelector('img,svg') && !a.getAttribute('aria-label'))
      .map((a) => a.getAttribute('href'));

    out.blankNoRel = [...document.querySelectorAll('a[target="_blank"]')]
      .filter((a) => !(a.getAttribute('rel') || '').includes('noopener'))
      .map((a) => a.getAttribute('href'));

    out.internalHrefs = [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href'));

    out.unlabelledInputs = [...document.querySelectorAll('input,select,textarea')]
      .filter((i) => i.type !== 'hidden')
      .filter((i) => {
        if (i.getAttribute('aria-label') || i.getAttribute('aria-labelledby')) return false;
        return !(i.id && document.querySelector(`label[for="${i.id}"]`));
      })
      .map((i) => i.name || i.tagName);

    out.buttonsNoName = [...document.querySelectorAll('button')]
      .filter((b) => !txt(b) && !b.getAttribute('aria-label') && !b.querySelector('[aria-label]'))
      .map((b) => b.className);

    // Tiny text and small tap targets.
    out.tinyText = [];
    for (const el of document.querySelectorAll('p,li,span,a,small,td,label')) {
      if (!txt(el) || el.children.length) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size && size < 11.5) out.tinyText.push(`${size}px "${txt(el).slice(0, 34)}"`);
    }

    out.smallTargets = [...document.querySelectorAll('a,button')]
      .filter((el) => {
        // WCAG 2.2 target-size exempts a link sitting inline within a sentence,
        // where enlarging it would break the line box. Only standalone controls
        // are judged.
        const cs = getComputedStyle(el);
        if (cs.display === 'inline' && el.closest('p,li,td,figcaption')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
      })
      .map((el) => `${el.tagName.toLowerCase()} "${txt(el).slice(0, 24)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);

    // JSON-LD shape.
    out.jsonld = [];
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(s.textContent);
        for (const node of Array.isArray(data) ? data : [data]) {
          out.jsonld.push({ type: node['@type'], keys: Object.keys(node) });
        }
      } catch (e) {
        out.jsonld.push({ error: e.message });
      }
    }

    // Contrast. Walks up for the first opaque background; where an element sits
    // on a gradient this uses the solid colour underneath it, which is the
    // darkest or lightest the text will ever sit on in this design, so the
    // figure is representative rather than exact.
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(',').map((v) => parseFloat(v));
      return { r, g, b, a };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const bgOf = (el) => {
      let n = el;
      while (n && n !== document.documentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a === 1) return c;
        n = n.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    };

    out.contrast = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('p,h1,h2,h3,h4,li,a,span,small,label,button,td,th')) {
      const t = txt(el);
      if (!t || el.children.length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.9) continue;
      const clip = cs.webkitBackgroundClip || cs.backgroundClip;
      if (clip === 'text') continue;
      if (parse(cs.color)?.a === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      const fgRaw = parse(cs.color);
      if (!fgRaw) continue;
      const bg = bgOf(el);
      const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
      const L1 = lum(fg);
      const L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);

      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;

      if (ratio < need) {
        const key = `${cs.color}|${Math.round(size)}|${(el.className || '').toString().split(' ')[0]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const hex = (c) =>
          '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
        out.contrast.push(
          `${ratio.toFixed(2)}:1 (needs ${need}) ${Math.round(size)}px ` +
            `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0] || '-'} ` +
            `${hex(fg)} on ${hex(bg)} "${t.slice(0, 30)}"`,
        );
      }
    }

    // The logo tagline wrapping is invisible in code review and obvious in the
    // header. Raising its font-size for legibility once pushed it to two lines.
    const tag = document.querySelector('.logo__tag');
    if (tag) {
      const cs = getComputedStyle(tag);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      const lines = Math.round(tag.getBoundingClientRect().height / lh);
      out.logoLines = lines;
    }

    // Every logo must occupy an identical box. Getting this wrong is invisible
    // in code review and obvious on the page, and it took three attempts:
    // max-height on a grid item was ignored, then a percentage height resolved
    // against an overflowing grid row instead of the item.
    const logoItems = [...document.querySelectorAll('.c-logos__list li')];
    if (logoItems.length > 1) {
      const boxes = logoItems.map((li) => {
        const r = li.getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)}`;
      });
      out.logoBoxes = [...new Set(boxes)];
      out.logoOverflow = logoItems
        .map((li) => {
          const img = li.querySelector('img');
          if (!img) return null;
          const a = li.getBoundingClientRect();
          const b = img.getBoundingClientRect();
          return b.height > a.height + 1 || b.width > a.width + 1
            ? `${img.alt}: image ${Math.round(b.width)}x${Math.round(b.height)} exceeds box ${Math.round(a.width)}x${Math.round(a.height)}`
            : null;
        })
        .filter(Boolean);
    }

    out.landmarks = {
      main: document.querySelectorAll('main').length,
      nav: document.querySelectorAll('nav').length,
      footer: document.querySelectorAll('footer').length,
    };

    return out;
  });

  const desktopOnly = width === 1440;
  if (desktopOnly)
  for (const src of res.imagesNoAlt) add('high', 'a11y', name, `image has no alt attribute: ${src}`);
  for (const src of res.imagesNoDims) add('med', 'perf', name, `image without width/height, causes layout shift: ${src}`);
  for (const id of [...new Set(res.duplicateIds)]) add('high', 'html', name, `duplicate id "${id}", breaks anchors and label association`);
  // Fixtures are components rendered on their own, not pages: no h1, no <main>.
  const isFixture = /^(consent-banner|logos-|quote)/.test(name);
  if (!isFixture && res.h1s.length === 0) add('high', 'a11y', name, 'no h1 on the page');
  if (res.h1s.length > 1) add('high', 'a11y', name, `${res.h1s.length} h1 elements: ${res.h1s.map((t) => `"${t.slice(0, 30)}"`).join(', ')}`);
  for (const s of res.headingSkips) add('med', 'a11y', name, `heading level skipped: ${s}`);
  for (const h of res.emptyLinks) add('high', 'a11y', name, `link with no accessible text: href="${h}"`);
  for (const h of res.blankNoRel) add('med', 'security', name, `target="_blank" without rel="noopener": ${h}`);
  for (const n of res.unlabelledInputs) add('high', 'a11y', name, `form control with no label: ${n}`);
  for (const c of res.buttonsNoName) add('high', 'a11y', name, `button with no accessible name: .${String(c).split(' ')[0]}`);
  for (const t of [...new Set(res.tinyText)].slice(0, 3)) add('low', 'a11y', name, `text below 11.5px: ${t}`);
  for (const t of [...new Set(res.smallTargets)].slice(0, 3)) add('low', 'a11y', name, `tap target under 24px: ${t}`);
  for (const c of res.contrast.slice(0, 4)) add('high', 'a11y', `${name} @${width}`, `contrast below WCAG AA: ${c}`);
  if (res.logoBoxes && res.logoBoxes.length > 1)
    add('med', 'design', `${name} @${width}`, `logo boxes are not uniform: ${res.logoBoxes.join(', ')}`);
  for (const o of res.logoOverflow ?? [])
    add('high', 'design', `${name} @${width}`, `logo overflows its box, ${o}`);
  if (res.logoLines > 1) add('med', 'design', `${name} @${width}`, `logo tagline wraps onto ${res.logoLines} lines`);
  if (!isFixture && res.landmarks.main !== 1)
    add('med', 'a11y', name, `expected exactly one <main>, found ${res.landmarks.main}`);

  for (const href of [...new Set(res.internalHrefs)]) {
    const clean = href.split('#')[0].replace(/\/$/, '') || '/';
    if (!knownRoutes.has(clean)) add('high', 'routing', name, `link to a route that does not exist: ${href}`);
  }

  if (desktopOnly)
  for (const j of res.jsonld) {
    if (j.error) add('high', 'seo', name, `invalid JSON-LD: ${j.error}`);
    if (j.type === 'JobPosting') {
      for (const req of ['title', 'description', 'datePosted', 'validThrough', 'hiringOrganization']) {
        if (!j.keys.includes(req)) add('med', 'seo', name, `JobPosting missing required field "${req}"`);
      }
    }
    if (j.type === 'BlogPosting') {
      for (const req of ['headline', 'datePublished', 'author', 'publisher']) {
        if (!j.keys.includes(req)) add('med', 'seo', name, `BlogPosting missing required field "${req}"`);
      }
    }
  }

  await p.close();
}
}

await browser.close();
server.close();

// ---------------------------------------------------------------- report ---

const order = { high: 0, med: 1, low: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.area.localeCompare(b.area));

const counts = { high: 0, med: 0, low: 0 };
for (const f of findings) counts[f.severity]++;

// Collapse findings that repeat verbatim across many pages.
const grouped = new Map();
for (const f of findings) {
  const key = `${f.severity}|${f.area}|${f.message}`;
  if (!grouped.has(key)) grouped.set(key, { ...f, pages: [] });
  grouped.get(key).pages.push(f.where);
}

console.log(`\n${findings.length} findings: ${counts.high} high, ${counts.med} medium, ${counts.low} low\n`);
let last = '';
for (const g of grouped.values()) {
  if (g.severity !== last) {
    console.log(`\n--- ${g.severity.toUpperCase()} ---`);
    last = g.severity;
  }
  const where = g.pages.length > 3 ? `${g.pages.length} pages` : g.pages.join(', ');
  console.log(`  [${g.area}] ${where}: ${g.message}`);
}
console.log('');
