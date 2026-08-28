/**
 * Tests fallback distribution.
 *
 * The bug this prevents: every page falling through to the same untagged quote
 * and showing it six times over. That is invisible in code review and obvious
 * to anyone reading the site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const target = path.join(here, '..', 'src', 'lib', 'testimonial-pick.ts');

let pickIndex, PAGE_ORDER;
try {
  ({ pickIndex, PAGE_ORDER } = await import(`file://${target}`));
} catch (nativeError) {
  try {
    const require = createRequire(import.meta.url);
    const esbuild = require('esbuild');
    const out = path.join(here, '..', '.pick-test.cjs');
    await esbuild.build({
      entryPoints: [target], outfile: out, bundle: true,
      platform: 'node', format: 'cjs', target: 'node20', logLevel: 'silent',
    });
    ({ pickIndex, PAGE_ORDER } = require(out));
    fs.rmSync(out, { force: true });
  } catch {
    console.log(`SKIP  Node cannot run TypeScript here (${process.version}) and esbuild is unavailable.`);
    console.log(`      ${nativeError.message}`);
    process.exit(0);
  }
}

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) pass++;
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); };
};

// The case that prompted this: five quotes, six pages.
{
  const picks = PAGE_ORDER.map((k) => pickIndex(k, 5));
  const distinct = new Set(picks).size;
  ok('five quotes across six pages give five distinct picks', distinct === 5, `picks: ${picks.join(',')}`);
  ok('only one page repeats', picks.length - distinct === 1);
}

// The shape the user actually has.
for (const pool of [2, 3, 4, 5, 6, 7]) {
  const picks = PAGE_ORDER.map((k) => pickIndex(k, pool));
  const distinct = new Set(picks).size;
  ok(
    `pool of ${pool}: uses ${Math.min(pool, PAGE_ORDER.length)} different quotes`,
    distinct === Math.min(pool, PAGE_ORDER.length),
    `picks: ${picks.join(',')}`,
  );
  ok(`pool of ${pool}: every pick is in range`, picks.every((p) => p >= 0 && p < pool));
}

// One quote is the old behaviour, and must stay correct rather than crash.
ok('a single quote is chosen by every page', PAGE_ORDER.every((k) => pickIndex(k, 1) === 0));

// An empty pool must not produce a negative or NaN index.
ok('an empty pool returns 0 rather than NaN', pickIndex('home', 0) === 0);
ok('a negative pool returns 0', pickIndex('home', -3) === 0);

// Determinism: the static build renders each page once, but a rebuild must not
// silently move quotes around.
ok(
  'the same key always gives the same index',
  [...Array(50)].every(() => pickIndex('ai-strategy-consulting', 5) === pickIndex('ai-strategy-consulting', 5)),
);

// An unregistered page must not collide with home by defaulting to 0.
ok('an unknown key does not default to home\'s quote', pickIndex('some-new-page', 6) !== pickIndex('home', 6));
ok('an unknown key stays in range', pickIndex('some-new-page', 3) >= 0 && pickIndex('some-new-page', 3) < 3);
ok(
  'an unknown key is stable across calls',
  pickIndex('another-page', 5) === pickIndex('another-page', 5),
);

// Home must be first: it is the page most people see, and the first featured
// quote is the one the editor put at the top on purpose.
ok('home takes the first quote in the pool', pickIndex('home', 5) === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
