import type { Service } from './types';

export const oracleFusionDataMigration: Service = {
  slug: 'oracle-fusion-data-migration-services',
  title: 'Oracle EBS to Fusion Data Migration Services | Cognovea',
  description:
    'Data migration and data readiness for Oracle EBS to Fusion Cloud ERP programmes: what loads through FBDI and HDL, what has to be fixed first, and what reconciles at go-live.',
  eyebrow: 'Oracle Data Services',
  h1: 'Oracle EBS to Oracle Fusion Cloud Data Migration',
  standfirst:
    'A Fusion re-implementation is not an upgrade. Nothing carries over on its own, and every object that lands has to be prepared, loaded and reconciled deliberately.',
  promise:
    'We own the data workstream on an EBS to Fusion programme: the conversion objects, the load cycles and the reconciliation that decides whether the business trusts the first close.',
  image: {
    src: '/img/sv-oracle-fusion.svg',
    alt: 'EBS conversion objects prepared, loaded through FBDI and HDL across repeated mock cycles, and reconciled against the legacy ledger',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'What is actually different',
      heading: 'Fusion is a re-implementation, not an upgrade',
      lede: 'That single fact is what most EBS programmes underestimate, and it is entirely a data problem.',
      body: [
        'Moving from E-Business Suite to Fusion Cloud ERP is not a technical upgrade of a system you already have. It is a new application with its own data model, and nothing arrives in it except what somebody explicitly converts, maps and loads. Fifteen or twenty years of EBS history has no automatic destination: the descriptive flexfields, the customisations somebody added in 2011, the org structures that grew rather than were designed.',
        'That shows up in a recognisable sequence. The programme is planned around configuration and testing. Conversion is treated as a workstream that runs alongside. Then the first mock load rejects a large share of the item master on validation rules nobody knew applied, supplier records fail because a tax attribute Fusion requires was optional in EBS, and the trial balance does not tie. Conversion stops being a workstream and becomes the critical path.',
        'The work below is specifically the data half. It runs whether or not we are involved in the configuration, and it is deliberately scoped so it can sit alongside whichever systems integrator is delivering the implementation.',
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'Conversion objects',
      heading: 'What has to be converted, object by object',
      lede: 'Roughly in the order they cause trouble on an EBS programme.',
      cols: 3,
      cards: [
        {
          title: 'Item master',
          body: 'The largest and least forgiving object in a manufacturing estate. Fusion enforces item class, UOM and category structures that EBS treated loosely, so a catalogue that worked for years fails validation in bulk. It also has to agree with the BOM and routing data that follows it.',
        },
        {
          title: 'Suppliers and customers',
          body: 'Fusion’s Trading Community Architecture models parties differently from EBS, so records built up over years of separate entry rarely map one to one. Tax registration, payment and banking attributes that were optional in EBS are frequently mandatory here.',
        },
        {
          title: 'GL balances and the chart of accounts',
          body: 'Usually a redesign, not a copy. A chart that accumulated segments and values gets restructured for Fusion, which means a mapping the finance team signs off on rather than a technical translation.',
        },
        {
          title: 'Open AP and AR',
          body: 'Open payables and receivables are what the business notices on day one. They are converted as open items and tied back to the legacy ledger explicitly, not assumed to have carried.',
        },
        {
          title: 'Fixed assets',
          body: 'Cost, accumulated depreciation and life have to arrive so that the first depreciation run in Fusion produces the number the old system would have. This is worth proving in a mock cycle rather than discovering at period end.',
        },
        {
          title: 'Sub-ledger history',
          body: 'The object where scope is decided rather than derived. How many years of transaction history actually belong in Fusion, versus staying reportable somewhere cheaper, is a decision better made early than defended late.',
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'Loading mechanics',
      heading: 'FBDI and HDL, and where each stops being the answer',
      lede: 'Oracle gives you two loaders. Knowing which one an object belongs to, and where neither is sufficient, saves a great deal of rework.',
      caption: 'Comparison of FBDI, HDL and a prepared data platform for Oracle Fusion conversion loads',
      head: ['', 'FBDI', 'HDL', 'Prepared upstream'],
      markColumn: 3,
      rows: [
        [
          'Used for',
          'Finance, supply chain and procurement objects.',
          'HCM objects, and anything modelled as person or workforce data.',
          'The transformation that happens before either loader sees a row.',
        ],
        [
          'Shape it expects',
          'A prescribed spreadsheet template per object, loaded and then imported.',
          'A zipped, delimited file in a defined hierarchy.',
          'Whatever the source is, mapped to that template deliberately.',
        ],
        [
          'What it will not do',
          'Decide which of three supplier records is the real one.',
          'Reconcile a total against the legacy ledger.',
          'Nothing. This is where those decisions are made and recorded.',
        ],
        [
          'Where it goes wrong',
          'Row-level rejects on validation nobody modelled in advance.',
          'Hierarchy errors that surface only at load time.',
          'Skipping it, and treating a loader template as a data strategy.',
        ],
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'How the work runs',
      heading: 'Mock cycles, and the reconciliation that follows each one',
      lede: 'The mechanism that turns a conversion from a hope into a schedule.',
      steps: [
        {
          title: 'Profile the EBS source, before mapping anything',
          body: 'Record counts, duplicates and completeness per conversion object, measured against what the Fusion template actually requires rather than against the EBS schema. The output is a scoped list of what will fail and roughly how much effort each fix is.',
        },
        {
          title: 'Repeated mock loads, each one measured',
          body: 'Every cycle reports rejects by object and by rule, and the reject rate has to fall between cycles. A programme that runs one mock load a fortnight before cutover has not tested the conversion, it has scheduled a surprise.',
        },
        {
          title: 'Reconciliation the finance team signs',
          body: 'Trial balance, open AP and AR, asset cost and accumulated depreciation tied back to the legacy ledger, in a document the controller is willing to put their name against. That signature, not a successful load, is what says the conversion worked.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'Being straight about it',
      heading: 'Where this gets harder than the plan assumes',
      body: [
        'Descriptive flexfields are the most common surprise. EBS let teams add attributes wherever they were needed, and in a long-lived estate those fields carry real business meaning that exists nowhere else. Each one needs a decision: modelled in Fusion, moved into a proper attribute, or retired. There are usually more of them than anyone expects.',
        'Multi-org and multi-ledger estates take considerably longer, and the reason is rarely technical. Where operating units were set up over years by different teams, the conversion forces a conversation about which structures survive, and that conversation involves people who were not in the project plan.',
        'And a chart of accounts redesign is a finance decision that a data team can support but must not make. Where we find a programme expecting us to derive the target chart, we say so: the mapping needs an owner in finance, and conversion cannot be scheduled honestly until it has one.',
      ],
    },
  ],

  faq: [
    {
      q: 'Do you replace our systems integrator?',
      a: 'No. The SI delivers the implementation: configuration, testing, cutover. We own the data workstream inside it: profiling, mapping, conversion builds, mock-load cycles and reconciliation. Where the SI has already scoped the conversion, we will say so rather than sell it twice.',
    },
    {
      q: 'How early should the data work start?',
      a: 'Before the implementation partner is selected, ideally. How much of the item master will fail Fusion validation, and how far the chart of accounts is from the target, is one of the larger unknowns in the proposals you are about to compare, and it is cheaper to answer once than to have several vendors price around it.',
    },
    {
      q: 'How much EBS history should we bring into Fusion?',
      a: 'Almost always less than the first answer. We profile how far back the transactions are actually read, rather than how far back they exist, and in most estates the reporting depends on considerably less than the default. What stays behind does not have to be lost. It stays reportable from an archive, which satisfies audit without carrying the volume into the new system.',
    },
    {
      q: 'Is this the same work as your SAP page?',
      a: 'The shape rubs off: profile, cleanse, load, reconcile. The substance does not transfer. Fusion validates on rules EBS never enforced, TCA models suppliers and customers differently, and FBDI and HDL behave nothing like the SAP Migration Cockpit. Somebody who has only done S/4HANA conversions will learn Fusion on your programme.',
    },
    {
      q: 'Can you help if the mock loads are already failing?',
      a: 'That is when most people call. The first step is the same either way: measure rejects by object and by rule, so the discussion moves from "conversion is behind" to a list with counts against it. Frequently the fix is upstream in the source data rather than in the load itself.',
    },
    {
      q: 'Do you work on Oracle Cloud infrastructure or database migrations too?',
      a: 'This page is about ERP data conversion, which is a different job from lifting EBS onto OCI or moving an Oracle database to a cloud warehouse. We do the latter as part of data engineering and modernization work; if that is what you need, those pages describe it better than this one.',
    },
  ],

  related: [
    {
      href: '/sap-data-migration-services',
      label: 'SAP Data Migration & S/4HANA Readiness',
      blurb: 'The same discipline on an SAP estate, for groups running both.',
    },
    {
      href: '/data-modernization-services',
      label: 'Data Modernization Services',
      blurb: 'Moving reporting off the legacy stack an ERP programme leaves behind.',
    },
    {
      href: '/manufacturing-data-analytics',
      label: 'Manufacturing Data and AI Consulting',
      blurb: 'What the item and BOM data supports once it is trustworthy.',
    },
  ],
};
