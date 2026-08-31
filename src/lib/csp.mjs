/**
 * Content Security Policy.
 *
 * A separate module rather than inline in next.config.mjs, for one reason: this
 * can be imported and evaluated. next.config.mjs cannot — importing it pulls in
 * withPayload and the whole dependency tree — so anything testing the policy in
 * place had to read the file as text and grep it. Grepping a security header
 * proves the source mentions a directive, not that the directive the browser
 * receives says what you think. The two come apart exactly when a condition is
 * wrong, which is the case worth catching.
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

/**
 * Everywhere the Talkbar widget pulls from.
 *
 * None of this is in Talkbar's snippet, which says only "paste this in <head>".
 * Each host arrived as a console violation, one reload at a time: the loader
 * names ui-server and api-server, the controller then reaches for a CloudFront
 * distribution, that stylesheet turns out to be an Adobe Typekit kit, and the
 * launcher's own icon comes from a fourth host again. That is the real cost of
 * a third-party widget on a site with a policy — not the script tag, the
 * supply chain behind it.
 *
 * Grouped by directive rather than by host, because the directives are not
 * interchangeable and the difference is where the time goes: style-src governs
 * a .css file, and the @font-face targets inside that file are font-src. Allow
 * only the first and you get a stylesheet that loads and still no glyphs.
 *
 * Every host is named exactly. No wildcards, and specifically not
 * https://*.cloudfront.net or https://*.typekit.net — both are shared
 * infrastructure, and allowing either would open a large slice of the internet
 * to this site for the sake of one widget's fonts. If Talkbar moves a host, the
 * widget degrades visibly and the console names the replacement, which is a
 * better failure than a policy that cannot fail.
 *
 * Note what is NOT here. Only ui-server may execute scripts: the asset hosts
 * have so far only served assets, and a CDN is not granted code execution
 * pre-emptively. Only api-server may be connected to. If either ever needs
 * more, the console will say so.
 */
export const TALKBAR_UI = 'https://ui-server.app.talkbar.ai';
export const TALKBAR_API = 'https://api-server.app.talkbar.ai';
export const TALKBAR_WS = 'wss://api-server.app.talkbar.ai';
/** Talkbar's own asset CDN. Serves the launcher icon. */
export const TALKBAR_ASSETS = 'https://cdn.talkbar.ai';
/** A CloudFront distribution the controller pulls font CSS from. */
export const TALKBAR_CLOUDFRONT = 'https://d2di5t1ylkcchn.cloudfront.net';
/** Adobe Typekit, kit aik3pol. p. serves the CSS, use. serves the font files. */
export const TYPEKIT_CSS = 'https://p.typekit.net';
export const TYPEKIT_FONTS = 'https://use.typekit.net';

/** What the widget needs, per directive. Iterated by tools/test-headers.mjs. */
export const TALKBAR_HOSTS = {
  'script-src': [TALKBAR_UI],
  'connect-src': [TALKBAR_API, TALKBAR_WS, TALKBAR_UI],
  'frame-src': [TALKBAR_UI],
  'img-src': [TALKBAR_UI, TALKBAR_ASSETS, TALKBAR_CLOUDFRONT],
  'style-src': [TALKBAR_UI, TALKBAR_ASSETS, TALKBAR_CLOUDFRONT, TYPEKIT_CSS, TYPEKIT_FONTS],
  'font-src': [TALKBAR_UI, TALKBAR_ASSETS, TALKBAR_CLOUDFRONT, TYPEKIT_FONTS],
};

const join = (parts) => parts.filter(Boolean).join(' ');

/**
 * @param {object} env
 * @param {boolean} env.isDev        `next dev`, not a production build.
 * @param {boolean} env.isPreview    A Vercel deployment that is not production.
 * @param {boolean} env.talkbar      The widget is configured, so its origins are
 *                                   allowed. False keeps the tighter policy
 *                                   rather than advertising an integration that
 *                                   is not running.
 * @returns {{ site: string, admin: string }}
 */
export function buildCsp({ isDev = false, isPreview = false, talkbar = false } = {}) {
  const site = [
    "default-src 'self'",
    join([
      "script-src 'self' 'unsafe-inline'",
      // Fast Refresh only. Never present in a production build.
      isDev ? "'unsafe-eval'" : '',
      // GA4 loads gtag.js from googletagmanager.com.
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      // Vercel's preview toolbar. Never on the live site.
      isPreview ? 'https://vercel.live' : '',
      talkbar ? TALKBAR_HOSTS['script-src'].join(' ') : '',
    ]),
    // Inline style attributes are used throughout the pages. No external
    // stylesheet host for the site's own design: fonts are self-hosted by
    // next/font, so the Google origins that used to be allowed here have been
    // removed rather than left open.
    join(["style-src 'self' 'unsafe-inline'", talkbar ? TALKBAR_HOSTS['style-src'].join(' ') : '']),
    join(["font-src 'self' data:", talkbar ? TALKBAR_HOSTS['font-src'].join(' ') : '']),
    join([
      "img-src 'self' data: blob:",
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://*.public.blob.vercel-storage.com',
      talkbar ? TALKBAR_HOSTS['img-src'].join(' ') : '',
    ]),
    join([
      "connect-src 'self'",
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
      talkbar ? TALKBAR_HOSTS['connect-src'].join(' ') : '',
      // The dev server's HMR websocket. Not restricted to localhost: `next dev`
      // also serves on the LAN address it prints as "Network", and the websocket
      // then connects to that host, not to localhost.
      isDev ? 'ws: wss:' : '',
      isPreview ? 'https://vercel.live wss://vercel.live' : '',
    ]),
    "frame-ancestors 'none'",
    /* frame-src has no default of its own: with none set it falls back to
       default-src 'self', which blocks any third-party iframe. The preview
       toolbar renders in one it injects itself, and the Talkbar chat panel is
       served from its UI host, so both have to be named when present.

       Omitted entirely when neither applies, so the fallback to 'self' is what
       governs rather than a directive that lists nothing. */
    isPreview || talkbar
      ? join([
          "frame-src 'self'",
          isPreview ? 'https://vercel.live' : '',
          talkbar ? TALKBAR_HOSTS['frame-src'].join(' ') : '',
        ])
      : '',
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
   * previews from blob: URLs, and talks to its own API.
   *
   * It gets no GA4 origins — analytics has no business in a logged-in admin
   * session — and no Talkbar either. A support widget on the marketing site is
   * one thing; the same third-party script running inside an authenticated
   * session, with the DOM of the CMS in front of it, is another.
   */
  const admin = [
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

  return { site, admin };
}
