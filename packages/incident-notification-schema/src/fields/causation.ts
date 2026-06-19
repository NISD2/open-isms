import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const causationFields: ReadonlyArray<IncidentField> = [
  {
    id: "rootCauseType",
    section: SECTION.CAUSATION,
    type: FIELD_TYPE.ENUM,
    options: [
      { value: "malware", label: { en: "Malware", de: "Schadsoftware", fr: "Logiciel malveillant", it: "Malware", es: "Software malicioso", pl: "Złośliwe oprogramowanie" } },
      { value: "ransomware", label: { en: "Ransomware", de: "Ransomware", fr: "Rançongiciel", it: "Ransomware", es: "Ransomware", pl: "Ransomware" } },
      { value: "phishing", label: { en: "Phishing / social engineering", de: "Phishing / Social Engineering", fr: "Hameçonnage / ingénierie sociale", it: "Phishing / ingegneria sociale", es: "Phishing / ingeniería social", pl: "Phishing / inżynieria społeczna" } },
      { value: "ddos", label: { en: "DDoS / DoS", de: "DDoS / DoS", fr: "DDoS / DoS", it: "DDoS / DoS", es: "DDoS / DoS", pl: "DDoS / DoS" } },
      { value: "exploit", label: { en: "Vulnerability exploitation", de: "Schwachstellenausnutzung", fr: "Exploitation de vulnérabilité", it: "Sfruttamento di vulnerabilità", es: "Explotación de vulnerabilidades", pl: "Wykorzystanie podatności" } },
      { value: "insiderAction", label: { en: "Insider action", de: "Insiderhandlung", fr: "Action d'un initié", it: "Azione interna", es: "Acción de personal interno", pl: "Działanie osoby wewnętrznej" } },
      { value: "supplyChainCompromise", label: { en: "Supply-chain compromise", de: "Lieferkettenkompromittierung", fr: "Compromission de la chaîne d'approvisionnement", it: "Compromissione della catena di approvvigionamento", es: "Compromiso de la cadena de suministro", pl: "Naruszenie łańcucha dostaw" } },
      { value: "configurationError", label: { en: "Misconfiguration", de: "Fehlkonfiguration", fr: "Erreur de configuration", it: "Configurazione errata", es: "Configuración incorrecta", pl: "Błędna konfiguracja" } },
      { value: "physicalIncident", label: { en: "Physical / environmental incident", de: "Physischer / Umweltvorfall", fr: "Incident physique / environnemental", it: "Incidente fisico / ambientale", es: "Incidente físico / ambiental", pl: "Incydent fizyczny / środowiskowy" } },
      { value: "humanError", label: { en: "Human error", de: "Menschliches Versagen", fr: "Erreur humaine", it: "Errore umano", es: "Error humano", pl: "Błąd ludzki" } },
      { value: "unknown", label: { en: "Unknown", de: "Unbekannt", fr: "Inconnu", it: "Sconosciuto", es: "Desconocido", pl: "Nieznany" } },
    ],
    label: {
      en: "Root-cause type",
      de: "Ursachentyp",
      fr: "Type de cause racine",
      it: "Tipo di causa principale",
      es: "Tipo de causa raíz",
      pl: "Typ przyczyny źródłowej",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(d)(ii): the final report shall indicate 'the type of threat or root cause that is likely to have triggered the incident'.",
      de: "Wortlaut Art. 23(4)(d)(ii) NIS 2: Der Abschlussbericht muss die Art der Bedrohung oder die wahrscheinliche Grundursache des Vorfalls angeben.",
      fr: "Conformément au libellé de l'art. 23(4)(d)(ii) NIS2 : le rapport final indique 'le type de menace ou la cause racine ayant probablement déclenché l'incident'.",
      it: "Conformemente al testo dell'art. 23(4)(d)(ii) NIS2: la relazione finale indica 'il tipo di minaccia o la causa principale che ha probabilmente innescato l'incidente'.",
      es: "Conforme al texto literal del art. 23(4)(d)(ii) NIS2: el informe final indicará 'el tipo de amenaza o la causa raíz que probablemente haya desencadenado el incidente'.",
      pl: "Zgodnie z brzmieniem art. 23(4)(d)(ii) NIS2: raport końcowy wskazuje 'rodzaj zagrożenia lub przyczynę źródłową, która prawdopodobnie wywołała incydent'.",
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
      fr: "Analyse de la cause racine (descriptif)",
      it: "Analisi della causa principale (descrizione)",
      es: "Análisis de la causa raíz (descripción)",
      pl: "Analiza przyczyny źródłowej (opis)",
    },
    description: {
      en: "Narrative analysis backing the root-cause classification. Where the analysis is incomplete, indicate the best-supported theory and the evidence behind it.",
      de: "Schriftliche Analyse zur Untermauerung der Ursachenklassifikation. Wo die Analyse unvollständig ist, die plausibelste Hypothese und die zugrundeliegenden Belege angeben.",
      fr: "Analyse rédigée étayant la classification de la cause racine. Lorsque l'analyse est incomplète, indiquer l'hypothèse la mieux étayée et les preuves qui la sous-tendent.",
      it: "Analisi descrittiva a sostegno della classificazione della causa principale. Qualora l'analisi sia incompleta, indicare l'ipotesi meglio supportata e le prove che la sostengono.",
      es: "Análisis descriptivo que respalda la clasificación de la causa raíz. Cuando el análisis sea incompleto, indique la hipótesis mejor fundamentada y las pruebas que la sustentan.",
      pl: "Opisowa analiza uzasadniająca klasyfikację przyczyny źródłowej. Jeżeli analiza jest niepełna, należy wskazać najlepiej udokumentowaną hipotezę oraz stojące za nią dowody.",
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
      { value: "targeted", label: { en: "Targeted", de: "Gezielt", fr: "Ciblé", it: "Mirato", es: "Dirigido", pl: "Ukierunkowany" } },
      { value: "untargeted", label: { en: "Untargeted / opportunistic", de: "Ungezielt / opportunistisch", fr: "Non ciblé / opportuniste", it: "Non mirato / opportunistico", es: "No dirigido / oportunista", pl: "Nieukierunkowany / oportunistyczny" } },
      { value: "unknown", label: { en: "Unknown", de: "Unbekannt", fr: "Inconnu", it: "Sconosciuto", es: "Desconocido", pl: "Nieznany" } },
    ],
    label: {
      en: "Targeted attack indicator",
      de: "Gezielter Angriff",
      fr: "Indicateur d'attaque ciblée",
      it: "Indicatore di attacco mirato",
      es: "Indicador de ataque dirigido",
      pl: "Wskaźnik ataku ukierunkowanego",
    },
    description: {
      en: "Whether the entity assesses the incident as a targeted attack (specific to the entity or sector) or untargeted (opportunistic / mass campaign).",
      de: "Einschätzung, ob es sich um einen gezielten Angriff (spezifisch gegen das Unternehmen oder den Sektor) oder einen ungezielten / opportunistischen Vorfall handelt.",
      fr: "Évaluation par l'entité indiquant s'il s'agit d'une attaque ciblée (spécifique à l'entité ou au secteur) ou non ciblée (opportuniste / campagne de masse).",
      it: "Valutazione da parte del soggetto se l'incidente costituisca un attacco mirato (specifico al soggetto o al settore) oppure non mirato (opportunistico / campagna di massa).",
      es: "Evaluación de la entidad sobre si el incidente constituye un ataque dirigido (específico a la entidad o al sector) o no dirigido (oportunista / campaña masiva).",
      pl: "Ocena podmiotu, czy incydent stanowi atak ukierunkowany (skierowany przeciwko podmiotowi lub sektorowi), czy nieukierunkowany (oportunistyczny / kampania masowa).",
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
        label: { en: "Confidentiality", de: "Vertraulichkeit", fr: "Confidentialité", it: "Riservatezza", es: "Confidencialidad", pl: "Poufność" },
      },
      { value: "integrity", label: { en: "Integrity", de: "Integrität", fr: "Intégrité", it: "Integrità", es: "Integridad", pl: "Integralność" } },
      { value: "availability", label: { en: "Availability", de: "Verfügbarkeit", fr: "Disponibilité", it: "Disponibilità", es: "Disponibilidad", pl: "Dostępność" } },
    ],
    label: {
      en: "CIA properties affected",
      de: "Betroffene Schutzziele (CIA)",
      fr: "Propriétés CIA affectées",
      it: "Proprietà CIA interessate",
      es: "Propiedades CIA afectadas",
      pl: "Naruszone właściwości CIA",
    },
    description: {
      en: "Which of confidentiality, integrity, availability the incident has impacted. NIS 2 Art. 6(6) defines 'significant incident' partly in terms of these properties.",
      de: "Welche der Schutzziele Vertraulichkeit, Integrität, Verfügbarkeit der Vorfall beeinträchtigt hat. Art. 6 Nr. 6 NIS 2 definiert den 'erheblichen Sicherheitsvorfall' u. a. anhand dieser Eigenschaften.",
      fr: "Lesquelles parmi la confidentialité, l'intégrité, la disponibilité l'incident a affectées. L'art. 6(6) NIS2 définit l''incident important' notamment au regard de ces propriétés.",
      it: "Quali tra riservatezza, integrità, disponibilità l'incidente ha compromesso. L'art. 6(6) NIS2 definisce l''incidente significativo' anche in funzione di tali proprietà.",
      es: "Cuáles de la confidencialidad, integridad, disponibilidad ha afectado el incidente. El art. 6(6) NIS2 define el 'incidente significativo' en parte en función de estas propiedades.",
      pl: "Które z właściwości: poufność, integralność, dostępność zostały naruszone przez incydent. Art. 6(6) NIS2 definiuje 'poważny incydent' częściowo w odniesieniu do tych właściwości.",
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
      fr: "Indicateurs de compromission (IoCs)",
      it: "Indicatori di compromissione (IoCs)",
      es: "Indicadores de compromiso (IoCs)",
      pl: "Wskaźniki naruszenia (IoCs)",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(b): the incident notification (72h) shall indicate 'an initial assessment of the significant incident, including its severity and impact, as well as, where available, the indicators of compromise'. Submit observable artefacts — file hashes, IP addresses, domains, URLs, malware signatures, behavioural patterns — that downstream defenders can use to detect the same threat. Optional rather than required because the directive conditions it on availability; if forensics has not surfaced any IoCs at the time of submission, leave empty.",
      de: "Wortlaut Art. 23(4)(b) NIS 2: Die Folgemeldung (72h) muss 'eine erste Bewertung des erheblichen Sicherheitsvorfalls, einschließlich seines Schweregrads und seiner Auswirkungen, sowie, sofern verfügbar, die Kompromittierungsindikatoren' enthalten. Beobachtbare Artefakte angeben — Datei-Hashes, IP-Adressen, Domains, URLs, Malware-Signaturen, Verhaltensmuster — die Verteidiger zur Erkennung derselben Bedrohung nutzen können. Wegen 'sofern verfügbar' nicht zwingend, sondern verfügbarkeitsabhängig; wenn die Forensik zum Meldezeitpunkt noch keine Indikatoren liefert, leer lassen.",
      fr: "Conformément au libellé de l'art. 23(4)(b) NIS2 : la notification d'incident (72h) indique 'une évaluation initiale de l'incident important, y compris sa gravité et son impact, ainsi que, le cas échéant, les indicateurs de compromission'. Fournir des artefacts observables (empreintes de fichiers, adresses IP, domaines, URLs, signatures de logiciels malveillants, schémas comportementaux) que les défenseurs en aval peuvent utiliser pour détecter la même menace. Facultatif et non obligatoire, car la directive le conditionne à la disponibilité ; si l'analyse forensique n'a fait apparaître aucun IoC au moment de la soumission, laisser vide.",
      it: "Conformemente al testo dell'art. 23(4)(b) NIS2: la notifica dell'incidente (72h) indica 'una valutazione iniziale dell'incidente significativo, compresi la sua gravità e il suo impatto, nonché, ove disponibili, gli indicatori di compromissione'. Fornire artefatti osservabili (hash di file, indirizzi IP, domini, URL, firme di malware, schemi comportamentali) utilizzabili dai difensori a valle per rilevare la medesima minaccia. Facoltativo anziché obbligatorio, poiché la direttiva lo subordina alla disponibilità; se l'analisi forense non ha rivelato alcun IoC al momento dell'invio, lasciare vuoto.",
      es: "Conforme al texto literal del art. 23(4)(b) NIS2: la notificación del incidente (72h) indicará 'una evaluación inicial del incidente significativo, incluida su gravedad e impacto, así como, cuando estén disponibles, los indicadores de compromiso'. Aporte artefactos observables (resúmenes de archivos, direcciones IP, dominios, URLs, firmas de software malicioso, patrones de comportamiento) que los defensores posteriores puedan utilizar para detectar la misma amenaza. Opcional y no obligatorio, ya que la directiva lo condiciona a la disponibilidad; si el análisis forense no ha revelado ningún IoC en el momento de la presentación, dejar vacío.",
      pl: "Zgodnie z brzmieniem art. 23(4)(b) NIS2: zgłoszenie incydentu (72h) wskazuje 'wstępną ocenę poważnego incydentu, w tym jego dotkliwość i skutki, a także, o ile są dostępne, wskaźniki naruszenia'. Należy podać obserwowalne artefakty (skróty plików, adresy IP, domeny, adresy URL, sygnatury złośliwego oprogramowania, wzorce zachowań), które obrońcy na dalszych etapach mogą wykorzystać do wykrycia tego samego zagrożenia. Opcjonalne, a nie obowiązkowe, ponieważ dyrektywa uzależnia to od dostępności; jeżeli analiza kryminalistyczna nie ujawniła żadnych IoC w chwili przekazania, pozostawić puste.",
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
