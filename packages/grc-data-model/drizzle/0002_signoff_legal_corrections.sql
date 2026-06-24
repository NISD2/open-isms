-- Custom data migration: NIS 2 sign-off legal corrections.
--
-- Corrects framework REFERENCE data only. requirement and requirement_prerequisite
-- have no company_id, so no customer compliance data (statuses, sign-offs,
-- evidence) is touched. The UPDATEs are value corrections; the single DELETE drops
-- one reference-data prerequisite row. Idempotent and safe to re-run.
-- requirement.code is globally unique, so matching by code needs no framework scope.
--
-- 1) 12.1 (NIS2 Classification & Scope) referenced an unwired "bsi_registration"
--    module, which dead-ended its detail page. The registration id lives in 12.2's
--    own intake; 12.1 needs no module.
UPDATE "requirement" SET "module_ref" = NULL WHERE "code" = '12.1';
--> statement-breakpoint
-- 2) 7.3 (Management Review) was cited to "CIR 7.3", but CIR Annex point 7 does not
--    name the management body. The management duty is Art 20(1) oversight plus
--    CIR 2.2.1 (management informed via regular reporting).
UPDATE "requirement"
SET "legal_ref" = '§30(2) Nr. 6 BSIG, CIR 2.2.1, §38(1)', "cir_reference" = '2.2.1'
WHERE "code" = '7.3';
--> statement-breakpoint
-- 3) CIR Annex point 4.3 requires the crisis-communication plan to be approved by
--    the management bodies. 4.2 (Business Continuity and Crisis Management Plan) is
--    that artefact, so it carries management sign-off.
UPDATE "requirement" SET "required_sign_off_role" = 'ceo' WHERE "code" = '4.2';
--> statement-breakpoint
-- 4) Section 28 (self-classification) and section 33 (registration) are parallel
--    administrative filings, not sequenced, so 12.1 is not a prerequisite of 12.2.
DELETE FROM "requirement_prerequisite" rp
USING "requirement" pre, "requirement" blk
WHERE rp."prerequisite_id" = pre."id"
  AND rp."requirement_id" = blk."id"
  AND pre."code" = '12.1'
  AND blk."code" = '12.2';
