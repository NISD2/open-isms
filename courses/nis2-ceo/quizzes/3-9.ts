import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.9",
  passingScore: 75,
  questions: [
    {
      id: "3.9.1",
      question: {
        en: "When your supplier is breached and your customers' data is exposed, who is legally responsible for reporting?",
        de: "Wenn Ihr Lieferant kompromittiert wird und die Daten Ihrer Kunden offengelegt werden - wer ist rechtlich für die Meldung verantwortlich?",
        nl: "Wanneer uw leverancier wordt getroffen en de gegevens van uw klanten worden blootgesteld, wie is dan wettelijk verantwoordelijk voor de melding?",
      },
      options: [
        { en: "Only the supplier, since the breach occurred in their systems", de: "Nur der Lieferant, da der Vorfall in seinen Systemen aufgetreten ist", nl: "Alleen de leverancier, omdat het incident in hun systemen heeft plaatsgevonden" },
        { en: "You must file your own Article 23 report - the supplier's report does not cover you", de: "Sie müssen Ihren eigenen Bericht gemäß Artikel 23 einreichen - der Bericht des Lieferanten deckt Sie nicht ab", nl: "U moet uw eigen Artikel 23-rapport indienen - het rapport van de leverancier dekt u niet" },
        { en: "The regulator decides who files based on the severity", de: "Die Aufsichtsbehörde entscheidet anhand der Schwere, wer meldet", nl: "De toezichthouder beslist wie meldt op basis van de ernst" },
        { en: "Neither party files until the full scope is determined", de: "Keine Partei meldet, bis der volle Umfang festgestellt ist", nl: "Geen van beide partijen meldt totdat de volledige omvang is vastgesteld" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A breach at your supplier is your incident under Article 23 whenever your customers are affected - the supplier's report to their regulator does not cover you.",
        de: "Ein Vorfall bei Ihrem Lieferanten ist Ihr Vorfall gemäß Artikel 23, sobald Ihre Kunden betroffen sind - der Bericht des Lieferanten an seine Aufsichtsbehörde deckt Sie nicht ab.",
        nl: "Een inbreuk bij uw leverancier is uw incident op grond van Artikel 23 wanneer uw klanten worden getroffen - het rapport van de leverancier aan hun toezichthouder dekt u niet.",
      },
    },
    {
      id: "3.9.2",
      question: {
        en: "What three supplier contract clauses does the lesson say you should check immediately during a supplier breach?",
        de: "Welche drei Lieferantenvertragsklauseln sollten Sie laut der Lektion bei einem Lieferantenvorfall sofort prüfen?",
        nl: "Welke drie clausules in leverancierscontracten moet u onmiddellijk controleren bij een leveranciersincident?",
      },
      options: [
        { en: "Price, term, and jurisdiction", de: "Preis, Laufzeit und Gerichtsstand", nl: "Prijs, looptijd en rechtsgebied" },
        { en: "Incident notification timelines, audit rights, and indemnification", de: "Vorfallbenachrichtigungsfristen, Prüfungsrechte und Schadloshaltung", nl: "Meldingstermijnen bij incidenten, auditrechten en schadevergoeding" },
        { en: "SLA, data processing agreement, and liability cap", de: "SLA, Auftragsverarbeitungsvertrag und Haftungsobergrenze", nl: "SLA, gegevensverwerkingsovereenkomst en aansprakelijkheidslimiet" },
        { en: "Termination clause, force majeure, and warranty", de: "Kuendigungsklausel, hoehere Gewalt und Gewaehrleistung", nl: "Opzeggingsclausule, overmacht en garantie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Incident notification timelines, audit rights, and indemnification - those three clauses decide your response timeline, your access rights, and cost recovery.",
        de: "Vorfallbenachrichtigungsfristen, Prüfungsrechte und Schadloshaltung - diese drei Klauseln bestimmen Ihren Reaktionszeitraum, Ihre Zugriffsrechte und die Kostenerstattung.",
        nl: "Meldingstermijnen bij incidenten, auditrechten en schadevergoeding - die drie clausules bepalen uw responstermijn, uw toegangsrechten en kostenherstel.",
      },
    },
    {
      id: "3.9.3",
      question: {
        en: "What two things did the MOVEit companies that responded best have in common?",
        de: "Was hatten die MOVEit-Unternehmen, die am besten reagiert haben, gemeinsam?",
        nl: "Wat hadden de MOVEit-bedrijven die het beste reageerden gemeen?",
      },
      options: [
        { en: "Cyber insurance and external legal counsel on retainer", de: "Cyberversicherung und externe Rechtsberatung auf Retainer-Basis", nl: "Cyberverzekering en externe juridische adviseurs op retainer-basis" },
        { en: "A pre-drafted customer notification template and a map of which suppliers touched which customer data", de: "Eine vorbereitete Kundenbenachrichtigungsvorlage und eine Zuordnung, welche Lieferanten auf welche Kundendaten zugegriffen haben", nl: "Een vooraf opgesteld klantmeldingssjabloon en een overzicht van welke leveranciers welke klantgegevens aanraakten" },
        { en: "A dedicated incident response team and 24/7 security monitoring", de: "Ein dediziertes Incident-Response-Team und 24/7-Sicherheitsueberwachung", nl: "Een toegewijd incidentresponsteam en 24/7 beveiligingsmonitoring" },
        { en: "Direct communication with law enforcement and a PR agency", de: "Direkte Kommunikation mit Strafverfolgungsbehörden und einer PR-Agentur", nl: "Directe communicatie met rechtshandhaving en een PR-bureau" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The MOVEit companies that came out cleanest had a pre-drafted notification template and a map of which suppliers touched which customer data - cutting response time from days to hours.",
        de: "Die MOVEit-Unternehmen, die am besten davonkamen, hatten eine vorbereitete Benachrichtigungsvorlage und eine Zuordnung, welche Lieferanten auf welche Kundendaten zugegriffen haben - das reduzierte die Reaktionszeit von Tagen auf Stunden.",
        nl: "De MOVEit-bedrijven die er het best uitkwamen hadden een vooraf opgesteld meldingssjabloon en een overzicht van welke leveranciers welke klantgegevens aanraakten - wat de responstijd van dagen naar uren verkortte.",
      },
    },
    {
      id: "3.9.4",
      question: {
        en: "Which of the five CEO decisions should you take your time on during a supplier breach?",
        de: "Bei welcher der fünf CEO-Entscheidungen sollten Sie sich bei einem Lieferantenvorfall Zeit lassen?",
        nl: "Welke van de vijf CEO-beslissingen mag u rustig de tijd voor nemen bij een leveranciersincident?",
      },
      options: [
        { en: "Filing your own regulatory report", de: "Die eigene regulatorische Meldung einreichen", nl: "Uw eigen regulatoire rapport indienen" },
        { en: "Notifying affected customers", de: "Betroffene Kunden benachrichtigen", nl: "Getroffen klanten informeren" },
        { en: "Pursuing contractual remedies - only after the immediate incident is handled", de: "Vertragliche Rechtsbehelfe verfolgen - erst nachdem der unmittelbare Vorfall bewaeltigt ist", nl: "Contractuele middelen inzetten - pas nadat het onmiddellijke incident is afgehandeld" },
        { en: "Forcing the facts from the supplier", de: "Die Fakten vom Lieferanten einfordern", nl: "De feiten bij de leverancier forceren" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Contractual remedies are the only decision you should take your time on. Once the immediate incident is handled, decide whether to trigger indemnification, switch providers, or renegotiate.",
        de: "Vertragliche Rechtsbehelfe sind die einzige Entscheidung, bei der Sie sich Zeit lassen sollten. Sobald der unmittelbare Vorfall bewaeltigt ist, entscheiden Sie, ob Sie die Schadloshaltung einfordern, den Anbieter wechseln oder nachverhandeln.",
        nl: "Contractuele middelen zijn de enige beslissing waarbij u de tijd mag nemen. Zodra het onmiddellijke incident is afgehandeld, beslist u of u schadevergoeding vordert, van leverancier wisselt of heronderhandelt.",
      },
    },
  ],
});

export default quiz;
