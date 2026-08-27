import { courseSchema } from "@/lib/training/schemas";

const course = courseSchema.parse({
  "id": "cra-sbom",
  "title": {
    "en": "CRA SBOM Fundamentals",
    "de": "CRA SBOM Grundlagen",
    "nl": "CRA SBOM Grondslagen",
    "fr": "Fondamentaux du SBOM du CRA",
    "it": "Fondamenti CRA SBOM",
    "es": "Fundamentos de CRA SBOM",
    "pl": "Podstawy CRA SBOM",
    "cs": "Základy CRA SBOM",
    "pt": "Fundamentos do SBOM no CRA",
    "ro": "Fundamente CRA SBOM"
  },
  "description": {
    "en": "Build, maintain, and retain the Software Bill of Materials the Cyber Resilience Act demands. Built for product managers, engineers, and security leads at companies selling products with digital elements into the EU. Covers the SBOM obligation in Annex I, Part II, point (1), CycloneDX and SPDX formats, tooling, and the link to Article 14 vulnerability reporting.",
    "de": "Erstellen, pflegen und aufbewahren Sie die Software Bill of Materials, die der Cyber Resilience Act verlangt. Entwickelt für Produktmanager, Ingenieure und Sicherheitsverantwortliche bei Unternehmen, die Produkte mit digitalen Elementen in die EU verkaufen. Behandelt die SBOM-Pflicht in Anhang I Teil II Nummer 1, CycloneDX- und SPDX-Formate, Tooling und den Bezug zu Artikel 14 Meldepflicht für Schwachstellen.",
    "nl": "Bouw, onderhoud en bewaar de Software Bill of Materials die de Cyber Resilience Act vereist. Ontworpen voor productmanagers, engineers en security leads bij bedrijven die producten met digitale elementen verkopen in de EU. Behandelt de SBOM-verplichting in Bijlage I, Deel II, punt (1), CycloneDX- en SPDX-formaten, tooling en de link naar Artikel 14 kwetsbaarheidsrapportage.",
    "fr": "Construire, maintenir et conserver la nomenclature logicielle exigée par le Cyber Resilience Act. Conçu pour les chefs de produit, les ingénieurs et les responsables sécurité des entreprises commercialisant des produits comportant des éléments numériques dans l'UE. Couvre l'obligation relative au SBOM figurant à l'annexe I, partie II, point (1), les formats CycloneDX et SPDX, les outils et le lien avec la notification des vulnérabilités au titre de l'article 14.",
    "it": "Crea, mantieni e conserva l'SBOM richiesto dal Cyber Resilience Act. Destinato a product manager, ingegneri e responsabili della sicurezza presso aziende che vendono prodotti con elementi digitali nell'UE. Copre l'obbligo SBOM nell'Allegato I, Parte II, punto (1), i formati CycloneDX e SPDX, gli strumenti e il collegamento alla segnalazione delle vulnerabilità ai sensi dell'Articolo 14.",
    "es": "Construya, mantenga y conserve la lista de materiales de software que exige la Cyber Resilience Act. Diseñado para gestores de producto, ingenieros y responsables de seguridad en empresas que venden productos con elementos digitales en la UE. Cubre la obligación de SBOM en el Anexo I, Parte II, punto (1), los formatos CycloneDX y SPDX, las herramientas y el vínculo con la notificación de vulnerabilidades del Artículo 14.",
    "pl": "Twórz, utrzymuj i przechowuj Wykaz Materiałów Oprogramowania, którego wymaga Cyber Resilience Act. Przeznaczony dla menedżerów produktu, inżynierów i liderów bezpieczeństwa w firmach sprzedających produkty z elementami cyfrowymi do UE. Omawia obowiązek SBOM w Załącznik I Część II punkt (1), formaty CycloneDX i SPDX, narzędzia oraz powiązanie z Artykuł 14 dotyczącym raportowania podatności.",
    "cs": "Sestavte, udržujte a uchovávejte Software Bill of Materials, který vyžaduje Cyber Resilience Act. Určeno pro produktové manažery, inženýry a bezpečnostní vedoucí ve společnostech prodávajících produkty s digitálními prvky do EU. Pokrývá povinnost SBOM v Příloze I Část II bod (1), formáty CycloneDX a SPDX, nástroje a propojení s Článkem 14 o hlášení zranitelností.",
    "pt": "Crie, mantenha e conserve a Lista de Materiais de Software exigida pelo CRA. Concebido para gestores de produto, engenheiros e responsáveis de segurança em empresas que vendem produtos com elementos digitais para a UE. Abrange a obrigação de SBOM no Anexo I, Parte II, ponto (1), os formatos CycloneDX e SPDX, as ferramentas e a ligação ao artigo 14 sobre comunicação de vulnerabilidades.",
    "ro": "Construiți, mențineți și păstrați Software Bill of Materials pe care Cyber Resilience Act îl solicită. Conceput pentru manageri de produs, ingineri și responsabili de securitate la companii care vând produse cu elemente digitale în UE. Acoperă obligația SBOM din Anexa I, Partea II, punctul (1), formatele CycloneDX și SPDX, instrumentele și legătura cu raportarea vulnerabilităților din Articolul 14."
  },
  "version": "1.0",
  "certificate": {
    "sealLabel": "CRA",
    "legalBasis": {
      "en": "SBOM per Annex I, Part II, point (1) Cyber Resilience Act",
      "de": "SBOM gemäß Anhang I Teil II Nummer 1 Cyber Resilience Act",
      "nl": "SBOM volgens Bijlage I, Deel II, punt (1) Cyber Resilience Act",
      "fr": "SBOM au titre de l'annexe I, partie II, point (1) du Cyber Resilience Act",
      "it": "SBOM ai sensi dell'Allegato I, Parte II, punto (1) del Cyber Resilience Act",
      "es": "SBOM conforme al Anexo I, Parte II, punto (1) del Cyber Resilience Act",
      "pl": "SBOM zgodnie z Załącznikiem I Część II punkt (1) Cyber Resilience Act",
      "cs": "SBOM podle Přílohy I Část II bod (1) Cyber Resilience Act",
      "pt": "SBOM nos termos do Anexo I, Parte II, ponto (1) do Cyber Resilience Act",
      "ro": "SBOM conform Anexei I, Partea II, punctul (1) din Cyber Resilience Act",
    },
  },
  "modules": [
    {
      "id": "foundation",
      "title": {
        "en": "Foundation",
        "de": "Grundlage",
        "nl": "Basis",
        "fr": "Fondements",
        "it": "Fondazione",
        "es": "Fundamentos",
        "pl": "Podstawa",
        "cs": "Základ",
        "pt": "Fundamentos",
        "ro": "Fundație"
      },
      "order": 0,
      "lessonIds": [
        "0.1"
      ]
    },
    {
      "id": "module-1",
      "title": {
        "en": "What Goes Into an SBOM",
        "de": "Was gehört in eine SBOM",
        "nl": "Wat zit er in een SBOM",
        "fr": "Contenu d'un SBOM",
        "it": "Cosa include un SBOM",
        "es": "¿Qué incluye un SBOM?",
        "pl": "Co wchodzi w skład SBOM",
        "cs": "Co patří do SBOM",
        "pt": "O que inclui um SBOM",
        "ro": "Ce include un SBOM"
      },
      "order": 1,
      "lessonIds": [
        "1.1",
        "1.2",
        "1.3"
      ]
    },
    {
      "id": "module-2",
      "title": {
        "en": "Formats",
        "de": "Formate",
        "nl": "Formaten",
        "fr": "Formats",
        "it": "Formati",
        "es": "Formatos",
        "pl": "Formaty",
        "cs": "Formáty",
        "pt": "Formatos",
        "ro": "Formate"
      },
      "order": 2,
      "lessonIds": [
        "2.1",
        "2.2"
      ]
    },
    {
      "id": "module-3",
      "title": {
        "en": "Building and Maintaining Your SBOM",
        "de": "Erstellen und Pflegen Ihrer SBOM",
        "nl": "Bouwen en onderhouden van uw SBOM",
        "fr": "Création et maintien de votre SBOM",
        "it": "Creazione e manutenzione del proprio SBOM",
        "es": "Creación y mantenimiento de su SBOM",
        "pl": "Tworzenie i utrzymywanie własnego SBOM",
        "cs": "Sestavování a udržování vaší SBOM",
        "pt": "Construção e manutenção do seu SBOM",
        "ro": "Construirea și menținerea SBOM-ului"
      },
      "order": 3,
      "lessonIds": [
        "3.1",
        "3.2"
      ]
    },
    {
      "id": "final",
      "title": {
        "en": "Final",
        "de": "Abschluss",
        "nl": "Afsluiting",
        "fr": "Final",
        "it": "Finale",
        "es": "Final",
        "pl": "Zakończenie",
        "cs": "Závěr",
        "pt": "Final",
        "ro": "Final"
      },
      "order": 4,
      "lessonIds": [
        "4.1"
      ]
    }
  ]
});

export default course;
