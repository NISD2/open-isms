import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.1",
  passingScore: 75,
  questions: [
    {
      id: "4.1.1",
      question: {
        en: "Does Article 21 of the NIS2 Directive list insurance as one of the ten required measures?",
        de: "Listet Artikel 21 der NIS2-Richtlinie Versicherung als eine der zehn geforderten Maßnahmen auf?",
        nl: "Vermeldt artikel 21 van de NIS2-richtlijn verzekering als een van de tien vereiste maatregelen?",
      },
      options: [
        { en: "Yes, insurance is listed as the tenth measure", de: "Ja, Versicherung ist als zehnte Maßnahme aufgeführt", nl: "Ja, verzekering staat vermeld als de tiende maatregel" },
        { en: "No, the word insurance does not appear in the ten measures", de: "Nein, das Wort Versicherung kommt in den zehn Maßnahmen nicht vor", nl: "Nee, het woord verzekering komt niet voor in de tien maatregelen" },
        { en: "Insurance is listed as an optional additional measure", de: "Versicherung ist als optionale zusätzliche Maßnahme aufgeführt", nl: "Verzekering staat vermeld als een optionele aanvullende maatregel" },
        { en: "Yes, but only for Essential entities", de: "Ja, aber nur für wesentliche Einrichtungen", nl: "Ja, maar alleen voor essentiële entiteiten" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 21 lists ten measures you must have in place. Nowhere in those ten measures does the word 'insurance' appear.",
        de: "Artikel 21 listet zehn Maßnahmen auf, die Sie umsetzen müssen. In keiner dieser zehn Maßnahmen kommt das Wort 'Versicherung' vor.",
        nl: "Artikel 21 bevat een lijst van tien maatregelen die u moet hebben geïmplementeerd. Nergens in die tien maatregelen komt het woord 'verzekering' voor.",
      },
    },
    {
      id: "4.1.2",
      question: {
        en: "According to the BSI guidance referenced in the lesson, is risk transfer (including insurance) an acceptable treatment for serious risks at NIS2-covered entities?",
        de: "Ist laut der im Kurs referenzierten BSI-Empfehlung Risikotransfer (einschließlich Versicherung) eine akzeptable Behandlung für schwerwiegende Risiken bei NIS2-betroffenen Einrichtungen?",
        nl: "Is risicooverdracht (inclusief verzekering) volgens de BSI-richtlijnen waarnaar in de les wordt verwezen een aanvaardbare behandeling voor ernstige risico's bij NIS2-entiteiten?",
      },
      options: [
        { en: "Yes, risk transfer is always acceptable", de: "Ja, Risikotransfer ist immer akzeptabel", nl: "Ja, risicooverdracht is altijd aanvaardbaar" },
        { en: "Yes, but only if combined with other controls", de: "Ja, aber nur in Kombination mit anderen Kontrollen", nl: "Ja, maar alleen in combinatie met andere beheersmaatregelen" },
        { en: "No, the BSI guidance explicitly says risk transfer is not acceptable for serious risks", de: "Nein, die BSI-Empfehlung sagt ausdrücklich, dass Risikotransfer für schwerwiegende Risiken nicht akzeptabel ist", nl: "Nee, de BSI-richtlijnen stellen uitdrukkelijk dat risicooverdracht niet aanvaardbaar is voor ernstige risico's" },
        { en: "It depends on the size of the company", de: "Es hängt von der Größe des Unternehmens ab", nl: "Het hangt af van de omvang van het bedrijf" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The BSI guidance explicitly says risk transfer - including insurance - is not an acceptable treatment for serious risks at NIS2-covered entities.",
        de: "Die BSI-Empfehlung sagt ausdrücklich, dass Risikotransfer - einschließlich Versicherung - keine akzeptable Behandlung für schwerwiegende Risiken bei NIS2-betroffenen Einrichtungen ist.",
        nl: "De BSI-richtlijnen stellen uitdrukkelijk dat risicooverdracht - inclusief cyberverzekering - geen aanvaardbare behandeling is voor ernstige risico's bij NIS2-entiteiten.",
      },
    },
    {
      id: "4.1.3",
      question: {
        en: "Which three consequences does insurance NOT remove according to the lesson?",
        de: "Welche drei Konsequenzen beseitigt Versicherung laut der Lektion NICHT?",
        nl: "Welke drie gevolgen neemt verzekering NIET weg, volgens de les?",
      },
      options: [
        { en: "Business interruption, data loss, and reputational damage", de: "Betriebsunterbrechung, Datenverlust und Reputationsschaden", nl: "Bedrijfsonderbreking, gegevensverlies en reputatieschade" },
        { en: "Regulatory fines, the manager ban, and the customer notification duty", de: "Regulatorische Bußgelder, das Geschäftsführungsverbot und die Kundenbenachrichtigungspflicht", nl: "Regulatoire boetes, het beheerdersverbod en de klantmeldingsplicht" },
        { en: "Legal costs, forensic investigation, and incident response", de: "Rechtskosten, forensische Untersuchung und Vorfallreaktion", nl: "Juridische kosten, forensisch onderzoek en incidentrespons" },
        { en: "Staff turnover, supply chain disruption, and media coverage", de: "Personalfluktuation, Lieferkettenunterbrechung und Medienberichterstattung", nl: "Personeelsverloop, verstoring van de toeleveringsketen en media-aandacht" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Insurance does not remove regulatory fines under Article 32, the manager ban under Article 34, or the customer notification duty under Article 36.",
        de: "Versicherung beseitigt weder regulatorische Bußgelder gemäß Artikel 32, noch das Geschäftsführungsverbot gemäß Artikel 34, noch die Kundenbenachrichtigungspflicht gemäß Artikel 36.",
        nl: "Verzekering neemt regulatoire boetes op grond van artikel 32, het beheerdersverbod op grond van artikel 34 en de klantmeldingsplicht op grond van artikel 36 niet weg.",
      },
    },
    {
      id: "4.1.4",
      question: {
        en: "Why did Zurich Insurance refuse the Mondelez claim after the NotPetya attack?",
        de: "Warum hat Zurich Insurance den Anspruch von Mondelez nach dem NotPetya-Angriff abgelehnt?",
        nl: "Waarom weigerde Zurich Insurance de claim van Mondelez na de NotPetya-aanval?",
      },
      options: [
        { en: "Mondelez had not paid its premium", de: "Mondelez hatte seine Prämie nicht bezahlt", nl: "Mondelez had zijn premie niet betaald" },
        { en: "Zurich argued NotPetya was an act of war", de: "Zurich argumentierte, NotPetya sei ein Kriegsakt gewesen", nl: "Zurich betoogde dat NotPetya een oorlogsdaad was" },
        { en: "The policy had expired before the attack", de: "Die Police war vor dem Angriff abgelaufen", nl: "De polis was vóór de aanval verlopen" },
        { en: "The damages exceeded the policy limit", de: "Die Schäden überstiegen die Deckungssumme", nl: "De schade overschreed het polislimiet" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Zurich refused the claim, arguing NotPetya was an act of war - a single exclusion clause decided the outcome of a roughly one hundred million dollar claim.",
        de: "Zurich lehnte den Anspruch ab und argumentierte, NotPetya sei ein Kriegsakt gewesen - eine einzige Ausschlussklausel entschied über den Ausgang eines Anspruchs von rund hundert Millionen Dollar.",
        nl: "Zurich weigerde de claim en betoogde dat NotPetya een oorlogsdaad was - één enkele uitsluitingsclausule bepaalde de uitkomst van een claim van ongeveer honderd miljoen dollar.",
      },
    },
  ],
});

export default quiz;
