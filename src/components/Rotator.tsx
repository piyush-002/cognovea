'use client';

import { useEffect, useState } from 'react';

/**
 * Cycles a word or phrase inside a headline.
 *
 * All variants are rendered and stacked in one grid cell, so the headline never
 * reflows as they swap and the layout reserves room for the longest one. The
 * inactive variants are hidden from assistive tech; the first is always in the
 * DOM as the readable version.
 */
export default function Rotator({ words, interval = 2800 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="rotator">
      {words.map((w, k) => (
        <span
          key={w}
          className={`rotator__item grad${k === i ? ' is-active' : ''}`}
          aria-hidden={k === i ? undefined : true}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
