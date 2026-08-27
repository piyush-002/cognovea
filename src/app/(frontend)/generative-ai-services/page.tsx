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


const PATH = '/generative-ai-services';

export const metadata: Metadata = {
  title: 'Generative AI Development Services | Cognovea for Business',
  description:
    'Build Generative AI solutions with Cognovea using AI readiness, RAG development services, conversational BI, and LLM integration for measurable AI results.',
  alternates: { canonical: `${PATH}/` },
  openGraph: {
    title: 'Generative AI Development Services | Cognovea for Business',
    description:
      'Build Generative AI solutions with Cognovea using AI readiness, RAG development services, conversational BI, and LLM integration for measurable AI results.',
    url: `${PATH}/`,
  },
};

const CRUMBS = [{ href: PATH, label: 'Generative AI Services' }];

/* --- Data foundation approach --- */
const APPROACH = [
  {
    h: 'Understanding first',
    p: 'Recognize the systems, operations, data, and business context that the AI use case requires.',
  },
  { h: 'Prepare', p: 'Connect, structure, clean, and organize the information required by the solution.' },
  {
    h: 'Ground',
    p: 'Give AI access to relevant business knowledge through approaches such as RAG, semantic models, and controlled data connections.',
  },
  { h: 'Validate', p: 'Before putting the solution into production, test it against actual use cases and data.' },
];

/* --- Services --- */
const SERVICES = [
  {
    id: 'readiness',
    label: 'AI Readiness Assessment',
    h: 'AI Readiness Assessment',
    kicker: 'Have an idea of what to construct before developing anything.',
    paras: [
      'Our AI readiness assessment considers the use cases that are possible considering their business impact, data readiness, implementation effort, and feasibility. Our task is to differentiate what is technically appealing from business possibilities.',
      'You get a prioritized view of potential use cases, an understanding of what your current data can support, and a practical direction for implementation. This makes AI readiness consulting a useful first step when you know AI has potential but are not yet sure where to begin.',
    ],
  },
  {
    id: 'rag',
    label: 'RAG & Knowledge AI',
    h: 'RAG Development & Knowledge AI',
    kicker: 'Get answers from your own business information.',
    paras: [
      'Our RAG development services connect AI models with approved documents and knowledge sources so users can ask questions and receive responses grounded in relevant information.',
      'A well-designed RAG solution can bring together document preparation, retrieval, knowledge grounding, source references, guardrails, confidence controls, and human escalation. This can support enterprise RAG, enterprise RAG solutions, and enterprise AI search experiences where users need answers based on current business information rather than general model knowledge.',
    ],
  },
  {
    id: 'conversational-bi',
    label: 'Conversational BI',
    h: 'Ask Your Data & Conversational BI',
    kicker: 'Let teams ask business questions in plain language.',
    paras: [
      'Cognovea’s conversational BI solutions create a natural-language layer over business data. Instead of navigating multiple reports or depending on technical queries for every question, users can ask about business performance in familiar language.',
      'A semantic model can connect business terminology with the underlying data, while confidence controls and evaluation help keep responses connected to the intended data sources.',
      'This facilitates the exploration and comprehension of corporate data by teams and puts generative AI for data analytics, conversational BI, and natural language BI closer to daily decision-making.',
    ],
  },
  {
    id: 'agents',
    label: 'AI Agents & Automation',
    h: 'AI Agent Development & Workflow Automation',
    kicker: 'Transition from AI that provides answers to AI that assists in finishing tasks.',
    paras: [
      'The established, multi-step workflows that our AI agent development services provide allow AI to carry out activities in accordance with triggers, rules, available tools, and approval criteria.',
      'Potential applications include report preparation, request triage, information reconciliation, response drafting, and routine workflow actions. Agents can include logging, error handling, and human approval where an incorrect action could have a significant business impact.',
      'The focus is not simply on creating autonomous AI. It is on designing controlled AI workflow automation around tasks where automation can genuinely reduce repetitive work.',
    ],
  },
  {
    id: 'documents',
    label: 'Document Automation',
    h: 'AI Document Automation',
    kicker: 'Turn repetitive document work into structured workflows.',
    paras: [
      'Our AI document automation solutions can take information from invoices, orders, forms, and other business documents, sort it into categories, check the results, and send the organized data to ERP or workflow systems that are already in place.',
      'Instead of expecting automation to handle every document correctly, workflows can find results that aren’t very reliable and send them to a person to be reviewed. This strikes a good balance between automation and human supervision.',
    ],
  },
  {
    id: 'customer-facing',
    label: 'Customer-Facing AI',
    h: 'AI that faces the customer / Customer-Facing AI experiences',
    kicker: 'AI is the way to go for speeding up your customer interactions.',
    paras: [
      'AI is the way to go for speeding up your customer interactions and AI does have many other use cases to it as well that makes it a fruitful asset today.',
      'Congnovea builds customer-facing AI experiences for mobile applications such as WhatsApp and websites that enable them to be connected with the systems that are already used by the businesses like CRM, ticketing platforms and order management, through this help the customers can get quick answers to their queries, easily find the information they need, can make requests feasibly now and receive the support all customised to their requirements.',
      'When a request needs human opinion, the experience can have clear ways to take it to the next level. This allows businesses to use AI for common interactions without removing human support from situations where it adds value.',
    ],
  },
];

