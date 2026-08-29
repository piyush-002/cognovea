/**
 * Resolves what each page's <title> and og:title actually become, and checks
 * they agree and read sensibly.
 *
 * Two things make this worth automating rather than reading. Next applies the
 * root layout's `title.template` to every child page's title, so what a page
 * file says is not what the browser tab shows — a page whose own title already
 * ends in the brand gets the brand appended a second time, and nothing in the
 * page file hints at it. And og:title is declared separately from title, so
 * the two drift apart silently; platforms pick whichever they prefer, so a
 * link can preview under a different headline than the page ranks under.
 *
 *   node tools/test-titles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const pagesDir = path.join(root, 'src/app/(frontend)');

/** The template and default from the root layout. */
function rootMetadata() {
  const src = fs.readFileSync(path.join(pagesDir, 'layout.tsx'), 'utf8');
  const template = src.match(/template:\s*'([^']+)'/)?.[1] ?? '%s';
  const fallback = src.match(/default:\s*'([^']+)'/)?.[1] ?? '';
  const ogTitle = src.match(/openGraph:\s*\{[\s\S]*?title:\s*'([^']+)'/)?.[1] ?? null;
  return { template, fallback, ogTitle };
}

/** Every page's own declared title and og:title. */
function pages() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'page.tsx') {
        const src = fs.readFileSync(full, 'utf8');
        const route = '/' + path.relative(pagesDir, dir).replace(/\\/g, '/');

        // Only statically declared metadata; a generateMetadata page is
        // resolved per document and cannot be checked from source.
        const block = src.match(/export const metadata: Metadata = \{[\s\S]*?\n\};/)?.[0];
        if (!block) continue;

        const title = block.match(/^\s{2}title:\s*'([^']+)'/m)?.[1] ?? null;
        const og = block.match(/openGraph:\s*\{[\s\S]*?title:\s*'([^']+)'/)?.[1] ?? null;
        out.push({ route: route === '/.' ? '/' : route, title, og });
      }
    }
  };
  walk(pagesDir);
  return out.sort((a, b) => a.route.localeCompare(b.route));
}

const { template, fallback, ogTitle: rootOg } = rootMetadata();
const BRAND = 'Cognovea';
const list = pages();

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
  }
};

const resolve = (t) => (t ? template.replace('%s', t) : fallback);

console.log(`Root template: ${JSON.stringify(template)}\n`);
console.log('route                          resolved <title>');
console.log('-'.repeat(96));
for (const p of list) {
  const r = resolve(p.title);
  console.log(`${p.route.padEnd(30)} ${r}`);
}
console.log('');

for (const p of list) {
  const resolved = resolve(p.title);

  // The brand appearing twice in one title tag. Invisible in the page file,
  // because half of it comes from the layout.
  const occurrences = resolved.split(BRAND).length - 1;
  ok(
    `${p.route}: the brand appears at most once in the title`,
    occurrences <= 1,
    `resolved to "${resolved}" (${occurrences}x "${BRAND}")`,
  );

  // Google truncates around 60 characters. Longer is not an error, but a
  // title whose distinguishing half is cut off is not doing its job.
  ok(
    `${p.route}: the title fits what search results display`,
    resolved.length <= 62,
    `${resolved.length} chars: "${resolved}"`,
  );

  // og:title against the resolved title. A page with no og:title inherits the
  // layout's, which is fine only if it matches.
  const effectiveOg = p.og ?? rootOg;
  ok(
    `${p.route}: og:title matches the title`,
    effectiveOg === resolved,
    `title:    "${resolved}"\n        og:title: "${effectiveOg}"`,
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
