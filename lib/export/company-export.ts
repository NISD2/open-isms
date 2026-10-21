import "@/lib/server-guard";

import { and, asc, eq, inArray } from "drizzle-orm";
import { journeyIndex } from "@/lib/compliance/journey-position";
import type { DbOrTx } from "@/lib/db";
import { NIS2_WALK } from "@/lib/durchgang";
import {
  asset,
  assetProvider,
  changeRequest,
  company,
  companyCategoryIntake,
  companyRequirementStatus,
  exercise,
  improvementItem,
  incident,
  internalAudit,
  kpiMeasurement,
  managementReview,
  patchRecord,
  processingActivity,
  processingActivitySupplier,
  requirement,
  requirementCategory,
  risk,
  supplier,
  trainingRecord,
  vulnerability,
} from "@/schema";
import { journeyStatesOf, walkPolicyRows } from "@/server/trpc/helpers/durchgang";
import { getNis2Assessment } from "@/server/trpc/helpers/nis2-scope";

type Row<T extends { $inferSelect: object }> = T["$inferSelect"];

/**
 * The fields of each record the export carries, in the order it prints them. Never whole rows:
 * `supplier.unsubscribeToken` is a bearer token, and the rest is plumbing nobody reads on paper.
 */
export const EXPORT_FIELDS = {
  company: [
    "legalForm",
    "sector",
    "entityType",
    "employeeCount",
    "registeredAddress",
    "primaryLocations",
    "contactEmail",
    "contactPhone",
    "cisoName",
    "cisoReportsTo",
    "bsiContactName",
    "bsiContactEmail",
    "bsiContactPhone",
    "bsiRegistrationId",
  ],
  asset: [
    "type",
    "description",
    "quantity",
    "isCritical",
    "isOT",
    "owner",
    "location",
    "hostname",
    "ipAddress",
    "operatingSystem",
    "softwareVersion",
    "lastPatchDate",
    "accessManagement",
    "hasMfa",
    "mfaMethod",
    "encryptionAtRest",
    "encryptionInTransit",
    "hasBackup",
    "backupFrequency",
    "lastBackupTestDate",
    "rto",
    "rpo",
    "processesPersonalData",
    "endOfLife",
  ],
  supplier: [
    "description",
    "serviceType",
    "contactName",
    "contactEmail",
    "riskLevel",
    "isCritical",
    "hasAccessToSystems",
    "hasAccessToData",
    "hasSecurityClauses",
    "contractSecurityClauses",
    "hasAuditRights",
    "hasSecurityCertification",
    "securityCertificationType",
    "contractStartDate",
    "contractEndDate",
    "lastReviewDate",
    "processesPersonalData",
    "dpaAvailable",
  ],
  risk: [
    "title",
    "description",
    "likelihood",
    "impact",
    "riskScore",
    "treatment",
    "treatmentDescription",
    "riskOwner",
    "acceptedAt",
  ],
  training: [
    "title",
    "participantName",
    "participantRole",
    "providerName",
    "completedAt",
    "nextTrainingDue",
  ],
  managementReview: [
    "title",
    "reviewDate",
    "attendees",
    "decisions",
    "actionItems",
    "nextReviewDate",
  ],
  incident: [
    "internalRef",
    "title",
    "description",
    "severity",
    "discoveredAt",
    "resolvedAt",
  ],
  vulnerability: [
    "cveId",
    "title",
    "description",
    "severity",
    "cvssScore",
    "source",
    "status",
    "discoveredAt",
    "treatmentNote",
    "acceptanceReason",
    "resolvedAt",
  ],
  patch: [
    "patchIdentifier",
    "title",
    "severity",
    "status",
    "releaseDate",
    "appliedAt",
    "exceptionReason",
    "exceptionExpiresAt",
  ],
  change: [
    "title",
    "description",
    "changeType",
    "status",
    "businessJustification",
    "securityImpactAssessment",
    "rollbackPlan",
    "approvedAt",
    "implementedAt",
    "testedAt",
    "rolledBackAt",
    "closedAt",
  ],
  exercise: [
    "title",
    "exerciseType",
    "domain",
    "scheduledDate",
    "completedAt",
    "scenarioDescription",
    "participants",
    "facilitator",
    "identifiedGaps",
    "lessonsLearned",
  ],
  improvement: [
    "title",
    "description",
    "source",
    "priority",
    "status",
    "targetDate",
    "completedAt",
    "deferralReason",
    "verificationNotes",
  ],
  internalAudit: [
    "title",
    "auditArea",
    "scope",
    "status",
    "scheduledDate",
    "completedAt",
    "auditorName",
  ],
  kpi: ["kpiName", "measuredAt", "value", "target", "unit", "status", "notes"],
  processingActivity: [
    "name",
    "purpose",
    "legalBases",
    "legitimateInterests",
    "dataSubjects",
    "dataCategories",
    "specialCategories",
    "recipients",
    "transfersOutsideEea",
    "transferDetails",
    "retention",
  ],
} as const satisfies {
  readonly company: readonly (keyof Row<typeof company>)[];
  readonly asset: readonly (keyof Row<typeof asset>)[];
  readonly supplier: readonly (keyof Row<typeof supplier>)[];
  readonly risk: readonly (keyof Row<typeof risk>)[];
  readonly training: readonly (keyof Row<typeof trainingRecord>)[];
  readonly managementReview: readonly (keyof Row<typeof managementReview>)[];
  readonly incident: readonly (keyof Row<typeof incident>)[];
  readonly vulnerability: readonly (keyof Row<typeof vulnerability>)[];
  readonly patch: readonly (keyof Row<typeof patchRecord>)[];
  readonly change: readonly (keyof Row<typeof changeRequest>)[];
  readonly exercise: readonly (keyof Row<typeof exercise>)[];
  readonly improvement: readonly (keyof Row<typeof improvementItem>)[];
  readonly internalAudit: readonly (keyof Row<typeof internalAudit>)[];
  readonly kpi: readonly (keyof Row<typeof kpiMeasurement>)[];
  readonly processingActivity: readonly (keyof Row<typeof processingActivity>)[];
};

