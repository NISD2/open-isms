import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.12",
  passingScore: 75,
  questions: [
    {
      id: "1.12.1",
      question: {
        en: "What is the difference between Article 23(2) and Article 36 customer notification?",
        de: "Was ist der Unterschied zwischen der Kundenbenachrichtigung nach Artikel 23 Absatz 2 und Artikel 36?",
        nl: "Wat is het verschil tussen klantnotificatie op grond van artikel 23(2) en artikel 36?",
      },
      options: [
        { en: "Article 23(2) is optional; Article 36 is mandatory", de: "Artikel 23 Absatz 2 ist freiwillig; Artikel 36 ist verpflichtend", nl: "Artikel 23(2) is vrijwillig; artikel 36 is verplicht" },
        { en: "Article 23(2) is self-executing (triggers automatically when customers face an ongoing threat); Article 36 is regulator-ordered", de: "Artikel 23 Absatz 2 ist selbstwirkend (greift automatisch, wenn Kunden einer andauernden Bedrohung ausgesetzt sind); Artikel 36 wird von der Aufsichtsbehörde angeordnet", nl: "Artikel 23(2) is zelfuitvoerend (treedt automatisch in werking wanneer klanten een voortdurende dreiging ondervinden); artikel 36 wordt opgelegd door de toezichthouder" },
        { en: "Article 23(2) applies only to Essential entities; Article 36 applies to all", de: "Artikel 23 Absatz 2 gilt nur für wesentliche Einrichtungen; Artikel 36 gilt für alle", nl: "Artikel 23(2) geldt alleen voor essentiële entiteiten; artikel 36 geldt voor alle entiteiten" },
        { en: "There is no difference; they are the same duty", de: "Es gibt keinen Unterschied; es handelt sich um dieselbe Pflicht", nl: "Er is geen verschil; het betreft dezelfde verplichting" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(2) is self-executing and triggers the moment the entity becomes aware of the ongoing threat. Article 36 is the regulator's power to order customer notification.",
        de: "Artikel 23 Absatz 2 ist selbstwirkend und greift in dem Moment, in dem die Einrichtung von der andauernden Bedrohung Kenntnis erlangt. Artikel 36 ist die Befugnis der Aufsichtsbehörde, eine Kundenbenachrichtigung anzuordnen.",
        nl: "Artikel 23(2) is zelfuitvoerend en treedt in werking op het moment dat de entiteit kennis krijgt van de voortdurende dreiging. Artikel 36 is de bevoegdheid van de toezichthouder om klantnotificatie te bevelen.",
      },
    },
    {
      id: "1.12.2",
      question: {
        en: "Under Article 23(2), what must you tell customers beyond the fact that there is a problem?",
        de: "Was müssen Sie Kunden gemäß Artikel 23 Absatz 2 über die Tatsache hinaus mitteilen, dass ein Problem vorliegt?",
        nl: "Wat moet u klanten op grond van artikel 23(2) meedelen naast het feit dat er een probleem is?",
      },
      options: [
        { en: "Nothing else is required", de: "Es sind keine weiteren Angaben erforderlich", nl: "Er zijn geen verdere mededelingen vereist" },
        { en: "The name of the attacker and their methods", de: "Den Namen des Angreifers und seine Methoden", nl: "De naam van de aanvaller en hun methoden" },
        { en: "Any measures or remedies the recipients can take in response to the threat", de: "Alle Maßnahmen oder Abhilfemöglichkeiten, die die Empfänger als Reaktion auf die Bedrohung ergreifen können", nl: "Alle maatregelen of herstelacties die de ontvangers kunnen nemen als reactie op de dreiging" },
        { en: "The amount of the fine the company expects to receive", de: "Die Höhe des Bußgeldes, das das Unternehmen erwartet", nl: "De hoogte van de boete die de vennootschap verwacht te ontvangen" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Article 23(2) requires you to disclose any measures or remedies that recipients are able to take in response to the threat.",
        de: "Artikel 23 Absatz 2 verlangt, dass Sie alle Maßnahmen oder Abhilfemöglichkeiten offenlegen, die die Empfänger als Reaktion auf die Bedrohung ergreifen können.",
        nl: "Artikel 23(2) vereist dat u alle maatregelen of herstelacties bekendmaakt die de ontvangers als reactie op de dreiging kunnen nemen.",
      },
    },
    {
      id: "1.12.3",
      question: {
        en: "What does the lesson recommend having prepared before an incident occurs?",
        de: "Was empfiehlt die Lektion, vor Eintritt eines Vorfalls vorbereitet zu haben?",
        nl: "Wat adviseert de les voorbereid te hebben voordat een incident plaatsvindt?",
      },
      options: [
        { en: "A press release template and social media strategy", de: "Eine Pressemitteilungsvorlage und Social-Media-Strategie", nl: "Een persbericht-sjabloon en sociale-mediastrategie" },
        { en: "A pre-drafted customer notification template and a defined approval chain ending with the management body", de: "Eine vorbereitete Kundenbenachrichtigungsvorlage und eine definierte Freigabekette, die bei der Geschäftsleitung endet", nl: "Een vooraf opgesteld klantnotificatiesjabloon en een vastgestelde goedkeuringsketen die eindigt bij het leidinggevend orgaan" },
        { en: "An insurance claim form and legal retainer agreement", de: "Ein Versicherungsschadenformular und eine Mandatsvereinbarung", nl: "Een verzekeringsschadeclaimformulier en een mandaatovereenkomst" },
        { en: "A list of customers ranked by revenue for priority notification", de: "Eine nach Umsatz sortierte Kundenliste für priorisierte Benachrichtigung", nl: "Een lijst van klanten gerangschikt op omzet voor prioriteitsnotificatie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Have a pre-drafted customer notification template and a defined approval chain that ends with the management body.",
        de: "Halten Sie eine vorbereitete Kundenbenachrichtigungsvorlage und eine definierte Freigabekette bereit, die bei der Geschäftsleitung endet.",
        nl: "Zorg voor een vooraf opgesteld klantnotificatiesjabloon en een vastgestelde goedkeuringsketen die eindigt bij het leidinggevend orgaan.",
      },
    },
  ],
});

export default quiz;
