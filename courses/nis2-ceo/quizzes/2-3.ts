import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.3",
  passingScore: 75,
  questions: [
    {
      id: "2.3.1",
      question: {
        en: "What are the four risk treatment options?",
        de: "Welche vier Risikobehandlungsoptionen gibt es?",
        nl: "Wat zijn de vier opties voor risicobehandeling?",
      },
      options: [
        { en: "Detect, respond, recover, report", de: "Erkennen, reagieren, wiederherstellen, melden", nl: "Detecteren, reageren, herstellen, melden" },
        { en: "Avoid, mitigate, transfer, accept", de: "Vermeiden, mindern, übertragen, akzeptieren", nl: "Vermijden, beperken, overdragen, accepteren" },
        { en: "Identify, analyse, treat, monitor", de: "Identifizieren, analysieren, behandeln, überwachen", nl: "Identificeren, analyseren, behandelen, monitoren" },
        { en: "Prevent, insure, outsource, ignore", de: "Verhindern, versichern, auslagern, ignorieren", nl: "Voorkomen, verzekeren, uitbesteden, negeren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The four options are avoid, mitigate, transfer, and accept - and for NIS2 entities, mitigate is the workhorse for serious risks.",
        de: "Die vier Optionen sind vermeiden, mindern, übertragen und akzeptieren - und für NIS2-Einrichtungen ist das Mindern die wichtigste Option bei schwerwiegenden Risiken.",
        nl: "De vier opties zijn vermijden, beperken, overdragen en accepteren - en voor NIS2-entiteiten is beperken de voornaamste optie voor ernstige risico's.",
      },
    },
    {
      id: "2.3.2",
      question: {
        en: "Which document does CIR 2024/2690 Annex 2.1.1 require the management body to personally accept?",
        de: "Welches Dokument verlangt DVO 2024/2690 Anhang 2.1.1 zur persönlichen Akzeptanz durch das Leitungsorgan?",
        nl: "Welk document moet het leidinggevend orgaan volgens CIR 2024/2690 Bijlage 2.1.1 persoonlijk accepteren?",
      },
      options: [
        { en: "The risk matrix", de: "Die Risikomatrix", nl: "De risicomatrix" },
        { en: "The signed residual risk acceptance", de: "Die unterschriebene Restrisiko-Akzeptanz", nl: "De ondertekende acceptatie van het restrisico" },
        { en: "The information security policy", de: "Die Informationssicherheitsrichtlinie", nl: "Het informatiebeveiligingsbeleid" },
        { en: "The asset inventory", de: "Das Asset-Inventar", nl: "Het asset-inventaris" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CIR 2024/2690 Annex 2.1.1 requires the management body to personally accept each residual risk - without the signed acceptance, the rest of risk management is treated as unapproved.",
        de: "DVO 2024/2690 Anhang 2.1.1 verlangt, dass das Leitungsorgan jedes Restrisiko persönlich akzeptiert - ohne unterschriebene Akzeptanz wird der Rest des Risikomanagements als nicht genehmigt behandelt.",
        nl: "CIR 2024/2690 Bijlage 2.1.1 vereist dat het leidinggevend orgaan elk restrisico persoonlijk accepteert - zonder ondertekende acceptatie wordt de rest van het risicobeheer als niet-goedgekeurd behandeld.",
      },
    },
    {
      id: "2.3.3",
      question: {
        en: "Who sets the risk appetite - the level of risk the company is willing to live with?",
        de: "Wer legt den Risikoappetit fest - das Risikoniveau, das das Unternehmen bereit ist zu tragen?",
        nl: "Wie stelt de risicobereidheid vast - het risiconiveau dat het bedrijf bereid is te accepteren?",
      },
      options: [
        { en: "The CISO", de: "Der CISO", nl: "De CISO" },
        { en: "The auditor", de: "Der Auditor", nl: "De auditor" },
        { en: "The CEO / management body", de: "Der CEO / die Geschäftsleitung", nl: "De CEO / het bestuur" },
        { en: "The IT department", de: "Die IT-Abteilung", nl: "De IT-afdeling" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The risk appetite is the CEO's boundary, not the CISO's - it must be written down so the CISO can operate within it.",
        de: "Der Risikoappetit ist die Vorgabe des CEO, nicht des CISO - er muss schriftlich festgehalten werden, damit der CISO innerhalb dieses Rahmens handeln kann.",
        nl: "De risicobereidheid is de grens van de CEO, niet die van de CISO - die moet schriftelijk worden vastgelegd zodat de CISO er binnen kan opereren.",
      },
    },
    {
      id: "2.3.4",
      question: {
        en: "Why are 'transfer' and 'accept' rarely defensible for serious risks under NIS2?",
        de: "Warum sind 'Übertragen' und 'Akzeptieren' bei schwerwiegenden Risiken unter NIS2 selten vertretbar?",
        nl: "Waarom zijn 'overdragen' en 'accepteren' zelden verdedigbaar voor ernstige risico's onder NIS2?",
      },
      options: [
        { en: "Because insurance is too expensive for NIS2 entities", de: "Weil Versicherungen für NIS2-Einrichtungen zu teuer sind", nl: "Omdat verzekeringen te duur zijn voor NIS2-entiteiten" },
        { en: "Because the regulator cares whether the service is running and controls are in place, not whether you are insured", de: "Weil es der Aufsichtsbehörde darum geht, ob der Dienst läuft und Maßnahmen umgesetzt sind, nicht ob Sie versichert sind", nl: "Omdat de toezichthouder wil weten of de dienst draait en de maatregelen aanwezig zijn, niet of u verzekerd bent" },
        { en: "Because only the CISO can decide to transfer or accept a risk", de: "Weil nur der CISO entscheiden kann, ein Risiko zu übertragen oder zu akzeptieren", nl: "Omdat alleen de CISO kan beslissen een risico over te dragen of te accepteren" },
        { en: "Because the CIR explicitly bans both options", de: "Weil die CIR beide Optionen ausdrücklich verbietet", nl: "Omdat de CIR beide opties uitdrukkelijk verbiedt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The regulator does not care that you are insured - they care whether the service is running and the controls are in place.",
        de: "Der Aufsichtsbehörde ist es gleichgültig, ob Sie versichert sind - sie prüft, ob der Dienst funktioniert und die Maßnahmen umgesetzt sind.",
        nl: "De toezichthouder geeft er niet om of u verzekerd bent - zij controleren of de dienst functioneert en de maatregelen van kracht zijn.",
      },
    },
  ],
});

export default quiz;
