CREATE TYPE "public"."newsletter_issue_status" AS ENUM('draft', 'sent');--> statement-breakpoint
CREATE TABLE "newsletter_issue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" varchar(500) NOT NULL,
	"preheader" varchar(500),
	"body_markdown" text DEFAULT '' NOT NULL,
	"status" "newsletter_issue_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"recipient_count" integer
);
--> statement-breakpoint
CREATE INDEX "idx_newsletter_issue_status" ON "newsletter_issue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_newsletter_issue_created" ON "newsletter_issue" USING btree ("created_at");