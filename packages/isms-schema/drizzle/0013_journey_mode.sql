CREATE TYPE "public"."journey_mode" AS ENUM('solo', 'team');--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "journey_mode" "journey_mode";