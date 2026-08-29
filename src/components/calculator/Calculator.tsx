'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COST_BANDS,
  INDUSTRIES,
  TIME_REDUCTION,
  type IndustryId,
} from '@/lib/calculator/assumptions';
import { LIMITS, calculate, formatCurrency, formatHours, normalise, type Inputs } from '@/lib/calculator/model';
import { decodeInputs, encodeInputs, hasSharedState } from '@/lib/calculator/url-state';
import Results from '@/components/calculator/Results';

/**
 * The calculator itself.
 *
 * Client-side because it has to recompute as you type; the page around it is
 * static and server-rendered, so the tool is in the HTML whether or not this
 * hydrates.
 *
 * Two behaviours matter more than they look:
 *
 * The URL updates as the inputs change, with replaceState rather than pushState.
 * That makes every result addressable — the thing that gets pasted into a Slack
 * channel — without filling the back button with fifty history entries, which
 * would trap someone on the page and is the usual way this pattern goes wrong.
 *
 * Nothing is gated. The calculator answers before it asks for anything, because
 * a tool that demands an email before showing a number does not get linked to
 * from a "free tools" roundup, and those links are the entire point.
 */

const DEFAULTS: Inputs = normalise({
  industry: 'manufacturing',
  people: 4,
  hoursPerWeek: 8,
  hourlyCost: 1600,
  reportsPerMonth: 12,
  decisionLagDays: 3,
  timeReduction: TIME_REDUCTION.value.default,
});

