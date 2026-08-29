import { CELL_ERROR_RATE, TIME_REDUCTION, WORKING_WEEKS_PER_YEAR, type IndustryId } from './assumptions';

/**
 * The calculation, as a pure function.
 *
 * Pure so it can be tested without a browser, and so the same code produces the
 * on-screen result, the shared-link result and the PDF. Three implementations
 * of one sum is three chances to disagree with itself, and a calculator whose
 * PDF says something different from its screen is finished as a citable thing.
 *
 * The model deliberately refuses to monetise one of the three costs by default.
 * See `decisionLag` below.
 */

export type Inputs = {
  industry: IndustryId;
  /** People doing the manual reporting. */
  people: number;
  /** Hours a week each of them spends on it. */
  hoursPerWeek: number;
  /** Fully loaded cost per hour, in rupees. */
  hourlyCost: number;
  /** Recurring reports produced per month. Drives the error exposure. */
  reportsPerMonth: number;
  /** Typical age of the data when a decision is made on it, in working days. */
  decisionLagDays: number;
  /**
   * Optional. What one day of delay costs this business. Nobody can supply this
   * from outside the business, so if it is absent the delay is reported as a
   * finding rather than converted into money.
   */
  costPerDayOfDelay?: number | null;
  /** Share of manual effort removed. Visitor-controlled; see TIME_REDUCTION. */
  timeReduction: number;
  /** Optional. What the visitor expects to invest, for a payback figure. */
  investment?: number | null;
};

export type Result = {
  hoursPerYear: number;
  labourCost: number;
  errorCost: number;
  /** Null when the delay has not been, or cannot be, priced. */
  delayCost: number | null;
  /**
   * Why it is null, so the page can explain rather than print nothing.
   * 'unvalued'  — no day value supplied, which is the default and fine.
   * 'no-cycles' — a day value was supplied but there are no recurring reports,
   *               so there is no count of late decisions to apply it to.
   */
  delayUnpricedBecause: 'unvalued' | 'no-cycles' | null;
  /** Always present: the delay expressed as a fact rather than a cost. */
  decisionLagDays: number;
  staleDecisionsPerYear: number;
  totalKnownCost: number;
  hoursAfter: number;
  costAfter: number;
  annualSaving: number;
  /** Null unless the visitor supplied an investment figure. */
  paybackMonths: number | null;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Non-finite, negative and absurd values are coerced rather than propagated. */
function sane(n: unknown, lo: number, hi: number, fallback = 0): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return clamp(v, lo, hi);
}

export const LIMITS = {
  people: [1, 5000],
  hoursPerWeek: [0, 60],
  hourlyCost: [0, 100000],
  reportsPerMonth: [0, 2000],
  decisionLagDays: [0, 60],
  costPerDayOfDelay: [0, 100000000],
  investment: [0, 1000000000],
} as const;

export function normalise(raw: Partial<Inputs>): Inputs {
  return {
    industry: (raw.industry ?? 'other') as IndustryId,
    people: Math.round(sane(raw.people, ...LIMITS.people, 4)),
    hoursPerWeek: sane(raw.hoursPerWeek, ...LIMITS.hoursPerWeek, 8),
    hourlyCost: sane(raw.hourlyCost, ...LIMITS.hourlyCost, 1600),
    reportsPerMonth: Math.round(sane(raw.reportsPerMonth, ...LIMITS.reportsPerMonth, 12)),
    decisionLagDays: sane(raw.decisionLagDays, ...LIMITS.decisionLagDays, 3),
    costPerDayOfDelay:
      raw.costPerDayOfDelay === null || raw.costPerDayOfDelay === undefined
        ? null
        : sane(raw.costPerDayOfDelay, ...LIMITS.costPerDayOfDelay, 0),
    timeReduction: sane(raw.timeReduction, TIME_REDUCTION.value.min, TIME_REDUCTION.value.max, TIME_REDUCTION.value.default),
    investment:
      raw.investment === null || raw.investment === undefined
        ? null
        : sane(raw.investment, ...LIMITS.investment, 0),
  };
}

