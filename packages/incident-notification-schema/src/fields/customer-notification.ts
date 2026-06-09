import { REPORT_TYPE, SECTION, FIELD_TYPE, type IncidentField } from "../schema";

/**
 * NIS 2 Art. 23(2) requires the entity to notify the recipients of its
 * services of significant cyber threats — distinct from the Art. 23(3)
 * obligation to notify the CSIRT. These fields capture that customer-
 * facing communication so it can be replayed across email + status
 * page + portal.
 *
 * W3C DPV aligns this with:
 *   risk:RiskMitigationAdvice
 *   https://w3id.org/dpv/legal/eu/nis2#RiskMitigationAdvice
 */
export const customerNotificationFields: ReadonlyArray<IncidentField> = [
  {
    id: "customerNotificationRequired",
    section: SECTION.DESCRIPTION,
    type: FIELD_TYPE.BOOLEAN,
    label: {
      en: "Notify recipients of services (Art. 23(2))",
      de: "Empfänger der Dienste informieren (Art. 23(2))",
    },
    description: {
      en: "NIS 2 Art. 23(2): where applicable, the entity shall, without undue delay, communicate to the recipients of its services that are potentially affected by a significant cyber threat any measures or remedies they can take.",
      de: "Art. 23(2) NIS 2: Wo zutreffend, hat die Einrichtung den Empfängern ihrer Dienste, die potenziell von einer erheblichen Cyberbedrohung betroffen sind, unverzüglich alle Maßnahmen oder Abhilfen mitzuteilen, die sie ergreifen können.",
    },
    requiredIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.FINAL],
    optionalIn: [REPORT_TYPE.EARLY_WARNING, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(2)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    w3cDpvUri: "https://w3id.org/dpv/legal/eu/nis2#RiskMitigationAdvice",
    nationalPortalMappings: [],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 34",
        fieldReference:
          "Communication of personal data breach to the data subject",
      },
    ],
  },
  {
    id: "customerNotificationContent",
    section: SECTION.DESCRIPTION,
    type: FIELD_TYPE.TEXT,
    label: {
      en: "Message to recipients of services",
      de: "Mitteilung an Empfänger der Dienste",
    },
    description: {
      en: "Plain-language message to the recipients of the entity's services about the threat and the recommended remedial actions. Required if customerNotificationRequired is true.",
      de: "Verständliche Mitteilung an die Empfänger der Dienste über die Bedrohung und die empfohlenen Abhilfemaßnahmen. Pflicht, wenn customerNotificationRequired wahr ist.",
    },
    requiredIn: [],
    optionalIn: [REPORT_TYPE.INCIDENT_NOTIFICATION, REPORT_TYPE.INTERMEDIATE, REPORT_TYPE.PROGRESS, REPORT_TYPE.FINAL],
    legalBasis: [
      {
        citation: "NIS 2 Art. 23(2)",
        url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
      },
    ],
    w3cDpvUri: "https://w3id.org/dpv/legal/eu/nis2#RiskMitigationAdvice",
    nationalPortalMappings: [],
    crossRegulationOverlaps: [
      {
        instrument: "GDPR Art. 34(2)",
        fieldReference: "Description of the breach in clear and plain language",
      },
    ],
  },
];
