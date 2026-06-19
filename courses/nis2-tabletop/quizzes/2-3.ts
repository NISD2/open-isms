import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.3",
  passingScore: 75,
  questions: [
    {
      id: "2.3.1",
      question: {
        en: "Which of the following is NOT one of the eight required protocol fields?",
        de: "Welches der folgenden Felder gehört NICHT zu den acht Pflichtbestandteilen des Protokolls?",
        fr: "Lequel des champs suivants ne fait PAS partie des huit champs obligatoires du protocole ?",
        it: "Quale dei seguenti campi NON è uno degli otto campi obbligatori del protocollo?",
        es: "¿Cuál de los siguientes campos NO es uno de los ocho campos obligatorios del protocolo?",
        pl: "Które z poniższych pól NIE należy do ośmiu obowiązkowych pól protokołu?",
      },
      options: [
        { en: "Date, duration, and sim-time conversion", de: "Datum, Dauer und Simulationszeit-Umrechnung", fr: "Date, durée et conversion du temps de simulation", it: "Data, durata e conversione del tempo di simulazione", es: "Fecha, duración y conversión del tiempo de simulación", pl: "Data, czas trwania i przeliczenie czasu symulacji" },
        { en: "Signed participant register", de: "Unterschriebene Teilnehmendenliste", fr: "Registre des participants signé", it: "Registro dei partecipanti firmato", es: "Registro de participantes firmado", pl: "Podpisana lista uczestników" },
        { en: "Cybersecurity insurance policy number", de: "Police-Nummer der Cyber-Versicherung", fr: "Numéro de police d'assurance cybersécurité", it: "Numero di polizza dell'assicurazione di cybersicurezza", es: "Número de póliza del seguro de ciberseguridad", pl: "Numer polisy ubezpieczenia cyberbezpieczeństwa" },
        { en: "Management body sign-off", de: "Freigabe durch die Geschäftsleitung", fr: "Validation par l'organe de direction", it: "Approvazione dell'organo di gestione", es: "Aprobación del órgano de dirección", pl: "Zatwierdzenie przez organ zarządzający" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The insurance policy number is not a required field of the protocol. The eight required fields are date and sim-time, scenario summary, signed register, decision log, Article 23 timeline, lessons learned, improvement items, and management body sign-off.",
        de: "Die Police-Nummer ist kein Pflichtbestandteil des Protokolls. Die acht Pflichtbestandteile sind Datum und Simulationszeit, Szenario-Zusammenfassung, unterschriebene Teilnehmendenliste, Entscheidungs-Protokoll, Zeitleiste nach Artikel 23, Lessons Learned, Verbesserungspunkte und Freigabe der Geschäftsleitung.",
        fr: "Le numéro de police d'assurance n'est pas un champ obligatoire du protocole. Les huit champs obligatoires sont la date et le temps de simulation, le résumé du scénario, le registre signé, le journal des décisions, la chronologie de l'article 23, les leçons tirées, les points d'amélioration et la validation par l'organe de direction.",
        it: "Il numero di polizza assicurativa non è un campo obbligatorio del protocollo. Gli otto campi obbligatori sono data e tempo di simulazione, riepilogo dello scenario, registro firmato, registro delle decisioni, cronologia dell'articolo 23, lezioni apprese, punti di miglioramento e approvazione dell'organo di gestione.",
        es: "El número de póliza de seguro no es un campo obligatorio del protocolo. Los ocho campos obligatorios son la fecha y el tiempo de simulación, el resumen del escenario, el registro firmado, el registro de decisiones, la cronología del artículo 23, las lecciones aprendidas, los puntos de mejora y la aprobación del órgano de dirección.",
        pl: "Numer polisy ubezpieczeniowej nie jest obowiązkowym polem protokołu. Osiem obowiązkowych pól to data i czas symulacji, podsumowanie scenariusza, podpisana lista, dziennik decyzji, oś czasu z artykułu 23, wyciągnięte wnioski, punkty usprawnień oraz zatwierdzenie przez organ zarządzający.",
      },
    },
    {
      id: "2.3.2",
      question: {
        en: "What does the management body sign-off on the protocol evidence?",
        de: "Was belegt die Freigabe durch die Geschäftsleitung auf dem Protokoll?",
        fr: "Qu'atteste la validation du protocole par l'organe de direction ?",
        it: "Che cosa attesta l'approvazione del protocollo da parte dell'organo di gestione?",
        es: "¿Qué acredita la aprobación del protocolo por parte del órgano de dirección?",
        pl: "Co potwierdza zatwierdzenie protokołu przez organ zarządzający?",
      },
      options: [
        { en: "That the cyber insurance policy was renewed", de: "Dass die Cyber-Versicherung verlängert wurde", fr: "Que la police d'assurance cyber a été renouvelée", it: "Che la polizza di assicurazione cyber è stata rinnovata", es: "Que la póliza de ciberseguro fue renovada", pl: "Że polisa ubezpieczenia cybernetycznego została odnowiona" },
        { en: "That the CISO ran the exercise correctly", de: "Dass die CISO die Übung korrekt durchgeführt hat", fr: "Que le RSSI a mené l'exercice correctement", it: "Che il CISO ha condotto correttamente l'esercitazione", es: "Que el CISO realizó el ejercicio correctamente", pl: "Że CISO przeprowadził ćwiczenie prawidłowo" },
        { en: "That the responsible person was personally present and personally approved the findings, closing the Article 20(1) NIS 2 accountability loop", de: "Dass die verantwortliche Person persönlich anwesend war und die Erkenntnisse persönlich freigegeben hat, womit die Verantwortungsschleife nach Artikel 20(1) NIS 2 geschlossen wird", fr: "Que la personne responsable était personnellement présente et a personnellement approuvé les constats, bouclant la boucle de responsabilité de l'article 20(1) NIS 2", it: "Che la persona responsabile era personalmente presente e ha personalmente approvato i risultati, chiudendo il ciclo di responsabilità dell'articolo 20(1) NIS 2", es: "Que la persona responsable estuvo personalmente presente y aprobó personalmente los hallazgos, cerrando el ciclo de responsabilidad del artículo 20(1) NIS 2", pl: "Że osoba odpowiedzialna była osobiście obecna i osobiście zatwierdziła ustalenia, zamykając pętlę odpowiedzialności z artykułu 20(1) NIS 2" },
        { en: "That the BSI accepts the exercise format", de: "Dass das BSI das Übungsformat akzeptiert", fr: "Que le BSI accepte le format de l'exercice", it: "Che il BSI accetta il formato dell'esercitazione", es: "Que el BSI acepta el formato del ejercicio", pl: "Że BSI akceptuje format ćwiczenia" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The management body signature closes the Article 20(1) accountability loop. Without it, the protocol is incomplete and the auditor flags the gap.",
        de: "Die Unterschrift der Geschäftsleitung schließt die Verantwortungsschleife nach Artikel 20(1). Ohne sie ist das Protokoll unvollständig und das Audit markiert die Lücke.",
        fr: "La signature de l'organe de direction boucle la boucle de responsabilité de l'article 20(1). Sans elle, le protocole est incomplet et l'auditeur signale la lacune.",
        it: "La firma dell'organo di gestione chiude il ciclo di responsabilità dell'articolo 20(1). Senza di essa il protocollo è incompleto e l'auditor segnala la lacuna.",
        es: "La firma del órgano de dirección cierra el ciclo de responsabilidad del artículo 20(1). Sin ella, el protocolo está incompleto y el auditor señala la deficiencia.",
        pl: "Podpis organu zarządzającego zamyka pętlę odpowiedzialności z artykułu 20(1). Bez niego protokół jest niekompletny, a audytor zaznacza tę lukę.",
      },
    },
    {
      id: "2.3.3",
      question: {
        en: "Which evidence form would an auditor reject?",
        de: "Welche Nachweisform würde ein Audit ablehnen?",
        fr: "Quelle forme de preuve un auditeur rejetterait-il ?",
        it: "Quale forma di prova respingerebbe un auditor?",
        es: "¿Qué forma de evidencia rechazaría un auditor?",
        pl: "Którą formę dowodu odrzuciłby audytor?",
      },
      options: [
        { en: "A dated PDF protocol with a management body signature", de: "Eine datierte PDF mit Unterschrift der Geschäftsleitung", fr: "Un protocole PDF daté avec une signature de l'organe de direction", it: "Un protocollo PDF datato con una firma dell'organo di gestione", es: "Un protocolo PDF fechado con una firma del órgano de dirección", pl: "Datowany protokół PDF z podpisem organu zarządzającego" },
        { en: "A structured decision log with named decisions, times, and justifications", de: "Ein strukturiertes Entscheidungs-Protokoll mit Namen, Zeiten und Begründungen", fr: "Un journal des décisions structuré avec des décisions nominatives, des horaires et des justifications", it: "Un registro delle decisioni strutturato con decisioni nominative, orari e giustificazioni", es: "Un registro de decisiones estructurado con decisiones nominativas, horas y justificaciones", pl: "Uporządkowany dziennik decyzji z nazwanymi decyzjami, czasami i uzasadnieniami" },
        { en: "A slide deck summarising the exercise with no decision log", de: "Eine Foliensammlung mit Zusammenfassung der Übung, aber ohne Entscheidungs-Protokoll", fr: "Un jeu de diapositives résumant l'exercice sans journal des décisions", it: "Una presentazione di diapositive che riassume l'esercitazione senza registro delle decisioni", es: "Un conjunto de diapositivas que resume el ejercicio sin registro de decisiones", pl: "Zestaw slajdów podsumowujący ćwiczenie bez dziennika decyzji" },
        { en: "Later evidence showing improvement item N was closed", de: "Ein späterer Nachweis, dass Verbesserungspunkt N abgeschlossen wurde", fr: "Une preuve ultérieure montrant que le point d'amélioration N a été clôturé", it: "Una prova successiva che dimostra che il punto di miglioramento N è stato chiuso", es: "Una evidencia posterior que muestra que el punto de mejora N se cerró", pl: "Późniejszy dowód wykazujący, że punkt usprawnienia N został zamknięty" },
      ],
      correctIndex: 2,
      explanation: {
        en: "A slide deck without a decision log is rejected because it does not contain the audit core: the named decisions, times, and justifications that the protocol depends on.",
        de: "Eine Foliensammlung ohne Entscheidungs-Protokoll wird abgelehnt, weil ihr der Kern des Audits fehlt: die namentlichen Entscheidungen, Zeiten und Begründungen, auf denen das Protokoll basiert.",
        fr: "Un jeu de diapositives sans journal des décisions est rejeté car il ne contient pas le cœur de l'audit : les décisions nominatives, les horaires et les justifications dont dépend le protocole.",
        it: "Una presentazione di diapositive senza registro delle decisioni viene respinta perché non contiene il nucleo dell'audit: le decisioni nominative, gli orari e le giustificazioni da cui dipende il protocollo.",
        es: "Un conjunto de diapositivas sin registro de decisiones se rechaza porque no contiene el núcleo de la auditoría: las decisiones nominativas, las horas y las justificaciones de las que depende el protocolo.",
        pl: "Zestaw slajdów bez dziennika decyzji jest odrzucany, ponieważ nie zawiera istoty audytu: nazwanych decyzji, czasów i uzasadnień, na których opiera się protokół.",
      },
    },
    {
      id: "2.3.4",
      question: {
        en: "Why does CIR 2024/2690 Annex Section 4.1 matter for the protocol?",
        de: "Warum ist CIR 2024/2690 Anhang Abschnitt 4.1 für das Protokoll relevant?",
        fr: "Pourquoi la section 4.1 de l'annexe du CIR 2024/2690 est-elle importante pour le protocole ?",
        it: "Perché la sezione 4.1 dell'allegato del CIR 2024/2690 è rilevante per il protocollo?",
        es: "¿Por qué es relevante para el protocolo la sección 4.1 del anexo del CIR 2024/2690?",
        pl: "Dlaczego sekcja 4.1 załącznika do CIR 2024/2690 ma znaczenie dla protokołu?",
      },
      options: [
        { en: "It requires BCDR plan testing with lessons incorporated; the protocol's improvement items are how those lessons get incorporated", de: "Er verlangt Tests des Geschäftsfortführungs- und Notfallwiederherstellungs-Plans mit aufgenommenen Erkenntnissen; die Verbesserungspunkte des Protokolls sind der Weg, wie diese Erkenntnisse aufgenommen werden", fr: "Elle exige que le plan BCDR soit testé avec intégration des leçons tirées ; les points d'amélioration du protocole sont le moyen par lequel ces leçons sont intégrées", it: "Richiede il collaudo del piano BCDR con l'integrazione delle lezioni apprese; i punti di miglioramento del protocollo sono il modo in cui queste lezioni vengono integrate", es: "Exige probar el plan BCDR incorporando las lecciones aprendidas; los puntos de mejora del protocolo son la forma en que esas lecciones se incorporan", pl: "Wymaga testowania planu BCDR z uwzględnieniem wyciągniętych wniosków; punkty usprawnień protokołu są sposobem, w jaki te wnioski są uwzględniane" },
        { en: "It requires the protocol to be in Word format", de: "Er verlangt das Protokoll im Word-Format", fr: "Elle exige que le protocole soit au format Word", it: "Richiede che il protocollo sia in formato Word", es: "Exige que el protocolo esté en formato Word", pl: "Wymaga, aby protokół był w formacie Word" },
        { en: "It requires the protocol to be signed by a notary", de: "Er verlangt eine notarielle Beglaubigung des Protokolls", fr: "Elle exige que le protocole soit signé par un notaire", it: "Richiede che il protocollo sia firmato da un notaio", es: "Exige que el protocolo esté firmado por un notario", pl: "Wymaga, aby protokół był podpisany przez notariusza" },
        { en: "It requires the protocol to be filed with the regulator", de: "Er verlangt die Einreichung des Protokolls bei der Behörde", fr: "Elle exige que le protocole soit déposé auprès du régulateur", it: "Richiede che il protocollo sia depositato presso il regolatore", es: "Exige que el protocolo se presente ante el regulador", pl: "Wymaga złożenia protokołu organowi regulacyjnemu" },
      ],
      correctIndex: 0,
      explanation: {
        en: "CIR Annex 4.1 requires the BCDR plan to be tested, reviewed, and updated, and that the plans 'incorporate lessons learnt from such tests.' The protocol's improvement items are how that incorporation happens.",
        de: "CIR Anhang 4.1 verlangt, dass der BCDR-Plan getestet, überprüft und aktualisiert wird und dass die Pläne \"Erkenntnisse aus solchen Tests aufnehmen\". Die Verbesserungspunkte des Protokolls sind der Weg, wie das geschieht.",
        fr: "L'annexe 4.1 du CIR exige que le plan BCDR soit testé, révisé et mis à jour, et que les plans « intègrent les leçons tirées de tels tests ». Les points d'amélioration du protocole sont le moyen par lequel cette intégration se produit.",
        it: "L'allegato 4.1 del CIR richiede che il piano BCDR sia collaudato, riesaminato e aggiornato e che i piani « integrino le lezioni apprese da tali test ». I punti di miglioramento del protocollo sono il modo in cui avviene tale integrazione.",
        es: "El anexo 4.1 del CIR exige que el plan BCDR se pruebe, revise y actualice, y que los planes « incorporen las lecciones aprendidas de dichas pruebas ». Los puntos de mejora del protocolo son la forma en que se produce esa incorporación.",
        pl: "Załącznik 4.1 CIR wymaga, aby plan BCDR był testowany, przeglądany i aktualizowany oraz aby plany « uwzględniały wnioski wyciągnięte z takich testów ». Punkty usprawnień protokołu są sposobem, w jaki to uwzględnianie następuje.",
      },
    },
  ],
});

export default quiz;
