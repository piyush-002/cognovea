import { CELL_ERROR_RATE } from '@/lib/calculator/assumptions';
import { formatCurrency, formatHours, type Inputs, type Result } from '@/lib/calculator/model';

/**
 * The output.
 *
 * Presentational and server-renderable, so the same component draws the screen
 * and the PDF. One implementation means the leave-behind cannot disagree with
 * what the visitor saw, which for a document that circulates without them is
 * the difference between a useful asset and an embarrassing one.
 *
 * The stacked breakdown is the point of the whole tool. A single savings number
 * is a claim; labour, rework and delay set beside each other is an argument,
 * and it is the argument that gets a budget approved rather than the number.
 */

/**
 * One component of the total.
 *
 * The share is printed as well as drawn. Under the conservative error model the
 * rework bar is under 1% of the total, which renders as a sliver a reader
 * cannot judge — and a bar too small to read is worse than a number, because it
 * looks like nothing rather than like a small thing. The figure keeps it
 * honest in both directions: it stops a thin bar reading as zero, and it stops
 * a fat one implying more precision than arithmetic on estimates deserves.
 */
function Bar({ label, value, total, tone, note }: { label: string; value: number; total: number; tone: string; note?: string }) {
  const share = total > 0 ? (value / total) * 100 : 0;
  const pct = Math.max(share, value > 0 ? 1.5 : 0);
  const shareLabel = share > 0 && share < 1 ? 'under 1%' : `${Math.round(share)}%`;
  return (
    <div className="calc-bar">
      <div className="calc-bar__head">
        <span className="calc-bar__label">{label}</span>
        <span className="calc-bar__value">
          {formatCurrency(value)}
          {total > 0 ? <span className="calc-bar__share"> · {shareLabel}</span> : null}
        </span>
      </div>
      <div className="calc-bar__track">
        <div className={`calc-bar__fill calc-bar__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {note ? <p className="calc-bar__note">{note}</p> : null}
    </div>
  );
}

export default function Results({
  inputs,
  result,
  industryLabel,
  industryUnit,
}: {
  inputs: Inputs;
  result: Result;
  industryLabel: string;
  industryUnit: string;
}) {
  const total = result.totalKnownCost;

  return (
    <div className="calc-res">
      <p className="eyebrow">Costing you now</p>

      <p className="calc-res__big">{formatCurrency(total)}</p>
      <p className="calc-res__sub">
        a year on {industryUnit}, before automation. {formatHours(result.hoursPerYear)} across {inputs.people}{' '}
        {inputs.people === 1 ? 'person' : 'people'} in {industryLabel.toLowerCase()}.
      </p>

      <div className="calc-res__bars">
        <Bar label="Time spent building reports" value={result.labourCost} total={total} tone="labour" />
        <Bar
          label="Redoing work that came out wrong"
          value={result.errorCost}
          total={total}
          tone="error"
          note={`Assumes ${(CELL_ERROR_RATE.value * 100).toFixed(2)}% of formulas produce a wrong result, from an audit of 50 operational spreadsheets. Counts only the errors somebody catches.`}
        />
        {result.delayCost !== null ? (
          <Bar
            label="Decisions made late"
            value={result.delayCost}
            total={total}
            tone="delay"
            note="Your figure for what a day of delay is worth, applied across the year."
          />
        ) : (
          <div className="calc-bar calc-bar--unpriced">
            <div className="calc-bar__head">
              <span className="calc-bar__label">Decisions made late</span>
              <span className="calc-bar__value calc-bar__value--muted">not priced</span>
            </div>
            <p className="calc-bar__note">
              Decisions here are being made on data <strong>{result.decisionLagDays} working days old</strong>, around{' '}
              {result.staleDecisionsPerYear.toLocaleString('en-IN')} times a year. We have not put a number on that:
              what a day of delay costs depends entirely on the decision, and any figure we supplied would be a guess
              about your business. Add yours in the optional fields and it joins the total.
            </p>
          </div>
        )}
      </div>

      <div className="calc-res__after">
        <div>
          <p className="eyebrow">After automating</p>
          <p className="calc-res__mid">{formatCurrency(result.costAfter)}</p>
          <p className="calc-res__sub">a year, at {Math.round(inputs.timeReduction * 100)}% of the effort removed.</p>
        </div>
        <div>
          <p className="eyebrow">Recovered each year</p>
          <p className="calc-res__mid calc-res__mid--good">{formatCurrency(result.annualSaving)}</p>
          <p className="calc-res__sub">
            {formatHours(result.hoursPerYear - result.hoursAfter)} handed back to the people doing this work.
          </p>
        </div>
      </div>

      {result.paybackMonths !== null ? (
        <p className="calc-res__payback">
          Against the investment you entered, that pays for itself in{' '}
          <strong>
            {result.paybackMonths < 1
              ? 'under a month'
              : `${Math.round(result.paybackMonths)} month${Math.round(result.paybackMonths) === 1 ? '' : 's'}`}
          </strong>
          .
        </p>
      ) : null}
    </div>
  );
}
