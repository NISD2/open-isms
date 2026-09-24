/**
 * German labels for every intake field the Durchgang can put on a screen.
 *
 * **Why this file exists, and why it is exhaustive rather than partial.** `introspectSchema`
 * derives a label from the identifier, and the identifiers are English, so a missing entry renders
 * "Management Training Provider" on a German screen. That shipped twice: once on the registration
 * screen, which I fixed by adding the three fields I had personally looked at, and then again on
 * item 1.1, because I had fixed the instance rather than the class.
 *
 * The test beside this file enumerates every field reachable from `journeyItems()` and fails when
 * one has no entry here. A new intake field therefore breaks a test rather than quietly showing
 * English to a Geschäftsführer.
 *
 * Register names and tools keep their proper names: "SSO-Tool" is what the reader calls it, and
 * translating a product category into invented German would be worse than leaving it.
 */
export const FIELD_LABEL_DE: Readonly<Record<string, string>> = {
  // Registration and reporting (REG, §33 and §34 BSIG)
  mukAccountId: "MUK-Kontonummer",
  bsiRegistrationDate: "Datum der Registrierung",
  registrationProofUploaded: "Bestätigung des BSI",
  contactPersonName: "Ansprechpartner",
  contactPersonEmail: "E-Mail des Ansprechpartners",
  lastRegistrationUpdate: "Letzte Aktualisierung der Registrierung",
  nextRegistrationUpdate: "Nächste Aktualisierung geplant",
  informationSharingCompliant: "Umgang mit dem Informationsaustausch",
  correspondenceLogUploaded: "Schriftverkehr mit der Behörde",

  // Governance (GOV, §38 BSIG)
  managementTrainingProvider: "Anbieter der Schulung",
  lastManagementTraining: "Letzte Schulung der Geschäftsleitung",
  liabilityAcknowledged: "Haftung zur Kenntnis genommen",
  annualSecurityBudget: "Jahresbudget für Sicherheit",
  budgetApprovalDate: "Budget freigegeben am",
  itSecurityPolicyPublished: "Leitlinie veröffentlicht",

  // Risk management (RSK)
  classificationScheme: "Schema der Schutzbedarfsfeststellung",
  classificationLevels: "Stufen des Schutzbedarfs",
  residualRiskCount: "Anzahl akzeptierter Restrisiken",
  policyVersion: "Version der Richtlinie",
  policyApprovalDate: "Richtlinie freigegeben am",
  criticalProcessCount: "Anzahl kritischer Prozesse",
  singlePointOfFailureCount: "Anzahl Einzelfehlerstellen",
  biaCompletionDate: "Business-Impact-Analyse abgeschlossen am",

  // Supply chain (SUP), asked once per supplier from CIR 5.2
  contractSecurityClauses: "Sicherheitsklauseln im Vertrag",
  auditFrequency: "Prüfturnus",
  monitoringMethod: "Wie überwacht",
  lastReviewDate: "Letzte Überprüfung",
  dueDiligenceProcess: "Prüfung vor Beauftragung",

  // Incident handling (INC, §32 BSIG)
  incidentLead: "Verantwortlich für Vorfälle",
  irtTeamSize: "Größe des Reaktionsteams",
  incidentEscalationContacts: "Eskalationskontakte",
  significantIncidentCriteria: "Kriterien für einen erheblichen Vorfall",
  incidentNotificationSlaHours: "Frist für die Meldung in Stunden",
  earlyWarningSlaHours: "Frist für die Frühwarnung in Stunden",
  bsiReportingRegistered: "Meldeweg beim BSI eingerichtet",
  postIncidentReviewOwner: "Verantwortlich für die Nachbereitung",
  drillType: "Art der Übung",
  lastDrillDate: "Letzte Übung",
  detectionTools: "Werkzeuge zur Angriffserkennung",

  // Business continuity (BCP)
  rtoTargetHours: "Ziel für die Wiederanlaufzeit in Stunden",
  rpoTargetHours: "Ziel für den zulässigen Datenverlust in Stunden",
  bcpActivationCriteria: "Auslöser für den Notfallplan",
  crisisTeamLead: "Leitung des Krisenstabs",
  lastBcpTest: "Letzter Test des Notfallplans",
  lastBackupTest: "Letzter Test der Rücksicherung",
  backupEncryption: "Verschlüsselung der Sicherungen",
  backupRestoreSuccessRate: "Erfolgsquote der Rücksicherungen",
  secureCommsChannel: "Gesicherter Kommunikationsweg",
  secureCommsTools: "Werkzeuge für die gesicherte Kommunikation",
  emergencyCommsChannel: "Notfallkommunikation",
  lastEmergencyCommsTest: "Notfallkommunikation zuletzt getestet",

  // Per asset, from CIR 4(1), CIR 4(2) and §34 BSIG
  rto: "Wiederanlaufzeit",
  rpo: "Zulässiger Datenverlust",
  hasBackup: "Wird gesichert",
  backupFrequency: "Sicherungsturnus",
  backupLocation: "Ort der Sicherung",
  lastBackupTestDate: "Rücksicherung zuletzt getestet",

  // Cryptography (CRY)
  keyManagementTool: "Werkzeug für die Schlüsselverwaltung",
  certificateMonitoringTool: "Überwachung der Zertifikate",
  certExpiryAlertDays: "Vorwarnzeit vor Ablauf in Tagen",

  // Access control and authentication (ACC, AUT)
  lastAccessReviewDate: "Letzte Rechteprüfung",
  jmlTool: "Werkzeug für Ein- und Austritte",
  pamTool: "Werkzeug für privilegierte Zugänge",
  backgroundCheckScope: "Umfang der Zuverlässigkeitsprüfung",
  adminMfaEnforced: "Zweiter Faktor für Administratoren erzwungen",
  mfaCoverage: "Abdeckung des zweiten Faktors",
  mfaCoveragePct: "Abdeckung des zweiten Faktors in Prozent",
  mfaMethods: "Zugelassene zweite Faktoren",
  mfaTool: "Werkzeug für den zweiten Faktor",
  ssoTool: "SSO-Werkzeug",
  passwordMinLength: "Mindestlänge des Passworts",
  sessionTimeoutMinutes: "Sitzung endet nach Minuten",

  // Procurement, vulnerabilities and change (PRO)
  vulnerabilityScanTool: "Werkzeug für Schwachstellenscans",
  vulnerabilityScanningFrequency: "Turnus der Schwachstellenscans",
  vulnerabilityDisclosureUrl: "Meldestelle für Schwachstellen",
  changeManagementTool: "Werkzeug für Änderungen",

  // Training (TRN, §38 Abs. 3 BSIG)
  trainingPlatform: "Schulungsplattform",
  trainingFrequency: "Turnus der Schulungen",
  lastTrainingDate: "Letzte Schulung",
  trainingCompletionRate: "Abschlussquote der Schulungen",
  roleSpecificTrainingProvider: "Anbieter rollenspezifischer Schulungen",
  newEmployeeOnboarding: "Einarbeitung neuer Beschäftigter",
  phishingSimFrequency: "Turnus der Phishing-Tests",
  lastPhishingTest: "Letzter Phishing-Test",
  phishingClickRate: "Klickrate im Phishing-Test",

  // Effectiveness (EFF)
  kpisDefinedCount: "Anzahl definierter Kennzahlen",
  kpiDashboardTool: "Werkzeug für die Kennzahlen",
  trendAnalysisTool: "Werkzeug für die Trendanalyse",
  lastAuditDate: "Letztes internes Audit",
  lastPentestDate: "Letzter Penetrationstest",
  lastManagementReview: "Letzte Managementbewertung",
  managementReviewReportUploaded: "Bericht der Managementbewertung",
  openCorrectiveActions: "Offene Korrekturmaßnahmen",
  avgClosureTimeDays: "Durchschnittliche Bearbeitungsdauer in Tagen",
  correctiveActionTool: "Werkzeug für Korrekturmaßnahmen",
};
