import { dictionaryTermSchema, type DictionaryTerm } from "@/lib/training/schemas";
import { z } from "zod";

const dictionary: DictionaryTerm[] = z.array(dictionaryTermSchema).parse([
  {
    term: "SBOM",
    type: "defined",
    definition: {
      en: "Software Bill of Materials. A machine-readable inventory of every software component in a product: names, versions, suppliers, and identifiers. Required for products with digital elements under Article 13(5) CRA.",
      de: "Software-Stückliste (Software Bill of Materials). Eine maschinenlesbare Inventarliste aller Software-Komponenten eines Produkts: Namen, Versionen, Anbieter und Bezeichner. Für Produkte mit digitalen Elementen nach Artikel 13(5) CRA vorgeschrieben.",
    },
  },
  {
    term: "Product with digital elements",
    type: "defined",
    definition: {
      en: "Any hardware or software product that can connect, directly or indirectly, to another device or network. The core scope concept in Article 3(1) CRA. Covers physical devices with firmware, standalone software, apps, and operating systems.",
      de: "Jedes Hardware- oder Software-Produkt, das direkt oder indirekt mit einem anderen Gerät oder Netzwerk verbunden werden kann. Der zentrale Geltungsbereich-Begriff in Artikel 3(1) CRA. Erfasst physische Geräte mit Firmware, eigenständige Software, Apps und Betriebssysteme.",
    },
  },
  {
    term: "Top-level dependency",
    type: "defined",
    definition: {
      en: "A component that your product directly imports or links against. The CRA minimum in Article 13(5) requires the SBOM to cover at least these. If your code has `import requests` or `<dependency>spring-boot</dependency>`, those are top-level dependencies.",
      de: "Eine Komponente, die Ihr Produkt direkt importiert oder gegen die es verlinkt. Das CRA-Minimum in Artikel 13(5) verlangt, dass die SBOM mindestens diese abdeckt. Wenn Ihr Code `import requests` oder `<dependency>spring-boot</dependency>` enthält, sind das direkte Abhängigkeiten.",
    },
  },
  {
    term: "Transitive dependency",
    type: "defined",
    definition: {
      en: "A component pulled in by one of your top-level dependencies, not by your code directly. Log4Shell (CVE-2021-44228) was a transitive dependency in thousands of applications whose teams had no idea it was there. The CRA minimum does not require listing these, but best practice does.",
      de: "Eine Komponente, die durch eine Ihrer direkten Abhängigkeiten hereingezogen wird, nicht direkt durch Ihren Code. Log4Shell (CVE-2021-44228) war eine transitive Abhängigkeit in Tausenden von Anwendungen, deren Teams keine Ahnung hatten, dass sie vorhanden war. Das CRA-Minimum verlangt keine Auflistung dieser, Best Practice empfiehlt sie jedoch.",
    },
  },
  {
    term: "CycloneDX",
    type: "defined",
    definition: {
      en: "An OWASP SBOM standard in JSON or XML format. Security-focused: built around vulnerability tracking, VEX statements, and CVE integration. Version 1.6 is current. The preferred format for CRA Article 14 compliance because it maps directly to vulnerability management workflows.",
      de: "Ein OWASP-SBOM-Standard im JSON- oder XML-Format. Sicherheitsorientiert: aufgebaut um Schwachstellenverfolgung, VEX-Aussagen und CVE-Integration. Version 1.6 ist aktuell. Das bevorzugte Format für die CRA-Artikel-14-Konformität, da es direkt auf Schwachstellenmanagement-Workflows ausgerichtet ist.",
    },
  },
  {
    term: "SPDX",
    type: "defined",
    definition: {
      en: "Software Package Data Exchange. ISO/IEC 5962:2021 standard for SBOMs, originated at the Linux Foundation. License-focused: built around open-source license compliance and attribution. Available in JSON, YAML, RDF, and tag-value formats. Both CycloneDX and SPDX qualify as 'commonly used, machine-readable' formats under CRA Article 13(5).",
      de: "Software Package Data Exchange. ISO/IEC 5962:2021-Standard für SBOMs, entstanden bei der Linux Foundation. Lizenzorientiert: aufgebaut um Open-Source-Lizenz-Compliance und Namensnennung. Verfügbar in JSON-, YAML-, RDF- und Tag-Value-Formaten. Sowohl CycloneDX als auch SPDX gelten als 'allgemein verwendete, maschinenlesbare' Formate gemäß CRA Artikel 13(5).",
    },
  },
  {
    term: "PURL",
    type: "defined",
    definition: {
      en: "Package URL. A standard identifier for software components: `pkg:type/namespace/name@version`. For example, `pkg:npm/%40angular/core@17.0.0`. PURLs are the recommended unique identifier in both CycloneDX and SPDX, and the practical anchor for linking an SBOM component to a CVE database entry.",
      de: "Package URL. Ein Standard-Bezeichner für Software-Komponenten: `pkg:type/namespace/name@version`. Zum Beispiel: `pkg:npm/%40angular/core@17.0.0`. PURLs sind der empfohlene eindeutige Bezeichner in CycloneDX und SPDX und der praktische Anker, um eine SBOM-Komponente mit einem CVE-Datenbankeintrag zu verknüpfen.",
    },
  },
  {
    term: "CVE",
    type: "vocabulary",
    definition: {
      en: "Common Vulnerabilities and Exposures. The standardised identifier for publicly known cybersecurity vulnerabilities. Format: CVE-YEAR-NUMBER (e.g. CVE-2021-44228 for Log4Shell). An SBOM linked to a CVE database tells you which known vulnerabilities affect your product.",
      de: "Common Vulnerabilities and Exposures. Der standardisierte Bezeichner für öffentlich bekannte Cybersicherheitsschwachstellen. Format: CVE-YEAR-NUMBER (z.B. CVE-2021-44228 für Log4Shell). Eine SBOM, die mit einer CVE-Datenbank verknüpft ist, zeigt Ihnen, welche bekannten Schwachstellen Ihr Produkt betreffen.",
    },
  },
  {
    term: "VEX",
    type: "defined",
    definition: {
      en: "Vulnerability Exploitability eXchange. A statement attached to an SBOM that documents whether a known CVE actually affects your product and why. Supported natively in CycloneDX. A VEX statement of 'not affected' with a justification is strong evidence in an Article 14 audit.",
      de: "Vulnerability Exploitability eXchange. Eine an eine SBOM angehängte Aussage, die dokumentiert, ob eine bekannte CVE Ihr Produkt tatsächlich betrifft und warum. Nativ in CycloneDX unterstützt. Eine VEX-Aussage 'not affected' mit Begründung ist ein starker Nachweis bei einem Artikel-14-Audit.",
    },
  },
  {
    term: "Actively exploited vulnerability",
    type: "defined",
    definition: {
      en: "A vulnerability in your product that a malicious actor is currently using against real systems, without the permission of the system owner. The trigger for the Article 14(1) CRA 24-hour reporting obligation. Distinguished from a publicly disclosed but not yet exploited vulnerability.",
      de: "Eine Schwachstelle in Ihrem Produkt, die ein böswilliger Akteur derzeit gegen echte Systeme einsetzt, ohne Erlaubnis des Systeminhabers. Der Auslöser für die 24-Stunden-Meldepflicht in Artikel 14(1) CRA. Zu unterscheiden von einer öffentlich bekannten, aber noch nicht ausgenutzten Schwachstelle.",
    },
  },
  {
    term: "Market surveillance authority",
    type: "vocabulary",
    definition: {
      en: "The national authority that checks CRA compliance in each EU member state. In Germany this function sits with the BSI. Market surveillance authorities can request your technical documentation, including the SBOM, at any time. You must provide it within a reasonable timeframe — not make it publicly available.",
      de: "Die nationale Behörde, die die CRA-Konformität in jedem EU-Mitgliedstaat prüft. In Deutschland liegt diese Funktion beim BSI. Marktüberwachungsbehörden können jederzeit Ihre technische Dokumentation, einschließlich der SBOM, anfordern. Sie müssen sie innerhalb einer angemessenen Frist bereitstellen — nicht öffentlich zugänglich machen.",
    },
  },
  {
    term: "Technical documentation",
    type: "defined",
    definition: {
      en: "The set of documents a manufacturer must compile and keep under CRA Article 31 and Annex VII. Includes the SBOM, risk assessment, secure design decisions, test results, and the EU declaration of conformity. Must be retained for 10 years after the product is placed on the market, or for the support period, whichever is longer.",
      de: "Die Dokumentensammlung, die ein Hersteller gemäß CRA Artikel 31 und Anhang VII zusammenstellen und aufbewahren muss. Umfasst SBOM, Risikobeurteilung, sichere Designentscheidungen, Testergebnisse und die EU-Konformitätserklärung. Muss 10 Jahre nach Inverkehrbringen oder für die Unterstützungsdauer aufbewahrt werden, je nachdem, was länger ist.",
    },
  },
  {
    term: "Support period",
    type: "defined",
    definition: {
      en: "The time during which a manufacturer provides security updates for a product. CRA Annex I Part I requires manufacturers to provide security patches for at least five years, or the expected product lifetime if shorter. The SBOM retention period runs for 10 years or until the end of this support period, whichever is longer.",
      de: "Der Zeitraum, in dem ein Hersteller Sicherheitsupdates für ein Produkt bereitstellt. CRA Anhang I Teil I verlangt, dass Hersteller Sicherheits-Patches für mindestens fünf Jahre bereitstellen, oder die erwartete Produktlebensdauer, wenn diese kürzer ist. Die SBOM-Aufbewahrungspflicht gilt für 10 Jahre oder bis zum Ende dieser Unterstützungsdauer, je nachdem, was länger ist.",
    },
  },
  {
    term: "ENISA",
    type: "vocabulary",
    definition: {
      en: "European Union Agency for Cybersecurity. Receives Article 14 CRA vulnerability and incident reports via the Single Reporting Platform (operational September 11, 2026). Also receives NIS 2 Article 23 early warnings for certain entity types.",
      de: "Agentur der Europäischen Union für Cybersicherheit. Erhält CRA-Artikel-14-Schwachstellen- und Vorfallsmeldungen über die Single Reporting Platform (betriebsbereit ab 11. September 2026). Empfängt auch NIS-2-Artikel-23-Frühwarnungen für bestimmte Einrichtungstypen.",
    },
  },
  {
    term: "Coordinated vulnerability disclosure",
    type: "defined",
    definition: {
      en: "A process where a security researcher privately reports a vulnerability to the manufacturer before publishing details publicly. CRA Article 13(6) requires manufacturers to have a policy for accepting and processing such disclosures. Typically implemented via a security.txt file and a dedicated security contact.",
      de: "Ein Prozess, bei dem ein Sicherheitsforscher eine Schwachstelle privat an den Hersteller meldet, bevor Details öffentlich veröffentlicht werden. CRA Artikel 13(6) verlangt, dass Hersteller eine Richtlinie für die Entgegennahme und Bearbeitung solcher Meldungen haben. Typischerweise über eine security.txt-Datei und einen dedizierten Sicherheitskontakt umgesetzt.",
    },
  },
  {
    term: "Supply chain attack",
    type: "vocabulary",
    definition: {
      en: "An attack that targets a manufacturer through a compromised dependency or supplier, rather than attacking the manufacturer's own systems directly. SolarWinds and XZ Utils are examples. The SBOM is your map for identifying which supply chain components are present and therefore which supply chain attacks can reach your product.",
      de: "Ein Angriff, der einen Hersteller über eine kompromittierte Abhängigkeit oder einen Lieferanten angreift, anstatt die eigenen Systeme des Herstellers direkt anzugreifen. SolarWinds und XZ Utils sind Beispiele. Die SBOM ist Ihre Karte, um zu identifizieren, welche Lieferketten-Komponenten vorhanden sind und welche Lieferkettenangriffe Ihr Produkt daher erreichen können.",
    },
  },
  {
    term: "Hash",
    type: "defined",
    definition: {
      en: "A fixed-length fingerprint of a file computed by an algorithm such as SHA-256. Including a hash for each SBOM component lets you verify that the component has not been tampered with since the SBOM was generated. CycloneDX and SPDX both support hashes per component.",
      de: "Ein fester Fingerabdruck einer Datei, berechnet durch einen Algorithmus wie SHA-256. Die Aufnahme eines Hash-Werts für jede SBOM-Komponente ermöglicht es Ihnen zu überprüfen, ob die Komponente seit der SBOM-Erstellung nicht verändert wurde. CycloneDX und SPDX unterstützen beide Hashes pro Komponente.",
    },
  },
  {
    term: "Conformity assessment",
    type: "vocabulary",
    definition: {
      en: "The process a manufacturer uses to demonstrate that its product meets CRA requirements. Default-class products can self-assess. Important Class I products can self-assess using harmonised standards. Important Class II products require a third-party conformity assessment body (CAB). The SBOM is part of the technical documentation reviewed during conformity assessment.",
      de: "Das Verfahren, mit dem ein Hersteller nachweist, dass sein Produkt die CRA-Anforderungen erfüllt. Standard-Produkte können sich selbst bewerten. Wichtige Klasse-I-Produkte können sich unter Verwendung harmonisierter Normen selbst bewerten. Wichtige Klasse-II-Produkte benötigen eine Konformitätsbewertungsstelle (KBS). Die SBOM ist Teil der technischen Dokumentation, die bei der Konformitätsbewertung geprüft wird.",
    },
  },
  {
    term: "Syft",
    type: "defined",
    definition: {
      en: "An open-source SBOM generator by Anchore. Scans container images, filesystems, and language-specific package manifests. Outputs CycloneDX or SPDX. The fastest way to generate an initial SBOM for an existing product.",
      de: "Ein Open-Source-SBOM-Generator von Anchore. Scannt Container-Images, Dateisysteme und sprachspezifische Paket-Manifeste. Gibt CycloneDX oder SPDX aus. Der schnellste Weg, eine erste SBOM für ein bestehendes Produkt zu erstellen.",
    },
  },
  {
    term: "Grype",
    type: "defined",
    definition: {
      en: "An open-source vulnerability scanner by Anchore. Takes an SBOM as input and matches components against the NVD, GitHub Advisory Database, and other vulnerability feeds. The tool that converts an SBOM into an Article 14 monitoring capability.",
      de: "Ein Open-Source-Schwachstellenscanner von Anchore. Nimmt eine SBOM als Eingabe und gleicht Komponenten mit der NVD, der GitHub Advisory Database und anderen Schwachstellen-Feeds ab. Das Werkzeug, das eine SBOM in eine Artikel-14-Überwachungsfähigkeit umwandelt.",
    },
  },
]);

export default dictionary;
