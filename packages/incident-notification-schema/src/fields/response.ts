import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const responseFields: ReadonlyArray<IncidentField> = [
  {
    id: "containmentMeasuresTaken",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Containment measures taken",
      de: "Eingedämmte Maßnahmen",
    },
    description: {
      en: "Technical, organisational, and operational measures already taken to contain the incident. Required for the incident notification (72h) and updated in subsequent reports.",
      de: "Bereits ergriffene technische, organisatorische und operative Maßnahmen zur Eindämmung des Vorfalls. Pflicht zur Folgemeldung (72h) und Fortschreibung in späteren Berichten.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(iii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Technische / organisatorische Maßnahmen",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(d)",
        fieldReference:
          "Measures taken or proposed to mitigate possible adverse effects",
      },
    ],
  },
  {
    id: "appliedAndOngoingMitigation",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Applied and ongoing mitigation",
      de: "Angewandte und laufende Schadensbegrenzung",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(d)(iii): the final report shall describe 'applied and ongoing mitigation measures'.",
      de: "Wortlaut Art. 23(4)(d)(iii) NIS 2: Der Abschlussbericht muss die angewandten und laufenden Schadensbegrenzungsmaßnahmen beschreiben.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.PROGRESS, REPORT_TYPE.INTERMEDIATE],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(iii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Angewandte und laufende Maßnahmen",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "detectionMethod",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.MULTI_ENUM,
    options: [
      { value: "siem", label: { en: "SIEM / log alert", de: "SIEM / Log-Alarm" } },
      { value: "edr", label: { en: "EDR / endpoint", de: "EDR / Endgeräte" } },
      { value: "userReport", label: { en: "User report", de: "Nutzermeldung" } },
      { value: "supplierAlert", label: { en: "Supplier alert", de: "Lieferantenmeldung" } },
      { value: "csirtAdvisory", label: { en: "CSIRT advisory", de: "CSIRT-Hinweis" } },
      { value: "externalParty", label: { en: "External party", de: "Externe Stelle" } },
      { value: "internalAudit", label: { en: "Internal audit / monitoring", de: "Internes Audit / Monitoring" } },
      { value: "other", label: { en: "Other", de: "Sonstiges" } },
    ],
    label: {
      en: "Detection method",
      de: "Erkennungsmethode",
    },
    description: {
      en: "How the incident was first detected. Used by CSIRTs to identify systemic detection gaps across the sector.",
      de: "Wie der Vorfall erstmals erkannt wurde. Wird vom CSIRT verwendet, um systemische Detektionslücken sektorweit zu identifizieren.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (detection)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Erkennungsmethode",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "preventiveMeasuresPlanned",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Preventive measures planned",
      de: "Geplante Präventivmaßnahmen",
    },
    description: {
      en: "Measures planned to prevent recurrence. Carries the 'lessons learned' loop required by ENISA TIG for the final report.",
      de: "Maßnahmen zur Vermeidung von Wiederholungsfällen. Trägt die in der ENISA TIG für den Abschlussbericht geforderte Lessons-learned-Schleife.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.PROGRESS, REPORT_TYPE.INTERMEDIATE],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(iii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "ENISA TIG v1.0 §5 (post-incident review)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Vorfalls-Korrelationen",
        portalFieldName: "Zukünftige Präventionsmaßnahmen",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
