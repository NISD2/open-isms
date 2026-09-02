/**
 * Load all assessment data for PDF report generation.
 *
 * Framework-agnostic: reads framework name, categories, requirements,
 * sign-off snapshots, and evidence from the database.
 */

import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import { asc, eq, inArray } from "drizzle-orm";
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
} from "@/schema";

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
  signedOffRole: string | null;
  signedOffAt: Date | null;
  signOffSnapshot: SignOffSnapshot | null;
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
        signedOffRole: status?.signedOffRole ?? null,
        signedOffAt: status?.signedOffAt ?? null,
        signOffSnapshot: status?.signOffSnapshot ?? null,
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
