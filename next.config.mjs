/**
 * Payload is loaded dynamically so that a missing install produces instructions
 * rather than a bare ERR_MODULE_NOT_FOUND stack trace.
 *
 * All `@payloadcms/*` packages are pinned to the same exact version in
 * package.json, because Payload requires them to match; `npm install` is now
 * enough on a fresh clone.
 */
import { TALKBAR_API, TALKBAR_CDN, TALKBAR_UI, buildCsp } from './src/lib/csp.mjs';
import { hostRedirects } from './src/lib/host-redirect.mjs';

let withPayload;
try {
  ({ withPayload } = await import('@payloadcms/next/withPayload'));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  throw new Error(
    [
      '',
      'Dependencies are not installed. Run:',
      '',
      '  npm install',
      '',
      'If npm reports an ERESOLVE peer conflict, the Next.js version has drifted',
      'out of the range Payload accepts. Do NOT use --legacy-peer-deps or --force:',
      'that range is a security floor, and forcing past it installs Payload',
      'against a Next.js with known unpatched CVEs. Fix the version instead.',
      '',
      'See SETUP.md, section 2.',
      '',
    ].join('\n'),
  );
}

/**
 * Which policy profile this build gets. The policy itself lives in
 * src/lib/csp.mjs so it can be imported and evaluated by a test; this file only
 * decides the three facts it depends on.
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Vercel injects its comment/feedback toolbar from vercel.live on preview
 * deployments. It is a production build, so `isDev` is false there and the
 * script is blocked, which is correct for the live site and merely noisy on a
 * preview. VERCEL_ENV distinguishes the two: 'production' only on the real
 * deployment, 'preview' on every branch build.
 */
const isPreview = Boolean(process.env.VERCEL) && process.env.VERCEL_ENV !== 'production';

/* The Talkbar widget renders only when both values are set (see
   src/components/Talkbar.tsx), so the policy opens for it on exactly the same
   condition. An environment without the keys keeps the tighter policy. */
const talkbar = Boolean(
  process.env.NEXT_PUBLIC_TALKBAR_APP_ID && process.env.NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY,
);

const { site: siteCsp, admin: adminCsp } = buildCsp({ isDev, isPreview, talkbar });

/**
 * Say, at boot, whether the widget is on and which hosts the policy opens for.
 *
 * A CSP is invisible when it is wrong. The page still serves, the header is
 * still well-formed, and the only evidence is a console message in whoever's
 * browser happened to load the widget. Worse, this policy is built in a module
 * next.config.mjs imports, and the dev server watches next.config.mjs itself —
 * so editing the policy can leave a running server serving the previous one
 * indefinitely while the source on disk looks correct.
 *
 * One line at startup makes both conditions observable at the moment they are
 * decided. Hostnames only: the key is never printed anywhere, and the app id is
 * not worth the noise.
 */
console.log(
  talkbar
    ? `Talkbar: enabled — CSP allows ${[TALKBAR_UI, TALKBAR_API, TALKBAR_CDN]
        .map((u) => u.replace('https://', ''))
        .join(', ')}`
    : 'Talkbar: disabled (NEXT_PUBLIC_TALKBAR_APP_ID / _PUBLISHABLE_KEY not set)',
);

/** Headers that apply everywhere, admin included. */
const baseHeaders = [
  // Two years, subdomains included, preload-eligible. Only ever sent over HTTPS.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Legacy equivalent of frame-ancestors, for browsers that predate CSP level 2.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `output: 'export'` was removed deliberately. Payload mounts an admin UI and
  // REST/GraphQL route handlers, all of which need a Node runtime; a static
  // export has no server to run them on. The marketing pages are still
  // statically generated at build time, so they keep serving as static HTML.

  // Unchanged on purpose. The live URLs are already indexed with a trailing
  // slash; flipping this would 308 every indexed URL and throw away accumulated
  // ranking signals for no benefit.
  trailingSlash: true,

  images: {
    // `unoptimized` is gone with the static export, there is now a server to
    // run the optimiser, which means real AVIF/WebP and correct sizing for
    // anything editors upload through the admin.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },

  reactStrictMode: true,

  // Don't advertise the framework version to scanners.
  poweredByHeader: false,

  // Emits a smaller standalone server bundle and skips shipping source maps of
  // server code to the client.
  productionBrowserSourceMaps: false,

  /**
   * One canonical host. The other 308s to it, path and query preserved.
   *
   * Without this both www and the apex answer 200 with identical HTML and the
   * same canonical tag, so search engines have to pick one and any link
   * equity splits across the pair. It is also why an admin session could
   * behave differently depending on which spelling of the domain someone
   * typed: the cookie set on one host is not sent to the other.
   *
   * Which host is canonical comes from NEXT_PUBLIC_SERVER_URL, so this needs
   * no code change per environment. Off on previews, whose hostnames are
   * generated per deployment.
   */
  async redirects() {
    return hostRedirects({
      serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
      vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      isDeployed: Boolean(process.env.VERCEL),
      isPreview: Boolean(process.env.VERCEL) && process.env.VERCEL_ENV !== 'production',
    });
  },

  async headers() {
    return [
      {
        // Everything except the admin, the API and Next's own static assets.
        // Negative lookahead keeps this from double-applying with the rule below,
        // since Next applies every matching rule rather than stopping at the first.
        source: '/((?!admin|api|_next/static|_next/image).*)',
        headers: [...baseHeaders, { key: 'Content-Security-Policy', value: siteCsp }],
      },
      {
        source: '/admin/:path*',
        headers: [
          ...baseHeaders,
          { key: 'Content-Security-Policy', value: adminCsp },
          // An admin page must never be cached by a shared cache.
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          // Keeps the admin out of search results without naming the path in
          // robots.txt. Disallowing it there would publish its existence to
          // every scanner that reads robots.txt looking for login pages, which
          // is the opposite of what we want.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...baseHeaders,
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        // Static assets. Excluded from the page rule by its negative lookahead
        // so that rule and this one cannot both apply, which left them with no
        // headers at all: a scanner that happens to request a .js bundle sees a
        // response carrying nothing, and nosniff genuinely matters on a file
        // whose content type a browser might otherwise guess at.
        //
        // No CSP: these are the assets a CSP governs, not documents that need
        // one, and a policy here would apply to nothing.
        source: '/_next/:path*',
        headers: baseHeaders,
      },
    ];
  },
};

export default withPayload(nextConfig);
