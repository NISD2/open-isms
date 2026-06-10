import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.1",
  passingScore: 75,
  questions: [
    {
      id: "3.1.1",
      question: {
        en: "What is the floor an auditor expects for tabletop cadence?",
        de: "Welche Mindesthäufigkeit erwartet ein Audit für Tabletop-Übungen?",
      },
      options: [
        { en: "Once every five years", de: "Einmal alle fünf Jahre" },
        { en: "Once every three years", de: "Einmal alle drei Jahre" },
        { en: "At least annually", de: "Mindestens einmal jährlich" },
        { en: "Only after a real incident", de: "Nur nach einem echten Vorfall" },
      ],
      correctIndex: 2,
      explanation: {
        en: "BSI Standard 200-4 §6.5 and ISO 22301:2019 Section 8.6 converge on at least annual cadence. Less than annually reads as inadequate testing.",
        de: "BSI-Standard 200-4 §6.5 und ISO 22301:2019 Abschnitt 8.6 stimmen auf mindestens jährliche Häufigkeit überein. Seltener wird als unzureichendes Testen gewertet.",
      },
    },
    {
      id: "3.1.2",
      question: {
        en: "Which of these triggers an ad-hoc exercise outside the annual rhythm?",
        de: "Welches Ereignis löst eine zusätzliche Übung außerhalb des Jahresrhythmus aus?",
      },
      options: [
        { en: "Quarterly board meetings", de: "Quartalsweise Aufsichtsrats-Sitzungen" },
        { en: "Major IT change such as a new ERP or core platform migration", de: "Eine größere IT-Änderung wie ein neues ERP oder die Migration einer Kernplattform" },
        { en: "Hiring a new junior developer", de: "Die Einstellung einer Junior-Entwicklerin" },
        { en: "Receiving a marketing email from a competitor", de: "Eine Marketing-E-Mail eines Wettbewerbers" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Major IT changes, new sector entry, new critical supplier, post-real-incident reviews, and leadership change all justify ad-hoc exercises.",
        de: "Größere IT-Änderungen, Eintritt in einen neuen Sektor, ein neuer kritischer Lieferant, Aufarbeitung eines realen Vorfalls und Wechsel in der Führung rechtfertigen zusätzliche Übungen.",
      },
    },
    {
      id: "3.1.3",
      question: {
        en: "Which training duty does this course attestation discharge?",
        de: "Welche Schulungspflicht erfüllt die Bescheinigung dieses Kurses?",
      },
      options: [
        { en: "The management body training duty under Article 20(2) NIS 2", de: "Die Schulungspflicht der Geschäftsleitung nach Artikel 20(2) NIS 2" },
        { en: "Role-specific cybersecurity training under Article 21(2)(g) NIS 2 for the facilitator role", de: "Rollenspezifische Cybersicherheits-Schulung nach Artikel 21(2)(g) NIS 2 für die Moderationsrolle" },
        { en: "The data protection officer training under Article 39 GDPR", de: "Die Datenschutzbeauftragten-Schulung nach Artikel 39 DSGVO" },
        { en: "Both Article 20(2) and Article 21(2)(g) simultaneously", de: "Artikel 20(2) und Artikel 21(2)(g) gleichzeitig" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The attestation discharges Article 21(2)(g) for the facilitator. The management body course is a separate product that discharges Article 20(2).",
        de: "Die Bescheinigung erfüllt Artikel 21(2)(g) für die Moderationsrolle. Der Geschäftsleitungs-Kurs ist ein separates Angebot, das Artikel 20(2) erfüllt.",
      },
    },
    {
      id: "3.1.4",
      question: {
        en: "When does the Article 23 clock start in any scenario?",
        de: "Wann startet die Uhr nach Artikel 23 in jedem Szenario?",
      },
      options: [
        { en: "On detection by automated monitoring", de: "Bei der Erkennung durch ein automatisches Monitoring" },
        { en: "On becoming aware enough to assess the incident as significant", de: "Mit der Kenntniserlangung, die die Beurteilung als erheblich erlaubt" },
        { en: "When the IT team begins remediation", de: "Wenn das IT-Team mit der Behebung beginnt" },
        { en: "When the CEO is informed", de: "Wenn die Geschäftsführung informiert wird" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(4)(a) NIS 2 uses 'becoming aware,' not detection. Awareness is when a responsible person knows enough to assess significance.",
        de: "Artikel 23(4)(a) NIS 2 spricht von Kenntniserlangung, nicht von Detektion. Kenntniserlangung bedeutet, dass eine verantwortliche Person genug weiß, um die Erheblichkeit zu beurteilen.",
      },
    },
    {
      id: "3.1.5",
      question: {
        en: "Why does the management body need to be in the room for the tabletop?",
        de: "Warum muss die Geschäftsleitung bei der Tabletop-Übung im Raum sein?",
      },
      options: [
        { en: "To approve catering", de: "Um die Bewirtung freizugeben" },
        { en: "Because Article 20(1) NIS 2 makes them personally responsible and the exercise rehearses decisions only they can make in a real crisis", de: "Weil Artikel 20(1) NIS 2 sie persönlich verantwortlich macht und die Übung Entscheidungen probt, die nur sie in einer echten Krise treffen kann" },
        { en: "Because the IT team needs an audience", de: "Weil das IT-Team ein Publikum braucht" },
        { en: "Because the CSIRT requires it", de: "Weil das CSIRT es verlangt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 20(1) NIS 2 personal responsibility cannot be discharged by a memo. The decisions that matter are the management body's.",
        de: "Die persönliche Verantwortung nach Artikel 20(1) NIS 2 lässt sich nicht durch eine Aktennotiz erfüllen. Die entscheidenden Entscheidungen sind Sache der Geschäftsleitung.",
      },
    },
    {
      id: "3.1.6",
      question: {
        en: "Which is NOT a valid response to the facilitator-separation problem in a small team?",
        de: "Welche Option ist KEINE gültige Lösung für das Trennungs-Problem der Moderation in einem kleinen Team?",
      },
      options: [
        { en: "Rotating facilitation across years", de: "Die Moderation jahresweise rotieren" },
        { en: "Swapping facilitators with a peer organisation", de: "Die Moderation mit einem Partnerunternehmen tauschen" },
        { en: "Engaging an external observer", de: "Eine externe Beobachtung beauftragen" },
        { en: "Having one person be both facilitator and in-scenario IT manager", de: "Eine Person übernimmt Moderation und IT-Rolle im Szenario gleichzeitig" },
      ],
      correctIndex: 3,
      explanation: {
        en: "The same person cannot be both facilitator and an in-scenario participant. Rotation, peer swap, or external observer are the three valid options.",
        de: "Dieselbe Person kann nicht gleichzeitig Moderation und Mitspielende im Szenario sein. Rotation, Partnertausch oder externe Beobachtung sind die drei gültigen Lösungen.",
      },
    },
    {
      id: "3.1.7",
      question: {
        en: "What goes into an improvement item from the hot wash?",
        de: "Welche Felder gehören zu einem Verbesserungspunkt aus dem Hot Wash?",
      },
      options: [
        { en: "A description and a vague timeline", de: "Eine Beschreibung und eine grobe Zeitvorstellung" },
        { en: "What, owner, deadline, linked Article 21(2) measure, and closure criterion", de: "Was, verantwortliche Person, Frist, Bezug zur Maßnahme aus Artikel 21(2) und Abschluss-Kriterium" },
        { en: "Just the owner's name", de: "Nur der Name der verantwortlichen Person" },
        { en: "Only the description and a priority", de: "Nur Beschreibung und Priorität" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Five fields make improvement items trackable and audit-ready: what, owner, deadline, statutory link, and closure criterion.",
        de: "Fünf Felder machen Verbesserungspunkte nachverfolgbar und audit-tauglich: was, verantwortliche Person, Frist, rechtlicher Bezug und Abschluss-Kriterium.",
      },
    },
    {
      id: "3.1.8",
      question: {
        en: "Why is a Live-System Tabletop protocol stronger evidence than a Word-file protocol?",
        de: "Warum ist ein Live-System-Tabletop-Protokoll ein stärkerer Nachweis als ein Word-Datei-Protokoll?",
      },
      options: [
        { en: "Because PDFs cannot be edited", de: "Weil PDFs nicht bearbeitet werden können" },
        { en: "Because it lands in the same audit trail and the same format as real incident reports, making the simulated and real incidents indistinguishable in evidence shape", de: "Weil es im selben Audit-Trail und im selben Format wie echte Vorfallsberichte landet und somit fiktive und reale Vorfälle in der Nachweisform identisch wirken" },
        { en: "Because the BSI prefers PDFs", de: "Weil das BSI PDFs bevorzugt" },
        { en: "Because Word files cannot be signed digitally", de: "Weil Word-Dateien nicht digital signiert werden können" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Structural sameness with real-incident evidence is the underlying claim. The audit trail treats both as the same artefact type, with only the exercise flag distinguishing them.",
        de: "Die strukturelle Gleichheit mit echten Vorfallsnachweisen ist die zentrale Aussage. Der Audit-Trail behandelt beide als denselben Artefakt-Typ; nur das Übungs-Kennzeichen unterscheidet sie.",
      },
    },
  ],
});

export default quiz;
