import Link from 'next/link';
import { Arrow } from '@/components/Bits';
import { serviceLinks } from '@/lib/site';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
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
