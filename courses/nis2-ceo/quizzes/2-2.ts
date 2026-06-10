import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.2",
  passingScore: 75,
  questions: [
    {
      id: "2.2.1",
      question: {
        en: "What is an 'asset' in NIS2 compliance language?",
        de: "Was ist ein 'Asset' in der NIS2-Compliance-Sprache?",
        nl: "Wat is een 'asset' in de NIS2-nalevingstaal?",
      },
      options: [
        { en: "Only servers and laptops owned by the company", de: "Nur firmeneigene Server und Laptops", nl: "Alleen servers en laptops die eigendom zijn van het bedrijf" },
        { en: "Anything the business depends on to operate", de: "Alles, wovon der Geschäftsbetrieb abhängt", nl: "Alles waarvan de bedrijfsvoering afhankelijk is" },
        { en: "Only digital systems connected to the internet", de: "Nur digitale Systeme mit Internetverbindung", nl: "Alleen digitale systemen die verbonden zijn met het internet" },
        { en: "Hardware listed in the IT department's budget", de: "Hardware, die im IT-Budget aufgeführt ist", nl: "Hardware die vermeld staat in het IT-budget" },
      ],
      correctIndex: 1,
      explanation: {
        en: "An asset is anything the business depends on - people, processes, cloud subscriptions, buildings, suppliers, and business processes, not just IT hardware.",
        de: "Ein Asset ist alles, wovon das Unternehmen abhängt - Mitarbeitende, Prozesse, Cloud-Abonnements, Gebäude, Lieferanten und Geschäftsprozesse, nicht nur IT-Hardware.",
        nl: "Een asset is alles waarvan het bedrijf afhankelijk is - mensen, processen, cloudabonnementen, gebouwen, leveranciers en bedrijfsprocessen, niet alleen IT-hardware.",
      },
    },
    {
      id: "2.2.2",
      question: {
        en: "What was the root cause of the Equifax breach described in the lesson?",
        de: "Was war die Ursache des in der Lektion beschriebenen Equifax-Datenlecks?",
        nl: "Wat was de grondoorzaak van het Equifax-datalek zoals beschreven in de les?",
      },
      options: [
        { en: "The patch did not exist yet", de: "Der Patch existierte noch nicht", nl: "De patch bestond nog niet" },
        { en: "The team lacked the technical capability to apply the patch", de: "Das Team verfügte nicht über die technischen Fähigkeiten, den Patch einzuspielen", nl: "Het team beschikte niet over de technische capaciteit om de patch toe te passen" },
        { en: "The server was not on the asset inventory", de: "Der Server war nicht im Asset-Inventar erfasst", nl: "De server stond niet in het asset-inventaris" },
        { en: "The firewall was misconfigured", de: "Die Firewall war falsch konfiguriert", nl: "De firewall was verkeerd geconfigureerd" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The patch existed and the team was capable - the server was simply not on any list, so it was missed during the patching cycle.",
        de: "Der Patch existierte und das Team war fähig - der Server war schlicht auf keiner Liste erfasst und wurde daher beim Patching-Zyklus übersehen.",
        nl: "De patch bestond en het team was bekwaam - de server stond simpelweg op geen enkele lijst en werd daardoor gemist tijdens de patchcyclus.",
      },
    },
    {
      id: "2.2.3",
      question: {
        en: "What does the auditor ask for before policies, the risk matrix, or anything else?",
        de: "Was verlangt der Auditor noch vor Richtlinien, der Risikomatrix oder allem anderen?",
        nl: "Wat vraagt de auditor op vóór beleid, de risicomatrix of wat dan ook?",
      },
      options: [
        { en: "The incident response plan", de: "Den Incident-Response-Plan", nl: "Het incidentresponsplan" },
        { en: "The CEO's signed approval", de: "Die unterschriebene Genehmigung des CEO", nl: "De ondertekende goedkeuring van de CEO" },
        { en: "The asset inventory", de: "Das Asset-Inventar", nl: "Het asset-inventaris" },
        { en: "The annual budget", de: "Das Jahresbudget", nl: "Het jaarbudget" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The auditor asks for the asset inventory first because every other control is only as complete as the list it covers.",
        de: "Der Auditor fragt zuerst nach dem Asset-Inventar, weil jede andere Maßnahme nur so vollständig ist wie die Liste, die sie abdeckt.",
        nl: "De auditor vraagt als eerste om het asset-inventaris, omdat elke andere maatregel slechts zo volledig is als de lijst die het dekt.",
      },
    },
  ],
});

export default quiz;
