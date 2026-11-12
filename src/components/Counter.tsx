'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to `to` when it first scrolls into view, then stops.
 *
 * The final value is rendered on the server and used as the initial state, so
 * the number is correct in the HTML, correct for crawlers, correct with JS off,
 * and correct if the observer never fires. The animation only ever replays a
 * value the reader would have seen anyway.
 */
export default function Counter({
  to,
  prefix = '',
  suffix = '',
  duration = 1400,
  locale = 'en-US',
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  /**
   * Number grouping. 'en-IN' for a rupee figure, where 150000 is written
   * 1,50,000 rather than 150,000; the default is right for everything else.
   */
  locale?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(to);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          // easeOutExpo, fast out of the gate, settles gently on the number
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setValue(Math.round(to * eased));
          if (t < 1) requestAnimationFrame(tick);
          else setValue(to);
        };

        setValue(0);
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString(locale)}
      {suffix}
    </span>
  );
}
