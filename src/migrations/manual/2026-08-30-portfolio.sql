-- Creates the tables behind the Portfolio collection.
--
-- Extracted from the output of `payload migrate:create`, which is the only
-- thing that knows Payload's exact table and column naming for a blocks field.
-- That generated file built the ENTIRE schema — 53 CREATE TABLE and 53
-- DROP TABLE ... CASCADE — because src/migrations was empty so it had nothing
-- to diff against. Running it would have dropped every table holding content.
-- It has been deleted; only the portfolio statements survive, here.
--
-- 26 tables: 13 for the collection and its blocks, 13 more for the draft
-- versions Payload keeps because the collection has `versions: { drafts: true }`.
--
-- Every statement is additive and idempotent — CREATE ... IF NOT EXISTS, and
-- enums and constraints guarded against already existing. Nothing is dropped
-- and running it twice changes nothing.
--
--   node src/migrations/manual/apply.mjs 2026-08-30-portfolio.sql

BEGIN;

-- The admin locks a document while somebody edits it, and that table carries a
-- column per collection. Added explicitly, because the generated version came
-- inside a CREATE TABLE for a table that already exists.
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "portfolio_id" integer;

DO $$ BEGIN
  CREATE TYPE "public"."enum_portfolio_blocks_feature_grid_columns" AS ENUM('2', '3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_portfolio_blocks_gallery_columns" AS ENUM('2', '3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_portfolio_kind" AS ENUM('product', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_portfolio_sector" AS ENUM('manufacturing', 'oil-and-gas', 'fintech', 'retail-ecommerce', 'healthcare', 'logistics', 'cross-industry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_portfolio_status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__portfolio_v_blocks_feature_grid_columns" AS ENUM('2', '3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__portfolio_v_blocks_gallery_columns" AS ENUM('2', '3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__portfolio_v_version_kind" AS ENUM('product', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__portfolio_v_version_sector" AS ENUM('manufacturing', 'oil-and-gas', 'fintech', 'retail-ecommerce', 'healthcare', 'logistics', 'cross-industry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__portfolio_v_version_status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "portfolio_blocks_prose" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" jsonb,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"columns" "enum_portfolio_blocks_feature_grid_columns" DEFAULT '3',
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"note" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_image_full" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"wide" boolean,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_image_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_id" integer,
  	"right_id" integer,
  	"caption" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "enum_portfolio_blocks_gallery_columns" DEFAULT '2',
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_flow_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_flow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "portfolio" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"kind" "enum_portfolio_kind" DEFAULT 'product',
  	"sector" "enum_portfolio_sector",
  	"client_name" varchar,
  	"client_permission" boolean DEFAULT false,
  	"summary" varchar,
  	"cover_image_id" integer,
  	"featured" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_portfolio_status" DEFAULT 'draft'
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_prose" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"columns" "enum__portfolio_v_blocks_feature_grid_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_image_full" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"wide" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_image_pair" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"left_id" integer,
  	"right_id" integer,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" "enum__portfolio_v_blocks_gallery_columns" DEFAULT '2',
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_flow_stages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_flow" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"role" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

CREATE TABLE IF NOT EXISTS "_portfolio_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_kind" "enum__portfolio_v_version_kind" DEFAULT 'product',
  	"version_sector" "enum__portfolio_v_version_sector",
  	"version_client_name" varchar,
  	"version_client_permission" boolean DEFAULT false,
  	"version_summary" varchar,
  	"version_cover_image_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__portfolio_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_prose" ADD CONSTRAINT "portfolio_blocks_prose_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_feature_grid_items" ADD CONSTRAINT "portfolio_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_feature_grid" ADD CONSTRAINT "portfolio_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_steps_items" ADD CONSTRAINT "portfolio_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_steps" ADD CONSTRAINT "portfolio_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_image_full" ADD CONSTRAINT "portfolio_blocks_image_full_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_image_full" ADD CONSTRAINT "portfolio_blocks_image_full_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_image_pair" ADD CONSTRAINT "portfolio_blocks_image_pair_left_id_media_id_fk" FOREIGN KEY ("left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_image_pair" ADD CONSTRAINT "portfolio_blocks_image_pair_right_id_media_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_image_pair" ADD CONSTRAINT "portfolio_blocks_image_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_gallery_items" ADD CONSTRAINT "portfolio_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_gallery_items" ADD CONSTRAINT "portfolio_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_gallery" ADD CONSTRAINT "portfolio_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_flow_stages" ADD CONSTRAINT "portfolio_blocks_flow_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio_blocks_flow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_flow" ADD CONSTRAINT "portfolio_blocks_flow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio_blocks_quote" ADD CONSTRAINT "portfolio_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "portfolio" ADD CONSTRAINT "portfolio_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_prose" ADD CONSTRAINT "_portfolio_v_blocks_prose_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_feature_grid_items" ADD CONSTRAINT "_portfolio_v_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_feature_grid" ADD CONSTRAINT "_portfolio_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_steps_items" ADD CONSTRAINT "_portfolio_v_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_steps" ADD CONSTRAINT "_portfolio_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_image_full" ADD CONSTRAINT "_portfolio_v_blocks_image_full_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_image_full" ADD CONSTRAINT "_portfolio_v_blocks_image_full_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_image_pair" ADD CONSTRAINT "_portfolio_v_blocks_image_pair_left_id_media_id_fk" FOREIGN KEY ("left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_image_pair" ADD CONSTRAINT "_portfolio_v_blocks_image_pair_right_id_media_id_fk" FOREIGN KEY ("right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_image_pair" ADD CONSTRAINT "_portfolio_v_blocks_image_pair_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_gallery_items" ADD CONSTRAINT "_portfolio_v_blocks_gallery_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_gallery_items" ADD CONSTRAINT "_portfolio_v_blocks_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_gallery" ADD CONSTRAINT "_portfolio_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_flow_stages" ADD CONSTRAINT "_portfolio_v_blocks_flow_stages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v_blocks_flow"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_flow" ADD CONSTRAINT "_portfolio_v_blocks_flow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v_blocks_quote" ADD CONSTRAINT "_portfolio_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_portfolio_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v" ADD CONSTRAINT "_portfolio_v_parent_id_portfolio_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."portfolio"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "_portfolio_v" ADD CONSTRAINT "_portfolio_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_portfolio_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolio"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "portfolio_blocks_prose_order_idx" ON "portfolio_blocks_prose" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_prose_parent_id_idx" ON "portfolio_blocks_prose" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_prose_path_idx" ON "portfolio_blocks_prose" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_feature_grid_items_order_idx" ON "portfolio_blocks_feature_grid_items" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_feature_grid_items_parent_id_idx" ON "portfolio_blocks_feature_grid_items" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_feature_grid_order_idx" ON "portfolio_blocks_feature_grid" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_feature_grid_parent_id_idx" ON "portfolio_blocks_feature_grid" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_feature_grid_path_idx" ON "portfolio_blocks_feature_grid" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_steps_items_order_idx" ON "portfolio_blocks_steps_items" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_steps_items_parent_id_idx" ON "portfolio_blocks_steps_items" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_steps_order_idx" ON "portfolio_blocks_steps" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_steps_parent_id_idx" ON "portfolio_blocks_steps" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_steps_path_idx" ON "portfolio_blocks_steps" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_full_order_idx" ON "portfolio_blocks_image_full" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_full_parent_id_idx" ON "portfolio_blocks_image_full" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_full_path_idx" ON "portfolio_blocks_image_full" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_full_image_idx" ON "portfolio_blocks_image_full" USING btree ("image_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_pair_order_idx" ON "portfolio_blocks_image_pair" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_pair_parent_id_idx" ON "portfolio_blocks_image_pair" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_pair_path_idx" ON "portfolio_blocks_image_pair" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_pair_left_idx" ON "portfolio_blocks_image_pair" USING btree ("left_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_image_pair_right_idx" ON "portfolio_blocks_image_pair" USING btree ("right_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_gallery_items_order_idx" ON "portfolio_blocks_gallery_items" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_gallery_items_parent_id_idx" ON "portfolio_blocks_gallery_items" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_gallery_items_image_idx" ON "portfolio_blocks_gallery_items" USING btree ("image_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_gallery_order_idx" ON "portfolio_blocks_gallery" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_gallery_parent_id_idx" ON "portfolio_blocks_gallery" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_gallery_path_idx" ON "portfolio_blocks_gallery" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_flow_stages_order_idx" ON "portfolio_blocks_flow_stages" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_flow_stages_parent_id_idx" ON "portfolio_blocks_flow_stages" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_flow_order_idx" ON "portfolio_blocks_flow" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_flow_parent_id_idx" ON "portfolio_blocks_flow" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_flow_path_idx" ON "portfolio_blocks_flow" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_quote_order_idx" ON "portfolio_blocks_quote" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_quote_parent_id_idx" ON "portfolio_blocks_quote" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "portfolio_blocks_quote_path_idx" ON "portfolio_blocks_quote" USING btree ("_path");

CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_slug_idx" ON "portfolio" USING btree ("slug");

CREATE INDEX IF NOT EXISTS "portfolio_cover_image_idx" ON "portfolio" USING btree ("cover_image_id");

CREATE INDEX IF NOT EXISTS "portfolio_updated_at_idx" ON "portfolio" USING btree ("updated_at");

CREATE INDEX IF NOT EXISTS "portfolio_created_at_idx" ON "portfolio" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "portfolio__status_idx" ON "portfolio" USING btree ("_status");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_prose_order_idx" ON "_portfolio_v_blocks_prose" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_prose_parent_id_idx" ON "_portfolio_v_blocks_prose" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_prose_path_idx" ON "_portfolio_v_blocks_prose" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_feature_grid_items_order_idx" ON "_portfolio_v_blocks_feature_grid_items" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_feature_grid_items_parent_id_idx" ON "_portfolio_v_blocks_feature_grid_items" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_feature_grid_order_idx" ON "_portfolio_v_blocks_feature_grid" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_feature_grid_parent_id_idx" ON "_portfolio_v_blocks_feature_grid" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_feature_grid_path_idx" ON "_portfolio_v_blocks_feature_grid" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_steps_items_order_idx" ON "_portfolio_v_blocks_steps_items" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_steps_items_parent_id_idx" ON "_portfolio_v_blocks_steps_items" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_steps_order_idx" ON "_portfolio_v_blocks_steps" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_steps_parent_id_idx" ON "_portfolio_v_blocks_steps" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_steps_path_idx" ON "_portfolio_v_blocks_steps" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_full_order_idx" ON "_portfolio_v_blocks_image_full" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_full_parent_id_idx" ON "_portfolio_v_blocks_image_full" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_full_path_idx" ON "_portfolio_v_blocks_image_full" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_full_image_idx" ON "_portfolio_v_blocks_image_full" USING btree ("image_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_pair_order_idx" ON "_portfolio_v_blocks_image_pair" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_pair_parent_id_idx" ON "_portfolio_v_blocks_image_pair" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_pair_path_idx" ON "_portfolio_v_blocks_image_pair" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_pair_left_idx" ON "_portfolio_v_blocks_image_pair" USING btree ("left_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_image_pair_right_idx" ON "_portfolio_v_blocks_image_pair" USING btree ("right_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_gallery_items_order_idx" ON "_portfolio_v_blocks_gallery_items" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_gallery_items_parent_id_idx" ON "_portfolio_v_blocks_gallery_items" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_gallery_items_image_idx" ON "_portfolio_v_blocks_gallery_items" USING btree ("image_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_gallery_order_idx" ON "_portfolio_v_blocks_gallery" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_gallery_parent_id_idx" ON "_portfolio_v_blocks_gallery" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_gallery_path_idx" ON "_portfolio_v_blocks_gallery" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_flow_stages_order_idx" ON "_portfolio_v_blocks_flow_stages" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_flow_stages_parent_id_idx" ON "_portfolio_v_blocks_flow_stages" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_flow_order_idx" ON "_portfolio_v_blocks_flow" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_flow_parent_id_idx" ON "_portfolio_v_blocks_flow" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_flow_path_idx" ON "_portfolio_v_blocks_flow" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_quote_order_idx" ON "_portfolio_v_blocks_quote" USING btree ("_order");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_quote_parent_id_idx" ON "_portfolio_v_blocks_quote" USING btree ("_parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_blocks_quote_path_idx" ON "_portfolio_v_blocks_quote" USING btree ("_path");

CREATE INDEX IF NOT EXISTS "_portfolio_v_parent_idx" ON "_portfolio_v" USING btree ("parent_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_version_version_slug_idx" ON "_portfolio_v" USING btree ("version_slug");

CREATE INDEX IF NOT EXISTS "_portfolio_v_version_version_cover_image_idx" ON "_portfolio_v" USING btree ("version_cover_image_id");

CREATE INDEX IF NOT EXISTS "_portfolio_v_version_version_updated_at_idx" ON "_portfolio_v" USING btree ("version_updated_at");

CREATE INDEX IF NOT EXISTS "_portfolio_v_version_version_created_at_idx" ON "_portfolio_v" USING btree ("version_created_at");

CREATE INDEX IF NOT EXISTS "_portfolio_v_version_version__status_idx" ON "_portfolio_v" USING btree ("version__status");

CREATE INDEX IF NOT EXISTS "_portfolio_v_created_at_idx" ON "_portfolio_v" USING btree ("created_at");

CREATE INDEX IF NOT EXISTS "_portfolio_v_updated_at_idx" ON "_portfolio_v" USING btree ("updated_at");

CREATE INDEX IF NOT EXISTS "_portfolio_v_latest_idx" ON "_portfolio_v" USING btree ("latest");

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_portfolio_id_idx" ON "payload_locked_documents_rels" USING btree ("portfolio_id");

COMMIT;

-- Confirm:
--   SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%portfolio%' ORDER BY table_name
