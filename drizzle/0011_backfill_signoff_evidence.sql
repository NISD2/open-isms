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
-- WHAT THIS IS NOT. Nothing here invents evidence. templateVersion is copied
-- from that row's own sign_off_history entry, the append-only record written
-- at the moment of signing. derivedData is left empty because it was genuinely
-- never captured for these rows, and both consumers already hide that block
-- when it is empty. Claiming asset and risk counts we do not have would be the
-- dishonest option.
--
-- companyProfile is deliberately left empty too, for a different reason. The
-- chain entry has one, but it holds cisoName, bsiContactName and
-- bsiContactEmail: personal data. lib/gdpr/erase-user.ts redacts
-- sign_off_history.snapshot and does NOT sweep
-- company_requirement_status.sign_off_snapshot, so copying the profile across
-- would plant names and an email address in a column the erasure routine does
-- not reach, on the majority of rows rather than a minority. Nothing renders
-- it: SignOffDisplay reads templateVersion and derivedData only, and so does
-- the PDF. Copying it would add erasure debt and display nothing.
--
-- PRODUCTION SAFETY.
--   * No DELETE, TRUNCATE, DROP or ALTER. One UPDATE.
--   * Fills NULLs only. Every WHERE clause requires the target column to be
--     NULL, so a row that already carries a snapshot is never rewritten and no
--     existing value can be lost.
--   * template_version is the only sign-off column touched besides the
--     snapshot, and only where it is NULL, so no sign-off is invalidated.
--   * Idempotent: after one run the predicates match nothing.
--   * Gated on signed_off_by, not signed_off_at. Those differ: erase-user.ts
--     nulls signed_off_by and leaves signed_off_at set, so a row whose signer
--     exercised their Art 17 right still carries a timestamp. Keying on the
--     timestamp would hand that row a sign-off panel attributing an
--     attestation to nobody. signed_off_by is the codebase's own test for
--     "signed" (see drizzle/seed-gdpr.ts, which skips a source row lacking it).
--   * The template version must be an integer literal. ->> returns text and
--     IS NOT NULL only excludes an absent key or JSON null, so '3.0' or 'v3'
--     would raise and abort. runtime-migrate rethrows, and the Dockerfile CMD
--     runs it before `exec node server.js`, so an abort is a container that
--     never boots and is restarted into the same failure. The regexp turns
--     that into one skipped row.
--   * The subquery is filtered to qualifying statuses rather than ranking
--     every chain row in the database. Unfiltered, it sorts the whole of
--     sign_off_history, detoasting each snapshot as sort payload, inside the
--     boot transaction while the healthcheck start period runs.
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
--
-- KNOCK-ON, worth knowing before anyone runs seed-gdpr again. Its propagation
-- loop skips a source row whose sign_off_snapshot is NULL. Every row this
-- migration repairs stops being skipped. That propagation is opt-in and
-- role-gated since #76, but it would now copy these snapshots onto linked
-- GDPR requirements, carrying the empty derivedData with them.

UPDATE "company_requirement_status" AS s
-- The same COALESCE feeds the column and the snapshot, so the two cannot
-- disagree. Writing the chain's version into the snapshot while COALESCE kept
-- an existing column value would manufacture an inconsistency: the sign-off
-- invalidation in the dev router reads
-- sign_off_snapshot->>'templateVersion', so a row whose snapshot claims a
-- version its own requirement never had escapes review while looking signed.
SET "signed_off_template_version" = COALESCE(
      s."signed_off_template_version",
      (h."snapshot" ->> 'templateVersion')::int
    ),
    "sign_off_snapshot" = jsonb_build_object(
      'templateVersion', COALESCE(
        s."signed_off_template_version",
        (h."snapshot" ->> 'templateVersion')::int
      ),
      'companyProfile', '{}'::jsonb,
      'derivedData', '{}'::jsonb
    )
FROM (
  -- The EXISTS mirrors the outer WHERE so the ranking never runs over chain
  -- rows that cannot qualify. The two predicate lists must stay in step: the
  -- outer one decides what is updated, this one only decides what is ranked,
  -- so making this one stricter would silently drop rows the outer would have
  -- repaired.
  SELECT DISTINCT ON (h2."status_id") h2."status_id", h2."snapshot"
    FROM "sign_off_history" h2
   WHERE EXISTS (
     SELECT 1
       FROM "company_requirement_status" s2
      WHERE s2."id" = h2."status_id"
        AND s2."sign_off_snapshot" IS NULL
        AND s2."signed_off_by" IS NOT NULL
        AND s2."signed_off_at" IS NOT NULL
        AND s2."status" IN ('completed', 'approved')
   )
   ORDER BY h2."status_id", h2."version" DESC
) AS h
WHERE h."status_id" = s."id"
  AND s."sign_off_snapshot" IS NULL
  -- Both halves of the signature, matching the guard seed-gdpr applies before
  -- treating a row as a source worth copying. No current writer produces a
  -- signer without a timestamp, but a snapshot on such a row would render a
  -- sign-off panel with a blank date.
  AND s."signed_off_by" IS NOT NULL
  AND s."signed_off_at" IS NOT NULL
  AND s."status" IN ('completed', 'approved')
  AND h."snapshot" ->> 'templateVersion' ~ '^[0-9]+$';
