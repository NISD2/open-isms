import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.2",
  passingScore: 75,
  questions: [
    {
      id: "1.2.1",
      question: {
        en: "What is a top-level dependency?",
        de: "Was ist eine direkte Abhängigkeit (Top-Level Dependency)?",
      },
      options: [
        { en: "The most critical dependency in terms of security risk", de: "Die sicherheitskritischste Abhängigkeit" },
        { en: "A component that your code directly imports or links against", de: "Eine Komponente, die Ihr Code direkt importiert oder gegen die er verlinkt" },
        { en: "A dependency that is shared by more than three of your top-level libraries", de: "Eine Abhängigkeit, die von mehr als drei Ihrer direkten Bibliotheken geteilt wird" },
        { en: "Any component with a CVSS score above 7.0", de: "Jede Komponente mit einem CVSS-Score über 7,0" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A top-level dependency is one your code directly imports — listed in your own package manifest (package.json, pom.xml, requirements.txt, etc.). You chose it explicitly. CRA Article 13(5) requires the SBOM to cover at least these.",
        de: "Eine direkte Abhängigkeit ist eine, die Ihr Code direkt importiert — aufgeführt in Ihrem eigenen Paketmanifest (package.json, pom.xml, requirements.txt usw.). Sie haben sie explizit gewählt. CRA Artikel 13(5) verlangt, dass die SBOM mindestens diese abdeckt.",
      },
    },
    {
      id: "1.2.2",
      question: {
        en: "Log4Shell (CVE-2021-44228) affected thousands of applications whose developers had never directly imported log4j-core. What does this illustrate?",
        de: "Log4Shell (CVE-2021-44228) betraf Tausende von Anwendungen, deren Entwickler log4j-core nie direkt importiert hatten. Was verdeutlicht dies?",
      },
      options: [
        { en: "That CVE scores overestimate real-world risk", de: "Dass CVE-Scores das Risiko in der Praxis überschätzen" },
        { en: "That top-level-only SBOMs fail to reveal transitive vulnerability exposure", de: "Dass rein auf direkten Abhängigkeiten basierende SBOMs die transitive Schwachstellenexposition nicht aufdecken" },
        { en: "That Java applications are inherently less secure", de: "Dass Java-Anwendungen von Natur aus unsicherer sind" },
        { en: "That dependency scanning tools were not available before 2021", de: "Dass Abhängigkeitsscanner vor 2021 nicht verfügbar waren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Log4Shell was a transitive dependency — pulled in by a library that was itself a dependency. Teams with top-level-only SBOMs had no record of log4j-core and could not quickly determine whether they were affected. Full transitive SBOMs answered the question in a single scanner run.",
        de: "Log4Shell war eine transitive Abhängigkeit — eingebunden durch eine Bibliothek, die selbst eine Abhängigkeit war. Teams mit reinen Top-Level-SBOMs hatten keinen Eintrag für log4j-core und konnten nicht schnell feststellen, ob sie betroffen waren. Vollständige transitive SBOMs beantworteten die Frage in einem einzigen Scanner-Durchlauf.",
      },
    },
    {
      id: "1.2.3",
      question: {
        en: "What does the CRA Article 13(5) require as the minimum scope for SBOM coverage?",
        de: "Was verlangt CRA Artikel 13(5) als Mindestumfang der SBOM-Abdeckung?",
      },
      options: [
        { en: "All components including OS packages and transitive dependencies at every level", de: "Alle Komponenten einschließlich OS-Paketen und transitiver Abhängigkeiten auf jeder Ebene" },
        { en: "Only components with a CVSS severity of High or Critical", de: "Nur Komponenten mit einem CVSS-Schweregrad von Hoch oder Kritisch" },
        { en: "At least the top-level dependencies", de: "Mindestens die direkten Abhängigkeiten" },
        { en: "Only components that have had a CVE published in the last 12 months", de: "Nur Komponenten, für die in den letzten 12 Monaten eine CVE veröffentlicht wurde" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 13(5) CRA requires the SBOM to cover 'at least the top-level dependencies.' This is the legal minimum. Best practice and most SBOM tooling goes further and covers the full transitive tree.",
        de: "Artikel 13(5) CRA verlangt, dass die SBOM 'mindestens die direkten Abhängigkeiten' abdeckt. Dies ist das gesetzliche Minimum. Best Practice und die meisten SBOM-Werkzeuge gehen weiter und decken den vollständigen transitiven Baum ab.",
      },
    },
    {
      id: "1.2.4",
      question: {
        en: "Why do most SBOM tools (Syft, cdxgen) produce full transitive output by default?",
        de: "Warum liefern die meisten SBOM-Werkzeuge (Syft, cdxgen) standardmäßig vollständige transitive Ausgaben?",
      },
      options: [
        { en: "Because EU regulations require it for all product categories", de: "Weil EU-Vorschriften dies für alle Produktkategorien verlangen" },
        { en: "Because full transitive coverage is best practice for vulnerability monitoring, and there is no technical cost argument for stopping at top-level when the tools do not", de: "Weil vollständige transitive Abdeckung Best Practice für die Schwachstellenüberwachung ist und es kein technisches Kostenargument gibt, bei direkten Abhängigkeiten zu stoppen, wenn die Werkzeuge es nicht tun" },
        { en: "Because transitive dependencies change more frequently than top-level ones", de: "Weil transitive Abhängigkeiten häufiger wechseln als direkte" },
        { en: "Because VEX statements are only valid for transitive dependencies", de: "Weil VEX-Aussagen nur für transitive Abhängigkeiten gültig sind" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Tools like Syft read the full dependency tree from package lock files and container image layer metadata. Stopping at top-level would require extra configuration to strip information. Full transitive output is best practice and the default — do not override it.",
        de: "Werkzeuge wie Syft lesen den vollständigen Abhängigkeitsbaum aus Package-Lock-Dateien und Container-Image-Layer-Metadaten. Das Stoppen bei direkten Abhängigkeiten würde eine zusätzliche Konfiguration erfordern, um Informationen zu entfernen. Vollständige transitive Ausgabe ist Best Practice und die Voreinstellung — überschreiben Sie sie nicht.",
      },
    },
    {
      id: "1.2.5",
      question: {
        en: "What is required to attach a VEX 'not_affected' statement for a CVE in a transitive dependency?",
        de: "Was ist erforderlich, um eine VEX-'not_affected'-Aussage für eine CVE in einer transitiven Abhängigkeit anzuhängen?",
      },
      options: [
        { en: "The CVE must have a CVSS score below 7.0", de: "Die CVE muss einen CVSS-Score unter 7,0 haben" },
        { en: "The transitive component must be present in the SBOM", de: "Die transitive Komponente muss in der SBOM vorhanden sein" },
        { en: "The component must be a top-level dependency", de: "Die Komponente muss eine direkte Abhängigkeit sein" },
        { en: "The CVE must not yet appear in the NVD", de: "Die CVE darf noch nicht in der NVD erscheinen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A VEX statement is attached to a specific component entry in the SBOM. If the transitive component is not listed in the SBOM, there is no entry to attach the VEX statement to. This means you cannot formally document 'not affected' decisions for CVEs in dependencies your SBOM does not cover.",
        de: "Eine VEX-Aussage wird an einen bestimmten Komponenteneintrag in der SBOM angehängt. Wenn die transitive Komponente nicht in der SBOM aufgeführt ist, gibt es keinen Eintrag, an den die VEX-Aussage angehängt werden kann. Das bedeutet, dass Sie 'not affected'-Entscheidungen für CVEs in Abhängigkeiten, die Ihre SBOM nicht abdeckt, nicht formal dokumentieren können.",
      },
    },
  ],
});

export default quiz;
