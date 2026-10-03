import "@/lib/server-guard";

import { asc, eq, inArray } from "drizzle-orm";
import { journeyIndex } from "@/lib/compliance/journey-position";
import type { DbOrTx } from "@/lib/db";
import {
  asset,
  assetProvider,
  company,
  companyRequirementStatus,
  incident,
  managementReview,
  requirement,
  risk,
  supplier,
  trainingRecord,
} from "@/schema";
import { walkPolicyRows } from "@/server/trpc/helpers/durchgang";
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
    "hasMfa",
    "mfaMethod",
    "hasBackup",
    "backupFrequency",
    "lastBackupTestDate",
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
    "hasSecurityCertification",
    "securityCertificationType",
    "contractStartDate",
    "contractEndDate",
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

const pick = <T extends object, K extends keyof T>(row: T, keys: readonly K[]): Pick<T, K> =>
  Object.fromEntries(keys.map((k) => [k, row[k]])) as Pick<T, K>;

/**
 * Everything one company recorded, for its export: master data, the registers the walk writes
 * into, each NIS 2 requirement's status with its sign-off and notes trail, and the documents the
 * walk wrote with their approval. Every query is filtered by `companyId`.
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
  ] = await Promise.all([
    db.query.company.findFirst({ where: eq(company.id, companyId) }),
    db.query.asset.findMany({
      where: eq(asset.companyId, companyId),
      orderBy: asc(asset.name),
    }),
    db.query.supplier.findMany({
      where: eq(supplier.customerCompanyId, companyId),
      orderBy: asc(supplier.name),
    }),
    db.query.risk.findMany({ where: eq(risk.companyId, companyId) }),
    db.query.trainingRecord.findMany({ where: eq(trainingRecord.companyId, companyId) }),
    db.query.managementReview.findMany({
      where: eq(managementReview.companyId, companyId),
      orderBy: asc(managementReview.reviewDate),
    }),
    db.query.incident.findMany({ where: eq(incident.companyId, companyId) }),
    walkPolicyRows(db, companyId),
    getNis2Assessment(db, companyId),
  ]);
  if (!co) throw new Error(`No company ${companyId}.`);

  const [providers, statuses] = await Promise.all([
    assets.length === 0
      ? []
      : db
          .select({ assetId: assetProvider.assetId, name: supplier.name })
          .from(assetProvider)
          .innerJoin(supplier, eq(supplier.id, assetProvider.supplierId))
          .where(
            inArray(
              assetProvider.assetId,
              assets.map((a) => a.id),
            ),
          ),
    assessment
      ? db
          .select({
            code: requirement.code,
            status: companyRequirementStatus.status,
            signedOffAt: companyRequirementStatus.signedOffAt,
            signedOffRole: companyRequirementStatus.signedOffRole,
            notes: companyRequirementStatus.internalNotes,
          })
          .from(companyRequirementStatus)
          .innerJoin(requirement, eq(requirement.id, companyRequirementStatus.requirementId))
          .where(eq(companyRequirementStatus.assessmentId, assessment.id))
      : [],
  ]);

  return {
    exportedAt: new Date(),
    company: { name: co.name, ...pick(co, EXPORT_FIELDS.company) },
    requirements: statuses.toSorted((a, b) => journeyIndex(a.code) - journeyIndex(b.code)),
    documents,
    assets: assets.map((a) => ({
      name: a.name,
      ...pick(a, EXPORT_FIELDS.asset),
      providers: providers.filter((p) => p.assetId === a.id).map((p) => p.name),
    })),
    suppliers: suppliers.map((s) => ({ name: s.name, ...pick(s, EXPORT_FIELDS.supplier) })),
    risks: risks.map((r) => pick(r, EXPORT_FIELDS.risk)),
    trainings: trainings.map((t) => pick(t, EXPORT_FIELDS.training)),
    managementReviews: reviews.map((r) => pick(r, EXPORT_FIELDS.managementReview)),
    incidents: incidents.map((i) => pick(i, EXPORT_FIELDS.incident)),
  };
}

export type CompanyExport = Awaited<ReturnType<typeof loadCompanyExport>>;
