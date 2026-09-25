-- migration-safety:allow: this SET NOT NULL is step three of rule 3. The column was added nullable
-- in 0015 and backfilled in 0016, and the release after that writes it on every company. The two
-- statements below link every company still without an account (a new account keyed by the
-- company's id, or the one 0016 made), in the same transaction, so no row can fail the constraint.
--
-- The release that lets one person belong to several companies. Before the application relies on
-- company_membership alone, this puts the table in step with user.company_id one last time, in the
-- same transaction as the NOT NULL at the end, so nothing can be created in between.
--
-- It relies on one fact about the release before it: nobody could hold two memberships, so every
-- correct membership is the company the person has open. What the previous release's container
-- wrote while it still served during a deploy is repaired here:
--   1. companies it created have no billing account (the 0016 statements, rerun);
--   2. people it put into a company have no membership (the 0016 statement, rerun);
--   3. people it removed kept their membership, which no longer matches their open company;
--   4. role changes it made landed on user.role only.
-- This is the backfill's LAST run. It must not run after the paywall goes live, because every
-- company it fills can come out grandfathered.
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
INSERT INTO "company_membership" ("user_id", "company_id", "role")
SELECT u."id", u."company_id", u."role"::"membership_role"
FROM "user" u
WHERE u."company_id" IS NOT NULL
ON CONFLICT ("user_id", "company_id") DO NOTHING;
--> statement-breakpoint
DELETE FROM "company_membership" m
USING "user" u
WHERE u."id" = m."user_id"
  AND u."company_id" IS DISTINCT FROM m."company_id";
--> statement-breakpoint
UPDATE "company_membership" m
SET "role" = u."role"::"membership_role"
FROM "user" u
WHERE u."id" = m."user_id"
  AND u."company_id" = m."company_id"
  AND m."role"::text <> u."role";
--> statement-breakpoint
ALTER TABLE "company" ALTER COLUMN "billing_account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'member';
