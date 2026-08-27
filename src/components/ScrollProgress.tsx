'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Thin gradient bar across the top showing how far down the page you are.
 *
 * Writes a CSS custom property and lets the compositor scale the bar, so no
 * layout or paint happens on scroll. Reads are throttled to one per frame via
 * rAF. Recalculates on route change because the layout does not remount, and
 * the next page is almost never the same height.
 */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;

    // Cached, because reading scrollHeight forces the browser to lay the whole
    // document out. Doing that on every scroll frame is a forced reflow per
    // frame for the entire duration of a scroll, for a number that only changes
    // when the page does. A ResizeObserver on <body> catches the cases that
    // actually move it: images loading, fonts swapping, a section revealing.
    let max = 0;
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };

    const update = () => {
      ticking = false;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      el.style.setProperty('--p', p.toFixed(4));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    update();

    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [pathname]);

  return <div className="progress" ref={ref} aria-hidden="true" />;
}
