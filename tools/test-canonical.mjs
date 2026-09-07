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
  /shouldAllowCrawling/.test(
    // Tolerant: if the file has been moved, the location assertions below say
    // so plainly. Letting the read throw here would crash the suite before it
    // reached them, which reports the problem as a stack trace rather than a
    // sentence.
    fs.existsSync(path.join(root, 'src/app/robots.ts'))
      ? fs.readFileSync(path.join(root, 'src/app/robots.ts'), 'utf8')
      : '',
  ),
);

/* robots.txt and sitemap.xml must sit at the app root, not inside a route
   group.

   This project has two root layouts — (frontend) and (payload) — and both
   serve from /. A metadata file inside one of them is ambiguous about which
   root it belongs to, and the route stops being emitted: /robots.txt returned
   a hard 404 in production while the source was present and correct on the
   deployed branch, which is the least debuggable shape a bug can take. The
   documented location for these files with multiple root layouts is app/
   itself.

   Asserted by location rather than by content, because the failure is not that
   the file is wrong. The file is fine. It is in the wrong folder. */
for (const f of ['robots.ts', 'sitemap.ts']) {
  ok(
    `${f} is at the app root, not inside a route group`,
    fs.existsSync(path.join(root, 'src/app', f)),
    `expected src/app/${f}`,
  );
  ok(
    `${f} is not left behind in a route group`,
    !fs.existsSync(path.join(root, 'src/app/(frontend)', f)) &&
      !fs.existsSync(path.join(root, 'src/app/(payload)', f)),
  );
}

