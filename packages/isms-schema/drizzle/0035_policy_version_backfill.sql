-- Keeps what is approved today. Every policy that is approved now, with its approver role and
-- approval time recorded, gets the version row an approval writes from here on. A policy approved
-- before the role was recorded has no row: its approval cannot be told apart from a status set by
-- hand, so none is made up.
INSERT INTO "policy_version" (
  "policy_id", "company_id", "type", "title", "content", "content_sha256",
  "approved_by", "approver_role", "approved_on", "approved_at"
)
SELECT
  p."id", p."company_id", p."type", p."title", p."content",
  encode(sha256(convert_to(p."content", 'UTF8')), 'hex'),
  p."approved_by", p."approver_role",
  COALESCE(p."effective_from", p."approved_at"::date), p."approved_at"
FROM "policy" AS p
WHERE p."status" = 'approved'
  AND p."approver_role" IS NOT NULL
  AND p."approved_at" IS NOT NULL
  AND length(COALESCE(p."content", '')) > 0
ON CONFLICT ON CONSTRAINT "uq_policy_version_approval" DO NOTHING;
