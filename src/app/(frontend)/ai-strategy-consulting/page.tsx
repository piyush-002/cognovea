import type { Metadata } from 'next';
import Link from 'next/link';
import Testimonial from '@/components/Testimonial';
import { Arrow, CtaBand, Figure, PageHero, breadcrumbSchema, serviceSchema } from '@/components/Bits';
import Faq from '@/components/Faq';
import { faqSchema, type FaqItem } from '@/lib/schema';
import JsonLd from '@/components/JsonLd';
import Rail from '@/components/Rail';

/* Statically generated, and this page shows client logos and a testimonial,
   both of which are published from the admin long after the build. Without a
   revalidate the page keeps serving the HTML from the last deploy, so a logo
   published today would not appear until the next one. Five minutes, matching
   careers and insights; `src/lib/revalidate.ts` also refreshes it on publish so
   the usual wait is none at all. */
export const revalidate = 300;


const PATH = '/ai-strategy-consulting';

export const metadata: Metadata = {
  title: 'AI Strategy and Consulting Services | Cognovea',
  description:
    'Looking for a trusted ai consultancy? We provide a clear AI adoption roadmap and a secure AI governance framework to help your business grow safely.',
  alternates: { canonical: `${PATH}/` },
  openGraph: {
    title: 'AI Strategy and Consulting Services | Cognovea',
    description:
      'Looking for a trusted ai consultancy? We provide a clear AI adoption roadmap and a secure AI governance framework to help your business grow safely.',
    url: `${PATH}/`,
  },
};

const CRUMBS = [{ href: PATH, label: 'AI Strategy & Consulting' }];

/* --- Six-phase overview table --- */
const PHASE_TABLE: [string, string, string, string][] = [
  ['1. Assessment', 'Infrastructure and Data Pipeline Audit', 'Technical Viability Report', 'Finds and fixes hidden data roadblocks early'],
  ['2. Discovery', 'Identifying and Scoring Business Needs', 'Feasibility Matrix and KPI Map', 'Directs your budget toward high-value projects'],
  ['3. Roadmapping', 'Phased Execution and Timeline Planning', 'Comprehensive Adoption Plan', 'Keeps engineering work aligned with business deadlines'],
  ['4. Technology', 'Vendor-Agnostic Software Advisory', 'Architecture Blueprint', 'Prevents you from buying the wrong platform'],
  ['5. Governance', 'Security, Ethics, and Compliance', 'Risk Management Document', 'Protects customer data and meets legal standards'],
  ['6. Operations', 'Internal Team and Workflow Structuring', 'Center of Excellence Design', 'Teaches your team to manage the tools independently'],
];

type Block = { h: string; items?: { t: string; d: string }[]; paras?: string[] };

/* Phase 4 carries three separate H3s in the source document, so a phase holds a
   list of blocks rather than one. Merging them into a single heading changed the
   document's wording, which is the one thing this page must not do. */

