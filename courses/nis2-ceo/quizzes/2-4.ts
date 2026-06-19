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
        fr: "Quelle est la fréquence minimale obligatoire de réexamen du programme de gestion des risques au titre du BSI Standard 200-1 ?",
        it: "Qual è la frequenza minima obbligatoria di riesame del programma di gestione dei rischi ai sensi del BSI Standard 200-1?",
        es: "¿Cuál es la frecuencia mínima obligatoria de revisión del programa de gestión de riesgos en virtud del BSI Standard 200-1?",
        pl: "Jaka jest minimalna obowiązkowa częstotliwość przeglądu programu zarządzania ryzykiem zgodnie z BSI Standard 200-1?",
      },
      options: [
        { en: "Quarterly", de: "Vierteljährlich", nl: "Elk kwartaal", fr: "Trimestrielle", it: "Trimestrale", es: "Trimestral", pl: "Kwartalna" },
        { en: "Every six months", de: "Alle sechs Monate", nl: "Elke zes maanden", fr: "Tous les six mois", it: "Ogni sei mesi", es: "Cada seis meses", pl: "Co sześć miesięcy" },
        { en: "Annual", de: "Jährlich", nl: "Jaarlijks", fr: "Annuelle", it: "Annuale", es: "Anual", pl: "Roczna" },
        { en: "Every two years", de: "Alle zwei Jahre", nl: "Elke twee jaar", fr: "Tous les deux ans", it: "Ogni due anni", es: "Cada dos años", pl: "Co dwa lata" },
      ],
      correctIndex: 2,
      explanation: {
        en: "BSI Standard 200-1, Section 7.4 hardcodes an annual management review as the only mandatory annual frequency in the framework.",
        de: "BSI-Standard 200-1, Abschnitt 7.4 schreibt eine jährliche Managementbewertung als einzige verpflichtende Jahresfrequenz im Rahmenwerk vor.",
        nl: "BSI Standaard 200-1, Sectie 7.4 schrijft een jaarlijkse managementbeoordeling voor als de enige verplichte jaarlijkse frequentie in het kader.",
        fr: "Le BSI Standard 200-1, section 7.4 impose un réexamen annuel par la direction comme seule fréquence annuelle obligatoire du référentiel.",
        it: "Il BSI Standard 200-1, sezione 7.4 impone un riesame annuale da parte della direzione come unica frequenza annuale obbligatoria del quadro di riferimento.",
        es: "El BSI Standard 200-1, sección 7.4 establece una revisión anual por parte de la dirección como única frecuencia anual obligatoria del marco.",
        pl: "BSI Standard 200-1, sekcja 7.4 nakłada coroczny przegląd zarządczy jako jedyną obowiązkową roczną częstotliwość w ramach metodyki.",
      },
    },
    {
      id: "2.4.2",
      question: {
        en: "Which of the following is NOT listed as a trigger event that forces a re-score of the risk register outside the annual review?",
        de: "Welches der folgenden Ereignisse wird NICHT als Auslöser genannt, der eine Neubewertung des Risikoregisters außerhalb der jährlichen Überprüfung erzwingt?",
        nl: "Welk van de volgende gebeurtenissen wordt NIET vermeld als een triggergebeurtenis die een herbeoordeling van het risicoregister buiten de jaarlijkse evaluatie dwingt?",
        fr: "Lequel des événements suivants n'est PAS répertorié comme un événement déclencheur imposant une réévaluation du registre des risques en dehors du réexamen annuel ?",
        it: "Quale dei seguenti NON è elencato come evento scatenante che impone una rivalutazione del registro dei rischi al di fuori del riesame annuale?",
        es: "¿Cuál de los siguientes NO figura como un suceso desencadenante que obliga a volver a puntuar el registro de riesgos fuera de la revisión anual?",
        pl: "Które z poniższych zdarzeń NIE jest wymienione jako zdarzenie wyzwalające, które wymusza ponowną ocenę rejestru ryzyka poza przeglądem rocznym?",
      },
      options: [
        { en: "A major incident at a peer company", de: "Ein schwerwiegender Vorfall bei einem vergleichbaren Unternehmen", nl: "Een groot incident bij een vergelijkbaar bedrijf", fr: "Un incident majeur dans une entreprise comparable", it: "Un grave incidente in un'impresa analoga", es: "Un incidente grave en una empresa similar", pl: "Poważny incydent w porównywalnej firmie" },
        { en: "A new vulnerability disclosure affecting your software", de: "Eine neue Schwachstellenmeldung, die Ihre Software betrifft", nl: "Een nieuwe kwetsbaarheidsmelding die uw software treft", fr: "La divulgation d'une nouvelle vulnérabilité affectant votre logiciel", it: "La divulgazione di una nuova vulnerabilità che riguarda il vostro software", es: "La divulgación de una nueva vulnerabilidad que afecta a su software", pl: "Ujawnienie nowej podatności dotyczącej Państwa oprogramowania" },
        { en: "A routine quarterly staff meeting", de: "Ein routinemäßiges vierteljährliches Mitarbeitermeeting", nl: "Een routinematige kwartaalvergadering van medewerkers", fr: "Une réunion trimestrielle de routine du personnel", it: "Una riunione trimestrale di routine del personale", es: "Una reunión trimestral rutinaria del personal", pl: "Rutynowe kwartalne spotkanie pracowników" },
        { en: "A significant business change like an acquisition", de: "Eine wesentliche Geschäftsveränderung wie eine Übernahme", nl: "Een ingrijpende bedrijfsverandering zoals een overname", fr: "Un changement significatif de l'activité tel qu'une acquisition", it: "Un cambiamento significativo dell'attività come un'acquisizione", es: "Un cambio significativo en la actividad, como una adquisición", pl: "Istotna zmiana w działalności, taka jak przejęcie" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Triggers include major incidents, business changes, vulnerability disclosures, regulatory changes, and audit findings - not routine meetings.",
        de: "Auslöser umfassen schwerwiegende Vorfälle, Geschäftsveränderungen, Schwachstellenmeldungen, regulatorische Änderungen und Audit-Feststellungen - nicht Routinemeetings.",
        nl: "Triggers omvatten grote incidenten, bedrijfsveranderingen, kwetsbaarheidsmeldingen, regelgevingswijzigingen en auditbevindingen - geen routinevergaderingen.",
        fr: "Les déclencheurs comprennent les incidents majeurs, les changements d'activité, les divulgations de vulnérabilités, les changements réglementaires et les constatations d'audit, mais pas les réunions de routine.",
        it: "Gli eventi scatenanti comprendono incidenti gravi, cambiamenti dell'attività, divulgazioni di vulnerabilità, modifiche normative e rilievi di audit, non le riunioni di routine.",
        es: "Los desencadenantes incluyen incidentes graves, cambios en la actividad, divulgaciones de vulnerabilidades, cambios normativos y hallazgos de auditoría, no las reuniones rutinarias.",
        pl: "Czynniki wyzwalające obejmują poważne incydenty, zmiany w działalności, ujawnienia podatności, zmiany regulacyjne i ustalenia audytowe, a nie rutynowe spotkania.",
      },
    },
    {
      id: "2.4.3",
      question: {
        en: "How does the auditor detect that a risk register is stale?",
        de: "Wie erkennt der Auditor, dass ein Risikoregister veraltet ist?",
        nl: "Hoe stelt de auditor vast dat een risicoregister verouderd is?",
        fr: "Comment l'auditeur détecte-t-il qu'un registre des risques est obsolète ?",
        it: "Come fa il revisore a individuare che un registro dei rischi è obsoleto?",
        es: "¿Cómo detecta el auditor que un registro de riesgos está desactualizado?",
        pl: "W jaki sposób audytor wykrywa, że rejestr ryzyka jest nieaktualny?",
      },
      options: [
        { en: "By counting the number of risks listed", de: "Durch Zählen der aufgelisteten Risiken", nl: "Door het aantal vermelde risico's te tellen", fr: "En comptant le nombre de risques répertoriés", it: "Contando il numero di rischi elencati", es: "Contando el número de riesgos enumerados", pl: "Licząc liczbę wymienionych ryzyk" },
        { en: "By comparing the 'last reviewed' date against the company's known business changes", de: "Durch Vergleich des Datums 'letzte Überprüfung' mit den bekannten Geschäftsveränderungen des Unternehmens", nl: "Door de datum 'laatst beoordeeld' te vergelijken met de bekende bedrijfsveranderingen van het bedrijf", fr: "En comparant la date de 'dernier réexamen' aux changements d'activité connus de l'entreprise", it: "Confrontando la data di 'ultimo riesame' con i cambiamenti dell'attività noti dell'impresa", es: "Comparando la fecha de 'última revisión' con los cambios conocidos en la actividad de la empresa", pl: "Porównując datę 'ostatniego przeglądu' ze znanymi zmianami w działalności firmy" },
        { en: "By checking whether the CISO has signed the register", de: "Durch Prüfung, ob der CISO das Register unterschrieben hat", nl: "Door te controleren of de CISO het register heeft ondertekend", fr: "En vérifiant si le CISO a signé le registre", it: "Verificando se il CISO ha firmato il registro", es: "Comprobando si el CISO ha firmado el registro", pl: "Sprawdzając, czy CISO podpisał rejestr" },
        { en: "By running a vulnerability scan on the company's systems", de: "Durch einen Schwachstellenscan der Unternehmenssysteme", nl: "Door een kwetsbaarheidsscan uit te voeren op de systemen van het bedrijf", fr: "En effectuant une analyse de vulnérabilité sur les systèmes de l'entreprise", it: "Eseguendo una scansione delle vulnerabilità sui sistemi dell'impresa", es: "Ejecutando un análisis de vulnerabilidades en los sistemas de la empresa", pl: "Przeprowadzając skanowanie podatności w systemach firmy" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The auditor compares the 'last reviewed' date against known business changes - if the date is older than the last change, the register is already a finding.",
        de: "Der Auditor vergleicht das Datum 'letzte Überprüfung' mit bekannten Geschäftsveränderungen - liegt das Datum vor der letzten Änderung, ist das Register bereits eine Feststellung.",
        nl: "De auditor vergelijkt de datum 'laatst beoordeeld' met bekende bedrijfsveranderingen - als de datum ouder is dan de laatste wijziging, is het register al een bevinding.",
        fr: "L'auditeur compare la date de 'dernier réexamen' aux changements d'activité connus : si la date est antérieure au dernier changement, le registre constitue déjà une constatation.",
        it: "Il revisore confronta la data di 'ultimo riesame' con i cambiamenti dell'attività noti: se la data è anteriore all'ultimo cambiamento, il registro costituisce già un rilievo.",
        es: "El auditor compara la fecha de 'última revisión' con los cambios conocidos en la actividad: si la fecha es anterior al último cambio, el registro ya constituye un hallazgo.",
        pl: "Audytor porównuje datę 'ostatniego przeglądu' ze znanymi zmianami w działalności: jeśli data jest wcześniejsza niż ostatnia zmiana, rejestr stanowi już ustalenie.",
      },
    },
  ],
});

export default quiz;
