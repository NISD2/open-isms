-- Add slug nullable first so existing rows survive, backfill a unique slug
-- derived from the subject (suffixed with a short id slice to guarantee
-- uniqueness), then enforce NOT NULL. Migrations transform, they do not lose.
ALTER TABLE "newsletter_issue" ADD COLUMN "slug" varchar(200);--> statement-breakpoint
UPDATE "newsletter_issue"
SET "slug" = left(
  trim(both '-' from regexp_replace(lower(coalesce(nullif(trim("subject"), ''), 'issue')), '[^a-z0-9]+', '-', 'g'))
  || '-' || left("id"::text, 8),
  200
)
WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "newsletter_issue" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_issue" ADD COLUMN "cta_key" varchar(30);--> statement-breakpoint
ALTER TABLE "newsletter_issue" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_newsletter_issue_slug" ON "newsletter_issue" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_newsletter_issue_published" ON "newsletter_issue" USING btree ("published_at");