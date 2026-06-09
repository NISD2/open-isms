import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const classificationFields: ReadonlyArray<IncidentField> = [
  {
    id: "reportingReason",
    section: SECTION.CLASSIFICATION,
    type: FIELD_TYPE.ENUM,
    options: [
      {
        value: "significantIncident",
        label: {
          en: "Significant incident (Art. 23(3) NIS 2)",
          de: "Erheblicher Sicherheitsvorfall (§ 32 BSIG)",
        },
      },
      {
        value: "incident",
        label: {
          en: "Incident (voluntary or national-law-mandated)",
          de: "Sicherheitsvorfall (freiwillig oder national)",
        },
      },
      {
        value: "nearMiss",
        label: {
          en: "Near-miss (voluntary)",
          de: "Beinahevorfall (freiwillig)",
        },
      },
    ],
    label: {
      en: "Reporting reason",
      de: "Meldegrund",
    },
    description: {
      en: "The category under which this notification is submitted. NIS 2 Art. 23(3) mandates reporting only of significant incidents; near-miss and non-significant incident reporting is voluntary under Art. 30 NIS 2.",
      de: "Kategorie der Meldung. Pflichtmeldung nur für erhebliche Sicherheitsvorfälle nach Art. 23(3) NIS 2; Beinahevorfälle und nicht erhebliche Sicherheitsvorfälle sind freiwillig nach Art. 30 NIS 2.",
    },
    requiredIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.FINAL,
    ],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(3)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "NIS 2 Art. 30",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Vorfallsklassifikation",
        portalFieldName: "Meldegrund",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "severityLevel",
    section: SECTION.CLASSIFICATION,
    type: FIELD_TYPE.ENUM,
    options: [
      { value: "low", label: { en: "Low", de: "Niedrig" } },
      { value: "medium", label: { en: "Medium", de: "Mittel" } },
      { value: "high", label: { en: "High", de: "Hoch" } },
      { value: "critical", label: { en: "Critical", de: "Kritisch" } },
    ],
    label: {
      en: "Severity level",
      de: "Schweregrad",
    },
    description: {
      en: "Initial assessment of incident severity. NIS 2 Art. 23(4)(b) requires the incident notification (72h) to contain an initial assessment of severity and impact. CIR 2024/2690 quantifies significance thresholds for the digital-service-provider categories it covers.",
      de: "Erstbewertung des Schweregrades. Art. 23(4)(b) NIS 2 verlangt zur 72h-Meldung eine Erstbewertung von Schwere und Auswirkungen. CIR 2024/2690 quantifiziert die Schwellen für die dort erfassten Anbieter digitaler Dienste.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(b)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "CIR 2024/2690",
        url: "https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Vorfallsklassifikation",
        portalFieldName: "Lageeinschätzung",
        notes:
          "BSI Meldeportal uses a coloured situation indicator (red/orange/yellow/grey). Map: red=critical, orange=high, yellow=medium, grey=resolved/low.",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "DORA Art. 19(1)",
        fieldReference: "Major ICT-related incident classification",
      },
    ],
  },
];
