-- Adds the author fields to Posts.
--
-- Written by hand instead of using the generated migration, because
-- src/migrations was empty when migrate:create ran, so it diffed the config
-- against nothing and produced a from-scratch build of the whole schema:
-- CREATE TABLE for every table, and DROP TABLE ... CASCADE for every table in
-- its down(). Applying that to a database that already holds the content, and
-- that the live site reads from, is not what "add five columns" should mean.
--
-- Every statement here is additive and idempotent. Nothing drops, nothing
-- rewrites a row, and running it twice is harmless. The columns are nullable,
-- so existing posts keep working and publish under the company byline until
-- somebody fills a name in.
--
-- Run against the DIRECT (unpooled) Neon endpoint, or paste into the Neon SQL
-- editor.

BEGIN;

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_name"     varchar;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_role"     varchar;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_bio"      varchar;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_photo_id" integer;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_url"      varchar;

-- Drafts and version history live in their own table, and Payload reads the
-- same fields from it. Without these, saving a draft fails the same way the
-- page did.
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_author_name"     varchar;
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_author_role"     varchar;
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_author_bio"      varchar;
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_author_photo_id" integer;
ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_author_url"      varchar;

-- The photo points at the media library. ON DELETE SET NULL, so removing an
-- image blanks the byline photo rather than refusing the delete or taking the
-- post with it.
DO $$ BEGIN
  ALTER TABLE "posts"
    ADD CONSTRAINT "posts_author_photo_id_media_id_fk"
    FOREIGN KEY ("author_photo_id") REFERENCES "public"."media"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_posts_v"
    ADD CONSTRAINT "_posts_v_version_author_photo_id_media_id_fk"
    FOREIGN KEY ("version_author_photo_id") REFERENCES "public"."media"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payload creates these too. Without them nothing breaks, but every lookup
-- that joins the byline photo is a sequential scan.
CREATE INDEX IF NOT EXISTS "posts_author_author_photo_idx"
  ON "posts" USING btree ("author_photo_id");
CREATE INDEX IF NOT EXISTS "_posts_v_version_author_version_author_photo_idx"
  ON "_posts_v" USING btree ("version_author_photo_id");

COMMIT;

-- Confirm:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'posts' AND column_name LIKE 'author%';
