import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.1",
  passingScore: 75,
  questions: [
    {
      id: "4.1.1",
      question: {
        en: "Which CRA article requires manufacturers to produce a software bill of materials?",
        de: "Welcher CRA-Artikel verpflichtet Hersteller zur Erstellung einer Software-Stückliste?",
      },
      options: [
        { en: "Article 14(1)", de: "Artikel 14(1)" },
        { en: "Article 13(5)", de: "Artikel 13(5)" },
        { en: "Article 31(3)", de: "Artikel 31(3)" },
        { en: "Annex I Part II", de: "Anhang I Teil II" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 13(5) CRA is the SBOM clause. It requires manufacturers to identify and document components in a commonly used, machine-readable format covering at least the top-level dependencies. Article 31(3) covers retention. Article 14 covers vulnerability reporting.",
        de: "Artikel 13(5) CRA ist die SBOM-Klausel. Er verpflichtet Hersteller, Komponenten in einem allgemein verwendeten, maschinenlesbaren Format zu identifizieren und zu dokumentieren, das mindestens die direkten Abhängigkeiten abdeckt. Artikel 31(3) regelt die Aufbewahrung. Artikel 14 regelt die Schwachstellenmeldung.",
      },
    },
    {
      id: "4.1.2",
      question: {
        en: "What is the connection between the SBOM and CRA Article 14 vulnerability reporting?",
        de: "Was ist die Verbindung zwischen der SBOM und der CRA-Artikel-14-Schwachstellenmeldung?",
      },
      options: [
        { en: "The SBOM must be submitted to ENISA when filing an Article 14 report", de: "Die SBOM muss bei Einreichung eines Artikel-14-Berichts an ENISA übermittelt werden" },
        { en: "The SBOM is the component inventory that enables automated vulnerability monitoring — without it, you cannot identify which CVEs affect your product", de: "Die SBOM ist das Komponenteninventar, das automatisiertes Schwachstellenmonitoring ermöglicht — ohne sie können Sie nicht feststellen, welche CVEs Ihr Produkt betreffen" },
        { en: "Article 14 requires the SBOM to be made public when a vulnerability is reported", de: "Artikel 14 verlangt, dass die SBOM bei Meldung einer Schwachstelle veröffentlicht wird" },
        { en: "The SBOM is only relevant to Article 14 if the product has more than 50 top-level dependencies", de: "Die SBOM ist nur dann für Artikel 14 relevant, wenn das Produkt mehr als 50 direkte Abhängigkeiten hat" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The Article 14 24-hour reporting obligation applies to actively exploited vulnerabilities in your product. To monitor for these, you need to know what components your product contains — which is exactly what the SBOM provides. No SBOM means no automated monitoring and no ability to meet the reporting obligation.",
        de: "Die 24-Stunden-Meldepflicht nach Artikel 14 gilt für aktiv ausgenutzte Schwachstellen in Ihrem Produkt. Um diese zu überwachen, müssen Sie wissen, welche Komponenten Ihr Produkt enthält — genau das liefert die SBOM. Keine SBOM bedeutet kein automatisiertes Monitoring und keine Möglichkeit, die Meldepflicht zu erfüllen.",
      },
    },
    {
      id: "4.1.3",
      question: {
        en: "CycloneDX's VEX feature allows you to attach a 'not_affected' statement to a CVE. What justification would you use if the vulnerable code path exists but is never reached in your product's execution context?",
        de: "CycloneDX's VEX-Funktion erlaubt Ihnen, eine 'not_affected'-Aussage an eine CVE anzuhängen. Welche Begründung würden Sie verwenden, wenn der anfällige Codepfad vorhanden ist, aber im Ausführungskontext Ihres Produkts nie erreicht wird?",
      },
      options: [
        { en: "code_not_present", de: "code_not_present" },
        { en: "requires_configuration", de: "requires_configuration" },
        { en: "code_not_reachable", de: "code_not_reachable" },
        { en: "protected_at_perimeter", de: "protected_at_perimeter" },
      ],
      correctIndex: 2,
      explanation: {
        en: "'code_not_reachable' is the correct VEX justification when the vulnerable code path exists in the component version you are using, but your product's architecture or configuration means that code path is never executed. 'code_not_present' would mean the vulnerable code does not exist in your version at all.",
        de: "'code_not_reachable' ist die korrekte VEX-Begründung, wenn der anfällige Codepfad in der verwendeten Komponentenversion vorhanden ist, aber durch die Architektur oder Konfiguration Ihres Produkts nie ausgeführt wird. 'code_not_present' würde bedeuten, dass der anfällige Code in Ihrer Version überhaupt nicht vorhanden ist.",
      },
    },
    {
      id: "4.1.4",
      question: {
        en: "A manufacturer places a product on the EU market in January 2027. The product's declared support period is 8 years. Until when must the SBOM be retained?",
        de: "Ein Hersteller bringt ein Produkt im Januar 2027 auf den EU-Markt. Die erklärte Unterstützungsdauer des Produkts beträgt 8 Jahre. Bis wann muss die SBOM aufbewahrt werden?",
      },
      options: [
        { en: "Until January 2037 (10 years from first placement)", de: "Bis Januar 2037 (10 Jahre nach erstmaligem Inverkehrbringen)" },
        { en: "Until January 2032 (support period: 8 years minus 2 years already elapsed)", de: "Bis Januar 2032 (Unterstützungsdauer: 8 Jahre abzüglich 2 bereits vergangener Jahre)" },
        { en: "Until January 2035 (support period: 8 years from placement)", de: "Bis Januar 2035 (Unterstützungsdauer: 8 Jahre ab Inverkehrbringen)" },
        { en: "Until January 2037 because 10 years is always longer than the support period", de: "Bis Januar 2037, weil 10 Jahre immer länger als die Unterstützungsdauer sind" },
      ],
      correctIndex: 0,
      explanation: {
        en: "The retention period is 10 years from first placement on the market, or for the support period, whichever is longer. 10 years from January 2027 = January 2037. The support period is 8 years = January 2035. 10 years (January 2037) is longer, so that is the retention deadline. Note: if the support period were 12 years instead, the deadline would be January 2039.",
        de: "Die Aufbewahrungspflicht beträgt 10 Jahre ab erstmaligem Inverkehrbringen oder für die Unterstützungsdauer, je nachdem, was länger ist. 10 Jahre ab Januar 2027 = Januar 2037. Die Unterstützungsdauer beträgt 8 Jahre = Januar 2035. 10 Jahre (Januar 2037) ist länger, daher gilt dieser Termin. Hinweis: Wäre die Unterstützungsdauer 12 Jahre, würde die Frist bis Januar 2039 laufen.",
      },
    },
    {
      id: "4.1.5",
      question: {
        en: "Which combination of tools represents best practice for generating a complete SBOM for a containerised application?",
        de: "Welche Werkzeugkombination stellt Best Practice für die Erstellung einer vollständigen SBOM einer containerisierten Anwendung dar?",
      },
      options: [
        { en: "Only Syft against the container image", de: "Nur Syft gegen das Container-Image" },
        { en: "Only cdxgen against the source code", de: "Nur cdxgen gegen den Quellcode" },
        { en: "cdxgen against source code (for full transitive application dependencies) combined with Syft against the container image (for OS and runtime packages), merged into one SBOM", de: "cdxgen gegen den Quellcode (für vollständige transitive Anwendungsabhängigkeiten) kombiniert mit Syft gegen das Container-Image (für OS- und Laufzeitpakete), zusammengeführt zu einer SBOM" },
        { en: "GitHub dependency graph export combined with a manual review of package manifests", de: "GitHub-Abhängigkeitsgraph-Export kombiniert mit einer manuellen Überprüfung der Paketmanifeste" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Syft excels at OS and runtime package detection from the built artifact. cdxgen excels at producing the full transitive application dependency graph from lock files. Neither is complete alone. Combining both and merging the output gives you OS packages, runtime, and full application dependencies — the complete picture for Article 14 monitoring.",
        de: "Syft eignet sich hervorragend für die OS- und Laufzeitpaketerkennung aus dem erstellten Artefakt. cdxgen eignet sich hervorragend für die Erstellung des vollständigen transitiven Anwendungsabhängigkeitsgraphen aus Lock-Dateien. Keines ist allein vollständig. Die Kombination beider und das Zusammenführen der Ausgabe liefert OS-Pakete, Laufzeit und vollständige Anwendungsabhängigkeiten — das vollständige Bild für das Artikel-14-Monitoring.",
      },
    },
    {
      id: "4.1.6",
      question: {
        en: "Where does a PURL for an npm package appear in an SPDX 2.3 document?",
        de: "Wo erscheint eine PURL für ein npm-Paket in einem SPDX-2.3-Dokument?",
      },
      options: [
        { en: "As a first-class 'purl' field directly on the package object", de: "Als erstklassiges 'purl'-Feld direkt am Paketobjekt" },
        { en: "Inside the externalRefs array with referenceType 'purl' and referenceCategory 'PACKAGE-MANAGER'", de: "Im externalRefs-Array mit referenceType 'purl' und referenceCategory 'PACKAGE-MANAGER'" },
        { en: "In the SPDXID field as a purl: URI", de: "Im SPDXID-Feld als purl: URI" },
        { en: "SPDX 2.3 does not support PURLs — they are a CycloneDX-only feature", de: "SPDX 2.3 unterstützt keine PURLs — sie sind ein ausschließliches CycloneDX-Feature" },
      ],
      correctIndex: 1,
      explanation: {
        en: "In SPDX 2.3, the PURL lives inside the externalRefs array on the package object: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX has a first-class 'purl' field directly on the component. Both formats support PURLs.",
        de: "In SPDX 2.3 befindet sich die PURL im externalRefs-Array des Paketobjekts: { referenceCategory: 'PACKAGE-MANAGER', referenceType: 'purl', referenceLocator: 'pkg:npm/express@4.18.2' }. CycloneDX hat ein erstklassiges 'purl'-Feld direkt an der Komponente. Beide Formate unterstützen PURLs.",
      },
    },
    {
      id: "4.1.7",
      question: {
        en: "What is the minimum scope for SBOM coverage under CRA Article 13(5), and what does best practice add?",
        de: "Was ist der Mindestumfang der SBOM-Abdeckung gemäß CRA Artikel 13(5), und was fügt Best Practice hinzu?",
      },
      options: [
        { en: "Minimum: all components including OS packages. Best practice: add file-level hashes for every file", de: "Minimum: alle Komponenten einschließlich OS-Paketen. Best Practice: dateibasierte Hash-Werte für jede Datei hinzufügen" },
        { en: "Minimum: top-level dependencies only. Best practice: full transitive dependency coverage, because transitive components are where vulnerabilities like Log4Shell hide", de: "Minimum: nur direkte Abhängigkeiten. Best Practice: vollständige transitive Abhängigkeitsabdeckung, weil sich in transitiven Komponenten Schwachstellen wie Log4Shell verbergen" },
        { en: "Minimum: components with CVEs only. Best practice: add all components regardless of known vulnerabilities", de: "Minimum: nur Komponenten mit CVEs. Best Practice: alle Komponenten hinzufügen, unabhängig von bekannten Schwachstellen" },
        { en: "Minimum and best practice are identical — the CRA specifies full transitive coverage", de: "Minimum und Best Practice sind identisch — der CRA gibt vollständige transitive Abdeckung vor" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 13(5) CRA sets the minimum at top-level dependencies. Best practice, per ENISA guidance and the NTIA minimum elements, is full transitive coverage. Log4Shell illustrated the risk of top-level-only SBOMs. Most SBOM tools produce full transitive output by default.",
        de: "Artikel 13(5) CRA setzt das Minimum bei direkten Abhängigkeiten. Best Practice gemäß ENISA-Leitlinien und den NTIA-Mindestelementen ist eine vollständige transitive Abdeckung. Log4Shell verdeutlichte das Risiko von reinen Top-Level-SBOMs. Die meisten SBOM-Werkzeuge produzieren standardmäßig vollständige transitive Ausgaben.",
      },
    },
    {
      id: "4.1.8",
      question: {
        en: "What is the Single Reporting Platform (SRP) and when does it become operational?",
        de: "Was ist die Single Reporting Platform (SRP) und wann wird sie betriebsbereit?",
      },
      options: [
        { en: "An ENISA-operated platform for receiving CRA Article 14 vulnerability and incident reports — operational September 11, 2026", de: "Eine von ENISA betriebene Plattform für den Empfang von CRA-Artikel-14-Schwachstellen- und Vorfallsmeldungen — betriebsbereit ab 11. September 2026" },
        { en: "A BSI database for German manufacturers to register their SBOMs — operational December 2027", de: "Eine BSI-Datenbank für deutsche Hersteller zur Registrierung ihrer SBOMs — betriebsbereit ab Dezember 2027" },
        { en: "A European Commission portal for filing conformity assessments — operational January 2026", de: "Ein Portal der Europäischen Kommission für die Einreichung von Konformitätsbewertungen — betriebsbereit ab Januar 2026" },
        { en: "An industry consortium platform for sharing SBOM data between manufacturers", de: "Eine Branchenkonsortiumplattform für den Austausch von SBOM-Daten zwischen Herstellern" },
      ],
      correctIndex: 0,
      explanation: {
        en: "The Single Reporting Platform (SRP) is operated by ENISA. It receives CRA Article 14 vulnerability and incident reports from manufacturers. It becomes operational on September 11, 2026 — the same date the Article 14 reporting obligations come into force. Before that date, national CSIRTs receive reports through their existing channels.",
        de: "Die Single Reporting Platform (SRP) wird von ENISA betrieben. Sie empfängt CRA-Artikel-14-Schwachstellen- und Vorfallsmeldungen von Herstellern. Sie wird am 11. September 2026 betriebsbereit — demselben Datum, an dem die Meldepflichten nach Artikel 14 in Kraft treten. Vor diesem Datum erhalten nationale CSIRTs Meldungen über ihre bestehenden Kanäle.",
      },
    },
  ],
});

export default quiz;
