CREATE TYPE "public"."legal_basis" AS ENUM('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests');--> statement-breakpoint
CREATE TYPE "public"."subprocessor_authorisation" AS ENUM('general', 'specific', 'not_stated');--> statement-breakpoint
CREATE TABLE "processing_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"catalog_id" varchar(80),
	"purpose" text,
	"legal_bases" "legal_basis"[],
	"legitimate_interests" text,
	"data_subjects" text,
	"data_categories" text,
	"special_categories" boolean,
	"recipients" text,
	"transfers_outside_eea" boolean,
	"transfer_details" text,
	"retention" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "dpa_concluded" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "subprocessor_authorisation" "subprocessor_authorisation";--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "processor_checked_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_processing_activity_company" ON "processing_activity" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_processing_activity_catalog" ON "processing_activity" USING btree ("company_id","catalog_id") WHERE "processing_activity"."catalog_id" IS NOT NULL;