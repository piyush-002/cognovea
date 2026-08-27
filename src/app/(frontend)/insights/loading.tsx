/**
 * Shown the instant /insights is clicked, while the article list is fetched.
 *
 * Without this, App Router holds the previous page on screen until the server
 * component resolves. On a suspended Neon compute that is several seconds of a
 * click that appears to have done nothing, which reads as a broken link rather
 * than a slow one.
 *
 * The hero is static text, so it is rendered for real here rather than as grey
 * boxes; only the part that depends on the database is a placeholder.
 */
export default function Loading() {
  return (
    <>
      <section className="c-phero c-phero--compact">
        <div className="wrap c-phero__in">
          <p className="eyebrow">Insights</p>
          <h1 className="h-xl" style={{ marginTop: '1rem' }}>
            Perspectives on Data, Analytics and AI
          </h1>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="grid grid--2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <article className="card" key={i}>
                <div className="skeleton skeleton--art" />
                <div className="skeleton skeleton--line" style={{ width: '38%', marginTop: '1.1rem' }} />
                <div className="skeleton skeleton--line" style={{ width: '82%', height: '1.4rem', marginTop: '0.8rem' }} />
                <div className="skeleton skeleton--line" style={{ width: '100%', marginTop: '0.9rem' }} />
                <div className="skeleton skeleton--line" style={{ width: '64%', marginTop: '0.5rem' }} />
              </article>
            ))}
          </div>
          <p className="sr-only">Loading insights</p>
        </div>
      </section>
    </>
  );
}
