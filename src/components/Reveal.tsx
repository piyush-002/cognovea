'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Adds `.is-in` to every `.rv` element as it scrolls into view.
 *
 * This component lives in the root layout, which does NOT remount on client-side
 * navigation. A mount-only effect would therefore observe the first page's
 * elements and never see any subsequent page's — leaving them stuck at opacity 0
 * until a hard refresh. Two things prevent that:
 *
 *   1. the effect re-runs on every pathname change, and
 *   2. a MutationObserver picks up `.rv` nodes added after that (tab panels,
 *      anything mounted late), so nothing depends on catching a single moment.
 *
 * `.rv` starts hidden in globals.css, and a <noscript> style in layout.tsx
 * cancels that when JavaScript is unavailable — so a JS-less reader gets the
 * full page rather than a blank one.
 */
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showAll = () => {
      document.querySelectorAll<HTMLElement>('.rv:not(.is-in)').forEach((n) => n.classList.add('is-in'));
    };

    if (reduced || typeof IntersectionObserver === 'undefined') {
      showAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;

          // Stagger siblings inside the same grid/row for a gentle cascade.
          const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
          const index = siblings.indexOf(el);
          el.style.setProperty('--rv-delay', `${Math.min(Math.max(index, 0), 5) * 80}ms`);

          el.classList.add('is-in');
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    const observeAll = () => {
      document.querySelectorAll<HTMLElement>('.rv:not(.is-in)').forEach((n) => io.observe(n));
    };

    observeAll();

    // Catch anything mounted after this pass.
    const mo = new MutationObserver((records) => {
      let found = false;
      for (const r of records) {
        for (const node of Array.from(r.addedNodes)) {
          if (node.nodeType !== 1) continue;
          const el = node as HTMLElement;
          if (el.classList?.contains('rv') || el.querySelector?.('.rv')) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) observeAll();
    });

    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: if a route change somehow leaves elements unobserved and the
    // user never scrolls, reveal whatever is already on screen.
    const settle = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.rv:not(.is-in)').forEach((n) => {
        const rect = n.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) n.classList.add('is-in');
      });
    }, 600);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(settle);
    };
  }, [pathname]);

  return null;
}
