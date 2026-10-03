import "@/lib/server-guard";

import { and, asc, eq, inArray } from "drizzle-orm";
import { journeyIndex } from "@/lib/compliance/journey-position";
import type { DbOrTx } from "@/lib/db";
import {
  asset,
  assetProvider,
  company,
  companyCategoryIntake,
  companyRequirementStatus,
  incident,
  managementReview,
  requirement,
  requirementCategory,
  risk,
  supplier,
  trainingRecord,
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
} as const satisfies {
  readonly company: readonly (keyof Row<typeof company>)[];
  readonly asset: readonly (keyof Row<typeof asset>)[];
  readonly supplier: readonly (keyof Row<typeof supplier>)[];
  readonly risk: readonly (keyof Row<typeof risk>)[];
  readonly training: readonly (keyof Row<typeof trainingRecord>)[];
  readonly managementReview: readonly (keyof Row<typeof managementReview>)[];
  readonly incident: readonly (keyof Row<typeof incident>)[];
};

export type ExportRecord = keyof typeof EXPORT_FIELDS;

/**
 * The columns a query loads, from a field list: only what the export carries ever leaves the
 * database, so a token on the same row never reaches memory.
 */
const columnsOf = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, true])) as { [P in K]: true };

/**
 * Everything one company recorded, for its export: master data, the registers the walk writes
 * into, each NIS 2 requirement with its status, its place on the journey (`journeyStatesOf`),
 * sign-off and notes trail, the answers typed in each category, and the documents the walk wrote
 * with their approval. Every query is filtered by the company, directly or through its own
 * assessment and assets.
 */
export async function loadCompanyExport(db: DbOrTx, companyId: string) {
  const [
    co,
    assets,
    suppliers,
    risks,
    trainings,
    reviews,
    incidents,
    documents,
    assessment,
    states,
  ] = await Promise.all([
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { name: true, ...columnsOf(EXPORT_FIELDS.company) },
    }),
    db.query.asset.findMany({
      where: eq(asset.companyId, companyId),
      columns: { id: true, name: true, ...columnsOf(EXPORT_FIELDS.asset) },
      orderBy: asc(asset.name),
    }),
    db.query.supplier.findMany({
      where: eq(supplier.customerCompanyId, companyId),
      columns: { name: true, ...columnsOf(EXPORT_FIELDS.supplier) },
      orderBy: asc(supplier.name),
    }),
    db.query.risk.findMany({
      where: eq(risk.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.risk),
    }),
    db.query.trainingRecord.findMany({
      where: eq(trainingRecord.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.training),
    }),
    db.query.managementReview.findMany({
      where: eq(managementReview.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.managementReview),
      orderBy: asc(managementReview.reviewDate),
    }),
    db.query.incident.findMany({
      where: eq(incident.companyId, companyId),
      columns: columnsOf(EXPORT_FIELDS.incident),
    }),
    walkPolicyRows(db, companyId),
    getNis2Assessment(db, companyId),
    journeyStatesOf(db, companyId),
  ]);
  if (!co) throw new Error(`No company ${companyId}.`);

  const [providers, statuses, intakes] = await Promise.all([
    assets.length === 0
      ? []
      : db
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
          ),
    assessment
      ? db
          .select({
            code: requirement.code,
            status: companyRequirementStatus.status,
            signedOffAt: companyRequirementStatus.signedOffAt,
            signedOffRole: companyRequirementStatus.signedOffRole,
            notApplicableReason: companyRequirementStatus.notApplicableReason,
            notes: companyRequirementStatus.internalNotes,
          })
          .from(companyRequirementStatus)
          .innerJoin(
            requirement,
            eq(requirement.id, companyRequirementStatus.requirementId),
          )
          .where(eq(companyRequirementStatus.assessmentId, assessment.id))
      : [],
    assessment
      ? db
          .select({
            category: requirementCategory.code,
            answers: companyCategoryIntake.answers,
          })
          .from(companyCategoryIntake)
          .innerJoin(
            requirementCategory,
            eq(requirementCategory.id, companyCategoryIntake.categoryId),
          )
          .where(eq(companyCategoryIntake.assessmentId, assessment.id))
      : [],
  ]);

  return {
    exportedAt: new Date(),
    company: co,
    requirements: statuses
      .map((s) => ({
        ...s,
        journey: states.get(s.code) ?? { state: "todo" as const, coveredBy: null },
      }))
      .toSorted((a, b) => journeyIndex(a.code) - journeyIndex(b.code)),
    /** What was typed in each category's fields, in the walk or on the requirement pages. */
    answers: Object.fromEntries(intakes.map((i) => [i.category, i.answers ?? {}])),
    documents,
    assets: assets.map(({ id, ...a }) => ({
      ...a,
      providers: providers.filter((p) => p.assetId === id).map((p) => p.name),
    })),
    suppliers,
    risks,
    trainings,
    managementReviews: reviews,
    incidents,
  };
}

export type CompanyExport = Awaited<ReturnType<typeof loadCompanyExport>>;
