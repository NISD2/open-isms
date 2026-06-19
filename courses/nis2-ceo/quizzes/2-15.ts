import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.15",
  passingScore: 75,
  questions: [
    {
      id: "2.15.1",
      question: {
        en: "For which four categories is MFA effectively mandatory for a NIS2 entity?",
        de: "Für welche vier Kategorien ist MFA für eine NIS2-Einrichtung faktisch verpflichtend?",
        nl: "Voor welke vier categorieën is MFA feitelijk verplicht voor een NIS2-entiteit?",
        fr: "Pour quelles quatre catégories la MFA est-elle de fait obligatoire pour une entité NIS2 ?",
        it: "Per quali quattro categorie la MFA è di fatto obbligatoria per un soggetto NIS2?",
        es: "¿Para qué cuatro categorías es la MFA de hecho obligatoria para una entidad NIS2?",
        pl: "Dla których czterech kategorii MFA jest faktycznie obowiązkowe dla podmiotu NIS2?",
      },
      options: [
        { en: "Personal email, social media, personal banking, and personal devices", de: "Private E-Mail, soziale Medien, privates Banking und persönliche Geräte", nl: "Persoonlijke e-mail, sociale media, persoonlijk bankieren en persoonlijke apparaten", fr: "La messagerie personnelle, les réseaux sociaux, la banque personnelle et les appareils personnels", it: "E-mail personale, social media, home banking personale e dispositivi personali", es: "Correo electrónico personal, redes sociales, banca personal y dispositivos personales", pl: "Prywatna poczta e-mail, media społecznościowe, bankowość prywatna i urządzenia osobiste" },
        { en: "Remote access, administrator accounts, critical systems, and email", de: "Fernzugriff, Administratorkonten, kritische Systeme und E-Mail", nl: "Toegang op afstand, beheerdersaccounts, kritieke systemen en e-mail", fr: "L'accès à distance, les comptes administrateurs, les systèmes critiques et la messagerie", it: "Accesso remoto, account amministratore, sistemi critici ed e-mail", es: "Acceso remoto, cuentas de administrador, sistemas críticos y correo electrónico", pl: "Dostęp zdalny, konta administratorów, systemy krytyczne i poczta e-mail" },
        { en: "Marketing tools, HR systems, accounting software, and the company website", de: "Marketing-Tools, HR-Systeme, Buchhaltungssoftware und die Unternehmenswebsite", nl: "Marketingtools, HR-systemen, boekhoudsoftware en de bedrijfswebsite", fr: "Les outils marketing, les systèmes RH, les logiciels de comptabilité et le site web de l'entreprise", it: "Strumenti di marketing, sistemi HR, software di contabilità e il sito web aziendale", es: "Herramientas de marketing, sistemas de RR. HH., software de contabilidad y el sitio web de la empresa", pl: "Narzędzia marketingowe, systemy kadrowe, oprogramowanie księgowe i strona internetowa firmy" },
        { en: "Board meetings, investor portals, press releases, and internal chat", de: "Vorstandssitzungen, Investorenportale, Pressemitteilungen und interner Chat", nl: "Bestuursvergaderingen, investeerdersportalen, persberichten en interne chat", fr: "Les réunions du conseil, les portails investisseurs, les communiqués de presse et la messagerie interne", it: "Riunioni del consiglio, portali per investitori, comunicati stampa e chat interna", es: "Reuniones del consejo, portales de inversores, comunicados de prensa y chat interno", pl: "Posiedzenia zarządu, portale inwestorskie, komunikaty prasowe i czat wewnętrzny" },
      ],
      correctIndex: 1,
      explanation: {
        en: "MFA is effectively mandatory on remote access, administrator accounts, critical systems (databases, backups, payment systems), and email.",
        de: "MFA ist faktisch verpflichtend für Fernzugriff, Administratorkonten, kritische Systeme (Datenbanken, Backups, Zahlungssysteme) und E-Mail.",
        nl: "MFA is feitelijk verplicht voor toegang op afstand, beheerdersaccounts, kritieke systemen (databases, back-ups, betaalsystemen) en e-mail.",
        fr: "La MFA est de fait obligatoire pour l'accès à distance, les comptes administrateurs, les systèmes critiques (bases de données, sauvegardes, systèmes de paiement) et la messagerie.",
        it: "La MFA è di fatto obbligatoria per l'accesso remoto, gli account amministratore, i sistemi critici (database, backup, sistemi di pagamento) e l'e-mail.",
        es: "La MFA es de hecho obligatoria para el acceso remoto, las cuentas de administrador, los sistemas críticos (bases de datos, copias de seguridad, sistemas de pago) y el correo electrónico.",
        pl: "MFA jest faktycznie obowiązkowe dla dostępu zdalnego, kont administratorów, systemów krytycznych (bazy danych, kopie zapasowe, systemy płatności) i poczty e-mail.",
      },
    },
    {
      id: "2.15.2",
      question: {
        en: "What is an 'out-of-band channel' and why is it needed?",
        de: "Was ist ein 'Out-of-Band-Kanal' und wozu wird er benötigt?",
        nl: "Wat is een 'out-of-band kanaal' en waarom is het nodig?",
        fr: "Qu'est-ce qu'un « canal hors bande » et pourquoi est-il nécessaire ?",
        it: "Cos'è un 'canale fuori banda' e perché è necessario?",
        es: "¿Qué es un 'canal fuera de banda' y por qué es necesario?",
        pl: "Czym jest 'kanał poza pasmem' i dlaczego jest potrzebny?",
      },
      options: [
        { en: "A backup internet connection; needed for faster downloads", de: "Eine Backup-Internetverbindung; benötigt für schnellere Downloads", nl: "Een reserveinternetverbinding; nodig voor snellere downloads", fr: "Une connexion internet de secours ; nécessaire pour des téléchargements plus rapides", it: "Una connessione internet di backup; necessaria per download più veloci", es: "Una conexión a internet de respaldo; necesaria para descargas más rápidas", pl: "Zapasowe połączenie internetowe; potrzebne do szybszego pobierania" },
        { en: "A separate emergency communication path that works when normal systems are compromised", de: "Ein separater Notfallkommunikationsweg, der funktioniert, wenn die normalen Systeme kompromittiert sind", nl: "Een apart noodcommunicatiepad dat werkt wanneer normale systemen gecompromitteerd zijn", fr: "Une voie de communication d'urgence distincte qui fonctionne lorsque les systèmes normaux sont compromis", it: "Un percorso di comunicazione d'emergenza separato che funziona quando i sistemi normali sono compromessi", es: "Una vía de comunicación de emergencia independiente que funciona cuando los sistemas normales están comprometidos", pl: "Oddzielna awaryjna ścieżka komunikacji, która działa, gdy normalne systemy są skompromitowane" },
        { en: "An encrypted email service; needed for regulatory compliance", de: "Ein verschlüsselter E-Mail-Dienst; benötigt für regulatorische Compliance", nl: "Een versleutelde e-mailservice; nodig voor naleving van regelgeving", fr: "Un service de messagerie chiffré ; nécessaire à la conformité réglementaire", it: "Un servizio di posta elettronica crittografato; necessario per la conformità normativa", es: "Un servicio de correo electrónico cifrado; necesario para el cumplimiento normativo", pl: "Szyfrowana usługa poczty e-mail; potrzebna do zgodności regulacyjnej" },
        { en: "A public communication channel for press releases during incidents", de: "Ein öffentlicher Kommunikationskanal für Pressemitteilungen bei Vorfällen", nl: "Een openbaar communicatiekanaal voor persberichten tijdens incidenten", fr: "Un canal de communication public pour les communiqués de presse lors des incidents", it: "Un canale di comunicazione pubblico per i comunicati stampa durante gli incidenti", es: "Un canal de comunicación público para los comunicados de prensa durante los incidentes", pl: "Publiczny kanał komunikacji do komunikatów prasowych podczas incydentów" },
      ],
      correctIndex: 1,
      explanation: {
        en: "An out-of-band channel is a separate communication path (separate messaging tool, dedicated phone line) for when normal systems are down - if the crisis plan relies on email and email is compromised, it fails.",
        de: "Ein Out-of-Band-Kanal ist ein separater Kommunikationsweg (separates Messaging-Tool, dedizierte Telefonleitung) für den Fall, dass normale Systeme ausfallen - wenn der Krisenplan auf E-Mail basiert und E-Mail kompromittiert ist, funktioniert er nicht.",
        nl: "Een out-of-band kanaal is een apart communicatiepad voor wanneer normale systemen uitvallen - als het crisisplan afhankelijk is van e-mail en e-mail gecompromitteerd is, werkt het niet.",
        fr: "Un canal hors bande est une voie de communication distincte (outil de messagerie séparé, ligne téléphonique dédiée) pour le cas où les systèmes normaux sont hors service : si le plan de crise repose sur la messagerie et que celle-ci est compromise, il échoue.",
        it: "Un canale fuori banda è un percorso di comunicazione separato (strumento di messaggistica separato, linea telefonica dedicata) per quando i sistemi normali sono fuori uso: se il piano di crisi si basa sull'e-mail e l'e-mail è compromessa, fallisce.",
        es: "Un canal fuera de banda es una vía de comunicación independiente (herramienta de mensajería separada, línea telefónica dedicada) para cuando los sistemas normales están caídos: si el plan de crisis depende del correo electrónico y este está comprometido, falla.",
        pl: "Kanał poza pasmem to oddzielna ścieżka komunikacji (osobne narzędzie do przesyłania wiadomości, dedykowana linia telefoniczna) na wypadek awarii normalnych systemów - jeśli plan kryzysowy opiera się na poczcie e-mail, a poczta jest skompromitowana, zawodzi.",
      },
    },
    {
      id: "2.15.3",
      question: {
        en: "Why is the CEO's own account the first one the auditor checks for MFA?",
        de: "Warum ist das Konto des CEO das erste, das der Auditor auf MFA prüft?",
        nl: "Waarom is het account van de CEO het eerste dat de auditor controleert op MFA?",
        fr: "Pourquoi le compte du dirigeant est-il le premier que l'auditeur vérifie pour la MFA ?",
        it: "Perché l'account dell'amministratore delegato è il primo che il revisore controlla per la MFA?",
        es: "¿Por qué la cuenta del propio director general es la primera que el auditor comprueba en busca de MFA?",
        pl: "Dlaczego konto samego dyrektora generalnego jest pierwszym, które audytor sprawdza pod kątem MFA?",
      },
      options: [
        { en: "Because the CEO's account contains the most sensitive data", de: "Weil das Konto des CEO die sensibelsten Daten enthält", nl: "Omdat het account van de CEO de gevoeligste gegevens bevat", fr: "Parce que le compte du dirigeant contient les données les plus sensibles", it: "Perché l'account dell'amministratore delegato contiene i dati più sensibili", es: "Porque la cuenta del director general contiene los datos más sensibles", pl: "Ponieważ konto dyrektora generalnego zawiera najbardziej wrażliwe dane" },
        { en: "Because BSI Standard 200-1 Principle 6 requires the management body to personally follow the security controls they approved", de: "Weil BSI-Standard 200-1 Grundsatz 6 verlangt, dass die Geschäftsleitung die von ihr genehmigten Sicherheitsmaßnahmen persönlich befolgt", nl: "Omdat BSI-standaard 200-1 Principe 6 vereist dat het leidinggevend orgaan de beveiligingsmaatregelen die zij hebben goedgekeurd persoonlijk naleeft", fr: "Parce que le BSI Standard 200-1 Principe 6 exige que l'organe de direction respecte personnellement les contrôles de sécurité qu'il a approuvés", it: "Perché il BSI Standard 200-1 Principio 6 richiede che l'organo di gestione rispetti personalmente i controlli di sicurezza che ha approvato", es: "Porque el BSI Standard 200-1 Principio 6 exige que el órgano de dirección cumpla personalmente los controles de seguridad que aprobó", pl: "Ponieważ BSI Standard 200-1 Zasada 6 wymaga, aby organ zarządzający osobiście przestrzegał zatwierdzonych przez siebie kontroli bezpieczeństwa" },
        { en: "Because the auditor starts alphabetically and CEO comes first", de: "Weil der Auditor alphabetisch vorgeht und CEO an erster Stelle steht", nl: "Omdat de auditor alfabetisch begint en CEO als eerste komt", fr: "Parce que l'auditeur procède par ordre alphabétique et que CEO vient en premier", it: "Perché il revisore procede in ordine alfabetico e CEO viene per primo", es: "Porque el auditor empieza por orden alfabético y CEO va primero", pl: "Ponieważ audytor zaczyna alfabetycznie, a CEO jest pierwsze" },
        { en: "Because the regulator specifically named the CEO role in Article 21", de: "Weil die Aufsichtsbehörde die CEO-Rolle in Artikel 21 ausdrücklich benannt hat", nl: "Omdat de toezichthouder de CEO-rol specifiek heeft genoemd in Artikel 21", fr: "Parce que l'autorité de contrôle a expressément nommé le rôle de dirigeant à l'article 21", it: "Perché l'autorità di vigilanza ha espressamente nominato il ruolo di amministratore delegato nell'articolo 21", es: "Porque la autoridad reguladora nombró específicamente el rol de director general en el artículo 21", pl: "Ponieważ organ nadzoru wyraźnie wymienił rolę dyrektora generalnego w artykule 21" },
      ],
      correctIndex: 1,
      explanation: {
        en: "BSI Standard 200-1 Principle 6 names the management body's lead-by-example duty - a CEO who approved MFA but exempted their own login creates a personal audit finding.",
        de: "BSI-Standard 200-1 Grundsatz 6 benennt die Vorbildfunktion der Geschäftsleitung - ein CEO, der MFA genehmigt hat, aber seinen eigenen Login davon ausnimmt, erzeugt eine persönliche Audit-Feststellung.",
        nl: "BSI-standaard 200-1 Principe 6 benoemt de voorbeeldfunctie van het leidinggevend orgaan - een CEO die MFA heeft goedgekeurd maar zijn eigen login hiervan heeft vrijgesteld, creëert een persoonlijke auditbevinding.",
        fr: "Le BSI Standard 200-1 Principe 6 désigne le devoir d'exemplarité de l'organe de direction : un dirigeant qui a approuvé la MFA mais en a exempté son propre identifiant crée une constatation d'audit personnelle.",
        it: "Il BSI Standard 200-1 Principio 6 individua il dovere di esemplarità dell'organo di gestione: un amministratore delegato che ha approvato la MFA ma ne ha esentato il proprio accesso crea un rilievo di audit personale.",
        es: "El BSI Standard 200-1 Principio 6 designa el deber de liderazgo con el ejemplo del órgano de dirección: un director general que aprobó la MFA pero eximió su propio inicio de sesión crea un hallazgo de auditoría personal.",
        pl: "BSI Standard 200-1 Zasada 6 wskazuje obowiązek dawania przykładu przez organ zarządzający - dyrektor generalny, który zatwierdził MFA, ale zwolnił z niego własny login, tworzy osobiste ustalenie audytowe.",
      },
    },
  ],
});

export default quiz;
