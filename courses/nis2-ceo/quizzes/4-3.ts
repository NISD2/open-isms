import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.3",
  passingScore: 75,
  questions: [
    {
      id: "4.3.1",
      question: {
        en: "Who is the named insured under a cyber insurance policy?",
        de: "Wer ist die versicherte Person unter einer Cyberversicherungspolice?",
        nl: "Wie is de verzekerde onder een cyberverzekeringspolis?",
        fr: "Qui est l'assuré désigné dans une police de cyberassurance ?",
        it: "Chi è l'assicurato nominato in una polizza di cyberassicurazione?",
        es: "¿Quién es el asegurado nombrado en una póliza de ciberseguro?",
        pl: "Kto jest ubezpieczonym wskazanym w polisie cyberubezpieczenia?",
      },
      options: [
        { en: "The directors personally", de: "Die Geschaeftsfuehrer persönlich", nl: "De bestuurders persoonlijk", fr: "Les dirigeants personnellement", it: "Gli amministratori personalmente", es: "Los directivos personalmente", pl: "Członkowie zarządu osobiście" },
        { en: "The company", de: "Das Unternehmen", nl: "Het bedrijf", fr: "L'entreprise", it: "L'azienda", es: "La empresa", pl: "Firma" },
        { en: "Both the company and the directors", de: "Sowohl das Unternehmen als auch die Geschaeftsfuehrer", nl: "Zowel het bedrijf als de bestuurders", fr: "À la fois l'entreprise et les dirigeants", it: "Sia l'azienda che gli amministratori", es: "Tanto la empresa como los directivos", pl: "Zarówno firma, jak i członkowie zarządu" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Cyber insurance names the company as the insured. D&O insurance names the director. They are different products with different named insureds.",
        de: "Die Cyberversicherung benennt das Unternehmen als Versicherten. Die D&O-Versicherung benennt den Geschaeftsfuehrer. Es sind unterschiedliche Produkte mit unterschiedlichen Versicherten.",
        nl: "Een cyberverzekering noemt het bedrijf als verzekerde. Een D&O-verzekering noemt de bestuurder. Het zijn verschillende producten met verschillende verzekerden.",
        fr: "La cyberassurance désigne l'entreprise comme assuré. L'assurance D&O désigne le dirigeant. Ce sont des produits différents avec des assurés désignés différents.",
        it: "La cyberassicurazione nomina l'azienda come assicurato. L'assicurazione D&O nomina l'amministratore. Sono prodotti diversi con assicurati nominati diversi.",
        es: "El ciberseguro nombra a la empresa como asegurada. El seguro D&O nombra al directivo. Son productos distintos con asegurados nombrados distintos.",
        pl: "Cyberubezpieczenie wskazuje firmę jako ubezpieczonego. Ubezpieczenie D&O wskazuje członka zarządu. To różne produkty z różnymi wskazanymi ubezpieczonymi.",
      },
    },
    {
      id: "4.3.2",
      question: {
        en: "What happens when a director is sued personally for a cyber incident and the D&O policy has a cyber exclusion?",
        de: "Was passiert, wenn ein Geschaeftsfuehrer persönlich wegen eines Cybervorfalls verklagt wird und die D&O-Police einen Cyber-Ausschluss hat?",
        nl: "Wat gebeurt er wanneer een bestuurder persoonlijk wordt aangeklaagd voor een cyberincident en de D&O-polis een cyberuitsluiting heeft?",
        fr: "Que se passe-t-il lorsqu'un dirigeant est poursuivi personnellement pour un cyberincident et que la police D&O comporte une exclusion cyber ?",
        it: "Cosa succede quando un amministratore viene citato in giudizio personalmente per un cyberincidente e la polizza D&O ha un'esclusione cyber?",
        es: "¿Qué ocurre cuando se demanda personalmente a un directivo por un ciberincidente y la póliza D&O tiene una exclusión cibernética?",
        pl: "Co się dzieje, gdy członek zarządu zostaje pozwany osobiście za cyberincydent, a polisa D&O zawiera wyłączenie cybernetyczne?",
      },
      options: [
        { en: "The cyber insurance covers the director instead", de: "Die Cyberversicherung deckt stattdessen den Geschaeftsfuehrer", nl: "De cyberverzekering dekt de bestuurder in plaats daarvan", fr: "La cyberassurance couvre le dirigeant à la place", it: "La cyberassicurazione copre invece l'amministratore", es: "El ciberseguro cubre al directivo en su lugar", pl: "Zamiast tego cyberubezpieczenie obejmuje członka zarządu" },
        { en: "The director is uncovered - the D&O excludes cyber and the cyber policy does not cover individual directors", de: "Der Geschaeftsfuehrer ist unversichert - die D&O schliesst Cyber aus und die Cyberpolice deckt keine einzelnen Geschaeftsfuehrer", nl: "De bestuurder is ongedekt - de D&O sluit cyber uit en de cyberpolis dekt geen individuele bestuurders", fr: "Le dirigeant n'est pas couvert - la D&O exclut le cyber et la police cyber ne couvre pas les dirigeants individuels", it: "L'amministratore non è coperto - la D&O esclude il cyber e la polizza cyber non copre i singoli amministratori", es: "El directivo queda sin cobertura: la D&O excluye lo cibernético y la póliza cibernética no cubre a los directivos individuales", pl: "Członek zarządu pozostaje bez pokrycia - D&O wyłącza cyber, a polisa cyber nie obejmuje poszczególnych członków zarządu" },
        { en: "The company pays from its general liability insurance", de: "Das Unternehmen zahlt aus seiner allgemeinen Haftpflichtversicherung", nl: "Het bedrijf betaalt vanuit zijn algemene aansprakelijkheidsverzekering", fr: "L'entreprise paie depuis son assurance responsabilité civile générale", it: "L'azienda paga dalla sua assicurazione di responsabilità civile generale", es: "La empresa paga desde su seguro de responsabilidad civil general", pl: "Firma płaci ze swojego ogólnego ubezpieczenia odpowiedzialności cywilnej" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The D&O policy has a cyber exclusion, and the cyber policy explicitly does not cover individual directors. The director is uncovered in the gap between both policies.",
        de: "Die D&O-Police hat einen Cyber-Ausschluss und die Cyberpolice deckt ausdruecklich keine einzelnen Geschaeftsfuehrer. Der Geschaeftsfuehrer ist in der Lücke zwischen beiden Policen unversichert.",
        nl: "De D&O-polis heeft een cyberuitsluiting en de cyberpolis dekt expliciet geen individuele bestuurders. De bestuurder is ongedekt in de kloof tussen beide polissen.",
        fr: "La police D&O comporte une exclusion cyber, et la police cyber ne couvre explicitement pas les dirigeants individuels. Le dirigeant n'est pas couvert dans l'écart entre les deux polices.",
        it: "La polizza D&O ha un'esclusione cyber e la polizza cyber esplicitamente non copre i singoli amministratori. L'amministratore non è coperto nel divario tra le due polizze.",
        es: "La póliza D&O tiene una exclusión cibernética y la póliza cibernética explícitamente no cubre a los directivos individuales. El directivo queda sin cobertura en el vacío entre ambas pólizas.",
        pl: "Polisa D&O zawiera wyłączenie cybernetyczne, a polisa cyber wyraźnie nie obejmuje poszczególnych członków zarządu. Członek zarządu pozostaje bez pokrycia w luce między obiema polisami.",
      },
    },
    {
      id: "4.3.3",
      question: {
        en: "What should your broker be able to produce according to the lesson?",
        de: "Was sollte Ihr Makler laut der Lektion erstellen koennen?",
        nl: "Wat moet uw verzekeringsmakelaar kunnen produceren volgens de les?",
        fr: "Que votre courtier devrait-il être en mesure de produire selon la leçon ?",
        it: "Cosa dovrebbe essere in grado di produrre il vostro broker secondo la lezione?",
        es: "¿Qué debería poder producir su corredor según la lección?",
        pl: "Co Twój broker powinien być w stanie przygotować według lekcji?",
      },
      options: [
        { en: "A detailed cost comparison of all available policies", de: "Einen detaillierten Kostenvergleich aller verfügbaren Policen", nl: "Een gedetailleerde kostenvergelijking van alle beschikbare polissen", fr: "Une comparaison détaillée des coûts de toutes les polices disponibles", it: "Un confronto dettagliato dei costi di tutte le polizze disponibili", es: "Una comparación detallada de costes de todas las pólizas disponibles", pl: "Szczegółowe porównanie kosztów wszystkich dostępnych polis" },
        { en: "A one-page map of which claim scenarios are covered by which policy", de: "Eine einseitige Uebersicht, welche Schadensszenarien von welcher Police abgedeckt werden", nl: "Een éénpagina-overzicht van welke claimscenario's door welke polis worden gedekt", fr: "Une cartographie d'une page indiquant quels scénarios de réclamation sont couverts par quelle police", it: "Una mappa di una pagina che indica quali scenari di richiesta sono coperti da quale polizza", es: "Un mapa de una página de qué escenarios de reclamación cubre cada póliza", pl: "Jednostronicowa mapa pokazująca, które scenariusze roszczeń są objęte którą polisą" },
        { en: "A legal opinion on NIS2 compliance", de: "Ein Rechtsgutachten zur NIS2-Compliance", nl: "Een juridisch advies over NIS2-naleving", fr: "Un avis juridique sur la conformité à NIS2", it: "Un parere legale sulla conformità a NIS2", es: "Un dictamen jurídico sobre el cumplimiento de NIS2", pl: "Opinię prawną dotyczącą zgodności z NIS2" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Your broker should produce a one-page map of which claim scenarios each policy covers. If it shows a gap in the personal liability column, that gap sits on your personal balance sheet uninsured.",
        de: "Ihr Makler sollte eine einseitige Uebersicht erstellen, welche Schadensszenarien von welcher Police abgedeckt werden. Wenn dort eine Lücke in der Spalte für persönliche Haftung erscheint, liegt dieses Risiko unversichert auf Ihrer privaten Bilanz.",
        nl: "Uw makelaar moet een éénpagina-overzicht produceren van welke claimscenario's elke polis dekt. Als er een kloof zichtbaar is in de kolom voor persoonlijke aansprakelijkheid, staat dat risico onverzekerd op uw persoonlijke balans.",
        fr: "Votre courtier devrait produire une cartographie d'une page indiquant quels scénarios de réclamation chaque police couvre. Si elle montre un écart dans la colonne de la responsabilité personnelle, cet écart figure non assuré sur votre bilan personnel.",
        it: "Il vostro broker dovrebbe produrre una mappa di una pagina che indica quali scenari di richiesta copre ogni polizza. Se mostra un divario nella colonna della responsabilità personale, tale divario grava non assicurato sul vostro bilancio personale.",
        es: "Su corredor debería producir un mapa de una página de qué escenarios de reclamación cubre cada póliza. Si muestra un vacío en la columna de responsabilidad personal, ese vacío recae sin asegurar sobre su balance personal.",
        pl: "Twój broker powinien przygotować jednostronicową mapę pokazującą, które scenariusze roszczeń pokrywa każda polisa. Jeśli pokaże ona lukę w kolumnie odpowiedzialności osobistej, luka ta obciąża nieubezpieczona Twój osobisty bilans.",
      },
    },
  ],
});

export default quiz;
