import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.9",
  passingScore: 75,
  questions: [
    {
      id: "2.9.1",
      question: {
        en: "Who counts as a 'supplier' under NIS2?",
        de: "Wer gilt unter NIS2 als 'Lieferant'?",
        nl: "Wie telt als 'leverancier' onder NIS2?",
        fr: "Qui est considéré comme un 'fournisseur' au titre de NIS2 ?",
        it: "Chi è considerato un 'fornitore' ai sensi di NIS2?",
        es: "¿Quién cuenta como 'proveedor' en virtud de NIS2?",
        pl: "Kto liczy się jako 'dostawca' na podstawie NIS2?",
      },
      options: [
        { en: "Only software vendors listed in the IT budget", de: "Nur Softwareanbieter, die im IT-Budget aufgeführt sind", nl: "Alleen softwareleveranciers die op het IT-budget staan", fr: "Uniquement les éditeurs de logiciels figurant dans le budget informatique", it: "Solo i fornitori di software elencati nel budget IT", es: "Únicamente los proveedores de software que figuran en el presupuesto de TI", pl: "Wyłącznie dostawcy oprogramowania wymienieni w budżecie IT" },
        { en: "Anyone with access to your systems or data, including physical access providers", de: "Jeder mit Zugang zu Ihren Systemen oder Daten, einschließlich Anbieter mit physischem Zugang", nl: "Iedereen met toegang tot uw systemen of gegevens, inclusief aanbieders met fysieke toegang", fr: "Toute personne ayant accès à vos systèmes ou à vos données, y compris les prestataires disposant d'un accès physique", it: "Chiunque abbia accesso ai vostri sistemi o dati, compresi i fornitori con accesso fisico", es: "Cualquier persona con acceso a sus sistemas o datos, incluidos los proveedores con acceso físico", pl: "Każdy, kto ma dostęp do Państwa systemów lub danych, w tym dostawcy z dostępem fizycznym" },
        { en: "Only cloud providers with a signed SLA", de: "Nur Cloud-Anbieter mit einem unterzeichneten SLA", nl: "Alleen cloudaanbieders met een ondertekende SLA", fr: "Uniquement les fournisseurs cloud disposant d'un SLA signé", it: "Solo i fornitori cloud con un SLA firmato", es: "Únicamente los proveedores de nube con un SLA firmado", pl: "Wyłącznie dostawcy chmury z podpisanym SLA" },
        { en: "Only companies in the same industry sector", de: "Nur Unternehmen derselben Branche", nl: "Alleen bedrijven in dezelfde branche", fr: "Uniquement les entreprises du même secteur d'activité", it: "Solo le imprese dello stesso settore", es: "Únicamente las empresas del mismo sector", pl: "Wyłącznie firmy z tego samego sektora" },
      ],
      correctIndex: 1,
      explanation: {
        en: "'Supplier' under NIS2 means anyone with access to your systems or data - from cloud providers to the cleaning company with a key to the server room.",
        de: "'Lieferant' unter NIS2 bedeutet jeder mit Zugang zu Ihren Systemen oder Daten - von Cloud-Anbietern bis zum Reinigungsunternehmen mit Schlüssel zum Serverraum.",
        nl: "'Leverancier' onder NIS2 betekent iedereen met toegang tot uw systemen of gegevens - van cloudaanbieders tot het schoonmaakbedrijf met een sleutel van de serverruimte.",
        fr: "'Fournisseur' au titre de NIS2 désigne toute personne ayant accès à vos systèmes ou à vos données, du fournisseur cloud à l'entreprise de nettoyage qui détient une clé de la salle des serveurs.",
        it: "'Fornitore' ai sensi di NIS2 indica chiunque abbia accesso ai vostri sistemi o dati, dai fornitori cloud all'impresa di pulizie con una chiave della sala server.",
        es: "'Proveedor' en virtud de NIS2 significa cualquier persona con acceso a sus sistemas o datos, desde los proveedores de nube hasta la empresa de limpieza con una llave de la sala de servidores.",
        pl: "'Dostawca' na podstawie NIS2 oznacza każdego, kto ma dostęp do Państwa systemów lub danych - od dostawców chmury po firmę sprzątającą z kluczem do serwerowni.",
      },
    },
    {
      id: "2.9.2",
      question: {
        en: "What are the four things the CIR expects for each supplier?",
        de: "Welche vier Dinge erwartet die CIR für jeden Lieferanten?",
        nl: "Wat zijn de vier dingen die de CIR voor elke leverancier verwacht?",
        fr: "Quelles sont les quatre choses que la CIR attend pour chaque fournisseur ?",
        it: "Quali sono le quattro cose che la CIR si aspetta per ciascun fornitore?",
        es: "¿Cuáles son las cuatro cosas que la CIR espera para cada proveedor?",
        pl: "Jakie cztery rzeczy CIR oczekuje dla każdego dostawcy?",
      },
      options: [
        { en: "Contract, payment, delivery, warranty", de: "Vertrag, Zahlung, Lieferung, Garantie", nl: "Contract, betaling, levering, garantie", fr: "Contrat, paiement, livraison, garantie", it: "Contratto, pagamento, consegna, garanzia", es: "Contrato, pago, entrega, garantía", pl: "Umowa, płatność, dostawa, gwarancja" },
        { en: "Inventory entry, risk classification, contractual security clauses, and periodic review", de: "Inventareintrag, Risikoklassifizierung, vertragliche Sicherheitsklauseln und regelmäßige Überprüfung", nl: "Inventarisatie, risicoklassificatie, contractuele beveiligingsclausules en periodieke beoordeling", fr: "Inscription à l'inventaire, classification du risque, clauses de sécurité contractuelles et réexamen périodique", it: "Iscrizione all'inventario, classificazione del rischio, clausole contrattuali di sicurezza e riesame periodico", es: "Entrada en el inventario, clasificación del riesgo, cláusulas contractuales de seguridad y revisión periódica", pl: "Wpis do inwentaryzacji, klasyfikacja ryzyka, umowne klauzule bezpieczeństwa oraz okresowy przegląd" },
        { en: "NDA, insurance certificate, audit report, reference check", de: "NDA, Versicherungsnachweis, Audit-Bericht, Referenzprüfung", nl: "NDA, verzekeringscertificaat, auditrapport, referentiecheck", fr: "NDA, certificat d'assurance, rapport d'audit, vérification des références", it: "NDA, certificato assicurativo, rapporto di audit, verifica delle referenze", es: "NDA, certificado de seguro, informe de auditoría, verificación de referencias", pl: "NDA, certyfikat ubezpieczeniowy, raport z audytu, sprawdzenie referencji" },
        { en: "Background check, credit check, compliance score, annual fee", de: "Hintergrundprüfung, Bonitätsprüfung, Compliance-Bewertung, Jahresgebühr", nl: "Antecedentenonderzoek, kredietcheck, compliancescore, jaarlijkse vergoeding", fr: "Enquête de moralité, vérification de solvabilité, score de conformité, frais annuels", it: "Controllo dei precedenti, verifica del credito, punteggio di conformità, canone annuale", es: "Verificación de antecedentes, comprobación de solvencia, puntuación de cumplimiento, cuota anual", pl: "Sprawdzenie przeszłości, sprawdzenie zdolności kredytowej, wynik zgodności, roczna opłata" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The four requirements are: supplier inventory, risk classification, contractual clauses (notification, audit rights, baseline), and periodic review.",
        de: "Die vier Anforderungen sind: Lieferanteninventar, Risikoklassifizierung, vertragliche Klauseln (Meldepflicht, Auditrechte, Baseline) und regelmäßige Überprüfung.",
        nl: "De vier vereisten zijn: leveranciersoverzicht, risicoklassificatie, contractuele clausules (meldingsplicht, auditrechten, baseline) en periodieke beoordeling.",
        fr: "Les quatre exigences sont : l'inventaire des fournisseurs, la classification du risque, les clauses contractuelles (notification, droits d'audit, exigences minimales) et le réexamen périodique.",
        it: "I quattro requisiti sono: inventario dei fornitori, classificazione del rischio, clausole contrattuali (notifica, diritti di audit, requisiti di base) e riesame periodico.",
        es: "Los cuatro requisitos son: inventario de proveedores, clasificación del riesgo, cláusulas contractuales (notificación, derechos de auditoría, requisitos mínimos) y revisión periódica.",
        pl: "Cztery wymagania to: inwentaryzacja dostawców, klasyfikacja ryzyka, klauzule umowne (powiadamianie, prawa do audytu, wymagania bazowe) oraz okresowy przegląd.",
      },
    },
    {
      id: "2.9.3",
      question: {
        en: "If your supplier is breached and your customers' data is exposed, who bears the reporting duty?",
        de: "Wenn Ihr Lieferant kompromittiert wird und Kundendaten offengelegt werden, wer trägt die Meldepflicht?",
        nl: "Als uw leverancier gehackt wordt en klantgegevens worden blootgesteld, wie draagt dan de meldingsplicht?",
        fr: "Si votre fournisseur subit une violation et que les données de vos clients sont exposées, à qui incombe l'obligation de notification ?",
        it: "Se il vostro fornitore subisce una violazione e i dati dei vostri clienti vengono esposti, a chi spetta l'obbligo di notifica?",
        es: "Si su proveedor sufre una brecha y los datos de sus clientes quedan expuestos, ¿a quién corresponde el deber de notificación?",
        pl: "Jeśli u Państwa dostawcy dojdzie do naruszenia i dane Państwa klientów zostaną ujawnione, na kim spoczywa obowiązek zgłoszenia?",
      },
      options: [
        { en: "The supplier, because the breach happened in their systems", de: "Der Lieferant, weil der Vorfall in seinen Systemen geschah", nl: "De leverancier, omdat het incident in hun systemen plaatsvond", fr: "Le fournisseur, parce que la violation s'est produite dans ses systèmes", it: "Il fornitore, perché la violazione è avvenuta nei suoi sistemi", es: "El proveedor, porque la brecha se produjo en sus sistemas", pl: "Dostawca, ponieważ naruszenie nastąpiło w jego systemach" },
        { en: "You, because the reporting and notification duties under Articles 23 and 36 land on the entity, not the supplier", de: "Sie, weil die Melde- und Benachrichtigungspflichten gemäß Artikel 23 und 36 bei der Einrichtung liegen, nicht beim Lieferanten", nl: "U, omdat de meldings- en kennisgevingsplichten uit Artikelen 23 en 36 bij de entiteit liggen, niet bij de leverancier", fr: "Vous, parce que les obligations de signalement et de notification au titre des articles 23 et 36 incombent à l'entité, et non au fournisseur", it: "Voi, perché gli obblighi di segnalazione e notifica ai sensi degli articoli 23 e 36 spettano al soggetto, non al fornitore", es: "Usted, porque los deberes de notificación de los artículos 23 y 36 recaen en la entidad, no en el proveedor", pl: "Państwo, ponieważ obowiązki zgłaszania i powiadamiania na podstawie artykułów 23 i 36 spoczywają na podmiocie, a nie na dostawcy" },
        { en: "The customers themselves, because they own the data", de: "Die Kunden selbst, weil ihnen die Daten gehören", nl: "De klanten zelf, omdat zij eigenaar zijn van de gegevens", fr: "Les clients eux-mêmes, parce qu'ils sont propriétaires des données", it: "I clienti stessi, perché sono proprietari dei dati", es: "Los propios clientes, porque son los propietarios de los datos", pl: "Sami klienci, ponieważ są właścicielami danych" },
        { en: "The national regulator, because they manage all reporting", de: "Die nationale Aufsichtsbehörde, weil sie alle Meldungen verwaltet", nl: "De nationale toezichthouder, omdat die alle meldingen beheert", fr: "L'autorité de contrôle nationale, parce qu'elle gère tous les signalements", it: "L'autorità di vigilanza nazionale, perché gestisce tutte le segnalazioni", es: "La autoridad reguladora nacional, porque gestiona todas las notificaciones", pl: "Krajowy organ nadzoru, ponieważ zarządza wszystkimi zgłoszeniami" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The reporting duty under Article 23 and the customer notification duty under Article 36 both land on you - the supplier's report does not cover you.",
        de: "Die Meldepflicht gemäß Artikel 23 und die Kundenbenachrichtigungspflicht gemäß Artikel 36 liegen beide bei Ihnen - die Meldung des Lieferanten deckt Sie nicht ab.",
        nl: "De meldingsplicht uit Artikel 23 en de klantenkennisgevingsplicht uit Artikel 36 liggen allebei bij u - de melding van de leverancier dekt u niet.",
        fr: "L'obligation de signalement au titre de l'article 23 et l'obligation de notification aux clients au titre de l'article 36 vous incombent toutes deux : le signalement du fournisseur ne vous couvre pas.",
        it: "L'obbligo di segnalazione ai sensi dell'articolo 23 e l'obbligo di notifica ai clienti ai sensi dell'articolo 36 spettano entrambi a voi: la segnalazione del fornitore non vi copre.",
        es: "El deber de notificación del artículo 23 y el deber de notificación a los clientes del artículo 36 recaen ambos en usted: la notificación del proveedor no le cubre.",
        pl: "Obowiązek zgłaszania na podstawie artykułu 23 oraz obowiązek powiadamiania klientów na podstawie artykułu 36 spoczywają na Państwu - zgłoszenie dostawcy Państwa nie obejmuje.",
      },
    },
  ],
});

export default quiz;
