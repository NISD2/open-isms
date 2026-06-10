ALTER TABLE "requirement" RENAME COLUMN "directive_article" TO "framework_ref";--> statement-breakpoint
ALTER TABLE "requirement_category" RENAME COLUMN "nis2_url" TO "reference_url";--> statement-breakpoint
ALTER TABLE "requirement_category" RENAME COLUMN "bsig_url" TO "national_url";
