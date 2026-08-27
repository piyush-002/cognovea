import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/content';
import { abs, routes } from '@/lib/site';

/**
 * Regenerated hourly so newly published articles are discoverable without a
 * redeploy. The static routes are the source of truth for the pages that live
 * in code; everything under /insights comes from Payload.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const built = new Date();

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: abs(r.path),
    lastModified: built,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Falls back to [] if the database is unreachable, so a transient outage
  // produces a sitemap missing its articles rather than a failed build.
  const posts = await getPosts(500);

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: abs(`/insights/${p.slug}`),
    lastModified: p.updatedAt ? new Date(p.updatedAt) : p.publishedAt ? new Date(p.publishedAt) : built,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
