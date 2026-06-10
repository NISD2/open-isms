import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.8",
  passingScore: 75,
  questions: [
    {
      id: "3.8.1",
      question: {
        en: "What are the three reporting deadlines under Article 23 after discovering a significant incident?",
        de: "Welche drei Meldefristen gelten gemäß Artikel 23 nach der Entdeckung eines erheblichen Vorfalls?",
        nl: "Wat zijn de drie meldingstermijnen op grond van Artikel 23 na het ontdekken van een significant incident?",
      },
      options: [
        { en: "12 hours, 48 hours, two weeks", de: "12 Stunden, 48 Stunden, zwei Wochen", nl: "12 uur, 48 uur, twee weken" },
        { en: "24 hours for early warning, 72 hours for formal report, one month for final analysis", de: "24 Stunden für die Frühwarnung, 72 Stunden für den formellen Bericht, ein Monat für die Abschlussanalyse", nl: "24 uur voor vroegtijdige waarschuwing, 72 uur voor formeel rapport, één maand voor eindanalyse" },
        { en: "48 hours, one week, three months", de: "48 Stunden, eine Woche, drei Monate", nl: "48 uur, één week, drie maanden" },
        { en: "Immediately, 24 hours, one week", de: "Sofort, 24 Stunden, eine Woche", nl: "Onmiddellijk, 24 uur, één week" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 23(1): twenty-four hours for an early warning, seventy-two hours for a formal report, one month for the final analysis.",
        de: "Artikel 23 Absatz 1: vierundzwanzig Stunden für eine Frühwarnung, zweiundsiebzig Stunden für einen formellen Bericht, ein Monat für die Abschlussanalyse.",
        nl: "Artikel 23(1): vierentwintig uur voor een vroegtijdige waarschuwing, tweeënzeventig uur voor een formeel rapport, één maand voor de eindanalyse.",
      },
    },
    {
      id: "3.8.2",
      question: {
        en: "Why should you preserve evidence before restoring from backups?",
        de: "Warum sollten Sie Beweise sichern, bevor Sie aus Backups wiederherstellen?",
        nl: "Waarom moet u bewijs bewaren vóór u vanuit back-ups herstelt?",
      },
      options: [
        { en: "Because backups may also be infected", de: "Weil auch die Backups infiziert sein koennten", nl: "Omdat back-ups mogelijk ook besmet zijn" },
        { en: "Because restoring before forensics destroys the evidence chain and leaves the entry vector open", de: "Weil eine Wiederherstellung vor der Forensik die Beweiskette zerstoert und den Angriffsvektor offen laesst", nl: "Omdat herstellen vóór forensisch onderzoek de bewijsketen vernietigt en de toegangsvector open laat" },
        { en: "Because the regulator requires you to wait 72 hours before restoring", de: "Weil die Aufsichtsbehörde verlangt, dass Sie 72 Stunden mit der Wiederherstellung warten", nl: "Omdat de toezichthouder vereist dat u 72 uur wacht met herstellen" },
        { en: "Because insurance companies will not pay if you restore too quickly", de: "Weil Versicherungen nicht zahlen, wenn Sie zu schnell wiederherstellen", nl: "Omdat verzekeraars niet betalen als u te snel herstelt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Restoring before forensics examines compromised systems destroys the evidence chain and leaves the entry vector open. Norsk Hydro shifted to manual production to buy forensics time.",
        de: "Eine Wiederherstellung, bevor die Forensik kompromittierte Systeme untersucht hat, zerstoert die Beweiskette und laesst den Angriffsvektor offen. Norsk Hydro stellte auf manuelle Produktion um, um der Forensik Zeit zu verschaffen.",
        nl: "Herstellen vóórdat forensisch onderzoek gecompromitteerde systemen heeft onderzocht, vernietigt de bewijsketen en laat de toegangsvector open. Norsk Hydro schakelde over op handmatige productie om forensisch onderzoekers tijd te geven.",
      },
    },
    {
      id: "3.8.3",
      question: {
        en: "What five decisions belong to the CEO alone in the first forty-eight hours of a ransomware attack?",
        de: "Welche fünf Entscheidungen liegen in den ersten achtundvierzig Stunden eines Ransomware-Angriffs allein beim CEO?",
        nl: "Welke vijf beslissingen zijn uitsluitend van de CEO in de eerste achtenveertig uur van een ransomwareaanval?",
      },
      options: [
        { en: "Call insurance, contact police, shut down servers, notify customers, pay the ransom", de: "Versicherung anrufen, Polizei kontaktieren, Server herunterfahren, Kunden benachrichtigen, Loesegeld zahlen", nl: "Verzekering bellen, politie contacteren, servers afsluiten, klanten informeren, losgeld betalen" },
        { en: "Declare the crisis, authorise emergency spending, preserve evidence before restoring, file the report, hold the line on payment", de: "Die Krise erklaeren, Notfallausgaben genehmigen, Beweise vor der Wiederherstellung sichern, den Bericht einreichen, an der Zahlungsverweigerung festhalten", nl: "De crisis declareren, nooduitgaven autoriseren, bewijs bewaren vóór herstel, het rapport indienen, de lijn vasthouden over betaling" },
        { en: "Activate IT response, brief the board, contact the press, hire a consultant, file the report", de: "IT-Reaktion aktivieren, den Vorstand informieren, die Presse kontaktieren, einen Berater engagieren, den Bericht einreichen", nl: "IT-respons activeren, het bestuur briefen, de pers contacteren, een adviseur inhuren, het rapport indienen" },
        { en: "Shut down the network, call the BSI, notify employees, restore backups, review insurance", de: "Netzwerk abschalten, das BSI anrufen, Mitarbeiter benachrichtigen, Backups wiederherstellen, Versicherung prüfen", nl: "Het netwerk afsluiten, de BSI bellen, medewerkers informeren, back-ups herstellen, verzekering controleren" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Five CEO decisions: declare the crisis, authorise emergency spending, preserve evidence before restoring, file the regulatory report, hold the line on ransom payment.",
        de: "Fünf CEO-Entscheidungen: die Krise erklaeren, Notfallausgaben genehmigen, Beweise vor der Wiederherstellung sichern, den regulatorischen Bericht einreichen, an der Zahlungsverweigerung beim Loesegeld festhalten.",
        nl: "Vijf CEO-beslissingen: de crisis declareren, nooduitgaven autoriseren, bewijs bewaren vóór herstel, het regulatoire rapport indienen, de lijn vasthouden over losgeld.",
      },
    },
    {
      id: "3.8.4",
      question: {
        en: "Why did Norsk Hydro's CEO avoid personal liability despite the attack?",
        de: "Warum entging der CEO von Norsk Hydro trotz des Angriffs der persönlichen Haftung?",
        nl: "Waarom ontliep de CEO van Norsk Hydro persoonlijke aansprakelijkheid ondanks de aanval?",
      },
      options: [
        { en: "Because the company paid the ransom quickly", de: "Weil das Unternehmen das Loesegeld schnell bezahlt hat", nl: "Omdat het bedrijf snel het losgeld betaalde" },
        { en: "Because the incident response followed a board-approved plan that existed before the attack", de: "Weil die Vorfallreaktion einem vom Vorstand genehmigten Plan folgte, der vor dem Angriff existierte", nl: "Omdat de incidentrespons een door het bestuur goedgekeurd plan volgde dat vóór de aanval bestond" },
        { en: "Because the attack was too sophisticated to prevent", de: "Weil der Angriff zu ausgekluegelt war, um ihn zu verhindern", nl: "Omdat de aanval te geavanceerd was om te voorkomen" },
        { en: "Because the CEO had cybersecurity insurance", de: "Weil der CEO eine Cybersicherheitsversicherung hatte", nl: "Omdat de CEO een cyberverzekering had" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The response worked because ransomware was on the risk register with a board-approved response plan. The CEO executed what the board had already signed.",
        de: "Die Reaktion funktionierte, weil Ransomware im Risikoregister mit einem vom Vorstand genehmigten Reaktionsplan stand. Der CEO fuehrte aus, was der Vorstand bereits unterschrieben hatte.",
        nl: "De respons werkte omdat ransomware op het risicoregister stond met een door het bestuur goedgekeurd responsplan. De CEO voerde uit wat het bestuur al had ondertekend.",
      },
    },
  ],
});

export default quiz;