export type ExportRecord = keyof typeof EXPORT_FIELDS;

/**
 * The columns a query loads, from a field list: only what the export carries ever leaves the
 * database, so a token on the same row never reaches memory.
 */
export const columnsOf = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, true])) as { [P in K]: true };

/**
 * Rows `offset` to `offset + limit - 1` of a list part, in the part's own order, for an assistant
 * reading it a page at a time; null reads the whole part, as the export files do.
 */
export type PageWindow = { readonly offset: number; readonly limit: number } | null;

/** A window as a list query takes it: no limit for the whole part. */
const paged = (window: PageWindow) => window ?? {};

/** A window over a list that is sorted in memory. */
const sliced = <T>(rows: readonly T[], window: PageWindow): T[] =>
  window ? rows.slice(window.offset, window.offset + window.limit) : [...rows];

async function loadCompany(db: DbOrTx, companyId: string) {
  const co = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { name: true, ...columnsOf(EXPORT_FIELDS.company) },
  });
  if (!co) throw new Error(`No company ${companyId}.`);
  return co;
}

/** Each NIS 2 requirement with its status, place on the journey, sign-off and notes trail. */
async function loadRequirements(db: DbOrTx, companyId: string, window: PageWindow) {
  const [assessment, states] = await Promise.all([
    getNis2Assessment(db, companyId),
    journeyStatesOf(db, companyId),
  ]);
  if (!assessment) return [];
  const statuses = await db
    .select({
      code: requirement.code,
      status: companyRequirementStatus.status,
      signedOffAt: companyRequirementStatus.signedOffAt,
      signedOffRole: companyRequirementStatus.signedOffRole,
      notApplicableReason: companyRequirementStatus.notApplicableReason,
      notes: companyRequirementStatus.internalNotes,
    })
    .from(companyRequirementStatus)
    .innerJoin(requirement, eq(requirement.id, companyRequirementStatus.requirementId))
    .where(eq(companyRequirementStatus.assessmentId, assessment.id));
  return sliced(
    statuses
      .map((s) => ({
        ...s,
        journey: states.get(s.code) ?? { state: "todo" as const, coveredBy: null },
      }))
      // Codes outside the journey share its last place; their code orders them, so pages hold.
      .toSorted(
        (a, b) =>
          journeyIndex(a.code) - journeyIndex(b.code) || a.code.localeCompare(b.code),
      ),
    window,
  );
}

/** What was typed in each category's fields, in the walk or on the requirement pages. */
async function loadAnswers(db: DbOrTx, companyId: string) {
  const assessment = await getNis2Assessment(db, companyId);
  if (!assessment) return {};
  const intakes = await db
    .select({
      category: requirementCategory.code,
      answers: companyCategoryIntake.answers,
    })
    .from(companyCategoryIntake)
    .innerJoin(
      requirementCategory,
      eq(requirementCategory.id, companyCategoryIntake.categoryId),
    )
    .where(eq(companyCategoryIntake.assessmentId, assessment.id));
  return Object.fromEntries(intakes.map((i) => [i.category, i.answers ?? {}]));
}

