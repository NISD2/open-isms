/**
 * Validators -- Zod schemas for runtime validation
 *
 * Built on drizzle-zod: auto-generates base schemas from Drizzle tables,
 * then extends with business rules that SQL constraints can't express.
 *
 * Pattern per table:
 *   insertXxxSchema  -- validates data going INTO the database
 *   selectXxxSchema  -- validates/types data coming FROM the database
 *   updateXxxSchema  -- partial insert schema for PATCH operations
 *
 * Usage:
 *   import { companyInsertSchema } from "@/schema/validators";
 *   const parsed = companyInsertSchema.parse(req.body);
 */
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { getTableColumns, is, type Table } from "drizzle-orm";
import { PgNumeric } from "drizzle-orm/pg-core";
import { z } from "zod";

// --- Table imports (alphabetical by file) ---
import { policyAcknowledgment } from "@nisd2/isms-schema/tables/acknowledgment";
import { companyAssessment, companyRequirementStatus } from "@nisd2/isms-schema/tables/assessments";
import { asset, assetSupplierOffering } from "@nisd2/grc-data-model/schema";
import { internalAudit, auditFinding } from "@nisd2/isms-schema/tables/audit";
import { auditLog } from "@nisd2/isms-schema/tables/audit-log";
import { changeRequest } from "@nisd2/isms-schema/tables/change-management";
import { evidence } from "@nisd2/isms-schema/tables/evidence";
import { exercise } from "@nisd2/isms-schema/tables/exercise";

import { complianceFramework, requirementCategory } from "@nisd2/grc-data-model/schema";
import { improvementItem } from "@nisd2/isms-schema/tables/improvement";
import { incident } from "@nisd2/grc-data-model/schema";
import { kpiMeasurement } from "@nisd2/isms-schema/tables/kpi";
import { notification } from "@nisd2/isms-schema/tables/notification";
import { company, user } from "@nisd2/isms-schema/tables/organization";
import { patchRecord } from "@nisd2/isms-schema/tables/patch-management";
import { vulnerability } from "@nisd2/isms-schema/tables/vulnerability";
import { policy } from "@nisd2/isms-schema/tables/policies";
import { requirement } from "@nisd2/grc-data-model/schema";
import { managementReview } from "@nisd2/isms-schema/tables/review";
import { risk, riskAsset, riskSupplier } from "@nisd2/grc-data-model/schema";
import { riskTreatment } from "@nisd2/isms-schema/tables/risk-treatment";
import { supplier } from "@nisd2/grc-data-model/schema";
import { trainingRecord } from "@nisd2/isms-schema/tables/training";

// --- Module imports ---
import { bsiRegistration, bsiIncidentReport } from "./modules/bsig";

// ============================================================================
// Helpers
// ============================================================================

/** Strip auto-generated fields for update schemas. Use omitAudit for tables without updatedAt. */
const omitMeta = { id: true, createdAt: true, updatedAt: true } as const;
const omitAudit = { id: true, createdAt: true } as const;

/**
 * Strip tenant-isolation field. Use for EVERY tenant-scoped *UpdateSchema to
 * prevent mass-assignment attacks where a user could pass `companyId` and
 * transfer rows between tenants via update.
 *
 * The companyId must ONLY be set by server-side code from `ctx.companyId`,
 * never from request input.
 */
const omitTenantMeta = { ...omitMeta, companyId: true } as const;

/**
 * pg `date` columns surface from drizzle-zod as bare strings, which lets ""
 * and free-text through to Postgres (`invalid input syntax for type date`)
 * and makes SchemaForm render a text input instead of a date picker. Spread
 * this into createInsertSchema overrides for every table that has date
 * columns; derived from table metadata so new date columns are covered
 * without maintaining a field list. Explicit overrides listed after the
 * spread still win.
 */
