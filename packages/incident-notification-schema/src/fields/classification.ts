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
          cs: "Významný incident (čl. 23(3) NIS 2)",
          pt: "Incidente significativo (art. 23(3) NIS 2)",
          ro: "Incident semnificativ (art. 23(3) NIS 2)",
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
          cs: "Incident (dobrovolně nebo na základě vnitrostátního práva)",
          pt: "Incidente (voluntário ou imposto pela legislação nacional)",
          ro: "Incident (voluntar sau impus de legislația națională)",
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
          cs: "Skoronehoda (dobrovolně)",
          pt: "Quase-incidente (voluntário)",
          ro: "Cvasiincident (voluntar)",
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
      cs: "Důvod hlášení",
      pt: "Motivo da notificação",
      ro: "Motivul notificării",
    },
    description: {
      en: "The category under which this notification is submitted. NIS 2 Art. 23(3) mandates reporting only of significant incidents; near-miss and non-significant incident reporting is voluntary under Art. 30 NIS 2.",
      de: "Kategorie der Meldung. Pflichtmeldung nur für erhebliche Sicherheitsvorfälle nach Art. 23(3) NIS 2; Beinahevorfälle und nicht erhebliche Sicherheitsvorfälle sind freiwillig nach Art. 30 NIS 2.",
      fr: "Catégorie au titre de laquelle cette notification est soumise. L'art. 23(3) NIS2 n'impose la notification que des incidents importants ; la notification des quasi-incidents et des incidents non importants est volontaire au titre de l'art. 30 NIS2.",
      it: "Categoria sotto la quale viene presentata la presente notifica. L'art. 23(3) NIS2 impone la notifica solo degli incidenti significativi; la notifica dei quasi-incidenti e degli incidenti non significativi è volontaria ai sensi dell'art. 30 NIS2.",
      es: "Categoría bajo la cual se presenta esta notificación. El art. 23(3) NIS2 solo obliga a notificar los incidentes significativos; la notificación de cuasi-incidentes y de incidentes no significativos es voluntaria conforme al art. 30 NIS2.",
      pl: "Kategoria, w ramach której składane jest niniejsze zgłoszenie. Art. 23(3) NIS2 nakłada obowiązek zgłaszania wyłącznie poważnych incydentów; zgłaszanie zdarzeń potencjalnie wypadkowych oraz incydentów niemających charakteru poważnego jest dobrowolne na podstawie art. 30 NIS2.",
      cs: "Kategorie, v jejímž rámci se toto hlášení podává. Čl. 23(3) NIS 2 ukládá povinnost hlásit pouze významné incidenty; hlášení skoronehod a incidentů, které nemají významný charakter, je dobrovolné podle čl. 30 NIS 2.",
      pt: "Categoria ao abrigo da qual esta notificação é apresentada. O art. 23(3) NIS 2 só impõe a notificação dos incidentes significativos; a notificação de quase-incidentes e de incidentes não significativos é voluntária ao abrigo do art. 30 NIS 2.",
      ro: "Categoria în temeiul căreia se transmite această notificare. Art. 23(3) NIS 2 impune notificarea numai a incidentelor semnificative; notificarea cvasiincidentelor și a incidentelor fără caracter semnificativ este voluntară în temeiul art. 30 NIS 2.",
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
      { value: "low", label: { en: "Low", de: "Niedrig", fr: "Faible", it: "Basso", es: "Bajo", pl: "Niski", cs: "Nízká", pt: "Baixo", ro: "Scăzut" } },
      { value: "medium", label: { en: "Medium", de: "Mittel", fr: "Moyen", it: "Medio", es: "Medio", pl: "Średni", cs: "Střední", pt: "Médio", ro: "Mediu" } },
      { value: "high", label: { en: "High", de: "Hoch", fr: "Élevé", it: "Alto", es: "Alto", pl: "Wysoki", cs: "Vysoká", pt: "Alto", ro: "Ridicat" } },
      { value: "critical", label: { en: "Critical", de: "Kritisch", fr: "Critique", it: "Critico", es: "Crítico", pl: "Krytyczny", cs: "Kritická", pt: "Crítico", ro: "Critic" } },
    ],
    label: {
      en: "Severity level",
      de: "Schweregrad",
      fr: "Niveau de gravité",
      it: "Livello di gravità",
      es: "Nivel de gravedad",
      pl: "Poziom dotkliwości",
      cs: "Úroveň závažnosti",
      pt: "Nível de gravidade",
      ro: "Nivel de gravitate",
    },
    description: {
      en: "Initial assessment of incident severity. NIS 2 Art. 23(4)(b) requires the incident notification (72h) to contain an initial assessment of severity and impact. CIR 2024/2690 quantifies significance thresholds for the digital-service-provider categories it covers.",
      de: "Erstbewertung des Schweregrades. Art. 23(4)(b) NIS 2 verlangt zur 72h-Meldung eine Erstbewertung von Schwere und Auswirkungen. CIR 2024/2690 quantifiziert die Schwellen für die dort erfassten Anbieter digitaler Dienste.",
      fr: "Évaluation initiale de la gravité de l'incident. L'art. 23(4)(b) NIS2 exige que la notification d'incident (72h) contienne une évaluation initiale de la gravité et de l'impact. Le CIR 2024/2690 quantifie les seuils d'importance pour les catégories de fournisseurs de services numériques qu'il couvre.",
      it: "Valutazione iniziale della gravità dell'incidente. L'art. 23(4)(b) NIS2 richiede che la notifica dell'incidente (72h) contenga una valutazione iniziale della gravità e dell'impatto. Il CIR 2024/2690 quantifica le soglie di significatività per le categorie di fornitori di servizi digitali da esso disciplinate.",
      es: "Evaluación inicial de la gravedad del incidente. El art. 23(4)(b) NIS2 exige que la notificación del incidente (72h) contenga una evaluación inicial de la gravedad y el impacto. El CIR 2024/2690 cuantifica los umbrales de significatividad para las categorías de proveedores de servicios digitales que abarca.",
      pl: "Wstępna ocena dotkliwości incydentu. Art. 23(4)(b) NIS2 wymaga, aby zgłoszenie incydentu (72h) zawierało wstępną ocenę dotkliwości i skutków. CIR 2024/2690 określa ilościowo progi istotności dla objętych nim kategorii dostawców usług cyfrowych.",
      cs: "Počáteční posouzení závažnosti incidentu. Čl. 23(4)(b) NIS 2 vyžaduje, aby oznámení incidentu (72h) obsahovalo počáteční posouzení závažnosti a dopadu. CIR 2024/2690 kvantifikuje prahové hodnoty významnosti pro kategorie poskytovatelů digitálních služeb, na něž se vztahuje.",
      pt: "Avaliação inicial da gravidade do incidente. O art. 23(4)(b) NIS 2 exige que a notificação do incidente (72h) contenha uma avaliação inicial da gravidade e do impacto. O CIR 2024/2690 quantifica os limiares de significância para as categorias de prestadores de serviços digitais que abrange.",
      ro: "Evaluare inițială a gravității incidentului. Art. 23(4)(b) NIS 2 impune ca notificarea incidentului (72h) să conțină o evaluare inițială a gravității și a impactului. CIR 2024/2690 cuantifică pragurile de semnificație pentru categoriile de furnizori de servicii digitale pe care le acoperă.",
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
