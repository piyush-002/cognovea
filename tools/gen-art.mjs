/**
 * Generates the site's abstract artwork into public/img/.
 *
 * Everything here is deterministic — same input, same file — so the art is
 * reproducible and reviewable in git rather than a pile of opaque binaries.
 * Run:  node tools/gen-art.mjs
 *
 * The pieces are data-motifs rather than decoration: a radar sweep for
 * "see clearly", a forecast cone for "know what's next", a pipeline for
 * "work smarter", converging paths for "move with confidence".
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const out = path.join(process.cwd(), 'public', 'img');
fs.mkdirSync(out, { recursive: true });

// Purple -> Blue -> Cyan. Cyan is a micro-accent only: it appears as small
// marks and end-stops, never as a fill or a large area.
const C = {
  violet: '#7C3AED',
  violetLt: '#9B7BFF',
  violetDeep: '#3B1E8F',
  blue: '#4F6BF0',
  blueLt: '#60A5FA',
  cyan: '#22D3EE',
  navy: '#0A1024',
  ink: '#0A1024',
  paper: '#FFFFFF',
};
// Back-compat aliases so the motif code below reads the same.
C.amber = C.blue;
C.amberDeep = C.cyan;
C.indigo = C.blue;

/** Deterministic PRNG so regenerating never churns the files. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const write = (name, svg) => {
  fs.writeFileSync(path.join(out, name), svg.trim() + '\n');
  console.log('  ' + name);
};

/* ---------------------------------------------------------------- shared defs */

const softBlobs = (id) => `
  <defs>
    <radialGradient id="${id}-a" cx="30%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${C.violet}" stop-opacity=".62"/>
      <stop offset="100%" stop-color="${C.violet}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-b" cx="76%" cy="70%" r="52%">
      <stop offset="0%" stop-color="${C.blue}" stop-opacity=".38"/>
      <stop offset="100%" stop-color="${C.blue}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-c" cx="88%" cy="20%" r="34%">
      <stop offset="0%" stop-color="${C.cyan}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${C.cyan}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}-stroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.violet}"/>
      <stop offset="55%" stop-color="${C.blue}"/>
      <stop offset="100%" stop-color="${C.cyan}"/>
    </linearGradient>
    <filter id="${id}-blur" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="52"/>
    </filter>
  </defs>`;

/* ------------------------------------------------------------------ hero mesh */

function heroMesh() {
  const W = 1600;
  const H = 1000;
  const r = rng(7);

  const nodes = Array.from({ length: 34 }, () => ({
    x: Math.round(r() * W),
    y: Math.round(r() * H),
    s: 2 + Math.round(r() * 3),
  }));

  let links = '';
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (d > 240) continue;
      const o = (1 - d / 240) * 0.4;
      links += `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="${C.violetLt}" stroke-opacity="${(o * 1.4).toFixed(3)}" stroke-width="1"/>`;
    }
  }

  const dots = nodes
    .map((n, i) => `<circle cx="${n.x}" cy="${n.y}" r="${n.s}" fill="${i % 7 === 0 ? C.cyan : i % 3 === 0 ? C.blueLt : C.violetLt}" fill-opacity=".8"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="">
${softBlobs('hero')}
  <rect width="${W}" height="${H}" fill="${C.navy}"/>
  <g filter="url(#hero-blur)" opacity=".95">
    <rect width="${W}" height="${H}" fill="url(#hero-a)"/>
    <rect width="${W}" height="${H}" fill="url(#hero-b)"/>
    <rect width="${W}" height="${H}" fill="url(#hero-c)"/>
  </g>
  <g opacity=".7">${links}${dots}</g>
</svg>`;
}

/* ------------------------------------------------------------- card artworks */

const frame = (id, inner, w = 800, h = 520, wash = 0.85) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="">
${softBlobs(id)}
  <rect width="${w}" height="${h}" fill="${C.paper}"/>
  <g filter="url(#${id}-blur)" opacity="${wash}">
    <rect width="${w}" height="${h}" fill="url(#${id}-a)"/>
    <rect width="${w}" height="${h}" fill="url(#${id}-b)"/>
    <rect width="${w}" height="${h}" fill="url(#${id}-c)"/>
  </g>
  ${inner}
