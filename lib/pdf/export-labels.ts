import type { EXPORT_FIELDS, ExportRecord } from "@/lib/export/company-export";
import type { PdfLocale } from "./format";

type FieldLabels = {
  readonly [R in ExportRecord]: Readonly<
    Record<(typeof EXPORT_FIELDS)[R][number], string>
  >;
};

export interface ExportLabels {
  readonly fields: FieldLabels;
  /** Names for stored values that are codes (entity type, risk level, treatment, severity). */
  readonly values: Readonly<Record<string, string>>;
  readonly records: Readonly<Record<ExportRecord, string>>;
  readonly name: string;
  readonly providers: string;
  readonly none: string;
  readonly yes: string;
  readonly no: string;
  readonly asOf: string;
  readonly issuedBy: string;
  readonly confidential: string;
  readonly page: (page: number, total: number) => string;
  readonly registers: { readonly title: string; readonly eyebrow: string };
  readonly documents: {
    readonly title: string;
    readonly eyebrow: string;
    readonly empty: string;
    readonly status: string;
    readonly approvedBy: string;
    readonly approvedAt: string;
    readonly version: string;
    readonly effectiveFrom: string;
    readonly draft: string;
    readonly approved: string;
  };
}

const DE: ExportLabels = {
  fields: {
    company: {
      legalForm: "Rechtsform",
      sector: "Sektor",
      entityType: "Einrichtungstyp",
      employeeCount: "Beschäftigte",
      registeredAddress: "Anschrift",
      primaryLocations: "Standorte",
      contactEmail: "Kontakt",
      contactPhone: "Telefon",
      bsiRegistrationId: "Registrierung beim BSI",
    },
    asset: {
      type: "Typ",
      description: "Wofür es da ist",
      quantity: "Anzahl",
      isCritical: "Kritisch",
      isOT: "Betriebstechnik (OT)",
      owner: "Verantwortlich",
      location: "Standort",
      hostname: "Hostname",
      ipAddress: "IP-Adresse",
      operatingSystem: "Betriebssystem",
      softwareVersion: "Version",
      hasMfa: "Zweiter Faktor",
      mfaMethod: "Art des zweiten Faktors",
      hasBackup: "Datensicherung",
      backupFrequency: "Sicherungsrhythmus",
      lastBackupTestDate: "Letzte erfolgreiche Wiederherstellung",
      processesPersonalData: "Personenbezogene Daten",
      endOfLife: "Ende der Unterstützung",
    },
    supplier: {
      description: "Was er für Sie tut",
      serviceType: "Leistung",
      contactName: "Ansprechperson",
      contactEmail: "Kontakt",
      riskLevel: "Risiko",
      isCritical: "Kritisch",
      hasAccessToSystems: "Zugriff auf Systeme",
      hasAccessToData: "Zugriff auf Daten",
      hasSecurityClauses: "Sicherheit vertraglich geregelt",
      hasSecurityCertification: "Zertifiziert",
      securityCertificationType: "Zertifizierung",
      contractStartDate: "Vertrag seit",
      contractEndDate: "Vertrag bis",
      processesPersonalData: "Personenbezogene Daten",
      dpaAvailable: "Auftragsverarbeitungsvertrag",
    },
    risk: {
      title: "Risiko",
      description: "Beschreibung",
      likelihood: "Häufigkeit",
      impact: "Auswirkung",
      riskScore: "Wert",
      treatment: "Behandlung",
      treatmentDescription: "Maßnahmen",
      riskOwner: "Verantwortlich",
      acceptedAt: "Akzeptiert am",
    },
    training: {
      title: "Schulung",
      participantName: "Teilnehmende",
      participantRole: "Rolle",
      providerName: "Anbieter",
      completedAt: "Abgeschlossen am",
      nextTrainingDue: "Nächste fällig",
    },
    managementReview: {
      title: "Bewertung",
      reviewDate: "Datum",
      attendees: "Teilgenommen",
      decisions: "Entschieden",
      actionItems: "Maßnahmen",
      nextReviewDate: "Nächste Bewertung",
    },
    incident: {
      internalRef: "Kennung",
      title: "Vorfall",
      description: "Beschreibung",
      severity: "Schwere",
      discoveredAt: "Entdeckt am",
      resolvedAt: "Behoben am",
    },
  },
  values: {
    essential: "Besonders wichtige Einrichtung",
    important: "Wichtige Einrichtung",
    kritis: "Betreiber einer kritischen Anlage",
    critical: "kritisch",
    high: "hoch",
    medium: "mittel",
    low: "niedrig",
    mitigate: "Reduzieren",
    accept: "Akzeptieren",
    transfer: "Übertragen",
    avoid: "Vermeiden",
    near_miss: "Beinahevorfall",
    incident: "Vorfall",
    significant: "Erheblicher Sicherheitsvorfall",
    ceo: "Geschäftsführung",
  },
  records: {
    company: "Stammdaten",
    asset: "Assets",
    supplier: "Lieferanten",
    risk: "Risiken",
    training: "Schulungen",
    managementReview: "Managementbewertungen",
    incident: "Vorfälle",
  },
  name: "Name",
  providers: "Anbieter",
  none: "Keine Einträge.",
  yes: "Ja",
  no: "Nein",
  asOf: "Stand",
  issuedBy: "Erstellt mit",
  confidential: "Vertraulich",
  page: (page, total) => `Seite ${page} von ${total}`,
  registers: { title: "Register", eyebrow: "NIS 2 Dokumentation" },
  documents: {
    title: "Dokumente",
    eyebrow: "NIS 2 Dokumentation",
    empty: "Der Durchgang hat noch keine Dokumente geschrieben.",
    status: "Status",
    approvedBy: "Freigegeben von",
    approvedAt: "Freigegeben am",
    version: "Version",
    effectiveFrom: "Gültig ab",
    draft: "Entwurf, noch nicht freigegeben",
    approved: "Freigegeben",
  },
};

