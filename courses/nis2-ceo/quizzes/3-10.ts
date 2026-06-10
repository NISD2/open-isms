import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "3.10",
  passingScore: 75,
  questions: [
    {
      id: "3.10.1",
      question: {
        en: "What is the financial threshold for a significant incident under CIR 2024/2690?",
        de: "Welcher finanzielle Schwellenwert gilt für einen erheblichen Vorfall gemäß CIR 2024/2690?",
        nl: "Wat is de financiële drempelwaarde voor een significant incident op grond van CIR 2024/2690?",
      },
      options: [
        { en: "One million euros", de: "Eine Million Euro", nl: "Één miljoen euro" },
        { en: "Five hundred thousand euros or five percent of turnover, whichever is lower", de: "Fünfhunderttausend Euro oder fünf Prozent des Umsatzes, je nachdem welcher Wert niedriger ist", nl: "Vijfhonderdduizend euro of vijf procent van de omzet, afhankelijk van wat lager is" },
        { en: "Ten percent of annual revenue", de: "Zehn Prozent des Jahresumsatzes", nl: "Tien procent van de jaaromzet" },
        { en: "Two hundred fifty thousand euros", de: "Zweihundertfünfzigtausend Euro", nl: "Tweehonderdvijftigduizend euro" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CIR 2024/2690 Article 3: significant if financial loss exceeds five hundred thousand euros or five percent of turnover, whichever is lower.",
        de: "CIR 2024/2690 Artikel 3: erheblich, wenn der finanzielle Verlust fünfhunderttausend Euro oder fünf Prozent des Umsatzes übersteigt, je nachdem welcher Wert niedriger ist.",
        nl: "CIR 2024/2690 Artikel 3: significant als het financieel verlies vijfhonderdduizend euro of vijf procent van de omzet overschrijdt, afhankelijk van wat lager is.",
      },
    },
    {
      id: "3.10.2",
      question: {
        en: "What does the recurring incidents rule under CIR Article 4 say?",
        de: "Was besagt die Regel zu wiederkehrenden Vorfaellen gemäß CIR Artikel 4?",
        nl: "Wat zegt de regel voor terugkerende incidenten van CIR Artikel 4?",
      },
      options: [
        { en: "Each incident must be reported individually regardless of size", de: "Jeder Vorfall muss einzeln gemeldet werden, unabhaengig von der Groesse", nl: "Elk incident moet afzonderlijk worden gemeld ongeacht de omvang" },
        { en: "Two or more incidents in six months sharing the same root cause that together cross the threshold count as one significant incident", de: "Zwei oder mehr Vorfaelle innerhalb von sechs Monaten mit derselben Ursache, die zusammen den Schwellenwert überschreiten, gelten als ein erheblicher Vorfall", nl: "Twee of meer incidenten in zes maanden met dezelfde hoofdoorzaak die samen de drempel overschrijden, tellen als één significant incident" },
        { en: "Incidents more than six months old are no longer reportable", de: "Vorfaelle, die aelter als sechs Monate sind, sind nicht mehr meldepflichtig", nl: "Incidenten ouder dan zes maanden zijn niet meer meldingsplichtig" },
        { en: "Recurring incidents are exempt from reporting if each one is individually below the threshold", de: "Wiederkehrende Vorfaelle sind von der Meldepflicht befreit, wenn jeder einzelne unter dem Schwellenwert liegt", nl: "Terugkerende incidenten zijn vrijgesteld van melding als elk afzonderlijk incident onder de drempel ligt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The recurring incidents rule chains multiple small incidents with the same root cause into one reportable event if they collectively cross the financial threshold within six months.",
        de: "Die Regel zu wiederkehrenden Vorfaellen verkettet mehrere kleine Vorfaelle mit derselben Ursache zu einem meldepflichtigen Ereignis, wenn sie gemeinsam den finanziellen Schwellenwert innerhalb von sechs Monaten überschreiten.",
        nl: "De regel voor terugkerende incidenten koppelt meerdere kleine incidenten met dezelfde hoofdoorzaak tot één meldingsplichtige gebeurtenis als ze samen de financiële drempel overschrijden binnen zes maanden.",
      },
    },
    {
      id: "3.10.3",
      question: {
        en: "In the lesson's 'messy version' of the phishing scenario, why did the company file a protective report?",
        de: "Warum hat das Unternehmen in der 'unübersichtlichen Version' des Phishing-Szenarios eine Schutzmeldung eingereicht?",
        nl: "In de 'rommelige versie' van het phishingscenario, waarom diende het bedrijf een voorzorgsmelding in?",
      },
      options: [
        { en: "Because the financial loss exceeded the threshold", de: "Weil der finanzielle Verlust den Schwellenwert überschritten hat", nl: "Omdat het financieel verlies de drempel overschreed" },
        { en: "Because trade secrets were confirmed exfiltrated", de: "Weil die Exfiltration von Geschaeftsgeheimnissen bestätigtt wurde", nl: "Omdat de uitlek van bedrijfsgeheimen werd bevestigd" },
        { en: "Because the company could not determine whether the attacker reached customer data - they could not prove it was not significant", de: "Weil das Unternehmen nicht feststellen konnte, ob der Angreifer Kundendaten erreicht hat - sie konnten nicht beweisen, dass es nicht erheblich war", nl: "Omdat het bedrijf niet kon bepalen of de aanvaller klantgegevens had bereikt - ze konden niet bewijzen dat het niet significant was" },
        { en: "Because the recurring incidents rule applied", de: "Weil die Regel zu wiederkehrenden Vorfaellen griff", nl: "Omdat de regel voor terugkerende incidenten van toepassing was" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The company filed not because the incident was severe, but because they could not prove it was not - uncertainty required a protective filing.",
        de: "Das Unternehmen meldete nicht, weil der Vorfall schwerwiegend war, sondern weil es nicht beweisen konnte, dass er es nicht war - die Unsicherheit erforderte eine Schutzmeldung.",
        nl: "Het bedrijf meldde niet omdat het incident ernstig was, maar omdat ze niet konden bewijzen dat het dat niet was - onzekerheid vereiste een voorzorgsmelding.",
      },
    },
    {
      id: "3.10.4",
      question: {
        en: "What four questions determine whether a phishing success is reportable?",
        de: "Welche vier Fragen bestimmen, ob ein erfolgreicher Phishing-Angriff meldepflichtig ist?",
        nl: "Welke vier vragen bepalen of een phishingsucces meldingsplichtig is?",
      },
      options: [
        { en: "Who was phished, what email client was used, was antivirus running, was the password strong", de: "Wer wurde per Phishing angegriffen, welcher E-Mail-Client wurde verwendet, war ein Antivirenprogramm aktiv, war das Passwort stark", nl: "Wie werd gephished, welke e-mailclient werd gebruikt, was antivirus actief, was het wachtwoord sterk" },
        { en: "Did the attacker use the credentials, what did they access, was data exfiltrated, does the financial impact cross the threshold", de: "Hat der Angreifer die Zugangsdaten verwendet, worauf hat er zugegriffen, wurden Daten exfiltriert, überschreitet die finanzielle Auswirkung den Schwellenwert", nl: "Heeft de aanvaller de inloggegevens gebruikt, waartoe hadden ze toegang, zijn er gegevens uitgelekt, overschrijdt de financiële impact de drempel" },
        { en: "Was the employee trained, was the email flagged, was IT notified, was the account locked", de: "War der Mitarbeiter geschult, wurde die E-Mail markiert, wurde die IT benachrichtigt, wurde das Konto gesperrt", nl: "Was de medewerker getraind, werd de e-mail gemarkeerd, werd IT ingelicht, werd het account vergrendeld" },
        { en: "How many employees were targeted, how long was the account exposed, was management informed, was the regulator contacted", de: "Wie viele Mitarbeiter waren betroffen, wie lange war das Konto exponiert, wurde die Geschaeftsfuehrung informiert, wurde die Aufsichtsbehörde kontaktiert", nl: "Hoeveel medewerkers werden getarget, hoe lang was het account blootgesteld, werd de directie ingelicht, werd de toezichthouder gecontacteerd" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Four questions: has the attacker used the credentials, what did those credentials access, was data exfiltrated, does this cross the CIR thresholds.",
        de: "Vier Fragen: Hat der Angreifer die Zugangsdaten verwendet, worauf hatten diese Zugangsdaten Zugriff, wurden Daten exfiltriert, überschreitet dies die CIR-Schwellenwerte.",
        nl: "Vier vragen: heeft de aanvaller de inloggegevens gebruikt, waartoe gaven die inloggegevens toegang, zijn er gegevens uitgelekt, overschrijdt dit de CIR-drempelwaarden.",
      },
    },
  ],
});

export default quiz;
