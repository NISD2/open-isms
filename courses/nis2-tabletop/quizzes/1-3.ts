import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.3",
  passingScore: 75,
  questions: [
    {
      id: "1.3.1",
      question: {
        en: "Which of the following is a facilitator responsibility?",
        de: "Welches ist eine Aufgabe der Moderation?",
      },
      options: [
        { en: "Playing the IT manager role in the scenario", de: "Die Rolle der IT-Verantwortlichen im Szenario spielen" },
        { en: "Giving participants the right answer when they get stuck", de: "Den Teilnehmenden die richtige Antwort geben, wenn sie nicht weiterkommen" },
        { en: "Narrating injects, enforcing decision capture, and keeping time", de: "Ereignisse erzählen, Entscheidungen festhalten und die Zeit behalten" },
        { en: "Advocating for the most defensible decision at each gate", de: "Bei jeder Entscheidung für die am besten verteidigungsfähige Option werben" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The facilitator narrates, captures decisions, keeps time, and stays neutral. They do not play roles, do not coach, and do not advocate.",
        de: "Die Moderation erzählt, hält Entscheidungen fest, behält die Zeit und bleibt neutral. Sie spielt keine Rollen, coacht nicht und wirbt nicht für eine Position.",
      },
    },
    {
      id: "1.3.2",
      question: {
        en: "Why does it matter that the facilitator does not play a role in the scenario?",
        de: "Warum ist es wichtig, dass die Moderation keine Rolle im Szenario übernimmt?",
      },
      options: [
        { en: "Because the platform refuses to record their decisions", de: "Weil die Plattform deren Entscheidungen nicht aufzeichnet" },
        { en: "Because the exercise loses its independent observer and the protocol becomes less defensible", de: "Weil die Übung sonst ihre unabhängige Beobachtung verliert und das Protokoll schwächer wird" },
        { en: "Because the BSI revokes recognition of the exercise", de: "Weil das BSI sonst die Anerkennung der Übung entzieht" },
        { en: "Because cyber insurance will deny the claim", de: "Weil die Cyber-Versicherung sonst den Schaden ablehnt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The protocol's credibility depends on having an independent observer. A facilitator who also plays in the scenario removes that independence.",
        de: "Die Glaubwürdigkeit des Protokolls hängt von einer unabhängigen Beobachtung ab. Wer moderiert und gleichzeitig im Szenario mitspielt, hebt diese Unabhängigkeit auf.",
      },
    },
    {
      id: "1.3.3",
      question: {
        en: "Which option is NOT a valid way for a small team to handle facilitator separation?",
        de: "Welche Option ist KEIN gültiger Weg für ein kleines Team, die Trennung der Moderation zu erreichen?",
      },
      options: [
        { en: "Rotating facilitation across years", de: "Die Moderation jahresweise rotieren" },
        { en: "Swapping facilitators with a peer organisation", de: "Die Moderation mit einem Partnerunternehmen tauschen" },
        { en: "Engaging an external observer", de: "Eine externe Beobachtung beauftragen" },
        { en: "Having the facilitator also act as the IT manager but writing it down", de: "Die Moderation übernimmt zusätzlich die IT-Rolle und schreibt das auf" },
      ],
      correctIndex: 3,
      explanation: {
        en: "Writing it down does not solve the independence problem. Rotation, peer swap, or external observer are the three valid approaches.",
        de: "Aufschreiben löst das Problem der Unabhängigkeit nicht. Rotation, Partnertausch oder externe Beobachtung sind die drei gültigen Lösungen.",
      },
    },
  ],
});

export default quiz;
