import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.10",
  passingScore: 75,
  questions: [
    {
      id: "1.10.1",
      question: {
        en: "What does the 'all-hazards approach' in Article 21(1) require?",
        de: "Was verlangt der 'gefahrenübergreifende Ansatz' in Artikel 21 Absatz 1?",
        nl: "Wat vereist de 'all-hazards benadering' in artikel 21(1)?",
      },
      options: [
        { en: "Protection only against cyber attacks", de: "Schutz nur gegen Cyberangriffe", nl: "Bescherming alleen tegen cyberaanvallen" },
        { en: "Protection against every threat to the systems - cyber attacks, physical threats, environmental events, supplier failures, insider threats, and human error", de: "Schutz gegen jede Bedrohung der Systeme -- Cyberangriffe, physische Bedrohungen, Umweltereignisse, Lieferantenausfälle, Insider-Bedrohungen und menschliche Fehler", nl: "Bescherming tegen elke bedreiging voor de systemen — cyberaanvallen, fysieke bedreigingen, omgevingsgebeurtenissen, leveranciersuitval, interne bedreigingen en menselijke fouten" },
        { en: "Protection only against threats that have occurred before", de: "Schutz nur gegen Bedrohungen, die bereits aufgetreten sind", nl: "Bescherming alleen tegen bedreigingen die eerder zijn voorgekomen" },
        { en: "Protection only against threats listed in the company's risk register", de: "Schutz nur gegen Bedrohungen, die im Risikoregister des Unternehmens aufgeführt sind", nl: "Bescherming alleen tegen bedreigingen die zijn opgenomen in het risicoregister van de vennootschap" },
      ],
      correctIndex: 1,
      explanation: {
        en: "All-hazards means you must protect IT systems and their physical environment from every threat, not just hackers.",
        de: "Gefahrenübergreifend bedeutet, dass Sie IT-Systeme und deren physische Umgebung vor jeder Bedrohung schützen müssen, nicht nur vor Hackern.",
        nl: "All-hazards benadering betekent dat u IT-systemen en hun fysieke omgeving moet beschermen tegen elke bedreiging, niet alleen tegen hackers.",
      },
    },
    {
      id: "1.10.2",
      question: {
        en: "Against what point in time does the auditor judge whether controls meet the 'state of the art'?",
        de: "Zu welchem Zeitpunkt beurteilt der Prüfer, ob Kontrollen dem 'Stand der Technik' entsprechen?",
        nl: "Aan de hand van welk tijdstip beoordeelt de auditor of maatregelen voldoen aan de 'stand van de techniek'?",
      },
      options: [
        { en: "When the company was first founded", de: "Zum Zeitpunkt der Unternehmensgründung", nl: "Op het moment dat de vennootschap werd opgericht" },
        { en: "When the controls were first implemented", de: "Zum Zeitpunkt der erstmaligen Implementierung der Kontrollen", nl: "Op het moment dat de maatregelen voor het eerst werden geïmplementeerd" },
        { en: "The standards current at the time of the audit", de: "Die zum Zeitpunkt der Prüfung geltenden Standards", nl: "De normen die van kracht zijn op het moment van de audit" },
        { en: "The date the NIS2 Directive entered into force", de: "Das Datum des Inkrafttretens der NIS2-Richtlinie", nl: "De datum waarop de NIS2-richtlijn in werking is getreden" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The auditor judges against the standards current at the time of audit, not when you first implemented the controls.",
        de: "Der Prüfer beurteilt anhand der zum Prüfungszeitpunkt geltenden Standards, nicht anhand des Zeitpunkts, zu dem Sie die Kontrollen erstmals implementiert haben.",
        nl: "De auditor beoordeelt aan de hand van de normen die van kracht zijn op het moment van de audit, niet op het moment dat u de maatregelen voor het eerst heeft geïmplementeerd.",
      },
    },
    {
      id: "1.10.3",
      question: {
        en: "How often should controls be reviewed at minimum?",
        de: "Wie oft sollten Kontrollen mindestens überprüft werden?",
        nl: "Hoe vaak moeten maatregelen minimaal worden gereviewed?",
      },
      options: [
        { en: "Every five years", de: "Alle fünf Jahre", nl: "Elke vijf jaar" },
        { en: "Only when an incident occurs", de: "Nur wenn ein Vorfall eintritt", nl: "Alleen wanneer er een incident plaatsvindt" },
        { en: "Annually, and whenever relevant standards or business change significantly", de: "Jährlich sowie bei jeder wesentlichen Änderung relevanter Standards oder des Geschäftsbetriebs", nl: "Jaarlijks, en wanneer relevante normen of de bedrijfsvoering ingrijpend veranderen" },
        { en: "Once, at the time of initial implementation", de: "Einmalig zum Zeitpunkt der erstmaligen Implementierung", nl: "Eenmalig op het moment van eerste implementatie" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Your controls need a review cycle - at minimum annually, and whenever relevant standards or your business change significantly.",
        de: "Ihre Kontrollen benötigen einen Überprüfungszyklus -- mindestens jährlich sowie bei jeder wesentlichen Änderung relevanter Standards oder Ihres Geschäftsbetriebs.",
        nl: "Uw maatregelen hebben een reviewcyclus nodig — minimaal jaarlijks, en wanneer relevante normen of uw bedrijfsvoering ingrijpend veranderen.",
      },
    },
  ],
});

export default quiz;
