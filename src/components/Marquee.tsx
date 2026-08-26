import type { ReactNode } from 'react';

/**
 * Infinite horizontal scroll. Pure CSS — the track is rendered twice and
 * translated -50%, so the seam is invisible and no JavaScript runs.
 * Pauses on hover, and prefers-reduced-motion stops it entirely (globals.css).
 *
 * A server component on purpose: this sits high on the page and should paint
 * with the HTML rather than wait for hydration.
 */
export default function Marquee({
  items,
  duration = 42,
  label,
}: {
  items: ReactNode[];
  /** Seconds for one full pass. Longer = slower. */
  duration?: number;
  label: string;
}) {
  const run = (key: string) =>
    items.map((item, i) => (
      <span className="marquee__item" key={`${key}-${i}`}>
        <span className="marquee__dot" aria-hidden="true" />
        {item}
      </span>
    ));

  return (
    <div className="marquee" role="group" aria-label={label}>
      <div
        className="marquee__track"
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {run('a')}
        {/* Duplicate is decorative — the first pass already carries the content. */}
        <span aria-hidden="true" style={{ display: 'contents' }}>
          {run('b')}
        </span>
      </div>
    </div>
  );
}
