import { LIMITS, normalise, type Inputs } from './model';
import type { IndustryId } from './assumptions';

/**
 * Inputs encoded into the URL, so a result can be shared.
 *
 * This is the mechanic the whole asset depends on. Somebody runs their numbers,
 * pastes the link into a channel, and the person who opens it sees THAT result
 * rather than an empty form — which is what gets forwarded, and forwarding is
 * what earns the link. A calculator that resets on load is a calculator nobody
 * can talk about.
 *
 * Plain readable query parameters rather than an encoded blob: the URL is going
 * to be pasted in front of colleagues, and `?people=6&hours=9` invites trust
 * where `?s=eyJwZW9wbGUiOjZ9` invites suspicion. It also means someone can edit
 * one number by hand, which is a reasonable thing to want to do.
 *
 * Every value is re-clamped on the way back in. A shared URL is untrusted input
 * like any other, and `?people=99999999` must not produce a headline figure
 * somebody screenshots.
 */

const KEYS = {
  industry: 'i',
  people: 'p',
  hoursPerWeek: 'h',
  hourlyCost: 'c',
  reportsPerMonth: 'r',
  decisionLagDays: 'd',
  costPerDayOfDelay: 'dc',
  timeReduction: 'tr',
  investment: 'inv',
} as const;

export function encodeInputs(inputs: Inputs): string {
  const p = new URLSearchParams();
  p.set(KEYS.industry, inputs.industry);
  p.set(KEYS.people, String(inputs.people));
  p.set(KEYS.hoursPerWeek, String(inputs.hoursPerWeek));
  p.set(KEYS.hourlyCost, String(inputs.hourlyCost));
  p.set(KEYS.reportsPerMonth, String(inputs.reportsPerMonth));
  p.set(KEYS.decisionLagDays, String(inputs.decisionLagDays));
  // Two decimal places: the slider is a percentage, and trailing float noise in
  // a shared URL looks like a bug.
  p.set(KEYS.timeReduction, inputs.timeReduction.toFixed(2));
  if (inputs.costPerDayOfDelay) p.set(KEYS.costPerDayOfDelay, String(inputs.costPerDayOfDelay));
  if (inputs.investment) p.set(KEYS.investment, String(inputs.investment));
  return p.toString();
}

const VALID_INDUSTRIES = new Set<string>([
  'manufacturing',
  'retail',
  'financial-services',
  'healthcare',
  'energy',
  'other',
]);

export function decodeInputs(query: string | URLSearchParams): Inputs {
  const p = typeof query === 'string' ? new URLSearchParams(query) : query;
  const num = (k: string): number | undefined => {
    const raw = p.get(k);
    if (raw === null || raw.trim() === '') return undefined;
    const v = Number(raw);
    return Number.isFinite(v) ? v : undefined;
  };

  const industryRaw = p.get(KEYS.industry) ?? '';
  const industry = (VALID_INDUSTRIES.has(industryRaw) ? industryRaw : 'other') as IndustryId;

  // normalise() does the clamping, so a hostile URL cannot reach the output.
  return normalise({
    industry,
    people: num(KEYS.people),
    hoursPerWeek: num(KEYS.hoursPerWeek),
    hourlyCost: num(KEYS.hourlyCost),
    reportsPerMonth: num(KEYS.reportsPerMonth),
    decisionLagDays: num(KEYS.decisionLagDays),
    costPerDayOfDelay: p.has(KEYS.costPerDayOfDelay) ? num(KEYS.costPerDayOfDelay) : null,
    timeReduction: num(KEYS.timeReduction),
    investment: p.has(KEYS.investment) ? num(KEYS.investment) : null,
  });
}

/** True when the URL carries a shared result rather than a bare visit. */
export function hasSharedState(query: string | URLSearchParams): boolean {
  const p = typeof query === 'string' ? new URLSearchParams(query) : query;
  return [KEYS.people, KEYS.hoursPerWeek, KEYS.hourlyCost].some((k) => p.has(k));
}

export { LIMITS };
