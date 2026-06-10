import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.1",
  passingScore: 75,
  questions: [
    {
      id: "3.1.1",
      question: {
        en: "What is the key difference between source-time SBOM tools (like cdxgen) and image-scanning tools (like Syft)?",
        de: "Was ist der wesentliche Unterschied zwischen quellenbasierten SBOM-Werkzeugen (wie cdxgen) und Image-Scanning-Werkzeugen (wie Syft)?",
      },
      options: [
        { en: "Source-time tools only support CycloneDX, image-scanning tools only support SPDX", de: "Quellenbasierte Werkzeuge unterstützen nur CycloneDX, Image-Scanning-Werkzeuge nur SPDX" },
        { en: "Source-time tools read package manifests and produce full transitive application dependency graphs; image scanners examine built artifacts and find OS and runtime packages", de: "Quellenbasierte Werkzeuge lesen Paketmanifeste und erstellen vollständige transitive Anwendungsabhängigkeitsgraphen; Image-Scanner untersuchen erstellte Artefakte und finden OS- und Laufzeitpakete" },
        { en: "Image-scanning tools are more accurate for application dependencies because they see the actual binary", de: "Image-Scanning-Werkzeuge sind für Anwendungsabhängigkeiten genauer, weil sie das tatsächliche Binary sehen" },
        { en: "Source-time tools require internet access; image-scanning tools work offline", de: "Quellenbasierte Werkzeuge benötigen Internetzugang; Image-Scanning-Werkzeuge arbeiten offline" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Source-time tools (cdxgen) read lock files like package-lock.json or pom.xml and produce the full transitive dependency graph. Image scanners (Syft) examine a built artifact — container image or directory — and identify packages from OS package databases and embedded language manifests. Neither is complete alone: combine both for full coverage.",
        de: "Quellenbasierte Werkzeuge (cdxgen) lesen Lock-Dateien wie package-lock.json oder pom.xml und erstellen den vollständigen transitiven Abhängigkeitsgraphen. Image-Scanner (Syft) untersuchen ein erstelltes Artefakt — Container-Image oder Verzeichnis — und identifizieren Pakete aus OS-Paketdatenbanken und eingebetteten Sprachmanifesten. Keines ist allein vollständig: Kombinieren Sie beide für vollständige Abdeckung.",
      },
    },
    {
      id: "3.1.2",
      question: {
        en: "When should SBOM generation be triggered in the build pipeline?",
        de: "Wann sollte die SBOM-Erstellung in der Build-Pipeline ausgelöst werden?",
      },
      options: [
        { en: "Once per quarter, during a scheduled compliance review", de: "Einmal pro Quartal, während einer geplanten Compliance-Überprüfung" },
        { en: "As part of every build that produces a release artifact — one SBOM per release, generated at build time", de: "Als Teil jedes Builds, der ein Release-Artefakt erzeugt — eine SBOM pro Release, zum Build-Zeitpunkt erstellt" },
        { en: "Only before a conformity assessment or audit", de: "Nur vor einer Konformitätsbewertung oder einem Audit" },
        { en: "When the product's dependency tree changes by more than 10 percent", de: "Wenn der Abhängigkeitsbaum des Produkts um mehr als 10 Prozent wechselt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The SBOM must reflect the exact component inventory of the released product. Manual or scheduled generation creates a gap between the SBOM and the actual artifact. Generating it as part of the build, from the same artifact, ensures accuracy and creates the audit trail the 10-year retention rule requires.",
        de: "Die SBOM muss das genaue Komponenteninventar des veröffentlichten Produkts widerspiegeln. Manuelle oder geplante Erstellung schafft eine Lücke zwischen der SBOM und dem tatsächlichen Artefakt. Die Erstellung als Teil des Builds aus demselben Artefakt gewährleistet Genauigkeit und schafft den Prüfpfad, den die 10-jährige Aufbewahrungspflicht erfordert.",
      },
    },
    {
      id: "3.1.3",
      question: {
        en: "How should the SBOM be linked to the release artifact it documents?",
        de: "Wie sollte die SBOM mit dem Release-Artefakt verknüpft werden, das sie dokumentiert?",
      },
      options: [
        { en: "By embedding the SBOM inside the binary", de: "Durch Einbettung der SBOM in die Binary" },
        { en: "By tagging the SBOM filename or metadata with the product version and build SHA, and attaching it as a release asset", de: "Durch Versehen des SBOM-Dateinamens oder der Metadaten mit der Produktversion und dem Build-SHA und Anhängen als Release-Asset" },
        { en: "By storing the SBOM in a separate system that is accessed via the product serial number", de: "Durch Speicherung der SBOM in einem separaten System, auf das über die Produktseriennummer zugegriffen wird" },
        { en: "By emailing the SBOM to the market surveillance authority at each release", de: "Durch Versenden der SBOM per E-Mail an die Marktüberwachungsbehörde bei jedem Release" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Tagging the SBOM with the product version and build SHA creates the traceable link between the documentation and the artifact. Attaching it as a release asset (GitHub Release, GitLab artifact) keeps it co-located with the release. This is the foundation of the 10-year audit trail.",
        de: "Das Versehen der SBOM mit der Produktversion und dem Build-SHA schafft den nachvollziehbaren Link zwischen der Dokumentation und dem Artefakt. Das Anhängen als Release-Asset (GitHub Release, GitLab Artifact) hält es am selben Ort wie das Release. Dies ist die Grundlage des 10-jährigen Prüfpfads.",
      },
    },
    {
      id: "3.1.4",
      question: {
        en: "What does SBOM schema validation catch before the SBOM is stored?",
        de: "Was erkennt die SBOM-Schema-Validierung, bevor die SBOM gespeichert wird?",
      },
      options: [
        { en: "Vulnerabilities in the listed components", de: "Schwachstellen in den aufgeführten Komponenten" },
        { en: "Missing required fields, incorrect data types, and malformed PURLs", de: "Fehlende Pflichtfelder, falsche Datentypen und fehlerhafte PURLs" },
        { en: "Whether the SBOM complies with Article 13(5) CRA", de: "Ob die SBOM Artikel 13(5) CRA entspricht" },
        { en: "Whether all components have valid open-source licenses", de: "Ob alle Komponenten gültige Open-Source-Lizenzen haben" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Schema validation using the CycloneDX CLI (or equivalent SPDX validator) checks that the SBOM document conforms to the format specification: required fields are present, data types are correct, PURLs are well-formed. It does not check vulnerability status or legal compliance.",
        de: "Die Schema-Validierung mit der CycloneDX CLI (oder einem gleichwertigen SPDX-Validator) prüft, ob das SBOM-Dokument der Formatspezifikation entspricht: Pflichtfelder sind vorhanden, Datentypen sind korrekt, PURLs sind wohlgeformt. Sie prüft weder den Schwachstellenstatus noch die rechtliche Compliance.",
      },
    },
    {
      id: "3.1.5",
      question: {
        en: "What is the benefit of signing an SBOM with a tool like Cosign?",
        de: "Was ist der Vorteil der Signierung einer SBOM mit einem Werkzeug wie Cosign?",
      },
      options: [
        { en: "It encrypts the SBOM so only the market surveillance authority can read it", de: "Es verschlüsselt die SBOM, sodass nur die Marktüberwachungsbehörde sie lesen kann" },
        { en: "It creates a chain of custody: cryptographic proof that the SBOM was produced at a specific point in time by your build system and has not been altered since", de: "Es schafft einen Prüfpfad: kryptografischen Nachweis, dass die SBOM zu einem bestimmten Zeitpunkt von Ihrem Build-System erstellt und seitdem nicht verändert wurde" },
        { en: "It automatically submits the SBOM to ENISA for compliance registration", de: "Es übermittelt die SBOM automatisch an ENISA zur Compliance-Registrierung" },
        { en: "It validates the SBOM against the CycloneDX schema", de: "Es validiert die SBOM gegen das CycloneDX-Schema" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A Cosign signature proves that the SBOM was generated by your build system (not modified after the fact) at a specific time. This chain of custody strengthens the evidentiary value of the SBOM in an Article 14 audit or a market surveillance authority review.",
        de: "Eine Cosign-Signatur beweist, dass die SBOM von Ihrem Build-System (nicht nachträglich modifiziert) zu einem bestimmten Zeitpunkt erstellt wurde. Dieser Prüfpfad stärkt den Beweiswert der SBOM in einem Artikel-14-Audit oder einer Überprüfung durch eine Marktüberwachungsbehörde.",
      },
    },
  ],
});

export default quiz;
