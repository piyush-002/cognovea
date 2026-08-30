'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { COST_BANDS, INDUSTRIES, TIME_REDUCTION, type IndustryId } from '@/lib/calculator/assumptions';
import { LIMITS, calculate, normalise, type Inputs } from '@/lib/calculator/model';
import { decodeInputs, encodeInputs, hasSharedState } from '@/lib/calculator/url-state';
import InfoTip from '@/components/calculator/InfoTip';
import PdfGate from '@/components/calculator/PdfGate';
import Results from '@/components/calculator/Results';

/**
 * The calculator.
 *
 * Three behaviours are deliberate and none of them is the obvious default.
 *
 * The fields start EMPTY, with example values as placeholders. Pre-filling them
 * with plausible numbers anchors: someone genuinely at 4 hours a week sees 8
 * sitting there, reads it as normal, and adjusts toward it. An empty field asks
 * a question; a filled one makes a suggestion, and we have nothing to suggest
 * that is better than what they already know about themselves.
 *
 * Nothing calculates until they ask. A result that assembles itself while the
 * form is still half-typed is noise — the number lurches with every keystroke
 * and none of the intermediate values mean anything. One deliberate press, then
 * live updates afterwards, so refining an input is immediate but the first
 * answer is something they asked for.
 *
 * A shared link skips all of that. If the URL carries someone else's numbers,
 * the recipient came to see a result, not to fill in a form.
 */

type Draft = {
  industry: IndustryId;
  people: string;
  hoursPerWeek: string;
  hourlyCost: string;
  reportsPerMonth: string;
  decisionLagDays: string;
  costPerDayOfDelay: string;
  investment: string;
  timeReduction: number;
};

const EMPTY: Draft = {
  industry: 'manufacturing',
  people: '',
  hoursPerWeek: '',
  hourlyCost: '',
  reportsPerMonth: '',
  decisionLagDays: '',
  costPerDayOfDelay: '',
  investment: '',
  timeReduction: TIME_REDUCTION.value.default,
};

/**
 * The three the arithmetic cannot proceed without.
 *
 * Reports a month is NOT among them, and used to be. It drives one thing: the
 * number of late decisions, which is only ever converted to money if the
 * visitor supplies a day value in the optional fields. Demanding it before
 * showing any answer meant gating the tool on a figure that, for most people,
 * changes nothing on screen.
 */
const REQUIRED = ['people', 'hoursPerWeek', 'hourlyCost'] as const;

/** What to call each one when telling somebody it is empty. */
const FIELD_NAMES: Record<(typeof REQUIRED)[number], string> = {
  people: 'People doing manual reporting',
  hoursPerWeek: 'Hours a week',
  hourlyCost: 'Cost per hour',
};

function toInputs(d: Draft): Partial<Inputs> {
  const n = (s: string) => (s.trim() === '' ? undefined : Number(s));
  return {
    industry: d.industry,
    // The three required ones may pass undefined: the component refuses to
    // calculate at all unless they are filled, so nothing downstream ever sees
    // it. See `complete`.
    people: n(d.people),
    hoursPerWeek: n(d.hoursPerWeek),
    hourlyCost: n(d.hourlyCost),
    // The optional ones must resolve to nothing, not to undefined. Left
    // undefined, normalise() supplied its fallback of 12 a month, and the
    // result reported "around 144 times a year" from an empty field. Empty
    // means none, and none is zero.
    reportsPerMonth: n(d.reportsPerMonth) ?? 0,
    decisionLagDays: n(d.decisionLagDays) ?? 0,
    costPerDayOfDelay: d.costPerDayOfDelay.trim() === '' ? null : Number(d.costPerDayOfDelay),
    investment: d.investment.trim() === '' ? null : Number(d.investment),
    timeReduction: d.timeReduction,
  };
}

function fromInputs(i: Inputs): Draft {
  return {
    industry: i.industry,
    people: String(i.people),
    hoursPerWeek: String(i.hoursPerWeek),
    hourlyCost: String(i.hourlyCost),
    reportsPerMonth: String(i.reportsPerMonth),
    decisionLagDays: String(i.decisionLagDays),
    costPerDayOfDelay: i.costPerDayOfDelay ? String(i.costPerDayOfDelay) : '',
    investment: i.investment ? String(i.investment) : '',
    timeReduction: i.timeReduction,
  };
}

