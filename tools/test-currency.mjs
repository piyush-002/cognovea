/**
 * Regional pricing: one source, two currencies, and the machinery that picks.
 *
 * A Data Health Check is quoted at Rs 1,50,000 in India and $2,499 everywhere
 * else. Both figures render into every page; an inline script sets
 * data-geo="in" on <html> before first paint when the clock is on Indian
 * Standard Time, and CSS hides the other one.
 *
 * That is three files agreeing on two strings. Nothing in the type system ties
 * the attribute the script writes to the attribute the stylesheet reads, and a
 * disagreement fails silently: every visitor simply sees dollars, which is also
 * exactly what correct behaviour looks like from outside India. This test is
 * the thing that would notice.
 *
 *   node tools/test-currency.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/** Walk src/ directly rather than asking git, so this runs outside a checkout. */
function sources(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, acc);
    else if (/\.(tsx?|mjs)$/.test(entry.name)) acc.push(path.relative(root, full));
  }
  return acc;
}

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
  }
};

const files = sources(path.join(root, 'src'));
const pricing = read('src/lib/pricing.ts');
const price = read('src/components/Price.tsx');
const layout = read('src/app/(frontend)/layout.tsx');
const css = read('src/app/(frontend)/globals.css');

/* Strip line and block comments before looking for literals. Every one of
   these files explains itself at length, and the explanations quote the very
   strings the assertions below are trying to prove do not appear in code. */
const codeOf = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// --------------------------------------------------------------- one source
const declared = pricing.match(/healthCheckFrom:\s*\{\s*usd:\s*(\d+),\s*inr:\s*(\d+)\s*\}/);
ok('pricing.ts declares the pair', Boolean(declared), 'healthCheckFrom not found in the expected shape');
const usdAmount = declared ? Number(declared[1]) : NaN;
const inrAmount = declared ? Number(declared[2]) : NaN;

const strays = [];
for (const rel of files) {
  if (rel === 'src/lib/pricing.ts') continue;
  codeOf(read(rel))
    .split('\n')
    .forEach((line, i) => {
      if (/(₹|\bRs\.?\s?)\s?\d/.test(line)) strays.push(`${rel}:${i + 1}  ${line.trim().slice(0, 60)}`);
      if (/\$\s?2[,]?499|\b150000\b|1,50,000/.test(line)) strays.push(`${rel}:${i + 1}  ${line.trim().slice(0, 60)}`);
    });
}
ok('no page writes the price itself', strays.length === 0, strays.join('\n        '));

// ------------------------------------------------------------- the formatting
ok('the dollar figure is grouped en-US', /formatUsd[\s\S]*?toLocaleString\('en-US'\)/.test(pricing));
ok('the rupee figure is grouped en-IN', /formatInr[\s\S]*?toLocaleString\('en-IN'\)/.test(pricing));
ok('"Rs", not the glyph, matching the source documents', /`Rs \$\{/.test(pricing) && !/₹/.test(codeOf(pricing)));

/* Proves the locales actually do what the file claims, rather than proving the
   file says the words. A node built without full ICU would group both the same
   and every rupee price on the site would silently read 150,000. */
ok('en-US groups the dollar figure as 2,499', usdAmount.toLocaleString('en-US') === '2,499', usdAmount.toLocaleString('en-US'));
ok('en-IN groups the rupee figure as 1,50,000', inrAmount.toLocaleString('en-IN') === '1,50,000', inrAmount.toLocaleString('en-IN'));

// ------------------------------------------------------------ both in the HTML
ok('Price renders both currencies', /price__usd/.test(price) && /price__inr/.test(price));
ok('Price is a server component, so this costs no client JavaScript', !/^'use client'/m.test(price));

const users = files.filter((rel) => rel !== 'src/components/Price.tsx' && /from '@\/components\/Price'/.test(read(rel)));
ok('the price is used on more than one page', users.length >= 2, users.join(', ') || 'nowhere');

// --------------------------------------------- the script and the CSS agree
const script = layout.match(/setAttribute\('([\w-]+)',\s*'([\w-]+)'\)/);
ok('the layout ships a geo script that sets an attribute', Boolean(script));
const attr = script ? script[1] : null;
const value = script ? script[2] : null;

ok('it matches both spellings of Indian Standard Time', /Asia\/Kolkata/.test(layout) && /Asia\/Calcutta/.test(layout));
ok('it cannot throw on a browser without Intl', /try\s*\{[\s\S]*?resolvedOptions[\s\S]*?catch/.test(layout));
ok(
  'the <html> it mutates suppresses the hydration warning that causes',
  /<html[^>]*suppressHydrationWarning/.test(layout),
);

const cssRules = [...css.matchAll(/html\[data-geo='([\w-]+)'\]\s+\.(price__\w+)\s*\{\s*display:\s*(\w+)/g)].map((m) => ({
  value: m[1],
  cls: m[2],
  display: m[3],
}));
ok(
  'the stylesheet keys off the same attribute the script writes',
  attr === 'data-geo' && cssRules.length > 0 && cssRules.every((r) => r.value === value),
  `script writes ${attr}="${value}", css reads ${[...new Set(cssRules.map((r) => r.value))].join(', ') || 'nothing'}`,
);
/* Anchored at the start of a line, so it sees only the unqualified rule and
   not the html[data-geo='in'] one further down. An earlier version of this
   assertion stripped the attribute selector and then matched the remainder,
   which of course still contained ".price__usd {". */
ok(
  'dollars are the default, so a crawler indexes them',
  /^\.price__inr\s*\{\s*display:\s*none/m.test(css) && !/^\.price__usd\s*\{/m.test(css),
);
ok(
  'inside India the pair swaps: dollars off, rupees on',
  cssRules.some((r) => r.cls === 'price__usd' && r.display === 'none') &&
    cssRules.some((r) => r.cls === 'price__inr' && r.display !== 'none'),
  JSON.stringify(cssRules),
);
ok('the hidden figure takes no space, so the visible one is not boxed by it', !/\.price__inr\s*\{\s*(visibility|opacity)/.test(css));

console.log(`\n$${usdAmount.toLocaleString('en-US')} outside India, Rs ${inrAmount.toLocaleString('en-IN')} inside it`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
