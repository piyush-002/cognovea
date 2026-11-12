import type { Service } from './types';

/**
 * Transcribed from the supplied Data Quality & Governance document, which is
 * the most completely specified page in the set: it names its own URL, its
 * metadata, eleven sections and a visual note for each.
 *
 * Two shapes from that document are mapped rather than reproduced literally.
 * The self-check is a six-item interactive checklist with a live counter; the
 * template has no stateful section, so it is rendered as the two labelled
 * groups the document itself falls back to ("falls back to a static list if
 * the interaction is not built"). The governance section is specified as
 * horizontal tabs with all content in the HTML for indexing; cards give the
 * same indexable markup without a second tab component on the page.
 *
 * The maturity levels and the delivery phases are the `steps` shape, because
 * both genuinely are ordered — level 2 follows level 1, and Establish cannot
 * precede Assess. Everything else that looks like a list is `cards`.
 */
export const dataQualityGovernance: Service = {
  slug: 'data-quality-and-governance-services',
  title: 'Data Quality & Data Governance Services | Cognovea',
  description:
    'Data quality and data governance consulting services that make your numbers trustworthy, starting with a two-week Data Health Check.',
  eyebrow: 'Data Quality & Governance',
  h1: 'Data Quality and Data Governance Services',
  standfirst:
    'Accurate data with clear owners and agreed rules, so the numbers your leadership sees are right the first time.',
  promise:
    'We start with the figures your teams argue about: fix the errors in the data, then put owners, rules and automatic checks in place so those errors do not come back.',
  image: {
    src: '/img/sv-data-quality.svg',
    alt: 'A single board-report figure resting on a quality layer of four checks and a governance layer showing an owner, a rule and lineage back to the source system',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'In short',
      heading: 'What are data quality and data governance services?',
      body: [
        'Data quality services find and fix errors in your data, then add automated checks that stop new errors arriving. Data governance services give each dataset an owner, agreed rules and controlled access, so it stays accurate and traceable over time.',
        'We deliver both together, because clean data without owners drifts back, and rules without clean data are ignored.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Self-check',
      heading: 'Six signs your data quality and governance need attention',
      lede: 'The first three point to quality gaps, and the last three point to governance gaps. If three or more sound familiar, a Data Health Check will show you where to start.',
      cols: 2,
      cards: [
        {
          title: 'Quality gaps',
          body: 'Errors are arriving faster than anyone is fixing them, and they are being found by the wrong people.',
          bullets: [
            'Two reports show different figures for the same metric',
            'Duplicate or incomplete records keep reappearing after every clean-up',
            'Errors are spotted by leadership in meetings rather than caught by checks',
          ],
        },
        {
          title: 'Governance gaps',
          body: 'The data may be broadly right, but nobody can say who is answerable for it or prove where it came from.',
          bullets: [
            'Nobody can say for certain who owns a key dataset',
            'Nobody can trace where a number in the board pack came from',
            'Auditors or customers ask for proof that takes weeks to assemble',
          ],
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Data quality',
      heading: 'Quality management that catches errors at the source',
      lede: 'We measure how accurate, complete, consistent and timely your critical data really is. Unlike one-off work that cleans a file and leaves, the checks are built into your platform so errors stay fixed.',
      cols: 2,
      cards: [
        {
          title: 'Assessment and profiling',
          body: 'A data quality assessment scores your critical datasets against accuracy, completeness, consistency and timeliness. You see exactly which fields fail, how often, and which reports depend on them. Those scores become the baseline every later improvement is measured against.',
        },
        {
          title: 'Cleansing and standardisation',
          body: 'We remove duplicates, fill gaps and correct format errors in the source systems themselves. Shared formats for names, codes and dates keep new records consistent from the day they are created, so reports stop needing manual correction downstream.',
        },
        {
          title: 'Quality engineering',
          body: 'Quality rules are written as automated tests that run inside your pipelines on every load. Bad records are stopped and flagged before they reach a dashboard or a board report, and each rule is written in plain terms so business owners can read and approve it.',
        },
        {
          title: 'Monitoring, alerts and root cause',
          body: 'Scorecards track quality over time, and a failing rule alerts the owner of that data directly. Each alert carries notes on the likely cause so the fix happens where the error started, and monthly trends show whether quality is improving across every critical dataset.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Data governance',
      heading: 'Governance that gives every dataset an owner',
      lede: 'Our governance consultants work with the people who create and use your data, not around them. Each area can be delivered on its own or combined with the quality work into one programme.',
      cols: 3,
      cards: [
        {
          title: 'Strategy and roadmap',
          body: 'We start with an assessment of your critical data and the decisions that depend on it, and produce a strategy that names priorities, owners and the order of work.',
          bullets: [
            'Findings ranked by business impact',
            'A roadmap agreed with business leaders',
            'Success measures for each phase',
          ],
        },
        {
          title: 'The governance framework',
          body: 'The framework sets out who decides what, which standards apply and how exceptions are handled. Every policy is written in plain language for the people who have to follow it.',
          bullets: [
            'Decision rights and escalation paths',
            'Data standards and naming rules',
            'A short, usable policy set',
          ],
        },
        {
          title: 'Ownership and stewardship',
          body: 'Every critical dataset gets a named owner who answers for it and a steward who keeps it accurate day to day. Roles are agreed with each team, so they hold after we leave.',
          bullets: [
            'An ownership register for critical data',
            'Steward roles with clear weekly tasks',
            'A governance council that meets monthly',
          ],
        },
        {
          title: 'Catalog and lineage',
          body: 'A searchable catalog and business glossary on your existing platform help anyone find the right dataset and what it means. Lineage traces every figure from source system to final report.',
          bullets: [
            'A glossary of agreed definitions',
            'A catalog of critical datasets and owners',
            'Lineage maps for key reports',
          ],
        },
        {
          title: 'Access control and audit',
          body: 'We classify sensitive data, set role-based access and apply retention rules, with every access request and change logged for audit.',
          bullets: [
            'Classification of sensitive fields',
            'Role-based access and retention rules',
            'Audit records ready for review',
          ],
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'The approach',
      heading: 'Quality and governance that run inside your platform',
      lede: 'Programmes stall when quality checks are manual and governance rules live in documents. We put owners, rules and checks inside the systems your teams already use, so both happen as part of normal work.',
      caption: 'Comparison of governance on paper against governance implemented in the data platform',
      head: ['', 'On paper', 'In the platform'],
      markColumn: 2,
      rows: [
        ['Quality checks', 'Run by hand before a big meeting', 'Run automatically on every data load'],
        ['Error fixes', 'Made in the report, again and again', 'Made once, in the source system'],
        ['Rules', 'Policies stored in a shared folder', 'Rules enforced in pipelines'],
        ['Owners', 'Names listed in a spreadsheet', 'Owners alerted when their data fails'],
        ['Access', 'Granted by email on request', 'Granted by role, and logged'],
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'Maturity',
      heading: 'Where does your data sit today?',
      lede: 'Each level describes both the quality of your data and how well it is governed. Starting at level one or two is entirely normal.',
      steps: [
        {
          title: 'Ad hoc',
          body: 'Errors are fixed only after someone spots a wrong number, and nobody is clearly responsible for the data.',
        },
        {
          title: 'Defined',
          body: 'Owners and quality rules exist on paper, but nothing checks that anyone follows them.',
        },
        {
          title: 'Managed',
          body: 'Quality checks, lineage and access rules run in the platform and alert owners automatically.',
        },
        {
          title: 'Embedded',
          body: 'Governance is built into how every new dataset is designed, tested and released.',
        },
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'Delivery',
      heading: 'Implementation in three phases',
      lede: 'We start with the data that matters most rather than trying to fix everything at once. Each phase delivers something your teams can use before the next begins.',
      steps: [
        {
          title: 'Assess',
          body: 'A two-week Data Health Check scores the quality of your critical data and shows where ownership and rules are missing. You receive written findings and a sequenced roadmap.',
        },
        {
          title: 'Establish',
          body: 'We clean the critical data, assign owners, agree the framework and switch on the first quality rules and access controls. The outcome is clean, governed data for your most important reports.',
        },
        {
          title: 'Embed',
          body: 'We extend monitoring, the catalog and lineage to more datasets, train your teams and hand over every rule and document. Some teams then keep us on monthly so new datasets and rule changes stay covered.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'What is different',
      heading: 'Four things that set this apart',
      lede: 'Choosing a governance partner should not mean a year of workshops before anything changes.',
      cols: 2,
      cards: [
        {
          title: 'Two weeks to a clear answer',
          body: 'Every engagement starts with a fixed two-week Data Health Check, so you see real findings before committing to a larger programme.',
        },
        {
          title: 'Strategy and build from one team',
          body: 'The people who design your rules also build them into your pipelines and warehouse, so nothing is lost between a plan and its delivery.',
        },
        {
          title: 'Rules that run in your platform',
          body: 'Quality checks and governance controls run automatically on every data load, rather than living in documents teams forget about.',
        },
        {
          title: 'You keep everything we build',
          body: 'Quality rules, scorecards, the framework, the glossary, the access model and the runbook all stay yours, with training so your team can run them.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'Platforms',
      heading: 'We work on what you already run',
      body: [
        'Microsoft Azure, Snowflake, Databricks, AWS and Google Cloud, with data from SAP and your other business systems. We recommend a new tool only when your current setup genuinely cannot support a requirement.',
      ],
    },
  ],

  faq: [
    {
      q: 'How do you implement data governance?',
      a: 'We start small, on the few datasets that drive key decisions. We assign owners, agree simple rules and build automatic checks into your platform, then widen the scope once those first datasets are reliably governed.',
    },
    {
      q: 'How do you measure and improve data quality?',
      a: 'We score each critical dataset for accuracy, completeness, consistency and timeliness using automated rules. Failing records are fixed in the source system, and the same rules keep running, so quality is tracked over time rather than sampled once.',
    },
    {
      q: 'How long does it take to see results?',
      a: 'The Data Health Check delivers findings within two weeks. Cleaner data, named owners and the first quality rules then go live on your most critical datasets, well before the whole programme is complete.',
    },
    {
      q: 'Can you work with our existing data platforms and tools?',
      a: 'Yes. We work on Azure, Snowflake, Databricks, AWS and Google Cloud, with data from SAP and other business systems. We recommend a new tool only when your current setup genuinely cannot support a requirement.',
    },
    {
      q: 'Will governance slow down our business processes?',
      a: 'Not when it is built properly into the platform. Most rules and quality checks run automatically inside your pipelines, so people see fewer corrections rather than extra approval steps or forms.',
    },
    {
      q: 'Do we need this if we have no internal data team?',
      a: 'Yes, and it often matters more without one. We set up quality checks and governance that business teams can run with light effort, and we can stay on for monitoring and changes.',
    },
    {
      q: 'What is the difference between data quality and data governance?',
      a: 'Data quality describes how accurate, complete and consistent your data is. Data governance sets the owners, rules and standards that keep it that way. Each one depends on the other, which is why we deliver them together.',
    },
    {
      q: 'What do we get from doing both together?',
      a: 'Teams trust the figures they report, and audit requests are answered from records you already hold. Sensitive data is better protected, and your data is ready for analytics and AI without a separate clean-up first.',
    },
  ],

  related: [
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'Two weeks, written findings and a prioritised roadmap. Phase one of this page, bookable on its own.',
    },
    {
      href: '/data-engineering-services',
      label: 'Data Engineering Services',
      blurb: 'The pipelines and warehouses the quality rules run inside.',
    },
    {
      href: '/data-modernization-services',
      label: 'Data Modernization Services',
      blurb: 'When the platform underneath cannot support the checks, this is the work that comes first.',
    },
    {
      href: '/fractional-data-leadership',
      label: 'Fractional Data Leadership',
      blurb: 'Governance needs a decision-maker. Where there is no senior owner, this is how one arrives.',
    },
  ],
};
