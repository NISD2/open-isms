import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const descriptionFields: ReadonlyArray<IncidentField> = [
  {
    id: "incidentSummary",
    section: SECTION.DESCRIPTION,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Short incident summary",
      de: "Kurzbeschreibung des Vorfalls",
      fr: "Résumé bref de l'incident",
      it: "Breve sintesi dell'incidente",
      es: "Resumen breve del incidente",
      pl: "Krótkie podsumowanie incydentu",
    },
    description: {
      en: "Plain-language summary of what happened. NIS 2 Art. 23(4)(a) requires the early warning to indicate whether the significant incident is suspected of being unlawful or malicious — this field carries that initial narrative.",
      de: "Verständliche Zusammenfassung des Vorfalls. Art. 23(4)(a) NIS 2 verlangt die frühe Warnung mit Hinweis darauf, ob der erhebliche Sicherheitsvorfall vermutlich rechtswidrig oder böswillig ist.",
      fr: "Résumé en langage clair de ce qui s'est produit. L'art. 23(4)(a) NIS2 exige que l'alerte précoce indique si l'on soupçonne que l'incident important est de nature illicite ou malveillante : ce champ porte ce récit initial.",
      it: "Sintesi in linguaggio chiaro dell'accaduto. L'art. 23(4)(a) NIS2 richiede che il preallarme indichi se si sospetta che l'incidente significativo sia di natura illecita o dolosa: questo campo contiene tale descrizione iniziale.",
      es: "Resumen en lenguaje claro de lo ocurrido. El art. 23(4)(a) NIS2 exige que la alerta temprana indique si se sospecha que el incidente significativo es de naturaleza ilícita o malintencionada: este campo recoge ese relato inicial.",
      pl: "Podsumowanie zdarzenia sformułowane prostym językiem. Art. 23(4)(a) NIS2 wymaga, aby wczesne ostrzeżenie wskazywało, czy istnieje podejrzenie, że poważny incydent ma charakter bezprawny lub złośliwy: to pole zawiera ten wstępny opis.",
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
      fr: "Description détaillée de l'incident",
      it: "Descrizione dettagliata dell'incidente",
      es: "Descripción detallada del incidente",
      pl: "Szczegółowy opis incydentu",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(d): the final report shall contain 'a detailed description of the incident, including its severity and impact'. This field accumulates findings across the reporting cycle.",
      de: "Wortlaut Art. 23(4)(d) NIS 2: Der Abschlussbericht muss eine ausführliche Beschreibung des Sicherheitsvorfalls einschließlich seiner Schwere und seiner Auswirkungen enthalten.",
      fr: "Conformément au libellé de l'art. 23(4)(d) NIS2 : le rapport final contient 'une description détaillée de l'incident, y compris sa gravité et son impact'. Ce champ accumule les constatations tout au long du cycle de notification.",
      it: "Conformemente al testo dell'art. 23(4)(d) NIS2: la relazione finale contiene 'una descrizione dettagliata dell'incidente, compresi la sua gravità e il suo impatto'. Questo campo raccoglie le risultanze lungo l'intero ciclo di notifica.",
      es: "Conforme al texto literal del art. 23(4)(d) NIS2: el informe final contendrá 'una descripción detallada del incidente, incluida su gravedad e impacto'. Este campo acumula las conclusiones a lo largo del ciclo de notificación.",
      pl: "Zgodnie z brzmieniem art. 23(4)(d) NIS2: raport końcowy zawiera 'szczegółowy opis incydentu, w tym jego dotkliwość i skutki'. To pole gromadzi ustalenia w całym cyklu sprawozdawczym.",
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
      { value: "suspected", label: { en: "Suspected", de: "Vermutet", fr: "Soupçonné", it: "Sospetto", es: "Sospechado", pl: "Podejrzewane" } },
      { value: "confirmed", label: { en: "Confirmed", de: "Bestätigt", fr: "Confirmé", it: "Confermato", es: "Confirmado", pl: "Potwierdzone" } },
      { value: "ruledOut", label: { en: "Ruled out", de: "Ausgeschlossen", fr: "Écarté", it: "Escluso", es: "Descartado", pl: "Wykluczone" } },
      { value: "unknown", label: { en: "Unknown", de: "Unbekannt", fr: "Inconnu", it: "Sconosciuto", es: "Desconocido", pl: "Nieznane" } },
    ],
    label: {
      en: "Suspected unlawful or malicious cause",
      de: "Vermutet rechtswidrig oder böswillig",
      fr: "Cause illicite ou malveillante soupçonnée",
      it: "Sospetta causa illecita o dolosa",
      es: "Causa ilícita o malintencionada sospechada",
      pl: "Podejrzewana przyczyna bezprawna lub złośliwa",
    },
    description: {
      en: "NIS 2 Art. 23(4)(a) requires the 24-hour early warning to indicate whether the significant incident is suspected of being caused by unlawful or malicious acts.",
      de: "Art. 23(4)(a) NIS 2 verlangt im 24h-Frühwarnbericht die Angabe, ob der erhebliche Sicherheitsvorfall vermutlich durch rechtswidrige oder böswillige Handlungen verursacht wurde.",
      fr: "L'art. 23(4)(a) NIS2 exige que l'alerte précoce des 24 heures indique si l'on soupçonne que l'incident important a été causé par des actes illicites ou malveillants.",
      it: "L'art. 23(4)(a) NIS2 richiede che il preallarme entro 24 ore indichi se si sospetta che l'incidente significativo sia stato causato da atti illeciti o dolosi.",
      es: "El art. 23(4)(a) NIS2 exige que la alerta temprana de 24 horas indique si se sospecha que el incidente significativo ha sido causado por actos ilícitos o malintencionados.",
      pl: "Art. 23(4)(a) NIS2 wymaga, aby wczesne ostrzeżenie w ciągu 24 godzin wskazywało, czy istnieje podejrzenie, że poważny incydent został spowodowany przez działania bezprawne lub złośliwe.",
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
