import { Suspense } from 'react';
import LogoStrip from '@/components/LogoStrip';
import { getClients } from '@/lib/content';

/**
 * Fetches client logos and hands them to <LogoStrip />, which owns the markup
 * so it can be rendered and inspected without a database.
 *
 * Renders nothing when nothing is published. An empty "trusted by" band with
 * placeholder boxes is worse than no band: it advertises that there is nothing
 * to show.
 */
async function Logos({ heading, featuredOnly }: { heading: string; featuredOnly: boolean }) {
  const clients = await getClients(featuredOnly);
  return <LogoStrip heading={heading} clients={clients} />;
}

export default function ClientLogos({
  heading = 'Teams we work with',
  featuredOnly = true,
}: {
  heading?: string;
  featuredOnly?: boolean;
}) {
  // No fallback: a skeleton would imply logos that may not exist.
  return (
    <Suspense fallback={null}>
      <Logos heading={heading} featuredOnly={featuredOnly} />
    </Suspense>
  );
}
