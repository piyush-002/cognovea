/**
 * The consent banner's markup, with no state of its own.
 *
 * Split out of Analytics.tsx so it can be rendered by the verification harness.
 * The stateful version only appears when a measurement ID is configured, after
 * JavaScript has mounted, and only while the visitor is undecided, which meant
 * the whole consent UI was invisible to every check in tools/ and shipped with
 * a Decline button that rendered near-black on navy. A presentational component
 * can be rendered on demand and inspected like any other markup.
 *
 * No 'use client' directive: it carries handlers as props rather than owning
 * them, so it compiles into whichever bundle imports it.
 */
export default function ConsentBanner({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="c-consent" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="c-consent__in">
        <div className="c-consent__text">
          <p>
            <strong>We&rsquo;d like to measure how this site is used.</strong> If you agree, Google
            Analytics sets two cookies (<code>_ga</code> and <code>_ga_&hellip;</code>) that tell us
            which pages people read and how fast they load. Nothing is loaded and no cookie is set
            unless you accept, and the site works the same either way.
          </p>
          <p className="c-consent__meta">
            No advertising or cross-site tracking, ever.{' '}
            <a href="/privacy-policy/">Read the privacy policy</a>.
          </p>
        </div>
        <div className="c-consent__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onDecline}>
            Decline
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={onAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
