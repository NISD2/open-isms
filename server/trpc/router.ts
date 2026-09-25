import { router } from "./init";
import { advisoryRouter } from "./routers/advisory";
import { applicabilityRouter } from "./routers/applicability";
import { assessmentRouter } from "./routers/assessment";
import { assetRouter } from "./routers/asset";
import { assignmentRouter } from "./routers/assignment";
import { auditRouter } from "./routers/audit";
import { changeRouter } from "./routers/change";
import { companyRouter } from "./routers/company";
import { dashboardRouter } from "./routers/dashboard";
import { devRouter } from "./routers/dev";
import { evidenceRouter } from "./routers/evidence";
import { exerciseRouter } from "./routers/exercise";
import { gapAssessmentRouter } from "./routers/gap-assessment";
import { improvementRouter } from "./routers/improvement";
import { incidentRouter } from "./routers/incident";
import { intakeRouter } from "./routers/intake";
import { internalAuditRouter } from "./routers/internal-audit";
import { journeyRouter } from "./routers/journey";
import { kpiRouter } from "./routers/kpi";
import { llmRouter } from "./routers/llm";
import { managementReviewRouter } from "./routers/management-review";
import { newsletterPublicRouter, newsletterRouter } from "./routers/newsletter";
import { notificationRouter } from "./routers/notification";
import { patchRouter } from "./routers/patch";
import { platformAdminRouter } from "./routers/platform-admin";
import { policyRouter } from "./routers/policy";
import { policyConfigRouter } from "./routers/policy-config";
import { requirementRouter } from "./routers/requirement";
import { reviewRouter } from "./routers/review";
import { riskRouter } from "./routers/risk";
import { supplierRouter } from "./routers/supplier";
import { supplierInviteRouter } from "./routers/supplier-invite";
import { supplierPortalRouter } from "./routers/supplier-portal";
import { teamRouter } from "./routers/team";
import { trainingRouter } from "./routers/training";
import { trainingCertificateRouter } from "./routers/training-certificate";
import { trainingPortalRouter } from "./routers/training-portal";
import { userRouter } from "./routers/user";
import { vulnerabilityRouter } from "./routers/vulnerability";

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
  company: companyRouter,
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
  advisory: advisoryRouter,
  supplierPortal: supplierPortalRouter,
  supplierInvite: supplierInviteRouter,
  trainingPortal: trainingPortalRouter,
  trainingCertificate: trainingCertificateRouter,
  platformAdmin: platformAdminRouter,
  gapAssessment: gapAssessmentRouter,
  journey: journeyRouter,
  newsletter: newsletterRouter,
  newsletterPublic: newsletterPublicRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
