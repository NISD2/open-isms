import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.2",
  passingScore: 75,
  questions: [
    {
      id: "2.2.1",
      question: {
        en: "What are the four rounds of the hot wash debrief?",
        de: "Wie heißen die vier Runden des Hot-Wash-Debriefs?",
      },
      options: [
        { en: "Detection, response, recovery, lessons", de: "Erkennung, Reaktion, Wiederherstellung, Lessons" },
        { en: "What went well, what went badly, what surprised us, what needs to change", de: "Was gut lief, was nicht funktionierte, was uns überraschte, was sich ändern muss" },
        { en: "Praise, blame, plan, dismiss", de: "Lob, Schuldzuweisung, Plan, Abschluss" },
        { en: "Severity, scope, impact, root cause", de: "Schwere, Umfang, Auswirkung, Grundursache" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The four-beat structure separates honest reflection (the first three rounds) from action planning (the fourth round). Surprise findings are the highest-value lessons.",
        de: "Die Vier-Runden-Struktur trennt ehrliche Reflexion (die ersten drei Runden) von der Maßnahmenplanung (die vierte Runde). Überraschende Erkenntnisse sind die wertvollsten Lektionen.",
      },
    },
    {
      id: "2.2.2",
      question: {
        en: "Why is the 'no blame' rule the most important determinant of future participation?",
        de: "Warum ist die Regel \"keine Schuldzuweisungen\" entscheidend für die Beteiligung in künftigen Übungen?",
      },
      options: [
        { en: "Because the BSI requires blame-free debriefs", de: "Weil das BSI schuldfreie Debriefs verlangt" },
        { en: "Because cyber insurance policies penalise named individuals", de: "Weil Cyber-Versicherungs-Policen namentlich genannte Personen sanktionieren" },
        { en: "Because a team that experiences blame learns not to participate honestly in the next exercise", de: "Weil ein Team, das beschuldigt wurde, lernt, in der nächsten Übung nicht mehr ehrlich zu sein" },
        { en: "Because the platform deletes named findings", de: "Weil die Plattform namentliche Erkenntnisse löscht" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Findings that name a person teach the team that honest disclosure is punished. The rule rephrases person-blame into process-gap, preserving honest reflection in future exercises.",
        de: "Erkenntnisse, die eine Person nennen, lehren das Team, dass ehrliche Offenlegung bestraft wird. Die Regel formuliert Personen-Schuld in Prozesslücken um und bewahrt die ehrliche Reflexion für künftige Übungen.",
      },
    },
    {
      id: "2.2.3",
      question: {
        en: "What does each improvement item from the hot wash need?",
        de: "Welche Felder braucht jeder Verbesserungspunkt aus dem Hot Wash?",
      },
      options: [
        { en: "A description only", de: "Nur eine Beschreibung" },
        { en: "Owner, deadline, linked Article 21(2) measure, and closure criterion", de: "Verantwortliche Person, Frist, Bezug zur Maßnahme aus Artikel 21(2) und Abschluss-Kriterium" },
        { en: "A risk score and a Jira ticket", de: "Eine Risiko-Einstufung und ein Jira-Ticket" },
        { en: "Just the owner", de: "Nur die verantwortliche Person" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Each item needs five fields: what, owner, deadline, linked statutory reference, and closure criterion. Without these the item is not trackable and does not produce follow-up evidence.",
        de: "Jeder Punkt braucht fünf Felder: was, verantwortliche Person, Frist, rechtlicher Bezug und Abschluss-Kriterium. Ohne diese ist der Punkt nicht nachverfolgbar und erzeugt keine Folgenachweise.",
      },
    },
  ],
});

export default quiz;
