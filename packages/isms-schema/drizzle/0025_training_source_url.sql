-- migration-safety:allow: the CHECK covers only source_url, added empty in this same migration, so
-- every existing row holds NULL and passes it.
ALTER TABLE "training_record" ADD COLUMN "source_url" varchar(2048);--> statement-breakpoint
ALTER TABLE "training_record" ADD CONSTRAINT "chk_training_source_url" CHECK ("training_record"."source_url" IS NULL OR "training_record"."source_url" ILIKE 'https://%' OR "training_record"."source_url" ILIKE 'http://%');