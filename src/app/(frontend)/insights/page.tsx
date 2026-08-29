import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import { formatDate, getPosts } from '@/lib/content';
import { abs } from '@/lib/site';

const PATH = '/insights';

/**
 * Rebuilt at most every five minutes. Publishing in the admin therefore shows up
 * on the site without a redeploy, while every visitor in between is still served
 * cached static HTML rather than waiting on a database round trip.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Insights | Data, Analytics and AI Perspectives',
  description:
    'Perspectives from the Cognovea team on data engineering, analytics, business intelligence and applied AI.',
  alternates: { canonical: `${PATH}/` },
  openGraph: {
    title: 'Insights | Data, Analytics and AI Perspectives',
    description:
      'Perspectives from the Cognovea team on data engineering, analytics, business intelligence and applied AI.',
    url: `${PATH}/`,
  },
};

const CRUMBS = [{ href: PATH, label: 'Insights' }];

export default async function InsightsPage() {
  const posts = await getPosts();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Cognovea Insights',
            url: abs(PATH),
            blogPost: posts.slice(0, 10).map((p) => ({
              '@type': 'BlogPosting',
              headline: p.title,
              url: abs(`/insights/${p.slug}`),
              datePublished: p.publishedAt ?? undefined,
            })),
          },
        ]}
      />

      <PageHero
        eyebrow="Insights"
        title="Perspectives on Data, Analytics and AI"
        crumbs={CRUMBS}
        intro="Practical thinking from the work itself: what actually moves the needle on data quality, reporting people trust, and AI that earns its place."
      />

      <section className="band">
        <div className="wrap">
          {posts.length === 0 ? (
            /* An honest empty state. Better than a page of skeleton cards
               pretending there is content, and it disappears the moment the
               first article is published. */
            <div className="card card--flat rv measure">
              <p className="eyebrow">Coming soon</p>
              <p style={{ marginTop: '0.7rem' }}>
                The first articles are being written. In the meantime, the service pages cover how we
                approach data engineering, modernization and applied AI in detail.
              </p>
              <p style={{ marginTop: '1rem' }}>
                <Link className="link-arrow" href="/data-health-check">
                  See what a Data Health Check covers
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid--2">
              {posts.map((p) => (
                <article className="card rv" key={p.id}>
                  {p.heroImage?.url && (
                    <div className="figure figure--wide" style={{ marginBottom: '1.1rem' }}>
                      <Image
                        src={p.heroImage.url}
                        alt={p.heroImage.alt}
                        width={p.heroImage.width ?? 900}
                        height={p.heroImage.height ?? 560}
                        sizes="(max-width: 899px) 100vw, 46vw"
                      />
                    </div>
                  )}

                  <p className="eyebrow">
                    {formatDate(p.publishedAt)}
                    {p.readingMinutes ? ` · ${p.readingMinutes} min read` : ''}
                  </p>

                  <h2 className="h-sm" style={{ marginTop: '0.7rem' }}>
                    <Link href={`/insights/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {p.title}
                    </Link>
                  </h2>

                  <p>{p.excerpt}</p>

                  <p style={{ marginTop: '1rem' }}>
                    <Link className="link-arrow" href={`/insights/${p.slug}`}>
                      Read the article
                    </Link>
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Want This Applied to Your Own Data?"
        body="A two week Data Health Check turns the general into the specific: what is actually happening in your data, and what to do about it first."
        secondary={{ href: '/contact', label: 'Talk to Our Experts' }}
      />
    </>
  );
}
