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
      en: "Tick yes if you ship a Software Bill of Materials with every release. CycloneDX or SPDX are the standard formats. Mandatory under the Cyber Resilience Act for products placed on the EU market from December 2027.",
      de: "Ja, wenn Sie mit jedem Release eine Software Bill of Materials ausliefern. Standardformate: CycloneDX oder SPDX. Verpflichtend nach dem Cyber Resilience Act für Produkte, die ab Dezember 2027 auf den EU-Markt kommen.",
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
      en: "Tick yes if every release artefact carries a cryptographic signature customers can verify. Signing keys are documented and rotated. Sigstore or PGP signatures both count.",
      de: "Ja, wenn jedes Release-Artefakt eine kryptografische Signatur trägt, die Kunden prüfen können. Signaturschlüssel sind dokumentiert und werden rotiert. Sigstore- oder PGP-Signaturen zählen beide.",
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
      en: "Tick yes if you have a publicly documented way to report security vulnerabilities. A security.txt file under your domain (per RFC 9116) or a dedicated email like security@example.com is enough.",
      de: "Ja, wenn Sie einen öffentlich dokumentierten Meldeweg für Sicherheitslücken haben. Eine security.txt-Datei auf Ihrer Domain (nach RFC 9116) oder eine dedizierte E-Mail wie security@firma.de genügt.",
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
      en: "Hours from public CVE disclosure to a patched release for critical vulnerabilities (CVSS 9.0+). Realistic commitment, not aspirational. Common values: 24, 48, or 72 hours.",
      de: "Stunden von der öffentlichen CVE-Veröffentlichung bis zum gepatchten Release für kritische Schwachstellen (CVSS 9.0+). Realistische Zusage, kein Wunschwert. Übliche Werte: 24, 48 oder 72 Stunden.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f)",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
];
