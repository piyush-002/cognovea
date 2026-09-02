import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/content';
import { publishedPlaybooks } from '@/lib/playbooks';
import { getPortfolio } from '@/lib/portfolio';
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

  /* Derived, not listed. A playbook that is published is in the sitemap by
     construction; there is no second place to remember to update. They rank
     above the articles for the same reason the calculator does — these are the
     pages other sites are meant to link to. */
  const playbookEntries: MetadataRoute.Sitemap = publishedPlaybooks().map((p) => ({
    url: abs(`/playbooks/${p.slug}`),
    lastModified: new Date(p.updated),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  /* Portfolio entries, minus any marked noindex — an entry a client is content
     to have on the site but not in a search index must not be submitted to one.
     Derived like the playbooks, so publishing one cannot leave it out. */
  const portfolio = await getPortfolio();
  const portfolioEntries: MetadataRoute.Sitemap = portfolio
    .filter((e) => !e.noindex)
    .map((e) => ({
      url: abs(`/portfolio/${e.slug}`),
      lastModified: e.publishedAt ? new Date(e.publishedAt) : built,
      changeFrequency: 'monthly',
      priority: 0.8,
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

  return [...staticEntries, ...playbookEntries, ...portfolioEntries, ...postEntries];
}
