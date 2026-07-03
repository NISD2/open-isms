import { router } from "./init";
import { requirementRouter } from "./routers/requirement";
import { assessmentRouter } from "./routers/assessment";
import { llmRouter } from "./routers/llm";
import { evidenceRouter } from "./routers/evidence";
import { auditRouter } from "./routers/audit";
import { assignmentRouter } from "./routers/assignment";
import { teamRouter } from "./routers/team";
import { reviewRouter } from "./routers/review";
import { devRouter } from "./routers/dev";
import { assetRouter } from "./routers/asset";
import { riskRouter } from "./routers/risk";
import { incidentRouter } from "./routers/incident";
import { supplierRouter } from "./routers/supplier";
import { policyRouter } from "./routers/policy";
import { trainingRouter } from "./routers/training";
import { exerciseRouter } from "./routers/exercise";
import { managementReviewRouter } from "./routers/management-review";
import { kpiRouter } from "./routers/kpi";
import { changeRouter } from "./routers/change";
import { patchRouter } from "./routers/patch";
import { vulnerabilityRouter } from "./routers/vulnerability";
import { internalAuditRouter } from "./routers/internal-audit";
import { improvementRouter } from "./routers/improvement";
import { notificationRouter } from "./routers/notification";
import { dashboardRouter } from "./routers/dashboard";
import { intakeRouter } from "./routers/intake";
import { policyConfigRouter } from "./routers/policy-config";
import { applicabilityRouter } from "./routers/applicability";
import { supplierPortalRouter } from "./routers/supplier-portal";
import { supplierInviteRouter } from "./routers/supplier-invite";
import { trainingPortalRouter } from "./routers/training-portal";
import { trainingCertificateRouter } from "./routers/training-certificate";
import { platformAdminRouter } from "./routers/platform-admin";
import { gapAssessmentRouter } from "./routers/gap-assessment";
import { journeyRouter } from "./routers/journey";
import { newsletterRouter, newsletterPublicRouter } from "./routers/newsletter";
import { dataRequestRouter } from "./routers/data-request";

// Build-time gated: dev router is excluded from production bundles
const isDev = process.env.NODE_ENV === "development";

export const appRouter = router({
  requirement: requirementRouter,
  assessment: assessmentRouter,
  llm: llmRouter,
  evidence: evidenceRouter,
  audit: auditRouter,
  assignment: assignmentRouter,
  team: teamRouter,
  review: reviewRouter,
  ...(isDev ? { dev: devRouter } : {}),
  asset: assetRouter,
  risk: riskRouter,
  incident: incidentRouter,
  supplier: supplierRouter,
  policy: policyRouter,
  training: trainingRouter,
  exercise: exerciseRouter,
  managementReview: managementReviewRouter,
  kpi: kpiRouter,
  change: changeRouter,
  patch: patchRouter,
  vulnerability: vulnerabilityRouter,
  internalAudit: internalAuditRouter,
  improvement: improvementRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
  intake: intakeRouter,
  policyConfig: policyConfigRouter,
  applicability: applicabilityRouter,
  supplierPortal: supplierPortalRouter,
  supplierInvite: supplierInviteRouter,
  trainingPortal: trainingPortalRouter,
  trainingCertificate: trainingCertificateRouter,
  platformAdmin: platformAdminRouter,
  gapAssessment: gapAssessmentRouter,
  journey: journeyRouter,
  newsletter: newsletterRouter,
  newsletterPublic: newsletterPublicRouter,
  dataRequest: dataRequestRouter,
});

export type AppRouter = typeof appRouter;
