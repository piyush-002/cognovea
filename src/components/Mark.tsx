import { BANDS, DOTS } from '@/lib/mark-dots';

/**
 * The Cognovea mark, at lockup scale.
 *
 * The dots are the ones in public/logo.png, measured off the artwork by
 * tools/trace-mark.mjs — not a generated approximation of it. That distinction
 * mattered: the previous version was a seeded random scatter tuned to resemble
 * the C, and at 34px in the header it resolved into a smudge with a detached
 * blob near the top, which is not the logo by any reading.
 *
 * SVG rather than an image because the mark appears in the nav, the drawer and
 * the footer of every page, needs to stay crisp from 28px to hero scale, and
 * animates on entry.
 *
 * The dots are grouped into concentric bands rather than carrying their own
 * inline animation offsets. Eight wrapper elements cost nothing; 275 style
 * attributes would have added about 25KB to every page for an effect the
 * stylesheet can express on its own.
 */
export default function Mark({ className = 'logo__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: BANDS }, (_, b) => {
        const dots = DOTS.filter((d) => d.b === b);
        if (!dots.length) return null;
        return (
          <g key={b} className={`mark__band mark__band--${b}`}>
            {dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
