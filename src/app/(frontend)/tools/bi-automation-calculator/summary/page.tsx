import type { Metadata } from 'next';
import { CELL_ERROR_RATE, INDUSTRIES, TIME_REDUCTION, WORKING_WEEKS_PER_YEAR } from '@/lib/calculator/assumptions';
import { calculate, formatCurrency, formatHours, normalise } from '@/lib/calculator/model';
import { decodeInputs, hasCompleteState } from '@/lib/calculator/url-state';
import PrintTrigger from '@/components/calculator/PrintTrigger';

/**
 * The one-page summary, laid out for A4.
 *
 * Rendered as a page and printed, rather than generated with a PDF library.
 * The reasons are practical rather than ideological: the figures come from the
 * same model the screen uses, so the document cannot disagree with what the
 * visitor saw; there is no headless browser to run on a serverless function and
 * no library to keep current; and anyone can see exactly what they are about to
 * save before they save it.
 *
 * The cost is honest too — the visitor gets their browser\'s print dialog and
 * chooses "Save as PDF" rather than a file landing in Downloads. If that trade
 * stops being worth it, this page is already the right shape to hand to a
 * server-side renderer without changing anything a reader sees.
 */

export const metadata: Metadata = {
  title: 'Your reporting cost summary',
  // Never indexed: it is one visitor\'s figures, and a search result pointing
  // at somebody else\'s numbers is worse than no result.
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SummaryPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
    ),
  );

  // Nothing is printed on our letterhead unless the link actually carries the
  // person's figures. decodeInputs() normalises as it decodes — a missing
  // head-count becomes 1, everything else becomes 0 — so a bare visit to this
  // route would otherwise produce a dated, branded page reading "Costing you
  // now: Rs 0" under the words "worked out from figures you entered". That is a
  // document somebody could forward, and it would be a fabrication.
  if (!hasCompleteState(query)) {
    return (
      <main className="sheet sheet--empty">
        <PrintTrigger enabled={false} />
        <h1>This link has no figures in it</h1>
        <p>
          A summary is built from the numbers entered into the calculator, and this address does not carry any. Nothing
          has been lost — running the calculator again takes under a minute.
        </p>
        <p>
          <a href="/tools/bi-automation-calculator/">Open the calculator</a>
        </p>
      </main>
    );
  }

  const inputs = normalise(decodeInputs(query));
  const r = calculate(inputs);
  const industry = INDUSTRIES.find((i) => i.id === inputs.industry) ?? INDUSTRIES[0];
  const total = r.totalKnownCost;

  const share = (v: number) => {
    const s = total > 0 ? (v / total) * 100 : 0;
    return s > 0 && s < 1 ? 'under 1%' : `${Math.round(s)}%`;
  };
  const width = (v: number) => Math.max(total > 0 ? (v / total) * 100 : 0, v > 0 ? 1.2 : 0);

  const dated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="sheet">
      <PrintTrigger />

      <header className="sheet__head">
        <div className="sheet__brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image
              does not render in a print context reliably; this is a fixed-size
              local asset and needs no optimisation. */}
          <img src="/logo.png" alt="" width={34} height={34} />
          <div>
            <b>cognovea</b>
            <span>Data + AI Solutions</span>
          </div>
        </div>
        <div className="sheet__meta">
          Manual Reporting Cost Estimate
          <br />
          {industry.label} · {dated}
        </div>
      </header>

      <h1>What your recurring reporting costs a year</h1>
      <p className="sheet__sub">Worked out from figures you entered. An estimate, not a measurement of your business.</p>

      <div className="sheet__headline">
        <div className="sheet__lab">Costing you now</div>
        <div className="sheet__big">{formatCurrency(total)}</div>
        <div className="sheet__note">
          a year, before automation · {formatHours(r.hoursPerYear)} across {inputs.people}{' '}
          {inputs.people === 1 ? 'person' : 'people'}
        </div>
      </div>

      <h2>Where it goes</h2>

      <div className="sheet__bar">
        <div className="sheet__row">
          <span className="sheet__n">Time spent building reports</span>
          <span className="sheet__v">
            {formatCurrency(r.labourCost)} <small>· {share(r.labourCost)}</small>
          </span>
        </div>
        <div className="sheet__track">
          <div className="sheet__fill sheet__fill--labour" style={{ width: `${width(r.labourCost)}%` }} />
        </div>
      </div>

      <div className="sheet__bar">
        <div className="sheet__row">
          <span className="sheet__n">Redoing work that came out wrong</span>
          <span className="sheet__v">
            {formatCurrency(r.errorCost)} <small>· {share(r.errorCost)}</small>
          </span>
        </div>
        <div className="sheet__track">
          <div className="sheet__fill sheet__fill--error" style={{ width: `${width(r.errorCost)}%` }} />
        </div>
        <p>
          {(CELL_ERROR_RATE.value * 100).toFixed(2)}% of formulas produce a wrong result (Powell, Baker &amp; Lawson,
          2009 — audit of 50 operational spreadsheets, 270,722 formulas). Counts only errors somebody catches.
        </p>
      </div>

      <div className="sheet__bar">
        <div className="sheet__row">
          <span className="sheet__n">Decisions made late</span>
          <span className={`sheet__v${r.delayCost === null ? ' sheet__v--muted' : ''}`}>
            {r.delayCost === null ? 'not priced' : <>{formatCurrency(r.delayCost)} <small>· {share(r.delayCost)}</small></>}
          </span>
        </div>
        {r.delayCost !== null ? (
          <>
            <div className="sheet__track">
              <div className="sheet__fill sheet__fill--delay" style={{ width: `${width(r.delayCost)}%` }} />
            </div>
            <p>
              {inputs.decisionLagDays} days late × {formatCurrency(inputs.costPerDayOfDelay ?? 0)} a day ×{' '}
              {r.staleDecisionsPerYear.toLocaleString('en-IN')} decisions a year. Your figure for what a day of delay
              is worth — we supplied no number here.
            </p>
          </>
        ) : (
          <p>
            Decisions are being made on data <b>{inputs.decisionLagDays} working days old</b>
            {r.staleDecisionsPerYear > 0
              ? `, around ${r.staleDecisionsPerYear.toLocaleString('en-IN')} times a year`
              : ''}
            . We have put no number on that: what a day of delay costs depends entirely on the decision, and any
            figure we supplied would be a guess about your business.
          </p>
        )}
      </div>

      <div className="sheet__two">
        <div className="sheet__card">
          <div className="sheet__lab">After automating</div>
          <div className="sheet__num">{formatCurrency(r.costAfter)}</div>
          <p>a year, at {Math.round(inputs.timeReduction * 100)}% of the effort removed</p>
        </div>
        <div className="sheet__card">
          <div className="sheet__lab">Recovered each year</div>
          <div className="sheet__num sheet__num--good">{formatCurrency(r.annualSaving)}</div>
          <p>{formatHours(r.hoursPerYear - r.hoursAfter)} handed back to the team</p>
        </div>
      </div>

      {r.paybackMonths !== null ? (
        <div className="sheet__payback">
          Against the {formatCurrency(inputs.investment ?? 0)} you entered, that pays for itself in{' '}
          <b>
            {r.paybackMonths < 1
              ? 'under a month'
              : `${Math.round(r.paybackMonths)} month${Math.round(r.paybackMonths) === 1 ? '' : 's'}`}
          </b>
          .
        </div>
      ) : null}

      <h2>What was entered</h2>
      <table className="sheet__table">
        <tbody>
          <tr><td>People doing manual reporting</td><td>{inputs.people}</td></tr>
          <tr><td>Hours a week, each</td><td>{inputs.hoursPerWeek}</td></tr>
          <tr><td>Fully loaded cost per hour</td><td>{formatCurrency(inputs.hourlyCost)}</td></tr>
          <tr><td>Recurring reports a month</td><td>{inputs.reportsPerMonth}</td></tr>
          <tr><td>Data age when acted on</td><td>{inputs.decisionLagDays} working days</td></tr>
          {inputs.costPerDayOfDelay ? (
            <tr><td>Value of one day of delay, per decision</td><td>{formatCurrency(inputs.costPerDayOfDelay)}</td></tr>
          ) : null}
          <tr><td>Effort removed by automation</td><td>{Math.round(inputs.timeReduction * 100)}%</td></tr>
        </tbody>
      </table>

      <h2>Assumptions, and where they come from</h2>
      <ul className="sheet__assume">
        <li>
          <b>{WORKING_WEEKS_PER_YEAR.value} working weeks a year</b> — 52 less roughly six for leave and public
          holidays. Our figure, chosen low.
        </li>
        <li>
          <b>{(CELL_ERROR_RATE.value * 100).toFixed(2)}% of formulas produce a wrong result</b> — Powell, Baker &amp;
          Lawson, <i>Journal of Organizational and End User Computing</i> 21(3), 2009. Published research.
        </li>
        <li>
          <b>{Math.round(inputs.timeReduction * 100)}% of effort removed</b> — a planning assumption, not a
          measurement, and one you set yourself. The tool defaults to{' '}
          {Math.round(TIME_REDUCTION.value.default * 100)}%, at the conservative end.
        </li>
        <li>
          <b>No industry benchmarks are used.</b> No credible public figures exist for reporting hours by sector, so
          none are here rather than invented ones.
        </li>
        <li>
          <b>Errors nobody catches are not counted.</b> A decision taken on a wrong number costs far more and cannot
          be estimated from these inputs.
        </li>
      </ul>

      <footer className="sheet__foot">
        <span>Re-run or share this at cognovea.com/tools/bi-automation-calculator</span>
        <span>hello@cognovea.com</span>
      </footer>
    </main>
  );
}
