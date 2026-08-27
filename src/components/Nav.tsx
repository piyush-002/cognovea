'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/Logo';
import { companyLinks, serviceLinks } from '@/lib/site';

export default function Nav() {
  const pathname = usePathname();
  const [stuck, setStuck] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement | null>(null);

  // Solid backdrop once the page has scrolled. Re-synced on every route change:
  // the layout does not remount between routes, so without the pathname dep the
  // bar could keep a stale "stuck" background after Next scrolls the new page to top.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // Close menus on route change.
  useEffect(() => {
    setServicesOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  // Click-away and Escape for the services dropdown.
  useEffect(() => {
    if (!servicesOpen) return;
    const onDown = (e: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setServicesOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [servicesOpen]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const current = (href: string) => (pathname === href || pathname === `${href}/` ? 'page' : undefined);
  const inServices = serviceLinks.some((l) => pathname.startsWith(l.href));

  return (
    <>
      <header className={`c-nav${stuck ? ' is-stuck' : ''}`}>
        <div className="wrap c-nav__in">
          <Logo />

          <nav aria-label="Primary">
            <ul className="c-nav__links">
              <li className={`c-nav__item${servicesOpen ? ' is-open' : ''}`} ref={itemRef}>
                <button
                  type="button"
                  className="c-nav__trigger"
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                  style={inServices ? { color: 'var(--fg)' } : undefined}
                  onClick={() => setServicesOpen((v) => !v)}
                >
                  What We Do
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                    <path d="M2 4.5 6 8.5 10 4.5" />
                  </svg>
                </button>
                <ul className="c-nav__menu">
                  {serviceLinks.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} aria-current={current(l.href)}>
                        <strong>{l.label}</strong>
                        <small>{l.blurb}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li>
                <Link href="/data-health-check" aria-current={current('/data-health-check')}>
                  Data Health Check
                </Link>
              </li>
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={current(l.href)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link className="c-nav__cta" href="/data-health-check">
            Book a Data Health Check
          </Link>

          <button
            type="button"
            className="c-nav__burger"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>

      <div className={`c-drawer${drawerOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="wrap c-drawer__top">
          <Logo />
          <button type="button" className="c-drawer__close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="wrap c-drawer__body">
          <div className="c-drawer__group">
            <span className="eyebrow">What We Do</span>
            {serviceLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="c-drawer__group">
            <span className="eyebrow">Start Here</span>
            <Link href="/data-health-check">Data Health Check</Link>
          </div>

          <div className="c-drawer__group">
            <span className="eyebrow">Company</span>
            {companyLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="btn-row">
            <Link className="btn btn--primary" href="/data-health-check">
              Book a Data Health Check
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M2 8h12M9 3l5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
