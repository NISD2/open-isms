import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.10",
  passingScore: 75,
  questions: [
    {
      id: "2.10.1",
      question: {
        en: "What are the three duties bundled into Measure 5?",
        de: "Welche drei Pflichten sind in Maßnahme 5 gebündelt?",
        nl: "Wat zijn de drie verplichtingen die in Maatregel 5 zijn gebundeld?",
      },
      options: [
        { en: "Backup, recovery, and crisis management", de: "Backup, Wiederherstellung und Krisenmanagement", nl: "Back-up, herstel en crisismanagement" },
        { en: "Secure acquisition, secure development, and vulnerability handling", de: "Sichere Beschaffung, sichere Entwicklung und Schwachstellenbehandlung", nl: "Veilige inkoop, veilige ontwikkeling en kwetsbaarheidsbeheer" },
        { en: "Risk analysis, risk treatment, and risk acceptance", de: "Risikoanalyse, Risikobehandlung und Risikoakzeptanz", nl: "Risicoanalyse, risicobehandeling en risicoacceptatie" },
        { en: "Training, awareness, and phishing simulations", de: "Schulung, Sensibilisierung und Phishing-Simulationen", nl: "Training, bewustwording en phishingsimulaties" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Measure 5 bundles secure acquisition, secure development, and vulnerability handling - with patching being the most important month to month.",
        de: "Maßnahme 5 bündelt sichere Beschaffung, sichere Entwicklung und Schwachstellenbehandlung - wobei das Patching im Tagesgeschäft am wichtigsten ist.",
        nl: "Maatregel 5 bundelt veilige inkoop, veilige ontwikkeling en kwetsbaarheidsbeheer - waarbij patching van maand tot maand het belangrijkst is.",
      },
    },
    {
      id: "2.10.2",
      question: {
        en: "What is a 'patch SLA'?",
        de: "Was ist ein 'Patch-SLA'?",
        nl: "Wat is een 'patch-SLA'?",
      },
      options: [
        { en: "A service contract with the software vendor for updates", de: "Ein Servicevertrag mit dem Softwareanbieter für Updates", nl: "Een servicecontract met de softwareleverancier voor updates" },
        { en: "A written deadline for applying patches, set by severity level", de: "Eine schriftlich festgelegte Frist für das Einspielen von Patches, gestaffelt nach Schweregrad", nl: "Een schriftelijk vastgelegde deadline voor het toepassen van patches, ingedeeld naar ernst" },
        { en: "A report generated after each patch is applied", de: "Ein Bericht, der nach jedem eingespielten Patch erstellt wird", nl: "Een rapport dat na elke toegepaste patch wordt gegenereerd" },
        { en: "A legal agreement between the company and the auditor", de: "Eine rechtliche Vereinbarung zwischen dem Unternehmen und dem Auditor", nl: "Een juridische overeenkomst tussen het bedrijf en de auditor" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A patch SLA is the written deadline for applying patches, grouped by severity level - the specific timelines are yours to set but must exist on paper.",
        de: "Ein Patch-SLA ist die schriftlich festgelegte Frist für das Einspielen von Patches, gestaffelt nach Schweregrad - die konkreten Zeitvorgaben legen Sie selbst fest, müssen aber dokumentiert sein.",
        nl: "Een patch-SLA is de schriftelijk vastgelegde deadline voor het toepassen van patches, gegroepeerd naar ernstniveau - de concrete tijdlijnen stelt u zelf vast, maar ze moeten op papier bestaan.",
      },
    },
    {
      id: "2.10.3",
      question: {
        en: "What is the single most important operational evidence for Measure 5?",
        de: "Was ist der wichtigste operative Nachweis für Maßnahme 5?",
        nl: "Wat is het belangrijkste operationele bewijs voor Maatregel 5?",
      },
      options: [
        { en: "A list of all software the company uses", de: "Eine Liste aller vom Unternehmen genutzten Software", nl: "Een lijst van alle software die het bedrijf gebruikt" },
        { en: "A written patch SLA and a quarterly report on whether you are meeting it", de: "Ein schriftlicher Patch-SLA und ein vierteljährlicher Bericht über dessen Einhaltung", nl: "Een schriftelijke patch-SLA en een kwartaalrapportage over de naleving ervan" },
        { en: "A copy of every patch applied in the last year", de: "Eine Kopie jedes im letzten Jahr eingespielten Patches", nl: "Een kopie van elke patch die het afgelopen jaar is toegepast" },
        { en: "A signed policy document from the CISO", de: "Ein vom CISO unterschriebenes Richtliniendokument", nl: "Een door de CISO ondertekend beleidsdocument" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A written patch SLA and a quarterly report on SLA compliance is the single most important operational evidence - the auditor asks for both.",
        de: "Ein schriftlicher Patch-SLA und ein vierteljährlicher Bericht über die SLA-Einhaltung sind der wichtigste operative Nachweis - der Auditor fragt nach beidem.",
        nl: "Een schriftelijke patch-SLA en een kwartaalrapportage over de SLA-naleving zijn het belangrijkste operationele bewijs - de auditor vraagt naar allebei.",
      },
    },
    {
      id: "2.10.4",
      question: {
        en: "What is 'vulnerability disclosure' in the context of Measure 5?",
        de: "Was bedeutet 'Vulnerability Disclosure' im Kontext von Maßnahme 5?",
        nl: "Wat is 'kwetsbaarheidsmelding' in de context van Maatregel 5?",
      },
      options: [
        { en: "Publicly announcing every vulnerability found in your own systems", de: "Jede in den eigenen Systemen gefundene Schwachstelle öffentlich bekannt zu geben", nl: "Elke kwetsbaarheid die in uw eigen systemen wordt gevonden openbaar bekendmaken" },
        { en: "A published way for outside security researchers to report bugs to your company", de: "Ein veröffentlichter Weg, über den externe Sicherheitsforscher Schwachstellen an Ihr Unternehmen melden können", nl: "Een gepubliceerde manier voor externe beveiligingsonderzoekers om kwetsbaarheden aan uw bedrijf te melden" },
        { en: "Sharing vulnerability data with competitors", de: "Schwachstellendaten mit Wettbewerbern zu teilen", nl: "Kwetsbaarheidsgegevens delen met concurrenten" },
        { en: "The CISO's annual report to the board on known vulnerabilities", de: "Der jährliche Bericht des CISO an den Vorstand über bekannte Schwachstellen", nl: "Het jaarlijkse rapport van de CISO aan het bestuur over bekende kwetsbaarheden" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Vulnerability disclosure means having a published process for outsiders to report bugs - some NIS2 entities are required to have a public disclosure page.",
        de: "Vulnerability Disclosure bedeutet, einen veröffentlichten Prozess zu haben, über den Externe Schwachstellen melden können - einige NIS2-Einrichtungen sind verpflichtet, eine öffentliche Disclosure-Seite bereitzustellen.",
        nl: "Kwetsbaarheidsmelding betekent een gepubliceerd proces hebben waarmee buitenstaanders kwetsbaarheden kunnen melden - sommige NIS2-entiteiten zijn verplicht een openbare meldingspagina te hebben.",
      },
    },
  ],
});

export default quiz;
