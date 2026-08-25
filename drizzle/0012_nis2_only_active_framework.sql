-- Custom data migration: NIS 2 is the only framework the product surfaces.
--
-- WHY. compliance_framework.is_active drives two things at once:
-- getAllActiveCategories (lib/compliance/access.ts) builds the portal sidebar
-- and both /compliance pages from it, and createAssessmentsForFrameworks
-- (server/trpc/helpers/setup-helpers.ts) provisions one company_assessment plus
-- one company_requirement_status row per requirement for EVERY active
-- framework at signup. Nothing filtered to NIS 2 and nothing asked the user.
--
-- The result, measured on production 2026-08-25: tenants carry 56, 101 or 103
-- requirement rows where the product only has 49.
--   56  = 49 nis2 + 7 gdpr                          (oldest cohort)
--   101 = 49 nis2 + 7 gdpr + 24 eu_ai_act + 21 eu_cra
--   103 = 49 nis2 + 9 gdpr + 24 eu_ai_act + 21 eu_cra  (after the two GDPR
--         requirements added in PR #72)
-- So every progress percentage on the admin dashboard was computed against a
-- denominator roughly twice the real one, and a tenant who finished all of
-- NIS 2 would have read 49/101 = 48%.
--
-- WHAT THIS IS NOT. No rows are deleted. Existing GDPR / EU AI Act / EU CRA
-- assessments and their company_requirement_status rows, sign-offs, evidence
-- and history all stay exactly as they are. This only flips a visibility flag,
-- and it is reversible by setting is_active back to true.
--
-- Reference data for the inactive frameworks is deliberately left in place:
-- requirement_satisfaction pairs resolve against requirement rows, so
-- propagateSatisfaction keeps crediting the linked GDPR or ISO 27001
-- requirement when a NIS 2 requirement is signed off. That cross-framework
-- mapping is the reason the other frameworks were modelled at all, and it
-- keeps working with them hidden.
--
-- Queries that COUNT or LIST a tenant's requirements had to be scoped in the
-- same change (server/trpc/helpers/nis2-scope.ts), because this flag alone
-- cannot fix them: the rows it hides are still in the database by design.

UPDATE compliance_framework
SET is_active = false
WHERE code <> 'nis2'
  AND is_active = true;

-- NIS 2 itself must be active for the journey, the sidebar and new signups.
-- Asserted rather than assumed: an inactive NIS 2 would render an empty
-- product, and this is the one row the whole application depends on.
UPDATE compliance_framework
SET is_active = true
WHERE code = 'nis2'
  AND is_active = false;

-- Pending reminder / escalation notifications already queued against a now
-- hidden framework's requirements. Left alone, the next cron run mails the
-- user "Reminder: DSGVO-3.1 review due" with a link to a page that no longer
-- resolves.
--
-- Cancelled, not deleted: 'cancelled' is an existing notification_status value
-- (packages/isms-schema/src/enums.ts:101), the rows stay auditable, and the
-- change is reversible. Only 'pending' rows are touched, so anything already
-- sent keeps its delivery record intact.
UPDATE notification n
SET status = 'cancelled'
WHERE n.status = 'pending'
  AND n.entity_type = 'requirement'
  AND EXISTS (
    SELECT 1
      FROM requirement r
      JOIN requirement_category rc ON rc.id = r.category_id
      JOIN compliance_framework f ON f.id = rc.framework_id
     WHERE r.id = n.entity_id
       AND f.code <> 'nis2'
  );
