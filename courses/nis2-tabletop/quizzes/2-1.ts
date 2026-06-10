import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.1",
  passingScore: 75,
  questions: [
    {
      id: "2.1.1",
      question: {
        en: "In the ransomware scenario, when does the Article 23 clock start?",
        de: "Wann startet im Ransomware-Szenario die Uhr nach Artikel 23?",
      },
      options: [
        { en: "When the SIEM raises an alert at 08:50", de: "Wenn das SIEM um 08:50 einen Alarm auslöst" },
        { en: "When the IT manager finds .lockbit3 file extensions and calls the CEO at 09:14", de: "Wenn die IT-Verantwortliche um 09:14 die .lockbit3-Dateiendungen findet und die Geschäftsführung anruft" },
        { en: "When forensic triage confirms the encryption at 11:00", de: "Wenn die forensische Erstanalyse um 11:00 die Verschlüsselung bestätigt" },
        { en: "When the CSIRT acknowledges the early warning", de: "Wenn das CSIRT die Frühwarnung bestätigt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The clock starts when a responsible person becomes aware. The IT manager calling the CEO at 09:14 with confirmed indicators is that moment.",
        de: "Die Uhr startet bei der Kenntniserlangung durch eine verantwortliche Person. Der Anruf der IT-Verantwortlichen um 09:14 mit bestätigten Indikatoren ist dieser Moment.",
      },
    },
    {
      id: "2.1.2",
      question: {
        en: "Why must the external IR provider be engaged early in the scenario?",
        de: "Warum sollte der externe IR-Dienstleister im Szenario früh eingeschaltet werden?",
      },
      options: [
        { en: "Because the cyber insurance policy requires it", de: "Weil die Cyber-Versicherungs-Police es verlangt" },
        { en: "Because internal teams cannot legally do forensics in Germany", de: "Weil interne Teams in Deutschland keine Forensik durchführen dürfen" },
        { en: "Because late engagement finds an environment where evidence has been overwritten and the timeline is no longer reconstructable", de: "Weil eine späte Einschaltung eine Umgebung vorfindet, in der Beweise überschrieben sind und die Zeitleiste nicht mehr rekonstruiert werden kann" },
        { en: "Because the IR provider needs 24 hours to arrive on site", de: "Weil der IR-Dienstleister 24 Stunden Anreise braucht" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Engaging late means panicked sysadmins, partial restores, and lost evidence. The pre-negotiated contract and runbook contact exist to make early engagement automatic.",
        de: "Eine späte Einschaltung führt zu panischen Admins, teilweisen Wiederherstellungen und verlorenen Beweisen. Der vorab abgeschlossene Vertrag und der Runbook-Kontakt sorgen für eine automatische frühe Einschaltung.",
      },
    },
    {
      id: "2.1.3",
      question: {
        en: "Why is the latest backup not automatically the right restore point in a ransomware scenario?",
        de: "Warum ist die neueste Datensicherung bei einem Ransomware-Szenario nicht automatisch der richtige Wiederherstellungspunkt?",
      },
      options: [
        { en: "Because the latest backup is always corrupted", de: "Weil die neueste Sicherung immer beschädigt ist" },
        { en: "Because the attacker may have been in the environment for weeks before encryption, making the latest backup compromised", de: "Weil die Täterschaft Wochen vor der Verschlüsselung in der Umgebung gewesen sein kann und die neueste Sicherung bereits kompromittiert ist" },
        { en: "Because backups need 48 hours to verify", de: "Weil Sicherungen 48 Stunden Prüfung brauchen" },
        { en: "Because the cyber insurance policy mandates the use of the second-newest backup", de: "Weil die Cyber-Versicherung die Nutzung der zweitneuesten Sicherung vorschreibt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Ransomware operators typically dwell for weeks before encryption. The right restore point is the most recent backup that pre-dates the initial compromise, confirmed clean by forensics.",
        de: "Ransomware-Täterschaft verweilt typischerweise Wochen vor der Verschlüsselung. Der richtige Wiederherstellungspunkt ist die jüngste Sicherung vor der ersten Kompromittierung, durch Forensik als sauber bestätigt.",
      },
    },
    {
      id: "2.1.4",
      question: {
        en: "What is the common decision pattern across all twelve scenarios in the library?",
        de: "Welches Entscheidungsmuster ist allen zwölf Szenarien der Bibliothek gemeinsam?",
      },
      options: [
        { en: "Significance assessment, escalation, external help, containment, regulator cascade, customer comms, final report", de: "Erheblichkeits-Prüfung, Eskalation, externe Hilfe, Eindämmung, Meldekette an die Behörde, Kundenkommunikation, Abschlussbericht" },
        { en: "Detection, containment, eradication, recovery, lessons learned", de: "Erkennung, Eindämmung, Beseitigung, Wiederherstellung, Lessons Learned" },
        { en: "Triage, escalation, BSI notification, public statement", de: "Erstanalyse, Eskalation, BSI-Meldung, öffentliche Stellungnahme" },
        { en: "Forensics, restore, audit, board report", de: "Forensik, Wiederherstellung, Audit, Aufsichtsrat-Bericht" },
      ],
      correctIndex: 0,
      explanation: {
        en: "Every NIS 2 scenario follows this seven-step pattern. The scenarios differ in the trigger and the §30(2) measures stressed, but the decision pattern is constant.",
        de: "Jedes NIS-2-Szenario folgt diesem siebenstufigen Muster. Die Szenarien unterscheiden sich im Auslöser und in den betonten Maßnahmen aus §30(2), das Entscheidungsmuster bleibt jedoch gleich.",
      },
    },
  ],
});

export default quiz;
