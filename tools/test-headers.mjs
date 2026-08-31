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

/* --- the CSP itself, evaluated ---------------------------------------------

   Built rather than grepped. The previous version read next.config.mjs as text
   and asserted that directives appeared in the source, which cannot tell a
   directive that is present from one that is present but empty, or conditional
   on the wrong thing. src/lib/csp.mjs exists so this can call it with each set
   of conditions and read the string a browser would actually receive. */

const { buildCsp, TALKBAR_UI, TALKBAR_API, TALKBAR_WS, TALKBAR_HOSTS } = await import(
  `file://${path.join(root, 'src/lib/csp.mjs')}`
);

/** Split a policy into { directive: [sources] }. */
const parse = (csp) =>
  Object.fromEntries(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...sources] = d.split(/\s+/);
        return [name, sources];
      }),
  );

const prod = parse(buildCsp({ isDev: false, isPreview: false, talkbar: false }).site);
const dev = parse(buildCsp({ isDev: true, isPreview: false, talkbar: false }).site);
const preview = parse(buildCsp({ isDev: false, isPreview: true, talkbar: false }).site);
const withBar = parse(buildCsp({ isDev: false, isPreview: false, talkbar: true }).site);
const admin = parse(buildCsp({ isDev: false, isPreview: false, talkbar: true }).admin);

console.log('');
for (const directive of [
  'default-src',
  'script-src',
  'style-src',
  'font-src',
  'img-src',
  'connect-src',
  'frame-ancestors',
  'base-uri',
  'form-action',
  'object-src',
]) {
  ok(`CSP declares ${directive}`, Array.isArray(prod[directive]));
  // A directive present but empty allows nothing at all, which is a different
  // and much louder failure than the one it looks like in a source diff.
  ok(`${directive} is not empty`, (prod[directive] || []).length > 0);
}

ok("frame-ancestors is 'none'", prod['frame-ancestors']?.join(' ') === "'none'");
ok("object-src is 'none'", prod['object-src']?.join(' ') === "'none'");

/* unsafe-eval must never reach production. It is granted for Fast Refresh only. */
ok("production script-src has no 'unsafe-eval'", !prod['script-src'].includes("'unsafe-eval'"));
ok("development script-src has 'unsafe-eval'", dev['script-src'].includes("'unsafe-eval'"));

/* upgrade-insecure-requests must never apply in development: it breaks the LAN
   URL `next dev` prints, since browsers exempt localhost but not 192.168.x.x. */
ok('upgrade-insecure-requests is on in production', 'upgrade-insecure-requests' in prod);
ok('upgrade-insecure-requests is off in development', !('upgrade-insecure-requests' in dev));

/* The preview toolbar's origins never reach the live policy. */
ok('vercel.live is absent from the production policy', !JSON.stringify(prod).includes('vercel.live'));
ok('vercel.live is present on a preview', preview['script-src'].includes('https://vercel.live'));

/* --- the Talkbar widget ----------------------------------------------------

   Every directive the widget needs, asserted one at a time. A CSP failure is
   invisible from the server: the page is served, the header is correct as far
   as it goes, and the widget just never appears. The only signal is a console
   message in somebody's browser, which is not a thing a deploy checks. */

/* Every host the widget needs, in every directive it needs it in — driven by
   the map in csp.mjs rather than restated here, so adding a host to the map
   without wiring it into the policy fails, and wiring one in without recording
   it fails too.

   Iterating matters because the directives are not interchangeable and the
   difference is where the debugging time went: style-src governs a .css file
   and the @font-face targets inside it are font-src, so allowing only the
   first gets you a stylesheet that loads and still no glyphs. */
for (const [directive, hosts] of Object.entries(TALKBAR_HOSTS)) {
  for (const host of hosts) {
    ok(
      `${directive} allows ${host.replace(/^\w+:\/\//, '')}`,
      (withBar[directive] || []).includes(host),
      `${directive} is: ${(withBar[directive] || ['(absent)']).join(' ')}`,
    );
  }
}

