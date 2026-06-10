import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.6",
  passingScore: 75,
  questions: [
    {
      id: "2.6.1",
      question: {
        en: "How many distinct policies does the CIR require for Measure 1?",
        de: "Wie viele separate Richtlinien verlangt die CIR für Maßnahme 1?",
        nl: "Hoeveel afzonderlijke beleidslijnen vereist de CIR voor Maatregel 1?",
      },
      options: [
        { en: "One comprehensive security policy", de: "Eine umfassende Sicherheitsrichtlinie", nl: "Één uitgebreid beveiligingsbeleid" },
        { en: "Five core policies", de: "Fünf Kernrichtlinien", nl: "Vijf kernbeleidslijnen" },
        { en: "Eleven (one top-level plus ten topic-specific)", de: "Elf (eine übergeordnete plus zehn themenspezifische)", nl: "Elf (één overkoepelend plus tien onderwerpspecifieke)" },
        { en: "Three (risk, incident, access)", de: "Drei (Risiko, Vorfall, Zugang)", nl: "Drie (risico, incident, toegang)" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The CIR requires a top-level information security policy plus ten topic-specific policies - eleven in total.",
        de: "Die CIR verlangt eine übergeordnete Informationssicherheitsrichtlinie plus zehn themenspezifische Richtlinien - insgesamt elf.",
        nl: "De CIR vereist één overkoepelend informatiebeveiligingsbeleid plus tien onderwerpspecifieke beleidslijnen - elf in totaal.",
      },
    },
    {
      id: "2.6.2",
      question: {
        en: "Which three CIR Annex topic-specific policies does this lesson call out as worth double-checking?",
        de: "Welche drei DVO-Anhang-Spezialrichtlinien hebt diese Lektion zur Gegenkontrolle hervor?",
        nl: "Welke drie CIR-bijlage onderwerpspecifieke beleidsregels noemt deze les expliciet om dubbel te controleren?",
      },
      options: [
        { en: "Risk management, incident handling, access control", de: "Risikomanagement, Vorfallbehandlung, Zugangskontrolle", nl: "Risicobeheer, incidentbeheer, toegangscontrole" },
        { en: "Security testing, privileged accounts, removable media", de: "Sicherheitstests, privilegierte Konten, Wechseldatenträger", nl: "Beveiligingstests, geprivilegieerde accounts, verwijderbare media" },
        { en: "Cryptography, supply chain, effectiveness assessment", de: "Kryptografie, Supply Chain, Wirksamkeitsbewertung", nl: "Cryptografie, toeleveringsketen, effectiviteitsbeoordeling" },
        { en: "Backup, disaster recovery, crisis management", de: "Backup, Notfallwiederherstellung, Krisenmanagement", nl: "Back-up, herstel na rampen, crisismanagement" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Security testing, privileged accounts, and removable media are three niche policies the CIR Annex explicitly requires - worth double-checking against an existing ISO policy set.",
        de: "Sicherheitstests, privilegierte Konten und Wechseldatenträger sind drei Nischenrichtlinien, die der DVO-Anhang explizit verlangt - bei einem bestehenden ISO-Richtlinienkanon zur Gegenkontrolle empfehlenswert.",
        nl: "Beveiligingstesten, geprivilegieerde accounts en verwijderbare media zijn drie nichebeleidsregels die de CIR-bijlage uitdrukkelijk vereist - aanbevolen om dubbel te controleren tegen een bestaande ISO-set.",
      },
    },
    {
      id: "2.6.3",
      question: {
        en: "What makes an undated or unsigned top-level policy the 'fastest path to an audit finding'?",
        de: "Warum ist eine undatierte oder nicht unterschriebene übergeordnete Richtlinie der 'schnellste Weg zu einer Audit-Feststellung'?",
        nl: "Waarom is een ongedateerd of niet-ondertekend overkoepelend beleid 'de snelste weg naar een auditbevinding'?",
      },
      options: [
        { en: "It means the IT department forgot to file the paperwork", de: "Es bedeutet, dass die IT-Abteilung den Papierkram vergessen hat", nl: "Het betekent dat de IT-afdeling de papierwinkel is vergeten" },
        { en: "It means the management body either did not approve the security approach or cannot prove they did", de: "Es bedeutet, dass die Geschäftsleitung den Sicherheitsansatz entweder nicht genehmigt hat oder dies nicht nachweisen kann", nl: "Het betekent dat het leidinggevend orgaan de beveiligingsaanpak niet heeft goedgekeurd of dit niet kan bewijzen" },
        { en: "It means the policies are technically incorrect", de: "Es bedeutet, dass die Richtlinien fachlich falsch sind", nl: "Het betekent dat de beleidslijnen technisch onjuist zijn" },
        { en: "It means the auditor has to write a longer report", de: "Es bedeutet, dass der Auditor einen längeren Bericht schreiben muss", nl: "Het betekent dat de auditor een langer rapport moet schrijven" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The CIR requires the top-level policy to carry the date of formal approval by the management body - without it, the approval cannot be proven.",
        de: "Die CIR verlangt, dass die übergeordnete Richtlinie das Datum der formellen Genehmigung durch die Geschäftsleitung trägt - ohne dieses kann die Genehmigung nicht nachgewiesen werden.",
        nl: "De CIR vereist dat het overkoepelende beleid de datum van formele goedkeuring door het leidinggevend orgaan bevat - zonder die datum kan de goedkeuring niet worden aangetoond.",
      },
    },
    {
      id: "2.6.4",
      question: {
        en: "How often must the top-level information security policy be reviewed?",
        de: "Wie oft muss die übergeordnete Informationssicherheitsrichtlinie überprüft werden?",
        nl: "Hoe vaak moet het overkoepelende informatiebeveiligingsbeleid worden herzien?",
      },
      options: [
        { en: "Every six months", de: "Alle sechs Monate", nl: "Elke zes maanden" },
        { en: "Annually", de: "Jährlich", nl: "Jaarlijks" },
        { en: "Every two years", de: "Alle zwei Jahre", nl: "Elke twee jaar" },
        { en: "Only when a breach occurs", de: "Nur bei einem Sicherheitsvorfall", nl: "Alleen na een incident" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The top-level policy must be reviewed annually with a dated management body approval.",
        de: "Die übergeordnete Richtlinie muss jährlich überprüft werden, mit datierter Genehmigung durch die Geschäftsleitung.",
        nl: "Het overkoepelende beleid moet jaarlijks worden herzien met een gedateerde goedkeuring van het leidinggevend orgaan.",
      },
    },
  ],
});

export default quiz;
