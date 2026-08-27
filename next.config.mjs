/**
 * Payload is loaded dynamically so that a missing install produces instructions
 * rather than a bare ERR_MODULE_NOT_FOUND stack trace.
 *
 * All `@payloadcms/*` packages are pinned to the same exact version in
 * package.json, because Payload requires them to match; `npm install` is now
 * enough on a fresh clone.
 */
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
 * Content Security Policy.
 *
 * Two profiles, because the public site and the Payload admin have genuinely
 * different needs and giving the whole site the admin's permissions would waste
 * the point of having a policy at all.
 *
 * A note on `'unsafe-inline'` in script-src for the public site, because it is a
 * real weakening and should be a conscious choice rather than an accident:
 * Next.js App Router injects per-page inline bootstrap scripts carrying the
 * flight data for hydration. Removing 'unsafe-inline' means nonce-based CSP,
 * which requires generating a fresh nonce per request in middleware. And a
 * per-request nonce forces every page to render dynamically, which would drop
 * the marketing pages out of static generation and directly hurt the Core Web
 * Vitals this same change set is meant to improve. Static HTML from the edge is
 * worth more here than closing an XSS vector on a site that renders no
 * user-submitted HTML. Revisit this if the site ever renders untrusted content.
 *
 * Development is a different application from production. Fast Refresh compiles
 * modules through `eval`, and the dev server talks to the browser over a
 * websocket; neither exists in a production build. Both allowances are therefore
 * scoped to development rather than weakening the real policy, granting
 * `'unsafe-eval'` in production to make `npm run dev` work would hand every
 * future XSS a code-execution primitive in exchange for nothing.
 */
const isDev = process.env.NODE_ENV !== 'production';

const siteCsp = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    // Fast Refresh only. Never present in a production build.
    isDev ? "'unsafe-eval'" : '',
    // GA4 loads gtag.js from googletagmanager.com.
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ]
    .filter(Boolean)
    .join(' '),
  // Inline style attributes are used throughout the pages. No external
  // stylesheet host: fonts are self-hosted by next/font, so the Google origins
  // that used to be allowed here have been removed rather than left open.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://*.public.blob.vercel-storage.com",
  [
    "connect-src 'self'",
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://*.google-analytics.com',
    'https://*.googletagmanager.com',
    // The dev server's HMR websocket. Not restricted to localhost: `next dev`
    // also serves on the LAN address it prints as "Network", and the websocket
    // then connects to that host, not to localhost.
    isDev ? 'ws: wss:' : '',
  ]
    .filter(Boolean)
    .join(' '),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // PRODUCTION ONLY. This rewrites every http:// subresource request to https://.
  // On a real deployment that is exactly right. In development it is fatal the
  // moment you open the "Network" URL that `next dev` prints, because browsers
  // exempt localhost from the upgrade but not a LAN address like 192.168.x.x,
  // so every script and stylesheet gets upgraded to https://192.168.x.x:3000,
  // where the dev server speaks no TLS, and the page loads with no CSS and no
  // JavaScript at all.
  isDev ? '' : 'upgrade-insecure-requests',
]
  .filter(Boolean)
  .join('; ');

/**
 * The admin needs more: Payload's UI ships inline styles, renders upload
 * previews from blob: URLs, and talks to its own API. It gets no GA4 origins,
 * analytics has no business in a logged-in admin session.
 */
const adminCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "connect-src 'self' https://*.public.blob.vercel-storage.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

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
    ];
  },
};

export default withPayload(nextConfig);
