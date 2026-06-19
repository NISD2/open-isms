import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.2",
  passingScore: 75,
  questions: [
    {
      id: "1.2.1",
      question: {
        en: "Why must the management body physically participate in the tabletop?",
        de: "Warum muss die Geschäftsleitung persönlich an der Tabletop-Übung teilnehmen?",
        fr: "Pourquoi l'organe de direction doit-il participer physiquement à l'exercice sur table ?",
        it: "Perché l'organo di gestione deve partecipare fisicamente all'esercitazione da tavolo?",
        es: "¿Por qué debe el órgano de dirección participar físicamente en el ejercicio de mesa?",
        pl: "Dlaczego organ zarządzający musi fizycznie uczestniczyć w ćwiczeniu sztabowym?",
      },
      options: [
        { en: "Because Article 20(1) NIS 2 makes the management body personally responsible, and an exercise without them cannot evidence oversight", de: "Weil Artikel 20(1) NIS 2 die Geschäftsleitung persönlich verantwortlich macht und eine Übung ohne sie die Aufsicht nicht nachweisen kann", fr: "Parce que l'article 20(1) NIS 2 rend l'organe de direction personnellement responsable, et qu'un exercice sans lui ne peut attester de la surveillance", it: "Perché l'articolo 20(1) NIS 2 rende l'organo di gestione personalmente responsabile e un'esercitazione senza di esso non può dimostrare la vigilanza", es: "Porque el artículo 20(1) NIS 2 hace al órgano de dirección personalmente responsable, y un ejercicio sin él no puede acreditar la supervisión", pl: "Ponieważ artykuł 20(1) NIS 2 czyni organ zarządzający osobiście odpowiedzialnym, a ćwiczenie bez niego nie może dowieść nadzoru" },
        { en: "Because the BSI requires it under Standard 200-4", de: "Weil das BSI es im Standard 200-4 verlangt", fr: "Parce que le BSI l'exige au titre du Standard 200-4", it: "Perché il BSI lo richiede nello Standard 200-4", es: "Porque el BSI lo exige en el Standard 200-4", pl: "Ponieważ BSI wymaga tego w Standard 200-4" },
        { en: "Because the cyber insurance policy requires it", de: "Weil die Cyber-Versicherungs-Police es verlangt", fr: "Parce que la police d'assurance cyber l'exige", it: "Perché la polizza di assicurazione cyber lo richiede", es: "Porque la póliza de ciberseguro lo exige", pl: "Ponieważ wymaga tego polisa ubezpieczenia cybernetycznego" },
        { en: "Because the auditor will refuse to sign the report otherwise", de: "Weil das Audit sonst die Freigabe des Berichts verweigert", fr: "Parce que sinon l'auditeur refusera de signer le rapport", it: "Perché altrimenti l'auditor rifiuterà di firmare la relazione", es: "Porque de lo contrario el auditor se negará a firmar el informe", pl: "Ponieważ w przeciwnym razie audytor odmówi podpisania raportu" },
      ],
      correctIndex: 0,
      explanation: {
        en: "Article 20(1) NIS 2 makes the management body personally responsible. The exercise must rehearse the decisions the responsible person would make.",
        de: "Artikel 20(1) NIS 2 macht die Geschäftsleitung persönlich verantwortlich. Die Übung muss die Entscheidungen durchspielen, die die verantwortliche Person treffen würde.",
        fr: "L'article 20(1) NIS 2 rend l'organe de direction personnellement responsable. L'exercice doit répéter les décisions que la personne responsable prendrait.",
        it: "L'articolo 20(1) NIS 2 rende l'organo di gestione personalmente responsabile. L'esercitazione deve simulare le decisioni che la persona responsabile prenderebbe.",
        es: "El artículo 20(1) NIS 2 hace al órgano de dirección personalmente responsable. El ejercicio debe ensayar las decisiones que tomaría la persona responsable.",
        pl: "Artykuł 20(1) NIS 2 czyni organ zarządzający osobiście odpowiedzialnym. Ćwiczenie musi przećwiczyć decyzje, które podjęłaby osoba odpowiedzialna.",
      },
    },
    {
      id: "1.2.2",
      question: {
        en: "Which of the following is NOT a mandatory role in a tabletop?",
        de: "Welche der folgenden Rollen ist KEINE Pflichtrolle bei einer Tabletop-Übung?",
        fr: "Lequel des rôles suivants n'est PAS un rôle obligatoire dans un exercice sur table ?",
        it: "Quale dei seguenti NON è un ruolo obbligatorio in un'esercitazione da tavolo?",
        es: "¿Cuál de los siguientes NO es un rol obligatorio en un ejercicio de mesa?",
        pl: "Która z poniższych ról NIE jest rolą obowiązkową w ćwiczeniu sztabowym?",
      },
      options: [
        { en: "Management body representative", de: "Vertretung der Geschäftsleitung", fr: "Représentant de l'organe de direction", it: "Rappresentante dell'organo di gestione", es: "Representante del órgano de dirección", pl: "Przedstawiciel organu zarządzającego" },
        { en: "IT manager", de: "IT-Verantwortliche", fr: "Responsable informatique", it: "Responsabile IT", es: "Responsable de TI", pl: "Menedżer IT" },
        { en: "Communications lead", de: "Kommunikations-Verantwortliche", fr: "Responsable de la communication", it: "Responsabile della comunicazione", es: "Responsable de comunicación", pl: "Osoba odpowiedzialna za komunikację" },
        { en: "External cyber insurance contact", de: "Externer Cyber-Versicherungs-Kontakt", fr: "Contact externe d'assurance cyber", it: "Contatto esterno per l'assicurazione cyber", es: "Contacto externo de ciberseguro", pl: "Zewnętrzny kontakt ds. ubezpieczenia cybernetycznego" },
      ],
      correctIndex: 3,
      explanation: {
        en: "The cyber insurance contact is strongly recommended but not mandatory. The four mandatory roles are management body, facilitator, IT manager, and communications or legal lead.",
        de: "Der Cyber-Versicherungs-Kontakt ist dringend empfohlen, aber nicht verpflichtend. Die vier Pflichtrollen sind Geschäftsleitung, Moderation, IT-Verantwortliche und Kommunikations- oder Rechts-Verantwortliche.",
        fr: "Le contact d'assurance cyber est fortement recommandé mais non obligatoire. Les quatre rôles obligatoires sont l'organe de direction, l'animateur, le responsable informatique et le responsable de la communication ou des affaires juridiques.",
        it: "Il contatto per l'assicurazione cyber è vivamente consigliato ma non obbligatorio. I quattro ruoli obbligatori sono l'organo di gestione, il facilitatore, il responsabile IT e il responsabile della comunicazione o legale.",
        es: "El contacto de ciberseguro es muy recomendable pero no obligatorio. Los cuatro roles obligatorios son el órgano de dirección, el facilitador, el responsable de TI y el responsable de comunicación o jurídico.",
        pl: "Kontakt ds. ubezpieczenia cybernetycznego jest zdecydowanie zalecany, ale nie obowiązkowy. Cztery obowiązkowe role to organ zarządzający, facylitator, menedżer IT oraz osoba odpowiedzialna za komunikację lub kwestie prawne.",
      },
    },
    {
      id: "1.2.3",
      question: {
        en: "What is the realistic minimum number of people for a defensible Mittelstand tabletop?",
        de: "Wie viele Personen sind das realistische Minimum für eine verteidigungsfähige Tabletop-Übung im Mittelstand?",
        fr: "Quel est le nombre minimum réaliste de personnes pour un exercice sur table défendable dans une PME ?",
        it: "Qual è il numero minimo realistico di persone per un'esercitazione da tavolo difendibile in una PMI?",
        es: "¿Cuál es el número mínimo realista de personas para un ejercicio de mesa defendible en una pyme?",
        pl: "Jaka jest realistyczna minimalna liczba osób potrzebna do możliwego do obrony ćwiczenia sztabowego w średniej firmie?",
      },
      options: [
        { en: "Two", de: "Zwei", fr: "Deux", it: "Due", es: "Dos", pl: "Dwie" },
        { en: "Four", de: "Vier", fr: "Quatre", it: "Quattro", es: "Cuatro", pl: "Cztery" },
        { en: "Eight", de: "Acht", fr: "Huit", it: "Otto", es: "Ocho", pl: "Osiem" },
        { en: "Twelve", de: "Zwölf", fr: "Douze", it: "Dodici", es: "Doce", pl: "Dwanaście" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Four: management body representative, facilitator, IT manager, and a combined communications/legal lead.",
        de: "Vier: Vertretung der Geschäftsleitung, Moderation, IT-Verantwortliche und eine kombinierte Kommunikations-/Rechts-Verantwortliche.",
        fr: "Quatre : représentant de l'organe de direction, animateur, responsable informatique et un responsable combiné communication/juridique.",
        it: "Quattro: rappresentante dell'organo di gestione, facilitatore, responsabile IT e un responsabile combinato comunicazione/legale.",
        es: "Cuatro: representante del órgano de dirección, facilitador, responsable de TI y un responsable combinado de comunicación/jurídico.",
        pl: "Cztery: przedstawiciel organu zarządzającego, facylitator, menedżer IT oraz połączona osoba odpowiedzialna za komunikację i kwestie prawne.",
      },
    },
    {
      id: "1.2.4",
      question: {
        en: "What does an auditor conclude when the protocol shows no management body participation?",
        de: "Was schließt ein Audit, wenn das Protokoll keine Teilnahme der Geschäftsleitung zeigt?",
        fr: "Que conclut un auditeur lorsque le protocole ne montre aucune participation de l'organe de direction ?",
        it: "Che cosa conclude un auditor quando il protocollo non mostra alcuna partecipazione dell'organo di gestione?",
        es: "¿Qué concluye un auditor cuando el protocolo no muestra participación del órgano de dirección?",
        pl: "Co stwierdza audytor, gdy protokół nie wykazuje udziału organu zarządzającego?",
      },
      options: [
        { en: "That the exercise was efficient", de: "Dass die Übung effizient verlief", fr: "Que l'exercice a été efficace", it: "Che l'esercitazione è stata efficiente", es: "Que el ejercicio fue eficiente", pl: "Że ćwiczenie przebiegło sprawnie" },
        { en: "That the management body delegated correctly", de: "Dass die Geschäftsleitung korrekt delegiert hat", fr: "Que l'organe de direction a délégué correctement", it: "Che l'organo di gestione ha delegato correttamente", es: "Que el órgano de dirección delegó correctamente", pl: "Że organ zarządzający prawidłowo przekazał zadania" },
        { en: "That the Article 20(1) duty is being skipped", de: "Dass die Pflicht aus Artikel 20(1) übersprungen wird", fr: "Que l'obligation de l'article 20(1) est ignorée", it: "Che l'obbligo dell'articolo 20(1) viene eluso", es: "Que se está omitiendo el deber del artículo 20(1)", pl: "Że obowiązek z artykułu 20(1) jest pomijany" },
        { en: "That the IT team is well-trained", de: "Dass das IT-Team gut geschult ist", fr: "Que l'équipe informatique est bien formée", it: "Che il team IT è ben formato", es: "Que el equipo de TI está bien formado", pl: "Że zespół IT jest dobrze przeszkolony" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The absence of a management body signature is read as evidence the Article 20(1) NIS 2 personal-responsibility duty is being skipped.",
        de: "Das Fehlen einer Unterschrift der Geschäftsleitung wird als Hinweis gelesen, dass die persönliche Verantwortungspflicht aus Artikel 20(1) NIS 2 übersprungen wird.",
        fr: "L'absence de signature de l'organe de direction est interprétée comme la preuve que l'obligation de responsabilité personnelle de l'article 20(1) NIS 2 est ignorée.",
        it: "L'assenza di una firma dell'organo di gestione è interpretata come prova che l'obbligo di responsabilità personale dell'articolo 20(1) NIS 2 viene eluso.",
        es: "La ausencia de una firma del órgano de dirección se interpreta como prueba de que se está omitiendo el deber de responsabilidad personal del artículo 20(1) NIS 2.",
        pl: "Brak podpisu organu zarządzającego jest odczytywany jako dowód, że obowiązek osobistej odpowiedzialności z artykułu 20(1) NIS 2 jest pomijany.",
      },
    },
  ],
});

export default quiz;
