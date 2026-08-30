'use client';

import { useEffect, useId, useRef, useState } from 'react';

/**
 * A hint that costs no vertical space.
 *
 * There is a rule about what belongs in here, and it matters more than the
 * component does:
 *
 *   A hint that PREVENTS A WRONG ENTRY stays visible. "Per person, not the team
 *   total" is the difference between a right answer and one four times too
 *   large, and hiding it behind a click means most people never see it and some
 *   of them get a wrong number.
 *
 *   A hint that provides CONTEXT OR A CAVEAT goes in here. "Our assumption, not
 *   a measurement" changes how the reader weighs the output, not what they
 *   type, so it can wait until they ask.
 *
 * Opens on hover and on focus, closes on Escape and on click-away, and is
 * reachable by keyboard. aria-describedby rather than a title attribute: a
 * title is invisible to touch, unreliable to screen readers, and cannot be
 * styled.
 */
export default function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  /**
   * Three independent reasons to be open, tracked separately.
   *
   * A single `open` boolean does not survive contact with a touch screen. A tap
   * in Chromium synthesises mouseenter, then click, then mouseleave — so the
   * click opened it and the trailing mouseleave closed it again, and the bubble
   * never appeared on any phone. It looked fine on a desktop, which is exactly
   * the class of bug that reaches production.
   *
   * Separating them means each input mode closes only what it opened: the mouse
   * cannot close a tip a tap pinned, and a blur cannot close one the pointer is
   * still hovering.
   */
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = pinned || hovered || focused;

  const id = useId();
  const wrap = useRef<HTMLSpanElement | null>(null);

  const closeAll = () => {
    setPinned(false);
    setHovered(false);
    setFocused(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    const onDown = (e: Event) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) closeAll();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    // Touch needs its own listener: a tap outside fires no mousedown until the
    // synthesised sequence lands, by which time the tip has already reopened.
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  return (
    <span
      className="tip"
      ref={wrap}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="tip__btn"
        // The label names the field, so a screen reader announces "more about
        // hours a week" rather than a row of identical "info" buttons.
        aria-label={`More about ${label}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={(e) => {
          e.preventDefault();
          setPinned((v) => !v);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 7v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="4.6" r="0.95" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <span className="tip__bubble" id={id} role="tooltip">
          {children}
        </span>
      ) : null}
    </span>
  );
}
