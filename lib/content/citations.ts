/**
 * Legislation citation library.
 *
 * Each entry is a schema.org Legislation node — the canonical
 * primary-source citation for a legal instrument we reference across
 * the wiki. Articles never inline these nodes; instead they reference
 * them by @id (via `mentions` and `citation` on TechArticle).
 *
 * Why this exists: schema.org's `Legislation` type encodes the EU's
 * official ELI ontology (European Legislation Identifier). Citing
 * regulations this way signals to crawlers + AI Overviews that we are
 * a primary-source-grounded publisher. No competitor emits this.
 *
 * Adding an instrument:
 *   1. Add an entry below.
 *   2. The /wiki/zitate page automatically lists it with full JSON-LD.
 *   3. Articles reference via { "@id": legislation("nis2").id }.
 */

import { baseUrl } from "@/lib/seo";

export type LegislationKey =
  | "nis2"
  | "bsig"
  | "cir-2024-2690"
  | "bsi-kritisv"
  | "cra"
  | "dora"
  | "gdpr"
  | "enisa-tig";

interface LegislationInput {
  key: LegislationKey;
  /** Full proper name. */
  name: string;
  /** Common abbreviation + English variants for alternateName. */
  alternateNames: string[];
  /** EUR-Lex CELEX or German gesetze-im-internet identifier. */
  legislationIdentifier?: string;
  legislationType: "Directive" | "Regulation" | "Act" | "Decree";
  jurisdiction: "European Union" | "Deutschland";
  /** ISO date the act was adopted. */
  legislationDate: string;
  /** ISO date it became applicable / in force. */
  legislationDateOfApplicability?: string;
  legalForce: "InForce" | "NotInForce" | "PartiallyInForce";
  passedBy: string;
  responsible?: string;
  /** Primary language of the cited version. */
  inLanguage: string;
  /** Canonical URL — EUR-Lex for EU, gesetze-im-internet for DE. */
  url: string;
  /** Stable ELI URI if available. */
  sameAs?: string;
  /** If this instrument transposes another (e.g. BSIG transposes NIS 2). */
  transposesKey?: LegislationKey;
}

