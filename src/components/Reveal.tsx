'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Adds `.is-in` to every `.rv` element as it scrolls into view.
 *
 * This component lives in the root layout, which does NOT remount on client-side
 * navigation. A mount-only effect would therefore observe the first page's
 * elements and never see any subsequent page's, leaving them stuck at opacity 0
 * until a hard refresh. Two things prevent that:
 *
 *   1. the effect re-runs on every pathname change, and
 *   2. a MutationObserver picks up `.rv` nodes added after that (tab panels,
 *      anything mounted late), so nothing depends on catching a single moment.
 *
 * `.rv` starts hidden in globals.css, and a <noscript> style in layout.tsx
 * cancels that when JavaScript is unavailable, so a JS-less reader gets the
 * full page rather than a blank one.
 */
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    // `html { scroll-behavior: smooth }` is wanted for in-page anchor links, but
    // it also applies to the jump back to the top that Next performs on every
    // route change. On a page several screens tall that turns an instant
    // navigation into a visible glide, which feels like the site is lagging
    // rather than animating. Suppress it for the moment of the route change,
    // then hand it back so anchors keep their easing.
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    const restore = window.setTimeout(() => {
      root.style.scrollBehavior = '';
    }, 120);

    // Tells the CSS failsafe that JavaScript is alive, so it stays dormant.
    // Set here rather than in the server HTML: mutating the DOM before
    // hydration is what caused the `className="js"` mismatch earlier, and an
    // effect runs after hydration, where DOM changes are safe.
    document.documentElement.classList.add('rv-ready');

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
      // threshold MUST stay 0. It is a fraction of the ELEMENT's own area, not
      // of the viewport, so any positive value silently fails for anything
      // taller than the screen: a long article body is one `.rv` element
      // thousands of pixels tall, of which the viewport can only ever show a
      // few percent, so the callback never fires and the text sits at opacity 0
      // forever. It broke on phones first because the same article is roughly
      // twice as tall at a phone's line length, which is exactly the width
      // where nobody was testing. The negative bottom margin is what delays the
      // reveal until the element is properly on screen; it does that job
      // without any dependence on how tall the element happens to be.
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
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
      // Two passes, deliberately. Reading a rect and then adding a class inside
      // the same loop interleaves reads and writes: each class invalidates
      // layout, so the next getBoundingClientRect forces a fresh layout pass.
      // With ~36 revealable elements that is 36 synchronous layouts in one tick,
      // which is most of the "forced reflow" Lighthouse reports. Collecting
      // first and writing second costs one layout in total.
      const nodes = [...document.querySelectorAll<HTMLElement>('.rv:not(.is-in)')];
      const viewportHeight = window.innerHeight;
      // A viewport's worth of slack below the fold. The failure this guards
      // against is content that never appears at all, and revealing something
      // one screen early is a far cheaper mistake than never revealing it.
      const onScreen = nodes.filter((n) => {
        const rect = n.getBoundingClientRect();
        return rect.top < viewportHeight * 2 && rect.bottom > -viewportHeight;
      });
      onScreen.forEach((n) => n.classList.add('is-in'));
    }, 600);

    return () => {
      window.clearTimeout(restore);
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(settle);
    };
  }, [pathname]);

  return null;
}
