import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.14",
  passingScore: 75,
  questions: [
    {
      id: "2.14.1",
      question: {
        en: "Why does Article 21(2)(i) bundle HR security, access control, and asset management in the same clause?",
        de: "Warum bündelt Artikel 21 Absatz 2(i) Personalsicherheit, Zugangskontrolle und Asset-Management in derselben Klausel?",
        nl: "Waarom bundelt Artikel 21(2)(i) HR-beveiliging, toegangscontrole en middelenbeheer in dezelfde clausule?",
      },
      options: [
        { en: "To reduce the total number of articles in the directive", de: "Um die Gesamtzahl der Artikel in der Richtlinie zu reduzieren", nl: "Om het totale aantal artikelen in de richtlijn te verminderen" },
        { en: "Because they are one system - a person who left and still has access is a failure of all three", de: "Weil sie ein System bilden - eine Person, die ausgeschieden ist und noch Zugang hat, ist ein Versagen aller drei", nl: "Omdat ze één systeem vormen - een persoon die vertrokken is maar nog steeds toegang heeft, is een falen van alle drie" },
        { en: "Because they are all the responsibility of the HR department", de: "Weil sie alle in der Verantwortung der Personalabteilung liegen", nl: "Omdat ze alle drie de verantwoordelijkheid zijn van de HR-afdeling" },
        { en: "Because they only apply to companies with more than 250 employees", de: "Weil sie nur für Unternehmen mit mehr als 250 Mitarbeitenden gelten", nl: "Omdat ze alleen van toepassing zijn op bedrijven met meer dan 250 werknemers" },
      ],
      correctIndex: 1,
      explanation: {
        en: "They are bundled because they only work as a system - when HR and IT do not talk, former employees keep access, which is a failure of all three duties.",
        de: "Sie sind gebündelt, weil sie nur als System funktionieren - wenn HR und IT nicht kommunizieren, behalten ehemalige Mitarbeitende ihren Zugang, was ein Versagen aller drei Pflichten darstellt.",
        nl: "Ze zijn gebundeld omdat ze alleen als systeem werken - wanneer HR en IT niet communiceren, behouden voormalige medewerkers toegang, wat een falen is van alle drie de plichten.",
      },
    },
    {
      id: "2.14.2",
      question: {
        en: "What is the single most common audit finding in Measure 9?",
        de: "Was ist die häufigste Audit-Feststellung bei Maßnahme 9?",
        nl: "Wat is de meest voorkomende auditbevinding bij Maatregel 9?",
      },
      options: [
        { en: "Missing asset inventory entries", de: "Fehlende Einträge im Asset-Inventar", nl: "Ontbrekende vermeldingen in het middelenregister" },
        { en: "The leaver step - former employees still holding active access", de: "Der Austrittsschritt - ehemalige Mitarbeitende mit noch aktivem Zugang", nl: "De vertrekstap - voormalige medewerkers die nog actieve toegang hebben" },
        { en: "Lack of role-based access control", de: "Fehlen einer rollenbasierten Zugangskontrolle", nl: "Ontbreken van op rollen gebaseerde toegangscontrole" },
        { en: "Incomplete onboarding documentation", de: "Unvollständige Onboarding-Dokumentation", nl: "Onvolledige onboardingdocumentatie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The leaver step is the most common finding - a former employee still holding a live VPN login or admin account weeks after departure.",
        de: "Der Austrittsschritt ist die häufigste Feststellung - ein ehemaliger Mitarbeitender, der Wochen nach dem Austritt noch einen aktiven VPN-Zugang oder Administratorkonto besitzt.",
        nl: "De vertrekstap is de meest voorkomende bevinding - een voormalige medewerker die weken na het vertrek nog een actieve VPN-login of beheerdersaccount heeft.",
      },
    },
    {
      id: "2.14.3",
      question: {
        en: "What does 'least privilege' mean?",
        de: "Was bedeutet 'Least Privilege'?",
        nl: "Wat betekent 'least privilege'?",
      },
      options: [
        { en: "Only the CEO has access to all systems", de: "Nur der CEO hat Zugang zu allen Systemen", nl: "Alleen de CEO heeft toegang tot alle systemen" },
        { en: "Every user has only the access they need for their job", de: "Jeder Benutzer hat nur den Zugang, den er für seine Arbeit benötigt", nl: "Elke gebruiker heeft alleen de toegang die hij voor zijn werk nodig heeft" },
        { en: "Access is granted on a first-come, first-served basis", de: "Zugang wird nach dem Prinzip 'wer zuerst kommt' vergeben", nl: "Toegang wordt verleend op basis van wie het eerst komt" },
        { en: "Only IT staff have any system access", de: "Nur IT-Mitarbeitende haben Systemzugang", nl: "Alleen IT-medewerkers hebben systeemtoegang" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Least privilege means every user has only the permissions they need for their job - no more, no less.",
        de: "Least Privilege bedeutet, dass jeder Benutzer nur die Berechtigungen hat, die er für seine Arbeit benötigt - nicht mehr und nicht weniger.",
        nl: "Least privilege betekent dat elke gebruiker alleen de rechten heeft die hij voor zijn werk nodig heeft - niet meer en niet minder.",
      },
    },
    {
      id: "2.14.4",
      question: {
        en: "What does the CIR (Annex 11.3) specifically require for privileged accounts?",
        de: "Was verlangt die CIR (Anhang 11.3) konkret für privilegierte Konten?",
        nl: "Wat vereist de CIR (Bijlage 11.3) specifiek voor geprivilegieerde accounts?",
      },
      options: [
        { en: "That they be eliminated entirely", de: "Dass sie vollständig abgeschafft werden", nl: "Dat ze volledig worden afgeschaft" },
        { en: "A dedicated policy with stronger controls and its own review cadence", de: "Eine eigene Richtlinie mit strengeren Maßnahmen und eigenem Überprüfungszyklus", nl: "Een specifiek beleid met sterkere maatregelen en een eigen beoordelingscyclus" },
        { en: "That they only be used by the CISO", de: "Dass sie nur vom CISO verwendet werden", nl: "Dat ze alleen door de CISO worden gebruikt" },
        { en: "That they be shared among the IT team for efficiency", de: "Dass sie aus Effizienzgründen im IT-Team geteilt werden", nl: "Dat ze worden gedeeld binnen het IT-team voor efficiëntie" },
      ],
      correctIndex: 1,
      explanation: {
        en: "CIR Annex 11.3 requires privileged accounts to have their own dedicated policy with stronger controls - it is one of the eleven required policies.",
        de: "CIR Anhang 11.3 verlangt, dass privilegierte Konten eine eigene Richtlinie mit strengeren Maßnahmen haben - sie ist eine der elf geforderten Richtlinien.",
        nl: "CIR Bijlage 11.3 vereist dat geprivilegieerde accounts een eigen specifiek beleid hebben met sterkere maatregelen - het is een van de elf vereiste beleidslijnen.",
      },
    },
  ],
});

export default quiz;
