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
 * 2. It loads after hydration rather than blocking in <head>. A synchronous
 *    third-party script in the head sits directly in front of first paint: the
 *    browser cannot render until it has resolved DNS for a host it has never
 *    seen, opened TLS, and executed whatever comes back. That is the same cost
 *    that got the Google Fonts <link> removed from this layout, and it would be
 *    paid on every page for a widget nobody sees until they look at the corner
 *    of the screen. `afterInteractive` still loads it on every page, still
 *    site-wide, just not in front of the content.
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
      strategy="afterInteractive"
      data-app-id={APP_ID}
      data-api-key={PUBLISHABLE_KEY}
    />
  );
}
