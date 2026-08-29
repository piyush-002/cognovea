import Image from 'next/image';
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

/**
 * Artwork column for an editorial split. Pairs with a `.feature` wrapper whose
 * other child holds the copy. The figure sits beside the text rather than
 * above it, so it costs almost no vertical height and sections stay inside one
 * screen.
 */
export function Figure({ src, alt, tall = false }: { src: string; alt: string; tall?: boolean }) {
  // SVG and raster want opposite treatment. The line-art figures are a couple
  // of kilobytes each and already resolution-independent, so running them
  // through the image optimiser would cost a request and return something
  // larger. Photographs are the reverse: a 140KB JPEG served at its full size
  // to a phone is exactly the kind of weight the Core Web Vitals work went
  // after, and next/image turns it into an AVIF a fraction of the size at the
  // width actually needed.
  const isVector = src.endsWith('.svg');

  return (
    <div className="feature__media rv rv--right">
      <div className={`figure ${tall ? 'figure--tall' : 'figure--wide'}`}>
        {isVector ? (
          <img src={src} alt={alt} width={800} height={520} loading="lazy" decoding="async" />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={1344}
            height={768}
            // The figure is roughly half the content column on a desktop and
            // the full width of it on a phone. Without this the optimiser
            // assumes full viewport width and ships a needlessly large file.
            sizes="(min-width: 900px) 46vw, 92vw"
            loading="lazy"
            quality={72}
          />
        )}
      </div>
    </div>
  );
}

/** Compact hero for inner pages, with breadcrumbs. */
export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
  compact,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  crumbs: Crumb[];
  children?: ReactNode;
  /** Drops the full-screen floor. For pages people open to read one specific
      thing (the privacy policy), a full-height hero would push the actual
      content entirely below the fold. */
  compact?: boolean;
}) {
  return (
    <section className={compact ? 'c-phero c-phero--compact' : 'c-phero'}>
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

      {!compact && (
      <span className="c-phero__cue" aria-hidden="true">
        Scroll
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M8 2v12M3 9l5 5 5-5" />
        </svg>
      </span>
      )}
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
    // A reference to the Organization declared in the root layout, not a
    // second one with two of its fields. Repeating it describes a different
    // company that happens to share a name.
    provider: { '@id': `${site.url}/#organization` },
    areaServed: ['IN', 'US', 'GB', 'AE', 'SG'],
  };
}
