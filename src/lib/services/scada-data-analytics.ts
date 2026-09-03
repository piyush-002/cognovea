import type { Service } from './types';

export const scadaDataAnalytics: Service = {
  slug: 'scada-data-analytics',
  title: 'SCADA & Historian Data Analytics for Oil & Gas',
  description:
    'Get production, well and asset data out of SCADA and historians and into something the business can use. Analytics services for oil and gas operators.',
  eyebrow: 'Operational Data',
  h1: 'Getting Value Out of SCADA and Historian Data',
  standfirst:
    'The data is already being collected. It is sitting in a historian that engineering can query and nobody else can.',
  promise:
    'We move production and asset data out of the control layer and into a place where finance, planning and operations can all read the same numbers — without touching the control network.',
  image: {
    src: '/img/sv-scada.svg',
    alt: 'Field telemetry flowing from SCADA and a historian through a one-way boundary into a cloud warehouse and dashboards',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'The actual problem',
      heading: 'A historian is an excellent archive and a poor reporting system',
      lede: 'It was built to answer a different question than the one the business is now asking.',
      body: [
        'A process historian is very good at what it was designed for: capturing a large number of tags at high frequency, compressing them, and giving a control engineer a trend to look at. That design does not make it a reporting database, and the gap shows the moment someone outside operations wants a number from it.',
        'The symptoms are familiar. Production reporting is a spreadsheet somebody rebuilds every morning from a historian export. Finance and operations quote different volumes for the same period because one is reading the historian and the other is reading the accounting system. A question that spans wells, ERP and the maintenance system takes two days because it takes three people. And nobody can answer anything about last year without asking the one engineer who knows the tag naming convention.',
        'None of this is a failure of the historian. It is what happens when operational data stays where it was captured, and the reporting need grows past what that place was built to serve.',
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'How the work runs',
      heading: 'Out of the control layer, without touching the control layer',
      lede: 'The security question is the first one asked in every one of these engagements, so it is answered first here too.',
      steps: [
        {
          title: 'One-way egress, agreed with the OT team',
          body: 'Data leaves through a read-only path the OT and instrumentation team specifies and controls — commonly a historian replica, a data diode or a broker in the DMZ. Nothing we build writes back toward the control network, and the OT team keeps the ability to shut the path off without our involvement.',
        },
        {
          title: 'Tags become things a business recognises',
          body: 'A tag name is a control-system identifier, not a business concept. We map tags to wells, pads, units and assets, attach the units of measure explicitly, and record which tag is authoritative when two disagree. This mapping is the asset — it is what makes every later question answerable.',
        },
        {
          title: 'One place the numbers come from',
          body: 'Time-series lands in a cloud warehouse alongside production reporting, ERP and maintenance data, at a grain that supports both the daily operational view and the monthly financial one. Reports move onto it and the old ones get retired, because otherwise you now have three.',
        },
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'What it makes possible',
      heading: 'Questions that become answerable',
      lede: 'Each of these is a question operators already ask, and currently answer by hand or not at all.',
      cols: 2,
      cards: [
        {
          title: 'Production surveillance that is current',
          body: 'Well and pad performance against expectation, refreshed on a schedule rather than rebuilt each morning. The value is less in the dashboard than in everyone reading the same figure at the same time.',
        },
        {
          title: 'Deferment that is measured, not estimated',
          body: 'Lost production attributed to a cause and a duration rather than reconciled at month end from memory. This is usually the first number that changes a conversation, because the total is almost always larger than the estimate it replaces.',
        },
        {
          title: 'Rotating equipment behaviour over time',
          body: 'Vibration, temperature and pressure history against failure and intervention records. Long histories are worth far more than high frequency here, which is exactly what a historian already has.',
        },
        {
          title: 'Field data beside financial data',
          body: 'Volumes, costs and interventions in one place, at one grain. This is the join that makes cost per barrel answerable without a reconciliation meeting.',
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'Where things belong',
      heading: 'Historian or warehouse',
      lede: 'This is not a replacement. The two do different jobs, and the common mistake is asking one of them to do the other’s.',
      caption: 'Comparison of what a process historian and a cloud data warehouse are each suited to',
      head: ['', 'Process historian', 'Cloud data warehouse'],
      markColumn: 2,
      rows: [
        ['Built for', 'High-frequency capture and compression of many tags.', 'Joining across sources and answering business questions.'],
        ['Best at', 'Sub-second trends, control-room use, long retention of raw signal.', 'Aggregates, comparisons across assets, and history beside ERP data.'],
        ['Who queries it', 'Control and process engineers who know the tag names.', 'Anyone, using well, asset and period names they recognise.'],
        ['Joins to ERP and maintenance data', 'Awkward, and usually done by export.', 'The reason it exists.'],
        ['Should it be replaced', 'No. It stays the system of record for raw signal.', 'It is where the reporting moves to.'],
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'Being straight about it',
      heading: 'Where this does not work',
      body: [
        'If the tag naming has no convention at all and nobody remaining at the company knows what the tags mean, the mapping step becomes archaeology and takes considerably longer than the rest of the project. This is survivable and worth doing, but it should be scoped honestly rather than discovered.',
        'If the historian is only retaining a few months at full resolution, anything that depends on comparing behaviour to a failure two years ago is not available yet — and the first useful action is to change the retention policy and wait.',
        'And if the OT team has not agreed the egress path, nothing above starts. That is the correct order. An analytics project that routes around the people responsible for the control network is a project that gets stopped later, at greater cost, and rightly.',
      ],
    },
  ],

  faq: [
    {
      q: 'Does anything you build connect to our control network?',
      a: 'No. Data leaves through a read-only path that your OT team specifies and controls, and nothing we build writes back toward the control layer. Where a client has no existing egress path, the first piece of work is agreeing one with OT and security, before any analytics work is scoped.',
    },
    {
      q: 'We already have AVEVA PI. Are you proposing we replace it?',
      a: 'No. PI stays as the system of record for raw signal — it is very good at that and nothing here is. What we do is copy the tags that matter into a warehouse where they can sit beside ERP, maintenance and production reporting data and be queried by people who do not know tag names.',
    },
    {
      q: 'How many tags do you need?',
      a: 'Far fewer than most operators expect. A useful production surveillance and deferment picture typically comes from a small fraction of the available tags. Starting with every tag is the most common way these projects get slow and expensive without getting more useful.',
    },
    {
      q: 'Our tag naming is a mess. Is that a blocker?',
      a: 'It is the main variable in the timeline, not a blocker. The mapping from tag to asset has to be built and validated regardless; poor naming means it takes longer and needs more time from someone who knows the field. We would rather size that honestly at the start than discover it in week three.',
    },
    {
      q: 'Can this run at a single site first?',
      a: 'That is usually the right way to do it. One field or one facility, one clearly defined question, and a result the operations team agrees with before anything is extended. The mapping work done at the first site is most of what makes the second one fast.',
    },
    {
      q: 'What about sites with poor connectivity?',
      a: 'Remote and intermittently connected sites need the pipeline designed for gaps and late-arriving data rather than assumed to be online, which changes how the ingestion and the reconciliation work. It is a normal condition in this sector, not an exception, and it is better designed for at the start.',
    },
  ],

  related: [
    {
      href: '/oil-and-gas-data-analytics',
      label: 'Oil & Gas Data and AI Consulting',
      blurb: 'The wider picture: what data and AI work looks like across an upstream or midstream operator.',
    },
    {
      href: '/playbooks/oil-and-gas',
      label: 'Oil and Gas Playbook',
      blurb: 'Six use cases with the data each one needs, how you would know it worked, and where it fails.',
    },
    {
      href: '/data-engineering-services',
      label: 'Data Engineering Services',
      blurb: 'The pipelines, warehouse and governance underneath all of this.',
    },
  ],
};
