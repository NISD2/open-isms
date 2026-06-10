import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.5",
  passingScore: 75,
  questions: [
    {
      id: "3.5.1",
      question: {
        en: "How many non-delegable decisions does the lesson identify under NIS2?",
        de: "Wie viele nicht delegierbare Entscheidungen identifiziert die Lektion unter NIS2?",
        nl: "Hoeveel niet-delegeerbare beslissingen identificeert de les onder NIS2?",
      },
      options: [
        { en: "Five", de: "Fünf", nl: "Vijf" },
        { en: "Seven", de: "Sieben", nl: "Zeven" },
        { en: "Nine", de: "Neun", nl: "Negen" },
        { en: "Eleven", de: "Elf", nl: "Elf" },
      ],
      correctIndex: 3,
      explanation: {
        en: "The lesson identifies eleven non-delegable decisions, each requiring a signed artefact.",
        de: "Die Lektion identifiziert elf nicht delegierbare Entscheidungen, die jeweils ein unterschriebenes Artefakt erfordern.",
        nl: "De les identificeert elf niet-delegeerbare beslissingen, elk vereist een ondertekend artefact.",
      },
    },
    {
      id: "3.5.2",
      question: {
        en: "Which single artefact do most CEOs fail to produce in an audit?",
        de: "Welches einzelne Artefakt koennen die meisten CEOs bei einem Audit nicht vorlegen?",
        nl: "Welk enkel artefact kunnen de meeste CEO's niet produceren bij een audit?",
      },
      options: [
        { en: "The signed top-level security policy", de: "Die unterschriebene übergeordnete Sicherheitsrichtlinie", nl: "Het ondertekende overkoepelende beveiligingsbeleid" },
        { en: "The signed residual risk acceptance", de: "Die unterschriebene Restrisikoakzeptanz", nl: "De ondertekende restrisico-acceptatie" },
        { en: "The annual management review minutes", de: "Das Protokoll der jährlichen Management-Bewertung", nl: "De notulen van de jaarlijkse managementbeoordeling" },
        { en: "The crisis declaration record", de: "Die Krisenerklaerung", nl: "De crisisdeclaratie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The residual risk acceptance is the single document auditors look for first and the single document most CEOs cannot produce.",
        de: "Die Restrisikoakzeptanz ist das einzelne Dokument, nach dem Auditoren zuerst suchen, und das einzelne Dokument, das die meisten CEOs nicht vorlegen koennen.",
        nl: "De restrisico-acceptatie is het enige document waarnaar auditors als eerste zoeken en dat de meeste CEO's niet kunnen produceren.",
      },
    },
    {
      id: "3.5.3",
      question: {
        en: "What three things should each residual risk in the signed risk register include?",
        de: "Welche drei Dinge sollte jedes Restrisiko im unterschriebenen Risikoregister enthalten?",
        nl: "Wat moeten drie dingen zijn voor elk resterend risico in het ondertekende risicoregister?",
      },
      options: [
        { en: "A rating, a description of what is being accepted, and a named owner with a review date", de: "Eine Bewertung, eine Beschreibung dessen, was akzeptiert wird, und einen benannten Verantwortlichen mit Prüfungsdatum", nl: "Een beoordeling, een beschrijving van wat wordt geaccepteerd en een benoemde eigenaar met een beoordelingsdatum" },
        { en: "A cost estimate, a timeline for elimination, and an insurance policy reference", de: "Eine Kostenschaetzung, einen Zeitplan zur Beseitigung und eine Versicherungspolice-Referenz", nl: "Een kostenraming, een tijdlijn voor eliminatie en een verwijzing naar een verzekeringspolis" },
        { en: "A CISO recommendation, a legal opinion, and a budget allocation", de: "Eine CISO-Empfehlung, ein Rechtsgutachten und eine Budgetzuweisung", nl: "Een CISO-aanbeveling, een juridisch advies en een budgettoewijzing" },
        { en: "A threat source, an attack vector, and a vulnerability scan report", de: "Eine Bedrohungsquelle, einen Angriffsvektor und einen Schwachstellen-Scan-Bericht", nl: "Een dreigingsbron, een aanvalsvector en een kwetsbaarheidsrapport" },
      ],
      correctIndex: 0,
      explanation: {
        en: "Each residual risk needs a rating, a description of what is being accepted, and a named owner with a review date.",
        de: "Jedes Restrisiko benoetigt eine Bewertung, eine Beschreibung dessen, was akzeptiert wird, und einen benannten Verantwortlichen mit Prüfungsdatum.",
        nl: "Elk resterend risico heeft een beoordeling nodig, een beschrijving van wat wordt geaccepteerd en een benoemde eigenaar met een beoordelingsdatum.",
      },
    },
    {
      id: "3.5.4",
      question: {
        en: "What is the lesson's rule for borderline decisions where you are unsure whether your signature is needed?",
        de: "Wie lautet die Regel der Lektion für Grenzfälle, bei denen Sie unsicher sind, ob Ihre Unterschrift erforderlich ist?",
        nl: "Wat is de regel van de les voor grensgevallen waarbij u niet zeker weet of uw handtekening nodig is?",
      },
      options: [
        { en: "Delegate to the CISO and review later", de: "An den CISO delegieren und spaeter prüfen", nl: "Delegeer aan de CISO en controleer later" },
        { en: "Ask the auditor for guidance", de: "Den Auditor um Orientierung bitten", nl: "Vraag de auditor om begeleiding" },
        { en: "Treat it as non-delegable and sign it yourself", de: "Als nicht delegierbar behandeln und selbst unterschreiben", nl: "Behandel het als niet-delegeerbaar en onderteken het zelf" },
        { en: "Wait until the annual review cycle", de: "Bis zum jährlichen Prüfungszyklus warten", nl: "Wacht tot de jaarlijkse beoordelingscyclus" },
      ],
      correctIndex: 2,
      explanation: {
        en: "When the line is blurry, treat the decision as non-delegable and sign it yourself.",
        de: "Wenn die Grenze unklar ist, behandeln Sie die Entscheidung als nicht delegierbar und unterschreiben Sie selbst.",
        nl: "Wanneer de grens onduidelijk is, behandel de beslissing als niet-delegeerbaar en onderteken het zelf.",
      },
    },
  ],
});

export default quiz;
