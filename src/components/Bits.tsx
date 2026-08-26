import Link from 'next/link';
import type { ReactNode } from 'react';
import { abs, site } from '@/lib/site';

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 8h12M9 3l5 5-5 5" />
    </svg>
  );
}

export type Crumb = { href: string; label: string };

/** Compact hero for inner pages, with breadcrumbs. */
export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className="c-phero">
      <div className="wrap c-phero__in">
        <nav aria-label="Breadcrumb">
          <ol className="crumbs">
            <li>
              <Link href="/">Home</Link>
            </li>
            {crumbs.map((c, i) => (
              <li key={c.href} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                {i === crumbs.length - 1 ? c.label : <Link href={c.href}>{c.label}</Link>}
              </li>
            ))}
          </ol>
        </nav>

        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h-xl" style={{ marginTop: '1rem' }}>
          {title}
        </h1>
        {intro && <p className="lede" style={{ marginTop: '1.3em' }}>{intro}</p>}
        {children}
      </div>
    </section>
  );
}

/** Closing conversion band, shared by every page. */
export function CtaBand({
  title,
  body,
  primary = { href: '/data-health-check', label: 'Book a Data Health Check' },
  secondary,
}: {
  title: string;
  body: ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="c-cta">
      <div className="wrap">
        <div className="rv measure">
          <h2 className="h-lg">{title}</h2>
          <p className="lede" style={{ marginTop: '1.1em' }}>
            {body}
          </p>
          <div className="btn-row">
            <Link className="btn btn--primary" href={primary.href}>
              {primary.label}
              <Arrow />
            </Link>
            {secondary && (
              <Link className="btn btn--ghost" href={secondary.href}>
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** BreadcrumbList structured data matching the visible breadcrumbs. */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ href: '/', label: 'Home' }, ...crumbs].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: abs(c.href),
    })),
  };
}

/** Service structured data for the four service pages. */
export function serviceSchema({
  name,
  description,
  path,
  serviceType,
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    url: abs(path),
    provider: {
      '@type': 'Organization',
      name: site.name,
      url: abs('/'),
    },
    areaServed: ['IN', 'US', 'GB', 'AE', 'SG'],
  };
}
