import { and, eq, inArray } from "drizzle-orm";
import {
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
} from "@/schema";
import type { DbOrTx } from "@/lib/db";

/**
 * NIS 2 is the only framework the product surfaces.
 *
 * Tenants provisioned before this rule still hold GDPR / EU AI Act / EU CRA
 * assessments and their `company_requirement_status` rows: deactivating a
 * framework hides it, it does not delete anything. So every query that COUNTS
 * or LISTS a tenant's requirements for display has to scope itself, or those
 * rows keep leaking into the UI. That is how the admin dashboard came to read
 * 101 requirements per company (49 NIS2 + 7 GDPR + 24 AI Act + 21 CRA) when
 * only the 49 are the product.
 *
 * Deliberately NOT used by:
 *   - `propagateSatisfaction` (assessment-helpers.ts), which must span every
 *     assessment so signing a NIS2 requirement still credits the linked GDPR
 *     or ISO 27001 one. That cross-framework credit is the point of the
 *     mapping, and scoping it would silently break it.
 *   - the `assessmentId` ownership checks in evidence.ts / review.ts, which
 *     are tenancy guards. They must keep matching any row the tenant owns.
 */
export const NIS2_FRAMEWORK_CODE = "nis2" as const;

/** The NIS 2 framework row id, or null when it has not been seeded. */
export async function getNis2FrameworkId(
  db: DbOrTx,
): Promise<string | null> {
  const framework = await db.query.complianceFramework.findFirst({
    where: eq(complianceFramework.code, NIS2_FRAMEWORK_CODE),
    columns: { id: true },
  });
  return framework?.id ?? null;
}

/**
 * A company's NIS 2 assessment ids. Empty when the framework is unseeded or
 * the tenant has no NIS 2 assessment, which callers must treat as "no data"
 * rather than "no filter": an empty `inArray` matches nothing, which is the
 * safe direction.
 */
export async function getNis2AssessmentIds(
  db: DbOrTx,
  companyId: string,
): Promise<string[]> {
  const frameworkId = await getNis2FrameworkId(db);
  if (!frameworkId) return [];

  const rows = await db
    .select({ id: companyAssessment.id })
    .from(companyAssessment)
    .where(
      and(
        eq(companyAssessment.companyId, companyId),
        eq(companyAssessment.frameworkId, frameworkId),
      ),
    );
  return rows.map((r) => r.id);
}

/**
 * A company's single NIS 2 assessment, or null. The shape three callers wanted
 * after resolving the framework id by hand.
 */
export async function getNis2Assessment(db: DbOrTx, companyId: string) {
  const frameworkId = await getNis2FrameworkId(db);
  if (!frameworkId) return null;
  return (
    (await db.query.companyAssessment.findFirst({
      where: and(
        eq(companyAssessment.companyId, companyId),
        eq(companyAssessment.frameworkId, frameworkId),
      ),
    })) ?? null
  );
}

/**
 * Predicate restricting `company_requirement_status` rows to NIS 2 assessments
 * across EVERY tenant at once.
 *
 * The nightly deadline cron sweeps globally rather than per company, so it
 * cannot use `getNis2AssessmentIds`. Without this it flips hidden GDPR / AI Act
 * / CRA rows to needs_review, backfills review dates onto them, and mails the
 * user reminders naming requirement codes like DSGVO-3.1 for a framework the
 * product no longer shows.
 *
 * Must stay a subquery BUILDER, not a raw `sql` template. The cron calls this
 * inside Drizzle's relational query builder, which rewrites every Column chunk
 * of a raw template to the ROOT table alias: the same predicate written as
 * sql`...` compiled to `"companyRequirementStatus"."code"` and
 * `"companyRequirementStatus"."framework_id"`, neither of which exists on that
 * table, so Postgres raised 42703 and phases 1-5 of the cron aborted. A
 * builder survives the remapping. `bun run e2e/l0/nis2-scope.test.ts` pins the
 * compiled SQL; the browser suite never hits this route.
 */
export function nis2StatusScope(db: DbOrTx) {
  return inArray(
    companyRequirementStatus.assessmentId,
    db
      .select({ id: companyAssessment.id })
      .from(companyAssessment)
      .innerJoin(
        complianceFramework,
        and(
          eq(complianceFramework.id, companyAssessment.frameworkId),
          eq(complianceFramework.code, NIS2_FRAMEWORK_CODE),
        ),
      ),
  );
}
