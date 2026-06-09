import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const impactFields: ReadonlyArray<IncidentField> = [
  {
    id: "affectedUsersCount",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.INTEGER,
    label: {
      en: "Affected users (estimate)",
      de: "Betroffene Nutzer (geschätzt)",
    },
    description: {
      en: "Estimated count of affected users. CIR 2024/2690 quantifies thresholds for the digital-service-provider categories it covers; for other entities the assessment is qualitative per NIS 2 Art. 6(6) and Art. 23(3).",
      de: "Geschätzte Anzahl betroffener Nutzer. CIR 2024/2690 quantifiziert Schwellen für die dort erfassten Anbieter digitaler Dienste; sonst ist die Einschätzung qualitativ nach Art. 6 Nr. 6 und Art. 23(3) NIS 2.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 6(6)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "CIR 2024/2690 (where applicable)",
        url: "https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Betroffene Nutzer (geschätzt)",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(a)",
        fieldReference:
          "Approximate number of data subjects concerned",
      },
    ],
  },
  {
    id: "serviceDisruptionDescription",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Service disruption description",
      de: "Beschreibung der Servicestörung",
    },
    description: {
      en: "Narrative of which services (operational, customer-facing, internal) were degraded or unavailable and for how long. NIS 2 Art. 6(6) makes service-disruption a defining criterion of a 'significant incident'.",
      de: "Beschreibung, welche Dienste (Betrieb, kundenseitig, intern) beeinträchtigt oder nicht verfügbar waren und wie lange. Art. 6 Nr. 6 NIS 2 macht die Dienststörung zum Definitionskriterium des erheblichen Sicherheitsvorfalls.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 6(6)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Beschreibung der Dienstausfälle",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "DORA Art. 19(4)",
        fieldReference: "Functional impact and operational unavailability",
      },
    ],
  },
  {
    id: "estimatedFinancialDamage",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.DECIMAL,
    label: {
      en: "Estimated financial damage (EUR)",
      de: "Geschätzter finanzieller Schaden (EUR)",
    },
    description: {
      en: "Estimated direct and indirect financial damage. NIS 2 Art. 6(6) includes financial loss among the criteria that elevate an incident to 'significant'.",
      de: "Geschätzter unmittelbarer und mittelbarer finanzieller Schaden. Art. 6 Nr. 6 NIS 2 zählt den finanziellen Verlust zu den Kriterien, die einen Vorfall als 'erheblich' qualifizieren.",
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
        citation: "NIS 2 Art. 6(6)(b)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Finanzieller Schaden (geschätzt)",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "DORA Art. 19(4)",
        fieldReference: "Economic impact",
      },
    ],
  },
  {
    id: "hasReputationalHarm",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.BOOLEAN,
    label: {
      en: "Reputational harm (yes / no)",
      de: "Reputationsschaden (ja / nein)",
    },
    description: {
      en: "Whether the entity assesses that the incident has caused or is likely to cause reputational harm. One of the qualifying criteria for a 'significant incident' under NIS 2 Art. 6(6).",
      de: "Einschätzung, ob der Vorfall zu Reputationsschäden geführt hat oder wahrscheinlich führen wird. Eines der Qualifizierungskriterien für einen 'erheblichen Sicherheitsvorfall' nach Art. 6 Nr. 6 NIS 2.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 6(6)(b)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Servicestörung",
        portalFieldName: "Reputationsschaden",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
