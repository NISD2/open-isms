/**
 * BSI-Aligned Category Intake Schemas
 *
 * One Zod schema per NIS2 category (~12-18 fields each).
 * These feed into SchemaForm — no new form infrastructure needed.
 *
 * Design principles:
 *   - Ask for SPECIFIC, AUDITABLE data — not vague booleans
 *   - Tool names, dates, percentages, SLA values > "do you have this? yes/no"
 *   - Company profile fields (CISO, budget, BSI contact) come from setup
 *   - Operational module counts (assets, risks, incidents) are derived
 *   - Fields ending in Uploaded/Documented/Published → file upload UI (via introspector convention)
 */
import { z } from "zod";

// ============================================================================
// GOV — Governance & Liability (§38 BSIG)
// ============================================================================

export const GOV_SCHEMA = z.object({
  // 1.1 Management Training
  managementTrainingProvider: z.string().max(255).describe("Training provider (e.g., SANS, BSI Akademie, internal)"),
  lastManagementTraining: z.coerce.date().describe("Date of last management cybersecurity training"),
  // 1.2 Roles & Responsibilities → module-backed (team page)
  // 1.3 Budget
  annualSecurityBudget: z.string().max(100).describe("Annual cybersecurity budget in EUR"),
  budgetApprovalDate: z.coerce.date().describe("Budget approval date by Geschäftsführung"),
  // 1.4 Personal Liability
  liabilityAcknowledged: z.boolean().describe("Management acknowledges personal liability (§38 BSIG)"),
});

// ============================================================================
// RSK — Risk Management (§30(2) Nr. 1 BSIG / Art. 21(2)(a) NIS2)
// ============================================================================

export const RSK_SCHEMA = z.object({
  // 2.1 Risk Assessment Methodology → dedicated methodology config (company_risk_methodology table)
  // 2.2 Asset Inventory → platform asset module (custom editor)
  classificationLevels: z.enum(["2_levels", "3_levels", "4_levels"]).describe("Data classification levels (BSI: Normal/Hoch/Sehr Hoch)"),
  // 2.3 Risk Register → platform risk module (custom editor)
  // 2.4 Risk Acceptance & IS Policy Sign-Off (CIR 1.1, CIR 2.1.1, §38(1) BSIG)
  residualRiskCount: z.number().int().min(0).describe("Number of risks formally accepted by management"),
  policyVersion: z.string().max(50).describe("IS policy version (e.g., v1.0)"),
  policyApprovalDate: z.coerce.date().describe("IS policy management approval date"),
});

// ============================================================================
// INC — Incident Handling (§32 BSIG)
// ============================================================================

export const INC_SCHEMA = z.object({
  incidentLead: z.string().max(255).describe("Incident response lead / IRT coordinator"),
  irtTeamSize: z.number().int().min(1).describe("Incident response team size"),
  classificationScheme: z.enum(["bsi", "enisa", "custom"]).describe("Incident classification scheme"),
  earlyWarningSlaHours: z.number().int().min(1).describe("Early warning SLA to BSI (hours, max 24 per §32)"),
  bsiReportingRegistered: z.boolean().describe("BSI reporting contact is registered (§33 BSIG)"),
  lastDrillDate: z.coerce.date().optional().describe("Date of last incident response drill"),
  drillType: z.enum(["tabletop", "functional", "full_scale"]).optional().describe("Type of last drill conducted"),
  secureCommsChannel: z.string().max(255).describe("Secure out-of-band communication channel"),
  detectionTools: z.string().max(500).describe("Detection tools deployed (e.g., SIEM, EDR, NDR)"),
  incidentEscalationContacts: z.string().max(500).describe("Escalation contacts by severity level (e.g., P1: CISO, P2: IT Lead)"),
  postIncidentReviewOwner: z.string().max(255).describe("Post-incident review owner (e.g., 'CISO' or 'IT Security Lead')"),
  significantIncidentCriteria: z.string().max(500).describe("Criteria for significant incidents (user threshold, downtime, data scope)"),
});