const EN: ExportLabels = {
  fields: {
    company: {
      legalForm: "Legal form",
      sector: "Sector",
      entityType: "Entity type",
      employeeCount: "Employees",
      registeredAddress: "Address",
      primaryLocations: "Locations",
      contactEmail: "Contact",
      contactPhone: "Phone",
      bsiRegistrationId: "Registration with the BSI",
    },
    asset: {
      type: "Type",
      description: "What it does at your company",
      quantity: "Quantity",
      isCritical: "Critical",
      isOT: "Operational technology (OT)",
      owner: "Owner",
      location: "Location",
      hostname: "Hostname",
      ipAddress: "IP address",
      operatingSystem: "Operating system",
      softwareVersion: "Version",
      hasMfa: "Second factor",
      mfaMethod: "Kind of second factor",
      hasBackup: "Backup",
      backupFrequency: "Backup rhythm",
      lastBackupTestDate: "Last successful restore",
      processesPersonalData: "Personal data",
      endOfLife: "End of support",
    },
    supplier: {
      description: "What they do for you",
      serviceType: "Service",
      contactName: "Contact person",
      contactEmail: "Contact",
      riskLevel: "Risk",
      isCritical: "Critical",
      hasAccessToSystems: "Access to systems",
      hasAccessToData: "Access to data",
      hasSecurityClauses: "Security agreed in the contract",
      hasSecurityCertification: "Certified",
      securityCertificationType: "Certification",
      contractStartDate: "Contract since",
      contractEndDate: "Contract until",
      processesPersonalData: "Personal data",
      dpaAvailable: "Data processing agreement",
    },
    risk: {
      title: "Risk",
      description: "Description",
      likelihood: "Likelihood",
      impact: "Impact",
      riskScore: "Score",
      treatment: "Treatment",
      treatmentDescription: "Measures",
      riskOwner: "Owner",
      acceptedAt: "Accepted on",
    },
    training: {
      title: "Training",
      participantName: "Participants",
      participantRole: "Role",
      providerName: "Provider",
      completedAt: "Completed on",
      nextTrainingDue: "Next due",
    },
    managementReview: {
      title: "Review",
      reviewDate: "Date",
      attendees: "Attended",
      decisions: "Decided",
      actionItems: "Actions",
      nextReviewDate: "Next review",
    },
    incident: {
      internalRef: "Reference",
      title: "Incident",
      description: "Description",
      severity: "Severity",
      discoveredAt: "Discovered on",
      resolvedAt: "Resolved on",
    },
  },
  values: {
    essential: "Essential entity",
    important: "Important entity",
    kritis: "Operator of a critical facility",
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    mitigate: "Reduce",
    accept: "Accept",
    transfer: "Transfer",
    avoid: "Avoid",
    near_miss: "Near miss",
    incident: "Incident",
    significant: "Significant incident",
    ceo: "Management",
  },
  records: {
    company: "Company",
    asset: "Assets",
    supplier: "Suppliers",
    risk: "Risks",
    training: "Training",
    managementReview: "Management reviews",
    incident: "Incidents",
  },
  name: "Name",
  providers: "Providers",
  none: "No entries.",
  yes: "Yes",
  no: "No",
  asOf: "As of",
  issuedBy: "Made with",
  confidential: "Confidential",
  page: (page, total) => `Page ${page} of ${total}`,
  registers: { title: "Registers", eyebrow: "NIS 2 records" },
  documents: {
    title: "Documents",
    eyebrow: "NIS 2 records",
    empty: "The walkthrough has not written any documents yet.",
    status: "Status",
    approvedBy: "Approved by",
    approvedAt: "Approved on",
    version: "Version",
    effectiveFrom: "In force from",
    draft: "Draft, not approved yet",
    approved: "Approved",
  },
};

export const exportLabels = (locale: PdfLocale): ExportLabels =>
  locale === "de" ? DE : EN;
