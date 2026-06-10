import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.15",
  passingScore: 75,
  questions: [
    {
      id: "2.15.1",
      question: {
        en: "For which four categories is MFA effectively mandatory for a NIS2 entity?",
        de: "Für welche vier Kategorien ist MFA für eine NIS2-Einrichtung faktisch verpflichtend?",
        nl: "Voor welke vier categorieën is MFA feitelijk verplicht voor een NIS2-entiteit?",
      },
      options: [
        { en: "Personal email, social media, personal banking, and personal devices", de: "Private E-Mail, soziale Medien, privates Banking und persönliche Geräte", nl: "Persoonlijke e-mail, sociale media, persoonlijk bankieren en persoonlijke apparaten" },
        { en: "Remote access, administrator accounts, critical systems, and email", de: "Fernzugriff, Administratorkonten, kritische Systeme und E-Mail", nl: "Toegang op afstand, beheerdersaccounts, kritieke systemen en e-mail" },
        { en: "Marketing tools, HR systems, accounting software, and the company website", de: "Marketing-Tools, HR-Systeme, Buchhaltungssoftware und die Unternehmenswebsite", nl: "Marketingtools, HR-systemen, boekhoudsoftware en de bedrijfswebsite" },
        { en: "Board meetings, investor portals, press releases, and internal chat", de: "Vorstandssitzungen, Investorenportale, Pressemitteilungen und interner Chat", nl: "Bestuursvergaderingen, investeerdersportalen, persberichten en interne chat" },
      ],
      correctIndex: 1,
      explanation: {
        en: "MFA is effectively mandatory on remote access, administrator accounts, critical systems (databases, backups, payment systems), and email.",
        de: "MFA ist faktisch verpflichtend für Fernzugriff, Administratorkonten, kritische Systeme (Datenbanken, Backups, Zahlungssysteme) und E-Mail.",
        nl: "MFA is feitelijk verplicht voor toegang op afstand, beheerdersaccounts, kritieke systemen (databases, back-ups, betaalsystemen) en e-mail.",
      },
    },
    {
      id: "2.15.2",
      question: {
        en: "What is an 'out-of-band channel' and why is it needed?",
        de: "Was ist ein 'Out-of-Band-Kanal' und wozu wird er benötigt?",
        nl: "Wat is een 'out-of-band kanaal' en waarom is het nodig?",
      },
      options: [
        { en: "A backup internet connection; needed for faster downloads", de: "Eine Backup-Internetverbindung; benötigt für schnellere Downloads", nl: "Een reserveinternetverbinding; nodig voor snellere downloads" },
        { en: "A separate emergency communication path that works when normal systems are compromised", de: "Ein separater Notfallkommunikationsweg, der funktioniert, wenn die normalen Systeme kompromittiert sind", nl: "Een apart noodcommunicatiepad dat werkt wanneer normale systemen gecompromitteerd zijn" },
        { en: "An encrypted email service; needed for regulatory compliance", de: "Ein verschlüsselter E-Mail-Dienst; benötigt für regulatorische Compliance", nl: "Een versleutelde e-mailservice; nodig voor naleving van regelgeving" },
        { en: "A public communication channel for press releases during incidents", de: "Ein öffentlicher Kommunikationskanal für Pressemitteilungen bei Vorfällen", nl: "Een openbaar communicatiekanaal voor persberichten tijdens incidenten" },
      ],
      correctIndex: 1,
      explanation: {
        en: "An out-of-band channel is a separate communication path (separate messaging tool, dedicated phone line) for when normal systems are down - if the crisis plan relies on email and email is compromised, it fails.",
        de: "Ein Out-of-Band-Kanal ist ein separater Kommunikationsweg (separates Messaging-Tool, dedizierte Telefonleitung) für den Fall, dass normale Systeme ausfallen - wenn der Krisenplan auf E-Mail basiert und E-Mail kompromittiert ist, funktioniert er nicht.",
        nl: "Een out-of-band kanaal is een apart communicatiepad voor wanneer normale systemen uitvallen - als het crisisplan afhankelijk is van e-mail en e-mail gecompromitteerd is, werkt het niet.",
      },
    },
    {
      id: "2.15.3",
      question: {
        en: "Why is the CEO's own account the first one the auditor checks for MFA?",
        de: "Warum ist das Konto des CEO das erste, das der Auditor auf MFA prüft?",
        nl: "Waarom is het account van de CEO het eerste dat de auditor controleert op MFA?",
      },
      options: [
        { en: "Because the CEO's account contains the most sensitive data", de: "Weil das Konto des CEO die sensibelsten Daten enthält", nl: "Omdat het account van de CEO de gevoeligste gegevens bevat" },
        { en: "Because BSI Standard 200-1 Principle 6 requires the management body to personally follow the security controls they approved", de: "Weil BSI-Standard 200-1 Grundsatz 6 verlangt, dass die Geschäftsleitung die von ihr genehmigten Sicherheitsmaßnahmen persönlich befolgt", nl: "Omdat BSI-standaard 200-1 Principe 6 vereist dat het leidinggevend orgaan de beveiligingsmaatregelen die zij hebben goedgekeurd persoonlijk naleeft" },
        { en: "Because the auditor starts alphabetically and CEO comes first", de: "Weil der Auditor alphabetisch vorgeht und CEO an erster Stelle steht", nl: "Omdat de auditor alfabetisch begint en CEO als eerste komt" },
        { en: "Because the regulator specifically named the CEO role in Article 21", de: "Weil die Aufsichtsbehörde die CEO-Rolle in Artikel 21 ausdrücklich benannt hat", nl: "Omdat de toezichthouder de CEO-rol specifiek heeft genoemd in Artikel 21" },
      ],
      correctIndex: 1,
      explanation: {
        en: "BSI Standard 200-1 Principle 6 names the management body's lead-by-example duty - a CEO who approved MFA but exempted their own login creates a personal audit finding.",
        de: "BSI-Standard 200-1 Grundsatz 6 benennt die Vorbildfunktion der Geschäftsleitung - ein CEO, der MFA genehmigt hat, aber seinen eigenen Login davon ausnimmt, erzeugt eine persönliche Audit-Feststellung.",
        nl: "BSI-standaard 200-1 Principe 6 benoemt de voorbeeldfunctie van het leidinggevend orgaan - een CEO die MFA heeft goedgekeurd maar zijn eigen login hiervan heeft vrijgesteld, creëert een persoonlijke auditbevinding.",
      },
    },
  ],
});

export default quiz;
