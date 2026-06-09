import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const causationFields: ReadonlyArray<IncidentField> = [
  {
    id: "rootCauseType",
    section: SECTION.CAUSATION,
    type: FIELD_TYPE.ENUM,
    options: [
      { value: "malware", label: { en: "Malware", de: "Schadsoftware" } },
      { value: "ransomware", label: { en: "Ransomware", de: "Ransomware" } },
      { value: "phishing", label: { en: "Phishing / social engineering", de: "Phishing / Social Engineering" } },
      { value: "ddos", label: { en: "DDoS / DoS", de: "DDoS / DoS" } },
      { value: "exploit", label: { en: "Vulnerability exploitation", de: "Schwachstellenausnutzung" } },
      { value: "insiderAction", label: { en: "Insider action", de: "Insiderhandlung" } },
      { value: "supplyChainCompromise", label: { en: "Supply-chain compromise", de: "Lieferkettenkompromittierung" } },
      { value: "configurationError", label: { en: "Misconfiguration", de: "Fehlkonfiguration" } },
      { value: "physicalIncident", label: { en: "Physical / environmental incident", de: "Physischer / Umweltvorfall" } },
      { value: "humanError", label: { en: "Human error", de: "Menschliches Versagen" } },
      { value: "unknown", label: { en: "Unknown", de: "Unbekannt" } },
    ],
    label: {
      en: "Root-cause type",
      de: "Ursachentyp",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(d)(ii): the final report shall indicate 'the type of threat or root cause that is likely to have triggered the incident'.",
      de: "Wortlaut Art. 23(4)(d)(ii) NIS 2: Der Abschlussbericht muss die Art der Bedrohung oder die wahrscheinliche Grundursache des Vorfalls angeben.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(ii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Ursache",
        portalFieldName: "Primärursache",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "DORA Art. 19(4)",
        fieldReference: "Type and nature of the incident",
      },
    ],
  },
  {
    id: "rootCauseDetail",
    section: SECTION.CAUSATION,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Root-cause analysis (narrative)",
      de: "Wurzelursachenanalyse (Beschreibung)",
    },
    description: {
      en: "Narrative analysis backing the root-cause classification. Where the analysis is incomplete, indicate the best-supported theory and the evidence behind it.",
      de: "Schriftliche Analyse zur Untermauerung der Ursachenklassifikation. Wo die Analyse unvollständig ist, die plausibelste Hypothese und die zugrundeliegenden Belege angeben.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(ii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Ursache",
        portalFieldName: "Detailursache",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "isTargeted",
    section: SECTION.CAUSATION,
    type: FIELD_TYPE.ENUM,
    options: [
      { value: "targeted", label: { en: "Targeted", de: "Gezielt" } },
      { value: "untargeted", label: { en: "Untargeted / opportunistic", de: "Ungezielt / opportunistisch" } },
      { value: "unknown", label: { en: "Unknown", de: "Unbekannt" } },
    ],
    label: {
      en: "Targeted attack indicator",
      de: "Gezielter Angriff",
    },
    description: {
      en: "Whether the entity assesses the incident as a targeted attack (specific to the entity or sector) or untargeted (opportunistic / mass campaign).",
      de: "Einschätzung, ob es sich um einen gezielten Angriff (spezifisch gegen das Unternehmen oder den Sektor) oder einen ungezielten / opportunistischen Vorfall handelt.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (incident profiling)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Ursache",
        portalFieldName: "Zielrichtung des Angriffs",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "ciaImpact",
    section: SECTION.CAUSATION,
    type: FIELD_TYPE.MULTI_ENUM,
    options: [
      {
        value: "confidentiality",
        label: { en: "Confidentiality", de: "Vertraulichkeit" },
      },
      { value: "integrity", label: { en: "Integrity", de: "Integrität" } },
      { value: "availability", label: { en: "Availability", de: "Verfügbarkeit" } },
    ],
    label: {
      en: "CIA properties affected",
      de: "Betroffene Schutzziele (CIA)",
    },
    description: {
      en: "Which of confidentiality, integrity, availability the incident has impacted. NIS 2 Art. 6(6) defines 'significant incident' partly in terms of these properties.",
      de: "Welche der Schutzziele Vertraulichkeit, Integrität, Verfügbarkeit der Vorfall beeinträchtigt hat. Art. 6 Nr. 6 NIS 2 definiert den 'erheblichen Sicherheitsvorfall' u. a. anhand dieser Eigenschaften.",
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
        portalScreen: "Detaillierte Ursache",
        portalFieldName: "CIA-Auswirkungen",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 32(1)",
        fieldReference: "Confidentiality, integrity, availability, resilience",
      },
    ],
  },
  {
    id: "indicatorsOfCompromise",
    section: SECTION.CAUSATION,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Indicators of compromise (IoCs)",
      de: "Kompromittierungsindikatoren (IoCs)",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(b): the incident notification (72h) shall indicate 'an initial assessment of the significant incident, including its severity and impact, as well as, where available, the indicators of compromise'. Submit observable artefacts — file hashes, IP addresses, domains, URLs, malware signatures, behavioural patterns — that downstream defenders can use to detect the same threat. Optional rather than required because the directive conditions it on availability; if forensics has not surfaced any IoCs at the time of submission, leave empty.",
      de: "Wortlaut Art. 23(4)(b) NIS 2: Die Folgemeldung (72h) muss 'eine erste Bewertung des erheblichen Sicherheitsvorfalls, einschließlich seines Schweregrads und seiner Auswirkungen, sowie, sofern verfügbar, die Kompromittierungsindikatoren' enthalten. Beobachtbare Artefakte angeben — Datei-Hashes, IP-Adressen, Domains, URLs, Malware-Signaturen, Verhaltensmuster — die Verteidiger zur Erkennung derselben Bedrohung nutzen können. Wegen 'sofern verfügbar' nicht zwingend, sondern verfügbarkeitsabhängig; wenn die Forensik zum Meldezeitpunkt noch keine Indikatoren liefert, leer lassen.",
    },
    requiredIn: [],
    optionalIn: [
      REPORT_TYPE.INCIDENT_NOTIFICATION,
      REPORT_TYPE.INTERMEDIATE,
      REPORT_TYPE.PROGRESS,
      REPORT_TYPE.FINAL,
    ],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(b)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "ENISA TIG v1.0 §5 (incident profiling)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Detaillierte Ursache",
        portalFieldName: "Kompromittierungsindikatoren",
        notes:
          "BSI Meldeportal screen mapping inferred; verify against current portal version before relying on the field name verbatim.",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(a)",
        fieldReference:
          "Nature of the personal data breach (where IoCs evidence the breach mechanism)",
      },
      {
        instrument: "DORA Art. 19(4)",
        fieldReference: "Type and nature of the incident",
      },
    ],
  },
];
