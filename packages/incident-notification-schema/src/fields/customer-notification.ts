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
      fr: "Informer les destinataires des services (art. 23(2))",
      it: "Informare i destinatari dei servizi (art. 23(2))",
      es: "Informar a los destinatarios de los servicios (art. 23(2))",
      pl: "Powiadomić odbiorców usług (art. 23(2))",
    },
    description: {
      en: "NIS 2 Art. 23(2): where applicable, the entity shall, without undue delay, communicate to the recipients of its services that are potentially affected by a significant cyber threat any measures or remedies they can take.",
      de: "Art. 23(2) NIS 2: Wo zutreffend, hat die Einrichtung den Empfängern ihrer Dienste, die potenziell von einer erheblichen Cyberbedrohung betroffen sind, unverzüglich alle Maßnahmen oder Abhilfen mitzuteilen, die sie ergreifen können.",
      fr: "Art. 23(2) NIS2 : le cas échéant, l'entité communique sans retard injustifié aux destinataires de ses services potentiellement affectés par une cybermenace importante toutes les mesures ou tous les remèdes qu'ils peuvent prendre.",
      it: "Art. 23(2) NIS2: ove applicabile, il soggetto comunica senza indebito ritardo ai destinatari dei suoi servizi potenzialmente interessati da una minaccia informatica significativa eventuali misure o rimedi che possono adottare.",
      es: "Art. 23(2) NIS2: cuando proceda, la entidad comunicará sin demora indebida a los destinatarios de sus servicios potencialmente afectados por una ciberamenaza significativa cualesquiera medidas o remedios que puedan adoptar.",
      pl: "Art. 23(2) NIS2: w stosownych przypadkach podmiot bez zbędnej zwłoki przekazuje odbiorcom swoich usług, na których potencjalnie może mieć wpływ poważne cyberzagrożenie, informacje o wszelkich środkach lub działaniach zaradczych, które mogą podjąć.",
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
      fr: "Message aux destinataires des services",
      it: "Messaggio ai destinatari dei servizi",
      es: "Mensaje a los destinatarios de los servicios",
      pl: "Komunikat do odbiorców usług",
    },
    description: {
      en: "Plain-language message to the recipients of the entity's services about the threat and the recommended remedial actions. Required if customerNotificationRequired is true.",
      de: "Verständliche Mitteilung an die Empfänger der Dienste über die Bedrohung und die empfohlenen Abhilfemaßnahmen. Pflicht, wenn customerNotificationRequired wahr ist.",
      fr: "Message en langage clair adressé aux destinataires des services de l'entité concernant la menace et les mesures correctives recommandées. Obligatoire si customerNotificationRequired est vrai.",
      it: "Messaggio in linguaggio chiaro destinato ai destinatari dei servizi del soggetto in merito alla minaccia e alle azioni correttive raccomandate. Obbligatorio se customerNotificationRequired è vero.",
      es: "Mensaje en lenguaje claro dirigido a los destinatarios de los servicios de la entidad sobre la amenaza y las acciones correctivas recomendadas. Obligatorio si customerNotificationRequired es verdadero.",
      pl: "Komunikat sformułowany prostym językiem skierowany do odbiorców usług podmiotu, dotyczący zagrożenia oraz zalecanych działań zaradczych. Wymagany, jeżeli customerNotificationRequired ma wartość prawda.",
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
