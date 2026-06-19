import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.12",
  passingScore: 75,
  questions: [
    {
      id: "2.12.1",
      question: {
        en: "What is the difference between cyber hygiene and cybersecurity training?",
        de: "Was ist der Unterschied zwischen Cyberhygiene und Cybersicherheitsschulungen?",
        nl: "Wat is het verschil tussen cyberhygiëne en cyberbeveiligingstraining?",
        fr: "Quelle est la différence entre l'hygiène informatique et la formation à la cybersécurité ?",
        it: "Qual è la differenza tra igiene informatica e formazione sulla cybersicurezza?",
        es: "¿Cuál es la diferencia entre la higiene cibernética y la formación en ciberseguridad?",
        pl: "Jaka jest różnica między cyberhigieną a szkoleniem z cyberbezpieczeństwa?",
      },
      options: [
        { en: "There is no difference; they are the same thing", de: "Es gibt keinen Unterschied; es ist dasselbe", nl: "Er is geen verschil; het is hetzelfde", fr: "Il n'y a aucune différence ; c'est la même chose", it: "Non c'è alcuna differenza; sono la stessa cosa", es: "No hay diferencia; son lo mismo", pl: "Nie ma różnicy; to to samo" },
        { en: "Cyber hygiene is the daily basics everyone must follow; training is the scheduled programme that keeps those practices alive", de: "Cyberhygiene sind die täglichen Grundregeln, die alle befolgen müssen; Schulung ist das geplante Programm, das diese Praktiken am Leben hält", nl: "Cyberhygiëne zijn de dagelijkse basisregels die iedereen moet volgen; training is het geplande programma dat die praktijken levend houdt", fr: "L'hygiène informatique correspond aux bases quotidiennes que chacun doit suivre ; la formation est le programme planifié qui maintient ces pratiques en vie", it: "L'igiene informatica è l'insieme delle nozioni di base quotidiane che tutti devono seguire; la formazione è il programma pianificato che mantiene vive tali pratiche", es: "La higiene cibernética son los fundamentos diarios que todos deben seguir; la formación es el programa planificado que mantiene vivas esas prácticas", pl: "Cyberhigiena to codzienne podstawy, których każdy musi przestrzegać; szkolenie to zaplanowany program, który utrzymuje te praktyki przy życiu" },
        { en: "Cyber hygiene is for IT staff; training is for management", de: "Cyberhygiene ist für IT-Mitarbeitende; Schulung ist für die Geschäftsleitung", nl: "Cyberhygiëne is voor IT-medewerkers; training is voor het management", fr: "L'hygiène informatique est destinée au personnel informatique ; la formation est destinée à la direction", it: "L'igiene informatica è per il personale IT; la formazione è per la dirigenza", es: "La higiene cibernética es para el personal de TI; la formación es para la dirección", pl: "Cyberhigiena jest dla pracowników IT; szkolenie jest dla kierownictwa" },
        { en: "Cyber hygiene is optional; training is mandatory", de: "Cyberhygiene ist optional; Schulung ist verpflichtend", nl: "Cyberhygiëne is optioneel; training is verplicht", fr: "L'hygiène informatique est facultative ; la formation est obligatoire", it: "L'igiene informatica è facoltativa; la formazione è obbligatoria", es: "La higiene cibernética es facultativa; la formación es obligatoria", pl: "Cyberhigiena jest fakultatywna; szkolenie jest obowiązkowe" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Cyber hygiene is the short list of daily security practices; training is the scheduled programme - Article 21(2)(g) requires both.",
        de: "Cyberhygiene ist die kurze Liste täglicher Sicherheitspraktiken; Schulung ist das geplante Programm - Artikel 21 Absatz 2(g) verlangt beides.",
        nl: "Cyberhygiëne is de korte lijst van dagelijkse beveiligingspraktijken; training is het geplande programma - Artikel 21(2)(g) vereist allebei.",
        fr: "L'hygiène informatique est la courte liste des pratiques de sécurité quotidiennes ; la formation est le programme planifié : l'article 21(2)(g) exige les deux.",
        it: "L'igiene informatica è il breve elenco delle pratiche di sicurezza quotidiane; la formazione è il programma pianificato: l'articolo 21(2)(g) richiede entrambe.",
        es: "La higiene cibernética es la breve lista de prácticas de seguridad diarias; la formación es el programa planificado: el artículo 21(2)(g) exige ambas.",
        pl: "Cyberhigiena to krótka lista codziennych praktyk bezpieczeństwa; szkolenie to zaplanowany program - artykuł 21(2)(g) wymaga obu.",
      },
    },
    {
      id: "2.12.2",
      question: {
        en: "Which groups require training under Article 21(2)(g) and Article 20(2)?",
        de: "Welche Gruppen benötigen Schulungen gemäß Artikel 21 Absatz 2(g) und Artikel 20 Absatz 2?",
        nl: "Welke groepen hebben training nodig op grond van Artikel 21(2)(g) en Artikel 20(2)?",
        fr: "Quels groupes nécessitent une formation au titre de l'article 21(2)(g) et de l'article 20(2) ?",
        it: "Quali gruppi necessitano di formazione ai sensi dell'articolo 21(2)(g) e dell'articolo 20(2)?",
        es: "¿Qué grupos requieren formación en virtud del artículo 21(2)(g) y del artículo 20(2)?",
        pl: "Które grupy wymagają szkolenia na podstawie artykułu 21(2)(g) i artykułu 20(2)?",
      },
      options: [
        { en: "Only the IT department", de: "Nur die IT-Abteilung", nl: "Alleen de IT-afdeling", fr: "Uniquement le service informatique", it: "Solo il reparto IT", es: "Únicamente el departamento de TI", pl: "Wyłącznie dział IT" },
        { en: "All staff (annual awareness), technical roles (role-specific), and the management body (its own programme)", de: "Alle Mitarbeitenden (jährliche Sensibilisierung), technische Rollen (rollenspezifisch) und die Geschäftsleitung (eigenes Programm)", nl: "Alle medewerkers (jaarlijkse bewustmaking), technische rollen (rolspecifiek) en het bestuurlijk orgaan (eigen programma)", fr: "Tout le personnel (sensibilisation annuelle), les rôles techniques (formation spécifique au rôle) et l'organe de direction (son propre programme)", it: "Tutto il personale (sensibilizzazione annuale), i ruoli tecnici (formazione specifica per il ruolo) e l'organo di gestione (un proprio programma)", es: "Todo el personal (concienciación anual), los roles técnicos (formación específica del rol) y el órgano de dirección (su propio programa)", pl: "Cały personel (coroczna świadomość), role techniczne (szkolenie specyficzne dla roli) oraz organ zarządzający (własny program)" },
        { en: "Only employees who have failed a phishing simulation", de: "Nur Mitarbeitende, die bei einer Phishing-Simulation durchgefallen sind", nl: "Alleen medewerkers die gezakt zijn voor een phishingsimulatie", fr: "Uniquement les employés qui ont échoué à une simulation d'hameçonnage", it: "Solo i dipendenti che non hanno superato una simulazione di phishing", es: "Únicamente los empleados que han fallado una simulación de phishing", pl: "Wyłącznie pracownicy, którzy nie zdali symulacji phishingu" },
        { en: "Only new hires during their first year", de: "Nur neue Mitarbeitende im ersten Jahr", nl: "Alleen nieuwe medewerkers in hun eerste jaar", fr: "Uniquement les nouveaux embauchés au cours de leur première année", it: "Solo i nuovi assunti durante il primo anno", es: "Únicamente los nuevos empleados durante su primer año", pl: "Wyłącznie nowo zatrudnieni w pierwszym roku" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Training applies to all staff (annual awareness), technical and high-risk roles (role-specific training), and the management body (Article 20(2)).",
        de: "Schulungen gelten für alle Mitarbeitenden (jährliche Sensibilisierung), technische und Hochrisiko-Rollen (rollenspezifische Schulung) und die Geschäftsleitung (Artikel 20 Absatz 2).",
        nl: "Training geldt voor alle medewerkers (jaarlijkse bewustmaking), technische en hoogrisicorol len (rolspecifieke training) en het bestuurlijk orgaan (Artikel 20(2)).",
        fr: "La formation s'applique à tout le personnel (sensibilisation annuelle), aux rôles techniques et à haut risque (formation spécifique au rôle) et à l'organe de direction (article 20(2)).",
        it: "La formazione si applica a tutto il personale (sensibilizzazione annuale), ai ruoli tecnici e ad alto rischio (formazione specifica per il ruolo) e all'organo di gestione (articolo 20(2)).",
        es: "La formación se aplica a todo el personal (concienciación anual), a los roles técnicos y de alto riesgo (formación específica del rol) y al órgano de dirección (artículo 20(2)).",
        pl: "Szkolenie dotyczy całego personelu (coroczna świadomość), ról technicznych i wysokiego ryzyka (szkolenie specyficzne dla roli) oraz organu zarządzającego (artykuł 20(2)).",
      },
    },
    {
      id: "2.12.3",
      question: {
        en: "What happens if the CEO skips the phishing simulation or exempts themselves from the awareness programme?",
        de: "Was passiert, wenn der CEO die Phishing-Simulation überspringt oder sich vom Sensibilisierungsprogramm ausnimmt?",
        nl: "Wat gebeurt er als de CEO de phishingsimulatie overslaat of zichzelf vrijstelt van het bewustmakingsprogramma?",
        fr: "Que se passe-t-il si le dirigeant saute la simulation d'hameçonnage ou s'exempte du programme de sensibilisation ?",
        it: "Cosa succede se l'amministratore delegato salta la simulazione di phishing o si esenta dal programma di sensibilizzazione?",
        es: "¿Qué ocurre si el director general se salta la simulación de phishing o se exime del programa de concienciación?",
        pl: "Co się dzieje, gdy dyrektor generalny pomija symulację phishingu lub zwalnia siebie z programu podnoszenia świadomości?",
      },
      options: [
        { en: "Nothing - the CEO is too senior for phishing simulations", de: "Nichts - der CEO ist zu hochrangig für Phishing-Simulationen", nl: "Niets - de CEO is te senior voor phishingsimulaties", fr: "Rien : le dirigeant est trop haut placé pour les simulations d'hameçonnage", it: "Niente: l'amministratore delegato è troppo in alto per le simulazioni di phishing", es: "Nada: el director general tiene un cargo demasiado alto para las simulaciones de phishing", pl: "Nic - dyrektor generalny jest na zbyt wysokim stanowisku na symulacje phishingu" },
        { en: "The CISO receives a warning", de: "Der CISO erhält eine Warnung", nl: "De CISO ontvangt een waarschuwing", fr: "Le CISO reçoit un avertissement", it: "Il CISO riceve un avvertimento", es: "El CISO recibe una advertencia", pl: "CISO otrzymuje ostrzeżenie" },
        { en: "It creates a personal audit finding under BSI Standard 200-1 Principle 6", de: "Es entsteht eine persönliche Audit-Feststellung gemäß BSI-Standard 200-1 Grundsatz 6", nl: "Het levert een persoonlijke auditbevinding op onder BSI-standaard 200-1 Principe 6", fr: "Cela crée une constatation d'audit personnelle au titre du BSI Standard 200-1 Principe 6", it: "Crea un rilievo di audit personale ai sensi del BSI Standard 200-1 Principio 6", es: "Crea un hallazgo de auditoría personal en virtud del BSI Standard 200-1 Principio 6", pl: "Tworzy to osobiste ustalenie audytowe na podstawie BSI Standard 200-1 Zasada 6" },
        { en: "The company's training programme is suspended", de: "Das Schulungsprogramm des Unternehmens wird ausgesetzt", nl: "Het trainingsprogramma van het bedrijf wordt opgeschort", fr: "Le programme de formation de l'entreprise est suspendu", it: "Il programma di formazione dell'impresa viene sospeso", es: "El programa de formación de la empresa queda suspendido", pl: "Program szkoleniowy firmy zostaje zawieszony" },
      ],
      correctIndex: 2,
      explanation: {
        en: "BSI Standard 200-1 Principle 6 requires the management body to follow all security rules themselves - a CEO who exempts themselves creates a personal finding.",
        de: "BSI-Standard 200-1 Grundsatz 6 verlangt, dass die Geschäftsleitung alle Sicherheitsregeln selbst befolgt - ein CEO, der sich selbst ausnimmt, erzeugt eine persönliche Feststellung.",
        nl: "BSI-standaard 200-1 Principe 6 vereist dat het bestuurlijk orgaan zelf alle beveiligingsregels naleeft - een CEO die zichzelf vrijstelt, creëert een persoonlijke auditbevinding.",
        fr: "Le BSI Standard 200-1 Principe 6 exige que l'organe de direction respecte lui-même toutes les règles de sécurité : un dirigeant qui s'exempte crée une constatation personnelle.",
        it: "Il BSI Standard 200-1 Principio 6 richiede che l'organo di gestione rispetti personalmente tutte le regole di sicurezza: un amministratore delegato che si esenta crea un rilievo personale.",
        es: "El BSI Standard 200-1 Principio 6 exige que el órgano de dirección cumpla él mismo todas las normas de seguridad: un director general que se exime crea un hallazgo personal.",
        pl: "BSI Standard 200-1 Zasada 6 wymaga, aby organ zarządzający sam przestrzegał wszystkich zasad bezpieczeństwa - dyrektor generalny, który zwalnia siebie, tworzy osobiste ustalenie.",
      },
    },
  ],
});

export default quiz;
