/**
 * Relations -- All Drizzle ORM relation definitions in one place
 *
 * WHY one file? Drizzle allows exactly one relations() block per table.
 * Some relations (e.g., companyRelations) reference tables from many files.
 * Centralizing them here breaks the circular dependency that would occur
 * if table files imported each other for relation declarations.
 *
 * Table files -> pure definitions (no relations imports)
 * This file -> imports all tables, declares all relationships
 */
import { relations } from "drizzle-orm";

// --- Shared table imports (alphabetical by file) ---
import { policyAcknowledgment } from "@nisd2/isms-schema/tables/acknowledgment";
import { companyAssessment, companyRequirementStatus } from "@nisd2/isms-schema/tables/assessments";
import { asset } from "@nisd2/grc-data-model/schema";
import { categoryAssignment } from "@nisd2/isms-schema/tables/category-assignment";
import { requirementAssignment } from "@nisd2/isms-schema/tables/requirement-assignment";
import { companyCategoryIntake } from "@nisd2/isms-schema/tables/category-intake";
import { companyInvite } from "./tables/company-invite";
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
import { incidentBroadcast } from "@nisd2/isms-schema/tables/incident-broadcast";
import { assetSupplierOffering } from "@nisd2/grc-data-model/schema";
import { patchRecord } from "@nisd2/isms-schema/tables/patch-management";
import { vulnerability } from "@nisd2/isms-schema/tables/vulnerability";
import { policy } from "@nisd2/isms-schema/tables/policies";
import { requirement, requirementPrerequisite } from "@nisd2/grc-data-model/schema";
import { managementReview } from "@nisd2/isms-schema/tables/review";
import { risk, riskAsset, riskSupplier } from "@nisd2/grc-data-model/schema";
import { companyRiskMethodology } from "@nisd2/isms-schema/tables/risk-methodology";
import { companyPolicyConfig } from "@nisd2/isms-schema/tables/policy-config";
import { riskTreatment } from "@nisd2/isms-schema/tables/risk-treatment";
import { signOffHistory } from "@nisd2/isms-schema/tables/sign-off-history";
import { supplier } from "@nisd2/grc-data-model/schema";
import { trainingRecord } from "@nisd2/isms-schema/tables/training";
import { companyCertification } from "./tables/supplier-portal";
import { trainingLessonProgress } from "@nisd2/isms-schema/tables/training-progress";
import { gapAssessment } from "@nisd2/isms-schema/tables/gap-assessment";

// --- Module imports ---
import { bsiRegistration, bsiIncidentReport } from "./modules/bsig";

// ============================================================================
// Organization
// ============================================================================

export const companyRelations = relations(company, ({ one, many }) => ({
  users: many(user),
  assessments: many(companyAssessment),
  policies: many(policy),
  assets: many(asset),
  risks: many(risk),
  incidents: many(incident),
  suppliers: many(supplier),
  trainingRecords: many(trainingRecord),
  changeRequests: many(changeRequest),
  internalAudits: many(internalAudit),
  improvementItems: many(improvementItem),
  kpiMeasurements: many(kpiMeasurement),
  managementReviews: many(managementReview),
  vulnerabilities: many(vulnerability),
  exercises: many(exercise),
  notifications: many(notification),
  invites: many(companyInvite),
  riskMethodology: many(companyRiskMethodology),
  policyConfigs: many(companyPolicyConfig),
  // Module extensions
  bsiRegistrations: many(bsiRegistration),
  // Supplier portal
  certifications: many(companyCertification),
  // Bilateral supplier relationships (after C3 merge — `supplier` IS the
  // relationship table now, both sides scope by their own companyId).
  suppliersAsSupplier: many(supplier, {
    relationName: "supplierRelationshipSupplier",
  }),
  suppliersAsCustomer: many(supplier, {
    relationName: "supplierRelationshipCustomer",
  }),
}));

export const userRelations = relations(user, ({ one }) => ({
  company: one(company, {
    fields: [user.companyId],
    references: [company.id],
  }),
}));

// ============================================================================
// Compliance Frameworks
// ============================================================================

export const complianceFrameworkRelations = relations(
  complianceFramework,
  ({ many }) => ({
    categories: many(requirementCategory),
    assessments: many(companyAssessment),
  })
);

