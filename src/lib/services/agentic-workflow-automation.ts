import type { Service } from './types';

/**
 * Transcribed from the supplied Agentic Workflow Automation document.
 *
 * Three things in that document are deliberately NOT here, and none of them is
 * an oversight:
 *
 *   1. The outcome figures — "up to an 85% reduction in cycle times", "thousands
 *      of manual hours saved each month", "near-zero error rates", "measurable
 *      ROI from day one". This site does not carry results it cannot evidence;
 *      see the Proof section on the home page, which describes the shape of a
 *      customer story rather than inventing one. Put them back when there is a
 *      case study behind them.
 *   2. The named compliance standards — SOC 2, GDPR, CCPA, HIPAA, Zero-Trust.
 *      types.ts: security certification goes through Piyush before it goes on a
 *      page. What is left is the architecture, which is true and checkable.
 *   3. The intellectual-property and lock-in promises. Same gate, same reason.
 *
 * The document also links to offerings that have no page yet — Paperwork on
 * Autopilot, Stop the Stockouts, Close the Books Faster, Answers From Your
 * Documents, the five pods, and the white paper. They are named here as plain
 * text rather than linked, because a link that 404s costs more than a link that
 * does not exist. When those pages ship, the names are already in place.
 */
export const agenticWorkflowAutomation: Service = {
  slug: 'agentic-workflow-automation',
  title: 'Agentic Workflow Automation Services | Cognovea',
  description:
    'Multi-agent systems that perceive context, reason through problems and execute tasks safely, with governance built in from day one rather than bolted on.',
  eyebrow: 'Agentic AI',
  h1: 'Agentic Workflow Automation: Build AI That Reasons and Executes',
  standfirst:
    'Traditional automation breaks when things change. Rigid scripts stall when a document format moves, crash when an API updates, and fail silently on the exception nobody wrote a rule for.',
  promise:
    'Multi-agent systems that handle your most complex operations: they perceive context, reason through problems, and execute tasks safely, with a human holding the decisions that matter.',
  image: {
    src: '/img/sv-agentic.svg',
    alt: 'A planner agent breaking work into tasks for worker agents, a reviewer checking the output, and a high-risk action pausing at a human approval gate',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'The problem',
      heading: 'Why legacy RPA is failing your enterprise',
      lede: 'Rigid, rules-based bots worked in the past. Today they slow you down.',
      body: [
        'Robotic Process Automation stalls when a document format changes. It crashes when an API updates. It fails silently when it encounters an unexpected exception. Your business is dynamic, and your automation should be dynamic too.',
        'Agentic workflow automation acts like a digital workforce rather than a macro. It does not blindly click buttons in a fixed sequence; it understands the business goal it has been given, and works out how to reach it when the path it expected is not there.',
        'Your processes change daily and fixed rules cannot keep up. That is the whole argument for replacing scripted automation with systems that can re-plan.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'The difference in production',
      heading: 'What changes when the automation can think',
      cols: 2,
      cards: [
        {
          title: 'Dynamic problem solving',
          body: 'If a step fails, the agent re-plans. It finds another way without waiting for human help, and treats an obstacle as something to solve rather than a reason to stop.',
        },
        {
          title: 'Unstructured data',
          body: 'RPA needs clean, structured input. Agents read complex emails, long contracts and messy PDFs, and take the context out of them the way a person would.',
        },
        {
          title: 'Context awareness',
          body: 'Agents remember what they have already done. They keep long, multi-step workflows on track across days or weeks instead of losing their place between runs.',
        },
        {
          title: 'Less time spent on repair',
          body: 'Fewer broken scripts to fix, and fewer manual resets for your IT team. The maintenance load that quietly consumes an automation programme largely goes away.',
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'Side by side',
      heading: 'Scripted workflows against agentic ones',
      caption: 'Comparison of legacy RPA and scripted workflows against agentic workflow automation',
      head: ['', 'Legacy RPA and scripted workflows', 'Agentic workflow automation'],
      markColumn: 2,
      rows: [
        ['Trigger mechanism', 'Pre-defined, fixed if/then rules', 'Intent-driven, goal-oriented execution'],
        ['Handling exceptions', 'Fails and requires a manual human fix', 'Re-plans dynamically to solve the obstacle'],
        ['Execution scope', 'Single tasks in predictable environments', 'Multi-step operations across hybrid systems'],
        ['Data reliance', 'Structured data, strictly formatted', 'Unstructured documents, chat inputs and APIs'],
        ['Architectural flow', 'Linear, fixed sequence of clicks', 'A loop of perceive, reason, act and reflect'],
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'Orchestration',
      heading: 'How the agents work together',
      lede: 'Simple tasks need one model. Complex operations need a coordinated team, each agent doing one thing well and checking the next.',
      steps: [
        {
          title: 'The planner agent',
          body: 'Reads the request and maps a step-by-step execution plan against the final goal, breaking a large problem into tasks small enough to be done and verified.',
        },
        {
          title: 'The worker agents',
          body: 'Execute the specific tasks: querying a database, writing code, generating a report. This is where the work actually happens.',
        },
        {
          title: 'The reviewer agent',
          body: 'Checks the output against your business rules for accuracy, tone and compliance before anything moves forward. An agent marking its own homework is how errors compound.',
        },
        {
          title: 'The human on the loop',
          body: 'High-risk actions stop and wait for your approval. People supervise and set direction; they are not the ones retyping values between systems.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'Control',
      heading: 'The agentic command center',
      lede: 'Running a group of agents is a different problem from running one.',
      body: [
        'We implement a central orchestration layer for the digital workforce. It sequences the work and manages the handoffs between agents, automated systems and the people involved, so that no step depends on somebody remembering to start it.',
        'The part that matters most to the people who have to sign this off is observability. You get a complete audit trail of every decision an agent made and why, so the question “why did it do that?” has an answer you can read rather than a guess you have to accept.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Governance as code',
      heading: 'Guardrails built in, not bolted on',
      lede: 'Permissions and approval logic are part of how the agent is built, not a policy document somebody is supposed to have read.',
      cols: 2,
      cards: [
        {
          title: 'Least-privilege access',
          body: 'Agents reach only the tools and data a given task requires, inside isolated sandboxes. An agent built to reconcile invoices cannot wander into the rest of your network.',
        },
        {
          title: 'Zero-copy architecture',
          body: 'Agents query your data where it already lives rather than copying it into a second store. One less copy to secure, and no drift between the copy and the source.',
        },
        {
          title: 'Policy engines',
          body: 'The rules travel with the agent, so the constraints apply at the point of action rather than depending on the workflow having been designed correctly.',
        },
        {
          title: 'Kill switches and rollback',
          body: 'If an agent deviates from its brief the system stops it, and the actions it took can be reversed. Deciding this after deployment is deciding it too late.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Where it is used',
      heading: 'Autonomous workflow agents in action',
      lede: 'Anywhere a team is bogged down in manual, multi-step work that crosses more than one system.',
      cols: 3,
      cards: [
        {
          title: 'Supply chain and manufacturing',
          body: 'An agent detects a material shortage in your ERP, checks alternative suppliers against live pricing and lead times, and drafts a purchase order for your procurement manager to approve in one click.',
        },
        {
          title: 'Finance and operations',
          body: 'Agents pull from billing systems and bank feeds at once, validate invoices against purchase orders, reconcile what matches and route genuine discrepancies to a person with the investigation already written up.',
        },
        {
          title: 'Customer support and triage',
          body: 'Agents read incoming tickets, check history in the CRM, classify urgency from context, resolve the simple cases outright and hand the complex ones to the right expert with a full brief attached.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'The stack',
      heading: 'Built on technology you already run',
      lede: 'Agentic systems are only as good as the data underneath them, which is the half of this work most providers skip.',
      body: [
        'Cloud and data platforms: Snowflake, Databricks, Microsoft Azure and Fabric, AWS, Google Cloud and BigQuery. Business intelligence: Power BI, Tableau and Looker. Enterprise integration through SAP Data Services and your own internal APIs.',
        'For orchestration we use the frameworks that suit the job rather than one house favourite. LangGraph gives tight, stateful control where a process has to be auditable step by step. CrewAI suits multi-agent collaboration with distinct roles. Microsoft Semantic Kernel is the pragmatic choice where the integration has to sit deep inside a Microsoft estate.',
        'None of this requires you to replace what you already have. The agents connect to the systems you run today through secure API connections, including the legacy ones.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'How we engage',
      heading: 'Fixed-scope outcomes, or a team that stays',
      lede: 'Two shapes, depending on whether you have a defined problem or an ongoing programme.',
      cols: 2,
      cards: [
        {
          title: 'Outcome-based projects',
          body: 'A specific problem solved at a fixed scope: a custom multi-agent system, document extraction and data entry put on autopilot, answers drawn out of a large internal knowledge base, a proof of concept run in a controlled environment, or an AI readiness assessment before any of it is built.',
        },
        {
          title: 'Continuous delivery pods',
          body: 'A dedicated team where the work is ongoing, sized to the job: maintaining early deployments, steady automation builds, larger infrastructure integration, a pod focused purely on building and tuning agents, or a combined pod that owns the data engineering and the agents built on top of it.',
        },
      ],
    },
  ],

  faq: [
    {
      q: 'What is the difference between agentic AI and traditional workflow automation?',
      a: 'Traditional automation is rule-based; agentic AI is goal-based and capable of independent reasoning. RPA relies on rigid if-this-then-that scripts that break the moment a document format changes or a system updates. An agentic workflow understands the objective instead. When it hits an unexpected error or a missing file it re-plans, selects a different tool, and works around the obstacle without someone having to go and fix the script first.',
    },
    {
      q: 'How do we maintain human control over autonomous agents?',
      a: 'Through a human-in-the-loop framework and hard operational guardrails written into the system before it goes live: explicit boundaries, budget limits and data access restrictions. For a high-stakes action — moving money, writing to a system of record, sending something to a client — the agent is not able to proceed by itself. It pauses, produces a summary of what it found and what it intends to do, and waits for a person to authorise it.',
    },
    {
      q: 'How do you stop an agent hallucinating or making a bad operational call?',
      a: 'By constraining where it is allowed to get information and making it check its own work. The agent draws facts only from your approved internal databases, verified manuals and business systems, not from general training data. On top of that there are self-correction loops: where the agent cannot find a confident, sourced answer inside your own data, it is built to stop and ask rather than produce something plausible.',
    },
    {
      q: 'Can agents handle unstructured data and messy documents?',
      a: 'That is one of the clearer advantages over scripted automation, which needs well-formed input to work at all. Agents read disorganised PDFs, long email threads, chat logs and contracts, and pull out specific clauses and figures with the surrounding context intact. This is what makes heavy document handling a realistic thing to automate rather than a perennial plan.',
    },
    {
      q: 'Will this integrate with our existing software and legacy systems?',
      a: 'Yes, and without ripping anything out. We set up secure API connections so agents can move data between modern cloud platforms and older systems. In practice that means ERP estates including SAP Data Services, cloud and data platforms such as Snowflake, Databricks, AWS and Microsoft Azure and Fabric, BI tools including Power BI, Tableau and Looker, and the everyday systems work actually happens in, such as your CRM and internal chat.',
    },
    {
      q: 'Is our data copied, or used to train public models?',
      a: 'Neither. The zero-copy architecture means agents query your data where it already lives rather than duplicating it into another store, and your data is not used to train public models. If your procurement or security team needs this in contractual language rather than architectural description, we will put it in the contract.',
    },
    {
      q: 'How long before an agentic deployment is doing useful work?',
      a: 'A targeted agent workflow is usually a matter of weeks rather than the multi-quarter timeline an enterprise software rollout implies, because the scope is one workflow rather than a platform. What governs the honest answer is the state of the data underneath and how many approvals the workflow has to cross, which is something the readiness assessment is designed to establish before anyone commits to a date.',
    },
  ],

  related: [
    {
      href: '/generative-ai-services',
      label: 'Generative AI Services',
      blurb: 'RAG, conversational BI and document automation. Where the agent needs to read and write language rather than orchestrate systems.',
    },
    {
      href: '/ai-strategy-consulting',
      label: 'AI Strategy & Consulting',
      blurb: 'Readiness, use-case discovery and governance. The assessment that decides whether an agentic build is the right first move at all.',
    },
    {
      href: '/data-engineering-services',
      label: 'Data Engineering Services',
      blurb: 'The pipelines and warehouses underneath. Agents fail on weak data far more often than on weak models.',
    },
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'Two weeks, a written findings report and a prioritised roadmap. The usual way this starts.',
    },
  ],
};
