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
          fr: "Incident important (art. 23(3) NIS2)",
          it: "Incidente significativo (art. 23(3) NIS2)",
          es: "Incidente significativo (art. 23(3) NIS2)",
          pl: "Poważny incydent (art. 23(3) NIS2)",
        },
      },
      {
        value: "incident",
        label: {
          en: "Incident (voluntary or national-law-mandated)",
          de: "Sicherheitsvorfall (freiwillig oder national)",
          fr: "Incident (volontaire ou imposé par le droit national)",
          it: "Incidente (volontario o imposto dal diritto nazionale)",
          es: "Incidente (voluntario o exigido por la legislación nacional)",
          pl: "Incydent (dobrowolny lub wymagany przez prawo krajowe)",
        },
      },
      {
        value: "nearMiss",
        label: {
          en: "Near-miss (voluntary)",
          de: "Beinahevorfall (freiwillig)",
          fr: "Quasi-incident (volontaire)",
          it: "Quasi-incidente (volontario)",
          es: "Cuasi-incidente (voluntario)",
          pl: "Zdarzenie potencjalnie wypadkowe (dobrowolne)",
        },
      },
    ],
    label: {
      en: "Reporting reason",
      de: "Meldegrund",
      fr: "Motif de la notification",
      it: "Motivo della notifica",
      es: "Motivo de la notificación",
      pl: "Powód zgłoszenia",
    },
    description: {
      en: "The category under which this notification is submitted. NIS 2 Art. 23(3) mandates reporting only of significant incidents; near-miss and non-significant incident reporting is voluntary under Art. 30 NIS 2.",
      de: "Kategorie der Meldung. Pflichtmeldung nur für erhebliche Sicherheitsvorfälle nach Art. 23(3) NIS 2; Beinahevorfälle und nicht erhebliche Sicherheitsvorfälle sind freiwillig nach Art. 30 NIS 2.",
      fr: "Catégorie au titre de laquelle cette notification est soumise. L'art. 23(3) NIS2 n'impose la notification que des incidents importants ; la notification des quasi-incidents et des incidents non importants est volontaire au titre de l'art. 30 NIS2.",
      it: "Categoria sotto la quale viene presentata la presente notifica. L'art. 23(3) NIS2 impone la notifica solo degli incidenti significativi; la notifica dei quasi-incidenti e degli incidenti non significativi è volontaria ai sensi dell'art. 30 NIS2.",
      es: "Categoría bajo la cual se presenta esta notificación. El art. 23(3) NIS2 solo obliga a notificar los incidentes significativos; la notificación de cuasi-incidentes y de incidentes no significativos es voluntaria conforme al art. 30 NIS2.",
      pl: "Kategoria, w ramach której składane jest niniejsze zgłoszenie. Art. 23(3) NIS2 nakłada obowiązek zgłaszania wyłącznie poważnych incydentów; zgłaszanie zdarzeń potencjalnie wypadkowych oraz incydentów niemających charakteru poważnego jest dobrowolne na podstawie art. 30 NIS2.",
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
      { value: "low", label: { en: "Low", de: "Niedrig", fr: "Faible", it: "Basso", es: "Bajo", pl: "Niski" } },
      { value: "medium", label: { en: "Medium", de: "Mittel", fr: "Moyen", it: "Medio", es: "Medio", pl: "Średni" } },
      { value: "high", label: { en: "High", de: "Hoch", fr: "Élevé", it: "Alto", es: "Alto", pl: "Wysoki" } },
      { value: "critical", label: { en: "Critical", de: "Kritisch", fr: "Critique", it: "Critico", es: "Crítico", pl: "Krytyczny" } },
    ],
    label: {
      en: "Severity level",
      de: "Schweregrad",
      fr: "Niveau de gravité",
      it: "Livello di gravità",
      es: "Nivel de gravedad",
      pl: "Poziom dotkliwości",
    },
    description: {
      en: "Initial assessment of incident severity. NIS 2 Art. 23(4)(b) requires the incident notification (72h) to contain an initial assessment of severity and impact. CIR 2024/2690 quantifies significance thresholds for the digital-service-provider categories it covers.",
      de: "Erstbewertung des Schweregrades. Art. 23(4)(b) NIS 2 verlangt zur 72h-Meldung eine Erstbewertung von Schwere und Auswirkungen. CIR 2024/2690 quantifiziert die Schwellen für die dort erfassten Anbieter digitaler Dienste.",
      fr: "Évaluation initiale de la gravité de l'incident. L'art. 23(4)(b) NIS2 exige que la notification d'incident (72h) contienne une évaluation initiale de la gravité et de l'impact. Le CIR 2024/2690 quantifie les seuils d'importance pour les catégories de fournisseurs de services numériques qu'il couvre.",
      it: "Valutazione iniziale della gravità dell'incidente. L'art. 23(4)(b) NIS2 richiede che la notifica dell'incidente (72h) contenga una valutazione iniziale della gravità e dell'impatto. Il CIR 2024/2690 quantifica le soglie di significatività per le categorie di fornitori di servizi digitali da esso disciplinate.",
      es: "Evaluación inicial de la gravedad del incidente. El art. 23(4)(b) NIS2 exige que la notificación del incidente (72h) contenga una evaluación inicial de la gravedad y el impacto. El CIR 2024/2690 cuantifica los umbrales de significatividad para las categorías de proveedores de servicios digitales que abarca.",
      pl: "Wstępna ocena dotkliwości incydentu. Art. 23(4)(b) NIS2 wymaga, aby zgłoszenie incydentu (72h) zawierało wstępną ocenę dotkliwości i skutków. CIR 2024/2690 określa ilościowo progi istotności dla objętych nim kategorii dostawców usług cyfrowych.",
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
