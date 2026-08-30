/**
 * Every external claim these playbooks make, with where it came from.
 *
 * Modelled on src/lib/calculator/assumptions.ts and for the same reason: the
 * asset only works if somebody senior can check it. A playbook full of
 * confident percentages with no attribution is indistinguishable from the
 * hundred others already ranking for these terms, and it is worth nothing the
 * moment a reader tries to verify one figure and cannot.
 *
 * `standing` is the part that matters and the part nobody else publishes.
 * Most widely-quoted manufacturing figures come from vendors selling the
 * remedy, surveyed at sample sizes that would not pass a first-year statistics
 * course. That does not make them useless — often they are the only figures
 * that exist — but a reader deserves to know which kind they are looking at
 * before they put one in a board paper.
 */

export type Standing =
  /** Peer-reviewed, or a systematic review of peer-reviewed work. */
  | 'peer-reviewed'
  /** Published by a government statistical office or standards body. */
  | 'official'
  /** Published research from a company that sells a remedy for what it measures. */
  | 'vendor-research'
  /** Ours: an assumption we chose, stated so it can be argued with. */
  | 'editorial';

export type Source = {
  id: string;
  label: string;
  url: string;
  year: number;
  publisher: string;
  standing: Standing;
  /** How the finding was arrived at. Written so a reader can judge its weight. */
  method: string;
  /** What it does not support, where that is easy to get wrong. */
  caveat?: string;
};

export const SOURCES: Record<string, Source> = {
  senseyeDowntime: {
    id: 'senseyeDowntime',
    label: 'The True Cost of Downtime 2024',
    url: 'https://assets.new.siemens.com/siemens/assets/api/uuid:1b43afb5-2d07-47f7-9eb7-893fe7d0bc59/TCOD-2024_original.pdf',
    year: 2024,
    publisher: 'Senseye (Siemens)',
    standing: 'vendor-research',
    method:
      '181 online interviews with maintenance, engineering and IT staff at large industrial organisations, gathered between April 2019 and March 2023, across automotive, FMCG, heavy industry and oil & gas, combined with data from live deployments of the publisher’s own software.',
    caveat:
      'The headline $1.4 trillion is an extrapolation to the Fortune Global 500 from public information, not a survey result. The report itself states the sector mix varied between years and that the combined figures are "indicative only" and not comparable year on year. The publisher sells predictive maintenance software.',
  },

  mdpiPdmReview: {
    id: 'mdpiPdmReview',
    label: 'Application-Wise Review of Machine Learning-Based Predictive Maintenance',
    url: 'https://www.mdpi.com/2076-3417/15/9/4898',
    year: 2025,
    publisher: 'Applied Sciences (MDPI)',
    standing: 'peer-reviewed',
    method:
      'Structured review of 60 published predictive-maintenance studies, classifying each by how far it actually got: live deployment, retrospective validation on plant data, or benchmark and simulation only.',
    caveat:
      'A review of published work, so it inherits publication bias — approaches that failed are less likely to have been written up at all.',
  },

  speOffshorePdm: {
    id: 'speOffshorePdm',
    label: 'Framework for AI- and ML-Based Predictive Maintenance for Offshore Rotating Equipment',
    url: 'https://jpt.spe.org/framework-for-ai-and-ml-based-predictive-maintenance-for-offshore-rotating-equipment',
    year: 2024,
    publisher: 'Journal of Petroleum Technology (SPE)',
    standing: 'peer-reviewed',
    method:
      'A 24-month deployment across Murphy Oil’s deepwater Gulf of Mexico platforms, covering production-critical rotating equipment — power-generation turbines, export gas compressors, glycol systems — using live sensor data, offshore and onshore historians, and CMMS work-order records. 46 models were put into production.',
    caveat:
      'An account of one operator’s programme, not a controlled comparison. It reports that false positives fell after retraining but publishes no accuracy figures, so it supports claims about what the work involves rather than about how well the models perform.',
  },

  mdpiForecastReview: {
    id: 'mdpiForecastReview',
    label: 'Machine Learning and Deep Learning Models for Demand Forecasting in Supply Chain Management: A Critical Review',
    url: 'https://www.mdpi.com/2571-5577/7/5/93',
    year: 2024,
    publisher: 'Applied System Innovation (MDPI)',
    standing: 'peer-reviewed',
    method:
      'Review of 119 papers published between 2015 and 2024, comparing machine-learning and deep-learning forecasting approaches against classical statistical baselines and recording the error reductions each reported.',
    caveat:
      'The improvements it collects are those the original authors reported on their own datasets, which are not directly comparable with each other and are not a promise about any particular business. Nearly three quarters of the papers were published in the last four years of the window, so the field is young.',
  },

  powellSpreadsheetErrors: {
    id: 'powellSpreadsheetErrors',
    label: 'Errors in Operational Spreadsheets',
    url: 'https://www.researchgate.net/publication/220385510_Errors_in_Operational_Spreadsheets',
    year: 2009,
    publisher: 'Journal of Organizational and End User Computing 21(3)',
    standing: 'peer-reviewed',
    method:
      'Audit of 50 operational spreadsheets in real use at 25 organisations, covering 270,722 formula cells, by trained auditors following a documented protocol.',
    caveat:
      'Counts errors an auditor could find and confirm. It says nothing about errors nobody catches, which are the expensive ones.',
  },
};

