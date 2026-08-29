import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import { pageMetadata } from '@/lib/seo';
import { abs } from '@/lib/site';

const PATH = '/tools';

/**
 * The tools index.
 *
 * It exists because the calculator's breadcrumb names it, and a breadcrumb
 * pointing at a 404 is worse than no breadcrumb — it is a broken link in
 * structured data, on the page whose whole purpose is to be linked to.
 *
 * It also earns its place: roundups link to hubs as well as to individual
 * tools, and a second tool needs somewhere to live that is not the first one's
 * URL.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Free Data & BI Tools | Cognovea',
  description:
    'Free tools from Cognovea for working out what your data and reporting actually cost. No sign-up, and every assumption is shown and sourced.',
  path: PATH,
});

const CRUMBS = [{ href: PATH, label: 'Tools' }];

const TOOLS = [
  {
    href: '/tools/bi-automation-calculator',
    name: 'BI Automation Savings Calculator',
    blurb:
      'What manual reporting costs you a year — in hours, in rework, and in decisions made on stale data — and what automating it would recover.',
    time: 'About 90 seconds',
  },
];

export default function ToolsPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Free Data & BI Tools',
            url: abs(PATH),
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: TOOLS.map((t, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: t.name,
                url: abs(t.href),
              })),
            },
          },
        ]}
      />

      <PageHero
        eyebrow="Tools"
        title="Free Tools, No Sign-Up"
        crumbs={CRUMBS}
        compact
        intro="Working tools rather than lead magnets. Nothing here is gated, every assumption is shown and sourced, and you can share a result without sending anyone your email address."
      />

      <section className="band">
        <div className="wrap">
          <div className="grid grid--2">
            {TOOLS.map((t) => (
              <article className="card rv" key={t.href}>
                <p className="eyebrow">{t.time}</p>
                <h2 className="h-sm" style={{ marginTop: '0.7rem' }}>
                  <Link href={t.href} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {t.name}
                  </Link>
                </h2>
                <p>{t.blurb}</p>
                <p style={{ marginTop: '1rem' }}>
                  <Link className="link-arrow" href={t.href}>
                    Open the tool
                  </Link>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Want Measurements Instead of Estimates?"
        body="A two week Data Health Check replaces the assumptions in these tools with a read of your actual data, pipelines and reporting."
        primary={{ href: '/data-health-check', label: 'Book a Data Health Check' }}
        secondary={{ href: '/contact', label: 'Talk to Us' }}
      />
    </>
  );
}
