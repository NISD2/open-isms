// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const proServicesFields: SupplierField[] = [
  {
    id: "proServicesBackgroundCheckScope",
    section: "pro_services",
    type: "string",
    label: { en: "Background check scope", de: "Umfang der Zuverlässigkeitsprüfung" },
    description: {
      en: "BSI IT-Grundschutz ORP.2.A14 — staff vetting for sensitive roles.",
      de: "BSI IT-Grundschutz ORP.2.A14 — Personalprüfung für sensible Rollen.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / CIR 2024/2690 §5.1.4(c)",
    required: true,
    visibleWhen: { field: "isProfessionalServices", equals: true },
  },
  {
    id: "proServicesNdaInPlace",
    section: "pro_services",
    type: "boolean",
    label: { en: "NDA in place with all consultants", de: "NDA mit allen Beratern abgeschlossen" },
    description: {
      en: "BSI IT-Grundschutz ORP.2.A2 — confidentiality agreements with all consultants.",
      de: "BSI IT-Grundschutz ORP.2.A2 — Vertraulichkeitsvereinbarungen mit allen Beratern.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.4",
    required: true,
    visibleWhen: { field: "isProfessionalServices", equals: true },
  },
  {
    id: "proServicesCustomerPremisesPolicy",
    section: "pro_services",
    type: "boolean",
    label: { en: "Documented customer-premises behaviour policy", de: "Dokumentierte Verhaltensrichtlinie auf Kundenstandort" },
    description: {
      en: "BSI IT-Grundschutz ORP.3.A4 — security awareness on customer premises.",
      de: "BSI IT-Grundschutz ORP.3.A4 — Sicherheitssensibilisierung auf Kundenstandort.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
    required: true,
    visibleWhen: { field: "isProfessionalServices", equals: true },
  },
];
