/**
 * Every number the calculator uses that the visitor did not type, and where it
 * came from.
 *
 * This file exists because the calculator's only real asset is being trusted.
 * A savings calculator published by a data consultancy gets read by people
 * whose job is to distrust numbers, and the fastest way to lose them is an
 * assumption with no provenance. So there are exactly three kinds of number
 * here and each is labelled:
 *
 *   published    — from a citable source, with the citation attached
 *   user-set     — the visitor supplies it; we assume nothing
 *   editorial    — our stated position, presented as a position, never as data
 *
 * The methodology panel on the page is rendered FROM this file rather than
 * written alongside it. That is deliberate: a hand-written methodology drifts
 * from the code the first time someone tunes a constant, and a methodology that
 * misdescribes the maths is worse than none, because it is a specific claim
 * rather than a vague one.
 *
 * WHAT IS DELIBERATELY ABSENT: per-industry benchmarks for hours spent on
 * manual reporting. The concept called for them and no credible public source
 * exists — the search results are vendor blogs, paywalled benchmarking reports
 * and single-client case studies, none of which survives a sceptical reader.
 * Rather than invent them, the industry selector changes wording and nothing
 * else, and INDUSTRY_BENCHMARKS below is empty and typed, ready for Cognovea's
 * own delivery data. First-party numbers from real projects would be stronger
 * than any citation available here, and can be described as exactly that.
 */

export type Source = {
  /** How the citation reads. */
  label: string;
  url: string;
  year: number;
  /** What was actually measured, so a reader can judge whether it transfers. */
  method: string;
};

export type Assumption<T> = {
  value: T;
  basis: 'published' | 'user-set' | 'editorial';
  /** Present only when basis is 'published'. */
  source?: Source;
  /** Plain-language statement of what this number is and its limits. */
  note: string;
};

/**
 * Share of formulas in a working spreadsheet that produce a wrong result.
 *
 * The restrictive figure, not the inclusive one. Powell, Baker and Lawson found
 * 1.79% of formulas carried an error of some kind and 0.87% actually produced a
 * wrong value; the second is the one that costs anybody anything, and using the
 * larger number would roughly double the output for no defensible reason.
 */
export const CELL_ERROR_RATE: Assumption<number> = {
  value: 0.0087,
  basis: 'published',
  source: {
    label: 'Powell, Baker & Lawson, "Errors in Operational Spreadsheets", Journal of Organizational and End User Computing 21(3)',
    url: 'https://mba.tuck.dartmouth.edu/spreadsheet/product_pubs_files/errors.pdf',
    year: 2009,
    method:
      'Audit of 50 operational spreadsheets in real use across a range of organisations, covering 270,722 formulas and finding 483 error instances. 0.87% of formulas produced a wrong result under the authors’ restrictive definition; 94% of the spreadsheets contained at least one error.',
  },
  note:
    'Applied to the reporting work itself, not to every cell in every file. The default assumes a report carrying an error is found and redone, which is the optimistic case: the expensive version is the one nobody catches.',
};

/**
 * How much of the manual effort automation actually removes.
 *
 * Editorial, and shown as a slider the visitor controls, because the honest
 * answer is that it depends entirely on how consistent the source systems are.
 * A vendor number here would be the least trustworthy figure on the page, so
 * the default is deliberately at the low end of what this work usually achieves
 * and the visitor is invited to disagree with it.
 */
export const TIME_REDUCTION: Assumption<{ min: number; max: number; default: number }> = {
  value: { min: 0.2, max: 0.95, default: 0.6 },
  basis: 'editorial',
  note:
    'Cognovea’s stated planning assumption, not a measurement. 60% is the conservative end of what pipeline and reporting automation typically removes; the work that survives is exception handling, interpretation, and the judgement calls a person still has to make. Move the slider if your own experience says otherwise.',
};

/**
 * Working weeks per year, for turning hours a week into hours a year.
 *
 * 46 rather than 52: leave, public holidays and the weeks where the reporting
 * simply does not happen. Erring low keeps the headline number defensible.
 */
export const WORKING_WEEKS_PER_YEAR: Assumption<number> = {
  value: 46,
  basis: 'editorial',
  note:
    '52 weeks less roughly six for leave and public holidays. Chosen low on purpose: a calculator that flatters its own output is easy to dismiss.',
};

/**
 * Fully-loaded cost bands, offered as a convenience for anyone who does not
 * have the figure to hand.
 *
 * These are ENTRY AIDS, not benchmarks. The visitor can type any number, and
 * whatever they type is what the model uses. They are round because a precise
 * fake number would imply a precision nobody measured.
 */
export const COST_BANDS: Assumption<{ id: string; label: string; hourly: number }[]> = {
  value: [
    { id: 'analyst', label: 'Analyst / executive', hourly: 900 },
    { id: 'senior', label: 'Senior analyst / specialist', hourly: 1600 },
    { id: 'manager', label: 'Manager / lead', hourly: 2600 },
    { id: 'head', label: 'Head of function', hourly: 4200 },
  ],
  basis: 'editorial',
  note:
    'Starting points in rupees per hour, fully loaded (salary plus employer costs), for anyone who does not have the figure to hand. They are not survey data and are not claimed to be. Replace them with your own and the calculation follows your number, not ours.',
};

/**
 * Per-industry defaults.
 *
 * Empty, and that is the honest state. See the note at the top of this file:
 * no credible public source gives hours spent on manual reporting broken down
 * by industry, and inventing them would put the least defensible numbers on the
 * page in the place a sceptical reader looks first.
 *
 * To populate: take the figures from delivered engagements, record the sample
 * size, and set `basis: 'first-party'` with a note saying how many projects it
 * is drawn from. That is a stronger claim than any citation available here.
 */
export type IndustryBenchmark = {
  hoursPerWeek: number;
  peopleInvolved: number;
  reportsPerMonth: number;
  sampleSize: number;
};

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {};

/** The verticals the site already speaks to. Wording only; the maths is identical. */
export const INDUSTRIES = [
  { id: 'manufacturing', label: 'Manufacturing', unit: 'plant and supply chain reporting' },
  { id: 'retail', label: 'Retail & Consumer', unit: 'sales, stock and category reporting' },
  { id: 'financial-services', label: 'Financial Services', unit: 'risk, regulatory and performance reporting' },
  { id: 'healthcare', label: 'Healthcare', unit: 'operational and compliance reporting' },
  { id: 'energy', label: 'Energy & Industrial', unit: 'asset, output and maintenance reporting' },
  { id: 'other', label: 'Something else', unit: 'recurring reporting' },
] as const;

export type IndustryId = (typeof INDUSTRIES)[number]['id'];

/** Everything the methodology panel renders, in the order it should read. */
export const ASSUMPTIONS = [
  { key: 'weeks', title: 'Working weeks per year', a: WORKING_WEEKS_PER_YEAR },
  { key: 'reduction', title: 'How much automation removes', a: TIME_REDUCTION },
  { key: 'error', title: 'Spreadsheet error rate', a: CELL_ERROR_RATE },
  { key: 'bands', title: 'Hourly cost bands', a: COST_BANDS },
] as const;