</svg>`;

/** See the business clearly — a radar sweep resolving scattered points. */
function artClarity() {
  const r = rng(21);
  const cx = 400;
  const cy = 300;
  const rings = [70, 130, 190, 250]
    .map((rad) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${C.violet}" stroke-opacity=".26" stroke-width="1"/>`)
    .join('');
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * 250).toFixed(1)}" y2="${(cy + Math.sin(a) * 250).toFixed(1)}" stroke="${C.violet}" stroke-opacity=".14" stroke-width="1"/>`;
  }).join('');
  const pts = Array.from({ length: 26 }, () => {
    const a = r() * Math.PI * 2;
    const d = 40 + r() * 210;
    const big = r() > 0.82;
    return `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" r="${big ? 6 : 3.2}" fill="${big ? C.amber : C.violet}" fill-opacity="${big ? '.9' : '.5'}"/>`;
  }).join('');
  const sweep = `<path d="M ${cx} ${cy} L ${cx + 250} ${cy} A 250 250 0 0 0 ${(cx + Math.cos(-0.9) * 250).toFixed(1)} ${(cy + Math.sin(-0.9) * 250).toFixed(1)} Z" fill="url(#clarity-stroke)" fill-opacity=".16"/>`;
  return frame('clarity', `${rings}${spokes}${sweep}${pts}`);
}

/** Know what's next — history resolving into a forecast cone. */
function artPredict() {
  const pts = [];
  const r = rng(33);
  for (let i = 0; i <= 22; i++) {
    const x = 60 + i * 14;
    const y = 380 - i * 8 - Math.sin(i / 2.4) * 26 - r() * 14;
    pts.push([x, y]);
  }
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];

  const upper = [];
  const lower = [];
  // Slope and spread kept modest so the cone stays inside the 800×520 frame.
  for (let i = 0; i <= 16; i++) {
    const x = last[0] + i * 27; // runs to the right edge so the cone bleeds instead of ending in a hard vertical cut
    const mid = last[1] - i * 3.2;
    const spread = i * 3.6;
    upper.push([x, mid - spread]);
    lower.push([x, mid + spread]);
  }
  const cone =
    `M ${last[0]} ${last[1]} ` +
    upper.map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
    ' ' +
    lower.reverse().map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
    ' Z';
  const mid = `M ${last[0]} ${last[1]} ` + upper.map((p, i) => `L ${p[0].toFixed(1)} ${(p[1] + i * 3.6).toFixed(1)}`).join(' ');

  const grid = Array.from({ length: 5 }, (_, i) => `<line x1="40" y1="${110 + i * 62}" x2="760" y2="${110 + i * 62}" stroke="${C.ink}" stroke-opacity=".07" stroke-width="1"/>`).join('');

  return frame(
    'predict',
    `${grid}
  <path d="${cone}" fill="${C.amber}" fill-opacity=".22"/>
  <path d="${mid}" fill="none" stroke="${C.amber}" stroke-width="2.5" stroke-dasharray="7 7" stroke-linecap="round"/>
  <path d="${line}" fill="none" stroke="url(#predict-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${last[0]}" cy="${last[1].toFixed(1)}" r="7" fill="${C.violet}"/>
  <circle cx="${last[0]}" cy="${last[1].toFixed(1)}" r="14" fill="none" stroke="${C.violet}" stroke-opacity=".35" stroke-width="2"/>`,
  );
}

/** Work smarter — scattered inputs routed through a pipeline into one output. */
function artAutomate() {
  const inY = [110, 190, 270, 350, 430];
  const inputs = inY.map((y) => `<rect x="52" y="${y - 16}" width="96" height="32" rx="9" fill="${C.violet}" fill-opacity=".14" stroke="${C.violet}" stroke-opacity=".38"/>`).join('');
  const paths = inY
    .map((y) => `<path d="M 148 ${y} C 250 ${y} 260 300 360 300" fill="none" stroke="${C.violet}" stroke-opacity=".42" stroke-width="1.8"/>`)
    .join('');
  const outY = [220, 300, 380];
  const outs = outY.map((y) => `<path d="M 470 300 C 560 300 570 ${y} 650 ${y}" fill="none" stroke="${C.amber}" stroke-opacity=".6" stroke-width="1.8"/>`).join('');
  const outBoxes = outY.map((y) => `<rect x="650" y="${y - 15}" width="98" height="30" rx="9" fill="${C.amber}" fill-opacity=".18" stroke="${C.amber}" stroke-opacity=".55"/>`).join('');
  const hub = `
  <rect x="360" y="248" width="110" height="104" rx="22" fill="url(#automate-stroke)" fill-opacity=".16" stroke="url(#automate-stroke)" stroke-width="2"/>
  <circle cx="415" cy="300" r="9" fill="${C.violet}"/>
  <circle cx="415" cy="300" r="24" fill="none" stroke="${C.violet}" stroke-opacity=".3" stroke-width="1.5"/>
  <circle cx="415" cy="300" r="38" fill="none" stroke="${C.violet}" stroke-opacity=".15" stroke-width="1.5"/>`;
  return frame('automate', `${paths}${outs}${inputs}${hub}${outBoxes}`);
}

