/**
 * Applies add-author-columns.sql.
 *
 *   node apply-author-columns.mjs
 *
 * Uses pg, which is already installed as a Payload dependency, and the direct
 * (unpooled) Neon endpoint, because DDL over a transaction pooler is unreliable.
 *
 * Prints the statements before running them, runs them in one transaction so a
 * failure leaves nothing half-applied, and then reads the columns back out of
 * information_schema rather than reporting success because no error was thrown.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

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

const host = new URL(connectionString).hostname;
const sql = fs.readFileSync(path.join(process.cwd(), 'add-author-columns.sql'), 'utf8');

const statements = sql
  .split('\n')
  .filter((l) => !/^\s*--/.test(l) && l.trim())
  .join('\n');

console.log(`Target: ${host}`);
console.log('Statements: 10 ADD COLUMN, 2 foreign keys, 2 indexes. Nothing is dropped.\n');

const client = new Client({ connectionString });
await client.connect();

try {
  // The file carries its own BEGIN/COMMIT.
  await client.query(statements);
  console.log('Applied.\n');

  const { rows } = await client.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE (table_name = 'posts'    AND column_name LIKE 'author%')
       OR (table_name = '_posts_v' AND column_name LIKE 'version_author%')
    ORDER BY table_name, column_name
  `);

  console.log(`Columns now present (${rows.length} of 10 expected):`);
  for (const r of rows) console.log(`  ${r.table_name}.${r.column_name}`);

  if (rows.length !== 10) {
    console.error('\nThat is not the expected count. Do not assume this worked.');
    process.exit(1);
  }
  console.log('\nRestart the dev server and /insights should load.');
} catch (error) {
  console.error('\nFailed, and the transaction rolled back. Nothing was changed.');
  console.error(`  ${error.message}`);
  if (error.code) console.error(`  code=${error.code}`);
  process.exit(1);
} finally {
  await client.end();
}
