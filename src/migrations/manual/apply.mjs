/**
 * Applies one hand-written SQL file from this directory.
 *
 *   node src/migrations/manual/apply.mjs 2026-08-30-tool-leads.sql
 *
 * Run from the repository root, where .env.local is.
 *
 * Why these exist at all: this database's schema was built by Payload's dev
 * push, so `payload migrate:create` has no baseline to diff against and emits a
 * from-scratch build of every table, with DROP TABLE ... CASCADE in its down().
 * That is right for an empty database and catastrophic for this one, which
 * holds the live content. See src/migrations/index.ts and SETUP.md.
 *
 * Every file here is additive and idempotent: no DROP, no data rewrite, and
 * running one twice changes nothing.
 *
 * Uses pg, already installed as a Payload dependency, over the direct
 * (unpooled) Neon endpoint, because DDL through a transaction pooler is
 * unreliable. Runs in one transaction, then reads the result back out of
 * information_schema rather than reporting success because nothing threw.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const here = path.dirname(new URL(import.meta.url).pathname);

const file = process.argv[2];
if (!file) {
  const available = fs.readdirSync(here).filter((f) => f.endsWith('.sql')).sort();
  console.error('Usage: node src/migrations/manual/apply.mjs <file.sql>\n');
  console.error('Available:');
  for (const f of available) console.error(`  ${f}`);
  process.exit(1);
}

const sqlPath = path.join(here, path.basename(file));
if (!fs.existsSync(sqlPath)) {
  console.error(`No such file: ${sqlPath}`);
  process.exit(1);
}

// .env.local, parsed here rather than pulling in a dependency.
const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const connectionString = env.DATABASE_URI_UNPOOLED || env.DATABASE_URI;
if (!connectionString) {
  console.error('No DATABASE_URI_UNPOOLED or DATABASE_URI in .env.local.');
  process.exit(1);
}
if (!env.DATABASE_URI_UNPOOLED) {
  console.warn('DATABASE_URI_UNPOOLED is not set; falling back to the pooled endpoint.');
  console.warn('DDL over a transaction pooler can hang. If it does, stop and set it.\n');
}

const sql = fs.readFileSync(sqlPath, 'utf8');

// Refuse to run anything destructive, whatever the file claims in its comments.
// A guard here is worth more than a promise in a header: this is the script
// somebody reaches for when they are in a hurry.
const body = sql.replace(/--[^\n]*/g, '');
const destructive = /\b(DROP\s+(TABLE|SCHEMA|DATABASE|COLUMN)|TRUNCATE|DELETE\s+FROM)\b/i.exec(body);
if (destructive) {
  console.error(`Refusing to run: this file contains ${destructive[0].toUpperCase()}.`);
  console.error('Files in this directory are additive only. Apply anything else by hand, deliberately.');
  process.exit(1);
}

const statements = body
  .split('\n')
  .filter((l) => l.trim())
  .join('\n');

console.log(`Target:    ${new URL(connectionString).hostname}`);
console.log(`Applying:  ${path.basename(sqlPath)}`);
console.log('Additive only — nothing is dropped.\n');

const client = new Client({ connectionString });
try {
  await client.connect();
} catch (error) {
  // Worth catching rather than letting the stack trace out: the usual cause is
  // running this somewhere without network access to Neon, and a bare
  // EAI_AGAIN does not say so.
  console.error(`\nCould not reach the database: ${error.message}`);
  console.error('Nothing was applied. Check the connection string and that this machine can reach Neon.');
  process.exit(1);
}

try {
  // The file carries its own BEGIN/COMMIT.
  await client.query(statements);
  console.log('Applied.\n');

  // Read back whatever the file's trailing "-- Confirm:" comment asks for, so
  // the check lives beside the change rather than in this script.
  const confirm = /--\s*Confirm:\s*\n((?:--[^\n]*\n?)+)/.exec(sql);
  if (confirm) {
    const query = confirm[1].replace(/^--\s?/gm, '').trim();
    const { rows } = await client.query(query);
    console.log(`${rows.length} row(s) back from the confirmation query:`);
    for (const r of rows) console.log('  ' + Object.values(r).join(' | '));
  } else {
    console.log('No confirmation query in the file. Verify by hand.');
  }
} catch (error) {
  console.error('\nFailed. The transaction was rolled back; nothing was applied.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
