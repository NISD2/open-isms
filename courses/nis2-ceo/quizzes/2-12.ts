import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.12",
  passingScore: 75,
  questions: [
    {
      id: "2.12.1",
      question: {
        en: "What is the difference between cyber hygiene and cybersecurity training?",
        de: "Was ist der Unterschied zwischen Cyberhygiene und Cybersicherheitsschulungen?",
        nl: "Wat is het verschil tussen cyberhygiëne en cyberbeveiligingstraining?",
      },
      options: [
        { en: "There is no difference; they are the same thing", de: "Es gibt keinen Unterschied; es ist dasselbe", nl: "Er is geen verschil; het is hetzelfde" },
        { en: "Cyber hygiene is the daily basics everyone must follow; training is the scheduled programme that keeps those practices alive", de: "Cyberhygiene sind die täglichen Grundregeln, die alle befolgen müssen; Schulung ist das geplante Programm, das diese Praktiken am Leben hält", nl: "Cyberhygiëne zijn de dagelijkse basisregels die iedereen moet volgen; training is het geplande programma dat die praktijken levend houdt" },
        { en: "Cyber hygiene is for IT staff; training is for management", de: "Cyberhygiene ist für IT-Mitarbeitende; Schulung ist für die Geschäftsleitung", nl: "Cyberhygiëne is voor IT-medewerkers; training is voor het management" },
        { en: "Cyber hygiene is optional; training is mandatory", de: "Cyberhygiene ist optional; Schulung ist verpflichtend", nl: "Cyberhygiëne is optioneel; training is verplicht" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Cyber hygiene is the short list of daily security practices; training is the scheduled programme - Article 21(2)(g) requires both.",
        de: "Cyberhygiene ist die kurze Liste täglicher Sicherheitspraktiken; Schulung ist das geplante Programm - Artikel 21 Absatz 2(g) verlangt beides.",
        nl: "Cyberhygiëne is de korte lijst van dagelijkse beveiligingspraktijken; training is het geplande programma - Artikel 21(2)(g) vereist allebei.",
      },
    },
    {
      id: "2.12.2",
      question: {
        en: "Which groups require training under Article 21(2)(g) and Article 20(2)?",
        de: "Welche Gruppen benötigen Schulungen gemäß Artikel 21 Absatz 2(g) und Artikel 20 Absatz 2?",
        nl: "Welke groepen hebben training nodig op grond van Artikel 21(2)(g) en Artikel 20(2)?",
      },
      options: [
        { en: "Only the IT department", de: "Nur die IT-Abteilung", nl: "Alleen de IT-afdeling" },
        { en: "All staff (annual awareness), technical roles (role-specific), and the management body (its own programme)", de: "Alle Mitarbeitenden (jährliche Sensibilisierung), technische Rollen (rollenspezifisch) und die Geschäftsleitung (eigenes Programm)", nl: "Alle medewerkers (jaarlijkse bewustmaking), technische rollen (rolspecifiek) en het bestuurlijk orgaan (eigen programma)" },
        { en: "Only employees who have failed a phishing simulation", de: "Nur Mitarbeitende, die bei einer Phishing-Simulation durchgefallen sind", nl: "Alleen medewerkers die gezakt zijn voor een phishingsimulatie" },
        { en: "Only new hires during their first year", de: "Nur neue Mitarbeitende im ersten Jahr", nl: "Alleen nieuwe medewerkers in hun eerste jaar" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Training applies to all staff (annual awareness), technical and high-risk roles (role-specific training), and the management body (Article 20(2)).",
        de: "Schulungen gelten für alle Mitarbeitenden (jährliche Sensibilisierung), technische und Hochrisiko-Rollen (rollenspezifische Schulung) und die Geschäftsleitung (Artikel 20 Absatz 2).",
        nl: "Training geldt voor alle medewerkers (jaarlijkse bewustmaking), technische en hoogrisicorol len (rolspecifieke training) en het bestuurlijk orgaan (Artikel 20(2)).",
      },
    },
    {
      id: "2.12.3",
      question: {
        en: "What happens if the CEO skips the phishing simulation or exempts themselves from the awareness programme?",
        de: "Was passiert, wenn der CEO die Phishing-Simulation überspringt oder sich vom Sensibilisierungsprogramm ausnimmt?",
        nl: "Wat gebeurt er als de CEO de phishingsimulatie overslaat of zichzelf vrijstelt van het bewustmakingsprogramma?",
      },
      options: [
        { en: "Nothing - the CEO is too senior for phishing simulations", de: "Nichts - der CEO ist zu hochrangig für Phishing-Simulationen", nl: "Niets - de CEO is te senior voor phishingsimulaties" },
        { en: "The CISO receives a warning", de: "Der CISO erhält eine Warnung", nl: "De CISO ontvangt een waarschuwing" },
        { en: "It creates a personal audit finding under BSI Standard 200-1 Principle 6", de: "Es entsteht eine persönliche Audit-Feststellung gemäß BSI-Standard 200-1 Grundsatz 6", nl: "Het levert een persoonlijke auditbevinding op onder BSI-standaard 200-1 Principe 6" },
        { en: "The company's training programme is suspended", de: "Das Schulungsprogramm des Unternehmens wird ausgesetzt", nl: "Het trainingsprogramma van het bedrijf wordt opgeschort" },
      ],
      correctIndex: 2,
      explanation: {
        en: "BSI Standard 200-1 Principle 6 requires the management body to follow all security rules themselves - a CEO who exempts themselves creates a personal finding.",
        de: "BSI-Standard 200-1 Grundsatz 6 verlangt, dass die Geschäftsleitung alle Sicherheitsregeln selbst befolgt - ein CEO, der sich selbst ausnimmt, erzeugt eine persönliche Feststellung.",
        nl: "BSI-standaard 200-1 Principe 6 vereist dat het bestuurlijk orgaan zelf alle beveiligingsregels naleeft - een CEO die zichzelf vrijstelt, creëert een persoonlijke auditbevinding.",
      },
    },
  ],
});

export default quiz;
