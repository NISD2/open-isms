ALTER TABLE "asset" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_asset_supplier" ON "asset" USING btree ("supplier_id");