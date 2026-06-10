import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.6",
  passingScore: 75,
  questions: [
    {
      id: "1.6.1",
      question: {
        en: "What three competence areas must the training cover under Article 20(2)?",
        de: "Welche drei Kompetenzbereiche muss die Schulung gemäß Artikel 20 Absatz 2 abdecken?",
        nl: "Welke drie competentiegebieden moet de training dekken op grond van Artikel 20(2)?",
      },
      options: [
        { en: "Budgeting, staffing, and vendor selection", de: "Budgetierung, Personalplanung und Lieferantenauswahl", nl: "Budgettering, personeelsplanning en leveranciersselectie" },
        { en: "Identifying risks, assessing the measures, and assessing their impact on services", de: "Risiken erkennen, die Maßnahmen bewerten und deren Auswirkungen auf die Dienste beurteilen", nl: "Risico's identificeren, de maatregelen beoordelen en de impact ervan op de diensten beoordelen" },
        { en: "Network security, endpoint security, and cloud security", de: "Netzwerksicherheit, Endgerätesicherheit und Cloud-Sicherheit", nl: "Netwerkbeveiliging, eindpuntbeveiliging en cloudbeveiliging" },
        { en: "Legal compliance, financial reporting, and data governance", de: "Rechtskonformität, Finanzberichterstattung und Daten-Governance", nl: "Juridische naleving, financiële rapportage en datagovernance" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 20(2) requires training to cover identifying risks, assessing the risk-management measures, and assessing their impact on the services the entity provides.",
        de: "Artikel 20 Absatz 2 verlangt, dass die Schulung das Erkennen von Risiken, die Bewertung der Risikomanagementmaßnahmen und die Beurteilung ihrer Auswirkungen auf die von der Einrichtung erbrachten Dienste abdeckt.",
        nl: "Artikel 20(2) vereist dat de training het identificeren van risico's, het beoordelen van de risicobeheermaatregelen en het beoordelen van de impact ervan op de door de entiteit verleende diensten omvat.",
      },
    },
    {
      id: "1.6.2",
      question: {
        en: "Can you send your CISO to attend the management training on your behalf?",
        de: "Können Sie Ihren CISO an Ihrer Stelle zur Geschäftsleitungsschulung schicken?",
        nl: "Kunt u uw CISO namens u naar de managementtraining sturen?",
      },
      options: [
        { en: "Yes, if the CISO reports back to you", de: "Ja, wenn der CISO Ihnen anschließend Bericht erstattet", nl: "Ja, als de CISO achteraf aan u rapporteert" },
        { en: "Yes, the CISO is the designated training delegate", de: "Ja, der CISO ist der vorgesehene Schulungsvertreter", nl: "Ja, de CISO is de aangewezen trainingsvertegenwoordiger" },
        { en: "No, the training duty is personal and non-delegable", de: "Nein, die Schulungspflicht ist persönlich und nicht delegierbar", nl: "Nee, de trainingsplicht is persoonlijk en niet delegeerbaar" },
        { en: "Only if the CISO is also a member of the management body", de: "Nur wenn der CISO auch Mitglied der Geschäftsleitung ist", nl: "Alleen als de CISO ook lid is van het leidinggevend orgaan" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The training duty is personal and non-delegable. You cannot send your CISO, your lawyer, or your assistant to attend on your behalf.",
        de: "Die Schulungspflicht ist persönlich und nicht delegierbar. Sie können nicht Ihren CISO, Ihren Anwalt oder Ihren Assistenten an Ihrer Stelle teilnehmen lassen.",
        nl: "De trainingsplicht is persoonlijk en niet delegeerbaar. U kunt niet uw CISO, uw advocaat of uw assistent namens u laten deelnemen.",
      },
    },
    {
      id: "1.6.3",
      question: {
        en: "What is the minimum training frequency in Germany?",
        de: "Was ist die Mindesthäufigkeit der Schulung in Deutschland?",
        nl: "Wat is de minimale trainingsfrequentie in Duitsland?",
      },
      options: [
        { en: "Every year, mandatory", de: "Jedes Jahr, verpflichtend", nl: "Elk jaar, verplicht" },
        { en: "Every three years at minimum, with annual recommended by the BSI", de: "Mindestens alle drei Jahre, wobei das BSI eine jährliche Schulung empfiehlt", nl: "Minimaal elke drie jaar, waarbij het BSI jaarlijks aanbeveelt" },
        { en: "Every five years", de: "Alle fünf Jahre", nl: "Elke vijf jaar" },
        { en: "Once, when you first take office", de: "Einmalig bei Amtsantritt", nl: "Eenmalig bij aantreden" },
      ],
      correctIndex: 1,
      explanation: {
        en: "In Germany, the floor is every three years; the BSI recommends annual in practice.",
        de: "In Deutschland liegt das Minimum bei drei Jahren; das BSI empfiehlt in der Praxis eine jährliche Schulung.",
        nl: "In Duitsland is het minimum elke drie jaar; het BSI beveelt in de praktijk jaarlijks aan.",
      },
    },
    {
      id: "1.6.4",
      question: {
        en: "How does the regulator judge the sufficiency of your training?",
        de: "Wie beurteilt die Aufsichtsbehörde die Angemessenheit Ihrer Schulung?",
        nl: "Hoe beoordeelt de toezichthouder de toereikendheid van uw training?",
      },
      options: [
        { en: "By verifying you passed a standardised exam", de: "Durch Überprüfung, ob Sie eine standardisierte Prüfung bestanden haben", nl: "Door te verifiëren of u een gestandaardiseerd examen hebt gehaald" },
        { en: "By checking which certification body issued your certificate", de: "Durch Prüfung, welche Zertifizierungsstelle Ihr Zertifikat ausgestellt hat", nl: "Door te controleren welke certificeringsinstantie uw certificaat heeft uitgegeven" },
        { en: "Based on content covered, time spent, and documentation retained", de: "Anhand der behandelten Inhalte, der aufgewendeten Zeit und der aufbewahrten Dokumentation", nl: "Op basis van behandelde inhoud, bestede tijd en bewaarde documentatie" },
        { en: "By interviewing your CISO about your knowledge", de: "Durch Befragung Ihres CISO über Ihren Wissensstand", nl: "Door uw CISO te ondervragen over uw kennis" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The regulator judges sufficiency based on three things: what was covered, for how long, and how it was documented.",
        de: "Die Aufsichtsbehörde beurteilt die Angemessenheit anhand von drei Kriterien: welche Inhalte behandelt wurden, wie lange die Schulung dauerte und wie sie dokumentiert wurde.",
        nl: "De bevoegde autoriteit beoordeelt de toereikendheid op basis van drie dingen: wat werd behandeld, hoe lang, en hoe het werd gedocumenteerd.",
      },
    },
  ],
});

export default quiz;
