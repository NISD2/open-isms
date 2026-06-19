import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const impactFields: ReadonlyArray<IncidentField> = [
  {
    id: "affectedUsersCount",
    section: SECTION.IMPACT,
    type: FIELD_TYPE.INTEGER,
    label: {
      en: "Affected users (estimate)",
      de: "Betroffene Nutzer (geschätzt)",
      fr: "Utilisateurs affectés (estimation)",
      it: "Utenti interessati (stima)",
      es: "Usuarios afectados (estimación)",
      pl: "Dotknięci użytkownicy (szacunek)",
    },
    description: {
      en: "Estimated count of affected users. CIR 2024/2690 quantifies thresholds for the digital-service-provider categories it covers; for other entities the assessment is qualitative per NIS 2 Art. 6(6) and Art. 23(3).",
      de: "Geschätzte Anzahl betroffener Nutzer. CIR 2024/2690 quantifiziert Schwellen für die dort erfassten Anbieter digitaler Dienste; sonst ist die Einschätzung qualitativ nach Art. 6 Nr. 6 und Art. 23(3) NIS 2.",
      fr: "Nombre estimé d'utilisateurs affectés. CIR 2024/2690 quantifie des seuils pour les catégories de fournisseurs de services numériques qu'il couvre ; pour les autres entités, l'évaluation est qualitative au titre de l'art. 6(6) et de l'art. 23(3) NIS 2.",
      it: "Numero stimato di utenti interessati. CIR 2024/2690 quantifica le soglie per le categorie di fornitori di servizi digitali che disciplina; per gli altri soggetti la valutazione è qualitativa ai sensi dell'art. 6(6) e dell'art. 23(3) NIS 2.",
      es: "Número estimado de usuarios afectados. CIR 2024/2690 cuantifica umbrales para las categorías de proveedores de servicios digitales que regula; para las demás entidades la evaluación es cualitativa conforme al art. 6(6) y al art. 23(3) NIS 2.",
      pl: "Szacowana liczba dotkniętych użytkowników. CIR 2024/2690 określa ilościowo progi dla objętych nim kategorii dostawców usług cyfrowych; dla pozostałych podmiotów ocena ma charakter jakościowy zgodnie z art. 6(6) i art. 23(3) NIS 2.",
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
      fr: "Description de la perturbation de service",
      it: "Descrizione dell'interruzione del servizio",
      es: "Descripción de la interrupción del servicio",
      pl: "Opis zakłócenia usługi",
    },
    description: {
      en: "Narrative of which services (operational, customer-facing, internal) were degraded or unavailable and for how long. NIS 2 Art. 6(6) makes service-disruption a defining criterion of a 'significant incident'.",
      de: "Beschreibung, welche Dienste (Betrieb, kundenseitig, intern) beeinträchtigt oder nicht verfügbar waren und wie lange. Art. 6 Nr. 6 NIS 2 macht die Dienststörung zum Definitionskriterium des erheblichen Sicherheitsvorfalls.",
      fr: "Description des services (opérationnels, destinés aux clients, internes) qui ont été dégradés ou indisponibles et pendant combien de temps. L'art. 6(6) NIS 2 fait de la perturbation de service un critère définissant un 'incident important'.",
      it: "Descrizione di quali servizi (operativi, rivolti ai clienti, interni) sono stati degradati o non disponibili e per quanto tempo. L'art. 6(6) NIS 2 rende l'interruzione del servizio un criterio che definisce un 'incidente significativo'.",
      es: "Descripción de qué servicios (operativos, de cara al cliente, internos) se vieron degradados o no disponibles y durante cuánto tiempo. El art. 6(6) NIS 2 convierte la interrupción del servicio en un criterio que define un 'incidente significativo'.",
      pl: "Opis tego, które usługi (operacyjne, skierowane do klientów, wewnętrzne) zostały pogorszone lub niedostępne i przez jak długi czas. Art. 6(6) NIS 2 czyni zakłócenie usługi kryterium definiującym 'poważny incydent'.",
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
      fr: "Dommage financier estimé (EUR)",
      it: "Danno finanziario stimato (EUR)",
      es: "Daño financiero estimado (EUR)",
      pl: "Szacowana szkoda finansowa (EUR)",
    },
    description: {
      en: "Estimated direct and indirect financial damage. NIS 2 Art. 6(6) includes financial loss among the criteria that elevate an incident to 'significant'.",
      de: "Geschätzter unmittelbarer und mittelbarer finanzieller Schaden. Art. 6 Nr. 6 NIS 2 zählt den finanziellen Verlust zu den Kriterien, die einen Vorfall als 'erheblich' qualifizieren.",
      fr: "Dommage financier direct et indirect estimé. L'art. 6(6) NIS 2 inclut la perte financière parmi les critères qui élèvent un incident au rang d''important'.",
      it: "Danno finanziario diretto e indiretto stimato. L'art. 6(6) NIS 2 include la perdita finanziaria tra i criteri che elevano un incidente a 'significativo'.",
      es: "Daño financiero directo e indirecto estimado. El art. 6(6) NIS 2 incluye la pérdida financiera entre los criterios que elevan un incidente a 'significativo'.",
      pl: "Szacowana bezpośrednia i pośrednia szkoda finansowa. Art. 6(6) NIS 2 zalicza stratę finansową do kryteriów, które kwalifikują incydent jako 'poważny'.",
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
      fr: "Atteinte à la réputation (oui / non)",
      it: "Danno reputazionale (sì / no)",
      es: "Daño reputacional (sí / no)",
      pl: "Szkoda reputacyjna (tak / nie)",
    },
    description: {
      en: "Whether the entity assesses that the incident has caused or is likely to cause reputational harm. One of the qualifying criteria for a 'significant incident' under NIS 2 Art. 6(6).",
      de: "Einschätzung, ob der Vorfall zu Reputationsschäden geführt hat oder wahrscheinlich führen wird. Eines der Qualifizierungskriterien für einen 'erheblichen Sicherheitsvorfall' nach Art. 6 Nr. 6 NIS 2.",
      fr: "Évaluation par l'entité selon laquelle l'incident a causé ou est susceptible de causer une atteinte à la réputation. L'un des critères qualifiant un 'incident important' au titre de l'art. 6(6) NIS 2.",
      it: "Valutazione del soggetto in merito al fatto che l'incidente abbia causato o sia probabile che causi un danno reputazionale. Uno dei criteri che qualificano un 'incidente significativo' ai sensi dell'art. 6(6) NIS 2.",
      es: "Evaluación de la entidad sobre si el incidente ha causado o es probable que cause un daño reputacional. Uno de los criterios que califican un 'incidente significativo' conforme al art. 6(6) NIS 2.",
      pl: "Ocena podmiotu, czy incydent spowodował lub może spowodować szkodę reputacyjną. Jedno z kryteriów kwalifikujących 'poważny incydent' zgodnie z art. 6(6) NIS 2.",
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
