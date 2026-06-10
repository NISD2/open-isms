/**
 * Seed intake form answers for Dev GmbH (500-employee energy company).
 *
 * Each key is a category code. Values match the Zod schemas in
 * lib/compliance/category-schemas.ts.
 *
 * All data is specific and auditable — tool names, dates, metrics,
 * configuration values. No vague booleans without substance.
 */

export const SEED_INTAKE_ANSWERS: Record<string, Record<string, unknown>> = {
  GOV: {
    // 1.1 Management Training
    managementTrainingProvider: "BSI Akademie — Cyber-Sicherheit für Führungskräfte",
    lastManagementTraining: "2025-09-20",
    // 1.2 Roles & Responsibilities → module-backed (team page)
    // 1.3 Budget
    annualSecurityBudget: "2400000",
    budgetApprovalDate: "2025-02-01",
    // 1.4 Personal Liability
    liabilityAcknowledged: true,
  },
  RSK: {
    // 2.1 Methodology → dedicated config editor
    // 2.2 Assets → platform asset module (custom editor)
    classificationLevels: "4_levels",
    // 2.3 Risk Register → platform risk module (custom editor)
    // 2.4 Risk Acceptance & IS Policy Sign-Off
    residualRiskCount: 21,
    policyVersion: "v3.2",
    policyApprovalDate: "2025-01-20",
  },
  INC: {
    incidentLead: "Thomas Weber, Head of IT Security",
    irtTeamSize: 6,
    classificationScheme: "bsi",
    earlyWarningSlaHours: 24,
    bsiReportingRegistered: true,
    lastDrillDate: "2025-12-05",
    drillType: "tabletop",
    secureCommsChannel: "Signal Business + satellite phone for crisis team",
    detectionTools: "Splunk SIEM, CrowdStrike Falcon EDR, Darktrace NDR",
    incidentEscalationContacts: "P1: CISO (T. Weber), P2: IT Lead (M. Schmidt), P3: On-call engineer",
    postIncidentReviewOwner: "Thomas Weber, Head of IT Security",
    significantIncidentCriteria: ">500 users affected, >4h downtime, or personal data of >1000 subjects",
  },
  BCP: {
    biaCompletionDate: "2025-06-15",
    criticalProcessCount: 12,
    rpoTargetHours: 4,
    rtoTargetHours: 8,
    backupFrequency: "daily",
    backupEncryption: "AES-256 (Veeam + AWS S3 SSE-KMS)",
    lastBackupTest: "2025-11-10",
    backupRestoreSuccessRate: 98,
    lastBcpTest: "2025-08-22",
    crisisTeamLead: "Anna Bergmann (CFO), deputy: Thomas Weber (CISO)",
    bcpActivationCriteria: ">4h critical system outage, site inaccessible, or ransomware confirmed",
  },
  SUP: {
    // 5.1 Supplier Register → platform supplier module (moduleRef)
    // 5.2 Contract & monitoring → per-supplier fields on supplier table (moduleRef: "supplier")
    // 5.3 Supplier Risk Assessment → custom editor
    incidentNotificationSlaHours: 24,
    singlePointOfFailureCount: 3,
  },
  PRO: {
    // 6.1 → procurement policy config editor
    // 6.2 → secure dev policy config editor
    // 6.4 → patch policy config editor
    vulnerabilityScanningFrequency: "weekly",
    vulnerabilityScanTool: "Qualys VMDR + Snyk for dependencies",
    lastPentestDate: "2025-09-15",
    changeManagementTool: "Jira Service Management",
  },
  EFF: {
    kpisDefinedCount: 8,
    kpiDashboardTool: "Grafana dashboards fed from Splunk + platform metrics",
    auditFrequency: "annual",
    lastAuditDate: "2025-10-20",
    lastManagementReview: "2025-12-01",
    correctiveActionTool: "Jira (dedicated corrective action board with SLA tracking)",
    openCorrectiveActions: 3,
    avgClosureTimeDays: 45,
    trendAnalysisTool: "Grafana dashboards (quarterly incident/vulnerability trends from Splunk)",
    managementReviewReportUploaded: "management-review-2025-Q4.pdf",
  },
  TRN: {
    itSecurityPolicyPublished: "it-security-policy-v2.1.pdf",
[redacted for public release]
    trainingFrequency: "annual",
    trainingCompletionRate: 94,
    lastTrainingDate: "2025-10-30",
    roleSpecificTrainingProvider: "SANS Institute (SEC504, SEC560) + internal workshops",
    phishingSimFrequency: "quarterly",
    lastPhishingTest: "2025-11-18",
    phishingClickRate: 4.2,
    newEmployeeOnboarding: "Day-1 security briefing covering acceptable use policy, phishing awareness, password policy, and incident reporting. Signed acknowledgment required before system access.",
  },
  CRY: {
    // 9.1 → crypto policy config editor
    // 9.2 → per-asset enrichment (no intake fields)
    // 9.3 — company-level key & certificate management
    keyManagementTool: "HashiCorp Vault (on-prem) + AWS KMS (cloud workloads)",
    certificateMonitoringTool: "cert-manager (K8s) + Venafi (external certs)",
    certExpiryAlertDays: 30,
  },
  ACC: {
    // 10.1 → access control policy config editor
    accessReviewFrequency: "quarterly",
    lastAccessReviewDate: "2025-12-15",
    privilegedAccountCount: 23,
    pamTool: "CyberArk Privilege Cloud",
    deprovisioningSlaHours: 24,
    jmlTool: "Entra ID lifecycle workflows + ServiceNow HR integration",
    backgroundCheckScope: "All employees (basic) + enhanced checks for admin/security roles",
  },
  AUT: {
    mfaTool: "Microsoft Authenticator + YubiKey 5 (admins)",
    mfaMethods: "TOTP, FIDO2 (YubiKey for admins), push notification",
    mfaCoverage: "all_users",
    mfaCoveragePct: 99,
    adminMfaEnforced: true,
    secureCommsTools: "MS Teams with E2EE, Signal Business, encrypted email (S/MIME)",
    emergencyCommsChannel: "Satellite phone + encrypted radio for crisis team",
    lastEmergencyCommsTest: "2025-11-01",
    ssoTool: "Microsoft Entra ID (SAML/OIDC)",
    passwordMinLength: 14,
    sessionTimeoutMinutes: 30,
  },
  REG: {
    entityClassification: "essential",
    applicableSectors: "Energy (Annex I, Nr. 1)",
    mukAccountId: "MUK-2025-DEV-0042",
    bsiRegistrationDate: "2025-08-15",
    contactPersonName: "Max Mustermann, CISO",
    contactPersonEmail: "ciso@dev-gmbh.example.com",
    lastRegistrationUpdate: "2025-12-01",
    nextRegistrationUpdate: "2026-12-01",
    informationSharingCompliant: "Subscribed to BSI CERT-Bund advisories and sector-specific ISAC. Incident reports shared per §32 timelines. Annual participation in BSI cyber security situation report.",
    registrationProofUploaded: "bsi-registration-confirmation-2025.pdf",
    correspondenceLogUploaded: "bsi-correspondence-log-2025.xlsx",
  },
};
