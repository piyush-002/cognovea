import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow, Figure, PageHero, breadcrumbSchema } from '@/components/Bits';
import ContactForm from '@/components/ContactForm';
import Faq from '@/components/Faq';
import { faqSchema, type FaqItem } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import { abs, site } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

const PATH = '/contact';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Cognovea | Data Analytics & AI Consulting',
  description:
    'Connect with Cognovea to discuss your data, analytics, or AI needs, or start a two week Data Health Check to understand where your data needs attention.',
  path: '/contact',
});

const CRUMBS = [{ href: PATH, label: 'Contact' }];

const HELP = [
  {
    h: 'Data Analytics Consulting',
    p: 'When reporting and analytics are being held back by disconnected information, inconsistent definitions, or limited visibility into important business measures, data analytics consulting can help establish what needs attention and where analytics can create greater value.',
  },
  {
    h: 'Data Strategy Consulting',
    p: 'When data decisions are being made without a clear direction, data strategy consulting can help bring together the priorities, governance, capabilities, and practical steps needed to build a stronger foundation for using data across the business.',
  },
  {
    h: 'AI Consulting Services',
    p: 'When an AI opportunity has been identified but the practical path from an idea to something that can be used within the business is still unclear, AI consulting services can help assess the opportunity and establish what needs to be considered before implementation.',
  },
  {
    h: 'Business Intelligence Consulting',
    p: 'When teams are relying on multiple reports, manually reconciling figures, or spending too much time establishing which numbers are correct, business intelligence consulting can help create a more dependable foundation for reporting and decision making.',
  },
];

const FAQS: FaqItem[] = [
  {
    q: 'Does Cognovea provide data analytics and AI consulting services?',
    a: 'Yes. Cognovea works across data analytics, data strategy, business intelligence, and AI, with the appropriate starting point depending on the business requirement and the outcome you want to achieve.',
  },
  {
    q: 'Can I speak with a data consultant before starting?',
    a: 'Yes. If you have questions about your requirements or are unsure whether the Data Health Check is the right starting point, you can contact the Cognovea team directly before deciding how to proceed.',
  },
];

