import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.9",
  passingScore: 75,
  questions: [
    {
      id: "2.9.1",
      question: {
        en: "Who counts as a 'supplier' under NIS2?",
        de: "Wer gilt unter NIS2 als 'Lieferant'?",
        nl: "Wie telt als 'leverancier' onder NIS2?",
      },
      options: [
        { en: "Only software vendors listed in the IT budget", de: "Nur Softwareanbieter, die im IT-Budget aufgeführt sind", nl: "Alleen softwareleveranciers die op het IT-budget staan" },
        { en: "Anyone with access to your systems or data, including physical access providers", de: "Jeder mit Zugang zu Ihren Systemen oder Daten, einschließlich Anbieter mit physischem Zugang", nl: "Iedereen met toegang tot uw systemen of gegevens, inclusief aanbieders met fysieke toegang" },
        { en: "Only cloud providers with a signed SLA", de: "Nur Cloud-Anbieter mit einem unterzeichneten SLA", nl: "Alleen cloudaanbieders met een ondertekende SLA" },
        { en: "Only companies in the same industry sector", de: "Nur Unternehmen derselben Branche", nl: "Alleen bedrijven in dezelfde branche" },
      ],
      correctIndex: 1,
      explanation: {
        en: "'Supplier' under NIS2 means anyone with access to your systems or data - from cloud providers to the cleaning company with a key to the server room.",
        de: "'Lieferant' unter NIS2 bedeutet jeder mit Zugang zu Ihren Systemen oder Daten - von Cloud-Anbietern bis zum Reinigungsunternehmen mit Schlüssel zum Serverraum.",
        nl: "'Leverancier' onder NIS2 betekent iedereen met toegang tot uw systemen of gegevens - van cloudaanbieders tot het schoonmaakbedrijf met een sleutel van de serverruimte.",
      },
    },
    {
      id: "2.9.2",
      question: {
        en: "What are the four things the CIR expects for each supplier?",
        de: "Welche vier Dinge erwartet die CIR für jeden Lieferanten?",
        nl: "Wat zijn de vier dingen die de CIR voor elke leverancier verwacht?",
      },
      options: [
        { en: "Contract, payment, delivery, warranty", de: "Vertrag, Zahlung, Lieferung, Garantie", nl: "Contract, betaling, levering, garantie" },
        { en: "Inventory entry, risk classification, contractual security clauses, and periodic review", de: "Inventareintrag, Risikoklassifizierung, vertragliche Sicherheitsklauseln und regelmäßige Überprüfung", nl: "Inventarisatie, risicoklassificatie, contractuele beveiligingsclausules en periodieke beoordeling" },
        { en: "NDA, insurance certificate, audit report, reference check", de: "NDA, Versicherungsnachweis, Audit-Bericht, Referenzprüfung", nl: "NDA, verzekeringscertificaat, auditrapport, referentiecheck" },
        { en: "Background check, credit check, compliance score, annual fee", de: "Hintergrundprüfung, Bonitätsprüfung, Compliance-Bewertung, Jahresgebühr", nl: "Antecedentenonderzoek, kredietcheck, compliancescore, jaarlijkse vergoeding" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The four requirements are: supplier inventory, risk classification, contractual clauses (notification, audit rights, baseline), and periodic review.",
        de: "Die vier Anforderungen sind: Lieferanteninventar, Risikoklassifizierung, vertragliche Klauseln (Meldepflicht, Auditrechte, Baseline) und regelmäßige Überprüfung.",
        nl: "De vier vereisten zijn: leveranciersoverzicht, risicoklassificatie, contractuele clausules (meldingsplicht, auditrechten, baseline) en periodieke beoordeling.",
      },
    },
    {
      id: "2.9.3",
      question: {
        en: "If your supplier is breached and your customers' data is exposed, who bears the reporting duty?",
        de: "Wenn Ihr Lieferant kompromittiert wird und Kundendaten offengelegt werden, wer trägt die Meldepflicht?",
        nl: "Als uw leverancier gehackt wordt en klantgegevens worden blootgesteld, wie draagt dan de meldingsplicht?",
      },
      options: [
        { en: "The supplier, because the breach happened in their systems", de: "Der Lieferant, weil der Vorfall in seinen Systemen geschah", nl: "De leverancier, omdat het incident in hun systemen plaatsvond" },
        { en: "You, because the reporting and notification duties under Articles 23 and 36 land on the entity, not the supplier", de: "Sie, weil die Melde- und Benachrichtigungspflichten gemäß Artikel 23 und 36 bei der Einrichtung liegen, nicht beim Lieferanten", nl: "U, omdat de meldings- en kennisgevingsplichten uit Artikelen 23 en 36 bij de entiteit liggen, niet bij de leverancier" },
        { en: "The customers themselves, because they own the data", de: "Die Kunden selbst, weil ihnen die Daten gehören", nl: "De klanten zelf, omdat zij eigenaar zijn van de gegevens" },
        { en: "The national regulator, because they manage all reporting", de: "Die nationale Aufsichtsbehörde, weil sie alle Meldungen verwaltet", nl: "De nationale toezichthouder, omdat die alle meldingen beheert" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The reporting duty under Article 23 and the customer notification duty under Article 36 both land on you - the supplier's report does not cover you.",
        de: "Die Meldepflicht gemäß Artikel 23 und die Kundenbenachrichtigungspflicht gemäß Artikel 36 liegen beide bei Ihnen - die Meldung des Lieferanten deckt Sie nicht ab.",
        nl: "De meldingsplicht uit Artikel 23 en de klantenkennisgevingsplicht uit Artikel 36 liggen allebei bij u - de melding van de leverancier dekt u niet.",
      },
    },
  ],
});

export default quiz;
