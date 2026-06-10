import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.1",
  passingScore: 75,
  questions: [
    {
      id: "1.1.1",
      question: {
        en: "When does the Article 23 reporting clock start?",
        de: "Wann startet die Meldekette nach Artikel 23?",
      },
      options: [
        { en: "When the SIEM raises an alert", de: "Wenn das SIEM einen Alarm auslöst" },
        { en: "When a responsible person becomes aware enough to assess the incident as significant", de: "Wenn eine verantwortliche Person Kenntnis erlangt und den Vorfall als erheblich einstufen kann" },
        { en: "When the IT manager begins forensic triage", de: "Wenn die IT-Verantwortliche die forensische Erstanalyse beginnt" },
        { en: "When the CSIRT acknowledges the early warning", de: "Wenn das CSIRT die Frühwarnung bestätigt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(4)(a) NIS 2 uses 'becoming aware,' not detection. Awareness is the moment a responsible person knows enough to assess significance.",
        de: "Artikel 23(4)(a) NIS 2 spricht von Kenntniserlangung, nicht von Detektion. Kenntniserlangung ist der Moment, in dem eine verantwortliche Person genug weiß, um die Erheblichkeit zu beurteilen.",
      },
    },
    {
      id: "1.1.2",
      question: {
        en: "Within how many hours of becoming aware must the early warning reach the CSIRT?",
        de: "Innerhalb welcher Frist nach Kenntniserlangung muss die Frühwarnung beim CSIRT eingehen?",
      },
      options: [
        { en: "6 hours", de: "6 Stunden" },
        { en: "12 hours", de: "12 Stunden" },
        { en: "24 hours", de: "24 Stunden" },
        { en: "72 hours", de: "72 Stunden" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 23(4)(a) NIS 2 requires the early warning within 24 hours of becoming aware.",
        de: "Artikel 23(4)(a) NIS 2 verlangt die Frühwarnung innerhalb von 24 Stunden nach Kenntniserlangung.",
      },
    },
    {
      id: "1.1.3",
      question: {
        en: "What is the deadline for the formal incident notification under Article 23(4)(b)?",
        de: "Wie lautet die Frist für die formelle Vorfallsmeldung nach Artikel 23(4)(b)?",
      },
      options: [
        { en: "24 hours", de: "24 Stunden" },
        { en: "72 hours", de: "72 Stunden" },
        { en: "One week", de: "Eine Woche" },
        { en: "One month", de: "Ein Monat" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(4)(b) NIS 2 sets the incident notification deadline at 72 hours of becoming aware.",
        de: "Artikel 23(4)(b) NIS 2 legt die Frist für die Vorfallsmeldung auf 72 Stunden ab Kenntniserlangung fest.",
      },
    },
    {
      id: "1.1.4",
      question: {
        en: "By when is the final report due?",
        de: "Bis wann ist der Abschlussbericht fällig?",
      },
      options: [
        { en: "72 hours after the early warning", de: "72 Stunden nach der Frühwarnung" },
        { en: "One week after the incident notification", de: "Eine Woche nach der Vorfallsmeldung" },
        { en: "One month after the incident notification", de: "Ein Monat nach der Vorfallsmeldung" },
        { en: "Three months after the incident notification", de: "Drei Monate nach der Vorfallsmeldung" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 23(4)(d) NIS 2 requires the final report within one month of the incident notification.",
        de: "Artikel 23(4)(d) NIS 2 verlangt den Abschlussbericht innerhalb eines Monats nach der Vorfallsmeldung.",
      },
    },
    {
      id: "1.1.5",
      question: {
        en: "How does the customer notification duty under Article 23(2) relate to the CSIRT cascade?",
        de: "In welchem Verhältnis steht die Kundenbenachrichtigungs-Pflicht nach Artikel 23(2) zur Meldekette ans CSIRT?",
      },
      options: [
        { en: "It is part of the same cascade and runs on the same clock", de: "Sie ist Teil derselben Meldekette und folgt derselben Uhr" },
        { en: "It is a separate, parallel duty with its own clock and recipients", de: "Sie ist eine eigenständige, parallele Pflicht mit eigener Uhr und eigenem Empfängerkreis" },
        { en: "It is only triggered after the one-month final report", de: "Sie wird erst nach dem Abschlussbericht nach einem Monat ausgelöst" },
        { en: "It only applies when personal data is involved", de: "Sie greift nur, wenn personenbezogene Daten betroffen sind" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(2) NIS 2 is a separate, parallel duty. It runs on its own clock and has its own recipients: the users of the entity's services.",
        de: "Artikel 23(2) NIS 2 ist eine eigenständige, parallele Pflicht. Sie folgt einer eigenen Uhr und hat einen eigenen Empfängerkreis: die Nutzer der Dienste der Einrichtung.",
      },
    },
  ],
});

export default quiz;
