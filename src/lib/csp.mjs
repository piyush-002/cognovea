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
 * The Talkbar assistant widget.
 *
 * Its own snippet says only "paste this in <head>", which on a site with a CSP
 * is not enough: without these entries the browser refuses the script and every
 * request it makes, silently as far as the page is concerned. The widget never
 * appears, and nothing in the build, the logs or the deploy says why.
 *
 * The hosts are the ones the loader itself names — ui-server for the script and
 * the chat panel it opens, api-server for the API it talks to. wss: is listed
 * alongside https: on the API host because a chat widget that streams replies
 * does it over a websocket, and connect-src governs that too.
 *
 * If something in the widget still fails, the browser console names the exact
 * directive and origin it wanted. Add that one host here rather than widening
 * to a wildcard.
 */
export const TALKBAR_UI = 'https://ui-server.app.talkbar.ai';
export const TALKBAR_API = 'https://api-server.app.talkbar.ai';
export const TALKBAR_WS = 'wss://api-server.app.talkbar.ai';

/**
 * The widget's asset CDN.
 *
 * Nothing in Talkbar's snippet or its loader mentions this host. It surfaced
 * only as a console violation: the controller pulls an icon webfont from it, so
 * with the stylesheet blocked the widget rendered with no icons at all — the
 * bubble was there, the glyphs were not.
 *
 * Named exactly rather than as https://*.cloudfront.net. The wildcard would be
 * easier and would survive Talkbar changing distributions, but CloudFront is
 * shared infrastructure: allowing the whole of it would let any page on this
 * site pull styles, fonts and images from a large fraction of the internet,
 * which gives up most of what the policy is for. If this ID does change, the
 * widget's icons disappear and the console names the new host, which is a
 * better failure than a policy that cannot fail.
 *
 * Passive assets only. It is not in script-src: a third-party CDN that has not
 * asked to execute code should not be granted it pre-emptively, and if the
 * controller ever does load JavaScript from here the console will say so.
 */
export const TALKBAR_CDN = 'https://d2di5t1ylkcchn.cloudfront.net';

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
      talkbar ? TALKBAR_UI : '',
    ]),
    // Inline style attributes are used throughout the pages. No external
    // stylesheet host for the site's own design: fonts are self-hosted by
    // next/font, so the Google origins that used to be allowed here have been
    // removed rather than left open.
    join(["style-src 'self' 'unsafe-inline'", talkbar ? `${TALKBAR_UI} ${TALKBAR_CDN}` : '']),
    join(["font-src 'self' data:", talkbar ? `${TALKBAR_UI} ${TALKBAR_CDN}` : '']),
    join([
      "img-src 'self' data: blob:",
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://*.public.blob.vercel-storage.com',
      talkbar ? `${TALKBAR_UI} ${TALKBAR_CDN}` : '',
    ]),
    join([
      "connect-src 'self'",
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://*.google-analytics.com',
      'https://*.googletagmanager.com',
      talkbar ? `${TALKBAR_API} ${TALKBAR_WS} ${TALKBAR_UI}` : '',
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
      ? join(["frame-src 'self'", isPreview ? 'https://vercel.live' : '', talkbar ? TALKBAR_UI : ''])
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
