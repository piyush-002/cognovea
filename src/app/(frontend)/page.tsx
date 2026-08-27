import type { Metadata } from 'next';
import Link from 'next/link';
import { Arrow } from '@/components/Bits';
import ClientLogos from '@/components/ClientLogos';
import Counter from '@/components/Counter';
import MarkCanvas from '@/components/MarkCanvas';
import Marquee from '@/components/Marquee';
import Rotator from '@/components/Rotator';
import Scroller from '@/components/Scroller';
import Tabs from '@/components/Tabs';
import Testimonial from '@/components/Testimonial';

/* Statically generated, and this page shows client logos and a testimonial,
   both of which are published from the admin long after the build. Without a
   revalidate the page keeps serving the HTML from the last deploy, so a logo
   published today would not appear until the next one. Five minutes, matching
   careers and insights; `src/lib/revalidate.ts` also refreshes it on publish so
   the usual wait is none at all. */
export const revalidate = 300;


export const metadata: Metadata = {
  title: 'Cognovea | Data Analytics and AI Solutions',
  description:
    'Cognovea turns enterprise data into intelligence. Data analytics, business intelligence, data engineering and AI solutions that drive data-driven decision making.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Cognovea | Where Data Becomes Intelligence',
    description:
      'Data engineering, analytics, business intelligence and applied AI for businesses that need to trust their own numbers.',
    url: '/',
  },
};

/* --------------------------------------------------------------------------
   Band rhythm across this page, holding the colour budget:
     navy   hero · How We Work · closing CTA · footer      (~25%)
     white  marquee · POV · What We Do · Your Data · Proof · Insights
     tint   What Becomes Possible · Industries · People
   -------------------------------------------------------------------------- */

/* Technology platforms named across the source documents. Not client logos. */
const STACK = [
  'SAP',
  'Microsoft Azure',
  'Snowflake',
  'Power BI',
  'Databricks',
  'Amazon Web Services',
  'Google Cloud Platform',
  'BigQuery',
  'Tableau',
  'Looker',
];

/* Durations and starting points from the documents, deliberately not results. */
const FACTS: { n: number; prefix?: string; suffix?: string; label: string }[] = [
  { n: 2, suffix: ' wks', label: 'A Data Health Check runs two weeks, start to findings report.' },
  { n: 150000, prefix: '₹', label: 'Where the Data Health Check starts, scope depending.' },
  { n: 90, suffix: ' days', label: 'Window in which part of the audit fee credits toward future work.' },
  { n: 8, prefix: '4–', label: 'A Managed Data Department runs as a team of four to eight.' },
];

const POSSIBLE = [
  {
    h: 'See the Business Clearly',
    p: 'The landscape of your enterprise becomes unmistakable when disparate sources are unified and translated into clarity. Through robust business intelligence, sophisticated data visualization, and real-time analytics, we transform scattered data points into a singular, strategic lens on your most critical operations.',
    art: '/img/art-clarity.svg',
    alt: 'Abstract radar sweep resolving scattered data points into a clear picture',
  },
  {
    h: 'Know What’s Next',
    p: 'The true merit of intelligence goes beyond historical reflection. Through the deployment of predictive analytics, data science, and advanced predictive modeling, we illuminate the path forward, empowering your organization to anticipate market shifts and move with strategic foresight instead of mere reaction.',
    art: '/img/art-predict.svg',
    alt: 'Abstract chart of historical data opening into a forecast confidence cone',
  },
  {
    h: 'Work Smarter',
    p: 'AI becomes most valuable when it moves beyond experimentation and into everyday work. From intelligent automation and AI agents to generative AI and enterprise AI, Cognovea helps organizations reduce repetitive work, accelerate processes, and create systems that work alongside their people.',
    art: '/img/art-automate.svg',
    alt: 'Abstract diagram of scattered inputs routed through a pipeline into structured outputs',
  },
  {
    h: 'Move With Confidence',
    p: 'Strategic clarity is born from superior intelligence. By unifying data intelligence, enterprise analytics, actionable insights, and data-driven decision making, Cognovea empowers leaders to bridge the gap between ambiguity and precise, high-impact organizational momentum.',
    art: '/img/art-confidence.svg',
    alt: 'Abstract illustration of many uncertain paths converging on a single decision point',
  },
];