/** Move with confidence — many uncertain paths converging on one decision. */
function artConfidence() {
  const r = rng(55);
  const target = [640, 270];
  const strands = Array.from({ length: 16 }, (_, i) => {
    const y = 60 + i * 26 + r() * 8;
    const c1 = 260 + r() * 90;
    const op = (0.18 + r() * 0.3).toFixed(2);
    const warm = i % 4 === 0;
    return `<path d="M 60 ${y.toFixed(1)} C ${c1.toFixed(0)} ${y.toFixed(1)} 420 ${target[1]} ${target[0]} ${target[1]}" fill="none" stroke="${warm ? C.amber : C.violet}" stroke-opacity="${op}" stroke-width="${warm ? 2 : 1.4}"/>`;
  }).join('');
  return frame(
    'confidence',
    `${strands}
  <circle cx="${target[0]}" cy="${target[1]}" r="10" fill="${C.violet}"/>
  <circle cx="${target[0]}" cy="${target[1]}" r="26" fill="none" stroke="${C.violet}" stroke-opacity=".32" stroke-width="2"/>
  <circle cx="${target[0]}" cy="${target[1]}" r="46" fill="none" stroke="${C.amber}" stroke-opacity=".3" stroke-width="1.6"/>
  <line x1="${target[0]}" y1="${target[1]}" x2="740" y2="${target[1]}" stroke="${C.amber}" stroke-width="2.4" stroke-linecap="round"/>`,
  );
}

/* --------------------------------------------------------- industry motifs */

const ind = (id, inner) => frame(id, inner, 600, 400, 0.55);

function industryArt() {
  const r = rng(91);

  // Retail — basket of demand curves
  const retail = ind(
    'ind-retail',
    Array.from({ length: 5 }, (_, i) => {
      const base = 300 - i * 14;
      const pts = Array.from({ length: 14 }, (_, k) => `${60 + k * 36},${(base - Math.sin(k / 1.7 + i) * (22 + i * 6)).toFixed(1)}`).join(' ');
      return `<polyline points="${pts}" fill="none" stroke="${i === 1 ? C.amber : C.violet}" stroke-opacity="${i === 1 ? '.95' : (0.72 - i * 0.09).toFixed(2)}" stroke-width="${i === 1 ? 6 : 3.6}" stroke-linecap="round"/>`;
    }).join(''),
  );

  // Manufacturing — a line with one bottleneck flagged
  const mfg = ind(
    'ind-mfg',
    `${Array.from({ length: 7 }, (_, i) => `<rect x="${58 + i * 74}" y="170" width="52" height="60" rx="14" fill="${i === 4 ? C.amber : C.violet}" fill-opacity="${i === 4 ? '.55' : '.26'}" stroke="${i === 4 ? C.amber : C.violet}" stroke-opacity="${i === 4 ? '1' : '.7'}" stroke-width="3"/>`).join('')}
  ${Array.from({ length: 6 }, (_, i) => `<line x1="${110 + i * 74}" y1="200" x2="${132 + i * 74}" y2="200" stroke="${C.violet}" stroke-opacity=".7" stroke-width="4"/>`).join('')}
  <circle cx="${58 + 4 * 74 + 26}" cy="200" r="46" fill="none" stroke="${C.amber}" stroke-opacity=".85" stroke-width="4"/>`,
  );

  // Financial — risk band around a trend
  const fin = ind(
    'ind-fin',
    (() => {
      const up = [];
      const dn = [];
      const mid = [];
      for (let i = 0; i <= 16; i++) {
        const x = 60 + i * 30;
        const m = 260 - i * 8 + Math.sin(i / 2) * 12;
        const s = 12 + i * 2.4;
        mid.push(`${x},${m.toFixed(1)}`);
        up.push([x, m - s]);
        dn.push([x, m + s]);
      }
      const band = `M ${up.map((p) => `${p[0]},${p[1].toFixed(1)}`).join(' L ')} L ${dn.reverse().map((p) => `${p[0]},${p[1].toFixed(1)}`).join(' L ')} Z`;
      return `<path d="${band}" fill="${C.violet}" fill-opacity=".3"/><polyline points="${mid.join(' ')}" fill="none" stroke="${C.amber}" stroke-width="6" stroke-linecap="round"/>`;
    })(),
  );

  // Healthcare — a steady trace
  const health = ind(
    'ind-health',
    (() => {
      let d = 'M 50 200';
      for (let i = 0; i < 5; i++) {
        const x = 50 + i * 100;
        d += ` L ${x + 28} 200 L ${x + 38} 150 L ${x + 48} 252 L ${x + 58} 200 L ${x + 100} 200`;
      }
      return `<path d="${d}" fill="none" stroke="url(#ind-health-stroke)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="388" cy="150" r="12" fill="${C.amber}"/>`;
    })(),
  );

  // Energy — load curve on a grid
  const energy = ind(
    'ind-energy',
    `${Array.from({ length: 6 }, (_, i) => `<line x1="50" y1="${90 + i * 44}" x2="550" y2="${90 + i * 44}" stroke="${C.ink}" stroke-opacity=".07"/>`).join('')}
  ${Array.from({ length: 18 }, (_, i) => {
    const h = 30 + Math.abs(Math.sin(i / 2.2)) * 150 + r() * 20;
    return `<rect x="${56 + i * 29}" y="${(310 - h).toFixed(1)}" width="18" height="${h.toFixed(1)}" rx="6" fill="${i % 6 === 3 ? C.amber : C.violet}" fill-opacity="${i % 6 === 3 ? '.95' : '.62'}"/>`;
  }).join('')}`,
  );

  return { retail, mfg, fin, health, energy };
}

