import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.5",
  passingScore: 75,
  questions: [
    {
      id: "4.5.1",
      question: {
        en: "What is the correct order for communicating during a crisis according to the lesson?",
        de: "Welche Reihenfolge der Kommunikation während einer Krise ist laut der Lektion korrekt?",
        nl: "Wat is de juiste volgorde van communicatie tijdens een crisis volgens de les?",
      },
      options: [
        { en: "Public first, then regulator, then customers, then internal", de: "Öffentlichkeit zuerst, dann Aufsichtsbehörde, dann Kunden, dann intern", nl: "Publiek eerst, dan toezichthouder, dan klanten, dan intern" },
        { en: "Internal first, regulator second, customers third, public fourth", de: "Intern zuerst, Aufsichtsbehörde zweitens, Kunden drittens, Öffentlichkeit viertens", nl: "Intern eerst, toezichthouder tweede, klanten derde, publiek vierde" },
        { en: "Regulator first, then public, then internal, then customers", de: "Aufsichtsbehörde zuerst, dann Öffentlichkeit, dann intern, dann Kunden", nl: "Toezichthouder eerst, dan publiek, dan intern, dan klanten" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Internal first, regulator second, customers third, public fourth. Mixing the sequence creates legal exposure and a narrative you do not control.",
        de: "Intern zuerst, Aufsichtsbehörde zweitens, Kunden drittens, Öffentlichkeit viertens. Eine vertauschte Reihenfolge schafft rechtliche Angriffspunkte und ein Narrativ, das Sie nicht kontrollieren.",
        nl: "Intern eerst, toezichthouder tweede, klanten derde, publiek vierde. De volgorde omwisselen creëert juridische blootstelling en een verhaal dat u niet beheerst.",
      },
    },
    {
      id: "4.5.2",
      question: {
        en: "What is the purpose of a holding statement issued within two hours?",
        de: "Was ist der Zweck einer Übergangserklärung, die innerhalb von zwei Stunden veröffentlicht wird?",
        nl: "Wat is het doel van een overbruggingsverklaring die binnen twee uur wordt uitgebracht?",
      },
      options: [
        { en: "To provide a full technical analysis of the incident", de: "Eine vollständige technische Analyse des Vorfalls bereitzustellen", nl: "Een volledige technische analyse van het incident te geven" },
        { en: "To acknowledge disruption without speculating on cause or scope, and commit to a specific update time", de: "Die Störung zu bestätigen, ohne über Ursache oder Umfang zu spekulieren, und einen konkreten Aktualisierungszeitpunkt zuzusagen", nl: "De verstoring te bevestigen zonder te speculeren over oorzaak of omvang, en een specifiek updatemoment toe te zeggen" },
        { en: "To assign blame and identify the attacker", de: "Schuld zuzuweisen und den Angreifer zu identifizieren", nl: "Schuld toe te wijzen en de aanvaller te identificeren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A holding statement acknowledges disruption without speculating on cause or scope, and commits to a specific update time. Silence in the first two hours is when journalists write the story for you.",
        de: "Eine Übergangserklärung bestätigt die Störung, ohne über Ursache oder Umfang zu spekulieren, und sagt einen konkreten Aktualisierungszeitpunkt zu. Schweigen in den ersten zwei Stunden ist der Moment, in dem Journalisten die Geschichte für Sie schreiben.",
        nl: "Een overbruggingsverklaring bevestigt de verstoring zonder te speculeren over oorzaak of omvang, en zegt een specifiek updatemoment toe. Stilte in de eerste twee uur is het moment waarop journalisten het verhaal voor u schrijven.",
      },
    },
    {
      id: "4.5.3",
      question: {
        en: "Within what timeframe must the regulator be notified of a significant incident under the NIS2 Directive?",
        de: "Innerhalb welches Zeitraums muss die Aufsichtsbehörde über einen erheblichen Vorfall gemäß der NIS2-Richtlinie benachrichtigt werden?",
        nl: "Binnen welke termijn moet de toezichthouder worden geïnformeerd over een significant incident op grond van de NIS2-richtlijn?",
      },
      options: [
        { en: "Within forty-eight hours", de: "Innerhalb von achtundvierzig Stunden", nl: "Binnen achtenveertig uur" },
        { en: "Within twenty-four hours", de: "Innerhalb von vierundzwanzig Stunden", nl: "Binnen vierentwintig uur" },
        { en: "Within seventy-two hours", de: "Innerhalb von zweiundsiebzig Stunden", nl: "Binnen tweeënzeventig uur" },
        { en: "Within one week", de: "Innerhalb einer Woche", nl: "Binnen één week" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The regulator must be notified within twenty-four hours. You must then commit to updating within seventy-two hours.",
        de: "Die Aufsichtsbehörde muss innerhalb von vierundzwanzig Stunden benachrichtigt werden. Danach müssen Sie sich verpflichten, innerhalb von zweiundsiebzig Stunden ein Update zu liefern.",
        nl: "De toezichthouder moet binnen vierentwintig uur worden geïnformeerd. U moet vervolgens toezeggen binnen tweeënzeventig uur een update te geven.",
      },
    },
    {
      id: "4.5.4",
      question: {
        en: "What is the CEO's typical role in crisis communication according to the Maersk case study?",
        de: "Welche Rolle hat der CEO laut der Maersk-Fallstudie typischerweise in der Krisenkommunikation?",
        nl: "Wat is de typische rol van de CEO in crisiscommunicatie volgens de casus Maersk?",
      },
      options: [
        { en: "The CEO is always the primary spokesperson on television", de: "Der CEO ist immer der primäre Sprecher im Fernsehen", nl: "De CEO is altijd de primaire woordvoerder op televisie" },
        { en: "The CEO rarely speaks publicly but is always the final approver of every external statement", de: "Der CEO tritt selten öffentlich auf, ist aber immer der endgültige Freigeber jeder externen Stellungnahme", nl: "De CEO treedt zelden publiekelijk op maar is altijd de uiteindelijke goedkeurder van elke externe verklaring" },
        { en: "The CEO delegates all communication to the legal department", de: "Der CEO delegiert die gesamte Kommunikation an die Rechtsabteilung", nl: "De CEO delegeert alle communicatie aan de juridische afdeling" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The CEO is typically not the spokesperson on television but is always the final approver of every external statement. Every statement passes legal review before release.",
        de: "Der CEO ist typischerweise nicht der Sprecher im Fernsehen, ist aber immer der endgültige Freigeber jeder externen Stellungnahme. Jede Stellungnahme durchläuft eine rechtliche Prüfung vor der Veröffentlichung.",
        nl: "De CEO is doorgaans niet de woordvoerder op televisie maar is altijd de uiteindelijke goedkeurder van elke externe verklaring. Elke verklaring doorloopt een juridische beoordeling vóór publicatie.",
      },
    },
  ],
});

export default quiz;
