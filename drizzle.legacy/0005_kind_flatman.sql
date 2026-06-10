CREATE TYPE "public"."supplier_relationship_type" AS ENUM('processor', 'joint_controller', 'separate_controller', 'internal');--> statement-breakpoint
CREATE TYPE "public"."transfer_mechanism" AS ENUM('adequacy', 'sccs', 'bcr', 'derogation', 'none');--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "processes_personal_data" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "incident" ADD COLUMN "requires_gdpr_notification" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "incident" ADD COLUMN "data_subjects_affected" integer;--> statement-breakpoint
ALTER TABLE "incident" ADD COLUMN "gdpr_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "relationship_type" "supplier_relationship_type";--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "processes_personal_data" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "international_transfer" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "transfer_mechanism" "transfer_mechanism";