const PHASES: { id: string; label: string; h: string; paras: string[]; blocks?: Block[] }[] = [
  {
    id: 'phase-1',
    label: '01 · Assessment',
    h: 'Phase 1: AI Readiness Assessment and Infrastructure Auditing',
    paras: [
      'Every effective tech endeavor begins with a clear awareness of the tools you already have which is why before you invest in constructing new software models, we provide you with a full AI readiness assessment. This first step evaluates the strength, security, and flexibility of your current computer systems. We must guarantee that your existing data foundation is strong enough to support high-performance applications.',
      'During this phase, our advisory experts look closely at how information moves through your company. We check your storage databases, your cloud servers, and your daily software tools. We want to identify the strong points in your current setup so we can build upon them.',
    ],
    blocks: [{
      h: 'What We Evaluate During the Assessment',
      items: [
        {
          t: 'Data Quality and Flow',
          d: 'We trace how raw information moves from your sales or operations tools into your main storage. Clean information is required for machine learning to work properly.',
        },
        {
          t: 'Cloud System Capacity',
          d: 'We review your current cloud hosting services. We check if your servers have the processing power to handle larger tasks without slowing down your daily work.',
        },
        {
          t: 'Legacy Software Connections',
          d: 'We look at the older software your company uses. We assess how easily those older programs can share information with modern analytical tools.',
        },
        {
          t: 'Security Baselines',
          d: 'We review who currently has access to your business information. We validate your data hygiene practices to ensure total privacy.',
        },
      ],
    }],
  },
  {
    id: 'phase-2',
    label: '02 · Discovery',
    h: 'Phase 2: AI Use Case Discovery for Enterprise AI Strategy',
    paras: [
      'Once we know your infrastructure is secure, the next stage is finding the exact problems you need to solve. Building an effective Enterprise AI strategy means linking your main business goals directly to technical solutions. We look for the exact point where modern software capabilities meet your commercial needs.',
      'We work side-by-side with your leadership team to define a practical ai product strategy. We do not chase trends. Instead, we evaluate potential software projects based on how much effort they require and how much money they will save or generate.',
    ],
    blocks: [{
      h: 'How We Score and Select Projects',
      paras: [
        'To choose the best projects, we use a structured scoring system. This takes the uncertainty out and offers you a strong, logical basis to approve a project.',
      ],
      items: [
        {
          t: 'Measure business impact',
          d: 'We evaluate the possible increase in revenue, the staff hours you will save and the cost savings for each concept.',
        },
        {
          t: 'Estimating the Workload',
          d: 'We measure how many engineering hours a project will take. We also calculate how much time your staff will need to spend preparing the data.',
        },
        {
          t: 'Evaluating the Risks',
          d: 'We look closely at privacy concerns. We figure out if a new software tool might cause interruptions to your normal workday.',
        },
        {
          t: 'Ranking the Options',
          d: 'We plot all your ideas onto a chart. We recommend starting with the projects that offer the highest financial reward for the lowest amount of technical effort.',
        },
      ],
    }],
  },
  {
    id: 'phase-3',
    label: '03 · Roadmapping',
    h: 'Phase 3: Developing Your AI Adoption Roadmap',
    paras: [
      'A master blueprint is needed to go from coming up with ideas to actually making something. We take all the information gathered during the discovery phase and translate it into a clear AI adoption roadmap. This document serves as your company’s official guide. It explains the exact sequence of events needed to move from a basic idea to a fully functioning company-wide system.',
      'We create rollout plans that respect your staff’s current workload. We establish clear timelines and assign specific tasks so everyone knows their role.',
    ],
    blocks: [{
      h: 'What Your Planning Document Includes',
      paras: [
        'The roadmap acts as a project management anchor. It details when specific software should be tested and when it should be released to your employees. We also include specific requirements for applied generative ai for digital transformation. This ensures that when you finally introduce modern writing or image-generation tools to your staff, the rollout is controlled, highly organized, and deeply beneficial to every department.',
      ],
    }],
  },
  {
    id: 'phase-4',
    label: '04 · Technology',
    h: 'Phase 4: AI Integration Services and Technology Strategy',
    paras: [
      'Choosing the right software stack is critical. Buying the wrong tools can delay your progress by months. Our ai integration services provide independent, strategic advice to help you navigate the crowded software market. We do not offer software licenses for sale, what we do is give you suggestions that aren’t tied to any particular vendor, so you can be sure you’re getting the right tools for your business.',
      'Our advisory team covers a wide range of modern capabilities. We help you plan the architecture before any coding begins.',
    ],
    blocks: [{
      h: 'Language Models and Content Automation',
      items: [
        {
          t: 'Generative AI consulting services',
          d: 'We help you select the best foundational models for automating your document creation, drafting emails, and building enterprise search engines.',
        },
        {
          t: 'Generative AI consulting',
          d: 'We advise your leadership on how to train your staff to use these new writing tools safely.',
        },
        {
          t: 'LLM consulting',
          d: 'We design secure frameworks that connect large language models directly to your private company documents, allowing your staff to search for internal answers instantly.',
        },
      ],
    },
    {
      h: 'Data Analysis and Prediction Tools',
      items: [
        {
          t: 'Machine learning consulting services',
          d: 'We design the blueprint for predictive models. This planning helps your business forecast inventory demand, reduce customer turnover, and analyze buying behavior.',
        },
        {
          t: 'ai machine learning consulting',
          d: 'We advise on the specific data formats needed to train algorithms accurately, ensuring your predictions are based on facts.',
        },
      ],
    },
    {
      h: 'Custom Architecture Planning',
      items: [
        {
          t: 'artificial intelligence development services',
          d: 'We plan the exact integration steps needed to embed smart features into your existing accounting systems, CRM tools, and daily operational platforms.',
        },
        {
          t: 'custom ai software development',
          d: 'When off-the-shelf software does not fit your needs, we draft the architectural plans for bespoke applications tailored entirely to your specific work style.',
        },
        {
          t: 'enterprise ai development services',
          d: 'We do the big-picture planning that’s needed to make sure that complicated systems that work with many departments can talk to each other safely and correctly.',
        },
      ],
    }],
  },
  {
    id: 'phase-5',
    label: '05 · Governance',
    h: 'Phase 5: Establishing a Durable AI Governance Framework',
    paras: [
      'When a company gets powerful new software, they have to follow strict rules about ethics and security, so we help you in building a comprehensive AI governance framework. This framework protects your digital property, secures your customer records, and builds deep trust with your board of directors.',
      'As part of our Responsible AI consulting, we make sure that your new technology is safe. Our goal is to get rid of the chance of data leaks or unfair decisions.',
    ],
    blocks: [{
      h: 'Important Parts of Managing Risk',
      items: [
        {
          t: 'Understanding the Decisions',
          d: 'We help you implement interpretability rules. This means your business leaders will always be able to see exactly how a software model reached a specific conclusion.',
        },
        {
          t: 'Monitoring for Errors',
          d: 'We advise on the best protocols to detect errors over time. If a prediction model starts giving skewed or inaccurate outputs, your team will have the guidelines in place to catch it immediately.',
        },
        {
          t: 'Following the Law',
          d: 'We ensure that all of your strategic plans smoothly incorporate rules for AI in regulatory compliance. To ensure that your brand’s image stays safe or you do not get fined, we make sure to follow the strict protocols and maintain the standards of the global data protection policies.',
        },
      ],
    }],
  },
  {
    id: 'phase-6',
    label: '06 · Operations',
    h: 'Phase 6: Crafting a Viable AI Operating Model',
    paras: [
      'True digital growth does not just involve buying software, it requires teaching the people who use it. The final phase of our advisory process focuses on building your internal company strength. We help you design a sustainable AI operating model. This ensures your workforce is fully equipped to manage, update, and expand your new technical assets without needing outside help forever.',
    ],
    blocks: [{
      h: 'Building Your Internal Team Structure',
      items: [
        {
          t: 'Creating a Central Hub',
          d: 'We help you design an internal Center of Excellence. This is a dedicated group within your company that drives innovation, shares safety practices, and maintains data quality.',
        },
        {
          t: 'Planning the Training',
          d: 'We identify the exact skills your data engineers, business analysts, and department heads need to learn. We map out training pathways to ensure smooth adoption across the company.',
        },
        {
          t: 'Preparing for Independence',
          d: 'The ultimate goal of our consulting work is autonomous handover. We ensure your internal teams have the documentation and confidence to manage these complex architectures completely on their own.',
        },
      ],
    }],
  },
];

