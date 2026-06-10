import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "1.4",
  passingScore: 75,
  questions: [
    {
      id: "1.4.1",
      question: {
        en: "How long does a company have to register with the national regulator after becoming covered by NIS2?",
        de: "Wie lange hat ein Unternehmen Zeit, sich nach Eintritt in den Anwendungsbereich von NIS2 bei der nationalen Aufsichtsbehörde zu registrieren?",
        nl: "Hoeveel tijd heeft een bedrijf om zich te registreren bij de nationale toezichthouder nadat het onder NIS2 valt?",
      },
      options: [
        { en: "One month", de: "Einen Monat", nl: "Één maand" },
        { en: "Three months", de: "Drei Monate", nl: "Drie maanden" },
        { en: "Six months", de: "Sechs Monate", nl: "Zes maanden" },
        { en: "One year", de: "Ein Jahr", nl: "Één jaar" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 27 requires registration within three months of becoming subject to NIS2.",
        de: "Artikel 27 verlangt die Registrierung innerhalb von drei Monaten nach Eintritt in den Anwendungsbereich von NIS2.",
        nl: "Artikel 27 vereist registratie binnen drie maanden na het van toepassing worden van NIS2.",
      },
    },
    {
      id: "1.4.2",
      question: {
        en: "Is missing or incorrect registration treated as a violation even without a cyber incident?",
        de: "Wird eine fehlende oder fehlerhafte Registrierung auch ohne Cybervorfall als Verstoß behandelt?",
        nl: "Wordt een ontbrekende of onjuiste registratie behandeld als een overtreding, zelfs zonder een cyberincident?",
      },
      options: [
        { en: "No, a violation requires a cyber incident to have occurred", de: "Nein, ein Verstoß setzt einen Cybervorfall voraus", nl: "Nee, een overtreding vereist dat er een cyberincident heeft plaatsgevonden" },
        { en: "Yes, it is a separate violation sanctioned under Article 32, independent of any incident", de: "Ja, es handelt sich um einen eigenständigen Verstoß nach Artikel 32, unabhängig von einem Vorfall", nl: "Ja, het is een afzonderlijke overtreding die wordt gesanctioneerd op grond van Artikel 32, onafhankelijk van enig incident" },
        { en: "Only if the regulator has already audited the company", de: "Nur wenn die Aufsichtsbehörde das Unternehmen bereits geprüft hat", nl: "Alleen als de toezichthouder het bedrijf al heeft gecontroleerd" },
        { en: "Only for Essential entities", de: "Nur für wesentliche Einrichtungen", nl: "Alleen voor essentiële entiteiten" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Late or incorrect registration is sanctioned separately under Article 32 and does not require a cyber incident to trigger it.",
        de: "Verspätete oder fehlerhafte Registrierung wird nach Artikel 32 eigenständig sanktioniert und erfordert keinen Cybervorfall als Auslöser.",
        nl: "Te late of onjuiste registratie wordt afzonderlijk gesanctioneerd op grond van Artikel 32 en vereist geen cyberincident als aanleiding.",
      },
    },
    {
      id: "1.4.3",
      question: {
        en: "What specific contact detail must be included in the NIS2 registration?",
        de: "Welche spezifische Kontaktangabe muss in der NIS2-Registrierung enthalten sein?",
        nl: "Welk specifiek contactgegeven moet zijn opgenomen in de NIS2-registratie?",
      },
      options: [
        { en: "The CEO's personal mobile number", de: "Die persönliche Mobilnummer des Geschäftsführers", nl: "Het persoonlijke mobiele nummer van de CEO" },
        { en: "A twenty-four-seven incident contact", de: "Ein rund um die Uhr erreichbarer Kontakt für Sicherheitsvorfälle", nl: "Een vierentwintig-zeven incidentcontact" },
        { en: "The company's general email address", de: "Die allgemeine E-Mail-Adresse des Unternehmens", nl: "Het algemene e-mailadres van het bedrijf" },
        { en: "The CISO's LinkedIn profile", de: "Das LinkedIn-Profil des CISO", nl: "Het LinkedIn-profiel van de CISO" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The registration must include a twenty-four-seven incident contact, among other details.",
        de: "Die Registrierung muss unter anderem einen rund um die Uhr erreichbaren Kontakt für Sicherheitsvorfälle enthalten.",
        nl: "De registratie moet onder andere een vierentwintig-zeven incidentcontact bevatten.",
      },
    },
    {
      id: "1.4.4",
      question: {
        en: "As of March 2026, approximately how many of the estimated 29,500 in-scope German companies had registered?",
        de: "Wie viele der geschätzten 29.500 betroffenen deutschen Unternehmen hatten sich bis März 2026 ungefähr registriert?",
        nl: "Hoeveel van de geschatte 29.500 in aanmerking komende Duitse bedrijven hadden zich per maart 2026 geregistreerd?",
      },
      options: [
        { en: "About 5,000", de: "Etwa 5.000", nl: "Ongeveer 5.000" },
        { en: "About 11,500", de: "Etwa 11.500", nl: "Ongeveer 11.500" },
        { en: "About 20,000", de: "Etwa 20.000", nl: "Ongeveer 20.000" },
        { en: "About 29,000", de: "Etwa 29.000", nl: "Ongeveer 29.000" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Roughly eleven thousand five hundred of an estimated twenty-nine thousand five hundred in-scope German companies had registered by March 2026.",
        de: "Etwa 11.500 der geschätzten 29.500 betroffenen deutschen Unternehmen hatten sich bis März 2026 registriert.",
        nl: "Ongeveer elfduizend vijfhonderd van de geschatte negenentwintigduizend vijfhonderd in aanmerking komende Duitse bedrijven hadden zich per maart 2026 geregistreerd.",
      },
    },
  ],
});

export default quiz;
