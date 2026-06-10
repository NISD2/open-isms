import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.7",
  passingScore: 75,
  questions: [
    {
      id: "2.7.1",
      question: {
        en: "What are the five parts of an incident response plan?",
        de: "Was sind die fünf Bestandteile eines Incident-Response-Plans?",
        nl: "Wat zijn de vijf onderdelen van een incidentresponsplan?",
      },
      options: [
        { en: "Plan, execute, review, report, archive", de: "Planen, ausführen, überprüfen, melden, archivieren", nl: "Plannen, uitvoeren, beoordelen, rapporteren, archiveren" },
        { en: "Detection, classification, response, recovery, lessons learned", de: "Erkennung, Klassifizierung, Reaktion, Wiederherstellung, Lessons Learned", nl: "Detectie, classificatie, respons, herstel, geleerde lessen" },
        { en: "Alert, escalate, contain, notify, close", de: "Alarmieren, eskalieren, eindämmen, benachrichtigen, abschließen", nl: "Alarmeren, escaleren, indammen, melden, afsluiten" },
        { en: "Identify, protect, detect, respond, recover", de: "Identifizieren, schützen, erkennen, reagieren, wiederherstellen", nl: "Identificeren, beschermen, detecteren, reageren, herstellen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The five parts are detection, classification, response, recovery, and lessons learned - the auditor checks whether all five exist and have been tested.",
        de: "Die fünf Bestandteile sind Erkennung, Klassifizierung, Reaktion, Wiederherstellung und Lessons Learned - der Auditor prüft, ob alle fünf vorhanden sind und getestet wurden.",
        nl: "De vijf onderdelen zijn detectie, classificatie, respons, herstel en geleerde lessen - de auditor controleert of alle vijf aanwezig zijn en getest.",
      },
    },
    {
      id: "2.7.2",
      question: {
        en: "Which CEO decisions must be pre-assigned by name in the incident response plan?",
        de: "Welche CEO-Entscheidungen müssen im Incident-Response-Plan namentlich vorab zugewiesen werden?",
        nl: "Welke CEO-beslissingen moeten op naam zijn vooraf toegewezen in het incidentresponsplan?",
      },
      options: [
        { en: "Choosing the antivirus software and approving IT hires", de: "Auswahl der Antivirensoftware und Genehmigung von IT-Einstellungen", nl: "De antivirussoftware kiezen en IT-aanwervingen goedkeuren" },
        { en: "Declaring a crisis, authorising spending, approving communications, and the ransom decision", de: "Krisenausrufung, Ausgabenfreigabe, Freigabe der Kommunikation und die Lösegeldfrage", nl: "Een crisis declareren, uitgaven autoriseren, communicatie goedkeuren en de losgeldkeuze" },
        { en: "Setting the IT budget and selecting cloud providers", de: "Festlegung des IT-Budgets und Auswahl von Cloud-Anbietern", nl: "Het IT-budget vaststellen en cloudproviders selecteren" },
        { en: "Reviewing the annual security report and approving leave", de: "Überprüfung des jährlichen Sicherheitsberichts und Urlaubsgenehmigung", nl: "Het jaarlijkse beveiligingsrapport beoordelen en verlof goedkeuren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The CEO's crisis declaration, emergency spending authority, external communication approval, and ransom decision must all be pre-assigned by name.",
        de: "Die Krisenausrufung, die Notfall-Ausgabenbefugnis, die Freigabe externer Kommunikation und die Lösegeldfrage müssen alle namentlich vorab zugewiesen werden.",
        nl: "De crisisdeclaratie van de CEO, de bevoegdheid voor nooduitgaven, de goedkeuring van externe communicatie en de losgeldkeuze moeten allemaal op naam zijn vooraf toegewezen.",
      },
    },
    {
      id: "2.7.3",
      question: {
        en: "What is a tabletop exercise?",
        de: "Was ist eine Tabletop-Übung?",
        nl: "Wat is een tabletop-oefening?",
      },
      options: [
        { en: "A technical penetration test of the company's network", de: "Ein technischer Penetrationstest des Unternehmensnetzwerks", nl: "Een technische penetratietest van het bedrijfsnetwerk" },
        { en: "A paper rehearsal of the incident response plan against a scenario", de: "Eine Planübung des Incident-Response-Plans anhand eines Szenarios", nl: "Een papieren doorloop van het incidentresponsplan aan de hand van een scenario" },
        { en: "A training course for new IT employees", de: "Ein Schulungskurs für neue IT-Mitarbeitende", nl: "Een trainingscursus voor nieuwe IT-medewerkers" },
        { en: "A physical security inspection of the server room", de: "Eine physische Sicherheitsinspektion des Serverraums", nl: "Een fysieke beveiligingsinspectie van de serverruimte" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A tabletop exercise is a paper rehearsal against a scenario, used to find gaps before a real incident does.",
        de: "Eine Tabletop-Übung ist eine Planübung anhand eines Szenarios, die dazu dient, Lücken zu finden, bevor ein echter Vorfall dies tut.",
        nl: "Een tabletop-oefening is een papieren doorloop aan de hand van een scenario, gebruikt om lacunes te vinden voordat een echt incident dat doet.",
      },
    },
    {
      id: "2.7.4",
      question: {
        en: "What does BSI IT-Grundschutz DER.2.1.A17 require?",
        de: "Was verlangt BSI IT-Grundschutz DER.2.1.A17?",
        nl: "Wat vereist BSI IT-Grundschutz DER.2.1.A17?",
      },
      options: [
        { en: "Monthly vulnerability scans on all systems", de: "Monatliche Schwachstellenscans aller Systeme", nl: "Maandelijkse kwetsbaarheidsscans op alle systemen" },
        { en: "An annual lessons-learned report from incidents to management", de: "Einen jährlichen Lessons-Learned-Bericht aus Vorfällen an die Geschäftsleitung", nl: "Een jaarlijks rapport met geleerde lessen van incidenten aan de directie" },
        { en: "Quarterly tabletop exercises for the full company", de: "Vierteljährliche Tabletop-Übungen für das gesamte Unternehmen", nl: "Kwartaallijkse tabletop-oefeningen voor het gehele bedrijf" },
        { en: "Daily incident classification reviews", de: "Tägliche Überprüfungen der Vorfallklassifizierung", nl: "Dagelijkse beoordelingen van incidentclassificatie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "DER.2.1.A17 requires lessons learned from incidents to be reported to management annually - if that report does not exist, the auditor notes it.",
        de: "DER.2.1.A17 verlangt, dass Lessons Learned aus Vorfällen jährlich an die Geschäftsleitung berichtet werden - existiert dieser Bericht nicht, vermerkt der Auditor dies als Feststellung.",
        nl: "DER.2.1.A17 vereist dat geleerde lessen van incidenten jaarlijks aan de directie worden gerapporteerd - als dat rapport niet bestaat, noteert de auditor dat.",
      },
    },
  ],
});

export default quiz;