// ============================================================================
// BCP — Business Continuity (§30(1) Nr. 3 BSIG)
// ============================================================================

export const BCP_SCHEMA = z.object({
  biaCompletionDate: z.coerce.date().describe("Date BIA was last completed"),
  criticalProcessCount: z.number().int().min(0).describe("Number of critical business processes identified"),
  rpoTargetHours: z.number().min(0).describe("RPO target for critical systems (hours)"),
  rtoTargetHours: z.number().min(0).describe("RTO target for critical systems (hours)"),
  backupFrequency: z.enum(["real_time", "hourly", "daily", "weekly"]).describe("Backup frequency for critical systems"),
  backupEncryption: z.string().max(255).describe("Backup encryption method (e.g., AES-256, platform-native, none)"),
  lastBackupTest: z.coerce.date().optional().describe("Date of last backup restore test"),
  backupRestoreSuccessRate: z.number().int().min(0).max(100).optional().describe("Last backup restore success rate (%)"),
  lastBcpTest: z.coerce.date().optional().describe("Date of last BCP/DR test exercise"),
  crisisTeamLead: z.string().max(255).describe("Crisis management team lead"),
  bcpActivationCriteria: z.string().max(500).describe("Criteria that trigger BCP activation (e.g., >4h outage, site inaccessible)"),
});

// ============================================================================
// SUP — Supply Chain Security (§30(1) Nr. 4 BSIG)
// ============================================================================

export const SUP_SCHEMA = z.object({
  // 5.1 Supplier Register → platform supplier module (moduleRef)
  // 5.2 Contract & monitoring → per-supplier fields on supplier table (moduleRef: "supplier")
  incidentNotificationSlaHours: z.number().int().min(1).describe("Default supplier incident notification SLA (hours)"),
  singlePointOfFailureCount: z.number().int().min(0).describe("Number of supply chain single points of failure identified"),
});

// ============================================================================
// PRO — Procurement & Development (§30(1) Nr. 5 BSIG)
// ============================================================================

export const PRO_SCHEMA = z.object({
  // 6.1 → procurement policy config editor (company_policy_config table)
  // 6.2 → secure dev policy config editor (company_policy_config table)
  // 6.4 → patch policy config editor (company_policy_config table)
  vulnerabilityScanningFrequency: z.enum(["continuous", "weekly", "monthly", "quarterly"]).describe("Vulnerability scanning frequency"),
  vulnerabilityScanTool: z.string().max(255).describe("Vulnerability scanning tool (e.g., Qualys, Nessus, OpenVAS)"),
  lastPentestDate: z.coerce.date().optional().describe("Date of last penetration test"),
  vulnerabilityDisclosureUrl: z.string().max(500).optional().describe("Coordinated vulnerability disclosure policy URL (CIR 6(10), NIS2 Art. 12)"),
  changeManagementTool: z.string().max(255).describe("Change management tool (e.g., Jira, ServiceNow, manual CAB)"),
});

// ============================================================================
// EFF — Effectiveness Assessment (§30(1) Nr. 6 BSIG)
// ============================================================================

export const EFF_SCHEMA = z.object({
  kpisDefinedCount: z.number().int().min(0).describe("Number of cybersecurity KPIs/metrics defined"),
  kpiDashboardTool: z.string().max(255).describe("KPI dashboard/reporting tool"),
  auditFrequency: z.enum(["quarterly", "semi_annual", "annual"]).describe("Internal audit frequency"),
  lastAuditDate: z.coerce.date().optional().describe("Date of last completed internal audit"),
  lastManagementReview: z.coerce.date().optional().describe("Date of last management review of security effectiveness"),
  correctiveActionTool: z.string().max(255).describe("Corrective action tracking tool (e.g., Jira, platform module, spreadsheet)"),
  openCorrectiveActions: z.number().int().min(0).describe("Number of open corrective actions"),
  avgClosureTimeDays: z.number().int().min(0).describe("Average corrective action closure time (days)"),
  trendAnalysisTool: z.string().max(255).describe("Trend analysis tool/method (e.g., Grafana dashboards, quarterly Excel report, SIEM trends)"),
  managementReviewReportUploaded: z.string().max(255).optional().describe("Management review report uploaded"),
});

