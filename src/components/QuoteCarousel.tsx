'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Testimonial carousel: a scroll-snapping rail with dot navigation.
 *
 * Separate from <Scroller /> rather than a mode on it. Scroller is a plain card
 * rail with arrows, used for industries and roles; a quote needs a different
 * item width, different type and a different control, and folding both into one
 * component would mean a prop for each difference.
 *
 * Native overflow scrolling does the moving, so this stays swipeable on touch,
 * scrollable by trackpad, reachable by keyboard, and it degrades to a plain
 * scrolling row if the JavaScript never runs — the dots are an addition to that,
 * not the mechanism.
 *
 * It does not auto-advance. A logo can move past on its own because it is
 * recognised at a glance; a testimonial has to be read, and readers read at
 * different speeds, so text that moves on someone else's schedule gets lost
 * mid-sentence. It also avoids owing the page a pause control, which is what
 * WCAG 2.2.2 requires of anything that moves by itself.
 */
export default function QuoteCarousel({
  items,
  label,
}: {
  items: { key: string; node: ReactNode }[];
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  /** One item plus one gap: the distance from a card to the next one. */
  const step = useCallback(() => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    return first.offsetWidth + gap;
  }, []);

  // Swiping or trackpad-scrolling the rail moves the dots with it, so they
  // always describe where the reader actually is rather than where they were
  // last sent.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const s = step();
      if (s > 0) setIndex(Math.round(el.scrollLeft / s));
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [step]);

  const go = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollTo({ left: i * step(), behavior: 'smooth' });
      setIndex(i);
    },
    [step],
  );

  return (
    <div className="qcar">
      <div className="qcar__track" ref={trackRef} tabIndex={0} role="group" aria-label={label}>
        {items.map((it) => (
          <div className="qcar__item" key={it.key}>
            {it.node}
          </div>
        ))}
      </div>

      {/* One quote is not a carousel: a single dot that cannot go anywhere is
          noise, so the rail simply holds its one card. */}
      {items.length > 1 && (
        <div className="qcar__dots">
          {items.map((it, i) => (
            <button
              type="button"
              key={it.key}
              className={i === index ? 'qcar__dot is-current' : 'qcar__dot'}
              aria-label={`Show testimonial ${i + 1} of ${items.length}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
