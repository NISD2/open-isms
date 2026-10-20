CREATE TYPE "public"."personal_data_transfers" AS ENUM('inEea', 'adequacy', 'sccs', 'bcr', 'other');--> statement-breakpoint
CREATE TYPE "public"."subprocessor_engagement" AS ENUM('general', 'specific', 'none');--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "personal_data_transfers" "personal_data_transfers";--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "subprocessor_engagement" "subprocessor_engagement";--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "breach_notice_to_controller" boolean;