/**
 * The words the downloadable supplier questionnaire (PDF and Word) is printed with, one table for
 * both files so they cannot drift apart. Questions, help texts and option labels come from the
 * questionnaire package; this holds only what frames them.
 */
import {
  type SectionValue,
  type SupplierField,
  supplierQuestionnaire,
} from "@nisd2/nis2-supply-chain-questionnaire-schema";
import {
  type ConditionWords,
  plural,
  type QUESTIONNAIRE_COUNTS,
} from "@/lib/supplier-questionnaire-text";

const VERSION = supplierQuestionnaire.version;
const LAST_UPDATED = supplierQuestionnaire.lastUpdated;

export type QuestionnaireLocale = "de" | "en" | "nl" | "fr" | "it" | "es" | "pl";

export const QUESTIONNAIRE_LOCALES: QuestionnaireLocale[] = [
  "de",
  "en",
  "nl",
  "fr",
  "it",
  "es",
  "pl",
];

export const SECTION_TITLES: Record<SectionValue, Record<QuestionnaireLocale, string>> = {
  profile: {
    de: "Lieferantenprofil",
    en: "Supplier profile",
    nl: "Leveranciersprofiel",
    fr: "Profil du fournisseur",
    it: "Profilo del fornitore",
    es: "Perfil del proveedor",
    pl: "Profil dostawcy",
  },
  security_practices: {
    de: "Sicherheitspraktiken",
    en: "Security practices",
    nl: "Beveiligingspraktijken",
    fr: "Pratiques de sécurité",
    it: "Pratiche di sicurezza",
    es: "Prácticas de seguridad",
    pl: "Praktyki bezpieczeństwa",
  },
  saas_technical: {
    de: "Software als Dienst (SaaS)",
    en: "Software as a service (SaaS)",
    nl: "Software als dienst (SaaS)",
    fr: "Logiciel en tant que service (SaaS)",
    it: "Software come servizio (SaaS)",
    es: "Software como servicio (SaaS)",
    pl: "Oprogramowanie jako usługa (SaaS)",
  },
  on_prem_technical: {
    de: "Software beim Kunden (On-Premise)",
    en: "Software on the customer's premises (on-premise)",
    nl: "Software bij de klant (on-premise)",
    fr: "Logiciel installé chez le client (on-premise)",
    it: "Software presso il cliente (on-premise)",
    es: "Software en las instalaciones del cliente (on-premise)",
    pl: "Oprogramowanie u klienta (on-premise)",
  },
};

type Counts = typeof QUESTIONNAIRE_COUNTS;

export interface ExportStrings extends ConditionWords {
  readonly title: string;
  readonly subtitle: string;
  readonly meta: (counts: Counts) => string;
  readonly intro: (counts: Counts) => string;
  readonly source: string;
  readonly legalBasis: string;
  readonly required: string;
  readonly optional: string;
  readonly conditional: string;
  readonly license: string;
  readonly fieldCount: (count: number) => string;
}

