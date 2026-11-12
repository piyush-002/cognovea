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

/** Bars, for the panels that are standing in for a chart. The last one is
    accented, because in every one of these drawings it is the figure that
    matters rather than the series. */
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

/** A goal broken into tasks, checked, and stopped at a person before it lands. */
function agentic() {
  const id = 'agt';
  let s = '';

  // The request arriving as a goal rather than as a script.
  s += box(id, 56, 232, 104, 56);
  s += rows(74, 250, 68, 2);
  s += link(id, `M160,260 H190`, { accent: false });

  // The planner. Accented: deciding the plan is the thing RPA cannot do.
  s += box(id, 196, 220, 104, 80, { accent: true, r: 12 });
  s += dot(248, 248, 3.4, INK, 0.32);
  s += rows(216, 264, 64, 2);

  // Workers, fanned out, doing one thing each.
  const workers = [96, 228, 360];
  workers.forEach((y) => {
    s += box(id, 348, y, 108, 64);
    s += rows(366, y + 20, 72, 3);
    s += link(id, `M300,260 C322,260 326,${y + 32} 342,${y + 32}`, { accent: false, arrow: true });
    s += link(id, `M456,${y + 32} C480,${y + 32} 486,260 502,260`, { accent: false, arrow: false });
  });

  // The reviewer: the step that stops an agent marking its own homework.
  s += box(id, 508, 220, 104, 80, { r: 12 });
  s += `<path d="M534,256 l12,12 l22,-26" fill="none" stroke="url(#${id}-stroke)"
      stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += rows(528, 278, 64, 1);
  s += link(id, `M612,260 H642`, { accent: false });

  // What lands, once it has been checked and approved.
  s += box(id, 648, 228, 92, 64);
  s += rows(666, 248, 56, 3);

  // The high-risk branch: down to a person, and only then onward.
  s += link(id, `M560,300 V396`, { dash: '6 7' });
  s += box(id, 452, 396, 164, 76, { accent: true, r: 12 });
  s += `<g transform="translate(486,434)">
      <circle cx="0" cy="-7" r="6.4" fill="none" stroke="${INK}" stroke-opacity=".62" stroke-width="2"/>
      <path d="M-11,9 a11,10 0 0 1 22,0" fill="none" stroke="${INK}" stroke-opacity=".62"
        stroke-width="2" stroke-linecap="round"/>
    </g>`;
  s += rows(514, 422, 76, 3);
  s += link(id, `M616,434 C664,434 694,400 694,300`, { dash: '6 7' });

  // The audit trail: every decision written down, which is what makes the rest
  // of it signable off.
  s += box(id, 56, 396, 264, 76, { r: 12 });
  [0, 1, 2].forEach((i) => {
    const y = 414 + i * 20;
    s += dot(78, y, 3.2, INK, 0.3);
    s += rows(94, y - 2, 196, 1);
  });
  s += link(id, `M248,300 V390`, { accent: false, dash: '4 7' });
  s += link(id, `M320,434 H446`, { accent: false, arrow: false, dash: '4 7' });
  return svg(id, s);
}

/** Your data, the boundary around it, and the business on the other side. */
function enterpriseAi() {
  const id = 'eai';
  let s = '';

  // The perimeter. Drawn first and dashed, because the whole argument of this
  // page is that the boundary is where the engineering is.
  s += `<rect x="56" y="88" width="468" height="352" rx="18" fill="#FFFFFF" fill-opacity=".55"
      stroke="url(#${id}-stroke)" stroke-opacity=".75" stroke-width="2" stroke-dasharray="9 8"/>`;

  // Inside: what is yours. Sources into a store.
  [[88, 132], [88, 196], [88, 260]].forEach(([x, y]) => {
    s += box(id, x, y, 92, 44);
    s += rows(x + 14, y + 15, 58, 2);
    s += link(id, `M180,${y + 22} C212,${y + 22} 214,322 232,322`, { accent: false, arrow: false });
  });
  s += store(id, 286, 330, 104, 96, true);

  // Inside: the architecture that reads it. Three stages, stacked.
  [140, 212, 284].forEach((y, i) => {
    s += box(id, 372, y, 128, 52);
    s += dot(392, y + 26, 3.4, INK, 0.3);
    s += rows(406, y + 18, 76, 2);
    if (i > 0) s += link(id, `M436,${y} V${y - 20}`, { accent: false, arrow: false });
  });
  s += link(id, `M340,324 C356,324 356,312 366,310`);

  // The one controlled way out. Everything crosses here or not at all.
  s += `<circle cx="524" cy="264" r="18" fill="#FFFFFF" stroke="url(#${id}-stroke)" stroke-width="2.5"/>`;
  s += dot(524, 264, 4.5, VIOLET, 0.9);
  s += link(id, `M500,236 C512,236 518,250 522,258`, { accent: false, arrow: false });

  // Outside: the business, served without the data leaving.
  [[600, 150], [600, 240], [600, 330]].forEach(([x, y]) => {
    s += box(id, x, y, 144, 68);
    s += rows(x + 20, y + 22, 96, 3);
    s += link(id, `M542,264 C566,264 572,${y + 34} 594,${y + 34}`, { accent: false });
  });
  return svg(id, s);
}

/** One trusted figure, and the two layers that are the reason you can trust it. */
function dataQuality() {
  const id = 'dqg';
  let s = '';

  // The number leadership actually reads. Accented: everything below exists so
  // that this one is right the first time.
  s += box(id, 430, 66, 250, 132, { accent: true, r: 14 });
  s += `<rect x="458" y="96" width="104" height="14" rx="7" fill="url(#${id}-stroke)" fill-opacity=".9"/>`;
  s += rows(458, 126, 118, 2);
  s += bars(id, 458, 150, 190, 32, [0.5, 0.68, 0.58, 0.82]);

  // The quality layer: accuracy, completeness, consistency, timeliness.
  s += box(id, 206, 244, 474, 88, { r: 12 });
  [258, 372, 486, 600].forEach((x) => {
    s += `<circle cx="${x}" cy="288" r="15" fill="#FFFFFF" stroke="${INK}" stroke-opacity=".2" stroke-width="1.25"/>`;
    s += `<path d="M${x - 6},${288} l4.5,4.5 l8,-9.5" fill="none" stroke="url(#${id}-stroke)"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  });

  // The governance layer: an owner, a written rule, and the trail back.
  s += box(id, 206, 368, 474, 96, { r: 12 });
  s += `<g transform="translate(258,416)">
      <circle cx="0" cy="-7" r="6.4" fill="none" stroke="${INK}" stroke-opacity=".62" stroke-width="2"/>
      <path d="M-11,9 a11,10 0 0 1 22,0" fill="none" stroke="${INK}" stroke-opacity=".62"
        stroke-width="2" stroke-linecap="round"/>
    </g>`;
  s += `<rect x="318" y="392" width="58" height="48" rx="7" fill="#FFFFFF" fill-opacity=".95"
      stroke="url(#${id}-stroke)" stroke-opacity=".8" stroke-width="1.75"/>`;
  s += rows(330, 404, 34, 3, 9);
  s += rows(406, 400, 232, 3, 13);

  // The source the figure came from, and the lineage back to it.
  s += store(id, 110, 416, 92, 72, false);
  s += link(id, `M156,416 H196`, { accent: false, dash: '5 7' });

  // Bottom to top: source, governed, checked, reported.
  s += link(id, `M600,368 V336`, { arrow: false, accent: false });
  s += link(id, `M286,368 V336`, { arrow: false, accent: false });
  s += link(id, `M600,244 V200`, { arrow: false, accent: false });
  s += link(id, `M470,244 V200`, { arrow: false, accent: false });
  return svg(id, s);
}

