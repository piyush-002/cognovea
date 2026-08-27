'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Horizontal card scroller with arrow controls. The pattern Tiger, Tredence
 * and Kyndryl all use for industries and insights.
 *
 * Native overflow scrolling does the work, so it stays swipeable on touch and
 * keyboard-scrollable, and it degrades to a plain scrolling row if JS fails.
 * The arrows only add convenience and disable themselves at each end.
 */
export default function Scroller({
  items,
  label,
}: {
  items: { key: string; node: ReactNode }[];
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync]);

  function nudge(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  }

  return (
    <div className="scroller">
      <div className="scroller__nav" style={{ marginBottom: '1.4rem' }}>
        <button
          type="button"
          className="scroller__btn"
          aria-label={`Scroll ${label} left`}
          disabled={atStart}
          onClick={() => nudge(-1)}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M14 8H2M7 3 2 8l5 5" />
          </svg>
        </button>
        <button
          type="button"
          className="scroller__btn"
          aria-label={`Scroll ${label} right`}
          disabled={atEnd}
          onClick={() => nudge(1)}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M2 8h12M9 3l5 5-5 5" />
          </svg>
        </button>
      </div>

      <div className="scroller__track" ref={trackRef} tabIndex={0} role="group" aria-label={label}>
        {items.map((it) => (
          <div className="scroller__item" key={it.key}>
            {it.node}
          </div>
        ))}
      </div>
    </div>
  );
}
