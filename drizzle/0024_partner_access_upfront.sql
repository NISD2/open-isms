-- migration-safety:allow: the foreign key and the CHECK cover only access_user_id and
-- access_outcome, both added empty in this same migration, so every existing row holds NULL and
-- passes them. The user table comes from the ISMS history, which runtime-migrate applies first.
CREATE TYPE "public"."partner_access_outcome" AS ENUM('new_account', 'existing_account', 'not_holder', 'failed');--> statement-breakpoint
ALTER TABLE "partner_contract" ADD COLUMN "access_outcome" "partner_access_outcome";--> statement-breakpoint
ALTER TABLE "partner_contract" ADD COLUMN "access_user_id" uuid;--> statement-breakpoint
ALTER TABLE "partner_contract" ADD CONSTRAINT "partner_contract_access_user_id_user_id_fk" FOREIGN KEY ("access_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_contract" ADD CONSTRAINT "partner_contract_access_user_granted" CHECK ("partner_contract"."access_user_id" is null or "partner_contract"."access_outcome" in ('new_account', 'existing_account'));