/* --- How generative AI improves data and processes --- */
const BETTER = [
  {
    h: 'Make knowledge easier to find',
    p: 'Knowledge experiences powered by AI can help teams search through documents, policies, reports, and other internal data. Users can ask questions in everyday language and get relevant replies without having to look for information in a lot of different places by hand.',
  },
  {
    h: 'Make data easier to understand',
    p: 'Business users can explore data using natural-language interfaces without having to write technical queries for each request or comprehend database structures. This can maintain the underlying data model while improving analytics accessibility.',
  },
  {
    h: 'Cut down on repetitive and cumbersome tasks',
    p: 'We often come across certain tasks that usually involve doing more than one step like it requires steps such as organising requests, creating reports and then also moving that data between the systems, these hefty tasks could be replaced by humans and instead done by AI Agents/Bots. Although humans may still need to approve decisions when they need to be checked by others.',
  },
  {
    h: 'Process documents more efficiently',
    p: 'AI document automation can help teams spend less time on human data entry and exception handling by extracting, classifying, validating and routing information from repeated business documents.',
  },
  {
    h: 'Incorporate AI into current products',
    p: 'Add LLM-powered features like intelligent search, natural language interaction, classification, summarization, and writing to business apps that you already use.',
  },
];

/* --- Data foundation capabilities --- */
const FOUNDATION = [
  {
    h: 'Data Engineering',
    p: 'Build reliable pipelines that bring the information required by the AI solution together and make it available in a usable form.',
    href: '/data-engineering-services',
  },
  {
    h: 'Data Modernization',
    p: 'Improve fragmented or legacy data environments where the existing foundation limits the ability to build or scale new AI use cases.',
    href: '/data-modernization-services',
  },
  {
    h: 'Data Analytics',
    p: 'Create the business models, definitions, and analytical foundation needed to turn data into usable insights and support natural-language analytics.',
  },
  {
    h: 'AI Integration',
    p: 'Connect the resulting data foundation with RAG systems, AI agents, LLM applications, and other Generative AI solutions.',
  },
];

/* --- Delivery stages --- */
const STAGES = [
  {
    h: 'Assess',
    p: 'Identify valuable use cases, evaluate business value and feasibility, and understand what your existing data can support. This creates a focused starting point instead of trying to apply AI to every possible process.',
  },
  {
    h: 'Prepare',
    p: 'Build the data foundation required for the selected use case. Depending on the solution, this can involve data connections, document preparation, retrieval systems, semantic models, data quality work, or integrations with existing applications.',
  },
  {
    h: 'Prove',
    p: 'Create a functional proof of concept with actual data, then assess whether the solution produces the desired result. Before a more extensive implementation, testing at this level aids in identifying gaps in data, accuracy, process design, or technical viability.',
  },
  {
    h: 'Implement and Enhance',
    p: 'Move the validated solution into production and continue improving accuracy, retrieval, prompts, content, models, performance, and operating costs as the system evolves.',
  },
];

/* --- Why Cognovea --- */
const WHY = [
  {
    h: 'Outcome Over Hours',
    p: 'We focus on clearly defined AI outcomes, scope, and delivery rather than making the engagement about hours alone. The objective is to create something useful for the business, with a clear understanding of what is being built and why.',
  },
  {
    h: 'Measure Before You Scale',
    p: 'AI performance should be evaluated against the actual use case. Real data, defined evaluation criteria, and testing help determine whether a solution is ready to move beyond experimentation.',
  },
  {
    h: 'Built Around Your Data',
    p: 'AI solutions are designed around the information, systems, and workflows your business already uses. This allows the technology to fit the way your teams work rather than requiring the business to work around the technology.',
  },
  {
    h: 'Human Oversight Where It Matters',
    p: 'Automation does not mean removing people from every decision. Approval and escalation steps can be included where a decision requires human judgment or where an incorrect action could have a meaningful impact.',
  },
  {
    h: 'Your Code. Your Models. Your Documentation.',
    p: 'Cognovea’s approach is built around client ownership rather than unnecessary lock-in, giving you greater control over the solution delivered for your business.',
  },
  {
    h: 'Honest About Feasibility',
    p: 'Not every AI idea should become an AI project. Our AI readiness consulting approach helps identify which opportunities are worth pursuing and what needs to be in place before development begins.',
  },
];

