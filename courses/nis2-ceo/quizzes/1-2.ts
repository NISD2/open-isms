import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.2",
  passingScore: 75,
  questions: [
    {
      id: "1.2.1",
      question: {
        en: "What is the size threshold for most companies to fall in scope of NIS2?",
        de: "Ab welcher Unternehmensgröße fallen die meisten Unternehmen in den Anwendungsbereich von NIS2?",
        nl: "Wat is de drempelwaarde voor de omvang van bedrijven om onder de reikwijdte van NIS2 te vallen?",
      },
      options: [
        { en: "250 or more employees, or 50 million euros in turnover", de: "250 oder mehr Beschäftigte oder 50 Millionen Euro Umsatz", nl: "250 of meer werknemers, of 50 miljoen euro omzet" },
        { en: "50 or more employees, or more than 10 million euros in annual turnover", de: "50 oder mehr Beschäftigte oder mehr als 10 Millionen Euro Jahresumsatz", nl: "50 of meer werknemers, of meer dan 10 miljoen euro jaaromzet" },
        { en: "10 or more employees, or more than 1 million euros in annual turnover", de: "10 oder mehr Beschäftigte oder mehr als 1 Million Euro Jahresumsatz", nl: "10 of meer werknemers, of meer dan 1 miljoen euro jaaromzet" },
        { en: "100 or more employees, or more than 25 million euros in annual turnover", de: "100 oder mehr Beschäftigte oder mehr als 25 Millionen Euro Jahresumsatz", nl: "100 of meer werknemers, of meer dan 25 miljoen euro jaaromzet" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Most companies enter scope through fifty or more employees, or more than ten million euros in annual turnover.",
        de: "Die meisten Unternehmen fallen ab fünfzig oder mehr Beschäftigten oder mehr als zehn Millionen Euro Jahresumsatz in den Anwendungsbereich.",
        nl: "De meeste bedrijven vallen binnen de reikwijdte met vijftig of meer werknemers, of meer dan tien miljoen euro jaaromzet.",
      },
    },
    {
      id: "1.2.2",
      question: {
        en: "What is the key difference between Essential and Important entities?",
        de: "Was ist der wesentliche Unterschied zwischen wesentlichen und wichtigen Einrichtungen?",
        nl: "Wat is het belangrijkste verschil tussen essentiële entiteiten en belangrijke entiteiten?",
      },
      options: [
        { en: "Essential entities must implement all ten measures; Important entities only implement five", de: "Wesentliche Einrichtungen müssen alle zehn Maßnahmen umsetzen; wichtige Einrichtungen nur fünf", nl: "Essentiële entiteiten moeten alle tien maatregelen implementeren; belangrijke entiteiten slechts vijf" },
        { en: "Essential entities face proactive supervision (audit without cause); Important entities face reactive supervision (audit only when triggered)", de: "Wesentliche Einrichtungen unterliegen proaktiver Aufsicht (Prüfung ohne Anlass); wichtige Einrichtungen unterliegen reaktiver Aufsicht (Prüfung nur bei konkretem Anlass)", nl: "Essentiële entiteiten staan onder proactief toezicht (audit zonder aanleiding); belangrijke entiteiten staan onder reactief toezicht (audit alleen bij aanleiding)" },
        { en: "Important entities face higher fines than Essential entities", de: "Wichtige Einrichtungen müssen höhere Bußgelder zahlen als wesentliche Einrichtungen", nl: "Belangrijke entiteiten krijgen hogere boetes dan essentiële entiteiten" },
        { en: "Essential entities are in Annex II; Important entities are in Annex I", de: "Wesentliche Einrichtungen stehen in Anhang II; wichtige Einrichtungen in Anhang I", nl: "Essentiële entiteiten staan in Bijlage II; belangrijke entiteiten staan in Bijlage I" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The substantive obligations apply equally. The difference is enforcement intensity: Essential entities face proactive supervision, Important entities face reactive supervision.",
        de: "Die inhaltlichen Pflichten gelten gleichermaßen. Der Unterschied liegt in der Aufsichtsintensität: Wesentliche Einrichtungen unterliegen proaktiver Aufsicht, wichtige Einrichtungen reaktiver Aufsicht.",
        nl: "De inhoudelijke verplichtingen gelden voor beiden gelijkelijk. Het verschil zit in de handhavingsintensiteit: essentiële entiteiten staan onder proactief toezicht, belangrijke entiteiten onder reactief toezicht.",
      },
    },
    {
      id: "1.2.3",
      question: {
        en: "Do Essential and Important entities have to implement different security measures?",
        de: "Müssen wesentliche und wichtige Einrichtungen unterschiedliche Sicherheitsmaßnahmen umsetzen?",
        nl: "Moeten essentiële entiteiten en belangrijke entiteiten verschillende beveiligingsmaatregelen implementeren?",
      },
      options: [
        { en: "Yes, Essential entities have stricter technical requirements", de: "Ja, wesentliche Einrichtungen haben strengere technische Anforderungen", nl: "Ja, essentiële entiteiten hebben strengere technische vereisten" },
        { en: "Yes, Important entities have additional reporting duties", de: "Ja, wichtige Einrichtungen haben zusätzliche Meldepflichten", nl: "Ja, belangrijke entiteiten hebben aanvullende meldingsverplichtingen" },
        { en: "No, both must implement the same ten measures under Article 21", de: "Nein, beide müssen die gleichen zehn Maßnahmen nach Artikel 21 umsetzen", nl: "Nee, beide moeten dezelfde tien maatregelen implementeren op grond van Artikel 21" },
        { en: "No measures apply to Important entities", de: "Für wichtige Einrichtungen gelten keine Maßnahmen", nl: "Er gelden geen maatregelen voor belangrijke entiteiten" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The ten measures under Article 21 apply equally to both categories. The difference is enforcement intensity, not compliance scope.",
        de: "Die zehn Maßnahmen nach Artikel 21 gelten gleichermaßen für beide Kategorien. Der Unterschied liegt in der Aufsichtsintensität, nicht im Umfang der Pflichten.",
        nl: "De tien maatregelen van Artikel 21 gelden voor beide categorieën gelijkelijk. Het verschil zit in de handhavingsintensiteit, niet in de reikwijdte van de naleving.",
      },
    },
  ],
});

export default quiz;