export function calculate(raw: Partial<Inputs>): Result {
  const i = normalise(raw);
  const weeks = WORKING_WEEKS_PER_YEAR.value;

  const hoursPerYear = i.people * i.hoursPerWeek * weeks;
  const labourCost = hoursPerYear * i.hourlyCost;

  /**
   * Error cost.
   *
   * Not "x% of everything is wrong, so x% of the cost is wasted". The published
   * rate is per formula, and what it buys you is the likelihood that a given
   * report carries a wrong number. The cost modelled is redoing the work: the
   * report is rebuilt and the time spent on it is spent again.
   *
   * This is the conservative reading. It counts only errors somebody catches,
   * and says nothing about the cost of a decision taken on a wrong number,
   * which is the expensive case and is not estimable from these inputs.
   */
  const reportsPerYear = i.reportsPerMonth * 12;
  const hoursPerReport = reportsPerYear > 0 ? hoursPerYear / reportsPerYear : 0;
  const reportsCarryingAnError = reportsPerYear * CELL_ERROR_RATE.value;
  const errorCost = reportsCarryingAnError * hoursPerReport * i.hourlyCost;

  /**
   * Decision lag.
   *
   * Reported as days by default, and converted to money only if the visitor
   * says what a day is worth. There is no honest general multiplier here: a day
   * of stale stock data costs a retailer something entirely unlike what it
   * costs a hospital, and any figure we supplied would be the number a
   * sceptical reader attacks first. So the tool states the finding — decisions
   * are being made on data this many days old, this many times a year — and
   * leaves the valuation to whoever knows the business.
   *
   * The value entered is PER DECISION, and the arithmetic is shown on the page
   * so nobody has to guess. That matters because this term compounds fast:
   * three days at Rs 20,000 across 144 decisions is Rs 86 lakh, several times
   * the labour cost. That may be true for a business where a late decision is
   * genuinely expensive, but it must be visibly the visitor's own arithmetic
   * rather than something the tool did quietly on their behalf.
   *
   * There is deliberately no cap. An earlier version clamped the decision count
   * at 365, which meant 30 reports a month and 100 reports a month produced
   * nearly identical figures — the output stopped responding to an input and
   * said nothing about it. A silent ceiling is worse than a large number: the
   * large number can be argued with.
   */
  const staleDecisionsPerYear = reportsPerYear;
  const delayCost =
    i.costPerDayOfDelay && i.costPerDayOfDelay > 0 && staleDecisionsPerYear > 0
      ? i.decisionLagDays * i.costPerDayOfDelay * staleDecisionsPerYear
      : null;

  const totalKnownCost = labourCost + errorCost + (delayCost ?? 0);

  const hoursAfter = hoursPerYear * (1 - i.timeReduction);
  const labourAfter = hoursAfter * i.hourlyCost;
  // Automation removes the manual step that produced the error, so the residual
  // error cost scales with the residual manual effort rather than vanishing.
  const errorAfter = errorCost * (1 - i.timeReduction);
  const delayAfter = delayCost === null ? null : delayCost * (1 - i.timeReduction);
  const costAfter = labourAfter + errorAfter + (delayAfter ?? 0);

  const annualSaving = totalKnownCost - costAfter;

  const paybackMonths =
    i.investment && i.investment > 0 && annualSaving > 0
      ? (i.investment / annualSaving) * 12
      : null;

  const delayUnpricedBecause: Result['delayUnpricedBecause'] =
    delayCost !== null
      ? null
      : i.costPerDayOfDelay && i.costPerDayOfDelay > 0
        ? 'no-cycles'
        : 'unvalued';

  return {
    hoursPerYear,
    labourCost,
    errorCost,
    delayCost,
    delayUnpricedBecause,
    decisionLagDays: i.decisionLagDays,
    staleDecisionsPerYear,
    totalKnownCost,
    hoursAfter,
    costAfter,
    annualSaving,
    paybackMonths,
  };
}

/** Indian digit grouping, matching the rest of the site. */
export function formatCurrency(n: number): string {
  const rounded = Math.round(n);
  return `Rs ${rounded.toLocaleString('en-IN')}`;
}

export function formatHours(n: number): string {
  return `${Math.round(n).toLocaleString('en-IN')} hrs`;
}
