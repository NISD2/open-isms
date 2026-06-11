// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const managedServicesFields: SupplierField[] = [
  {
    id: "managedPrivilegedAccessMgmt",
    section: "managed_services",
    type: "boolean",
    label: { en: "Privileged access management (PAM) in place", de: "Privileged Access Management (PAM) im Einsatz" },
    description: {
      en: "BSI IT-Grundschutz ORP.4.A26 — PAM for administrative remote access.",
      de: "BSI IT-Grundschutz ORP.4.A26 — PAM für administrativen Fernzugriff.",
    },
    legalBasis: "NIS2 Art. 21(2)(i) / ENISA TIG §11.3",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
  {
    id: "managedSessionRecording",
    section: "managed_services",
    type: "boolean",
    label: { en: "Admin sessions are recorded", de: "Admin-Sitzungen werden aufgezeichnet" },
    description: {
      en: "BSI IT-Grundschutz OPS.1.2.5.A11 — recorded remote maintenance sessions.",
      de: "BSI IT-Grundschutz OPS.1.2.5.A11 — aufgezeichnete Fernwartungssitzungen.",
    },
    legalBasis: "NIS2 Art. 21(2)(f) / ENISA TIG §10",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
  {
    id: "managedOnCall24x7",
    section: "managed_services",
    type: "boolean",
    label: { en: "24/7 on-call coverage", de: "24/7-Bereitschaft" },
    description: {
      en: "BSI IT-Grundschutz DER.2.1 — incident detection and response coverage.",
      de: "BSI IT-Grundschutz DER.2.1 — Erkennungs- und Reaktionsabdeckung für Vorfälle.",
    },
    legalBasis: "NIS2 Art. 21(2)(b) / ENISA TIG §3",
    required: true,
    visibleWhen: { field: "isManagedService", equals: true },
  },
];
