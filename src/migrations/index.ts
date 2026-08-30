/**
 * No Payload migrations, deliberately.
 *
 * `migrate:create` was run once against an empty src/migrations, so it had
 * nothing to diff against and emitted a from-scratch build of the entire
 * schema: CREATE TABLE for every table, and DROP TABLE ... CASCADE for every
 * table in its down(). That is correct output for a new database and wrong for
 * this one, which already holds the content and is shared with the deployed
 * site. It was moved to _to_delete/migrations-baseline rather than left here
 * where `npm run migrate` would find it.
 *
 * Schema changes are applied by hand instead, from src/migrations/manual/.
 * Each file there is additive and idempotent — no DROP, no data rewrite, safe
 * to run twice — and apply.mjs refuses to run one that is not:
 *
 *   node src/migrations/manual/apply.mjs 2026-08-30-tool-leads.sql
 *
 * Every new collection needs one. Production runs with push off, so a
 * collection added to payload.config.ts without a file here has no table
 * behind it and fails at the first write, exactly as the author columns did.
 *
 * Before generating another Payload migration, read SETUP.md: on a database
 * whose schema was built by dev push, a first migration has to be baselined,
 * not applied.
 */
export const migrations = [];