/* ------------------------------------------------------------------- grain */

async function grain() {
  // grain.png is committed, so this step is optional. Install sharp only if you
  // want to regenerate it: npm i -D sharp
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('  (sharp not installed — keeping the existing grain.png)');
    return;
  }
  const size = 220;
  const r = rng(4242);
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = Math.round(120 + (r() - 0.5) * 255);
    buf[i * 4] = v;
    buf[i * 4 + 1] = v;
    buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = 18; // very low alpha; CSS layers it at low opacity too
  }
  await sharp(buf, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, 'grain.png'));
  console.log('  grain.png');
}


/* ==========================================================================
   Page motifs — one per inner-page subject.
   Same frame() and palette as the homepage set, so they read as one family.
   ========================================================================== */

/** Layered cloud warehouse: raw → staged → modelled, queries landing on top. */
function artWarehouse() {
  const tiers = [
    { y: 372, w: 640, label: 'raw', o: 0.2 },
    { y: 300, w: 560, label: 'staged', o: 0.32 },
    { y: 228, w: 470, label: 'modelled', o: 0.46 },
  ];
  const slabs = tiers
    .map(
      (t) =>
        `<rect x="${(800 - t.w) / 2}" y="${t.y}" width="${t.w}" height="52" rx="10" fill="${C.violet}" fill-opacity="${t.o}" stroke="${C.violet}" stroke-opacity=".55" stroke-width="2"/>`,
    )
    .join('');
  const risers = [0, 1].map((i) => {
    const a = tiers[i];
    const b = tiers[i + 1];
    return `<line x1="400" y1="${a.y}" x2="400" y2="${b.y + 52}" stroke="${C.blue}" stroke-opacity=".5" stroke-width="2"/>`;
  }).join('');
  const queries = [280, 400, 520]
    .map(
      (x) =>
        `<g><line x1="${x}" y1="228" x2="${x}" y2="150" stroke="${C.cyan}" stroke-opacity=".75" stroke-width="2"/><circle cx="${x}" cy="142" r="8" fill="${C.cyan}" fill-opacity=".9"/></g>`,
    )
    .join('');
  return frame('warehouse', `${slabs}${risers}${queries}`);
}

/** Many source systems funnelled through orchestration into one warehouse. */
function artPipeline() {
  const src = [96, 176, 256, 336, 416];
  const boxes = src
    .map(
      (y) =>
        `<rect x="46" y="${y - 17}" width="112" height="34" rx="9" fill="${C.violet}" fill-opacity=".16" stroke="${C.violet}" stroke-opacity=".5" stroke-width="1.6"/>`,
    )
    .join('');
  const lines = src
    .map(
      (y) =>
        `<path d="M 158 ${y} C 250 ${y} 268 260 356 260" fill="none" stroke="${C.violet}" stroke-opacity=".45" stroke-width="2"/>`,
    )
    .join('');
  const hub = `<rect x="356" y="206" width="108" height="108" rx="24" fill="url(#pipeline-stroke)" fill-opacity=".18" stroke="url(#pipeline-stroke)" stroke-width="2.4"/>
    <circle cx="410" cy="260" r="8" fill="${C.blue}"/>
    <circle cx="410" cy="260" r="26" fill="none" stroke="${C.blue}" stroke-opacity=".35" stroke-width="1.6"/>`;
  const out = `<path d="M 464 260 L 596 260" fill="none" stroke="${C.cyan}" stroke-opacity=".8" stroke-width="2.6"/>
    <rect x="596" y="214" width="150" height="92" rx="14" fill="${C.cyan}" fill-opacity=".14" stroke="${C.cyan}" stroke-opacity=".7" stroke-width="2"/>
    ${[238, 260, 282].map((y) => `<line x1="618" y1="${y}" x2="724" y2="${y}" stroke="${C.cyan}" stroke-opacity=".55" stroke-width="2"/>`).join('')}`;
  return frame('pipeline', `${lines}${boxes}${hub}${out}`);
}

