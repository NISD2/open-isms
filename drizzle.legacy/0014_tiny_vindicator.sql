CREATE TABLE "email_otp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"consumed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
-- Backfill: grandfather existing users as verified at their createdAt timestamp.
-- Without this, every existing Credentials user would be locked out on next
-- login by the new EMAIL_NOT_VERIFIED guard in authorize().
UPDATE "user" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_email_otp_lookup" ON "email_otp" USING btree ("email","purpose");--> statement-breakpoint
CREATE INDEX "idx_email_otp_cleanup" ON "email_otp" USING btree ("expires_at");