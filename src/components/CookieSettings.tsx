'use client';

import { COOKIE_SETTINGS_EVENT } from '@/lib/consent';

/**
 * Footer control that reopens the consent banner.
 *
 * Both the DPDP Act and the GDPR expect withdrawing consent to be as easy as
 * giving it. Before this, the privacy policy could only tell people to clear
 * their browser data, which is neither easy nor specific to this site.
 *
 * A <button>, not a link: it changes state on the current page rather than
 * navigating anywhere, and a screen reader should announce it as such.
 */
export default function CookieSettings() {
  // Rendered only where analytics can actually run. With no measurement ID
  // there is no banner to reopen, and offering the control would imply cookies
  // that do not exist.
  if (!process.env.NEXT_PUBLIC_GA_ID) return null;

  return (
    <button
      type="button"
      className="c-foot__cookie"
      onClick={() => window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT))}
    >
      Cookie settings
    </button>
  );
}
