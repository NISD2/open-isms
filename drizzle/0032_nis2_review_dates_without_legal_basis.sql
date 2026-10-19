-- No NIS2 requirement recurs on a calendar any more (0031): no text fixes a review period for
-- every entity. A signed, approved or set-aside row still carries the review date its old
-- frequency gave it, and the deadline job would move it to needs_review on that date. This clears
-- those dates and cancels the review reminders scheduled for them. Open rows keep their dates:
-- there the date is the onboarding pace for doing the work, not a review.
UPDATE "notification" AS n
SET "status" = 'cancelled'
FROM "company_requirement_status" AS s
JOIN "company_assessment" AS a ON a."id" = s."assessment_id"
JOIN "requirement" AS r ON r."id" = s."requirement_id"
JOIN "requirement_category" AS c ON c."id" = r."category_id"
JOIN "compliance_framework" AS f ON f."id" = c."framework_id"
WHERE n."entity_type" = 'requirement'
  AND n."entity_id" = s."requirement_id"
  AND n."company_id" = a."company_id"
  AND n."status" = 'pending'
  AND f."code" = 'nis2'
  AND r."frequency" IN ('on-change', 'ongoing', 'one-time')
  AND s."status" IN ('completed', 'approved', 'not_applicable');
--> statement-breakpoint
UPDATE "company_requirement_status" AS s
SET "next_review_date" = NULL, "updated_at" = now()
FROM "requirement" AS r
JOIN "requirement_category" AS c ON c."id" = r."category_id"
JOIN "compliance_framework" AS f ON f."id" = c."framework_id"
WHERE s."requirement_id" = r."id"
  AND f."code" = 'nis2'
  AND r."frequency" IN ('on-change', 'ongoing', 'one-time')
  AND s."status" IN ('completed', 'approved', 'not_applicable')
  AND s."next_review_date" IS NOT NULL;
