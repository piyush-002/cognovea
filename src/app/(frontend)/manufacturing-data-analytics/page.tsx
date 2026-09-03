import type { Metadata } from 'next';
import ServicePage from '@/components/ServicePage';
import { manufacturingAnalytics as service } from '@/lib/services';
import { pageMetadata } from '@/lib/seo';

/* The page is the route and the metadata; everything else lives in the service
   data and the shared template. See src/lib/services/types.ts for why. */
export const metadata: Metadata = pageMetadata({
  title: service.title,
  description: service.description,
  path: `/${service.slug}`,
  image: { url: service.image.src, alt: service.image.alt },
});

export default function Page() {
  return <ServicePage service={service} />;
}
