import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.4",
  passingScore: 75,
  questions: [
    {
      id: "2.4.1",
      question: {
        en: "What is the minimum mandatory review cadence for the risk management programme under BSI Standard 200-1?",
        de: "Wie oft muss das Risikomanagementprogramm gemäß BSI-Standard 200-1 mindestens überprüft werden?",
        nl: "Wat is de minimale verplichte herzieningsfrequentie voor het risicobeheer-programma onder BSI Standaard 200-1?",
      },
      options: [
        { en: "Quarterly", de: "Vierteljährlich", nl: "Elk kwartaal" },
        { en: "Every six months", de: "Alle sechs Monate", nl: "Elke zes maanden" },
        { en: "Annual", de: "Jährlich", nl: "Jaarlijks" },
        { en: "Every two years", de: "Alle zwei Jahre", nl: "Elke twee jaar" },
      ],
      correctIndex: 2,
      explanation: {
        en: "BSI Standard 200-1, Section 7.4 hardcodes an annual management review as the only mandatory annual frequency in the framework.",
        de: "BSI-Standard 200-1, Abschnitt 7.4 schreibt eine jährliche Managementbewertung als einzige verpflichtende Jahresfrequenz im Rahmenwerk vor.",
        nl: "BSI Standaard 200-1, Sectie 7.4 schrijft een jaarlijkse managementbeoordeling voor als de enige verplichte jaarlijkse frequentie in het kader.",
      },
    },
    {
      id: "2.4.2",
      question: {
        en: "Which of the following is NOT listed as a trigger event that forces a re-score of the risk register outside the annual review?",
        de: "Welches der folgenden Ereignisse wird NICHT als Auslöser genannt, der eine Neubewertung des Risikoregisters außerhalb der jährlichen Überprüfung erzwingt?",
        nl: "Welk van de volgende gebeurtenissen wordt NIET vermeld als een triggergebeurtenis die een herbeoordeling van het risicoregister buiten de jaarlijkse evaluatie dwingt?",
      },
      options: [
        { en: "A major incident at a peer company", de: "Ein schwerwiegender Vorfall bei einem vergleichbaren Unternehmen", nl: "Een groot incident bij een vergelijkbaar bedrijf" },
        { en: "A new vulnerability disclosure affecting your software", de: "Eine neue Schwachstellenmeldung, die Ihre Software betrifft", nl: "Een nieuwe kwetsbaarheidsmelding die uw software treft" },
        { en: "A routine quarterly staff meeting", de: "Ein routinemäßiges vierteljährliches Mitarbeitermeeting", nl: "Een routinematige kwartaalvergadering van medewerkers" },
        { en: "A significant business change like an acquisition", de: "Eine wesentliche Geschäftsveränderung wie eine Übernahme", nl: "Een ingrijpende bedrijfsverandering zoals een overname" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Triggers include major incidents, business changes, vulnerability disclosures, regulatory changes, and audit findings - not routine meetings.",
        de: "Auslöser umfassen schwerwiegende Vorfälle, Geschäftsveränderungen, Schwachstellenmeldungen, regulatorische Änderungen und Audit-Feststellungen - nicht Routinemeetings.",
        nl: "Triggers omvatten grote incidenten, bedrijfsveranderingen, kwetsbaarheidsmeldingen, regelgevingswijzigingen en auditbevindingen - geen routinevergaderingen.",
      },
    },
    {
      id: "2.4.3",
      question: {
        en: "How does the auditor detect that a risk register is stale?",
        de: "Wie erkennt der Auditor, dass ein Risikoregister veraltet ist?",
        nl: "Hoe stelt de auditor vast dat een risicoregister verouderd is?",
      },
      options: [
        { en: "By counting the number of risks listed", de: "Durch Zählen der aufgelisteten Risiken", nl: "Door het aantal vermelde risico's te tellen" },
        { en: "By comparing the 'last reviewed' date against the company's known business changes", de: "Durch Vergleich des Datums 'letzte Überprüfung' mit den bekannten Geschäftsveränderungen des Unternehmens", nl: "Door de datum 'laatst beoordeeld' te vergelijken met de bekende bedrijfsveranderingen van het bedrijf" },
        { en: "By checking whether the CISO has signed the register", de: "Durch Prüfung, ob der CISO das Register unterschrieben hat", nl: "Door te controleren of de CISO het register heeft ondertekend" },
        { en: "By running a vulnerability scan on the company's systems", de: "Durch einen Schwachstellenscan der Unternehmenssysteme", nl: "Door een kwetsbaarheidsscan uit te voeren op de systemen van het bedrijf" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The auditor compares the 'last reviewed' date against known business changes - if the date is older than the last change, the register is already a finding.",
        de: "Der Auditor vergleicht das Datum 'letzte Überprüfung' mit bekannten Geschäftsveränderungen - liegt das Datum vor der letzten Änderung, ist das Register bereits eine Feststellung.",
        nl: "De auditor vergelijkt de datum 'laatst beoordeeld' met bekende bedrijfsveranderingen - als de datum ouder is dan de laatste wijziging, is het register al een bevinding.",
      },
    },
  ],
});

export default quiz;
