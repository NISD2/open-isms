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
      en: "Describe how you vet consultants for sensitive roles. Example: criminal record extract for all consultants, plus reference checks for engagements involving classified data.",
      de: "Beschreiben Sie, wie Sie Berater für sensible Rollen prüfen. Beispiel: polizeiliches Führungszeugnis für alle Berater, zusätzlich Referenzprüfungen bei Einsätzen mit klassifizierten Daten.",
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
      en: "Tick yes if every consultant signs a confidentiality agreement before being assigned to customer work. Either as part of the employment contract or as a separate NDA.",
      de: "Ja, wenn jeder Berater vor dem Einsatz beim Kunden eine Vertraulichkeitsvereinbarung unterschreibt. Entweder als Bestandteil des Arbeitsvertrags oder als separates NDA.",
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
      en: "Tick yes if you have a written code of conduct for consultants working on customer premises: badge handling, locked-screen rule, what to do if data leaves the site.",
      de: "Ja, wenn Sie eine schriftliche Verhaltensrichtlinie für Berater im Kundeneinsatz haben: Umgang mit Ausweisen, Sperrbildschirm-Pflicht, Verhalten beim Datenexport vom Standort.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
    required: true,
    visibleWhen: { field: "isProfessionalServices", equals: true },
  },
];
