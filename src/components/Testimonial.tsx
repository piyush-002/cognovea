import { Suspense } from 'react';
import QuoteCard from '@/components/QuoteCard';
import { getTestimonials } from '@/lib/content';

/**
 * Fetches a client quote and hands it to <QuoteCard />.
 *
 * Renders nothing when none is published, and nothing when none matches the
 * page's service, rather than falling back to something generic.
 *
 * Deliberately emits no `Review` or `AggregateRating` structured data. Google
 * treats reviews of a business collected and published on that business's own
 * site as self-serving: they are ineligible for review rich results, and
 * marking them up anyway risks a structured-data manual action.
 */
async function Quote({
  service,
  pageKey,
  tone,
}: {
  service?: string;
  pageKey?: string;
  tone: 'light' | 'dark';
}) {
  const [t] = await getTestimonials({ service, pageKey, limit: 1 });
  if (!t) return null;
  return <QuoteCard t={t} tone={tone} />;
}

export default function Testimonial({
  service,
  pageKey,
  tone = 'light',
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
}) {
  return (
    <Suspense fallback={null}>
      <Quote service={service} pageKey={pageKey ?? service ?? 'home'} tone={tone} />
    </Suspense>
  );
}
