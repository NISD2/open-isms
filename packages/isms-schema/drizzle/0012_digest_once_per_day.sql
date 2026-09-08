-- migration-safety:allow: notification is small (reminder bookkeeping) and the
-- index is partial, so a plain CREATE UNIQUE INDEX holds its write lock for
-- milliseconds; CONCURRENTLY would also forbid running inside the migration
-- transaction for no gain at this size. Duplicates cannot reject it either:
-- the entity_type values 'daily_digest' and 'weekly_management_digest' are
-- introduced by this release, so the predicate matches zero existing rows.
CREATE UNIQUE INDEX "uq_notification_digest_once_per_day" ON "notification" USING btree ("recipient_id","entity_type","trigger_field") WHERE "notification"."entity_type" IN ('daily_digest', 'weekly_management_digest');