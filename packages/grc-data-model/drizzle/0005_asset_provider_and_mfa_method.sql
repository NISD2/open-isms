-- migration-safety:allow: both foreign keys are on asset_provider, created empty in this same
-- migration, so validating them scans no rows. The backfill at the end runs after them and copies
-- only pairs from asset.supplier_id, which is itself a foreign key to supplier.
CREATE TYPE "public"."asset_mfa_method" AS ENUM('app', 'security_key', 'company_account', 'sms', 'email');--> statement-breakpoint
CREATE TABLE "asset_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "mfa_method" "asset_mfa_method";--> statement-breakpoint
ALTER TABLE "asset_provider" ADD CONSTRAINT "asset_provider_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_provider" ADD CONSTRAINT "asset_provider_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_asset_provider_pair" ON "asset_provider" USING btree ("asset_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_asset_provider_supplier" ON "asset_provider" USING btree ("supplier_id");--> statement-breakpoint
-- The one provider 2.2 recorded per asset moves here, where an asset can have several. Safe to
-- rerun: the pair is unique. asset.supplier_id stays until a later release, after no running
-- code reads or writes it.
INSERT INTO "asset_provider" ("asset_id", "supplier_id")
SELECT "id", "supplier_id" FROM "asset" WHERE "supplier_id" IS NOT NULL
ON CONFLICT DO NOTHING;