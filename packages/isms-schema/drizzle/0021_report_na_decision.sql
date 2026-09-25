-- migration-safety:allow: the foreign key is on a column added two statements
-- earlier, so every existing row holds NULL and the validation cannot fail.
ALTER TABLE "company_requirement_status" ADD COLUMN "not_applicable_by" uuid;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD COLUMN "not_applicable_at" timestamp;--> statement-breakpoint
ALTER TABLE "company_requirement_status" ADD CONSTRAINT "company_requirement_status_not_applicable_by_user_id_fk" FOREIGN KEY ("not_applicable_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;