export const requirementCategoryRelations = relations(
  requirementCategory,
  ({ one, many }) => ({
    framework: one(complianceFramework, {
      fields: [requirementCategory.frameworkId],
      references: [complianceFramework.id],
    }),
    requirements: many(requirement),
    intakes: many(companyCategoryIntake),
  })
);

// ============================================================================
// Requirements
// ============================================================================

export const requirementRelations = relations(
  requirement,
  ({ one, many }) => ({
    category: one(requirementCategory, {
      fields: [requirement.categoryId],
      references: [requirementCategory.id],
    }),
    parent: one(requirement, {
      fields: [requirement.parentId],
      references: [requirement.id],
      relationName: "requirementHierarchy",
    }),
    children: many(requirement, { relationName: "requirementHierarchy" }),
    statuses: many(companyRequirementStatus),
    policies: many(policy),
prerequisiteOf: many(requirementPrerequisite, {
      relationName: "requirementDependents",
    }),
    prerequisites: many(requirementPrerequisite, {
      relationName: "requirementPrereqs",
    }),
  })
);

export const requirementPrerequisiteRelations = relations(
  requirementPrerequisite,
  ({ one }) => ({
    requirement: one(requirement, {
      fields: [requirementPrerequisite.requirementId],
      references: [requirement.id],
      relationName: "requirementDependents",
    }),
    prerequisite: one(requirement, {
      fields: [requirementPrerequisite.prerequisiteId],
      references: [requirement.id],
      relationName: "requirementPrereqs",
    }),
  })
);

// ============================================================================
// Assessments
// ============================================================================

export const companyAssessmentRelations = relations(
  companyAssessment,
  ({ one, many }) => ({
    company: one(company, {
      fields: [companyAssessment.companyId],
      references: [company.id],
    }),
    framework: one(complianceFramework, {
      fields: [companyAssessment.frameworkId],
      references: [complianceFramework.id],
    }),
    requirementStatuses: many(companyRequirementStatus),
    categoryAssignments: many(categoryAssignment),
    categoryIntakes: many(companyCategoryIntake),
  })
);

export const companyRequirementStatusRelations = relations(
  companyRequirementStatus,
  ({ one, many }) => ({
    assessment: one(companyAssessment, {
      fields: [companyRequirementStatus.assessmentId],
      references: [companyAssessment.id],
    }),
    requirement: one(requirement, {
      fields: [companyRequirementStatus.requirementId],
      references: [requirement.id],
    }),
    assignee: one(user, {
      fields: [companyRequirementStatus.assignedTo],
      references: [user.id],
      relationName: "requirementAssignee",
    }),
    reviewer: one(user, {
      fields: [companyRequirementStatus.reviewedBy],
      references: [user.id],
      relationName: "requirementReviewer",
    }),
    evidence: many(evidence),
    assignments: many(requirementAssignment),
    signOffHistory: many(signOffHistory),
  })
);

// ============================================================================
// Sign-Off History
// ============================================================================

export const signOffHistoryRelations = relations(
  signOffHistory,
  ({ one }) => ({
    company: one(company, {
      fields: [signOffHistory.companyId],
      references: [company.id],
    }),
    status: one(companyRequirementStatus, {
      fields: [signOffHistory.statusId],
      references: [companyRequirementStatus.id],
    }),
    requirement: one(requirement, {
      fields: [signOffHistory.requirementId],
      references: [requirement.id],
    }),
    signer: one(user, {
      fields: [signOffHistory.signedOffBy],
      references: [user.id],
      relationName: "signOffHistorySigner",
    }),
  })
);

// ============================================================================
// Requirement Assignment
// ============================================================================

export const requirementAssignmentRelations = relations(
  requirementAssignment,
  ({ one }) => ({
    status: one(companyRequirementStatus, {
      fields: [requirementAssignment.statusId],
      references: [companyRequirementStatus.id],
    }),
    user: one(user, {
      fields: [requirementAssignment.userId],
      references: [user.id],
      relationName: "requirementAssigned",
    }),
    assignedByUser: one(user, {
      fields: [requirementAssignment.assignedBy],
      references: [user.id],
      relationName: "requirementAssigner",
    }),
  })
);

// ============================================================================
// Category Assignment
// ============================================================================