function isoDateColumns<T extends Table>(
  table: T,
): Partial<Record<keyof T["_"]["columns"], z.ZodType>> {
  const out: Partial<Record<keyof T["_"]["columns"], z.ZodType>> = {};
  for (const [name, col] of Object.entries(getTableColumns(table))) {
    if (col.columnType === "PgDateString") {
      // nullish, not nullable: drizzle-zod makes nullable columns optional in
      // insert schemas (callers may omit the key) and an override replaces
      // that wholesale — .nullable() alone would make absent keys a 400.
      out[name as keyof T["_"]["columns"]] = col.notNull
        ? z.iso.date()
        : z.iso.date().nullish();
    }
  }
  return out;
}

/**
 * pg `numeric`/`decimal` columns surface from drizzle-zod as bare strings,
 * so free text ("ca. 95%", "12k") flows to Postgres and fails the insert
 * with `invalid input syntax for type numeric` — a 500, not a validation
 * error. Same shape as isoDateColumns: constrain those columns to a numeric
 * string so the form and the server reject non-numbers up front. Derived
 * from table metadata; explicit overrides after the spread still win.
 */
function numericColumns<T extends Table>(
  table: T,
): Partial<Record<keyof T["_"]["columns"], z.ZodType>> {
  const out: Partial<Record<keyof T["_"]["columns"], z.ZodType>> = {};
  for (const [name, col] of Object.entries(getTableColumns(table))) {
    // is() over instanceof: entityKind-based, so it survives a second
    // drizzle-orm copy in the graph where class identity would not.
    if (is(col, PgNumeric)) {
      // Free-text validation of a number is a genuine free-text case, so the
      // regex is appropriate here. Integers and decimals only; "" is rejected
      // (SchemaForm strips it to undefined for optional columns).
      const base = z
        .string()
        .regex(/^-?\d+(\.\d+)?$/, "Must be a number");
      // pg rejects values whose integer digits exceed precision - scale with
      // "numeric field overflow" (a 500, not a validation error), while excess
      // fractional digits are silently rounded. Bound the integer digits from
      // the column's own declared precision/scale so overflow fails validation.
      const intDigitCap =
        typeof col.precision === "number"
          ? col.precision - (typeof col.scale === "number" ? col.scale : 0)
          : null;
      const numericStr =
        intDigitCap === null
          ? base
          : base.refine(
              (v) => {
                // Strip ALL leading zeros: pg counts significant digits of
                // the value, so "0" and "0.95" have zero integer digits.
                const intPart = v.replace(/^-/, "").split(".")[0] ?? "";
                const significant = intPart.replace(/^0+/, "");
                return significant.length <= intDigitCap;
              },
              `Must be at most ${intDigitCap} digits before the decimal point`,
            );
      out[name as keyof T["_"]["columns"]] = col.notNull
        ? numericStr
        : numericStr.nullish();
    }
  }
  return out;
}

// ============================================================================
// Organization
// ============================================================================

export const companyInsertSchema = createInsertSchema(company, {
  ...numericColumns(company),
  name: z.string().min(2).max(255),
  sector: z.string().min(1).max(255),
  contactEmail: z.union([
    z.string().email(),
    z.literal("").transform(() => null),
  ]).nullish(),
  employeeCount: z.number().int().positive().nullish(),
  // Universal company facts (surfaced by both entity and supplier portals).
  primaryDomain: z
    .string()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "valid domain")
    .nullish(),
  tagline: z.string().max(255).nullish(),
  incidentContactEmail: z.string().email().max(255).nullish(),
  legalName: z.string().min(1).max(255).nullish(),
  registeredAddress: z.string().min(1).max(500).nullish(),
  country: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2")
    .nullish(),
  securityContactName: z.string().min(1).max(255).nullish(),
});
export const companySelectSchema = createSelectSchema(company);
export const companyUpdateSchema = companyInsertSchema.partial().omit(omitMeta);

// ----------------------------------------------------------------------------
// Supplier portal — three-layer schema
//
//   1. securityProfileUpdateSchema      → company table  (universal truths)
//   2. relationshipClausesUpdateSchema  → supplier table (per-customer terms)
//   3. assetServiceUpdateSchema         → asset table    (per-service tech)
//
// Each is a strict .pick() of its parent insert schema so the supplier-portal
// endpoints can never mass-assign into NIS2 / billing / FK columns. Zod
// strips unknown fields.
//
// Identity / contact / logo also live on the company row but logo has its own
// dedicated setLogo mutation (validates the S3 key prefix), so it's omitted.
// ----------------------------------------------------------------------------

