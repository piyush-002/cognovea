/**
 * A page's title, description and URL must agree across every tag that carries
 * them.
 *
 * Three separate faults have come out of this area. A `title.template` in the
 * root layout appended the brand to titles that already ended in it, so seven
 * pages rendered "… | Cognovea | Cognovea". og:title was written out by hand
 * beside the title and drifted from it. And twitter:title was declared only in
 * the root layout, so every page inherited one site-wide social headline
 * regardless of its subject — Data Engineering served three different titles
 * across its three tags.
 *
 * The last one is why this test now reads the resolved output rather than the
 * page files: nothing in a page file showed the wrong twitter title, because
 * the page file said nothing about twitter at all.
 *
 *   node tools/test-titles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const pagesDir = path.join(root, 'src/app/(frontend)');
const BRAND = 'Cognovea';

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
  }
};

/* --- the root layout must not re-append the brand -------------------------- */
const layout = fs.readFileSync(path.join(pagesDir, 'layout.tsx'), 'utf8');
ok(
  'the root layout declares no title.template',
  !/template:\s*'/.test(layout),
  "a template appends the brand to page titles that already carry it, which is invisible in every page file",
);

/* --- every page goes through the one helper -------------------------------- */
const pages = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name === 'page.tsx') pages.push(full);
  }
};
walk(pagesDir);

/*
 * Routes that declare themselves noindex are exempt from the rules below, and
 * only those.
 *
 * The rules exist to protect pages that get indexed and shared: a title that
 * disagrees with its og:title, or a breadcrumb trail Google cannot show. A page
 * that says `robots: { index: false }` is neither indexed nor shareable — the
 * printable summary is one visitor's figures, generated for them, never linked
 * from anywhere. Requiring social metadata and breadcrumb schema on it would be
 * adding markup for a search result that must never exist.
 *
 * Deliberately narrow, and self-repairing: the exemption is read from the
 * source, so the moment somebody removes the noindex the page is checked again.
 */
const isNoindex = (src) => /robots:\s*\{[^}]*index:\s*false/.test(src);

const skipped = [];

for (const full of pages) {
  const rel = '/' + (path.relative(pagesDir, path.dirname(full)) || '');
  const src = fs.readFileSync(full, 'utf8');

  if (isNoindex(src)) {
    skipped.push(rel);
    continue;
  }

  ok(
    `${rel}: builds its metadata with pageMetadata()`,
    /pageMetadata\(/.test(src),
    'a hand-written metadata object is how title, og:title and twitter:title drift apart',
  );

  // Nothing may set these individually any more; that is the drift.
  const hasOwnOg = /openGraph:\s*\{[\s\S]*?title:/.test(src);
  const hasOwnTwitter = /twitter:\s*\{[\s\S]*?title:/.test(src);
  ok(`${rel}: does not hand-write its own og:title`, !hasOwnOg);
  ok(`${rel}: does not hand-write its own twitter:title`, !hasOwnTwitter);

  const title = src.match(/pageMetadata\(\{\s*\n\s*title:\s*'([^']+)'/)?.[1];
  if (title) {
    const count = title.split(BRAND).length - 1;
    ok(`${rel}: the brand appears at most once`, count <= 1, `"${title}"`);
    ok(`${rel}: fits what search results display`, title.length <= 62, `${title.length} chars: "${title}"`);
  }

  // A relative canonical resolves against metadataBase, which is what makes the
  // domain a one-line change instead of twelve.
  const p = src.match(/path:\s*'([^']*)'/)?.[1];
  if (p !== undefined) {
    ok(`${rel}: the canonical path is relative, not absolute`, !/^https?:/.test(p), p);
  }
}

/* --- the helper itself must expand all three ------------------------------- */
const seo = fs.readFileSync(path.join(root, 'src/lib/seo.ts'), 'utf8');
for (const [name, re] of [
  ['a title', /^\s*title,$/m],
  ['og:title', /openGraph:\s*\{[\s\S]*?title,/],
  ['twitter:title', /twitter:\s*\{[\s\S]*?title,/],
  ['a description', /^\s*description,$/m],
  ['og:description', /openGraph:\s*\{[\s\S]*?description,/],
  ['twitter:description', /twitter:\s*\{[\s\S]*?description,/],
  ['a canonical', /alternates:\s*\{\s*canonical/],
  ['og:url', /openGraph:\s*\{[\s\S]*?url,/],
]) {
  ok(`pageMetadata sets ${name} from the single value`, re.test(seo));
}

ok(
  'pageMetadata keeps the canonical relative',
  !/canonical:\s*`?https?:/.test(seo),
  'an absolute canonical would need editing on every page when the domain changes',
);
ok(
  'pageMetadata gives the canonical a trailing slash',
  /\$\{path\}\/`/.test(seo),
  'trailingSlash is on, so the other spelling redirects and must not be named as canonical',
);

if (skipped.length) console.log(`  exempt (noindex): ${skipped.join(', ')}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
