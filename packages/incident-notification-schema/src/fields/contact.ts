import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const contactFields: ReadonlyArray<IncidentField> = [
  {
    id: "reporterName",
    section: SECTION.REPORTER_CONTACT,
    type: FIELD_TYPE.STRING,
    label: {
      en: "Reporter name",
      de: "Name des Melders",
      fr: "Nom du déclarant",
      it: "Nome del segnalante",
      es: "Nombre del notificante",
      pl: "Imię i nazwisko zgłaszającego",
    },
    description: {
      en: "Name of the natural person submitting the notification on behalf of the entity. Required by all national portals so the CSIRT can follow up.",
      de: "Name der natürlichen Person, die die Meldung im Namen der Einrichtung übermittelt. Pflicht in allen nationalen Portalen für CSIRT-Rückfragen.",
      fr: "Nom de la personne physique soumettant la notification au nom de l'entité. Exigé par tous les portails nationaux afin que le CSIRT puisse assurer le suivi.",
      it: "Nome della persona fisica che presenta la notifica per conto del soggetto. Richiesto da tutti i portali nazionali affinché il CSIRT possa effettuare il seguito.",
      es: "Nombre de la persona física que presenta la notificación en nombre de la entidad. Exigido por todos los portales nacionales para que el CSIRT pueda dar seguimiento.",
      pl: "Imię i nazwisko osoby fizycznej składającej zgłoszenie w imieniu podmiotu. Wymagane przez wszystkie portale krajowe, aby CSIRT mógł podjąć dalsze działania.",
    },
    requiredIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.FINAL,
    ],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (notification logistics)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Melder-Kontakt",
        portalFieldName: "Name",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(b)",
        fieldReference: "Name and contact details of the DPO or contact point",
      },
    ],
  },
  {
    id: "reporterEmail",
    section: SECTION.REPORTER_CONTACT,
    type: FIELD_TYPE.EMAIL,
    label: {
      en: "Reporter email",
      de: "E-Mail des Melders",
      fr: "Adresse e-mail du déclarant",
      it: "E-mail del segnalante",
      es: "Correo electrónico del notificante",
      pl: "Adres e-mail zgłaszającego",
    },
    description: {
      en: "Email address the CSIRT can use to reach the reporter for follow-up questions, intermediate-report requests, and feedback delivery under NIS 2 Art. 23(5).",
      de: "E-Mail-Adresse für CSIRT-Rückfragen, Zwischenberichts-Anfragen und Feedback-Mitteilungen nach Art. 23(5) NIS 2.",
      fr: "Adresse e-mail permettant au CSIRT de joindre le déclarant pour les questions de suivi, les demandes de rapport intermédiaire et la transmission du retour d'information au titre de l'art. 23(5) NIS2.",
      it: "Indirizzo e-mail che il CSIRT può utilizzare per contattare il segnalante per domande di seguito, richieste di relazione intermedia e trasmissione del riscontro ai sensi dell'art. 23(5) NIS2.",
      es: "Dirección de correo electrónico que el CSIRT puede utilizar para contactar al notificante para preguntas de seguimiento, solicitudes de informe intermedio y entrega de comentarios conforme al art. 23(5) NIS2.",
      pl: "Adres e-mail, którego CSIRT może użyć do skontaktowania się ze zgłaszającym w sprawie pytań uzupełniających, wniosków o sprawozdanie okresowe oraz przekazania informacji zwrotnej na podstawie art. 23(5) NIS2.",
    },
    requiredIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.FINAL,
    ],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(5)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Melder-Kontakt",
        portalFieldName: "E-Mail",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(b)",
        fieldReference: "Contact details",
      },
    ],
  },
  {
    id: "reporterPhone",
    section: SECTION.REPORTER_CONTACT,
    type: FIELD_TYPE.PHONE,
    label: {
      en: "Reporter phone",
      de: "Telefon des Melders",
      fr: "Téléphone du déclarant",
      it: "Telefono del segnalante",
      es: "Teléfono del notificante",
      pl: "Telefon zgłaszającego",
    },
    description: {
      en: "Phone number for urgent CSIRT contact, especially during the early-warning window when email may be slow.",
      de: "Telefonnummer für dringende CSIRT-Kontaktaufnahme, insbesondere während des Frühwarnzeitfensters.",
      fr: "Numéro de téléphone pour un contact urgent avec le CSIRT, en particulier pendant la fenêtre d'alerte précoce où l'e-mail peut être lent.",
      it: "Numero di telefono per un contatto urgente con il CSIRT, in particolare durante la finestra di preallerta in cui l'e-mail potrebbe essere lenta.",
      es: "Número de teléfono para el contacto urgente con el CSIRT, especialmente durante la ventana de alerta temprana, cuando el correo electrónico puede ser lento.",
      pl: "Numer telefonu do pilnego kontaktu z CSIRT, w szczególności w oknie wczesnego ostrzegania, gdy poczta e-mail może działać wolno.",
    },
    requiredIn: [],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
      REPORT_TYPE.FINAL,
    ],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (notification logistics)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Melder-Kontakt",
        portalFieldName: "Telefon",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "internalCaseReference",
    section: SECTION.REPORTER_CONTACT,
    type: FIELD_TYPE.STRING,
    label: {
      en: "Internal case reference",
      de: "Internes Aktenzeichen",
      fr: "Référence de dossier interne",
      it: "Riferimento interno del caso",
      es: "Referencia interna del caso",
      pl: "Wewnętrzny numer referencyjny sprawy",
    },
    description: {
      en: "The entity's own internal incident reference number. Lets the CSIRT correlate multiple submissions about the same incident.",
      de: "Internes Aktenzeichen der Einrichtung. Ermöglicht dem CSIRT die Korrelation mehrerer Meldungen zum gleichen Vorfall.",
      fr: "Numéro de référence interne de l'incident propre à l'entité. Permet au CSIRT de corréler plusieurs soumissions relatives au même incident.",
      it: "Numero di riferimento interno dell'incidente proprio del soggetto. Consente al CSIRT di correlare più invii relativi al medesimo incidente.",
      es: "Número de referencia interno del incidente propio de la entidad. Permite al CSIRT correlacionar varias presentaciones sobre el mismo incidente.",
      pl: "Wewnętrzny numer referencyjny incydentu należący do podmiotu. Umożliwia CSIRT skorelowanie wielu zgłoszeń dotyczących tego samego incydentu.",
    },
    requiredIn: [],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
      REPORT_TYPE.FINAL,
    ],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (notification logistics)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Internes Aktenzeichen",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
