/**
 * One currency format across the site.
 *
 * The figure appears four times. Three are prose from the source documents and
 * read "Rs 1,50,000"; the fourth was a counter rendering "₹1,50,000". Nobody
 * sees all four at once, which is why it survived: the homepage showed the
 * symbol and the page it links to showed the abbreviation.
 *
 *   node tools/test-currency.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');

/** Walk src/ directly rather than asking git, so this runs outside a checkout. */
function sources(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, acc);
    else if (/\.(tsx?|mjs)$/.test(entry.name)) acc.push(path.relative(root, full));
  }
  return acc;
}

const files = sources(path.join(root, 'src'));

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

const rupeeSymbol = [];
const rupeeAbbrev = [];

for (const rel of files) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  text.split('\n').forEach((line, i) => {
    // Comments explain the choice; they are not output.
    const code = line.replace(/^\s*(\/\/|\*|\/\*).*/, '');
    if (/₹/.test(code)) rupeeSymbol.push(`${rel}:${i + 1}`);
    if (/\bRs\.?\s?\d/.test(code)) rupeeAbbrev.push(`${rel}:${i + 1}`);
  });
}

ok(
  'the site uses one currency format, not both',
  rupeeSymbol.length === 0 || rupeeAbbrev.length === 0,
  `₹ at ${rupeeSymbol.join(', ') || 'nowhere'}\n        Rs at ${rupeeAbbrev.join(', ') || 'nowhere'}`,
);

ok('the amount appears somewhere, so this test is testing something', rupeeSymbol.length + rupeeAbbrev.length > 0);

// Indian grouping, since the audience and the figure are both Indian:
// 1,50,000 rather than 150,000.
const wrongGrouping = [];
for (const rel of files) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  text.split('\n').forEach((line, i) => {
    if (/(₹|\bRs\.?\s?)1[,.]?50,000\b/.test(line) && /150,000/.test(line)) {
      wrongGrouping.push(`${rel}:${i + 1}`);
    }
  });
}
ok('the figure uses Indian digit grouping', wrongGrouping.length === 0, wrongGrouping.join(', '));

console.log(`\nformats found: ${rupeeAbbrev.length} × "Rs", ${rupeeSymbol.length} × "₹"`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