export const categoryAssignmentRelations = relations(
  categoryAssignment,
  ({ one }) => ({
    assessment: one(companyAssessment, {
      fields: [categoryAssignment.assessmentId],
      references: [companyAssessment.id],
    }),
    category: one(requirementCategory, {
      fields: [categoryAssignment.categoryId],
      references: [requirementCategory.id],
    }),
    user: one(user, {
      fields: [categoryAssignment.userId],
      references: [user.id],
      relationName: "assignedUser",
    }),
    assignedByUser: one(user, {
      fields: [categoryAssignment.assignedBy],
      references: [user.id],
      relationName: "assigner",
    }),
  })
);

// ============================================================================
// Category Intake
// ============================================================================

export const companyCategoryIntakeRelations = relations(
  companyCategoryIntake,
  ({ one }) => ({
    assessment: one(companyAssessment, {
      fields: [companyCategoryIntake.assessmentId],
      references: [companyAssessment.id],
    }),
    category: one(requirementCategory, {
      fields: [companyCategoryIntake.categoryId],
      references: [requirementCategory.id],
    }),
    lastSavedByUser: one(user, {
      fields: [companyCategoryIntake.lastSavedBy],
      references: [user.id],
      relationName: "intakeLastSaver",
    }),
    signedOffByUser: one(user, {
      fields: [companyCategoryIntake.signedOffBy],
      references: [user.id],
      relationName: "intakeSignOff",
    }),
  }),
);

// ============================================================================
// Company Invites
// ============================================================================

export const companyInviteRelations = relations(
  companyInvite,
  ({ one }) => ({
    company: one(company, {
      fields: [companyInvite.companyId],
      references: [company.id],
    }),
    invitedByUser: one(user, {
      fields: [companyInvite.invitedBy],
      references: [user.id],
      relationName: "inviter",
    }),
    acceptedByUser: one(user, {
      fields: [companyInvite.acceptedBy],
      references: [user.id],
      relationName: "inviteAcceptor",
    }),
  })
);

// ============================================================================
// Evidence
// ============================================================================

export const evidenceRelations = relations(evidence, ({ one }) => ({
  requirementStatus: one(companyRequirementStatus, {
    fields: [evidence.requirementStatusId],
    references: [companyRequirementStatus.id],
  }),
  reviewer: one(user, {
    fields: [evidence.reviewedBy],
    references: [user.id],
    relationName: "evidenceReviewer",
  }),
  previousVersion: one(evidence, {
    fields: [evidence.previousVersionId],
    references: [evidence.id],
    relationName: "evidenceVersionChain",
  }),
}));

// ============================================================================
// Policies
// ============================================================================

export const policyRelations = relations(policy, ({ one, many }) => ({
  company: one(company, {
    fields: [policy.companyId],
    references: [company.id],
  }),
  requirement: one(requirement, {
    fields: [policy.requirementId],
    references: [requirement.id],
  }),
  acknowledgments: many(policyAcknowledgment),
}));

// ============================================================================
// Audit Log
// ============================================================================

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  company: one(company, {
    fields: [auditLog.companyId],
    references: [company.id],
  }),
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// Assets & Risks
// ============================================================================

export const assetRelations = relations(asset, ({ one, many }) => ({
  company: one(company, {
    fields: [asset.companyId],
    references: [company.id],
  }),
  riskAssets: many(riskAsset),
  changeRequests: many(changeRequest),
  patchRecords: many(patchRecord),
  vulnerabilities: many(vulnerability),
  supplierOffering: one(assetSupplierOffering, {
    fields: [asset.id],
    references: [assetSupplierOffering.assetId],
  }),
}));

export const riskRelations = relations(risk, ({ one, many }) => ({
  company: one(company, {
    fields: [risk.companyId],
    references: [company.id],
  }),
  riskAssets: many(riskAsset),
  riskSuppliers: many(riskSupplier),
  treatments: many(riskTreatment),
}));

export const riskAssetRelations = relations(riskAsset, ({ one }) => ({
  risk: one(risk, {
    fields: [riskAsset.riskId],
    references: [risk.id],
  }),
  asset: one(asset, {
    fields: [riskAsset.assetId],
    references: [asset.id],
  }),
}));

