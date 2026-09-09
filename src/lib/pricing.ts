/**
 * Headline prices, written once, in both currencies.
 *
 * A Data Health Check is quoted at Rs 1,50,000 in India and $2,499 everywhere
 * else. Those are two prices, not one price converted: at roughly 95 to the
 * dollar the rupee figure is about $1,580, so the dollar number is a decision
 * about what the work is worth to a buyer outside India, not an exchange rate.
 * Rishabh set it. If the rupee figure ever moves, this is the only file that
 * needs to know.
 *
 * Which one a visitor sees is decided in the browser, not here, and not on the
 * server: see Price.tsx and the geo script in (frontend)/layout.tsx. Both
 * numbers are in the HTML on every page; CSS hides one. That is what keeps
 * these pages statically rendered and cached at the edge, which is most of why
 * they score what they score.
 */

export type Money = {
  /** Shown to everyone outside India, and to every crawler. */
  usd: number;
  /** Shown when the visitor's clock is set to Indian Standard Time. */
  inr: number;
};

export const PRICES = {
  /** Where a Data Health Check starts, scope depending. */
  healthCheckFrom: { usd: 2499, inr: 150000 },
} satisfies Record<string, Money>;

export function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

/**
 * "Rs", not the rupee glyph, because that is how all of the source documents
 * write it and this figure is quoted in prose taken from them.
 *
 * en-IN, not en-US, because Indian grouping puts the commas in different
 * places: 1,50,000 rather than 150,000. Getting that wrong is the kind of
 * detail an Indian buyer reads as carelessness.
 */
export function formatInr(n: number): string {
  return `Rs ${n.toLocaleString('en-IN')}`;
}
