import type { Service } from './types';

/**
 * The category page. Transcribed from the supplied enterprise AI consulting
 * document, which is the hub the seven capability pages hang off: the keyword
 * map puts "enterprise AI consulting" at the root with the sub-categories
 * beneath it, so this page's job is to be the thing that ranks and the thing
 * that routes. Four of the seven capabilities have pages today; the other three
 * — RAG, natural-language BI, MLOps — are described here and linked when built.
 *
 * Deliberate departures from the document, each for a reason already written
 * down in this repository:
 *
 *   - "System uptime remains absolute" is not a claim anybody can make. It
 *     reads here as uptime being monitored and protected, which is what the
 *     service actually is.
 *   - "costs your team thousands of hours every single year" lost its number.
 *     This site does not publish figures it cannot evidence.
 *   - "deliver real, measurable business value from day one" lost "from day
 *     one" for the same reason.
 *   - Agents "negotiate prices with suppliers" became checking suppliers
 *     against live pricing, matching what the agentic page already claims. Two
 *     pages describing the same capability differently is how a buyer decides
 *     neither is true.
 *
 * The capability blocks are not numbered, though the document numbers them
 * 01-07. They are a catalogue, not a sequence: nothing about strategy has to
 * happen before MLOps for the list to make sense, and numbering a set that has
 * no order tells the reader something false. The `steps` shape stays for the
 * things that genuinely are ordered.
 */
