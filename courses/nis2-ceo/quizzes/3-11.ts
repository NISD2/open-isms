import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.11",
  passingScore: 75,
  questions: [
    {
      id: "3.11.1",
      question: {
        en: "Why does the lesson say Option B (fix it, say nothing) is risky even though the gap is resolved?",
        de: "Warum bezeichnet die Lektion Option B (beheben, nichts sagen) als riskant, obwohl die Lücke behoben ist?",
        nl: "Waarom zegt de les dat Optie B (oplossen, niets zeggen) riskant is, ook al is de lacune verholpen?",
      },
      options: [
        { en: "Because the regulator requires disclosure of all past gaps", de: "Weil die Aufsichtsbehörde die Offenlegung aller vergangenen Lücken verlangt", nl: "Omdat de toezichthouder de openbaarmaking van alle vroegere lacunes vereist" },
        { en: "Because timestamps exist, old archives survive, and someone may mention the fix in an interview - it sounds like concealment even if unintended", de: "Weil Zeitstempel existieren, alte Archive ueberleben und jemand die Behebung in einem Gespraech erwaehnen koennte - es wirkt wie Vertuschung, selbst wenn unbeabsichtigt", nl: "Omdat tijdstempels bestaan, oude archieven overleven en iemand de oplossing in een gesprek kan noemen - het klinkt als verhulling, ook al was dat niet de bedoeling" },
        { en: "Because fixing without disclosure is a criminal offence", de: "Weil Beheben ohne Offenlegung eine Straftat ist", nl: "Omdat oplossen zonder openbaarmaking een strafbaar feit is" },
        { en: "Because the auditor always checks backup encryption specifically", de: "Weil der Auditor immer gezielt die Backup-Verschluesselung prüft", nl: "Omdat de auditor altijd specifiek back-upversleuteling controleert" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Timestamps exist, old unencrypted archives survive, and someone may mention the fix in an interview. The auditor pieces the timeline together and it sounds like concealment even if unintended.",
        de: "Zeitstempel existieren, alte unverschluesselte Archive ueberleben und jemand koennte die Behebung in einem Gespraech erwaehnen. Der Auditor setzt die Zeitleiste zusammen und es wirkt wie Vertuschung, selbst wenn unbeabsichtigt.",
        nl: "Tijdstempels bestaan, oude onversleutelde archieven overleven en iemand kan de oplossing noemen in een gesprek. De auditor reconstrueert de tijdlijn en het klinkt als verhulling, ook al was dat niet de bedoeling.",
      },
    },
    {
      id: "3.11.2",
      question: {
        en: "What does Article 21(2)(f) of NIS2 require that makes finding your own gaps the expected state?",
        de: "Was verlangt Artikel 21 Absatz 2 Buchstabe f der NIS2, das die Entdeckung eigener Lücken zum erwarteten Zustand macht?",
        nl: "Wat vereist Artikel 21(2)(f) van NIS2 dat het vinden van uw eigen lacunes de verwachte toestand maakt?",
      },
      options: [
        { en: "Annual penetration testing by an external firm", de: "Jährliche Penetrationstests durch eine externe Firma", nl: "Jaarlijkse penetratietests door een externe firma" },
        { en: "Policies and procedures to assess the effectiveness of cybersecurity risk-management measures", de: "Konzepte und Verfahren zur Bewertung der Wirksamkeit von Risikomanagementmassnahmen im Bereich der Cybersicherheit", nl: "Beleid en procedures om de effectiviteit van cyberbeveiligingsrisicobeheermaatregelen te beoordelen" },
        { en: "Mandatory bug bounty programmes", de: "Verpflichtende Bug-Bounty-Programme", nl: "Verplichte bug-bountyprogramma's" },
        { en: "Quarterly vulnerability scans of all systems", de: "Vierteljährliche Schwachstellenscans aller Systeme", nl: "Kwartaallijkse kwetsbaarheidsscans van alle systemen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 21(2)(f) requires policies and procedures to assess the effectiveness of cybersecurity risk-management measures - the law expects you to find your own gaps.",
        de: "Artikel 21 Absatz 2 Buchstabe f verlangt Konzepte und Verfahren zur Bewertung der Wirksamkeit von Risikomanagementmassnahmen im Bereich der Cybersicherheit - das Gesetz erwartet, dass Sie Ihre eigenen Lücken finden.",
        nl: "Artikel 21(2)(f) vereist beleid en procedures om de effectiviteit van cyberbeveiligingsrisicobeheermaatregelen te beoordelen - de wet verwacht dat u uw eigen lacunes vindt.",
      },
    },
    {
      id: "3.11.3",
      question: {
        en: "What is the typical outcome of good-faith disclosure versus discovered concealment?",
        de: "Was ist das typische Ergebnis einer gutglaeubigen Offenlegung im Vergleich zu entdeckter Vertuschung?",
        nl: "Wat is het typische resultaat van openbaarmaking te goeder trouw versus ontdekte verhulling?",
      },
      options: [
        { en: "Both result in the same fine", de: "Beides fuehrt zur gleichen Geldstrafe", nl: "Beide leiden tot dezelfde boete" },
        { en: "Disclosure typically results in a remediation order or warning; concealment typically results in a fine plus ongoing monitoring", de: "Offenlegung fuehrt typischerweise zu einer Abhilfeanordnung oder Verwarnung; Vertuschung fuehrt typischerweise zu einem Bussgeld plus laufender Ueberwachung", nl: "Openbaarmaking leidt doorgaans tot een herstelorder of waarschuwing; verhulling leidt doorgaans tot een boete plus voortdurende monitoring" },
        { en: "Disclosure results in no consequences; concealment results in licence revocation", de: "Offenlegung hat keine Konsequenzen; Vertuschung fuehrt zum Lizenzentzug", nl: "Openbaarmaking heeft geen gevolgen; verhulling leidt tot intrekking van de vergunning" },
        { en: "Disclosure results in a public reprimand; concealment results in criminal prosecution", de: "Offenlegung fuehrt zu einer oeffentlichen Ruege; Vertuschung fuehrt zu strafrechtlicher Verfolgung", nl: "Openbaarmaking leidt tot een publieke berisping; verhulling leidt tot strafrechtelijke vervolging" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Good-faith disclosure typically results in a remediation order or warning, not a fine. Discovered concealment typically results in a fine plus ongoing monitoring, and the CEO's credibility is damaged for years.",
        de: "Gutglaeubige Offenlegung fuehrt typischerweise zu einer Abhilfeanordnung oder Verwarnung, nicht zu einem Bussgeld. Entdeckte Vertuschung fuehrt typischerweise zu einem Bussgeld plus laufender Ueberwachung, und die Glaubwürdigkeit des CEO ist für Jahre beschädigt.",
        nl: "Openbaarmaking te goeder trouw leidt doorgaans tot een herstelorder of waarschuwing, niet tot een boete. Ontdekte verhulling leidt doorgaans tot een boete plus voortdurende monitoring, en de geloofwaardigheid van de CEO is jarenlang aangetast.",
      },
    },
    {
      id: "3.11.4",
      question: {
        en: "In Option C, who should the pre-audit disclosure letter come from?",
        de: "Von wem sollte in Option C der Offenlegungsbrief vor dem Audit stammen?",
        nl: "Van wie moet in Optie C de openbaarmakingsbrief vóór de audit afkomstig zijn?",
      },
      options: [
        { en: "The CISO", de: "Dem CISO", nl: "De CISO" },
        { en: "The compliance officer", de: "Dem Compliance-Beauftragten", nl: "De compliance-officer" },
        { en: "The CEO personally", de: "Dem CEO persönlich", nl: "De CEO persoonlijk" },
        { en: "External legal counsel", de: "Externen Rechtsberatern", nl: "Externe juridische adviseurs" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The letter comes from you, the CEO. You personally write to the auditor before the audit - what was found, when, what was done, what the new controls look like.",
        de: "Der Brief kommt von Ihnen, dem CEO. Sie schreiben persönlich an den Auditor vor dem Audit - was gefunden wurde, wann, was unternommen wurde und wie die neuen Kontrollen aussehen.",
        nl: "De brief is van u, de CEO. U schrijft persoonlijk aan de auditor vóór de audit - wat er gevonden is, wanneer, wat er gedaan is en hoe de nieuwe maatregelen eruitzien.",
      },
    },
  ],
});

export default quiz;
