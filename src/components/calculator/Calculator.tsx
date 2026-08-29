'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { COST_BANDS, INDUSTRIES, TIME_REDUCTION, type IndustryId } from '@/lib/calculator/assumptions';
import { LIMITS, calculate, normalise, type Inputs } from '@/lib/calculator/model';
import { decodeInputs, encodeInputs, hasSharedState } from '@/lib/calculator/url-state';
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

/** The four the arithmetic cannot proceed without. */
const REQUIRED = ['people', 'hoursPerWeek', 'hourlyCost', 'reportsPerMonth'] as const;

function toInputs(d: Draft): Partial<Inputs> {
  const n = (s: string) => (s.trim() === '' ? undefined : Number(s));
  return {
    industry: d.industry,
    people: n(d.people),
    hoursPerWeek: n(d.hoursPerWeek),
    hourlyCost: n(d.hourlyCost),
    reportsPerMonth: n(d.reportsPerMonth),
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
    const query = window.location.search.replace(/^\?/, '');
    if (hasSharedState(query)) {
      const shared = decodeInputs(query);
      setDraft(fromInputs(shared));
      setCalculated(true);
      if (shared.costPerDayOfDelay || shared.investment) setShowAdvanced(true);
    }
    setReady(true);
  }, []);

  const complete = REQUIRED.every((k) => draft[k].trim() !== '' && Number.isFinite(Number(draft[k])));
  const result = useMemo(() => (calculated ? calculate(toInputs(draft)) : null), [draft, calculated]);

  // The URL follows the result, not the typing: an address that changes while a
  // form is still empty is not a result anybody can share.
  useEffect(() => {
    if (!ready || !calculated) return;
    const encoded = encodeInputs(normalise(toInputs(draft)));
    window.history.replaceState(null, '', `${window.location.pathname}?${encoded}`);
  }, [draft, calculated, ready]);

  const set = useCallback((key: keyof Draft, value: string | number) => {
    setDraft((d) => ({ ...d, [key]: value }) as Draft);
  }, []);

  function reset() {
    setDraft(EMPTY);
    setCalculated(false);
    setShowAdvanced(false);
    window.history.replaceState(null, '', window.location.pathname);
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
        <div className="field">
          <label htmlFor="industry">Industry</label>
          <select id="industry" value={draft.industry} onChange={(e) => set('industry', e.target.value)}>
            {INDUSTRIES.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
          <p className="field__hint">Changes the wording only. Every number below is yours.</p>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="people">People doing manual reporting</label>
            <input id="people" type="number" inputMode="numeric" min={1} max={LIMITS.people[1]} {...field('people', 'e.g. 4')} />
          </div>
          <div className="field">
            <label htmlFor="hours">Hours a week, each</label>
            <input id="hours" type="number" inputMode="decimal" min={0} max={LIMITS.hoursPerWeek[1]} step="0.5" {...field('hoursPerWeek', 'e.g. 8')} />
            <p className="field__hint">Per person, not the team total.</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="cost">Fully loaded cost per hour (Rs)</label>
          <input id="cost" type="number" inputMode="numeric" min={0} max={LIMITS.hourlyCost[1]} {...field('hourlyCost', 'e.g. 1600')} />
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
          <p className="field__hint">Salary plus employer costs. The shortcuts are starting points, not survey data.</p>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="reports">Recurring reports a month</label>
            <input id="reports" type="number" inputMode="numeric" min={0} max={LIMITS.reportsPerMonth[1]} {...field('reportsPerMonth', 'e.g. 12')} />
          </div>
          <div className="field">
            <label htmlFor="lag">Days old is the data when someone acts on it</label>
            <input id="lag" type="number" inputMode="numeric" min={0} max={LIMITS.decisionLagDays[1]} {...field('decisionLagDays', 'e.g. 3')} />
            <p className="field__hint">Optional. Working days.</p>
          </div>
        </div>

        {/* The slider, given a scale so a percentage means something. A bare
            range input asks people to judge a position against nothing. */}
        <div className="field calc__slider">
          <div className="calc__slider-head">
            <label htmlFor="reduction">How much of that effort automation removes</label>
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
          <p className="field__hint">
            Our planning assumption, not a measurement, and set at the cautious end. Move it if your experience says
            otherwise.
          </p>
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
            <p className="calc__submit-note">Fill in the four figures above and the result appears here.</p>
          ) : null}
          {calculated ? <p className="calc__submit-note">Change anything above and the result updates as you go.</p> : null}
        </div>
      </form>

      <div className="calc__out">
        {result ? (
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
