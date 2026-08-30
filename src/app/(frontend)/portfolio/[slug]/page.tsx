import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import PortfolioBlocks from '@/components/PortfolioBlocks';
import { getPortfolio, getPortfolioEntry, sectorLabel } from '@/lib/portfolio';
import { pageMetadata } from '@/lib/seo';
import { abs, site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

/**
 * Pre-render what exists at build time; anything published later is generated
 * on first request rather than 404ing, which is what an editor expects after
 * hitting publish.
 */
export async function generateStaticParams() {
  const entries = await getPortfolio();
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPortfolioEntry(slug);
  if (!entry) return pageMetadata({ title: 'Not found', description: '', path: `/portfolio/${slug}` });

  return pageMetadata({
    title: entry.title,
    description: entry.summary,
    path: `/portfolio/${entry.slug}`,
    image: entry.cover ? { url: entry.cover.url, alt: entry.cover.alt } : undefined,
    type: 'article',
    publishedTime: entry.publishedAt ?? undefined,
    // Set per entry, for work a client is content to have on the site but not
    // in a search index.
    robots: entry.noindex ? { index: false, follow: true } : undefined,
  });
}

export default async function PortfolioEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = await getPortfolioEntry(slug);
  if (!entry) notFound();

  const path = `/portfolio/${entry.slug}`;
  const crumbs = [
    { href: '/portfolio', label: 'Portfolio' },
    { href: path, label: entry.title },
  ];
  const sector = sectorLabel(entry.sector);

  /* Product or client work, and who it was for — resolved in lib/portfolio so
     an unpermitted client name cannot reach a template. */
  const eyebrow = [entry.kind === 'product' ? 'Product' : entry.attribution, sector]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': entry.kind === 'product' ? 'SoftwareApplication' : 'Article',
            name: entry.title,
            headline: entry.title,
            description: entry.summary,
            url: abs(path),
            ...(entry.cover ? { image: abs(entry.cover.url) } : {}),
            ...(entry.publishedAt ? { datePublished: entry.publishedAt } : {}),
            ...(entry.kind === 'product'
              ? { applicationCategory: 'BusinessApplication', operatingSystem: 'Web' }
              : {}),
            publisher: { '@id': `${site.url}/#organization` },
            author: { '@type': 'Organization', name: site.name, url: abs('/') },
          },
        ]}
      />

      <PageHero eyebrow={eyebrow || 'Portfolio'} title={entry.title} intro={entry.summary} crumbs={crumbs} />

      <section className="band">
        <div className="wrap pf">
          <PortfolioBlocks body={entry.body} />

          <p className="pf__more">
            <Link href="/portfolio">All portfolio entries</Link>
          </p>
        </div>
      </section>

      <CtaBand
        title="Want something like this for your operation?"
        body="A Data Health Check establishes what your systems hold today, what that would support, and what the first useful step would take."
      />
    </>
  );
}
