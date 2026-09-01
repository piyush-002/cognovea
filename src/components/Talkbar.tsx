import Script from 'next/script';

/**
 * The Talkbar assistant widget.
 *
 * Two departures from the snippet Talkbar gives you, both deliberate:
 *
 * 1. The credentials come from the environment. The supplied snippet carries
 *    the app id and key as literals. They end up in the page source either way
 *    — this is a browser widget, so whatever it is given is published — but a
 *    literal also puts them in git history and makes rotating one a code change
 *    and a redeploy. Reading them from the environment costs nothing and means
 *    a rotated key is a Vercel setting and a rebuild.
 *
 *    The variable is named PUBLISHABLE_KEY rather than API_KEY on purpose. The
 *    attribute Talkbar wants is `data-api-key`, and a slot called API_KEY on a
 *    component that renders into HTML is an invitation to paste a server key
 *    into it. Whatever goes here is readable by every visitor; the name should
 *    say so at the point somebody fills it in.
 *
 * 2. It loads on idle, not in <head> and not even straight after hydration.
 *    A synchronous third-party script in the head sits directly in front of
 *    first paint. But `afterInteractive` was not far enough either: this one
 *    widget reaches seven origins — its own UI and API hosts, a websocket, an
 *    asset CDN, a CloudFront distribution and two Adobe Typekit hosts — each
 *    needing DNS, TLS and a round trip, and one of them serving a webfont.
 *    That is precisely the cost this layout removed when it stopped loading
 *    Google Fonts, reintroduced sevenfold for a bubble in the corner that
 *    nobody looks at in the first seconds.
 *
 *    `lazyOnload` defers all of it until the browser is idle, after the page
 *    has loaded and settled. The widget appears a beat later, which no visitor
 *    will notice, and it stops competing with the content for bandwidth and
 *    main thread during the window Core Web Vitals actually measures.
 *
 * Nothing renders unless both values are set, so a preview deploy or a local
 * checkout without them simply has no widget rather than a broken one — and the
 * CSP in next.config.mjs stays closed in exactly the same case.
 */
const APP_ID = process.env.NEXT_PUBLIC_TALKBAR_APP_ID;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY;

export default function Talkbar() {
  if (!APP_ID || !PUBLISHABLE_KEY) return null;

  return (
    <Script
      id="talkbar"
      src="https://ui-server.app.talkbar.ai/integration/talkbar.js"
      strategy="lazyOnload"
      data-app-id={APP_ID}
      data-api-key={PUBLISHABLE_KEY}
    />
  );
}
