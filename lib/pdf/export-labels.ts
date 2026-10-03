import type { EXPORT_FIELDS, ExportRecord } from "@/lib/export/company-export";
import type { PdfLocale } from "./format";

/**
 * The export's own words. Register fields and coded values are named from the messages the app's
 * forms and screens use (`exportNames`); only the company's master data is labelled here, since
 * the organization form names those fields differently.
 */
export interface ExportLabels {
  readonly company: Readonly<Record<(typeof EXPORT_FIELDS)["company"][number], string>>;
  readonly records: Readonly<Record<ExportRecord, string>>;
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
    readonly approvedBy: string;
    readonly approvedAt: string;
    readonly version: string;
    readonly effectiveFrom: string;
    readonly draft: string;
    readonly approved: string;
  };
}

const DE: ExportLabels = {
  company: {
    legalForm: "Rechtsform",
    sector: "Sektor",
    entityType: "Einrichtungstyp",
    employeeCount: "Beschäftigte",
    registeredAddress: "Anschrift",
    primaryLocations: "Standorte",
    contactEmail: "Kontakt",
    contactPhone: "Telefon",
    cisoName: "Verantwortlich für Informationssicherheit",
    cisoReportsTo: "Berichtet an",
    bsiContactName: "Kontaktstelle für das BSI",
    bsiContactEmail: "E-Mail der Kontaktstelle",
    bsiContactPhone: "Telefon der Kontaktstelle",
    bsiRegistrationId: "Registrierung beim BSI",
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
    approvedBy: "Freigegeben von",
    approvedAt: "Freigegeben am",
    version: "Version",
    effectiveFrom: "Gültig ab",
    draft: "Entwurf, noch nicht freigegeben",
    approved: "Freigegeben",
  },
};

const EN: ExportLabels = {
  company: {
    legalForm: "Legal form",
    sector: "Sector",
    entityType: "Entity type",
    employeeCount: "Employees",
    registeredAddress: "Address",
    primaryLocations: "Locations",
    contactEmail: "Contact",
    contactPhone: "Phone",
    cisoName: "Responsible for information security",
    cisoReportsTo: "Reports to",
    bsiContactName: "Contact point for the BSI",
    bsiContactEmail: "Contact point email",
    bsiContactPhone: "Contact point phone",
    bsiRegistrationId: "Registration with the BSI",
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
