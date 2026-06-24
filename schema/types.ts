/**
 * Types -- Inferred TypeScript types from Drizzle table definitions
 *
 * Usage:
 *   import type { Company, NewCompany, Requirement } from "@/schema/types";
 *
 * Select types = what you get FROM the database (all fields populated)
 * Insert types = what you send TO the database (defaults omitted)
 */

// --- Shared table imports (alphabetical by file) ---
import { policyAcknowledgment } from "@nisd2/isms-schema/tables/acknowledgment";
import { companyAssessment, companyRequirementStatus } from "@nisd2/isms-schema/tables/assessments";
import { asset } from "@nisd2/grc-data-model/schema";
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
import { policy } from "@nisd2/isms-schema/tables/policies";
import { requirement, requirementPrerequisite } from "@nisd2/grc-data-model/schema";
import { managementReview } from "@nisd2/isms-schema/tables/review";
import { risk, riskAsset, riskSupplier } from "@nisd2/grc-data-model/schema";
import { riskTreatment } from "@nisd2/isms-schema/tables/risk-treatment";
import { supplier } from "@nisd2/grc-data-model/schema";
import { trainingRecord } from "@nisd2/isms-schema/tables/training";

import { newsletterIssue } from "./tables/newsletter-issue";
import { newsletterGroup, newsletterGroupMember } from "./tables/newsletter-group";

// --- Module imports ---
import { bsiRegistration, bsiIncidentReport } from "./modules/bsig";

// ============================================================================
// Organization
// ============================================================================

export type Company = typeof company.$inferSelect;
export type NewCompany = typeof company.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// ============================================================================
// Compliance Frameworks
// ============================================================================

export type ComplianceFramework = typeof complianceFramework.$inferSelect;
export type NewComplianceFramework = typeof complianceFramework.$inferInsert;
export type RequirementCategory = typeof requirementCategory.$inferSelect;
export type NewRequirementCategory = typeof requirementCategory.$inferInsert;

// ============================================================================
// Requirements
// ============================================================================

export type Requirement = typeof requirement.$inferSelect;
export type NewRequirement = typeof requirement.$inferInsert;
export type RequirementPrerequisite = typeof requirementPrerequisite.$inferSelect;
export type NewRequirementPrerequisite = typeof requirementPrerequisite.$inferInsert;

// ============================================================================
// Assessments
// ============================================================================

export type CompanyAssessment = typeof companyAssessment.$inferSelect;
export type NewCompanyAssessment = typeof companyAssessment.$inferInsert;
export type CompanyRequirementStatus = typeof companyRequirementStatus.$inferSelect;
export type NewCompanyRequirementStatus = typeof companyRequirementStatus.$inferInsert;

// ============================================================================
// Evidence
// ============================================================================

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;

// ============================================================================
// Policies
// ============================================================================

export type Policy = typeof policy.$inferSelect;
export type NewPolicy = typeof policy.$inferInsert;

// ============================================================================
// Audit Log
// ============================================================================

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

// ============================================================================
// Assets
// ============================================================================

export type Asset = typeof asset.$inferSelect;
export type NewAsset = typeof asset.$inferInsert;

// ============================================================================
// Risks
// ============================================================================

export type Risk = typeof risk.$inferSelect;
export type NewRisk = typeof risk.$inferInsert;
export type RiskAsset = typeof riskAsset.$inferSelect;
export type NewRiskAsset = typeof riskAsset.$inferInsert;
export type RiskSupplier = typeof riskSupplier.$inferSelect;
export type NewRiskSupplier = typeof riskSupplier.$inferInsert;

// ============================================================================
// Incidents
// ============================================================================

export type Incident = typeof incident.$inferSelect;
export type NewIncident = typeof incident.$inferInsert;

// ============================================================================
// Suppliers
// ============================================================================

export type Supplier = typeof supplier.$inferSelect;
export type NewSupplier = typeof supplier.$inferInsert;

// ============================================================================
// Training
// ============================================================================

export type TrainingRecord = typeof trainingRecord.$inferSelect;
export type NewTrainingRecord = typeof trainingRecord.$inferInsert;

// ============================================================================
// Notifications
// ============================================================================

export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;

// ============================================================================
// Operations: Change Management
// ============================================================================

export type ChangeRequest = typeof changeRequest.$inferSelect;
export type NewChangeRequest = typeof changeRequest.$inferInsert;

// ============================================================================
// Operations: Patch Management
// ============================================================================

export type PatchRecord = typeof patchRecord.$inferSelect;
export type NewPatchRecord = typeof patchRecord.$inferInsert;

// ============================================================================
// Operations: Audit
// ============================================================================

export type InternalAudit = typeof internalAudit.$inferSelect;
export type NewInternalAudit = typeof internalAudit.$inferInsert;
export type AuditFinding = typeof auditFinding.$inferSelect;
export type NewAuditFinding = typeof auditFinding.$inferInsert;

// ============================================================================
// Operations: Improvement
// ============================================================================

export type ImprovementItem = typeof improvementItem.$inferSelect;
export type NewImprovementItem = typeof improvementItem.$inferInsert;

// ============================================================================
// Operations: KPI
// ============================================================================

export type KpiMeasurement = typeof kpiMeasurement.$inferSelect;
export type NewKpiMeasurement = typeof kpiMeasurement.$inferInsert;

// ============================================================================
// Operations: Management Review
// ============================================================================

export type ManagementReview = typeof managementReview.$inferSelect;
export type NewManagementReview = typeof managementReview.$inferInsert;

// ============================================================================
// Operations: Risk Treatment
// ============================================================================

export type RiskTreatment = typeof riskTreatment.$inferSelect;
export type NewRiskTreatment = typeof riskTreatment.$inferInsert;

// ============================================================================
// Operations: Exercise
// ============================================================================

export type Exercise = typeof exercise.$inferSelect;
export type NewExercise = typeof exercise.$inferInsert;

// ============================================================================
// Operations: Policy Acknowledgment
// ============================================================================

export type PolicyAcknowledgment = typeof policyAcknowledgment.$inferSelect;
export type NewPolicyAcknowledgment = typeof policyAcknowledgment.$inferInsert;

// ============================================================================
// Newsletter
// ============================================================================

export type NewsletterIssue = typeof newsletterIssue.$inferSelect;
export type NewNewsletterIssue = typeof newsletterIssue.$inferInsert;
export type NewsletterGroup = typeof newsletterGroup.$inferSelect;
export type NewNewsletterGroup = typeof newsletterGroup.$inferInsert;
export type NewsletterGroupMember = typeof newsletterGroupMember.$inferSelect;
export type NewNewsletterGroupMember = typeof newsletterGroupMember.$inferInsert;

// ============================================================================
// BSIG Module
// ============================================================================

export type BsiRegistration = typeof bsiRegistration.$inferSelect;
export type NewBsiRegistration = typeof bsiRegistration.$inferInsert;
export type BsiIncidentReport = typeof bsiIncidentReport.$inferSelect;
export type NewBsiIncidentReport = typeof bsiIncidentReport.$inferInsert;
