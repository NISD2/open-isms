/**
 * Persona: Stadtwerk Musterstadt GmbH — the "large company, different data"
 * dataset for the e2e journey. Deliberately unlike the seeded Dev GmbH
 * (energy essential, 500 employees, Munich, ISO 27001, Microsoft stack):
 * a municipal multi-utility (electricity, gas, district heating, water),
 * ~1,200 employees, OT-heavy, mixed tooling, no prior certification.
 *
 * Shape matches drizzle/seed-company-data.ts: requirement code → intake
 * field values. Field names are the CATEGORY_FIELD_MAPPING keys; the L0
 * drift tests fail this file the moment a schema renames or retypes one.
 * Dates are ISO strings (the intake schemas use z.coerce.date()).
 */

export const STADTWERK_PROFILE = {
  name: "Stadtwerk Musterstadt GmbH",
  sector: "energy",
  entityType: "essential" as const,
  employeeCount: 1200,
  city: "Musterstadt",
} as const;

export const STADTWERK_INTAKE: Record<string, Record<string, unknown>> = {
  // GOV — Governance & Liability
  "1.1": {
    managementTrainingProvider: "VKU Akademie, Praesenzschulung Kritische Infrastrukturen",
    lastManagementTraining: "2026-05-12",
  },
  "1.3": {
    annualSecurityBudget: "1850000",
    budgetApprovalDate: "2026-01-20",
  },
  "1.4": {
    liabilityAcknowledged: true,
  },

  // RSK — Risk Management
  "2.2": {
    classificationLevels: "3_levels",
  },
  "2.4": {
    residualRiskCount: 7,
    policyVersion: "v2.1",
    policyApprovalDate: "2026-02-14",
  },

  // INC — Incident Handling
  "3.1": {
    incidentLead: "Leiterin Netzleitstelle (stellv. CISO)",
    irtTeamSize: 9,
    secureCommsChannel: "TETRA Digitalfunk plus Threema Work",
    incidentEscalationContacts: "P1: Geschaeftsfuehrung und CISO, P2: IT-Leitung, P3: Schichtleiter Leitstelle",
  },
  "3.2": {
    classificationScheme: "bsi",
    detectionTools: "Elastic SIEM, Claroty OT-Monitoring, Defender for Endpoint",
    significantIncidentCriteria: "Versorgungsunterbrechung ueber 10.000 Haushalte, Leitstellenausfall ueber 30 Minuten, Abfluss personenbezogener Daten",
  },
  "3.3": {
    earlyWarningSlaHours: 20,
    bsiReportingRegistered: true,
  },
  "3.4": {
    lastDrillDate: "2026-04-22",
    drillType: "functional",
  },
  "3.5": {
    postIncidentReviewOwner: "CISO mit Bericht an die Geschaeftsfuehrung",
  },

  // BCP — Business Continuity
  "4.1": {
    biaCompletionDate: "2026-03-01",
    criticalProcessCount: 14,
    rpoTargetHours: 2,
    rtoTargetHours: 8,
  },
  "4.2": {
    crisisTeamLead: "Technischer Geschaeftsfuehrer",
    bcpActivationCriteria: "Leitstellenausfall, Ausfall Fernwirktechnik, Cyberangriff mit OT-Bezug, Hochwasserlage",
  },
  "4.4": {
    backupFrequency: "hourly",
    backupEncryption: "AES-256, Veeam mit Immutable Repository",
    lastBackupTest: "2026-06-10",
    backupRestoreSuccessRate: 98,
  },
  "4.5": {
    lastBcpTest: "2026-05-28",
  },

  // SUP — Supply Chain
  "5.1": {
    singlePointOfFailureCount: 3,
  },
  "5.4": {
    incidentNotificationSlaHours: 24,
  },

  // PRO — Procurement & Development
  "6.3": {
    vulnerabilityScanningFrequency: "weekly",
    vulnerabilityScanTool: "Greenbone OpenVAS, Claroty fuer OT-Segmente",
    lastPentestDate: "2025-11-18",
    vulnerabilityDisclosureUrl: "https://www.stadtwerk-musterstadt.example/security",
  },
  "6.5": {
    changeManagementTool: "Jira Service Management mit CAB-Freigabe",
  },

  // EFF — Effectiveness
  "7.1": {
    kpisDefinedCount: 12,
    kpiDashboardTool: "Grafana auf Elastic-Datenbasis",
    trendAnalysisTool: "Quartalsbericht aus Grafana und SIEM-Trends",
  },
  "7.2": {
    auditFrequency: "annual",
    lastAuditDate: "2026-01-30",
  },
  "7.3": {
    lastManagementReview: "2026-02-27",
    managementReviewReportUploaded: "management-review-2026-q1.pdf",
  },
  "7.4": {
    correctiveActionTool: "Plattformmodul Verbesserungen",
    openCorrectiveActions: 5,
    avgClosureTimeDays: 21,
  },

  // TRN — Training & Cyber Hygiene
  "8.1": {
    itSecurityPolicyPublished: "it-sicherheitsleitlinie-v2.pdf",
  },
  "8.2": {
    trainingPlatform: "SoSafe",
    trainingFrequency: "semi_annual",
    trainingCompletionRate: 91,
    lastTrainingDate: "2026-06-02",
    newEmployeeOnboarding: "Sicherheitsunterweisung am ersten Arbeitstag, E-Learning-Pflichtmodul in Woche eins, Leitstellenpersonal zusaetzlich OT-Einweisung",
  },
  "8.3": {
    roleSpecificTrainingProvider: "SANS fuer IT-Security, VDE-Schulungen fuer Leitstellenpersonal",
  },
  "8.4": {
    phishingSimFrequency: "quarterly",
    lastPhishingTest: "2026-06-18",
    phishingClickRate: 6,
  },

  // CRY — Cryptography
  "9.3": {
    keyManagementTool: "HashiCorp Vault, HSM fuer Fernwirktechnik-Zertifikate",
    certificateMonitoringTool: "cert-manager plus manuelles Register fuer OT-Zertifikate",
    certExpiryAlertDays: 30,
  },

  // ACC — Access Control & HR
  "10.3": {
    jmlTool: "Entra ID Lifecycle mit HR-Anbindung an P und I",
    backgroundCheckScope: "Leitstellen- und Administratorenrollen, SUeG-Pruefung fuer KRITIS-Personal",
    pamTool: "Teleport fuer IT, dedizierte Sprungserver fuer OT",
  },
  "10.4": {
    lastAccessReviewDate: "2026-04-05",
  },

  // AUT — Authentication & Communications
  "11.1": {
    mfaTool: "Microsoft Authenticator, YubiKey fuer Administratoren",
    mfaMethods: "FIDO2, TOTP, Push",
    mfaCoverage: "all_users",
    mfaCoveragePct: 97,
    adminMfaEnforced: true,
  },
  "11.2": {
    secureCommsTools: "Threema Work, TETRA Digitalfunk",
    emergencyCommsChannel: "TETRA Digitalfunk mit Papier-Alarmierungsliste",
    lastEmergencyCommsTest: "2026-05-15",
  },
  "11.3": {
    ssoTool: "Entra ID",
    passwordMinLength: 14,
    sessionTimeoutMinutes: 15,
  },

  // REG — Registration & Reporting
  "12.1": {
    entityClassification: "essential",
    applicableSectors: "Energie (Strom, Gas, Fernwaerme), Trinkwasser, Abwasser",
  },
  "12.2": {
    mukAccountId: "MUK-SW-MUSTERSTADT-0042",
    bsiRegistrationDate: "2026-02-10",
    registrationProofUploaded: "bsi-registrierung-bestaetigung.pdf",
  },
  "12.3": {
    contactPersonName: "Informationssicherheitsbeauftragte",
    contactPersonEmail: "e2e-isb@nis2.local",
    lastRegistrationUpdate: "2026-06-01",
    nextRegistrationUpdate: "2027-06-01",
  },
  "12.4": {
    informationSharingCompliant: "Teilnahme am UP KRITIS Branchenarbeitskreis Energie, Weitergabe relevanter Warnungen an die Leitstelle innerhalb von 24 Stunden",
    correspondenceLogUploaded: "behoerdenkorrespondenz-log.pdf",
  },
};
