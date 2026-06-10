import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.6",
  passingScore: 75,
  questions: [
    {
      id: "3.6.1",
      question: {
        en: "What does CIR 2024/2690, Annex point 1.2.3 require regarding cybersecurity reporting?",
        de: "Was verlangt CIR 2024/2690, Anhang Punkt 1.2.3 in Bezug auf Cybersicherheitsberichterstattung?",
        nl: "Wat vereist CIR 2024/2690, Bijlage punt 1.2.3 met betrekking tot cyberbeveiligingsrapportage?",
      },
      options: [
        { en: "The CISO must report to the IT director quarterly", de: "Der CISO muss vierteljährlich an den IT-Leiter berichten", nl: "De CISO moet elk kwartaal rapporteren aan de IT-directeur" },
        { en: "At least one person must report directly to the management body on cybersecurity matters", de: "Mindestens eine Person muss dem Leitungsorgan direkt ueber Cybersicherheitsbelange berichten", nl: "Ten minste één persoon moet rechtstreeks aan het leidinggevend orgaan rapporteren over cyberbeveiligingszaken" },
        { en: "The company must publish an annual cybersecurity report", de: "Das Unternehmen muss einen jährlichen Cybersicherheitsbericht veroeffentlichen", nl: "Het bedrijf moet een jaarlijks cyberbeveiligingsrapport publiceren" },
        { en: "The supervisory board must appoint a dedicated cybersecurity committee", de: "Der Aufsichtsrat muss einen dedizierten Cybersicherheitsausschuss einrichten", nl: "De raad van commissarissen moet een toegewijd cyberbeveiligingscomité instellen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The regulation requires at least one person to report directly to the management bodies on matters of network and information system security - no layers in between.",
        de: "Die Verordnung verlangt, dass mindestens eine Person dem Leitungsorgan direkt ueber Angelegenheiten der Netz- und Informationssystemsicherheit berichtet - ohne Zwischenebenen.",
        nl: "De verordening vereist dat ten minste één persoon rechtstreeks aan het leidinggevend orgaan rapporteert over netwerk- en informatiesysteembeveiliging - zonder tussenlagen.",
      },
    },
    {
      id: "3.6.2",
      question: {
        en: "Why does a CISO reporting through IT lack the authority to enforce security across the company?",
        de: "Warum fehlt einem CISO, der ueber die IT berichtet, die Befugnis, Sicherheit im gesamten Unternehmen durchzusetzen?",
        nl: "Waarom heeft een CISO die via IT rapporteert niet de autoriteit om beveiliging door het hele bedrijf af te dwingen?",
      },
      options: [
        { en: "Because IT departments do not understand business risks", de: "Weil IT-Abteilungen Geschaeftsrisiken nicht verstehen", nl: "Omdat IT-afdelingen bedrijfsrisico's niet begrijpen" },
        { en: "A CISO under IT has no authority over HR, finance, sales, and operations - their instructions are suggestions from a middle manager", de: "Ein CISO unter der IT hat keine Weisungsbefugnis gegenüber HR, Finanzen, Vertrieb und Betrieb - seine Anweisungen sind Vorschlaege eines mittleren Managers", nl: "Een CISO onder IT heeft geen gezag over HR, financiën, verkoop en operaties - zijn instructies zijn suggesties van een middenkaderlid" },
        { en: "Because IT directors always overrule security recommendations", de: "Weil IT-Leiter Sicherheitsempfehlungen immer überstimmen", nl: "Omdat IT-directeuren altijd beveiligingsaanbevelingen overrulen" },
        { en: "Because the law explicitly prohibits CISOs from sitting in IT departments", de: "Weil das Gesetz ausdruecklich verbietet, dass CISOs in IT-Abteilungen angesiedelt sind", nl: "Omdat de wet expliciet verbiedt dat CISO's in IT-afdelingen zijn ondergebracht" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A CISO reporting to IT has no authority over the rest of the company. A CISO reporting directly to the CEO inherits the management body's authority, making security decisions executable across departments.",
        de: "Ein CISO, der an die IT berichtet, hat keine Weisungsbefugnis ueber den Rest des Unternehmens. Ein CISO, der direkt an den CEO berichtet, erbt die Autoritaet des Leitungsorgans und kann Sicherheitsentscheidungen abteilungsuebergreifend durchsetzen.",
        nl: "Een CISO die aan IT rapporteert heeft geen gezag over de rest van het bedrijf. Een CISO die rechtstreeks aan de CEO rapporteert erft de autoriteit van het leidinggevend orgaan, waardoor beveiligingsbeslissingen afdelingsoverschrijdend uitvoerbaar worden.",
      },
    },
    {
      id: "3.6.3",
      question: {
        en: "If the CISO reports through IT or finance, what does the auditor conclude?",
        de: "Was stellt der Auditor fest, wenn der CISO ueber die IT oder Finanzabteilung berichtet?",
        nl: "Als de CISO via IT of financiën rapporteert, wat concludeert de auditor dan?",
      },
      options: [
        { en: "The requirement is met if the CISO informally briefs the CEO regularly", de: "Die Anforderung ist erfuellt, wenn der CISO den CEO regelmaessig informell informiert", nl: "De vereiste is vervuld als de CISO de CEO regelmatig informeel brieft" },
        { en: "The requirement is not met - regardless of the CISO's competence or how often they brief the CEO", de: "Die Anforderung ist nicht erfuellt - unabhaengig von der Kompetenz des CISO oder wie oft er den CEO informiert", nl: "De vereiste is niet vervuld - ongeacht de competentie van de CISO of hoe vaak hij de CEO brieft" },
        { en: "The requirement is partially met and needs an observation note", de: "Die Anforderung ist teilweise erfuellt und erfordert eine Beobachtungsnotiz", nl: "De vereiste is gedeeltelijk vervuld en vereist een observatieopmerking" },
        { en: "The requirement is waived for companies under 250 employees", de: "Die Anforderung entfällt für Unternehmen unter 250 Mitarbeitern", nl: "De vereiste vervalt voor bedrijven met minder dan 250 werknemers" },
      ],
      correctIndex: 1,
      explanation: {
        en: "If the CISO reports through IT or finance, the requirement is not met - regardless of how competent the CISO is or how often they informally brief you.",
        de: "Wenn der CISO ueber die IT oder Finanzabteilung berichtet, ist die Anforderung nicht erfuellt - unabhaengig davon, wie kompetent der CISO ist oder wie oft er Sie informell informiert.",
        nl: "Als de CISO via IT of financiën rapporteert, is de vereiste niet vervuld - ongeacht hoe competent de CISO is of hoe vaak hij u informeel brieft.",
      },
    },
    {
      id: "3.6.4",
      question: {
        en: "What practical step does the lesson recommend to meet the reporting requirement?",
        de: "Welchen praktischen Schritt empfiehlt die Lektion, um die Berichtspflicht zu erfuellen?",
        nl: "Welke praktische stap beveelt de les aan om aan de rapportagevereiste te voldoen?",
      },
      options: [
        { en: "Hire a second CISO who reports directly to the board", de: "Einen zweiten CISO einstellen, der direkt an den Vorstand berichtet", nl: "Een tweede CISO aannemen die rechtstreeks aan het bestuur rapporteert" },
        { en: "Change the line on the org chart and schedule recurring monthly meetings with a standing written agenda", de: "Die Berichtslinie im Organigramm ändern und wiederkehrende monatliche Termine mit einer festen schriftlichen Tagesordnung einplanen", nl: "De lijn op het organogram wijzigen en terugkerende maandelijkse vergaderingen inplannen met een vaste schriftelijke agenda" },
        { en: "Create a cybersecurity committee on the supervisory board", de: "Einen Cybersicherheitsausschuss im Aufsichtsrat einrichten", nl: "Een cyberbeveiligingscomité instellen bij de raad van commissarissen" },
        { en: "Outsource cybersecurity reporting to an external consultant", de: "Die Cybersicherheitsberichterstattung an einen externen Berater auslagern", nl: "Cyberbeveiligingsrapportage uitbesteden aan een externe adviseur" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The budget and headcount do not have to change, only the line on the chart. Then schedule a recurring monthly meeting with a standing written agenda.",
        de: "Budget und Personalstaerke müssen sich nicht ändern, nur die Linie im Organigramm. Planen Sie dann ein wiederkehrendes monatliches Treffen mit einer festen schriftlichen Tagesordnung ein.",
        nl: "Het budget en de personeelssterkte hoeven niet te veranderen, alleen de lijn op het organogram. Plan vervolgens een terugkerende maandelijkse vergadering in met een vaste schriftelijke agenda.",
      },
    },
  ],
});

export default quiz;
