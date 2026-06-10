import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.2",
  passingScore: 75,
  questions: [
    {
      id: "1.2.1",
      question: {
        en: "Why must the management body physically participate in the tabletop?",
        de: "Warum muss die Geschäftsleitung persönlich an der Tabletop-Übung teilnehmen?",
      },
      options: [
        { en: "Because Article 20(1) NIS 2 makes the management body personally responsible, and an exercise without them cannot evidence oversight", de: "Weil Artikel 20(1) NIS 2 die Geschäftsleitung persönlich verantwortlich macht und eine Übung ohne sie die Aufsicht nicht nachweisen kann" },
        { en: "Because the BSI requires it under Standard 200-4", de: "Weil das BSI es im Standard 200-4 verlangt" },
        { en: "Because the cyber insurance policy requires it", de: "Weil die Cyber-Versicherungs-Police es verlangt" },
        { en: "Because the auditor will refuse to sign the report otherwise", de: "Weil das Audit sonst die Freigabe des Berichts verweigert" },
      ],
      correctIndex: 0,
      explanation: {
        en: "Article 20(1) NIS 2 makes the management body personally responsible. The exercise must rehearse the decisions the responsible person would make.",
        de: "Artikel 20(1) NIS 2 macht die Geschäftsleitung persönlich verantwortlich. Die Übung muss die Entscheidungen durchspielen, die die verantwortliche Person treffen würde.",
      },
    },
    {
      id: "1.2.2",
      question: {
        en: "Which of the following is NOT a mandatory role in a tabletop?",
        de: "Welche der folgenden Rollen ist KEINE Pflichtrolle bei einer Tabletop-Übung?",
      },
      options: [
        { en: "Management body representative", de: "Vertretung der Geschäftsleitung" },
        { en: "IT manager", de: "IT-Verantwortliche" },
        { en: "Communications lead", de: "Kommunikations-Verantwortliche" },
        { en: "External cyber insurance contact", de: "Externer Cyber-Versicherungs-Kontakt" },
      ],
      correctIndex: 3,
      explanation: {
        en: "The cyber insurance contact is strongly recommended but not mandatory. The four mandatory roles are management body, facilitator, IT manager, and communications or legal lead.",
        de: "Der Cyber-Versicherungs-Kontakt ist dringend empfohlen, aber nicht verpflichtend. Die vier Pflichtrollen sind Geschäftsleitung, Moderation, IT-Verantwortliche und Kommunikations- oder Rechts-Verantwortliche.",
      },
    },
    {
      id: "1.2.3",
      question: {
        en: "What is the realistic minimum number of people for a defensible Mittelstand tabletop?",
        de: "Wie viele Personen sind das realistische Minimum für eine verteidigungsfähige Tabletop-Übung im Mittelstand?",
      },
      options: [
        { en: "Two", de: "Zwei" },
        { en: "Four", de: "Vier" },
        { en: "Eight", de: "Acht" },
        { en: "Twelve", de: "Zwölf" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Four: management body representative, facilitator, IT manager, and a combined communications/legal lead.",
        de: "Vier: Vertretung der Geschäftsleitung, Moderation, IT-Verantwortliche und eine kombinierte Kommunikations-/Rechts-Verantwortliche.",
      },
    },
    {
      id: "1.2.4",
      question: {
        en: "What does an auditor conclude when the protocol shows no management body participation?",
        de: "Was schließt ein Audit, wenn das Protokoll keine Teilnahme der Geschäftsleitung zeigt?",
      },
      options: [
        { en: "That the exercise was efficient", de: "Dass die Übung effizient verlief" },
        { en: "That the management body delegated correctly", de: "Dass die Geschäftsleitung korrekt delegiert hat" },
        { en: "That the Article 20(1) duty is being skipped", de: "Dass die Pflicht aus Artikel 20(1) übersprungen wird" },
        { en: "That the IT team is well-trained", de: "Dass das IT-Team gut geschult ist" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The absence of a management body signature is read as evidence the Article 20(1) NIS 2 personal-responsibility duty is being skipped.",
        de: "Das Fehlen einer Unterschrift der Geschäftsleitung wird als Hinweis gelesen, dass die persönliche Verantwortungspflicht aus Artikel 20(1) NIS 2 übersprungen wird.",
      },
    },
  ],
});

export default quiz;