/** The assets, each with the suppliers that provide it. */
async function loadAssets(db: DbOrTx, companyId: string, window: PageWindow) {
  const assets = await db.query.asset.findMany({
    where: eq(asset.companyId, companyId),
    columns: { id: true, name: true, ...columnsOf(EXPORT_FIELDS.asset) },
    orderBy: [asc(asset.name), asc(asset.id)],
    ...paged(window),
  });
  const providers =
    assets.length === 0
      ? []
      : await db
          .select({ assetId: assetProvider.assetId, name: supplier.name })
          .from(assetProvider)
          .innerJoin(supplier, eq(supplier.id, assetProvider.supplierId))
          .where(
            and(
              eq(supplier.customerCompanyId, companyId),
              inArray(
                assetProvider.assetId,
                assets.map((a) => a.id),
              ),
            ),
          );
  return assets.map(({ id, ...a }) => ({
    ...a,
    providers: providers.filter((p) => p.assetId === id).map((p) => p.name),
  }));
}

/**
 * The record of processing activities, each with the suppliers it goes through: Art. 30(1)(d) and
 * (e) ask for them, and an activity's own `recipients` leaves them out, as the app links them
 * (`processingActivitySupplier`). Only links to the company's own suppliers are read.
 */
async function loadProcessingActivities(
  db: DbOrTx,
  companyId: string,
  window: PageWindow,
) {
  const activities = await db.query.processingActivity.findMany({
    where: eq(processingActivity.companyId, companyId),
    columns: { id: true, ...columnsOf(EXPORT_FIELDS.processingActivity) },
    orderBy: [asc(processingActivity.name), asc(processingActivity.id)],
    ...paged(window),
  });
  const links =
    activities.length === 0
      ? []
      : await db
          .select({
            activityId: processingActivitySupplier.activityId,
            name: supplier.name,
          })
          .from(processingActivitySupplier)
          .innerJoin(supplier, eq(supplier.id, processingActivitySupplier.supplierId))
          .where(
            and(
              eq(supplier.customerCompanyId, companyId),
              inArray(
                processingActivitySupplier.activityId,
                activities.map((a) => a.id),
              ),
            ),
          );
  return activities.map(({ id, ...a }) => ({
    ...a,
    providers: links
      .filter((l) => l.activityId === id)
      .map((l) => l.name)
      .toSorted(),
  }));
}

/** The parts of the export, in the order the file holds them. */
export const EXPORT_PART_NAMES = [
  "company",
  "requirements",
  "answers",
  "documents",
  "assets",
  "suppliers",
  "risks",
  "trainings",
  "managementReviews",
  "incidents",
  "vulnerabilities",
  "patches",
  "changes",
  "exercises",
  "improvements",
  "internalAudits",
  "kpis",
  "processingActivities",
] as const;

type PartLoader = (db: DbOrTx, companyId: string, window: PageWindow) => Promise<unknown>;

/**
 * Every part of the export, each loaded alone and filtered by the company, directly or through its
 * own assessment and assets. An assistant reads one part a page at a time (lib/mcp/records.ts);
 * the export files read them all (`loadCompanyExport`). A list part is in a fixed order that ends
 * on the id, so pages neither repeat nor skip a row; the company and the answers are one record.
 */
