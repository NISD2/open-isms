ALTER TABLE "user" ADD COLUMN "login_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tour_dismissed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "help_offer_dismissed_at" timestamp;