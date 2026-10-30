/**
 * Load all assessment data for PDF report generation.
 *
 * Framework-agnostic: reads framework name, categories, requirements,
 * sign-off snapshots, and evidence from the database.
 */

import type { SignOffSnapshot } from "@nisd2/isms-schema/tables/assessments";
import type { SignedWording } from "@nisd2/isms-schema/tables/sign-off-history";
import { asc, desc, eq, type InferSelectModel, inArray } from "drizzle-orm";
import { legalRefFor } from "@/lib/compliance/czech-law";
import { type DotState, isDoneState } from "@/lib/compliance/journey-position";
import { db } from "@/lib/db";
import { type CoveredBy, type JourneyEntry, journeyEntryOf } from "@/lib/durchgang";
import { type AnswerNames, exportNames } from "@/lib/export/value-names";
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
  signOffHistory,
  user,
} from "@/schema";
import { journeyStatesOf } from "@/server/trpc/helpers/durchgang";
import { pdfLocale } from "./format";

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
  /** The one-line legal reference in the report's language (`legalRefFor`). */
  legalRef: string | null;
  evidenceType: string;
  /** The journey's state (`journeyEntryOf`), the one status every export prints. */
  state: DotState;
  /** A legal reviewer approved it on top of the sign-off (status `approved`). */
  approved: boolean;
  /**
   * Why `state` is not the requirement's own work: met inside walk items, or not asked of the
   * company by any statute. Null otherwise, and for frameworks other than NIS 2.
   */
  coveredBy: CoveredBy | null;
  /** The company's own dated trail from the walk (`internalNotes`), e.g. the method it adopted. */
  notes: string | null;
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
  /** What the answers typed in each category are called, as the walk and the export name them. */
  answerNames: AnswerNames;
}

/**
 * The wording each signed status was last signed against, from its newest sign_off_history
 * entry, where that entry recorded it in the report's language. Older entries hold no wording.
 */
async function signedWordingOf(
  statusIds: readonly string[],
  locale: string,
): Promise<ReadonlyMap<string, SignedWording>> {
  if (statusIds.length === 0) return new Map();
  const entries = await db
    .select({ statusId: signOffHistory.statusId, snapshot: signOffHistory.snapshot })
    .from(signOffHistory)
    .where(inArray(signOffHistory.statusId, [...statusIds]))
    .orderBy(desc(signOffHistory.version));
  // Newest first, so the first entry per status is its latest signature.
  const newest = entries.reduce(
    (latest, e) =>
      latest.has(e.statusId) ? latest : latest.set(e.statusId, e.snapshot.requirement),
    new Map<string, SignedWording | undefined>(),
  );
  return new Map(
    [...newest].flatMap(([id, wording]) =>
      wording?.locale === locale ? [[id, wording] as const] : [],
    ),
  );
}

export async function loadReportData(
  assessmentId: string,
  locale = "en",
): Promise<ReportData> {
  const [compliance, requirementMessages, names, assessment] = await Promise.all([
    getComplianceMessages(locale),
    getRequirementsMessages(locale),
    exportNames(pdfLocale(locale)),
    db.query.companyAssessment.findFirst({
      where: eq(companyAssessment.id, assessmentId),
      with: {
        company: { columns: { name: true, sector: true } },
        framework: { columns: { id: true, code: true } },
      },
    }),
  ]);

  if (!assessment) throw new Error("Assessment not found");

  // The journey's reading of each NIS 2 requirement; other frameworks reuse the codes.
  const [categories, states] = await Promise.all([
    db.query.requirementCategory.findMany({
      where: eq(requirementCategory.frameworkId, assessment.framework.id),
      orderBy: asc(requirementCategory.sortOrder),
    }),
    assessment.framework.code === "nis2"
      ? journeyStatesOf(db, assessment.companyId)
      : new Map<string, JourneyEntry>(),
  ]);

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
  const signedWording = await signedWordingOf(
    statuses.filter((s) => s.signedOffAt !== null).map((s) => s.id),
    locale,
  );

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

  const reportCategories: ReportCategory[] = categories.map((cat) => {
    const catReqs = allRequirements.filter((r) => r.categoryId === cat.id);
    const intake = intakeMap.get(cat.id);

    const reportReqs: ReportRequirement[] = catReqs.map((req) => {
      const status = statusMap.get(req.id);
      const currentStatus = status?.status ?? "not_started";
      const { state, coveredBy } = journeyEntryOf(currentStatus, states.get(req.code));
      // A signed requirement prints the wording it was signed against, not today's.
      const signed = status ? signedWording.get(status.id) : undefined;

      return {
        code: req.code,
        title: signed?.title ?? getRequirementTitle(requirementMessages, req.code),
        description:
          signed?.description ??
          getRequirementDescription(requirementMessages, req.code) ??
          "",
        priority: req.priority,
        legalRef: legalRefFor(req, locale),
        evidenceType: req.evidenceType,
        state,
        approved: currentStatus === "approved",
        coveredBy,
        notes: status?.internalNotes ?? null,
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
        // A draft is an upload that never arrived (evidence.confirmUpload checks the stored file),
        // so it is no evidence and has no place in the audit report.
        evidence: (status?.evidence ?? [])
          .filter((e) => e.status !== "draft")
          .map((e) => ({
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

  const reported = reportCategories.flatMap((c) => c.requirements);
  return {
    companyName: assessment.company.name,
    companySector: assessment.company.sector,
    frameworkName: compliance.compliance.frameworkName,
    assessmentDate: assessment.startedAt,
    totalRequirements: allRequirements.length,
    // Done as the journey counts it: signed, approved or not applicable, or met in the walk.
    completedCount: reported.filter((r) => isDoneState(r.state)).length,
    approvedCount: reported.filter((r) => r.approved).length,
    categories: reportCategories,
    answerNames: names.answers,
  };
}
