import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.7",
  passingScore: 75,
  questions: [
    {
      id: "1.7.1",
      question: {
        en: "Who brings the personal civil liability claim against a director under national corporate law?",
        de: "Wer erhebt die persönliche zivilrechtliche Haftungsklage gegen einen Geschäftsleiter nach nationalem Gesellschaftsrecht?",
        nl: "Wie dient de persoonlijke civielrechtelijke aansprakelijkheidsvordering in tegen een bestuurder op grond van nationaal vennootschapsrecht?",
      },
      options: [
        { en: "The national regulator (BSI in Germany)", de: "Die nationale Aufsichtsbehörde (BSI in Deutschland)", nl: "De nationale toezichthouder (BSI in Duitsland)" },
        { en: "The European Commission", de: "Die Europäische Kommission", nl: "De Europese Commissie" },
        { en: "The company itself, through its shareholders or supervisory board", de: "Das Unternehmen selbst, vertreten durch seine Gesellschafter oder den Aufsichtsrat", nl: "De vennootschap zelf, via haar aandeelhouders of de raad van commissarissen" },
        { en: "The employees affected by the incident", de: "Die vom Vorfall betroffenen Mitarbeitenden", nl: "De medewerkers die door het incident zijn getroffen" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The claim comes from your own organisation - through the shareholders or the supervisory board - not from the regulator.",
        de: "Die Klage kommt aus Ihrer eigenen Organisation -- von den Gesellschaftern oder dem Aufsichtsrat -- nicht von der Aufsichtsbehörde.",
        nl: "De vordering komt vanuit uw eigen organisatie — via de aandeelhouders of de raad van commissarissen — niet van de toezichthouder.",
      },
    },
    {
      id: "1.7.2",
      question: {
        en: "What does the reverse burden of proof mean for directors in Germany?",
        de: "Was bedeutet die Beweislastumkehr für Geschäftsleiter in Deutschland?",
        nl: "Wat betekent de omgekeerde bewijslast voor bestuurders in Duitsland?",
      },
      options: [
        { en: "The regulator must prove the director was negligent", de: "Die Aufsichtsbehörde muss nachweisen, dass der Geschäftsleiter fahrlässig gehandelt hat", nl: "De toezichthouder moet aantonen dat de bestuurder nalatig heeft gehandeld" },
        { en: "The director must prove they acted carefully, rather than the company proving negligence", de: "Der Geschäftsleiter muss beweisen, dass er sorgfältig gehandelt hat, anstatt dass das Unternehmen Fahrlässigkeit nachweisen muss", nl: "De bestuurder moet bewijzen dat hij zorgvuldig heeft gehandeld, in plaats van dat de vennootschap nalatigheid moet aantonen" },
        { en: "The burden of proof does not apply to NIS2 cases", de: "Die Beweislast gilt nicht für NIS2-Fälle", nl: "De bewijslast geldt niet voor NIS2-zaken" },
        { en: "The director is automatically cleared if the company has cyber insurance", de: "Der Geschäftsleiter wird automatisch entlastet, wenn das Unternehmen eine Cyberversicherung hat", nl: "De bestuurder is automatisch gevrijwaard als de vennootschap een cyberverzekering heeft" },
      ],
      correctIndex: 1,
      explanation: {
        en: "In Germany, the reverse burden of proof means the company does not have to prove you were careless - you have to prove you were careful.",
        de: "In Deutschland bedeutet die Beweislastumkehr, dass das Unternehmen nicht beweisen muss, dass Sie nachlässig waren -- Sie müssen beweisen, dass Sie sorgfältig gehandelt haben.",
        nl: "In Duitsland betekent de omgekeerde bewijslast dat de vennootschap niet hoeft aan te tonen dat u onzorgvuldig was — u moet bewijzen dat u zorgvuldig heeft gehandeld.",
      },
    },
    {
      id: "1.7.3",
      question: {
        en: "What documentation does the lesson describe as evidence of due care?",
        de: "Welche Dokumentation beschreibt die Lektion als Nachweis der Sorgfaltspflicht?",
        nl: "Welke documentatie beschrijft de les als bewijs van zorgvuldige naleving?",
      },
      options: [
        { en: "Vendor invoices and IT budget reports", de: "Lieferantenrechnungen und IT-Budgetberichte", nl: "Leveranciersfacturen en IT-budgetrapporten" },
        { en: "The dated sign-off, training record, meeting minutes, and risk register with your signature", de: "Die datierte Freigabe, der Schulungsnachweis, die Sitzungsprotokolle und das Risikoregister mit Ihrer Unterschrift", nl: "De gedateerde goedkeuring, het opleidingsregistratie, de notulen en het risicoregister met uw handtekening" },
        { en: "Annual financial statements and tax filings", de: "Jahresabschlüsse und Steuererklärungen", nl: "Jaarrekeningen en belastingaangiften" },
        { en: "Insurance policy documents and broker correspondence", de: "Versicherungspolicen und Maklerkorrespondenz", nl: "Verzekeringspolissen en makelaarskorrespondentie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The dated sign-off, the training record, the meeting minutes, the risk register with your signature - those are the evidence you use to prove due care.",
        de: "Die datierte Freigabe, der Schulungsnachweis, die Sitzungsprotokolle, das Risikoregister mit Ihrer Unterschrift -- das sind die Nachweise, mit denen Sie die Einhaltung Ihrer Sorgfaltspflicht belegen.",
        nl: "De gedateerde goedkeuring, het opleidingsregistratie, de notulen, het risicoregister met uw handtekening — dat is het bewijs waarmee u aantoont dat u zorgvuldig heeft gehandeld.",
      },
    },
  ],
});

export default quiz;
