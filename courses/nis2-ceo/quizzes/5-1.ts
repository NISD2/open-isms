import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "5.1",
  passingScore: 75,
  questions: [
    {
      id: "5.1.1",
      question: {
        en: "What are the three priorities for the first two weeks according to the 90-day plan?",
        de: "Welche drei Prioritaeten gelten laut dem 90-Tage-Plan für die ersten zwei Wochen?",
        nl: "Wat zijn de drie prioriteiten voor de eerste twee weken volgens het 90-dagenplan?",
      },
      options: [
        { en: "Hire a CISO, purchase insurance, and file for an extension", de: "Einen CISO einstellen, Versicherung abschließen und eine Verlaengerung beantragen", nl: "Een CISO aannemen, verzekering afsluiten en een verlenging aanvragen" },
        { en: "Confirm scoping assessment, register with the BSI, and confirm the CISO reporting line", de: "Betroffenheitsbewertung bestätigten, beim BSI registrieren und die Berichtslinie des CISO bestätigten", nl: "Scope-beoordeling bevestigen, registreren bij de BSI en de rapportagelijn van de CISO bevestigen" },
        { en: "Write all eleven policies, run a tabletop exercise, and schedule the management review", de: "Alle elf Richtlinien schreiben, eine Tabletop-Uebung durchführen und die Management-Bewertung planen", nl: "Alle elf beleidslijnen schrijven, een tabletop-oefening uitvoeren en de managementbeoordeling plannen" },
        { en: "Purchase cyber insurance, engage an external auditor, and notify customers", de: "Cyberversicherung abschließen, einen externen Auditor beauftragen und Kunden benachrichtigen", nl: "Cyberverzekering afsluiten, een externe auditor inschakelen en klanten informeren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The first two weeks are about scope, registration, and the CISO reporting line - these are the prerequisites everything else depends on.",
        de: "Die ersten zwei Wochen drehen sich um Betroffenheit, Registrierung und die Berichtslinie des CISO - das sind die Voraussetzungen, von denen alles andere abhaengt.",
        nl: "De eerste twee weken gaan over scope, registratie en de rapportagelijn van de CISO - dat zijn de voorwaarden waarvan alles else afhankelijk is.",
      },
    },
    {
      id: "5.1.2",
      question: {
        en: "What is the residual risk acceptance and why does it matter?",
        de: "Was ist die Restrisikoakzeptanz und warum ist sie wichtig?",
        nl: "Wat is de restrisico-acceptatie en waarom is die belangrijk?",
      },
      options: [
        { en: "An insurance document that transfers remaining risk to the insurer", de: "Ein Versicherungsdokument, das das verbleibende Risiko auf den Versicherer uebertraegt", nl: "Een verzekeringsdocument dat het resterende risico overdraagt aan de verzekeraar" },
        { en: "The CEO's signature proving they personally reviewed what the company decided to live with - the artefact most auditors look for first", de: "Die Unterschrift des CEO, die belegt, dass er persönlich geprüft hat, womit das Unternehmen zu leben beschlossen hat - das Artefakt, nach dem Auditoren zuerst suchen", nl: "De handtekening van de CEO die bewijst dat zij persoonlijk hebben beoordeeld waarmee het bedrijf heeft besloten te leven - het artefact waarnaar de meeste auditors als eerste zoeken" },
        { en: "A report from the CISO listing all risks that have been eliminated", de: "Ein Bericht des CISO, der alle beseitigten Risiken auflistet", nl: "Een rapport van de CISO met alle geëlimineerde risico's" },
        { en: "A legal waiver releasing the CEO from personal liability for known risks", de: "Ein rechtlicher Verzicht, der den CEO von der persönlichen Haftung für bekannte Risiken befreit", nl: "Een juridische vrijwaring die de CEO vrijstelt van persoonlijke aansprakelijkheid voor bekende risico's" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The residual risk acceptance is the artefact most CEOs miss and most auditors look for first. Your signature proves you personally reviewed what the company decided to live with.",
        de: "Die Restrisikoakzeptanz ist das Artefakt, das die meisten CEOs versaeumen und nach dem die meisten Auditoren zuerst suchen. Ihre Unterschrift belegt, dass Sie persönlich geprüft haben, womit das Unternehmen zu leben beschlossen hat.",
        nl: "De restrisico-acceptatie is het artefact dat de meeste CEO's missen en waarnaar de meeste auditors als eerste zoeken. Uw handtekening bewijst dat u persoonlijk heeft beoordeeld waarmee het bedrijf heeft besloten te leven.",
      },
    },
    {
      id: "5.1.3",
      question: {
        en: "What is the recommended ongoing cadence after the 90-day baseline is established?",
        de: "Welcher laufende Rhythmus wird empfohlen, nachdem die 90-Tage-Baseline etabliert ist?",
        nl: "Welk doorlopend ritme wordt aanbevolen nadat de 90-dagenbasislijn is vastgesteld?",
      },
      options: [
        { en: "Weekly CISO briefings, quarterly policy reviews, annual training", de: "Woechentliche CISO-Briefings, vierteljährliche Richtlinienprüfungen, jährliche Schulung", nl: "Wekelijkse CISO-briefings, kwartaallijkse beleidsbeoordelingen, jaarlijkse training" },
        { en: "Monthly CISO briefings, annual policy re-sign-off and risk register review, training refresher every three years", de: "Monatliche CISO-Briefings, jährliche Richtlinien-Neufreigabe und Risikoregister-Prüfung, Schulungsauffrischung alle drei Jahre", nl: "Maandelijkse CISO-briefings, jaarlijkse herondertekening beleid en beoordeling risicoregister, trainingsopfrissing elke drie jaar" },
        { en: "Daily status updates, monthly audits, annual board review", de: "Taegliche Statusberichte, monatliche Audits, jährliche Vorstandsprüfung", nl: "Dagelijkse statusupdates, maandelijkse audits, jaarlijkse bestuursreview" },
        { en: "No ongoing cadence is needed once the baseline is established", de: "Nach Etablierung der Baseline ist kein laufender Rhythmus erforderlich", nl: "Na de basislijn is geen doorlopend ritme nodig" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Monthly CISO briefing; annually: policy re-sign-off, risk register review with updated residual risk acceptance, management review; every three years: management body training refresher.",
        de: "Monatliches CISO-Briefing; jährlich: Richtlinien-Neufreigabe, Risikoregister-Prüfung mit aktualisierter Restrisikoakzeptanz, Management-Bewertung; alle drei Jahre: Schulungsauffrischung für das Leitungsorgan.",
        nl: "Maandelijkse CISO-briefing; jaarlijks: herondertekening beleid, beoordeling risicoregister met bijgewerkte restrisico-acceptatie, managementbeoordeling; elke drie jaar: trainingsopfrissing voor het leidinggevend orgaan.",
      },
    },
    {
      id: "5.1.4",
      question: {
        en: "Which three artefacts carry the most audit weight by day ninety?",
        de: "Welche drei Artefakte haben bis zum neunzigsten Tag das groesste Auditgewicht?",
        nl: "Welke drie artefacten hebben het meeste auditgewicht op dag negentig?",
      },
      options: [
        { en: "Insurance certificates, vendor contracts, and employee handbooks", de: "Versicherungszertifikate, Lieferantenvertraege und Mitarbeiterhandbuecher", nl: "Verzekeringscertificaten, leverancierscontracten en personeelshandboeken" },
        { en: "The signed top-level policy, the risk register with residual risk acceptance, and the evidence walk of the ten measures", de: "Die unterschriebene übergeordnete Richtlinie, das Risikoregister mit Restrisikoakzeptanz und der Evidenznachweis der zehn Maßnahmen", nl: "Het ondertekende overkoepelende beleid, het risicoregister met restrisico-acceptatie en het bewijs van de tien maatregelen" },
        { en: "The CISO's CV, the IT budget, and the incident log", de: "Der Lebenslauf des CISO, das IT-Budget und das Vorfallprotokoll", nl: "Het CV van de CISO, het IT-budget en het incidentlogboek" },
        { en: "The cyber insurance certificate, the D&O policy, and the registration confirmation", de: "Das Cyberversicherungszertifikat, die D&O-Police und die Registrierungsbestätigtung", nl: "Het cyberverzekeringscertificaat, de D&O-polis en de registratiebevestiging" },
      ],
      correctIndex: 1,
      explanation: {
        en: "By day ninety, you should have signed the top-level policy, the risk register with residual risk acceptance, and walked the ten measures with evidence.",
        de: "Bis zum neunzigsten Tag sollten Sie die übergeordnete Richtlinie unterschrieben, das Risikoregister mit Restrisikoakzeptanz unterzeichnet und die zehn Maßnahmen mit Evidenz durchlaufen haben.",
        nl: "Op dag negentig moet u het overkoepelende beleid hebben ondertekend, het risicoregister met restrisico-acceptatie, en de tien maatregelen met bewijs hebben doorlopen.",
      },
    },
  ],
});

export default quiz;