/**
 * Layer 1 — Universal company practices.
 *
 * Truth about the supplier company itself: identity, contacts, ISMS, ISO27001,
 * baseline NIS2 Art 21(2) practices. Same answer for every customer; lives on
 * the `company` row.
 *
 * Drives the "Profile" + "Security practices" pages of the supplier portal AND
 * the company-identity portion of the customer view at /supplier-access/{token}.
 */
export const securityProfileUpdateSchema = companyInsertSchema
  .partial()
  .pick({
    // Profile metadata
    primaryDomain: true,
    tagline: true,
    description: true,
    // Customer-facing incident contact (default — per-customer SLA on supplier row)
    incidentContactEmail: true,
    incidentContactPhone: true,
    // Identity (ENISA TIG §5.2 supplier register)
    legalName: true,
    registeredAddress: true,
    country: true,
    securityContactName: true,
    // CIR §5.1.4 universal facts about how the company runs
    hasIsms: true,
    hasIso27001OrEquivalent: true,
    staffSecurityTraining: true,
    backgroundChecks: true,
    vulnerabilityHandling: true,
    // NIS2 Art 21(2) / CIR §5.1 universal baseline practices
    securityPolicyReviewedAnnually: true,
    hasIncidentResponsePlan: true,
    hasBusinessContinuityPlan: true,
    hasCryptographyPolicy: true,
    hasPrivilegedAccessMgmt: true,
    mfaEnforcedInternal: true,
    hasAssetInventory: true,
    hasPenetrationTestingProgram: true,
    // ENISA TIG §5 — universal company-wide declarations
    cooperateWithAuthorities: true,
    pastBreachesDisclosed: true,
    // ENISA TIG §5.1.2 — supplier's own NIS2-regulated status (reuses the
    // existing bsiRegistrationId column from the entity-side profile)
    bsiRegistrationId: true,
    // ENISA TIG §5.2(b) / §5.1.4 TIPS — profile extensions
    serviceDescription: true,
    dataProcessingLocations: true,
    incidentSlaHours: true,
    isSaas: true,
    isOnPrem: true,
    isProfessionalServices: true,
    isManagedService: true,
    usesAiSystems: true,
    // CIR §5.1.4 / GDPR Art. 28 / ENISA TIG §5.1.4 TIPS — security practice extensions
    acceptRightToAudit: true,
    hasSubprocessors: true,
    subprocessorList: true,
    dataReturnOnTermination: true,
    dpaAvailable: true,
    incidentAssistanceCommitment: true,
    notifyMaterialChanges: true,
    notifyOnLocationChange: true,
    hasExitPlan: true,
    providesSbomForAi: true,
    aiSbomUrl: true,
    // SaaS technical (rendered when isSaas)
    saasHostingRegion: true,
    saasEncryptionAtRest: true,
    saasEncryptionInTransit: true,
    saasMfaEnforced: true,
    saasRtoHours: true,
    // On-prem technical (rendered when isOnPrem)
    onPremSbomProvided: true,
    onPremSignedReleases: true,
    onPremVulnerabilityDisclosurePolicy: true,
    onPremPatchSlaCriticalHours: true,
    // Professional services (rendered when isProfessionalServices)
    proServicesBackgroundCheckScope: true,
    proServicesNdaInPlace: true,
    proServicesCustomerPremisesPolicy: true,
    // Managed services (rendered when isManagedService)
    managedPrivilegedAccessMgmt: true,
    managedSessionRecording: true,
    managedOnCall24x7: true,
  });

export const userInsertSchema = createInsertSchema(user, {
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  role: z.string().min(1).max(100),
});
export const userSelectSchema = createSelectSchema(user);
export const userUpdateSchema = userInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Compliance Frameworks
// ============================================================================

export const frameworkInsertSchema = createInsertSchema(complianceFramework, {
  ...isoDateColumns(complianceFramework),
});
export const frameworkSelectSchema = createSelectSchema(complianceFramework);

