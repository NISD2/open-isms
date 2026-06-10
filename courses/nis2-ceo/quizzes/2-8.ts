import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.8",
  passingScore: 75,
  questions: [
    {
      id: "2.8.1",
      question: {
        en: "What are the three components of business continuity under Article 21(2)(c)?",
        de: "Was sind die drei Komponenten der Betriebskontinuität gemäß Artikel 21 Absatz 2(c)?",
        nl: "Wat zijn de drie componenten van bedrijfscontinuïteit op grond van Artikel 21(2)(c)?",
      },
      options: [
        { en: "Risk analysis, incident handling, and training", de: "Risikoanalyse, Vorfallbehandlung und Schulung", nl: "Risicoanalyse, incidentbeheer en training" },
        { en: "Backup management, disaster recovery, and crisis management", de: "Backup-Management, Notfallwiederherstellung und Krisenmanagement", nl: "Back-upbeheer, herstel na rampen en crisismanagement" },
        { en: "Encryption, access control, and monitoring", de: "Verschlüsselung, Zugangskontrolle und Überwachung", nl: "Versleuteling, toegangscontrole en monitoring" },
        { en: "Asset inventory, supplier review, and patching", de: "Asset-Inventar, Lieferantenüberprüfung und Patching", nl: "Middelenregister, leveranciersbeoordeling en patching" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 21(2)(c) requires three distinct components: backup management, disaster recovery, and crisis management.",
        de: "Artikel 21 Absatz 2(c) verlangt drei eigenständige Komponenten: Backup-Management, Notfallwiederherstellung und Krisenmanagement.",
        nl: "Artikel 21(2)(c) vereist drie afzonderlijke componenten: back-upbeheer, herstel na rampen en crisismanagement.",
      },
    },
    {
      id: "2.8.2",
      question: {
        en: "What is the difference between RTO and RPO?",
        de: "Was ist der Unterschied zwischen RTO und RPO?",
        nl: "Wat is het verschil tussen RTO en RPO?",
      },
      options: [
        { en: "RTO is the budget for recovery; RPO is the budget for prevention", de: "RTO ist das Budget für die Wiederherstellung; RPO ist das Budget für die Prävention", nl: "RTO is het budget voor herstel; RPO is het budget voor preventie" },
        { en: "RTO is how quickly you must be back up; RPO is how much data you can afford to lose", de: "RTO ist, wie schnell Sie wieder betriebsfähig sein müssen; RPO ist, wie viel Datenverlust Sie sich leisten können", nl: "RTO is hoe snel u weer operationeel moet zijn; RPO is hoeveel dataverlies u zich kunt veroorloven" },
        { en: "RTO applies to hardware; RPO applies to software", de: "RTO gilt für Hardware; RPO gilt für Software", nl: "RTO geldt voor hardware; RPO geldt voor software" },
        { en: "RTO is set by the auditor; RPO is set by the CISO", de: "RTO wird vom Auditor festgelegt; RPO wird vom CISO festgelegt", nl: "RTO wordt bepaald door de auditor; RPO door de CISO" },
      ],
      correctIndex: 1,
      explanation: {
        en: "RTO (Recovery Time Objective) is the maximum acceptable time to restore service; RPO (Recovery Point Objective) is the maximum acceptable data loss, measured in time.",
        de: "RTO (Recovery Time Objective) ist die maximal akzeptable Zeit zur Wiederherstellung des Dienstes; RPO (Recovery Point Objective) ist der maximal akzeptable Datenverlust, gemessen in Zeit.",
        nl: "RTO (Recovery Time Objective) is de maximaal aanvaardbare tijd om de dienst te herstellen; RPO (Recovery Point Objective) is het maximaal aanvaardbare dataverlies, gemeten in tijd.",
      },
    },
    {
      id: "2.8.3",
      question: {
        en: "Why is a CEO who has never attended a crisis exercise at risk of an audit finding?",
        de: "Warum riskiert ein CEO, der nie an einer Krisenübung teilgenommen hat, eine Audit-Feststellung?",
        nl: "Waarom loopt een CEO die nooit aan een crisisoefening heeft deelgenomen risico op een auditbevinding?",
      },
      options: [
        { en: "Because DER.4 names the management body in nine of sixteen requirements and expects their participation", de: "Weil DER.4 die Geschäftsleitung in neun von sechzehn Anforderungen nennt und deren Teilnahme erwartet", nl: "Omdat DER.4 het leidinggevend orgaan noemt in negen van de zestien vereisten en hun deelname verwacht" },
        { en: "Because the CEO must personally run the IT recovery process", de: "Weil der CEO den IT-Wiederherstellungsprozess persönlich leiten muss", nl: "Omdat de CEO het IT-herstelproces persoonlijk moet leiden" },
        { en: "Because the crisis exercise can only be scheduled by the CEO", de: "Weil die Krisenübung nur vom CEO angesetzt werden kann", nl: "Omdat de crisisoefening alleen door de CEO kan worden gepland" },
        { en: "Because the insurance policy requires CEO attendance at exercises", de: "Weil die Versicherungspolice die Teilnahme des CEO an Übungen verlangt", nl: "Omdat de verzekeringspolis aanwezigheid van de CEO bij oefeningen vereist" },
      ],
      correctIndex: 0,
      explanation: {
        en: "BSI DER.4 names the management body in nine of sixteen requirements - a CEO who has never attended a crisis exercise has created an audit finding.",
        de: "BSI DER.4 nennt die Geschäftsleitung in neun von sechzehn Anforderungen - ein CEO, der nie an einer Krisenübung teilgenommen hat, hat eine Audit-Feststellung erzeugt.",
        nl: "BSI DER.4 noemt het leidinggevend orgaan in negen van de zestien vereisten - een CEO die nooit aan een crisisoefening heeft deelgenomen heeft een auditbevinding gecreëerd.",
      },
    },
    {
      id: "2.8.4",
      question: {
        en: "According to the lesson, what lesson does the Maersk case illustrate?",
        de: "Welche Erkenntnis verdeutlicht der Maersk-Fall laut der Lektion?",
        nl: "Welke les illustreert de casus Maersk volgens de les?",
      },
      options: [
        { en: "That malware only affects shipping companies", de: "Dass Malware nur Reedereien betrifft", nl: "Dat malware alleen rederijen treft" },
        { en: "That antivirus software is sufficient protection", de: "Dass Antivirensoftware ausreichender Schutz ist", nl: "Dat antivirussoftware voldoende bescherming biedt" },
        { en: "That luck - not a tested backup programme - was the only thing between Maersk and a months-long outage", de: "Dass Glück - nicht ein getestetes Backup-Programm - das Einzige war, das Maersk vor einem monatelangen Ausfall bewahrte", nl: "Dat geluk - en niet een getest back-upprogramma - het enige was dat Maersk voor een maandenlange uitval behoedde" },
        { en: "That disaster recovery plans are unnecessary for large companies", de: "Dass Notfallwiederherstellungspläne für große Unternehmen unnötig sind", nl: "Dat herstelplannen na rampen overbodig zijn voor grote bedrijven" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Maersk's only surviving backup was offline due to a power cut in Ghana - luck, not a control, saved them from a months-long recovery.",
        de: "Maersks einziges überlebendes Backup war wegen eines Stromausfalls in Ghana offline - Glück, nicht eine Maßnahme, bewahrte sie vor einer monatelangen Wiederherstellung.",
        nl: "De enige overgebleven back-up van Maersk was offline door een stroomuitval in Ghana - geluk, geen maatregel, bewaarde hen voor een maandenlange herstelprocedure.",
      },
    },
  ],
});

export default quiz;