const GUARANTEES = [
  {
    h: 'You Own Everything',
    p: 'We believe in your complete operational freedom. If you work with us, you own all the code, the predictive models, the pipeline designs and the strategic documents we develop together.',
  },
  {
    h: 'No Vendor Lock-in',
    p: 'We’re not locking you into proprietary software ecosystems. Our technology stack recommendations are entirely independent.',
  },
  {
    h: 'Built for Engineers',
    p: 'Every strategy document we deliver is drafted by senior technical architects. This ensures the plans are completely feasible and ready for an immediate developer handoff.',
  },
  {
    h: 'Giving Emphasis on Teaching',
    p: 'For the simple reason that we want you to retain the valuable capabilities within your own building, we actively teach your internal teams to operate and maintain the architectures we develop.',
  },
];

const FAQS: FaqItem[] = [
  {
    q: 'What deliverables will we receive from your ai strategy consulting services?',
    a: 'At the end of an advisory engagement, your business receives a complete suite of tangible planning documents. This includes a written infrastructure audit, a scored list of feasible projects, a phased timeline for integration, a vendor-neutral technology recommendation, and a formalized risk management playbook.',
  },
  {
    q: 'How does strategy consulting differ from standard software development?',
    a: 'AI strategy consulting focuses on answering the "what," the "why," and the "how" before any programmers start typing code. While development is the act of building, consulting ensures you are building the correct tool, on a secure foundation, using the safest methods. This preparation makes the actual development phase much faster and far cheaper.',
  },
  {
    q: 'Why is risk management important in the planning process?',
    a: 'Risk management is so important in the planning process simply because it helps protect your investments from the costly legal issues or security issues in the future and it does that by setting clear rules for data protection and model transparency early on. It makes sure that your systems are safe even as your business grows.',
  },
  {
    q: 'Are you considered among the best ai consulting firms for complex corporate structures?',
    a: 'Yes. Cognovea partners with ambitious, complex organizations across the market. Our planning methodologies are highly scalable. They can adapt to the changing needs of medium-sized businesses as well as the strict needs of multinational conglomerates.',
  },
];

