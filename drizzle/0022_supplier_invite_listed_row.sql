-- migration-safety:allow: the foreign key covers only supplier_id, added empty in this same
-- migration, so every existing row holds NULL and passes it. The supplier table comes from the GRC
-- history, which runtime-migrate applies before this one.
ALTER TABLE "supplier_invite" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "supplier_invite" ADD CONSTRAINT "supplier_invite_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE set null ON UPDATE no action;