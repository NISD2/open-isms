import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const contactFields: ReadonlyArray<IncidentField> = [
  {
    id: "reporterName",
    section: SECTION.REPORTER_CONTACT,
    type: FIELD_TYPE.STRING,
    label: {
      en: "Reporter name",
      de: "Name des Melders",
    },
    description: {
      en: "Name of the natural person submitting the notification on behalf of the entity. Required by all national portals so the CSIRT can follow up.",
      de: "Name der natürlichen Person, die die Meldung im Namen der Einrichtung übermittelt. Pflicht in allen nationalen Portalen für CSIRT-Rückfragen.",
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
    },
    description: {
      en: "Email address the CSIRT can use to reach the reporter for follow-up questions, intermediate-report requests, and feedback delivery under NIS 2 Art. 23(5).",
      de: "E-Mail-Adresse für CSIRT-Rückfragen, Zwischenberichts-Anfragen und Feedback-Mitteilungen nach Art. 23(5) NIS 2.",
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
    },
    description: {
      en: "Phone number for urgent CSIRT contact, especially during the early-warning window when email may be slow.",
      de: "Telefonnummer für dringende CSIRT-Kontaktaufnahme, insbesondere während des Frühwarnzeitfensters.",
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
    },
    description: {
      en: "The entity's own internal incident reference number. Lets the CSIRT correlate multiple submissions about the same incident.",
      de: "Internes Aktenzeichen der Einrichtung. Ermöglicht dem CSIRT die Korrelation mehrerer Meldungen zum gleichen Vorfall.",
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
