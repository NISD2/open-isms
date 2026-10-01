-- migration-safety:allow: supplier_id is added in this same migration, so every existing asset row
-- has it NULL and satisfies the foreign key by construction. The index cannot be built
-- CONCURRENTLY on this runner (drizzle-kit migrate runs every migration in one transaction, see
-- isms-schema 0009), and asset holds each company's own register (the catalogue that seeds it has
-- 58 entries), so the build's write lock is short.
ALTER TABLE "asset" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_asset_supplier" ON "asset" USING btree ("supplier_id");