export const categoryInsertSchema = createInsertSchema(requirementCategory, {
  slug: z.string().min(1).max(255),
  sortOrder: z.number().int().nonnegative(),
});
export const categorySelectSchema = createSelectSchema(requirementCategory);

// ============================================================================
// Requirements
// ============================================================================

export const requirementInsertSchema = createInsertSchema(requirement, {
  code: z.string().min(1).max(20),
  sortOrder: z.number().int().nonnegative(),
  estimatedHours: z.number().int().positive().nullish(),
  minEmployees: z.number().int().positive().nullish(),
});
export const requirementSelectSchema = createSelectSchema(requirement);
export const requirementUpdateSchema = requirementInsertSchema.partial().omit(omitMeta);

// ============================================================================
// Assessments
// ============================================================================

export const assessmentInsertSchema = createInsertSchema(companyAssessment, {
  ...isoDateColumns(companyAssessment),
  ...numericColumns(companyAssessment),
});
export const assessmentSelectSchema = createSelectSchema(companyAssessment);

export const requirementStatusInsertSchema = createInsertSchema(companyRequirementStatus, {
  ...isoDateColumns(companyRequirementStatus),
});
export const requirementStatusSelectSchema = createSelectSchema(companyRequirementStatus);
// assessmentId + requirementId are immutable parent FKs — never patchable.
export const requirementStatusUpdateSchema = requirementStatusInsertSchema
  .partial()
  .omit({ ...omitMeta, assessmentId: true, requirementId: true });

// ============================================================================
// Evidence
// ============================================================================

export const evidenceInsertSchema = createInsertSchema(evidence, {
  ...isoDateColumns(evidence),
  fileName: z.string().min(1).max(500),
  storageKey: z.string().min(1).max(500),
  contentHash: z.string().length(64).nullish(),
});
export const evidenceSelectSchema = createSelectSchema(evidence);
export const evidenceUpdateSchema = evidenceInsertSchema.partial().omit({ id: true });

// ============================================================================
// Policies
// ============================================================================

export const policyInsertSchema = createInsertSchema(policy, {
  ...isoDateColumns(policy),
  title: z.string().min(1).max(500),
  type: z.string().min(1).max(100),
});
export const policySelectSchema = createSelectSchema(policy);
export const policyUpdateSchema = policyInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Audit Log (insert-only -- no update schema for append-only log)
// ============================================================================

export const auditLogInsertSchema = createInsertSchema(auditLog, {
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  description: z.string().min(1),
});
export const auditLogSelectSchema = createSelectSchema(auditLog);

// ============================================================================
// Assets
// ============================================================================

export const assetInsertSchema = createInsertSchema(asset, {
  ...isoDateColumns(asset),
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
});
export const assetSelectSchema = createSelectSchema(asset);
export const assetUpdateSchema = assetInsertSchema.partial().omit(omitTenantMeta);

/**
 * Per-asset-per-customer service-type-conditional declarations (SaaS hosting,
 * on-prem SBOM, managed PAM, etc). Enum + range constraints tightened beyond
 * the raw `varchar` / `integer` columns — drizzle-zod can't infer enums from
 * length-limited varchars.
 */
export const assetSupplierOfferingInsertSchema = createInsertSchema(
  assetSupplierOffering,
  {
    // .nullable() preserves the DB column nullability — drizzle-zod can't
    // infer enums / max constraints from `varchar(20)`, so we tighten here,
    // but we must restate `.nullable()` because the override loses the
    // column's nullable flag otherwise.
    serviceDescription: z.string().max(2000).nullable(),
    dataProcessingLocations: z.string().max(1000).nullable(),
    saasHostingRegion: z.enum(["eu", "de_only", "global"]).nullable(),
    proServicesBackgroundCheckScope: z
      .enum(["criminal", "employment", "both"])
      .nullable(),
    onPremPatchSlaCriticalHours: z
      .number()
      .int()
      .positive()
      .max(720)
      .nullable(),
  },
);

