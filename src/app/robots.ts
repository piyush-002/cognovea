import type { MetadataRoute } from 'next';
import { CANONICAL_URL, shouldAllowCrawling } from '@/lib/host-redirect.mjs';
import { site } from '@/lib/site';

/**
 * Emits /robots.txt at build time.
 *
 * Crawling is allowed only on the deployment that actually serves the
 * canonical domain; see shouldAllowCrawling in src/lib/host-redirect.mjs for
 * why, and for the caveat that robots.txt is a request rather than a control.
 */
export default function robots(): MetadataRoute.Robots {
  const allow = shouldAllowCrawling({
    siteUrl: CANONICAL_URL,
    serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    isDeployed: Boolean(process.env.VERCEL),
  });

  if (!allow) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing here is secret, but the admin and the API have no business
        // in an index, and crawling them only spends crawl budget.
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