// ============================================================================
// TRN — Cyber Hygiene & Training (§30(1) Nr. 7 BSIG)
// ============================================================================

export const TRN_SCHEMA = z.object({
  itSecurityPolicyPublished: z.string().max(255).optional().describe("IT Security Policy published and acknowledged by all employees (CIR 8.1)"),
  trainingPlatform: z.string().max(255).describe("Awareness training platform (e.g., KnowBe4, Proofpoint, SoSafe)"),
  trainingFrequency: z.enum(["quarterly", "semi_annual", "annual"]).describe("General awareness training frequency"),
  trainingCompletionRate: z.number().int().min(0).max(100).describe("Training completion rate across all employees (%)"),
  lastTrainingDate: z.coerce.date().optional().describe("Date of last awareness training session"),
  roleSpecificTrainingProvider: z.string().max(255).describe("Role-specific training provider (e.g., SANS, Offensive Security, internal)"),
  phishingSimFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).describe("Phishing simulation frequency"),
  lastPhishingTest: z.coerce.date().optional().describe("Date of last phishing simulation"),
  phishingClickRate: z.number().min(0).max(100).optional().describe("Last phishing simulation click rate (%)"),
  newEmployeeOnboarding: z.string().max(1000).optional().describe("Security onboarding process for new employees"),
});

// ============================================================================
// CRY — Cryptography & Encryption (§30(1) Nr. 8 BSIG)
// ============================================================================

export const CRY_SCHEMA = z.object({
  // 9.1 → crypto policy config editor (company_policy_config table)
  // 9.2 → asset enrichment (encryptionAtRest, encryptionInTransit, cryptoImplementation per asset)
  // 9.3 — key & certificate management (company-level tooling)
  keyManagementTool: z.string().max(255).describe("Key management system (e.g., HashiCorp Vault, AWS KMS, HSM)"),
  certificateMonitoringTool: z.string().max(255).describe("Certificate monitoring tool (e.g., Venafi, cert-manager, manual)"),
  certExpiryAlertDays: z.number().int().min(1).describe("Certificate expiry alert threshold (days before expiry)"),
});

// ============================================================================
// ACC — Access Control & HR Security (§30(1) Nr. 9 BSIG)
// ============================================================================

export const ACC_SCHEMA = z.object({
  // 10.1 → access control policy config editor (company_policy_config table)
  // 10.2 → per-asset access assignment (AccessItemRows — owner, access method, priv accounts)
  // 10.3 — User lifecycle & PAM (intake-only)
  jmlTool: z.string().max(255).describe("Joiners-Movers-Leavers process tool (e.g., Entra ID lifecycle, ticketing, manual HR checklist)"),
  backgroundCheckScope: z.string().max(255).describe("Background check scope (e.g., all employees, security/admin roles only, management)"),
  pamTool: z.string().max(255).describe("PAM tool (e.g., CyberArk, BeyondTrust, Teleport, manual)"),
  // 10.4 — Access reviews (proof)
  lastAccessReviewDate: z.coerce.date().optional().describe("Date of last user access review"),
});

// ============================================================================
// AUT — Authentication & Communications (§30(1) Nr. 10 BSIG)
// ============================================================================

