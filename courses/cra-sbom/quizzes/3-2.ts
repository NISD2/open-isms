import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.2",
  passingScore: 75,
  questions: [
    {
      id: "3.2.1",
      question: {
        en: "What triggers a need to regenerate the SBOM?",
        de: "Was löst die Notwendigkeit aus, die SBOM neu zu erstellen?",
      },
      options: [
        { en: "Only when a new CVE is published that affects a listed component", de: "Nur wenn eine neue CVE für eine aufgeführte Komponente veröffentlicht wird" },
        { en: "When component inventory changes — such as a dependency update, OS patch, or transitive dependency shift — which makes the current SBOM stale", de: "Wenn sich das Komponenteninventar ändert — etwa durch ein Abhängigkeitsupdate, einen OS-Patch oder eine Änderung transitiver Abhängigkeiten — was die aktuelle SBOM veralten lässt" },
        { en: "Only when the product's version number changes by a major release", de: "Nur wenn sich die Versionsnummer des Produkts um eine Hauptversion ändert" },
        { en: "On a fixed annual schedule, regardless of component changes", de: "Nach einem festen jährlichen Zeitplan, unabhängig von Komponentenänderungen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The SBOM reflects the component inventory at a specific point in time. Any change to the components — a dependency update, an OS security patch, or a change in how transitive dependencies are resolved — makes the existing SBOM stale. This is why SBOM generation must be triggered at build time, not on a schedule.",
        de: "Die SBOM spiegelt das Komponenteninventar zu einem bestimmten Zeitpunkt wider. Jede Änderung der Komponenten — ein Abhängigkeitsupdate, ein OS-Sicherheits-Patch oder eine Änderung bei der Auflösung transitiver Abhängigkeiten — macht die vorhandene SBOM veraltet. Deshalb muss die SBOM-Erstellung zum Build-Zeitpunkt ausgelöst werden, nicht nach einem Zeitplan.",
      },
    },
    {
      id: "3.2.2",
      question: {
        en: "What vulnerability feeds does Grype scan against when you run it against an SBOM?",
        de: "Gegen welche Schwachstellenfeeds scannt Grype, wenn Sie es gegen eine SBOM ausführen?",
      },
      options: [
        { en: "Only the NVD (National Vulnerability Database)", de: "Nur die NVD (National Vulnerability Database)" },
        { en: "NVD, GitHub Advisory Database, and OS-specific advisories (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) plus language-specific feeds (PyPI, npm, Go, Maven, NuGet, Ruby)", de: "NVD, GitHub Advisory Database und OS-spezifische Advisories (Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle) sowie sprachspezifische Feeds (PyPI, npm, Go, Maven, NuGet, Ruby)" },
        { en: "Only the ENISA vulnerability database via the Single Reporting Platform", de: "Nur die ENISA-Schwachstellendatenbank über die Single Reporting Platform" },
        { en: "Only CVEs published in the last 12 months", de: "Nur CVEs, die in den letzten 12 Monaten veröffentlicht wurden" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Grype aggregates multiple vulnerability feeds: NVD, GitHub Advisory Database, and OS-distribution-specific advisories for Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle, and SUSE. It also covers language-ecosystem feeds for PyPI, npm, Go modules, Maven, NuGet, and Ruby gems. This breadth is why Grype catches vulnerabilities that a pure NVD scan misses.",
        de: "Grype aggregiert mehrere Schwachstellenfeeds: NVD, GitHub Advisory Database und OS-distributionsspezifische Advisories für Red Hat, Debian, Ubuntu, Alpine, Amazon, Oracle und SUSE. Es deckt auch sprachspezifische Feeds für PyPI, npm, Go-Module, Maven, NuGet und Ruby-Gems ab. Diese Breite ist der Grund, warum Grype Schwachstellen erkennt, die ein reiner NVD-Scan übersieht.",
      },
    },
    {
      id: "3.2.3",
      question: {
        en: "What is the CISA KEV catalogue and why is it relevant to the Article 14 reporting decision?",
        de: "Was ist der CISA-KEV-Katalog und warum ist er für die Artikel-14-Meldeentscheidung relevant?",
      },
      options: [
        { en: "A list of all CVEs published in the current year, used to calculate CVSS scores", de: "Eine Liste aller CVEs, die im laufenden Jahr veröffentlicht wurden, zur Berechnung von CVSS-Scores" },
        { en: "The CISA Known Exploited Vulnerabilities catalogue — it lists CVEs currently being used in real attacks, which is the actual trigger for the Article 14 24-hour reporting obligation", de: "Der CISA-Katalog bekannter ausgenutzter Schwachstellen — er listet CVEs, die derzeit in echten Angriffen eingesetzt werden, was der eigentliche Auslöser für die 24-Stunden-Meldepflicht nach Artikel 14 ist" },
        { en: "A German BSI publication listing vulnerabilities relevant to CRA-scope products only", de: "Eine BSI-Veröffentlichung, die nur für CRA-Scope-Produkte relevante Schwachstellen auflistet" },
        { en: "A European Commission database that replaces the NVD for EU compliance purposes", de: "Eine Datenbank der Europäischen Kommission, die die NVD für EU-Compliance-Zwecke ersetzt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 14 CRA requires reporting of 'actively exploited vulnerabilities' — not just discovered ones. The CISA KEV catalogue identifies which CVEs are currently being exploited in the wild. A component in your SBOM with a KEV-listed CVE is a strong indicator that the Article 14 reporting trigger may apply.",
        de: "Artikel 14 CRA verlangt die Meldung 'aktiv ausgenutzter Schwachstellen' — nicht nur entdeckter. Der CISA-KEV-Katalog identifiziert, welche CVEs derzeit in freier Wildbahn ausgenutzt werden. Eine Komponente in Ihrer SBOM mit einer KEV-gelisteten CVE ist ein starker Indikator dafür, dass der Artikel-14-Meldeauslöser möglicherweise zutrifft.",
      },
    },
    {
      id: "3.2.4",
      question: {
        en: "A monitoring scan finds that a component in your SBOM has a CVSS 9.8 vulnerability. What must you determine before deciding whether to file an Article 14 report?",
        de: "Ein Monitoring-Scan stellt fest, dass eine Komponente in Ihrer SBOM eine CVSS-9.8-Schwachstelle hat. Was müssen Sie feststellen, bevor Sie entscheiden, ob Sie einen Artikel-14-Bericht einreichen?",
      },
      options: [
        { en: "Whether the CVE was published more than 30 days ago", de: "Ob die CVE vor mehr als 30 Tagen veröffentlicht wurde" },
        { en: "Whether the vulnerability is actively exploited in the wild — CVSS score alone does not trigger Article 14, active exploitation does", de: "Ob die Schwachstelle aktiv in freier Wildbahn ausgenutzt wird — der CVSS-Score allein löst Artikel 14 nicht aus, aktive Ausnutzung schon" },
        { en: "Whether the component is a top-level or transitive dependency", de: "Ob die Komponente eine direkte oder transitive Abhängigkeit ist" },
        { en: "Whether your product is classified as Important Class I or II under the CRA", de: "Ob Ihr Produkt nach dem CRA als Wichtige Klasse I oder II eingestuft ist" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 14(1) CRA uses the phrase 'actively exploited vulnerability' as the trigger. A high CVSS score means the vulnerability is severe if exploited, not that it is being actively exploited. Check the CISA KEV catalogue and threat intelligence feeds. Document the assessment either way — using a VEX statement if the conclusion is 'not affected.'",
        de: "Artikel 14(1) CRA verwendet den Begriff 'aktiv ausgenutzter Schwachstelle' als Auslöser. Ein hoher CVSS-Score bedeutet, dass die Schwachstelle bei Ausnutzung schwerwiegend ist, nicht dass sie aktiv ausgenutzt wird. Überprüfen Sie den CISA-KEV-Katalog und Bedrohungsintelligenz-Feeds. Dokumentieren Sie die Bewertung in jedem Fall — verwenden Sie eine VEX-Aussage, wenn die Schlussfolgerung 'not affected' lautet.",
      },
    },
    {
      id: "3.2.5",
      question: {
        en: "What advantage does OWASP Dependency-Track provide for a manufacturer with multiple CRA-scope products?",
        de: "Welchen Vorteil bietet OWASP Dependency-Track für einen Hersteller mit mehreren CRA-Scope-Produkten?",
      },
      options: [
        { en: "It automatically files Article 14 reports to ENISA on your behalf", de: "Es reicht automatisch Artikel-14-Berichte bei ENISA in Ihrem Namen ein" },
        { en: "It provides centralised continuous monitoring — you upload SBOMs for all products and receive automated alerts when a new CVE affects any component across the portfolio", de: "Es bietet zentralisiertes kontinuierliches Monitoring — Sie laden SBOMs für alle Produkte hoch und erhalten automatische Benachrichtigungen, wenn eine neue CVE eine Komponente im gesamten Portfolio betrifft" },
        { en: "It generates SBOMs automatically from source code repositories without requiring Syft or cdxgen", de: "Es erstellt SBOMs automatisch aus Quellcode-Repositories, ohne Syft oder cdxgen zu benötigen" },
        { en: "It validates that SBOMs conform to CRA Article 13(5) and issues a compliance certificate", de: "Es validiert, dass SBOMs CRA Artikel 13(5) entsprechen, und stellt ein Compliance-Zertifikat aus" },
      ],
      correctIndex: 1,
      explanation: {
        en: "OWASP Dependency-Track is a centralised SBOM management platform. It continuously monitors uploaded SBOMs against vulnerability feeds and alerts you when new CVEs affect any component. For a manufacturer with multiple products, this replaces a manual daily scan loop with an automated alert system — scaling the Article 14 monitoring obligation across a portfolio.",
        de: "OWASP Dependency-Track ist eine zentralisierte SBOM-Verwaltungsplattform. Sie überwacht kontinuierlich hochgeladene SBOMs gegen Schwachstellenfeeds und benachrichtigt Sie, wenn neue CVEs eine Komponente betreffen. Für einen Hersteller mit mehreren Produkten ersetzt dies eine manuelle tägliche Scan-Schleife durch ein automatisiertes Benachrichtigungssystem — die Artikel-14-Überwachungspflicht lässt sich so über ein Portfolio skalieren.",
      },
    },
  ],
});

export default quiz;
