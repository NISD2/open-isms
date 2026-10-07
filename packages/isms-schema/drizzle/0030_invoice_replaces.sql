-- migration-safety:allow: replaces_invoice_id is added in this same migration, so every existing invoice
-- row is NULL, which neither the foreign key nor the UNIQUE constraint can reject. The invoice table
-- holds one row per sale, so the brief lock is negligible.
ALTER TABLE "invoice" ADD COLUMN "replaces_invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_replaces_invoice_id_invoice_id_fk" FOREIGN KEY ("replaces_invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_replaces_invoice_id_unique" UNIQUE("replaces_invoice_id");