import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "4.2",
  passingScore: 75,
  questions: [
    {
      id: "4.2.1",
      question: {
        en: "What type of claims was D&O insurance originally designed to protect directors from?",
        de: "Vor welcher Art von Anspruechen sollte die D&O-Versicherung Geschaeftsfuehrer urspruenglich schuetzen?",
        nl: "Tegen welk type claims was D&O-verzekering oorspronkelijk bedoeld om bestuurders te beschermen?",
        fr: "De quel type de réclamations l'assurance D&O était-elle initialement conçue pour protéger les dirigeants ?",
        it: "Da quale tipo di richieste l'assicurazione D&O era originariamente concepita per proteggere gli amministratori?",
        es: "¿De qué tipo de reclamaciones se diseñó originalmente el seguro D&O para proteger a los directivos?",
        pl: "Przed jakim rodzajem roszczeń ubezpieczenie D&O miało pierwotnie chronić członków zarządu?",
      },
      options: [
        { en: "Cyber incident claims", de: "Ansprueche aus Cybervorfaellen", nl: "Claims uit cyberincidenten", fr: "Réclamations liées à des cyberincidents", it: "Richieste derivanti da cyberincidenti", es: "Reclamaciones por ciberincidentes", pl: "Roszczenia z tytułu cyberincydentów" },
        { en: "Business judgment claims (allegations of mismanagement)", de: "Ansprueche aus Geschaeftsentscheidungen (Vorwuerfe der Misswirtschaft)", nl: "Claims over bedrijfsbeslissingen (beschuldigingen van wanbestuur)", fr: "Réclamations liées au jugement commercial (allégations de mauvaise gestion)", it: "Richieste relative al giudizio gestionale (accuse di cattiva gestione)", es: "Reclamaciones por juicio empresarial (alegaciones de mala gestión)", pl: "Roszczenia dotyczące decyzji biznesowych (zarzuty złego zarządzania)" },
        { en: "Regulatory fines and penalties", de: "Regulatorische Bussgelder und Strafen", nl: "Regulatoire boetes en sancties", fr: "Amendes et sanctions réglementaires", it: "Sanzioni e penali normative", es: "Multas y sanciones regulatorias", pl: "Kary i grzywny regulacyjne" },
        { en: "Employee lawsuits", de: "Arbeitnehmerklagen", nl: "Rechtszaken van werknemers", fr: "Poursuites de salariés", it: "Cause intentate dai dipendenti", es: "Demandas de empleados", pl: "Pozwy pracownicze" },
      ],
      correctIndex: 1,
      explanation: {
        en: "D&O insurance was designed to protect directors from claims of mismanagement - the allegation that a director made a bad business decision.",
        de: "Die D&O-Versicherung wurde entwickelt, um Geschaeftsfuehrer vor Anspruechen wegen Misswirtschaft zu schuetzen - dem Vorwurf, eine schlechte Geschaeftsentscheidung getroffen zu haben.",
        nl: "D&O-verzekering was bedoeld om bestuurders te beschermen tegen claims wegens wanbestuur - de beschuldiging dat een bestuurder een slechte zakelijke beslissing heeft genomen.",
        fr: "L'assurance D&O a été conçue pour protéger les dirigeants des réclamations pour mauvaise gestion - l'allégation qu'un dirigeant a pris une mauvaise décision commerciale.",
        it: "L'assicurazione D&O è stata concepita per proteggere gli amministratori dalle richieste per cattiva gestione - l'accusa che un amministratore abbia preso una cattiva decisione aziendale.",
        es: "El seguro D&O se diseñó para proteger a los directivos de las reclamaciones por mala gestión: la alegación de que un directivo tomó una mala decisión empresarial.",
        pl: "Ubezpieczenie D&O zostało zaprojektowane, aby chronić członków zarządu przed roszczeniami z tytułu złego zarządzania - zarzutem, że członek zarządu podjął złą decyzję biznesową.",
      },
    },
    {
      id: "4.2.2",
      question: {
        en: "Why do NIS2 violations sit in the wrong category for most D&O policies?",
        de: "Warum fallen NIS2-Verstoesse bei den meisten D&O-Policen in die falsche Kategorie?",
        nl: "Waarom vallen NIS2-overtredingen in de verkeerde categorie voor de meeste D&O-polissen?",
        fr: "Pourquoi les violations de NIS2 relèvent-elles de la mauvaise catégorie pour la plupart des polices D&O ?",
        it: "Perché le violazioni di NIS2 rientrano nella categoria sbagliata per la maggior parte delle polizze D&O?",
        es: "¿Por qué las infracciones de NIS2 se sitúan en la categoría equivocada para la mayoría de las pólizas D&O?",
        pl: "Dlaczego naruszenia NIS2 należą do niewłaściwej kategorii w przypadku większości polis D&O?",
      },
      options: [
        { en: "NIS2 violations are too expensive for D&O coverage limits", de: "NIS2-Verstoesse sind zu teuer für D&O-Deckungsgrenzen", nl: "NIS2-overtredingen zijn te kostbaar voor de dekkingslimieten van D&O", fr: "Les violations de NIS2 sont trop coûteuses pour les plafonds de couverture D&O", it: "Le violazioni di NIS2 sono troppo costose per i massimali di copertura D&O", es: "Las infracciones de NIS2 son demasiado costosas para los límites de cobertura D&O", pl: "Naruszenia NIS2 są zbyt kosztowne dla limitów pokrycia D&O" },
        { en: "NIS2 violations are statutory duty breaches, not business judgment calls", de: "NIS2-Verstoesse sind Verletzungen gesetzlicher Pflichten, keine unternehmerischen Ermessensentscheidungen", nl: "NIS2-overtredingen zijn schendingen van wettelijke verplichtingen, geen zakelijke beoordelingsbeslissingen", fr: "Les violations de NIS2 sont des manquements à des obligations légales, et non des décisions de jugement commercial", it: "Le violazioni di NIS2 sono inadempimenti di obblighi di legge, non decisioni di giudizio gestionale", es: "Las infracciones de NIS2 son incumplimientos de obligaciones legales, no decisiones de juicio empresarial", pl: "Naruszenia NIS2 to naruszenia obowiązków ustawowych, a nie decyzje w ramach osądu biznesowego" },
        { en: "NIS2 is not recognised by insurance regulators", de: "NIS2 wird von Versicherungsaufsichtsbehörden nicht anerkannt", nl: "NIS2 wordt niet erkend door verzekeringstoezichthouders", fr: "NIS2 n'est pas reconnu par les autorités de régulation des assurances", it: "NIS2 non è riconosciuto dalle autorità di regolamentazione assicurativa", es: "NIS2 no es reconocido por los reguladores de seguros", pl: "NIS2 nie jest uznawany przez organy nadzoru ubezpieczeniowego" },
      ],
      correctIndex: 1,
      explanation: {
        en: "NIS2 violations are statutory duty breaches - the law tells you what to do, you do not do it, and the regulator holds you personally responsible. That is a different legal category from business judgment claims.",
        de: "NIS2-Verstoesse sind Verletzungen gesetzlicher Pflichten - das Gesetz sagt Ihnen, was zu tun ist, Sie tun es nicht, und die Aufsichtsbehörde zieht Sie persönlich zur Verantwortung. Das ist eine andere Rechtskategorie als unternehmerische Ermessensentscheidungen.",
        nl: "NIS2-overtredingen zijn schendingen van wettelijke verplichtingen - de wet vertelt u wat u moet doen, u doet het niet, en de bevoegde autoriteit houdt u persoonlijk verantwoordelijk. Dat is een andere juridische categorie dan claims over zakelijke beoordelingen.",
        fr: "Les violations de NIS2 sont des manquements à des obligations légales - la loi vous dit quoi faire, vous ne le faites pas, et l'autorité de régulation vous tient personnellement responsable. C'est une catégorie juridique différente des réclamations liées au jugement commercial.",
        it: "Le violazioni di NIS2 sono inadempimenti di obblighi di legge - la legge vi dice cosa fare, voi non lo fate, e l'autorità di regolamentazione vi ritiene personalmente responsabili. È una categoria giuridica diversa dalle richieste relative al giudizio gestionale.",
        es: "Las infracciones de NIS2 son incumplimientos de obligaciones legales: la ley le dice qué hacer, usted no lo hace, y el regulador le considera personalmente responsable. Esa es una categoría jurídica distinta de las reclamaciones por juicio empresarial.",
        pl: "Naruszenia NIS2 to naruszenia obowiązków ustawowych - prawo mówi Ci, co masz zrobić, Ty tego nie robisz, a organ nadzoru pociąga Cię do osobistej odpowiedzialności. To inna kategoria prawna niż roszczenia dotyczące osądu biznesowego.",
      },
    },
    {
      id: "4.2.3",
      question: {
        en: "What is the most critical clause to check in your D&O policy according to the lesson?",
        de: "Welche Klausel Ihrer D&O-Police sollten Sie laut der Lektion als Erstes prüfen?",
        fr: "Quelle est la clause la plus essentielle à vérifier dans votre police D&O selon la leçon ?",
        it: "Qual è la clausola più critica da controllare nella vostra polizza D&O secondo la lezione?",
        es: "¿Cuál es la cláusula más crítica que debe comprobar en su póliza D&O según la lección?",
        pl: "Którą klauzulę polisy D&O najważniej jest sprawdzić według lekcji?",
      },
      options: [
        { en: "The premium adjustment clause", de: "Die Praemienanpassungsklausel", fr: "La clause d'ajustement de prime", it: "La clausola di adeguamento del premio", es: "La cláusula de ajuste de prima", pl: "Klauzula korekty składki" },
        { en: "The cyber liability exclusion", de: "Der Cyber-Haftungsausschluss", fr: "L'exclusion de responsabilité cyber", it: "L'esclusione della responsabilità cyber", es: "La exclusión de responsabilidad cibernética", pl: "Wyłączenie odpowiedzialności cybernetycznej" },
        { en: "The coverage limit clause", de: "Die Deckungssummenklausel", fr: "La clause de plafond de couverture", it: "La clausola del massimale di copertura", es: "La cláusula de límite de cobertura", pl: "Klauzula limitu pokrycia" },
        { en: "The renewal terms", de: "Die Verlaengerungsbedingungen", fr: "Les conditions de renouvellement", it: "Le condizioni di rinnovo", es: "Las condiciones de renovación", pl: "Warunki odnowienia" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The most critical clause to check is the cyber liability exclusion. If present, your D&O does not cover NIS2 claims against you personally.",
        de: "Die wichtigste zu prüfende Klausel ist der Cyber-Haftungsausschluss. Wenn vorhanden, deckt Ihre D&O-Versicherung keine NIS2-Ansprueche gegen Sie persönlich ab.",
        fr: "La clause la plus essentielle à vérifier est l'exclusion de responsabilité cyber. Si elle est présente, votre D&O ne couvre pas les réclamations NIS2 vous visant personnellement.",
        it: "La clausola più critica da controllare è l'esclusione della responsabilità cyber. Se presente, la vostra D&O non copre le richieste NIS2 contro di voi personalmente.",
        es: "La cláusula más crítica que debe comprobar es la exclusión de responsabilidad cibernética. Si está presente, su D&O no cubre las reclamaciones NIS2 en su contra personalmente.",
        pl: "Najważniejszą klauzulą do sprawdzenia jest wyłączenie odpowiedzialności cybernetycznej. Jeśli występuje, Twoja polisa D&O nie obejmuje roszczeń NIS2 skierowanych przeciwko Tobie osobiście.",
      },
    },
    {
      id: "4.2.4",
      question: {
        en: "How many questions should you ask your broker before signing the next D&O renewal?",
        de: "Wie viele Fragen sollten Sie Ihrem Makler vor Unterzeichnung der naechsten D&O-Verlaengerung stellen?",
        fr: "Combien de questions devez-vous poser à votre courtier avant de signer le prochain renouvellement D&O ?",
        it: "Quante domande dovreste porre al vostro broker prima di firmare il prossimo rinnovo D&O?",
        es: "¿Cuántas preguntas debe hacer a su corredor antes de firmar la próxima renovación de D&O?",
        pl: "Ile pytań powinieneś zadać swojemu brokerowi przed podpisaniem kolejnego odnowienia D&O?",
      },
      options: [
        { en: "One question about coverage limits", de: "Eine Frage zur Deckungssumme", fr: "Une question sur les plafonds de couverture", it: "Una domanda sui massimali di copertura", es: "Una pregunta sobre los límites de cobertura", pl: "Jedno pytanie o limity pokrycia" },
        { en: "Two questions about premiums and deductibles", de: "Zwei Fragen zu Praemien und Selbstbehalten", fr: "Deux questions sur les primes et les franchises", it: "Due domande su premi e franchigie", es: "Dos preguntas sobre primas y franquicias", pl: "Dwa pytania o składki i udziały własne" },
        { en: "Three questions about the cyber exclusion, personal regulatory claims, and statutory duty breaches", de: "Drei Fragen zum Cyber-Ausschluss, persönlichen regulatorischen Anspruechen und Verletzungen gesetzlicher Pflichten", fr: "Trois questions sur l'exclusion cyber, les réclamations réglementaires personnelles et les manquements aux obligations légales", it: "Tre domande sull'esclusione cyber, sulle richieste normative personali e sugli inadempimenti di obblighi di legge", es: "Tres preguntas sobre la exclusión cibernética, las reclamaciones regulatorias personales y los incumplimientos de obligaciones legales", pl: "Trzy pytania o wyłączenie cybernetyczne, osobiste roszczenia regulacyjne i naruszenia obowiązków ustawowych" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Ask three questions: does the policy contain a cyber liability exclusion, does it pay for personal defence under Article 32(5), and what does it say about statutory duty breaches. Get all three answers in writing.",
        de: "Stellen Sie drei Fragen: Enthaelt die Police einen Cyber-Haftungsausschluss, zahlt sie für die persönliche Verteidigung gemäß Artikel 32 Absatz 5, und was sagt sie zu Verletzungen gesetzlicher Pflichten. Lassen Sie sich alle drei Antworten schriftlich geben.",
        fr: "Posez trois questions : la police contient-elle une exclusion de responsabilité cyber, paie-t-elle la défense personnelle au titre de l'article 32(5), et que dit-elle des manquements aux obligations légales. Obtenez les trois réponses par écrit.",
        it: "Ponete tre domande: la polizza contiene un'esclusione della responsabilità cyber, paga la difesa personale ai sensi dell'articolo 32(5), e cosa dice sugli inadempimenti di obblighi di legge. Ottenete tutte e tre le risposte per iscritto.",
        es: "Haga tres preguntas: ¿contiene la póliza una exclusión de responsabilidad cibernética, paga la defensa personal con arreglo al artículo 32(5), y qué dice sobre los incumplimientos de obligaciones legales? Obtenga las tres respuestas por escrito.",
        pl: "Zadaj trzy pytania: czy polisa zawiera wyłączenie odpowiedzialności cybernetycznej, czy pokrywa osobistą obronę na mocy artykułu 32(5) oraz co mówi o naruszeniach obowiązków ustawowych. Uzyskaj wszystkie trzy odpowiedzi na piśmie.",
      },
    },
  ],
});

export default quiz;
