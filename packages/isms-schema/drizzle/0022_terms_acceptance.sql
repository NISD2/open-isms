-- migration-safety:allow: the three columns are added in this same migration, so every existing
-- invoice row has all three NULL and satisfies both checks and the foreign key by construction.
ALTER TABLE "invoice" ADD COLUMN "terms_version" varchar(10);--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "terms_accepted_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_terms_accepted_by_user_id_user_id_fk" FOREIGN KEY ("terms_accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_terms_version_with_time" CHECK (("invoice"."terms_version" IS NULL) = ("invoice"."terms_accepted_at" IS NULL));--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_terms_by_only_if_accepted" CHECK ("invoice"."terms_accepted_by_user_id" IS NULL OR "invoice"."terms_accepted_at" IS NOT NULL);