const PILLARS = [
  {
    eyebrow: 'See Clearly',
    h: 'Data Analytics & Business Intelligence',
    p: 'Good decisions begin with seeing the business as it really is. We bring disparate data streams together through comprehensive data analytics, business intelligence, visualization, and enterprise analytics. By establishing a single source of truth, we empower teams across your organization with a deeper, clearer understanding of performance metrics, customer behavior, operational efficiency, and emerging growth opportunities. Our solutions transform raw operational data into interactive, intuitive dashboards and actionable insights that drive confident decision-making.',
    links: [] as { href: string; label: string }[],
  },
  {
    eyebrow: 'Build the Foundation',
    h: 'Data Engineering & Modern Data Platforms',
    p: 'Intelligence is only as strong as the foundation beneath it. We design and build modern data platforms, data architectures, integrations, and cloud data engineering systems that bring information together, make it reliable, and prepare it for everything that comes next.',
    links: [
      { href: '/data-engineering-services', label: 'Data Engineering Services' },
      { href: '/data-modernization-services', label: 'Data Modernization Services' },
    ],
  },
  {
    eyebrow: 'Know What’s Next',
    h: 'Data Science, Predictive Analytics & AI',
    p: 'Understanding yesterday is useful. Anticipating tomorrow is more valuable. Our data science, predictive analytics, machine learning, and forecasting capabilities help organizations identify patterns, predict outcomes, and make better-informed decisions before events unfold.',
    links: [],
  },
  {
    eyebrow: 'Work Smarter',
    h: 'AI, Generative AI & Intelligent Automation',
    p: 'The next step is turning intelligence into action. We help organizations bring AI into the way their people actually work, from automating repetitive processes to building intelligent AI agents and practical generative AI applications. The goal is not to add AI for the sake of it, but to make everyday work simpler, faster, and more effective. By bringing people and technology together, we help teams spend less time on routine tasks and more time on work that requires judgment, creativity, and human thinking.',
    links: [
      { href: '/generative-ai-services', label: 'Generative AI Services' },
      { href: '/ai-strategy-consulting', label: 'AI Strategy & Consulting' },
    ],
  },
];

const STEPS = [
  {
    h: 'Understand',
    p: 'Before anything is built, it has to be understood. We start by learning your business, your data, and the questions you’re actually trying to answer, so every decision that follows is grounded in reality and shaped by clear data strategy.',
  },
  {
    h: 'Connect',
    p: 'Most organizations already have the data they need. It’s just scattered across systems that were never designed to talk to each other. We bring these sources together, turning disconnected information into something usable through practical data consulting and thoughtful digital transformation.',
  },
  {
    h: 'Build',
    p: 'This is where ideas take shape. We design and build the platforms and pipelines that can actually support your business, applying data modernization principles so what we build today still works as your needs grow.',
  },
  {
    h: 'Enable',
    p: 'Data is only useful if people can act on it. We make sure your teams have direct access to insights through dashboards and tools built for daily use, turning enterprise analytics from a back-end function into something people rely on every day.',
  },
  {
    h: 'Evolve',
    p: 'No data system stays finished for long. As your business changes, we help it keep pace, refining models and expanding capability through continuous AI strategy and analytics consulting.',
  },
];

const INDUSTRIES = [
  {
    h: 'Retail & Consumer',
    p: 'Understanding customers is the foundation of every retail decision. Through focused retail analytics and customer analytics, we help businesses see buying patterns clearly and respond to them faster.',
    art: '/img/ind-retail.svg',
    alt: 'Abstract overlapping demand curves representing retail buying patterns',
  },
  {
    h: 'Manufacturing',
    p: 'Efficiency on the floor starts with visibility across it. Using manufacturing analytics and supply chain analytics, we help teams spot bottlenecks before they become costly.',
    art: '/img/ind-manufacturing.svg',
    alt: 'Abstract production line with one stage highlighted as a bottleneck',
  },
  {
    h: 'Financial Services',
    p: 'Trust is built on accuracy and speed. With financial analytics and risk analytics, we help institutions make sound decisions while staying ahead of exposure.',
    art: '/img/ind-financial.svg',
    alt: 'Abstract trend line inside a widening risk band',
  },
  {
    h: 'Healthcare',
    p: 'Every decision in healthcare carries weight. Through healthcare analytics, we help organizations turn complex data into insight that supports better outcomes.',
    art: '/img/ind-healthcare.svg',
    alt: 'Abstract steady monitoring trace with one point marked',
  },
  {
    h: 'Energy & Industrial',
    p: 'Operations at this scale demand precision. Using industrial analytics and predictive analytics, we help teams anticipate issues instead of reacting to them.',
    art: '/img/ind-energy.svg',
    alt: 'Abstract load-profile bar chart with peak periods highlighted',
  },
];

