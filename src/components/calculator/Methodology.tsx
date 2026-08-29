import { ASSUMPTIONS, INDUSTRY_BENCHMARKS } from '@/lib/calculator/assumptions';

/**
 * How the number was arrived at.
 *
 * Rendered from src/lib/calculator/assumptions.ts, the same file the model
 * reads, rather than written alongside it. A hand-written methodology drifts
 * the first time somebody tunes a constant, and a methodology that misdescribes
 * its own maths is worse than none: it is a specific, checkable claim that
 * happens to be false, and this page will be read by people who check.
 *
 * The basis label on each row is the honest part. Marking our own planning
 * assumption as an assumption costs a little authority and buys the only thing
 * that matters here, which is being quotable.
 */

const BASIS_LABEL: Record<string, { label: string; note: string }> = {
  published: { label: 'Published research', note: 'From a source you can go and read.' },
  editorial: { label: 'Our assumption', note: 'Our stated position, not a measurement.' },
  'user-set': { label: 'Your figure', note: 'Taken from what you entered.' },
};

export default function Methodology() {
  return (
    <div className="method">
      <p>
        Every figure this tool uses is either something you entered or something listed below. There is nothing else.
        Where we are making an assumption rather than citing a measurement, it says so.
      </p>

      <ol className="method__list">
        {ASSUMPTIONS.map(({ key, title, a }) => {
          const basis = BASIS_LABEL[a.basis] ?? { label: a.basis, note: '' };
          return (
            <li className="method__item" key={key}>
              <div className="method__head">
                <h3 className="h-xs">{title}</h3>
                <span className={`method__tag method__tag--${a.basis}`}>{basis.label}</span>
              </div>

              <p className="method__note">{a.note}</p>

              {a.source ? (
                <p className="method__src">
                  <a href={a.source.url} target="_blank" rel="noopener noreferrer">
                    {a.source.label}
                  </a>{' '}
                  ({a.source.year}). {a.source.method}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="method__gap">
        <h3 className="h-xs">What this tool does not claim</h3>
        <ul>
          <li>
            <strong>No industry benchmarks.</strong>{' '}
            {Object.keys(INDUSTRY_BENCHMARKS).length === 0
              ? 'Choosing an industry changes the wording and nothing else. We looked for credible published figures on reporting hours by sector and did not find any worth citing, so there are none here rather than invented ones. Your own numbers are more accurate than a benchmark would be in any case.'
              : 'Industry figures shown are drawn from Cognovea engagements and are labelled with the number of projects behind them.'}
          </li>
          <li>
            <strong>No price for the work.</strong> Payback, if shown, is worked out against a figure you entered. We
            quote nothing on this page.
          </li>
          <li>
            <strong>No claim about errors nobody caught.</strong> The rework figure counts reports that were found to
            be wrong and redone. A decision taken on a wrong number costs far more and cannot be estimated from these
            inputs, so it is not in the total.
          </li>
          <li>
            <strong>It is an estimate.</strong> It is arithmetic on figures you supplied, not a measurement of your
            business. Treat it as the start of a conversation, which is all any calculator like this can honestly be.
          </li>
        </ul>
      </div>
    </div>
  );
}
