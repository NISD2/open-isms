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
      en: "BSI IT-Grundschutz OPS.2.2 Cloud-Nutzung — where customer data is stored.",
      de: "BSI IT-Grundschutz OPS.2.2 Cloud-Nutzung — wo Kundendaten gespeichert werden.",
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
      en: "BSI IT-Grundschutz OPS.2.2.A11. AES-256 or equivalent.",
      de: "BSI IT-Grundschutz OPS.2.2.A11. AES-256 oder gleichwertig.",
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
      en: "BSI IT-Grundschutz OPS.2.2.A11. TLS 1.2 minimum, TLS 1.3 preferred.",
      de: "BSI IT-Grundschutz OPS.2.2.A11. Mindestens TLS 1.2, vorzugsweise TLS 1.3.",
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
      en: "BSI IT-Grundschutz ORP.4.A23 — second-factor authentication for privileged accounts.",
      de: "BSI IT-Grundschutz ORP.4.A23 — Zwei-Faktor-Authentisierung für privilegierte Konten.",
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
      en: "BSI IT-Grundschutz DER.4 — maximum tolerated downtime for customer service.",
      de: "BSI IT-Grundschutz DER.4 — maximal tolerierbare Ausfallzeit für den Kundenservice.",
    },
    legalBasis: "NIS2 Art. 21(2)(c) / ENISA TIG §4",
    required: true,
    visibleWhen: { field: "isSaas", equals: true },
  },
];
