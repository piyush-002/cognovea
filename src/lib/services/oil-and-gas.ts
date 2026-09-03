import type { Service } from './types';

export const oilAndGasAnalytics: Service = {
  slug: 'oil-and-gas-data-analytics',
  title: 'Oil & Gas Data Analytics Consulting | Cognovea',
  description:
    'Data and AI consulting for oil and gas operators: production surveillance, asset monitoring, deferment analysis and reporting that operations and finance both trust.',
  eyebrow: 'Oil & Gas',
  h1: 'Data and AI Consulting for Oil and Gas Operators',
  standfirst:
    'Upstream and midstream operators are not short of data. They are short of one place where production, maintenance and financial numbers agree.',
  promise:
    'We work on the reporting and analytics layer above your control systems — production surveillance, deferment, asset behaviour and the numbers that go to the board — without going anywhere near the control network.',
  image: {
    src: '/img/sv-oilgas.svg',
    alt: 'Well telemetry, maintenance records and production reporting converging into one set of agreed figures',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'Where we come in',
      heading: 'The gap is between the field and the boardroom',
      lede: 'Not in the instrumentation, and not in the accounting system. In the distance between them.',
      body: [
        'The field is well instrumented. Telemetry arrives, the historian stores it, and control engineers can see what they need. The finance system is equally solid at what it does. What tends not to exist is anything that joins the two, which is why production volumes quoted in an operations meeting and volumes quoted in a finance meeting are so often different numbers describing the same month.',
        'That gap has a cost that rarely appears as a line item. Deferment gets estimated at month end rather than measured as it happens. Intervention decisions get made on the most recent number somebody trusts rather than the most recent number. A question spanning wells, work orders and cost takes days because it takes three people and a spreadsheet.',
        'This is data work rather than engineering work, and it is deliberately scoped that way. We are not proposing to touch control systems, replace a historian, or advise on reservoir engineering. We build the layer where operational and financial data meet, and make it something more than one team can read.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Published use cases',
      heading: 'Six places this usually starts',
      lede: 'Each of these is documented in full in our oil and gas playbook, including the data it needs and where it fails.',
      cols: 3,
      cards: [
        {
          title: 'Rotating equipment monitoring',
          body: 'Pump and compressor behaviour tracked against its own history and against intervention records, so a change in condition is visible before it becomes a failure.',
        },
        {
          title: 'Corrosion and asset integrity data',
          body: 'Inspection results, operating conditions and history in one place, so integrity decisions are made against the full record rather than the last report.',
        },
        {
          title: 'Production optimisation',
          body: 'Well and pad performance against expectation, with deferment attributed to cause rather than reconciled from memory at month end.',
        },
        {
          title: 'Flaring and emissions reporting',
          body: 'Measured rather than estimated, on the cadence regulators and increasingly lenders ask for, from the same numbers operations already uses.',
        },
        {
          title: 'Drilling data analysis',
          body: 'Performance across wells and crews compared on a like-for-like basis, which requires the data to be normalised before it requires any modelling.',
        },
        {
          title: 'Critical spares',
          body: 'What is genuinely critical, based on failure history and lead time rather than on the categories somebody set when the system was configured.',
        },
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'How engagements start',
      heading: 'Small, verifiable, then extended',
      lede: 'We have never seen a good outcome from an operator that started with a platform programme.',
      steps: [
        {
          title: 'A Health Check on the data that matters',
          body: 'Two weeks against the systems in scope, ending in a written finding: what your data will support today, what it will not, and what to fix first. It is priced and delivered as a standalone piece, so it is not a sales document.',
        },
        {
          title: 'One dashboard the operations team agrees with',
          body: 'Usually production surveillance or deferment. The measure of success is not that it exists, it is that the operations team stops maintaining the spreadsheet it replaces.',
        },
        {
          title: 'Then one analytical use case',
          body: 'Anomaly detection on rotating equipment, most often. Tested against history before anyone acts on it, because a model that has not been tested on the past is an opinion.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'Worth saying in advance',
      heading: 'Your OT and security teams will scrutinise this, and they should',
      body: [
        'Oil and gas applies the highest scrutiny of any sector we work in to anything that touches operational systems, and that scrutiny is appropriate. We plan for it rather than around it: the OT and instrumentation team specifies the egress path, controls it, and can shut it off without involving us. Nothing we build writes back toward the control network.',
        'The practical consequence is that discovery takes longer here than it does in manufacturing, and we build that into the schedule rather than discovering it. An engagement that assumes a two-week security conversation and gets a two-month one has not been badly run — it has been badly scoped.',
        'The corollary is that the OT team is usually the most valuable ally in the project. They know which tags are trustworthy, which sensors have been reading wrong for a year, and which historical periods should be discounted. That knowledge is not written down anywhere and it changes what the analysis is worth.',
      ],
    },
  ],

  faq: [
    {
      q: 'Do you work with upstream, midstream or both?',
      a: 'Both, though the work looks different. Upstream engagements tend to centre on production surveillance, deferment and well performance; midstream on throughput, measurement reconciliation and asset integrity. The underlying data problem — operational and financial figures that do not agree — is the same in each.',
    },
    {
      q: 'Are you asking to connect to our SCADA system?',
      a: 'Not directly. Data leaves through a read-only path your OT team specifies and controls, most often a historian replica or a broker in the DMZ. Our SCADA and historian analytics page covers the mechanics in detail.',
    },
    {
      q: 'We have tried an analytics project before and it did not land. Why would this differ?',
      a: 'The most common reason those fail is that they started with a platform rather than a question, and the second most common is that the result was never reconciled against what operations already believed. We start with one question, and we treat disagreement between our number and the operations team’s number as the finding rather than as noise.',
    },
    {
      q: 'Do you provide reservoir or petroleum engineering advice?',
      a: 'No, and we would be wary of a data consultancy that said yes. We work on the data and analytics layer. Where an engagement needs domain judgement about the subsurface, that comes from your engineers or your existing specialists, and our job is to make sure they are looking at the right numbers.',
    },
    {
      q: 'How much of our history do you need?',
      a: 'For reporting and surveillance, months. For anything that learns from failures — rotating equipment especially — you need enough history to contain a reasonable number of failures, which is usually a few years. If the historian is only retaining a few months at full resolution, that is worth fixing now so the option exists later.',
    },
  ],

  related: [
    {
      href: '/scada-data-analytics',
      label: 'SCADA & Historian Data Analytics',
      blurb: 'The mechanics of getting operational data out of the control layer, safely.',
    },
    {
      href: '/playbooks/oil-and-gas',
      label: 'Oil and Gas Playbook',
      blurb: 'The six use cases in full, with the data each needs and where each one fails.',
    },
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'Two weeks, a written finding, and no obligation to do anything with it.',
    },
  ],
};
