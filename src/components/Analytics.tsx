'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useCallback, useEffect, useState } from 'react';
import ConsentBanner from '@/components/ConsentBanner';
import { CONSENT_STORAGE_KEY as STORAGE_KEY, COOKIE_SETTINGS_EVENT } from '@/lib/consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Consent = 'granted' | 'denied' | 'unset';

/**
 * Removes the cookies GA4 has already written.
 *
 * Withdrawing consent has to actually undo something. Setting a flag while
 * `_ga` sits in the browser for two more years is theatre, and it is the
 * difference between a consent banner that works and one that only looks like
 * it does. The domain variants matter: gtag writes to the registrable domain
 * (.cognovea.com), so deleting on the exact host alone silently fails.
 */
function clearAnalyticsCookies() {
  try {
    const host = window.location.hostname;
    const parts = host.split('.');
    const domains = [undefined, host, `.${host}`];
    if (parts.length > 2) domains.push(`.${parts.slice(-2).join('.')}`);

    const names = document.cookie
      .split(';')
      .map((c) => c.split('=')[0].trim())
      .filter((n) => n.startsWith('_ga'));

    for (const name of names) {
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
      }
    }
  } catch {
    // Nothing to do: a browser that blocks cookie access has none to clear.
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function readConsent(): Consent {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'unset';
    // Stored as JSON so the choice carries a date, which is what a regulator
    // asks for when they ask "when did this person consent?". Plain strings
    // from the first version are still honoured.
    if (raw === 'granted' || raw === 'denied') return raw;
    const parsed = JSON.parse(raw) as { value?: string };
    return parsed.value === 'granted' || parsed.value === 'denied' ? parsed.value : 'unset';
  } catch {
    // Private mode, or storage blocked by the browser. Treat as undecided
    // rather than crashing, and since nothing can be persisted, the banner
    // will simply ask again next visit.
    return 'unset';
  }
}

/**
 * GA4, loaded only after the visitor agrees.
 *
 * This is stricter than Google Consent Mode, which loads gtag.js immediately
 * and merely withholds cookies until consent. The stricter version was chosen
 * because the site is operated from India and the DPDP Act 2023 is built around
 * prior, informed consent, and because the privacy policy on this site tells
 * visitors analytics only run with their agreement. The code should match what
 * the policy promises rather than the other way round.
 *
 * The cost is real and worth stating: visitors who ignore the banner are never
 * measured, so GA4 will under-report compared with an unconsented setup.
 */
export default function Analytics() {
  const [consent, setConsent] = useState<Consent>('unset');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Read on mount rather than during render: localStorage does not exist on the
  // server, and touching it during render would produce a hydration mismatch.
  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
  }, []);

  const decide = useCallback((value: Exclude<Consent, 'unset'>) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString(), version: 1 }),
      );
    } catch {
      // Not persisting is survivable; the choice still applies for this session.
    }
    // Declining after having accepted has to remove what was already set.
    if (value === 'denied') clearAnalyticsCookies();
    setConsent(value);
  }, []);

  // The footer's "Cookie settings" control reopens the banner, so a choice can
  // be withdrawn without hunting through browser settings. Required in spirit by
  // both the DPDP Act and the GDPR: consent must be as easy to withdraw as it
  // was to give.
  useEffect(() => {
    const reopen = () => setConsent('unset');
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const active = Boolean(GA_ID) && consent === 'granted';

  // App Router navigations do not reload the page, so each route change needs an
  // explicit page_view. Without this, GA4 records only the first page of a visit.
  useEffect(() => {
    if (!active || !pathname) return;
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [active, pathname]);

  useReportWebVitals((metric) => {
    if (!active) return;
    window.gtag?.('event', metric.name, {
      // GA4 event values must be integers. CLS is a small decimal, so it is
      // scaled by 1000. Divide by 1000 again when reading the reports.
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: (metric as { rating?: string }).rating ?? 'unknown',
      // Keeps these from polluting engagement and bounce metrics.
      non_interaction: true,
    });
  });

  return (
    <>
      {active && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'granted'
              });
              // send_page_view: false matters. By default gtag('config') fires a
              // page_view immediately, and the effect below fires one as soon as
              // it has a pathname. Leaving both on double-counts the first page
              // of every session, which quietly inflates sessions and destroys
              // any landing-page or bounce number you look at later. The effect
              // owns page views, because it is the only one that also sees App
              // Router navigations.
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {/* Rendered only after mount, so the server and client markup match. */}
      {mounted && consent === 'unset' && GA_ID && (
        <ConsentBanner onAccept={() => decide('granted')} onDecline={() => decide('denied')} />
      )}
    </>
  );
}
