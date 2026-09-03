'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from '@/components/Logo';
import {
  drawerCompanyLinks,
  drawerResourceLinks,
  industryLinks,
  navCompanyLinks,
  navPrimaryLinks,
  navResourceLinks,
  serviceLinks,
} from '@/lib/site';

/**
 * One dropdown, used four times.
 *
 * This was three copies of the same twenty-five lines, and adding Industries
 * would have made it four — which is how the trigger on one menu ends up with a
 * different aria-expanded binding, or one menu keeps a hover style the others
 * lost. The open state still lives in Nav, because only Nav can know that
 * opening one closes the others.
 */
function NavDropdown({
  id,
  label,
  links,
  active,
  open,
  onToggle,
  current,
  narrow = false,
}: {
  id: string;
  label: string;
  links: { href: string; label: string; blurb?: string }[];
  /** The current route is inside this menu, so its trigger reads as selected. */
  active: boolean;
  open: boolean;
  onToggle: () => void;
  current: (href: string) => 'page' | undefined;
  narrow?: boolean;
}) {
  return (
    <li className={`c-nav__item${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="c-nav__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`nav-menu-${id}`}
        style={active ? { color: 'var(--fg)' } : undefined}
        onClick={onToggle}
      >
        {label}
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M2 4.5 6 8.5 10 4.5" />
        </svg>
      </button>
      <ul id={`nav-menu-${id}`} className={`c-nav__menu${narrow ? ' c-nav__menu--narrow' : ''}`}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} aria-current={current(l.href)}>
              <strong>{l.label}</strong>
              {l.blurb ? <small>{l.blurb}</small> : null}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [stuck, setStuck] = useState(false);
  /**
   * Which dropdown is open, rather than a boolean each.
   *
   * With a boolean per menu, opening the second while the first is still open
   * leaves two panels overlapping. A single value makes that unrepresentable:
   * opening one closes the other by construction rather than by remembering to.
   */
  const [openMenu, setOpenMenu] = useState<'services' | 'industries' | 'resources' | 'company' | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

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
    setOpenMenu(null);
    setDrawerOpen(false);
  }, [pathname]);

  // Click-away and Escape, for whichever dropdown is open. Scoped to the nav
  // rather than to one item, so it covers both without a ref each.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

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
  const inIndustries = industryLinks.some((l) => pathname.startsWith(l.href));
  const inCompany = navCompanyLinks.some((l) => pathname.startsWith(l.href));
  const inResources = navResourceLinks.some((l) => pathname.startsWith(l.href));

  return (
    <>
      <header className={`c-nav${stuck ? ' is-stuck' : ''}`}>
        <div className="wrap c-nav__in">
          <Logo />

          <nav aria-label="Primary" ref={navRef}>
            <ul className="c-nav__links">
              <NavDropdown
                id="services"
                label="What We Do"
                links={serviceLinks}
                active={inServices}
                open={openMenu === 'services'}
                onToggle={() => setOpenMenu((v) => (v === 'services' ? null : 'services'))}
                current={current}
              />

              {/* Industries sits second, directly after what we do and before
                  Resources. The two sectors this business is built around had no
                  presence in the header at all — the playbooks were filed under
                  Resources, which reads as reading material rather than as the
                  place to find out whether we work in your industry. */}
              <NavDropdown
                id="industries"
                label="Industries"
                links={industryLinks}
                active={inIndustries}
                open={openMenu === 'industries'}
                onToggle={() => setOpenMenu((v) => (v === 'industries' ? null : 'industries'))}
                current={current}
              />

              {/* No text link to /data-health-check here: the CTA beside it points
                  at the same page, and the footer, every page's closing band and
                  a dozen in-body links point there too. Two identical links four
                  inches apart in one nav add nothing a crawler can use, and cost
                  a slot on a row people scan. */}
              <NavDropdown
                id="resources"
                label="Resources"
                links={navResourceLinks}
                active={inResources}
                open={openMenu === 'resources'}
                onToggle={() => setOpenMenu((v) => (v === 'resources' ? null : 'resources'))}
                current={current}
              />

              {navPrimaryLinks
                .filter((l) => l.href !== '/contact')
                .map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} aria-current={current(l.href)}>
                      {l.label}
                    </Link>
                  </li>
                ))}

              <NavDropdown
                id="company"
                label="Company"
                links={navCompanyLinks}
                active={inCompany}
                open={openMenu === 'company'}
                onToggle={() => setOpenMenu((v) => (v === 'company' ? null : 'company'))}
                current={current}
                narrow
              />

              {/* Contact sits last, after the dropdown, because it is the one
                  thing on this row somebody is trying to reach. */}
              <li>
                <Link href="/contact" aria-current={current('/contact')}>
                  Contact
                </Link>
              </li>
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
            <span className="eyebrow">Industries</span>
            {industryLinks.map((l) => (
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
            <span className="eyebrow">Resources</span>
            {drawerResourceLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="c-drawer__group">
            <span className="eyebrow">Company</span>
            {drawerCompanyLinks.map((l) => (
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