/* --- Use case matrix --- */
const USE_CASES: { col: string; items: string[] }[] = [
  { col: 'Knowledge & Information', items: ['Knowledge assistants', 'Document search', 'Research & summarization'] },
  { col: 'Data & Analytics', items: ['Natural-language queries', 'Conversational BI', 'Business reporting'] },
  { col: 'Operations', items: ['Workflow automation', 'Document processing', 'Request triage'] },
  { col: 'Customer Experience', items: ['Customer AI assistants', 'Support automation', 'Human escalation'] },
];

const FAQS: FaqItem[] = [
  {
    q: 'How do I choose the right Generative AI service provider?',
    a: 'Identify a partner who is capable of aligning the AI development process with your data and current systems and business objectives. A capable provider will be able to assess the feasibility of your use case, deal with your actual business data, measure the outcome, and scale the solution from the prototype stage. Cognovea employs a data-first strategy combining data engineering, data analytics, and AI development.',
  },
  {
    q: 'Can you build Generative AI solutions using our existing business data?',
    a: 'Absolutely. Cognovea is capable of designing solutions based on existing business data, including structured data, documents, knowledge bases, and information from interconnected systems. Based on the use case, it may include RAG, semantic models, data pipelines, APIs, or application integration. The very first step is to find out what data you have and what an AI solution needs from it.',
  },
  {
    q: 'How do we know if our business is ready for a Generative AI project?',
    a: 'An AI readiness assessment would be able to show whether the use case is a combination of right business value, right data, right feasibility and implementation effort. Rather than diving into development from the beginning, Cognovea does an evaluation on the use cases that can be considered valuable enough and what needs to be done before that.',
  },
  {
    q: 'Can Generative AI be combined with our current applications and processes?',
    a: 'Yes. Generative AI integration could provide abilities for summarization, writing, classifying, searching, natural language processing, or any other workflow that involves AI. Cognovea is also able to integrate AI tools with business applications when the use case demands for information flow between systems.',
  },
  {
    q: 'How do you evaluate whether a Generative AI solution is ready for production?',
    a: 'We evaluate the solution against the actual business use case rather than relying only on a general model benchmark. The proof of concept may be evaluated through real-world data, criteria for evaluation, retrieval quality, response quality, work flow efficiency, and other factors that pertain to the proposed solution. This is important in determining areas that require improvement.',
  },
  {
    q: 'How long would it take to develop a Generative AI system/solution?',
    a: 'Timeline is dependent upon the application scenario, level of data maturity, integration, complexities involved in the process, and testing needed. A focused AI readiness assessment or proof of concept can provide a clearer understanding of the scope before a larger implementation begins. Production timelines are then based on the requirements of the validated solution.',
  },
  {
    q: 'Can you help us decide between RAG, AI agents, conversational BI, and other Generative AI approaches?',
    a: 'Yes. The right approach depends on the problem being solved. RAG is useful when users need grounded answers from business knowledge, conversational BI can help users interact with governed business data in natural language, and AI agents are better suited to defined multi-step workflows. Cognovea can assess the use case and recommend the approach that best fits the data, workflow, and desired outcome.',
  },
  {
    q: 'What happens after a Generative AI solution goes into production?',
    a: 'Generative AI systems often need ongoing evaluation and improvement as data, user behaviour, content, and models change. Post-production support can include accuracy checks, retrieval and prompt tuning, content updates, model upgrades, monitoring, and cost management based on the needs of the solution.',
  },
];

