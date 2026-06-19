import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.2",
  passingScore: 75,
  questions: [
    {
      id: "2.2.1",
      question: {
        en: "What are the four rounds of the hot wash debrief?",
        de: "Wie heißen die vier Runden des Hot-Wash-Debriefs?",
        fr: "Quelles sont les quatre phases du débriefing à chaud (hot wash) ?",
        it: "Quali sono le quattro fasi del debriefing a caldo (hot wash)?",
        es: "¿Cuáles son las cuatro rondas del balance en caliente (hot wash)?",
        pl: "Jakie są cztery rundy omówienia na gorąco (hot wash)?",
      },
      options: [
        { en: "Detection, response, recovery, lessons", de: "Erkennung, Reaktion, Wiederherstellung, Lessons", fr: "Détection, réponse, rétablissement, leçons", it: "Rilevamento, risposta, ripristino, lezioni", es: "Detección, respuesta, recuperación, lecciones", pl: "Wykrywanie, reakcja, przywracanie, wnioski" },
        { en: "What went well, what went badly, what surprised us, what needs to change", de: "Was gut lief, was nicht funktionierte, was uns überraschte, was sich ändern muss", fr: "Ce qui a bien fonctionné, ce qui a mal fonctionné, ce qui nous a surpris, ce qui doit changer", it: "Cosa è andato bene, cosa è andato male, cosa ci ha sorpreso, cosa deve cambiare", es: "Qué salió bien, qué salió mal, qué nos sorprendió, qué debe cambiar", pl: "Co poszło dobrze, co poszło źle, co nas zaskoczyło, co musi się zmienić" },
        { en: "Praise, blame, plan, dismiss", de: "Lob, Schuldzuweisung, Plan, Abschluss", fr: "Éloge, reproche, plan, clôture", it: "Lode, colpa, piano, chiusura", es: "Elogio, culpa, plan, cierre", pl: "Pochwała, obwinianie, plan, zakończenie" },
        { en: "Severity, scope, impact, root cause", de: "Schwere, Umfang, Auswirkung, Grundursache", fr: "Gravité, portée, impact, cause racine", it: "Gravità, ambito, impatto, causa principale", es: "Gravedad, alcance, impacto, causa raíz", pl: "Powaga, zakres, wpływ, przyczyna źródłowa" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The four-beat structure separates honest reflection (the first three rounds) from action planning (the fourth round). Surprise findings are the highest-value lessons.",
        de: "Die Vier-Runden-Struktur trennt ehrliche Reflexion (die ersten drei Runden) von der Maßnahmenplanung (die vierte Runde). Überraschende Erkenntnisse sind die wertvollsten Lektionen.",
        fr: "La structure en quatre temps sépare la réflexion honnête (les trois premières phases) de la planification des actions (la quatrième phase). Les constats inattendus sont les leçons les plus précieuses.",
        it: "La struttura in quattro fasi separa la riflessione onesta (le prime tre fasi) dalla pianificazione delle azioni (la quarta fase). I risultati inattesi sono le lezioni di maggior valore.",
        es: "La estructura de cuatro tiempos separa la reflexión honesta (las tres primeras rondas) de la planificación de acciones (la cuarta ronda). Los hallazgos inesperados son las lecciones de mayor valor.",
        pl: "Czteroetapowa struktura oddziela szczerą refleksję (pierwsze trzy rundy) od planowania działań (czwarta runda). Zaskakujące ustalenia to najcenniejsze wnioski.",
      },
    },
    {
      id: "2.2.2",
      question: {
        en: "Why is the 'no blame' rule the most important determinant of future participation?",
        de: "Warum ist die Regel \"keine Schuldzuweisungen\" entscheidend für die Beteiligung in künftigen Übungen?",
        fr: "Pourquoi la règle du « sans reproche » est-elle le déterminant le plus important de la participation future ?",
        it: "Perché la regola del « niente colpe » è il fattore più importante per la partecipazione futura?",
        es: "¿Por qué la regla de « sin culpas » es el factor más importante para la participación futura?",
        pl: "Dlaczego zasada « bez obwiniania » jest najważniejszym czynnikiem decydującym o przyszłym uczestnictwie?",
      },
      options: [
        { en: "Because the BSI requires blame-free debriefs", de: "Weil das BSI schuldfreie Debriefs verlangt", fr: "Parce que le BSI exige des débriefings sans reproche", it: "Perché il BSI richiede debriefing senza colpe", es: "Porque el BSI exige balances sin culpas", pl: "Ponieważ BSI wymaga omówień bez obwiniania" },
        { en: "Because cyber insurance policies penalise named individuals", de: "Weil Cyber-Versicherungs-Policen namentlich genannte Personen sanktionieren", fr: "Parce que les polices d'assurance cyber pénalisent les personnes nommément désignées", it: "Perché le polizze di assicurazione cyber penalizzano le persone indicate per nome", es: "Porque las pólizas de ciberseguro penalizan a las personas nombradas", pl: "Ponieważ polisy ubezpieczenia cybernetycznego karzą osoby wymienione z nazwiska" },
        { en: "Because a team that experiences blame learns not to participate honestly in the next exercise", de: "Weil ein Team, das beschuldigt wurde, lernt, in der nächsten Übung nicht mehr ehrlich zu sein", fr: "Parce qu'une équipe qui subit des reproches apprend à ne plus participer honnêtement lors de l'exercice suivant", it: "Perché un team che subisce colpe impara a non partecipare onestamente all'esercitazione successiva", es: "Porque un equipo que sufre culpas aprende a no participar con honestidad en el siguiente ejercicio", pl: "Ponieważ zespół, który doświadcza obwiniania, uczy się nie uczestniczyć szczerze w kolejnym ćwiczeniu" },
        { en: "Because the platform deletes named findings", de: "Weil die Plattform namentliche Erkenntnisse löscht", fr: "Parce que la plateforme supprime les constats nominatifs", it: "Perché la piattaforma elimina i risultati nominativi", es: "Porque la plataforma elimina los hallazgos nominativos", pl: "Ponieważ platforma usuwa ustalenia wskazujące osoby z nazwiska" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Findings that name a person teach the team that honest disclosure is punished. The rule rephrases person-blame into process-gap, preserving honest reflection in future exercises.",
        de: "Erkenntnisse, die eine Person nennen, lehren das Team, dass ehrliche Offenlegung bestraft wird. Die Regel formuliert Personen-Schuld in Prozesslücken um und bewahrt die ehrliche Reflexion für künftige Übungen.",
        fr: "Les constats qui nomment une personne enseignent à l'équipe que la divulgation honnête est punie. La règle reformule le reproche personnel en lacune de processus, préservant la réflexion honnête lors des exercices futurs.",
        it: "I risultati che indicano una persona insegnano al team che la divulgazione onesta viene punita. La regola riformula la colpa personale come lacuna di processo, preservando la riflessione onesta nelle esercitazioni future.",
        es: "Los hallazgos que nombran a una persona enseñan al equipo que la divulgación honesta se castiga. La regla reformula la culpa personal como brecha de proceso, preservando la reflexión honesta en los ejercicios futuros.",
        pl: "Ustalenia wskazujące konkretną osobę uczą zespół, że szczere ujawnianie jest karane. Zasada przekształca obwinianie osoby w lukę procesową, zachowując szczerą refleksję w przyszłych ćwiczeniach.",
      },
    },
    {
      id: "2.2.3",
      question: {
        en: "What does each improvement item from the hot wash need?",
        de: "Welche Felder braucht jeder Verbesserungspunkt aus dem Hot Wash?",
        fr: "De quoi a besoin chaque point d'amélioration issu du hot wash ?",
        it: "Di che cosa ha bisogno ogni elemento di miglioramento emerso dal hot wash?",
        es: "¿Qué necesita cada elemento de mejora del hot wash?",
        pl: "Czego potrzebuje każdy punkt usprawnienia wynikający z hot wash?",
      },
      options: [
        { en: "A description only", de: "Nur eine Beschreibung", fr: "Une description uniquement", it: "Solo una descrizione", es: "Solo una descripción", pl: "Tylko opis" },
        { en: "Owner, deadline, linked Article 21(2) measure, and closure criterion", de: "Verantwortliche Person, Frist, Bezug zur Maßnahme aus Artikel 21(2) und Abschluss-Kriterium", fr: "Responsable, échéance, mesure liée de l'article 21(2) et critère de clôture", it: "Responsabile, scadenza, misura collegata dell'articolo 21(2) e criterio di chiusura", es: "Responsable, fecha límite, medida vinculada del artículo 21(2) y criterio de cierre", pl: "Osoba odpowiedzialna, termin, powiązany środek z artykułu 21(2) oraz kryterium zamknięcia" },
        { en: "A risk score and a Jira ticket", de: "Eine Risiko-Einstufung und ein Jira-Ticket", fr: "Un score de risque et un ticket Jira", it: "Un punteggio di rischio e un ticket Jira", es: "Una puntuación de riesgo y un ticket de Jira", pl: "Ocena ryzyka i zgłoszenie w Jira" },
        { en: "Just the owner", de: "Nur die verantwortliche Person", fr: "Uniquement le responsable", it: "Solo il responsabile", es: "Solo el responsable", pl: "Tylko osoba odpowiedzialna" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Each item needs five fields: what, owner, deadline, linked statutory reference, and closure criterion. Without these the item is not trackable and does not produce follow-up evidence.",
        de: "Jeder Punkt braucht fünf Felder: was, verantwortliche Person, Frist, rechtlicher Bezug und Abschluss-Kriterium. Ohne diese ist der Punkt nicht nachverfolgbar und erzeugt keine Folgenachweise.",
        fr: "Chaque point nécessite cinq champs : quoi, responsable, échéance, référence légale liée et critère de clôture. Sans ceux-ci, le point n'est pas traçable et ne produit pas de preuve de suivi.",
        it: "Ogni elemento richiede cinque campi: cosa, responsabile, scadenza, riferimento normativo collegato e criterio di chiusura. Senza questi, l'elemento non è tracciabile e non produce prove di follow-up.",
        es: "Cada elemento necesita cinco campos: qué, responsable, fecha límite, referencia legal vinculada y criterio de cierre. Sin ellos, el elemento no es rastreable y no produce evidencia de seguimiento.",
        pl: "Każdy punkt wymaga pięciu pól: co, osoba odpowiedzialna, termin, powiązane odniesienie prawne oraz kryterium zamknięcia. Bez nich punkt nie jest możliwy do śledzenia i nie generuje dowodów następczych.",
      },
    },
  ],
});

export default quiz;
