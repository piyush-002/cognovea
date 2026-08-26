import type { MetadataRoute } from 'next';
import { abs, routes } from '@/lib/site';

/**
 * Emits /sitemap.xml at build time.
 *
 * Same reason as robots.ts: a metadata route is a Route Handler, and under
 * `output: 'export'` it has to be declared static.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-08-26');

  return routes.map((r) => ({
    url: abs(r.path),
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
