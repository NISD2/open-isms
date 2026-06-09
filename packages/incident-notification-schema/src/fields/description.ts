import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const descriptionFields: ReadonlyArray<IncidentField> = [
  {
    id: "incidentSummary",
    section: SECTION.DESCRIPTION,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Short incident summary",
      de: "Kurzbeschreibung des Vorfalls",
    },
    description: {
      en: "Plain-language summary of what happened. NIS 2 Art. 23(4)(a) requires the early warning to indicate whether the significant incident is suspected of being unlawful or malicious — this field carries that initial narrative.",
      de: "Verständliche Zusammenfassung des Vorfalls. Art. 23(4)(a) NIS 2 verlangt die frühe Warnung mit Hinweis darauf, ob der erhebliche Sicherheitsvorfall vermutlich rechtswidrig oder böswillig ist.",
    },
    requiredIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.FINAL,
    ],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(a)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Vorfallsbeschreibung",
        portalFieldName: "Störungsbeschreibung",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(a)",
        fieldReference: "Nature of the personal data breach",
      },
    ],
  },
  {
    id: "detailedDescription",
    section: SECTION.DESCRIPTION,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Detailed incident description",
      de: "Detaillierte Vorfallsbeschreibung",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(d): the final report shall contain 'a detailed description of the incident, including its severity and impact'. This field accumulates findings across the reporting cycle.",
      de: "Wortlaut Art. 23(4)(d) NIS 2: Der Abschlussbericht muss eine ausführliche Beschreibung des Sicherheitsvorfalls einschließlich seiner Schwere und seiner Auswirkungen enthalten.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(i)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Vorfallsbeschreibung",
        portalFieldName: "Detaillierte Vorfallsbeschreibung",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "suspectedUnlawfulOrMalicious",
    section: SECTION.DESCRIPTION,
    type: FIELD_TYPE.ENUM,
    options: [
      { value: "suspected", label: { en: "Suspected", de: "Vermutet" } },
      { value: "confirmed", label: { en: "Confirmed", de: "Bestätigt" } },
      { value: "ruledOut", label: { en: "Ruled out", de: "Ausgeschlossen" } },
      { value: "unknown", label: { en: "Unknown", de: "Unbekannt" } },
    ],
    label: {
      en: "Suspected unlawful or malicious cause",
      de: "Vermutet rechtswidrig oder böswillig",
    },
    description: {
      en: "NIS 2 Art. 23(4)(a) requires the 24-hour early warning to indicate whether the significant incident is suspected of being caused by unlawful or malicious acts.",
      de: "Art. 23(4)(a) NIS 2 verlangt im 24h-Frühwarnbericht die Angabe, ob der erhebliche Sicherheitsvorfall vermutlich durch rechtswidrige oder böswillige Handlungen verursacht wurde.",
    },
    requiredIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.FINAL,
    ],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(a)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Ursache",
        portalFieldName: "Vermutung böswilliger Handlung",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
