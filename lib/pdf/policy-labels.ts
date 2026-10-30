/**
 * Localized labels for the PDF documents (policy + compliance report).
 *
 * React-PDF components can't use next-intl hooks, so we maintain
 * a small set of document-level labels here, keyed by locale.
 */

import type { DotState } from "@/lib/compliance/journey-position";
import { type PdfLocale, pdfLocale } from "./format";

export const POLICY_TITLES: Readonly<
  Record<PdfLocale, Readonly<Record<string, string>>>
> = {
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
  cs: {
    GOV: "Politika řízení informační bezpečnosti",
    RSK: "Politika řízení rizik",
    INC: "Politika řešení incidentů",
    BCP: "Politika řízení kontinuity činností a obnovy po havárii",
    SUP: "Politika bezpečnosti dodavatelského řetězce",
    PRO: "Politika bezpečného nákupu a vývoje",
    EFF: "Politika hodnocení účinnosti bezpečnostních opatření",
    TRN: "Politika kybernetické hygieny a školení",
    CRY: "Politika kryptografie a šifrování",
    ACC: "Politika řízení přístupu a personální bezpečnosti",
    AUT: "Politika autentizace a zabezpečené komunikace",
    REG: "Politika registrace a hlášení",
  },
};

interface DocumentLabels {
  version: string;
  date: string;
  signedOff: string;
  confidential: string;
  framework: string;
  general: string;
  /** Sits above the wordmark in a cover footer. These documents are generated
   *  by the platform but issued by the customer, so the label says so. */
  generatedWith: string;
  page: (n: number, total: number) => string;
}

const LABELS: Readonly<Record<PdfLocale, DocumentLabels>> = {
  en: {
    version: "Version",
    date: "Date",
    signedOff: "Signed off by",
    confidential: "Confidential",
    framework: "Framework",
    general: "General",
    generatedWith: "Generated with",
    page: (n, total) => `Page ${n} of ${total}`,
  },
  de: {
    version: "Version",
    date: "Datum",
    signedOff: "Freigegeben von",
    confidential: "Vertraulich",
    framework: "Rahmenwerk",
    general: "Allgemein",
    generatedWith: "Erstellt mit",
    page: (n, total) => `Seite ${n} von ${total}`,
  },
  cs: {
    version: "Verze",
    date: "Datum",
    signedOff: "Schválil",
    confidential: "Důvěrné",
    framework: "Rámec",
    general: "Obecné",
    generatedWith: "Vytvořeno pomocí",
    page: (n, total) => `Strana ${n} z ${total}`,
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
  notApplicableReason: string;
  notApplicableDecided: string;
  operationalData: string;
  evidenceFiles: string;
  reviewerFeedback: string;
  signedOff: string;
  categoryIntake: string;
  /** A requirement met inside these walk items, signed off with them or still waiting. */
  coveredSigned: (codes: string) => string;
  coveredAwaiting: (codes: string) => string;
  /** A requirement's own state on the journey, in the walk overview's words (`statusLabel`). */
  states: Readonly<Record<DotState, string>>;
  /** A requirement no statute asks of the company. */
  notRequired: string;
  and: string;
  /** The BSI's method a category maps to: German, so a reader outside Germany is told it is. */
  grundschutz: string;
}

const REPORT_LABELS: Readonly<Record<PdfLocale, ReportLabels>> = {
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
    notApplicableReason: "Reason not applicable",
    notApplicableDecided: "Decided",
    operationalData: "Operational data",
    evidenceFiles: "Evidence Files",
    reviewerFeedback: "Reviewer Feedback",
    signedOff: "Signed off",
    categoryIntake: "Category Intake",
    coveredSigned: (codes) => `signed off in the walkthrough with ${codes}`,
    coveredAwaiting: (codes) => `in the walkthrough with ${codes}, awaiting sign-off`,
    states: {
      todo: "not started",
      started: "in progress",
      awaiting: "awaiting sign-off",
      signed: "signed off",
      na: "does not apply",
      rejected: "rejected",
    },
    notRequired: "not required by law",
    and: "and",
    grundschutz: "IT-Grundschutz",
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
    notApplicableReason: "Begründung",
    notApplicableDecided: "Entschieden",
    operationalData: "Betriebsdaten",
    evidenceFiles: "Nachweisdateien",
    reviewerFeedback: "Prüferfeedback",
    signedOff: "Freigegeben",
    categoryIntake: "Kategorieerfassung",
    coveredSigned: (codes) => `im Durchgang mit ${codes} freigegeben`,
    coveredAwaiting: (codes) => `im Durchgang mit ${codes}, wartet auf Freigabe`,
    states: {
      todo: "nicht begonnen",
      started: "in Bearbeitung",
      awaiting: "wartet auf Freigabe",
      signed: "freigegeben",
      na: "trifft nicht zu",
      rejected: "abgelehnt",
    },
    notRequired: "gesetzlich nicht gefordert",
    and: "und",
    grundschutz: "IT-Grundschutz",
  },
  cs: {
    title: "Zpráva o souladu",
    sector: "Odvětví",
    generated: "Vytvořeno dne",
    assessmentStarted: "Hodnocení zahájeno dne",
    draftTitle: "KONCEPT: Obsahuje neschválené body",
    draftText: (pending, completed) =>
      `${pending} z ${completed} dokončených bodů čeká na schválení revizorem.`,
    statCompliance: "Soulad",
    statCompleted: "Dokončeno",
    statApproved: "Schváleno",
    statPendingApproval: "Čeká na schválení",
    statTotal: "Celkem",
    signedOffBy: "Schválil",
    signedOffAt: "Schváleno dne",
    templateVersion: "Verze šablony",
    notApplicableReason: "Důvod, proč se nevztahuje",
    notApplicableDecided: "Rozhodnuto",
    operationalData: "Provozní údaje",
    evidenceFiles: "Soubory s doklady",
    reviewerFeedback: "Připomínky revizora",
    signedOff: "Schváleno",
    categoryIntake: "Odpovědi k oblasti",
    coveredSigned: (codes) => `schváleno v průvodci (${codes})`,
    coveredAwaiting: (codes) => `v průvodci (${codes}), čeká na schválení`,
    states: {
      todo: "nezahájeno",
      started: "probíhá",
      awaiting: "čeká na schválení",
      signed: "schváleno",
      na: "nevztahuje se",
      rejected: "zamítnuto",
    },
    notRequired: "zákon nevyžaduje",
    and: "a",
    grundschutz: "IT-Grundschutz (německá metodika BSI)",
  },
};

export function getReportLabels(locale: string): ReportLabels {
  return REPORT_LABELS[pdfLocale(locale)];
}

export function getPolicyTitle(categoryCode: string, locale: string): string {
  return (
    POLICY_TITLES[pdfLocale(locale)][categoryCode] ??
    POLICY_TITLES.en[categoryCode] ??
    categoryCode
  );
}

export function getDocumentLabels(locale: string): DocumentLabels {
  return LABELS[pdfLocale(locale)];
}
