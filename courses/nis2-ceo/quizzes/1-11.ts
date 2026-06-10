import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.11",
  passingScore: 75,
  questions: [
    {
      id: "1.11.1",
      question: {
        en: "What is the financial threshold for a significant incident under CIR 2024/2690?",
        de: "Was ist die finanzielle Schwelle für einen erheblichen Sicherheitsvorfall gemäß CIR 2024/2690?",
        nl: "Wat is de financiële drempel voor een significant incident onder CIR 2024/2690?",
      },
      options: [
        { en: "One million euros or 10% of turnover, whichever is higher", de: "Eine Million Euro oder 10 % des Umsatzes, je nachdem welcher Betrag höher ist", nl: "Één miljoen euro of 10% van de omzet, afhankelijk van welk bedrag hoger is" },
        { en: "Five hundred thousand euros or 5% of turnover, whichever is lower", de: "Fünfhunderttausend Euro oder 5 % des Umsatzes, je nachdem welcher Betrag niedriger ist", nl: "Vijfhonderdduizend euro of 5% van de omzet, afhankelijk van welk bedrag lager is" },
        { en: "One hundred thousand euros flat", de: "Pauschal einhunderttausend Euro", nl: "Honderdduizend euro vlak" },
        { en: "Ten million euros or 2% of turnover", de: "Zehn Millionen Euro oder 2 % des Umsatzes", nl: "Tien miljoen euro of 2% van de omzet" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Direct financial loss exceeds five hundred thousand euros or five percent of total annual turnover, whichever is lower.",
        de: "Der direkte finanzielle Schaden übersteigt fünfhunderttausend Euro oder fünf Prozent des gesamten Jahresumsatzes, je nachdem welcher Betrag niedriger ist.",
        nl: "Het directe financiële verlies overschrijdt vijfhonderdduizend euro of vijf procent van de totale jaaromzet, afhankelijk van welk bedrag lager is.",
      },
    },
    {
      id: "1.11.2",
      question: {
        en: "What are the three stages of the reporting cascade and their deadlines?",
        de: "Was sind die drei Stufen der Meldekaskade und ihre Fristen?",
        nl: "Wat zijn de drie stadia van de meldingscascade en hun deadlines?",
      },
      options: [
        { en: "Initial report (48h), detailed report (1 week), final report (3 months)", de: "Erstmeldung (48 Std.), detaillierter Bericht (1 Woche), Abschlussbericht (3 Monate)", nl: "Eerste melding (48u), gedetailleerd rapport (1 week), eindrapport (3 maanden)" },
        { en: "Early warning (24h), incident notification (72h), final report (1 month)", de: "Frühwarnung (24 Std.), Vorfallsmeldung (72 Std.), Abschlussbericht (1 Monat)", nl: "Vroegtijdige waarschuwing (24u), incidentmelding (72u), eindrapport (1 maand)" },
        { en: "Alert (12h), notification (48h), closure report (2 weeks)", de: "Alarm (12 Std.), Benachrichtigung (48 Std.), Abschlussbericht (2 Wochen)", nl: "Alarm (12u), kennisgeving (48u), afsluitingsrapport (2 weken)" },
        { en: "Detection (24h), assessment (1 week), resolution (1 month)", de: "Erkennung (24 Std.), Bewertung (1 Woche), Behebung (1 Monat)", nl: "Detectie (24u), beoordeling (1 week), afhandeling (1 maand)" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The cascade is: early warning within 24 hours, incident notification within 72 hours, and final report within one month.",
        de: "Die Kaskade lautet: Frühwarnung innerhalb von 24 Stunden, Vorfallsmeldung innerhalb von 72 Stunden und Abschlussbericht innerhalb eines Monats.",
        nl: "De cascade luidt: vroegtijdige waarschuwing binnen 24 uur, incidentmelding binnen 72 uur en eindrapport binnen één maand.",
      },
    },
    {
      id: "1.11.3",
      question: {
        en: "What does Article 4 of the implementing regulation say about recurring incidents?",
        de: "Was sagt Artikel 4 der Durchführungsverordnung über wiederkehrende Vorfälle?",
        nl: "Wat zegt artikel 4 van de uitvoeringsverordening over terugkerende incidenten?",
      },
      options: [
        { en: "Recurring incidents are exempt from reporting", de: "Wiederkehrende Vorfälle sind von der Meldepflicht befreit", nl: "Terugkerende incidenten zijn vrijgesteld van meldingsplicht" },
        { en: "Each recurring incident must be reported separately", de: "Jeder wiederkehrende Vorfall muss einzeln gemeldet werden", nl: "Elk terugkerend incident moet afzonderlijk worden gemeld" },
        { en: "Two or more incidents with the same root cause within six months that together cross the threshold count as one significant incident", de: "Zwei oder mehr Vorfälle mit derselben Ursache innerhalb von sechs Monaten, die zusammen die Schwelle überschreiten, gelten als ein erheblicher Sicherheitsvorfall", nl: "Twee of meer incidenten met dezelfde grondoorzaak binnen zes maanden die samen de drempel overschrijden, tellen als één significant incident" },
        { en: "Only the third recurring incident triggers a report", de: "Erst der dritte wiederkehrende Vorfall löst eine Meldung aus", nl: "Alleen het derde terugkerende incident leidt tot een melding" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Two or more incidents with the same apparent root cause, occurring within six months, that together cross the financial threshold are treated as one significant incident.",
        de: "Zwei oder mehr Vorfälle mit derselben offensichtlichen Ursache, die innerhalb von sechs Monaten auftreten und zusammen die finanzielle Schwelle überschreiten, werden als ein erheblicher Sicherheitsvorfall behandelt.",
        nl: "Twee of meer incidenten met dezelfde vermoedelijke grondoorzaak, die binnen zes maanden plaatsvinden en samen de financiële drempel overschrijden, worden behandeld als één significant incident.",
      },
    },
    {
      id: "1.11.4",
      question: {
        en: "Is late reporting a separate violation?",
        de: "Ist eine verspätete Meldung ein eigenständiger Verstoß?",
        nl: "Is te late melding een afzonderlijke overtreding?",
      },
      options: [
        { en: "No, it is only considered as part of the incident assessment", de: "Nein, sie wird nur im Rahmen der Vorfallsbewertung berücksichtigt", nl: "Nee, het wordt alleen meegewogen als onderdeel van de incidentbeoordeling" },
        { en: "Only if the delay exceeds one week", de: "Nur wenn die Verzögerung eine Woche überschreitet", nl: "Alleen als de vertraging meer dan één week bedraagt" },
        { en: "Yes, late reporting is a separate sanctionable violation", de: "Ja, eine verspätete Meldung ist ein eigenständiger, sanktionsfähiger Verstoß", nl: "Ja, te late melding is een afzonderlijke, sanctioneerbare overtreding" },
        { en: "Only for Essential entities", de: "Nur für wesentliche Einrichtungen", nl: "Alleen voor essentiële entiteiten" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Late reporting is a separate sanctionable violation. Skipping the early warning because the situation is unclear means two violations: the incident itself and the reporting failure.",
        de: "Verspätete Meldung ist ein eigenständiger, sanktionsfähiger Verstoß. Die Frühwarnung auszulassen, weil die Situation unklar ist, bedeutet zwei Verstöße: den Vorfall selbst und das Meldeversäumnis.",
        nl: "Te late melding is een afzonderlijke, sanctioneerbare overtreding. De vroegtijdige waarschuwing overslaan omdat de situatie onduidelijk is, betekent twee overtredingen: het incident zelf en het meldingsverzuim.",
      },
    },
  ],
});

export default quiz;
