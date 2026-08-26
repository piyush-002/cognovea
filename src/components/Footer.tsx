import Link from 'next/link';
import Logo from '@/components/Logo';
import { companyLinks, legalLinks, serviceLinks, site } from '@/lib/site';

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
          </div>

          <div>
            <h4>What We Do</h4>
            <ul>
              {serviceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label.replace(' Services', '')}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Company</h4>
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
            <h4>Get in Touch</h4>
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
            <span>Bengaluru · Indore</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
