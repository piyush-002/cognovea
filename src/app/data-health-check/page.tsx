import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow, Figure, PageHero, breadcrumbSchema, serviceSchema } from '@/components/Bits';
import ContactForm from '@/components/ContactForm';
import Faq from '@/components/Faq';
import { faqSchema, type FaqItem } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';

const PATH = '/data-health-check';

export const metadata: Metadata = {
  title: 'Book a Two Week Data Health Check',
  description:
    'Start with a focused two week Data Health Check: an audit of your infrastructure, pipelines, BI, data quality and cloud costs, with a written findings report and a prioritized roadmap.',
  alternates: { canonical: `${PATH}/` },
  openGraph: {
    title: 'Book a Two Week Data Health Check | Cognovea',
    description:
      'A focused two week assessment of your data, with a written findings report and a prioritized roadmap. The findings remain yours.',
    url: `${PATH}/`,
  },
};

const CRUMBS = [{ href: PATH, label: 'Data Health Check' }];

/* From data_offerings — the audit scope. */
const SCOPE = ['Infrastructure', 'Pipelines', 'BI', 'Data Quality', 'Cloud Costs'];

/* From data_offerings — "How Engagements Grow". */
const LADDER = [
  {
    h: 'Data Health Check',
    p: 'A two-week audit of your infrastructure, pipelines, BI, data quality, and cloud costs. You get: a written findings report and a prioritized roadmap, with no obligation to continue. From Rs 1,50,000.',
  },
  {
    h: 'Platform Build',
    p: 'A small audit reveals the need for a warehouse. The build becomes a larger project.',
  },
  {
    h: 'Data Pod',
    p: 'The project needs ongoing hands, so a pod is added.',
  },
  {
    h: 'Managed Data Department',
    p: 'Eventually we run the whole function. One entry product, one growing account.',
  },
];

const FAQS: FaqItem[] = [
  {
    q: 'How long does the Data Health Check take?',
    a: 'The Data Health Check is a two week assessment designed to examine the current state of your data, identify the areas that warrant attention, and provide a clearer basis for deciding what should happen next.',
  },
  {
    q: 'What does the Data Health Check help me understand?',
    a: 'The assessment is intended to help establish where the underlying data concerns are coming from, what impact they may be having on the business, and which areas should be considered first when planning the next stage of work.',
  },
  {
    q: 'Do I have to continue with Cognovea after the Data Health Check?',
    a: 'No. The findings remain yours, so you can decide how you want to use them and whether continuing with Cognovea is appropriate after the assessment.',
  },
  {
    q: 'Is the Data Health Check fee credited toward future work?',
    a: 'Part of the audit fee can be credited toward future work within ninety days, subject to the applicable commercial terms.',
  },
  {
    q: 'Can I speak with a data consultant before starting?',
    a: 'Yes. If you have questions about your requirements or are unsure whether the Data Health Check is the right starting point, you can contact the Cognovea team directly before deciding how to proceed.',
  },
];

export default function DataHealthCheckPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          serviceSchema({
            name: 'Data Health Check',
            description:
              'A two-week audit of your infrastructure, pipelines, BI, data quality, and cloud costs, delivering a written findings report and a prioritized roadmap.',
            path: PATH,
            serviceType: 'Data Audit and Assessment',
          }),
          faqSchema(FAQS),
        ]}
      />

      <PageHero
        eyebrow="Start Here"
        title="Start With a Two Week Data Health Check"
        crumbs={CRUMBS}
        intro="You do not need to commit to a large engagement before you have a clear understanding of what is happening across your data."
      >
        <div className="rich measure" style={{ marginTop: '1.4em' }}>
          <p>
            The Data Health Check is a focused two week assessment through which the current state of your data can be
            examined, the areas creating the greatest business impact can be identified, and the findings can be used to
            determine what should happen next. The audit is intended to give you a practical basis for making that
            decision rather than asking you to start with a much larger engagement.
          </p>
          <p>
            The findings remain yours after the assessment, so you can decide how you want to proceed once you have a
            clearer understanding of the situation. Part of the audit fee can also be credited toward future work within
            ninety days, subject to the applicable commercial terms.
          </p>
        </div>

        <div className="btn-row">
          <Link className="btn btn--primary" href="#book">
            Book a Data Health Check
            <Arrow />
          </Link>
        </div>
      </PageHero>

      {/* --- What the audit covers --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">The Audit</p>
            <h2 className="h-lg">A two-week audit of the five things that decide whether your numbers can be trusted</h2>
          </div>

          <ul className="chips rv">
            {SCOPE.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <div className="grid grid--3 mt-3">
            <div className="fact rv">
              <div className="fact__k">Duration</div>
              <div className="fact__v">Two weeks</div>
            </div>
            <div className="fact rv">
              <div className="fact__k">You get</div>
              <div className="fact__v">Findings report + roadmap</div>
            </div>
            <div className="fact rv">
              <div className="fact__k">From</div>
              <div className="fact__v">Rs 1,50,000</div>
            </div>
          </div>

          <div className="card card--flat rv mt-3 measure">
            <p>
              A two-week audit of your infrastructure, pipelines, BI, data quality, and cloud costs. You get: a written
              findings report and a prioritized roadmap, with no obligation to continue.
            </p>
          </div>
        </div>
      </section>

      {/* --- How engagements grow --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">How Engagements Grow</p>
            <h2 className="h-lg">A low-risk entry point that turns into a long-term partnership</h2>
            <p className="lede">Data Health Check &rarr; Platform Build &rarr; Data Pod &rarr; Managed Data Department</p>
          </div>

          <div className="grid grid--4">
            {LADDER.map((s, i) => (
              <div className="step rv" key={s.h}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- No lock in --- */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="feature feature--copy">
            <div className="rv rv--left">
            <p className="eyebrow">No Lock In. Ever.</p>
            <h2 className="h-lg" style={{ marginTop: '1rem' }}>
              The findings are yours, whatever you decide next.
            </h2>
            <p className="lede" style={{ marginTop: '1.1em' }}>
              The Data Health Check is designed to give you useful findings that you can take forward regardless of
              whether you continue working with Cognovea, so the decision about what happens next remains yours.
            </p>
            </div>
            <Figure
              src="/img/dhc-ladder.svg"
              alt="Abstract rising ladder of engagement sizes, starting from a short audit"
            />
          </div>
        </div>
      </section>

      {/* --- Booking form --- */}
      <section className="band" id="book">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Book</p>
            <h2 className="h-lg">Ready to Understand What Your Data Needs Next?</h2>
            <p className="lede">
              When the numbers used to make important decisions cannot be relied upon with confidence, a focused
              assessment can provide the clarity needed before a larger initiative is considered.
            </p>
          </div>

          <div className="card card--pad-lg card--flat rv" style={{ maxWidth: '52rem' }}>
            <ContactForm intent="Data Health Check" />
          </div>
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
        </div>
      </section>
    </>
  );
}
