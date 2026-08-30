-- Creates the table behind the rate limiter.
--
-- Hand-written for the reason in src/migrations/index.ts: this database's
-- schema was built by dev push, so `payload migrate:create` emits a
-- from-scratch build of every table with DROP TABLE ... CASCADE in its down().
--
-- Additive and idempotent. Nothing is dropped; running it twice is harmless.
--
-- Column types match what Payload's drizzle adapter generates for the
-- collection in src/collections/RateLimits.ts — varchar, timestamp(3) with time
-- zone, numeric — so a dev `push` sees no drift and proposes no changes.
--
--   node src/migrations/manual/apply.mjs 2026-08-30-rate-limits.sql

BEGIN;

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "id"           serial PRIMARY KEY NOT NULL,
  "key"          varchar NOT NULL,
  "window_start" timestamp(3) with time zone NOT NULL,
  "count"        numeric NOT NULL DEFAULT 0,
  "updated_at"   timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at"   timestamp(3) with time zone DEFAULT now() NOT NULL
);

-- The upsert in src/lib/rate-limit.ts uses ON CONFLICT ("key"), which needs a
-- unique index on that column. Without it every request inserts a new row and
-- the limiter counts to one forever — it would look like it was working.
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limits_key_idx" ON "rate_limits" USING btree ("key");

-- For the periodic housekeeping sweep in rate-limit.ts, which clears rows whose
-- window closed long ago. One row per address per limit would otherwise
-- accumulate for the life of the site.
CREATE INDEX IF NOT EXISTS "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");

CREATE INDEX IF NOT EXISTS "rate_limits_updated_at_idx" ON "rate_limits" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "rate_limits_created_at_idx" ON "rate_limits" USING btree ("created_at");

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "rate_limits_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_rate_limits_fk"
    FOREIGN KEY ("rate_limits_id") REFERENCES "public"."rate_limits"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_rate_limits_id_idx"
  ON "payload_locked_documents_rels" USING btree ("rate_limits_id");

COMMIT;

-- Confirm:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'rate_limits' ORDER BY column_name
