import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.1",
  passingScore: 75,
  questions: [
    {
      id: "2.1.1",
      question: {
        en: "Which organisation maintains the CycloneDX standard?",
        de: "Welche Organisation pflegt den CycloneDX-Standard?",
      },
      options: [
        { en: "ISO", de: "ISO" },
        { en: "Linux Foundation", de: "Linux Foundation" },
        { en: "OWASP", de: "OWASP" },
        { en: "NIST", de: "NIST" },
      ],
      correctIndex: 2,
      explanation: {
        en: "CycloneDX is an OWASP project — the Open Web Application Security Project. SPDX is the Linux Foundation project. ISO/IEC 5962:2021 is the ISO standard for SBOM, which covers SPDX.",
        de: "CycloneDX ist ein OWASP-Projekt — das Open Web Application Security Project. SPDX ist das Linux-Foundation-Projekt. ISO/IEC 5962:2021 ist der ISO-Standard für SBOM, der SPDX abdeckt.",
      },
    },
    {
      id: "2.1.2",
      question: {
        en: "What does a VEX 'not_affected' statement with a 'code_not_reachable' justification document?",
        de: "Was dokumentiert eine VEX-'not_affected'-Aussage mit der Begründung 'code_not_reachable'?",
      },
      options: [
        { en: "That the CVE has been patched in the next planned release", de: "Dass die CVE im nächsten geplanten Release gepatcht wird" },
        { en: "That the vulnerable code exists in the component but cannot be reached in this product's execution context", de: "Dass der anfällige Code in der Komponente vorhanden ist, aber im Ausführungskontext dieses Produkts nicht erreichbar ist" },
        { en: "That the component version is not affected by the CVE according to the NVD", de: "Dass die Komponentenversion laut NVD nicht von der CVE betroffen ist" },
        { en: "That the CVE has been disputed by the component vendor", de: "Dass die CVE vom Komponentenanbieter angefochten wird" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A VEX 'not_affected' statement with 'code_not_reachable' means: the vulnerable code path exists in the component version you are using, but your product's architecture or configuration means that code path is never executed. This is a formal, machine-readable audit record of the investigation decision.",
        de: "Eine VEX-'not_affected'-Aussage mit 'code_not_reachable' bedeutet: Der anfällige Codepfad ist in der verwendeten Komponentenversion vorhanden, aber durch die Architektur oder Konfiguration Ihres Produkts wird dieser Codepfad nie ausgeführt. Dies ist ein formales, maschinenlesbares Auditprotokoll der Untersuchungsentscheidung.",
      },
    },
    {
      id: "2.1.3",
      question: {
        en: "What are the four main sections of a CycloneDX SBOM document?",
        de: "Was sind die vier Hauptabschnitte eines CycloneDX-SBOM-Dokuments?",
      },
      options: [
        { en: "Header, body, signatures, appendix", de: "Kopfzeile, Hauptteil, Signaturen, Anhang" },
        { en: "Metadata, components, dependencies, vulnerabilities", de: "Metadaten, Komponenten, Abhängigkeiten, Schwachstellen" },
        { en: "Document info, packages, relationships, files", de: "Dokumentinformationen, Pakete, Beziehungen, Dateien" },
        { en: "Manifest, inventory, licenses, hashes", de: "Manifest, Inventar, Lizenzen, Hash-Werte" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A CycloneDX document has: metadata (about the SBOM and the product), components (the component inventory), dependencies (the dependency graph), and optionally vulnerabilities (embedded CVE data). SPDX uses different section names: document creation information, packages, relationships.",
        de: "Ein CycloneDX-Dokument hat: Metadaten (über die SBOM und das Produkt), Komponenten (das Komponenteninventar), Abhängigkeiten (der Abhängigkeitsgraph) und optional Schwachstellen (eingebettete CVE-Daten). SPDX verwendet andere Abschnittsnamen: Dokumenterstellungsinformationen, Pakete, Beziehungen.",
      },
    },
    {
      id: "2.1.4",
      question: {
        en: "Why is CycloneDX described as the preferred format for CRA Article 14 compliance workflows?",
        de: "Warum wird CycloneDX als bevorzugtes Format für CRA-Artikel-14-Compliance-Workflows beschrieben?",
      },
      options: [
        { en: "Because the European Commission has officially designated CycloneDX as the required format", de: "Weil die Europäische Kommission CycloneDX offiziell als vorgeschriebenes Format festgelegt hat" },
        { en: "Because it was designed for vulnerability management workflows and has native VEX support, and tools like Grype and Dependency-Track are built around it", de: "Weil es für Schwachstellenmanagement-Workflows konzipiert wurde und native VEX-Unterstützung hat, und Werkzeuge wie Grype und Dependency-Track darauf aufgebaut sind" },
        { en: "Because it is the only format that supports PURL identifiers", de: "Weil es das einzige Format ist, das PURL-Bezeichner unterstützt" },
        { en: "Because SPDX does not support component hashes", de: "Weil SPDX keine Komponenten-Hash-Werte unterstützt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CycloneDX was designed for security use cases from the start. Its native VEX support, Dependency-Track integration, and tooling ecosystem (Grype, Syft, cdxgen) make it the natural choice for the Article 14 monitoring and reporting loop. SPDX also qualifies for CRA compliance but was designed primarily for license management.",
        de: "CycloneDX wurde von Anfang an für Sicherheits-Anwendungsfälle konzipiert. Seine native VEX-Unterstützung, die Dependency-Track-Integration und das Werkzeug-Ökosystem (Grype, Syft, cdxgen) machen es zur natürlichen Wahl für den Artikel-14-Überwachungs- und Meldungskreislauf. SPDX qualifiziert sich ebenfalls für die CRA-Compliance, wurde jedoch primär für die Lizenzverwaltung konzipiert.",
      },
    },
    {
      id: "2.1.5",
      question: {
        en: "Which command generates a CycloneDX 1.6 JSON SBOM from a container image using Syft?",
        de: "Welcher Befehl erstellt eine CycloneDX-1.6-JSON-SBOM aus einem Container-Image mit Syft?",
      },
      options: [
        { en: "syft my-image:latest --format cdx", de: "syft my-image:latest --format cdx" },
        { en: "syft scan my-image:latest > sbom.json", de: "syft scan my-image:latest > sbom.json" },
        { en: "syft my-image:latest -o cyclonedx-json > sbom.cdx.json", de: "syft my-image:latest -o cyclonedx-json > sbom.cdx.json" },
        { en: "syft generate --type cyclonedx my-image:latest", de: "syft generate --type cyclonedx my-image:latest" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The correct Syft command is: syft <target> -o cyclonedx-json > output-file.cdx.json. The -o flag sets the output format. cyclonedx-json produces CycloneDX 1.6 JSON by default.",
        de: "Der korrekte Syft-Befehl ist: syft <Ziel> -o cyclonedx-json > Ausgabedatei.cdx.json. Das -o-Flag legt das Ausgabeformat fest. cyclonedx-json erzeugt standardmäßig CycloneDX 1.6 JSON.",
      },
    },
  ],
});

export default quiz;