const PROOF = [
  {
    h: 'Where They Began',
    p: 'Every story starts with a challenge. Whether it was scattered systems, slow decisions, or data that raised more questions than answers, this is where we listened first and understood what success would actually look like.',
  },
  {
    h: 'What We Built Together',
    p: 'This is where strategy turned into action. Working closely with each team, we designed and delivered data analytics solutions and business intelligence solutions built around their specific goals, not a generic playbook.',
  },
  {
    h: 'Where They Are Now',
    p: 'The real measure of our work shows up after the project ends. Today, these businesses run on sharper insight and faster decisions, supported by enterprise AI and ongoing digital transformation that continues to move with them.',
  },
];

const INSIGHTS = [
  {
    h: 'Data & Analytics',
    p: 'Practical thinking on how businesses turn raw data into daily decisions, covering everything from data analytics trends to real-world applications of business intelligence.',
  },
  {
    h: 'Artificial Intelligence',
    p: 'Clear, grounded perspectives on generative AI and enterprise AI, cutting through the hype to focus on what actually works.',
  },
  {
    h: 'Data Engineering',
    p: 'Insights into the systems behind the scenes, including data modernization and the platforms that keep information reliable and ready to use.',
  },
  {
    h: 'Business Intelligence',
    p: 'Ideas on making dashboards and reporting genuinely useful, not just visually appealing, so teams can act on what they see.',
  },
  {
    h: 'Industry Perspectives',
    p: 'A closer look at how analytics trends and AI strategy play out differently across industries, from retail to healthcare to manufacturing.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ============ 01 HERO, navy canvas, enormous white type ============ */}
      <section className="c-hero">
        <div className="wrap c-hero__grid">
          <div>
            <p className="eyebrow">Data + AI Solutions</p>
            <h1 className="h-xl" style={{ marginTop: '1.6rem' }}>
              Where Data Becomes <span className="grad">Intelligence.</span>
            </h1>
            <p className="c-hero__sub">Data Depth. AI Power. Real Impact.</p>

            <p className="lede" style={{ marginTop: '2rem', maxWidth: '40rem' }}>
              When data is transformed into intelligence, and intelligence is transformed into impact, the trajectory
              of an organization changes. Through the power of data analytics and robust enterprise data analytics, we
              unlock the hidden potential within your systems to drive tangible business value. Beyond simply analyzing
              and processing data, Cognovea converts complex insights into meaningful results that fuel sustainable
              growth and competitive advantage.
            </p>

            <div className="btn-row">
              <Link className="btn btn--primary" href="/contact">
                Start the Conversation
                <Arrow />
              </Link>
              <Link className="btn btn--ghost" href="#what-we-do">
                Explore What We Do
              </Link>
            </div>

            <p style={{ marginTop: '2.8rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="pill">
                <span className="pill__dot" aria-hidden="true" />
                We help you
              </span>
              <span className="h-md">
                <Rotator words={['See Clearly', 'Build the Foundation', 'Know What’s Next', 'Work Smarter']} />
              </span>
            </p>

            <a className="c-hero__cue" href="#what-becomes-possible">
              Scroll
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M8 2v12M3 9l5 5 5-5" />
              </svg>
            </a>
          </div>

          <div className="stage rv rv--right">
            <MarkCanvas label="The Cognovea mark: a ring of data points resolving into the letter C" />
          </div>
        </div>
      </section>

      {/* ============ ENTRY OFFER. The one thing to do next ============ */}
      <section className="band strip">
        <div className="wrap strip__in">
          <div className="rv">
            <p className="eyebrow">Start Here</p>
            <h2 className="h-md" style={{ marginTop: '1rem', maxWidth: '26rem' }}>
              Start With a Two Week Data Health Check
            </h2>
            <p style={{ marginTop: '0.8em', maxWidth: '34rem' }}>
              A two-week audit of your infrastructure, pipelines, BI, data quality, and cloud costs. You get: a written
              findings report and a prioritized roadmap, with no obligation to continue.
            </p>
          </div>

          <div className="strip__facts rv rv--right">
            <div className="fact">
              <div className="fact__k">Duration</div>
              <div className="fact__v">Two weeks</div>
            </div>
            <div className="fact">
              <div className="fact__k">From</div>
              <div className="fact__v">Rs 1,50,000</div>
            </div>
            <Link className="btn btn--primary" href="/data-health-check">
              Book a Data Health Check
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ TECHNOLOGY MARQUEE, white ============ */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="wrap" style={{ paddingTop: '2.2rem' }}>
          <p className="eyebrow">We connect the systems that power your business</p>
        </div>
        <Marquee items={STACK} label="Technology platforms Cognovea works with" duration={46} />
      </section>

      {/* ============ 02 POINT OF VIEW, white ============ */}
      <section className="band">
        <div className="wrap">
          <div className="feature">
            <div className="rv rv--left">
              <p className="eyebrow">Point of View</p>
              <h2 className="h-lg" style={{ marginTop: '1.3rem' }}>
                Data Was Never Meant to Be the Destination.
              </h2>
              <p style={{ fontSize: '1.08rem', lineHeight: 1.68, marginTop: '1.3em' }}>
                The real value of data lies in what it enables and the possibilities it creates. Better questions.
                Sharper decisions. Smarter systems. New possibilities. Cognovea combines data analytics, data
                intelligence, and AI to turn complex enterprise data into actionable insights that help organizations
                make better decisions and create measurable business value.
              </p>
              <p className="h-md" style={{ marginTop: '1.6em', maxWidth: '24rem' }}>
                Collect Less Noise. <span className="grad">Create More Intelligence.</span>
              </p>
            </div>

            <div className="feature__media rv rv--right">
              <div className="figure figure--wide">
                <img
                  src="/img/art-clarity.svg"
                  alt="Abstract radar sweep resolving scattered data points into a clear picture"
                  width={800}
                  height={520}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 rv">
            <p className="eyebrow" style={{ marginBottom: '1.8rem' }}>
              Where most engagements begin
            </p>
            <div className="stats">
              {FACTS.map((f) => (
                <div className="stat" key={f.label}>
                  <span className="stat__n">
                    <Counter to={f.n} prefix={f.prefix} suffix={f.suffix} />
                  </span>
                  <span className="stat__l">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 03 WHAT BECOMES POSSIBLE, very light ============ */}
      <section className="band band--tint" id="what-becomes-possible">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">What Becomes Possible</p>
            <h2 className="h-lg">What Becomes Possible When Your Data Starts Working Together</h2>
          </div>

          <div className="grid grid--4">
            {POSSIBLE.map((c) => (
              <article className="card rv rv--scale" key={c.h}>
                <div className="card__art">
                  <img src={c.art} alt={c.alt} width={800} height={520} loading="lazy" decoding="async" />
                </div>
                <h3 className="h-md">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 04 WHAT WE DO, white ============ */}
      <section className="band" id="what-we-do">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">What We Do</p>
            <h2 className="h-lg">From Data to Decisions, We Build What Makes Intelligence Possible</h2>
          </div>

          <div className="rv">
            <Tabs
              tabs={PILLARS.map((p) => ({
                key: p.eyebrow,
                label: p.eyebrow,
                content: (
                  <div className="card card--pad-lg card--flat">
                    <p className="eyebrow">{p.eyebrow}</p>
                    <h3 className="h-md" style={{ marginTop: '1.1rem', maxWidth: '30rem' }}>
                      {p.h}
                    </h3>
                    <p style={{ maxWidth: '52rem' }}>{p.p}</p>
                    {p.links.length > 0 && (
                      <p style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.4em' }}>
                        {p.links.map((l) => (
                          <Link className="link-arrow" href={l.href} key={l.href}>
                            {l.label}
                          </Link>
                        ))}
                      </p>
                    )}
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {/* ============ 05 HOW WE WORK, navy ============ */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">How We Work</p>
            <h2 className="h-lg">A Practical Path Moving From Possibility to Progress</h2>
            <p className="lede">
              Progress with data rarely happens in one move. It happens in stages, each one building the confidence and
              clarity needed for the next.
            </p>
          </div>

          <div className="grid grid--5">
            {STEPS.map((s, i) => (
              <div className="step rv" key={s.h}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 06 YOUR DATA, WORKING FOR YOU, white ============ */}
      <section className="band">
        <div className="wrap">
          <div className="feature feature--flip">
            <div className="rv rv--right">
              <p className="eyebrow">Your Data, Working For You</p>
              <h2 className="h-lg" style={{ marginTop: '1.3rem' }}>
                Lets Bring Your Data Together to Make More of What You Already Have.
              </h2>
              <p className="lede" style={{ marginTop: '1.1em' }}>
                Most businesses aren’t short on data, They’re short on ways to connect it.
              </p>

              <h3 className="h-md" style={{ marginTop: '2.2rem' }}>
                We Connect the Systems That Power Your Business
              </h3>
              <p style={{ marginTop: '.9em' }}>
                Your business likely already runs on SAP, Microsoft Azure, Snowflake, or Power BI, often all four at
                once, each holding a piece of the picture. We connect them, building a modern data platform through
                reliable SAP data integration and cloud data platform architecture, so information moves freely instead
                of sitting locked inside separate systems. From there, we help you make sense of it, using Snowflake
                data analytics and Power BI solutions to turn raw numbers into something your teams can actually use.
              </p>

              <ul className="chips" style={{ marginTop: '1.9rem' }}>
                <li>SAP</li>
                <li>Microsoft Azure</li>
                <li>Snowflake</li>
                <li>Power BI</li>
              </ul>
            </div>

            <div className="feature__media rv rv--left">
              <div className="figure figure--wide">
                <img
                  src="/img/art-automate.svg"
                  alt="Abstract diagram of separate systems routed through one platform into shared outputs"
                  width={800}
                  height={520}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 07 INDUSTRIES, very light ============ */}
      <section className="band band--tint" id="industries">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Industries</p>
            <h2 className="h-lg">Intelligence That Understands the Business Behind the Data</h2>
            <p className="lede">
              Every industry runs on data differently, and the best insights come from knowing that difference.
            </p>
          </div>

          <div className="rv">
            <Scroller
              label="Industries"
              items={INDUSTRIES.map((c) => ({
                key: c.h,
                node: (
                  <article className="card" style={{ height: '100%' }}>
                    <div className="card__art">
                      <img src={c.art} alt={c.alt} width={600} height={400} loading="lazy" decoding="async" />
                    </div>
                    <h3 className="h-sm">{c.h}</h3>
                    <p>{c.p}</p>
                  </article>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {/* ============ 08 PROOF, white ============ */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Proof</p>
            <h2 className="h-lg">
              Real work produces real outcomes and we get stories that are worth telling because the best way to
              understand what we do is to see what it&rsquo;s done for others.
            </h2>
          </div>

          <div className="grid grid--3">
            {PROOF.map((s, i) => (
              <div className="step rv" key={s.h}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client logos and a quote, both from the admin. Each renders nothing
          until something is published, so today the page is unchanged. Placed
          directly after Proof because that is where a reader looks for evidence. */}
      <ClientLogos />
      <Testimonial />

      {/* ============ 09 PEOPLE, very light ============ */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="feature">
            <div className="rv rv--left">
              <p className="eyebrow">People</p>
              <h2 className="h-lg" style={{ marginTop: '1.3rem' }}>
                Get to know the people behind this data transformation intelligence as great data work is still built
                by people who understand both the technology and the business it serves.
              </h2>
              <h3 className="h-md" style={{ marginTop: '2rem' }}>
                A team that treats your business like its own and masters every piece of it.
              </h3>
              <p style={{ marginTop: '.9em' }}>
                Behind every dashboard and every model is a team that took the time to understand your business first.
                Our data experts and analytics consultants work alongside you, not at a distance, bringing both
                technical depth and real business context to every engagement.
              </p>
              <div className="btn-row">
                <Link className="btn btn--ghost" href="/about-us">
                  About Cognovea
                  <Arrow />
                </Link>
              </div>
            </div>

            {/*
              TEAM PHOTOGRAPHY SLOT
              Drop a 4:5 portrait or team photo at public/img/team.jpg and swap the
              src below. Keep the alt text descriptive. Abstract art stands in until
              then. A real photograph of the team will outperform it.
            */}
            <div className="feature__media rv rv--right">
              <div className="figure figure--tall">
                <img
                  src="/img/art-confidence.svg"
                  alt="Abstract illustration of many separate paths converging on a single decision"
                  width={800}
                  height={520}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 10 INSIGHTS, white ============ */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Insights</p>
            <h2 className="h-lg">Floating Ideas for the Data-Driven Enterprise.</h2>
            <p className="lede">
              The world of data and AI moves quickly, and our team believes that staying informed is crucial for staying
              ahead.
            </p>
          </div>

          <div className="grid grid--5">
            {INSIGHTS.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 11 FINAL CTA, navy ============ */}
      <section className="c-cta">
        <div className="wrap">
          <div className="rv measure">
            <p className="eyebrow">What&rsquo;s Next</p>
            <h2 className="h-lg" style={{ marginTop: '1.3rem' }}>
              Are you curious to know what all possibilities your data holds?
            </h2>
            <p className="lede" style={{ marginTop: '1.2em' }}>
              Would you be interested in finding that out together? Because every business that&rsquo;s sitting with a
              lot of data has more potential than it&rsquo;s currently using. The only question is what happens next.
            </p>
            <div className="btn-row">
              <Link className="btn btn--primary" href="/contact">
                Start the Conversation
                <Arrow />
              </Link>
              <Link className="btn btn--ghost" href="/data-health-check">
                Book a Data Health Check
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
