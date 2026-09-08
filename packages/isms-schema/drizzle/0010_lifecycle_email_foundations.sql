-- migration-safety:allow: notification is small (reminder/newsletter bookkeeping,
-- thousands of rows at current scale) and the new index is partial, so the write
-- lock of a plain CREATE UNIQUE INDEX lasts milliseconds; CONCURRENTLY would also
-- forbid running inside the migration transaction for no gain at this size.
-- Duplicates cannot reject the index on anyone's real data either: the value
-- entity_type = 'lifecycle_email' is introduced by this same release, so the
-- partial predicate matches zero pre-existing rows on every install.
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "locale" varchar(10);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_notification_lifecycle_once" ON "notification" USING btree ("recipient_id","trigger_field") WHERE "notification"."entity_type" = 'lifecycle_email';