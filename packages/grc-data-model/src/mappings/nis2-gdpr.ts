// NIS 2 ↔ GDPR mapping.
//
// Sources verified verbatim against primary EU law (June 2026):
// - NIS 2: Directive (EU) 2022/2555, EUR-Lex CELEX 32022L2555
// - GDPR: Regulation (EU) 2016/679, EUR-Lex CELEX 32016R0679
// - ENISA Technical Implementation Guidance v1.0 (June 2025)
// - EDPB-EDPS Joint Opinion 4/2026 (Cybersecurity Act 2 + NIS 2 amendments)
//
// Single most important cross-reference: NIS 2 Article 35 ("Infringements
// entailing a personal data breach") is the directive-level explicit link
// between the two regimes. It mandates competent authorities to inform
// GDPR supervisory authorities when NIS 2 violations entail a personal
// data breach, and bars double-fining for the same conduct.

export type LinkType =
  /** The NIS 2 directive itself cross-references the GDPR (verbatim). */
  | "directive_explicit"
  /** The two articles use near-identical verbatim language. */
  | "verbatim_language"
  /** Same underlying data row satisfies both regimes. */
  | "shared_data"
  /** Separate reports/workflows triggered by the same event. */
  | "parallel_workflow"
  /** Same concept, different mechanics; partial overlap. */
  | "structural_overlap"
  /** Common confusion case — explicitly NOT a mapping. */
  | "no_mapping"
  /** Cross-reference for context only, no operational link. */
  | "informational";

export interface MappingRow {
  nis2Article: string;
  gdprArticle: string;
  concept: string;
  linkType: LinkType;
  notes?: string;
  /** Stable EUR-Lex anchor where primary text can be verified. */
  eurLexCitation?: string;
  /** Relevant NIS 2 recital(s). */
  nis2RecitalRef?: string;
  /** Relevant GDPR recital(s). */
  gdprRecitalRef?: string;
}

