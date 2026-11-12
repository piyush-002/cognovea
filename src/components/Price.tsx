import { formatInr, formatUsd, type Money } from '@/lib/pricing';

/**
 * A price in both currencies, with CSS deciding which one is visible.
 *
 * There is no client JavaScript here and no `use client`. Both figures render
 * on the server into every page, and the inline script in the frontend layout
 * sets data-geo="in" on <html> before first paint when the visitor's clock is
 * on Indian Standard Time; the rules in globals.css do the rest.
 *
 * Three consequences worth knowing:
 *
 * 1. No layout shift and no flash. The choice is made before the browser
 *    paints, so nothing swaps under the reader.
 * 2. Crawlers, and anyone with JavaScript off, see the dollar price. That is
 *    deliberate: it is the figure that should be indexed now that the site is
 *    selling outside India.
 * 3. Both numbers are in the page source, so this is a display convenience,
 *    not a secret. Anyone who looks can see both. That is the honest way to do
 *    regional pricing anyway.
 *
 * The signal is the timezone, which is a proxy for the country and not the
 * country itself. An Indian visitor on a laptop still set to Pacific time sees
 * dollars; someone in Bengaluru on holiday from London sees rupees. Getting
 * this exactly right needs the request's IP, which means rendering these pages
 * per-request instead of serving them from cache.
 */
export default function Price({ amount }: { amount: Money }) {
  return (
    <span className="price">
      <span className="price__usd">{formatUsd(amount.usd)}</span>
      <span className="price__inr">{formatInr(amount.inr)}</span>
    </span>
  );
}
