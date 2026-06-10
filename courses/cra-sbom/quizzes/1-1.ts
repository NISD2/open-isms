import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.1",
  passingScore: 75,
  questions: [
    {
      id: "1.1.1",
      question: {
        en: "Which field allows a vulnerability scanner to look up a component in a CVE database?",
        de: "Welches Feld ermöglicht einem Schwachstellenscanner die Suche nach einer Komponente in einer CVE-Datenbank?",
      },
      options: [
        { en: "The component name field", de: "Das Namensfeld der Komponente" },
        { en: "The PURL (Package URL)", de: "Die PURL (Package URL)" },
        { en: "The supplier field", de: "Das Lieferantenfeld" },
        { en: "The license identifier", de: "Der Lizenzbezeichner" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The PURL (Package URL) is the standard unique identifier for SBOM components. Vulnerability databases use PURLs to link CVE records to specific packages and versions, making them the anchor for automated vulnerability scanning.",
        de: "Die PURL (Package URL) ist der standardisierte eindeutige Bezeichner für SBOM-Komponenten. Schwachstellendatenbanken verwenden PURLs, um CVE-Einträge mit bestimmten Paketen und Versionen zu verknüpfen — sie sind der Anker für automatisierte Schwachstellensuche.",
      },
    },
    {
      id: "1.1.2",
      question: {
        en: "Why must the SBOM record an exact version string rather than a version range?",
        de: "Warum muss die SBOM eine genaue Versionszeichenkette statt eines Versionsbereichs enthalten?",
      },
      options: [
        { en: "Because Annex VII CRA requires a specific version format", de: "Weil Anhang VII CRA ein bestimmtes Versionsformat vorschreibt" },
        { en: "Because a CVE typically affects a version range and is fixed in a specific version — without the exact version, you cannot determine exposure", de: "Weil eine CVE typischerweise einen Versionsbereich betrifft und in einer bestimmten Version behoben ist — ohne die genaue Version lässt sich die Betroffenheit nicht feststellen" },
        { en: "Because PURL syntax does not support ranges", de: "Weil die PURL-Syntax keine Bereiche unterstützt" },
        { en: "Because the supplier field requires a matching version", de: "Weil das Lieferantenfeld eine übereinstimmende Version erfordert" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CVEs are fixed in specific versions. A version range like '>=2.0' does not tell a scanner which binary is actually deployed, so it cannot determine whether that binary is affected by a given CVE.",
        de: "CVEs werden in bestimmten Versionen behoben. Ein Versionsbereich wie '>=2.0' sagt dem Scanner nicht, welches Binary tatsächlich eingesetzt wird — er kann daher nicht feststellen, ob es von einer CVE betroffen ist.",
      },
    },
    {
      id: "1.1.3",
      question: {
        en: "What does a hash field in an SBOM component entry verify?",
        de: "Was verifiziert ein Hash-Feld in einem SBOM-Komponenteneintrag?",
      },
      options: [
        { en: "That the component was downloaded from an approved registry", de: "Dass die Komponente aus einem genehmigten Registry heruntergeladen wurde" },
        { en: "That the component has no known vulnerabilities", de: "Dass die Komponente keine bekannten Schwachstellen hat" },
        { en: "That the component file has not been tampered with since the SBOM was generated", de: "Dass die Komponentendatei seit der SBOM-Erstellung nicht verändert wurde" },
        { en: "That the PURL matches the version field", de: "Dass die PURL mit dem Versionsfeld übereinstimmt" },
      ],
      correctIndex: 2,
      explanation: {
        en: "A hash is a fingerprint of the component file. It lets you verify integrity — that the component deployed is exactly the one the SBOM documents. It does not indicate vulnerability status or registry origin.",
        de: "Ein Hash ist ein Fingerabdruck der Komponentendatei. Er ermöglicht die Integritätsprüfung — dass die eingesetzte Komponente genau die ist, die die SBOM dokumentiert. Er gibt keine Auskunft über den Schwachstellenstatus oder die Registry-Herkunft.",
      },
    },
    {
      id: "1.1.4",
      question: {
        en: "What does the SBOM metadata section document?",
        de: "Was dokumentiert der Metadaten-Abschnitt der SBOM?",
      },
      options: [
        { en: "The vulnerability status of each component", de: "Den Schwachstellenstatus jeder Komponente" },
        { en: "When the SBOM was generated, which tool generated it, and what product it describes", de: "Wann die SBOM erstellt wurde, welches Werkzeug sie erstellt hat und welches Produkt sie beschreibt" },
        { en: "The license obligations for all components", de: "Die Lizenzverpflichtungen für alle Komponenten" },
        { en: "The supplier contact information for each component", de: "Die Lieferantenkontaktdaten für jede Komponente" },
      ],
      correctIndex: 1,
      explanation: {
        en: "SBOM metadata covers the document itself: the generation timestamp, the tool that created it, and the top-level product it describes. Auditors check metadata first to verify the SBOM is current and properly attributed.",
        de: "SBOM-Metadaten betreffen das Dokument selbst: den Erstellungszeitpunkt, das erstellende Werkzeug und das beschriebene Produkt. Prüfer überprüfen die Metadaten zuerst, um sicherzustellen, dass die SBOM aktuell und korrekt zugeordnet ist.",
      },
    },
    {
      id: "1.1.5",
      question: {
        en: "Which format satisfies the CRA Article 13(5) requirement for a 'machine-readable' SBOM?",
        de: "Welches Format erfüllt die CRA-Artikel-13(5)-Anforderung einer 'maschinenlesbaren' SBOM?",
      },
      options: [
        { en: "A PDF listing all component names and versions", de: "Ein PDF mit allen Komponentennamen und Versionen" },
        { en: "A spreadsheet with component name, version, and supplier columns", de: "Eine Tabelle mit Spalten für Komponentenname, Version und Anbieter" },
        { en: "CycloneDX JSON or SPDX JSON — formats a vulnerability scanner can parse without human intervention", de: "CycloneDX JSON oder SPDX JSON — Formate, die ein Schwachstellenscanner ohne menschliches Zutun verarbeiten kann" },
        { en: "Any file that lists component names alphabetically", de: "Jede Datei, die Komponentennamen alphabetisch auflistet" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Machine-readable means a tool can parse it programmatically. CycloneDX JSON and SPDX JSON both satisfy this. A PDF or spreadsheet cannot be processed by a vulnerability scanner without manual extraction.",
        de: "Maschinenlesbar bedeutet, dass ein Werkzeug es programmatisch verarbeiten kann. CycloneDX JSON und SPDX JSON erfüllen beide diese Anforderung. Ein PDF oder eine Tabelle kann von einem Schwachstellenscanner nicht ohne manuelle Extraktion verarbeitet werden.",
      },
    },
  ],
});

export default quiz;
