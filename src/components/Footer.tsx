import Link from 'next/link';
import Logo from '@/components/Logo';
import CookieSettings from '@/components/CookieSettings';
import { certifications, companyLinks, legalLinks, serviceLinks, site } from '@/lib/site';

export default function Footer() {
  const year = 2026;

  return (
    <footer className="c-foot">
      <div className="wrap">
        <div className="c-foot__grid">
          <div>
            <Logo />
            <p className="c-foot__tag">
              Where data becomes intelligence. Data engineering, analytics, business intelligence and AI for growing
              enterprises.
            </p>

            {/* Bottom of the left column, under the mark and the line that says
                what we do — where a reader looks for reassurance once they have
                decided we might be relevant.

                Words rather than logos: ISO does not certify anyone and forbids
                use of its own logo for this; the usable mark belongs to whoever
                issued the certificate, under their rules. */}
            <ul className="c-foot__certs" aria-label="Certifications">
              {certifications.map((c) => (
                <li key={c.name}>
                  <span className="c-foot__cert-name">{c.name}</span>
                  {c.body || c.ref ? (
                    <span className="c-foot__cert-meta">
                      {[c.body, c.ref].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>What We Do</h2>
            <ul>
              {serviceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label.replace(' Services', '')}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Company</h2>
            <ul>
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/data-health-check">Data Health Check</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2>Get in Touch</h2>
            <ul>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              {site.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a>
                </li>
              ))}
              <li>
                <Link href="/data-health-check">Book a Data Health Check</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="c-foot__base">
          <span>
            © {year} {site.name}. All rights reserved.
          </span>
          <div className="c-foot__legal">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <CookieSettings />
            <span>Bengaluru · Indore</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
