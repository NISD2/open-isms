import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const timingFields: ReadonlyArray<IncidentField> = [
  {
    id: "incidentOccurredAt",
    section: SECTION.TIMING,
    type: FIELD_TYPE.DATETIME,
    label: {
      en: "Incident occurrence (ISO-8601)",
      de: "Zeitpunkt des Vorfalls (ISO-8601)",
      fr: "Survenance de l'incident (ISO-8601)",
      it: "Verificarsi dell'incidente (ISO-8601)",
      es: "Ocurrencia del incidente (ISO-8601)",
      pl: "Wystąpienie incydentu (ISO-8601)",
      cs: "Výskyt incidentu (ISO-8601)",
      pt: "Ocorrência do incidente (ISO-8601)",
      ro: "Producerea incidentului (ISO-8601)",
    },
    description: {
      en: "Earliest known time the incident occurred. May be 'unknown' if forensic timeline is incomplete.",
      de: "Frühester bekannter Zeitpunkt des Vorfalls. Kann unbekannt sein, wenn die forensische Aufarbeitung noch läuft.",
      fr: "Heure connue la plus ancienne à laquelle l'incident s'est produit. Peut être 'inconnue' si la chronologie forensique est incomplète.",
      it: "Primo orario noto in cui si è verificato l'incidente. Può essere 'sconosciuto' se la cronologia forense è incompleta.",
      es: "Hora conocida más temprana en que se produjo el incidente. Puede ser 'desconocida' si la cronología forense está incompleta.",
      pl: "Najwcześniejszy znany czas wystąpienia incydentu. Może być 'nieznany', jeśli analiza kryminalistyczna jest niekompletna.",
      cs: "Nejdříve známý čas, kdy k incidentu došlo. Může být 'neznámý', pokud je forenzní časová osa neúplná.",
      pt: "Hora conhecida mais antiga em que o incidente ocorreu. Pode ser 'desconhecida' se a cronologia forense estiver incompleta.",
      ro: "Cel mai timpuriu moment cunoscut în care s-a produs incidentul. Poate fi 'necunoscut' dacă cronologia criminalistică este incompletă.",
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
      fr: "Heure de détection / de prise de connaissance (ISO-8601)",
      it: "Ora di rilevamento / di presa di conoscenza (ISO-8601)",
      es: "Hora de detección / de conocimiento (ISO-8601)",
      pl: "Czas wykrycia / powzięcia wiedzy (ISO-8601)",
      cs: "Čas zjištění / nabytí vědomosti (ISO-8601)",
      pt: "Hora de deteção / de tomada de conhecimento (ISO-8601)",
      ro: "Ora detectării / luării la cunoștință (ISO-8601)",
    },
    description: {
      en: "Time the entity became aware of the significant incident. Starts the 24h / 72h / 1m clocks under NIS 2 Art. 23(4).",
      de: "Zeitpunkt der Kenntniserlangung des erheblichen Sicherheitsvorfalls. Startet die 24h / 72h / 1m-Fristen nach Art. 23(4) NIS 2.",
      fr: "Heure à laquelle l'entité a eu connaissance de l'incident important. Déclenche les délais de 24h / 72h / 1m au titre de l'art. 23(4) NIS 2.",
      it: "Ora in cui il soggetto è venuto a conoscenza dell'incidente significativo. Avvia i termini di 24h / 72h / 1m ai sensi dell'art. 23(4) NIS 2.",
      es: "Hora en que la entidad tuvo conocimiento del incidente significativo. Inicia los plazos de 24h / 72h / 1m conforme al art. 23(4) NIS 2.",
      pl: "Czas, w którym podmiot powziął wiedzę o poważnym incydencie. Rozpoczyna bieg terminów 24h / 72h / 1m zgodnie z art. 23(4) NIS 2.",
      cs: "Čas, kdy se subjekt dozvěděl o významném incidentu. Spouští lhůty 24h / 72h / 1m podle čl. 23(4) NIS 2.",
      pt: "Hora em que a entidade tomou conhecimento do incidente significativo. Inicia os prazos de 24h / 72h / 1m ao abrigo do art. 23(4) NIS 2.",
      ro: "Ora la care entitatea a luat cunoștință de incidentul semnificativ. Declanșează termenele de 24h / 72h / 1m în temeiul art. 23(4) NIS 2.",
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
      fr: "Incident résolu (ISO-8601)",
      it: "Incidente risolto (ISO-8601)",
      es: "Incidente resuelto (ISO-8601)",
      pl: "Incydent rozwiązany (ISO-8601)",
      cs: "Incident vyřešen (ISO-8601)",
      pt: "Incidente resolvido (ISO-8601)",
      ro: "Incident rezolvat (ISO-8601)",
    },
    description: {
      en: "Time the incident was contained and remediated. Required for the final report under NIS 2 Art. 23(4)(d).",
      de: "Zeitpunkt der Eindämmung und Behebung. Pflicht im Abschlussbericht nach Art. 23(4)(d) NIS 2.",
      fr: "Heure à laquelle l'incident a été circonscrit et corrigé. Requis pour le rapport final au titre de l'art. 23(4)(d) NIS 2.",
      it: "Ora in cui l'incidente è stato contenuto e risolto. Richiesto per la relazione finale ai sensi dell'art. 23(4)(d) NIS 2.",
      es: "Hora en que el incidente fue contenido y subsanado. Obligatorio para el informe final conforme al art. 23(4)(d) NIS 2.",
      pl: "Czas, w którym incydent został opanowany i usunięty. Wymagane w sprawozdaniu końcowym zgodnie z art. 23(4)(d) NIS 2.",
      cs: "Čas, kdy byl incident zvládnut a napraven. Vyžadováno v závěrečné zprávě podle čl. 23(4)(d) NIS 2.",
      pt: "Hora em que o incidente foi contido e corrigido. Exigido no relatório final ao abrigo do art. 23(4)(d) NIS 2.",
      ro: "Ora la care incidentul a fost limitat și remediat. Obligatoriu în raportul final în temeiul art. 23(4)(d) NIS 2.",
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
