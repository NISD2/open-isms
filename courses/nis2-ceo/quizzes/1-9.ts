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
        fr: "Combien de catégories de mesures l'article 21(2) énumère-t-il ?",
        it: "Quante categorie di misure elenca l'articolo 21(2)?",
        es: "¿Cuántas categorías de medidas enumera el artículo 21(2)?",
        pl: "Ile kategorii środków wymienia artykuł 21(2)?",
      },
      options: [
        { en: "Five", de: "Fünf", nl: "Vijf", fr: "Cinq", it: "Cinque", es: "Cinco", pl: "Pięć" },
        { en: "Eight", de: "Acht", nl: "Acht", fr: "Huit", it: "Otto", es: "Ocho", pl: "Osiem" },
        { en: "Ten", de: "Zehn", nl: "Tien", fr: "Dix", it: "Dieci", es: "Diez", pl: "Dziesięć" },
        { en: "Twelve", de: "Zwölf", nl: "Twaalf", fr: "Douze", it: "Dodici", es: "Doce", pl: "Dwanaście" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 21(2) lists ten categories of cybersecurity risk-management measures.",
        de: "Artikel 21 Absatz 2 listet zehn Kategorien von Cybersicherheits-Risikomanagementmaßnahmen auf.",
        nl: "Artikel 21(2) somt tien categorieën van cyberbeveiligingsrisicobeheermaatregelen op.",
        fr: "L'article 21(2) énumère dix catégories de mesures de gestion des risques en matière de cybersécurité.",
        it: "L'articolo 21(2) elenca dieci categorie di misure di gestione dei rischi di cybersicurezza.",
        es: "El artículo 21(2) enumera diez categorías de medidas de gestión de riesgos de ciberseguridad.",
        pl: "Artykuł 21(2) wymienia dziesięć kategorii środków zarządzania ryzykiem w cyberbezpieczeństwie.",
      },
    },
    {
      id: "1.9.2",
      question: {
        en: "What does 'proportionality' mean in Article 21(1)?",
        de: "Was bedeutet 'Verhältnismäßigkeit' in Artikel 21 Absatz 1?",
        nl: "Wat betekent 'evenredigheid' in artikel 21(1)?",
        fr: "Que signifie la 'proportionnalité' à l'article 21(1) ?",
        it: "Cosa significa 'proporzionalità' nell'articolo 21(1)?",
        es: "¿Qué significa 'proporcionalidad' en el artículo 21(1)?",
        pl: "Co oznacza 'proporcjonalność' w artykule 21(1)?",
      },
      options: [
        { en: "Smaller companies can skip some of the ten categories", de: "Kleinere Unternehmen können einige der zehn Kategorien überspringen", nl: "Kleinere bedrijven kunnen sommige van de tien categorieën overslaan", fr: "Les petites entreprises peuvent omettre certaines des dix catégories", it: "Le imprese più piccole possono saltare alcune delle dieci categorie", es: "Las empresas más pequeñas pueden omitir algunas de las diez categorías", pl: "Mniejsze firmy mogą pominąć niektóre z dziesięciu kategorii" },
        { en: "The depth of implementation is scaled to your size, sector, and risk exposure, but no category is eliminated", de: "Die Umsetzungstiefe wird an Ihre Größe, Branche und Risikoexposition angepasst, aber keine Kategorie entfällt", nl: "De diepgang van de implementatie wordt afgestemd op uw omvang, sector en risicoblootstelling, maar geen enkele categorie vervalt", fr: "La profondeur de la mise en œuvre est adaptée à votre taille, votre secteur et votre exposition au risque, mais aucune catégorie n'est supprimée", it: "La profondità dell'attuazione è commisurata alle vostre dimensioni, al settore e all'esposizione al rischio, ma nessuna categoria viene eliminata", es: "La profundidad de la implementación se adapta a su tamaño, sector y exposición al riesgo, pero no se elimina ninguna categoría", pl: "Głębokość wdrożenia jest dostosowana do Państwa wielkości, sektora i ekspozycji na ryzyko, ale żadna kategoria nie zostaje wyeliminowana" },
        { en: "Only companies with more than 250 employees need all ten measures", de: "Nur Unternehmen mit mehr als 250 Beschäftigten benötigen alle zehn Maßnahmen", nl: "Alleen bedrijven met meer dan 250 medewerkers hebben alle tien maatregelen nodig", fr: "Seules les entreprises de plus de 250 employés ont besoin des dix mesures", it: "Solo le imprese con più di 250 dipendenti necessitano di tutte e dieci le misure", es: "Solo las empresas con más de 250 empleados necesitan las diez medidas", pl: "Tylko firmy zatrudniające ponad 250 pracowników potrzebują wszystkich dziesięciu środków" },
        { en: "The regulator applies the measures proportional to the fine amount", de: "Die Aufsichtsbehörde wendet die Maßnahmen proportional zur Bußgeldhöhe an", nl: "De toezichthouder past de maatregelen toe in verhouding tot de hoogte van de boete", fr: "L'autorité de contrôle applique les mesures proportionnellement au montant de l'amende", it: "L'autorità di vigilanza applica le misure in proporzione all'importo della sanzione", es: "La autoridad reguladora aplica las medidas en proporción al importe de la multa", pl: "Organ nadzoru stosuje środki proporcjonalnie do wysokości kary" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Proportionality scales depth to your size, sector, and risk exposure. It does not eliminate any category.",
        de: "Verhältnismäßigkeit passt die Umsetzungstiefe an Ihre Größe, Branche und Risikoexposition an. Aber keine Kategorie entfällt.",
        nl: "Evenredigheid schaalt de diepgang naar uw omvang, sector en risicoblootstelling. Maar geen enkele categorie vervalt.",
        fr: "La proportionnalité adapte la profondeur à votre taille, votre secteur et votre exposition au risque. Elle ne supprime aucune catégorie.",
        it: "La proporzionalità commisura la profondità alle vostre dimensioni, al settore e all'esposizione al rischio. Non elimina alcuna categoria.",
        es: "La proporcionalidad adapta la profundidad a su tamaño, sector y exposición al riesgo. No elimina ninguna categoría.",
        pl: "Proporcjonalność dostosowuje głębokość do Państwa wielkości, sektora i ekspozycji na ryzyko. Nie eliminuje żadnej kategorii.",
      },
    },
    {
      id: "1.9.3",
      question: {
        en: "What three layers does each measure category need?",
        de: "Welche drei Ebenen benötigt jede Maßnahmenkategorie?",
        nl: "Welke drie lagen heeft elke maatregelcategorie nodig?",
        fr: "De quelles trois couches chaque catégorie de mesures a-t-elle besoin ?",
        it: "Di quali tre livelli ha bisogno ogni categoria di misure?",
        es: "¿Qué tres capas necesita cada categoría de medidas?",
        pl: "Jakich trzech warstw potrzebuje każda kategoria środków?",
      },
      options: [
        { en: "Budget, timeline, and vendor", de: "Budget, Zeitplan und Anbieter", nl: "Budget, tijdlijn en leverancier", fr: "Budget, calendrier et fournisseur", it: "Budget, tempistica e fornitore", es: "Presupuesto, calendario y proveedor", pl: "Budżet, harmonogram i dostawca" },
        { en: "Policy, insurance, and audit", de: "Richtlinie, Versicherung und Prüfung", nl: "Beleid, verzekering en audit", fr: "Politique, assurance et audit", it: "Politica, assicurazione e audit", es: "Política, seguro y auditoría", pl: "Polityka, ubezpieczenie i audyt" },
        { en: "Technical, operational, and organisational", de: "Technisch, operativ und organisatorisch", nl: "Technisch, operationeel en organisatorisch", fr: "Technique, opérationnelle et organisationnelle", it: "Tecnico, operativo e organizzativo", es: "Técnica, operativa y organizativa", pl: "Techniczna, operacyjna i organizacyjna" },
        { en: "Internal, external, and regulatory", de: "Intern, extern und regulatorisch", nl: "Intern, extern en regulatoir", fr: "Interne, externe et réglementaire", it: "Interno, esterno e normativo", es: "Interna, externa y normativa", pl: "Wewnętrzna, zewnętrzna i regulacyjna" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Each category needs three layers: technical, operational, and organisational - what CISOs call technical and organisational measures (TOMs).",
        de: "Jede Kategorie benötigt drei Ebenen: technisch, operativ und organisatorisch -- was CISOs als technische und organisatorische Maßnahmen (TOMs) bezeichnen.",
        nl: "Elke categorie heeft drie lagen nodig: technisch, operationeel en organisatorisch — wat CISO's technische en organisatorische maatregelen (TOMs) noemen.",
        fr: "Chaque catégorie a besoin de trois couches : technique, opérationnelle et organisationnelle, ce que les CISO appellent les mesures techniques et organisationnelles (TOMs).",
        it: "Ogni categoria necessita di tre livelli: tecnico, operativo e organizzativo, ciò che i CISO chiamano misure tecniche e organizzative (TOMs).",
        es: "Cada categoría necesita tres capas: técnica, operativa y organizativa, lo que los CISO denominan medidas técnicas y organizativas (TOMs).",
        pl: "Każda kategoria potrzebuje trzech warstw: technicznej, operacyjnej i organizacyjnej, czyli tego, co CISO nazywają środkami technicznymi i organizacyjnymi (TOMs).",
      },
    },
  ],
});

export default quiz;
