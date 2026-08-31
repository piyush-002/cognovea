/**
 * Turns public/logo.png into src/lib/mark-dots.ts.
 *
 * Why this exists
 * ---------------
 * The mark used to be *generated*: a seeded random scatter tuned by eye until it
 * looked like the Cognovea C. It was a lookalike, and at 34px in the header it
 * read as a smudge with a detached blob rather than as the logo. A brand mark is
 * not a thing to approximate — it is a fixed piece of artwork.
 *
 * So the mark is now measured off the artwork itself. Every dot in the logo is
 * a flat-coloured disc on white, which makes them recoverable exactly: peel the
 * largest inscribed circle out of the ink repeatedly and you get back the discs
 * the designer drew, with their real positions, radii and colours.
 *
 * The output is a data module rather than an <img> because the header, drawer,
 * footer and hero all animate the dots individually, and because a vector mark
 * stays crisp at 28px and at 520px from one source.
 *
 * Reproducing it
 * --------------
 *   node tools/trace-mark.mjs            # rewrites src/lib/mark-dots.ts
 *   node tools/trace-mark.mjs --check    # fails if the file is out of date
 *
 * Run it if public/logo.png is ever replaced. tools/test-mark.mjs asserts the
 * committed data still reproduces the artwork, so a new logo with a stale data
 * file is a test failure rather than a silently wrong header.
 *
 * The image decoding and the arithmetic both happen inside headless Chromium.
 * That is not perversity: the repo already needs Playwright for its UI tests,
 * and a canvas is the only PNG decoder available without adding a dependency to
 * a production project for the sake of a build script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { requirePlaywright } from './lib/playwright.mjs';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(root, 'public/logo.png');
const OUT = path.join(root, 'src/lib/mark-dots.ts');
const check = process.argv.includes('--check');

/** Supersample before measuring: the smallest dots are ~3px across at 1x. */
const SCALE = 4;
/** Ink is anything meaningfully off-white. The artwork is on flat white. */
const INK = 40;
/** Below this radius (in source pixels) it is an antialiasing crumb, not a dot. */
const MIN_R = 1.35;

/**
 * Everything below runs in the browser, against a decoded logo.png.
 *
 * The algorithm: while the ink holds a disc of at least MIN_R, take the largest
 * one, record it, and remove it. "Largest inscribed disc" is the maximum of the
 * Euclidean distance transform, so each pass is one EDT and one argmax. Dots
 * that overlap in the artwork come apart correctly because removing the first
 * changes the distance field the second is measured in.
 */
async function trace(page) {
  const dataUri = 'data:image/png;base64,' + fs.readFileSync(SRC).toString('base64');
  return page.evaluate(
    async ({ dataUri, SCALE, INK, MIN_R }) => {
      const img = new Image();
      img.src = dataUri;
      await img.decode();

      const W = img.width * SCALE;
      const H = img.height * SCALE;
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H).data;

      /** Off-white by more than INK on any channel. */
      const isInk = (i) => {
        const o = i * 4;
        return 255 - Math.min(px[o], px[o + 1], px[o + 2]) > INK;
      };

      // The lockup is the mark stacked over the wordmark, separated by a band of
      // blank rows. Split on the widest blank band so the wordmark's letterforms
      // are never fed to a circle finder.
      const rowHas = new Uint8Array(H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (isInk(y * W + x)) {
            rowHas[y] = 1;
            break;
          }
        }
      }
      const first = rowHas.indexOf(1);
      const last = rowHas.lastIndexOf(1);
      let gap = { start: -1, len: 0 };
      for (let y = first, run = -1; y <= last; y++) {
        if (!rowHas[y]) {
          if (run < 0) run = y;
          if (y - run + 1 > gap.len) gap = { start: run, len: y - run + 1 };
        } else run = -1;
      }
      if (gap.start < 0) throw new Error('no blank band between mark and wordmark');
      const y0 = first;
      const y1 = gap.start; // exclusive

      const w = W;
      const h = y1 - y0;
      const mask = new Uint8Array(w * h);
      let inkCount = 0;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          if (isInk((y + y0) * W + x)) {
            mask[y * w + x] = 1;
            inkCount++;
          }
      if (!inkCount) throw new Error('mark region is empty');

      /**
       * Exact squared Euclidean distance transform (Felzenszwalb & Huttenlocher).
       * Two passes of a 1-D lower-envelope transform, columns then rows.
       */
      const INF = 1e20;
      const f = new Float64Array(Math.max(w, h));
      const d = new Float64Array(Math.max(w, h));
      const v = new Int32Array(Math.max(w, h));
      const z = new Float64Array(Math.max(w, h) + 1);

      const edt1d = (n) => {
        let k = 0;
        v[0] = 0;
        z[0] = -INF;
        z[1] = INF;
        for (let q = 1; q < n; q++) {
          let s;
          for (;;) {
            const p = v[k];
            s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
            if (s > z[k]) break;
            k--;
          }
          k++;
          v[k] = q;
          z[k] = s;
          z[k + 1] = INF;
        }
        for (let q = 0, kk = 0; q < n; q++) {
          while (z[kk + 1] < q) kk++;
          const p = v[kk];
          d[q] = (q - p) * (q - p) + f[p];
        }
      };

      const sq = new Float64Array(w * h);
      const edt = () => {
        for (let x = 0; x < w; x++) {
          for (let y = 0; y < h; y++) f[y] = mask[y * w + x] ? INF : 0;
          edt1d(h);
          for (let y = 0; y < h; y++) sq[y * w + x] = d[y];
        }
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) f[x] = sq[y * w + x];
          edt1d(w);
          for (let x = 0; x < w; x++) sq[y * w + x] = d[x];
        }
      };

      const dots = [];
      for (let guard = 0; guard < 5000; guard++) {
        edt();
        let best = 0;
        let bi = -1;
        for (let i = 0; i < sq.length; i++)
          if (sq[i] > best) {
            best = sq[i];
            bi = i;
          }
        const r = Math.sqrt(best);
        if (bi < 0 || r < MIN_R * SCALE) break;

        const cx = bi % w;
        const cy = (bi / w) | 0;
        // Clear slightly beyond the measured radius: the disc's own antialiased
        // rim is ink too, and leaving it behind seeds a ring of phantom crumbs.
        const clear = r * 1.15;
        const cl2 = clear * clear;
        let rs = 0;
        let gs = 0;
        let bs = 0;
        let n = 0;
        const x0 = Math.max(0, Math.floor(cx - clear));
        const x1 = Math.min(w - 1, Math.ceil(cx + clear));
        const yy0 = Math.max(0, Math.floor(cy - clear));
        const yy1 = Math.min(h - 1, Math.ceil(cy + clear));
        for (let y = yy0; y <= yy1; y++) {
          for (let x = x0; x <= x1; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy > cl2) continue;
            const i = y * w + x;
            if (mask[i]) {
              // Colour from the disc's core only. Its rim is blended with the
              // white behind it, and averaging that in washes every dot out.
              if (dx * dx + dy * dy < r * r * 0.45) {
                const o = ((y + y0) * W + x) * 4;
                rs += px[o];
                gs += px[o + 1];
                bs += px[o + 2];
                n++;
              }
              mask[i] = 0;
            }
          }
        }
        if (!n) continue;
        dots.push({
          x: cx / SCALE,
          y: (cy + y0) / SCALE,
          r: r / SCALE,
          c: [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)],
        });
      }
      return dots;
    },
    { dataUri, SCALE, INK, MIN_R },
  );
}

