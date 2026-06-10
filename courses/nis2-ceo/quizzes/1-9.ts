import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.9",
  passingScore: 75,
  questions: [
    {
      id: "1.9.1",
      question: {
        en: "How many categories of measures does Article 21(2) list?",
        de: "Wie viele Maßnahmenkategorien listet Artikel 21 Absatz 2 auf?",
        nl: "Hoeveel categorieën van maatregelen somt artikel 21(2) op?",
      },
      options: [
        { en: "Five", de: "Fünf", nl: "Vijf" },
        { en: "Eight", de: "Acht", nl: "Acht" },
        { en: "Ten", de: "Zehn", nl: "Tien" },
        { en: "Twelve", de: "Zwölf", nl: "Twaalf" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 21(2) lists ten categories of cybersecurity risk-management measures.",
        de: "Artikel 21 Absatz 2 listet zehn Kategorien von Cybersicherheits-Risikomanagementmaßnahmen auf.",
        nl: "Artikel 21(2) somt tien categorieën van cyberbeveiligingsrisicobeheermaatregelen op.",
      },
    },
    {
      id: "1.9.2",
      question: {
        en: "What does 'proportionality' mean in Article 21(1)?",
        de: "Was bedeutet 'Verhältnismäßigkeit' in Artikel 21 Absatz 1?",
        nl: "Wat betekent 'evenredigheid' in artikel 21(1)?",
      },
      options: [
        { en: "Smaller companies can skip some of the ten categories", de: "Kleinere Unternehmen können einige der zehn Kategorien überspringen", nl: "Kleinere bedrijven kunnen sommige van de tien categorieën overslaan" },
        { en: "The depth of implementation is scaled to your size, sector, and risk exposure, but no category is eliminated", de: "Die Umsetzungstiefe wird an Ihre Größe, Branche und Risikoexposition angepasst, aber keine Kategorie entfällt", nl: "De diepgang van de implementatie wordt afgestemd op uw omvang, sector en risicoblootstelling, maar geen enkele categorie vervalt" },
        { en: "Only companies with more than 250 employees need all ten measures", de: "Nur Unternehmen mit mehr als 250 Beschäftigten benötigen alle zehn Maßnahmen", nl: "Alleen bedrijven met meer dan 250 medewerkers hebben alle tien maatregelen nodig" },
        { en: "The regulator applies the measures proportional to the fine amount", de: "Die Aufsichtsbehörde wendet die Maßnahmen proportional zur Bußgeldhöhe an", nl: "De toezichthouder past de maatregelen toe in verhouding tot de hoogte van de boete" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Proportionality scales depth to your size, sector, and risk exposure. It does not eliminate any category.",
        de: "Verhältnismäßigkeit passt die Umsetzungstiefe an Ihre Größe, Branche und Risikoexposition an. Aber keine Kategorie entfällt.",
        nl: "Evenredigheid schaalt de diepgang naar uw omvang, sector en risicoblootstelling. Maar geen enkele categorie vervalt.",
      },
    },
    {
      id: "1.9.3",
      question: {
        en: "What three layers does each measure category need?",
        de: "Welche drei Ebenen benötigt jede Maßnahmenkategorie?",
        nl: "Welke drie lagen heeft elke maatregelcategorie nodig?",
      },
      options: [
        { en: "Budget, timeline, and vendor", de: "Budget, Zeitplan und Anbieter", nl: "Budget, tijdlijn en leverancier" },
        { en: "Policy, insurance, and audit", de: "Richtlinie, Versicherung und Prüfung", nl: "Beleid, verzekering en audit" },
        { en: "Technical, operational, and organisational", de: "Technisch, operativ und organisatorisch", nl: "Technisch, operationeel en organisatorisch" },
        { en: "Internal, external, and regulatory", de: "Intern, extern und regulatorisch", nl: "Intern, extern en regulatoir" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Each category needs three layers: technical, operational, and organisational - what CISOs call technical and organisational measures (TOMs).",
        de: "Jede Kategorie benötigt drei Ebenen: technisch, operativ und organisatorisch -- was CISOs als technische und organisatorische Maßnahmen (TOMs) bezeichnen.",
        nl: "Elke categorie heeft drie lagen nodig: technisch, operationeel en organisatorisch — wat CISO's technische en organisatorische maatregelen (TOMs) noemen.",
      },
    },
  ],
});

export default quiz;
