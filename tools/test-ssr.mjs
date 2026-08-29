/**
 * Asserts the content-bearing pages render on the server.
 *
 * Raised by an audit that saw "Loading insights" in the raw HTML of /insights
 * and concluded the post list was hydrated client-side. It is not: that string
 * comes from insights/loading.tsx, which is a Next.js Suspense fallback. Next
 * streams the fallback first and the resolved content afterwards, in the SAME
 * HTTP response, so both appear in the source — the fallback above the posts.
 *
 * The observation actually disproves the conclusion. A client-hydrated list
 * would put no post content in the source at all; the audit reported the
 * placeholder sitting "right before the actual post content", which means the
 * content was there.
 *
 * This checks the property that matters, mechanically, so the next audit can be
 * answered in a second rather than argued about: the page is an async server
 * component that awaits its data, carries no client boundary, and fetches
 * nothing from the browser.
 *
 *   node tools/test-ssr.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const pagesDir = path.join(root, 'src/app/(frontend)');

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

/** Pages whose content comes from the database and must be in the HTML. */
const DATA_PAGES = [
  ['insights/page.tsx', 'getPosts', { awaitsInline: true }],
  ['insights/[slug]/page.tsx', 'getPost', { awaitsInline: true }],
  // Careers renders <JobOpenings />, an async server component inside a
  // Suspense boundary, so the page itself need not be async. The markup is
  // still produced on the server and still arrives in the same response; only
  // the moment it is flushed differs.
  ['careers/page.tsx', null, { awaitsInline: false }],
];

for (const [rel, query, opts] of DATA_PAGES) {
  const full = path.join(pagesDir, rel);
  if (!fs.existsSync(full)) continue;
  const src = fs.readFileSync(full, 'utf8');
  const route = '/' + path.dirname(rel);

  ok(`${route}: is not a client component`, !/^\s*['"]use client['"]/m.test(src.split('\n').slice(0, 4).join('\n')));

  if (opts.awaitsInline) {
    ok(
      `${route}: renders as an async server component`,
      /export default async function/.test(src),
      'a non-async default export cannot await data during render',
    );
  }

  ok(
    `${route}: fetches nothing from the browser`,
    !/useEffect|useSWR|useQuery|fetch\(/.test(src),
    'client-side fetching would leave the content out of the initial HTML',
  );

  if (query) {
    ok(`${route}: awaits ${query}() before rendering`, new RegExp(`await ${query}\\(`).test(src));
  }
}

/* --- the components that render the data must be server components too ----- */
{
  const src = fs.readFileSync(path.join(pagesDir, 'insights/page.tsx'), 'utf8');
  const imports = [...src.matchAll(/from '@\/components\/(\w+)'/g)].map((m) => m[1]);
  const clientOnes = [];
  for (const name of imports) {
    const f = path.join(root, 'src/components', `${name}.tsx`);
    if (!fs.existsSync(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (/^\s*['"]use client['"]/m.test(text.split('\n').slice(0, 3).join('\n'))) clientOnes.push(name);
  }
  // A client component may render the data as long as the data is passed in as
  // props from the server; what would break indexing is fetching it there.
  const fetchers = clientOnes.filter((name) => {
    const text = fs.readFileSync(path.join(root, 'src/components', `${name}.tsx`), 'utf8');
    return /useEffect|fetch\(/.test(text);
  });
  ok(
    'no component on the insights list fetches its own data in the browser',
    fetchers.length === 0,
    fetchers.join(', '),
  );
}

/* --- data fetched by a nested component is still server-side --------------- */
for (const name of ['JobOpenings', 'ClientLogos', 'Testimonial']) {
  const f = path.join(root, 'src/components', `${name}.tsx`);
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, 'utf8');
  ok(
    `${name} fetches on the server, not in the browser`,
    !/^\s*['"]use client['"]/m.test(text.split('\n').slice(0, 3).join('\n')) && !/useEffect|fetch\(/.test(text),
    'a Suspense boundary streams server markup; it does not move the fetch to the client',
  );
}

/* --- the loading fallback is a fallback, not the page ---------------------- */
{
  const loadingPath = path.join(pagesDir, 'insights/loading.tsx');
  if (fs.existsSync(loadingPath)) {
    const src = fs.readFileSync(loadingPath, 'utf8');
    // Strip comments first. The file's own explanation names getPosts, and a
    // check that reads prose as code fails on the documentation that was added
    // to prevent this very confusion.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    ok(
      'the loading file is a Suspense fallback, not a data source',
      !/getPosts|await |fetch\(/.test(code),
      'a loading state that fetches would be a second, real source of truth',
    );
    ok(
      'the fallback explains why its text appears in the raw HTML',
      /stream|fallback|Suspense/i.test(src),
      'the next person reading the page source will file the same finding again',
    );
  }
}

/* --- and the list is really rendered from the awaited data ----------------- */
{
  const src = fs.readFileSync(path.join(pagesDir, 'insights/page.tsx'), 'utf8');
  ok(
    'the posts are mapped into markup during the server render',
    /posts\.map\(/.test(src),
  );
  ok(
    'an empty list renders an honest state rather than nothing',
    /posts\.length === 0/.test(src),
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
