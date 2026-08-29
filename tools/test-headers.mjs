/**
 * Every response carries the security headers, and the CSP says what it should.
 *
 * Written after an audit reported "missing security headers: add CSP" against a
 * site that has had one for weeks. Two things make that claim easy to make and
 * hard to refute: a scanner pointed at the apex gets a 308 redirect, and a
 * redirect response carries none of this, and static assets under /_next were
 * genuinely excluded from every rule by the page rule's negative lookahead.
 *
 * So this asserts coverage by evaluating the real `source` patterns from
 * next.config.mjs against real paths, rather than by reading them.
 *
 *   node tools/test-headers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');

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

/* --- the base header set --------------------------------------------------- */
const baseBlock = src.match(/const baseHeaders = \[([\s\S]*?)\n\];/)?.[1] ?? '';
const baseKeys = [...baseBlock.matchAll(/key: '([^']+)'/g)].map((m) => m[1]);

for (const required of [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]) {
  ok(`${required} is sent`, baseKeys.includes(required));
}

ok(
  'HSTS is at least a year, with subdomains',
  /max-age=(\d+)/.test(baseBlock) &&
    Number(baseBlock.match(/max-age=(\d+)/)[1]) >= 31536000 &&
    /includeSubDomains/.test(baseBlock),
);
ok('X-Content-Type-Options is nosniff', /nosniff/.test(baseBlock));

/* --- coverage: turn each `source` into a matcher and try real paths -------- */
const sources = [...src.matchAll(/source: '([^']+)'/g)].map((m) => m[1]);

/** Next's path syntax, reduced to a regex for the cases used here. */
const toRegex = (source) =>
  new RegExp(
    '^' +
      source
        .replace(/\/:path\*/g, '(?:/.*)?')
        .replace(/:path\*/g, '.*') +
      '$',
  );

const matchers = sources.map((s) => ({ source: s, re: toRegex(s) }));
const covered = (p) => matchers.find((m) => m.re.test(p));

const PATHS = [
  '/',
  '/about-us/',
  '/insights/',
  '/insights/some-article/',
  '/data-engineering-services/',
  '/privacy-policy/',
  '/this-page-does-not-exist/',
  '/admin',
  '/admin/collections/posts',
  '/api/media/file/x.png',
  '/_next/static/chunks/main.js',
  '/_next/image',
  '/robots.txt',
  '/sitemap.xml',
];

console.log('');
for (const p of PATHS) {
  const m = covered(p);
  ok(`${p} is covered by a header rule`, Boolean(m), 'no rule matches this path, so it is served bare');
}

/* --- the CSP itself -------------------------------------------------------- */
const siteCsp = src.match(/const siteCsp = \[([\s\S]*?)\n\]\n\s*\.filter/)?.[1] ?? '';
ok('a site CSP exists', siteCsp.length > 0);
for (const directive of ['default-src', 'script-src', 'style-src', 'img-src', 'connect-src', 'frame-ancestors', 'base-uri', 'form-action', 'object-src']) {
  ok(`CSP declares ${directive}`, siteCsp.includes(directive));
}
ok("frame-ancestors is 'none'", /frame-ancestors 'none'/.test(siteCsp));
ok("object-src is 'none'", /object-src 'none'/.test(siteCsp));

// unsafe-eval must never reach production. It is granted for Fast Refresh only.
ok(
  "'unsafe-eval' in the site CSP is development-only",
  !/'unsafe-eval'/.test(siteCsp) || /isDev \? "'unsafe-eval'"/.test(siteCsp),
  'a production build must not allow eval',
);

// upgrade-insecure-requests must never apply in development: it breaks the LAN
// URL `next dev` prints, since browsers exempt localhost but not 192.168.x.x.
ok(
  'upgrade-insecure-requests is production-only',
  /isDev \? '' : 'upgrade-insecure-requests'/.test(src),
);

const adminCsp = src.match(/const adminCsp = \[([\s\S]*?)\n\]\.join/)?.[1] ?? '';
ok('the admin has its own, separate CSP', adminCsp.length > 0 && adminCsp !== siteCsp);
ok('the admin CSP sends no analytics origins', !/google-analytics|googletagmanager/.test(adminCsp));
ok('the admin is marked noindex', /X-Robots-Tag/.test(src) && /noindex/.test(src));
ok('admin responses are not cached by a shared cache', /no-store/.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
