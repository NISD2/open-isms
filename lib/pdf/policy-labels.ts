/**
 * Localized labels for the PDF documents (policy + compliance report).
 *
 * React-PDF components can't use next-intl hooks, so we maintain
 * a small set of document-level labels here, keyed by locale.
 */

export const POLICY_TITLES: Record<string, Record<string, string>> = {
  en: {
    GOV: "Information Security Governance Policy",
    RSK: "Risk Management Policy",
    INC: "Incident Response Policy",
    BCP: "Business Continuity & Disaster Recovery Policy",
    SUP: "Supply Chain Security Policy",
    PRO: "Secure Procurement & Development Policy",
    EFF: "Security Effectiveness Assessment Policy",
    TRN: "Cyber Hygiene & Training Policy",
    CRY: "Cryptography & Encryption Policy",
    ACC: "Access Control & HR Security Policy",
    AUT: "Authentication & Secure Communications Policy",
    REG: "Regulatory Registration & Reporting Policy",
  },
  de: {
    GOV: "Richtlinie zur Informationssicherheits-Governance",
    RSK: "Risikomanagement-Richtlinie",
    INC: "Richtlinie zur Vorfallbehandlung",
    BCP: "Richtlinie zur Betriebskontinuität & Notfallwiederherstellung",
    SUP: "Richtlinie zur Lieferkettensicherheit",
    PRO: "Richtlinie für sichere Beschaffung & Entwicklung",
    EFF: "Richtlinie zur Wirksamkeitsbewertung",
    TRN: "Richtlinie zu Cyberhygiene & Schulung",
    CRY: "Richtlinie zur Kryptografie & Verschlüsselung",
    ACC: "Richtlinie zur Zugangskontrolle & Personalsicherheit",
    AUT: "Richtlinie zur Authentifizierung & sicheren Kommunikation",
    REG: "Richtlinie zur Registrierung & Meldepflicht",
  },
};

interface DocumentLabels {
  version: string;
  date: string;
  signedOff: string;
  confidential: string;
  framework: string;
  general: string;
}

const LABELS: Record<string, DocumentLabels> = {
  en: {
    version: "Version",
    date: "Date",
    signedOff: "Signed off by",
    confidential: "Confidential",
    framework: "Framework",
    general: "General",
  },
  de: {
    version: "Version",
    date: "Datum",
    signedOff: "Freigegeben von",
    confidential: "Vertraulich",
    framework: "Rahmenwerk",
    general: "Allgemein",
  },
};

interface ReportLabels {
  title: string;
  sector: string;
  generated: string;
  assessmentStarted: string;
  draftTitle: string;
  draftText: (pending: number, completed: number) => string;
  statCompliance: string;
  statCompleted: string;
  statApproved: string;
  statPendingApproval: string;
  statTotal: string;
  signedOffBy: string;
  signedOffAt: string;
  templateVersion: string;
  operationalData: string;
  evidenceFiles: string;
  reviewerFeedback: string;
  signedOff: string;
  categoryIntake: string;
}

const REPORT_LABELS: Record<string, ReportLabels> = {
  en: {
    title: "Compliance Report",
    sector: "Sector",
    generated: "Generated",
    assessmentStarted: "Assessment started",
    draftTitle: "DRAFT: Contains unapproved submissions",
    draftText: (pending, completed) =>
      `${pending} of ${completed} completed items are pending reviewer approval.`,
    statCompliance: "Compliance",
    statCompleted: "Completed",
    statApproved: "Approved",
    statPendingApproval: "Pending Approval",
    statTotal: "Total",
    signedOffBy: "Signed off by",
    signedOffAt: "Signed off at",
    templateVersion: "Template version",
    operationalData: "Operational data",
    evidenceFiles: "Evidence Files",
    reviewerFeedback: "Reviewer Feedback",
    signedOff: "Signed off",
    categoryIntake: "Category Intake",
  },
  de: {
    title: "Compliance-Bericht",
    sector: "Sektor",
    generated: "Erstellt am",
    assessmentStarted: "Assessment gestartet am",
    draftTitle: "ENTWURF: Enthält nicht freigegebene Einreichungen",
    draftText: (pending, completed) =>
      `${pending} von ${completed} abgeschlossenen Punkten warten auf Freigabe durch die Prüfung.`,
    statCompliance: "Compliance",
    statCompleted: "Abgeschlossen",
    statApproved: "Freigegeben",
    statPendingApproval: "Freigabe ausstehend",
    statTotal: "Gesamt",
    signedOffBy: "Freigegeben von",
    signedOffAt: "Freigegeben am",
    templateVersion: "Vorlagenversion",
    operationalData: "Betriebsdaten",
    evidenceFiles: "Nachweisdateien",
    reviewerFeedback: "Prüferfeedback",
    signedOff: "Freigegeben",
    categoryIntake: "Kategorieerfassung",
  },
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: {
    not_started: "not started",
    in_progress: "in progress",
    completed: "completed",
    approved: "approved",
    rejected: "rejected",
    not_applicable: "not applicable",
  },
  de: {
    not_started: "nicht begonnen",
    in_progress: "in Bearbeitung",
    completed: "abgeschlossen",
    approved: "freigegeben",
    rejected: "abgelehnt",
    not_applicable: "nicht anwendbar",
  },
};

export function getReportLabels(locale: string): ReportLabels {
  return REPORT_LABELS[locale] ?? REPORT_LABELS["en"];
}

export function getStatusLabel(status: string, locale: string): string {
  return (
    STATUS_LABELS[locale]?.[status] ??
    STATUS_LABELS["en"]?.[status] ??
    status.replace(/_/g, " ")
  );
}

export function getPolicyTitle(categoryCode: string, locale: string): string {
  return (
    POLICY_TITLES[locale]?.[categoryCode] ??
    POLICY_TITLES["en"]?.[categoryCode] ??
    categoryCode
  );
}

export function getDocumentLabels(locale: string): DocumentLabels {
  return LABELS[locale] ?? LABELS["en"];
}