/** Normalise into a centred 0-100 box so the SVG viewBox is size-independent. */
function normalise(dots) {
  const minX = Math.min(...dots.map((d) => d.x - d.r));
  const maxX = Math.max(...dots.map((d) => d.x + d.r));
  const minY = Math.min(...dots.map((d) => d.y - d.r));
  const maxY = Math.max(...dots.map((d) => d.y + d.r));
  const side = Math.max(maxX - minX, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const k = 100 / side;
  const round = (n, p) => Number(n.toFixed(p));
  return dots
    .map((d) => ({
      x: round((d.x - cx) * k + 50, 2),
      y: round((d.y - cy) * k + 50, 2),
      r: round(d.r * k, 3),
      c: `#${d.c.map((v) => v.toString(16).padStart(2, '0')).join('')}`,
    }))
    // Largest first is the paint order the artwork uses, and it keeps the
    // biggest dots off the top of the smaller ones at low resolution.
    .sort((a, b) => b.r - a.r);
}

/**
 * Ring bands, used only by the CSS entrance.
 *
 * The mark is concentric by construction, so banding by distance from centre
 * gives the animation something structural to stagger along: the outer haze
 * settles last. Eight is enough to read as a ripple and few enough that the
 * delays can live in the stylesheet instead of on every circle.
 */
function band(d, bands = 8) {
  const dist = Math.hypot(d.x - 50, d.y - 50);
  return Math.min(bands - 1, Math.floor((dist / 50) * bands));
}

function emit(dots) {
  const body = dots
    .map((d) => `  { x: ${d.x}, y: ${d.y}, r: ${d.r}, c: '${d.c}', b: ${band(d)} },`)
    .join('\n');
  return `/**
 * The Cognovea mark, measured off public/logo.png.
 *
 * GENERATED — do not edit by hand. Run \`node tools/trace-mark.mjs\` after
 * changing the logo, and \`node tools/test-mark.mjs\` to prove the data still
 * reproduces the artwork.
 *
 * Coordinates are in a 100x100 box with the mark centred and fitted, so a
 * consumer only chooses a size. \`b\` is the ring band, outward from the centre,
 * which the entrance animation staggers along.
 */
export type Dot = {
  x: number;
  y: number;
  r: number;
  /** The colour the designer used, not a ramp we recomputed. */
  c: string;
  /** Ring band, 0 (innermost) to ${BANDS - 1}. */
  b: number;
};

export const BANDS = ${BANDS};

export const DOTS: readonly Dot[] = [
${body}
];
`;
}

const BANDS = 8;

const { chromium, launchOpts } = await requirePlaywright('trace-mark');
const browser = await chromium.launch(launchOpts);
const page = await (await browser.newContext()).newPage();
await page.setContent('<!doctype html><meta charset="utf-8">');
const raw = await trace(page);
await browser.close();

if (raw.length < 80) throw new Error(`only ${raw.length} dots found — the threshold is probably wrong`);

const next = emit(normalise(raw));
const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';

if (check) {
  if (current !== next) {
    console.log('FAIL  src/lib/mark-dots.ts is out of date. Run: node tools/trace-mark.mjs');
    process.exit(1);
  }
  console.log(`  ok    mark-dots.ts matches public/logo.png (${raw.length} dots)`);
} else {
  fs.writeFileSync(OUT, next);
  console.log(`wrote src/lib/mark-dots.ts — ${raw.length} dots`);
}
