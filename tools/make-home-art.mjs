/**
 * Generates the four "What We Do" pillar illustrations for the homepage.
 *
 * House style is shared with make-service-art.mjs: 800x520, three blurred
 * radial washes in violet, blue and cyan, ink at #0A1024, and a gradient stroke
 * reserved for whatever the drawing is actually about. The frame is repeated
 * here rather than imported because that file exports nothing; if a third
 * generator ever wants it, extract it to tools/lib/ then rather than copying it
 * a third time.
 *
 * The drawings carry no text, for the same two reasons as the service set: a
 * font may not be present when a static asset is rendered, and the real
 * description belongs in the alt attribute where a screen reader reaches it.
 * Each one shows the mechanism its pillar describes — sources resolving into
 * one number, a platform in layers, a forecast with its uncertainty, a loop
 * that stops for a person — rather than a generic network of dots.
 *
 *   node tools/make-home-art.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const VIOLET = '#7C3AED';
const BLUE = '#4F6BF0';
const CYAN = '#22D3EE';
const INK = '#0A1024';
const W = 800;
const H = 520;

const defs = (id) => `
  <defs>
    <radialGradient id="${id}-a" cx="28%" cy="26%" r="56%">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity=".60"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-b" cx="74%" cy="72%" r="52%">
      <stop offset="0%" stop-color="${BLUE}" stop-opacity=".36"/>
      <stop offset="100%" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-c" cx="86%" cy="18%" r="34%">
      <stop offset="0%" stop-color="${CYAN}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-stroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${VIOLET}"/>
      <stop offset="55%" stop-color="${BLUE}"/>
      <stop offset="100%" stop-color="${CYAN}"/>
    </linearGradient>
    <filter id="${id}-blur" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="52"/>
    </filter>
    <marker id="${id}-arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${INK}" fill-opacity=".55"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <g filter="url(#${id}-blur)" opacity="0.85">
    <rect width="${W}" height="${H}" fill="url(#${id}-a)"/>
    <rect width="${W}" height="${H}" fill="url(#${id}-b)"/>
    <rect width="${W}" height="${H}" fill="url(#${id}-c)"/>
  </g>`;

const box = (id, x, y, w, h, { accent = false, r = 10 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"
     fill="#FFFFFF" fill-opacity=".92"
     stroke="${accent ? `url(#${id}-stroke)` : INK}"
     stroke-opacity="${accent ? 1 : 0.18}" stroke-width="${accent ? 2 : 1.25}"/>`;

const rows = (x, y, w, n, gap = 11) =>
  Array.from({ length: n }, (_, i) =>
    `<rect x="${x}" y="${y + i * gap}" width="${(w * (0.55 + ((i * 37) % 45) / 100)).toFixed(1)}"
       height="3.5" rx="1.75" fill="${INK}" fill-opacity="${0.16 + (i % 3) * 0.05}"/>`).join('');

const dot = (cx, cy, r, fill = INK, op = 0.5) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${op}"/>`;

const link = (id, d, { arrow = true, accent = true, dash = null } = {}) =>
  `<path d="${d}" fill="none"
     stroke="${accent ? `url(#${id}-stroke)` : INK}" stroke-opacity="${accent ? 0.85 : 0.22}"
     stroke-width="${accent ? 2.25 : 1.5}" stroke-linecap="round"
     ${dash ? `stroke-dasharray="${dash}"` : ''}
     ${arrow ? `marker-end="url(#${id}-arrow)"` : ''}/>`;

const store = (id, cx, cy, w, h, accent = false) => {
  const rx = w / 2, ry = 12, top = cy - h / 2;
  return `<g>
    <path d="M${cx - rx},${top} v${h} a${rx},${ry} 0 0 0 ${w},0 v-${h}z"
      fill="#FFFFFF" fill-opacity=".92"
      stroke="${accent ? `url(#${id}-stroke)` : INK}" stroke-opacity="${accent ? 1 : 0.18}"
      stroke-width="${accent ? 2 : 1.25}"/>
    <ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}"
      fill="#FFFFFF" stroke="${accent ? `url(#${id}-stroke)` : INK}"
      stroke-opacity="${accent ? 1 : 0.18}" stroke-width="${accent ? 2 : 1.25}"/>
  </g>`;
};

/** Bars, for the one panel in the set that is allowed to look like a chart. */
const bars = (id, x, y, w, h, heights) => {
  const bw = w / (heights.length * 1.75);
  const gap = (w - bw * heights.length) / (heights.length - 1);
  return heights.map((f, i) => {
    const bh = Math.round(h * f);
    const accent = i === heights.length - 1;
    return `<rect x="${(x + i * (bw + gap)).toFixed(1)}" y="${y + h - bh}"
      width="${bw.toFixed(1)}" height="${bh}" rx="3"
      fill="${accent ? `url(#${id}-stroke)` : INK}" fill-opacity="${accent ? 0.9 : 0.22}"/>`;
  }).join('');
};

/** A person, drawn rather than borrowed, for the one gate that is not automatic. */
const person = (cx, cy, s = 1) => `<g transform="translate(${cx},${cy}) scale(${s})">
    <circle cx="0" cy="-7" r="6.4" fill="none" stroke="${INK}" stroke-opacity=".62" stroke-width="2"/>
    <path d="M-11,9 a11,10 0 0 1 22,0" fill="none" stroke="${INK}" stroke-opacity=".62"
      stroke-width="2" stroke-linecap="round"/>
  </g>`;

const svg = (id, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="">
${defs(id)}
${body}
</svg>
`;

/* ========================================================================== */
/* One drawing per pillar. Each shows that pillar's mechanism.                 */
/* ========================================================================== */

/** Five systems that disagree, resolved into one panel everyone reads. */
function seeClearly() {
  const id = 'see';
  let s = '';
  // The scattered sources. Deliberately unaligned widths: five systems that
  // were never designed to be read together.
  const src = [
    [40, 44, 150], [40, 136, 128], [40, 228, 158], [40, 320, 134], [40, 412, 146],
  ];
  src.forEach(([x, y, w]) => {
    s += box(id, x, y, w, 64);
    s += rows(x + 18, y + 18, w - 52, 3);
  });
  // They converge on one join before anything is shown to anybody.
  src.forEach(([x, y, w]) => {
    s += link(id, `M${x + w},${y + 32} C260,${y + 32} 260,260 300,260`, { accent: false, arrow: false });
  });
  s += dot(300, 260, 5.5, INK, 0.3);
  s += link(id, `M306,260 H372`);

  // The single panel: one figure at the top, the detail underneath it.
  s += box(id, 388, 96, 372, 328, { accent: true, r: 14 });
  s += `<rect x="418" y="132" width="132" height="13" rx="6.5" fill="url(#${id}-stroke)" fill-opacity=".9"/>`;
  s += rows(418, 162, 150, 2);
  s += bars(id, 418, 214, 312, 118, [0.42, 0.55, 0.48, 0.71, 0.63, 0.88]);
  s += `<line x1="418" y1="332" x2="730" y2="332" stroke="${INK}" stroke-opacity=".18" stroke-width="1.25"/>`;
  s += rows(418, 356, 240, 4);
  return svg(id, s);
}

/** The platform, read the way it is built: a store, a lane over it, a layer served. */
function foundation() {
  const id = 'fnd';
  let s = '';

  // What arrives. Small, plain, and on the outside: these are somebody else's
  // systems, and the drawing is not about them.
  [[44, 232], [44, 300], [44, 368]].forEach(([x, y]) => {
    s += box(id, x, y, 104, 46);
    s += rows(x + 15, y + 15, 70, 2);
    s += link(id, `M148,${y + 23} C176,${y + 23} 176,412 202,412`, { accent: false, arrow: false });
  });
  s += link(id, `M206,412 H250`, { accent: false });

  // The base stratum: the store everything above it stands on. Accented,
  // because in this pillar the foundation is the subject, not the plumbing.
  s += box(id, 262, 372, 476, 92, { accent: true, r: 14 });
  s += store(id, 336, 418, 96, 52, false);
  s += rows(424, 396, 128, 3);
  s += rows(600, 396, 108, 3);

  // The lane above it: three stages that turn what is stored into what is used.
  s += box(id, 262, 240, 476, 88, { r: 12 });
  [346, 500, 654].forEach((x, i) => {
    s += `<rect x="${x - 40}" y="262" width="80" height="44" rx="8"
      fill="#FFFFFF" fill-opacity=".95" stroke="url(#${id}-stroke)"
      stroke-opacity="${0.45 + i * 0.25}" stroke-width="2"/>`;
    s += dot(x, 284, 3.4, INK, 0.3);
  });
  s += link(id, `M390,284 H454`, { accent: false });
  s += link(id, `M544,284 H608`, { accent: false });

  // The two vertical risers that make this a stack rather than three rows.
  s += link(id, `M346,368 V332`);
  s += link(id, `M654,368 V332`);

  // The top stratum: what people actually open.
  [[262, 108], [432, 108], [602, 108]].forEach(([x, y]) => {
    s += box(id, x, y, 136, 88);
    s += rows(x + 20, y + 22, 92, 3);
    s += link(id, `M${x + 68},236 V${y + 96}`, { accent: false });
  });
  return svg(id, s);
}

/** History, the line that leaves it, and how wide the answer actually is. */
function knowNext() {
  const id = 'nxt';
  const base = 442;
  const now = 392;
  let s = '';

  // Axes, kept to hairlines: this is a forecast, not a chart to be read off.
  s += `<line x1="86" y1="${base}" x2="736" y2="${base}" stroke="${INK}" stroke-opacity=".2" stroke-width="1.25"/>`;
  s += `<line x1="86" y1="96" x2="86" y2="${base}" stroke="${INK}" stroke-opacity=".2" stroke-width="1.25"/>`;

  // The threshold that makes the prediction worth having. Brand-toned, because
  // it is the thing the drawing is about; a grey dash reads as another axis.
  s += `<line x1="86" y1="196" x2="736" y2="196" stroke="${VIOLET}" stroke-opacity=".42"
      stroke-width="1.75" stroke-dasharray="6 7"/>`;

  // Observed history: real points, joined.
  const hist = [[116, 386], [162, 360], [208, 372], [254, 326], [300, 340], [346, 300], [392, 288]];
  s += `<path d="M${hist.map(([x, y]) => `${x},${y}`).join(' L')}" fill="none"
      stroke="${INK}" stroke-opacity=".5" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>`;
  hist.forEach(([x, y]) => { s += dot(x, y, 3.6, INK, 0.45); });

  // Now.
  s += `<line x1="${now}" y1="118" x2="${now}" y2="${base}" stroke="${INK}" stroke-opacity=".3"
      stroke-width="1.5" stroke-dasharray="4 6"/>`;

  // The cone. Stated uncertainty is the point of the drawing: the median alone
  // would be a promise, and the band is what makes it a forecast. The lower
  // bound is pulled well clear of the median so the band reads as a width.
  s += `<path d="M${now},288 C486,242 604,186 736,132 L736,314 C604,318 486,300 ${now},288 Z"
      fill="url(#${id}-stroke)" fill-opacity=".16"/>`;
  s += `<path d="M${now},288 C486,242 604,186 736,132" fill="none" stroke="url(#${id}-stroke)"
      stroke-opacity=".55" stroke-width="1.5"/>`;
  s += `<path d="M${now},288 C486,300 604,318 736,314" fill="none" stroke="url(#${id}-stroke)"
      stroke-opacity=".55" stroke-width="1.5"/>`;
  s += `<path d="M${now},288 C486,258 570,208 736,152" fill="none" stroke="url(#${id}-stroke)"
      stroke-opacity=".95" stroke-width="2.75" stroke-dasharray="8 6" stroke-linecap="round"/>`;

  // Where the median crosses the threshold: the date the forecast is for. The
  // point is measured off the same curve rather than placed by eye.
  const cross = (() => {
    const p0 = [now, 288], p1 = [486, 258], p2 = [570, 208], p3 = [736, 152];
    const at = (t) => {
      const u = 1 - t;
      return [
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ];
    };
    let best = at(0);
    for (let i = 0; i <= 200; i++) {
      const p = at(i / 200);
      if (Math.abs(p[1] - 196) < Math.abs(best[1] - 196)) best = p;
    }
    return best;
  })();
  s += `<circle cx="${cross[0].toFixed(1)}" cy="${cross[1].toFixed(1)}" r="9.5" fill="#FFFFFF"
      stroke="url(#${id}-stroke)" stroke-width="2.5"/>`;
  s += dot(cross[0].toFixed(1), cross[1].toFixed(1), 3.4, VIOLET, 0.95);
  return svg(id, s);
}

/** The loop that runs itself, and the one step it stops for. */
function workSmarter() {
  const id = 'wrk';
  const lane = 214;
  let s = '';

  // Work arriving, as a queue rather than three unrelated cards.
  s += box(id, 52, 150, 132, 140, { r: 12 });
  [166, 210, 254].forEach((y) => {
    s += `<rect x="70" y="${y}" width="96" height="30" rx="7" fill="#FFFFFF" fill-opacity=".95"
        stroke="${INK}" stroke-opacity=".16" stroke-width="1.25"/>`;
    s += rows(82, y + 12, 58, 1);
  });
  s += link(id, `M184,${lane + 6} H228`, { accent: false });

  // Three steps that need nobody.
  const steps = [240, 380, 520];
  steps.forEach((x, i) => {
    s += box(id, x, lane - 26, 96, 56, { accent: i === 1 });
    s += dot(x + 48, lane + 2, 3.6, INK, 0.3);
  });
  s += link(id, `M336,${lane + 2} H374`, { accent: false });
  s += link(id, `M476,${lane + 2} H514`, { accent: false });

  // The one that does not. It leaves the middle step, reaches a person, and
  // comes back to the same step: judgment interrupts the run, it does not
  // replace it.
  s += link(id, `M404,${lane + 30} V330`, { dash: '6 7' });
  s += box(id, 342, 330, 152, 86, { accent: true, r: 12 });
  s += person(382, 373);
  s += rows(410, 360, 62, 3);
  s += link(id, `M494,364 C540,364 540,262 476,${lane + 8}`, { dash: '6 7' });

  // What comes out, with the confirmation inside it rather than floating.
  s += link(id, `M616,${lane + 2} H654`, { accent: false });
  s += box(id, 666, lane - 46, 96, 96, { r: 12 });
  s += rows(686, lane - 24, 58, 3);
  s += `<path d="M688,${lane + 22} l13,13 l24,-27" fill="none" stroke="url(#${id}-stroke)"
      stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;

  // And the arc back to the queue, landing on it.
  s += link(id, `M714,${lane + 50} C714,452 250,470 118,300`, { accent: false, dash: '5 8' });
  return svg(id, s);
}

const OUT = [
  ['hm-see-clearly.svg', seeClearly()],
  ['hm-foundation.svg', foundation()],
  ['hm-know-next.svg', knowNext()],
  ['hm-work-smarter.svg', workSmarter()],
];

const dir = path.join(process.cwd(), 'public/img');
for (const [name, content] of OUT) {
  fs.writeFileSync(path.join(dir, name), content);
  console.log(`  ${name}  ${(content.length / 1024).toFixed(1)}KB`);
}
