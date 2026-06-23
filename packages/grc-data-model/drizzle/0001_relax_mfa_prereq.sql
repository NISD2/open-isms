-- Custom data migration: relax the MFA prerequisite.
--
-- P0 MFA (11.1) must not wait on the P1 access-control policy (10.1). This drops
-- the 10.1 -> 11.1 / 11.2 / 11.3 gates and scopes MFA against the asset
-- inventory instead (2.2 -> 11.1). It transforms framework REFERENCE data only:
-- requirement_prerequisite has no company_id, so no customer compliance data is
-- touched. Idempotent and safe to re-run.

DELETE FROM "requirement_prerequisite" rp
USING "requirement" pre, "requirement" blk
WHERE rp."prerequisite_id" = pre."id"
  AND rp."requirement_id" = blk."id"
  AND pre."code" = '10.1'
  AND blk."code" IN ('11.1', '11.2', '11.3');
--> statement-breakpoint
INSERT INTO "requirement_prerequisite" ("requirement_id", "prerequisite_id", "notes")
SELECT blk."id", pre."id", 'MFA is scoped against the asset inventory (§30(1)(9))'
FROM "requirement" blk, "requirement" pre
WHERE blk."code" = '11.1' AND pre."code" = '2.2'
ON CONFLICT ("requirement_id", "prerequisite_id") DO NOTHING;
