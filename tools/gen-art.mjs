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

await grain();
console.log('done');