/**
 * Per-asset service declaration (supplier portal) — what the supplier-portal
 * inline asset-create form sends up. Spans both `asset` (generic IT-asset
 * shape: name, hasMfa, encryption, RTO) and `asset_supplier_offering`
 * (per-customer service-type-conditional fields). The tRPC handler in
 * `managed-asset.ts` writes the matching columns to each table.
 *
 * companyId / customerRelationshipId / assetId / id are stripped — the
 * handler binds them from session / route params, the client never sets them.
 *
 * Derived from the two table schemas so renames or column drops are caught at
 * typecheck instead of silently breaking the form.
 */
export const assetServiceUpdateSchema = assetInsertSchema
  .partial()
  .pick({
    name: true,
    description: true,
    hasMfa: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    rto: true,
  })
  .merge(
    assetSupplierOfferingInsertSchema.partial().pick({
      serviceType: true,
      serviceDescription: true,
      dataProcessingLocations: true,
      saasHostingRegion: true,
      onPremSbomProvided: true,
      onPremSignedReleases: true,
      onPremVulnerabilityDisclosurePolicy: true,
      onPremPatchSlaCriticalHours: true,
      proServicesBackgroundCheckScope: true,
      proServicesNdaInPlace: true,
      proServicesCustomerPremisesPolicy: true,
      managedPrivilegedAccessMgmt: true,
      managedSessionRecording: true,
      managedOnCall24x7: true,
    }),
  );

// ============================================================================
// Risks
// ============================================================================

export const riskInsertSchema = createInsertSchema(risk, {
  ...isoDateColumns(risk),
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  likelihood: z.number().int().min(1).max(6),
  impact: z.number().int().min(1).max(6),
  riskScore: z.number().int().min(1).max(36),
  treatment: z.enum(["mitigate", "accept", "transfer", "avoid"]),
});
export const riskSelectSchema = createSelectSchema(risk);
export const riskUpdateSchema = riskInsertSchema.partial().omit(omitTenantMeta);

export const riskAssetInsertSchema = createInsertSchema(riskAsset);
export const riskSupplierInsertSchema = createInsertSchema(riskSupplier);

// ============================================================================
// Incidents
// ============================================================================

export const incidentInsertSchema = createInsertSchema(incident, {
  ...numericColumns(incident),
  title: z.string().min(1).max(500),
  description: z.string().min(1),
});
export const incidentSelectSchema = createSelectSchema(incident);
export const incidentUpdateSchema = incidentInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Suppliers — bilateral supplier↔customer table (post-C3)
//
// `supplier` now serves both entity-side inventory (legacy CIR §5.2 use) and
// supplier-portal share state. The "tenant" column for the entity-side inventory
// is `customerCompanyId` (renamed from `companyId`). Update schemas omit it
// to prevent mass-assignment of the row to a different customer.
// ============================================================================

export const supplierInsertSchema = createInsertSchema(supplier, {
  ...isoDateColumns(supplier),
  name: z.string().min(1).max(255),
  // Per-customer contract clauses
  subprocessorList: z.string().max(2000).nullish(),
  incidentSlaHours: z.number().int().positive().max(168).nullish(),
});
export const supplierSelectSchema = createSelectSchema(supplier);
export const supplierUpdateSchema = supplierInsertSchema
  .partial()
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    customerCompanyId: true,
  });

/**
 * Layer 2 — Per-customer contract clauses (supplier portal).
 *
 * Things that vary per customer because each contract negotiates its own
 * terms: right-to-audit, DPA, exit plan, location-change notification,
 * incident SLA, etc. Strict pick of supplierInsertSchema so the supplier
 * portal can never mass-assign supplierCompanyId / customerCompanyId or the
 * portal-share state (status, token, etc.).
 */
export const relationshipClausesUpdateSchema = supplierInsertSchema
  .partial()
  .pick({
    acceptRightToAudit: true,
    hasSubprocessors: true,
    subprocessorList: true,
    dataReturnOnTermination: true,
    dpaAvailable: true,
    notifyOnLocationChange: true,
    incidentAssistanceCommitment: true,
    notifyMaterialChanges: true,
    hasExitPlan: true,
    incidentSlaHours: true,
  });

