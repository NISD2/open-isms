-- Backfill billing accounts and company memberships for everything that already exists.
--
-- Safe to run more than once. It only fills what is still empty, so the later migration that makes
-- company.billing_account_id NOT NULL can run the same statements again first and pick up any
-- company or user created in between.
--
-- 1. One billing account per company that has none.
--
--    A backfilled account reuses its company's id. That gives the insert and the link a key they
--    share without a temporary table or a guessed join, and it holds only for these backfilled rows:
--    accounts created by the application get their own random id, so nothing may assume the two
--    ids match.
--
--    The account is grandfathered if any member of the company has ever got in, which is the rule
--    for keeping the current journey free. email_verified_at is the reliable signal, because nobody
--    reaches the app without it; login_count and last_login_at are newer and cover the rest.
INSERT INTO "billing_account" ("id", "owner_user_id", "access_level")
SELECT
  c."id",
  c."owner_id",
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM "user" u
      WHERE u."company_id" = c."id"
        AND (
          u."email_verified_at" IS NOT NULL
          OR u."login_count" > 0
          OR u."last_login_at" IS NOT NULL
        )
    ) THEN 'grandfathered'::"access_level"
    ELSE 'free'::"access_level"
  END
FROM "company" c
WHERE c."billing_account_id" IS NULL
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "company" c
SET "billing_account_id" = c."id"
WHERE c."billing_account_id" IS NULL
  AND EXISTS (SELECT 1 FROM "billing_account" b WHERE b."id" = c."id");
--> statement-breakpoint
-- 2. One membership per user who has a company, carrying the role they hold today.
--
--    The cast to membership_role fails, and the whole migration with it, if any user.role holds a
--    value outside the four roles the application knows. A role nobody expected must stop the
--    deploy; guessing it would silently change what someone is allowed to do.
INSERT INTO "company_membership" ("user_id", "company_id", "role")
SELECT u."id", u."company_id", u."role"::"membership_role"
FROM "user" u
WHERE u."company_id" IS NOT NULL
ON CONFLICT ("user_id", "company_id") DO NOTHING;
