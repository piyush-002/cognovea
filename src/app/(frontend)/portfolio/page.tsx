import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import { toSameOriginPath } from '@/lib/media-url';
import { getPortfolio, sectorLabel } from '@/lib/portfolio';
import { pageMetadata } from '@/lib/seo';
import { abs } from '@/lib/site';

const PATH = '/portfolio';

/**
 * The portfolio index.
 *
 * Five minutes of staleness at most, and a publish in the admin refreshes it
 * immediately through the collection's hooks — the same arrangement every other
 * CMS-backed page here uses.
 */
export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Portfolio | What We Have Built',
  description:
    'Products we have built and client work we can show — what each one does, how it was put together, and what it was for.',
  path: PATH,
});

const CRUMBS = [{ href: PATH, label: 'Portfolio' }];

export default async function PortfolioPage() {
  const entries = await getPortfolio();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Portfolio',
            url: abs(PATH),
            hasPart: entries
              .filter((e) => !e.noindex)
              .map((e) => ({ '@type': 'CreativeWork', name: e.title, url: abs(`${PATH}/${e.slug}`) })),
          },
        ]}
      />

      <PageHero
        eyebrow="Portfolio"
        title="What we have built"
        intro="Products we own and client work we are able to show. Each one sets out what it does, how it is put together, and what it was for."
        crumbs={CRUMBS}
        compact
      />

      <section className="band">
        <div className="wrap">
          {entries.length === 0 ? (
            /* An empty portfolio is a real state — before the first entry is
               published, and during a database outage, where getPortfolio
               returns [] rather than failing the page. Saying so beats an
               empty grid that looks broken. */
            <p className="pf-empty">Nothing published here yet.</p>
          ) : (
            <div className="pf-grid">
              {entries.map((e) => (
                <Link key={e.slug} href={`${PATH}/${e.slug}`} className="pf-card">
                  {e.cover ? (
                    <Image
                      className="pf-card__img"
                      src={toSameOriginPath(e.cover.url)}
                      alt={e.cover.alt}
                      width={e.cover.width || 1200}
                      height={e.cover.height || 800}
                      sizes="(min-width: 1100px) 22rem, (min-width: 700px) 45vw, 92vw"
                      loading="lazy"
                    />
                  ) : null}
                  <span className="pf-card__meta">
                    {e.kind === 'product' ? 'Product' : (e.attribution ?? 'Client work')}
                    {sectorLabel(e.sector) ? ` · ${sectorLabel(e.sector)}` : ''}
                  </span>
                  <h2 className="pf-card__title">{e.title}</h2>
                  <p className="pf-card__blurb">{e.summary}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Something here look like your problem?"
        body="A Data Health Check works through the same questions against your systems: what you have, what it would support today, and what the first useful thing would take."
      />
    </>
  );
}
