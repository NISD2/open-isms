// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.
//
// The published way to report a vulnerability is asked of every supplier that
// develops software, in ./security-practices.ts.

import type { SupplierField } from "../schema";
import { ON_PREM } from "./gates";

export const onPremTechnicalFields: SupplierField[] = [
  {
    id: "onPremSupportEnd",
    section: "on_prem_technical",
    type: "string",
    label: {
      en: "Until when you supply security updates for the version you deliver",
      de: "Bis wann Sie für die gelieferte Version Sicherheitsupdates liefern",
    },
    description: {
      en: "Month and year, or the rule you apply. From 11 December 2027 the Cyber Resilience Act requires manufacturers to state this date at the time of purchase.",
      de: "Monat und Jahr oder die Regel, nach der Sie gehen. Ab dem 11.12.2027 verlangt der Cyber Resilience Act, dass Hersteller dieses Datum beim Kauf angeben.",
    },
    legalBasis: "CIR 2024/2690 §6.1.2(b); CRA Art. 13(19)",
    iso27001: ["A.5.21"],
    required: true,
    visibleWhen: ON_PREM,
  },
  {
    id: "onPremPatchSlaCriticalHours",
    section: "on_prem_technical",
    type: "integer",
    label: {
      en: "Deadline for security updates for critical vulnerabilities (hours)",
      de: "Frist für Sicherheitsupdates bei kritischen Schwachstellen (Stunden)",
    },
    description: {
      en: "Hours from a critical vulnerability becoming known to your fixed release. From 11 December 2027 the Cyber Resilience Act requires manufacturers to fix vulnerabilities without delay.",
      de: "Stunden vom Bekanntwerden einer kritischen Schwachstelle bis zu Ihrem korrigierten Release. Ab dem 11.12.2027 verlangt der Cyber Resilience Act von Herstellern, Schwachstellen unverzüglich zu beheben.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f); CRA Annex I Part II(2)",
    iso27001: ["A.8.8"],
    required: false,
    visibleWhen: ON_PREM,
  },
  {
    id: "onPremSbomProvided",
    section: "on_prem_technical",
    type: "boolean",
    label: {
      en: "Customers can get a Software Bill of Materials (SBOM)",
      de: "Kunden erhalten auf Wunsch eine Software Bill of Materials (SBOM)",
    },
    description: {
      en: "Tick yes if you give customers an SBOM for your releases (CycloneDX or SPDX). From 11 December 2027 the Cyber Resilience Act requires manufacturers to keep an SBOM in the technical documentation of products with digital elements; handing it to customers is up to you.",
      de: "Ja, wenn Sie Kunden zu Ihren Releases eine SBOM geben (CycloneDX oder SPDX). Ab dem 11.12.2027 verlangt der Cyber Resilience Act von Herstellern eine SBOM in der technischen Dokumentation von Produkten mit digitalen Elementen; sie an Kunden weiterzugeben, steht Ihnen frei.",
    },
    legalBasis: "CIR 2024/2690 §6.1.2(c); CRA Annex I Part II(1)",
    iso27001: ["A.5.21"],
    required: true,
    visibleWhen: ON_PREM,
  },
  {
    id: "onPremSignedReleases",
    section: "on_prem_technical",
    type: "boolean",
    label: {
      en: "Releases and updates are signed",
      de: "Releases und Updates sind signiert",
    },
    description: {
      en: "Tick yes if every release and update carries a signature your customers can check before installing, for example Sigstore, Authenticode or PGP.",
      de: "Ja, wenn jedes Release und jedes Update eine Signatur trägt, die Ihre Kunden vor der Installation prüfen können, zum Beispiel Sigstore, Authenticode oder PGP.",
    },
    legalBasis: "CIR 2024/2690 §6.6.1(c); CRA Annex I Part II(7)",
    iso27001: ["A.5.21"],
    required: true,
    visibleWhen: ON_PREM,
  },
];
