-- Custom data migration: a one-click unsubscribe means "stop emailing me".
--
-- WHY. Until now the unsubscribe link in each optional email was scoped to
-- that email's own type. Clicking it in the weekly management digest stored
-- an email_preference row 'type:reminders.weekly_management_digest' with
-- source 'one_click', and nothing else. Every other optional email kept
-- going, and the activation nudge queue (which reads the all-off flag) still
-- listed the person. People who unsubscribe from one email mean all of them.
-- The link now always sets user.email_followups_disabled; this migration
-- gives the people who clicked a scoped link before that the same outcome.
--
-- WHAT THIS DOES. Sets email_followups_disabled = true for every user who
-- holds at least one one-click opt-out row. Only ever adds suppression, never
-- removes it. Rows with source 'preference_centre' are deliberate per-kind
-- choices made on the settings page and are left as they are. Nothing is
-- deleted: the original email_preference rows stay, so which email the click
-- came from remains on record.
--
-- Blast radius, to check against a replica before deploying:
--
--   SELECT count(*) FROM "user" u
--   WHERE u.email_followups_disabled = false
--     AND EXISTS (SELECT 1 FROM email_preference ep
--                 WHERE ep.user_id = u.id AND ep.source = 'one_click');
--
-- NO AUDIT ROWS, for the reason 0015 gives: audit_log.checksum cannot be
-- reproduced reliably in SQL. This file plus its __drizzle_migrations_saas
-- entry is the record.
UPDATE "user" AS u
SET "email_followups_disabled" = true,
    "updated_at" = now()
WHERE u."email_followups_disabled" = false
  AND EXISTS (
    SELECT 1
    FROM "email_preference" ep
    WHERE ep."user_id" = u."id"
      AND ep."source" = 'one_click'
  );
