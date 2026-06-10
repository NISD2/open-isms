import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.2",
  passingScore: 75,
  questions: [
    {
      id: "4.2.1",
      question: {
        en: "What type of claims was D&O insurance originally designed to protect directors from?",
        de: "Vor welcher Art von Anspruechen sollte die D&O-Versicherung Geschaeftsfuehrer urspruenglich schuetzen?",
        nl: "Tegen welk type claims was D&O-verzekering oorspronkelijk bedoeld om bestuurders te beschermen?",
      },
      options: [
        { en: "Cyber incident claims", de: "Ansprueche aus Cybervorfaellen", nl: "Claims uit cyberincidenten" },
        { en: "Business judgment claims (allegations of mismanagement)", de: "Ansprueche aus Geschaeftsentscheidungen (Vorwuerfe der Misswirtschaft)", nl: "Claims over bedrijfsbeslissingen (beschuldigingen van wanbestuur)" },
        { en: "Regulatory fines and penalties", de: "Regulatorische Bussgelder und Strafen", nl: "Regulatoire boetes en sancties" },
        { en: "Employee lawsuits", de: "Arbeitnehmerklagen", nl: "Rechtszaken van werknemers" },
      ],
      correctIndex: 1,
      explanation: {
        en: "D&O insurance was designed to protect directors from claims of mismanagement - the allegation that a director made a bad business decision.",
        de: "Die D&O-Versicherung wurde entwickelt, um Geschaeftsfuehrer vor Anspruechen wegen Misswirtschaft zu schuetzen - dem Vorwurf, eine schlechte Geschaeftsentscheidung getroffen zu haben.",
        nl: "D&O-verzekering was bedoeld om bestuurders te beschermen tegen claims wegens wanbestuur - de beschuldiging dat een bestuurder een slechte zakelijke beslissing heeft genomen.",
      },
    },
    {
      id: "4.2.2",
      question: {
        en: "Why do NIS2 violations sit in the wrong category for most D&O policies?",
        de: "Warum fallen NIS2-Verstoesse bei den meisten D&O-Policen in die falsche Kategorie?",
        nl: "Waarom vallen NIS2-overtredingen in de verkeerde categorie voor de meeste D&O-polissen?",
      },
      options: [
        { en: "NIS2 violations are too expensive for D&O coverage limits", de: "NIS2-Verstoesse sind zu teuer für D&O-Deckungsgrenzen", nl: "NIS2-overtredingen zijn te kostbaar voor de dekkingslimieten van D&O" },
        { en: "NIS2 violations are statutory duty breaches, not business judgment calls", de: "NIS2-Verstoesse sind Verletzungen gesetzlicher Pflichten, keine unternehmerischen Ermessensentscheidungen", nl: "NIS2-overtredingen zijn schendingen van wettelijke verplichtingen, geen zakelijke beoordelingsbeslissingen" },
        { en: "NIS2 is not recognised by insurance regulators", de: "NIS2 wird von Versicherungsaufsichtsbehörden nicht anerkannt", nl: "NIS2 wordt niet erkend door verzekeringstoezichthouders" },
      ],
      correctIndex: 1,
      explanation: {
        en: "NIS2 violations are statutory duty breaches - the law tells you what to do, you do not do it, and the regulator holds you personally responsible. That is a different legal category from business judgment claims.",
        de: "NIS2-Verstoesse sind Verletzungen gesetzlicher Pflichten - das Gesetz sagt Ihnen, was zu tun ist, Sie tun es nicht, und die Aufsichtsbehörde zieht Sie persönlich zur Verantwortung. Das ist eine andere Rechtskategorie als unternehmerische Ermessensentscheidungen.",
        nl: "NIS2-overtredingen zijn schendingen van wettelijke verplichtingen - de wet vertelt u wat u moet doen, u doet het niet, en de bevoegde autoriteit houdt u persoonlijk verantwoordelijk. Dat is een andere juridische categorie dan claims over zakelijke beoordelingen.",
      },
    },
    {
      id: "4.2.3",
      question: {
        en: "What is the most critical clause to check in your D&O policy according to the lesson?",
        de: "Welche Klausel Ihrer D&O-Police sollten Sie laut der Lektion als Erstes prüfen?",
      },
      options: [
        { en: "The premium adjustment clause", de: "Die Praemienanpassungsklausel" },
        { en: "The cyber liability exclusion", de: "Der Cyber-Haftungsausschluss" },
        { en: "The coverage limit clause", de: "Die Deckungssummenklausel" },
        { en: "The renewal terms", de: "Die Verlaengerungsbedingungen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The most critical clause to check is the cyber liability exclusion. If present, your D&O does not cover NIS2 claims against you personally.",
        de: "Die wichtigste zu prüfende Klausel ist der Cyber-Haftungsausschluss. Wenn vorhanden, deckt Ihre D&O-Versicherung keine NIS2-Ansprueche gegen Sie persönlich ab.",
      },
    },
    {
      id: "4.2.4",
      question: {
        en: "How many questions should you ask your broker before signing the next D&O renewal?",
        de: "Wie viele Fragen sollten Sie Ihrem Makler vor Unterzeichnung der naechsten D&O-Verlaengerung stellen?",
      },
      options: [
        { en: "One question about coverage limits", de: "Eine Frage zur Deckungssumme" },
        { en: "Two questions about premiums and deductibles", de: "Zwei Fragen zu Praemien und Selbstbehalten" },
        { en: "Three questions about the cyber exclusion, personal regulatory claims, and statutory duty breaches", de: "Drei Fragen zum Cyber-Ausschluss, persönlichen regulatorischen Anspruechen und Verletzungen gesetzlicher Pflichten" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Ask three questions: does the policy contain a cyber liability exclusion, does it pay for personal defence under Article 32(5), and what does it say about statutory duty breaches. Get all three answers in writing.",
        de: "Stellen Sie drei Fragen: Enthaelt die Police einen Cyber-Haftungsausschluss, zahlt sie für die persönliche Verteidigung gemäß Artikel 32 Absatz 5, und was sagt sie zu Verletzungen gesetzlicher Pflichten. Lassen Sie sich alle drei Antworten schriftlich geben.",
      },
    },
  ],
});

export default quiz;