export const riskSupplierRelations = relations(riskSupplier, ({ one }) => ({
  risk: one(risk, {
    fields: [riskSupplier.riskId],
    references: [risk.id],
  }),
  supplier: one(supplier, {
    fields: [riskSupplier.supplierId],
    references: [supplier.id],
  }),
}));

export const companyRiskMethodologyRelations = relations(
  companyRiskMethodology,
  ({ one }) => ({
    company: one(company, {
      fields: [companyRiskMethodology.companyId],
      references: [company.id],
    }),
  })
);

export const companyPolicyConfigRelations = relations(
  companyPolicyConfig,
  ({ one }) => ({
    company: one(company, {
      fields: [companyPolicyConfig.companyId],
      references: [company.id],
    }),
  })
);

// ============================================================================
// Incidents
// ============================================================================

export const incidentRelations = relations(incident, ({ one, many }) => ({
  company: one(company, {
    fields: [incident.companyId],
    references: [company.id],
  }),
  // Module extensions
  bsiReports: many(bsiIncidentReport),
  broadcasts: many(incidentBroadcast),
}));

export const incidentBroadcastRelations = relations(incidentBroadcast, ({ one }) => ({
  incident: one(incident, {
    fields: [incidentBroadcast.incidentId],
    references: [incident.id],
  }),
  customerRelationship: one(supplier, {
    fields: [incidentBroadcast.customerRelationshipId],
    references: [supplier.id],
  }),
}));

export const assetSupplierOfferingRelations = relations(assetSupplierOffering, ({ one }) => ({
  asset: one(asset, {
    fields: [assetSupplierOffering.assetId],
    references: [asset.id],
  }),
  customerRelationship: one(supplier, {
    fields: [assetSupplierOffering.customerRelationshipId],
    references: [supplier.id],
  }),
}));

// ============================================================================
// Suppliers
// ============================================================================

export const supplierRelations = relations(supplier, ({ one, many }) => ({
  // The customer-side company (legacy: was just `companyId`).
  customerCompany: one(company, {
    fields: [supplier.customerCompanyId],
    references: [company.id],
    relationName: "supplierRelationshipCustomer",
  }),
  // The supplier-side company. Nullable for entity-side free-text rows.
  supplierCompany: one(company, {
    fields: [supplier.supplierCompanyId],
    references: [company.id],
    relationName: "supplierRelationshipSupplier",
  }),
  riskSuppliers: many(riskSupplier),
}));

// ============================================================================
// Training
// ============================================================================

export const trainingRecordRelations = relations(
  trainingRecord,
  ({ one }) => ({
    company: one(company, {
      fields: [trainingRecord.companyId],
      references: [company.id],
    }),
  })
);

// ============================================================================
// Operations
// ============================================================================

export const changeRequestRelations = relations(changeRequest, ({ one }) => ({
  company: one(company, {
    fields: [changeRequest.companyId],
    references: [company.id],
  }),
  asset: one(asset, {
    fields: [changeRequest.assetId],
    references: [asset.id],
  }),
  requestedByUser: one(user, {
    fields: [changeRequest.requestedBy],
    references: [user.id],
    relationName: "changeRequester",
  }),
  approvedByUser: one(user, {
    fields: [changeRequest.approvedBy],
    references: [user.id],
    relationName: "changeApprover",
  }),
  implementedByUser: one(user, {
    fields: [changeRequest.implementedBy],
    references: [user.id],
    relationName: "changeImplementer",
  }),
}));

export const patchRecordRelations = relations(patchRecord, ({ one }) => ({
  company: one(company, {
    fields: [patchRecord.companyId],
    references: [company.id],
  }),
  asset: one(asset, {
    fields: [patchRecord.assetId],
    references: [asset.id],
  }),
  exceptionApprover: one(user, {
    fields: [patchRecord.exceptionApprovedBy],
    references: [user.id],
    relationName: "patchExceptionApprover",
  }),
}));

export const vulnerabilityRelations = relations(vulnerability, ({ one }) => ({
  company: one(company, {
    fields: [vulnerability.companyId],
    references: [company.id],
  }),
  asset: one(asset, {
    fields: [vulnerability.assetId],
    references: [asset.id],
  }),
}));

export const internalAuditRelations = relations(
  internalAudit,
  ({ one, many }) => ({
    company: one(company, {
      fields: [internalAudit.companyId],
      references: [company.id],
    }),
    findings: many(auditFinding),
  })
);

