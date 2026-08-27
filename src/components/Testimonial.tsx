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
async function Quote({ service, tone }: { service?: string; tone: 'light' | 'dark' }) {
  const [t] = await getTestimonials({ service, limit: 1 });
  if (!t) return null;
  return <QuoteCard t={t} tone={tone} />;
}

export default function Testimonial({
  service,
  tone = 'light',
}: {
  /** Prefer a quote tagged for this page; fall back to a general one. */
  service?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <Suspense fallback={null}>
      <Quote service={service} tone={tone} />
    </Suspense>
  );
}