export const enterpriseAiConsulting: Service = {
  slug: 'enterprise-ai-consulting',
  title: 'Enterprise AI Consulting Firm & Custom AI Solutions',
  description:
    'We provide enterprise AI development & integration services. Build custom artificial intelligence solutions for your corporate infrastructure with Cognovea.',
  eyebrow: 'Enterprise AI',
  h1: 'Enterprise AI Consulting & Custom Software Solutions',
  standfirst:
    'Most of what is being sold to business leaders right now is a chatbot in disguise. It demonstrates well, it does not create an advantage, and connecting your internal data to a public model is a security problem rather than a strategy.',
  promise:
    'Secure, custom-built infrastructure engineered around your private data and your revenue goals, rather than another experiment that breaks in a month.',
  image: {
    src: '/img/sv-enterprise-ai.svg',
    alt: 'Proprietary data passing through a secured architecture layer into the business systems that use it, with the boundary drawn explicitly',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'The methodology',
      heading: 'Escaping pilot purgatory',
      lede: 'The industry is stuck in a cycle of launches that never land.',
      body: [
        'Large organisations spend heavily on demonstrations built by generalist agencies, and find months later that their internal systems cannot support a live deployment. The money is gone and the capability never arrives.',
        'The model is rarely the problem. What is available today is extremely capable. The constraint is the foundation underneath it: a system that cannot reach clean, organised information makes poor decisions, the people who were asked to trust it stop doing so, and the budget has been spent proving something nobody believes any more.',
        'We take an engineering-first approach, which in practice means fixing the data foundation before a model is deployed rather than after. We build pipelines that connect raw data to the systems that consume it, and write software that respects your firewalls and fits the way the business already runs.',
        'The obstacles are consistent enough to name: older systems that struggle with real-time processing, scattered databases that stop any new software seeing the whole picture, and security practices that quietly put sensitive data at risk.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Capabilities',
      heading: 'Engineering and consulting, by what it is for',
      lede: 'Packaged software assumes every company works the same way. The engagements below are shaped to the stage you are actually at.',
      cols: 3,
      cards: [
        {
          title: 'AI strategy and readiness',
          body: 'Funding projects without a plan is a quick way through a budget. Before anything is built, our architects run a readiness and maturity assessment, and the output is a sequenced product strategy tied to revenue rather than to a technology roadmap.',
          bullets: [
            'The real condition of your data pipelines',
            'Security weaknesses in the current network',
            'Where the expensive operational bottlenecks are',
          ],
        },
        {
          title: 'Generative AI and custom LLM deployment',
          body: 'Putting corporate work through public models exposes the material you least want exposed. We build private alternatives that sit behind your own firewall and belong to you, adapted to the way your business actually writes and decides.',
          bullets: [
            'Your industry terminology and internal jargon',
            'Your brand voice, consistently',
            'Your internal compliance and legal rules',
          ],
        },
        {
          title: 'Intelligent workflow automation and agentic systems',
          body: 'Repetitive manual process drains budget and slows delivery. Beyond task execution we build agentic frameworks and the workflow builders around them, so software becomes a participant in the work rather than somewhere the work is recorded.',
          bullets: [
            'Reason through unexpected operational problems',
            'Plan multi-step sequences independently',
            'Act across applications without a person clicking through',
          ],
        },
        {
          title: 'Production RAG architecture and enterprise search',
          body: 'Finding an exact fact inside a large, messy corporate estate is its own tax, and keyword search stopped being adequate some time ago. Retrieval-augmented generation ties the model strictly to your verified documents, which is what stops it inventing an answer.',
          bullets: [
            'Ask specific questions in plain English',
            'Search across millions of pages, PDFs and records',
            'Get cited answers that show where each came from',
          ],
        },
        {
          title: 'Conversational AI and natural-language BI',
          body: 'The most valuable numbers in most businesses sit behind dashboards only the data team can read fluently. Natural-language BI puts the warehouse within reach of the people making the decision, at the moment they are making it.',
          bullets: [
            'Ask for margin by region last quarter, in those words',
            'Get the answer without queueing for the data team',
            'Decide inside the meeting rather than after it',
          ],
        },
        {
          title: 'Predictive analytics and machine learning',
          body: 'Generative tools summarise and draft. Classical machine learning is what gives you a view forward. We build bespoke predictive models on your own history, which is the only place a defensible forecast can come from.',
          bullets: [
            'Supply chain: anticipate demand and avoid stockouts',
            'Finance: detect spending anomalies before they compound',
            'Sales: see the behaviour that precedes a customer leaving',
          ],
        },
        {
          title: 'MLOps, LLMOps and orchestration',
          body: 'Launching is the first step, not the finish. Running these systems safely in production is continuous work, and it is the part most programmes discover they have not resourced. We operate the pipelines and the orchestration behind them.',
          bullets: [
            'Cloud spend stays visible and bounded',
            'Uptime is monitored and protected, not assumed',
            'Systems stay fast and secure as data volume grows',
          ],
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'The distinction buyers ask about first',
      heading: 'Generative AI against agentic AI',
      lede: 'It comes down to action rather than text, and it decides what you can realistically automate.',
      caption: 'Comparison of generative AI and agentic AI by function, autonomy and enterprise value',
      head: ['', 'Generative AI', 'Agentic AI'],
      markColumn: 2,
      rows: [
        ['Core function', 'Creates text, code or images from a prompt', 'Executes multi-step business workflows'],
        ['Autonomy', 'Low. Requires a human prompt each time', 'High. Plans and acts on its own'],
        ['Enterprise value', 'Drafting email, summarising documents', 'Managing inventory, routing approvals'],
      ],
    },
    {
      kind: 'table',
      eyebrow: 'The second distinction',
      heading: 'AI assistants against AI agents',
      lede: 'An assistant waits to be asked. An agent is given an objective and goes.',
      caption: 'Comparison of AI assistants and AI agents by behaviour, scope and human involvement',
      head: ['', 'AI assistant', 'AI agent'],
      markColumn: 2,
      rows: [
        ['Behaviour', 'Reactive. Waits for instructions', 'Proactive. Takes independent action'],
        ['Scope of work', 'Single isolated tasks, such as a calendar event', 'Complex workflows, such as vendor reordering'],
        ['Human involvement', 'Required at every step', 'Required at the high-level approvals'],
      ],
    },
    {
      kind: 'table',
      eyebrow: 'The upgrade question',
      heading: 'Automated intelligence against artificial intelligence',
      lede: 'If your current automation needs constant maintenance, this is the comparison that explains why.',
      caption: 'Comparison of rules-based automation and artificial intelligence by learning, flexibility and fit',
      head: ['', 'Automated intelligence', 'Artificial intelligence'],
      markColumn: 2,
      rows: [
        ['Learning', 'None. Follows hard-coded rules', 'Learns and adapts from new patterns'],
        ['Flexibility', 'Breaks on unexpected input', 'Handles messy and unfamiliar information'],
        ['Best suited to', 'Simple data entry and routing', 'Forecasting, reading intent, complex analysis'],
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'Where to start',
      heading: 'Stop guessing. Start with a structured assessment.',
      lede: 'You should not have to guess where this technology belongs in your business.',
      body: [
        'Decisions of this size should not be made from industry hype or an article somebody forwarded. Our technical leadership works directly with your executive team to audit the current estate: how the business communicates, where files actually live, what the data can and cannot currently answer.',
        'The assessment runs in weeks rather than quarters, and it produces three things: the use cases with real commercial upside, the security risks currently sitting unaddressed in the network, and a technical roadmap specific enough to build from.',
      ],
    },
  ],

  faq: [
    {
      q: 'What is the difference between generative AI and agentic AI for buyers?',
      a: 'It comes down to action versus text. Generative models produce static output: a drafted email, a summarised PDF. If the goal is to automate a function rather than assist a person, you need agentic systems. An agent has autonomy: it takes a high-level objective, breaks it into steps, works with your other software to gather what it needs, and carries out the action itself.',
    },
    {
      q: 'Why invest in AI agents rather than AI assistants?',
      a: 'An assistant is reactive. It waits for an explicit instruction to schedule the meeting or find the file, and it needs supervision at every step. An agent is proactive: it monitors inventory, checks suppliers against live pricing and drafts the purchase order, coming back to a person only for the approvals that carry real consequence. The practical difference is whether scaling the operation means adding headcount.',
    },
    {
      q: 'When should we upgrade from rules-based automation to AI?',
      a: 'When the automation you have keeps breaking. Rules-based automation runs on fixed if-X-then-Y logic, so it fails as soon as a form changes or a case falls outside what was anticipated. If your existing automations need continual IT attention to stay working, that maintenance is the signal. Systems that adapt to messy and unfamiliar data are what replace them.',
    },
    {
      q: 'Will our data be exposed to public AI models?',
      a: 'No. The private deployments we build sit behind your own firewall, and the retrieval architectures query your documents where they already are rather than copying them somewhere new. Where you need that stated contractually rather than architecturally, we will put it in the contract.',
    },
    {
      q: 'What makes a boutique firm a better fit than a large consultancy?',
      a: 'Scale cuts both ways. A large programme brings process weight that is appropriate to a multi-year transformation and expensive on anything smaller, and the people who ran the pitch are frequently not the people who do the work. Our engagements are sized to what is in front of you and staffed by the people who scoped them. Where a problem genuinely needs the heavier shape, we will say so.',
    },
    {
      q: 'How do you stop a project becoming another pilot that never ships?',
      a: 'By treating the data foundation as the first deliverable rather than an assumption. Most pilots that stall do so because the model worked in a controlled sample and the production estate could not supply the same quality at the same speed. We establish what the data can support in the assessment, before anyone commits to a launch date, which occasionally means the honest recommendation is to fix pipelines this quarter and build the model next.',
    },
  ],

  related: [
    {
      href: '/ai-strategy-consulting',
      label: 'AI Strategy & Consulting',
      blurb: 'Readiness, use-case discovery, roadmap and governance. The capability block above, in full.',
    },
    {
      href: '/generative-ai-services',
      label: 'Generative AI Services',
      blurb: 'RAG, conversational BI, agents and document automation, as a delivered engagement.',
    },
    {
      href: '/agentic-workflow-automation',
      label: 'Agentic Workflow Automation',
      blurb: 'Multi-agent systems that re-plan when a step fails, with a human holding the approvals.',
    },
    {
      href: '/data-engineering-services',
      label: 'Data Engineering Services',
      blurb: 'The foundation this page argues comes first: pipelines, warehouses and governance.',
    },
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'Two weeks, a written findings report and a prioritised roadmap. The structured assessment, bookable.',
    },
    {
      href: '/portfolio',
      label: 'Portfolio & Case Studies',
      blurb: 'What we have built. Smaller than the catalogue above, and real.',
    },
  ],
};
