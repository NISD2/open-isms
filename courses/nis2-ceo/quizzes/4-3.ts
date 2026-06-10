import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.3",
  passingScore: 75,
  questions: [
    {
      id: "4.3.1",
      question: {
        en: "Who is the named insured under a cyber insurance policy?",
        de: "Wer ist die versicherte Person unter einer Cyberversicherungspolice?",
        nl: "Wie is de verzekerde onder een cyberverzekeringspolis?",
      },
      options: [
        { en: "The directors personally", de: "Die Geschaeftsfuehrer persönlich", nl: "De bestuurders persoonlijk" },
        { en: "The company", de: "Das Unternehmen", nl: "Het bedrijf" },
        { en: "Both the company and the directors", de: "Sowohl das Unternehmen als auch die Geschaeftsfuehrer", nl: "Zowel het bedrijf als de bestuurders" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Cyber insurance names the company as the insured. D&O insurance names the director. They are different products with different named insureds.",
        de: "Die Cyberversicherung benennt das Unternehmen als Versicherten. Die D&O-Versicherung benennt den Geschaeftsfuehrer. Es sind unterschiedliche Produkte mit unterschiedlichen Versicherten.",
        nl: "Een cyberverzekering noemt het bedrijf als verzekerde. Een D&O-verzekering noemt de bestuurder. Het zijn verschillende producten met verschillende verzekerden.",
      },
    },
    {
      id: "4.3.2",
      question: {
        en: "What happens when a director is sued personally for a cyber incident and the D&O policy has a cyber exclusion?",
        de: "Was passiert, wenn ein Geschaeftsfuehrer persönlich wegen eines Cybervorfalls verklagt wird und die D&O-Police einen Cyber-Ausschluss hat?",
        nl: "Wat gebeurt er wanneer een bestuurder persoonlijk wordt aangeklaagd voor een cyberincident en de D&O-polis een cyberuitsluiting heeft?",
      },
      options: [
        { en: "The cyber insurance covers the director instead", de: "Die Cyberversicherung deckt stattdessen den Geschaeftsfuehrer", nl: "De cyberverzekering dekt de bestuurder in plaats daarvan" },
        { en: "The director is uncovered - the D&O excludes cyber and the cyber policy does not cover individual directors", de: "Der Geschaeftsfuehrer ist unversichert - die D&O schliesst Cyber aus und die Cyberpolice deckt keine einzelnen Geschaeftsfuehrer", nl: "De bestuurder is ongedekt - de D&O sluit cyber uit en de cyberpolis dekt geen individuele bestuurders" },
        { en: "The company pays from its general liability insurance", de: "Das Unternehmen zahlt aus seiner allgemeinen Haftpflichtversicherung", nl: "Het bedrijf betaalt vanuit zijn algemene aansprakelijkheidsverzekering" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The D&O policy has a cyber exclusion, and the cyber policy explicitly does not cover individual directors. The director is uncovered in the gap between both policies.",
        de: "Die D&O-Police hat einen Cyber-Ausschluss und die Cyberpolice deckt ausdruecklich keine einzelnen Geschaeftsfuehrer. Der Geschaeftsfuehrer ist in der Lücke zwischen beiden Policen unversichert.",
        nl: "De D&O-polis heeft een cyberuitsluiting en de cyberpolis dekt expliciet geen individuele bestuurders. De bestuurder is ongedekt in de kloof tussen beide polissen.",
      },
    },
    {
      id: "4.3.3",
      question: {
        en: "What should your broker be able to produce according to the lesson?",
        de: "Was sollte Ihr Makler laut der Lektion erstellen koennen?",
        nl: "Wat moet uw verzekeringsmakelaar kunnen produceren volgens de les?",
      },
      options: [
        { en: "A detailed cost comparison of all available policies", de: "Einen detaillierten Kostenvergleich aller verfügbaren Policen", nl: "Een gedetailleerde kostenvergelijking van alle beschikbare polissen" },
        { en: "A one-page map of which claim scenarios are covered by which policy", de: "Eine einseitige Uebersicht, welche Schadensszenarien von welcher Police abgedeckt werden", nl: "Een éénpagina-overzicht van welke claimscenario's door welke polis worden gedekt" },
        { en: "A legal opinion on NIS2 compliance", de: "Ein Rechtsgutachten zur NIS2-Compliance", nl: "Een juridisch advies over NIS2-naleving" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Your broker should produce a one-page map of which claim scenarios each policy covers. If it shows a gap in the personal liability column, that gap sits on your personal balance sheet uninsured.",
        de: "Ihr Makler sollte eine einseitige Uebersicht erstellen, welche Schadensszenarien von welcher Police abgedeckt werden. Wenn dort eine Lücke in der Spalte für persönliche Haftung erscheint, liegt dieses Risiko unversichert auf Ihrer privaten Bilanz.",
        nl: "Uw makelaar moet een éénpagina-overzicht produceren van welke claimscenario's elke polis dekt. Als er een kloof zichtbaar is in de kolom voor persoonlijke aansprakelijkheid, staat dat risico onverzekerd op uw persoonlijke balans.",
      },
    },
  ],
});

export default quiz;
