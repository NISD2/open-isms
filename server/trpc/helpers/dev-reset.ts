import "@/lib/server-guard";
import { and, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import {
  asset,
  auditFinding,
  auditLog,
  bsiIncidentReport,
  bsiRegistration,
  changeRequest,
  companyAssessment,
  companyCategoryIntake,
  companyCertification,
  companyPolicyConfig,
  companyRequirementStatus,
  companyRiskMethodology,
  controlDecision,
  evidence,
  exercise,
  gapAssessment,
  improvementItem,
  incident,
  internalAudit,
  kpiMeasurement,
  managementReview,
  notification,
  patchRecord,
  policy,
  policyAcknowledgment,
  requirement,
  requirementAssignment,
  requirementCategory,
  risk,
  riskAsset,
  riskSupplier,
  riskTreatment,
  signOffHistory,
  supplier,
  supplierInvite,
  trainingRecord,
  vulnerability,
} from "@/schema";

/**
 * Cleared by their own company column, in an order the foreign keys allow: each after the rows
 * that point at it. The children with no company column of their own are cleared first, through
 * these parents' ids; asset_provider and asset_supplier_offering go with their asset.
 */
export const RESET_BY_COMPANY = [
  auditLog,
  notification,
  signOffHistory,
  trainingRecord,
  vulnerability,
  patchRecord,
  changeRequest,
  kpiMeasurement,
  improvementItem,
  exercise,
  managementReview,
  internalAudit,
  policy,
  gapAssessment,
  companyCertification,
  bsiRegistration,
  companyRiskMethodology,
  companyPolicyConfig,
  controlDecision,
  incident,
  risk,
  asset,
] as const;

/** Reset through a column of another name, or rebuilt rather than cleared; see resetImplementation. */
export const RESET_OTHERWISE = [
  "supplier",
  "supplier_invite",
  "company_requirement_status",
  "company_category_intake",
] as const;

/** Rows of the company the reset leaves, each with why. */
export const KEPT_ON_RESET: Readonly<Record<string, string>> = {
  company: "the company itself, its profile from onboarding and its billing",
  user: "the people's accounts",
  company_membership: "who belongs to the company, in which role",
  company_invite: "invitations to join the team",
  category_assignment: "who looks after which area, set up with the team",
  company_assessment: "kept so the company stays set up; its progress starts over",
  training_lesson_progress:
    "each person's own course progress, which 1.1 reads; a course taken stays taken",
  data_erasure_log: "the record that an erasure happened",
  applicability_lookup: "a cache of the scoping lookup, not the implementation",
};

const idsOf = (rows: readonly { id: string }[]) => rows.map((r) => r.id);

/**
 * Takes a company back to the start of its NIS 2 implementation: everything it entered, wrote,
 * uploaded, rated or signed off, and every requirement back to not started. The company, its
 * people, their course progress and its billing stay. Supplier rows other companies keep about
 * it, and invites it accepted as their supplier, are theirs and stay. What a supplier declared
 * for this company (asset_supplier_offering, incident broadcasts) goes with the company's
 * supplier row, as when the company deletes a supplier itself. Run it inside a transaction, so a
 * foreign key it does not know yet stops the whole reset instead of leaving half of one. Uploaded
 * files stay in object storage; only their rows go.
 */
export async function resetImplementation(
  tx: DbOrTx,
  companyId: string,
): Promise<{ requirements: number }> {
  const assessments = await tx
    .select({ id: companyAssessment.id, frameworkId: companyAssessment.frameworkId })
    .from(companyAssessment)
    .where(eq(companyAssessment.companyId, companyId));
  const assessmentIds = idsOf(assessments);
  const statusIds =
    assessmentIds.length > 0
      ? idsOf(
          await tx
            .select({ id: companyRequirementStatus.id })
            .from(companyRequirementStatus)
            .where(inArray(companyRequirementStatus.assessmentId, assessmentIds)),
        )
      : [];
  const [riskIds, incidentIds, auditIds, policyIds] = await Promise.all(
    [risk, incident, internalAudit, policy].map(async (table) =>
      idsOf(
        await tx
          .select({ id: table.id })
          .from(table)
          .where(eq(table.companyId, companyId)),
      ),
    ),
  );

  if (statusIds.length > 0) {
    await tx.delete(evidence).where(inArray(evidence.requirementStatusId, statusIds));
    await tx
      .delete(requirementAssignment)
      .where(inArray(requirementAssignment.statusId, statusIds));
  }
  if (riskIds.length > 0) {
    await tx.delete(riskAsset).where(inArray(riskAsset.riskId, riskIds));
    await tx.delete(riskSupplier).where(inArray(riskSupplier.riskId, riskIds));
    await tx.delete(riskTreatment).where(inArray(riskTreatment.riskId, riskIds));
  }
  if (incidentIds.length > 0) {
    await tx
      .delete(bsiIncidentReport)
      .where(inArray(bsiIncidentReport.incidentId, incidentIds));
  }
  if (auditIds.length > 0) {
    await tx.delete(auditFinding).where(inArray(auditFinding.auditId, auditIds));
  }
  if (policyIds.length > 0) {
    await tx
      .delete(policyAcknowledgment)
      .where(inArray(policyAcknowledgment.policyId, policyIds));
  }
  // sign_off_history points at the statuses, so it goes before them, with the company's tables.
  for (const table of RESET_BY_COMPANY) {
    await tx.delete(table).where(eq(table.companyId, companyId));
  }
  await tx.delete(supplierInvite).where(eq(supplierInvite.fromCompanyId, companyId));
  await tx.delete(supplier).where(eq(supplier.customerCompanyId, companyId));

  if (assessmentIds.length === 0) return { requirements: 0 };
  await tx
    .delete(companyCategoryIntake)
    .where(inArray(companyCategoryIntake.assessmentId, assessmentIds));
  await tx
    .delete(companyRequirementStatus)
    .where(inArray(companyRequirementStatus.assessmentId, assessmentIds));
  // Every requirement back as onboarding first wrote it (createAssessmentsForFrameworks).
  let requirements = 0;
  for (const a of assessments) {
    const ids = idsOf(
      await tx
        .select({ id: requirement.id })
        .from(requirement)
        .innerJoin(requirementCategory, eq(requirement.categoryId, requirementCategory.id))
        .where(eq(requirementCategory.frameworkId, a.frameworkId)),
    );
    if (ids.length > 0) {
      await tx
        .insert(companyRequirementStatus)
        .values(ids.map((requirementId) => ({ assessmentId: a.id, requirementId })));
    }
    requirements += ids.length;
  }
  await tx
    .update(companyAssessment)
    .set({
      completedAt: null,
      currentStep: 1,
      completedRequirements: 0,
      compliancePercentage: "0",
      lastReassessedAt: null,
      nextReassessmentDate: null,
    })
    .where(
      and(
        eq(companyAssessment.companyId, companyId),
        inArray(companyAssessment.id, assessmentIds),
      ),
    );
  return { requirements };
}

/** Hosts a dev reset may run against: this machine only, never a database reached over a network. */
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Whether a connection string points at this machine, compared on the parsed host. */
export const isLocalDatabase = (url: string): boolean => {
  try {
    return LOOPBACK.has(new URL(url).hostname);
  } catch {
    return false;
  }
};