export const AUT_SCHEMA = z.object({
  mfaTool: z.string().max(255).describe("MFA solution (e.g., Microsoft Authenticator, YubiKey, Duo)"),
  mfaMethods: z.string().max(255).describe("MFA methods deployed (e.g., TOTP, FIDO2, push notification)"),
  mfaCoverage: z.enum(["critical_only", "remote_access", "all_users", "all_systems"]).describe("MFA coverage scope"),
  mfaCoveragePct: z.number().int().min(0).max(100).describe("MFA deployment coverage (%)"),
  adminMfaEnforced: z.boolean().describe("MFA enforced for all admin/privileged accounts"),
  secureCommsTools: z.string().max(500).describe("Secure communication tools (e.g., Signal, MS Teams E2EE, Wire)"),
  emergencyCommsChannel: z.string().max(255).describe("Emergency out-of-band communication channel"),
  lastEmergencyCommsTest: z.coerce.date().optional().describe("Date of last emergency communication test"),
  ssoTool: z.string().max(255).optional().describe("SSO / identity provider (e.g., Entra ID, Okta, Keycloak)"),
  passwordMinLength: z.number().int().min(8).describe("Minimum password length"),
  sessionTimeoutMinutes: z.number().int().min(1).describe("Session idle timeout (minutes)"),
});

// ============================================================================
// REG — Registration & Reporting (§33, §34, §39 BSIG)
// ============================================================================

export const REG_SCHEMA = z.object({
  entityClassification: z.enum(["essential", "important"]).describe("NIS2 entity classification"),
  applicableSectors: z.string().max(500).describe("Applicable NIS2 sectors (e.g., Energy, Digital Infrastructure)"),
  mukAccountId: z.string().max(100).describe("BSI MUK account ID"),
  bsiRegistrationDate: z.coerce.date().describe("Date of BSI portal registration (§33)"),
  contactPersonName: z.string().max(255).describe("BSI contact person name (§33(1) Nr. 6)"),
  contactPersonEmail: z.string().max(255).describe("BSI contact person email"),
  lastRegistrationUpdate: z.coerce.date().optional().describe("Date of last registration data update"),
  nextRegistrationUpdate: z.coerce.date().optional().describe("Date of next scheduled registration update"),
  informationSharingCompliant: z.string().max(1000).optional().describe("How you comply with §34 information sharing obligations"),
  registrationProofUploaded: z.string().max(255).optional().describe("BSI registration confirmation uploaded"),
  correspondenceLogUploaded: z.string().max(255).optional().describe("Regulatory correspondence log uploaded"),
});

// ============================================================================
// Schema Registry — lookup by category code
// ============================================================================

export const CATEGORY_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  GOV: GOV_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  RSK: RSK_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  INC: INC_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  BCP: BCP_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  SUP: SUP_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  PRO: PRO_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  EFF: EFF_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  TRN: TRN_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  CRY: CRY_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  ACC: ACC_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  AUT: AUT_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
  REG: REG_SCHEMA as unknown as z.ZodObject<z.ZodRawShape>,
};

// ============================================================================
// Field → Requirement Mapping
//
// Maps each intake field to the requirement codes it satisfies.
// Used to auto-derive companyRequirementStatus when intake is submitted.
// ============================================================================

