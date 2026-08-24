-- Custom data migration: recover sign-off evidence that was captured in the
-- chain but never written to the status row.
--
-- WHY. Until PR #75, intake.submit stamped signed_off_by / signed_off_at /
-- signed_off_role on a requirement it approved, and omitted
-- signed_off_template_version and sign_off_snapshot. It did append a
-- sign_off_history row carrying both. So for every requirement approved
-- through the intake form the evidence exists, it just never reached the
-- column the product reads.
--
-- That is customer-visible, not merely an audit nicety: ReviewDashboard gates
-- the whole sign-off panel on sign_off_snapshot, and the compliance report PDF
-- gates its template-version and operational-data lines on the same field. The
-- affected rows render as signed but show no sign-off detail anywhere.
--
-- WHAT THIS IS NOT. Nothing here invents evidence. Every value is copied from
-- that row's own sign_off_history entry, which is the append-only record
-- written at the moment of signing. derived_data is left empty because it was
-- genuinely never captured for these rows, and the report already hides that
-- block when it is empty. Claiming asset and risk counts we do not have would
-- be the dishonest option.
--
-- PRODUCTION SAFETY.
--   * No DELETE, TRUNCATE, DROP or ALTER. One UPDATE.
--   * Fills NULLs only. Every WHERE clause requires the target column to be
--     NULL, so a row that already carries a snapshot is never rewritten and no
--     existing value can be lost.
--   * template_version is the only sign-off column touched besides the
--     snapshot, and only where it is NULL, so no sign-off is invalidated.
--   * Idempotent: after one run the predicates match nothing.
--   * Scoped to rows that are terminal AND signed AND have a chain entry, so
--     an unsigned or in-progress row cannot be promoted by it.
--
-- NOT ADDRESSED HERE, deliberately. Rows carrying a sign_off_snapshot with NO
-- sign_off_history entry are the signature of the unguarded seed-gdpr backfill
-- (fixed in #76). Those cannot be repaired this way: their snapshot belongs to
-- a different requirement, and the honest record of what happened is the
-- absent chain row. Fabricating chain entries retroactively would mean
-- computing checksums for events that never occurred, which is worse than the
-- gap. Detect them with:
--
--   SELECT count(*) FROM company_requirement_status s
--    WHERE s.status IN ('completed','approved')
--      AND s.sign_off_snapshot IS NOT NULL
--      AND NOT EXISTS (SELECT 1 FROM sign_off_history h WHERE h.status_id = s.id);
--
-- If that is non-zero, the remediation is a decision about the affected
-- tenants' evidence, not a migration.

UPDATE "company_requirement_status" AS s
SET "signed_off_template_version" = COALESCE(
      s."signed_off_template_version",
      (h."snapshot" ->> 'templateVersion')::int
    ),
    "sign_off_snapshot" = jsonb_build_object(
      'templateVersion', (h."snapshot" ->> 'templateVersion')::int,
      'companyProfile', COALESCE(h."snapshot" -> 'companyProfile', '{}'::jsonb),
      'derivedData', '{}'::jsonb
    )
FROM (
  SELECT DISTINCT ON ("status_id") "status_id", "snapshot"
    FROM "sign_off_history"
   ORDER BY "status_id", "version" DESC
) AS h
WHERE h."status_id" = s."id"
  AND s."sign_off_snapshot" IS NULL
  AND s."signed_off_at" IS NOT NULL
  AND s."status" IN ('completed', 'approved')
  AND (h."snapshot" ->> 'templateVersion') IS NOT NULL;