export const EXPORT_STRINGS: Record<QuestionnaireLocale, ExportStrings> = {
  de: {
    title: "NIS 2 Lieferantenfragebogen",
    subtitle:
      "Offener Fragebogen für die Lieferantenbewertung unter NIS 2, im EU-Recht verankert",
    meta: (c) =>
      `Version ${VERSION} - Stand ${LAST_UPDATED} - ${c.total} Felder in ${c.sections} Sektionen`,
    intro: (c) =>
      `Jede Frage nennt ihre Quelle auf EU-Ebene: die Durchführungsverordnung (EU) 2024/2690, die ENISA Technical Implementation Guidance, die DSGVO oder den Cyber Resilience Act. Dient sie Maßnahmen aus Anhang A der ISO/IEC 27001:2022, stehen diese daneben. ${c.always} Fragen beantwortet jeder Lieferant; bei jeder weiteren steht, unter welcher Antwort sie gestellt wird. Das hängt davon ab, was der Lieferant bei seinen Kunden erreicht: ihre Daten, ihre Systeme, ihre Räume oder Software, die er betreibt oder ausliefert. Sektorspezifische Erweiterungen (TISAX, VDA ISA, BSI C5, KRITIS) ergänzen die Basis, ersetzen sie nicht.`,
    source:
      "Quelle: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Rechtsgrundlage",
    required: "Pflichtfeld",
    optional: "Optional",
    conditional: "Bedingt",
    onlyIf: "Nur wenn",
    yes: "Ja",
    no: "Nein",
    or: "oder",
    license:
      "Lizenz: MIT (Schema) + CC BY 4.0 (Inhalt). Frei nutzbar, forkbar, anpassbar.",
    fieldCount: (n) => plural("de", n, { one: "Feld", other: "Felder" }),
  },
  en: {
    title: "NIS 2 Supplier Questionnaire",
    subtitle: "An open, EU-anchored questionnaire for NIS 2 supplier due diligence",
    meta: (c) =>
      `Version ${VERSION} - Last updated ${LAST_UPDATED} - ${c.total} fields across ${c.sections} sections`,
    intro: (c) =>
      `Every question names its EU-level source: Implementing Regulation (EU) 2024/2690, ENISA's Technical Implementation Guidance, the GDPR or the Cyber Resilience Act. Where it serves ISO/IEC 27001:2022 Annex A controls, they are listed beside it. Every supplier answers ${c.always} questions; each of the others states the answer it depends on. That follows from what the supplier reaches at its customers: their data, their systems, their premises, or software it runs or ships. Sector overlays (TISAX, VDA ISA, BSI C5, KRITIS) sit on top of this baseline.`,
    source:
      "Source: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Legal basis",
    required: "Required",
    optional: "Optional",
    conditional: "Conditional",
    onlyIf: "Only if",
    yes: "Yes",
    no: "No",
    or: "or",
    license: "License: MIT (schema) + CC BY 4.0 (content). Free to use, fork, and adapt.",
    fieldCount: (n) => plural("en", n, { one: "field", other: "fields" }),
  },
  nl: {
    title: "NIS 2 Leveranciersvragenlijst",
    subtitle: "Een open, EU-verankerde vragenlijst voor de NIS 2 leveranciersbeoordeling",
    meta: (c) =>
      `Versie ${VERSION} - Laatst bijgewerkt ${LAST_UPDATED} - ${c.total} velden in ${c.sections} secties`,
    intro: (c) =>
      `Elke vraag noemt haar bron op EU-niveau: Uitvoeringsverordening (EU) 2024/2690, de Technical Implementation Guidance van ENISA, de AVG of de Cyber Resilience Act. Waar een vraag maatregelen uit bijlage A van ISO/IEC 27001:2022 dient, staan die ernaast. Elke leverancier beantwoordt ${c.always} vragen; bij elke andere staat van welk antwoord ze afhangt. Dat volgt uit wat de leverancier bij zijn klanten bereikt: hun gegevens, hun systemen, hun panden, of software die hij beheert of levert. Sectorspecifieke aanvullingen (TISAX, VDA ISA, BSI C5, KRITIS) komen bovenop deze basis.`,
    source:
      "Bron: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Rechtsgrondslag",
    required: "Verplicht",
    optional: "Optioneel",
    conditional: "Voorwaardelijk",
    onlyIf: "Alleen als",
    yes: "Ja",
    no: "Nee",
    or: "of",
    license:
      "Licentie: MIT (schema) + CC BY 4.0 (inhoud). Vrij te gebruiken, te forken en aan te passen.",
    fieldCount: (n) => plural("nl", n, { one: "veld", other: "velden" }),
  },
  fr: {
    title: "Questionnaire fournisseur NIS 2",
    subtitle:
      "Un questionnaire ouvert et ancré dans le droit de l'UE pour l'évaluation des fournisseurs au titre de NIS 2",
    meta: (c) =>
      `Version ${VERSION} - Dernière mise à jour ${LAST_UPDATED} - ${c.total} champs répartis en ${c.sections} sections`,
    intro: (c) =>
      `Chaque question indique sa source au niveau de l'UE : le règlement d'exécution (UE) 2024/2690, la Technical Implementation Guidance de l'ENISA, le RGPD ou le Cyber Resilience Act. Lorsqu'elle sert des mesures de l'annexe A de l'ISO/IEC 27001:2022, celles-ci figurent à côté. Chaque fournisseur répond à ${c.always} questions ; chacune des autres indique la réponse dont elle dépend. Cela découle de ce à quoi le fournisseur accède chez ses clients : leurs données, leurs systèmes, leurs locaux, ou les logiciels qu'il exploite ou livre. Les compléments sectoriels (TISAX, VDA ISA, BSI C5, KRITIS) s'ajoutent à cette base.`,
    source:
      "Source : github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Base juridique",
    required: "Obligatoire",
    optional: "Facultatif",
    conditional: "Conditionnel",
    onlyIf: "Seulement si",
    yes: "Oui",
    no: "Non",
    or: "ou",
    license:
      "Licence : MIT (schéma) + CC BY 4.0 (contenu). Libre d'utilisation, de fork et d'adaptation.",
    fieldCount: (n) => plural("fr", n, { one: "champ", other: "champs" }),
  },
  it: {
    title: "Questionario per i fornitori NIS 2",
    subtitle:
      "Un questionario aperto e ancorato al diritto dell'UE per la valutazione dei fornitori ai sensi di NIS 2",
    meta: (c) =>
      `Versione ${VERSION} - Ultimo aggiornamento ${LAST_UPDATED} - ${c.total} campi in ${c.sections} sezioni`,
    intro: (c) =>
      `Ogni domanda indica la sua fonte a livello UE: il regolamento di esecuzione (UE) 2024/2690, la Technical Implementation Guidance dell'ENISA, il GDPR o il Cyber Resilience Act. Se serve controlli dell'allegato A della ISO/IEC 27001:2022, questi sono riportati accanto. Ogni fornitore risponde a ${c.always} domande; ciascuna delle altre indica la risposta da cui dipende. Ciò deriva da ciò a cui il fornitore accede presso i suoi clienti: i loro dati, i loro sistemi, i loro locali, o il software che gestisce o consegna. Le integrazioni settoriali (TISAX, VDA ISA, BSI C5, KRITIS) si aggiungono a questa base.`,
    source:
      "Fonte: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Base giuridica",
    required: "Obbligatorio",
    optional: "Facoltativo",
    conditional: "Condizionale",
    onlyIf: "Solo se",
    yes: "Sì",
    no: "No",
    or: "oppure",
    license:
      "Licenza: MIT (schema) + CC BY 4.0 (contenuto). Libero di usare, forkare e adattare.",
    fieldCount: (n) => plural("it", n, { one: "campo", other: "campi" }),
  },
  es: {
    title: "Cuestionario para proveedores NIS 2",
    subtitle:
      "Un cuestionario abierto y anclado en el derecho de la UE para la evaluación de proveedores conforme a NIS 2",
    meta: (c) =>
      `Versión ${VERSION} - Última actualización ${LAST_UPDATED} - ${c.total} campos en ${c.sections} secciones`,
    intro: (c) =>
      `Cada pregunta indica su fuente a nivel de la UE: el Reglamento de Ejecución (UE) 2024/2690, la Technical Implementation Guidance de ENISA, el RGPD o el Cyber Resilience Act. Cuando sirve a controles del anexo A de la ISO/IEC 27001:2022, estos figuran al lado. Todo proveedor responde ${c.always} preguntas; cada una de las demás indica la respuesta de la que depende. Eso se deriva de a qué accede el proveedor en sus clientes: sus datos, sus sistemas, sus instalaciones, o el software que opera o entrega. Los complementos sectoriales (TISAX, VDA ISA, BSI C5, KRITIS) se añaden a esta base.`,
    source:
      "Fuente: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Base jurídica",
    required: "Obligatorio",
    optional: "Opcional",
    conditional: "Condicional",
    onlyIf: "Solo si",
    yes: "Sí",
    no: "No",
    or: "o",
    license:
      "Licencia: MIT (esquema) + CC BY 4.0 (contenido). Libre para usar, bifurcar y adaptar.",
    fieldCount: (n) => plural("es", n, { one: "campo", other: "campos" }),
  },
  pl: {
    title: "Kwestionariusz dla dostawców NIS 2",
    subtitle:
      "Otwarty, zakotwiczony w prawie UE kwestionariusz do oceny dostawców w ramach NIS 2",
    meta: (c) =>
      `Wersja ${VERSION} - Ostatnia aktualizacja ${LAST_UPDATED} - ${plural("pl", c.total, { one: "pole", few: "pola", many: "pól", other: "pola" })} w ${c.sections} sekcjach`,
    intro: (c) =>
      `Każde pytanie wskazuje swoje źródło na poziomie UE: rozporządzenie wykonawcze (UE) 2024/2690, Technical Implementation Guidance ENISA, RODO lub Cyber Resilience Act. Jeśli służy zabezpieczeniom z załącznika A do ISO/IEC 27001:2022, są one podane obok. Każdy dostawca odpowiada na ${plural("pl", c.always, { one: "pytanie", few: "pytania", many: "pytań", other: "pytania" })}; przy każdym z pozostałych podano odpowiedź, od której zależy. Wynika to z tego, do czego dostawca ma dostęp u swoich klientów: do ich danych, systemów, pomieszczeń, lub z oprogramowania, które prowadzi albo dostarcza. Uzupełnienia sektorowe (TISAX, VDA ISA, BSI C5, KRITIS) są dodawane do tej podstawy.`,
    source:
      "Źródło: github.com/NISD2/nis2-supply-chain-questionnaire-schema (MIT + CC BY 4.0)",
    legalBasis: "Podstawa prawna",
    required: "Wymagane",
    optional: "Opcjonalne",
    conditional: "Warunkowe",
    onlyIf: "Tylko jeśli",
    yes: "Tak",
    no: "Nie",
    or: "lub",
    license:
      "Licencja: MIT (schemat) + CC BY 4.0 (treść). Można swobodnie używać, forkować i adaptować.",
    fieldCount: (n) =>
      plural("pl", n, { one: "pole", few: "pola", many: "pól", other: "pola" }),
  },
};

/** Required, optional, or conditional; a conditional question's own line says on what. */
export function requiredLabel(field: SupplierField, strings: ExportStrings): string {
  if (field.visibleWhen) return strings.conditional;
  return field.required ? strings.required : strings.optional;
}
