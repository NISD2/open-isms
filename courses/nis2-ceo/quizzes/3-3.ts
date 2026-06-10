import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.3",
  passingScore: 75,
  questions: [
    {
      id: "3.3.1",
      question: {
        en: "What is the minimum frequency for a formal management review of the security management system?",
        de: "Was ist die Mindesthäufigkeit für eine formelle Management-Bewertung des Sicherheitsmanagementsystems?",
        nl: "Wat is de minimumfrequentie voor een formele managementbeoordeling van het beveiligingsbeheersysteem?",
      },
      options: [
        { en: "Quarterly", de: "Vierteljährlich", nl: "Elk kwartaal" },
        { en: "Annually", de: "Jährlich", nl: "Jaarlijks" },
        { en: "Every two years", de: "Alle zwei Jahre", nl: "Elke twee jaar" },
        { en: "Only after incidents", de: "Nur nach Vorfaellen", nl: "Alleen na incidenten" },
      ],
      correctIndex: 1,
      explanation: {
        en: "BSI-Standard 200-1, section 7.4 requires a formal annual management review. Annual is the floor, not the ceiling.",
        de: "BSI-Standard 200-1, Abschnitt 7.4 verlangt eine formelle jährliche Management-Bewertung. Jährlich ist das Minimum, nicht das Maximum.",
        nl: "BSI-Standard 200-1, sectie 7.4 vereist een formele jaarlijkse managementbeoordeling. Jaarlijks is het minimum, niet het maximum.",
      },
    },
    {
      id: "3.3.2",
      question: {
        en: "How many categories of events require re-sign-off before the annual cycle?",
        de: "Wie viele Kategorien von Ereignissen erfordern eine erneute Freigabe vor dem jährlichen Zyklus?",
        nl: "Hoeveel categorieën gebeurtenissen vereisen een nieuwe goedkeuring vóór de jaarlijkse cyclus?",
      },
      options: [
        { en: "Three", de: "Drei", nl: "Drie" },
        { en: "Four", de: "Vier", nl: "Vier" },
        { en: "Six", de: "Sechs", nl: "Zes" },
        { en: "Eight", de: "Acht", nl: "Acht" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Six categories: change in leadership, significant business change, major incident, regulatory change, audit finding requiring remediation, and material supplier change.",
        de: "Sechs Kategorien: Wechsel in der Fuehrung, wesentliche Geschaeftsveränderung, schwerwiegender Vorfall, regulatorische Änderung, Auditfeststellung mit Abhilfebedarf und wesentliche Lieferantenänderung.",
        nl: "Zes categorieën: wijziging in leiderschap, significante bedrijfswijziging, groot incident, regelgevingswijziging, auditbevinding die herstel vereist, en wezenlijke leverancierswijziging.",
      },
    },
    {
      id: "3.3.3",
      question: {
        en: "What three things must every re-sign-off document?",
        de: "Welche drei Dinge muss jede erneute Freigabe dokumentieren?",
        nl: "Welke drie zaken moet elke nieuwe goedkeuring documenteren?",
      },
      options: [
        { en: "The incident, the response, and the cost", de: "Den Vorfall, die Reaktion und die Kosten", nl: "Het incident, de respons en de kosten" },
        { en: "The trigger event, the changes to the measures, and the new signature", de: "Das ausloesende Ereignis, die Änderungen an den Maßnahmen und die neue Unterschrift", nl: "De aanleiding, de wijzigingen in de maatregelen en de nieuwe handtekening" },
        { en: "The CISO's recommendation, the board vote, and the budget", de: "Die Empfehlung des CISO, die Vorstandsabstimmung und das Budget", nl: "De aanbeveling van de CISO, de bestuursstemming en het budget" },
        { en: "The risk analysis, the supplier list, and the training records", de: "Die Risikoanalyse, die Lieferantenliste und die Schulungsnachweise", nl: "De risicoanalyse, de leverancierslijst en de opleidingsregisters" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Every re-sign-off needs three things documented: the trigger, the changes since last approval, and the new signature.",
        de: "Jede erneute Freigabe erfordert die Dokumentation von drei Dingen: dem Ausloeser, den Änderungen seit der letzten Genehmigung und der neuen Unterschrift.",
        nl: "Elke nieuwe goedkeuring vereist dat drie zaken worden gedocumenteerd: de aanleiding, de wijzigingen sinds de laatste goedkeuring en de nieuwe handtekening.",
      },
    },
    {
      id: "3.3.4",
      question: {
        en: "In the acquisition scenario, why does the sign-off wait if the CISO cannot describe the target's systems?",
        de: "Warum wird die Freigabe im Akquisitionsszenario zurueckgehalten, wenn der CISO die Systeme des Zielunternehmens nicht beschreiben kann?",
        nl: "Waarom wacht de goedkeuring in het overnamesscenario als de CISO de systemen van het doelbedrijf niet kan beschrijven?",
      },
      options: [
        { en: "Because the regulator requires a waiting period after acquisitions", de: "Weil die Aufsichtsbehörde nach Akquisitionen eine Wartefrist vorschreibt", nl: "Omdat de toezichthouder een wachttijd vereist na overnames" },
        { en: "Because the sign-off must be informed - without facts about the target's systems, suppliers, and risk analysis, the approval has nothing to stand on", de: "Weil die Freigabe informiert erfolgen muss - ohne Fakten ueber die Systeme, Lieferanten und Risikoanalyse des Zielunternehmens hat die Genehmigung keine Grundlage", nl: "Omdat de goedkeuring geïnformeerd moet zijn - zonder feiten over de systemen, leveranciers en risicoanalyse van het doelbedrijf heeft de goedkeuring geen basis" },
        { en: "Because the previous CEO's sign-off transfers automatically during an acquisition", de: "Weil die Freigabe des vorherigen CEO bei einer Akquisition automatisch uebertragen wird", nl: "Omdat de goedkeuring van de vorige CEO automatisch wordt overgedragen bij een overname" },
        { en: "Because the budget for integration has not been approved yet", de: "Weil das Budget für die Integration noch nicht genehmigt wurde", nl: "Omdat het budget voor integratie nog niet is goedgekeurd" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The sign-off waits until the answer exists because an uninformed approval is meaningless - you need to know what systems, suppliers, and risk state the target brings.",
        de: "Die Freigabe wartet, bis die Antwort vorliegt, denn eine uninformierte Genehmigung ist bedeutungslos - Sie müssen wissen, welche Systeme, Lieferanten und welchen Risikostatus das Zielunternehmen mitbringt.",
        nl: "De goedkeuring wacht tot het antwoord er is, want een ondoordachte goedkeuring is zinloos - u moet weten welke systemen, leveranciers en risicostand het doelbedrijf meebrengt.",
      },
    },
  ],
});

export default quiz;
