import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const timingFields: ReadonlyArray<IncidentField> = [
  {
    id: "incidentOccurredAt",
    section: SECTION.TIMING,
    type: FIELD_TYPE.DATETIME,
    label: {
      en: "Incident occurrence (ISO-8601)",
      de: "Zeitpunkt des Vorfalls (ISO-8601)",
    },
    description: {
      en: "Earliest known time the incident occurred. May be 'unknown' if forensic timeline is incomplete.",
      de: "Frühester bekannter Zeitpunkt des Vorfalls. Kann unbekannt sein, wenn die forensische Aufarbeitung noch läuft.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (incident timeline)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Zeitlinie",
        portalFieldName: "Vorfallseintritt",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(a)",
        fieldReference: "When the breach occurred",
      },
    ],
  },
  {
    id: "incidentDetectedAt",
    section: SECTION.TIMING,
    type: FIELD_TYPE.DATETIME,
    label: {
      en: "Detection / awareness time (ISO-8601)",
      de: "Erkennung / Kenntnisnahme (ISO-8601)",
    },
    description: {
      en: "Time the entity became aware of the significant incident. Starts the 24h / 72h / 1m clocks under NIS 2 Art. 23(4).",
      de: "Zeitpunkt der Kenntniserlangung des erheblichen Sicherheitsvorfalls. Startet die 24h / 72h / 1m-Fristen nach Art. 23(4) NIS 2.",
    },
    requiredIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.FINAL,
    ],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Zeitlinie",
        portalFieldName: "Erkennung",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(1)",
        fieldReference:
          "Awareness — starts the 72h notification clock for personal-data breaches",
      },
    ],
  },
  {
    id: "incidentResolvedAt",
    section: SECTION.TIMING,
    type: FIELD_TYPE.DATETIME,
    label: {
      en: "Incident resolved (ISO-8601)",
      de: "Vorfall behoben (ISO-8601)",
    },
    description: {
      en: "Time the incident was contained and remediated. Required for the final report under NIS 2 Art. 23(4)(d).",
      de: "Zeitpunkt der Eindämmung und Behebung. Pflicht im Abschlussbericht nach Art. 23(4)(d) NIS 2.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.PROGRESS, REPORT_TYPE.INTERMEDIATE],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Zeitlinie",
        portalFieldName: "Aktuelle Statusmeldung",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