export const EXPORT_PARTS = {
  company: (db: DbOrTx, companyId: string, _window: PageWindow) =>
    loadCompany(db, companyId),
  requirements: loadRequirements,
  answers: (db: DbOrTx, companyId: string, _window: PageWindow) =>
    loadAnswers(db, companyId),
  /** The documents the walk wrote, with their approval. */
  documents: async (db: DbOrTx, companyId: string, window: PageWindow) =>
    sliced(await walkPolicyRows(db, companyId, NIS2_WALK), window),
  assets: loadAssets,
  suppliers: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.supplier.findMany({
      where: eq(supplier.customerCompanyId, companyId),
      columns: { name: true, ...columnsOf(EXPORT_FIELDS.supplier) },
      orderBy: [asc(supplier.name), asc(supplier.id)],
      ...paged(window),
    }),
  risks: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.risk.findMany({
      where: eq(risk.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.risk),
      orderBy: [asc(risk.createdAt), asc(risk.id)],
      ...paged(window),
    }),
  trainings: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.trainingRecord.findMany({
      where: eq(trainingRecord.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.training),
      orderBy: [asc(trainingRecord.createdAt), asc(trainingRecord.id)],
      ...paged(window),
    }),
  managementReviews: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.managementReview.findMany({
      where: eq(managementReview.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.managementReview),
      orderBy: [asc(managementReview.reviewDate), asc(managementReview.id)],
      ...paged(window),
    }),
  incidents: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.incident.findMany({
      where: eq(incident.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.incident),
      orderBy: [asc(incident.createdAt), asc(incident.id)],
      ...paged(window),
    }),
  vulnerabilities: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.vulnerability.findMany({
      where: eq(vulnerability.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.vulnerability),
      orderBy: [asc(vulnerability.createdAt), asc(vulnerability.id)],
      ...paged(window),
    }),
  patches: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.patchRecord.findMany({
      where: eq(patchRecord.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.patch),
      orderBy: [asc(patchRecord.createdAt), asc(patchRecord.id)],
      ...paged(window),
    }),
  changes: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.changeRequest.findMany({
      where: eq(changeRequest.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.change),
      orderBy: [asc(changeRequest.createdAt), asc(changeRequest.id)],
      ...paged(window),
    }),
  exercises: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.exercise.findMany({
      where: eq(exercise.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.exercise),
      orderBy: [asc(exercise.scheduledDate), asc(exercise.id)],
      ...paged(window),
    }),
  improvements: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.improvementItem.findMany({
      where: eq(improvementItem.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.improvement),
      orderBy: [asc(improvementItem.createdAt), asc(improvementItem.id)],
      ...paged(window),
    }),
  internalAudits: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.internalAudit.findMany({
      where: eq(internalAudit.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.internalAudit),
      orderBy: [asc(internalAudit.scheduledDate), asc(internalAudit.id)],
      ...paged(window),
    }),
  kpis: (db: DbOrTx, companyId: string, window: PageWindow) =>
    db.query.kpiMeasurement.findMany({
      where: eq(kpiMeasurement.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.kpi),
      orderBy: [asc(kpiMeasurement.measuredAt), asc(kpiMeasurement.id)],
      ...paged(window),
    }),
  processingActivities: loadProcessingActivities,
} as const satisfies Record<(typeof EXPORT_PART_NAMES)[number], PartLoader>;

export type ExportPart = keyof typeof EXPORT_PARTS;

/** The parts that are one record each, read whole on any page. */
export const SINGLE_PARTS = [
  "company",
  "answers",
] as const satisfies readonly ExportPart[];

/**
 * Everything one company recorded, for its export files: every part, whole. Listed by name rather
 * than looped, so the file's type is each part's own; `FileHoldsEveryPart` checks the list against
 * `EXPORT_PARTS` when it compiles.
 */
export async function loadCompanyExport(db: DbOrTx, companyId: string) {
  const p = EXPORT_PARTS;
  const [
    co,
    requirements,
    answers,
    documents,
    assets,
    suppliers,
    risks,
    trainings,
    managementReviews,
    incidents,
    vulnerabilities,
    patches,
    changes,
    exercises,
    improvements,
    internalAudits,
    kpis,
    processingActivities,
  ] = await Promise.all([
    p.company(db, companyId, null),
    p.requirements(db, companyId, null),
    p.answers(db, companyId, null),
    p.documents(db, companyId, null),
    p.assets(db, companyId, null),
    p.suppliers(db, companyId, null),
    p.risks(db, companyId, null),
    p.trainings(db, companyId, null),
    p.managementReviews(db, companyId, null),
    p.incidents(db, companyId, null),
    p.vulnerabilities(db, companyId, null),
    p.patches(db, companyId, null),
    p.changes(db, companyId, null),
    p.exercises(db, companyId, null),
    p.improvements(db, companyId, null),
    p.internalAudits(db, companyId, null),
    p.kpis(db, companyId, null),
    p.processingActivities(db, companyId, null),
  ]);
  return {
    exportedAt: new Date(),
    company: co,
    requirements,
    answers,
    documents,
    assets,
    suppliers,
    risks,
    trainings,
    managementReviews,
    incidents,
    vulnerabilities,
    patches,
    changes,
    exercises,
    improvements,
    internalAudits,
    kpis,
    processingActivities,
  };
}

export type CompanyExport = Awaited<ReturnType<typeof loadCompanyExport>>;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Holds<T extends true> = T;
/**
 * Fails to compile when the export file and the parts an assistant reads drift apart: a part added
 * to one list and not the other.
 */
export type FileHoldsEveryPart = Holds<
  Same<Exclude<keyof CompanyExport, "exportedAt">, ExportPart>
>;
