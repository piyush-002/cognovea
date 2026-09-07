import { Suspense } from 'react';
import QuoteCard, { QuoteFigure } from '@/components/QuoteCard';
import Scroller from '@/components/Scroller';
import { getTestimonials } from '@/lib/content';

/**
 * Fetches client quotes and hands them to <QuoteCard />.
 *
 * Renders nothing when none is published, and nothing when none matches the
 * page's service, rather than falling back to something generic.
 *
 * Deliberately emits no `Review` or `AggregateRating` structured data. Google
 * treats reviews of a business collected and published on that business's own
 * site as self-serving: they are ineligible for review rich results, and
 * marking them up anyway risks a structured-data manual action.
 */

/** How many the carousel will pull. Well above what is published; a cap only
    exists so a runaway collection cannot put ninety quotes in the DOM. */
const CAROUSEL_LIMIT = 24;

async function Quote({
  service,
  pageKey,
  tone,
  carousel,
}: {
  service?: string;
  pageKey?: string;
  tone: 'light' | 'dark';
  carousel: boolean;
}) {
  const items = await getTestimonials({ service, pageKey, limit: carousel ? CAROUSEL_LIMIT : 1 });
  if (items.length === 0) return null;

  /* One quote is not a carousel. Arrows that can never move, over a single
     card, say "there is only one of these" more loudly than the quote says
     anything — so a lone testimonial renders exactly as it always did. */
  if (!carousel || items.length === 1) {
    return <QuoteCard t={items[0]} tone={tone} />;
  }

  return (
    <section className={tone === 'dark' ? 'band band--dark' : 'band'}>
      <div className="wrap">
        {/* Deliberately not auto-advancing.
            A logo is recognised at a glance and can move past; a testimonial has
            to be read, and text that slides away mid-sentence is a usability
            failure rather than a flourish — it is also what WCAG 2.2.2 is about.
            This scroller moves only when the reader moves it, by arrow, swipe,
            trackpad or keyboard. */}
        <Scroller
          label="client testimonials"
          itemClass="scroller__item--quote"
          items={items.map((t) => ({
            key: t.id,
            node: <QuoteFigure t={t} reveal={false} />,
          }))}
        />
      </div>
    </section>
  );
}

export default function Testimonial({
  service,
  pageKey,
  tone = 'light',
  carousel = false,
}: {
  /** Prefer a quote tagged for this page. */
  service?: string;
  /**
   * Which page this is, for choosing the fallback. Defaults to `service`, so
   * the six pages take six different quotes when nothing is tagged rather than
   * repeating one. Home has no service and passes 'home'.
   */
  pageKey?: string;
  tone?: 'light' | 'dark';
  /** Show every published quote in a scroller instead of just the best match.
      The service pages keep taking one, so each still leads with the quote
      tagged for it. */
  carousel?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <Quote service={service} pageKey={pageKey ?? service ?? 'home'} tone={tone} carousel={carousel} />
    </Suspense>
  );
}
