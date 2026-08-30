-- Creates the table behind the Tool Downloads collection.
--
-- Hand-written, for the reason recorded in src/migrations/index.ts: this
-- project's schema was built by dev push, so `payload migrate:create` has no
-- baseline to diff against and emits a from-scratch build of every table with
-- DROP TABLE ... CASCADE in its down(). Running that against a database that
-- holds the content is not what "add one table" should mean.
--
-- Everything here is additive and idempotent. Nothing is dropped, nothing is
-- rewritten, and running it twice is harmless.
--
-- Run against the DIRECT (unpooled) Neon endpoint, or paste into the Neon SQL
-- editor.

BEGIN;

-- Payload renders these two as dropdowns and stores them as Postgres enums.
DO $$ BEGIN
  CREATE TYPE "public"."enum_tool_leads_tool" AS ENUM('bi-automation-calculator');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_tool_leads_status" AS ENUM('new', 'contacted', 'not-a-fit', 'spam');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "tool_leads" (
  "id"         serial PRIMARY KEY NOT NULL,
  "email"      varchar NOT NULL,
  "tool"       "enum_tool_leads_tool"   DEFAULT 'bi-automation-calculator',
  "status"     "enum_tool_leads_status" DEFAULT 'new',
  "summary"    varchar,
  "share_url"  varchar,
  "notes"      varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

-- The collection marks email as indexed, and the admin list sorts by newest.
CREATE INDEX IF NOT EXISTS "tool_leads_email_idx"      ON "tool_leads" USING btree ("email");
CREATE INDEX IF NOT EXISTS "tool_leads_created_at_idx" ON "tool_leads" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "tool_leads_updated_at_idx" ON "tool_leads" USING btree ("updated_at");

-- Payload's admin lock and preference tables carry a column per collection.
-- Without these the admin errors when it tries to lock a Tool Download for
-- editing, which looks like a broken record rather than a missing column.
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tool_leads_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_tool_leads_fk"
    FOREIGN KEY ("tool_leads_id") REFERENCES "public"."tool_leads"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tool_leads_id_idx"
  ON "payload_locked_documents_rels" USING btree ("tool_leads_id");

COMMIT;

-- Confirm:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'tool_leads';
