import { buildMark } from '@/lib/mark';

/**
 * The small lockup mark. An SVG rendering of the same particle C used on the
 * hero canvas, sized for the nav, drawer and footer.
 *
 * SVG rather than canvas here because there are several instances on every
 * page and none of them need interaction; this way they paint with the HTML and
 * cost nothing at runtime. The points are seeded, so server and client agree.
 *
 * Each point animates in from its scatter origin on a stagger, which is the
 * same scatter → resolve idea as the hero, compressed into 34px.
 */

const SIZE = 100;
// Sparse and chunky: at 34px the native point size renders under half a pixel,
// so the lockup uses roughly half the points at ~3x the radius.
const POINTS = buildMark(SIZE, 58, 11, 3.2);

export default function Mark({ className = 'logo__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      {POINTS.map((p, i) => (
        <circle
          key={i}
          className="mark__dot"
          cx={p.x.toFixed(2)}
          cy={p.y.toFixed(2)}
          r={p.r.toFixed(2)}
          fill={p.c}
          style={{
            opacity: p.a,
            ['--dx' as string]: `${(p.sx - p.x).toFixed(1)}px`,
            ['--dy' as string]: `${(p.sy - p.y).toFixed(1)}px`,
            ['--d' as string]: `${(i % 14) * 34}ms`,
            ['--o' as string]: p.a,
          }}
        />
      ))}
    </svg>
  );
}
