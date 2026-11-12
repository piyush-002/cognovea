import type { Service } from './types';

/**
 * The data category root, transcribed from the supplied Data & Analytics
 * category landing page document. This is the data-first counterpart to the
 * AI services category page, and under the current positioning it is the
 * parent the capability pages hang off.
 *
 * The document carries editorial notes to whoever builds it — "the compact
 * matrix is intentional", "as specified in the approved mapping", "the locked
 * outline" — which are instructions about the page rather than copy for it.
 * They are not reproduced.
 *
 * Also not reproduced: "fixed pricing, defined timelines, and no lock in".
 * types.ts gates pricing and commercial terms through Piyush before they go on
 * a page. The ownership statement either side of it is kept, because that is a
 * description of what the client receives rather than a commercial term.
 *
 * Where a sentence in the source did not parse, it has been repaired rather
 * than reproduced broken. Nothing has been reworded for style, and no claim
 * has been added or strengthened.
 */
export const dataAnalyticsServices: Service = {
  slug: 'data-analytics-services',
  title: 'Data Analytics Services and Consulting | Cognovea',
  description:
    'Data analytics services across the full data to decision lifecycle: engineering, modernization, cloud platforms, data quality, BI, predictive analytics and decision intelligence.',
  eyebrow: 'Data & Analytics',
  h1: 'Data Analytics Services Built Around How Your Business Uses Data',
  standfirst:
    'Data sits at the heart of every enterprise process, but it never arrives in one complete package. Customers are captured in one system, finances in another, operations somewhere else, and the rest lives in spreadsheets and reports.',
  promise:
    'We bring those sources into an environment reliable enough to analyse, so information can be used for reporting, decisions and the AI work that comes later.',
  image: {
    src: '/img/sv-data-analytics.svg',
    alt: 'Source data passing through a reliable foundation into analytics, insights and the decisions those insights reach',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'The problem',
      heading: 'Having your data is not the same as being able to use it',
      lede: 'The difficulty is rarely access. It is knowing which copy to trust.',
      body: [
        'Once data accumulates across applications, databases, warehouses and operational environments, the harder question becomes what each piece is and where the trustworthy version lives.',
        'Revenue is the standard example. The number looks simple until different teams apply different definitions, different accounting treatments, or the data behind it has not refreshed at the same time. The number has not changed. The context around it has.',
        'Engagements start from different points depending on where an organisation already is. Some need engineering and modernization work before analytics can be relied on at all; others have a capable platform and need better reporting, deeper analysis or forecasting. The work is to make a useful connection between data, analytics, insight and decisions, without adding technology for its own sake.',
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'The chain',
      heading: 'From a source system to a decision',
      lede: 'Each stage is the condition for the one after it, which is why they are treated as one piece of work rather than five.',
      steps: [
        {
          title: 'Data',
          body: 'The information that is actually useful is identified in the system where it arises, taking account of its source, its structure and what it means there.',
        },
        {
          title: 'A reliable foundation',
          body: 'Pipelines, platforms, integration, quality practice and governance establish the conditions for that information to stay accessible and dependable.',
        },
        {
          title: 'Analytics',
          body: 'Business intelligence, reporting, customer analytics, predictive analytics and data science are applied according to the questions the organisation needs answered.',
        },
        {
          title: 'Insights',
          body: 'Patterns, changes and relationships become easier to read when the analytical findings are placed back in their business context.',
        },
        {
          title: 'Decisions',
          body: 'The value becomes visible when those findings reach the people and processes where planning, operations, customer activity and financial management actually happen.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Capabilities',
      heading: 'Nine capabilities across the lifecycle',
      lede: 'A dashboard cannot compensate for unreliable source data, and a well-designed platform does not by itself tell a business what to do with what it holds. Each stage has to give the next one something dependable to stand on.',
      cols: 3,
      cards: [
        {
          title: 'Data engineering',
          body: 'How information moves through an organisation has a direct bearing on how easily it can later be analysed. Pipelines, integrations and supporting architecture move data from source systems into analytical environments with less repetitive manual preparation.',
        },
        {
          title: 'Data modernization',
          body: 'Older databases, fragmented platforms and spreadsheet-shaped processes can serve a business for years while making new analytical requirements harder to accommodate. Modernization brings them into a more manageable state, accounting for existing dependencies.',
        },
        {
          title: 'Cloud data platforms',
          body: 'Moving data to the cloud is one part of building a useful cloud environment. Storage, processing, integration, governance, access and expected growth all have to be considered at design time, particularly when analytical workloads will expand.',
        },
        {
          title: 'Real-time data pipelines',
          body: 'Some decisions become irrelevant because the information arrived too late. Real-time pipelines matter where timeliness genuinely changes how a team can act, and are unnecessary where it does not.',
        },
        {
          title: 'Data quality and management',
          body: 'The credibility of analytics is settled before any analysis happens. Inconsistent definitions, gaps in record keeping, duplication and unclear ownership all shape how the output should be read.',
        },
        {
          title: 'BI and dashboards',
          body: 'A dashboard earns its place when the numbers on it mean something and are backed by data that holds. We work from the business metric, its supporting data and the way it will be used, rather than adding another visual layer.',
        },
        {
          title: 'Business and customer analytics',
          body: 'Performance, behaviour, engagement, demand and retention reveal more together than separately. The focus is on what the data is saying and why it matters to the business, rather than on the technique.',
        },
        {
          title: 'Predictive analytics and data science',
          body: 'Historical information supports forward-looking analysis when the data suits the question being asked. Statistical methods and predictive modelling identify patterns and estimate outcomes, giving teams another source of evidence under uncertainty.',
        },
        {
          title: 'Decision intelligence and reporting',
          body: 'Analysis carries more weight when it is tied to the decision that follows it. This connects performance data and analytical results to the business context, to clarify priorities and what should happen next.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'What it changes',
      heading: 'What data analytics services help you do',
      lede: 'The practical value shows up in how information changes the way people understand and run the business.',
      cols: 3,
      cards: [
        {
          title: 'Make data easier to reach',
          body: 'When the relevant information has been connected and organised, teams spend less time assembling a basic view of what is happening from several sources.',
        },
        {
          title: 'Improve reporting and visibility',
          body: 'Consistent reporting gives teams a common reference for the measures that matter, and dashboards make a change in performance noticeable without everyone working through the underlying data.',
        },
        {
          title: 'Find patterns across the business',
          body: 'Customer activity, financial performance and operational events reveal more when examined together, particularly where the relationship between them is what explains a change.',
        },
        {
          title: 'Support faster decisions',
          body: 'Timely analysis gives decision-makers more context when they are evaluating performance, investigating a change or deciding where attention should go.',
        },
        {
          title: 'Reduce manual data work',
          body: 'Where preparation, reporting or recurring analysis follows a predictable process, structure and automation reduce the repetitive load on analysts and business teams.',
        },
        {
          title: 'Prepare data for AI',
          body: 'Predictive and AI initiatives both depend on information that can be accessed, understood and used appropriately. A stronger data environment is the practical starting point for advanced use cases.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Choosing an approach',
      heading: 'How to find the right analytics approach',
      lede: 'The right approach cannot be chosen by looking at technology alone. One business has a capable cloud platform and inconsistent definitions; another has dependable reporting and no engineering foundation beneath it.',
      cols: 2,
      cards: [
        {
          title: 'What a proper assessment considers',
          body: 'Before any recommendation, these are the things that decide which combination of capabilities actually fits.',
          bullets: [
            'Where important information lives and how it moves between systems',
            'Which decisions need better information, and what the analysis should reveal',
            'The completeness, consistency and relevance of the data collected',
            'Which applications, databases, pipelines and reporting tools remain useful',
            'Whether the priority is visibility, investigation, customer analysis or forecasting',
            'Whether information is needed immediately, on a schedule, or historically',
            'How data volumes, users and workloads are expected to grow',
            'Whether the same environment may later support predictive models or AI',
          ],
        },
        {
          title: 'What a consultancy is actually for',
          body: 'Rather than starting from a preferred technology stack, the work is to assess how information currently moves through the organisation and determine what suits the business at its present stage. The role is not simply to recommend what could be built. It is to establish what should be built first, what can stay as it is, and how each change affects the environment that comes after it.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'The foundation',
      heading: 'A data foundation that can carry analytics and AI',
      lede: 'Analytics is governed by what sits beneath it.',
      body: [
        'If data has to be reconciled by hand before every report, if terminology differs between systems, or if access to critical information is inconsistent, those problems will surface in the analytics eventually.',
        'A dependable foundation brings several concerns together at once. Pipelines determine how information moves, architecture determines how it is stored and processed, governance establishes how it is managed, and the analytical models determine how it can be examined. Each affects what the next one can do.',
        'That becomes more important, not less, when AI is introduced. The application is the visible part, but the information behind it still has to be accessible and usable in the intended business context. Data may need integrating across systems, quality issues may need resolving, and business definitions may need agreeing before any of it can support an advanced workload.',
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'How we work',
      heading: 'From raw information to business decisions',
      steps: [
        {
          title: 'Understand',
          body: 'Establish what the business actually needs from its data. Existing systems, sources, users, reporting expectations and decision points are examined so the work has a purpose before anything changes.',
        },
        {
          title: 'Connect and prepare',
          body: 'Bring together and prepare the information the intended use requires. Depending on the environment that may mean new pipelines, integration, quality work, modernization, governance, or changes to how information is structured.',
        },
        {
          title: 'Analyze',
          body: 'The method follows the question. Reporting and BI suit visibility; customer analytics, predictive modelling or data science suit investigating a pattern or considering future outcomes.',
        },
        {
          title: 'Operationalize',
          body: 'A finding has limited value while it sits apart from the people expected to act on it. The output is connected to reporting environments, workflows and planning processes, and the wider environment is refined as requirements change.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Why us',
      heading: 'What to weigh when comparing providers',
      lede: 'It is easy to compare technology lists or report counts. The more useful question is whether a provider understands what happens between the original source and the decision that depends on it.',
      cols: 3,
      cards: [
        {
          title: 'Data before dashboards',
          body: 'A dashboard can only present what the underlying data allows. We settle the source information, the definitions and the business requirement before treating the reporting layer as finished.',
        },
        {
          title: 'Built around your business',
          body: 'The same analysis does not work everywhere. Existing systems, working practices, the problem at hand and the people using it all shape how the environment should be built.',
        },
        {
          title: 'Engineering and analytics together',
          body: 'Decisions about pipelines, integration, structure and quality determine what becomes possible later, which is why they are considered alongside the analytical layer rather than as separate projects.',
        },
        {
          title: 'Designed to grow',
          body: 'Requirements rarely stay fixed. New sources appear, reporting expands and workloads get heavier, so the architecture needs enough flexibility to absorb that without a rebuild.',
        },
        {
          title: 'Measured against business need',
          body: 'The number of dashboards delivered does not tell you whether analytics is working. Whether people understand the business more clearly and decide with better information does.',
        },
        {
          title: 'You keep what we build',
          body: 'Your data, your systems, your analytics, your documentation. The environment should remain understandable and usable by your own teams after the engagement ends.',
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'Across the business',
      heading: 'Where analytics is applied',
      lede: 'Different functions need different things from the same foundation, which is why it has to serve more than one of them without each team working from disconnected information.',
      caption: 'Analytics applications by business area',
      head: ['Business area', 'Analytics applications'],
      rows: [
        ['Sales and revenue', 'Performance tracking, forecasting, pipeline analysis'],
        ['Customer', 'Customer behaviour, segmentation, retention analysis'],
        ['Operations', 'Process performance, operational reporting, efficiency analysis'],
        ['Finance', 'Financial reporting, variance analysis, performance monitoring'],
        ['Marketing', 'Campaign analysis, attribution, customer insights'],
        ['Supply chain', 'Demand analysis, inventory visibility, operational monitoring'],
        ['Leadership', 'Executive dashboards, business performance, decision support'],
        ['Data and AI readiness', 'Preparing environments for predictive analytics and advanced use cases'],
      ],
    },
  ],

  faq: [
    {
      q: 'How do I choose the right data analytics company?',
      a: 'Look past the tools and examine how a provider approaches the wider lifecycle. They should be able to understand your existing environment, examine the quality and availability of the information involved, explain why a particular approach fits, and connect the analytical work to the decisions it is meant to support.',
    },
    {
      q: 'What should I look for in a data analytics services provider?',
      a: 'Coherent breadth rather than a long list of capabilities with little in common. A provider should be able to talk about engineering, quality, governance, reporting, analytics, your existing infrastructure, documentation and future needs in relation to your organisation specifically.',
    },
    {
      q: 'Can you work with our existing data and systems?',
      a: 'Yes, where those systems remain fit for their purpose. The sensible starting point is identifying what already works. Databases, applications, cloud services, pipelines and reports frequently stay exactly as they are, with the gaps closed through integration and analytics.',
    },
    {
      q: 'How do I choose the right analytics approach for our business?',
      a: 'Start from the decision or problem that needs better information, then work out what information that actually requires. Depending on the need, the right answer centres on BI, business analytics, customer analytics, predictive analytics, data engineering, or a combination.',
    },
    {
      q: 'Can you improve our analytics environment without replacing everything?',
      a: 'In most cases, yes. Improving the analytics environment does not mean discarding current technology. It is usually possible to establish what is worth keeping and introduce change around it.',
    },
    {
      q: 'How do data analytics services support AI initiatives?',
      a: 'AI depends on the data environment underneath it, particularly where an application needs access to business-specific information. Better integration, quality, access and management are what determine whether predictive analytics or generative AI is a realistic next step.',
    },
  ],

  related: [
    {
      href: '/data-engineering-services',
      label: 'Data Engineering Services',
      blurb: 'Pipelines, integration and architecture. The first capability on this page, in full.',
    },
    {
      href: '/data-modernization-services',
      label: 'Data Modernization Services',
      blurb: 'Moving off legacy platforms onto something that can carry the analytics.',
    },
    {
      href: '/data-quality-and-governance-services',
      label: 'Data Quality & Governance',
      blurb: 'Owners, rules and automatic checks. The credibility of everything above depends on this.',
    },
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'Two weeks and a written finding. The assessment described above, as a fixed engagement.',
    },
    {
      href: '/fractional-data-leadership',
      label: 'Fractional Data Leadership',
      blurb: 'When the gap is not engineering but somebody senior deciding what matters first.',
    },
  ],
};