export default function Calculator() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // A shared link must show the sender's numbers, not the defaults. Read once
  // on mount; after that the URL follows the inputs rather than the reverse.
  useEffect(() => {
    const query = window.location.search.replace(/^\?/, '');
    if (hasSharedState(query)) {
      const shared = decodeInputs(query);
      setInputs(shared);
      if (shared.costPerDayOfDelay || shared.investment) setShowAdvanced(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const url = `${window.location.pathname}?${encodeInputs(inputs)}`;
    window.history.replaceState(null, '', url);
  }, [inputs, ready]);

  const result = useMemo(() => calculate(inputs), [inputs]);

  const set = useCallback(<K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => normalise({ ...prev, [key]: value }));
  }, []);

  // An empty field must stay empty while it is being retyped. Coercing '' to 0
  // on every keystroke is what makes a calculator impossible to edit.
  const [raw, setRaw] = useState<Partial<Record<keyof Inputs, string>>>({});
  const numberField = (key: keyof Inputs, fallback: number) => ({
    value: raw[key] ?? String(inputs[key] ?? fallback),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setRaw((r) => ({ ...r, [key]: text }));
      if (text.trim() !== '') set(key, Number(text) as never);
    },
    onBlur: () => {
      setRaw((r) => {
        const next = { ...r };
        delete next[key];
        return next;
      });
    },
  });

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?${encodeInputs(inputs)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      // Clipboard access can be refused. Selecting the URL bar is the fallback
      // every browser already provides, so say so rather than failing silently.
      window.prompt('Copy this link to share your result:', url);
    }
  }

  const industry = INDUSTRIES.find((i) => i.id === inputs.industry) ?? INDUSTRIES[0];

  return (
    <div className="calc">
      <form className="calc__form" onSubmit={(e) => e.preventDefault()} aria-label="Reporting cost inputs">
        <div className="field">
          <label htmlFor="industry">Industry</label>
          <select
            id="industry"
            value={inputs.industry}
            onChange={(e) => set('industry', e.target.value as IndustryId)}
          >
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
            <input id="people" type="number" inputMode="numeric" min={LIMITS.people[0]} max={LIMITS.people[1]} {...numberField('people', 4)} />
          </div>
          <div className="field">
            <label htmlFor="hours">Hours a week, each</label>
            <input id="hours" type="number" inputMode="decimal" min={0} max={LIMITS.hoursPerWeek[1]} step="0.5" {...numberField('hoursPerWeek', 8)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cost">Fully loaded cost per hour (Rs)</label>
          <input id="cost" type="number" inputMode="numeric" min={0} max={LIMITS.hourlyCost[1]} {...numberField('hourlyCost', 1600)} />
          <div className="calc__bands" role="group" aria-label="Cost band shortcuts">
            {COST_BANDS.value.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`calc__band${inputs.hourlyCost === b.hourly ? ' is-on' : ''}`}
                onClick={() => {
                  setRaw((r) => {
                    const next = { ...r };
                    delete next.hourlyCost;
                    return next;
                  });
                  set('hourlyCost', b.hourly);
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
          <p className="field__hint">
            Salary plus employer costs. The shortcuts are starting points, not survey data — type your own and the
            calculation follows it.
          </p>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="reports">Recurring reports a month</label>
            <input id="reports" type="number" inputMode="numeric" min={0} max={LIMITS.reportsPerMonth[1]} {...numberField('reportsPerMonth', 12)} />
          </div>
          <div className="field">
            <label htmlFor="lag">How old is the data when someone acts on it?</label>
            <input id="lag" type="number" inputMode="numeric" min={0} max={LIMITS.decisionLagDays[1]} {...numberField('decisionLagDays', 3)} />
            <p className="field__hint">Working days.</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="reduction">
            How much of that effort automation removes: <strong>{Math.round(inputs.timeReduction * 100)}%</strong>
          </label>
          <input
            id="reduction"
            type="range"
            min={TIME_REDUCTION.value.min * 100}
            max={TIME_REDUCTION.value.max * 100}
            step={5}
            value={Math.round(inputs.timeReduction * 100)}
            onChange={(e) => set('timeReduction', Number(e.target.value) / 100)}
          />
          <p className="field__hint">
            Our planning assumption, not a measurement, and deliberately at the conservative end. Move it if your
            experience says otherwise.
          </p>
        </div>

        <button type="button" className="calc__toggle" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}>
          {showAdvanced ? 'Hide' : 'Add'} the two optional figures
        </button>

        {showAdvanced && (
          <div className="calc__advanced">
            <div className="field">
              <label htmlFor="daycost">What is one day of delay worth? (Rs)</label>
              <input
                id="daycost"
                type="number"
                inputMode="numeric"
                min={0}
                value={raw.costPerDayOfDelay ?? (inputs.costPerDayOfDelay ?? '')}
                onChange={(e) => {
                  const text = e.target.value;
                  setRaw((r) => ({ ...r, costPerDayOfDelay: text }));
                  set('costPerDayOfDelay', (text.trim() === '' ? null : Number(text)) as never);
                }}
                onBlur={() =>
                  setRaw((r) => {
                    const next = { ...r };
                    delete next.costPerDayOfDelay;
                    return next;
                  })
                }
              />
              <p className="field__hint">
                Left blank on purpose. Nobody outside your business can put a number on this, so we report the delay
                and leave the valuation to you.
              </p>
            </div>

            <div className="field">
              <label htmlFor="investment">What would you expect to invest? (Rs)</label>
              <input
                id="investment"
                type="number"
                inputMode="numeric"
                min={0}
                value={raw.investment ?? (inputs.investment ?? '')}
                onChange={(e) => {
                  const text = e.target.value;
                  setRaw((r) => ({ ...r, investment: text }));
                  set('investment', (text.trim() === '' ? null : Number(text)) as never);
                }}
                onBlur={() =>
                  setRaw((r) => {
                    const next = { ...r };
                    delete next.investment;
                    return next;
                  })
                }
              />
              <p className="field__hint">Only used to work out payback against your own savings. We quote no price here.</p>
            </div>
          </div>
        )}
      </form>

      <div className="calc__out" ref={resultsRef}>
        <Results inputs={inputs} result={result} industryLabel={industry.label} industryUnit={industry.unit} />

        <div className="calc__actions">
          <button type="button" className="btn btn--primary" onClick={share}>
            {copied ? 'Link copied' : 'Copy a link to this result'}
          </button>
          <p className="calc__share-note">
            The link carries your numbers, so whoever opens it sees this result rather than an empty form.
          </p>
        </div>
      </div>
    </div>
  );
}
