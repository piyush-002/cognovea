import Link from 'next/link';
import { Arrow } from '@/components/Bits';
import { serviceLinks } from '@/lib/site';

/**
 * The 404 content, shared by both of the places Next looks for one.
 *
 * There are two, and they catch different things. `(frontend)/not-found.tsx`
 * handles a `notFound()` thrown inside a page that matched — an article slug
 * that no longer exists, say — and it renders inside the frontend layout, so
 * it already has the nav and footer around it.
 *
 * `app/not-found.tsx` handles a URL that matched no route at all. That one
 * cannot use a route group's layout, because Next does not know which of the
 * two root layouts the request belonged to, so it has to draw its own document.
 * Without it, an unmatched URL falls through to the host's default 404 page —
 * which is what was happening: the page existed, in the wrong place.
 *
 * The words live here so the two cannot drift apart.
 */
export default function NotFoundBody() {
  return (
    <section className="band band--grid">
      <div className="wrap measure">
        <p className="eyebrow">404</p>
        <h1 className="h-lg" style={{ marginTop: '1rem' }}>
          That page isn&rsquo;t here.
        </h1>
        <p className="lede" style={{ marginTop: '1.1em' }}>
          The link may be out of date, or the page may have moved. Here is where most people are heading.
        </p>

        <ul className="chips mt-3">
          {serviceLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="btn-row">
          <Link className="btn btn--primary" href="/">
            Back to home
            <Arrow />
          </Link>
          <Link className="btn btn--ghost" href="/contact">
            Contact Cognovea
          </Link>
        </div>
      </div>
    </section>
  );
}
