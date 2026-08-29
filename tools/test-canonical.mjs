/**
 * One canonical host, and no way for the app to fight the DNS over it.
 *
 * The bug: every page's canonical tag said https://cognovea.com/... while the
 * domain resolves to www, so every real URL was https://www.cognovea.com/...
 * Two spellings of the same page, each pointing at the other, and no redirect
 * between them — search engines pick a winner and any link equity splits.
 *
 * The hazard introduced by fixing it: the DNS already redirects the apex to
 * www. An app-level redirect pointing the other way makes the site loop until
 * the browser gives up. That is worse than the mismatch, and it would be caused
 * by one wrong value in a dashboard, so the direction comes from a constant in
 * a reviewed file rather than from the environment.
 *
 *   node tools/test-canonical.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');

const { CANONICAL_URL, hostRedirects, hostOf, pairedHost, shouldAllowCrawling } = await import(
  `file://${path.join(root, 'src/lib/host-redirect.mjs')}`
);

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

const canonicalHostname = hostOf(CANONICAL_URL);

/* --- the constant itself -------------------------------------------------- */
ok('CANONICAL_URL is https', CANONICAL_URL.startsWith('https://'));
ok('CANONICAL_URL has no trailing slash', !CANONICAL_URL.endsWith('/'));
ok('CANONICAL_URL is the www host, matching the DNS', canonicalHostname.startsWith('www.'), `got ${canonicalHostname}`);

/* --- site.ts must not hold a second copy ---------------------------------- */
const siteTs = fs.readFileSync(path.join(root, 'src/lib/site.ts'), 'utf8');
ok('site.ts imports the constant rather than restating a URL', /url:\s*CANONICAL_URL/.test(siteTs));
ok(
  'site.ts has no hardcoded https://…cognovea.com URL',
  !/url:\s*'https:\/\//.test(siteTs),
);

/* --- next.config.mjs uses the shared module ------------------------------- */
const nextConfig = fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');
ok('next.config.mjs imports hostRedirects', /from '\.\/src\/lib\/host-redirect\.mjs'/.test(nextConfig));
ok('next.config.mjs declares redirects()', /async redirects\(\)/.test(nextConfig));

/* --- direction, which is the part that can take the site down ------------- */
const prod = (serverUrl) =>
  hostRedirects({ serverUrl, isDeployed: true, isPreview: false, vercelProductionUrl: 'cognovea.com' });

{
  const r = prod(CANONICAL_URL);
  ok('production redirects the apex to www', r.length === 1 && r[0].has[0].value === 'cognovea.com' && r[0].destination.startsWith(`https://${canonicalHostname}/`), JSON.stringify(r));
  ok('the redirect is permanent', r[0]?.permanent === true);
  ok('the redirect preserves the path', r[0]?.destination.endsWith('/:path*'));
  ok('the redirect covers every path, admin and API included', r[0]?.source === '/:path*');
}

// The loop case. If the env var says apex while the DNS says www, an
// env-driven rule would redirect www to the apex and the site would bounce.
{
  const r = prod('https://cognovea.com');
  const redirectsWwwAway = r.some((x) => x.has[0].value === canonicalHostname);
  ok(
    'an apex env var CANNOT flip the direction and cause a DNS loop',
    !redirectsWwwAway,
    `rules: ${JSON.stringify(r)}`,
  );
  ok('it still redirects apex to www regardless', r.length === 1 && r[0].has[0].value === 'cognovea.com');
}

// A different domain (staging) keeps its own pairing rather than being sent to
// the production domain, which would make staging unreachable.
{
  const r = prod('https://www.nextlooptechology.com');
  ok(
    'a staging domain redirects within itself, not to production',
    r.length === 1 && r[0].has[0].value === 'nextlooptechology.com' && r[0].destination.includes('www.nextlooptechology.com'),
    JSON.stringify(r),
  );
}

/* --- where it must do nothing --------------------------------------------- */
ok('no redirect in local development', hostRedirects({ serverUrl: 'http://localhost:3000' }).length === 0);
ok(
  'no redirect on a preview deployment',
  hostRedirects({ serverUrl: CANONICAL_URL, isDeployed: true, isPreview: true }).length === 0,
);
ok(
  'no redirect when nothing is configured',
  hostRedirects({ isDeployed: true, isPreview: false }).length === 0,
);
ok('an IP address gets no www variant', pairedHost('192.168.0.10') === null);
ok('localhost gets no www variant', pairedHost('localhost') === null);

/* --- a rule must never point a host at itself ----------------------------- */
{
  const every = [
    prod(CANONICAL_URL),
    prod('https://cognovea.com'),
    prod('https://www.nextlooptechology.com'),
    prod('https://nextlooptechology.com'),
  ].flat();
  const selfLoop = every.find((r) => r.destination.includes(`https://${r.has[0].value}/`));
  ok('no rule redirects a host to itself', !selfLoop, JSON.stringify(selfLoop));
}

/* --- robots must not let a non-canonical deployment be indexed ------------ */
ok('local development is crawlable (nothing is listening)', shouldAllowCrawling({ siteUrl: CANONICAL_URL }) === true);
ok(
  'the canonical production deployment is crawlable',
  shouldAllowCrawling({ siteUrl: CANONICAL_URL, serverUrl: CANONICAL_URL, isDeployed: true }) === true,
);
ok(
  'the apex spelling still counts as the canonical domain',
  shouldAllowCrawling({ siteUrl: CANONICAL_URL, serverUrl: 'https://cognovea.com', isDeployed: true }) === true,
);
ok(
  'a staging domain is NOT crawlable while it claims the canonical elsewhere',
  shouldAllowCrawling({ siteUrl: CANONICAL_URL, serverUrl: 'https://www.nextlooptechology.com', isDeployed: true }) === false,
);
ok(
  'a preview .vercel.app is NOT crawlable',
  shouldAllowCrawling({ siteUrl: CANONICAL_URL, vercelProductionUrl: 'x-abc.vercel.app', isDeployed: true }) === false,
);
ok(
  'an unknown serving host fails closed',
  shouldAllowCrawling({ siteUrl: CANONICAL_URL, isDeployed: true }) === false,
);
ok(
  'robots.ts reads the rule rather than reimplementing it',
  /shouldAllowCrawling/.test(fs.readFileSync(path.join(root, 'src/app/(frontend)/robots.ts'), 'utf8')),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