export default function GenerativeAiPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          serviceSchema({
            name: 'Generative AI Development Services',
            description:
              'Cognovea builds generative AI solutions around your data: AI readiness assessments, RAG and knowledge assistants, conversational BI, AI agents, document automation and LLM integration.',
            path: PATH,
            serviceType: 'Generative AI Development',
          }),
          faqSchema(FAQS),
        ]}
      />

      <PageHero
        eyebrow="Generative AI"
        title="Generative AI Development Services Based and Built Around Your Data, For Your Data"
        crumbs={CRUMBS}
        intro="By utilizing the appropriate data and business context, generative AI can do more than just produce content. It can also help teams access information more quickly, better comprehend data, automate tedious tasks, and enhance customer and employee experiences."
      >
        <div className="rich measure" style={{ marginTop: '1.4em' }}>
          <p>
            In order to find the best use cases, prepare your data, create and implement AI solutions, and support them
            in actual business settings, Cognovea offers generative AI development services that link AI with your data,
            processes, and business systems.
          </p>
          <p>
            Our strategy focuses on using generative AI when it helps meet a particular business requirement, rather
            than simply adopting AI because the technology is available.
          </p>
        </div>
        <div className="btn-row">
          <Link className="btn btn--primary" href="/contact">
            Get Started With an AI Readiness Assessment
            <Arrow />
          </Link>
          <Link className="btn btn--ghost" href="/ai-strategy-consulting">
            AI Strategy &amp; Consulting
          </Link>
        </div>
      </PageHero>

      {/* --- Data foundation --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Foundations</p>
            <h2 className="h-lg">Why is the Correct Data Foundation Necessary for Generative AI?</h2>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                That&rsquo;s because business information is scattered over databases, papers, reports, applications, and
                internal systems and a strong AI model is only one component of the solution. If the data is difficult to
                access, inconsistent, out-of-date, or without any context, the AI may not be able to offer helpful
                solutions.
              </p>
              <p>
                This is why Cognovea brings data engineering, data analytics, and AI development together. The objective
                is to build Generative AI solutions around the information your business actually uses.
              </p>
            </div>
            <Figure src="/img/ai-rag.svg" alt="Abstract diagram of a question retrieving from approved sources and returning a cited answer" />
          </div>

          <div className="grid grid--4 mt-3">
            {APPROACH.map((s, i) => (
              <div className="step rv" key={s.h}>
                <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-sm">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>

          <div className="card card--flat rv mt-3 measure">
            <p>
              Connecting an AI model to a data source is not the only objective. The goal is to develop an AI system
              that adheres to the planned workflow, has the appropriate context, and can be assessed against the results
              your company requires.
            </p>
          </div>
        </div>
      </section>

      {/* --- Services --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Services</p>
            <h2 className="h-lg">Generative AI Services for Data, Knowledge and Business Workflows</h2>
            <p className="lede">
              Our generative AI solutions are designed around practical business needs, from accessing internal
              knowledge and analyzing data to automating workflows and adding AI capabilities to existing products.
            </p>
          </div>

          <Rail
            items={SERVICES.map((s) => ({
              id: s.id,
              label: s.label,
              content: (
                <>
                  <h3 className="h-md">{s.h}</h3>
                  {/* No cyan here: this panel sits on a light band, where cyan text renders at
                      1.68:1 and is effectively invisible. Cyan is an on-navy accent only. */}
                  <p className="lede" style={{ marginTop: '0.7em' }}>
                    {s.kicker}
                  </p>
                  <div className="rich" style={{ marginTop: '1em' }}>
                    {s.paras.map((t, i) => (
                      <p key={i}>{t}</p>
                    ))}
                  </div>
                </>
              ),
            }))}
          />
        </div>
      </section>

      {/* --- What it improves --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Outcomes</p>
            <h2 className="h-lg">How can Generative AI make the data and processes of your business better?</h2>
            <p className="lede">
              When generative AI is integrated with the data and procedures your teams already rely on, it becomes much
              more beneficial.
            </p>
          </div>

          <div className="grid grid--3">
            {BETTER.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Build the data foundation --- */}
      <section className="band band--dark">
        <div className="wrap">
          <div className="feature">
            <div className="rich rv rv--left">
              <p className="eyebrow">Capabilities</p>
              <h2 className="h-lg">Build the Data Foundation for Generative AI</h2>
              <p className="lede">
                Generative AI projects often need more than a model. They may depend on structured data, documents, data
                warehouses, business applications, and multiple connected systems. Cognovea brings its broader data
                capabilities into the AI process where they are required.
              </p>
            </div>
            <Figure src="/img/ai-docs.svg" alt="Abstract diagram of documents parsed into structured fields with a low-confidence row escalated" />
          </div>

          <div className="grid grid--2">
            {FOUNDATION.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
                {c.href && (
                  <p>
                    <Link className="link-arrow" href={c.href}>
                      {c.h} Services
                    </Link>
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="rich measure rv mt-3">
            <p>
              This connection between data, analytics, and AI is central to Cognovea&rsquo;s approach. The objective is
              to make AI part of a useful data and business workflow rather than treating it as a separate technology
              layer.
            </p>
          </div>
        </div>
      </section>

      {/* --- LLM development --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">LLM Integration</p>
            <h2 className="h-lg">LLM Development and Integration Services</h2>
          </div>

          <div className="feature feature--copy">
            <div className="rich rv rv--left">
              <p>
                Not every Generative AI project needs a completely new application. In many cases, the better approach is
                to add specific AI capabilities to software that already exists.
              </p>
              <p>Cognovea provides LLM development services and LLM application development for use cases such as:</p>
            </div>
            <Figure src="/img/ai-agent.svg" alt="Abstract multi-step agent workflow pausing at a human approval gate" />
          </div>

          <ul className="chips rv" style={{ marginTop: '1.5rem' }}>
            <li>Summarization</li>
            <li>Drafting</li>
            <li>Classification</li>
            <li>Intelligent Search</li>
            <li>Natural-Language Interfaces</li>
            <li>AI-Assisted Workflows</li>
          </ul>

          <div className="rich measure rv mt-3">
            <p>
              Our LLM integration services and generative AI integration capabilities can connect these features with
              existing applications, data, and workflows. This can allow teams to introduce useful AI features without
              rebuilding the wider product or business process.
            </p>
            <p>
              Where required, safeguards such as limiting the use of something, alternative options, and so forth may be
              introduced to ensure reliability of the system. Such actions prevent the problem from infecting other
              components of the system if any one of the models fails.
            </p>
            <p>
              Emphasis is kept on using LLMs in a useful manner, to enhance current processes, goods, or user
              experiences without adding extra complexity to the technology.
            </p>
          </div>
        </div>
      </section>

      {/* --- Delivery stages --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">How We Deliver</p>
            <h2 className="h-lg">From concept to creation: Here is how we bring generative AI to you</h2>
            <p className="lede">
              An AI project must have a clear path from first idea to functional system. Cognovea&rsquo;s approach moves
              through four practical stages.
            </p>
          </div>

          <div className="grid grid--4">
            {STAGES.map((s, i) => (
              <div className="step rv" key={s.h}>
                <span className="step__n">{`0${i + 1}`}</span>
                <h3 className="h-sm">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Why Cognovea --- */}
      <section className="band">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Why Cognovea</p>
            <h2 className="h-lg">Why Choose Cognovea for Generative AI Development?</h2>
          </div>

          <div className="grid grid--3">
            {WHY.map((c) => (
              <article className="card rv" key={c.h}>
                <h3 className="h-sm">{c.h}</h3>
                <p>{c.p}</p>
              </article>
            ))}
          </div>

          <div className="card card--flat rv mt-3 measure">
            <p>
              That is an important part of responsible generative AI consulting: knowing when to build, what to build,
              and what needs to be in place first.
            </p>
          </div>
        </div>
      </section>

      {/* --- Use cases --- */}
      <section className="band band--deep">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Use Cases</p>
            <h2 className="h-lg">Generative Use Cases for AI</h2>
            <p className="lede">
              Depending on the business systems in place, the data that is available, and the amount of automation that
              is needed, generative AI can help different teams and workflows.
            </p>
          </div>

          <div className="grid grid--4">
            {USE_CASES.map((c) => (
              <article className="card rv" key={c.col}>
                <p className="eyebrow">{c.col}</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.6rem', marginTop: '1rem' }}>
                  {c.items.map((i) => (
                    <li key={i} style={{ color: 'var(--fg-2)', fontSize: '14.5px' }}>
                      {i}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="card card--flat rv mt-3 measure">
            <h3 className="h-sm">Product &amp; Application AI</h3>
            <p>
              Add capabilities such as search, summarization, drafting, classification, and other LLM-powered features
              to existing software and internal applications. This can help introduce AI where users already work
              instead of creating a separate experience for every use case.
            </p>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">FAQ</p>
            <h2 className="h-lg">Here are some Frequently Asked Questions related to Generative AI Services</h2>
          </div>
          <div className="rv">
            <Faq items={FAQS} />
          </div>
        </div>
      </section>

      {/* Only shows a quote tagged for this service. A data engineering quote
          on a Generative AI page reads as filler, so no match means no section. */}
      <Testimonial service="generative-ai-services" />

      <CtaBand
        title="Ready to Harness the Potential of Generative AI?"
        body="Know how Generative AI could add value for you, what data is needed to enable this and how to get from concept to reality."
        primary={{ href: '/contact', label: 'Get Started With an AI Readiness Assessment' }}
        secondary={{ href: '/data-health-check', label: 'Book a Data Health Check' }}
      />
    </>
  );
}
