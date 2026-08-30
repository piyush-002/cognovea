'use server';

import { CANONICAL_URL } from '@/lib/host-redirect.mjs';
import { calculate, formatCurrency, formatHours, normalise } from '@/lib/calculator/model';
import { decodeInputs, hasCompleteState } from '@/lib/calculator/url-state';
import { getPayloadClient } from '@/lib/payload';

/**
 * Records an email left in exchange for a tool summary.
 *
 * A Server Action for the same reason the enquiry form uses one: Payload owns
 * /api/[...slug], so our own route there would collide with it.
 *
 * One field is asked for, deliberately. Every extra box on a gate costs
 * downloads, and a name typed to get past a form is worth less than the numbers
 * the person already gave the calculator — which are captured here anyway, and
 * are the only thing that makes the lead worth anything.
 */

export type ToolLeadResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Free-mail domains are fine; these are the ones that are never a person. */
const NEVER_REAL = /@(example\.(com|org|net)|test\.com|localhost)$/i;

function clean(value: FormDataEntryValue | null, max: number): string {
  if (typeof value !== 'string') return '';
  // Strip control characters, then cap the length, as the enquiry action does.
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

export async function submitToolLead(formData: FormData): Promise<ToolLeadResult> {
  // Honeypot, as on the enquiry form. Reports success: telling a scraper it was
  // caught only invites a second attempt without the trap.
  if (clean(formData.get('website'), 200)) return { ok: true };

  const email = clean(formData.get('email'), 200).toLowerCase();
  if (!email || !EMAIL.test(email) || NEVER_REAL.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  // The query string the calculator built. Re-decoded and recalculated here
  // rather than trusted: the numbers stored beside a lead have to be the ones
  // the model produces, not whatever a form field claimed they were.
  const query = clean(formData.get('inputs'), 600);
  let summary = '';
  let shareUrl = '';
  try {
    // Asked of the query itself, before anything is decoded. decodeInputs()
    // normalises as it goes, filling a missing head-count with 1 and the rest
    // with 0 — right for the live form, wrong here, because it means a link
    // carrying only hours and a rate would be stored as a tidy one-person
    // result that nobody entered, sitting beside a real email address.
    if (!hasCompleteState(query)) throw new Error('incomplete inputs');

    const inputs = normalise(decodeInputs(query));

    const r = calculate(inputs);
    shareUrl = `${CANONICAL_URL}/tools/bi-automation-calculator/?${query}`;
    summary = [
      `${inputs.people} people x ${inputs.hoursPerWeek} hrs/week at ${formatCurrency(inputs.hourlyCost)}/hr`,
      `${inputs.reportsPerMonth} reports a month, data ${inputs.decisionLagDays} working days old when acted on`,
      `Automation assumption: ${Math.round(inputs.timeReduction * 100)}% of effort removed`,
      '',
      `Annual cost now: ${formatCurrency(r.totalKnownCost)} (${formatHours(r.hoursPerYear)})`,
      `  labour ${formatCurrency(r.labourCost)} | rework ${formatCurrency(r.errorCost)} | delay ${r.delayCost === null ? 'not priced' : formatCurrency(r.delayCost)}`,
      `After automating: ${formatCurrency(r.costAfter)}`,
      `Recovered a year: ${formatCurrency(r.annualSaving)}`,
      r.paybackMonths !== null
        ? `Payback against their own ${formatCurrency(inputs.investment ?? 0)}: ${Math.round(r.paybackMonths)} months`
        : 'No investment figure given, so no payback shown.',
    ].join('\n');
  } catch {
    // A malformed query must not cost us the lead. The email is the thing being
    // asked for; the summary is a bonus we can do without. shareUrl is left
    // empty rather than pointed at a link that reproduces nothing.
    summary = 'Could not read the figures from this download. No result is recorded for this lead.';
    shareUrl = '';
  }

  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: 'tool-leads',
      data: { email, tool: 'bi-automation-calculator', status: 'new', summary, shareUrl },
      overrideAccess: true,
    });
    return { ok: true };
  } catch (error) {
    console.error('[tool-lead] failed to save:', error);
    // The download is not withheld when saving fails. Losing a lead is our
    // problem; making somebody who gave us their address watch an error is
    // theirs, and they did their part.
    return { ok: true };
  }
}
