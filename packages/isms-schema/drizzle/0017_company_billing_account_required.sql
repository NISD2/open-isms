-- Every company now belongs to a billing account, and every person to their companies through
-- company_membership, because from this release on the application writes both.
--
-- This is the backfill's LAST run: the same statements as 0016, repeated here so that any company
-- or user created between 0016 and this migration is covered, and run in the same transaction as
-- the NOT NULL that follows, so no company can be created in between the fill and the constraint.
-- It must never run again after the paywall goes live, because every company it fills can come
-- out grandfathered.
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
ALTER TABLE "company" ALTER COLUMN "billing_account_id" SET NOT NULL;
