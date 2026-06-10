import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.8",
  passingScore: 75,
  questions: [
    {
      id: "1.8.1",
      question: {
        en: "Does the Business Judgment Rule protect a decision not to implement NIS2 measures?",
        de: "Schützt die Business Judgment Rule eine Entscheidung, NIS2-Maßnahmen nicht umzusetzen?",
        nl: "Beschermt de business judgment rule een beslissing om NIS2-maatregelen niet te implementeren?",
      },
      options: [
        { en: "Yes, if the decision was made in good faith with reasonable information", de: "Ja, wenn die Entscheidung gutgläubig und auf angemessener Informationsgrundlage getroffen wurde", nl: "Ja, als de beslissing te goeder trouw is genomen op basis van redelijke informatie" },
        { en: "Yes, all board decisions are protected by the Business Judgment Rule", de: "Ja, alle Vorstandsentscheidungen werden durch die Business Judgment Rule geschützt", nl: "Ja, alle bestuursbesluiten worden beschermd door de business judgment rule" },
        { en: "No, NIS2 creates statutory duties under the duty of legality, which sits above the Business Judgment Rule", de: "Nein, NIS2 begründet gesetzliche Pflichten im Rahmen der Legalitätspflicht, die über der Business Judgment Rule steht", nl: "Nee, NIS2 schept wettelijke verplichtingen op grond van de legaliteitsplicht, die boven de business judgment rule staat" },
        { en: "Only if the company documents why it chose not to implement", de: "Nur wenn das Unternehmen dokumentiert, warum es sich gegen die Umsetzung entschieden hat", nl: "Alleen als de vennootschap documenteert waarom zij ervoor heeft gekozen niet te implementeren" },
      ],
      correctIndex: 2,
      explanation: {
        en: "NIS2 Articles 20 and 21 create statutory duties. The duty of legality means no judgment is permitted about whether to follow a legal duty.",
        de: "Artikel 20 und 21 NIS2 begründen gesetzliche Pflichten. Die Legalitätspflicht bedeutet, dass kein Ermessensspielraum besteht, ob eine gesetzliche Pflicht befolgt wird.",
        nl: "NIS2 artikelen 20 en 21 scheppen wettelijke verplichtingen. De legaliteitsplicht betekent dat er geen beoordelingsruimte bestaat over de vraag of een wettelijke verplichting moet worden nageleefd.",
      },
    },
    {
      id: "1.8.2",
      question: {
        en: "What does the Business Judgment Rule protect, according to the lesson?",
        de: "Was schützt die Business Judgment Rule laut dieser Lektion?",
        nl: "Wat beschermt de business judgment rule volgens de les?",
      },
      options: [
        { en: "Decisions about whether to comply with NIS2", de: "Entscheidungen darüber, ob NIS2 eingehalten wird", nl: "Beslissingen over de vraag of NIS2 moet worden nageleefd" },
        { en: "Decisions about how to implement - which vendor, standard, or budget split", de: "Entscheidungen über das Wie der Umsetzung -- welcher Anbieter, welcher Standard, welche Budgetaufteilung", nl: "Beslissingen over hoe te implementeren — welke leverancier, welke norm of welke budgetverdeling" },
        { en: "All decisions made during board meetings", de: "Alle Entscheidungen, die in Vorstandssitzungen getroffen werden", nl: "Alle beslissingen die tijdens bestuursvergaderingen worden genomen" },
        { en: "Decisions to delay compliance until the next fiscal year", de: "Entscheidungen, die Compliance auf das nächste Geschäftsjahr zu verschieben", nl: "Beslissingen om naleving uit te stellen tot het volgende boekjaar" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The rule may protect your choice of how to implement - which vendor, which standard, which budget split - but it cannot protect a decision on whether to implement.",
        de: "Die Regel kann Ihre Wahl des Wie der Umsetzung schützen -- welcher Anbieter, welcher Standard, welche Budgetaufteilung -- aber sie kann keine Entscheidung über das Ob der Umsetzung schützen.",
        nl: "De regel kan uw keuze over hoe te implementeren beschermen — welke leverancier, welke norm, welke budgetverdeling — maar zij kan een beslissing over de vraag óf te implementeren niet beschermen.",
      },
    },
    {
      id: "1.8.3",
      question: {
        en: "What is the 'duty of legality' described in this lesson?",
        de: "Was ist die in dieser Lektion beschriebene 'Legalitätspflicht'?",
        nl: "Wat is de in deze les beschreven 'legaliteitsplicht'?",
      },
      options: [
        { en: "The duty to consult a lawyer before making any business decision", de: "Die Pflicht, vor jeder geschäftlichen Entscheidung einen Anwalt zu konsultieren", nl: "De plicht om een advocaat te raadplegen voordat een zakelijke beslissing wordt genomen" },
        { en: "The specific duty of a director to comply with applicable law, which sits above the Business Judgment Rule", de: "Die spezifische Pflicht eines Geschäftsleiters, geltendes Recht einzuhalten, die über der Business Judgment Rule steht", nl: "De specifieke plicht van een bestuurder om het toepasselijke recht na te leven, die boven de business judgment rule staat" },
        { en: "The obligation to file annual compliance reports with the regulator", de: "Die Pflicht, jährliche Compliance-Berichte bei der Aufsichtsbehörde einzureichen", nl: "De verplichting om jaarlijkse nalevingsrapporten in te dienen bij de toezichthouder" },
        { en: "The requirement to maintain legal counsel on retainer", de: "Die Anforderung, einen Rechtsberater dauerhaft unter Vertrag zu haben", nl: "De vereiste om een juridisch adviseur op permanente basis beschikbaar te hebben" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The duty of legality is the specific duty of a director to comply with applicable law. No business judgment is permitted about whether to follow a legal duty.",
        de: "Die Legalitätspflicht ist die spezifische Pflicht eines Geschäftsleiters, geltendes Recht einzuhalten. Bei gesetzlichen Pflichten besteht kein unternehmerischer Ermessensspielraum über das Ob der Befolgung.",
        nl: "De legaliteitsplicht is de specifieke plicht van een bestuurder om het toepasselijke recht na te leven. Er bestaat geen bedrijfsmatige beoordelingsruimte over de vraag of een wettelijke verplichting moet worden opgevolgd.",
      },
    },
  ],
});

export default quiz;
