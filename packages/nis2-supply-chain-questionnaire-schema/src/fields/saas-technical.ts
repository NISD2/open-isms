// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const saasTechnicalFields: SupplierField[] = [
  {
    id: "saasHostingRegion",
    section: "saas_technical",
    type: "string",
    label: { en: "Hosting region", de: "Hosting-Region" },
    description: {
      en: "The cloud region where customer data is hosted. Example: AWS eu-central-1, Azure West Europe. Name the primary region; secondary or backup regions can be added comma-separated.",
      de: "Die Cloud-Region, in der Kundendaten gehostet werden. Beispiel: AWS eu-central-1, Azure West Europe. Geben Sie die Hauptregion an, Sekundär- oder Backup-Regionen kommen als kommagetrennte Liste dazu.",
    },
    legalBasis: "ENISA TIG §5.2",
    required: true,
    visibleWhen: { field: "isSaas", equals: true },
  },
  {
    id: "saasEncryptionAtRest",
    section: "saas_technical",
    type: "boolean",
    label: { en: "Encryption at rest", de: "Verschlüsselung im Ruhezustand" },
    description: {
      en: "Tick yes if customer data on disk is encrypted at rest with AES-256 or equivalent. Cloud-managed disk encryption (AWS EBS, Azure Disk Encryption) counts.",
      de: "Ja, wenn Kundendaten auf der Festplatte mit AES-256 oder gleichwertig verschlüsselt sind. Cloud-verwaltete Festplattenverschlüsselung (AWS EBS, Azure Disk Encryption) zählt.",
    },
    legalBasis: "NIS2 Art. 21(2)(h) / ENISA TIG §9",
    required: true,
    visibleWhen: { field: "isSaas", equals: true },
  },
  {
    id: "saasEncryptionInTransit",
    section: "saas_technical",
    type: "boolean",
    label: { en: "Encryption in transit (TLS ≥ 1.2)", de: "Verschlüsselung bei Übertragung (TLS ≥ 1.2)" },
    description: {
      en: "Tick yes if all customer-facing endpoints enforce TLS 1.2 or higher. TLS 1.3 is preferred. Plain HTTP must redirect to HTTPS.",
      de: "Ja, wenn alle kundenseitigen Endpunkte mindestens TLS 1.2 erzwingen. TLS 1.3 ist vorzuziehen. Reines HTTP muss auf HTTPS weiterleiten.",
    },
    legalBasis: "NIS2 Art. 21(2)(h) / ENISA TIG §9",
    required: true,
    visibleWhen: { field: "isSaas", equals: true },
  },
  {
    id: "saasMfaEnforced",
    section: "saas_technical",
    type: "boolean",
    label: { en: "MFA enforced for all admin accounts", de: "MFA für alle Admin-Konten erzwungen" },
    description: {
      en: "Tick yes if every internal admin account on the SaaS platform must use MFA. Same standard as your internal admin policy.",
      de: "Ja, wenn jedes interne Admin-Konto auf der SaaS-Plattform MFA verwenden muss. Gleicher Standard wie für Ihre internen Admin-Vorgaben.",
    },
    legalBasis: "NIS2 Art. 21(2)(j) / ENISA TIG §11.3",
    required: true,
    visibleWhen: { field: "isSaas", equals: true },
  },
  {
    id: "saasRtoHours",
    section: "saas_technical",
    type: "integer",
    label: { en: "Recovery time objective (RTO) in hours", de: "Recovery Time Objective (RTO) in Stunden" },
    description: {
      en: "Maximum number of hours your service can be unavailable before recovery. Realistic SLA value, not aspirational. Common SaaS values: 4, 8, or 24 hours.",
      de: "Maximale Anzahl Stunden, die Ihr Dienst ausfallen darf, bevor die Wiederherstellung greift. Realistischer SLA-Wert, kein Wunschwert. Übliche SaaS-Werte: 4, 8 oder 24 Stunden.",
    },
    legalBasis: "NIS2 Art. 21(2)(c) / ENISA TIG §4",
    required: true,
    visibleWhen: { field: "isSaas", equals: true },
  },
];
