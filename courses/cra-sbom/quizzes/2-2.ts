import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.2",
  passingScore: 75,
  questions: [
    {
      id: "2.2.1",
      question: {
        en: "What is the ISO standard designation for SPDX?",
        de: "Wie lautet die ISO-Standardbezeichnung für SPDX?",
      },
      options: [
        { en: "ISO/IEC 27001:2022", de: "ISO/IEC 27001:2022" },
        { en: "ISO/IEC 5962:2021", de: "ISO/IEC 5962:2021" },
        { en: "ISO 22301:2019", de: "ISO 22301:2019" },
        { en: "ISO/IEC 29147:2018", de: "ISO/IEC 29147:2018" },
      ],
      correctIndex: 1,
      explanation: {
        en: "SPDX is ISO/IEC 5962:2021 — the international standard for Software Package Data Exchange, published by ISO in 2021. It is the only SBOM format that is also an ISO standard.",
        de: "SPDX ist ISO/IEC 5962:2021 — der internationale Standard für Software Package Data Exchange, 2021 von der ISO veröffentlicht. Es ist das einzige SBOM-Format, das auch ein ISO-Standard ist.",
      },
    },
    {
      id: "2.2.2",
      question: {
        en: "What is SPDX's original design purpose, which distinguishes it from CycloneDX?",
        de: "Was ist der ursprüngliche Entwurfszweck von SPDX, der es von CycloneDX unterscheidet?",
      },
      options: [
        { en: "Vulnerability tracking and active exploitation monitoring", de: "Schwachstellenverfolgung und Überwachung aktiver Ausnutzungen" },
        { en: "Open-source license compliance and attribution tracking", de: "Open-Source-Lizenz-Compliance und Nachverfolgung von Namensnennung" },
        { en: "Container image scanning and OS package detection", de: "Container-Image-Scanning und OS-Paketerkennung" },
        { en: "Supply chain provenance and code signing", de: "Lieferketten-Herkunftsnachweis und Code-Signierung" },
      ],
      correctIndex: 1,
      explanation: {
        en: "SPDX was created at the Linux Foundation in 2010 to solve the open-source license compliance problem: tracking which licenses apply to which components and what obligations they create. It has grown to cover vulnerability management fields, but its original design is license-focused.",
        de: "SPDX wurde 2010 bei der Linux Foundation entwickelt, um das Open-Source-Lizenz-Compliance-Problem zu lösen: Welche Lizenzen gelten für welche Komponenten und welche Verpflichtungen entstehen daraus. Es wurde um Felder für das Schwachstellenmanagement erweitert, aber sein ursprünglicher Entwurf ist lizenzorientiert.",
      },
    },
    {
      id: "2.2.3",
      question: {
        en: "Which platform natively exports SPDX 2.3 JSON without requiring local tooling installation?",
        de: "Welche Plattform exportiert nativ SPDX 2.3 JSON ohne lokale Werkzeuginstallation?",
      },
      options: [
        { en: "Docker Hub", de: "Docker Hub" },
        { en: "OWASP Dependency-Track", de: "OWASP Dependency-Track" },
        { en: "GitHub's dependency graph", de: "GitHubs Abhängigkeitsgraph" },
        { en: "The NVD (National Vulnerability Database)", de: "Die NVD (National Vulnerability Database)" },
      ],
      correctIndex: 2,
      explanation: {
        en: "GitHub's dependency graph exports SPDX 2.3 JSON from the repository API endpoint. This provides an SBOM without running any local tools, making it the fastest way to get started for teams with code on GitHub.",
        de: "GitHubs Abhängigkeitsgraph exportiert SPDX 2.3 JSON über den Repository-API-Endpunkt. Dies liefert eine SBOM ohne die Ausführung lokaler Werkzeuge und ist für Teams mit Code auf GitHub der schnellste Einstieg.",
      },
    },
    {
      id: "2.2.4",
      question: {
        en: "Both CycloneDX and SPDX satisfy the CRA Article 13(5) format requirement. What is the basis for this?",
        de: "Sowohl CycloneDX als auch SPDX erfüllen die Formatanforderung von CRA Artikel 13(5). Was ist die Grundlage dafür?",
      },
      options: [
        { en: "Both are mandated by ENISA's SBOM technical guidelines", de: "Beide sind durch ENISAs technische SBOM-Leitlinien vorgeschrieben" },
        { en: "Both are 'commonly used, machine-readable' formats — the exact words of Article 13(5)", de: "Beide sind 'allgemein verwendete, maschinenlesbare' Formate — die genauen Worte von Artikel 13(5)" },
        { en: "Both have been reviewed and certified by a notified conformity assessment body", de: "Beide wurden von einer notifizierten Konformitätsbewertungsstelle geprüft und zertifiziert" },
        { en: "Both are referenced by name in CRA Recital 41", de: "Beide werden namentlich in CRA Erwägungsgrund 41 genannt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 13(5) CRA requires the SBOM to be in a 'commonly used, machine-readable format.' Neither CycloneDX nor SPDX is named in the regulation. Both satisfy the requirement because both are widely used across hundreds of organisations and both are machine-parseable.",
        de: "Artikel 13(5) CRA verlangt, dass die SBOM in einem 'allgemein verwendeten, maschinenlesbaren Format' vorliegt. Weder CycloneDX noch SPDX wird in der Verordnung namentlich genannt. Beide erfüllen die Anforderung, weil beide von Hunderten von Organisationen genutzt werden und beide maschinell verarbeitbar sind.",
      },
    },
    {
      id: "2.2.5",
      question: {
        en: "If your primary driver is CRA Article 14 vulnerability reporting compliance, which format is the more natural fit and why?",
        de: "Wenn Ihr primäres Ziel die CRA-Artikel-14-Konformität beim Schwachstellenmeldewesen ist, welches Format passt besser und warum?",
      },
      options: [
        { en: "SPDX, because it is an ISO standard and ISO standards are preferred by market surveillance authorities", de: "SPDX, weil es ein ISO-Standard ist und ISO-Standards von Marktüberwachungsbehörden bevorzugt werden" },
        { en: "CycloneDX, because it was designed for vulnerability management, has native VEX support, and has more mature tooling (Grype, Dependency-Track) for the Article 14 monitoring loop", de: "CycloneDX, weil es für das Schwachstellenmanagement konzipiert wurde, native VEX-Unterstützung hat und reifere Werkzeuge (Grype, Dependency-Track) für den Artikel-14-Überwachungskreislauf bietet" },
        { en: "Neither — you must produce both formats to satisfy Article 14", de: "Keines — Sie müssen beide Formate produzieren, um Artikel 14 zu erfüllen" },
        { en: "SPDX, because its multi-format output (JSON, YAML, RDF) is required for ENISA's reporting platform", de: "SPDX, weil seine Multi-Format-Ausgabe (JSON, YAML, RDF) für ENISAs Meldeplattform erforderlich ist" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CycloneDX was designed for security operations from the start. Its native VEX support lets you formally document 'not affected' decisions. Grype natively consumes CycloneDX and outputs CycloneDX vulnerability results. Dependency-Track is built around CycloneDX. For Article 14 compliance, this toolchain is more mature than the SPDX equivalent.",
        de: "CycloneDX wurde von Anfang an für Sicherheitsoperationen konzipiert. Die native VEX-Unterstützung ermöglicht die formale Dokumentation von 'not affected'-Entscheidungen. Grype verarbeitet nativ CycloneDX und gibt CycloneDX-Schwachstellenergebnisse aus. Dependency-Track ist auf CycloneDX aufgebaut. Für die Artikel-14-Compliance ist diese Werkzeugkette ausgereifter als das SPDX-Äquivalent.",
      },
    },
  ],
});

export default quiz;
