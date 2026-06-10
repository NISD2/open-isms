import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.11",
  passingScore: 75,
  questions: [
    {
      id: "2.11.1",
      question: {
        en: "What is the difference between KPIs and KRIs?",
        de: "Was ist der Unterschied zwischen KPIs und KRIs?",
        nl: "Wat is het verschil tussen KPI's en KRI's?",
      },
      options: [
        { en: "KPIs measure costs; KRIs measure revenue", de: "KPIs messen Kosten; KRIs messen Umsatz", nl: "KPI's meten kosten; KRI's meten omzet" },
        { en: "KPIs measure how well a process is running; KRIs measure how much risk the company is carrying", de: "KPIs messen, wie gut ein Prozess funktioniert; KRIs messen, wie viel Risiko das Unternehmen trägt", nl: "KPI's meten hoe goed een proces verloopt; KRI's meten hoeveel risico het bedrijf draagt" },
        { en: "KPIs are for the CISO; KRIs are for the CEO", de: "KPIs sind für den CISO; KRIs sind für den CEO", nl: "KPI's zijn voor de CISO; KRI's zijn voor de CEO" },
        { en: "KPIs are mandatory; KRIs are optional under NIS2", de: "KPIs sind verpflichtend; KRIs sind unter NIS2 optional", nl: "KPI's zijn verplicht; KRI's zijn optioneel onder NIS2" },
      ],
      correctIndex: 1,
      explanation: {
        en: "KPIs (Key Performance Indicators) measure process performance (e.g. patch-on-time rate); KRIs (Key Risk Indicators) measure current risk exposure (e.g. open critical vulnerabilities).",
        de: "KPIs (Key Performance Indicators) messen die Prozessleistung (z. B. fristgerechte Patch-Rate); KRIs (Key Risk Indicators) messen die aktuelle Risikoexposition (z. B. offene kritische Schwachstellen).",
        nl: "KPI's (Key Performance Indicators) meten procesprestaties (bijv. tijdige patchrate); KRI's (Key Risk Indicators) meten de huidige risicoblootstelling (bijv. openstaande kritieke kwetsbaarheden).",
      },
    },
    {
      id: "2.11.2",
      question: {
        en: "What is the auditor's first question when checking Measure 6?",
        de: "Was ist die erste Frage des Auditors bei der Prüfung von Maßnahme 6?",
        nl: "Wat is de eerste vraag van de auditor bij de controle van Maatregel 6?",
      },
      options: [
        { en: "Show me your KPI dashboard", de: "Zeigen Sie mir Ihr KPI-Dashboard", nl: "Laat me uw KPI-dashboard zien" },
        { en: "Show me the protocol of your last annual management review and the follow-up actions from the previous year", de: "Zeigen Sie mir das Protokoll Ihrer letzten jährlichen Managementbewertung und die Folgemaßnahmen aus dem Vorjahr", nl: "Laat me het verslag van uw laatste jaarlijkse managementbeoordeling zien en de opvolgacties van het voorgaande jaar" },
        { en: "Show me your security budget", de: "Zeigen Sie mir Ihr Sicherheitsbudget", nl: "Laat me uw beveiligingsbudget zien" },
        { en: "Show me the CISO's quarterly report", de: "Zeigen Sie mir den Quartalsbericht des CISO", nl: "Laat me het kwartaalrapport van de CISO zien" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The auditor tests Measure 6 by asking for the management review protocol and whether follow-up actions were closed - not the KPIs themselves.",
        de: "Der Auditor prüft Maßnahme 6, indem er nach dem Managementbewertungsprotokoll und dem Abschluss der Folgemaßnahmen fragt - nicht nach den KPIs selbst.",
        nl: "De auditor toetst Maatregel 6 door te vragen naar het managementbeoordelingsverslag en of de opvolgacties zijn afgerond - niet naar de KPI's zelf.",
      },
    },
    {
      id: "2.11.3",
      question: {
        en: "What happens if the management review protocol does not exist?",
        de: "Was passiert, wenn das Managementbewertungsprotokoll nicht existiert?",
        nl: "Wat gebeurt er als het managementbeoordelingsverslag niet bestaat?",
      },
      options: [
        { en: "The auditor accepts KPI data as a substitute", de: "Der Auditor akzeptiert KPI-Daten als Ersatz", nl: "De auditor accepteert KPI-gegevens als vervanging" },
        { en: "The whole of Measure 6 fails the audit regardless of how good the numbers are", de: "Die gesamte Maßnahme 6 besteht das Audit nicht, unabhängig davon wie gut die Zahlen sind", nl: "De gehele Maatregel 6 zakt voor de audit, ongeacht hoe goed de cijfers zijn" },
        { en: "The CISO can produce a retrospective summary", de: "Der CISO kann eine nachträgliche Zusammenfassung erstellen", nl: "De CISO kan een terugblikkende samenvatting opstellen" },
        { en: "The company gets a warning but passes the audit", de: "Das Unternehmen erhält eine Warnung, besteht aber das Audit", nl: "Het bedrijf krijgt een waarschuwing maar slaagt voor de audit" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Without a dated, signed protocol, the management review never happened in the auditor's eyes - the entire measure fails.",
        de: "Ohne ein datiertes, unterschriebenes Protokoll hat die Managementbewertung in den Augen des Auditors nie stattgefunden - die gesamte Maßnahme fällt durch.",
        nl: "Zonder een gedateerd, ondertekend verslag heeft de managementbeoordeling in de ogen van de auditor nooit plaatsgevonden - de gehele maatregel zakt.",
      },
    },
  ],
});

export default quiz;
