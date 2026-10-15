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
      cs: "Do kdy dodáváte bezpečnostní aktualizace pro dodanou verzi",
    },
    description: {
      en: "Month and year, or the rule you apply. From 11 December 2027 the Cyber Resilience Act requires manufacturers to state this date at the time of purchase.",
      de: "Monat und Jahr oder die Regel, nach der Sie gehen. Ab dem 11.12.2027 verlangt der Cyber Resilience Act, dass Hersteller dieses Datum beim Kauf angeben.",
      cs: "Měsíc a rok, nebo pravidlo, podle kterého postupujete. Od 11. prosince 2027 vyžaduje akt o kybernetické odolnosti (CRA), aby výrobci toto datum uvedli při nákupu.",
    },
    legalBasis: "CIR 2024/2690 §6.1.2(b); CRA Art. 13(19)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 6.1.2 písm. b); akt o kybernetické odolnosti (CRA), čl. 13 odst. 19",
    },
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
      cs: "Lhůta pro bezpečnostní aktualizace u kritických zranitelností (hodiny)",
    },
    description: {
      en: "Hours from a critical vulnerability becoming known to your fixed release. From 11 December 2027 the Cyber Resilience Act requires manufacturers to fix vulnerabilities without delay.",
      de: "Stunden vom Bekanntwerden einer kritischen Schwachstelle bis zu Ihrem korrigierten Release. Ab dem 11.12.2027 verlangt der Cyber Resilience Act von Herstellern, Schwachstellen unverzüglich zu beheben.",
      cs: "Počet hodin od chvíle, kdy se kritická zranitelnost stane známou, do vydání vaší opravené verze. Od 11. prosince 2027 vyžaduje akt o kybernetické odolnosti (CRA), aby výrobci zranitelnosti odstraňovali bez zbytečného odkladu.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f); CRA Annex I Part II(2)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 5.1.4 písm. f); akt o kybernetické odolnosti (CRA), příloha I část II bod 2",
    },
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
      cs: "Zákazníci mohou dostat soupis softwarových komponent (SBOM)",
    },
    description: {
      en: "Tick yes if you give customers an SBOM for your releases (CycloneDX or SPDX). From 11 December 2027 the Cyber Resilience Act requires manufacturers to keep an SBOM in the technical documentation of products with digital elements; handing it to customers is up to you.",
      de: "Ja, wenn Sie Kunden zu Ihren Releases eine SBOM geben (CycloneDX oder SPDX). Ab dem 11.12.2027 verlangt der Cyber Resilience Act von Herstellern eine SBOM in der technischen Dokumentation von Produkten mit digitalen Elementen; sie an Kunden weiterzugeben, steht Ihnen frei.",
      cs: "Ano, pokud zákazníkům ke svým verzím poskytujete SBOM (CycloneDX nebo SPDX). Od 11. prosince 2027 vyžaduje akt o kybernetické odolnosti (CRA), aby výrobci měli SBOM v technické dokumentaci produktů s digitálními prvky; zda ho předáte zákazníkům, je na vás.",
    },
    legalBasis: "CIR 2024/2690 §6.1.2(c); CRA Annex I Part II(1)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 6.1.2 písm. c); akt o kybernetické odolnosti (CRA), příloha I část II bod 1",
    },
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
      cs: "Verze a aktualizace jsou podepsané",
    },
    description: {
      en: "Tick yes if every release and update carries a signature your customers can check before installing, for example Sigstore, Authenticode or PGP.",
      de: "Ja, wenn jedes Release und jedes Update eine Signatur trägt, die Ihre Kunden vor der Installation prüfen können, zum Beispiel Sigstore, Authenticode oder PGP.",
      cs: "Ano, pokud každá verze a každá aktualizace nese podpis, který si zákazníci mohou před instalací ověřit, například Sigstore, Authenticode nebo PGP.",
    },
    legalBasis: "CIR 2024/2690 §6.6.1(c); CRA Annex I Part II(7)",
    legalBasisLocalised: {
      cs: "prováděcí nařízení (EU) 2024/2690, příloha, bod 6.6.1 písm. c); akt o kybernetické odolnosti (CRA), příloha I část II bod 7",
    },
    iso27001: ["A.5.21"],
    required: true,
    visibleWhen: ON_PREM,
  },
];