/** Source, foundation, analysis, insight, decision — the page's own spine. */
function dataAnalytics() {
  const id = 'dan';
  let s = '';

  // Where it starts: systems that were never meant to be read together.
  [140, 236, 332].forEach((y) => {
    s += box(id, 56, y, 88, 50);
    s += rows(70, y + 17, 56, 2);
    s += link(id, `M144,${y + 25} C166,${y + 25} 168,256 184,256`, { accent: false, arrow: false });
  });

  // The foundation. Accented, because the argument of the page is that this is
  // what decides whether anything above it can be trusted.
  s += box(id, 190, 134, 116, 244, { accent: true, r: 14 });
  s += store(id, 248, 214, 80, 64, false);
  s += rows(212, 272, 72, 4);
  s += link(id, `M306,256 H338`, { accent: false });

  // The analysis sitting on it.
  s += box(id, 350, 158, 168, 196, { r: 12 });
  s += rows(372, 184, 108, 2);
  s += bars(id, 372, 220, 124, 94, [0.44, 0.6, 0.52, 0.78]);
  s += link(id, `M518,256 H552`, { accent: false });

  // The insight: the one reading that changes what somebody does.
  s += `<circle cx="578" cy="256" r="20" fill="#FFFFFF" stroke="url(#${id}-stroke)" stroke-width="2.5"/>`;
  s += `<path d="M569,262 l7,-8 l5,5 l9,-12" fill="none" stroke="url(#${id}-stroke)"
      stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += link(id, `M598,256 H630`, { accent: false });

  // And the decision it reaches.
  s += box(id, 642, 196, 104, 120, { r: 12 });
  s += `<g transform="translate(676,232)">
      <circle cx="0" cy="-6" r="6" fill="none" stroke="${INK}" stroke-opacity=".62" stroke-width="2"/>
      <path d="M-10,8 a10,9 0 0 1 20,0" fill="none" stroke="${INK}" stroke-opacity=".62"
        stroke-width="2" stroke-linecap="round"/>
    </g>`;
  s += rows(662, 258, 66, 3);
  return svg(id, s);
}

const OUT = [
  ['sv-sap-readiness.svg', sapReadiness()],
  ['sv-oracle-fusion.svg', oracleFusion()],
  ['sv-scada.svg', scada()],
  ['sv-oilgas.svg', oilGas()],
  ['sv-manufacturing.svg', manufacturing()],
  ['sv-fractional.svg', fractional()],
  ['sv-agentic.svg', agentic()],
  ['sv-enterprise-ai.svg', enterpriseAi()],
  ['sv-data-quality.svg', dataQuality()],
  ['sv-data-analytics.svg', dataAnalytics()],
];

const dir = path.join(process.cwd(), 'public/img');
for (const [name, content] of OUT) {
  fs.writeFileSync(path.join(dir, name), content);
  console.log(`  ${name}  ${(content.length / 1024).toFixed(1)}KB`);
}
