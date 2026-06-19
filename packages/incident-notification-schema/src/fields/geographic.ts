import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const geographicFields: ReadonlyArray<IncidentField> = [
  {
    id: "hasCrossBorderImpact",
    section: SECTION.CROSS_BORDER,
    type: FIELD_TYPE.BOOLEAN,
    label: {
      en: "Cross-border impact (yes / no)",
      de: "Grenzüberschreitende Auswirkung (ja / nein)",
      fr: "Impact transfrontalier (oui / non)",
      it: "Impatto transfrontaliero (sì / no)",
      es: "Impacto transfronterizo (sí / no)",
      pl: "Wpływ transgraniczny (tak / nie)",
    },
    description: {
      en: "NIS 2 Art. 23(4)(a) requires the early warning to indicate whether the significant incident has a cross-border impact. CSIRTs of other affected Member States are notified via the cooperation mechanism in NIS 2 Art. 15.",
      de: "Art. 23(4)(a) NIS 2 verlangt im 24h-Frühwarnbericht die Angabe, ob der Sicherheitsvorfall grenzüberschreitende Auswirkungen hat. Die CSIRTs anderer Mitgliedstaaten werden über den Kooperationsmechanismus nach Art. 15 NIS 2 informiert.",
      fr: "L'art. 23(4)(a) NIS 2 exige que l'alerte précoce indique si l'incident important a un impact transfrontalier. Les CSIRT des autres États membres concernés sont informés via le mécanisme de coopération prévu à l'art. 15 NIS 2.",
      it: "L'art. 23(4)(a) NIS 2 richiede che il preallarme indichi se l'incidente significativo ha un impatto transfrontaliero. I CSIRT degli altri Stati membri interessati sono informati tramite il meccanismo di cooperazione di cui all'art. 15 NIS 2.",
      es: "El art. 23(4)(a) NIS 2 exige que la alerta temprana indique si el incidente significativo tiene un impacto transfronterizo. Los CSIRT de los demás Estados miembros afectados son informados a través del mecanismo de cooperación del art. 15 NIS 2.",
      pl: "Art. 23(4)(a) NIS 2 wymaga, aby wczesne ostrzeżenie wskazywało, czy poważny incydent ma wpływ transgraniczny. CSIRT innych zainteresowanych państw członkowskich są informowane za pośrednictwem mechanizmu współpracy określonego w art. 15 NIS 2.",
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
      fr: "États membres affectés (ISO 3166-1 alpha-2)",
      it: "Stati membri interessati (ISO 3166-1 alpha-2)",
      es: "Estados miembros afectados (ISO 3166-1 alpha-2)",
      pl: "Państwa członkowskie, których dotyczy incydent (ISO 3166-1 alpha-2)",
    },
    description: {
      en: "List of EU Member States whose entities, users, or services are affected by the incident. Used by the CSIRT to notify peer authorities.",
      de: "Liste der EU-Mitgliedstaaten, deren Unternehmen, Nutzer oder Dienste vom Vorfall betroffen sind. Wird vom CSIRT zur Information der zuständigen Behörden anderer Staaten verwendet.",
      fr: "Liste des États membres de l'UE dont les entités, les utilisateurs ou les services sont affectés par l'incident. Utilisée par le CSIRT pour informer les autorités homologues.",
      it: "Elenco degli Stati membri dell'UE i cui soggetti, utenti o servizi sono interessati dall'incidente. Utilizzato dal CSIRT per informare le autorità omologhe.",
      es: "Lista de los Estados miembros de la UE cuyas entidades, usuarios o servicios se ven afectados por el incidente. Utilizada por el CSIRT para informar a las autoridades homólogas.",
      pl: "Wykaz państw członkowskich UE, których podmioty, użytkownicy lub usługi są dotknięte incydentem. Wykorzystywany przez CSIRT do informowania właściwych organów innych państw.",
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
      {
        value: "energy",
        label: {
          en: "Energy",
          de: "Energie",
          fr: "Énergie",
          it: "Energia",
          es: "Energía",
          pl: "Energetyka",
        },
      },
      {
        value: "transport",
        label: {
          en: "Transport",
          de: "Verkehr",
          fr: "Transports",
          it: "Trasporti",
          es: "Transporte",
          pl: "Transport",
        },
      },
      {
        value: "banking",
        label: {
          en: "Banking",
          de: "Bankwesen",
          fr: "Secteur bancaire",
          it: "Settore bancario",
          es: "Sector bancario",
          pl: "Bankowość",
        },
      },
      {
        value: "financialMarket",
        label: {
          en: "Financial market infrastructure",
          de: "Finanzmarktinfrastruktur",
          fr: "Infrastructures des marchés financiers",
          it: "Infrastrutture dei mercati finanziari",
          es: "Infraestructuras de los mercados financieros",
          pl: "Infrastruktura rynków finansowych",
        },
      },
      {
        value: "health",
        label: {
          en: "Health",
          de: "Gesundheit",
          fr: "Santé",
          it: "Sanità",
          es: "Salud",
          pl: "Zdrowie",
        },
      },
      {
        value: "drinkingWater",
        label: {
          en: "Drinking water",
          de: "Trinkwasser",
          fr: "Eau potable",
          it: "Acqua potabile",
          es: "Agua potable",
          pl: "Woda pitna",
        },
      },
      {
        value: "wastewater",
        label: {
          en: "Wastewater",
          de: "Abwasser",
          fr: "Eaux usées",
          it: "Acque reflue",
          es: "Aguas residuales",
          pl: "Ścieki",
        },
      },
      {
        value: "digitalInfrastructure",
        label: {
          en: "Digital infrastructure",
          de: "Digitale Infrastruktur",
          fr: "Infrastructure numérique",
          it: "Infrastruttura digitale",
          es: "Infraestructura digital",
          pl: "Infrastruktura cyfrowa",
        },
      },
      {
        value: "ictServiceManagement",
        label: {
          en: "ICT service management (B2B)",
          de: "IKT-Dienstemanagement (B2B)",
          fr: "Gestion des services TIC (B2B)",
          it: "Gestione dei servizi TIC (B2B)",
          es: "Gestión de servicios TIC (B2B)",
          pl: "Zarządzanie usługami ICT (B2B)",
        },
      },
      {
        value: "publicAdministration",
        label: {
          en: "Public administration",
          de: "Öffentliche Verwaltung",
          fr: "Administration publique",
          it: "Pubblica amministrazione",
          es: "Administración pública",
          pl: "Administracja publiczna",
        },
      },
      {
        value: "space",
        label: {
          en: "Space",
          de: "Raumfahrt",
          fr: "Espace",
          it: "Spazio",
          es: "Espacio",
          pl: "Przestrzeń kosmiczna",
        },
      },
      {
        value: "post",
        label: {
          en: "Postal services",
          de: "Post",
          fr: "Services postaux",
          it: "Servizi postali",
          es: "Servicios postales",
          pl: "Usługi pocztowe",
        },
      },
      {
        value: "waste",
        label: {
          en: "Waste management",
          de: "Abfallwirtschaft",
          fr: "Gestion des déchets",
          it: "Gestione dei rifiuti",
          es: "Gestión de residuos",
          pl: "Gospodarowanie odpadami",
        },
      },
      {
        value: "chemicals",
        label: {
          en: "Chemicals",
          de: "Chemikalien",
          fr: "Produits chimiques",
          it: "Sostanze chimiche",
          es: "Productos químicos",
          pl: "Chemikalia",
        },
      },
      {
        value: "food",
        label: {
          en: "Food",
          de: "Lebensmittel",
          fr: "Denrées alimentaires",
          it: "Prodotti alimentari",
          es: "Alimentos",
          pl: "Żywność",
        },
      },
      {
        value: "manufacturing",
        label: {
          en: "Manufacturing",
          de: "Verarbeitendes Gewerbe",
          fr: "Fabrication",
          it: "Fabbricazione",
          es: "Fabricación",
          pl: "Produkcja",
        },
      },
      {
        value: "digitalProviders",
        label: {
          en: "Digital providers",
          de: "Anbieter digitaler Dienste",
          fr: "Fournisseurs de services numériques",
          it: "Fornitori di servizi digitali",
          es: "Proveedores de servicios digitales",
          pl: "Dostawcy usług cyfrowych",
        },
      },
      {
        value: "research",
        label: {
          en: "Research",
          de: "Forschung",
          fr: "Recherche",
          it: "Ricerca",
          es: "Investigación",
          pl: "Badania naukowe",
        },
      },
    ],
    label: {
      en: "Affected NIS 2 sectors (Annex I and II)",
      de: "Betroffene NIS 2 Sektoren (Anhang I und II)",
      fr: "Secteurs NIS 2 affectés (annexes I et II)",
      it: "Settori NIS 2 interessati (allegati I e II)",
      es: "Sectores NIS 2 afectados (anexos I y II)",
      pl: "Sektory NIS 2, których dotyczy incydent (załączniki I i II)",
    },
    description: {
      en: "Sectors affected by the incident, mapping to NIS 2 Annex I (sectors of high criticality) and Annex II (other critical sectors). Sectoral CSIRTs may need to be notified.",
      de: "Vom Vorfall betroffene Sektoren nach Anhang I (Sektoren mit hoher Kritikalität) und Anhang II (sonstige kritische Sektoren) NIS 2. Ggf. müssen sektorale CSIRTs informiert werden.",
      fr: "Secteurs affectés par l'incident, correspondant à l'annexe I NIS 2 (secteurs hautement critiques) et à l'annexe II (autres secteurs critiques). Les CSIRT sectoriels peuvent devoir être informés.",
      it: "Settori interessati dall'incidente, corrispondenti all'allegato I NIS 2 (settori ad alta criticità) e all'allegato II (altri settori critici). Potrebbe essere necessario informare i CSIRT settoriali.",
      es: "Sectores afectados por el incidente, correspondientes al anexo I NIS 2 (sectores de alta criticidad) y al anexo II (otros sectores críticos). Puede ser necesario informar a los CSIRT sectoriales.",
      pl: "Sektory dotknięte incydentem, odpowiadające załącznikowi I NIS 2 (sektory o wysokiej krytyczności) i załącznikowi II (inne sektory krytyczne). Może być konieczne poinformowanie sektorowych CSIRT.",
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
