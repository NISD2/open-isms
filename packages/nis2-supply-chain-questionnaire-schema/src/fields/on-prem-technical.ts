// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.

import type { SupplierField } from "../schema";

export const onPremTechnicalFields: SupplierField[] = [
  {
    id: "onPremSbomProvided",
    section: "on_prem_technical",
    type: "boolean",
    label: {
      en: "Provide a Software Bill of Materials (SBOM)",
      de: "Bereitstellung einer Software Bill of Materials (SBOM)",
      fr: "Fournir une nomenclature logicielle (SBOM)",
      it: "Fornire una distinta base del software (SBOM)",
      es: "Proporcionar una lista de materiales de software (SBOM)",
      pl: "Dostarczanie wykazu komponentów oprogramowania (SBOM)",
    },
    description: {
      en: "Tick yes if you ship a Software Bill of Materials with every release. CycloneDX or SPDX are the standard formats. Mandatory under the Cyber Resilience Act for products placed on the EU market from December 2027.",
      de: "Ja, wenn Sie mit jedem Release eine Software Bill of Materials ausliefern. Standardformate: CycloneDX oder SPDX. Verpflichtend nach dem Cyber Resilience Act für Produkte, die ab Dezember 2027 auf den EU-Markt kommen.",
      fr: "Cochez oui si vous livrez une nomenclature logicielle (SBOM) avec chaque version. CycloneDX ou SPDX sont les formats standard. Obligatoire au titre du Cyber Resilience Act pour les produits mis sur le marché de l'UE à partir de décembre 2027.",
      it: "Selezionare sì se si fornisce una distinta base del software (SBOM) con ogni release. CycloneDX o SPDX sono i formati standard. Obbligatorio ai sensi del Cyber Resilience Act per i prodotti immessi sul mercato dell'UE a partire da dicembre 2027.",
      es: "Marque sí si entrega una lista de materiales de software (SBOM) con cada versión. CycloneDX o SPDX son los formatos estándar. Obligatorio en virtud del Cyber Resilience Act para los productos introducidos en el mercado de la UE a partir de diciembre de 2027.",
      pl: "Zaznacz tak, jeśli dostarczasz wykaz komponentów oprogramowania (SBOM) z każdym wydaniem. CycloneDX lub SPDX to formaty standardowe. Obowiązkowe na mocy Cyber Resilience Act dla produktów wprowadzanych na rynek UE od grudnia 2027 r.",
    },
    legalBasis: "CRA / NIS2 Art. 21(2)(d)",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
  {
    id: "onPremSignedReleases",
    section: "on_prem_technical",
    type: "boolean",
    label: {
      en: "Releases are cryptographically signed",
      de: "Releases sind kryptografisch signiert",
      fr: "Les versions sont signées cryptographiquement",
      it: "Le release sono firmate crittograficamente",
      es: "Las versiones están firmadas criptográficamente",
      pl: "Wydania są podpisane kryptograficznie",
    },
    description: {
      en: "Tick yes if every release artefact carries a cryptographic signature customers can verify. Signing keys are documented and rotated. Sigstore or PGP signatures both count.",
      de: "Ja, wenn jedes Release-Artefakt eine kryptografische Signatur trägt, die Kunden prüfen können. Signaturschlüssel sind dokumentiert und werden rotiert. Sigstore- oder PGP-Signaturen zählen beide.",
      fr: "Cochez oui si chaque artefact de version porte une signature cryptographique que les clients peuvent vérifier. Les clés de signature sont documentées et font l'objet d'une rotation. Les signatures Sigstore ou PGP comptent toutes les deux.",
      it: "Selezionare sì se ogni artefatto di release reca una firma crittografica verificabile dai clienti. Le chiavi di firma sono documentate e soggette a rotazione. Sono valide sia le firme Sigstore sia quelle PGP.",
      es: "Marque sí si cada artefacto de versión lleva una firma criptográfica que los clientes puedan verificar. Las claves de firma están documentadas y se rotan. Las firmas Sigstore o PGP cuentan ambas.",
      pl: "Zaznacz tak, jeśli każdy artefakt wydania ma podpis kryptograficzny, który klienci mogą zweryfikować. Klucze podpisujące są udokumentowane i podlegają rotacji. Liczą się zarówno podpisy Sigstore, jak i PGP.",
    },
    legalBasis: "NIS2 Art. 21(2)(e) / ENISA TIG §6.5",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
  {
    id: "onPremVulnerabilityDisclosurePolicy",
    section: "on_prem_technical",
    type: "boolean",
    label: {
      en: "Published vulnerability disclosure policy",
      de: "Veröffentlichte Vulnerability-Disclosure-Policy",
      fr: "Politique de divulgation des vulnérabilités publiée",
      it: "Politica di divulgazione delle vulnerabilità pubblicata",
      es: "Política de divulgación de vulnerabilidades publicada",
      pl: "Opublikowana polityka ujawniania podatności",
    },
    description: {
      en: "Tick yes if you have a publicly documented way to report security vulnerabilities. A security.txt file under your domain (per RFC 9116) or a dedicated email like security@example.com is enough.",
      de: "Ja, wenn Sie einen öffentlich dokumentierten Meldeweg für Sicherheitslücken haben. Eine security.txt-Datei auf Ihrer Domain (nach RFC 9116) oder eine dedizierte E-Mail wie security@firma.de genügt.",
      fr: "Cochez oui si vous disposez d'un moyen documenté publiquement pour signaler les vulnérabilités de sécurité. Un fichier security.txt sur votre domaine (selon RFC 9116) ou une adresse e-mail dédiée comme security@example.com suffit.",
      it: "Selezionare sì se si dispone di una modalità documentata pubblicamente per segnalare le vulnerabilità di sicurezza. È sufficiente un file security.txt sul proprio dominio (secondo RFC 9116) o un indirizzo e-mail dedicato come security@example.com.",
      es: "Marque sí si dispone de una vía documentada públicamente para notificar vulnerabilidades de seguridad. Basta con un archivo security.txt en su dominio (conforme a RFC 9116) o un correo electrónico dedicado como security@example.com.",
      pl: "Zaznacz tak, jeśli masz publicznie udokumentowany sposób zgłaszania podatności bezpieczeństwa. Wystarczy plik security.txt w Twojej domenie (zgodnie z RFC 9116) lub dedykowany adres e-mail, taki jak security@example.com.",
    },
    legalBasis: "NIS2 Art. 21(2)(e) / ENISA TIG §3",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
  {
    id: "onPremPatchSlaCriticalHours",
    section: "on_prem_technical",
    type: "integer",
    label: {
      en: "Patch SLA for critical CVEs (hours)",
      de: "Patch-SLA für kritische CVEs (Stunden)",
      fr: "SLA de correctif pour les CVE critiques (heures)",
      it: "SLA delle patch per CVE critiche (ore)",
      es: "SLA de parches para CVE críticas (horas)",
      pl: "SLA poprawek dla krytycznych CVE (godziny)",
    },
    description: {
      en: "Hours from public CVE disclosure to a patched release for critical vulnerabilities (CVSS 9.0+). Realistic commitment, not aspirational. Common values: 24, 48, or 72 hours.",
      de: "Stunden von der öffentlichen CVE-Veröffentlichung bis zum gepatchten Release für kritische Schwachstellen (CVSS 9.0+). Realistische Zusage, kein Wunschwert. Übliche Werte: 24, 48 oder 72 Stunden.",
      fr: "Heures entre la divulgation publique d'une CVE et une version corrigée pour les vulnérabilités critiques (CVSS 9.0+). Engagement réaliste, pas un objectif théorique. Valeurs courantes : 24, 48 ou 72 heures.",
      it: "Ore tra la divulgazione pubblica di una CVE e una release con patch per le vulnerabilità critiche (CVSS 9.0+). Impegno realistico, non un valore ideale. Valori comuni: 24, 48 o 72 ore.",
      es: "Horas desde la divulgación pública de una CVE hasta una versión parcheada para las vulnerabilidades críticas (CVSS 9.0+). Compromiso realista, no aspiracional. Valores habituales: 24, 48 o 72 horas.",
      pl: "Godziny od publicznego ujawnienia CVE do wydania z poprawką dla krytycznych podatności (CVSS 9.0+). Realistyczne zobowiązanie, a nie wartość docelowa. Typowe wartości: 24, 48 lub 72 godziny.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(f)",
    required: true,
    visibleWhen: { field: "isOnPrem", equals: true },
  },
];
