import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.3",
  passingScore: 75,
  questions: [
    {
      id: "1.3.1",
      question: {
        en: "What is the minimum retention period for the SBOM under CRA Article 31?",
        de: "Wie lang ist die Mindestaufbewahrungspflicht für die SBOM gemäß CRA Artikel 31?",
      },
      options: [
        { en: "5 years after first placement on the market", de: "5 Jahre nach erstmaligem Inverkehrbringen" },
        { en: "10 years after first placement on the market, or for the support period, whichever is longer", de: "10 Jahre nach erstmaligem Inverkehrbringen oder für die Unterstützungsdauer, je nachdem, was länger ist" },
        { en: "3 years, or until a new product version is released", de: "3 Jahre oder bis eine neue Produktversion veröffentlicht wird" },
        { en: "7 years after the product is withdrawn from the market", de: "7 Jahre nach dem Rückzug des Produkts vom Markt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CRA Article 31(3) requires technical documentation to be kept for 10 years after the product is placed on the market, or for the support period, whichever is longer. For long-lived industrial products, the support period may exceed 10 years.",
        de: "CRA Artikel 31(3) verlangt, dass technische Dokumentation 10 Jahre nach Inverkehrbringen oder für die Unterstützungsdauer aufbewahrt wird, je nachdem, was länger ist. Bei langlebigen Industrieprodukten kann die Unterstützungsdauer 10 Jahre überschreiten.",
      },
    },
    {
      id: "1.3.2",
      question: {
        en: "Who can request the technical documentation, including the SBOM, under CRA Article 31?",
        de: "Wer kann die technische Dokumentation, einschließlich der SBOM, gemäß CRA Artikel 31 anfordern?",
      },
      options: [
        { en: "Any member of the public who can demonstrate a security interest", de: "Jede Person der Öffentlichkeit, die ein Sicherheitsinteresse nachweisen kann" },
        { en: "Only the manufacturer's customers under GDPR data access rights", de: "Nur die Kunden des Herstellers gemäß DSGVO-Datenzugriffsrechten" },
        { en: "National market surveillance authorities", de: "Nationale Marktüberwachungsbehörden" },
        { en: "ENISA and the European Commission only", de: "Nur ENISA und die Europäische Kommission" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Market surveillance authorities — national bodies such as the BSI in Germany — can request technical documentation at any time. The SBOM is not a public document and does not have to be made available to customers or the general public.",
        de: "Marktüberwachungsbehörden — nationale Stellen wie das BSI in Deutschland — können die technische Dokumentation jederzeit anfordern. Die SBOM ist kein öffentliches Dokument und muss weder Kunden noch der allgemeinen Öffentlichkeit zugänglich gemacht werden.",
      },
    },
    {
      id: "1.3.3",
      question: {
        en: "A manufacturer releases 20 security patches for a product over three years. How many SBOMs must be retained?",
        de: "Ein Hersteller veröffentlicht über drei Jahre hinweg 20 Sicherheits-Patches für ein Produkt. Wie viele SBOMs müssen aufbewahrt werden?",
      },
      options: [
        { en: "Only the latest SBOM needs to be retained", de: "Nur die aktuelle SBOM muss aufbewahrt werden" },
        { en: "One SBOM per year is sufficient", de: "Eine SBOM pro Jahr ist ausreichend" },
        { en: "An SBOM for each release version — 20 SBOMs in this case", de: "Eine SBOM für jede Release-Version — in diesem Fall 20 SBOMs" },
        { en: "SBOMs only need to be retained for the final version of the product", de: "SBOMs müssen nur für die letzte Version des Produkts aufbewahrt werden" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Each released version has its own component inventory. A market surveillance authority investigating a vulnerability from three years ago wants the SBOM from the version that was in the market at that time. Retain one SBOM per release, linked to that release's version and build.",
        de: "Jede veröffentlichte Version hat ihr eigenes Komponenteninventar. Eine Marktüberwachungsbehörde, die eine Schwachstelle von vor drei Jahren untersucht, möchte die SBOM der Version, die zu diesem Zeitpunkt auf dem Markt war. Bewahren Sie eine SBOM pro Release auf, verknüpft mit der Version und dem Build dieses Releases.",
      },
    },
    {
      id: "1.3.4",
      question: {
        en: "The SBOM is part of which CRA document set?",
        de: "Die SBOM ist Teil welcher CRA-Dokumentensammlung?",
      },
      options: [
        { en: "The EU declaration of conformity", de: "Die EU-Konformitätserklärung" },
        { en: "The technical documentation under Article 31 and Annex VII", de: "Die technische Dokumentation gemäß Artikel 31 und Anhang VII" },
        { en: "The vulnerability disclosure policy under Article 13(6)", de: "Die Richtlinie zur Schwachstellenmeldung gemäß Artikel 13(6)" },
        { en: "The product safety data sheet", de: "Das Produktsicherheitsdatenblatt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The SBOM is one item in the technical documentation package required by Article 31 and detailed in Annex VII. The full package also includes the risk assessment, secure design documentation, test results, and the EU declaration of conformity.",
        de: "Die SBOM ist ein Bestandteil der technischen Dokumentation, die Artikel 31 verlangt und Anhang VII detailliert. Das vollständige Paket umfasst auch die Risikobeurteilung, die Dokumentation des sicheren Designs, Testergebnisse und die EU-Konformitätserklärung.",
      },
    },
    {
      id: "1.3.5",
      question: {
        en: "Which storage approach best supports the 10-year retention requirement?",
        de: "Welcher Speicheransatz unterstützt die 10-jährige Aufbewahrungspflicht am besten?",
      },
      options: [
        { en: "Store only the current SBOM in your CI/CD system's artifact cache", de: "Speichern Sie nur die aktuelle SBOM im Artifact-Cache Ihres CI/CD-Systems" },
        { en: "Store SBOMs in version control tagged with product version and build timestamp, using a format (JSON) that will remain readable", de: "Speichern Sie SBOMs in der Versionsverwaltung, getaggt mit Produktversion und Build-Zeitstempel, in einem Format (JSON), das lesbar bleibt" },
        { en: "Store SBOMs as PDFs attached to the product user manual", de: "Speichern Sie SBOMs als PDFs, die dem Produktbenutzerhandbuch beigefügt sind" },
        { en: "Regenerate SBOMs on demand using the current codebase whenever an authority requests one", de: "Erstellen Sie SBOMs bei Bedarf aus dem aktuellen Codestand neu, wenn eine Behörde eine anfordert" },
      ],
      correctIndex: 1,
      explanation: {
        en: "SBOMs must be retained for each specific release version. Storing them in version control with version and timestamp tags creates the audit trail. Using standard JSON formats (CycloneDX, SPDX) ensures readability in 10 years. Regenerating from current code does not reproduce the state at release time.",
        de: "SBOMs müssen für jede spezifische Release-Version aufbewahrt werden. Die Speicherung in der Versionsverwaltung mit Versions- und Zeitstempel-Tags erstellt den Prüfpfad. Die Verwendung von Standard-JSON-Formaten (CycloneDX, SPDX) gewährleistet die Lesbarkeit in 10 Jahren. Die Neuerstellung aus dem aktuellen Code reproduziert nicht den Zustand zum Zeitpunkt des Releases.",
      },
    },
  ],
});

export default quiz;
