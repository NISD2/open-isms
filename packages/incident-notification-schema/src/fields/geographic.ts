import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const geographicFields: ReadonlyArray<IncidentField> = [
  {
    id: "hasCrossBorderImpact",
    section: SECTION.CROSS_BORDER,
    type: FIELD_TYPE.BOOLEAN,
    label: {
      en: "Cross-border impact (yes / no)",
      de: "Grenzüberschreitende Auswirkung (ja / nein)",
    },
    description: {
      en: "NIS 2 Art. 23(4)(a) requires the early warning to indicate whether the significant incident has a cross-border impact. CSIRTs of other affected Member States are notified via the cooperation mechanism in NIS 2 Art. 15.",
      de: "Art. 23(4)(a) NIS 2 verlangt im 24h-Frühwarnbericht die Angabe, ob der Sicherheitsvorfall grenzüberschreitende Auswirkungen hat. Die CSIRTs anderer Mitgliedstaaten werden über den Kooperationsmechanismus nach Art. 15 NIS 2 informiert.",
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
      {
        citation: "NIS 2 Art. 23(4)(d)(iv)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Geografische & Sektorale Verbreitung",
        portalFieldName: "Grenzüberschreitende Auswirkung",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(c)",
        fieldReference: "Likely consequences of the personal data breach",
      },
    ],
  },
  {
    id: "affectedCountries",
    section: SECTION.CROSS_BORDER,
    type: FIELD_TYPE.COUNTRY_LIST,
    label: {
      en: "Affected Member States (ISO 3166-1 alpha-2)",
      de: "Betroffene Mitgliedstaaten (ISO 3166-1 alpha-2)",
    },
    description: {
      en: "List of EU Member States whose entities, users, or services are affected by the incident. Used by the CSIRT to notify peer authorities.",
      de: "Liste der EU-Mitgliedstaaten, deren Unternehmen, Nutzer oder Dienste vom Vorfall betroffen sind. Wird vom CSIRT zur Information der zuständigen Behörden anderer Staaten verwendet.",
    },
    requiredIn: [],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
      REPORT_TYPE.FINAL,
    ],
    appliesIf: {
      reportingReasons: ["significantIncident"],
    },
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(a)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "NIS 2 Art. 15 (Cooperation Group)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Geografische & Sektorale Verbreitung",
        portalFieldName: "Geografische Verbreitung",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "affectedSectors",
    section: SECTION.GEOGRAPHIC_SECTORAL,
    type: FIELD_TYPE.MULTI_ENUM,
    options: [
      { value: "energy", label: { en: "Energy", de: "Energie" } },
      { value: "transport", label: { en: "Transport", de: "Verkehr" } },
      { value: "banking", label: { en: "Banking", de: "Bankwesen" } },
      {
        value: "financialMarket",
        label: {
          en: "Financial market infrastructure",
          de: "Finanzmarktinfrastruktur",
        },
      },
      { value: "health", label: { en: "Health", de: "Gesundheit" } },
      {
        value: "drinkingWater",
        label: { en: "Drinking water", de: "Trinkwasser" },
      },
      { value: "wastewater", label: { en: "Wastewater", de: "Abwasser" } },
      {
        value: "digitalInfrastructure",
        label: { en: "Digital infrastructure", de: "Digitale Infrastruktur" },
      },
      {
        value: "ictServiceManagement",
        label: { en: "ICT service management (B2B)", de: "IKT-Dienstemanagement (B2B)" },
      },
      {
        value: "publicAdministration",
        label: { en: "Public administration", de: "Öffentliche Verwaltung" },
      },
      { value: "space", label: { en: "Space", de: "Raumfahrt" } },
      { value: "post", label: { en: "Postal services", de: "Post" } },
      { value: "waste", label: { en: "Waste management", de: "Abfallwirtschaft" } },
      {
        value: "chemicals",
        label: { en: "Chemicals", de: "Chemikalien" },
      },
      { value: "food", label: { en: "Food", de: "Lebensmittel" } },
      {
        value: "manufacturing",
        label: { en: "Manufacturing", de: "Verarbeitendes Gewerbe" },
      },
      {
        value: "digitalProviders",
        label: { en: "Digital providers", de: "Anbieter digitaler Dienste" },
      },
      { value: "research", label: { en: "Research", de: "Forschung" } },
    ],
    label: {
      en: "Affected NIS 2 sectors (Annex I and II)",
      de: "Betroffene NIS 2 Sektoren (Anhang I und II)",
    },
    description: {
      en: "Sectors affected by the incident, mapping to NIS 2 Annex I (sectors of high criticality) and Annex II (other critical sectors). Sectoral CSIRTs may need to be notified.",
      de: "Vom Vorfall betroffene Sektoren nach Anhang I (Sektoren mit hoher Kritikalität) und Anhang II (sonstige kritische Sektoren) NIS 2. Ggf. müssen sektorale CSIRTs informiert werden.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [
      REPORT_TYPE.EARLY_WARNING,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Annex I",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "NIS 2 Annex II",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Geografische & Sektorale Verbreitung",
        portalFieldName: "Betroffene Sektoren",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
