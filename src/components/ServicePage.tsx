import Link from 'next/link';
import Faq from '@/components/Faq';
import JsonLd from '@/components/JsonLd';
import { Arrow } from '@/components/Bits';
import { faqSchema } from '@/lib/schema';
import { abs, site } from '@/lib/site';
import type { Service, ServiceSection } from '@/lib/services/types';

/**
 * One template, every service page.
 *
 * The band rhythm — plain, tinted, plain, tinted, then deep for the FAQ — is the
 * same one the five original service pages use by hand. Doing it here means a
 * new page cannot get the rhythm wrong, and a change to the rhythm does not mean
 * editing five files and missing one.
 *
 * Sections alternate on their index rather than declaring their own band, so
 * reordering content in the data file cannot produce two tinted bands in a row.
 */

function Section({ section, tinted }: { section: ServiceSection; tinted: boolean }) {
  const head = (
    <div className="s-head rv">
      <p className="eyebrow">{section.eyebrow}</p>
      <h2 className="h-lg">{section.heading}</h2>
      {section.lede ? <p className="lede">{section.lede}</p> : null}
    </div>
  );

  return (
    <section className={tinted ? 'band band--tint' : 'band'}>
      <div className="wrap">
        {head}

        {section.kind === 'prose' ? (
          <div className="measure rv">
            {/* Index keys, here and in the table below. These are positional
                content with no identity of their own — two paragraphs, or two
                cells, may legitimately be identical, and keying by the text
                turns that coincidence into a React error. A comparison table
                is exactly where it happens: two columns both answering
                "Weeks." is a correct table and a duplicate key. The lists are
                static, so the index is both stable and correct. */}
            {section.body.map((p, i) => (
              <p key={i} className="mt-3">
                {p}
              </p>
            ))}
          </div>
        ) : null}

        {section.kind === 'cards' ? (
          <div className={`grid grid--${section.cols ?? 3} rv mt-3`}>
            {section.cards.map((c) => (
              <div key={c.title} className="card card--pad-lg">
                <h3>{c.title}</h3>
                <p className="mt-3">{c.body}</p>
              </div>
            ))}
          </div>
        ) : null}

        {section.kind === 'steps' ? (
          /* An ordered list, because these steps genuinely happen in order and a
             reader needs to know which comes first. Numbering something that is
             not a sequence would be decoration pretending to be information. */
          <ol className="grid grid--3 rv mt-3">
            {section.steps.map((s, i) => (
              <li key={s.title} className="card card--pad-lg">
                <p className="eyebrow">Step {i + 1}</p>
                <h3 className="mt-3">{s.title}</h3>
                <p className="mt-3">{s.body}</p>
              </li>
            ))}
          </ol>
        ) : null}

        {section.kind === 'table' ? (
          <div className="table-scroll rv mt-3">
            <table>
              <caption className="sr-only">{section.caption}</caption>
              <thead>
                <tr>
                  {section.head.map((h, i) => (
                    <th key={i} scope="col" className={i === section.markColumn ? 'col-mark' : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={i} className={i === section.markColumn ? 'col-mark' : undefined}>
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function ServicePage({ service }: { service: Service }) {
  const url = abs(`/${service.slug}/`);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Service',
              '@id': `${url}#service`,
              name: service.h1,
              description: service.description,
              url,
              provider: { '@id': `${site.url}/#organization` },
              areaServed: ['US', 'IN'],
            },
            faqSchema(service.faq),
          ],
        }}
      />

      <section className="band band--dark">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">{service.eyebrow}</p>
            {/* h-lg, not h-xl. h-xl runs to 5.8rem — it is the homepage's
                one-line hero size, and a service page title is a sentence, not
                a slogan. At that size it filled the screen and pushed the
                proposition below the fold. */}
            <h1 className="h-lg">{service.h1}</h1>
            <p className="lede">{service.standfirst}</p>
          </div>

          <div className="measure rv">
            <p className="mt-3">{service.promise}</p>
            <div className="btn-row">
              <Link className="btn btn--primary" href="/data-health-check">
                Start with a Data Health Check
                <Arrow />
              </Link>
              <Link className="btn btn--ghost" href="/contact">
                Talk to us
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* The diagram sits below the hero rather than inside it.
          In the hero it competed with the heading and the call to action for
          the first screen, and on a laptop it pushed both of those under the
          fold. Given its own band it is the first thing after the proposition
          instead of part of it, and the hero is back to being words. */}
      <section className="band">
        <div className="wrap">
          <div className="figure figure--wide rv">
            {/* eslint-disable-next-line @next/next/no-img-element -- flat SVG
                artwork; the optimiser would cost a request and return the same
                bytes it was given. */}
            <img src={service.image.src} alt={service.image.alt} width={800} height={520} decoding="async" />
          </div>
        </div>
      </section>

      {service.sections.map((section, i) => (
        /* Starts tinted: the diagram band above is plain, and two plain bands
           in a row lose the rhythm the alternation exists to create. */
        <Section key={section.heading} section={section} tinted={i % 2 === 0} />
      ))}

      <section className="band band--deep">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Questions we get asked</p>
            <h2 className="h-lg">Before you commit to anything</h2>
          </div>
          <Faq items={service.faq} />
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Where to next</p>
            <h2 className="h-lg">Related reading</h2>
          </div>
          <div className="grid grid--3 rv mt-3">
            {service.related.map((r) => (
              <div key={r.href} className="card card--pad-lg">
                <h3 className="card__stretch">
                  <Link href={r.href}>{r.label}</Link>
                </h3>
                <p className="mt-3">{r.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
