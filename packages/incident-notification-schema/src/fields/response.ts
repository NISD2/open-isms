import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

export const responseFields: ReadonlyArray<IncidentField> = [
  {
    id: "containmentMeasuresTaken",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Containment measures taken",
      de: "Eingedämmte Maßnahmen",
      fr: "Mesures de confinement prises",
      it: "Misure di contenimento adottate",
      es: "Medidas de contención adoptadas",
      pl: "Podjęte środki ograniczające",
    },
    description: {
      en: "Technical, organisational, and operational measures already taken to contain the incident. Required for the incident notification (72h) and updated in subsequent reports.",
      de: "Bereits ergriffene technische, organisatorische und operative Maßnahmen zur Eindämmung des Vorfalls. Pflicht zur Folgemeldung (72h) und Fortschreibung in späteren Berichten.",
      fr: "Mesures techniques, organisationnelles et opérationnelles déjà prises pour circonscrire l'incident. Requis pour la notification d'incident (72h) et mis à jour dans les rapports ultérieurs.",
      it: "Misure tecniche, organizzative e operative già adottate per contenere l'incidente. Richiesto per la notifica dell'incidente (72h) e aggiornato nelle relazioni successive.",
      es: "Medidas técnicas, organizativas y operativas ya adoptadas para contener el incidente. Obligatorio para la notificación de incidente (72h) y actualizado en los informes posteriores.",
      pl: "Środki techniczne, organizacyjne i operacyjne już podjęte w celu opanowania incydentu. Wymagane w zgłoszeniu incydentu (72h) i aktualizowane w kolejnych sprawozdaniach.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(iii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Technische / organisatorische Maßnahmen",
      },
    ],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 33(3)(d)",
        fieldReference:
          "Measures taken or proposed to mitigate possible adverse effects",
      },
    ],
  },
  {
    id: "appliedAndOngoingMitigation",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Applied and ongoing mitigation",
      de: "Angewandte und laufende Schadensbegrenzung",
      fr: "Mesures d'atténuation appliquées et en cours",
      it: "Misure di attenuazione applicate e in corso",
      es: "Mitigación aplicada y en curso",
      pl: "Zastosowane i bieżące środki łagodzące",
    },
    description: {
      en: "Verbatim per NIS 2 Art. 23(4)(d)(iii): the final report shall describe 'applied and ongoing mitigation measures'.",
      de: "Wortlaut Art. 23(4)(d)(iii) NIS 2: Der Abschlussbericht muss die angewandten und laufenden Schadensbegrenzungsmaßnahmen beschreiben.",
      fr: "Selon les termes mêmes de l'art. 23(4)(d)(iii) NIS 2 : le rapport final doit décrire les 'mesures d'atténuation appliquées et en cours'.",
      it: "Secondo il testo dell'art. 23(4)(d)(iii) NIS 2: la relazione finale deve descrivere le 'misure di attenuazione applicate e in corso'.",
      es: "Conforme al texto literal del art. 23(4)(d)(iii) NIS 2: el informe final deberá describir las 'medidas de mitigación aplicadas y en curso'.",
      pl: "Zgodnie z brzmieniem art. 23(4)(d)(iii) NIS 2: sprawozdanie końcowe musi opisywać 'zastosowane i bieżące środki łagodzące'.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.PROGRESS, REPORT_TYPE.INTERMEDIATE],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(iii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Angewandte und laufende Maßnahmen",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "detectionMethod",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.MULTI_ENUM,
    options: [
      {
        value: "siem",
        label: {
          en: "SIEM / log alert",
          de: "SIEM / Log-Alarm",
          fr: "SIEM / alerte de journal",
          it: "SIEM / avviso di log",
          es: "SIEM / alerta de registro",
          pl: "SIEM / alert dziennika",
        },
      },
      {
        value: "edr",
        label: {
          en: "EDR / endpoint",
          de: "EDR / Endgeräte",
          fr: "EDR / point d'extrémité",
          it: "EDR / endpoint",
          es: "EDR / punto final",
          pl: "EDR / punkt końcowy",
        },
      },
      {
        value: "userReport",
        label: {
          en: "User report",
          de: "Nutzermeldung",
          fr: "Signalement par un utilisateur",
          it: "Segnalazione dell'utente",
          es: "Informe de usuario",
          pl: "Zgłoszenie użytkownika",
        },
      },
      {
        value: "supplierAlert",
        label: {
          en: "Supplier alert",
          de: "Lieferantenmeldung",
          fr: "Alerte d'un fournisseur",
          it: "Avviso del fornitore",
          es: "Alerta de proveedor",
          pl: "Alert dostawcy",
        },
      },
      {
        value: "csirtAdvisory",
        label: {
          en: "CSIRT advisory",
          de: "CSIRT-Hinweis",
          fr: "Avis du CSIRT",
          it: "Avviso del CSIRT",
          es: "Aviso del CSIRT",
          pl: "Komunikat CSIRT",
        },
      },
      {
        value: "externalParty",
        label: {
          en: "External party",
          de: "Externe Stelle",
          fr: "Partie externe",
          it: "Parte esterna",
          es: "Parte externa",
          pl: "Podmiot zewnętrzny",
        },
      },
      {
        value: "internalAudit",
        label: {
          en: "Internal audit / monitoring",
          de: "Internes Audit / Monitoring",
          fr: "Audit / surveillance interne",
          it: "Audit / monitoraggio interno",
          es: "Auditoría / supervisión interna",
          pl: "Audyt / monitorowanie wewnętrzne",
        },
      },
      {
        value: "other",
        label: {
          en: "Other",
          de: "Sonstiges",
          fr: "Autre",
          it: "Altro",
          es: "Otro",
          pl: "Inne",
        },
      },
    ],
    label: {
      en: "Detection method",
      de: "Erkennungsmethode",
      fr: "Méthode de détection",
      it: "Metodo di rilevamento",
      es: "Método de detección",
      pl: "Metoda wykrycia",
    },
    description: {
      en: "How the incident was first detected. Used by CSIRTs to identify systemic detection gaps across the sector.",
      de: "Wie der Vorfall erstmals erkannt wurde. Wird vom CSIRT verwendet, um systemische Detektionslücken sektorweit zu identifizieren.",
      fr: "Comment l'incident a été détecté pour la première fois. Utilisé par les CSIRT pour identifier les lacunes systémiques de détection dans l'ensemble du secteur.",
      it: "Come l'incidente è stato rilevato per la prima volta. Utilizzato dai CSIRT per individuare lacune sistemiche di rilevamento nell'intero settore.",
      es: "Cómo se detectó el incidente por primera vez. Utilizado por los CSIRT para identificar lagunas sistémicas de detección en todo el sector.",
      pl: "W jaki sposób incydent został po raz pierwszy wykryty. Wykorzystywane przez CSIRT do identyfikacji systemowych luk w wykrywaniu w całym sektorze.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "ENISA TIG v1.0 §5 (detection)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Gegenmaßnahmen",
        portalFieldName: "Erkennungsmethode",
      },
    ],
    crossRegulationOverlaps: [],
  },
  {
    id: "preventiveMeasuresPlanned",
    section: SECTION.RESPONSE_MEASURES,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Preventive measures planned",
      de: "Geplante Präventivmaßnahmen",
      fr: "Mesures préventives prévues",
      it: "Misure preventive pianificate",
      es: "Medidas preventivas previstas",
      pl: "Planowane środki zapobiegawcze",
    },
    description: {
      en: "Measures planned to prevent recurrence. Carries the 'lessons learned' loop required by ENISA TIG for the final report.",
      de: "Maßnahmen zur Vermeidung von Wiederholungsfällen. Trägt die in der ENISA TIG für den Abschlussbericht geforderte Lessons-learned-Schleife.",
      fr: "Mesures prévues pour empêcher toute récurrence. Porte la boucle de 'retour d'expérience' exigée par l'ENISA TIG pour le rapport final.",
      it: "Misure pianificate per prevenire il ripetersi. Sostiene il ciclo di 'lezioni apprese' richiesto dall'ENISA TIG per la relazione finale.",
      es: "Medidas previstas para evitar que se repita. Aporta el ciclo de 'lecciones aprendidas' exigido por la ENISA TIG para el informe final.",
      pl: "Środki planowane w celu zapobieżenia ponownemu wystąpieniu. Realizuje pętlę 'wyciągniętych wniosków' wymaganą przez ENISA TIG w sprawozdaniu końcowym.",
    },
    requiredIn: [REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.PROGRESS, REPORT_TYPE.INTERMEDIATE],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(4)(d)(iii)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
      {
        citation: "ENISA TIG v1.0 §5 (post-incident review)",
        url: "https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance",
      },
    ],
    nationalPortalMappings: [
      {
        countryCode: "DE",
        portalScreen: "Vorfalls-Korrelationen",
        portalFieldName: "Zukünftige Präventionsmaßnahmen",
      },
    ],
    crossRegulationOverlaps: [],
  },
];
