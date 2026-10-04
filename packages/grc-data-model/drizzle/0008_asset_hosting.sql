CREATE TYPE "public"."asset_hosting" AS ENUM('in_house', 'cloud');--> statement-breakpoint
ALTER TABLE "asset" ADD COLUMN "hosting" "asset_hosting";