const SOCIALS = Object.entries(site.social).filter(([, url]) => url);

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          faqSchema(FAQS),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Cognovea',
            url: abs(PATH),
            /* A reference, not a second Organization. Declaring one again
               here with a subset of the fields describes a different entity
               that happens to share a name, which is how a knowledge panel
               ends up split between two half-populated records. The full one
               is in the root layout under this @id. */
            mainEntity: { '@id': `${site.url}/#organization` },
          },
        ]}
      />

      <PageHero
        eyebrow="Contact"
        title="Let’s Find the Right Data Analytics Consulting Path for Your Business"
        crumbs={CRUMBS}
        intro="When important business numbers are difficult to trust, reporting takes too much time to reconcile, or teams are spending more effort trying to understand their data than using it to make decisions, it can be difficult to know where the right place to begin is."
      >
        <div className="rich measure" style={{ marginTop: '1.4em' }}>
          <p>
            Cognovea works with businesses across data analytics consulting, data strategy, business intelligence, and
            AI, helping teams understand what is holding their data back and determine the most practical next step
            based on what they are trying to achieve.
          </p>
          <p>
            If you already have a clear requirement, tell us about it through the form below. If you are still working
            out where to begin, you can start with a focused two week Data Health Check designed to give you a clearer
            view of what is happening with your data.
          </p>
        </div>

        <div className="btn-row">
          <Link className="btn btn--primary" href="/data-health-check">
            Book a Data Health Check
            <Arrow />
          </Link>
          <Link className="btn btn--ghost" href="#enquiry">
            Send an Enquiry
          </Link>
        </div>
      </PageHero>

      {/* --- What can we help you with --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Where to Start</p>
            <h2 className="h-lg">What Can We Help You With?</h2>
            <p className="lede">
              You may already know the kind of support you need, or you may simply know that the current way of working
              with your data is creating too much friction. Either way, you do not need to define the engagement before
              speaking with the Cognovea team.
            </p>
          </div>

          <div className="grid grid--2">
            {HELP.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Form --- */}
      <section className="band band--tint" id="enquiry">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Enquiry</p>
            <h2 className="h-lg">Tell Us About Your Business</h2>
            <p className="lede">
              A useful conversation starts with context, so tell us a little about your business, the numbers or reports
              you currently rely on, and what you would like to understand or improve. You do not need to have the
              entire requirement worked out before reaching out, because the information you provide will help the team
              understand where the conversation should begin.
            </p>
          </div>

          <div className="card card--pad-lg card--flat rv" style={{ maxWidth: '52rem' }}>
            <ContactForm intent="General enquiry" />
          </div>
        </div>
      </section>

      {/* --- Direct contact + locations --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Direct</p>
            <h2 className="h-lg">Prefer Email or a Call?</h2>
            <p className="lede">
              If you would rather speak with someone directly, you can reach the Cognovea team by email or phone,
              whether you already have a specific requirement in mind or simply want to understand whether a Data Health
              Check is the right starting point.
            </p>
          </div>

          <div className="grid grid--2">
            <article className="card rv">
              <p className="eyebrow">Email</p>
              <p className="h-md" style={{ marginTop: '0.7rem' }}>
                <a href={`mailto:${site.email}`} style={{ color: 'var(--fg)', textDecoration: 'none' }}>
                  {site.email}
                </a>
              </p>
            </article>

            <article className="card rv">
              <p className="eyebrow">Call Us</p>
              <p className="h-md" style={{ marginTop: '0.7rem' }}>
                {site.phones.map((p) => (
                  <span key={p} style={{ display: 'block' }}>
                    <a href={`tel:${p.replace(/\s/g, '')}`} style={{ color: 'var(--fg)', textDecoration: 'none' }}>
                      {p}
                    </a>
                  </span>
                ))}
              </p>
            </article>
          </div>

          <div className="feature mt-3" style={{ marginBottom: '1.6rem' }}>
            <div className="rv rv--left">
              <h3 className="h-md">Our Locations</h3>
              <p style={{ marginTop: '0.8em' }}>
                A head office in Bengaluru and a development centre in Indore, working as one team.
              </p>
            </div>
            <Figure
              src="/img/ct-locations.svg"
              alt="Abstract map motif linking two locations"
            />
          </div>

          <div className="grid grid--2">
            <article className="card rv">
              <p className="eyebrow">{site.locations.hq.role}</p>
              <h4 className="h-sm" style={{ marginTop: '0.7rem' }}>
                {site.locations.hq.label}
              </h4>
              <p>
                {site.locations.hq.address}, {site.locations.hq.locality}, Karnataka{' '}
                {site.locations.hq.postalCode}
              </p>
              <p>
                <a
                  className="link-arrow"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${site.locations.hq.address}, ${site.locations.hq.locality}, Karnataka ${site.locations.hq.postalCode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </p>
            </article>

            <article className="card rv">
              <p className="eyebrow">{site.locations.dev.role}</p>
              <h4 className="h-sm" style={{ marginTop: '0.7rem' }}>
                {site.locations.dev.label}
              </h4>
              <p>
                {site.locations.dev.address}, {site.locations.dev.locality}, Madhya Pradesh {site.locations.dev.postalCode}
              </p>
              <p>
                <a
                  className="link-arrow"
                  href="https://www.google.com/maps/search/?api=1&query=101%2C+Kanchan+Sagar%2C+18%2F1%2C+Near+Industry+House%2C+Old+Palasia%2C+Indore"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </p>
            </article>
          </div>

          {/* Only the platforms Cognovea actively maintains are listed. */}
          {SOCIALS.length > 0 && (
            <div className="rv mt-3">
              <h3 className="h-md">Connect With Cognovea</h3>
              <p style={{ marginTop: '0.7em' }}>
                Follow Cognovea through our official social channels to stay connected with updates, perspectives, and
                work across data, analytics, and AI.
              </p>
              <ul className="chips" style={{ marginTop: '1.2rem' }}>
                {SOCIALS.map(([key, url]) => (
                  <li key={key}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      {key}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">FAQ</p>
            <h2 className="h-lg">Questions People Ask Before Reaching Out</h2>
          </div>
          <div className="rv">
            <Faq items={FAQS} />
          </div>
          <p className="rv mt-2">
            <Link className="link-arrow" href="/data-health-check">
              More questions about the Data Health Check
            </Link>
          </p>
        </div>
      </section>

      {/* --- Closing --- */}
      <section className="c-cta">
        <div className="wrap">
          <div className="rv measure">
            <h2 className="h-lg">Ready to Understand What Your Data Needs Next?</h2>
            <p className="lede" style={{ marginTop: '1.1em' }}>
              When the numbers used to make important decisions cannot be relied upon with confidence, a focused
              assessment can provide the clarity needed before a larger initiative is considered.
            </p>
            <p style={{ marginTop: '1em' }}>
              Book a two week Data Health Check to understand where your data needs attention and what you can do next.
            </p>
            <div className="btn-row">
              <Link className="btn btn--primary" href="/data-health-check">
                Book a Data Health Check
                <Arrow />
              </Link>
            </div>

            <div className="card card--flat mt-3">
              <p className="eyebrow">No Lock In. Ever.</p>
              <p style={{ marginTop: '0.7rem' }}>
                The Data Health Check is designed to give you useful findings that you can take forward regardless of
                whether you continue working with Cognovea, so the decision about what happens next remains yours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
