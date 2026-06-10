import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.1",
  passingScore: 75,
  questions: [
    {
      id: "1.1.1",
      question: {
        en: "What is the difference between an EU directive and an EU regulation?",
        de: "Was ist der Unterschied zwischen einer EU-Richtlinie und einer EU-Verordnung?",
        nl: "Wat is het verschil tussen een EU-richtlijn en een EU-verordening?",
      },
      options: [
        { en: "A directive applies directly; a regulation must be transposed into national law", de: "Eine Richtlinie gilt unmittelbar; eine Verordnung muss in nationales Recht umgesetzt werden", nl: "Een richtlijn geldt rechtstreeks; een verordening moet worden omgezet in nationaal recht" },
        { en: "A regulation applies directly; a directive must be transposed into national law", de: "Eine Verordnung gilt unmittelbar; eine Richtlinie muss in nationales Recht umgesetzt werden", nl: "Een verordening geldt rechtstreeks; een richtlijn moet worden omgezet in nationaal recht" },
        { en: "There is no difference; both apply directly", de: "Es gibt keinen Unterschied; beide gelten unmittelbar", nl: "Er is geen verschil; beide gelden rechtstreeks" },
        { en: "A directive only applies to Essential entities; a regulation applies to all", de: "Eine Richtlinie gilt nur für wesentliche Einrichtungen; eine Verordnung gilt für alle", nl: "Een richtlijn geldt alleen voor essentiële entiteiten; een verordening geldt voor iedereen" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A regulation (like the GDPR or the CIR) applies directly in every country. A directive tells each country what the result has to be, and each country writes its own national law.",
        de: "Eine Verordnung (wie die DSGVO oder die CIR) gilt unmittelbar in jedem Land. Eine Richtlinie gibt jedem Land das Ziel vor, und jedes Land erlässt ein eigenes nationales Gesetz.",
        nl: "Een verordening (zoals de GDPR of de CIR) geldt rechtstreeks in elk land. Een richtlijn geeft elk land aan wat het resultaat moet zijn, en elk land schrijft zijn eigen nationale wet.",
      },
    },
    {
      id: "1.1.2",
      question: {
        en: "What does the CIR (Commission Implementing Regulation 2024/2690) do?",
        de: "Was regelt die CIR (Durchführungsverordnung 2024/2690 der Kommission)?",
        nl: "Wat doet de CIR (Uitvoeringsverordening 2024/2690 van de Commissie)?",
      },
      options: [
        { en: "It replaces the NIS2 Directive entirely", de: "Sie ersetzt die NIS2-Richtlinie vollständig", nl: "Het vervangt de NIS2-richtlijn volledig" },
        { en: "It sets the goals that each country must achieve", de: "Sie legt die Ziele fest, die jedes Land erreichen muss", nl: "Het stelt de doelen vast die elk land moet bereiken" },
        { en: "It sets detailed technical requirements that apply directly in all 27 member states", de: "Sie legt detaillierte technische Anforderungen fest, die unmittelbar in allen 27 Mitgliedstaaten gelten", nl: "Het stelt gedetailleerde technische vereisten vast die rechtstreeks gelden in alle 27 lidstaten" },
        { en: "It designates the competent authority in each country", de: "Sie bestimmt die zuständige Behörde in jedem Land", nl: "Het wijst de bevoegde autoriteit in elk land aan" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The CIR is a regulation that applies directly in all member states, setting detailed technical requirements such as what counts as a significant incident and what policies are mandatory.",
        de: "Die CIR ist eine Verordnung, die unmittelbar in allen Mitgliedstaaten gilt und detaillierte technische Anforderungen festlegt, z. B. was als erheblicher Sicherheitsvorfall gilt und welche Richtlinien verpflichtend sind.",
        nl: "De CIR is een verordening die rechtstreeks van toepassing is in alle lidstaten en gedetailleerde technische vereisten vaststelt, zoals wat als een significant incident geldt en welk beleid verplicht is.",
      },
    },
    {
      id: "1.1.3",
      question: {
        en: "What is the full legal chain described in this lesson?",
        de: "Wie lautet die vollständige Rechtskette, die in dieser Lektion beschrieben wird?",
        nl: "Wat is de volledige juridische keten die in deze les wordt beschreven?",
      },
      options: [
        { en: "CIR sets goals, NIS2 sets rules, national law enforces", de: "Die CIR setzt Ziele, NIS2 setzt Regeln, nationales Recht setzt durch", nl: "CIR stelt doelen, NIS2 stelt regels, nationaal recht handhaaft" },
        { en: "NIS2 Directive sets goals, CIR sets detailed technical rules, national law transposes and the national enforcer audits", de: "Die NIS2-Richtlinie setzt Ziele, die CIR legt detaillierte technische Regeln fest, nationales Recht setzt um und die nationale Aufsichtsbehörde prüft", nl: "NIS2-richtlijn stelt doelen, CIR stelt gedetailleerde technische regels, nationaal recht zet om en de nationale handhaver controleert" },
        { en: "National law sets goals, NIS2 Directive sets rules, CIR enforces", de: "Nationales Recht setzt Ziele, die NIS2-Richtlinie setzt Regeln, die CIR setzt durch", nl: "Nationaal recht stelt doelen, NIS2-richtlijn stelt regels, CIR handhaaft" },
        { en: "GDPR sets goals, NIS2 sets rules, CIR enforces", de: "Die DSGVO setzt Ziele, NIS2 setzt Regeln, die CIR setzt durch", nl: "GDPR stelt doelen, NIS2 stelt regels, CIR handhaaft" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The chain is: EU Directive (NIS2) sets the goals, EU Regulation (CIR) sets the detailed technical rules, national law transposes the directive, and the national enforcer audits and fines.",
        de: "Die Kette lautet: EU-Richtlinie (NIS2) setzt die Ziele, EU-Verordnung (CIR) legt die detaillierten technischen Regeln fest, nationales Recht setzt die Richtlinie um, und die nationale Aufsichtsbehörde prüft und verhängt Bußgelder.",
        nl: "De keten is: EU-richtlijn (NIS2) stelt de doelen, EU-verordening (CIR) stelt de gedetailleerde technische regels, nationaal recht zet de richtlijn om, en de nationale handhaver controleert en legt boetes op.",
      },
    },
    {
      id: "1.1.4",
      question: {
        en: "Why does the lesson say NIS1 was replaced?",
        de: "Warum wurde NIS1 laut dieser Lektion abgelöst?",
        nl: "Waarom werd NIS1 volgens deze les vervangen?",
      },
      options: [
        { en: "NIS1 was too strict and costly for companies", de: "NIS1 war zu streng und kostspielig für Unternehmen", nl: "NIS1 was te streng en kostbaar voor bedrijven" },
        { en: "NIS1 only applied to digital infrastructure providers", de: "NIS1 galt nur für Anbieter digitaler Infrastruktur", nl: "NIS1 was alleen van toepassing op aanbieders van digitale infrastructuur" },
        { en: "NIS1 was widely seen as inconsistent and weakly enforced, with almost no fines ever issued", de: "NIS1 wurde weithin als uneinheitlich und schwach durchgesetzt angesehen, wobei kaum jemals Bußgelder verhängt wurden", nl: "NIS1 werd algemeen beschouwd als inconsistent en zwak gehandhaafd, waarbij bijna nooit boetes werden opgelegd" },
        { en: "NIS1 was a regulation that could not be adapted to local laws", de: "NIS1 war eine Verordnung, die nicht an lokales Recht angepasst werden konnte", nl: "NIS1 was een verordening die niet kon worden aangepast aan lokale wetgeving" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The lesson states that NIS1 was widely seen as inconsistent and weakly enforced - almost no fines were ever issued under NIS1 anywhere in the EU.",
        de: "Die Lektion stellt fest, dass NIS1 weithin als uneinheitlich und schwach durchgesetzt galt -- in der gesamten EU wurden unter NIS1 kaum Bußgelder verhängt.",
        nl: "De les stelt dat NIS1 algemeen werd gezien als inconsistent en zwak gehandhaafd — in de gehele EU werden onder NIS1 vrijwel nooit boetes opgelegd.",
      },
    },
  ],
});

export default quiz;
