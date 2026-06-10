import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.3",
  passingScore: 75,
  questions: [
    {
      id: "1.3.1",
      question: {
        en: "What is the maximum administrative fine for Essential entities under NIS2?",
        de: "Wie hoch ist das maximale Bußgeld für wesentliche Einrichtungen unter NIS2?",
        nl: "Wat is de maximale bestuurlijke boete voor essentiële entiteiten onder NIS2?",
      },
      options: [
        { en: "Seven million euros or 1.4% of worldwide turnover", de: "Sieben Millionen Euro oder 1,4 % des weltweiten Umsatzes", nl: "Zeven miljoen euro of 1,4% van de wereldwijde omzet" },
        { en: "Ten million euros or 2% of worldwide annual turnover, whichever is higher", de: "Zehn Millionen Euro oder 2 % des weltweiten Jahresumsatzes, je nachdem welcher Betrag höher ist", nl: "Tien miljoen euro of 2% van de wereldwijde jaaromzet, afhankelijk van welk bedrag hoger is" },
        { en: "Five million euros or 1% of worldwide turnover", de: "Fünf Millionen Euro oder 1 % des weltweiten Umsatzes", nl: "Vijf miljoen euro of 1% van de wereldwijde omzet" },
        { en: "Twenty million euros or 4% of worldwide turnover", de: "Zwanzig Millionen Euro oder 4 % des weltweiten Umsatzes", nl: "Twintig miljoen euro of 4% van de wereldwijde omzet" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 32 sets the maximum for Essential entities at the higher of ten million euros or two percent of total worldwide annual turnover.",
        de: "Artikel 32 legt das Maximum für wesentliche Einrichtungen auf den höheren der beiden Beträge fest: zehn Millionen Euro oder zwei Prozent des weltweiten Jahresumsatzes.",
        nl: "Artikel 32 stelt het maximum voor essentiële entiteiten vast op het hogere van tien miljoen euro of twee procent van de totale wereldwijde jaaromzet.",
      },
    },
    {
      id: "1.3.2",
      question: {
        en: "What does Article 34 allow the regulator to do?",
        de: "Was erlaubt Artikel 34 der Aufsichtsbehörde?",
        nl: "Wat staat Artikel 34 de toezichthouder toe te doen?",
      },
      options: [
        { en: "Only fine the company", de: "Nur das Unternehmen mit einem Bußgeld belegen", nl: "Alleen de onderneming beboeten" },
        { en: "Ban an individual from holding any management position, including interim removal during investigation", de: "Einer Person die Ausübung jeglicher Leitungsfunktion untersagen, einschließlich vorläufiger Abberufung während der Untersuchung", nl: "Een persoon verbieden een leidinggevende functie te bekleden, inclusief tijdelijke schorsing tijdens het onderzoek" },
        { en: "Shut down the company permanently", de: "Das Unternehmen dauerhaft schließen", nl: "Het bedrijf permanent sluiten" },
        { en: "Revoke the company's operating licence", de: "Die Betriebsgenehmigung des Unternehmens widerrufen", nl: "De bedrijfsvergunning van de onderneming intrekken" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 34 gives regulators the power to ban an individual from holding any management position for repeated or serious violations, including an interim removal while proceedings run.",
        de: "Artikel 34 gibt Aufsichtsbehörden die Befugnis, einer Person bei wiederholten oder schwerwiegenden Verstößen die Ausübung jeglicher Leitungsfunktion zu untersagen, einschließlich einer vorläufigen Abberufung während des laufenden Verfahrens.",
        nl: "Artikel 34 geeft toezichthouders de bevoegdheid om een persoon bij herhaalde of ernstige overtredingen te verbieden een leidinggevende functie te bekleden, inclusief tijdelijke schorsing gedurende de procedure.",
      },
    },
    {
      id: "1.3.3",
      question: {
        en: "How many layers of exposure does the lesson describe?",
        de: "Wie viele Haftungsebenen beschreibt die Lektion?",
        nl: "Hoeveel lagen van blootstelling beschrijft de les?",
      },
      options: [
        { en: "One: the company fine", de: "Eine: das Unternehmensbußgeld", nl: "Één: de boete voor de onderneming" },
        { en: "Two: the company fine and the manager ban", de: "Zwei: das Unternehmensbußgeld und das Tätigkeitsverbot für Geschäftsleiter", nl: "Twee: de boete voor de onderneming en het bestuursverbod" },
        { en: "Three: the company fine, the Article 34 manager ban, and personal civil liability under corporate law", de: "Drei: das Unternehmensbußgeld, das Tätigkeitsverbot nach Artikel 34 und die persönliche zivilrechtliche Haftung nach Gesellschaftsrecht", nl: "Drie: de boete voor de onderneming, het bestuursverbod van Artikel 34 en persoonlijke civielrechtelijke aansprakelijkheid onder vennootschapsrecht" },
        { en: "Four: fine, ban, civil liability, and criminal prosecution", de: "Vier: Bußgeld, Tätigkeitsverbot, Zivilhaftung und strafrechtliche Verfolgung", nl: "Vier: boete, verbod, civiele aansprakelijkheid en strafrechtelijke vervolging" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The three layers are: (1) the administrative fine on the company, (2) the Article 34 manager ban, and (3) your own company suing you personally for damages under corporate law.",
        de: "Die drei Ebenen sind: (1) das Bußgeld gegen das Unternehmen, (2) das Tätigkeitsverbot nach Artikel 34 und (3) die persönliche Schadensersatzklage Ihres eigenen Unternehmens gegen Sie nach Gesellschaftsrecht.",
        nl: "De drie lagen zijn: (1) de bestuurlijke boete voor de onderneming, (2) het bestuursverbod van Artikel 34 en (3) uw eigen onderneming die u persoonlijk aanklaagt voor schade op grond van vennootschapsrecht.",
      },
    },
    {
      id: "1.3.4",
      question: {
        en: "What is the maximum fine cap for Important entities?",
        de: "Wie hoch ist die Bußgeldobergrenze für wichtige Einrichtungen?",
        nl: "Wat is het maximale boeteplafond voor belangrijke entiteiten?",
      },
      options: [
        { en: "Ten million euros or 2% of worldwide turnover", de: "Zehn Millionen Euro oder 2 % des weltweiten Umsatzes", nl: "Tien miljoen euro of 2% van de wereldwijde omzet" },
        { en: "Seven million euros or 1.4% of worldwide turnover, whichever is higher", de: "Sieben Millionen Euro oder 1,4 % des weltweiten Umsatzes, je nachdem welcher Betrag höher ist", nl: "Zeven miljoen euro of 1,4% van de wereldwijde omzet, afhankelijk van welk bedrag hoger is" },
        { en: "Five million euros or 1% of worldwide turnover", de: "Fünf Millionen Euro oder 1 % des weltweiten Umsatzes", nl: "Vijf miljoen euro of 1% van de wereldwijde omzet" },
        { en: "There is no cap for Important entities", de: "Es gibt keine Obergrenze für wichtige Einrichtungen", nl: "Er is geen plafond voor belangrijke entiteiten" },
      ],
      correctIndex: 1,
      explanation: {
        en: "For Important entities, the cap is the higher of seven million euros or one point four percent of worldwide turnover.",
        de: "Für wichtige Einrichtungen liegt die Obergrenze beim höheren der beiden Beträge: sieben Millionen Euro oder 1,4 Prozent des weltweiten Umsatzes.",
        nl: "Voor belangrijke entiteiten is het plafond het hogere van zeven miljoen euro of één komma vier procent van de wereldwijde omzet.",
      },
    },
  ],
});

export default quiz;
