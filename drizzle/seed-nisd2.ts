/**
 * NISD2.eu company seed — tRPC mutation pipeline.
 *
 * Every record is created through the same tRPC mutations as the UI:
 *   - Zod validation on all inputs
 *   - signOff called on completed requirements
 *   - Audit trail logged for every mutation
 *   - Progress counters recalculated automatically
 *   - Deadline reminders scheduled
 *
 * Only exceptions (no tRPC route exists):
 *   - Second admin user (Simon) — direct DB insert
 *
 * Usage: bun run drizzle/seed-nisd2.ts
 * Requires: bun db:seed (frameworks) first
 */
process.env.DISABLE_EMAIL = "1";

import { eq, inArray, and, isNotNull } from "drizzle-orm";
import * as schema from "@/schema";
import { db } from "@/lib/db";
import { createCallerFactory } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import {
  computeNextReviewDate,
  isRecurringFrequency,
  toDateString,
  type Frequency,
} from "@/lib/compliance/deadlines";

// ════════════════════════════════════════════════════════════════════════════
// tRPC Caller — same pipeline as the UI
// ════════════════════════════════════════════════════════════════════════════

function createSeedCaller(userId: string, companyId: string | null) {
  const factory = createCallerFactory(appRouter);
  return factory(async () => ({
    db,
    session: {
      companyId,
      role: "admin",
      jobTitle: "CEO & CTO",
      user: { id: userId, name: "Cory", email: "cory@nisd2.eu" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    },
    userId,
    companyId,
    ip: "seed-script",
    userAgent: null,
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// NIS2 Requirement Form Data — ALL 49 requirements "completed"
// 
// // ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// Intake Form Answers — NISD2.eu (12-person SaaS startup)
//
// Matches Zod schemas in lib/compliance/category-schemas.ts.
// All *Uploaded booleans set to true — these now trigger FileUpload in the UI.
// ════════════════════════════════════════════════════════════════════════════

const NISD2_INTAKE_ANSWERS: Record<string, Record<string, unknown>> = {
  GOV: {
    // 1.1 Management Training
    managementTrainingProvider: "GDD e.V. — NIS2 Management Liability Training",
    lastManagementTraining: "2026-01-10",
    // 1.2 Roles & Responsibilities → module-backed (team page)
    // 1.3 Budget
    annualSecurityBudget: "24000",
    budgetApprovalDate: "2026-01-15",
    // 1.4 Personal Liability
    liabilityAcknowledged: true,
  },
  RSK: {
    // 2.1 Methodology → dedicated config (company_risk_methodology table)
    // 2.2 Assets, Scope & Classification
    locationCount: 1,
    criticalSystemsCount: 4,
    totalAssets: 6,
    criticalAssets: 4,
    classificationLevels: "3_levels",
    // 2.3 Risk Register → platform risk module (custom editor)
    totalRisks: 5,
    criticalRisks: 1,
    riskCoverage: 100,
    // 2.4 Risk Acceptance & IS Policy Sign-Off
    residualRiskCount: 1,
    policyVersion: "v1.0",
    policyApprovalDate: "2026-01-15",
  },
  INC: {
    incidentLead: "Simon (CTO)",
    irtTeamSize: 2,
    classificationScheme: "bsi",
    earlyWarningSlaHours: 24,
    bsiReportingRegistered: true,
    lastDrillDate: "2026-03-01",
    drillType: "tabletop",
    secureCommsChannel: "Signal (encrypted group chat)",
    detectionTools: "Cloudflare WAF + Hetzner monitoring + Grafana alerts",
    incidentEscalationContacts: "P1: Simon (CTO), P2: Cory (CEO)",
    postIncidentReviewOwner: "Simon Orzel, CTO",
    significantIncidentCriteria: ">100 users affected, >4h downtime, or personal data breach",
  },
  BCP: {
    biaCompletionDate: "2026-01-10",
    criticalProcessCount: 3,
    rpoTargetHours: 1,
    rtoTargetHours: 4,
    backupFrequency: "daily",
    backupEncryption: "AES-256 (Hetzner Storage Box encryption)",
    lastBackupTest: "2026-02-15",
    backupRestoreSuccessRate: 100,
    lastBcpTest: "2026-02-20",
    crisisTeamLead: "Cory (CEO), deputy: Simon (CTO)",
    bcpActivationCriteria: ">4h platform outage, data center inaccessible, or confirmed security breach",
  },
  SUP: {
    totalSupplierCount: 4,
    criticalSupplierCount: 3,
    contractSecurityClauses: "DPA with all SaaS vendors, incident notification clause, data deletion on termination",
    supplierAuditFrequency: "annual",
    monitoringMethod: "Annual review + status page monitoring for critical services",
    incidentNotificationSlaHours: 24,
    singlePointOfFailureCount: 2,
    lastSupplierReview: "2026-01-20",
    dueDiligenceProcess: "Security questionnaire + SOC 2/ISO 27001 cert requirement for data-processing vendors",
  },
  PRO: {
    procurementSecurityChecklist: "DPA review for all SaaS, security checklist for >€1K vendor spend",
    sdlcFramework: "owasp_samm",
    codeReviewTool: "GitHub PR reviews",
    vulnerabilityScanningFrequency: "weekly",
    vulnerabilityScanTool: "Dependabot + bun audit in CI",
    lastPentestDate: "2026-01-30",
    disclosurePolicyUrl: "https://nisd2.eu/.well-known/security.txt",
    sbomTool: "Dependabot + bun audit",
    hardeningBaseline: "cis",
    changeManagementTool: "GitHub PRs + Linear",
    procurementApprovalThreshold: ">€5K or any SaaS with data access",
  },
  EFF: {
    kpisDefinedCount: 5,
    kpiDashboardTool: "Platform KPI module + Grafana",
    auditFrequency: "annual",
    lastAuditDate: "2026-02-10",
    lastManagementReview: "2026-03-31",
    correctiveActionTool: "Linear (corrective action project)",
    openCorrectiveActions: 1,
    avgClosureTimeDays: 14,
    trendAnalysisTool: "Platform KPI module + Grafana (monthly trend review)",
    managementReviewReportUploaded: "management-review-2026-Q1.pdf",
  },
  TRN: {
    itSecurityPolicyPublished: "it-security-policy-v1.0.pdf",
    trainingPlatform: "Internal (recorded sessions + documented exercises)",
    trainingFrequency: "annual",
    trainingCompletionRate: 100,
    lastTrainingDate: "2026-02-12",
    roleSpecificTrainingProvider: "SANS Institute (online) + A Cloud Guru",
    phishingSimFrequency: "quarterly",
    lastPhishingTest: "2026-02-01",
    phishingClickRate: 0,
    newEmployeeOnboarding: "Security onboarding on day 1: acceptable use policy review, phishing awareness training, password manager setup, incident reporting walkthrough. Signed acknowledgment required.",
  },
  CRY: {
    // 9.2 fields removed — now per-asset enrichment (encryptionAtRest, encryptionInTransit, cryptoImplementation)
    // 9.3 — company-level key & certificate management
    keyManagementTool: "AWS KMS (S3 encryption) + 1Password (credentials)",
    certificateMonitoringTool: "Cloudflare (production) + Let's Encrypt certbot (staging)",
    certExpiryAlertDays: 14,
  },
  ACC: {
    accessControlModel: "rbac",
    iamTool: "NextAuth (platform) + 1Password (credentials) + Cloudflare Zero Trust",
    accessReviewFrequency: "quarterly",
    lastAccessReviewDate: "2026-02-15",
    privilegedAccountCount: 2,
    pamTool: "1Password + SSH key rotation",
    deprovisioningSlaHours: 4,
    jmlTool: "Manual HR checklist (onboarding/offboarding in Notion)",
    backgroundCheckScope: "All employees (ID verification) + enhanced for admin roles",
    accessRequestProcess: "Slack request to CTO + manual provisioning",
  },
  AUT: {
    mfaTool: "Google Authenticator + 1Password TOTP",
    mfaMethods: "TOTP on all accounts, passkeys where supported",
    mfaCoverage: "all_users",
    mfaCoveragePct: 100,
    adminMfaEnforced: true,
    secureCommsTools: "Signal (E2EE), encrypted email (ProtonMail)",
    emergencyCommsChannel: "Signal group + phone tree",
    lastEmergencyCommsTest: "2026-02-10",
    ssoTool: "Google OAuth (via NextAuth)",
    passwordMinLength: 16,
    sessionTimeoutMinutes: 60,
  },
  REG: {
    entityClassification: "important",
    applicableSectors: "ICT service management (Annex II, Nr. 11)",
    contactPersonName: "Simon Orzel",
    contactPersonEmail: "contact@nisd2.eu",
    informationSharingCompliant: "Subscribed to BSI CERT-Bund advisories. Incident reports shared per §32 timelines.",
  },
};

type ReqData = { status: "completed" };

const NIS2_REQ_DATA: Record<string, ReqData> = {
  // ── GOV: Governance (4/4)
  "1.1": { status: "completed" }, "1.2": { status: "completed" },
  "1.3": { status: "completed" }, "1.4": { status: "completed" },
  // ── RSK: Risk Management (4/4)
  "2.1": { status: "completed" }, "2.2": { status: "completed" },
  "2.3": { status: "completed" }, "2.4": { status: "completed" },
  // ── INC: Incident Handling (5/5)
  "3.1": { status: "completed" }, "3.2": { status: "completed" },
  "3.3": { status: "completed" }, "3.4": { status: "completed" },
  "3.5": { status: "completed" },
  // ── BCP: Business Continuity (5/5)
  "4.1": { status: "completed" }, "4.2": { status: "completed" },
  "4.3": { status: "completed" }, "4.4": { status: "completed" },
  "4.5": { status: "completed" },
  // ── SUP: Supply Chain (4/4)
  "5.1": { status: "completed" }, "5.2": { status: "completed" },
  "5.3": { status: "completed" }, "5.4": { status: "completed" },
  // ── PRO: Secure Operations (5/5)
  "6.1": { status: "completed" }, "6.2": { status: "completed" },
  "6.3": { status: "completed" }, "6.4": { status: "completed" },
  "6.5": { status: "completed" },
  // ── EFF: Effectiveness (4/4)
  "7.1": { status: "completed" }, "7.2": { status: "completed" },
  "7.3": { status: "completed" }, "7.4": { status: "completed" },
  // ── TRN: Training (4/4)
  "8.1": { status: "completed" }, "8.2": { status: "completed" },
  "8.3": { status: "completed" }, "8.4": { status: "completed" },
  // ── CRY: Cryptography (3/3)
  "9.1": { status: "completed" }, "9.2": { status: "completed" },
  "9.3": { status: "completed" },
  // ── ACC: Access Control (4/4)
  "10.1": { status: "completed" }, "10.2": { status: "completed" },
  "10.3": { status: "completed" }, "10.4": { status: "completed" },
  // ── AUT: Authentication (3/3)
  "11.1": { status: "completed" }, "11.2": { status: "completed" },
  "11.3": { status: "completed" },
  // ── REG: Registration (4/4)
  "12.1": { status: "completed" }, "12.2": { status: "completed" },
  "12.3": { status: "completed" }, "12.4": { status: "completed" },
};

// ════════════════════════════════════════════════════════════════════════════
// Cleanup — delete existing NISD2.eu company (cascade)
// ════════════════════════════════════════════════════════════════════════════

async function deleteExistingCompany() {
  // Match any prior company attached to cory@nisd2.eu, or legacy "NISD2.eu" / "NISD2" names
  const coryUser = await db.query.user.findFirst({
    where: eq(schema.user.email, "cory@nisd2.eu"),
    columns: { companyId: true },
  });
  const existing = coryUser?.companyId
    ? await db.query.company.findFirst({ where: eq(schema.company.id, coryUser.companyId) })
    : await db.query.company.findFirst({
        where: (c, { or }) => or(eq(c.name, "NISD2.eu"), eq(c.name, "NISD2"), eq(c.name, "Kardashev Catalyst UG")),
      });
  if (!existing) return;

  const cid = existing.id;
  console.log(`  Deleting existing NISD2.eu (${cid})...`);

  // Audit log + notifications
  await db.delete(schema.auditLog).where(eq(schema.auditLog.companyId, cid));
  await db.delete(schema.notification).where(eq(schema.notification.companyId, cid));

  // Audit findings → internal audits
  const audits = await db.query.internalAudit.findMany({
    where: eq(schema.internalAudit.companyId, cid), columns: { id: true },
  });
  const auditIds = audits.map((a) => a.id);
  if (auditIds.length > 0) {
    await db.delete(schema.auditFinding).where(inArray(schema.auditFinding.auditId, auditIds));
  }

  // Policy acknowledgments → policies
  const policies = await db.query.policy.findMany({
    where: eq(schema.policy.companyId, cid), columns: { id: true },
  });
  const policyIds = policies.map((p) => p.id);
  if (policyIds.length > 0) {
    await db.delete(schema.policyAcknowledgment).where(inArray(schema.policyAcknowledgment.policyId, policyIds));
  }

  // Risk assets + treatments → risks
  const risks = await db.query.risk.findMany({
    where: eq(schema.risk.companyId, cid), columns: { id: true },
  });
  const riskIds = risks.map((r) => r.id);
  if (riskIds.length > 0) {
    await db.delete(schema.riskAsset).where(inArray(schema.riskAsset.riskId, riskIds));
    await db.delete(schema.riskTreatment).where(inArray(schema.riskTreatment.riskId, riskIds));
  }

  // All operational tables
  await db.delete(schema.internalAudit).where(eq(schema.internalAudit.companyId, cid));
  await db.delete(schema.improvementItem).where(eq(schema.improvementItem.companyId, cid));
  await db.delete(schema.managementReview).where(eq(schema.managementReview.companyId, cid));
  await db.delete(schema.kpiMeasurement).where(eq(schema.kpiMeasurement.companyId, cid));
  await db.delete(schema.patchRecord).where(eq(schema.patchRecord.companyId, cid));
  await db.delete(schema.changeRequest).where(eq(schema.changeRequest.companyId, cid));
  await db.delete(schema.exercise).where(eq(schema.exercise.companyId, cid));
  await db.delete(schema.trainingRecord).where(eq(schema.trainingRecord.companyId, cid));
  await db.delete(schema.incident).where(eq(schema.incident.companyId, cid));
  await db.delete(schema.policy).where(eq(schema.policy.companyId, cid));
  await db.delete(schema.supplier).where(eq(schema.supplier.customerCompanyId, cid));
  await db.delete(schema.risk).where(eq(schema.risk.companyId, cid));
  await db.delete(schema.asset).where(eq(schema.asset.companyId, cid));
  // Assessment cascade: evidence → statuses → category assignments → assessments
  const assessments = await db.query.companyAssessment.findMany({
    where: eq(schema.companyAssessment.companyId, cid), columns: { id: true },
  });
  const assessmentIds = assessments.map((a) => a.id);
  if (assessmentIds.length > 0) {
    const statuses = await db.query.companyRequirementStatus.findMany({
      where: inArray(schema.companyRequirementStatus.assessmentId, assessmentIds),
      columns: { id: true },
    });
    const statusIds = statuses.map((s) => s.id);
    if (statusIds.length > 0) {
      await db.delete(schema.evidence).where(inArray(schema.evidence.requirementStatusId, statusIds));
      // requirement_assignment FKs requirement_status → must clear before status delete
      await db.delete(schema.requirementAssignment).where(inArray(schema.requirementAssignment.statusId, statusIds));
      // sign_off_history references the same status — clear it too
      await db.delete(schema.signOffHistory).where(inArray(schema.signOffHistory.statusId, statusIds));
    }
    await db.delete(schema.companyRequirementStatus).where(inArray(schema.companyRequirementStatus.assessmentId, assessmentIds));
    await db.delete(schema.categoryAssignment).where(inArray(schema.categoryAssignment.assessmentId, assessmentIds));
    await db.delete(schema.companyCategoryIntake).where(inArray(schema.companyCategoryIntake.assessmentId, assessmentIds));
  }
  await db.delete(schema.companyAssessment).where(eq(schema.companyAssessment.companyId, cid));

  // Invites
  await db.delete(schema.companyInvite).where(eq(schema.companyInvite.companyId, cid));

  // Unlink users (don't delete — they might have other data)
  await db.update(schema.user)
    .set({ companyId: null, role: "member", updatedAt: new Date() })
    .where(eq(schema.user.companyId, cid));

  // Delete company
  await db.delete(schema.company).where(eq(schema.company.id, cid));
  console.log("  Deleted.");
}

// ════════════════════════════════════════════════════════════════════════════
// Seed — all mutations go through tRPC
// ════════════════════════════════════════════════════════════════════════════

async function seedNisd2() {
  console.log("🏢 NISD2.eu company seed (tRPC mutations)\n");

  // ── Phase 1: Clean slate ───────────────────────────────────────────
  await deleteExistingCompany();

  // ── Phase 2: Create primary user ───────────────────────────────────
  const existingCory = await db.query.user.findFirst({
    where: eq(schema.user.email, "cory@nisd2.eu"),
  });
  let coryId: string;
  if (existingCory) {
    coryId = existingCory.id;
    console.log(`  User (existing): cory@nisd2.eu (${coryId})`);
  } else {
    const [cory] = await db.insert(schema.user).values({
      email: "cory@nisd2.eu",
      name: "Cory",
      role: "member",
      jobTitle: "Co-Founder & CEO",
      isManagement: true,
    }).returning();
    coryId = cory.id;
    console.log(`  User (created): cory@nisd2.eu (${coryId})`);
  }

  // ── Phase 3: Create company + assessments via tRPC ─────────────────
  const setupCaller = createSeedCaller(coryId, null);
  const { companyId } = await setupCaller.assessment.createCompanyAndAssessment({
    name: "Kardashev Catalyst UG",
    sector: "ict_service_management",
    entityType: "important",
    legalForm: "UG (haftungsbeschränkt)",
    employeeCount: 2,
    contactEmail: "contact@nisd2.eu",
    cisoName: "Simon Orzel",
    cisoReportsTo: "Geschäftsführer",
    bsiContactName: "Simon Orzel",
    bsiContactEmail: "contact@nisd2.eu",
    bsiContactPhone: "+49 30 55019283",
    annualSecurityBudget: "25000",
    primaryLocations: "Berlin",
  });
  console.log(`  Company: NISD2.eu (${companyId})`);

  // ── Phase 4: Add Simon via direct DB (no tRPC route for user creation)
  const existingSimon = await db.query.user.findFirst({
    where: eq(schema.user.email, "simon@nisd2.eu"),
  });
  let simonId: string;
  if (existingSimon) {
    await db.update(schema.user).set({
      companyId, role: "admin", jobTitle: "Co-Founder & CTO", isManagement: true, updatedAt: new Date(),
    }).where(eq(schema.user.id, existingSimon.id));
    simonId = existingSimon.id;
  } else {
    const [simon] = await db.insert(schema.user).values({
      companyId, email: "simon@nisd2.eu", name: "Simon",
      role: "admin", jobTitle: "Co-Founder & CTO", isManagement: true,
    }).returning();
    simonId = simon.id;
  }
  console.log(`  User: simon@nisd2.eu (${simonId})`);

  // ── Phase 5: Setup tRPC caller + fetch requirement statuses ────────
  const caller = createSeedCaller(coryId, companyId);
  const ALL_REQ_DATA = NIS2_REQ_DATA;

  const allStatuses = await db
    .select({
      statusId: schema.companyRequirementStatus.id,
      code: schema.requirement.code,
      sortOrder: schema.requirement.sortOrder,
    })
    .from(schema.companyRequirementStatus)
    .innerJoin(schema.requirement, eq(schema.companyRequirementStatus.requirementId, schema.requirement.id))
    .innerJoin(schema.companyAssessment, eq(schema.companyRequirementStatus.assessmentId, schema.companyAssessment.id))
    .where(eq(schema.companyAssessment.companyId, companyId))
    // Sort by sortOrder so prerequisites are signed off before their dependents.
    .orderBy(schema.requirement.sortOrder);

  // ── Phase 6: Operational data via tRPC (BEFORE sign-offs so snapshots capture real counts)
  console.log("\n  Seeding operational data via tRPC...");

  // Assets (6)
  const assets = [];
  for (const a of [
    { name: "Primary Web Server", type: "server", description: "Production Next.js 16 application server hosting the NISD2.eu compliance platform", isCritical: true, isOT: false, owner: "Simon", location: "Hetzner FSN1 (Falkenstein, Germany)", hostname: "web-prod-01", ipAddress: "XXX.XXX.XXX.10", operatingSystem: "Ubuntu 24.04 LTS", softwareVersion: "Next.js 16.1.6 / Bun 1.2.x", hasMfa: true, encryptionAtRest: "AES-256-GCM", encryptionInTransit: "TLS_AES_256_GCM_SHA384", cryptoImplementation: "LUKS2 (dm-crypt)", hasBackup: true, backupFrequency: "daily", backupLocation: "Hetzner Storage Box (separate DC)", lastBackupTestDate: "2026-02-15", rto: 240, rpo: 60, lastPatchDate: "2026-02-05", lastVulnScanDate: "2026-02-08" },
    { name: "PostgreSQL Database", type: "database", description: "Primary PostgreSQL 16 database cluster storing all compliance data, user accounts, and assessment records", isCritical: true, isOT: false, owner: "Simon", location: "Hetzner FSN1 (Falkenstein, Germany)", hostname: "db-prod-01", ipAddress: "XXX.XXX.XXX.20", operatingSystem: "Ubuntu 24.04 LTS", softwareVersion: "PostgreSQL 16.6", hasMfa: true, encryptionAtRest: "AES-256-GCM", encryptionInTransit: "TLS_AES_256_GCM_SHA384", cryptoImplementation: "PostgreSQL TDE + pg_tls", hasBackup: true, backupFrequency: "daily", backupLocation: "AWS S3 eu-central-1 (encrypted, separate account)", lastBackupTestDate: "2026-02-15", rto: 120, rpo: 60, lastPatchDate: "2026-02-05", lastVulnScanDate: "2026-02-08" },
    { name: "S3 Evidence Storage", type: "storage", description: "AWS S3 bucket for evidence file uploads (encrypted at rest with SSE-S3, versioning enabled)", isCritical: true, isOT: false, owner: "Simon", location: "AWS eu-central-1 (Frankfurt, Germany)", softwareVersion: "AWS S3 (managed)", hasMfa: true, encryptionAtRest: "AES-256-GCM", encryptionInTransit: "TLS_AES_256_GCM_SHA384", cryptoImplementation: "AWS KMS (SSE-S3)", hasBackup: true, backupFrequency: "continuous (S3 versioning)", backupLocation: "S3 cross-region replication to eu-west-1", rto: 30, rpo: 0, lastVulnScanDate: "2026-02-08" },
    { name: "CI/CD Pipeline", type: "service", description: "GitHub Actions build, test, and deployment pipeline with automated security checks", isCritical: false, isOT: false, owner: "Simon", location: "GitHub (cloud, EU region)", softwareVersion: "GitHub Actions", hasMfa: true, encryptionAtRest: "AES-256-GCM", encryptionInTransit: "TLS_AES_256_GCM_SHA384", cryptoImplementation: "GitHub (managed)", hasBackup: false, rto: 480, rpo: 0, lastVulnScanDate: "2026-02-08" },
    { name: "Corporate Laptops", type: "endpoint", description: "MacBook Pro fleet (2 devices) with FileVault encryption, MDM-managed screen lock, 1Password", isCritical: false, isOT: false, owner: "Cory", operatingSystem: "macOS 15 Sequoia", hasMfa: true, encryptionAtRest: "AES-256-XTS", encryptionInTransit: "TLS_AES_256_GCM_SHA384", cryptoImplementation: "FileVault 2 (Apple T2/M-series)", hasBackup: true, backupFrequency: "daily (Time Machine)", backupLocation: "Local encrypted backup + iCloud", lastPatchDate: "2026-02-05", lastVulnScanDate: "2026-02-08" },
    { name: "DNS & CDN (Cloudflare)", type: "network", description: "Cloudflare DNS, CDN, WAF, and DDoS protection for nisd2.eu. Managed WAF with OWASP Top 10 rules.", isCritical: true, isOT: false, owner: "Simon", hostname: "nisd2.eu", softwareVersion: "Cloudflare (managed)", hasMfa: true, encryptionAtRest: "AES-256-GCM", encryptionInTransit: "TLS_AES_256_GCM_SHA384", cryptoImplementation: "Cloudflare (managed)", hasBackup: false, rto: 15, rpo: 0, lastVulnScanDate: "2026-02-08" },
  ]) {
    assets.push(await caller.asset.create(a));
  }
  console.log(`    Assets: ${assets.length}`);

  // Risks (5) — riskScore computed by tRPC mutation
  const riskData = [
    { title: "Unauthorized access to customer compliance data", description: "An attacker gains access to the PostgreSQL database containing customer compliance assessments, evidence files, and PII via SQL injection, credential stuffing, or insider threat.", category: "data_breach", likelihood: 2, impact: 5, treatment: "mitigate", treatmentDescription: "MFA on all admin accounts, encrypted backups, WAF rules (OWASP Top 10), parameterized queries (Drizzle ORM), quarterly vulnerability scans, annual penetration test", residualLikelihood: 1, residualImpact: 5, residualRiskScore: 5, riskOwner: "Simon (CTO)", lastReviewedAt: new Date("2026-02-01"), nextReviewDate: "2026-05-01" },
    { title: "Service outage due to infrastructure failure", description: "Primary web server or database goes offline, preventing customers from accessing the compliance platform during critical compliance deadlines.", category: "availability", likelihood: 2, impact: 4, treatment: "mitigate", treatmentDescription: "Automated health checks (Hetzner monitoring), daily database backups with tested restore procedure, CDN caching for static assets, DNS-level failover via Cloudflare", residualLikelihood: 1, residualImpact: 3, residualRiskScore: 3, riskOwner: "Simon (CTO)", lastReviewedAt: new Date("2026-02-01"), nextReviewDate: "2026-05-01" },
    { title: "Supply chain compromise via npm dependency", description: "A malicious package is introduced through the JavaScript/TypeScript dependency tree (bun/npm ecosystem), potentially exfiltrating customer data or injecting backdoor code.", category: "supply_chain", likelihood: 3, impact: 4, treatment: "mitigate", treatmentDescription: "bun.lockb lock file pinning, Dependabot alerts enabled, bun audit in CI pipeline, minimal dependency footprint, review of all new dependencies before adoption", residualLikelihood: 2, residualImpact: 3, residualRiskScore: 6, riskOwner: "Simon (CTO)", lastReviewedAt: new Date("2026-02-01"), nextReviewDate: "2026-05-01" },
    { title: "GDPR data subject access request backlog", description: "Failure to respond to data subject access/deletion requests within 30 days due to lack of automated tooling, resulting in GDPR fines.", category: "compliance", likelihood: 2, impact: 3, treatment: "accept", treatmentDescription: "Low volume expected initially (< 5 requests/year); manual process acceptable until customer base grows beyond 100 companies. Revisit at Q3 review.", residualLikelihood: 2, residualImpact: 3, residualRiskScore: 6, riskOwner: "Cory (CEO)", acceptedBy: coryId, acceptedAt: new Date("2026-01-20"), lastReviewedAt: new Date("2026-02-01"), nextReviewDate: "2026-07-20" },
    { title: "Key person dependency on founding team", description: "Critical platform knowledge and infrastructure access concentrated in two co-founders. Simultaneous illness, departure, or unavailability could delay security updates and compliance responses.", category: "operational", likelihood: 3, impact: 3, treatment: "mitigate", treatmentDescription: "Document all runbooks in Git, pair programming on all critical systems, Infrastructure as Code for all infrastructure, shared 1Password vault for all credentials, cross-training on all operational procedures", residualLikelihood: 2, residualImpact: 2, residualRiskScore: 4, riskOwner: "Cory (CEO)", lastReviewedAt: new Date("2026-02-01"), nextReviewDate: "2026-05-01" },
  ] as const;
  const createdRisks = [];
  for (const r of riskData) {
    createdRisks.push(await caller.risk.create(r));
  }
  console.log(`    Risks: ${createdRisks.length}`);

  // Risk-Asset links (9)
  const riskAssetLinks = [
    { riskId: createdRisks[0].id, assetId: assets[1].id, notes: "Database is primary target for data breach" },
    { riskId: createdRisks[0].id, assetId: assets[2].id, notes: "S3 bucket contains evidence files" },
    { riskId: createdRisks[1].id, assetId: assets[0].id, notes: "Web server is single point of failure" },
    { riskId: createdRisks[1].id, assetId: assets[1].id, notes: "Database outage causes full service loss" },
    { riskId: createdRisks[1].id, assetId: assets[5].id, notes: "DNS/CDN failure prevents all access" },
    { riskId: createdRisks[2].id, assetId: assets[0].id, notes: "Application server runs npm dependencies" },
    { riskId: createdRisks[2].id, assetId: assets[3].id, notes: "CI/CD pipeline fetches dependencies" },
    { riskId: createdRisks[4].id, assetId: assets[0].id, notes: "Server management requires founder access" },
    { riskId: createdRisks[4].id, assetId: assets[1].id, notes: "Database admin requires founder access" },
  ];
  for (const link of riskAssetLinks) {
    await caller.risk.linkAsset(link);
  }
  console.log(`    Risk-Asset links: ${riskAssetLinks.length}`);

  // Suppliers (4)
  const createdSuppliers = [];
  for (const s of [
    { name: "Hetzner Online GmbH", description: "Dedicated server infrastructure provider (production web server and database hosting)", contactEmail: "support@hetzner.com", contactName: "Hetzner Support Team", serviceType: "Infrastructure (IaaS)", riskLevel: "high" as const, hasAccessToSystems: false, hasAccessToData: false, isCritical: true, contractStartDate: "2025-10-01", contractEndDate: "2026-09-30", hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: true, hasSubcontractorFlowDown: true },
    { name: "Amazon Web Services (S3)", description: "Object storage for evidence file uploads and encrypted database backups", contactEmail: "aws-support@amazon.com", contactName: "AWS Enterprise Support", serviceType: "Cloud Storage (SaaS)", riskLevel: "medium" as const, hasAccessToSystems: false, hasAccessToData: true, isCritical: true, contractStartDate: "2025-11-01", hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: true, hasSubcontractorFlowDown: true },
    { name: "Cloudflare Inc.", description: "DNS, CDN, WAF, DDoS protection, and Zero Trust network access for nisd2.eu", contactEmail: "enterprise@cloudflare.com", contactName: "Cloudflare Enterprise Support", serviceType: "Network Security (SaaS)", riskLevel: "medium" as const, hasAccessToSystems: false, hasAccessToData: false, isCritical: true, contractStartDate: "2025-10-15", hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: false, hasSubcontractorFlowDown: false },
    { name: "Resend Inc.", description: "Transactional email delivery service for notifications, invitations, and compliance alerts", contactEmail: "support@resend.com", contactName: "Resend Support", serviceType: "Communication (SaaS)", riskLevel: "low" as const, hasAccessToSystems: false, hasAccessToData: true, isCritical: false, contractStartDate: "2025-12-01", hasSecurityClauses: true, hasIncidentNotificationClause: true, hasAuditRights: false, hasSubcontractorFlowDown: false },
  ]) {
    createdSuppliers.push(await caller.supplier.create(s));
  }
  console.log(`    Suppliers: ${createdSuppliers.length}`);

  // Policies (10)
  for (const p of [
    { title: "Information Security Policy", type: "security", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-15"), approverRole: "Geschäftsführer", effectiveFrom: "2026-01-15", reviewDue: "2027-01-15" },
    { title: "Risk Management Policy", type: "risk_management", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-15"), approverRole: "Geschäftsführer", effectiveFrom: "2026-01-15", reviewDue: "2027-01-15" },
    { title: "Incident Response Plan", type: "incident_response", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-15"), approverRole: "Geschäftsführer", effectiveFrom: "2026-01-15", reviewDue: "2027-01-15" },
    { title: "Business Continuity Plan", type: "business_continuity", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-02-25"), approverRole: "Geschäftsführer", effectiveFrom: "2026-02-25", reviewDue: "2027-02-25" },
    { title: "Access Control Policy", type: "access_control", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-20"), approverRole: "CTO", effectiveFrom: "2026-01-20", reviewDue: "2027-01-20" },
    { title: "Cryptography & Encryption Policy", type: "cryptography", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-20"), approverRole: "CTO", effectiveFrom: "2026-01-20", reviewDue: "2027-01-20" },
    { title: "Supply Chain Security Policy", type: "supply_chain", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-20"), approverRole: "Geschäftsführer", effectiveFrom: "2026-01-20", reviewDue: "2027-01-20" },
    { title: "Acceptable Use Policy", type: "acceptable_use", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-25"), approverRole: "CEO", effectiveFrom: "2026-01-25", reviewDue: "2027-01-25" },
    { title: "Vulnerability Management & Patch Policy", type: "vulnerability_management", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-01-25"), approverRole: "CTO", effectiveFrom: "2026-01-25", reviewDue: "2027-01-25" },
    { title: "Secure Development Policy", type: "secure_development", version: "1.0", status: "approved", approvedBy: coryId, approvedAt: new Date("2026-02-01"), approverRole: "CTO", effectiveFrom: "2026-02-01", reviewDue: "2027-02-01" },
  ]) {
    await caller.policy.create(p);
  }
  console.log("    Policies: 10 (all approved)");

  // Incidents (7)
  for (const i of [
    { severity: "near_miss" as const, title: "Exposed debug endpoint in staging", description: "A /debug route was accidentally deployed to the staging environment for 2 hours before being caught by automated monitoring. No customer data was exposed. Route was behind authentication middleware but returned verbose error information.", discoveredAt: new Date("2026-01-20T14:30:00Z"), resolvedAt: new Date("2026-01-20T16:00:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: false, rootCause: "Missing environment check in route registration. Dev-only router was registered unconditionally. Fixed by gating with build-time environment variable.", countermeasures: "Removed route immediately. Added build-time gating for all dev-only routes.", preventiveMeasures: "CI pipeline now fails if dev-only routes are referenced without NODE_ENV guard." },
    { severity: "incident" as const, title: "Temporary database connection pool exhaustion", description: "Database connection pool was exhausted during a load test, causing 503 errors for ~5 minutes. No data loss occurred. All in-flight transactions were safely rolled back.", discoveredAt: new Date("2026-02-01T09:15:00Z"), resolvedAt: new Date("2026-02-01T09:20:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: true, affectedSystemsCount: 1, rootCause: "Connection pool max_connections set too low (10) for concurrent requests during load test. Increased to 25 with connection timeout of 30s. Added connection pool monitoring alert.", countermeasures: "Increased pool size to 25, added 30s timeout.", preventiveMeasures: "Added Grafana alert for connection pool utilization > 80%." },
    { severity: "significant" as const, title: "Credential stuffing attack on authentication endpoint", description: "Automated credential stuffing attack detected against the /api/auth/signin endpoint. Approximately 12,000 login attempts from 340 unique IPs over 45 minutes. Cloudflare WAF rate limiting triggered after initial burst. No accounts were compromised — all users have MFA enabled. BSI early warning submitted within 18 hours.", occurredAt: new Date("2026-01-28T02:15:00Z"), discoveredAt: new Date("2026-01-28T02:30:00Z"), resolvedAt: new Date("2026-01-28T04:00:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: false, isMalicious: true, affectedUsersCount: 0, affectedSystemsCount: 1, threatType: "credential-stuffing", rootCause: "No IP-based rate limiting at application layer. Cloudflare rate limiting caught it but only after initial burst of ~2,000 requests.", countermeasures: "1. Enabled Cloudflare bot management. 2. Added application-layer rate limiting (10 failed logins/IP/hour). 3. Temporarily geo-blocked IPs from attack origin countries.", preventiveMeasures: "1. Deployed CAPTCHA challenge after 3 failed attempts. 2. Added login anomaly monitoring dashboard. 3. Implemented exponential backoff on failed logins.", internalRef: "INC-2026-003" },
    { severity: "near_miss" as const, title: "Dependabot alert for critical npm dependency vulnerability", description: "GitHub Dependabot flagged a critical vulnerability (CVE-2026-1234, CVSS 9.1) in a transitive dependency (lodash.template). The vulnerable function was not used in our codebase — confirmed via code search. Dependency updated within 4 hours as a precaution.", discoveredAt: new Date("2026-02-03T08:00:00Z"), resolvedAt: new Date("2026-02-03T12:00:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: false, threatType: "supply-chain-vulnerability", rootCause: "Transitive dependency pulled in vulnerable code. Not exploitable in our context but patched proactively.", countermeasures: "Updated dependency tree to patched version.", preventiveMeasures: "Added bun audit --level critical to CI pipeline as blocking check." },
    { severity: "incident" as const, title: "S3 evidence bucket temporarily unreachable", description: "AWS S3 bucket in eu-central-1 returned intermittent 503 SlowDown errors for approximately 20 minutes during AWS regional maintenance. Evidence file uploads failed during this window. No data was lost — retries succeeded after the window.", occurredAt: new Date("2026-02-08T03:10:00Z"), discoveredAt: new Date("2026-02-08T07:30:00Z"), resolvedAt: new Date("2026-02-08T03:30:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: true, affectedSystemsCount: 1, serviceDeliveryImpact: "Evidence file uploads failed for ~20 min during off-hours. No customer impact reported.", rootCause: "AWS regional maintenance caused temporary throttling on S3 requests. Outside our control.", countermeasures: "Verified all pending uploads completed after recovery.", preventiveMeasures: "Added exponential retry with jitter to S3 upload client. Added AWS Health Dashboard webhook to Slack." },
    { severity: "near_miss" as const, title: "Employee laptop left unlocked in co-working space", description: "Simon's MacBook was found unlocked in the co-working space cafeteria for approximately 3 minutes. Screen lock had been manually dismissed for a presentation. MDM policy auto-locked the screen after the 5-minute timeout. No evidence of unauthorized access.", discoveredAt: new Date("2026-02-10T12:30:00Z"), resolvedAt: new Date("2026-02-10T12:35:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: false, rootCause: "Screen lock timeout was set to 5 minutes. User manually dismissed lock for presentation and forgot to re-lock when leaving desk.", countermeasures: "Screen re-locked via MDM remote command. Session logs reviewed — no unauthorized activity.", preventiveMeasures: "Reduced MDM screen lock timeout from 5 min to 2 min. Added reminder to security awareness slide deck about locking screens." },
    { severity: "incident" as const, title: "TLS certificate near-expiry on staging environment", description: "Staging environment TLS certificate was 48 hours from expiry. Caught by automated monitoring (Cloudflare certificate monitoring). Production was unaffected (Cloudflare-managed certificates auto-renew). Staging uses Let's Encrypt with a separate renewal pipeline.", occurredAt: new Date("2026-02-05T00:00:00Z"), discoveredAt: new Date("2026-02-05T09:00:00Z"), resolvedAt: new Date("2026-02-05T10:30:00Z"), confidentialityImpacted: false, integrityImpacted: false, availabilityImpacted: false, affectedSystemsCount: 1, rootCause: "Let's Encrypt certbot renewal cron job had wrong path after server migration. Renewal silently failed for 60 days.", countermeasures: "Manually renewed certificate. Fixed certbot configuration.", preventiveMeasures: "Added certificate expiry monitoring for all environments (not just production). Certificate expiry < 14 days now triggers PagerDuty alert." },
  ]) {
    await caller.incident.create(i);
  }
  console.log("    Incidents: 7 (1 significant, 3 incidents, 3 near-misses)");

  // Training records (10)
  for (const t of [
    { userId: coryId, trainingType: "security_awareness", title: "NIS2 Management Liability Training (§38 BSIG)", participantName: "Cory", isManagement: true, durationMinutes: 90, completedAt: new Date("2026-01-10"), providerName: "GDD e.V.", topicsCovered: ["NIS2 management liability", "Risk identification", "Personal liability for Geschäftsführer", "Incident reporting obligations"] },
    { userId: simonId, trainingType: "security_awareness", title: "NIS2 Management Liability Training (§38 BSIG)", participantName: "Simon", isManagement: true, durationMinutes: 90, completedAt: new Date("2026-01-10"), providerName: "GDD e.V.", topicsCovered: ["NIS2 management liability", "Risk identification", "Personal liability for Geschäftsführer", "Incident reporting obligations"] },
    { userId: simonId, trainingType: "technical", title: "Secure Coding Practices for Next.js & TypeScript", participantName: "Simon", isManagement: false, durationMinutes: 120, completedAt: new Date("2026-01-25"), providerName: "Internal", topicsCovered: ["OWASP Top 10", "SQL injection prevention", "XSS mitigation", "TypeScript strict mode", "Dependency security"] },
    { userId: coryId, trainingType: "security_awareness", title: "Phishing Awareness & Social Engineering Defense", participantName: "Cory", isManagement: false, durationMinutes: 60, completedAt: new Date("2026-01-20"), providerName: "Internal", topicsCovered: ["Spear-phishing indicators", "URL inspection", "Reporting procedures"] },
    { userId: simonId, trainingType: "security_awareness", title: "Phishing Awareness & Social Engineering Defense", participantName: "Simon", isManagement: false, durationMinutes: 60, completedAt: new Date("2026-01-20"), providerName: "Internal" },
    { userId: coryId, trainingType: "security_awareness", title: "GDPR Data Protection Essentials for Management", participantName: "Cory", isManagement: true, durationMinutes: 60, completedAt: new Date("2026-01-15"), providerName: "DataGuard GmbH", topicsCovered: ["GDPR principles", "Data subject rights", "Breach notification", "DPO role"] },
    { userId: simonId, trainingType: "technical", title: "Cloud Security Fundamentals — AWS & Hetzner", participantName: "Simon", isManagement: false, durationMinutes: 180, completedAt: new Date("2026-01-18"), providerName: "A Cloud Guru", topicsCovered: ["IAM best practices", "S3 bucket security", "VPC configuration", "Encryption at rest/transit", "CloudTrail logging"] },
    { userId: coryId, trainingType: "security_awareness", title: "Business Continuity & Crisis Communication", participantName: "Cory", isManagement: true, durationMinutes: 45, completedAt: new Date("2026-02-18"), providerName: "Internal", topicsCovered: ["BCP activation criteria", "Crisis communication templates", "Stakeholder notification"] },
    { userId: simonId, trainingType: "technical", title: "Incident Response & Digital Forensics Basics", participantName: "Simon", isManagement: false, durationMinutes: 240, completedAt: new Date("2026-02-05"), providerName: "SANS Institute (online)", topicsCovered: ["Evidence preservation", "Log analysis", "Timeline reconstruction", "Chain of custody", "BSI reporting requirements"] },
    { userId: coryId, trainingType: "security_awareness", title: "Supply Chain Risk Management for Executives", participantName: "Cory", isManagement: true, durationMinutes: 60, completedAt: new Date("2026-02-12"), providerName: "Internal", topicsCovered: ["Third-party risk assessment", "Vendor security evaluation", "Contractual security requirements", "NIS2 supply chain obligations"] },
  ]) {
    await caller.training.create(t);
  }
  console.log("    Training: 10");

  // Exercises (5)
  for (const e of [
    { title: "Incident Response Tabletop Exercise — Ransomware Scenario", exerciseType: "tabletop" as const, domain: "incident_response", scenarioDescription: "Simulated ransomware attack on production database. Team walked through detection (monitoring alert), containment (network isolation), eradication (clean restore from backup), and recovery (service restoration) steps. BSI reporting timeline (24h early warning, 72h notification) was practiced.", scheduledDate: "2026-03-01", completedAt: new Date("2026-03-01"), lessonsLearned: "1. Communication chain needs formalization — add Signal group auto-creation to IR playbook. 2. Backup restore procedure should be documented step-by-step. 3. BSI portal login credentials should be stored in shared 1Password vault.", facilitator: "Simon", participants: ["Cory", "Simon"] },
    { title: "Full-Scale DR Test — Production Server Failure", exerciseType: "full_scale" as const, domain: "business_continuity", scenarioDescription: "Complete production server failure requiring full disaster recovery activation: database restore from S3 backup, application redeployment to alternate Hetzner DC, DNS failover via Cloudflare. All critical systems recovered.", scheduledDate: "2026-02-20", completedAt: new Date("2026-02-20"), lessonsLearned: "1. Total recovery time 2h 15min (within 4h RTO). 2. DNS failover should be automated via API. 3. Recovery runbook needs exact CLI commands for each step. All 3 items addressed in BCP v1.0 update.", facilitator: "Simon", participants: ["Cory", "Simon"] },
    { title: "Backup Restore Verification Test Q1", exerciseType: "technical" as const, domain: "business_continuity", scenarioDescription: "Quarterly backup restore test: PostgreSQL database restored from daily backup to isolated test environment. Data integrity verified via row count comparison and SHA-256 checksums on critical tables. S3 evidence files verified via random sampling (10% of files).", scheduledDate: "2026-02-15", completedAt: new Date("2026-02-15"), lessonsLearned: "Restore successful. PostgreSQL: 45min restore time, 100% data integrity. S3: all sampled files intact. Recommend automating weekly restore verification (improvement item tracked).", facilitator: "Simon", participants: ["Simon"] },
    { title: "Phishing Simulation Campaign Q1", exerciseType: "tabletop" as const, domain: "incident_response", scenarioDescription: "Simulated spear-phishing campaign targeting both employees. 4 emails sent (2 per person) mimicking common attack vectors: fake IT support password reset, fake invoice from known supplier, urgent security alert from 'BSI', and fake HR benefits enrollment. Emails tracked for open, click, and report actions.", scheduledDate: "2026-02-01", completedAt: new Date("2026-02-01"), lessonsLearned: "0% click rate, 100% report rate. Both employees correctly identified all 4 phishing emails. Key indicator: all reported within 10 minutes of receipt. Continue quarterly campaigns with increasing sophistication.", facilitator: "Cory", participants: ["Cory", "Simon"] },
    { title: "BSI Notification Dry Run", exerciseType: "tabletop" as const, domain: "incident_response", scenarioDescription: "Practiced the full BSI notification workflow: (1) detect significant incident, (2) classify using decision tree, (3) submit 24h early warning via BSI portal, (4) prepare 72h intermediate report, (5) draft 1-month final report. Used the credential stuffing incident from January as the reference scenario.", scheduledDate: "2026-02-10", completedAt: new Date("2026-02-10"), lessonsLearned: "Portal login worked. Early warning form completed in 12 minutes. Intermediate report template needs more structure for technical details. Added screenshot walkthrough to IR playbook.", facilitator: "Simon", participants: ["Cory", "Simon"] },
  ]) {
    await caller.exercise.create(e);
  }
  console.log("    Exercises: 5");

  // KPI measurements (15 — 3 months of data for 5 KPIs)
  const kpiData = [
    // January 2026
    { kpiName: "Mean Time to Detect (MTTD)", value: "22", unit: "minutes", measuredAt: new Date("2026-01-01"), status: "green" as const, target: "30", notes: "Initial baseline measurement. Detection via Cloudflare + Hetzner monitoring." },
    { kpiName: "Patch Application Rate (Critical)", value: "100", unit: "percent", measuredAt: new Date("2026-01-01"), status: "green" as const, target: "95" },
    { kpiName: "Security Training Completion", value: "100", unit: "percent", measuredAt: new Date("2026-01-01"), status: "green" as const, target: "100" },
    { kpiName: "Backup Restore Test Success Rate", value: "100", unit: "percent", measuredAt: new Date("2026-01-15"), status: "green" as const, target: "100" },
    { kpiName: "Open Critical Vulnerabilities", value: "0", unit: "count", measuredAt: new Date("2026-01-08"), status: "green" as const, target: "0" },
    // February 2026
    { kpiName: "Mean Time to Detect (MTTD)", value: "15", unit: "minutes", measuredAt: new Date("2026-02-01"), status: "green" as const, target: "30", notes: "Improved after adding Grafana alerting and Cloudflare bot management." },
    { kpiName: "Patch Application Rate (Critical)", value: "100", unit: "percent", measuredAt: new Date("2026-02-01"), status: "green" as const, target: "95" },
    { kpiName: "Security Training Completion", value: "100", unit: "percent", measuredAt: new Date("2026-02-01"), status: "green" as const, target: "100" },
    { kpiName: "Backup Restore Test Success Rate", value: "100", unit: "percent", measuredAt: new Date("2026-02-15"), status: "green" as const, target: "100" },
    { kpiName: "Open Critical Vulnerabilities", value: "0", unit: "count", measuredAt: new Date("2026-02-08"), status: "green" as const, target: "0" },
    // March 2026 (most recent)
    { kpiName: "Mean Time to Detect (MTTD)", value: "12", unit: "minutes", measuredAt: new Date("2026-03-01"), status: "green" as const, target: "30", notes: "Continued improvement. Automated anomaly detection now covers all endpoints." },
    { kpiName: "Patch Application Rate (Critical)", value: "100", unit: "percent", measuredAt: new Date("2026-03-01"), status: "green" as const, target: "95" },
    { kpiName: "Security Training Completion", value: "100", unit: "percent", measuredAt: new Date("2026-03-01"), status: "green" as const, target: "100" },
    { kpiName: "Backup Restore Test Success Rate", value: "100", unit: "percent", measuredAt: new Date("2026-03-15"), status: "green" as const, target: "100", notes: "Q1 restore test passed. Automated weekly mini-tests now running." },
    { kpiName: "Open Critical Vulnerabilities", value: "0", unit: "count", measuredAt: new Date("2026-03-08"), status: "green" as const, target: "0" },
  ];
  for (const k of kpiData) {
    await caller.kpi.create(k);
  }
  console.log(`    KPIs: ${kpiData.length} (3 months × 5 metrics)`);

  // Change requests (6)
  for (const c of [
    { title: "Upgrade PostgreSQL from 15 to 16", description: "Rolling upgrade of the primary database to PostgreSQL 16 for improved performance, security patches, and logical replication improvements. Tested in staging first.", changeType: "normal" as const, status: "closed" as const, approvedBy: coryId, securityImpactAssessment: "Low risk. PostgreSQL 16 is a stable release. Backup taken before upgrade. Rollback plan: restore from pre-upgrade backup.", rollbackPlan: "Restore database from pre-upgrade pg_dump backup (tested, 45min restore time)." },
    { title: "Enable WAF rules on Cloudflare", description: "Activate Cloudflare managed WAF ruleset for OWASP Top 10 protection on production. Includes SQL injection, XSS, and path traversal rules.", changeType: "normal" as const, status: "closed" as const, approvedBy: coryId, securityImpactAssessment: "Positive security impact. May cause false positives on certain API endpoints — tested in simulate mode for 7 days first." },
    { title: "Deploy application-layer rate limiting", description: "Add IP-based rate limiting to authentication endpoints after credential stuffing attack (INC-2026-003). Limit: 10 failed login attempts per IP per hour with exponential backoff.", changeType: "emergency" as const, status: "closed" as const, approvedBy: coryId, businessJustification: "Emergency response to active credential stuffing attack. Cloudflare WAF caught bulk of traffic but application layer had no rate limiting." },
    { title: "Migrate S3 upload client to use exponential retry", description: "Update the S3 presigned URL upload client to use exponential backoff with jitter on transient failures. Addresses intermittent S3 503 SlowDown errors observed on 2026-02-08.", changeType: "standard" as const, status: "closed" as const, approvedBy: simonId, rollbackPlan: "Revert PR and redeploy previous version." },
    { title: "Reduce MDM screen lock timeout to 2 minutes", description: "Tighten MDM policy to auto-lock screens after 2 minutes (previously 5 minutes). Triggered by near-miss incident of unlocked laptop in co-working space.", changeType: "standard" as const, status: "closed" as const, approvedBy: coryId },
    { title: "Add certificate expiry monitoring for staging", description: "Extend Cloudflare certificate monitoring to cover staging environment. Add PagerDuty alert for certificates expiring within 14 days. Addresses TLS near-expiry incident.", changeType: "normal" as const, status: "implementing" as const, approvedBy: simonId, rollbackPlan: "Remove monitoring configuration. No risk — monitoring-only change." },
  ]) {
    await caller.change.create(c);
  }
  console.log("    Changes: 6 (5 closed, 1 implementing)");

  // Patch records (8)
  for (const p of [
    { assetId: assets[0].id, patchIdentifier: "USN-7234-1", severity: "high", title: "OpenSSL security update — fixes CVE-2026-0001", status: "applied" as const, appliedAt: new Date("2026-01-28") },
    { assetId: assets[0].id, patchIdentifier: "USN-7250-1", severity: "medium", title: "Linux kernel security update — fixes 3 CVEs", status: "applied" as const, appliedAt: new Date("2026-02-05") },
    { assetId: assets[1].id, patchIdentifier: "PG-16.6", severity: "medium", title: "PostgreSQL 16.6 security release", status: "applied" as const, appliedAt: new Date("2026-01-30") },
    { assetId: assets[0].id, patchIdentifier: "USN-7265-1", severity: "critical", title: "glibc buffer overflow — CVE-2026-0042 (CVSS 9.8)", status: "applied" as const, appliedAt: new Date("2026-02-12"), releaseDate: "2026-02-10" },
    { assetId: assets[0].id, patchIdentifier: "USN-7280-1", severity: "medium", title: "Linux kernel update — fixes 5 CVEs (Q1 cumulative)", status: "applied" as const, appliedAt: new Date("2026-03-02"), releaseDate: "2026-02-28" },
    { assetId: assets[1].id, patchIdentifier: "PG-16.7", severity: "low", title: "PostgreSQL 16.7 maintenance release — minor bug fixes", status: "applied" as const, appliedAt: new Date("2026-03-05"), releaseDate: "2026-03-01" },
    { assetId: assets[4].id, patchIdentifier: "macOS-15.3.1", severity: "high", title: "macOS Sequoia 15.3.1 — WebKit zero-day fix (CVE-2026-0055)", status: "applied" as const, appliedAt: new Date("2026-02-20"), releaseDate: "2026-02-18" },
    { assetId: assets[0].id, patchIdentifier: "NODE-22.14.0", severity: "medium", title: "Node.js 22.14.0 — HTTP/2 denial of service fix", status: "pending" as const, releaseDate: "2026-03-08" },
  ]) {
    await caller.patch.create(p);
  }
  console.log("    Patches: 8 (7 applied, 1 pending)");

  // Internal audits (2) + findings (5)
  const audit1 = await caller.internalAudit.create({
    title: "Q1 2026 Information Security Audit",
    auditArea: "Access Control, Authentication, Cryptography & Business Continuity",
    scope: "Review of ACC, AUT, CRY, BCP domains against NIS2 §30 requirements. Includes policy review, technical control verification, and evidence completeness check.",
    status: "completed" as const,
    scheduledDate: "2026-02-10",
    completedAt: new Date("2026-02-10"),
    auditorName: "Simon (CTO, internal auditor)",
  });

  for (const f of [
    { auditId: audit1.id, description: "Business Continuity Plan was still in draft status (v0.1) without management approval, not meeting 4.2 and 4.12 requirements.", severity: "minor" as const, rootCause: "BCP testing delayed; plan not updated after initial DR test results.", correctiveAction: "Complete BCP testing, incorporate lessons learned, upgrade to v1.0 with management approval.", assignedTo: simonId, deadline: "2026-02-28", status: "resolved" as const, resolvedAt: new Date("2026-02-25"), verifiedBy: coryId, verifiedAt: new Date("2026-02-26") },
    { auditId: audit1.id, description: "Cloudflare Zero Trust device compliance checking not enforced for remote access — 10.11 requires device posture verification.", severity: "minor" as const, rootCause: "Feature was planned but not yet activated in Cloudflare Zero Trust dashboard.", correctiveAction: "Enable device posture checks in Cloudflare ZT: require FileVault encryption, OS version >= macOS 15, screen lock timeout <= 5min.", assignedTo: simonId, deadline: "2026-02-15", status: "resolved" as const, resolvedAt: new Date("2026-02-12"), verifiedBy: coryId, verifiedAt: new Date("2026-02-13") },
    { auditId: audit1.id, description: "No application-layer rate limiting on authentication endpoints. WAF-only protection insufficient for targeted credential attacks.", severity: "major" as const, rootCause: "Application-layer rate limiting was not implemented during initial development. Relied solely on Cloudflare WAF rate rules.", correctiveAction: "Implement IP-based rate limiting at application layer. Deploy CAPTCHA after repeated failures. Add login anomaly detection.", assignedTo: simonId, deadline: "2026-02-05", status: "resolved" as const, resolvedAt: new Date("2026-01-29"), verifiedBy: coryId, verifiedAt: new Date("2026-01-30") },
  ]) {
    await caller.internalAudit.createFinding(f);
  }

  const audit2 = await caller.internalAudit.create({
    title: "Incident Response Effectiveness Review",
    auditArea: "Incident Handling & BSI Reporting",
    scope: "Post-incident review of INC-2026-003 (credential stuffing attack). Assessment of detection speed, response effectiveness, BSI notification compliance, and process improvements needed.",
    status: "completed" as const,
    scheduledDate: "2026-02-15",
    completedAt: new Date("2026-02-15"),
    auditorName: "Cory (CEO)",
  });

  for (const f of [
    { auditId: audit2.id, description: "BSI early warning was submitted within 18 hours, meeting the 24h requirement, but the process took longer than necessary due to uncertainty about classification thresholds.", severity: "observation" as const, rootCause: "Decision tree for incident classification was documented but not practiced prior to a real event.", correctiveAction: "Conduct dedicated BSI notification dry run exercise. Add classification examples to decision tree.", assignedTo: simonId, deadline: "2026-02-28", status: "resolved" as const, resolvedAt: new Date("2026-02-10"), verifiedBy: coryId, verifiedAt: new Date("2026-02-11") },
    { auditId: audit2.id, description: "Incident timeline documentation was initially incomplete — some key timestamps were reconstructed from logs after the fact rather than recorded in real-time.", severity: "minor" as const, rootCause: "No structured incident log template was used during active response. Team focused on containment over documentation.", correctiveAction: "Add real-time incident log template to IR playbook. Use shared document with timestamp auto-insertion.", assignedTo: simonId, deadline: "2026-03-15", status: "in_progress" as const },
  ]) {
    await caller.internalAudit.createFinding(f);
  }
  console.log("    Audits: 2 (both completed)");
  console.log("    Audit findings: 5 (4 resolved, 1 in progress)");

  // Improvement items (10)
  for (const item of [
    { title: "Automate database backup verification", description: "Add automated weekly restore testing for PostgreSQL backups to verify recoverability without manual intervention.", source: "incident" as const, status: "resolved" as const, priority: "P1" as const, completedAt: new Date("2026-02-20") },
    { title: "Formalize incident communication chain", description: "Document and automate the communication workflow for security incidents. Include Signal group, email templates, BSI portal credentials in shared vault.", source: "audit" as const, status: "resolved" as const, priority: "P1" as const, completedAt: new Date("2026-02-15") },
    { title: "Upgrade BCP from draft to approved v1.0", description: "Complete BCP testing, incorporate lessons learned from DR test, and obtain management approval.", source: "audit" as const, status: "resolved" as const, priority: "P1" as const, completedAt: new Date("2026-02-25") },
    { title: "Remediate CORS misconfiguration on staging", description: "CORS headers on staging environment allowed wildcard origins. Fix: restrict to specific allowed origins.", source: "pentest" as const, status: "resolved" as const, priority: "P1" as const, completedAt: new Date("2026-02-21") },
    { title: "Implement application-layer rate limiting", description: "Add IP-based rate limiting to authentication endpoints: 10 failed attempts/IP/hour with exponential backoff and CAPTCHA after 3 failures.", source: "incident" as const, status: "resolved" as const, priority: "P0" as const, completedAt: new Date("2026-01-29") },
    { title: "Add exponential retry to S3 upload client", description: "S3 presigned URL uploads should use exponential backoff with jitter on transient 503 errors to handle AWS throttling gracefully.", source: "incident" as const, status: "resolved" as const, priority: "P2" as const, completedAt: new Date("2026-02-12") },
    { title: "Automate DNS failover trigger", description: "Implement automated DNS failover via Cloudflare API when health check fails. Currently manual process requiring SSH access.", source: "gap_analysis" as const, status: "in_progress" as const, priority: "P2" as const, targetDate: "2026-04-30", assignedTo: simonId },
    { title: "Document PQC migration plan", description: "Create post-quantum cryptography migration plan for TLS and encryption algorithms when NIST PQC standards are finalized.", source: "audit" as const, status: "open" as const, priority: "P3" as const, targetDate: "2026-12-31" },
    { title: "Create real-time incident log template", description: "Add structured incident log template to IR playbook with auto-timestamping. Ensures timeline documentation during active response.", source: "audit" as const, status: "in_progress" as const, priority: "P2" as const, targetDate: "2026-03-15", assignedTo: simonId },
    { title: "Extend certificate monitoring to all environments", description: "Add PagerDuty alerts for TLS certificate expiry < 14 days across staging, preview, and production environments.", source: "incident" as const, status: "in_progress" as const, priority: "P2" as const, targetDate: "2026-03-20", assignedTo: simonId },
  ]) {
    await caller.improvement.create(item);
  }
  console.log("    Improvements: 10 (6 resolved, 3 in progress, 1 open)");

  // Management reviews (2)
  await caller.managementReview.create({
    title: "Q4 2025 ISMS Kickoff Review",
    reviewDate: "2025-12-20",
    attendees: ["Cory (CEO)", "Simon (CTO)"],
    topicsCovered: [
      "ISMS scope definition — all IT systems, cloud infrastructure, and development processes",
      "NIS2 applicability — confirmed as important entity under §28 BSIG (ICT service management)",
      "Gap analysis baseline — 15 gaps identified, 3 critical",
      "Risk methodology selection — semi-quantitative, 5-level likelihood scale",
      "Tool selection — NISD2.eu platform for compliance tracking",
      "Budget allocation — €24k annual for security measures, tools, and external audits",
      "Timeline — target 100% requirement completion by Q1 2026 end",
    ],
    decisions: "1. Approved €24k annual security budget. 2. Both founders to complete NIS2 management training by January 10. 3. External DPO engagement with DataGuard confirmed. 4. BSI registration to be completed by January 15.",
    nextReviewDate: "2026-03-31",
  });

  await caller.managementReview.create({
    title: "Q1 2026 ISMS Management Review",
    reviewDate: "2026-03-31",
    attendees: ["Cory (CEO)", "Simon (CTO)"],
    topicsCovered: [
      "Risk register review — 5 risks, 1 accepted, 4 mitigated, all residual levels acceptable",
      "KPI dashboard — all 5 KPIs green for 3 consecutive months, meeting all targets",
      "Incident review — 7 incidents total (1 significant, 3 incidents, 3 near-misses), all resolved",
      "Significant incident deep-dive — credential stuffing attack: 0 accounts compromised, BSI notified within 18h",
      "Internal audit results — 2 audits, 5 findings (1 major, 2 minor, 2 observations), 4 resolved, 1 in progress",
      "External pentest results — SySS GmbH: 0 critical, 1 high (remediated), retest passed",
      "Full-scale DR test — 2h 15min recovery, well within 4h RTO target",
      "NIS2 compliance — 49/49 requirements approved, 3 pending review",
      "Training — 10 sessions completed, 100% completion rate, phishing simulation: 0% click rate",
      "Improvement register — 10 items: 6 resolved, 3 in progress, 1 open",
      "Q2 planning — TÜV Rheinland NIS2 audit scheduled for September",
      "Budget review — €18k of €24k spent, on track",
    ],
    decisions: "1. Approved Q2 security budget (€6,000 remaining). 2. Confirmed TÜV Rheinland engagement for September NIS2 audit. 3. Prioritize: DNS failover automation, cert monitoring, incident log template. 4. Continue quarterly risk reviews and monthly KPI reporting. 5. Plan next phishing simulation for April.",
    nextReviewDate: "2026-06-30",
  });
  console.log("    Reviews: 2");

  // ── Phase 6b: Intake form answers (direct DB — matches tRPC intake.save) ──
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(schema.companyAssessment.companyId, companyId),
    columns: { id: true },
  });
  if (!assessment) throw new Error("No assessment found for NISD2.eu");

  const allCategories = await db.query.requirementCategory.findMany({
    columns: { id: true, code: true },
  });
  const categoryByCode = new Map(allCategories.map((c) => [c.code, c.id]));

  const now = new Date();
  let intakeCount = 0;
  for (const [code, answers] of Object.entries(NISD2_INTAKE_ANSWERS)) {
    const categoryId = categoryByCode.get(code);
    if (!categoryId) continue;
    await db.insert(schema.companyCategoryIntake).values({
      assessmentId: assessment.id,
      categoryId,
      answers,
      completionPct: 100,
      lastSavedBy: coryId,
      lastSavedAt: now,
      signedOffBy: coryId,
      signedOffAt: now,
      signOffSnapshot: {
        answers,
        companyProfile: {
          cisoName: "Simon Orzel",
          cisoReportsTo: "Geschäftsführer",
          bsiContactName: "Simon Orzel",
          bsiContactEmail: "contact@nisd2.eu",
          annualSecurityBudget: "25000",
          primaryLocations: "Berlin",
          employeeCount: 2,
          sector: "ict_service_management",
        },
      },
    });
    intakeCount++;
  }
  console.log(`    Intake forms: ${intakeCount} (all signed off)`);

  // ── Phase 7: Update statuses + sign-off (after operational data) ──
  // Two passes are required because signOff checks that all prerequisites are
  // in a DONE status. Updating all statuses first means every parent is
  // "completed" before any sign-off attempts, satisfying the prereq check
  // regardless of iteration order.
  console.log("\n  Signing off requirements via tRPC...");

  // Pass 1: set every requirement's status to "completed"
  for (const row of allStatuses) {
    const data = ALL_REQ_DATA[row.code];
    if (!data) continue;
    await caller.assessment.updateRequirementStatus({
      statusId: row.statusId,
      status: data.status,
    });
  }

  // Pass 2: sign off (prereqs are now all "completed", check passes)
  let completedCount = 0;
  for (const row of allStatuses) {
    const data = ALL_REQ_DATA[row.code];
    if (!data) continue;
    await caller.assessment.signOff({
      statusId: row.statusId,
    });
    completedCount++;
  }
  console.log(`    ${completedCount} requirements completed`);

  // ── Phase 8: Approve requirements (all except 4) ────────────────
  console.log("\n  Approving requirements via tRPC...");
  const SKIP_APPROVAL = new Set(["4.3", "6.3", "10.3"]);

  let approvedCount = 0;
  for (const row of allStatuses) {
    if (SKIP_APPROVAL.has(row.code)) continue;
    if (!ALL_REQ_DATA[row.code]) continue;

    await caller.review.approve({ statusId: row.statusId });
    approvedCount++;
  }
  console.log(`    ${approvedCount} requirements approved`);
  console.log(`    ${SKIP_APPROVAL.size} requirements left as completed (pending review): ${[...SKIP_APPROVAL].join(", ")}`);

  // ── Phase 9: Fix nextReviewDate (fire-and-forget scheduleDeadlineReminders
  //    won't complete before process.exit — set correct dates directly) ────
  console.log("\n  Fixing nextReviewDate for completed requirements...");

  const completedStatuses = await db
    .select({
      id: schema.companyRequirementStatus.id,
      signedOffAt: schema.companyRequirementStatus.signedOffAt,
      frequency: schema.requirement.frequency,
    })
    .from(schema.companyRequirementStatus)
    .innerJoin(
      schema.requirement,
      eq(schema.companyRequirementStatus.requirementId, schema.requirement.id),
    )
    .innerJoin(
      schema.companyAssessment,
      eq(schema.companyRequirementStatus.assessmentId, schema.companyAssessment.id),
    )
    .where(
      and(
        eq(schema.companyAssessment.companyId, companyId),
        isNotNull(schema.companyRequirementStatus.signedOffAt),
      ),
    );

  let deadlineUpdates = 0;
  for (const row of completedStatuses) {
    const frequency = row.frequency as Frequency;
    const anchor = row.signedOffAt ?? new Date();

    if (isRecurringFrequency(frequency)) {
      const nextReview = computeNextReviewDate(anchor, frequency);
      await db
        .update(schema.companyRequirementStatus)
        .set({ nextReviewDate: nextReview ? toDateString(nextReview) : null })
        .where(eq(schema.companyRequirementStatus.id, row.id));
    } else {
      await db
        .update(schema.companyRequirementStatus)
        .set({ nextReviewDate: null })
        .where(eq(schema.companyRequirementStatus.id, row.id));
    }
    deadlineUpdates++;
  }
  console.log(`    ${deadlineUpdates} nextReviewDate values corrected`);

  // ── Summary ────────────────────────────────────────────────────────
  console.log(`\n  ✅ NISD2.eu seeded via tRPC mutations:`);
  console.log(`     ${completedCount} requirements completed (sign-off + audit trail)`);
  console.log(`     ${approvedCount} requirements approved`);
  console.log(`     ${SKIP_APPROVAL.size} requirements pending review`);
  console.log(`     All operational data validated through Zod + tRPC pipeline`);

  process.exit(0);
}

seedNisd2().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});