// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const onPremTechnicalFields: SupplierField[] = [
  {
    id: "onPremSbomProvided",
    section: "on_prem_technical",
    type: "boolean",
    label: { en: "Provide a Software Bill of Materials (SBOM)", de: "Bereitstellung einer Software Bill of Materials (SBOM)" },
    description: {
      en: "CRA / NIS2 supply-chain transparency. Format: CycloneDX or SPDX.",
      de: "CRA / NIS2 Lieferketten-Transparenz. Format: CycloneDX oder SPDX.",
    },
    legalBasis: "CRA / NIS2 Art. 21(2)(d)",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
  {
    id: "onPremSignedReleases",
    section: "on_prem_technical",
    type: "boolean",
    label: { en: "Releases are cryptographically signed", de: "Releases sind kryptografisch signiert" },
    description: {
      en: "BSI IT-Grundschutz CON.8 Software-Entwicklung — signed releases prevent supply-chain tampering.",
      de: "BSI IT-Grundschutz CON.8 Software-Entwicklung — signierte Releases verhindern Lieferketten-Manipulation.",
    },
    legalBasis: "NIS2 Art. 21(2)(e) / ENISA TIG §6.5",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
  {
    id: "onPremVulnerabilityDisclosurePolicy",
    section: "on_prem_technical",
    type: "boolean",
    label: { en: "Published vulnerability disclosure policy", de: "Veröffentlichte Vulnerability-Disclosure-Policy" },
    description: {
      en: "BSI IT-Grundschutz CON.10. Public security.txt or contact for vulnerability reports.",
      de: "BSI IT-Grundschutz CON.10. Öffentliche security.txt oder Kontakt für Schwachstellenmeldungen.",
    },
    legalBasis: "NIS2 Art. 21(2)(e) / ENISA TIG §3",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
  {
    id: "onPremPatchSlaCriticalHours",
    section: "on_prem_technical",
    type: "integer",
    label: { en: "Patch SLA for critical CVEs (hours)", de: "Patch-SLA für kritische CVEs (Stunden)" },
    description: {
      en: "Time from CVE disclosure to patch availability for critical vulnerabilities.",
      de: "Zeit von CVE-Veröffentlichung bis zur Patch-Verfügbarkeit für kritische Schwachstellen.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f)",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
];
