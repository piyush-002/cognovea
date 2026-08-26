/**
 * Structured-data builders.
 *
 * These live in lib/ rather than alongside the components on purpose: page.tsx
 * files are Server Components, and a Server Component cannot call a function
 * exported from a 'use client' module — Next.js turns those exports into client
 * references, not callable functions. Keeping the builders here means the same
 * data can feed both the visible UI (client) and the JSON-LD (server).
 */

export type FaqItem = {
  q: string;
  /** One string, or several paragraphs. */
  a: string | string[];
};

/** FAQPage — built from the exact items the accordion renders, so the two can't drift. */
export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: Array.isArray(item.a) ? item.a.join(' ') : item.a,
      },
    })),
  };
}
