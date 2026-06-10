/**
 * Localized labels for policy PDF documents.
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
