/**
 * Generates the five service-page illustrations.
 *
 * Written as a generator rather than five hand-authored SVG files for the same
 * reason src/lib/services is data: the set has a house style — 800x520, three
 * blurred radial washes in violet, blue and cyan, a gradient stroke, ink at
 * #0A1024 — and hand-authoring five of anything is how the fifth ends up
 * looking different from the first.
 *
 * The drawings carry no text. They are decorative (aria-label is empty), and
 * the real description lives in the alt attribute on the <img>, where a screen
 * reader will actually reach it. Text inside an SVG would also depend on a font
 * being present at render time, which for a static asset it may not be.
 *
 *   node tools/make-service-art.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const VIOLET = '#7C3AED';
const BLUE = '#4F6BF0';
const CYAN = '#22D3EE';
const INK = '#0A1024';
const W = 800;
const H = 520;

/* --- the shared wash every illustration in this set opens with -------------- */
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

/** A panel. `accent` gives it the gradient stroke, which marks it as the subject. */
const box = (id, x, y, w, h, { accent = false, r = 10 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"
     fill="#FFFFFF" fill-opacity=".92"
     stroke="${accent ? `url(#${id}-stroke)` : INK}"
     stroke-opacity="${accent ? 1 : 0.18}" stroke-width="${accent ? 2 : 1.25}"/>`;

/** Rows of varying length, which read as records without being text. */
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

/** A cylinder, the one shape everyone reads as "a store of data". */
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

const svg = (id, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="">
${defs(id)}
${body}
</svg>
`;

/* ========================================================================== */
/* Each drawing shows the mechanism the page describes, not a generic network. */
/* ========================================================================== */

/** ECC records pass three gates; some are archived rather than migrated. */
function sapReadiness() {
  const id = 'sap';
  let s = '';
  // Three source systems on the left.
  [90, 210, 330].forEach((y, i) => {
    s += box(id, 56, y, 150, 92);
    s += rows(76, y + 22, 110, 5);
    s += link(id, `M206,${y + 46} H268`, { accent: false });
    void i;
  });
  // The three gates: profile, cleanse, validate.
  [300, 380, 460].forEach((x, i) => {
    s += `<rect x="${x}" y="96" width="18" height="300" rx="9"
        fill="#FFFFFF" fill-opacity=".95" stroke="url(#${id}-stroke)"
        stroke-opacity="${0.55 + i * 0.22}" stroke-width="2"/>`;
    for (let k = 0; k < 5; k++) s += dot(x + 9, 130 + k * 66, 3.2, INK, 0.3);
  });
  // What survives all three continues to the target.
  s += link(id, `M268,136 C300,136 470,136 502,180`);
  s += link(id, `M268,256 H502`);
  s += link(id, `M268,376 C300,376 470,376 502,332`);
  // What does not: archived, drawn leaving the flow.
  s += link(id, `M478,300 C500,340 500,400 540,432`, { accent: false, dash: '5 6' });
  s += store(id, 596, 256, 150, 150, true);
  s += rows(548, 232, 96, 4);
  s += store(id, 612, 448, 96, 46);
  return svg(id, s);
}

/** Field telemetry crosses a one-way boundary; the control side is never written to. */
function scada() {
  const id = 'scada';
  let s = '';
  // Field devices.
  [110, 190, 270, 350].forEach((y) => {
    s += dot(78, y, 7, INK, 0.42);
    s += link(id, `M92,${y} H150`, { accent: false });
  });
  s += box(id, 150, 86, 132, 300);
  s += rows(172, 120, 92, 12, 20);
  // The boundary. Dashed, and crossed by exactly one arrow, pointing out.
  s += `<line x1="330" y1="52" x2="330" y2="468" stroke="${INK}" stroke-opacity=".28"
      stroke-width="1.5" stroke-dasharray="7 7"/>`;
  s += link(id, `M282,236 H408`);
  s += store(id, 470, 236, 116, 150, true);
  // Out to the things people actually read.
  [120, 236, 352].forEach((y) => {
    s += link(id, `M528,236 C580,236 596,${y} 640,${y}`, { accent: y === 236 });
    s += box(id, 640, y - 40, 116, 80, { accent: y === 236 });
    s += rows(660, y - 20, 76, 3);
  });
  return svg(id, s);
}

/** Three sources that currently disagree, resolved into one figure. */
function oilGas() {
  const id = 'og';
  let s = '';
  [80, 214, 348].forEach((y) => {
    s += box(id, 56, y, 168, 100);
    s += rows(78, y + 24, 124, 5);
    s += link(id, `M224,${y + 50} C300,${y + 50} 320,258 372,258`);
  });
  s += box(id, 372, 190, 150, 136, { accent: true });
  s += rows(396, 224, 102, 6);
  s += link(id, `M522,258 H586`);
  s += box(id, 586, 168, 158, 180, { accent: true, r: 12 });
  // One agreed figure, drawn as a single emphasised bar over supporting rows.
  s += `<rect x="612" y="200" width="106" height="10" rx="5" fill="url(#${id}-stroke)"/>`;
  s += rows(612, 232, 106, 7);
  return svg(id, s);
}

/** Several plants that differ, compared without being pretended identical. */
function manufacturing() {
  const id = 'mfg';
  let s = '';
  [70, 202, 334].forEach((y, i) => {
    s += box(id, 56, y, 190, 108);
    // Machine states differ per plant, which is the point of the drawing.
    for (let k = 0; k < 6; k++) {
      s += dot(84 + k * 28, y + 34, 6, INK, k <= i + 2 ? 0.5 : 0.16);
    }
    s += rows(80, y + 58, 130, 3);
    s += link(id, `M246,${y + 54} C320,${y + 54} 340,258 396,258`);
  });
  s += box(id, 396, 150, 168, 216, { accent: true });
  // A grid: the joined view, where plants become comparable rows.
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      s += `<rect x="${420 + c * 32}" y="${180 + r * 28}" width="22" height="9" rx="4.5"
          fill="${INK}" fill-opacity="${0.1 + ((r + c) % 4) * 0.09}"/>`;
    }
  }
  s += link(id, `M564,258 H620`);
  s += box(id, 620, 196, 124, 124, { accent: true });
  s += `<path d="M642,292 L672,254 L698,272 L724,224" fill="none" stroke="url(#${id}-stroke)"
      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(id, s);
}

/** One accountable owner between the board, the team and outside vendors. */
function fractional() {
  const id = 'frac';
  let s = '';
  // The board, above.
  s += box(id, 300, 56, 200, 74);
  s += rows(324, 80, 140, 3);
  // The team, below left.
  [[70, 372], [178, 372], [286, 372]].forEach(([x, y]) => {
    s += box(id, x, y, 86, 86);
    s += dot(x + 43, y + 32, 11, INK, 0.32);
    s += rows(x + 20, y + 56, 46, 2);
  });
  // Vendors, to the right.
  [[640, 130], [640, 236], [640, 342]].forEach(([x, y]) => {
    s += box(id, x, y, 104, 76);
    s += rows(x + 20, y + 26, 64, 3);
  });
  // The seat itself. The only accented node, and every line meets it.
  s += box(id, 322, 200, 156, 128, { accent: true, r: 14 });
  s += dot(400, 244, 20, 'url(#frac-stroke)', 0.9);
  s += rows(346, 286, 108, 3);
  s += link(id, `M400,200 V130`, { arrow: false });
  /* Every one of these starts at the seat's own bottom edge. Starting them at
     the team's x put the first two in empty space, which drew a relationship
     that is not there — the whole point of the picture is that all of it meets
     in one place. */
  [113, 221, 329].forEach((x) => {
    s += link(id, `M400,328 C400,352 ${x},348 ${x},372`, { arrow: false, accent: false });
  });
  [168, 274, 380].forEach((y) => {
    s += link(id, `M478,264 C560,264 580,${y} 640,${y}`, { arrow: false, accent: false });
  });
  return svg(id, s);
}


/** EBS objects prepared once, loaded through two loaders, cycled, reconciled. */
function oracleFusion() {
  const id = 'ora';
  let s = '';
  // Conversion objects on the left.
  [64, 196, 328].forEach((y) => {
    s += box(id, 44, y, 132, 88);
    s += rows(62, y + 22, 96, 4);
    s += link(id, `M176,${y + 44} C214,${y + 44} 214,244 246,244`, { accent: false });
  });
  // The prepared layer: where mapping and cleansing decisions are recorded.
  s += box(id, 246, 176, 104, 136, { accent: true });
  s += rows(268, 208, 62, 6);

  // Two loaders, which take different objects and behave differently.
  [[404, 128], [404, 300]].forEach(([x, y]) => {
    s += link(id, `M350,244 C378,244 380,${y + 44} ${x},${y + 44}`);
    s += box(id, x, y, 126, 88);
    for (let k = 0; k < 3; k++) s += dot(x + 30 + k * 33, y + 44, 5, INK, 0.35);
    s += link(id, `M${x + 126},${y + 44} C560,${y + 44} 566,244 596,244`);
  });

  // The target.
  s += store(id, 668, 244, 128, 150, true);
  s += rows(624, 220, 88, 4);

  // The mock cycle: the loop that has to run more than once.
  s += link(id, `M668,326 C640,404 360,412 298,326`, { dash: '6 7', accent: false });

  // Reconciliation against the legacy ledger, drawn as the last check.
  s += box(id, 246, 396, 104, 72);
  s += rows(266, 418, 64, 3);
  s += link(id, `M350,432 H596`, { accent: false, dash: '4 6' });
  s += `<path d="M612,432 l14,14 l26,-30" fill="none" stroke="url(#${id}-stroke)"
      stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg(id, s);
}

const OUT = [
  ['sv-sap-readiness.svg', sapReadiness()],
  ['sv-oracle-fusion.svg', oracleFusion()],
  ['sv-scada.svg', scada()],
  ['sv-oilgas.svg', oilGas()],
  ['sv-manufacturing.svg', manufacturing()],
  ['sv-fractional.svg', fractional()],
];

const dir = path.join(process.cwd(), 'public/img');
for (const [name, content] of OUT) {
  fs.writeFileSync(path.join(dir, name), content);
  console.log(`  ${name}  ${(content.length / 1024).toFixed(1)}KB`);
}
