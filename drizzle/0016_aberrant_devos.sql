ALTER TABLE "gap_assessment" ADD COLUMN "share_token" uuid;--> statement-breakpoint
ALTER TABLE "gap_assessment" ADD COLUMN "share_password_hash" text;--> statement-breakpoint
ALTER TABLE "gap_assessment" ADD COLUMN "shared_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_gap_assessment_share_token" ON "gap_assessment" USING btree ("share_token");