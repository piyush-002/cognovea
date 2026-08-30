import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import { PLANNED_PLAYBOOKS, publishedPlaybooks } from '@/lib/playbooks';
import { pageMetadata } from '@/lib/seo';
import { abs } from '@/lib/site';

const PATH = '/playbooks';

/**
 * The playbooks index.
 *
 * A hub as well as a set: roundups and resource pages link to a section rather
 * than to one document, and the individual playbooks need a parent that is not
 * each other. It is also what each playbook's breadcrumb points at, and a
 * breadcrumb resolving to a 404 is a broken link inside structured data on the
 * page whose entire job is to be linked to.
 *
 * Industries with nothing written yet are listed but not linked. A stub page
 * would compete with the real one, tell a first-time visitor the set is thin,
 * and earn nothing.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Data & AI Playbooks by Industry | Free',
  description:
    'What data and AI are actually used for in your industry, what each use case needs, how to prove it worked, and where it fails. Free to read, every figure sourced.',
  path: PATH,
});

const CRUMBS = [{ href: PATH, label: 'Playbooks' }];

export default function PlaybooksPage() {
  const live = publishedPlaybooks();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Data & AI Use Case Playbooks',
            url: abs(PATH),
            description:
              'Industry-by-industry playbooks covering what data and AI are used for, what each use case requires, and how to tell whether it worked.',
            hasPart: live.map((p) => ({
              '@type': 'Article',
              headline: p.title,
              url: abs(`${PATH}/${p.slug}`),
            })),
          },
        ]}
      />

      <PageHero
        eyebrow="Playbooks"
        title="Data & AI Playbooks, by industry"
        intro="What data and AI are genuinely used for in your sector, what each use case needs before it can work, how you would know it worked, and where it fails. Free to read in full — no sign-up to read anything."
        crumbs={CRUMBS}
      />

      <section className="band">
        <div className="wrap">
          <div className="pb-grid">
            {live.map((p) => (
              <Link key={p.slug} href={`${PATH}/${p.slug}`} className="pb-card">
                <span className="pb-card__industry">{p.industry}</span>
                <h2 className="pb-card__title">{p.title}</h2>
                <p className="pb-card__blurb">{p.description}</p>
                <span className="pb-card__meta">
                  {p.useCases.length} use cases · read free
                </span>
              </Link>
            ))}

            {PLANNED_PLAYBOOKS.map((p) => (
              <div key={p.slug} className="pb-card pb-card--soon">
                <span className="pb-card__industry">{p.industry}</span>
                <h2 className="pb-card__title">Data &amp; AI Playbook</h2>
                <p className="pb-card__blurb">
                  In preparation. Researched and sourced the same way as the first.
                </p>
                <span className="pb-card__meta">Not yet published</span>
              </div>
            ))}
          </div>

          {/* A footnote to the grid, not an entry in it: set across the full
              width beneath the cards rather than in a column beside them. */}
          <p className="pb-notes">
            <span className="pb-notes__star" aria-hidden="true">
              *
            </span>
            These are written to be checked. Every figure carries the study it came from, how that study was conducted,
            and what it does not support — including where the most widely quoted number in the sector turns out to be a
            survey of 181 people commissioned by a company selling the remedy.
          </p>
        </div>
      </section>

      <CtaBand
        title="Want this applied to your own numbers?"
        body="A Data Health Check works through the same questions against your systems rather than your industry in general: what you have, what it would support, and what it would take."
      />
    </>
  );
}
