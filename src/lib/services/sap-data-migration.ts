import type { Service } from './types';

export const sapDataMigration: Service = {
  slug: 'sap-data-migration-services',
  title: 'SAP Data Migration & S/4HANA Data Readiness Services',
  description:
    'SAP data migration and S/4HANA data readiness for manufacturers and energy operators. Find out what your ECC data will support before you pick a migration partner.',
  eyebrow: 'SAP Data Services',
  h1: 'SAP Data Migration and S/4HANA Data Readiness',
  standfirst:
    'Most S/4HANA programmes are scoped on the assumption that the data will come across. The data is usually the reason they slip.',
  promise:
    'We assess what is actually in your ECC system before anyone commits to a cutover date, and we do the cleansing work that decides whether the migration lands on time.',
  image: {
    src: '/img/sv-sap-readiness.svg',
    alt: 'ECC records passing through profiling, cleansing and validation stages into an S/4HANA target',
  },

  sections: [
    {
      kind: 'prose',
      eyebrow: 'Why this comes first',
      heading: 'The data question arrives before the migration partner does',
      lede: 'By the time a systems integrator is selected, the scope is usually already wrong.',
      body: [
        'SAP has set mainstream maintenance for Business Suite 7 to end in 2027, with extended maintenance available beyond that at a premium. That deadline is what puts most manufacturers and energy operators into an S/4HANA conversation, and it is why so many of those conversations start at the wrong end, with a platform decision and a cutover date agreed before anybody has looked at what the master data will actually support.',
        'The pattern is consistent enough to predict. A programme is scoped assuming material, vendor and customer masters come across broadly as they are. Then someone profiles them properly, three months in, and finds duplicate material numbers across plants, units of measure that disagree between the master and the BOM, vendors that were created twice and paid under both, and a decade of Z-table extensions nobody documented. Cleansing was budgeted as a workstream and turns out to be the critical path.',
        'None of that is unusual, and none of it is a reason for alarm. It is a reason to look first. The work below is deliberately separable from the migration itself: you can have it done, and the findings in writing, without having chosen an implementation partner or committed to a date.',
      ],
    },
    {
      kind: 'steps',
      eyebrow: 'How a readiness assessment runs',
      heading: 'Three weeks, and a written answer',
      lede: 'The same shape as our Data Health Check, aimed specifically at an SAP estate.',
      steps: [
        {
          title: 'Read access, and a named person per module',
          body: 'We need read access to the ECC system and one person who can answer questions in each area that matters, typically MM, SD, FI and PP. Not their time in workshops. Just someone we can ask when the data says something the documentation does not.',
        },
        {
          title: 'We profile what is there, not what is documented',
          body: 'Record counts, duplicate rates, completeness by field, referential integrity between masters and transactions, unit-of-measure conflicts, and the custom fields and Z-tables that will have no home in the target. Measured against the objects your target release actually requires.',
        },
        {
          title: 'A written finding with the cleansing effort sized',
          body: 'What migrates as-is, what must be cleansed first, what should be archived rather than moved, and roughly what each of those costs in effort. Written so it can go to a steering committee without translation.',
        },
      ],
    },
    {
      kind: 'table',
      eyebrow: 'Migration approach',
      heading: 'What each route does to your data',
      lede: 'The approach is usually chosen on cost and downtime. It has consequences for data that are worth knowing before, rather than after.',
      caption: 'Comparison of brownfield, bluefield and greenfield S/4HANA approaches by their effect on data',
      head: ['', 'Brownfield conversion', 'Selective (bluefield)', 'Greenfield rebuild'],
      markColumn: 2,
      rows: [
        [
          'What moves',
          'The existing system converts in place, data and customisation included.',
          'Chosen company codes, objects and history move to a new system.',
          'A new system is configured; only master data and opening balances come across.',
        ],
        [
          'What it does to bad data',
          'Carries it forward. Existing duplicates and gaps arrive intact in S/4HANA.',
          'Filters it. What migrates is decided object by object.',
          'Leaves it behind, along with anything undocumented that was quietly load-bearing.',
        ],
        [
          'Cleansing effort',
          'Highest. Mandatory pre-conversion fixes, plus everything you chose not to fix.',
          'Moderate, and scoped to what you selected.',
          'Lowest on legacy data, highest on rebuilding master data correctly.',
        ],
        [
          'Where it usually goes wrong',
          'Custom code and Z-fields with no target equivalent.',
          'Deciding the cut-off, then discovering a report needs the history you left.',
          'Underestimating how much undocumented process lived in the old configuration.',
        ],
      ],
    },
    {
      kind: 'cards',
      eyebrow: 'The cleansing work',
      heading: 'What actually needs fixing',
      lede: 'In roughly the order it causes trouble.',
      cols: 3,
      cards: [
        {
          title: 'Material master',
          body: 'The usual worst offender in a manufacturing estate. Duplicates created plant by plant, descriptions that differ for the same part, missing classification, and units of measure that disagree with the BOM. Everything downstream of it inherits the problem.',
        },
        {
          title: 'Vendor and customer master',
          body: 'Duplicate business partners created over years by different teams, addresses that never got updated, and tax and banking fields with gaps that only surface at first payment run. S/4HANA moves these into the Business Partner model, which forces the question anyway.',
        },
        {
          title: 'Open items and balances',
          body: 'Open orders, open items and stock in transit are what the business notices on day one if they are wrong. These get reconciled to the legacy general ledger explicitly rather than assumed.',
        },
        {
          title: 'Historical transactions',
          body: 'Usually the biggest volume and the least examined. How many years actually need to be in the live system, versus reportable from an archive, is a decision worth making deliberately.',
        },
        {
          title: 'Custom fields and Z-tables',
          body: 'Extensions added over a decade, often undocumented and often still in use. Each needs a decision: rebuilt in the target, replaced by standard functionality, or retired.',
        },
        {
          title: 'BOMs, routings and recipes',
          body: 'For manufacturers this is where migration errors become production errors. They are validated against the material master rather than in isolation, because the common faults live in the relationship between the two.',
        },
      ],
    },
    {
      kind: 'prose',
      eyebrow: 'A decision worth making early',
      heading: 'How much history to bring',
      body: [
        'Almost every programme brings more history than it needs, because nobody wants to be the person who said no and then gets asked for a five-year comparison. The result is a slower migration, a larger target system, and a longer cutover window.',
        'It is a better conversation when it happens against numbers. We profile how far back the transactions actually get read, not how far back they exist, and what the reporting genuinely depends on. In most estates the answer is considerably less than the default, and the difference is measured in days of cutover.',
        'The rest does not have to be thrown away. History that stays reportable from an archive satisfies audit and satisfies the person who wanted the five-year comparison, without sitting in the live system.',
      ],
    },
  ],

  faq: [
    {
      q: 'Do we need to have chosen an implementation partner first?',
      a: 'No, and there is an argument for doing this before you choose one. The findings tell you what the cleansing effort actually is, which is one of the larger variables in the proposals you are about to compare. Several clients have used the written finding as an input to the tender rather than a consequence of it.',
    },
    {
      q: 'We already have a systems integrator. Does this overlap with them?',
      a: 'It sits beside them. Integrators are typically scoped and paid for the conversion, and data cleansing is either assumed to be the client’s job or priced as a change once the extent is known. We do the data work; they do the migration. Where they have already profiled the data, we will say so rather than repeat it.',
    },
    {
      q: 'How long does the readiness assessment take?',
      a: 'Two to three weeks for a single-instance estate, longer where there are multiple ECC systems or a recent acquisition still on separate infrastructure. The variable is how quickly read access and named contacts come through, not the analysis.',
    },
    {
      q: 'Can you do the cleansing as well, or only assess it?',
      a: 'Both. The assessment stands on its own and is deliberately sold that way, so that the finding is not a sales document for a larger engagement. If the cleansing work follows, it follows from a scope you have already seen in writing.',
    },
    {
      q: 'What if our data turns out to be in good shape?',
      a: 'Then the finding says so, and it is worth having. Knowing the master data will support the conversion removes the largest unpriced risk in the programme, and it is a considerably cheaper way to find out than discovering it during a mock cutover.',
    },
    {
      q: 'Do you work on the SAP Migration Cockpit, or your own tooling?',
      a: 'The Migration Cockpit where it fits, and it usually does for standard objects. Where an object is heavily extended or the source is not ECC alone, the transformation happens in the data platform before it reaches the cockpit, which is more transparent and far easier to re-run.',
    },
  ],

  related: [
    {
      href: '/data-modernization-services',
      label: 'Data Modernization Services',
      blurb: 'An S/4HANA programme is the most common reason a manufacturer finally moves off a legacy reporting stack.',
    },
    {
      href: '/manufacturing-data-analytics',
      label: 'Manufacturing Data and AI Consulting',
      blurb: 'What becomes possible once the master data is trustworthy and plant data sits beside it.',
    },
    {
      href: '/data-health-check',
      label: 'Data Health Check',
      blurb: 'The same written-finding approach, for an estate that is not only SAP.',
    },
  ],
};
