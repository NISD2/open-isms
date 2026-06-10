/**
 * Complete realistic company data for Dev GmbH seed.
 * Maps requirement code → form field values for 100% BSIG NIS2 compliance.
 *
 * Company profile: Dev GmbH — energy sector essential entity, 500 employees,
 * 4 locations (HQ Munich + Berlin, Hamburg, Frankfurt), €120M turnover,
 * ISO 27001 certified since 2023, Microsoft stack (Azure, Entra ID, Sentinel).
 */
export const SEED_COMPANY_DATA: Record<string, Record<string, unknown>> = {
  // =========================================================================
  // GOV — Governance & Liability (4 requirements)
  // =========================================================================

  "1.1": {
    // Management Cybersecurity Training (§38(3) BSIG)
    managementTrainingProvider: "BSI Akademie — Cyber-Sicherheit für Führungskräfte",
    lastManagementTraining: "2025-09-20",
  },

  // 1.2 → module-backed (team page)

  "1.3": {
    // Budget Allocation for Cybersecurity (§38(1) BSIG)
    annualSecurityBudget: "2400000",
    budgetApprovalDate: "2025-02-01",
  },

  "1.4": {
    // Personal Liability Acknowledgment (§38(2) BSIG)
    liabilityAcknowledged: true,
  },

  // =========================================================================
  // RSK — Risk Management (4 requirements — BSI 200-3 process flow)
  // =========================================================================

  // 2.1 → methodology config (company_risk_methodology table)

  "2.2": {
    // Asset Inventory → platform asset module (custom editor)
    classificationLevels: "4_levels",
  },

  // 2.3 Risk Register → platform risk module (custom editor)

  "2.4": {
    // Risk Acceptance & IS Policy Sign-Off
    residualRiskCount: 21,
    policyVersion: "v3.2",
    policyApprovalDate: "2025-01-20",
  },

  // =========================================================================
  // INC — Incident Handling (5 requirements)
  // =========================================================================

  "3.1": {
    // Merges old 3.1 + 3.7 + 3.9
    planVersion: "v2.4",
    lastTestedDate: "2025-10-22",
    escalationLevels: "4-tier",
    includesBsiTimelines: true,
    irtLead: "Anna Becker",
    teamSize: 9,
    onCallSchedule: "24x7",
    postIncidentReviewRequired: true,
    reviewFrequency: "within-1-week",
    lessonsLearnedProcess: "formal-tracking",
    externalEscalation: true,
    playbookTypes: [
      "ransomware",
      "data-exfiltration",
      "ddos",
      "insider-threat",
      "phishing",
      "supply-chain",
    ],
    lastReviewDate: "2025-10-01",
    testedInDrill: true,
  },

  "3.2": {
    // Merges old 3.2 + 3.8 + 3.12
    severityLevels: "4-level",
    financialThreshold: 100000,
    hasDecisionTree: true,
    logTool: "siem",
    logRetentionPeriod: "5-years",
    nearMissesIncluded: true,
    dpaContactEstablished: true,
    bsiDpaCoordination: true,
    dualReportingDeadline: "24h-bsi-72h-dpa",
  },

  "3.3": {
    // Merges old 3.3 + 3.4 + 3.5 + 3.6
    primaryContact: "Dr. Thomas Weber",
[redacted for public release]
[redacted for public release]
    deputyContact: "Anna Becker",
    portalAccess: true,
    earlyWarningProcess: "soc-automated",
    monitoringTool: "combined",
    alertingFrequency: "realtime",
    bsiTemplateReady: true,
    notificationTool: "bsi-portal",
    impactAssessmentTemplate: true,
    iocCollectionProcess: true,
    reportDeadline: "1-month",
    includesRootCause: true,
    includesRemediation: true,
    templateAvailable: true,
  },

  "3.4": {
    // Old 3.10
    exerciseType: "full-scale",
    exerciseDate: "2025-10-22",
    participantCount: 24,
    scenarioType: "ransomware",
    lessonsDocumented: true,
  },

  "3.5": {
    // Old 3.11
    notificationChannels: ["email", "website", "press"],
    templateCount: 6,
    preApproved: true,
  },

  // =========================================================================
  // BCP — Business Continuity (5 requirements)
  // =========================================================================

  "4.1": {
    // Merges old 4.1 + 4.4
    criticalProcessCount: 32,
    mtpdDefined: true,
    mbcoDefined: true,
    dependencyAnalysis: true,
    criticalSystemCount: 15,
    overallRto: "4h",
    overallRpo: "1h",
    hasGapAnalysis: true,
  },
  "4.2": {
    // Merges old 4.2 + 4.8 + 4.9 + 4.12
    planVersion: "v3.2",
    lastTestedDate: "2025-09-15",
    workaroundsDefined: true,
    communicationProcedure: true,
    cmtChair: "Klaus Hoffmann",
    cmtSize: 8,
    warRoomLocation: "HQ München, Raum 4.12 (Krisenzentrum)",
    virtualPlatform: "Microsoft Teams",
    audienceTypes: ["employees", "customers", "regulators"],
    spokespersonDesignated: true,
    preApprovedTemplates: true,
    lastReviewDate: "2025-11-30",
    reviewTrigger: "post-exercise",
    changesApplied: 12,
  },
  "4.3": {
    // Old 4.3
    recoveryPriority: "bia-based",
    drSiteType: "warm",
    includesOt: true,
  },
  "4.4": {
    // Merges old 4.5 + 4.6 + 4.7
    backupFrequency: "custom-per-system",
    retentionPeriod: "90-days",
    encryptionRequired: true,
    offsiteCopy: true,
    restoreTestFrequency: "quarterly",
    testDate: "2025-10-08",
    systemsTested: 15,
    recoveryTimeAchieved: "1-4h",
    rtoMet: true,
    dataIntegrityVerified: true,
  },
  "4.5": {
    // Merges old 4.10 + 4.11
    exerciseDate: "2025-11-20",
    scenario: "Totalausfall des primären Rechenzentrums durch Ransomware-Angriff",
    participantCount: 24,
    decisionLogDocumented: true,
    improvementsIdentified: 7,
    testDate: "2025-09-15",
    testScope: "site-wide",
    actualRecoveryTime: "1-4h",
    rtoTarget: "4-8h",
    rtoMet: true,
  },

  // =========================================================================
  // SUP — Supply Chain Security (4 requirements)
  // =========================================================================

  "5.1": {
    // Merges old 5.1 + 5.2 + 5.3
    // Counts (totalSuppliers, criticalSuppliers) derived from supplier module
    classificationTiers: "3-tier",
    minSecurityRequirements: true,
    includesCloudProviders: true,
    hasSecurityContact: true,
    lastReconciliation: "2025-10-01",
    identificationCriteria: ["data-access", "system-access", "single-source", "availability-impact"],
    lastAssessmentDate: "2025-09-30",
  },
  "5.2": {
    // Merges old 5.6 + 5.7 + 5.8
    clauseTypes: ["security-standards", "incident-notification", "audit-rights", "data-protection", "termination"],
    legalReviewed: true,
    auditFrequency: "risk-based",
    auditType: "remote",
    suppliersAudited: 12,
    suppliersWithSubcontractors: 14,
    confirmationsReceived: 14,
    verificationMethod: "contractual-clause",
  },
  "5.3": {
    // Merges old 5.4 + 5.5 + 5.9 + 5.10
    assessmentMethod: "combined",
    scoringScale: "numeric",
    reassessmentFrequency: "annual",
    questionnaireStandard: "sig-lite",
    questionCount: 126,
    includesNis2Requirements: true,
    monitoringFrequency: "quarterly",
    suppliersMonitored: 18,
    ratingSourceUsed: true,
    lastReassessmentDate: "2025-10-15",
    escalationSteps: "4-step",
    compensatingControls: true,
    exitStrategyDocumented: true,
  },
  "5.4": {
    // Old 5.11
    totalIncidentsReported: 3,
    complianceRate: 100,
    averageNotificationTime: "24h",
    followUpCompleted: true,
  },

  // =========================================================================
  // PRO — Procurement & Development (5 requirements)
  // =========================================================================

  "6.1": {
    // Merges old 6.1 + 6.2
    procurementScope: "it-ot",
    securityGateDefined: true,
    eolCheckRequired: true,
    checklistItems: ["authentication", "encryption", "logging", "eol", "patch-support"],
    mandatoryForAll: true,
  },
  "6.2": {
    // Merges old 6.10 + 6.12 + 6.11
    sdlcPhases: ["design", "coding", "sast", "dast", "sca"],
    cicdIntegrated: true,
    sbomTool: "cyclonedx",
    sbomFormat: "cyclonedx",
    componentTrackingMethod: "automated",
    hardeningStandard: "cis",
    enforcementTool: ["gpo", "intune"],
    compliancePercent: 94,
    configAuditTool: "qualys-pc",
    lastAuditDate: "2025-10-22",
    disclosureChannel: "security-txt",
    safeHarborClause: true,
    responseTimeSla: "72h",
  },
  "6.3": {
    // Merges old 6.5 + 6.6 + 6.7
    prioritizationMethod: "risk-based",
    scanFrequency: "weekly",
    coverageTarget: 100,
    scanningTools: ["qualys"],
    scanCoverage: 98,
    openCriticalVulns: 3,
    openHighVulns: 17,
    lastFullScanDate: "2025-11-25",
    testDate: "2025-08-12",
    testProvider: "SRC Security Research & Consulting GmbH",
    testScope: "full",
    criticalFindings: 1,
    highFindings: 6,
    remediationComplete: true,
  },
  "6.4": {
    // Merges old 6.3 + 6.4
    criticalPatchSla: "72h",
    highPatchSla: "14d",
    testBeforeDeploy: true,
    hasOtPatchProcess: true,
    patchTrackingTool: "intune",
    patchComplianceRate: 97,
    openCriticalPatches: 2,
  },
  "6.5": {
    // Merges old 6.8 + 6.9
    changeClassification: "standard-normal-emergency",
    cabRequired: true,
    securityAssessment: true,
    rollbackPlanRequired: true,
    changeTrackingTool: "servicenow",
    securityReviewPct: 95,
    emergencyChangesPct: 4,
  },

  // =========================================================================
  // EFF — Effectiveness Assessment (4 requirements)
  // =========================================================================

  "7.1": {
    // Merges old 7.3 + 7.4
    kpiCount: 15,
    reportingFrequency: "monthly",
    includesMttd: true,
    includesPatchMetrics: true,
    reportingPeriod: "monthly",
    kpisReported: 15,
    kpisInThreshold: 14,
    managementReviewed: true,
  },
  "7.2": {
    // Merges old 7.1 + 7.2
    auditCycleLength: "annual",
    areasPerYear: 12,
    internalAuditorsCount: 3,
    auditDate: "2025-03-15",
    auditScope: [
      "governance",
      "risk-management",
      "incident-handling",
      "bcp",
      "supply-chain",
      "effectiveness",
      "training",
      "cryptography",
      "access-control",
    ],
    nonConformities: 4,
    correctiveActionsAssigned: 4,
    allActionsTracked: true,
  },
  "7.3": {
    // Merges old 7.5 + 7.6 + 7.7
    role: "CISO",
    confirmed: true,
    maturityModel: "iso-conformity",
    gapsIdentified: 3,
    criticalGaps: 1,
    remediationPlanDefined: true,
    auditType: "iso27001",
    auditDate: "2025-05-20",
    auditorFirm: "TÜV SÜD",
    certificateValidUntil: "2026-06-30",
    majorNonConformities: 0,
  },
  "7.4": {
    // Merges old 7.8 + 7.9 + 7.10
    lastPentestDate: "2025-10-14",
    criticalFindings: 2,
    remediatedPercent: 100,
    retestCompleted: true,
    grundschutzEdition: "2024",
    modulesAssessed: 42,
    protectionLevel: "standard",
    totalImprovements: 27,
    openItems: 5,
    sources: ["audit", "incident", "pentest", "management-review"],
  },

  // =========================================================================
  // TRN — Cyber Hygiene & Training (4 requirements)
  // =========================================================================

  "8.1": {
    // Merges old 8.8 + 8.9
    aupScope: ["internet", "email", "byod", "cloud", "social-media"],
    signedByAll: true,
    enforcementTechnical: true,
    screenLockTimeout: "5min",
    enforced: true,
    spotChecksPerformed: true,
  },
  "8.2": {
    // Merges old 8.1 + 8.2 + 8.3 + 8.4
    programType: "continuous",
    annualBudget: 48000,
    topicsPerYear: 12,
    coverageTarget: 100,
    onboardingDuration: "1h",
    includesNda: true,
    includesAup: true,
    trainingPlatform: "mixed",
    completionRate: 97,
    hasQuiz: true,
    trainingDate: "2025-09-10",
    deliveryMethod: "online",
    participantCount: 487,
    quizPassRate: 91,
  },
  "8.3": {
    // Merges old 8.5 + 8.6
    trainingProvider: "KnowBe4",
    trainingDate: "2025-04-22",
    durationHours: 4,
    managementMembers: 18,
    topicsCovered: ["risk-id", "risk-mgmt", "impact", "legal"],
    rolesWithTraining: ["it-admin", "developer", "irt", "ciso"],
    certificationsRequired: true,
    trainingMatrixDocumented: true,
  },
  "8.4": {
    // Merges old 8.10 + 8.12 + 8.7 + 8.11
    campaignDate: "2025-10-01",
    emailsSent: 500,
    clickRate: 6,
    reportRate: 34,
    repeatOffenders: 8,
    measurementMethod: "combined",
    measurementPeriod: "quarterly",
    improvementObserved: true,
    recordSystem: "lms",
    overallCompletionRate: 97,
    auditReady: true,
    championCount: 8,
    departmentsCovered: 8,
    additionalTrainingHours: 16,
    charterExists: true,
  },

  // =========================================================================
  // CRY — Cryptography & Encryption (3 requirements)
  // =========================================================================

  "9.1": {
    // Merges old 9.1 + 9.8
    symmetricAlgorithm: "aes256",
    minTlsVersion: "tls13",
    alignedWithBsiTr: true,
    lastReviewDate: "2025-08-01",
    bsiTrVersion: "2024-01",
    deprecatedAlgorithmsFound: 0,
    pqcReadinessAssessed: true,
  },
  // 9.2 → asset enrichment (per-asset crypto fields, no intake data)
  "9.3": {
    keyManagementTool: "Azure Key Vault + Thales Luna HSM (on-prem roots)",
    certificateMonitoringTool: "Venafi Trust Protection Platform",
    certExpiryAlertDays: 30,
  },

  // =========================================================================
  // ACC — Access Control & HR Security (4 requirements)
  // =========================================================================

  "10.1": {
    // Merges old 10.1 + 10.8
    leastPrivilege: true,
    separationOfDuties: true,
    accessReviewFrequency: "quarterly",
    rolesDefinedCount: 120,
    rbacTooling: "iam-platform",
    permissionMatrixDocumented: true,
  },
  "10.2": {
    // Merges old 10.2 + 10.5 + 10.6
    provisioningMethod: "iam-automated",
    approvalLevels: "2-level",
    auditTrailEnabled: true,
    checklistItems: ["account-creation", "mfa-setup", "nda-signing", "security-training", "aup-acknowledgment", "background-check"],
    backgroundCheckRequired: true,
    securityClauseInContract: true,
    maxProvisioningTime: "1-day",
    accessRevocationSla: "immediate",
    involuntaryImmediate: true,
    deviceReturnTracked: true,
    moversProcessDefined: true,
  },
  "10.3": {
    // Merges old 10.3 + 10.9 + 10.10 + 10.11
    pamTool: "cyberark",
    mfaForAdmins: true,
    sessionRecording: true,
    sharedAccountsExist: false,
    adminAccountCount: 35,
    personalAccountsOnly: true,
    mfaEnabledPercent: 100,
    lastAuditDate: "2025-10-20",
    serviceAccountCount: 28,
    passwordRotation: "90-days",
    allHaveOwners: true,
    reviewFrequency: "quarterly",
    remoteAccessMethod: "ztna",
    mfaRequired: true,
    deviceComplianceChecked: true,
    splitTunnelDisabled: true,
  },
  "10.4": {
    // Merges old 10.4 + 10.7 + 10.12
    lastReviewDate: "2025-11-15",
    accountsReviewed: 563,
    excessPermissionsFound: 14,
    allFindingsResolved: true,
    reviewMethod: "combined",
    inventoryTool: "cmdb",
    lastInventoryUpdate: "2025-12-01",
    hardwareAssets: 1200,
    softwareAssets: 450,
    inventoryCoverage: ["laptops", "servers", "mobile", "network", "software", "cloud"],
    accessMethod: "badge-card",
    accessLogsRetained: true,
    visitorLogMaintained: true,
    cctvEnabled: true,
  },

  // =========================================================================
  // AUT — Authentication & Communications (3 requirements)
  // =========================================================================

  "11.1": {
    // Merges old 11.1 + 11.2 + 11.3 + 11.4 + 11.5 + 11.10
    primaryMfaMethod: "fido2",
    adminMfaCoverage: 100,
    userMfaCoverage: 97,
    targetDate: "2025-06-30",
    adminAccountCount: 35,
    mfaEnforced: true,
    mfaMethod: "fido2",
    lastAuditDate: "2025-10-20",
    coveredServices: ["vpn", "webmail", "cloud-portals", "rdp", "saas", "web-apps"],
    coveragePercent: 98,
    ssoProvider: "entra-id",
    totalUserCount: 500,
    enrolledCount: 487,
    enrollmentPercent: 97,
    rolloutPhase: "complete",
    targetCompletionDate: "2025-03-31",
    selectedMethods: ["fido2", "totp", "push"],
    migrationPlanExists: true,
    smsPhaseOutDate: "2025-06-30",
    totalExceptions: 4,
    maxExceptionDuration: "90-days",
    compensatingControlsRequired: true,
    riskAcceptanceSigned: true,
  },
  "11.2": {
    // Merges old 11.7 + 11.8 + 11.9
    approvedTools: ["teams", "signal", "email-encrypted"],
    classificationMatrix: true,
    dlpIntegrated: true,
    oobTool: "signal",
    printedPlanLocations: "Tresor CISO-Büro (München HQ), Schaltschrank Serverraum (Berlin DC), Geschäftsführerbüro (Frankfurt)",
    lastDrillDate: "2025-08-14",
    voiceTool: "teams-e2e",
    messagingTool: "signal",
    e2eVerified: true,
    deploymentStatus: "full",
  },
  "11.3": {
    // Merges old 11.6 + 11.11
    reviewStandards: ["bsi-tr-03107", "nist-800-63", "enisa"],
    lastReviewDate: "2025-09-01",
    findingsCount: 3,
    sessionTimeout: "30-min",
    failedLoginLockout: "5-attempts",
    minPasswordLength: "16",
    passwordManager: "bitwarden",
    hashAlgorithm: "argon2",
    passwordExpiry: "no-expiry",
    breachCheckEnabled: true,
  },

  // =========================================================================
  // REG — Registration & Reporting (4 requirements)
  // =========================================================================

  "12.1": {
    // Merges old 12.1 + 12.2
    sector: "energy",
    employeeCount: 500,
    annualTurnover: 120,
    bsiToolResult: "essential",
    sectorReportingConfirmed: true,
    applicableObligations: ["24h-early-warning", "72h-notification", "final-report", "kritis-registration", "kritis-audit"],
    entityType: "essential",
    legalBasisConfirmed: true,
    lawyerReviewed: true,
  },
  "12.2": {
    // Merges old 12.3 + 12.4 + 12.5
    mukRegistered: true,
    elsterCertificateLinked: true,
    bsiPortalAccessVerified: true,
    registrationDate: "2025-01-15",
    registrationId: "BSI-NIS2-2026-00847",
    registeredBy: "Markus Braun, BSI-Liaison",
    entityName: "Dev GmbH",
    ipRangeCount: 12,
    ipRangesDocumented: true,
    euCountries: ["DE"],
  },
  "12.3": {
    // Merges old 12.7 + 12.8 + 12.9
    lastReviewDate: "2025-11-01",
    changesRequired: false,
    changesSubmitted: false,
    changeType: "contact-person",
    notifiedWithinDeadline: true,
    notificationDate: "2025-04-10",
    contactName: "Markus Braun",
    deputyName: "Dr. Thomas Weber",
    reachability: "24x7",
    lastVerificationDate: "2025-12-01",
  },
  "12.4": {
    // Merges old 12.6 + 12.10 + 12.11 + 12.12
    facilityCount: 2,
    thresholdCalculationComplete: true,
    dataSubmittedToBsi: true,
    submissionDate: "2025-02-01",
    isDomainRegistryOperator: false,
    auditorSelected: true,
    auditorFirm: "TÜV SÜD",
    plannedAuditDate: "2026-03-01",
    evidencePortfolioComplete: true,
    detectionSystemsOperational: true,
    detectionTools: ["siem", "edr", "ndr"],
    detectionCoverage: 96,
    lastTestDate: "2025-11-20",
    evidenceCatalogExists: true,
    responseTimeSla: "24h",
    responseTemplatesPrepared: true,
    designatedResponder: "Dr. Thomas Weber, CISO",
  },
};