/* The loop above is driven by TALKBAR_HOSTS, which means deleting a host from
   the map deletes its assertion too — it passes with one fewer test rather
   than failing. So the hosts we have actually watched fail are pinned here,
   independently of the map. Each line below is a console violation somebody
   read off a real page:

     img-src      cdn.talkbar.ai .............. the launcher icon
     style-src    <cloudfront>/WebAI/fonts .... the font stylesheet
     style-src    p.typekit.net ............... which turned out to be a Typekit kit
     font-src     use.typekit.net ............. the font files that kit points at
     script-src   ui-server ................... the loader in Talkbar's own snippet

   Removing any of them from csp.mjs now fails here, whatever the map says. */
const OBSERVED = {
  'script-src': [TALKBAR_UI],
  'img-src': ['https://cdn.talkbar.ai'],
  'style-src': ['https://d2di5t1ylkcchn.cloudfront.net', 'https://p.typekit.net'],
  'font-src': ['https://use.typekit.net'],
  'connect-src': [TALKBAR_API, TALKBAR_WS],
  'frame-src': [TALKBAR_UI],
};
for (const [directive, hosts] of Object.entries(OBSERVED)) {
  for (const host of hosts) {
    ok(
      `${directive} still allows ${host.replace(/^\w+:\/\//, '')}, which was seen to fail without it`,
      (withBar[directive] || []).includes(host),
    );
  }
}

ok('the API host is what connect-src names', TALKBAR_HOSTS['connect-src'].includes(TALKBAR_API));
ok('the websocket is listed too', TALKBAR_HOSTS['connect-src'].includes(TALKBAR_WS));
ok('the script host is the only one allowed to execute', 
  TALKBAR_HOSTS['script-src'].length === 1 && TALKBAR_HOSTS['script-src'][0] === TALKBAR_UI,
  'asset CDNs should not be granted code execution pre-emptively');
ok(
  'the asset hosts cannot execute scripts',
  ['img-src', 'style-src', 'font-src']
    .flatMap((d) => TALKBAR_HOSTS[d])
    .filter((h) => h !== TALKBAR_UI)
    .every((h) => !withBar['script-src'].includes(h)),
);
ok(
  'nothing but the API host may be connected to',
  withBar['connect-src'].filter((h) => /talkbar|typekit|cloudfront/.test(h)).length ===
    TALKBAR_HOSTS['connect-src'].length,
);

/* No wildcards. CloudFront and Typekit are shared infrastructure: allowing
   either wholesale would open a large slice of the internet to this site for
   the sake of one widget's fonts. */
for (const shared of ['*.cloudfront.net', '*.typekit.net', '*.talkbar.ai']) {
  ok(`${shared} is not allowed wholesale`, !JSON.stringify(withBar).includes(shared));
}

/* And all of it closes when the widget is unconfigured. */
ok(
  'none of it is allowed when the widget is unconfigured',
  !/talkbar|typekit|cloudfront/.test(JSON.stringify(prod)),
);
ok(
  'frame-src is omitted entirely when nothing needs it',
  !('frame-src' in prod),
  "an empty frame-src would be more restrictive than the 'self' fallback, for no reason",
);

/* --- the admin profile ----------------------------------------------------- */
ok('the admin has its own, separate CSP', JSON.stringify(admin) !== JSON.stringify(withBar));
ok(
  'the admin CSP sends no analytics origins',
  !JSON.stringify(admin).includes('google-analytics') &&
    !JSON.stringify(admin).includes('googletagmanager'),
);
ok(
  'the admin does not run the third-party widget',
  !/talkbar|typekit|cloudfront/.test(JSON.stringify(admin)),
  'a support widget on the marketing site is one thing; the same script inside an authenticated CMS session is another',
);
ok('the admin is marked noindex', /X-Robots-Tag/.test(src) && /noindex/.test(src));
ok('admin responses are not cached by a shared cache', /no-store/.test(src));

/* --- the config still uses the module -------------------------------------- */
ok(
  'next.config.mjs builds its policy from this module',
  /buildCsp\(/.test(src) && /from '\.\/src\/lib\/csp\.mjs'/.test(src),
  'the test would otherwise be checking a policy the site does not send',
);
ok(
  'the widget opens the policy on the same condition that renders it',
  /NEXT_PUBLIC_TALKBAR_APP_ID && process\.env\.NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY/.test(src),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