/** The figures themselves, each tied to the source that supports it. */
export type Finding = {
  /** The claim, written so it can be quoted without distortion. */
  claim: string;
  source: Source;
};

export const FINDINGS = {
  downtimeCostGlobal500: {
    claim:
      'Unplanned downtime is estimated to cost the world’s 500 largest companies around $1.4 trillion a year, about 11% of revenue.',
    source: SOURCES.senseyeDowntime,
  },
  downtimeCostAutomotive: {
    claim: 'Automotive respondents reported unplanned downtime costing about $2.3 million an hour.',
    source: SOURCES.senseyeDowntime,
  },
  deploymentGap: {
    claim:
      'Of 60 published machine-learning predictive-maintenance studies, 40 reached live deployment, 4 were validated retrospectively on plant data, and 16 were tested only on benchmarks or simulations.',
    source: SOURCES.mdpiPdmReview,
  },
  accuracyReporting: {
    claim:
      'Many studies report accuracy above 95% without disclosing the ratio of faulty to healthy examples, so the figure can reflect a model that has learned to predict "no fault" on data where faults are rare.',
    source: SOURCES.mdpiPdmReview,
  },
  labelledDataBarrier: {
    claim:
      'The barrier repeatedly identified is not modelling but data: labelled failure examples are expensive and slow to obtain, and industrial datasets are heterogeneous and heavily imbalanced.',
    source: SOURCES.mdpiPdmReview,
  },
  offshoreDataFirst: {
    claim:
      'On a 24-month offshore predictive-maintenance programme, the first model went live six months after kickoff, and the stated reason was a lack of the required data rather than anything to do with modelling.',
    source: SOURCES.speOffshorePdm,
  },
  offshoreCmmsGaps: {
    claim:
      'The same programme found its maintenance records incomplete: not all maintenance had been raised through the work-order system, so the history the models needed was partly missing.',
    source: SOURCES.speOffshorePdm,
  },
  forecastGains: {
    claim:
      'Across 119 reviewed studies, machine-learning forecasters reported error reductions of roughly 15–20% against ARIMA, with hybrid models reporting further gains — improvements measured on the authors’ own datasets rather than on yours.',
    source: SOURCES.mdpiForecastReview,
  },
  forecastDataQuality: {
    claim:
      'The same review identifies unreliable input data — missing history, or biases built into what was recorded — as a recurring limit on forecast quality, independent of which model is used.',
    source: SOURCES.mdpiForecastReview,
  },
  spreadsheetErrorRate: {
    claim:
      '0.87% of formula cells in operational spreadsheets produce a wrong result, and 94% of the spreadsheets audited contained at least one error.',
    source: SOURCES.powellSpreadsheetErrors,
  },
} as const satisfies Record<string, Finding>;

export type FindingKey = keyof typeof FINDINGS;

/** How each kind of source should be described to a reader, in plain words. */
export const STANDING_LABEL: Record<Standing, string> = {
  'peer-reviewed': 'Peer-reviewed',
  official: 'Official statistics',
  'vendor-research': 'Vendor research',
  editorial: 'Our assumption',
};

export const STANDING_NOTE: Record<Standing, string> = {
  'peer-reviewed': 'Reviewed by other researchers before publication.',
  official: 'Published by a government statistical office or standards body.',
  'vendor-research':
    'Published by a company that sells a remedy for the problem it measures. Often the only figure available, and worth reading with that in mind.',
  editorial: 'Chosen by us, stated here so you can disagree with it.',
};
