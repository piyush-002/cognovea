import type { MetadataRoute } from 'next';
import { abs, routes } from '@/lib/site';

/** Emits /sitemap.xml at build time. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-08-26');

  return routes.map((r) => ({
    url: abs(r.path),
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
