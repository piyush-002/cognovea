import type { Metadata } from 'next';
import Link from 'next/link';
import ClientLogos from '@/components/ClientLogos';
import { Arrow, CtaBand, Figure, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import { abs } from '@/lib/site';
import Tabs from '@/components/Tabs';
import { pageMetadata } from '@/lib/seo';

/* Statically generated, and this page shows client logos and a testimonial,
   both of which are published from the admin long after the build. Without a
   revalidate the page keeps serving the HTML from the last deploy, so a logo
   published today would not appear until the next one. Five minutes, matching
   careers and insights; `src/lib/revalidate.ts` also refreshes it on publish so
   the usual wait is none at all. */
export const revalidate = 300;


const PATH = '/about-us';

export const metadata: Metadata = pageMetadata({
  title: 'About Cognovea | Data Analytics & AI Company',
  description:
    'Cognovea is a data analytics and data engineering company helping businesses turn scattered data into real intelligence through analytics, AI, and data teams.',
  path: '/about-us',
});

const CRUMBS = [{ href: PATH, label: 'About Us' }];

const FEATURE_STRIP = [
  'Pipelines that move your data',
  'Dashboards that make it legible',
  'AI systems that act on it directly',
  'People to run it, when you need them',
];

const CALLOUTS = [
  'Data can live across five systems while nobody in the business has one number everyone trusts.',
  'It shouldn’t take three days to produce a report that could run in three minutes, once the right system sits behind it.',
  'Nobody was ever really missing the data itself; what they were missing was whatever it would have taken to actually put that data to use.',
];

const CAPABILITY_CHIPS = [
  'Data Engineering',
  'Analytics & Business Intelligence',
  'AI',
  'Dedicated Data Teams',
  'Managed Data Services',
];

const ENGAGEMENT = [
  {
    key: 'engineering',
    label: 'Data Engineering',
    h: 'Data Engineering Services',
    paras: [
      'Most likely, your data is spread out all over the place and not being used to make any decisions; and that is how we start most projects.',
      'It begins with linking the systems which contain your data, making sure there is no inconsistency in them, and molding the outcome based on how the business works, so that the underlying pipelines and warehouses do not become outdated.',
    ],
    listTitle: 'Technical scope',
    list: [
      'ETL and ELT pipelines',
      'Cloud data infrastructure',
      'Data warehouses and data lakes',
      'API integrations',
      'Data migration and data modernization',
    ],
    outro:
      'Some clients bring us in for one integration, others treat us as an ongoing data engineering outsourcing partner, effectively their data infrastructure company for the parts of the stack they’d rather not own.',
    href: '/data-engineering-services',
  },
  {
    key: 'analytics',
    label: 'Analytics & BI',
    h: 'Analytics and Business Intelligence',
    paras: [
      'Once the data is working properly, somebody still has to understand what it’s saying, and that’s where our data analytics services and business intelligence services come in.',
      'We build dashboards in Power BI and Tableau, set up KPI reporting people open more than once, and put together sales, marketing, financial, and operational analytics, built around how a specific team actually works rather than a generic template.',
    ],
    outro:
      'Good business analytics was never really about the dashboard; the goal is spending less time preparing a report and more time understanding what it means.',
  },
  {
    key: 'teams',
    label: 'Dedicated Data Teams',
    h: 'Dedicated Data Teams',
    paras: [
      'This is one of our biggest offerings, built to flex around what a company genuinely needs rather than a fixed package.',
      'A company might need just one analyst, or one engineer, or a full data pod that includes data science services once forecasting matters most, and we provide the people without the client building the team themselves.',
    ],
    listTitle: 'Roles available',
    list: ['Data Analysts', 'Data Engineers', 'BI Developers', 'Analytics Engineers', 'Data Scientists'],
    outro:
      'Some clients need one person, others want a full team, and either way the model adjusts, with a senior lead on hand throughout.',
  },
  {
    key: 'ai',
    label: 'AI',
    h: 'AI',
    paras: [
      'We stay away from AI as a vague, catch-all promise, and instead build things a client can point to and use in day to day operations.',
    ],
    listTitle: 'What we build',
    list: [
      'AI Agents',
      'RAG Systems & Knowledge Assistants',
      'Natural Language Analytics',
      'Forecasting & Predictive Models',
      'Automated Reporting',
      'Workflow Automation',
    ],
    outro:
      'Here is how it works in practical situations; when a manager wants to know the reasons for the decline in sales last month, an engagement in AI Development Services would analyze the data and tell what changed rather than having an analyst provide five reports. That kind of practical response, not a generic chatbot demo, is the sort of AI Cognovea builds for clients.',
    href: '/generative-ai-services',
  },
  {
    key: 'managed',
    label: 'Managed Data Services',
    h: 'Managed Data Services',
    paras: ['Some companies don’t want to build an internal data department, so Cognovea operates that function for them instead.'],
    listTitle: 'Coverage',
    list: [
      'Data Engineering',
      'Analytics',
      'Business Intelligence',
      'Data Quality',
      'Dashboards & Reporting',
      'AI Initiatives',
    ],
    outro: 'In practice, a client gets their own managed data services function, without having to build the team behind it.',
  },
];

const COMPARISON: [string, string, string, string][] = [
  ['Finding specialists', 'Hard to find, months long search', 'Readily available', 'Readily available'],
  ['Process overhead', 'Low, but falls on you to manage', 'Heavy, layered process', 'Kept deliberately light'],
  ['Speed to start', 'Slow, tied to hiring timelines', 'Often slow, tied to process', 'Built to move quickly'],
  ['Team sizing', 'One hire at a time', 'Sized for large transformation', 'Sized to what’s in front of you'],
];

const APPROACH = [
  {
    h: 'Understand the business first.',
    p: 'We start by understanding what’s happening inside the business rather than jumping to the technology, meaning what decision is hard to make, what number nobody trusts, and what report takes longer than it should.',
  },
  {
    h: 'Look at the data itself.',
    p: 'Only once that’s clear do we look at the data, because the right approach depends on what a company’s data actually looks like, not on whichever tool is fashionable that year.',
  },
  {
    h: 'Build only what’s genuinely needed.',
    p: 'Only then do we settle on what’s worth building, get it built, and keep adjusting it as the business and its data change.',
  },
  {
    h: 'Judge it by whether it gets used.',
    p: 'An unopened dashboard and an AI system nobody relies on fail for the same reason, however different they look, because what gets used was the only thing that ever mattered.',
  },
];

const INDUSTRY_CHIPS = [
  'SaaS',
  'Financial Services',
  'Retail',
  'Manufacturing',
  'Logistics',
  'Healthcare',
  'Education',
  'Consumer Businesses',
  'Professional Services',
];

const SITUATIONS = [
  {
    q: '“We have data everywhere but can’t get one reliable number.”',
    a: 'Cognovea builds the data foundation that gets everyone looking at the same numbers, instead of five departments defending different totals.',
  },
  {
    q: '“We spend half the week making reports.”',
    a: 'Cognovea automates the reporting layer, so that time goes back to using the numbers instead of assembling them by hand.',
  },
  {
    q: '“We need a data engineer but don’t want to hire one full time.”',
    a: 'Cognovea provides one directly, without the client going through a hiring process of its own.',
  },
  {
    q: '“We need a complete analytics team.”',
    a: 'Cognovea builds the pod instead, supervised by a senior lead from day one.',
  },
  {
    q: '“We want to use AI, but don’t know where it actually creates value.”',
    a: 'Cognovea finds the use case first, confirms it’s worth pursuing, and only then builds it.',
  },
];

const BELIEFS = [
  'Data only earns its value once someone puts it to work; sitting untouched doesn’t count for much.',
  'We’ve seen technology that looks impressive in a demo and does nothing for the decision it was meant to support.',
  'If automation really does get rid of some task for someone, that is good. Too often it just moves the challenge somewhere else.',
  'If the analytics is more complicated than the spreadsheet it has replaced then clearly, it has not succeeded in its mission.',
  'There needs to be a real need for AI before one starts developing it.',
  'Complexity was never the same thing as sophistication, and mistaking one for the other is usually where an overbuilt system starts.',
];

const CHAIN = [
  ['Build.', 'Data infrastructure.'],
  ['Understand.', 'Analytics and BI.'],
  ['Predict.', 'Data science and AI.'],
  ['Automate.', 'AI systems and workflows.'],
  ['Operate.', 'Managed data teams.'],
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About Cognovea',
            description:
              'Cognovea is a data analytics and data engineering company helping businesses turn scattered data into real intelligence through analytics, AI, and data teams.',
            url: abs(PATH),
          },
        ]}
      />

      <PageHero
        eyebrow="About Cognovea"
        title="Cognovea is a data analytics and AI company built on a simple idea: most businesses already have data everywhere, but very little of it turns into real intelligence they can act on."
        crumbs={CRUMBS}
        intro="Most businesses already have plenty of data sitting across different systems, and getting real use out of it usually means bringing in people who can work across the whole stack at once. That’s what Cognovea does: we build the pipelines, keep business analytics honest, and bring AI in only where it earns its place. The result is a business that can trust its own numbers and act on them."
      />

      {/* --- What We Do --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">What We Do</p>
            <h2 className="h-lg">
              Cognovea builds the pipelines that quietly move your data, the dashboards that make sense of it, and
              increasingly the AI layer that acts on it, and when needed, we bring in the people to run it day to day
              too.
            </h2>
          </div>

          <div className="grid grid--4">
            {FEATURE_STRIP.map((f) => (
              <div className="card rv" key={f}>
                <p style={{ color: 'var(--fg)', fontSize: '15.5px' }}>{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- No shortage of data --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">The Problem</p>
            <h2 className="h-lg">
              There&rsquo;s No Shortage of Data Inside Most Businesses, Just a Shortage of Anyone Making Sense of It
            </h2>
          </div>

          <div className="rich measure rv">
            <p>
              A lot of growing businesses run their CRM through Salesforce and ERP through SAP, patch gaps with an Excel
              file rebuilt every Monday, lean on a handful of extra tools and APIs, and forget about the Google
              Analytics account nobody&rsquo;s opened in months.
            </p>
            <p>
              And yet it&rsquo;s not unusual for a three minute report to take three days to reach someone&rsquo;s desk,
              for a leadership meeting to run on spreadsheets stitched together overnight, or for a dip in sales to go
              unexplained.
            </p>
          </div>

          <div className="grid grid--3 mt-3">
            {CALLOUTS.map((c, i) => (
              <article className="card rv" key={i}>
                <p>{c}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- What Cognovea actually is --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Who We Are</p>
            <h2 className="h-lg">What Cognovea Actually Is</h2>
            <p className="lede">
              Cognovea is a data and AI company, a data analytics company and data engineering company working across
              the whole data layer rather than one narrow slice of it.
            </p>
          </div>

          <ul className="chips rv">
            {CAPABILITY_CHIPS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <div className="rich measure rv mt-3">
            <p>
              Shipping a single dashboard and calling the job finished isn&rsquo;t how we operate, and neither is
              dropping one developer into a client&rsquo;s team and disappearing after.
            </p>
            <p>
              Instead, we build the infrastructure a business runs on, make sense of what it produces, layer AI on top
              where it earns its place, and, when useful, put people in place to keep it all running.
            </p>
            <p>
              From the people who build the data to the intelligence sitting on top of it, that&rsquo;s Cognovea in one
              line.
            </p>
          </div>
        </div>
      </section>

      {/* --- How an engagement unfolds --- */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Engagements</p>
            <h2 className="h-lg">How an Engagement With Cognovea Unfolds</h2>
          </div>

          <div className="rv">
            <Tabs
              tabs={ENGAGEMENT.map((e) => ({
                key: e.key,
                label: e.label,
                content: (
                  <div className="card card--pad-lg card--flat">
                    <h3 className="h-md">{e.h}</h3>
                    <div className="rich" style={{ marginTop: '1em' }}>
                      {e.paras.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}

                      {e.list && (
                        <>
                          <h4>{e.listTitle}</h4>
                          <ul>
                            {e.list.map((l) => (
                              <li key={l}>{l}</li>
                            ))}
                          </ul>
                        </>
                      )}

                      <p>{e.outro}</p>

                      {e.href && (
                        <p>
                          <Link className="link-arrow" href={e.href}>
                            {e.h}
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {/* --- Where each piece slots in --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">The Chain</p>
            <h2 className="h-lg">Where Each Piece Slots Into the Bigger Picture</h2>
          </div>

          <div className="grid grid--3">
            {CHAIN.map(([verb, noun], i) => (
              <div className="step rv" key={verb}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm grad">{verb}</h3>
                <p>{noun}</p>
              </div>
            ))}
          </div>

          <div className="rich measure rv mt-3">
            <p>
              Most engagements start somewhere in the middle of that chain and move in either direction, depending on
              what a company has and what&rsquo;s still missing.
            </p>
          </div>
        </div>
      </section>

      {/* --- What makes Cognovea different --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Comparison</p>
            <h2 className="h-lg">What Makes Cognovea Different</h2>
            <p className="lede">
              There are, broadly, two paths companies try before finding Cognovea, and neither matches the scale of work
              most companies need.
            </p>
          </div>

          <div className="table-scroll rv">
            <table>
              <caption className="sr-only">Hiring internally versus a large consulting firm versus Cognovea</caption>
              <thead>
                <tr>
                  <th scope="col">&nbsp;</th>
                  <th scope="col">Hiring Internally</th>
                  <th scope="col">Large Consulting Firm</th>
                  <th scope="col" className="col-mark">
                    Cognovea
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([row, a, b, c]) => (
                  <tr key={row}>
                    <th scope="row">{row}</th>
                    <td>{a}</td>
                    <td>{b}</td>
                    <td className="col-mark">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rich measure rv mt-3">
            <p>
              Cognovea sits between those two, offering specialist people and smaller teams without the months long
              search or the oversized process, with room to scale once it makes sense.
            </p>
          </div>
        </div>
      </section>

      {/* --- How we approach the work --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Approach</p>
            <h2 className="h-lg">How We Approach the Work</h2>
          </div>

          <div className="grid grid--2">
            {APPROACH.map((a, i) => (
              <div className="step rv" key={a.h}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm">{a.h}</h3>
                <p>{a.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Who we work with --- */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Who We Work With</p>
            <h2 className="h-lg">
              We tend to work well with companies sitting on more data than they know what to do with, where reporting
              has become a burden, and where AI feels worth exploring even though nobody&rsquo;s pinned down where it
              would help.
            </h2>
          </div>

          <ul className="chips rv">
            {INDUSTRY_CHIPS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          <div className="rich measure rv mt-3">
            <p>
              Industry matters less than timing, specifically the point where a company&rsquo;s data has outgrown its
              current system.
            </p>
          </div>
        </div>
      </section>

      {/* --- Situations you might recognize --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Sound Familiar?</p>
            <h2 className="h-lg">Situations You Might Recognize</h2>
          </div>

          <div className="grid grid--3">
            {SITUATIONS.map((s) => (
              <article className="card rv" key={s.q}>
                <h3 className="h-sm">{s.q}</h3>
                <p>{s.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- How we think --- */}
      <section className="band band--deep">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Point of View</p>
            <h2 className="h-lg">How We Think About Data and AI</h2>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <ul>
                {BELIEFS.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <Figure src="/img/de-pipeline.svg" alt="Abstract diagram of separate systems connected into one data platform" />
          </div>
        </div>
      </section>

      {/* --- What Cognovea represents --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">The Name</p>
            <h2 className="h-lg">What Cognovea Represents</h2>
          </div>

          <div className="rich measure rv">
            <p>
              The name leans on cognition, turning raw information into something a person can understand, paired with a
              sense of something new, close to what the company does on most engagements.
            </p>
            <p>
              Data, knowledge, and a different way of approaching business information sit underneath that idea, and
              they show up more clearly in the work than in the name alone.
            </p>
          </div>
        </div>
      </section>

      {/* Every published logo, not only the featured ones: on About Us the
          question is who Cognovea works with, so the fuller list is the point. */}
      <ClientLogos heading="Who we work with" featuredOnly={false} />

      <CtaBand
        title="Something Not Adding Up in Your Data?"
        body={
          <>
            We can help you work through that, starting with a conversation about what&rsquo;s happening inside your
            business right now.
            <br />
            <span style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--fg-3)' }}>
              Data engineering. Analytics. AI. Data teams.
            </span>
          </>
        }
        primary={{ href: '/contact', label: 'Talk to Cognovea' }}
        secondary={{ href: '/careers', label: 'See Open Roles' }}
      />
    </>
  );
}
