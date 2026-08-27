/**
 * The Cognovea mark: an open ring of points that reads as a C, dense along the
 * stroke, fraying and dissolving outward toward the aperture, which faces right.
 *
 * Ported from the live cognovea.com coming-soon page so the mark on this site is
 * the same object, not a lookalike. The colour read is diagonal: violet at the
 * top-left, through the mid blue, to cyan at the lower-right.
 *
 * The generator is seeded rather than using Math.random, because the small
 * lockup mark is rendered on the server. An unseeded version would produce
 * different points on server and client and trip a hydration mismatch.
 */

export const BRAND = {
  violet: [124, 58, 237] as const, // #7C3AED
  mid: [79, 107, 240] as const, // #4F6BF0
  cyan: [34, 211, 238] as const, // #22D3EE
};

/** Aperture faces right: the arc runs from 54° to 306°. */
const A0 = (54 * Math.PI) / 180;
const A1 = (306 * Math.PI) / 180;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Two-stop interpolation across the brand ramp. */
export function shade(k: number): string {
  const [a, b, f] =
    k < 0.5 ? [BRAND.violet, BRAND.mid, k / 0.5] : [BRAND.mid, BRAND.cyan, (k - 0.5) / 0.5];
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(
    a[2] + (b[2] - a[2]) * f,
  )})`;
}

export type MarkPoint = {
  /** Resting position. */
  x: number;
  y: number;
  /** Scatter origin, used as the animation's starting offset. */
  sx: number;
  sy: number;
  r: number;
  c: string;
  a: number;
};

/**
 * @param size    viewport edge in user units
 * @param count   how many points to attempt (some are culled at the tips)
 * @param seed    any integer; the same seed always yields the same mark
 * @param rScale  radius multiplier. The hero renders at 400px+ where the native
 *                radii are right; a 34px lockup needs far fewer, far larger
 *                dots or the mark degrades into a grey smudge.
 */
export function buildMark(size: number, count: number, seed = 7, rScale = 1): MarkPoint[] {
  const rnd = mulberry32(seed);
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.295;
  const mid = (A0 + A1) / 2;
  const out: MarkPoint[] = [];

  for (let i = 0; i < count; i++) {
    const ang = A0 + rnd() * (A1 - A0);

    // Proximity to the arc's midpoint: the stroke is densest there and frays
    // as it approaches either tip.
    const near = 1 - Math.abs(ang - mid) / ((A1 - A0) / 2);

    const u = rnd();
    let off: number;
    let core: number;
    if (u < 0.6) {
      off = (rnd() - 0.5) * size * 0.08; // the stroke itself
      core = 1;
    } else if (u < 0.87) {
      off = (rnd() * 0.55 + 0.28) * size * 0.1 * (rnd() < 0.42 ? -1 : 1); // first fray
      core = 0.6;
    } else {
      off = (rnd() * 1.05 + 0.42) * size * 0.115; // outer dissolve, always outward
      core = 0.22;
    }

    // Tips shed more of their outer particles than the body does.
    if (core < 1 && rnd() > near * 0.62 + 0.34) continue;

    const rad = R + off;
    const x = cx + Math.cos(ang) * rad;
    const y = cy - Math.sin(ang) * rad;

    const r =
      (core === 1
        ? size * (0.0068 + rnd() * 0.0072)
        : size * (0.003 + rnd() * 0.0052 * core + 0.0012)) * rScale;

    const k = Math.max(0, Math.min(1, ((x - cx) / R + (y - cy) / R) / 3.4 + 0.5));

    out.push({
      x,
      y,
      sx: cx + (rnd() - 0.5) * size * 1.5,
      sy: cy + (rnd() - 0.5) * size * 1.5,
      r,
      c: shade(k),
      a: core === 1 ? 0.94 : 0.3 + core * 0.52,
    });
  }

  return out;
}
