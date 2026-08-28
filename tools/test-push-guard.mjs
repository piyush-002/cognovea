/**
 * Schema push must be off unless someone explicitly turned it on.
 *
 * The setting used to be `push: process.env.NODE_ENV !== 'production'`, which
 * is on for every local dev server. For most of this project's life local and
 * the deployed site pointed at the same Neon database, so a dev boot could
 * offer to drop tables holding published content, behind a y/N prompt at the
 * end of a long boot log. One reflexive Y and the logos, testimonials and
 * articles would have gone.
 *
 * This reads the real config rather than restating the rule, so widening it
 * back out fails here.
 *
 *   node tools/test-push-guard.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const config = fs.readFileSync(path.join(here, '..', 'src', 'payload.config.ts'), 'utf8');
const envExample = fs.readFileSync(path.join(here, '..', '.env.example'), 'utf8');

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

// The adapter must not decide this inline. A literal there is how the old
// version read, and it is what made the danger invisible at the call site.
const pushLine = config.match(/push:\s*([^,\n]+)/);
ok('the adapter takes push from a named guard, not an inline expression', Boolean(pushLine) && /^allowPush$/.test(pushLine[1].trim()), `found: push: ${pushLine ? pushLine[1].trim() : '(none)'}`);

const guard = config.match(/const allowPush\s*=\s*([^;]+);/);
ok('the guard exists', Boolean(guard));

if (guard) {
  const expr = guard[1].replace(/\s+/g, ' ').trim();

  ok(
    'push requires an explicit opt-in, not merely "not production"',
    /ALLOW_SCHEMA_PUSH\s*===\s*'1'/.test(expr),
    `guard is: ${expr}`,
  );

  ok(
    'push is still impossible in production regardless of the opt-in',
    /NODE_ENV\s*!==\s*'production'/.test(expr) && expr.includes('&&'),
    `guard is: ${expr}`,
  );

  // Evaluate the real expression against the combinations that matter.
  const evaluate = (NODE_ENV, ALLOW_SCHEMA_PUSH) => {
    const process = { env: { NODE_ENV, ALLOW_SCHEMA_PUSH } };
    return Function('process', `return (${expr});`)(process);
  };

  ok('dev with no opt-in: OFF', evaluate('development', undefined) === false);
  ok('dev with the wrong value: OFF', evaluate('development', 'true') === false);
  ok('dev with ALLOW_SCHEMA_PUSH=0: OFF', evaluate('development', '0') === false);
  ok('dev with ALLOW_SCHEMA_PUSH=1: ON', evaluate('development', '1') === true);
  ok('production with ALLOW_SCHEMA_PUSH=1: still OFF', evaluate('production', '1') === false);
  ok('test env with no opt-in: OFF', evaluate('test', undefined) === false);
}

// Somebody hitting this needs to know why and what to do instead, in the place
// they will be looking.
ok('the config tells you what to run instead', /migrate:create/.test(config));
ok('.env.example documents the variable', /ALLOW_SCHEMA_PUSH=/.test(envExample));
ok(
  '.env.example says what it can destroy',
  /DROPPING|drop/i.test(envExample.slice(envExample.indexOf('ALLOW_SCHEMA_PUSH') - 900, envExample.indexOf('ALLOW_SCHEMA_PUSH') + 200)),
);
ok('.env.example is not shipped with it enabled', !/^ALLOW_SCHEMA_PUSH=1/m.test(envExample));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
