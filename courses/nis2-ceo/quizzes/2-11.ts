import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.11",
  passingScore: 75,
  questions: [
    {
      id: "2.11.1",
      question: {
        en: "What is the difference between KPIs and KRIs?",
        de: "Was ist der Unterschied zwischen KPIs und KRIs?",
        nl: "Wat is het verschil tussen KPI's en KRI's?",
        fr: "Quelle est la différence entre les KPI et les KRI ?",
        it: "Qual è la differenza tra KPI e KRI?",
        es: "¿Cuál es la diferencia entre los KPI y los KRI?",
        pl: "Jaka jest różnica między KPI a KRI?",
      },
      options: [
        { en: "KPIs measure costs; KRIs measure revenue", de: "KPIs messen Kosten; KRIs messen Umsatz", nl: "KPI's meten kosten; KRI's meten omzet", fr: "Les KPI mesurent les coûts ; les KRI mesurent le chiffre d'affaires", it: "I KPI misurano i costi; i KRI misurano il fatturato", es: "Los KPI miden los costes; los KRI miden la facturación", pl: "KPI mierzą koszty; KRI mierzą przychody" },
        { en: "KPIs measure how well a process is running; KRIs measure how much risk the company is carrying", de: "KPIs messen, wie gut ein Prozess funktioniert; KRIs messen, wie viel Risiko das Unternehmen trägt", nl: "KPI's meten hoe goed een proces verloopt; KRI's meten hoeveel risico het bedrijf draagt", fr: "Les KPI mesurent le bon déroulement d'un processus ; les KRI mesurent le niveau de risque que l'entreprise supporte", it: "I KPI misurano quanto bene funziona un processo; i KRI misurano quanto rischio l'impresa sta sostenendo", es: "Los KPI miden el buen funcionamiento de un proceso; los KRI miden cuánto riesgo soporta la empresa", pl: "KPI mierzą, jak dobrze działa proces; KRI mierzą, jak duże ryzyko ponosi firma" },
        { en: "KPIs are for the CISO; KRIs are for the CEO", de: "KPIs sind für den CISO; KRIs sind für den CEO", nl: "KPI's zijn voor de CISO; KRI's zijn voor de CEO", fr: "Les KPI sont pour le CISO ; les KRI sont pour le dirigeant", it: "I KPI sono per il CISO; i KRI sono per l'amministratore delegato", es: "Los KPI son para el CISO; los KRI son para el director general", pl: "KPI są dla CISO; KRI są dla dyrektora generalnego" },
        { en: "KPIs are mandatory; KRIs are optional under NIS2", de: "KPIs sind verpflichtend; KRIs sind unter NIS2 optional", nl: "KPI's zijn verplicht; KRI's zijn optioneel onder NIS2", fr: "Les KPI sont obligatoires ; les KRI sont facultatifs au titre de NIS2", it: "I KPI sono obbligatori; i KRI sono facoltativi ai sensi di NIS2", es: "Los KPI son obligatorios; los KRI son facultativos en virtud de NIS2", pl: "KPI są obowiązkowe; KRI są fakultatywne na podstawie NIS2" },
      ],
      correctIndex: 1,
      explanation: {
        en: "KPIs (Key Performance Indicators) measure process performance (e.g. patch-on-time rate); KRIs (Key Risk Indicators) measure current risk exposure (e.g. open critical vulnerabilities).",
        de: "KPIs (Key Performance Indicators) messen die Prozessleistung (z. B. fristgerechte Patch-Rate); KRIs (Key Risk Indicators) messen die aktuelle Risikoexposition (z. B. offene kritische Schwachstellen).",
        nl: "KPI's (Key Performance Indicators) meten procesprestaties (bijv. tijdige patchrate); KRI's (Key Risk Indicators) meten de huidige risicoblootstelling (bijv. openstaande kritieke kwetsbaarheden).",
        fr: "Les KPI (Key Performance Indicators) mesurent la performance des processus (par exemple le taux de correctifs appliqués à temps) ; les KRI (Key Risk Indicators) mesurent l'exposition au risque actuelle (par exemple les vulnérabilités critiques ouvertes).",
        it: "I KPI (Key Performance Indicators) misurano le prestazioni dei processi (ad esempio il tasso di patch applicate nei tempi); i KRI (Key Risk Indicators) misurano l'esposizione al rischio attuale (ad esempio le vulnerabilità critiche aperte).",
        es: "Los KPI (Key Performance Indicators) miden el rendimiento de los procesos (por ejemplo, la tasa de parches aplicados a tiempo); los KRI (Key Risk Indicators) miden la exposición al riesgo actual (por ejemplo, las vulnerabilidades críticas abiertas).",
        pl: "KPI (Key Performance Indicators) mierzą wydajność procesu (np. wskaźnik łatek zainstalowanych na czas); KRI (Key Risk Indicators) mierzą bieżącą ekspozycję na ryzyko (np. otwarte krytyczne podatności).",
      },
    },
    {
      id: "2.11.2",
      question: {
        en: "What is the auditor's first question when checking Measure 6?",
        de: "Was ist die erste Frage des Auditors bei der Prüfung von Maßnahme 6?",
        nl: "Wat is de eerste vraag van de auditor bij de controle van Maatregel 6?",
        fr: "Quelle est la première question de l'auditeur lors du contrôle de la mesure 6 ?",
        it: "Qual è la prima domanda del revisore quando verifica la misura 6?",
        es: "¿Cuál es la primera pregunta del auditor al comprobar la medida 6?",
        pl: "Jakie jest pierwsze pytanie audytora podczas sprawdzania środka 6?",
      },
      options: [
        { en: "Show me your KPI dashboard", de: "Zeigen Sie mir Ihr KPI-Dashboard", nl: "Laat me uw KPI-dashboard zien", fr: "Montrez-moi votre tableau de bord de KPI", it: "Mostratemi il vostro dashboard di KPI", es: "Muéstreme su panel de KPI", pl: "Proszę pokazać mi pulpit KPI" },
        { en: "Show me the protocol of your last annual management review and the follow-up actions from the previous year", de: "Zeigen Sie mir das Protokoll Ihrer letzten jährlichen Managementbewertung und die Folgemaßnahmen aus dem Vorjahr", nl: "Laat me het verslag van uw laatste jaarlijkse managementbeoordeling zien en de opvolgacties van het voorgaande jaar", fr: "Montrez-moi le procès-verbal de votre dernier réexamen annuel par la direction et les actions de suivi de l'année précédente", it: "Mostratemi il verbale dell'ultimo riesame annuale della direzione e le azioni di follow-up dell'anno precedente", es: "Muéstreme el acta de su última revisión anual por parte de la dirección y las acciones de seguimiento del año anterior", pl: "Proszę pokazać mi protokół z ostatniego corocznego przeglądu zarządczego oraz działania następcze z poprzedniego roku" },
        { en: "Show me your security budget", de: "Zeigen Sie mir Ihr Sicherheitsbudget", nl: "Laat me uw beveiligingsbudget zien", fr: "Montrez-moi votre budget de sécurité", it: "Mostratemi il vostro budget per la sicurezza", es: "Muéstreme su presupuesto de seguridad", pl: "Proszę pokazać mi budżet bezpieczeństwa" },
        { en: "Show me the CISO's quarterly report", de: "Zeigen Sie mir den Quartalsbericht des CISO", nl: "Laat me het kwartaalrapport van de CISO zien", fr: "Montrez-moi le rapport trimestriel du CISO", it: "Mostratemi il rapporto trimestrale del CISO", es: "Muéstreme el informe trimestral del CISO", pl: "Proszę pokazać mi kwartalny raport CISO" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The auditor tests Measure 6 by asking for the management review protocol and whether follow-up actions were closed - not the KPIs themselves.",
        de: "Der Auditor prüft Maßnahme 6, indem er nach dem Managementbewertungsprotokoll und dem Abschluss der Folgemaßnahmen fragt - nicht nach den KPIs selbst.",
        nl: "De auditor toetst Maatregel 6 door te vragen naar het managementbeoordelingsverslag en of de opvolgacties zijn afgerond - niet naar de KPI's zelf.",
        fr: "L'auditeur teste la mesure 6 en demandant le procès-verbal du réexamen par la direction et si les actions de suivi ont été clôturées, et non les KPI eux-mêmes.",
        it: "Il revisore verifica la misura 6 chiedendo il verbale del riesame della direzione e se le azioni di follow-up sono state chiuse, non i KPI in sé.",
        es: "El auditor comprueba la medida 6 pidiendo el acta de la revisión por parte de la dirección y si las acciones de seguimiento se cerraron, no los KPI en sí.",
        pl: "Audytor sprawdza środek 6, pytając o protokół przeglądu zarządczego oraz o to, czy działania następcze zostały zamknięte, a nie o same KPI.",
      },
    },
    {
      id: "2.11.3",
      question: {
        en: "What happens if the management review protocol does not exist?",
        de: "Was passiert, wenn das Managementbewertungsprotokoll nicht existiert?",
        nl: "Wat gebeurt er als het managementbeoordelingsverslag niet bestaat?",
        fr: "Que se passe-t-il si le procès-verbal du réexamen par la direction n'existe pas ?",
        it: "Cosa succede se il verbale del riesame della direzione non esiste?",
        es: "¿Qué ocurre si el acta de la revisión por parte de la dirección no existe?",
        pl: "Co się dzieje, jeśli protokół przeglądu zarządczego nie istnieje?",
      },
      options: [
        { en: "The auditor accepts KPI data as a substitute", de: "Der Auditor akzeptiert KPI-Daten als Ersatz", nl: "De auditor accepteert KPI-gegevens als vervanging", fr: "L'auditeur accepte les données de KPI en remplacement", it: "Il revisore accetta i dati dei KPI in sostituzione", es: "El auditor acepta los datos de KPI como sustituto", pl: "Audytor akceptuje dane KPI jako zamiennik" },
        { en: "The whole of Measure 6 fails the audit regardless of how good the numbers are", de: "Die gesamte Maßnahme 6 besteht das Audit nicht, unabhängig davon wie gut die Zahlen sind", nl: "De gehele Maatregel 6 zakt voor de audit, ongeacht hoe goed de cijfers zijn", fr: "Toute la mesure 6 échoue à l'audit, quelle que soit la qualité des chiffres", it: "L'intera misura 6 non supera l'audit, indipendentemente da quanto siano buoni i dati", es: "Toda la medida 6 no supera la auditoría, por muy buenos que sean los datos", pl: "Cały środek 6 nie przechodzi audytu, niezależnie od tego, jak dobre są liczby" },
        { en: "The CISO can produce a retrospective summary", de: "Der CISO kann eine nachträgliche Zusammenfassung erstellen", nl: "De CISO kan een terugblikkende samenvatting opstellen", fr: "Le CISO peut produire un récapitulatif rétrospectif", it: "Il CISO può produrre un riepilogo retrospettivo", es: "El CISO puede elaborar un resumen retrospectivo", pl: "CISO może sporządzić retrospektywne podsumowanie" },
        { en: "The company gets a warning but passes the audit", de: "Das Unternehmen erhält eine Warnung, besteht aber das Audit", nl: "Het bedrijf krijgt een waarschuwing maar slaagt voor de audit", fr: "L'entreprise reçoit un avertissement mais réussit l'audit", it: "L'impresa riceve un avvertimento ma supera l'audit", es: "La empresa recibe una advertencia pero supera la auditoría", pl: "Firma otrzymuje ostrzeżenie, ale przechodzi audyt" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Without a dated, signed protocol, the management review never happened in the auditor's eyes - the entire measure fails.",
        de: "Ohne ein datiertes, unterschriebenes Protokoll hat die Managementbewertung in den Augen des Auditors nie stattgefunden - die gesamte Maßnahme fällt durch.",
        nl: "Zonder een gedateerd, ondertekend verslag heeft de managementbeoordeling in de ogen van de auditor nooit plaatsgevonden - de gehele maatregel zakt.",
        fr: "Sans procès-verbal daté et signé, le réexamen par la direction n'a jamais eu lieu aux yeux de l'auditeur : toute la mesure échoue.",
        it: "Senza un verbale datato e firmato, il riesame della direzione non è mai avvenuto agli occhi del revisore: l'intera misura non viene superata.",
        es: "Sin un acta fechada y firmada, la revisión por parte de la dirección nunca tuvo lugar a ojos del auditor: toda la medida no se supera.",
        pl: "Bez datowanego, podpisanego protokołu przegląd zarządczy w oczach audytora nigdy się nie odbył - cały środek nie zostaje zaliczony.",
      },
    },
  ],
});

export default quiz;
