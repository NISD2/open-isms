// Source of truth for the supplier questionnaire fields in this section.
// Edit this file (not data/supply-chain-questionnaire.json) and run
// `bun run build:json` to regenerate the published JSON artefact.
//
// Descriptions are Mittelstand-readable plain language: what to type, with
// a short example where the question is ambiguous. Legal citations live in
// the `legalBasis` field so audit teams still see the source. Labels are
// the public schema contract and are not edited here.

import type { SupplierField } from "../schema";

export const profileFields: SupplierField[] = [
  {
    id: "legalName",
    section: "profile",
    type: "string",
    label: { en: "Legal name", de: "Firmierung (Rechtsname)" },
    description: {
      en: "Your company's registered name, as it appears in the commercial register. Example: Müller GmbH or Acme Software Ltd.",
      de: "Der eingetragene Name Ihres Unternehmens, so wie er im Handelsregister steht. Beispiel: Müller GmbH oder Schmidt AG.",
    },
    legalBasis: "ENISA TIG §5.2",
    required: true,
  },
  {
    id: "registeredAddress",
    section: "profile",
    type: "string",
    label: { en: "Registered address", de: "Geschäftsanschrift" },
    description: {
      en: "Your company's registered business address. One address is enough, even if you have several locations.",
      de: "Die Geschäftsanschrift Ihres Unternehmens. Eine Adresse genügt, auch wenn Sie mehrere Standorte haben.",
    },
    legalBasis: "ENISA TIG §5.2",
    required: true,
  },
  {
    id: "country",
    section: "profile",
    type: "country",
    label: { en: "Country", de: "Land" },
    description: {
      en: "The country where your company is legally established. Two letters, e.g. DE for Germany.",
      de: "Das Land, in dem Ihr Unternehmen rechtlich sitzt. Zwei Buchstaben, zum Beispiel DE für Deutschland.",
    },
    legalBasis: "ENISA TIG §5.2",
    required: true,
  },
  {
    id: "primaryDomain",
    section: "profile",
    type: "url",
    label: { en: "Primary domain", de: "Primäre Domain" },
    description: {
      en: "Your main domain, usually the URL of your website. Example: acmesoftware.com.",
      de: "Ihre Hauptdomain, üblicherweise die Adresse Ihrer Webseite. Beispiel: muellergmbh.de.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: false,
  },
  {
    id: "tagline",
    section: "profile",
    type: "string",
    label: { en: "Tagline (one line, customer-facing)", de: "Slogan (eine Zeile, kundenseitig sichtbar)" },
    description: {
      en: "One line summarising what you offer. Customers see this on your supplier profile. Example: ERP for SME manufacturing.",
      de: "Eine Zeile, die Ihre Leistung zusammenfasst. Kunden sehen diese im Lieferantenprofil. Beispiel: ERP für mittelständische Produktion.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: false,
  },
  {
    id: "description",
    section: "profile",
    type: "text",
    label: { en: "Public description (longer)", de: "Öffentliche Beschreibung (länger)" },
    description: {
      en: "Two to three sentences about your company and what you do. This appears on your supplier profile. Sales pitch, security posture, or both.",
      de: "Zwei bis drei Sätze über Ihr Unternehmen und Ihre Leistung. Diese Beschreibung erscheint auf Ihrem Lieferantenprofil. Verkaufsversprechen, Sicherheitspositionierung oder beides.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: false,
  },
  {
    id: "serviceDescription",
    section: "profile",
    type: "text",
    label: { en: "Description of services provided", de: "Beschreibung der erbrachten Leistungen" },
    description: {
      en: "One paragraph on what your company technically delivers to customers. Concrete products, modules, or services. Avoid pure marketing language.",
      de: "Ein Absatz darüber, was Ihr Unternehmen Kunden technisch liefert. Konkrete Produkte, Module oder Dienstleistungen. Vermeiden Sie reine Marketing-Sprache.",
    },
    legalBasis: "ENISA TIG §5.2(b) + §5.1.4 TIPS",
    required: true,
  },
  {
    id: "dataProcessingLocations",
    section: "profile",
    type: "string",
    label: { en: "Countries / regions where customer data is processed", de: "Länder / Regionen, in denen Kundendaten verarbeitet werden" },
    description: {
      en: "Every country where your customers' data is stored or processed. Comma-separated, ISO country codes. Example: DE, NL, US. If you process entirely within the EU, listing the EU countries is enough.",
      de: "Alle Länder, in denen Kundendaten Ihrer Kunden gespeichert oder verarbeitet werden. Komma-getrennt, ISO-Ländercodes. Beispiel: DE, NL, US. Wenn Sie ausschließlich in der EU verarbeiten, reicht eine Liste der EU-Länder.",
    },
    legalBasis: "ENISA TIG §5.1.4 TIPS",
    required: true,
  },
  {
    id: "securityContactName",
    section: "profile",
    type: "string",
    label: { en: "Security contact name", de: "Name des Sicherheitskontakts" },
    description: {
      en: "Who customers contact when a security incident hits. In smaller companies often the managing director or IT lead. One person is enough.",
      de: "Wer bei einem Sicherheitsvorfall direkt angesprochen wird. Bei kleineren Unternehmen oft die Geschäftsführung oder die IT-Leitung. Eine Person genügt.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(d)",
    required: true,
  },
  {
    id: "incidentContactEmail",
    section: "profile",
    type: "email",
    label: { en: "Incident contact email", de: "E-Mail für Vorfälle" },
    description: {
      en: "Email address customers use to report a security incident. Ideally a distribution list like security@example.com that reaches multiple people.",
      de: "E-Mail-Adresse, die Kunden bei einem Sicherheitsvorfall verwenden. Idealerweise ein Verteiler wie security@firma.de, der mehrere Personen erreicht.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(d)",
    required: true,
  },
  {
    id: "incidentContactPhone",
    section: "profile",
    type: "phone",
    label: { en: "Incident contact phone (24/7)", de: "Telefonnummer für Vorfälle (24/7)" },
    description: {
      en: "Phone number for urgent incident reports. If you do not run 24/7 on-call, mention your business hours in brackets.",
      de: "Telefonnummer für dringende Vorfallsmeldungen. Wenn Sie keinen 24/7-Bereitschaftsdienst haben, geben Sie die Geschäftszeiten in Klammern an.",
    },
    legalBasis: "CIR 2024/2690 §5.1.4(d)",
    required: false,
  },
  {
    id: "incidentSlaHours",
    section: "profile",
    type: "integer",
    label: { en: "Incident notification SLA (hours)", de: "Meldefrist für Vorfälle (Stunden)" },
    description: {
      en: "Hours from incident detection to customer notification, at the latest. Realistic self-assessment, not aspirational. Common values: 24, 48, or 72 hours.",
      de: "Wie viele Stunden Sie maximal brauchen, um einen Kunden nach Erkennung eines Vorfalls zu informieren. Realistische Selbsteinschätzung, nicht Wunschwert. Übliche Werte: 24, 48 oder 72 Stunden.",
    },
    legalBasis: "NIS2 Art. 23",
    required: false,
  },
  {
    id: "bsiRegistrationId",
    section: "profile",
    type: "string",
    label: { en: "BSI registration ID (only if your company is itself NIS2-regulated)", de: "BSI-Registrierungs-ID (nur falls Ihr Unternehmen selbst NIS2-reguliert ist)" },
    description: {
      en: "If your company is itself NIS 2 regulated and registered with the BSI, enter the registration ID here. Optional. Lets customers see at a glance that you meet the same obligation as a regulated entity.",
      de: "Wenn Ihr Unternehmen selbst der NIS 2 unterliegt und beim BSI registriert ist, tragen Sie die Registrierungs-ID hier ein. Optional. Kunden sehen damit auf einen Blick, dass Sie als regulierte Einrichtung dieselbe Pflicht erfüllen.",
    },
    legalBasis: "ENISA TIG §5.1.2",
    required: false,
  },
  {
    id: "isSaas",
    section: "profile",
    type: "boolean",
    label: { en: "We provide SaaS / hosted services", de: "Wir bieten SaaS / gehostete Dienste" },
    description: {
      en: "You run software for customers on your own infrastructure and deliver it over the internet. Tick more than one box if you offer several models.",
      de: "Sie betreiben Software für Kunden auf eigener Infrastruktur und liefern sie über das Internet. Mehrfachauswahl möglich, wenn Sie mehrere Modelle anbieten.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: true,
  },
  {
    id: "isOnPrem",
    section: "profile",
    type: "boolean",
    label: { en: "We deliver on-prem software", de: "Wir liefern On-Prem-Software" },
    description: {
      en: "You deliver software that customers install and run on their own infrastructure.",
      de: "Sie liefern Software, die Ihre Kunden auf ihrer eigenen Infrastruktur installieren und betreiben.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: true,
  },
  {
    id: "isProfessionalServices",
    section: "profile",
    type: "boolean",
    label: { en: "We provide professional services / consulting", de: "Wir bieten Dienstleistungen / Beratung" },
    description: {
      en: "Your main deliverable is human work: consulting, implementation, training, audit, or customisation.",
      de: "Sie liefern menschliche Arbeit als Hauptleistung: Beratung, Implementierung, Schulung, Audit oder Customizing.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: true,
  },
  {
    id: "isManagedService",
    section: "profile",
    type: "boolean",
    label: { en: "We provide managed services / MSP", de: "Wir bieten Managed Services / MSP" },
    description: {
      en: "You operate parts of your customer's IT for them, with your own staff. Typical for MSP and MSSP models.",
      de: "Sie betreiben Teile der IT-Landschaft des Kunden für ihn, mit eigenem Personal. Typisch für MSP- und MSSP-Modelle.",
    },
    legalBasis: "ENISA TIG §5.2(b)",
    required: true,
  },
  {
    id: "usesAiSystems",
    section: "profile",
    type: "boolean",
    label: {
      en: "We use, integrate or provide AI systems",
      de: "Wir nutzen, integrieren oder bieten KI-Systeme",
    },
    description: {
      en: "Do your products or services process customer data through an AI or ML model? Includes external models you call through an API, for example OpenAI or Anthropic.",
      de: "Verarbeiten Ihre Produkte oder Dienste Kundendaten durch ein KI- oder ML-Modell? Inklusive externer Modelle, die Sie über eine API anbinden, zum Beispiel OpenAI oder Anthropic.",
    },
    legalBasis: "NIS2 Art. 21(2)(d)",
    required: true,
  },
];
