import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.6",
  passingScore: 75,
  questions: [
    {
      id: "4.6.1",
      question: {
        en: "What are the three legal constraints on ransomware payment described in the lesson?",
        de: "Welche drei rechtlichen Einschränkungen für Ransomware-Zahlungen beschreibt die Lektion?",
        nl: "Wat zijn de drie juridische beperkingen op ransomwarebetaling die de les beschrijft?",
      },
      options: [
        { en: "Insurance policy terms, board approval, and shareholder vote", de: "Versicherungsbedingungen, Vorstandsgenehmigung und Gesellschafterabstimmung", nl: "Polisvoorwaarden, bestuursgoedkeuring en aandeelhoudersstemming" },
        { en: "Sanctions law, corporate law (breach of trust), and sector-specific rules", de: "Sanktionsrecht, Gesellschaftsrecht (Untreue) und branchenspezifische Vorschriften", nl: "Sanctiewetgeving, vennootschapsrecht (ontrouw) en sectorspecifieke regels" },
        { en: "Criminal prohibition, EU directive, and national law", de: "Strafrechtliches Verbot, EU-Richtlinie und nationales Recht", nl: "Strafrechtelijk verbod, EU-richtlijn en nationaal recht" },
        { en: "CISO approval, insurer consent, and regulator permission", de: "CISO-Genehmigung, Versicherer-Zustimmung und Behördenerlaubnis", nl: "CISO-goedkeuring, instemming verzekeraar en toestemming toezichthouder" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Three constraints: sanctions law (paying a sanctioned group is illegal), corporate law (breach of trust under section 266), and sector-specific rules that stack additional restrictions.",
        de: "Drei Einschränkungen: Sanktionsrecht (Zahlung an eine sanktionierte Gruppe ist illegal), Gesellschaftsrecht (Untreue gemäß § 266 StGB) und branchenspezifische Vorschriften, die zusaetzliche Beschraenkungen auferlegen.",
        nl: "Drie beperkingen: sanctiewetgeving (betalen aan een gesanctioneerde groep is illegaal), vennootschapsrecht (ontrouw) en sectorspecifieke regels die aanvullende beperkingen opleggen.",
      },
    },
    {
      id: "4.6.2",
      question: {
        en: "What happened after Colonial Pipeline paid the ransom?",
        de: "Was geschah, nachdem Colonial Pipeline das Loesegeld bezahlt hatte?",
        nl: "Wat gebeurde er nadat Colonial Pipeline het losgeld betaalde?",
      },
      options: [
        { en: "The decryption key worked perfectly and systems were restored within hours", de: "Der Entschluesselungsschluessel funktionierte einwandfrei und die Systeme wurden innerhalb von Stunden wiederhergestellt", nl: "De ontsleutelingssleutel werkte perfect en systemen werden binnen enkele uren hersteld" },
        { en: "The decryption tool was so slow the company restored from backups anyway", de: "Das Entschluesselungstool war so langsam, dass das Unternehmen letztlich doch aus Backups wiederherstellte", nl: "Het ontsleutelingstool was zo traag dat het bedrijf toch vanuit back-ups herstelde" },
        { en: "The attackers demanded a second payment", de: "Die Angreifer forderten eine zweite Zahlung", nl: "De aanvallers eisten een tweede betaling" },
        { en: "Law enforcement intercepted the payment before it reached the attackers", de: "Die Strafverfolgungsbehörden fingen die Zahlung ab, bevor sie die Angreifer erreichte", nl: "Rechtshandhaving onderschepte de betaling voordat die de aanvallers bereikte" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The decryption tool was so slow the company restored from backups anyway. The payment did not save time.",
        de: "Das Entschluesselungstool war so langsam, dass das Unternehmen letztlich doch aus Backups wiederherstellte. Die Zahlung sparte keine Zeit.",
        nl: "Het ontsleutelingstool was zo traag dat het bedrijf toch vanuit back-ups herstelde. De betaling bespaarde geen tijd.",
      },
    },
    {
      id: "4.6.3",
      question: {
        en: "What did the Colonial Pipeline CEO state in congressional testimony about the payment decision?",
        de: "Was sagte der CEO von Colonial Pipeline in seiner Aussage vor dem Kongress ueber die Zahlungsentscheidung?",
        nl: "Wat verklaarde de CEO van Colonial Pipeline in zijn getuigenis aan het Congres over de betalingsbeslissing?",
      },
      options: [
        { en: "That the payment was the right decision and he would do it again", de: "Dass die Zahlung die richtige Entscheidung war und er es wieder tun wuerde", nl: "Dat de betaling de juiste beslissing was en hij het opnieuw zou doen" },
        { en: "That a pre-agreed policy would have changed the decision", de: "Dass eine vorab vereinbarte Richtlinie die Entscheidung geändert haette", nl: "Dat een vooraf overeengekomen beleid de beslissing had veranderd" },
        { en: "That law enforcement advised the payment", de: "Dass die Strafverfolgungsbehörden zur Zahlung geraten hatten", nl: "Dat rechtshandhaving de betaling had aangeraden" },
        { en: "That the payment was legally required under US infrastructure regulations", de: "Dass die Zahlung nach US-Infrastrukturvorschriften rechtlich erforderlich war", nl: "Dat de betaling wettelijk verplicht was onder Amerikaanse infrastructuurregels" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The CEO stated a pre-agreed policy would have changed the decision. The company had no board-approved position on ransomware payment before the attack.",
        de: "Der CEO erklaerte, dass eine vorab vereinbarte Richtlinie die Entscheidung geändert haette. Das Unternehmen hatte vor dem Angriff keine vom Vorstand genehmigte Position zu Ransomware-Zahlungen.",
        nl: "De CEO verklaarde dat een vooraf overeengekomen beleid de beslissing had veranderd. Het bedrijf had vóór de aanval geen door het bestuur goedgekeurd standpunt over ransomwarebetaling.",
      },
    },
    {
      id: "4.6.4",
      question: {
        en: "What four steps does the lesson require before any ransomware payment?",
        de: "Welche vier Schritte verlangt die Lektion vor jeder Ransomware-Zahlung?",
        nl: "Welke vier stappen vereist de les vóór elke ransomwarebetaling?",
      },
      options: [
        { en: "Board vote, shareholder notification, press statement, insurance claim", de: "Vorstandsabstimmung, Gesellschafterbenachrichtigung, Presseerklaerung, Versicherungsanspruch", nl: "Bestuursstemming, aandeelhoudersmededeling, persbericht, verzekeringsaanspraak" },
        { en: "CEO approval, legal review covering sanctions and criminal law, law enforcement coordination, and documentation in the incident record", de: "CEO-Genehmigung, rechtliche Prüfung unter Beruecksichtigung von Sanktions- und Strafrecht, Koordination mit Strafverfolgungsbehörden und Dokumentation im Vorfallbericht", nl: "CEO-goedkeuring, juridische beoordeling van sanctie- en strafrecht, coördinatie met rechtshandhaving en documentatie in het incidentdossier" },
        { en: "CISO approval, forensic analysis, regulator notification, and public disclosure", de: "CISO-Genehmigung, forensische Analyse, Behördenbenachrichtigung und oeffentliche Bekanntmachung", nl: "CISO-goedkeuring, forensische analyse, kennisgeving toezichthouder en openbare bekendmaking" },
        { en: "Insurance claim, board vote, press conference, and customer notification", de: "Versicherungsanspruch, Vorstandsabstimmung, Pressekonferenz und Kundenbenachrichtigung", nl: "Verzekeringsaanspraak, bestuursstemming, persconferentie en klantmelding" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Four steps: CEO approval (non-delegable), legal review covering sanctions and criminal law, law enforcement coordination, and documentation in the incident record.",
        de: "Vier Schritte: CEO-Genehmigung (nicht delegierbar), rechtliche Prüfung unter Beruecksichtigung von Sanktions- und Strafrecht, Koordination mit Strafverfolgungsbehörden und Dokumentation im Vorfallbericht.",
        nl: "Vier stappen: CEO-goedkeuring (niet-delegeerbaar), juridische beoordeling van sanctie- en strafrecht, coördinatie met rechtshandhaving en documentatie in het incidentdossier.",
      },
    },
  ],
});

export default quiz;