export const CATEGORY_FIELD_MAPPING: Record<string, Record<string, string[]>> = {
  GOV: {
    managementTrainingProvider: ["1.1"],
    lastManagementTraining: ["1.1"],
    // 1.2 → module-backed (team page)
    annualSecurityBudget: ["1.3"],
    budgetApprovalDate: ["1.3"],
    liabilityAcknowledged: ["1.4"],
  },
  RSK: {
    // 2.1 → methodology config editor, 2.2 → asset module, 2.3 → risk register editor
    classificationLevels: ["2.2"],
    residualRiskCount: ["2.4"],
    policyVersion: ["2.4"],
    policyApprovalDate: ["2.4"],
  },
  INC: {
    incidentLead: ["3.1"], irtTeamSize: ["3.1"],
    classificationScheme: ["3.2"],
    earlyWarningSlaHours: ["3.3"], bsiReportingRegistered: ["3.3"],
    lastDrillDate: ["3.4"], drillType: ["3.4"],
    secureCommsChannel: ["3.1"],
    detectionTools: ["3.2"],
    incidentEscalationContacts: ["3.1"],
    postIncidentReviewOwner: ["3.5"],
    significantIncidentCriteria: ["3.2"],
  },
  BCP: {
    biaCompletionDate: ["4.1"], criticalProcessCount: ["4.1"],
    rpoTargetHours: ["4.1"], rtoTargetHours: ["4.1"],
    backupFrequency: ["4.4"], backupEncryption: ["4.4"],
    lastBackupTest: ["4.4"], backupRestoreSuccessRate: ["4.4"],
    lastBcpTest: ["4.5"],
    crisisTeamLead: ["4.2"], bcpActivationCriteria: ["4.2"],
  },
  SUP: {
    // 5.1 → supplier module (moduleRef)
    // 5.2 → supplier module with focus fields (moduleRef: "supplier")
    // 5.3 → supplier risk register editor
    incidentNotificationSlaHours: ["5.4"],
    singlePointOfFailureCount: ["5.1"],
  },
  PRO: {
    // 6.1 → procurement policy config editor
    // 6.2 → secure dev policy config editor
    // 6.4 → patch policy config editor
    vulnerabilityScanningFrequency: ["6.3"], vulnerabilityScanTool: ["6.3"],
    lastPentestDate: ["6.3"], vulnerabilityDisclosureUrl: ["6.3"],
    changeManagementTool: ["6.5"],
  },
  EFF: {
    kpisDefinedCount: ["7.1"], kpiDashboardTool: ["7.1"],
    auditFrequency: ["7.2"], lastAuditDate: ["7.2"],
    lastManagementReview: ["7.3"],
    correctiveActionTool: ["7.4"],
    openCorrectiveActions: ["7.4"], avgClosureTimeDays: ["7.4"],
    trendAnalysisTool: ["7.1"],
    managementReviewReportUploaded: ["7.3"],
  },
  TRN: {
    itSecurityPolicyPublished: ["8.1"],
    trainingPlatform: ["8.2"], trainingFrequency: ["8.2"],
    trainingCompletionRate: ["8.2"], lastTrainingDate: ["8.2"],
    roleSpecificTrainingProvider: ["8.3"],
    phishingSimFrequency: ["8.4"], lastPhishingTest: ["8.4"],
    phishingClickRate: ["8.4"],
    newEmployeeOnboarding: ["8.2"],
  },
  CRY: {
    // 9.1 → crypto policy config editor
    // 9.2 → asset enrichment (per-asset crypto fields, no intake fields)
    keyManagementTool: ["9.3"],
    certificateMonitoringTool: ["9.3"], certExpiryAlertDays: ["9.3"],
  },
  ACC: {
    // 10.1 → access control policy config editor
    // 10.2 → per-asset access assignment (AccessItemRows — no intake fields)
    jmlTool: ["10.3"], backgroundCheckScope: ["10.3"], pamTool: ["10.3"],
    lastAccessReviewDate: ["10.4"],
  },
  AUT: {
    mfaTool: ["11.1"], mfaMethods: ["11.1"],
    mfaCoverage: ["11.1"], mfaCoveragePct: ["11.1"],
    adminMfaEnforced: ["11.1"],
    secureCommsTools: ["11.2"], emergencyCommsChannel: ["11.2"],
    lastEmergencyCommsTest: ["11.2"],
    ssoTool: ["11.3"], passwordMinLength: ["11.3"],
    sessionTimeoutMinutes: ["11.3"],
  },
  REG: {
    entityClassification: ["12.1"], applicableSectors: ["12.1"],
    mukAccountId: ["12.2"], bsiRegistrationDate: ["12.2"],
    contactPersonName: ["12.3"], contactPersonEmail: ["12.3"],
    lastRegistrationUpdate: ["12.3"], nextRegistrationUpdate: ["12.3"],
    informationSharingCompliant: ["12.4"],
    registrationProofUploaded: ["12.2"],
    correspondenceLogUploaded: ["12.4"],
  },
};
