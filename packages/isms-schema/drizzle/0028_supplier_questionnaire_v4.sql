CREATE TYPE "public"."data_processing_agreement" AS ENUM('available', 'independentController', 'noPersonalData', 'no');--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "processes_customer_data" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "accesses_customer_systems" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "accesses_customer_premises" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "subprocessor_requirements_passed_on" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "confidentiality_committed" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "data_processing_agreement" "data_processing_agreement";--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "encryption_at_rest" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "encryption_in_transit" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "secure_development" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "vulnerability_disclosure_policy" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "customer_access_personal_mfa" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "customer_access_logged" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "premises_access_managed" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "premises_conduct_rules" boolean;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "on_prem_support_end" varchar(255);--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "platform_supplier_linked_at" timestamp;--> statement-breakpoint
-- A dpa_available answer is the same statement as one of the new question's options; the other
-- replaced questions ask something broader, so their answers do not carry over.
UPDATE "company" SET "data_processing_agreement" = CASE WHEN "dpa_available" THEN 'available'::"data_processing_agreement" ELSE 'no'::"data_processing_agreement" END WHERE "dpa_available" IS NOT NULL;