export const nis2GdprMapping: ReadonlyArray<MappingRow> = [
  // ---------------------------------------------------------------------
  // Directive-level explicit cross-references (NIS 2 itself references GDPR)
  // ---------------------------------------------------------------------
  {
    nis2Article: "Art. 35",
    gdprArticle: "Art. 4(12), Art. 33, Art. 55, Art. 56, Art. 58(2)(i)",
    concept:
      "Infringements entailing a personal data breach — competent authority must inform DPA; ne bis in idem on fines",
    linkType: "directive_explicit",
    notes:
      "Art. 35(1) NIS 2 (verbatim): where competent authorities become aware in supervision or enforcement that an infringement of Art. 21 or Art. 23 NIS 2 by an essential or important entity can entail a personal data breach as defined in Art. 4(12) GDPR which is to be notified pursuant to Art. 33 GDPR, they shall without undue delay inform the supervisory authorities referred to in Art. 55 or 56 GDPR. Art. 35(2): where DPA imposes an Art. 58(2)(i) GDPR fine, the NIS 2 competent authority shall not impose an Art. 34 NIS 2 administrative fine for an infringement arising from the same conduct. Art. 35(3): where the GDPR supervisory authority is established in another Member State, the NIS 2 competent authority informs the supervisory authority established in its own Member State.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/dir/2022/2555/oj (Art. 35)",
    nis2RecitalRef: "Recitals 106, 108",
  },

  // ---------------------------------------------------------------------
  // Verbatim language overlap (chapeau)
  // ---------------------------------------------------------------------
  {
    nis2Article: "Art. 21(1)",
    gdprArticle: "Art. 32(1)",
    concept:
      "Appropriate technical and organisational measures — verbatim language overlap",
    linkType: "verbatim_language",
    notes:
      "Both articles use nearly identical chapeau: 'appropriate technical and organisational measures', 'state of the art', 'cost of implementation'. The substantive overlap is here. NIS 2 adds 'and proportionate' and 'operational' to the measure types.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/dir/2022/2555/oj (Art. 21(1)) and https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 32(1))",
  },

  // ---------------------------------------------------------------------
  // Substantive overlaps (shared TOMs)
  // ---------------------------------------------------------------------
  {
    nis2Article: "Art. 21(2)(d)",
    gdprArticle: "Art. 28",
    concept: "Supply-chain security ↔ Processor agreements",
    linkType: "shared_data",
    notes:
      "The supplier row is the same. NIS 2 cares about supplier cybersecurity posture; GDPR Art. 28(3)(c) requires the processor contract to obligate the processor to take all Art. 32 GDPR measures. The GDPR DPA is the contractual baseline; NIS 2 adds risk-based ongoing oversight (Art. 21(2)(d) + Art. 21(3)).",
    eurLexCitation: "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 28)",
  },
  {
    nis2Article: "Art. 21(2)(h)",
    gdprArticle: "Art. 32(1)(a)",
    concept: "Cryptography and encryption measures",
    linkType: "shared_data",
    notes:
      "Same TOMs entry tagged with both regimes. Note: GDPR Art. 32(1)(a) names pseudonymisation alongside encryption — NIS 2 Art. 21(2)(h) does not.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 32(1)(a))",
  },
  {
    nis2Article: "Art. 21(2)(c)",
    gdprArticle: "Art. 32(1)(c)",
    concept:
      "Business continuity, recovery from incident, availability and resilience",
    linkType: "shared_data",
    notes:
      "GDPR Art. 32(1)(c): 'the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident'. NIS 2 Art. 21(2)(c) covers BCP + crisis management more broadly.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 32(1)(c))",
  },
  {
    nis2Article: "Art. 21(2)(f)",
    gdprArticle: "Art. 32(1)(d)",
    concept: "Effectiveness assessment of security measures",
    linkType: "shared_data",
    notes:
      "GDPR Art. 32(1)(d): 'a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures'. NIS 2 Art. 21(2)(f) requires the same in the cybersecurity context. Same operational artefact satisfies both.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 32(1)(d))",
  },
  {
    nis2Article: "Art. 21(2)(i)",
    gdprArticle: "Art. 28(3)(b), Art. 32",
    concept: "HR security, confidentiality, access control",
    linkType: "shared_data",
    notes:
      "Art. 28(3)(b) GDPR requires persons authorised to process to be bound by confidentiality. NIS 2 Art. 21(2)(i) covers HR security + access control + asset management as the cybersecurity equivalent.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 28(3)(b))",
  },
  {
    nis2Article: "Art. 21(2)(j)",
    gdprArticle: "Art. 32 (implicit)",
    concept:
      "MFA, continuous authentication, secure communications and emergency comms",
    linkType: "structural_overlap",
    notes:
      "GDPR Art. 32 does not name MFA explicitly. The 'appropriate measures' clause implicitly covers it. CIR 2024/2690 explicitly mandates MFA for 11 digital-service-provider categories. For other entities, Art. 21(1) proportionality applies.",
  },

  // ---------------------------------------------------------------------
  // Training (two distinct NIS 2 obligations map to GDPR Art. 39(1)(b))
  // ---------------------------------------------------------------------
  {
    nis2Article: "Art. 20(2)",
    gdprArticle: "Art. 39(1)(b)",
    concept: "Management body training",
    linkType: "structural_overlap",
    notes:
      "NIS 2 Art. 20(2) requires management body training; non-delegable per §38(3) BSIG. GDPR Art. 39(1)(b) tasks the DPO with awareness-raising and training of staff (including management). Different audiences, distinct obligations.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 39(1)(b))",
  },
  {
    nis2Article: "Art. 21(2)(g)",
    gdprArticle: "Art. 39(1)(b)",
    concept: "Basic cyber hygiene practices and cybersecurity training (staff)",
    linkType: "structural_overlap",
    notes:
      "NIS 2 Art. 21(2)(g): cyber hygiene + training for all staff. GDPR Art. 39(1)(b): DPO oversees awareness-raising and training 'of staff involved in processing operations'. GDPR scope is data-protection-specific and may be a staff subset; NIS 2 scope is broader.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 39(1)(b))",
  },

  // ---------------------------------------------------------------------
  // Parallel workflows (same event, two separate reports)
  // ---------------------------------------------------------------------
  {
    nis2Article: "Art. 23",
    gdprArticle: "Art. 33, Art. 34",
    concept: "Incident notification (parallel workflows)",
    linkType: "parallel_workflow",
    notes:
      "Same incident may trigger both: NIS 2 Art. 23 24h/72h/intermediate/1mo to CSIRT; GDPR Art. 33 72h to supervisory authority; GDPR Art. 34 to data subjects when high risk. Different recipients, thresholds, and content. Until Art. 23a NIS 2 (Digital Omnibus 2026) Single Entry Point applies (~2028), both notifications must be filed in parallel.",
    eurLexCitation:
      "https://eur-lex.europa.eu/eli/dir/2022/2555/oj (Art. 23) and https://eur-lex.europa.eu/eli/reg/2016/679/oj (Art. 33, Art. 34)",
    nis2RecitalRef: "Recital 106 (single entry point)",
  },

  // ---------------------------------------------------------------------
  // Explicit non-mapping (prevent future confusion)
  // ---------------------------------------------------------------------
  {
    nis2Article: "(none)",
    gdprArticle: "Art. 30",
    concept:
      "Records of processing activities — explicitly NOT a supplier register",
    linkType: "no_mapping",
    notes:
      "GDPR Art. 30 requires the controller's records of its own processing activities (purposes, data categories, recipients, retention, security summary). Art. 30(1)(d) describes CATEGORIES of recipients, not a list of individual suppliers. The correct GDPR analog for NIS 2 Art. 21(2)(d) supply-chain security is Art. 28 (Processor), not Art. 30. This row exists to prevent future authors from re-introducing this common error.",
  },
];

export function findByNis2Article(article: string): ReadonlyArray<MappingRow> {
  return nis2GdprMapping.filter((row) => row.nis2Article === article);
}

export function findByGdprArticle(article: string): ReadonlyArray<MappingRow> {
  return nis2GdprMapping.filter((row) => row.gdprArticle.includes(article));
}

export function findByLinkType(linkType: LinkType): ReadonlyArray<MappingRow> {
  return nis2GdprMapping.filter((row) => row.linkType === linkType);
}
