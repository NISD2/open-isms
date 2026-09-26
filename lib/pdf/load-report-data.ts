/**
 * Load all assessment data for PDF report generation.
 *
 * Framework-agnostic: reads framework name, categories, requirements,
 * sign-off snapshots, and evidence from the database.
 */

import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import { asc, eq, type InferSelectModel, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  getCategory,
  getComplianceMessages,
  getRequirementDescription,
  getRequirementsMessages,
  getRequirementTitle,
} from "@/lib/messages";
import {
  companyAssessment,
  companyCategoryIntake,
  companyRequirementStatus,
  requirement,
  requirementCategory,
  user,
} from "@/schema";

type StatusRow = InferSelectModel<typeof companyRequirementStatus>;
type UserName = InferSelectModel<typeof user>["name"];

export interface NotApplicableDecision {
  reason: StatusRow["notApplicableReason"];
  decidedAt: StatusRow["notApplicableAt"];
  decidedBy: UserName | null;
}

export interface ReportEvidence {
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: Date;
  status: string;
}

export interface ReportRequirement {
  code: string;
  title: string;
  description: string;
  priority: string;
  legalRef: string | null;
  evidenceType: string;
  status: string;
  reviewFeedback: string | null;
  signedOffByName: UserName | null;
  signedOffRole: string | null;
  signedOffAt: Date | null;
  signOffSnapshot: SignOffSnapshot | null;
  notApplicable: NotApplicableDecision | null;
  evidence: ReportEvidence[];
}

export interface ReportCategory {
  code: string;
  name: string;
  description: string | null;
  grundschutzModule: string | null;
  bsiGuidance: string | null;
  intakeAnswers: Record<string, unknown> | null;
  intakeSignedOffAt: Date | null;
  requirements: ReportRequirement[];
}

export interface ReportData {
  companyName: string;
  companySector: string | null;
  frameworkName: string;
  assessmentDate: Date;
  totalRequirements: number;
  completedCount: number;
  approvedCount: number;
  categories: ReportCategory[];
}

export async function loadReportData(
  assessmentId: string,
  locale = "en",
): Promise<ReportData> {
  const [compliance, requirementMessages, assessment] = await Promise.all([
    getComplianceMessages(locale),
    getRequirementsMessages(locale),
    db.query.companyAssessment.findFirst({
      where: eq(companyAssessment.id, assessmentId),
      with: {
        company: { columns: { name: true, sector: true } },
        framework: { columns: { id: true, code: true } },
      },
    }),
  ]);

  if (!assessment) throw new Error("Assessment not found");

  const categories = await db.query.requirementCategory.findMany({
    where: eq(requirementCategory.frameworkId, assessment.framework.id),
    orderBy: asc(requirementCategory.sortOrder),
  });

  const categoryIds = categories.map((c) => c.id);
  const allRequirements = await db.query.requirement.findMany({
    where: inArray(requirement.categoryId, categoryIds),
    orderBy: asc(requirement.sortOrder),
  });

  const [statuses, intakes] = await Promise.all([
    db.query.companyRequirementStatus.findMany({
      where: eq(companyRequirementStatus.assessmentId, assessmentId),
      with: {
        evidence: true,
      },
    }),
    db.query.companyCategoryIntake.findMany({
      where: eq(companyCategoryIntake.assessmentId, assessmentId),
    }),
  ]);
  const statusMap = new Map(statuses.map((s) => [s.requirementId, s]));
  const intakeMap = new Map(intakes.map((i) => [i.categoryId, i]));

  // Only the people this assessment's own rows point at, so the lookup cannot
  // reach past the tenant the assessment belongs to.
  const personIds = [
    ...new Set(
      statuses
        .flatMap((s) => [s.signedOffBy, s.notApplicableBy])
        .filter((id): id is string => id !== null),
    ),
  ];
  const people =
    personIds.length === 0
      ? []
      : await db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, personIds));
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const nameFor = (id: string | null) => (id === null ? null : (nameOf.get(id) ?? null));

  let completedCount = 0;
  let approvedCount = 0;

  const reportCategories: ReportCategory[] = categories.map((cat) => {
    const catReqs = allRequirements.filter((r) => r.categoryId === cat.id);
    const intake = intakeMap.get(cat.id);

    const reportReqs: ReportRequirement[] = catReqs.map((req) => {
      const status = statusMap.get(req.id);
      const currentStatus = status?.status ?? "not_started";

      if (currentStatus === "completed" || currentStatus === "not_applicable") {
        completedCount++;
      }
      if (currentStatus === "approved") {
        approvedCount++;
        completedCount++;
      }

      return {
        code: req.code,
        title: getRequirementTitle(requirementMessages, req.code),
        description: getRequirementDescription(requirementMessages, req.code) ?? "",
        priority: req.priority,
        legalRef: req.legalRef,
        evidenceType: req.evidenceType,
        status: currentStatus,
        reviewFeedback: status?.reviewFeedback ?? null,
        signedOffByName: nameFor(status?.signedOffBy ?? null),
        signedOffRole: status?.signedOffRole ?? null,
        signedOffAt: status?.signedOffAt ?? null,
        signOffSnapshot: status?.signOffSnapshot ?? null,
        notApplicable:
          status && currentStatus === "not_applicable"
            ? {
                reason: status.notApplicableReason,
                decidedAt: status.notApplicableAt,
                decidedBy: nameFor(status.notApplicableBy),
              }
            : null,
        evidence: (status?.evidence ?? []).map((e) => ({
          fileName: e.fileName,
          fileType: e.fileType,
          fileSize: e.fileSize,
          uploadedAt: e.uploadedAt,
          status: e.status,
        })),
      };
    });

    const catI18n = getCategory(compliance, cat.code);
    return {
      code: cat.code,
      name: catI18n?.name ?? cat.code,
      description: catI18n?.description ?? null,
      grundschutzModule: cat.grundschutzModule,
      bsiGuidance: catI18n?.bsiGuidance ?? null,
      intakeAnswers: (intake?.answers as Record<string, unknown>) ?? null,
      intakeSignedOffAt: intake?.signedOffAt ?? null,
      requirements: reportReqs,
    };
  });

  return {
    companyName: assessment.company.name,
    companySector: assessment.company.sector,
    frameworkName: compliance.compliance.frameworkName,
    assessmentDate: assessment.startedAt,
    totalRequirements: allRequirements.length,
    completedCount,
    approvedCount,
    categories: reportCategories,
  };
}