export default function AiStrategyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          serviceSchema({
            name: 'AI Strategy and Consulting Services',
            description:
              'Cognovea provides enterprise AI consulting across six phases: readiness assessment, use-case discovery, adoption roadmap, technology advisory, governance framework and operating model.',
            path: PATH,
            serviceType: 'AI Strategy Consulting',
          }),
          faqSchema(FAQS),
        ]}
      />

      <PageHero
        eyebrow="AI Strategy"
        title="AI Strategy and Consulting Services"
        crumbs={CRUMBS}
        intro="A thorough grasp of your company's operations, meticulous planning, and effective communication are all necessary when implementing new technologies."
      >
        <div className="rich measure" style={{ marginTop: '1.4em' }}>
          <p>
            At Cognovea, we provide the foundational guidance required to turn complex technical concepts into highly
            practical business tools. Our AI Strategy and Consulting Services give you a structured path to follow. We
            help you connect your existing data systems with modern machine learning capabilities. By doing this, we
            ensure that every dollar you invest in technology creates a direct and measurable benefit for your company.
          </p>
          <p>
            Operating as a dedicated ai consultancy, our primary goal is to empower your internal teams. We map out
            detailed plans that improve how your daily operations run, elevate the way you interact with customers, and
            open new doors for market expansion. By combining strong engineering knowledge with clear business planning,
            we make sure your technology projects match your most important corporate goals. We avoid confusing jargon
            and focus strictly on what works. Our approach to artificial intelligence consulting gives your leadership
            team the exact information they need to make confident, secure, and highly profitable decisions.
          </p>
        </div>
        <div className="btn-row">
          <Link className="btn btn--primary" href="/contact">
            Schedule an Advisory Session
            <Arrow />
          </Link>
          <Link className="btn btn--ghost" href="/generative-ai-services">
            Generative AI Services
          </Link>
        </div>
      </PageHero>

      {/* --- Core capabilities table --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Framework</p>
            <h2 className="h-lg">Core Capabilities of Our AI Consulting Services</h2>
            <p className="lede">
              Starting a digital upgrade requires a highly organized approach. Our AI consulting services act as your
              guide through every step of this process. We break down the complex world of modern technology into
              manageable, logical phases. This structured method helps your business build its internal skills slowly
              and safely, reducing the risk of expensive mistakes.
            </p>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                Through our Enterprise AI consulting framework, we organize the planning lifecycle into six distinct
                steps. This ensures that the technical side of your business perfectly supports the human side.
              </p>
            </div>
            <Figure src="/img/as-roadmap.svg" alt="Abstract six-phase timeline with the first three phases complete" />
          </div>

          <div className="table-scroll rv">
            <table>
              <caption className="sr-only">The six phases of Cognovea&rsquo;s AI consulting framework</caption>
              <thead>
                <tr>
                  <th scope="col">Consulting Phase</th>
                  <th scope="col">Primary Focus Area</th>
                  <th scope="col">Key Deliverable Provided</th>
                  <th scope="col" className="col-mark">
                    Direct Business Benefit
                  </th>
                </tr>
              </thead>
              <tbody>
                {PHASE_TABLE.map(([phase, focus, deliverable, benefit]) => (
                  <tr key={phase}>
                    <th scope="row">{phase}</th>
                    <td>{focus}</td>
                    <td>{deliverable}</td>
                    <td className="col-mark">{benefit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- The six phases in detail --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">The Six Phases</p>
            <h2 className="h-lg">From audit to autonomous handover</h2>
          </div>

          <Rail
            items={PHASES.map((p) => ({
              id: p.id,
              label: p.label,
              content: (
                <>
                  <h3 className="h-md">{p.h}</h3>
                  <div className="rich" style={{ marginTop: '1em' }}>
                    {p.paras.map((t, i) => (
                      <p key={i}>{t}</p>
                    ))}
                  </div>

                  {p.blocks?.map((b) => (
                    <div className="card card--flat" key={b.h} style={{ marginTop: '1.8rem' }}>
                      <h4 className="h-sm">{b.h}</h4>
                      {b.paras?.map((t, i) => (
                        <p key={i}>{t}</p>
                      ))}
                      {b.items && (
                        <ul className="rich" style={{ listStyle: 'none', padding: 0, marginTop: '1.1rem' }}>
                          {b.items.map((it) => (
                            <li
                              key={it.t}
                              style={{ position: 'relative', paddingLeft: '1.65rem', marginTop: '0.85rem' }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  position: 'absolute',
                                  left: '0.15rem',
                                  top: '0.72em',
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: 'var(--grad)',
                                }}
                              />
                              <strong>{it.t}:</strong> <span style={{ color: 'var(--fg-2)' }}>{it.d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </>
              ),
            }))}
          />
        </div>
      </section>

      {/* --- Why Cognovea --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Why Cognovea</p>
            <h2 className="h-lg">What Makes Cognovea a Top AI Consulting Firm?</h2>
            <p className="lede">
              Choosing the right advisory partner will determine the success of your entire digital journey. Cognovea is
              recognized as a leading AI consulting firm because we prioritize honesty, engineering accuracy, and the
              total independence of our clients.
            </p>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                When executives evaluate top ai consulting firms, they look for clear communication and deep technical
                knowledge. We deliver actionable, highly detailed blueprints that your internal IT teams can execute with
                total confidence.
              </p>
              <p>Here are the specific guarantees we provide to every business we advise:</p>
            </div>
            <Figure src="/img/as-matrix.svg" alt="Abstract impact-versus-effort scatter with the high-impact low-effort quadrant highlighted" />
          </div>

          <div className="grid grid--2">
            {GUARANTEES.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="band band--deep">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">FAQ</p>
            <h2 className="h-lg">Frequently Asked Questions Related to AI Strategy and Consulting</h2>
          </div>
          <div className="rv">
            <Faq items={FAQS} />
          </div>
        </div>
      </section>

      {/* Only shows a quote tagged for this service. A data engineering quote
          on a Generative AI page reads as filler, so no match means no section. */}
      <Testimonial service="ai-strategy-consulting" />

      <CtaBand
        title="Are you convinced that you should get started with Digital Planning right away?"
        body="Stepping into the future of business requires a precise plan and an experienced guide. Cognovea is devoted to assisting your company in safely and economically utilizing the power of contemporary data architecture. You enable your employees to attain consistent growth, outstanding operational clarity, and a long-lasting competitive advantage in your sector by laying a perfect strategic foundation now. So are you ready to design your enterprise roadmap? Connect with our advisory experts today to schedule an initial consultation. We will evaluate your digital readiness and help you map the best path forward."
        primary={{ href: '/contact', label: 'Schedule an Advisory Session' }}
        secondary={{ href: '/data-health-check', label: 'Book a Data Health Check' }}
      />
    </>
  );
}
