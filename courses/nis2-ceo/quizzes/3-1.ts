import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.1",
  passingScore: 75,
  questions: [
    {
      id: "3.1.1",
      question: {
        en: "How many structured question areas does the BSI use to test a CEO's cybersecurity knowledge?",
        de: "Wie viele strukturierte Fragenbereiche verwendet das BSI, um das Cybersicherheitswissen eines CEO zu prüfen?",
        nl: "Hoeveel gestructureerde vraaggebieden gebruikt het BSI om de cybersecuritykennis van een CEO te toetsen?",
      },
      options: [
        { en: "Five", de: "Fünf", nl: "Vijf" },
        { en: "Ten", de: "Zehn", nl: "Tien" },
        { en: "Fifteen", de: "Fünfzehn", nl: "Vijftien" },
        { en: "Twenty", de: "Zwanzig", nl: "Twintig" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The BSI organises its test into ten areas - five foundation questions, one area with ten sub-questions on the mandatory measures, and four deeper checks.",
        de: "Das BSI gliedert seinen Test in zehn Bereiche - fünf Grundlagenfragen, einen Bereich mit zehn Unterfragen zu den Pflichtmaßnahmen und vier vertiefende Prüfungen.",
        nl: "Het BSI organiseert zijn toets in tien gebieden - vijf basisvragen, één gebied met tien deelvragen over de verplichte maatregelen, en vier diepgaandere controles.",
      },
    },
    {
      id: "3.1.2",
      question: {
        en: "What is the legal basis for the requirement that CEOs must be trained in cybersecurity?",
        de: "Was ist die Rechtsgrundlage für die Pflicht zur Cybersicherheitsschulung der Geschäftsführung?",
        nl: "Wat is de wettelijke grondslag voor de verplichting dat CEO's een opleiding in cybersecurity moeten volgen?",
      },
      options: [
        { en: "Article 21 of the NIS2 Directive", de: "Artikel 21 der NIS2-Richtlinie", nl: "Artikel 21 van de NIS2-richtlijn" },
        { en: "Article 20(2) of the NIS2 Directive", de: "Artikel 20 Absatz 2 der NIS2-Richtlinie", nl: "Artikel 20, lid 2 van de NIS2-richtlijn" },
        { en: "Article 23 of the NIS2 Directive", de: "Artikel 23 der NIS2-Richtlinie", nl: "Artikel 23 van de NIS2-richtlijn" },
        { en: "BSI-Standard 200-1", de: "BSI-Standard 200-1", nl: "BSI-Standard 200-1" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 20(2) states that members of management bodies of essential and important entities are required to follow training.",
        de: "Artikel 20 Absatz 2 legt fest, dass Mitglieder der Leitungsorgane wesentlicher und wichtiger Einrichtungen an Schulungen teilnehmen müssen.",
        nl: "Artikel 20, lid 2 bepaalt dat leden van het leidinggevend orgaan van essentiële en belangrijke entiteiten verplicht zijn een opleiding te volgen.",
      },
    },
    {
      id: "3.1.3",
      question: {
        en: "What should you do with the BSI's question list according to the lesson?",
        de: "Was sollten Sie laut der Lektion mit der Fragenliste des BSI tun?",
        nl: "Wat moet u volgens de les doen met de vragenlijst van het BSI?",
      },
      options: [
        { en: "Submit it to the regulator as proof of compliance", de: "Sie bei der Aufsichtsbehörde als Compliance-Nachweis einreichen", nl: "Indienen bij de toezichthouder als bewijs van naleving" },
        { en: "Print it and rate each question with your CISO as confident, with help, or cannot answer", de: "Ausdrucken und gemeinsam mit Ihrem CISO jede Frage als sicher, mit Hilfe oder nicht beantwortbar bewerten", nl: "Afdrukken en met uw CISO elke vraag beoordelen als zeker, met hulp, of niet te beantwoorden" },
        { en: "Delegate it to your IT department for review", de: "An Ihre IT-Abteilung zur Prüfung delegieren", nl: "Delegeren aan uw IT-afdeling ter beoordeling" },
        { en: "File it as part of your annual audit documentation", de: "Als Teil Ihrer jährlichen Auditdokumentation ablegen", nl: "Opslaan als onderdeel van uw jaarlijkse auditdocumentatie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The lesson advises printing the questions and going through them with your CISO, rating each as confident, with help, or cannot answer - every question in the third column is a gap your training must close.",
        de: "Die Lektion empfiehlt, die Fragen auszudrucken und mit Ihrem CISO durchzugehen, wobei jede als sicher, mit Hilfe oder nicht beantwortbar eingestuft wird - jede Frage in der dritten Spalte ist eine Lücke, die Ihre Schulung schließen muss.",
        nl: "De les adviseert de vragen af te drukken en met uw CISO door te nemen, waarbij elke vraag wordt beoordeeld als zeker, met hulp, of niet te beantwoorden - elke vraag in de derde kolom is een lacune die uw opleiding moet dichten.",
      },
    },
    {
      id: "3.1.4",
      question: {
        en: "Are the BSI's structured questions legally binding?",
        de: "Sind die strukturierten Fragen des BSI rechtlich bindend?",
        nl: "Zijn de gestructureerde vragen van het BSI juridisch bindend?",
      },
      options: [
        { en: "Yes, they are part of the NIS2 Directive", de: "Ja, sie sind Teil der NIS2-Richtlinie", nl: "Ja, ze maken deel uit van de NIS2-richtlijn" },
        { en: "Yes, they are part of German national law", de: "Ja, sie sind Teil des deutschen Bundesrechts", nl: "Ja, ze maken deel uit van het Duitse nationale recht" },
        { en: "No, but they are the published baseline every European regulator will use", de: "Nein, aber sie sind der veröffentlichte Maßstab, den jede europäische Aufsichtsbehörde verwenden wird", nl: "Nee, maar ze zijn de gepubliceerde standaard die elke Europese toezichthouder zal hanteren" },
        { en: "No, they are only relevant for Essential entities", de: "Nein, sie gelten nur für wesentliche Einrichtungen", nl: "Nee, ze zijn alleen relevant voor essentiële entiteiten" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The questions are not legally binding, but they are the published baseline every European regulator will use to judge whether a CEO has sufficient knowledge under Article 20(2).",
        de: "Die Fragen sind nicht rechtlich bindend, aber sie sind der veröffentlichte Maßstab, anhand dessen jede europäische Aufsichtsbehörde beurteilen wird, ob ein CEO über ausreichendes Wissen gemäß Artikel 20 Absatz 2 verfügt.",
        nl: "De vragen zijn niet juridisch bindend, maar ze vormen de gepubliceerde standaard die elke Europese toezichthouder zal gebruiken om te beoordelen of een CEO over voldoende kennis beschikt op grond van artikel 20, lid 2.",
      },
    },
  ],
});

export default quiz;
