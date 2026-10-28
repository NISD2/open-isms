-- migration-safety:allow: the CHECK on asset covers two columns this same migration adds, null
-- and false on every existing row, so validating it scans nothing that can fail; the constraints
-- on process_asset sit on a table created empty here.
CREATE TYPE "public"."outage_span" AS ENUM('hours', 'day', 'three_days', 'week', 'longer');--> statement-breakpoint
CREATE TABLE "process_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "process_asset_two_things" CHECK ("process_asset"."process_id" <> "process_asset"."asset_id")
);
--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "max_outage" "outage_span";--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "restore_time" "outage_span";--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "restore_time_unknown" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "process_asset" ADD CONSTRAINT "process_asset_process_id_asset_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_asset" ADD CONSTRAINT "process_asset_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_process_asset_pair" ON "process_asset" USING btree ("process_id","asset_id");--> statement-breakpoint
CREATE INDEX "idx_process_asset_asset" ON "process_asset" USING btree ("asset_id");--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_restore_time_or_unknown" CHECK (NOT ("asset"."restore_time" IS NOT NULL AND "asset"."restore_time_unknown"));