-- migration-safety:allow: all three waiver columns are added in this same migration, so every
-- existing invoice row has them NULL and satisfies the foreign key and both CHECKs by construction.
-- Validating scans the invoice table, which holds one row per issued invoice.
CREATE TYPE "public"."money_back_waived_through" AS ENUM('export', 'sign_off');--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "money_back_waived_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "money_back_waived_through" "money_back_waived_through";--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "money_back_waived_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_money_back_waived_by_user_id_user_id_fk" FOREIGN KEY ("money_back_waived_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_waiver_time_with_through" CHECK (("invoice"."money_back_waived_at" IS NULL) = ("invoice"."money_back_waived_through" IS NULL));--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_waiver_by_only_if_waived" CHECK ("invoice"."money_back_waived_by_user_id" IS NULL OR "invoice"."money_back_waived_at" IS NOT NULL);