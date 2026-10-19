import { and, eq, inArray } from "drizzle-orm";
import type { Database, DbOrTx } from "@/lib/db";
import type { FrameworkCode } from "@/lib/durchgang/types";
import {
  company,
  companyAssessment,
  companyRequirementStatus,
  complianceFramework,
  requirement,
  requirementCategory,
} from "@/schema";
import { recalculateProgress } from "./assessment-helpers";

/** A company's assessment of one framework (`compliance_framework.code`), or null. */
export async function assessmentOf(
  db: DbOrTx,
  companyId: string,
  framework: FrameworkCode,
) {
  const fw = await db.query.complianceFramework.findFirst({
    where: eq(complianceFramework.code, framework),
    columns: { id: true },
  });
  if (!fw) return null;
  return (
    (await db.query.companyAssessment.findFirst({
      where: and(
        eq(companyAssessment.companyId, companyId),
        eq(companyAssessment.frameworkId, fw.id),
      ),
    })) ?? null
  );
}

/**
 * The company's assessment of a framework with a status row for each of its requirements,
 * created where missing: a company set up before the framework was active has no assessment of
 * it, and a requirement added to the framework later has no row in an assessment that exists.
 * Signup seeds the active frameworks (`createAssessmentsForFrameworks`); this keeps every other
 * company in step when it opens a walk. Idempotent, and one writer per company at a time, so two
 * tabs opening the walk create one assessment.
 */
export async function ensureAssessment(
  db: Database,
  companyId: string,
  framework: FrameworkCode,
): Promise<string> {
  const { assessmentId, added } = await db.transaction(async (tx) => {
    const [org] = await tx
      .select({ entityType: company.entityType })
      .from(company)
      .where(eq(company.id, companyId))
      .for("update");
    if (!org) throw new Error(`No company ${companyId}.`);
    const [fw] = await tx
      .select({ id: complianceFramework.id })
      .from(complianceFramework)
      .where(eq(complianceFramework.code, framework));
    if (!fw) throw new Error(`Framework ${framework} is not seeded.`);
    const requirements = await tx
      .select({ id: requirement.id })
      .from(requirement)
      .innerJoin(requirementCategory, eq(requirementCategory.id, requirement.categoryId))
      .where(eq(requirementCategory.frameworkId, fw.id));

    const existing = await assessmentOf(tx, companyId, framework);
    const assessment =
      existing ??
      (
        await tx
          .insert(companyAssessment)
          .values({
            companyId,
            frameworkId: fw.id,
            totalRequirements: requirements.length,
            entityTypeAtAssessment: org.entityType,
          })
          .returning({ id: companyAssessment.id })
      )[0];
    if (!assessment) throw new Error(`No ${framework} assessment for ${companyId}.`);

    const held = await tx
      .select({ id: companyRequirementStatus.requirementId })
      .from(companyRequirementStatus)
      .where(eq(companyRequirementStatus.assessmentId, assessment.id));
    const heldIds = new Set(held.map((h) => h.id));
    const missing = requirements.filter((r) => !heldIds.has(r.id));
    if (missing.length > 0) {
      await tx
        .insert(companyRequirementStatus)
        .values(
          missing.map((r) => ({ assessmentId: assessment.id, requirementId: r.id })),
        )
        .onConflictDoNothing();
      await tx
        .update(companyAssessment)
        .set({ totalRequirements: requirements.length, updatedAt: new Date() })
        .where(eq(companyAssessment.id, assessment.id));
    }
    return { assessmentId: assessment.id, added: missing.length };
  });
  if (added > 0) await recalculateProgress(db, assessmentId);
  return assessmentId;
}

/** The ids of a company's assessments of these frameworks; empty matches nothing downstream. */
export async function assessmentIdsOf(
  db: DbOrTx,
  companyId: string,
  frameworks: readonly FrameworkCode[],
): Promise<string[]> {
  if (frameworks.length === 0) return [];
  const fws = await db.query.complianceFramework.findMany({
    where: inArray(complianceFramework.code, [...frameworks]),
    columns: { id: true },
  });
  if (fws.length === 0) return [];
  const rows = await db
    .select({ id: companyAssessment.id })
    .from(companyAssessment)
    .where(
      and(
        eq(companyAssessment.companyId, companyId),
        inArray(
          companyAssessment.frameworkId,
          fws.map((f) => f.id),
        ),
      ),
    );
  return rows.map((r) => r.id);
}
