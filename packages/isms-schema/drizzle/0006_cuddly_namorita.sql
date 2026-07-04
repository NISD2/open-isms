ALTER TABLE "company" ADD COLUMN "activated_at" timestamp;--> statement-breakpoint
-- Backfill: every company that existed before draft-provisioning is a real,
-- activated org. Stamp it as activated at its creation time so the draft-vs-
-- activated discriminator (activated_at IS NULL = draft) never misclassifies
-- an existing customer as an unactivated shell.
UPDATE "company" SET "activated_at" = "created_at" WHERE "activated_at" IS NULL;