// ============================================================================
// Training
// ============================================================================

export const trainingInsertSchema = createInsertSchema(trainingRecord, {
  ...isoDateColumns(trainingRecord),
  trainingType: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  participantName: z.string().min(1).max(255),
  durationMinutes: z.number().int().positive().nullish(),
});
export const trainingSelectSchema = createSelectSchema(trainingRecord);
export const trainingUpdateSchema = trainingInsertSchema.partial().omit(omitAudit);

// ============================================================================
// Notifications
// ============================================================================

export const notificationInsertSchema = createInsertSchema(notification, {
  entityType: z.string().min(1).max(100),
  subject: z.string().min(1).max(500),
  triggerField: z.string().min(1).max(100),
});
export const notificationSelectSchema = createSelectSchema(notification);

// ============================================================================
// Operations: Change Management
// ============================================================================

export const changeRequestInsertSchema = createInsertSchema(changeRequest, {
  title: z.string().min(1).max(500),
  description: z.string().min(1),
});
export const changeRequestSelectSchema = createSelectSchema(changeRequest);
export const changeRequestUpdateSchema = changeRequestInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Operations: Patch Management
// ============================================================================

export const patchRecordInsertSchema = createInsertSchema(patchRecord, {
  ...isoDateColumns(patchRecord),
  patchIdentifier: z.string().min(1).max(255),
  severity: z.string().min(1).max(50),
});
export const patchRecordSelectSchema = createSelectSchema(patchRecord);
export const patchRecordUpdateSchema = patchRecordInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Operations: Vulnerability Management
// ============================================================================

export const vulnerabilityInsertSchema = createInsertSchema(vulnerability, {
  ...isoDateColumns(vulnerability),
  ...numericColumns(vulnerability),
  title: z.string().min(1).max(500),
  severity: z.string().min(1).max(50),
});
export const vulnerabilitySelectSchema = createSelectSchema(vulnerability);
export const vulnerabilityUpdateSchema = vulnerabilityInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Operations: Audit
// ============================================================================

export const internalAuditInsertSchema = createInsertSchema(internalAudit, {
  ...isoDateColumns(internalAudit),
  title: z.string().min(1).max(500),
  auditArea: z.string().min(1).max(255),
});
export const internalAuditSelectSchema = createSelectSchema(internalAudit);
export const internalAuditUpdateSchema = internalAuditInsertSchema.partial().omit(omitTenantMeta);

export const auditFindingInsertSchema = createInsertSchema(auditFinding, {
  ...isoDateColumns(auditFinding),
  description: z.string().min(1),
  correctiveAction: z.string().min(1),
});
export const auditFindingSelectSchema = createSelectSchema(auditFinding);
// auditId is the parent FK — never patchable (would let a finding escape its tenant via the audit).
export const auditFindingUpdateSchema = auditFindingInsertSchema
  .partial()
  .omit({ ...omitMeta, auditId: true });

// ============================================================================
// Operations: Improvement
// ============================================================================

export const improvementItemInsertSchema = createInsertSchema(improvementItem, {
  ...isoDateColumns(improvementItem),
  title: z.string().min(1).max(500),
  description: z.string().min(1),
});
export const improvementItemSelectSchema = createSelectSchema(improvementItem);
export const improvementItemUpdateSchema = improvementItemInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Operations: KPI
// ============================================================================

export const kpiMeasurementInsertSchema = createInsertSchema(kpiMeasurement, {
  ...numericColumns(kpiMeasurement),
  kpiName: z.string().min(1).max(255),
});
export const kpiMeasurementSelectSchema = createSelectSchema(kpiMeasurement);

// ============================================================================
// Operations: Management Review
// ============================================================================

export const managementReviewInsertSchema = createInsertSchema(managementReview, {
  ...isoDateColumns(managementReview),
  title: z.string().min(1).max(500),
});
export const managementReviewSelectSchema = createSelectSchema(managementReview);
export const managementReviewUpdateSchema = managementReviewInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Operations: Risk Treatment
// ============================================================================

