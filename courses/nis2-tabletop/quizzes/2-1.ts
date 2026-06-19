import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.1",
  passingScore: 75,
  questions: [
    {
      id: "2.1.1",
      question: {
        en: "In the ransomware scenario, when does the Article 23 clock start?",
        de: "Wann startet im Ransomware-Szenario die Uhr nach Artikel 23?",
        fr: "Dans le scénario de rançongiciel, quand le délai de l'article 23 commence-t-il à courir ?",
        it: "Nello scenario di ransomware, quando inizia a decorrere il termine dell'articolo 23?",
        es: "En el escenario de ransomware, ¿cuándo empieza a contar el plazo del artículo 23?",
        pl: "W scenariuszu ransomware kiedy zaczyna biec termin z artykułu 23?",
      },
      options: [
        { en: "When the SIEM raises an alert at 08:50", de: "Wenn das SIEM um 08:50 einen Alarm auslöst", fr: "Lorsque le SIEM déclenche une alerte à 08:50", it: "Quando il SIEM genera un allarme alle 08:50", es: "Cuando el SIEM genera una alerta a las 08:50", pl: "Gdy SIEM generuje alert o 08:50" },
        { en: "When the IT manager finds .lockbit3 file extensions and calls the CEO at 09:14", de: "Wenn die IT-Verantwortliche um 09:14 die .lockbit3-Dateiendungen findet und die Geschäftsführung anruft", fr: "Lorsque le responsable informatique trouve les extensions de fichier .lockbit3 et appelle le PDG à 09:14", it: "Quando il responsabile IT trova le estensioni di file .lockbit3 e chiama l'amministratore delegato alle 09:14", es: "Cuando el responsable de TI encuentra las extensiones de archivo .lockbit3 y llama al director ejecutivo a las 09:14", pl: "Gdy menedżer IT znajduje rozszerzenia plików .lockbit3 i dzwoni do prezesa o 09:14" },
        { en: "When forensic triage confirms the encryption at 11:00", de: "Wenn die forensische Erstanalyse um 11:00 die Verschlüsselung bestätigt", fr: "Lorsque le triage forensique confirme le chiffrement à 11:00", it: "Quando il triage forense conferma la cifratura alle 11:00", es: "Cuando el triaje forense confirma el cifrado a las 11:00", pl: "Gdy wstępna analiza kryminalistyczna potwierdza szyfrowanie o 11:00" },
        { en: "When the CSIRT acknowledges the early warning", de: "Wenn das CSIRT die Frühwarnung bestätigt", fr: "Lorsque le CSIRT accuse réception de l'alerte précoce", it: "Quando il CSIRT conferma il preallarme", es: "Cuando el CSIRT confirma la alerta temprana", pl: "Gdy CSIRT potwierdza wczesne ostrzeżenie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The clock starts when a responsible person becomes aware. The IT manager calling the CEO at 09:14 with confirmed indicators is that moment.",
        de: "Die Uhr startet bei der Kenntniserlangung durch eine verantwortliche Person. Der Anruf der IT-Verantwortlichen um 09:14 mit bestätigten Indikatoren ist dieser Moment.",
        fr: "Le délai commence à courir lorsqu'une personne responsable a connaissance. L'appel du responsable informatique au PDG à 09:14 avec des indicateurs confirmés est ce moment.",
        it: "Il termine inizia a decorrere quando una persona responsabile ne viene a conoscenza. La chiamata del responsabile IT all'amministratore delegato alle 09:14 con indicatori confermati è quel momento.",
        es: "El plazo empieza a contar cuando una persona responsable tiene conocimiento. La llamada del responsable de TI al director ejecutivo a las 09:14 con indicadores confirmados es ese momento.",
        pl: "Termin zaczyna biec, gdy osoba odpowiedzialna powzięła wiedzę. Telefon menedżera IT do prezesa o 09:14 z potwierdzonymi wskaźnikami to ten moment.",
      },
    },
    {
      id: "2.1.2",
      question: {
        en: "Why must the external IR provider be engaged early in the scenario?",
        de: "Warum sollte der externe IR-Dienstleister im Szenario früh eingeschaltet werden?",
        fr: "Pourquoi le prestataire externe de réponse aux incidents doit-il être sollicité tôt dans le scénario ?",
        it: "Perché il fornitore esterno di risposta agli incidenti deve essere coinvolto presto nello scenario?",
        es: "¿Por qué debe contratarse al proveedor externo de respuesta a incidentes en una fase temprana del escenario?",
        pl: "Dlaczego zewnętrzny dostawca reagowania na incydenty musi zostać zaangażowany wcześnie w scenariuszu?",
      },
      options: [
        { en: "Because the cyber insurance policy requires it", de: "Weil die Cyber-Versicherungs-Police es verlangt", fr: "Parce que la police d'assurance cyber l'exige", it: "Perché la polizza di assicurazione cyber lo richiede", es: "Porque la póliza de ciberseguro lo exige", pl: "Ponieważ wymaga tego polisa ubezpieczenia cybernetycznego" },
        { en: "Because internal teams cannot legally do forensics in Germany", de: "Weil interne Teams in Deutschland keine Forensik durchführen dürfen", fr: "Parce que les équipes internes ne sont pas légalement autorisées à mener des investigations forensiques en Allemagne", it: "Perché in Germania i team interni non possono legalmente eseguire analisi forensi", es: "Porque en Alemania los equipos internos no pueden realizar análisis forenses legalmente", pl: "Ponieważ w Niemczech zespoły wewnętrzne nie mogą legalnie prowadzić analizy kryminalistycznej" },
        { en: "Because late engagement finds an environment where evidence has been overwritten and the timeline is no longer reconstructable", de: "Weil eine späte Einschaltung eine Umgebung vorfindet, in der Beweise überschrieben sind und die Zeitleiste nicht mehr rekonstruiert werden kann", fr: "Parce qu'une sollicitation tardive trouve un environnement où les preuves ont été écrasées et où la chronologie n'est plus reconstituable", it: "Perché un coinvolgimento tardivo trova un ambiente in cui le prove sono state sovrascritte e la cronologia non è più ricostruibile", es: "Porque una contratación tardía encuentra un entorno donde las pruebas se han sobrescrito y la cronología ya no es reconstruible", pl: "Ponieważ późne zaangażowanie zastaje środowisko, w którym dowody zostały nadpisane, a osi czasu nie da się już odtworzyć" },
        { en: "Because the IR provider needs 24 hours to arrive on site", de: "Weil der IR-Dienstleister 24 Stunden Anreise braucht", fr: "Parce que le prestataire de réponse aux incidents a besoin de 24 heures pour arriver sur place", it: "Perché il fornitore di risposta agli incidenti ha bisogno di 24 ore per arrivare sul posto", es: "Porque el proveedor de respuesta a incidentes necesita 24 horas para llegar al lugar", pl: "Ponieważ dostawca reagowania na incydenty potrzebuje 24 godzin na dotarcie na miejsce" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Engaging late means panicked sysadmins, partial restores, and lost evidence. The pre-negotiated contract and runbook contact exist to make early engagement automatic.",
        de: "Eine späte Einschaltung führt zu panischen Admins, teilweisen Wiederherstellungen und verlorenen Beweisen. Der vorab abgeschlossene Vertrag und der Runbook-Kontakt sorgen für eine automatische frühe Einschaltung.",
        fr: "Une sollicitation tardive signifie des administrateurs systèmes paniqués, des restaurations partielles et des preuves perdues. Le contrat négocié à l'avance et le contact du runbook existent pour rendre la sollicitation précoce automatique.",
        it: "Un coinvolgimento tardivo significa sistemisti in preda al panico, ripristini parziali e prove perdute. Il contratto negoziato in anticipo e il contatto nel runbook esistono per rendere automatico il coinvolgimento precoce.",
        es: "Una contratación tardía significa administradores de sistemas en pánico, restauraciones parciales y pruebas perdidas. El contrato negociado de antemano y el contacto del runbook existen para que la contratación temprana sea automática.",
        pl: "Późne zaangażowanie oznacza spanikowanych administratorów, częściowe przywracania i utracone dowody. Wcześniej wynegocjowana umowa i kontakt w runbooku istnieją po to, aby wczesne zaangażowanie było automatyczne.",
      },
    },
    {
      id: "2.1.3",
      question: {
        en: "Why is the latest backup not automatically the right restore point in a ransomware scenario?",
        de: "Warum ist die neueste Datensicherung bei einem Ransomware-Szenario nicht automatisch der richtige Wiederherstellungspunkt?",
        fr: "Pourquoi la sauvegarde la plus récente n'est-elle pas automatiquement le bon point de restauration dans un scénario de rançongiciel ?",
        it: "Perché il backup più recente non è automaticamente il punto di ripristino corretto in uno scenario di ransomware?",
        es: "¿Por qué la copia de seguridad más reciente no es automáticamente el punto de restauración correcto en un escenario de ransomware?",
        pl: "Dlaczego najnowsza kopia zapasowa nie jest automatycznie właściwym punktem przywracania w scenariuszu ransomware?",
      },
      options: [
        { en: "Because the latest backup is always corrupted", de: "Weil die neueste Sicherung immer beschädigt ist", fr: "Parce que la sauvegarde la plus récente est toujours corrompue", it: "Perché il backup più recente è sempre danneggiato", es: "Porque la copia de seguridad más reciente siempre está dañada", pl: "Ponieważ najnowsza kopia zapasowa jest zawsze uszkodzona" },
        { en: "Because the attacker may have been in the environment for weeks before encryption, making the latest backup compromised", de: "Weil die Täterschaft Wochen vor der Verschlüsselung in der Umgebung gewesen sein kann und die neueste Sicherung bereits kompromittiert ist", fr: "Parce que l'attaquant peut avoir été présent dans l'environnement pendant des semaines avant le chiffrement, rendant la sauvegarde la plus récente compromise", it: "Perché l'attaccante potrebbe essere stato nell'ambiente per settimane prima della cifratura, rendendo compromesso il backup più recente", es: "Porque el atacante puede haber estado en el entorno durante semanas antes del cifrado, lo que deja comprometida la copia de seguridad más reciente", pl: "Ponieważ atakujący mógł przebywać w środowisku przez tygodnie przed szyfrowaniem, przez co najnowsza kopia zapasowa jest skompromitowana" },
        { en: "Because backups need 48 hours to verify", de: "Weil Sicherungen 48 Stunden Prüfung brauchen", fr: "Parce que les sauvegardes nécessitent 48 heures de vérification", it: "Perché i backup richiedono 48 ore di verifica", es: "Porque las copias de seguridad necesitan 48 horas de verificación", pl: "Ponieważ kopie zapasowe wymagają 48 godzin weryfikacji" },
        { en: "Because the cyber insurance policy mandates the use of the second-newest backup", de: "Weil die Cyber-Versicherung die Nutzung der zweitneuesten Sicherung vorschreibt", fr: "Parce que la police d'assurance cyber impose l'utilisation de l'avant-dernière sauvegarde", it: "Perché la polizza di assicurazione cyber impone l'uso del penultimo backup", es: "Porque la póliza de ciberseguro obliga a usar la penúltima copia de seguridad", pl: "Ponieważ polisa ubezpieczenia cybernetycznego nakazuje użycie przedostatniej kopii zapasowej" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Ransomware operators typically dwell for weeks before encryption. The right restore point is the most recent backup that pre-dates the initial compromise, confirmed clean by forensics.",
        de: "Ransomware-Täterschaft verweilt typischerweise Wochen vor der Verschlüsselung. Der richtige Wiederherstellungspunkt ist die jüngste Sicherung vor der ersten Kompromittierung, durch Forensik als sauber bestätigt.",
        fr: "Les opérateurs de rançongiciels demeurent généralement présents pendant des semaines avant le chiffrement. Le bon point de restauration est la sauvegarde la plus récente antérieure à la compromission initiale, confirmée saine par l'analyse forensique.",
        it: "Gli operatori di ransomware in genere permangono per settimane prima della cifratura. Il punto di ripristino corretto è il backup più recente anteriore alla compromissione iniziale, confermato pulito dall'analisi forense.",
        es: "Los operadores de ransomware suelen permanecer durante semanas antes del cifrado. El punto de restauración correcto es la copia de seguridad más reciente anterior al compromiso inicial, confirmada como limpia por el análisis forense.",
        pl: "Operatorzy ransomware zwykle przebywają w środowisku przez tygodnie przed szyfrowaniem. Właściwy punkt przywracania to najnowsza kopia zapasowa sprzed pierwszej kompromitacji, potwierdzona jako czysta przez analizę kryminalistyczną.",
      },
    },
    {
      id: "2.1.4",
      question: {
        en: "What is the common decision pattern across all twelve scenarios in the library?",
        de: "Welches Entscheidungsmuster ist allen zwölf Szenarien der Bibliothek gemeinsam?",
        fr: "Quel est le schéma décisionnel commun à l'ensemble des douze scénarios de la bibliothèque ?",
        it: "Qual è lo schema decisionale comune a tutti e dodici gli scenari della libreria?",
        es: "¿Cuál es el patrón de decisión común a los doce escenarios de la biblioteca?",
        pl: "Jaki wzorzec decyzyjny jest wspólny dla wszystkich dwunastu scenariuszy w bibliotece?",
      },
      options: [
        { en: "Significance assessment, escalation, external help, containment, regulator cascade, customer comms, final report", de: "Erheblichkeits-Prüfung, Eskalation, externe Hilfe, Eindämmung, Meldekette an die Behörde, Kundenkommunikation, Abschlussbericht", fr: "Évaluation du caractère important, escalade, aide externe, confinement, chaîne de notification au régulateur, communication aux clients, rapport final", it: "Valutazione della significatività, escalation, aiuto esterno, contenimento, catena di notifica al regolatore, comunicazione ai clienti, relazione finale", es: "Evaluación de la significatividad, escalado, ayuda externa, contención, cadena de notificación al regulador, comunicación a los clientes, informe final", pl: "Ocena istotności, eskalacja, pomoc zewnętrzna, ograniczanie, łańcuch zgłoszeń do organu regulacyjnego, komunikacja z klientami, raport końcowy" },
        { en: "Detection, containment, eradication, recovery, lessons learned", de: "Erkennung, Eindämmung, Beseitigung, Wiederherstellung, Lessons Learned", fr: "Détection, confinement, éradication, rétablissement, leçons tirées", it: "Rilevamento, contenimento, eradicazione, ripristino, lezioni apprese", es: "Detección, contención, erradicación, recuperación, lecciones aprendidas", pl: "Wykrywanie, ograniczanie, eliminacja, przywracanie, wyciągnięte wnioski" },
        { en: "Triage, escalation, BSI notification, public statement", de: "Erstanalyse, Eskalation, BSI-Meldung, öffentliche Stellungnahme", fr: "Triage, escalade, notification au BSI, déclaration publique", it: "Triage, escalation, notifica al BSI, dichiarazione pubblica", es: "Triaje, escalado, notificación al BSI, declaración pública", pl: "Wstępna analiza, eskalacja, zgłoszenie do BSI, oświadczenie publiczne" },
        { en: "Forensics, restore, audit, board report", de: "Forensik, Wiederherstellung, Audit, Aufsichtsrat-Bericht", fr: "Investigation forensique, restauration, audit, rapport au conseil", it: "Analisi forense, ripristino, audit, relazione al consiglio", es: "Análisis forense, restauración, auditoría, informe al consejo", pl: "Analiza kryminalistyczna, przywracanie, audyt, raport dla zarządu" },
      ],
      correctIndex: 0,
      explanation: {
        en: "Every NIS 2 scenario follows this seven-step pattern. The scenarios differ in the trigger and the §30(2) measures stressed, but the decision pattern is constant.",
        de: "Jedes NIS-2-Szenario folgt diesem siebenstufigen Muster. Die Szenarien unterscheiden sich im Auslöser und in den betonten Maßnahmen aus §30(2), das Entscheidungsmuster bleibt jedoch gleich.",
        fr: "Chaque scénario NIS 2 suit ce schéma en sept étapes. Les scénarios diffèrent par le déclencheur et les mesures du §30(2) mises à l'épreuve, mais le schéma décisionnel reste constant.",
        it: "Ogni scenario NIS 2 segue questo schema in sette fasi. Gli scenari differiscono per l'elemento scatenante e per le misure del §30(2) messe alla prova, ma lo schema decisionale resta costante.",
        es: "Cada escenario NIS 2 sigue este patrón de siete pasos. Los escenarios difieren en el desencadenante y en las medidas del §30(2) que se ponen a prueba, pero el patrón de decisión es constante.",
        pl: "Każdy scenariusz NIS 2 podąża za tym siedmioetapowym wzorcem. Scenariusze różnią się wyzwalaczem oraz testowanymi środkami z §30(2), ale wzorzec decyzyjny pozostaje stały.",
      },
    },
  ],
});

export default quiz;
