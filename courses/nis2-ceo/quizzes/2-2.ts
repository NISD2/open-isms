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
        fr: "Qu'est-ce qu'un 'actif' dans le langage de conformité NIS2 ?",
        it: "Cos'è un 'asset' nel linguaggio della conformità NIS2?",
        es: "¿Qué es un 'activo' en el lenguaje de cumplimiento de NIS2?",
        pl: "Czym jest 'zasób' w języku zgodności NIS2?",
      },
      options: [
        { en: "Only servers and laptops owned by the company", de: "Nur firmeneigene Server und Laptops", nl: "Alleen servers en laptops die eigendom zijn van het bedrijf", fr: "Uniquement les serveurs et ordinateurs portables appartenant à l'entreprise", it: "Solo i server e i portatili di proprietà dell'impresa", es: "Únicamente los servidores y portátiles propiedad de la empresa", pl: "Wyłącznie serwery i laptopy będące własnością firmy" },
        { en: "Anything the business depends on to operate", de: "Alles, wovon der Geschäftsbetrieb abhängt", nl: "Alles waarvan de bedrijfsvoering afhankelijk is", fr: "Tout ce dont l'entreprise dépend pour fonctionner", it: "Tutto ciò da cui l'impresa dipende per operare", es: "Todo aquello de lo que depende la empresa para operar", pl: "Wszystko, od czego zależy działalność firmy" },
        { en: "Only digital systems connected to the internet", de: "Nur digitale Systeme mit Internetverbindung", nl: "Alleen digitale systemen die verbonden zijn met het internet", fr: "Uniquement les systèmes numériques connectés à internet", it: "Solo i sistemi digitali connessi a internet", es: "Únicamente los sistemas digitales conectados a internet", pl: "Wyłącznie systemy cyfrowe połączone z internetem" },
        { en: "Hardware listed in the IT department's budget", de: "Hardware, die im IT-Budget aufgeführt ist", nl: "Hardware die vermeld staat in het IT-budget", fr: "Le matériel figurant dans le budget du service informatique", it: "L'hardware elencato nel budget del reparto IT", es: "El hardware que figura en el presupuesto del departamento de TI", pl: "Sprzęt wymieniony w budżecie działu IT" },
      ],
      correctIndex: 1,
      explanation: {
        en: "An asset is anything the business depends on - people, processes, cloud subscriptions, buildings, suppliers, and business processes, not just IT hardware.",
        de: "Ein Asset ist alles, wovon das Unternehmen abhängt - Mitarbeitende, Prozesse, Cloud-Abonnements, Gebäude, Lieferanten und Geschäftsprozesse, nicht nur IT-Hardware.",
        nl: "Een asset is alles waarvan het bedrijf afhankelijk is - mensen, processen, cloudabonnementen, gebouwen, leveranciers en bedrijfsprocessen, niet alleen IT-hardware.",
        fr: "Un actif est tout ce dont l'entreprise dépend : les personnes, les processus, les abonnements cloud, les bâtiments, les fournisseurs et les processus métier, pas seulement le matériel informatique.",
        it: "Un asset è tutto ciò da cui l'impresa dipende: persone, processi, abbonamenti cloud, edifici, fornitori e processi aziendali, non solo l'hardware IT.",
        es: "Un activo es todo aquello de lo que depende la empresa: personas, procesos, suscripciones en la nube, edificios, proveedores y procesos de negocio, no solo el hardware de TI.",
        pl: "Zasób to wszystko, od czego zależy firma: ludzie, procesy, subskrypcje chmurowe, budynki, dostawcy i procesy biznesowe, a nie tylko sprzęt IT.",
      },
    },
    {
      id: "2.2.2",
      question: {
        en: "What was the root cause of the Equifax breach described in the lesson?",
        de: "Was war die Ursache des in der Lektion beschriebenen Equifax-Datenlecks?",
        nl: "Wat was de grondoorzaak van het Equifax-datalek zoals beschreven in de les?",
        fr: "Quelle était la cause profonde de la violation Equifax décrite dans la leçon ?",
        it: "Qual era la causa principale della violazione Equifax descritta nella lezione?",
        es: "¿Cuál fue la causa raíz de la brecha de Equifax descrita en la lección?",
        pl: "Jaka była przyczyna źródłowa naruszenia Equifax opisanego w lekcji?",
      },
      options: [
        { en: "The patch did not exist yet", de: "Der Patch existierte noch nicht", nl: "De patch bestond nog niet", fr: "Le correctif n'existait pas encore", it: "La patch non esisteva ancora", es: "El parche aún no existía", pl: "Łatka jeszcze nie istniała" },
        { en: "The team lacked the technical capability to apply the patch", de: "Das Team verfügte nicht über die technischen Fähigkeiten, den Patch einzuspielen", nl: "Het team beschikte niet over de technische capaciteit om de patch toe te passen", fr: "L'équipe n'avait pas la capacité technique d'appliquer le correctif", it: "Il team non disponeva delle capacità tecniche per applicare la patch", es: "El equipo carecía de la capacidad técnica para aplicar el parche", pl: "Zespół nie miał technicznych możliwości zastosowania łatki" },
        { en: "The server was not on the asset inventory", de: "Der Server war nicht im Asset-Inventar erfasst", nl: "De server stond niet in het asset-inventaris", fr: "Le serveur ne figurait pas dans l'inventaire des actifs", it: "Il server non era presente nell'inventario degli asset", es: "El servidor no figuraba en el inventario de activos", pl: "Serwer nie znajdował się w inwentaryzacji zasobów" },
        { en: "The firewall was misconfigured", de: "Die Firewall war falsch konfiguriert", nl: "De firewall was verkeerd geconfigureerd", fr: "Le pare-feu était mal configuré", it: "Il firewall era configurato in modo errato", es: "El cortafuegos estaba mal configurado", pl: "Zapora sieciowa była błędnie skonfigurowana" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The patch existed and the team was capable - the server was simply not on any list, so it was missed during the patching cycle.",
        de: "Der Patch existierte und das Team war fähig - der Server war schlicht auf keiner Liste erfasst und wurde daher beim Patching-Zyklus übersehen.",
        nl: "De patch bestond en het team was bekwaam - de server stond simpelweg op geen enkele lijst en werd daardoor gemist tijdens de patchcyclus.",
        fr: "Le correctif existait et l'équipe en était capable : le serveur ne figurait simplement sur aucune liste, il a donc été oublié lors du cycle de correction.",
        it: "La patch esisteva e il team era in grado di applicarla: il server semplicemente non era in alcun elenco ed è stato quindi tralasciato durante il ciclo di patching.",
        es: "El parche existía y el equipo era capaz: el servidor simplemente no figuraba en ninguna lista, por lo que se omitió durante el ciclo de aplicación de parches.",
        pl: "Łatka istniała, a zespół był do tego zdolny: serwer po prostu nie znajdował się na żadnej liście, więc został pominięty podczas cyklu instalowania łatek.",
      },
    },
    {
      id: "2.2.3",
      question: {
        en: "What does the auditor ask for before policies, the risk matrix, or anything else?",
        de: "Was verlangt der Auditor noch vor Richtlinien, der Risikomatrix oder allem anderen?",
        nl: "Wat vraagt de auditor op vóór beleid, de risicomatrix of wat dan ook?",
        fr: "Que demande l'auditeur avant les politiques, la matrice des risques ou toute autre chose ?",
        it: "Cosa chiede il revisore prima delle politiche, della matrice dei rischi o di qualsiasi altra cosa?",
        es: "¿Qué pide el auditor antes que las políticas, la matriz de riesgos o cualquier otra cosa?",
        pl: "O co audytor prosi przed politykami, macierzą ryzyka czy czymkolwiek innym?",
      },
      options: [
        { en: "The incident response plan", de: "Den Incident-Response-Plan", nl: "Het incidentresponsplan", fr: "Le plan de réponse aux incidents", it: "Il piano di risposta agli incidenti", es: "El plan de respuesta a incidentes", pl: "Plan reagowania na incydenty" },
        { en: "The CEO's signed approval", de: "Die unterschriebene Genehmigung des CEO", nl: "De ondertekende goedkeuring van de CEO", fr: "L'approbation signée du dirigeant", it: "L'approvazione firmata dall'amministratore delegato", es: "La aprobación firmada del director general", pl: "Podpisaną akceptację dyrektora generalnego" },
        { en: "The asset inventory", de: "Das Asset-Inventar", nl: "Het asset-inventaris", fr: "L'inventaire des actifs", it: "L'inventario degli asset", es: "El inventario de activos", pl: "Inwentaryzację zasobów" },
        { en: "The annual budget", de: "Das Jahresbudget", nl: "Het jaarbudget", fr: "Le budget annuel", it: "Il budget annuale", es: "El presupuesto anual", pl: "Roczny budżet" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The auditor asks for the asset inventory first because every other control is only as complete as the list it covers.",
        de: "Der Auditor fragt zuerst nach dem Asset-Inventar, weil jede andere Maßnahme nur so vollständig ist wie die Liste, die sie abdeckt.",
        nl: "De auditor vraagt als eerste om het asset-inventaris, omdat elke andere maatregel slechts zo volledig is als de lijst die het dekt.",
        fr: "L'auditeur demande d'abord l'inventaire des actifs, car tout autre contrôle n'est complet que dans la mesure de la liste qu'il couvre.",
        it: "Il revisore chiede per primo l'inventario degli asset, perché ogni altro controllo è completo solo quanto l'elenco che copre.",
        es: "El auditor pide primero el inventario de activos, porque cualquier otro control solo es tan completo como la lista que abarca.",
        pl: "Audytor najpierw prosi o inwentaryzację zasobów, ponieważ każda inna kontrola jest tak kompletna, jak lista, którą obejmuje.",
      },
    },
  ],
});

export default quiz;