export default function Calculator() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [calculated, setCalculated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let query = '';
    try {
      query = window.location.search.replace(/^\?/, '');
    } catch {
      // An opaque origin can refuse this too. No shared state, which is the
      // correct outcome: there is no URL to have carried any.
    }
    if (hasSharedState(query)) {
      const shared = decodeInputs(query);
      setDraft(fromInputs(shared));
      setCalculated(true);
      if (shared.costPerDayOfDelay || shared.investment) setShowAdvanced(true);
    }
    setReady(true);
  }, []);

  const missing = REQUIRED.filter((k) => draft[k].trim() === '' || !Number.isFinite(Number(draft[k])));
  const complete = missing.length === 0;

  /**
   * A result is computed only while every required field is actually filled.
   *
   * `calculated` alone was the condition, which meant clearing a field after
   * the first calculation kept the result on screen — recomputed against
   * normalise()'s fallbacks. Empty the hours and it carried on reporting 368
   * hours a year, which is one person at the fallback of 8 a week: a number the
   * visitor never entered, presented as theirs, on a page whose entire claim is
   * that every figure is either yours or disclosed.
   *
   * The fallbacks stay where they are. They are the model's guard against a
   * hostile URL producing NaN, and that is a different job from deciding
   * whether there is enough here to answer.
   */
  const result = useMemo(
    () => (calculated && complete ? calculate(toInputs(draft)) : null),
    [draft, calculated, complete],
  );

  // The URL follows the result, not the typing: an address that changes while a
  // form is still empty is not a result anybody can share.
  //
  // Wrapped, because replaceState throws in any document with an opaque origin
  // — a sandboxed iframe, a file:// page, some embedded contexts. Unwrapped it
  // threw inside the effect and took the whole result down with it, so the
  // calculator produced nothing at all. That is not hypothetical here: the plan
  // for this tool includes agencies embedding it, which is precisely the case
  // that has no origin to write to. Losing the shareable URL there is a fair
  // trade; losing the calculator is not.
  useEffect(() => {
    if (!ready || !calculated) return;
    try {
      const encoded = encodeInputs(normalise(toInputs(draft)));
      window.history.replaceState(null, '', `${window.location.pathname}?${encoded}`);
    } catch {
      // No addressable URL in this context. The tool still works; only the
      // share link does not, and the share button falls back to a prompt.
    }
  }, [draft, calculated, ready]);

  const set = useCallback((key: keyof Draft, value: string | number) => {
    setDraft((d) => ({ ...d, [key]: value }) as Draft);
  }, []);

  function reset() {
    setDraft(EMPTY);
    setCalculated(false);
    setShowAdvanced(false);
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // Same reason as above. Clearing the fields is the part that matters.
    }
    document.getElementById('people')?.focus();
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?${encodeInputs(normalise(toInputs(draft)))}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      window.prompt('Copy this link to share your result:', url);
    }
  }

  const industry = INDUSTRIES.find((i) => i.id === draft.industry) ?? INDUSTRIES[0];
  const pct = Math.round(draft.timeReduction * 100);
  const sliderPos =
    ((draft.timeReduction - TIME_REDUCTION.value.min) / (TIME_REDUCTION.value.max - TIME_REDUCTION.value.min)) * 100;

  const field = (key: keyof Draft, placeholder: string) => ({
    value: draft[key] as string,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
  });

  return (
    <div className="calc">
      <form
        className="calc__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) setCalculated(true);
        }}
        aria-label="Reporting cost inputs"
      >
        {/* Paired into rows so the whole form clears a 13" laptop fold. Six
            full-width fields ran 823px and pushed the button under the fold on
            every laptop measured; a control you have to scroll to find is a
            control half the visitors never reach. */}
        <div className="form__row">
          <div className="field">
            <label htmlFor="industry">
              Industry
              <InfoTip label="industry">Changes the wording only — every number below is yours.</InfoTip>
            </label>
            <select id="industry" value={draft.industry} onChange={(e) => set('industry', e.target.value)}>
              {INDUSTRIES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="people">People doing manual reporting</label>
            <input id="people" type="number" inputMode="numeric" min={1} max={LIMITS.people[1]} {...field('people', 'e.g. 4')} />
          </div>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="hours">Hours a week, each</label>
            <input id="hours" type="number" inputMode="decimal" min={0} max={LIMITS.hoursPerWeek[1]} step="0.5" {...field('hoursPerWeek', 'e.g. 8')} />
            <p className="field__hint">Per person, not the team total.</p>
          </div>
          <div className="field">
            <label htmlFor="cost">
              Fully loaded cost per hour (Rs)
              <InfoTip label="cost per hour">
                The shortcuts below are starting points, not survey data. Type your own and the calculation follows
                your number.
              </InfoTip>
            </label>
            <input id="cost" type="number" inputMode="numeric" min={0} max={LIMITS.hourlyCost[1]} {...field('hourlyCost', 'e.g. 1600')} />
            <p className="field__hint">Salary plus employer costs.</p>
          </div>
        </div>

        <div className="calc__bands" role="group" aria-label="Cost band shortcuts">
          {COST_BANDS.value.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`calc__band${draft.hourlyCost === String(b.hourly) ? ' is-on' : ''}`}
              onClick={() => set('hourlyCost', String(b.hourly))}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="reports">
              Recurring reports a month
              <InfoTip label="reports a month">
                Optional. It does not change the cost of the time or the rework — a fixed share of the work is redone
                however it is parcelled up. It sets how many decisions are made on stale data, which becomes a cost
                only if you say what a day of delay is worth.
              </InfoTip>
            </label>
            <input id="reports" type="number" inputMode="numeric" min={0} max={LIMITS.reportsPerMonth[1]} {...field('reportsPerMonth', 'e.g. 12')} />
          </div>
          <div className="field">
            <label htmlFor="lag">
              Days old is the data when acted on
              <InfoTip label="data age">
                Optional. Working days between the data being true and someone acting on it. On its own it is
                reported as a finding; add what a day of delay costs and it becomes part of the total.
              </InfoTip>
            </label>
            <input id="lag" type="number" inputMode="numeric" min={0} max={LIMITS.decisionLagDays[1]} {...field('decisionLagDays', 'e.g. 3 working days')} />
          </div>
        </div>

        {/* The slider, given a scale so a percentage means something. A bare
            range input asks people to judge a position against nothing. */}
        <div className="field calc__slider">
          <div className="calc__slider-head">
            <label htmlFor="reduction">
              How much of that effort automation removes
              <InfoTip label="the automation assumption">
                Our planning assumption, not a measurement, and set at the cautious end. What survives automation is
                exception handling and judgement. Move it if your experience says otherwise.
              </InfoTip>
            </label>
            <output className="calc__slider-val" htmlFor="reduction">
              {pct}%
            </output>
          </div>
          <input
            id="reduction"
            type="range"
            min={TIME_REDUCTION.value.min * 100}
            max={TIME_REDUCTION.value.max * 100}
            step={5}
            value={pct}
            onChange={(e) => set('timeReduction', Number(e.target.value) / 100)}
            style={{ ['--pos' as string]: `${sliderPos}%` }}
          />
          <div className="calc__slider-scale" aria-hidden="true">
            <span>Cautious</span>
            <span>Typical</span>
            <span>Ambitious</span>
          </div>
        </div>

        <button type="button" className="calc__toggle" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}>
          {showAdvanced ? 'Hide' : 'Add'} the two optional figures
        </button>

        {showAdvanced && (
          <div className="calc__advanced">
            <div className="field">
              <label htmlFor="daycost">What does a day of delay cost, per decision? (Rs)</label>
              <input id="daycost" type="number" inputMode="numeric" min={0} {...field('costPerDayOfDelay', 'Leave blank if unsure')} />
              <p className="field__hint">
                Per decision, not for the business as a whole — it is multiplied by the days late and the number of
                reports, and the result shows that working. Nobody outside your business can put a number on this,
                which is why it is yours to give and blank by default.
              </p>
            </div>
            <div className="field">
              <label htmlFor="investment">What would you expect to invest? (Rs)</label>
              <input id="investment" type="number" inputMode="numeric" min={0} {...field('investment', 'For a payback figure')} />
              <p className="field__hint">Only used to work out payback against your own savings. We quote no price here.</p>
            </div>
          </div>
        )}

        <div className="calc__submit">
          {!calculated ? (
            <button type="submit" className="btn btn--primary" disabled={!complete}>
              Calculate
            </button>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Start again
            </button>
          )}
          {!calculated && !complete ? (
            <p className="calc__submit-note">Fill in the three figures above and the result appears here.</p>
          ) : null}
          {calculated ? <p className="calc__submit-note">Change anything above and the result updates as you go.</p> : null}
        </div>
      </form>

      <div className="calc__out">
        {calculated && !complete ? (
          <div className="calc__empty">
            <p className="eyebrow">Waiting on one thing</p>
            <p className="calc__empty-lead">
              {missing.length === 1 ? 'This field is empty:' : 'These fields are empty:'}{' '}
              <strong>{missing.map((k) => FIELD_NAMES[k]).join(', ')}</strong>. Fill it back in and the result
              returns.
            </p>
            <p className="calc__empty-note">
              We would rather show nothing than carry on with a number you did not enter.
            </p>
          </div>
        ) : result ? (
          <>
            <Results
              inputs={normalise(toInputs(draft))}
              result={result}
              industryLabel={industry.label}
              industryUnit={industry.unit}
            />
            <div className="calc__actions">
              <button type="button" className="btn btn--primary" onClick={share}>
                {copied ? 'Link copied' : 'Copy a link to this result'}
              </button>
              <p className="calc__share-note">
                The link carries your numbers, so whoever opens it sees this result rather than an empty form.
              </p>
              <PdfGate query={encodeInputs(normalise(toInputs(draft)))} />
            </div>
          </>
        ) : (
          <div className="calc__empty">
            <p className="eyebrow">Your result</p>
            <p className="calc__empty-lead">
              You will see the annual cost of your reporting split three ways — the hours, the rework, and how late
              your decisions are — and what automating it would give back.
            </p>
            <ul className="calc__empty-list">
              <li>Nothing is gated. No email, no sign-up.</li>
              <li>Every assumption is shown and sourced below.</li>
              <li>You can share the result as a link.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