export const riskTreatmentInsertSchema = createInsertSchema(riskTreatment, {
  ...isoDateColumns(riskTreatment),
  action: z.string().min(1).max(500),
});
export const riskTreatmentSelectSchema = createSelectSchema(riskTreatment);
// riskId is the parent FK — never patchable.
export const riskTreatmentUpdateSchema = riskTreatmentInsertSchema
  .partial()
  .omit({ ...omitMeta, riskId: true });

// ============================================================================
// Operations: Exercise
// ============================================================================

export const exerciseInsertSchema = createInsertSchema(exercise, {
  ...isoDateColumns(exercise),
  title: z.string().min(1).max(500),
  domain: z.string().min(1).max(100),
});
export const exerciseSelectSchema = createSelectSchema(exercise);
export const exerciseUpdateSchema = exerciseInsertSchema.partial().omit(omitTenantMeta);

// ============================================================================
// Operations: Policy Acknowledgment
// ============================================================================

export const policyAcknowledgmentInsertSchema = createInsertSchema(policyAcknowledgment);
export const policyAcknowledgmentSelectSchema = createSelectSchema(policyAcknowledgment);

// ============================================================================
// BSIG Module
// ============================================================================

export const bsiRegistrationInsertSchema = createInsertSchema(bsiRegistration, {
  ...isoDateColumns(bsiRegistration),
});
export const bsiRegistrationSelectSchema = createSelectSchema(bsiRegistration);
export const bsiRegistrationUpdateSchema = bsiRegistrationInsertSchema.partial().omit(omitTenantMeta);

export const bsiIncidentReportInsertSchema = createInsertSchema(bsiIncidentReport);
export const bsiIncidentReportSelectSchema = createSelectSchema(bsiIncidentReport);
// incidentId is the parent FK — never patchable.
export const bsiIncidentReportUpdateSchema = bsiIncidentReportInsertSchema
  .partial()
  .omit({ ...omitMeta, incidentId: true });

// ============================================================================
// Supplier Portal — only company_certification and the small action schemas
// remain here after the C1/C2/C3 cleanup. Everything else moved into the
// entity-side equivalents (supplier, asset, incident).
// ============================================================================

// ----------------------------------------------------------------------------
// Small action schemas — shared by tRPC routers AND SchemaForm-driven UIs.
// One source of truth so the form labels, validation, and the server-side
// .input() validation can never drift apart.
// ----------------------------------------------------------------------------

const isoCountrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, "ISO 3166-1 alpha-2");

/** Supplier-only signup (creates a company with actsAsSupplier=true). */
export const supplierOnboardingBootstrapSchema = z.object({
  name: z.string().min(1).max(255),
  country: isoCountrySchema.optional(),
});

/** Direction-B accept-invite payload. The token comes from the URL, not the form. */
export const supplierAcceptInviteSchema = z.object({
  token: z.string().length(64),
  name: z.string().min(1).max(255),
  country: isoCountrySchema.optional(),
});

/** Supplier-side: invite a customer to view your security profile. */
export const supplierInviteCustomerSchema = z.object({
  customerEmail: z.string().email().max(255),
  customerOrgName: z.string().max(500).optional(),
  source: z
    .enum(["manual", "claim_token", "domain_match", "rsk22_import"])
    .default("manual"),
});

/** Entity-side: request a security profile from a supplier (magic-link invite). */
export const supplierInviteRequestSchema = z.object({
  toEmail: z.string().email().max(255),
  message: z.string().max(2000).optional(),
});

/** Company certification create input. storageKey + fileName come from S3 upload. */
export const companyCertificationCreateSchema = z.object({
  type: z.string().min(1).max(50),
  typeOther: z.string().max(255).optional(),
  scope: z.string().optional(),
  auditor: z.string().max(255).optional(),
  // z.iso.date() over a hand regex: same YYYY-MM-DD contract plus calendar
  // validity, and the `format` metadata makes SchemaForm render a date picker.
  // nullish: the date input emits null when cleared.
  validFrom: z.iso.date().nullish(),
  validUntil: z.iso.date(),
  storageKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(500).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  contentHash: z.string().length(64).optional(),
});