const ENTRIES: LegislationInput[] = [
  {
    key: "nis2",
    name: "Richtlinie (EU) 2022/2555 (NIS 2)",
    alternateNames: [
      "NIS 2 Directive",
      "NIS2-Richtlinie",
      "Network and Information Security Directive 2",
    ],
    legislationIdentifier: "CELEX:32022L2555",
    legislationType: "Directive",
    jurisdiction: "European Union",
    legislationDate: "2022-12-14",
    legislationDateOfApplicability: "2024-10-17",
    legalForce: "InForce",
    passedBy: "European Parliament and Council of the European Union",
    responsible: "European Commission, DG CONNECT",
    inLanguage: "de-DE",
    url: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
    sameAs: "http://data.europa.eu/eli/dir/2022/2555/oj",
  },
  {
    key: "bsig",
    name: "Gesetz über das Bundesamt für Sicherheit in der Informationstechnik (BSIG)",
    alternateNames: ["BSIG", "BSI-Gesetz", "Federal Office for Information Security Act"],
    legislationType: "Act",
    jurisdiction: "Deutschland",
    legislationDate: "2009-08-14",
    legalForce: "PartiallyInForce",
    passedBy: "Deutscher Bundestag",
    responsible: "Bundesamt für Sicherheit in der Informationstechnik (BSI)",
    inLanguage: "de-DE",
    url: "https://www.gesetze-im-internet.de/bsig_2009/",
    transposesKey: "nis2",
  },
  {
    key: "cir-2024-2690",
    name: "Durchführungsverordnung (EU) 2024/2690",
    alternateNames: [
      "CIR 2024/2690",
      "Commission Implementing Regulation 2024/2690",
      "NIS 2 Durchführungsverordnung",
    ],
    legislationIdentifier: "CELEX:32024R2690",
    legislationType: "Regulation",
    jurisdiction: "European Union",
    legislationDate: "2024-10-17",
    legislationDateOfApplicability: "2024-10-17",
    legalForce: "InForce",
    passedBy: "European Commission",
    responsible: "European Commission, DG CONNECT",
    inLanguage: "de-DE",
    url: "https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj",
    sameAs: "http://data.europa.eu/eli/reg_impl/2024/2690/oj",
  },
  {
    key: "bsi-kritisv",
    name: "Verordnung zur Bestimmung kritischer Infrastrukturen (BSI-KritisV)",
    alternateNames: ["BSI-KritisV", "KRITIS-Verordnung"],
    legislationType: "Decree",
    jurisdiction: "Deutschland",
    legislationDate: "2016-04-22",
    legalForce: "InForce",
    passedBy: "Bundesregierung",
    responsible: "Bundesamt für Sicherheit in der Informationstechnik (BSI)",
    inLanguage: "de-DE",
    url: "https://www.gesetze-im-internet.de/bsi-kritisv/",
  },
  {
    key: "cra",
    name: "Verordnung (EU) 2024/2847 (Cyber Resilience Act)",
    alternateNames: ["CRA", "Cyber Resilience Act"],
    legislationIdentifier: "CELEX:32024R2847",
    legislationType: "Regulation",
    jurisdiction: "European Union",
    legislationDate: "2024-10-23",
    legislationDateOfApplicability: "2027-12-11",
    legalForce: "PartiallyInForce",
    passedBy: "European Parliament and Council of the European Union",
    responsible: "European Commission, DG CONNECT",
    inLanguage: "de-DE",
    url: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
    sameAs: "http://data.europa.eu/eli/reg/2024/2847/oj",
  },
  {
    key: "dora",
    name: "Verordnung (EU) 2022/2554 (DORA)",
    alternateNames: ["DORA", "Digital Operational Resilience Act"],
    legislationIdentifier: "CELEX:32022R2554",
    legislationType: "Regulation",
    jurisdiction: "European Union",
    legislationDate: "2022-12-14",
    legislationDateOfApplicability: "2025-01-17",
    legalForce: "InForce",
    passedBy: "European Parliament and Council of the European Union",
    responsible: "European Banking Authority, ESMA, EIOPA",
    inLanguage: "de-DE",
    url: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
    sameAs: "http://data.europa.eu/eli/reg/2022/2554/oj",
  },
  {
    key: "gdpr",
    name: "Verordnung (EU) 2016/679 (DSGVO)",
    alternateNames: ["DSGVO", "GDPR", "General Data Protection Regulation"],
    legislationIdentifier: "CELEX:32016R0679",
    legislationType: "Regulation",
    jurisdiction: "European Union",
    legislationDate: "2016-04-27",
    legislationDateOfApplicability: "2018-05-25",
    legalForce: "InForce",
    passedBy: "European Parliament and Council of the European Union",
    inLanguage: "de-DE",
    url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    sameAs: "http://data.europa.eu/eli/reg/2016/679/oj",
  },
  {
    key: "enisa-tig",
    name: "ENISA Technical Implementation Guidance for the NIS 2 Directive",
    alternateNames: ["ENISA TIG", "ENISA NIS 2 Implementation Guidance"],
    legislationType: "Regulation",
    jurisdiction: "European Union",
    legislationDate: "2025-08-01",
    legalForce: "InForce",
    passedBy: "ENISA",
    responsible: "European Union Agency for Cybersecurity (ENISA)",
    inLanguage: "en-GB",
    url: "https://www.enisa.europa.eu/publications/technical-implementation-guidance",
  },
];

function entryId(key: LegislationKey): string {
  return `${baseUrl}/wiki/zitate/${key}#legislation`;
}

/** Look up a legislation entry by key. */
export function legislation(key: LegislationKey): LegislationInput & { id: string } {
  const e = ENTRIES.find((x) => x.key === key);
  if (!e) throw new Error(`Unknown legislation: ${key}`);
  return { ...e, id: entryId(key) };
}

/** All entries — used by the /wiki/zitate index page. */
export function allLegislation(): Array<LegislationInput & { id: string }> {
  return ENTRIES.map((e) => ({ ...e, id: entryId(e.key) }));
}

/** Build the schema.org Legislation JSON-LD node for one entry. */
export function buildLegislationJsonLd(key: LegislationKey): Record<string, unknown> {
  const e = legislation(key);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    "@id": e.id,
    name: e.name,
    alternateName: e.alternateNames,
    legislationType: e.legislationType,
    legislationDate: e.legislationDate,
    legislationLegalForce: `https://schema.org/${e.legalForce}`,
    legislationJurisdiction:
      e.jurisdiction === "European Union"
        ? { "@type": "AdministrativeArea", name: "European Union" }
        : { "@type": "Country", name: e.jurisdiction },
    legislationPassedBy: { "@type": "Organization", name: e.passedBy },
    inLanguage: e.inLanguage,
    url: e.url,
  };
  if (e.legislationIdentifier) node.legislationIdentifier = e.legislationIdentifier;
  if (e.legislationDateOfApplicability)
    node.legislationDateOfApplicability = e.legislationDateOfApplicability;
  if (e.responsible)
    node.legislationResponsible = { "@type": "Organization", name: e.responsible };
  if (e.sameAs) node.sameAs = e.sameAs;
  if (e.transposesKey) node.legislationTransposes = { "@id": entryId(e.transposesKey) };
  return node;
}