export const auditFindingRelations = relations(auditFinding, ({ one }) => ({
  audit: one(internalAudit, {
    fields: [auditFinding.auditId],
    references: [internalAudit.id],
  }),
  assignedToUser: one(user, {
    fields: [auditFinding.assignedTo],
    references: [user.id],
    relationName: "findingAssignee",
  }),
  verifiedByUser: one(user, {
    fields: [auditFinding.verifiedBy],
    references: [user.id],
    relationName: "findingVerifier",
  }),
}));

export const improvementItemRelations = relations(
  improvementItem,
  ({ one }) => ({
    company: one(company, {
      fields: [improvementItem.companyId],
      references: [company.id],
    }),
    assignedToUser: one(user, {
      fields: [improvementItem.assignedTo],
      references: [user.id],
      relationName: "improvementAssignee",
    }),
  })
);

export const kpiMeasurementRelations = relations(
  kpiMeasurement,
  ({ one }) => ({
    company: one(company, {
      fields: [kpiMeasurement.companyId],
      references: [company.id],
    }),
  })
);

export const managementReviewRelations = relations(
  managementReview,
  ({ one }) => ({
    company: one(company, {
      fields: [managementReview.companyId],
      references: [company.id],
    }),
  })
);

export const riskTreatmentRelations = relations(
  riskTreatment,
  ({ one }) => ({
    risk: one(risk, {
      fields: [riskTreatment.riskId],
      references: [risk.id],
    }),
    responsibleUser: one(user, {
      fields: [riskTreatment.responsibleUserId],
      references: [user.id],
      relationName: "treatmentResponsible",
    }),
    verifiedByUser: one(user, {
      fields: [riskTreatment.verifiedBy],
      references: [user.id],
      relationName: "treatmentVerifier",
    }),
  })
);

export const exerciseRelations = relations(exercise, ({ one }) => ({
  company: one(company, {
    fields: [exercise.companyId],
    references: [company.id],
  }),
}));

export const policyAcknowledgmentRelations = relations(
  policyAcknowledgment,
  ({ one }) => ({
    policy: one(policy, {
      fields: [policyAcknowledgment.policyId],
      references: [policy.id],
    }),
    user: one(user, {
      fields: [policyAcknowledgment.userId],
      references: [user.id],
      relationName: "policyAcknowledger",
    }),
  })
);

// ============================================================================
// Notifications
// ============================================================================

export const notificationRelations = relations(notification, ({ one }) => ({
  company: one(company, {
    fields: [notification.companyId],
    references: [company.id],
  }),
  recipient: one(user, {
    fields: [notification.recipientId],
    references: [user.id],
    relationName: "notificationRecipient",
  }),
}));

// ============================================================================
// Supplier Portal — only the company_certification table lives here after the
// C1/C2/C3 cleanup. The bilateral supplier relationships moved into `supplier`.
// ============================================================================

export const companyCertificationRelations = relations(
  companyCertification,
  ({ one }) => ({
    company: one(company, {
      fields: [companyCertification.companyId],
      references: [company.id],
    }),
  }),
);

// ============================================================================
// BSIG Module
// ============================================================================

export const bsiRegistrationRelations = relations(
  bsiRegistration,
  ({ one }) => ({
    company: one(company, {
      fields: [bsiRegistration.companyId],
      references: [company.id],
    }),
  })
);

export const bsiIncidentReportRelations = relations(
  bsiIncidentReport,
  ({ one }) => ({
    incident: one(incident, {
      fields: [bsiIncidentReport.incidentId],
      references: [incident.id],
    }),
  })
);

// ============================================================================
// Training Portal
// ============================================================================

export const trainingLessonProgressRelations = relations(
  trainingLessonProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [trainingLessonProgress.userId],
      references: [user.id],
    }),
    company: one(company, {
      fields: [trainingLessonProgress.companyId],
      references: [company.id],
    }),
  }),
);

// ============================================================================
// Gap Assessment
// ============================================================================

export const gapAssessmentRelations = relations(
  gapAssessment,
  ({ one }) => ({
    user: one(user, {
      fields: [gapAssessment.userId],
      references: [user.id],
    }),
    company: one(company, {
      fields: [gapAssessment.companyId],
      references: [company.id],
    }),
  }),
);

