/**
 * Says why /portfolio is empty.
 *
 *   node tools/portfolio-status.mjs
 *
 * Run from the repository root. Reads .env.local and asks the database three
 * questions in order, because they fail in order: do the tables exist, is there
 * a row, and is that row published. Each answer names the next step rather than
 * leaving you to infer it.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const connectionString = env.DATABASE_URI_UNPOOLED || env.DATABASE_URI;
if (!connectionString) {
  console.error('No DATABASE_URI in .env.local.');
  process.exit(1);
}

const client = new Client({ connectionString });
try {
  await client.connect();
} catch (error) {
  console.error(`Could not reach the database: ${error.message}`);
  process.exit(1);
}

const q = async (sql, params = []) => (await client.query(sql, params)).rows;

try {
  const tables = await q(`
    SELECT count(*)::int AS n FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE '%portfolio%'
  `);
  console.log(`portfolio tables:  ${tables[0].n} of 26`);

  if (tables[0].n === 0) {
    console.log('\nThe migration has not been run. That is the whole problem:\n');
    console.log('  node src/migrations/manual/apply.mjs 2026-08-30-portfolio.sql\n');
    process.exit(0);
  }
  if (tables[0].n < 26) {
    console.log('\nSome tables are missing — the migration was interrupted. It is idempotent,');
    console.log('so running it again will create only what is absent:\n');
    console.log('  node src/migrations/manual/apply.mjs 2026-08-30-portfolio.sql\n');
    process.exit(0);
  }

  const rows = await q(`SELECT id, slug, title, _status, published_at FROM portfolio ORDER BY id`);
  console.log(`entries:           ${rows.length}`);

  if (rows.length === 0) {
    console.log('\nTables exist but nothing is in them. Seed it:\n');
    console.log('  npm run seed:predictx\n');
    process.exit(0);
  }

  for (const r of rows) {
    const blocks = await q(
      `SELECT count(*)::int AS n FROM portfolio_blocks_prose WHERE _parent_id = $1`,
      [r.id],
    );
    console.log(`  #${r.id}  /${r.slug}  ${r._status}  (${blocks[0].n} prose blocks)  ${r.title}`);
  }

  const drafts = rows.filter((r) => r._status !== 'published');
  if (drafts.length === rows.length) {
    console.log('\nEverything is a draft, and the site only shows published entries.');
    console.log('Publish it in the admin, or re-run the seed which sets it published.');
  } else {
    console.log('\nThe data is there and published. If the page is still empty it is the');
    console.log('page cache: /portfolio carries `export const revalidate = 300`, so a copy');
    console.log('rendered before the seed can be served for up to five minutes. Restart the');
    console.log('dev server to clear it.');
  }
} finally {
  await client.end();
}
