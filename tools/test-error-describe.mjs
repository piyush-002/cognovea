/**
 * Tests the error formatter in src/lib/payload.ts.
 *
 * It exists because of a log line that read, in full:
 *
 *   [payload] getClients failed: null
 *
 * The query was named and every fact needed to fix it was withheld. The cause
 * was passing the raw error object to console.error inside a server component:
 * that output crosses the RSC boundary before reaching the terminal, and
 * anything that does not serialise arrives as null. A diagnostic that discards
 * the diagnosis is worse than none, because it looks like it worked.
 *
 *   node tools/test-error-describe.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(here, '..', 'src', 'lib', 'payload.ts'), 'utf8');

// Lift describe() out of the TypeScript source rather than restating it, so
// this tests the function that actually runs.
const match = src.match(/function describe\(error: unknown\): string \{[\s\S]*?\n\}/);
if (!match) {
  console.log('FAIL  describe() not found in src/lib/payload.ts. If it was renamed, update this test.');
  process.exit(1);
}

/**
 * Strip the type annotations line by line. A regex that stops at the first
 * semicolon breaks on `Record<string, unknown> & { message?: string; ... }`,
 * where the semicolon is inside the type.
 */
const js = match[0]
  .split('\n')
  .map((line) => {
    if (line.includes('function describe(')) return 'function describe(error) {';
    if (line.trim().startsWith('const e = error as')) return '  const e = error;';
    if (line.trim().startsWith('const parts:')) return '  const parts = [];';
    // Generic: strip a simple annotation from a `let x: T;` / `const x: T =`.
    return line.replace(/\b(let|const|var)\s+(\w+)\s*:\s*[\w<>\[\]|\s]+?(\s*=|;)/, '$1 $2$3');
  })
  .join('\n')
  .replace(/error\.constructor\?\.name/, '(error && error.constructor && error.constructor.name)');

const describe = new Function(`${js}; return describe;`)();

let pass = 0;
let fail = 0;
const check = (name, value, mustContain) => {
  const out = String(describe(value));
  const missing = mustContain.filter((m) => !out.includes(m));
  if (missing.length === 0) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}\n        missing ${JSON.stringify(missing)}\n        got: ${out.split('\n')[0]}`);
  }
};

// The literal case from the log.
check('null says so instead of printing "null"', null, ['null was thrown']);
check('undefined says so', undefined, ['undefined was thrown']);

check('a plain Error keeps its message', new Error('Connection terminated unexpectedly'), [
  'Connection terminated unexpectedly',
]);

// The case the site is most likely to hit: a collection added without the
// schema catching up.
check(
  'a Postgres error keeps code and table',
  Object.assign(new Error('relation "case_studies" does not exist'), {
    code: '42P01',
    table: 'case_studies',
    routine: 'parserOpenTable',
  }),
  ['relation "case_studies" does not exist', 'code=42P01', 'table=case_studies'],
);

check(
  'a missing column keeps the column name',
  Object.assign(new Error('column clients.scale does not exist'), { code: '42703', column: 'scale' }),
  ['code=42703', 'column=scale'],
);

check(
  'a wrapped error reaches the inner cause',
  Object.assign(new Error('Payload query failed'), {
    cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }),
  }),
  ['Payload query failed', 'connect ECONNREFUSED', 'code=ECONNREFUSED'],
);

check('a thrown string survives', 'something broke', ['something broke']);
check('a bare object is serialised rather than lost', { weird: true }, ['weird']);

// Whatever happens, the result must be a string: that is the whole point.
const shapes = [null, undefined, 'x', 0, false, {}, [], new Error('e'), Symbol('s')];
let allStrings = true;
for (const s of shapes) {
  try {
    if (typeof describe(s) !== 'string') allStrings = false;
  } catch {
    allStrings = false;
  }
}
if (allStrings) {
  pass++;
  console.log('  ok    every input produces a string, and none throws');
} else {
  fail++;
  console.log('  FAIL  some input did not produce a string, or threw');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
