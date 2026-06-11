ALTER TABLE "gap_assessment" ADD COLUMN IF NOT EXISTS "share_token" uuid;--> statement-breakpoint
ALTER TABLE "gap_assessment" ADD COLUMN IF NOT EXISTS "share_password_hash" text;--> statement-breakpoint
ALTER TABLE "gap_assessment" ADD COLUMN IF NOT EXISTS "shared_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_gap_assessment_share_token" ON "gap_assessment" USING btree ("share_token");
