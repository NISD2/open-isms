-- Custom data migration: revert non-CEO sign-offs on NIS 2 requirement 3.1.
--
-- WHY. 0014_framework_data_sync sets requirement 3.1 (Incident Response Plan &
-- Team) to required_sign_off_role = 'ceo'. Until now the column was NULL, and
-- NULL is not "no sign-off": effectiveSignOffRole() in
-- server/trpc/helpers/sign-off-completion.ts falls back to
-- DEFAULT_SIGN_OFF_ROLE, which is 'ciso' (lib/compliance/role-keys.ts). So
-- every company that completed 3.1 did so on a CISO signature.
--
-- BSI IT-Grundschutz DER.2.1.A2 (Edition 2023) is a Basis-Anforderung and says
-- the Richtlinie zur Behandlung von Sicherheitsvorfällen "MUSS mit dem
-- IT-Betrieb abgestimmt und durch die Institutionsleitung verabschiedet sein".
-- A CISO signature is not a management adoption record. Leaving those rows
-- completed would mean the platform reports a requirement as met on evidence
-- its own rule now rejects.
--
-- signerMeetsRequiredRole is evaluated ONLY at sign time, inside the mutation,
-- before the requirement_assignment insert. Nothing re-validates
-- signed_off_role on read, and generate-framework-migration.ts is upsert-only
-- and deliberately never touches operational tables. So without this migration
-- the role change would silently grandfather every existing signature and gate
-- only new ones.
--
-- WHAT THIS DOES. Exactly what lib/compliance/module-recheck.ts revertSignOffs
-- does: flips company_requirement_status.status from completed/approved to
-- needs_review and bumps updated_at. Nothing is deleted. signed_off_by,
-- signed_off_at, signed_off_role and sign_off_snapshot stay on the row, so who
-- signed and when remains on the record, and sign_off_history and
-- requirement_assignment are untouched. Affected companies see 3.1 move to
-- "needs review" in-app.
--
-- Rows with signed_off_role = 'ceo' are left alone: those signatures already
-- meet the new rule. Rows with a NULL signed_off_role are reverted, because an
-- unsigned "completed" row carries no adoption record either.
--
-- Requirement codes are globally unique (the framework sync upserts ON CONFLICT
-- ("code")), so code '3.1' pins this to NIS 2 on its own; the framework join is
-- kept for readability.
--
-- DELIBERATELY PLAIN SQL. No DO block: no migration in this directory uses one,
-- the runner treats a breakpoint-less file as a single statement, and a
-- $$-quoted body is the classic thing a SQL splitter mangles. A failed
-- migration blocks container startup, which is not a trade worth making for a
-- RAISE NOTICE. To see the blast radius before deploying, run the SELECT in the
-- comment below against a replica.
--
--   SELECT count(*) FROM company_requirement_status crs
--   WHERE crs.status IN ('completed','approved')
--     AND coalesce(crs.signed_off_role,'') <> 'ceo'
--     AND crs.requirement_id IN (SELECT id FROM requirement WHERE code = '3.1');
--
-- NO AUDIT ROWS. audit_log.checksum is a SHA-256 over the entry computed by
-- createLogAudit (packages/isms-trpc/src/audit/log-audit.ts); reproducing it in
-- SQL would be fragile, and a row with a wrong or NULL checksum is worse for a
-- tamper-evident trail than no row. This migration file plus its
-- __drizzle_migrations_saas entry is the record.
UPDATE "company_requirement_status" AS crs
SET "status" = 'needs_review',
    "updated_at" = now()
WHERE crs."status" IN ('completed', 'approved')
  AND coalesce(crs."signed_off_role", '') <> 'ceo'
  AND crs."requirement_id" IN (
    SELECT r."id"
    FROM "requirement" r
    JOIN "requirement_category" rc ON rc."id" = r."category_id"
    JOIN "compliance_framework" f ON f."id" = rc."framework_id"
    WHERE r."code" = '3.1'
      AND f."code" = 'nis2'
  );
