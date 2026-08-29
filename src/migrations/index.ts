/**
 * No migrations yet.
 *
 * `migrate:create` was run once against an empty src/migrations, so it had
 * nothing to diff against and emitted a from-scratch build of the entire
 * schema: CREATE TABLE for every table, and DROP TABLE ... CASCADE for every
 * table in its down(). That is correct output for a new database and wrong for
 * this one, which already holds the content and is shared with the deployed
 * site. It has been moved to _to_delete/migrations-baseline rather than left
 * here where `npm run migrate` would find it.
 *
 * The author columns it was meant to add were applied by hand instead; see
 * add-author-columns.sql, which is additive and idempotent.
 *
 * Before generating another one, read SETUP.md: on a database whose schema was
 * built by dev push, a first migration has to be baselined, not applied.
 */
export const migrations = [];
