import type { EXPORT_FIELDS, ExportRecord } from "@/lib/export/company-export";
import type { PdfLocale } from "./format";

/**
 * The export's own words. Register fields and coded values are named from the messages the app's
 * forms and screens use (`exportNames`); only the company's master data is labelled here, since
 * the organization form names those fields differently.
 */
export type ExportFramework = "nis2" | "gdpr";

export interface ExportLabels {
  readonly company: Readonly<Record<(typeof EXPORT_FIELDS)["company"][number], string>>;
  /** What each framework is called in the document's language. */
  readonly frameworks: Readonly<Record<ExportFramework, string>>;
  /** The GDPR's two files that are not documents; `file` names, without date or extension. */
  readonly gdprFiles: { readonly record: string; readonly data: string };
  readonly records: Readonly<Record<ExportRecord, string>>;
  readonly providers: string;
  readonly none: string;
  readonly yes: string;
  readonly no: string;
  readonly asOf: string;
  readonly issuedBy: string;
  readonly confidential: string;
  readonly page: (page: number, total: number) => string;
  /** `file` names the download, without date or extension. */
  readonly registers: {
    readonly title: string;
    readonly eyebrow: string;
    readonly file: string;
  };
  readonly documents: {
    readonly title: string;
    readonly eyebrow: Readonly<Record<ExportFramework, string>>;
    readonly file: Readonly<Record<ExportFramework, string>>;
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
    vulnerability: "Schwachstellen",
    patch: "Patches",
    change: "Änderungen",
    exercise: "Übungen",
    improvement: "Verbesserungen",
    internalAudit: "Interne Audits",
    kpi: "Kennzahlen",
  },
  providers: "Anbieter",
  none: "Keine Einträge.",
  yes: "Ja",
  no: "Nein",
  asOf: "Stand",
  issuedBy: "Erstellt mit",
  confidential: "Vertraulich",
  page: (page, total) => `Seite ${page} von ${total}`,
  frameworks: { nis2: "NIS 2", gdpr: "DSGVO" },
  gdprFiles: { record: "dsgvo-verarbeitungsverzeichnis", data: "dsgvo-daten" },
  registers: { title: "Register", eyebrow: "NIS 2 Dokumentation", file: "nis2-register" },
  documents: {
    title: "Dokumente",
    eyebrow: { nis2: "NIS 2 Dokumentation", gdpr: "DSGVO Dokumentation" },
    file: { nis2: "nis2-dokumente", gdpr: "dsgvo-dokumente" },
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
    vulnerability: "Vulnerabilities",
    patch: "Patches",
    change: "Changes",
    exercise: "Exercises",
    improvement: "Improvements",
    internalAudit: "Internal audits",
    kpi: "KPI measurements",
  },
  providers: "Providers",
  none: "No entries.",
  yes: "Yes",
  no: "No",
  asOf: "As of",
  issuedBy: "Made with",
  confidential: "Confidential",
  page: (page, total) => `Page ${page} of ${total}`,
  frameworks: { nis2: "NIS 2", gdpr: "GDPR" },
  gdprFiles: { record: "gdpr-record-of-processing", data: "gdpr-data" },
  registers: { title: "Registers", eyebrow: "NIS 2 records", file: "nis2-registers" },
  documents: {
    title: "Documents",
    eyebrow: { nis2: "NIS 2 records", gdpr: "GDPR records" },
    file: { nis2: "nis2-documents", gdpr: "gdpr-documents" },
    empty: "The walkthrough has not written any documents yet.",
    approvedBy: "Approved by",
    approvedAt: "Approved on",
    version: "Version",
    effectiveFrom: "In force from",
    draft: "Draft, not approved yet",
    approved: "Approved",
  },
};

/** The Czech regulator is NÚKIB: the contact point and the registration are with it, as the organization form says. */
const CS: ExportLabels = {
  company: {
    legalForm: "Právní forma",
    sector: "Odvětví",
    entityType: "Klasifikace subjektu",
    employeeCount: "Počet zaměstnanců",
    registeredAddress: "Sídlo",
    primaryLocations: "Lokality",
    contactEmail: "Kontakt",
    contactPhone: "Telefon",
    cisoName: "Osoba odpovědná za informační bezpečnost",
    cisoReportsTo: "Nadřízený",
    bsiContactName: "Kontaktní osoba pro NÚKIB",
    bsiContactEmail: "Kontaktní e-mail pro NÚKIB",
    bsiContactPhone: "Kontaktní telefon pro NÚKIB",
    bsiRegistrationId: "Č. j. rozhodnutí NÚKIB o registraci",
  },
  records: {
    company: "Základní údaje",
    asset: "Aktiva",
    supplier: "Dodavatelé",
    risk: "Rizika",
    training: "Školení",
    managementReview: "Přezkumy vedení",
    incident: "Incidenty",
    vulnerability: "Zranitelnosti",
    patch: "Aktualizace",
    change: "Změny",
    exercise: "Cvičení",
    improvement: "Zlepšení",
    internalAudit: "Interní audity",
    kpi: "Měření KPI",
  },
  providers: "Poskytovatelé",
  none: "Žádné záznamy.",
  yes: "Ano",
  no: "Ne",
  asOf: "Stav k",
  issuedBy: "Vytvořeno pomocí",
  confidential: "Důvěrné",
  page: (page, total) => `Strana ${page} z ${total}`,
  frameworks: { nis2: "NIS 2", gdpr: "GDPR" },
  gdprFiles: { record: "gdpr-zaznamy-o-cinnostech-zpracovani", data: "gdpr-data" },
  registers: { title: "Registry", eyebrow: "Dokumentace NIS 2", file: "nis2-registry" },
  documents: {
    title: "Dokumenty",
    eyebrow: { nis2: "Dokumentace NIS 2", gdpr: "Dokumentace GDPR" },
    file: { nis2: "nis2-dokumenty", gdpr: "gdpr-dokumenty" },
    empty: "Průvodce zatím nevytvořil žádné dokumenty.",
    approvedBy: "Schválil",
    approvedAt: "Datum schválení",
    version: "Verze",
    effectiveFrom: "Účinnost od",
    draft: "Koncept, zatím neschválený",
    approved: "Schváleno",
  },
};

const LABELS: Readonly<Record<PdfLocale, ExportLabels>> = { de: DE, en: EN, cs: CS };

export const exportLabels = (locale: PdfLocale): ExportLabels => LABELS[locale];
