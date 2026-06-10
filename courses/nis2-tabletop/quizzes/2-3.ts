import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.3",
  passingScore: 75,
  questions: [
    {
      id: "2.3.1",
      question: {
        en: "Which of the following is NOT one of the eight required protocol fields?",
        de: "Welches der folgenden Felder gehört NICHT zu den acht Pflichtbestandteilen des Protokolls?",
      },
      options: [
        { en: "Date, duration, and sim-time conversion", de: "Datum, Dauer und Simulationszeit-Umrechnung" },
        { en: "Signed participant register", de: "Unterschriebene Teilnehmendenliste" },
        { en: "Cybersecurity insurance policy number", de: "Police-Nummer der Cyber-Versicherung" },
        { en: "Management body sign-off", de: "Freigabe durch die Geschäftsleitung" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The insurance policy number is not a required field of the protocol. The eight required fields are date and sim-time, scenario summary, signed register, decision log, Article 23 timeline, lessons learned, improvement items, and management body sign-off.",
        de: "Die Police-Nummer ist kein Pflichtbestandteil des Protokolls. Die acht Pflichtbestandteile sind Datum und Simulationszeit, Szenario-Zusammenfassung, unterschriebene Teilnehmendenliste, Entscheidungs-Protokoll, Zeitleiste nach Artikel 23, Lessons Learned, Verbesserungspunkte und Freigabe der Geschäftsleitung.",
      },
    },
    {
      id: "2.3.2",
      question: {
        en: "What does the management body sign-off on the protocol evidence?",
        de: "Was belegt die Freigabe durch die Geschäftsleitung auf dem Protokoll?",
      },
      options: [
        { en: "That the cyber insurance policy was renewed", de: "Dass die Cyber-Versicherung verlängert wurde" },
        { en: "That the CISO ran the exercise correctly", de: "Dass die CISO die Übung korrekt durchgeführt hat" },
        { en: "That the responsible person was personally present and personally approved the findings, closing the Article 20(1) NIS 2 accountability loop", de: "Dass die verantwortliche Person persönlich anwesend war und die Erkenntnisse persönlich freigegeben hat, womit die Verantwortungsschleife nach Artikel 20(1) NIS 2 geschlossen wird" },
        { en: "That the BSI accepts the exercise format", de: "Dass das BSI das Übungsformat akzeptiert" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The management body signature closes the Article 20(1) accountability loop. Without it, the protocol is incomplete and the auditor flags the gap.",
        de: "Die Unterschrift der Geschäftsleitung schließt die Verantwortungsschleife nach Artikel 20(1). Ohne sie ist das Protokoll unvollständig und das Audit markiert die Lücke.",
      },
    },
    {
      id: "2.3.3",
      question: {
        en: "Which evidence form would an auditor reject?",
        de: "Welche Nachweisform würde ein Audit ablehnen?",
      },
      options: [
        { en: "A dated PDF protocol with a management body signature", de: "Eine datierte PDF mit Unterschrift der Geschäftsleitung" },
        { en: "A structured decision log with named decisions, times, and justifications", de: "Ein strukturiertes Entscheidungs-Protokoll mit Namen, Zeiten und Begründungen" },
        { en: "A slide deck summarising the exercise with no decision log", de: "Eine Foliensammlung mit Zusammenfassung der Übung, aber ohne Entscheidungs-Protokoll" },
        { en: "Later evidence showing improvement item N was closed", de: "Ein späterer Nachweis, dass Verbesserungspunkt N abgeschlossen wurde" },
      ],
      correctIndex: 2,
      explanation: {
        en: "A slide deck without a decision log is rejected because it does not contain the audit core: the named decisions, times, and justifications that the protocol depends on.",
        de: "Eine Foliensammlung ohne Entscheidungs-Protokoll wird abgelehnt, weil ihr der Kern des Audits fehlt: die namentlichen Entscheidungen, Zeiten und Begründungen, auf denen das Protokoll basiert.",
      },
    },
    {
      id: "2.3.4",
      question: {
        en: "Why does CIR 2024/2690 Annex Section 4.1 matter for the protocol?",
        de: "Warum ist CIR 2024/2690 Anhang Abschnitt 4.1 für das Protokoll relevant?",
      },
      options: [
        { en: "It requires BCDR plan testing with lessons incorporated; the protocol's improvement items are how those lessons get incorporated", de: "Er verlangt Tests des Geschäftsfortführungs- und Notfallwiederherstellungs-Plans mit aufgenommenen Erkenntnissen; die Verbesserungspunkte des Protokolls sind der Weg, wie diese Erkenntnisse aufgenommen werden" },
        { en: "It requires the protocol to be in Word format", de: "Er verlangt das Protokoll im Word-Format" },
        { en: "It requires the protocol to be signed by a notary", de: "Er verlangt eine notarielle Beglaubigung des Protokolls" },
        { en: "It requires the protocol to be filed with the regulator", de: "Er verlangt die Einreichung des Protokolls bei der Behörde" },
      ],
      correctIndex: 0,
      explanation: {
        en: "CIR Annex 4.1 requires the BCDR plan to be tested, reviewed, and updated, and that the plans 'incorporate lessons learnt from such tests.' The protocol's improvement items are how that incorporation happens.",
        de: "CIR Anhang 4.1 verlangt, dass der BCDR-Plan getestet, überprüft und aktualisiert wird und dass die Pläne \"Erkenntnisse aus solchen Tests aufnehmen\". Die Verbesserungspunkte des Protokolls sind der Weg, wie das geschieht.",
      },
    },
  ],
});

export default quiz;
