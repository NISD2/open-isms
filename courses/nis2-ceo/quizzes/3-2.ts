import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.2",
  passingScore: 75,
  questions: [
    {
      id: "3.2.1",
      question: {
        en: "What four things does your signature on the top-level security policy certify?",
        de: "Welche vier Dinge bestätigt Ihre Unterschrift auf der übergeordneten Sicherheitsrichtlinie?",
        nl: "Welke vier zaken bevestigt uw handtekening op het overkoepelende beveiligingsbeleid?",
      },
      options: [
        { en: "Risk analysis reviewed, measures address risks, budget approved, named people are responsible", de: "Risikoanalyse geprüft, Maßnahmen adressieren Risiken, Budget genehmigt, benannte Personen sind verantwortlich", nl: "Risicoanalyse beoordeeld, maatregelen pakken risico's aan, budget goedgekeurd, benoemde personen zijn verantwoordelijk" },
        { en: "Policy is complete, IT department approved it, budget exists, auditor signed off", de: "Richtlinie ist vollständig, IT-Abteilung hat zugestimmt, Budget vorhanden, Auditor hat abgezeichnet", nl: "Beleid is volledig, IT-afdeling heeft goedgekeurd, budget is aanwezig, auditor heeft goedkeuring gegeven" },
        { en: "Risks are eliminated, CISO is accountable, budget is unlimited, controls are tested", de: "Risiken sind beseitigt, CISO ist verantwortlich, Budget ist unbegrenzt, Kontrollen sind getestet", nl: "Risico's zijn geëlimineerd, CISO is verantwoordelijk, budget is onbeperkt, controles zijn getest" },
        { en: "Compliance is achieved, training is complete, incidents are reported, suppliers are managed", de: "Compliance ist erreicht, Schulungen sind abgeschlossen, Vorfälle werden gemeldet, Lieferanten werden gesteuert", nl: "Naleving is bereikt, opleiding is afgerond, incidenten worden gemeld, leveranciers worden beheerd" },
      ],
      correctIndex: 0,
      explanation: {
        en: "Your signature certifies that you reviewed the risk analysis, that the measures address those risks, that the budget to implement them is approved, and that named people are responsible for carrying them out.",
        de: "Ihre Unterschrift bestätigt, dass Sie die Risikoanalyse geprüft haben, dass die Maßnahmen diese Risiken adressieren, dass das Budget zu deren Umsetzung genehmigt ist und dass benannte Personen für die Durchführung verantwortlich sind.",
        nl: "Uw handtekening bevestigt dat u de risicoanalyse heeft beoordeeld, dat de maatregelen die risico's aanpakken, dat het budget voor de uitvoering ervan is goedgekeurd, en dat benoemde personen verantwoordelijk zijn voor de uitvoering.",
      },
    },
    {
      id: "3.2.2",
      question: {
        en: "What happens if you sign a security policy without reviewing it and the company later has an incident?",
        de: "Was passiert, wenn Sie eine Sicherheitsrichtlinie ohne Prüfung unterschreiben und das Unternehmen später einen Vorfall hat?",
        nl: "Wat gebeurt er als u een beveiligingsbeleid ondertekent zonder het te beoordelen en het bedrijf later een incident heeft?",
      },
      options: [
        { en: "The signature still provides legal protection because it was given in good faith", de: "Die Unterschrift bietet weiterhin rechtlichen Schutz, da sie in gutem Glauben geleistet wurde", nl: "De handtekening biedt nog steeds juridische bescherming omdat ze te goeder trouw is gegeven" },
        { en: "The CISO bears responsibility because they prepared the document", de: "Der CISO trägt die Verantwortung, da er das Dokument erstellt hat", nl: "De CISO draagt de verantwoordelijkheid omdat hij het document heeft opgesteld" },
        { en: "Your signature becomes evidence that you approved something you did not read - and works against you in court", de: "Ihre Unterschrift wird zum Beweis, dass Sie etwas genehmigt haben, das Sie nicht gelesen haben - und wirkt vor Gericht gegen Sie", nl: "Uw handtekening wordt bewijs dat u iets heeft goedgekeurd dat u niet heeft gelezen - en werkt tegen u in de rechtbank" },
        { en: "The regulator will accept the signature as valid if it was standard practice", de: "Die Aufsichtsbehörde akzeptiert die Unterschrift als gültig, wenn es gängige Praxis war", nl: "De toezichthouder accepteert de handtekening als geldig als het gangbare praktijk was" },
      ],
      correctIndex: 2,
      explanation: {
        en: "An uninformed signature is legally void. If you signed without reviewing, your signature becomes evidence that you approved something you did not read - and that evidence works against you in court.",
        de: "Eine uninformierte Unterschrift ist rechtlich nichtig. Wenn Sie ohne Prüfung unterschrieben haben, wird Ihre Unterschrift zum Beweis, dass Sie etwas genehmigt haben, das Sie nicht gelesen haben - und dieser Beweis wirkt vor Gericht gegen Sie.",
        nl: "Een ondoordachte handtekening is juridisch nietig. Als u heeft ondertekend zonder te beoordelen, wordt uw handtekening bewijs dat u iets heeft goedgekeurd dat u niet heeft gelezen - en dat bewijs werkt tegen u in de rechtbank.",
      },
    },
    {
      id: "3.2.3",
      question: {
        en: "According to the lesson, what is the relationship between the management body and the CISO when it comes to the security policy?",
        de: "Welche Beziehung besteht laut der Lektion zwischen dem Leitungsorgan und dem CISO in Bezug auf die Sicherheitsrichtlinie?",
        nl: "Wat is volgens de les de verhouding tussen het leidinggevend orgaan en de CISO als het gaat om het beveiligingsbeleid?",
      },
      options: [
        { en: "The CISO decides what to do and the management body funds it", de: "Der CISO entscheidet, was zu tun ist, und das Leitungsorgan finanziert es", nl: "De CISO beslist wat er gedaan moet worden en het leidinggevend orgaan financiert het" },
        { en: "The management body decides what and why; the CISO decides how", de: "Das Leitungsorgan entscheidet über das Was und Warum; der CISO entscheidet über das Wie", nl: "Het leidinggevend orgaan beslist wat en waarom; de CISO beslist hoe" },
        { en: "The CISO and management body share equal responsibility", de: "CISO und Leitungsorgan teilen sich die Verantwortung gleichermaßen", nl: "De CISO en het leidinggevend orgaan delen de verantwoordelijkheid gelijkelijk" },
        { en: "The management body delegates all security decisions to the CISO", de: "Das Leitungsorgan delegiert alle Sicherheitsentscheidungen an den CISO", nl: "Het leidinggevend orgaan delegeert alle beveiligingsbeslissingen aan de CISO" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The management body decides what and why. The CISO decides how.",
        de: "Das Leitungsorgan entscheidet über das Was und Warum. Der CISO entscheidet über das Wie.",
        nl: "Het leidinggevend orgaan beslist wat en waarom. De CISO beslist hoe.",
      },
    },
    {
      id: "3.2.4",
      question: {
        en: "Which of the four pre-signature questions addresses the risk that a policy promises controls the company has not funded?",
        de: "Welche der vier Fragen vor der Unterschrift adressiert das Risiko, dass eine Richtlinie Kontrollen verspricht, die das Unternehmen nicht finanziert hat?",
        nl: "Welke van de vier vragen vóór ondertekening pakt het risico aan dat een beleid controles belooft die het bedrijf niet heeft gefinancierd?",
      },
      options: [
        { en: "\"Show me the risk analysis this policy refers to\"", de: "\"Zeigen Sie mir die Risikoanalyse, auf die sich diese Richtlinie bezieht\"", nl: "\"Laat me de risicoanalyse zien waarnaar dit beleid verwijst\"" },
        { en: "\"What has changed since the last version I signed?\"", de: "\"Was hat sich seit der letzten von mir unterschriebenen Version geändert?\"", nl: "\"Wat is er veranderd sinds de laatste versie die ik heb ondertekend?\"" },
        { en: "\"Has the budget to implement these measures been approved?\"", de: "\"Wurde das Budget zur Umsetzung dieser Maßnahmen genehmigt?\"", nl: "\"Is het budget voor de uitvoering van deze maatregelen goedgekeurd?\"" },
        { en: "\"Who are the named people responsible for each measure?\"", de: "\"Wer sind die benannten Verantwortlichen für jede Maßnahme?\"", nl: "\"Wie zijn de benoemde verantwoordelijken voor elke maatregel?\"" },
      ],
      correctIndex: 2,
      explanation: {
        en: "A policy that promises controls the company has not funded is a policy the regulator will use against you - the budget question catches this.",
        de: "Eine Richtlinie, die Kontrollen verspricht, die das Unternehmen nicht finanziert hat, ist eine Richtlinie, die die Aufsichtsbehörde gegen Sie verwenden wird - die Budgetfrage deckt dies auf.",
        nl: "Een beleid dat controles belooft die het bedrijf niet heeft gefinancierd, is een beleid dat de toezichthouder tegen u zal gebruiken - de budgetvraag onderschept dit.",
      },
    },
  ],
});

export default quiz;