/* --- the favicon Google can actually fetch --------------------------------

   A favicon only reaches a search result if Google can crawl it as a resource.
   The previous value was a data: URI — perfectly good in a browser tab, and
   impossible for Google, because there is no URL to request. That failure is
   invisible: the tab looks right, so nothing prompts anyone to check.

   So this asserts the shape Google needs rather than that an icon exists at
   all: real files, at fixed paths, one of them a multiple of 48px square, and
   none of them behind a robots.txt disallow. */
{
  const layout = fs.readFileSync(path.join(root, 'src/app/(frontend)/layout.tsx'), 'utf8');
  const iconBlock = layout.slice(layout.indexOf('  icons: {'), layout.indexOf('};', layout.indexOf('  icons: {')));

  ok(
    'no icon is declared as a data: URI',
    !/data:image/.test(iconBlock),
    'Google fetches the favicon as a resource; a data URI gives it nothing to fetch',
  );

  const declared = [...iconBlock.matchAll(/url: '(\/[^']+)'/g)].map((m) => m[1]);
  ok('the layout declares at least one icon file', declared.length > 0);

  for (const url of declared) {
    ok(`${url} exists in public/`, fs.existsSync(path.join(root, 'public', url.replace(/^\//, ''))));
  }

  ok(
    'one icon is a multiple of 48px square, as Google asks',
    declared.some((u) => /-(192|48|96|144|240|288|384|480|512)\.png$/.test(u)),
    `declared: ${declared.join(', ')}`,
  );

  /* The icons sit at the site root, and robots.txt only disallows /admin and
     /api — but if that ever widens, the favicon goes with it silently. */
  const robots = fs.readFileSync(path.join(root, 'src/app/robots.ts'), 'utf8');
  const disallows = [...robots.matchAll(/'(\/[a-z-]*)'/g)].map((m) => m[1]).filter((d) => d !== '/');
  ok(
    'no disallow rule covers the icon paths',
    declared.every((u) => !disallows.some((d) => d.length > 1 && u.startsWith(d))),
    `disallows: ${disallows.join(', ') || 'none'}`,
  );
}

/* --- every CMS-backed section reaches the sitemap ------------------------- */
{
  /*
   * A page written to be linked to, missing from the sitemap, is the quietest
   * possible failure: it works, it just never gets submitted. It has happened
   * once already — /playbooks was listed by hand and the individual playbooks
   * were not — so each section that generates URLs from data has to derive them
   * here rather than rely on somebody remembering.
   */
  const sitemap = fs.readFileSync(path.join(root, 'src/app/sitemap.ts'), 'utf8');
  for (const [name, call] of [
    ['playbooks', 'publishedPlaybooks()'],
    ['portfolio', 'getPortfolio()'],
    ['insights', 'getPosts('],
  ]) {
    ok(`the sitemap derives ${name} URLs from data`, sitemap.includes(call), `no ${call} in sitemap.ts`);
  }
  ok('and the derived lists are all in the returned array',
    /return \[[^\]]*playbookEntries[^\]]*portfolioEntries[^\]]*postEntries/.test(sitemap),
    'one of the derived lists is built and then not returned');
}

/* --- the 404 has to be reachable, which is a question of where it lives ----- */
/*
 * Same trap that swallowed robots.ts and sitemap.ts, and it is worth naming
 * because nothing about it is visible in the file itself: a not-found.tsx inside
 * a route group is only reached by a notFound() call from a page that already
 * matched inside that group. A URL matching no route at all belongs to neither
 * (frontend) nor (payload), so Next applies neither layout and looks only at
 * app/not-found.tsx. Without that file the request falls through to the host's
 * default 404 — which is what visitors were getting while a perfectly good 404
 * page sat in the repo.
 *
 * The consequence of having no layout is that the root one has to draw its own
 * document, and the group one must not, or the site ends up serving nested
 * <html> elements. Both directions are checked.
 */
{
  const rootPath = path.join(root, 'src/app/global-not-found.tsx');
  const groupPath = path.join(root, 'src/app/(frontend)/not-found.tsx');

  ok('a global-not-found.tsx exists, so unmatched URLs get our 404',
    fs.existsSync(rootPath),
    'src/app/global-not-found.tsx is missing — unmatched URLs fall through to the host 404');

  if (fs.existsSync(rootPath)) {
    const rootSrc = fs.readFileSync(rootPath, 'utf8');
    // No layout wraps it, so it is responsible for the whole document.
    ok('the global 404 renders its own <html>', /<html\b/.test(rootSrc));
    ok('the global 404 renders its own <body>', /<body\b/.test(rootSrc));
    ok('the global 404 pulls in the stylesheet itself', /globals\.css/.test(rootSrc));
    ok('the global 404 is not indexable', /index:\s*false/.test(rootSrc));
    // follow, not nofollow: this one URL stands in for every mistyped address.
    ok('but its links still pass', /follow:\s*true/.test(rootSrc));
  }

  if (fs.existsSync(groupPath)) {
    const groupSrc = fs.readFileSync(groupPath, 'utf8');
    ok('the in-segment 404 does NOT render a second <html>',
      !/<html\b/.test(groupSrc),
      'it renders inside the frontend layout, which already supplies the document');
    ok('the in-segment 404 is not indexable', /index:\s*false/.test(groupSrc));
  }

  // One set of words, so the two cannot drift into saying different things.
  const shared = path.join(root, 'src/components/NotFoundBody.tsx');
  ok('both 404s render one shared body', fs.existsSync(shared));
  for (const [label, p] of [['global', rootPath], ['in-segment', groupPath]]) {
    if (!fs.existsSync(p)) continue;
    ok(`the ${label} 404 uses the shared body rather than its own copy`,
      /NotFoundBody/.test(fs.readFileSync(p, 'utf8')));
  }
  /* global-not-found.tsx is inert without the flag, and the flag is pointless
     without the file. Checking either alone would pass while the site served
     the host's 404, which is the failure this whole block exists to catch. */
  const cfg = fs.readFileSync(path.join(root, 'next.config.mjs'), 'utf8');
  ok('next.config.mjs enables experimental.globalNotFound',
    /globalNotFound:\s*true/.test(cfg),
    'the file is present but switched off — unmatched URLs still get the host 404');

  /* Next refuses to compile a root app/not-found.tsx when there is no root
     layout, and this app has two. Adding one back breaks the build outright. */
  ok('and no root app/not-found.tsx was reintroduced',
    !fs.existsSync(path.join(root, 'src/app/not-found.tsx')),
    'a root not-found.tsx needs a root layout this app does not have');
}

/* --- third-party script cost stays behind a real visitor ------------------- */
/*
 * Talkbar reaches seven origins and executes a third-party bundle on the main
 * thread. Whether that lands inside the window Core Web Vitals is scored over
 * comes down to one prop, which is easy to "simplify" back to something eager
 * during an unrelated edit. `lazyOnload` in particular reads like it is enough
 * and is not — browser idle arrives while the page is still being measured.
 */
{
  const p = path.join(root, 'src/components/Talkbar.tsx');
  if (fs.existsSync(p)) {
    const src = fs.readFileSync(p, 'utf8');
    ok('Talkbar waits for a real interaction before loading',
      /addEventListener/.test(src) && /pointermove|scroll|touchstart/.test(src),
      'no interaction gate — the widget loads during first paint again');
    ok('and it renders nothing until then',
      /return null/.test(src),
      'the <Script> is rendered unconditionally');
    ok('Talkbar credentials still come from the environment',
      !/data-app-id=["'][0-9a-f]{8}-/.test(src),
      'an app id was hardcoded back into the component');
  }
}

/* --- a logo the footer names has to be a file that exists ------------------ */
/*
 * These render on every page, so one wrong path is a broken image site-wide —
 * and it fails silently: the alt text reads correctly, the layout box is still
 * reserved by width/height, and nothing throws. The only symptom is a missing
 * seal that nobody notices for a month.
 *
 * width and height are checked because they are what reserve the box before the
 * image arrives. Re-exporting artwork at a new size and leaving the old numbers
 * in place is how a footer starts shifting on slow connections.
 */
{
  const siteSrc = fs.readFileSync(path.join(root, 'src/lib/site.ts'), 'utf8');
  const entries = [...siteSrc.matchAll(
    /logo: '([^']+)',\s*logoWidth: (\d+),\s*logoHeight: (\d+)/g,
  )];

  ok('the footer declares at least one certification logo', entries.length > 0);

  for (const [, logo, w, h] of entries) {
    ok(`${logo} exists in public/`, fs.existsSync(path.join(root, 'public', logo)), logo);
    ok(`${logo} declares a box to reserve`, Number(w) > 0 && Number(h) > 0, `${w}x${h}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
