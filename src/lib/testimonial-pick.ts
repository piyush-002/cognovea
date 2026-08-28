/**
 * Which testimonial each page shows when none is tagged for it.
 *
 * The tagging mechanism works, but it depends on every quote being tagged by
 * hand, and until that is done every page falls through to the same fallback
 * and shows the identical quote six times. That reads worse than having one
 * testimonial, because it makes the site look automated rather than referenced.
 *
 * So the fallback distributes instead of always taking the first. Pages are
 * given a fixed order, and each takes the quote at its own position in the
 * pool, wrapping when there are more pages than quotes. With five quotes and
 * six pages exactly one repeats, and it is the last page rather than all of
 * them. Tagging still wins: this only runs when nothing is tagged.
 *
 * Deterministic on purpose. Random selection would hand different visitors
 * different quotes, break the static render, and make "which quote is on the
 * services page" an unanswerable question.
 *
 * Kept pure so it can be tested without a database.
 */

/**
 * The fixed order. New pages append; changing the order reshuffles which quote
 * appears where, which is harmless but will look like a content change.
 */
export const PAGE_ORDER = [
  'home',
  'data-health-check',
  'data-engineering-services',
  'data-modernization-services',
  'ai-strategy-consulting',
  'generative-ai-services',
];

/**
 * The index into the pool for a given page.
 *
 * An unknown key sits after the known ones rather than defaulting to 0, so a
 * page added without being registered here does not silently duplicate home.
 */
export function pickIndex(key: string, poolSize: number): number {
  if (poolSize <= 0) return 0;

  const known = PAGE_ORDER.indexOf(key);
  if (known !== -1) return known % poolSize;

  // Stable, order-independent position for anything unregistered.
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return (PAGE_ORDER.length + hash) % poolSize;
}
