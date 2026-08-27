/**
 * Unit tests for the Neon endpoint selection. Runs without Payload, npm or a
 * database, which is the point: this is logic that only misbehaves in
 * production, where it is expensive to discover.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const target = path.join(root, 'src', 'lib', 'db-endpoint.ts');

/**
 * Load the module under test.
 *
 * Node 22.18+ executes TypeScript directly, so no build step and no esbuild is
 * needed. The fallback exists for older Node: esbuild is resolved from wherever
 * it happens to live rather than a hardcoded path, because a test that only
 * runs on one machine is not a test.
 */
async function load() {
  try {
    return await import(`file://${target}`);
  } catch (nativeError) {
    try {
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const esbuild = require('esbuild');
      const out = path.join(root, '.db-endpoint-test.cjs');
      await esbuild.build({
        entryPoints: [target], outfile: out, bundle: true,
        platform: 'node', format: 'cjs', target: 'node20', logLevel: 'silent',
      });
      const mod = require(out);
      (await import('node:fs')).rmSync(out, { force: true });
      return mod;
    } catch {
      console.log('SKIP  Node cannot run TypeScript here and esbuild is unavailable.');
      console.log(`      Node ${process.version}, native TypeScript needs 22.18 or newer.`);
      console.log(`      (${nativeError.message})`);
      process.exit(0);
    }
  }
}

const { chooseConnection, isMigrationCommand } = await load();

const POOLED   = 'postgresql://u:p@ep-cool-1234-pooler.ap-south-1.aws.neon.tech/cognovea?sslmode=require';
const DIRECT   = 'postgresql://u:p@ep-cool-1234.ap-south-1.aws.neon.tech/cognovea?sslmode=require';
const argv = (...rest) => ['/usr/bin/node', '/app/payload', ...rest];

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : (fail++, console.log('  FAIL  ' + name)); };

// Command detection
check('detects `migrate`',           isMigrationCommand(argv('migrate')) === true);
check('detects `migrate:create`',    isMigrationCommand(argv('migrate:create')) === true);
check('ignores `dev`',               isMigrationCommand(argv('dev')) === false);
check('ignores `build`',             isMigrationCommand(argv('build')) === false);
check('ignores path containing "migrate"',
      isMigrationCommand(['/usr/bin/node', '/home/me/migrate-tools/app.js', 'dev']) === false);

// Runtime uses pooled
{
  const r = chooseConnection({ argv: argv('dev'), pooled: POOLED, unpooled: DIRECT });
  check('runtime picks pooled', r.connectionString === POOLED && r.direct === false);
  check('runtime is silent when correct', r.warnings.length === 0);
}

// Migration uses direct when available
{
  const r = chooseConnection({ argv: argv('migrate'), pooled: POOLED, unpooled: DIRECT });
  check('migration picks direct', r.connectionString === DIRECT && r.direct === true);
  check('migration explains itself', r.notes.length === 1);
}

// Migration without an unpooled string: falls back, but warns
{
  const r = chooseConnection({ argv: argv('migrate'), pooled: POOLED, unpooled: undefined });
  check('migration falls back to pooled', r.connectionString === POOLED);
  check('migration warns about the fallback', r.warnings.length === 1);
}

// Runtime on a direct endpoint is the dangerous case, must warn
{
  const r = chooseConnection({ argv: argv('start'), pooled: DIRECT, unpooled: undefined });
  check('runtime on direct endpoint warns', r.warnings.length === 1);
}

// A non-Neon Postgres (local docker, RDS) must not be nagged about pooling
{
  const local = 'postgresql://postgres:postgres@localhost:5432/cognovea';
  const r = chooseConnection({ argv: argv('dev'), pooled: local, unpooled: undefined });
  check('local postgres is not warned about', r.warnings.length === 0);
}

// "-pooler" appearing in a password must not be mistaken for a pooled host
{
  const tricky = 'postgresql://u:has-pooler.inside@ep-cool-1234.ap-south-1.aws.neon.tech/db';
  const r = chooseConnection({ argv: argv('dev'), pooled: tricky, unpooled: undefined });
  check('password containing "-pooler." does not fool the host check', r.warnings.length === 1);
}

// Missing DATABASE_URI throws something actionable
{
  let msg = '';
  try { chooseConnection({ argv: argv('dev'), pooled: undefined, unpooled: undefined }); }
  catch (e) { msg = e.message; }
  check('missing DATABASE_URI throws with guidance', msg.includes('POOLED') && msg.includes('.env.local'));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
