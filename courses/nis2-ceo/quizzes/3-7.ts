import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.7",
  passingScore: 75,
  questions: [
    {
      id: "3.7.1",
      question: {
        en: "What is the difference between how Essential and Important entities are audited under NIS2?",
        de: "Worin unterscheidet sich die Auditierung von wesentlichen und wichtigen Einrichtungen unter NIS2?",
        nl: "Wat is het verschil in de manier waarop essentiële en belangrijke entiteiten worden geauditeerd onder NIS2?",
      },
      options: [
        { en: "Essential entities are never audited; Important entities are audited annually", de: "Wesentliche Einrichtungen werden nie geprüft; wichtige Einrichtungen werden jährlich geprüft", nl: "Essentiële entiteiten worden nooit geauditeerd; belangrijke entiteiten worden jaarlijks geauditeerd" },
        { en: "Essential entities can be audited proactively at any time; Important entities are audited reactively when triggered", de: "Wesentliche Einrichtungen können jederzeit proaktiv geprüft werden; wichtige Einrichtungen werden reaktiv bei Auslösern geprüft", nl: "Essentiële entiteiten kunnen proactief op elk moment worden geauditeerd; belangrijke entiteiten worden reactief geauditeerd wanneer daartoe aanleiding is" },
        { en: "Both are audited on the same annual schedule", de: "Beide werden nach dem gleichen jährlichen Zeitplan geprüft", nl: "Beide worden geauditeerd volgens hetzelfde jaarlijkse schema" },
        { en: "Essential entities are audited by the BSI; Important entities are audited by private firms", de: "Wesentliche Einrichtungen werden vom BSI geprüft; wichtige Einrichtungen von privaten Firmen", nl: "Essentiële entiteiten worden geauditeerd door de BSI; belangrijke entiteiten door private bedrijven" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 32 governs Essential entities with proactive auditing at any time without cause. Article 33 governs Important entities with reactive auditing triggered by incidents, complaints, or other causes.",
        de: "Artikel 32 regelt wesentliche Einrichtungen mit proaktiver Prüfung jederzeit ohne Anlass. Artikel 33 regelt wichtige Einrichtungen mit reaktiver Prüfung, ausgelöst durch Vorfälle, Beschwerden oder andere Gründe.",
        nl: "Artikel 32 regelt essentiële entiteiten met proactieve audits op elk moment zonder aanleiding. Artikel 33 regelt belangrijke entiteiten met reactieve audits uitgelokt door incidenten, klachten of andere oorzaken.",
      },
    },
    {
      id: "3.7.2",
      question: {
        en: "What is the difference between a finding and an observation in the auditor's report?",
        de: "Was ist der Unterschied zwischen einer Feststellung und einer Beobachtung im Auditbericht?",
        nl: "Wat is het verschil tussen een bevinding en een observatie in het auditrapport?",
      },
      options: [
        { en: "A finding is minor; an observation is serious", de: "Eine Feststellung ist geringfügig; eine Beobachtung ist schwerwiegend", nl: "Een bevinding is gering; een observatie is ernstig" },
        { en: "A finding triggers a remediation order with a deadline; an observation does not trigger an order", de: "Eine Feststellung löst eine Abhilfeanordnung mit Frist aus; eine Beobachtung löst keine Anordnung aus", nl: "Een bevinding leidt tot een herstelorder met deadline; een observatie leidt niet tot een order" },
        { en: "Both carry the same legal consequences", de: "Beide haben die gleichen rechtlichen Konsequenzen", nl: "Beide hebben dezelfde juridische gevolgen" },
        { en: "A finding is for technical issues; an observation is for governance issues", de: "Eine Feststellung betrifft technische Themen; eine Beobachtung betrifft Governance-Themen", nl: "Een bevinding gaat over technische kwesties; een observatie over governancekwesties" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A finding is a non-conformance that triggers a remediation order with a deadline. An observation falls below good practice but does not violate the law and does not trigger an order.",
        de: "Eine Feststellung ist eine Abweichung, die eine Abhilfeanordnung mit Frist auslöst. Eine Beobachtung liegt unter guter Praxis, verstößt aber nicht gegen das Gesetz und löst keine Anordnung aus.",
        nl: "Een bevinding is een niet-conformiteit die leidt tot een herstelorder met deadline. Een observatie valt onder goede praktijk maar schendt de wet niet en leidt niet tot een order.",
      },
    },
    {
      id: "3.7.3",
      question: {
        en: "How many documents form the backbone of the audit file according to the lesson?",
        de: "Wie viele Dokumente bilden laut der Lektion das Rückgrat der Auditakte?",
        nl: "Hoeveel documenten vormen de ruggengraat van het auditdossier volgens de les?",
      },
      options: [
        { en: "Three", de: "Drei", nl: "Drie" },
        { en: "Five", de: "Fünf", nl: "Vijf" },
        { en: "Seven", de: "Sieben", nl: "Zeven" },
        { en: "Ten", de: "Zehn", nl: "Tien" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Seven documents: Article 21 policy set, signed risk register with residual risk acceptance, incident reports and lessons learned, training records, CISO-to-board reporting minutes, asset inventory, and supplier contracts with critical clauses.",
        de: "Sieben Dokumente: Artikel-21-Richtlinienpaket, unterschriebenes Risikoregister mit Restrisikoakzeptanz, Vorfallberichte und Lessons Learned, Schulungsnachweise, Protokolle der CISO-Berichte an das Leitungsorgan, Asset-Inventar und Lieferantenverträge mit kritischen Klauseln.",
        nl: "Zeven documenten: beleidsset Artikel 21, ondertekend risicoregister met restrisico-acceptatie, incidentrapporten en geleerde lessen, trainingsregistraties, notulen CISO-tot-bestuur-rapportage, middelenregister en leverancierscontracten met kritieke clausules.",
      },
    },
    {
      id: "3.7.4",
      question: {
        en: "What happens if remediation is incomplete when the auditor returns?",
        de: "Was geschieht, wenn die Abhilfe bei der Rückkehr des Auditors unvollständig ist?",
        nl: "Wat gebeurt er als het herstel onvolledig is wanneer de auditor terugkeert?",
      },
      options: [
        { en: "The auditor extends the deadline automatically", de: "Der Auditor verlängert die Frist automatisch", nl: "De auditor verlengt de deadline automatisch" },
        { en: "The regulator escalates: binding instructions, public disclosure, or fines", de: "Die Aufsichtsbehörde eskaliert: verbindliche Anweisungen, öffentliche Bekanntmachung oder Bußgelder", nl: "De toezichthouder escaleert: bindende instructies, openbare bekendmaking of boetes" },
        { en: "The finding is downgraded to an observation", de: "Die Feststellung wird zu einer Beobachtung herabgestuft", nl: "De bevinding wordt gedegradeerd tot een observatie" },
        { en: "The company is given a final warning with no further consequences", de: "Das Unternehmen erhält eine letzte Warnung ohne weitere Konsequenzen", nl: "Het bedrijf krijgt een laatste waarschuwing zonder verdere gevolgen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "If remediation is incomplete, the regulator escalates: binding instructions under Article 32(5), public disclosure, or fines.",
        de: "Wenn die Abhilfe unvollständig ist, eskaliert die Aufsichtsbehörde: verbindliche Anweisungen gemäß Artikel 32 Absatz 5, öffentliche Bekanntmachung oder Bußgelder.",
        nl: "Als het herstel onvolledig is, escaleert de toezichthouder: bindende instructies op grond van Artikel 32(5), openbare bekendmaking of boetes.",
      },
    },
  ],
});

export default quiz;