/** Automated quality checks: a grid of passes with one anomaly flagged. */
function artChecks() {
  const r = rng(303);
  let cells = '';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 108 + col * 86;
      const y = 132 + row * 74;
      const bad = row === 2 && col === 4;
      cells += `<rect x="${x}" y="${y}" width="60" height="50" rx="10" fill="${bad ? C.cyan : C.violet}" fill-opacity="${bad ? 0.5 : 0.1 + r() * 0.12}" stroke="${bad ? C.cyan : C.violet}" stroke-opacity="${bad ? 1 : 0.4}" stroke-width="${bad ? 2.6 : 1.4}"/>`;
      if (!bad) {
        cells += `<path d="M ${x + 20} ${y + 26} l 7 8 l 14 -16" fill="none" stroke="${C.violet}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else {
        cells += `<line x1="${x + 30}" y1="${y + 13}" x2="${x + 30}" y2="${y + 29}" stroke="${C.cyan}" stroke-width="3" stroke-linecap="round"/><circle cx="${x + 30}" cy="${y + 37}" r="2.6" fill="${C.cyan}"/>`;
        cells += `<circle cx="${x + 30}" cy="${y + 25}" r="44" fill="none" stroke="${C.cyan}" stroke-opacity=".5" stroke-width="2"/>`;
      }
    }
  }
  return frame('checks', cells);
}

/** Concurrency: separate lanes running in parallel at steady throughput. */
function artThroughput() {
  const r = rng(77);
  let lanes = '';
  for (let i = 0; i < 6; i++) {
    const y = 120 + i * 56;
    lanes += `<line x1="70" y1="${y}" x2="730" y2="${y}" stroke="${C.ink}" stroke-opacity=".08" stroke-width="1"/>`;
    const n = 5 + Math.round(r() * 4);
    for (let k = 0; k < n; k++) {
      const x = 84 + r() * 620;
      const w = 26 + r() * 58;
      lanes += `<rect x="${x.toFixed(1)}" y="${y - 9}" width="${w.toFixed(1)}" height="18" rx="9" fill="${k % 5 === 0 ? C.cyan : C.violet}" fill-opacity="${k % 5 === 0 ? 0.8 : 0.34 + r() * 0.26}"/>`;
    }
  }
  return frame('throughput', lanes);
}

/** Legacy estate resolving into a cloud estate, batch by batch. */
function artMigration() {
  const old = [0, 1, 2, 3]
    .map(
      (i) =>
        `<rect x="70" y="${140 + i * 64}" width="120" height="46" rx="6" fill="${C.ink}" fill-opacity=".1" stroke="${C.ink}" stroke-opacity=".28" stroke-width="1.6"/>`,
    )
    .join('');
  const arcs = [0, 1, 2, 3]
    .map((i) => {
      const y1 = 163 + i * 64;
      const y2 = 178 + i * 52;
      return `<path d="M 190 ${y1} C 320 ${y1} 330 ${y2} 470 ${y2}" fill="none" stroke="url(#migration-stroke)" stroke-opacity="${0.85 - i * 0.14}" stroke-width="2.2" stroke-dasharray="${i === 3 ? '7 7' : 'none'}"/>`;
    })
    .join('');
  const cloud = [0, 1, 2, 3]
    .map(
      (i) =>
        `<rect x="470" y="${155 + i * 52}" width="130" height="42" rx="12" fill="${i === 3 ? C.cyan : C.violet}" fill-opacity="${i === 3 ? 0.18 : 0.24}" stroke="${i === 3 ? C.cyan : C.violet}" stroke-opacity="${i === 3 ? 0.6 : 0.75}" stroke-width="2" stroke-dasharray="${i === 3 ? '6 6' : 'none'}"/>`,
    )
    .join('');
  return frame('migration', `${arcs}${old}${cloud}`);
}

/** Cost curve falling as off-peak capacity is released each night. */
function artCost() {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const x = 70 + i * 17;
    // y grows downward in SVG, so a FALLING cost means an INCREASING y.
    // The first version subtracted and drew a rising sawtooth — the opposite
    // of the story the section is telling.
    const base = 178 + i * 3.2;
    const duty = Math.sin(i / 1.55) > 0.15 ? 0 : 56; // nightly scale-down
    pts.push([x, base + duty]);
  }
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0]} 150 L ${pts[0][0]} 150 Z`; // fill upward: the gap above the line is the saving
  const grid = [0, 1, 2, 3]
    .map((i) => `<line x1="60" y1="${150 + i * 72}" x2="750" y2="${150 + i * 72}" stroke="${C.ink}" stroke-opacity=".07"/>`)
    .join('');
  return frame(
    'cost',
    `${grid}<path d="${area}" fill="url(#cost-stroke)" fill-opacity=".16"/><path d="${line}" fill="none" stroke="url(#cost-stroke)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`,
  );
}

/** RAG: a question retrieving from approved sources, answered with citations. */
function artRag() {
  const docs = [0, 1, 2, 3, 4]
    .map((i) => {
      const x = 300 + (i % 2) * 22;
      const y = 132 + i * 52;
      return `<rect x="${x}" y="${y}" width="104" height="40" rx="7" fill="${C.violet}" fill-opacity="${i === 1 || i === 3 ? 0.42 : 0.14}" stroke="${C.violet}" stroke-opacity="${i === 1 || i === 3 ? 0.9 : 0.4}" stroke-width="1.8"/>`;
    })
    .join('');
  const q = `<circle cx="120" cy="260" r="30" fill="${C.blue}" fill-opacity=".18" stroke="${C.blue}" stroke-width="2.4"/>
    <text x="120" y="269" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${C.blue}">?</text>`;
  const pull = [1, 3]
    .map((i) => `<path d="M 150 260 C 230 260 240 ${152 + i * 52} 300 ${152 + i * 52}" fill="none" stroke="${C.blue}" stroke-opacity=".65" stroke-width="2.2"/>`)
    .join('');
  const push = [1, 3]
    .map((i) => `<path d="M 426 ${152 + i * 52} C 500 ${152 + i * 52} 520 260 590 260" fill="none" stroke="${C.cyan}" stroke-opacity=".8" stroke-width="2.2"/>`)
    .join('');
  const answer = `<rect x="590" y="212" width="150" height="96" rx="14" fill="${C.cyan}" fill-opacity=".14" stroke="${C.cyan}" stroke-opacity=".8" stroke-width="2"/>
    ${[238, 260, 282].map((y, i) => `<line x1="612" y1="${y}" x2="${i === 2 ? 690 : 718}" y2="${y}" stroke="${C.cyan}" stroke-opacity=".6" stroke-width="2.4"/>`).join('')}
    <circle cx="726" cy="300" r="6" fill="${C.cyan}"/>`;
  return frame('rag', `${pull}${push}${docs}${q}${answer}`);
}

/** An agent running a defined sequence, pausing at a human approval gate. */
function artAgent() {
  const xs = [92, 236, 380, 524, 668];
  const nodes = xs
    .map((x, i) => {
      if (i === 3) {
        return `<g><path d="M ${x} 224 L ${x + 42} 266 L ${x} 308 L ${x - 42} 266 Z" fill="${C.cyan}" fill-opacity=".22" stroke="${C.cyan}" stroke-width="2.6"/><circle cx="${x}" cy="266" r="7" fill="${C.cyan}"/></g>`;
      }
      return `<rect x="${x - 40}" y="${232}" width="80" height="68" rx="16" fill="${C.violet}" fill-opacity=".18" stroke="${C.violet}" stroke-opacity=".7" stroke-width="2"/><circle cx="${x}" cy="266" r="6" fill="${C.violet}"/>`;
    })
    .join('');
  const links = xs
    .slice(0, -1)
    .map((x, i) => `<line x1="${x + (i === 2 ? 40 : 42)}" y1="266" x2="${xs[i + 1] - (i === 2 ? 42 : 40)}" y2="266" stroke="${C.blue}" stroke-opacity=".55" stroke-width="2.2"/>`)
    .join('');
  const human = `<circle cx="524" cy="152" r="16" fill="none" stroke="${C.cyan}" stroke-width="2.2"/><path d="M 500 196 a 24 24 0 0 1 48 0" fill="none" stroke="${C.cyan}" stroke-width="2.2"/><line x1="524" y1="196" x2="524" y2="222" stroke="${C.cyan}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 5"/>`;
  return frame('agent', `${links}${nodes}${human}`);
}

/** Documents parsed into structured fields, low-confidence rows escalated. */
function artDocs() {
  const doc = `<rect x="78" y="150" width="150" height="200" rx="10" fill="${C.violet}" fill-opacity=".12" stroke="${C.violet}" stroke-opacity=".55" stroke-width="2"/>
    ${[186, 214, 242, 270, 298].map((y, i) => `<line x1="100" y1="${y}" x2="${i % 2 ? 190 : 208}" y2="${y}" stroke="${C.violet}" stroke-opacity=".45" stroke-width="3"/>`).join('')}`;
  const rows = [0, 1, 2, 3]
    .map((i) => {
      const y = 162 + i * 58;
      const flag = i === 2;
      return `<rect x="420" y="${y}" width="300" height="42" rx="9" fill="${flag ? C.cyan : C.blue}" fill-opacity="${flag ? 0.2 : 0.12}" stroke="${flag ? C.cyan : C.blue}" stroke-opacity="${flag ? 0.9 : 0.45}" stroke-width="${flag ? 2.4 : 1.6}"/>
      <line x1="440" y1="${y + 21}" x2="520" y2="${y + 21}" stroke="${flag ? C.cyan : C.blue}" stroke-opacity=".7" stroke-width="3"/>
      <line x1="546" y1="${y + 21}" x2="${640 + (i % 2) * 40}" y2="${y + 21}" stroke="${flag ? C.cyan : C.blue}" stroke-opacity=".4" stroke-width="3"/>`;
    })
    .join('');
  const arrows = [0, 1, 2, 3]
    .map((i) => `<path d="M 234 250 C 320 250 330 ${183 + i * 58} 414 ${183 + i * 58}" fill="none" stroke="${C.blue}" stroke-opacity=".4" stroke-width="1.8"/>`)
    .join('');
  return frame('docs', `${arrows}${doc}${rows}`);
}

/** Impact-versus-effort scoring, with the build-first quadrant marked. */
function artMatrix() {
  const r = rng(451);
  const x0 = 120;
  const y0 = 110;
  const w = 560;
  const h = 300;
  const axes = `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + h}" stroke="${C.ink}" stroke-opacity=".25" stroke-width="1.6"/>
    <line x1="${x0}" y1="${y0 + h}" x2="${x0 + w}" y2="${y0 + h}" stroke="${C.ink}" stroke-opacity=".25" stroke-width="1.6"/>
    <line x1="${x0 + w / 2}" y1="${y0}" x2="${x0 + w / 2}" y2="${y0 + h}" stroke="${C.ink}" stroke-opacity=".1"/>
    <line x1="${x0}" y1="${y0 + h / 2}" x2="${x0 + w}" y2="${y0 + h / 2}" stroke="${C.ink}" stroke-opacity=".1"/>`;
  const quad = `<rect x="${x0}" y="${y0}" width="${w / 2}" height="${h / 2}" fill="${C.cyan}" fill-opacity=".12"/>`;
  let dots = '';
  for (let i = 0; i < 16; i++) {
    const px = x0 + 20 + r() * (w - 44);
    const py = y0 + 16 + r() * (h - 38);
    const win = px < x0 + w / 2 && py < y0 + h / 2;
    dots += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${win ? 10 : 6}" fill="${win ? C.cyan : C.violet}" fill-opacity="${win ? 0.95 : 0.45}"/>`;
  }
  return frame('matrix', `${quad}${axes}${dots}`);
}

/** Six phases on a timeline, each one gated before the next. */
function artRoadmap() {
  const xs = [70, 186, 302, 418, 534, 650];
  const rail = `<line x1="70" y1="262" x2="726" y2="262" stroke="${C.ink}" stroke-opacity=".14" stroke-width="2"/>`;
  const filled = `<line x1="70" y1="262" x2="418" y2="262" stroke="url(#roadmap-stroke)" stroke-width="4" stroke-linecap="round"/>`;
  const marks = xs
    .map((x, i) => {
      const done = i < 3;
      const bar = 40 + ((i * 37) % 90);
      return `<rect x="${x + 6}" y="${262 - bar - 18}" width="60" height="${bar}" rx="8" fill="${done ? C.violet : C.blue}" fill-opacity="${done ? 0.34 : 0.14}" stroke="${done ? C.violet : C.blue}" stroke-opacity="${done ? 0.7 : 0.4}" stroke-width="1.6"/>
      <circle cx="${x + 36}" cy="262" r="${done ? 9 : 7}" fill="${done ? C.violet : '#fff'}" stroke="${done ? C.violet : C.blue}" stroke-width="2.4"/>
      <text x="${x + 36}" y="${300}" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="600" fill="${C.ink}" fill-opacity=".45">0${i + 1}</text>`;
    })
    .join('');
  return frame('roadmap', `${rail}${filled}${marks}`);
}

/** Engagement ladder: each rung a larger commitment than the last. */
function artLadder() {
  const steps = [
    { w: 150, h: 60 },
    { w: 150, h: 104 },
    { w: 150, h: 152 },
    { w: 150, h: 206 },
  ];
  let out = '';
  steps.forEach((s, i) => {
    const x = 90 + i * 158;
    const y = 400 - s.h;
    out += `<rect x="${x}" y="${y}" width="${s.w}" height="${s.h}" rx="12" fill="${i === 0 ? C.cyan : C.violet}" fill-opacity="${i === 0 ? 0.28 : 0.12 + i * 0.08}" stroke="${i === 0 ? C.cyan : C.violet}" stroke-opacity="${i === 0 ? 0.9 : 0.55}" stroke-width="2"/>`;
    if (i < steps.length - 1) {
      out += `<path d="M ${x + s.w + 4} ${y + 14} l 0 -18 l -10 0 l 14 -16 l 14 16 l -10 0 l 0 18 z" fill="${C.blue}" fill-opacity=".55"/>`;
    }
  });
  return frame('ladder', out);
}

/** Three delivery phases, each handing off to the next. */
function artPhases() {
  const xs = [130, 400, 670];
  const rings = xs
    .map(
      (x, i) =>
        `<circle cx="${x}" cy="260" r="72" fill="${i === 2 ? C.cyan : C.violet}" fill-opacity="${i === 2 ? 0.16 : 0.12}" stroke="${i === 2 ? C.cyan : C.violet}" stroke-opacity=".7" stroke-width="2.4"/>
         <text x="${x}" y="272" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="600" fill="${i === 2 ? C.cyan : C.violet}" fill-opacity=".8">0${i + 1}</text>`,
    )
    .join('');
  const links = [0, 1]
    .map((i) => `<path d="M ${xs[i] + 78} 260 L ${xs[i + 1] - 84} 260" fill="none" stroke="${C.blue}" stroke-opacity=".5" stroke-width="2.4" marker-end=""/>
      <path d="M ${xs[i + 1] - 92} 252 l 10 8 l -10 8" fill="none" stroke="${C.blue}" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return frame('phases', `${links}${rings}`);
}

/** A narrowing selection process. */
function artFunnel() {
  const rowsY = [130, 200, 270, 340];
  const widths = [520, 400, 280, 168];
  const out = rowsY
    .map((y, i) => {
      const w = widths[i];
      const x = (800 - w) / 2;
      return `<rect x="${x}" y="${y}" width="${w}" height="52" rx="12" fill="${i === 3 ? C.cyan : C.violet}" fill-opacity="${i === 3 ? 0.3 : 0.1 + i * 0.06}" stroke="${i === 3 ? C.cyan : C.violet}" stroke-opacity="${i === 3 ? 0.95 : 0.5}" stroke-width="2"/>`;
    })
    .join('');
  const ties = [0, 1, 2]
    .map((i) => {
      const wA = widths[i];
      const wB = widths[i + 1];
      const xA = (800 - wA) / 2;
      const xB = (800 - wB) / 2;
      return `<path d="M ${xA + 12} ${rowsY[i] + 52} L ${xB + 12} ${rowsY[i + 1]} M ${xA + wA - 12} ${rowsY[i] + 52} L ${xB + wB - 12} ${rowsY[i + 1]}" stroke="${C.violet}" stroke-opacity=".28" stroke-width="1.6"/>`;
    })
    .join('');
  return frame('funnel', `${ties}${out}`);
}

/** Two places, one team. */
function artLocations() {
  const a = [250, 300];
  const b = [560, 210];
  return frame(
    'locations',
    `<path d="M ${a[0]} ${a[1]} C ${a[0] + 90} ${a[1] - 90} ${b[0] - 90} ${b[1] + 90} ${b[0]} ${b[1]}" fill="none" stroke="url(#locations-stroke)" stroke-width="2.6" stroke-dasharray="8 8"/>
     ${[a, b]
       .map(
         (p, i) =>
           `<circle cx="${p[0]}" cy="${p[1]}" r="${i ? 13 : 16}" fill="${i ? C.cyan : C.violet}"/>
            <circle cx="${p[0]}" cy="${p[1]}" r="${i ? 30 : 36}" fill="none" stroke="${i ? C.cyan : C.violet}" stroke-opacity=".45" stroke-width="2"/>
            <circle cx="${p[0]}" cy="${p[1]}" r="${i ? 50 : 58}" fill="none" stroke="${i ? C.cyan : C.violet}" stroke-opacity=".2" stroke-width="1.6"/>`,
       )
       .join('')}`,
  );
}

/* -------------------------------------------------------------------- run */

console.log('generating public/img/');
write('mesh-hero.svg', heroMesh());
write('art-clarity.svg', artClarity());
write('art-predict.svg', artPredict());
write('art-automate.svg', artAutomate());
write('art-confidence.svg', artConfidence());

const I = industryArt();
write('ind-retail.svg', I.retail);
write('ind-manufacturing.svg', I.mfg);
write('ind-financial.svg', I.fin);
write('ind-healthcare.svg', I.health);
write('ind-energy.svg', I.energy);


write('de-warehouse.svg', artWarehouse());
write('de-pipeline.svg', artPipeline());
write('de-checks.svg', artChecks());
write('de-throughput.svg', artThroughput());
write('dm-migration.svg', artMigration());
write('dm-cost.svg', artCost());
write('ai-rag.svg', artRag());
write('ai-agent.svg', artAgent());
write('ai-docs.svg', artDocs());
write('as-matrix.svg', artMatrix());
write('as-roadmap.svg', artRoadmap());
write('dhc-ladder.svg', artLadder());
write('cr-phases.svg', artPhases());
write('cr-funnel.svg', artFunnel());
write('ct-locations.svg', artLocations());

await grain();
console.log('done');
