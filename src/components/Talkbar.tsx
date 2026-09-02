'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * The Talkbar assistant widget, loaded on the visitor's first interaction.
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
 * 2. Nothing loads until the visitor moves, scrolls, taps or types.
 *
 *    This one widget reaches seven origins — its own UI and API hosts, a
 *    websocket, an asset CDN, a CloudFront distribution and two Adobe Typekit
 *    hosts — each needing DNS, TLS and a round trip, and one of them serving a
 *    webfont. It also parses and executes a third-party bundle on the main
 *    thread, and it sets third-party cookies.
 *
 *    `lazyOnload` deferred that until the browser was idle, which sounds like
 *    enough and is not: idle arrives while the page is still being measured, so
 *    all seven connections and the bundle's execution still landed inside the
 *    window that Total Blocking Time and Largest Contentful Paint are scored
 *    over.
 *
 *    For a real visitor this is not slower — it is usually faster. Any of
 *    pointermove, scroll, touch or a keypress triggers it, which on a desktop
 *    happens within a second or so of the page appearing, and the script then
 *    loads at `afterInteractive` rather than waiting for an idle callback. What
 *    changes is that the widget no longer competes with the page for bandwidth
 *    and main thread during first paint.
 *
 *    Worth being straight about the measurement, though: an automated audit
 *    never interacts with a page, so it will not load this at all, and a lab
 *    score that improves for that reason overstates the gain. The real-user
 *    gain is narrower than the lab number will suggest — but it is real, and it
 *    is in the part of the load that matters.
 *
 *    To go back to loading it unconditionally, delete the gate and render the
 *    <Script> directly with strategy="lazyOnload".
 *
 * Nothing renders unless both values are set, so a preview deploy or a local
 * checkout without them simply has no widget rather than a broken one — and the
 * CSP in next.config.mjs stays closed in exactly the same case.
 */
const APP_ID = process.env.NEXT_PUBLIC_TALKBAR_APP_ID;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_TALKBAR_PUBLISHABLE_KEY;

/**
 * Signals that mean a person is present.
 *
 * pointermove is the one that fires for most desktop visitors, and it fires
 * early. scroll and touchstart cover phones; keydown covers anyone navigating
 * by keyboard, who would otherwise never produce a pointer event at all.
 */
const WAKE_EVENTS = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel'] as const;

export default function Talkbar() {
  const [woken, setWoken] = useState(false);
  const configured = Boolean(APP_ID && PUBLISHABLE_KEY);

  useEffect(() => {
    if (!configured) return;

    const wake = () => setWoken(true);
    /* passive so the scroll and wheel listeners can never delay a scroll, and
       once so each removes itself; the cleanup covers the ones that never fired. */
    const opts = { once: true, passive: true } as const;
    for (const type of WAKE_EVENTS) window.addEventListener(type, wake, opts);

    return () => {
      for (const type of WAKE_EVENTS) window.removeEventListener(type, wake);
    };
  }, [configured]);

  if (!configured || !woken) return null;

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
