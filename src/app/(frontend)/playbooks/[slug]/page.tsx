import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import Faq from '@/components/Faq';
import JsonLd from '@/components/JsonLd';
import { getPlaybook, publishedPlaybooks } from '@/lib/playbooks';
import { SOURCES, STANDING_LABEL } from '@/lib/playbooks/sources';
import { faqSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';
import { abs, site } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

/**
 * One playbook.
 *
 * Statically generated from the content module rather than the CMS: these are
 * long, heavily structured and edited rarely, and putting them behind an editor
 * would mean either a block type per section or a rich-text field that lets the
 * sourcing rules be bypassed. tools/check-playbooks.mjs can only enforce "no
 * figure without a source" while the content is data.
 */
export async function generateStaticParams() {
  return publishedPlaybooks().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const playbook = getPlaybook(slug);
  if (!playbook) return pageMetadata({ title: 'Not found', description: '', path: `/playbooks/${slug}` });

  return pageMetadata({
    title: playbook.title,
    description: playbook.description,
    path: `/playbooks/${playbook.slug}`,
    type: 'article',
    publishedTime: playbook.updated,
    modifiedTime: playbook.updated,
  });
}

export default async function PlaybookPage({ params }: Props) {
  const { slug } = await params;
  const playbook = getPlaybook(slug);
  if (!playbook) notFound();

  const path = `/playbooks/${playbook.slug}`;
  const crumbs = [
    { href: '/playbooks', label: 'Playbooks' },
    { href: path, label: playbook.industry },
  ];

  /* Only the sources actually referenced on the page.
  
     There is no visible reference list any more — each piece of evidence cites
     itself inline, and the FAQ carries the method critique in prose. This feeds
     the citation array in the Article schema, which is what a search engine or
     an assistant reads to see the page rests on something. */
  const cited = Object.values(SOURCES).filter((s) =>
    playbook.useCases.some((u) => u.evidence?.source.id === s.id) ||
    playbook.faq.some((f) => f.answer.includes(s.publisher.split(' ')[0])),
  );

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          faqSchema(playbook.faq.map((f) => ({ q: f.question, a: f.answer }))),
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: playbook.title,
            description: playbook.description,
            url: abs(path),
            mainEntityOfPage: { '@type': 'WebPage', '@id': abs(path) },
            datePublished: playbook.updated,
            dateModified: playbook.updated,
            author: { '@type': 'Organization', name: site.name, url: abs('/') },
            publisher: { '@id': `${site.url}/#organization` },
            about: { '@type': 'Thing', name: `Artificial intelligence in ${playbook.industry.toLowerCase()}` },
            /* Named because a page whose selling point is that it is checkable
               should say what it is checkable against. */
            citation: cited.map((s) => ({
              '@type': 'CreativeWork',
              name: s.label,
              url: s.url,
              publisher: { '@type': 'Organization', name: s.publisher },
              datePublished: String(s.year),
            })),
          },
        ]}
      />

      <PageHero
        eyebrow={`${playbook.industry} playbook`}
        title={playbook.title}
        intro={playbook.standfirst}
        crumbs={crumbs}
      />

      <section className="band">
        <div className="wrap pb-layout">
          {/* The contents are a sidebar, not a block dropped in the reading
              column. A nine-item list set full width above the article pushes
              the first thing worth reading below the fold and is scrolled past
              rather than used; on the left it stays visible while you read, and
              the industry motif gives the column something to sit under. */}
          <aside className="pb-side">
            <nav className="pb__toc" aria-label="On this page">
              <span className="pb__toc-lab">On this page</span>
              <ol>
                {playbook.useCases.map((u) => (
                  <li key={u.id}>
                    <a href={`#${u.id}`}>{u.name}</a>
                  </li>
                ))}
                <li>
                  <a href="#readiness">Before any of it works</a>
                </li>
                <li>
                  <a href="#questions">Questions people ask</a>
                </li>
              </ol>
            </nav>
          </aside>

          {/* The right-hand column. Between the contents and the article in the
              source order so that when the three columns collapse to one it
              stacks contents, then who-this-is-for, then the article — rather
              than stranding the note at the foot of the page. Its position on
              a wide screen is set by grid-column, not by source order. */}
          <aside className="pb-rail">
            <p className="pb__audience">{playbook.audience}</p>
          </aside>

          <div className="pb">
            <h2 className="pb__h2">The use cases</h2>

          {playbook.useCases.map((u, i) => (
            <article key={u.id} id={u.id} className="pb__case">
              <header>
                <span className="pb__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{u.name}</h3>
                <p className="pb__sum">{u.summary}</p>
              </header>

              <p>{u.what}</p>

              <div className="pb__cols">
                <div className="pb__col">
                  <h4>What it needs</h4>
                  <ul>
                    {u.needs.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
                <div className="pb__col">
                  <h4>How you would know it worked</h4>
                  <p>{u.proof}</p>
                </div>
              </div>

              <div className="pb__fails">
                <h4>Where it fails</h4>
                <p>{u.fails}</p>
              </div>

              {u.evidence ? (
                <aside className="pb__evi">
                  <p>{u.evidence.claim}</p>
                  <cite>
                    <a href={u.evidence.source.url} rel="nofollow noopener" target="_blank">
                      {u.evidence.source.label}
                    </a>
                    , {u.evidence.source.publisher}, {u.evidence.source.year} ·{' '}
                    <b>{STANDING_LABEL[u.evidence.source.standing]}</b>
                  </cite>
                </aside>
              ) : null}
            </article>
          ))}

          <h2 className="pb__h2" id="readiness">
            Before any of it works
          </h2>
          <p className="pb__lead">
            Every use case above assumes these. Where one is missing, it is the project — not a prerequisite to be waved
            through in a kick-off meeting.
          </p>
            {/* Collapsed, but rendered.
            
                The panels are always in the HTML — Faq hides them with CSS
                rather than rendering them conditionally — so a crawler and an
                assistant read the whole thing while a visitor sees four
                headings instead of four paragraphs. Nothing is behind
                JavaScript. */}
            <Faq
              items={playbook.readiness.map((r) => ({ q: r.name, a: r.detail }))}
              defaultOpen={null}
            />

          <h2 className="pb__h2" id="questions">
            Questions people ask
          </h2>
            <Faq items={playbook.faq.map((f) => ({ q: f.question, a: f.answer }))} defaultOpen={0} />

            <p className="pb__more">
              <Link href="/playbooks">All industry playbooks</Link> ·{' '}
              <Link href="/tools/bi-automation-calculator">Work out what your reporting costs you</Link>
            </p>
          </div>
        </div>
      </section>

      <CtaBand
        title={`Apply this to your ${playbook.industry.toLowerCase()} operation`}
        body="A Data Health Check runs these questions against your systems rather than your sector: what you have, what it would support today, and what the first useful thing would take."
      />
    </>
  );
}
