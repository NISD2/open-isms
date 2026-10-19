/**
 * Cross-framework satisfaction pairs.
 *
 * Each tuple is `[codeA, codeB, rationale, kind?]` where `kind` defaults to
 * `"overlapping"`. Pairs marked `"equivalent"` describe a relationship where
 * the SAME underlying artefact (same record, same methodology, same incident
 * row) satisfies both requirements; the propagation engine treats those as
 * transitively composable. Pairs marked `"overlapping"` describe partial
 * conceptual overlap: a hint for the other framework, never credit.
 *
 * CIR Annex sub-point numbers in rationales are verified against the OJ text
 * of CIR (EU) 2024/2690 (point 5 = 5.1/5.2 only, point 7 = 7.1-7.3,
 * point 8 = 8.1/8.2 only, point 9 = 9.1-9.3). Separate legal notification
 * duties (NIS2 vs GDPR vs CRA vs AI Act) are never "equivalent": the filings
 * go to different authorities on different clocks, even when they share the
 * underlying event.
 */

import {
  getIso27001RequirementsForCategory,
  iso27001Categories,
} from "./frameworks/iso27001";
import { getNis2RequirementsForCategory, nis2Categories } from "./frameworks/nis2";
import { enisaIso27001Pairs } from "./mappings/enisa-iso27001";

export type EquivalenceKind = "equivalent" | "overlapping";

export type SatisfactionPair = readonly [
  codeA: string,
  codeB: string,
  rationale: string,
  kind?: EquivalenceKind,
];

export const nis2GdprSatisfactionPairs: SatisfactionPair[] = [
  [
    "5.1",
    "G-DPA.1",
    "Same supplier rows feed both; neither the register nor the 5.2 clauses is the Art. 28 agreement.",
  ],
  [
    "5.2",
    "G-DPA.1",
    "CIR 5.1.4 covers part of an Art. 28(3) DPA: its cybersecurity requirements (a) speak to Art. 28(3)(c), its audit rights (e) to (h), its subcontracting rules (g) to (d), its termination retrieval and disposal (h) to (g). Art. 28(3) points (a), (b), (e) and (f) have no CIR counterpart: documented instructions, confidentiality, assistance with data subject rights, and assistance with Arts. 32 to 36. Nor does CIR 5.1.4 carry the Art. 28(3) statement of subject-matter, duration, nature, purpose, data types and categories of data subjects. CIR 5.1.4 clauses are also owed only 'where appropriate'; Art. 28(3) is unconditional. A 5.2 clause set is not a DPA.",
  ],
  [
    "5.2",
    "G-DPA.2",
    "Same supplier rows hold sub-processor lists; the Art. 28(2) authorisation is not recorded.",
  ],

  [
    "2.1",
    "G-ROP.1",
    "The 2.1 method rates assets; Art. 30 records processing activities.",
  ],
  [
    "2.2",
    "G-ROP.1",
    "Asset rows inform the Art. 30 record, but a RoPA documents processing activities (purposes, recipients, retention), not IT assets.",
  ],
  [
    "2.3",
    "G-ROP.1",
    "Asset ratings can point to high-risk processing (Art. 35); Art. 30 records no risk.",
  ],

  [
    "3.1",
    "G-BRC.1",
    "The incident plan can carry the Art. 33 notification but lacks its risk test and the late-filing reasons.",
  ],
  [
    "3.2",
    "G-BRC.2",
    "Incident rows can hold Art. 33(5) facts, effects and remedy, but only for IT incidents; Art. 4(12) is wider.",
  ],
  [
    "3.3",
    "G-BRC.1",
    "Same underlying event, separate filings: the NIS2 24h/72h/1-month cascade goes to the BSI/BBK Meldestelle, the GDPR Art. 33 notification, in phases if need be (Art. 33(4)), to the data protection authority.",
  ],
  [
    "3.5",
    "G-BRC.2",
    "Post-incident review evidence overlaps the Art. 33(5) breach documentation; the BSI final report itself is §32(1) Nr. 4 BSIG, tracked under 3.3.",
  ],

  // Art. 32(1) is the widest overlap between the two regimes and until now the
  // narrowest here: G-TOM.1 was credited by 2.4 alone, a signature. Meanwhile
  // mappings/nis2-gdpr.ts already documented five further Art. 21(2) points
  // that land on Art. 32(1), and none of them had a pair, so a company could
  // finish the whole NIS2 cryptography, backup, access control, authentication
  // and effectiveness programme without any of it reaching Art. 32. The rows
  // below close that, one per mapping row, and every one of them is
  // "overlapping": Art. 32(1) is a duty to have and document the whole measure
  // set, so no single NIS2 requirement is ever the same artefact.
  [
    "2.4",
    "G-TOM.1",
    "The risk treatment plan lists measures Art. 32 asks for too; Art. 32 asks for the measures, not an approval.",
  ],
  [
    "9.1",
    "G-TOM.1",
    "Art. 21(2)(h) ↔ Art. 32(1)(a): the CIR 9.1 cryptography policy is the documented position on encryption that Art. 32(1)(a) expects. Scope differs in one direction only: Art. 32(1)(a) names pseudonymisation alongside encryption and NIS2 does not, so the policy can satisfy the encryption half and leave pseudonymisation unaddressed.",
  ],
  [
    "9.2",
    "G-TOM.1",
    "Art. 21(2)(h) ↔ Art. 32(1)(a): encryption at rest and in transit is the same control under both regimes. NIS2 applies it to network and information systems, Art. 32 to personal data, so the measure carries over while the scope statement does not.",
  ],
  [
    "4.4",
    "G-TOM.1",
    "Art. 21(2)(c) ↔ Art. 32(1)(c): 'the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident' is what a tested backup and restore programme evidences. A restore that has never been tested evidences neither.",
  ],
  [
    "4.3",
    "G-TOM.1",
    "Art. 21(2)(c) ↔ Art. 32(1)(c): the disaster recovery plan carries the recovery-time side of the same restore duty. Art. 32(1)(c) bounds it by 'in a timely manner' rather than by a stated RTO, so the NIS2 target is evidence for it and not a substitute.",
  ],
  [
    "7.1",
    "G-TOM.1",
    "Art. 21(2)(f) ↔ Art. 32(1)(d): 'a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures'. The CIR 7.1 KPI records are that process running. Art. 32(1)(d) is the one enumerated item creating an ongoing duty rather than a one-off measure.",
  ],
  [
    "7.2",
    "G-TOM.1",
    "Art. 21(2)(f) ↔ Art. 32(1)(d): the internal audit programme is the assessing and evaluating half of the same clause, where 7.1 is the measuring half.",
  ],
  [
    "10.1",
    "G-TOM.1",
    "Art. 21(2)(i) ↔ Art. 32(1)(b): the access control policy is the primary evidence for 'ongoing confidentiality' of processing systems. Art. 32(1)(b) also covers integrity, availability and resilience, which this requirement does not reach.",
  ],
  [
    "11.1",
    "G-TOM.1",
    "Art. 21(2)(j) ↔ Art. 32 by implication: Art. 32 nowhere names MFA, and its 'appropriate measures' clause is what carries it. CIR 11.7.1 asks for MFA or continuous authentication where appropriate, for the CIR's entity types; for everyone else Art. 21(1) proportionality decides, exactly as Art. 32(1) does. Never 'equivalent': one is a named control, the other an open standard that the control happens to meet.",
  ],

  // Art. 34 had no pair at all, though NIS2 carries the same duty shape: Art.
  // 23(1) has entities notify the recipients of their
  // services of significant incidents likely to adversely affect service
  // provision. Tell the affected people, not only the authority. The triggers
  // and the addressees are different, so this is where the pair stops.
  [
    "3.5",
    "G-BRC.3",
    "Art. 23(1) ↔ Art. 34: both require telling people outside the authority about an incident, and the post-incident communication is where a company decides who hears what. The duties do not merge. NIS2 addresses the recipients of the service when provision is adversely affected; Art. 34 addresses the data subjects when the breach is likely to result in a high risk to their rights and freedoms, and the Art. 34(3) carve-outs apply to the GDPR side only.",
  ],
];

export const aiActNis2SatisfactionPairs: SatisfactionPair[] = [
  [
    "AI-LIT.1",
    "8.1",
    "AI literacy training programme overlaps with the topic-specific IT security rules under CIR 1.1.1(i).",
  ],
  [
    "AI-LIT.2",
    "1.1",
    "Management body AI training (Art. 4 + 26(2)) overlaps with the §38(3) BSIG management cybersecurity training.",
  ],
  [
    "AI-INV.1",
    "2.2",
    "Same inventory: AI systems are assets, so one register satisfies both the NIS2 asset list and the AI Act inventory.",
    "equivalent",
  ],
  [
    "AI-RSK.1",
    "2.1",
    "The process shape carries over: CIR 2.1.2 requires identification, analysis, assessment and treatment of risks, which is the loop Art. 9(2) describes. The scope does not: CIR 2.1 is bounded to risks to network and information systems, while Art. 9 covers risks to health, safety and fundamental rights and pulls in post-market monitoring data (Art. 9(2)(c)). Both sides require residual risk to be accepted, but against different criteria (Art. 9(5) vs CIR 2.1.1). Art. 9(10) lets you combine the procedures; it does not merge the duties.",
  ],
  [
    "AI-RSK.2",
    "2.3",
    "Annual AI risk review feeds the same asset-classification update NIS2 expects.",
    "equivalent",
  ],
  [
    "AI-INC.1",
    "3.1",
    "AI incident response procedure overlaps with the NIS2 incident handling policy under CIR 3.1.",
  ],
  [
    "AI-INC.2",
    "3.3",
    "Same underlying event, separate filings: the AI Act Art. 73 report goes to the market surveillance authority, the NIS2 24h/72h cascade to the BSI Meldestelle. Art. 73(2) sets 15 days, but a serious and irreversible disruption of the management or operation of critical infrastructure (Art. 3(49)(b)) is due within two days under Art. 73(3), and a death within 10 days under Art. 73(4). Entities in NIS2 scope should plan for the two-day clock.",
  ],
];

export const aiActGdprSatisfactionPairs: SatisfactionPair[] = [
  [
    "AI-FRI.1",
    "G-TOM.1",
    "Fundamental Rights Impact Assessment overlaps with the GDPR Art. 35 DPIA when the AI system processes personal data.",
  ],
  [
    "AI-TRA.1",
    "G-ROP.1",
    "AI Act Art. 50 transparency to end users overlaps with GDPR Art. 13/14 information duties when the AI processes personal data.",
  ],
  [
    "AI-RSK.1",
    "G-TOM.1",
    "AI risk management framework under Art. 9 overlaps with the technical and organisational measures GDPR Art. 32 requires.",
  ],
  [
    "AI-DOC.1",
    "G-ROP.1",
    "Annex IV technical documentation overlaps with the GDPR Art. 30 records of processing when the AI system processes personal data.",
  ],
  [
    "AI-INC.1",
    "G-BRC.1",
    "AI Act Art. 73 incident response procedure overlaps with the GDPR Art. 33 breach response procedure when the incident involves personal data.",
  ],
];

export const craNis2SatisfactionPairs: SatisfactionPair[] = [
  [
    "CRA-VLN.1",
    "6.3",
    "Vulnerability handling procedures overlap with NIS2 vulnerability and patch management requirements.",
  ],
  [
    "CRA-VLN.3",
    "6.4",
    "The maker issues updates; 6.4 has the entity install them. No shared record.",
  ],
  [
    "CRA-INC.1",
    "3.1",
    "Different artefacts: CIR 3.1 is the internal incident handling policy, CRA Art. 14(2)(a) is a 24h early warning filed to the CSIRT coordinator and ENISA via the Art. 16 platform. The policy is where you name who files it; having the policy does not discharge the filing.",
  ],
  [
    "CRA-INC.2",
    "3.3",
    "Same event, separate filings: CRA Art. 14(2)(b) notifies the exploited product vulnerability to the CSIRT coordinator and ENISA, NIS2 Art. 23(4)(b) the entity's own significant incident to its CSIRT.",
  ],
  [
    "CRA-INC.3",
    "3.5",
    "The CRA 14-day report (Art. 14(2)(c)) names the fix, not a root cause; the fix feeds the NIS2 post-incident review. NIS2's final report (Art. 23(4)(d)) is 3.3.",
  ],
  [
    "CRA-IMP.1",
    "5.1",
    "Importer due diligence on manufacturers overlaps with the NIS2 supplier security policy.",
  ],
  [
    "CRA-IMP.2",
    "5.2",
    "Distributor checks overlap with NIS2 supplier contractual security clauses.",
  ],
  [
    "CRA-MFG.1",
    "2.1",
    "The per-product assessment can reuse the 2.1 method, but Art. 13(3) analyses each product's use.",
  ],
  [
    "CRA-MFG.2",
    "2.4",
    "Our practice: the CRA wants no sign-off on Art. 13(5) due diligence; management signs it here, as for 2.4.",
  ],
];

export const craAiActSatisfactionPairs: SatisfactionPair[] = [
  [
    "CRA-ESS.1",
    "AI-RSK.1",
    "Essential cybersecurity requirements (Annex I) overlap with AI risk management for high-risk AI systems with embedded digital elements. CRA Art. 12(1) deems them to meet AI Act Art. 15 on cybersecurity, not on accuracy or robustness; it does not reach the Art. 9 risk management system AI-RSK.1 tracks.",
  ],
  [
    "CRA-DOC.1",
    "AI-DOC.1",
    "For a product that is also high-risk AI, CRA Art. 31(3) wants one technical file with Annex VII and AI Act Annex IV.",
  ],
  [
    "CRA-INC.1",
    "AI-INC.1",
    "Active-exploitation reporting overlaps with the AI Act incident response procedure when the AI system is also a product with digital elements.",
  ],
  [
    "CRA-DOC.1",
    "AI-DOC.2",
    "Annex VII holds no logging evidence; the AI Act Art. 12 logs are a capability of the system itself.",
  ],
];

export const craGdprSatisfactionPairs: SatisfactionPair[] = [
  [
    "CRA-ESS.1",
    "G-TOM.1",
    "Essential cybersecurity requirements (Annex I) overlap with the technical and organisational measures GDPR Art. 32 requires when the product processes personal data.",
  ],
  [
    "CRA-VLN.1",
    "G-BRC.1",
    "Vulnerability handling procedures feed the GDPR Art. 33 breach response when a vulnerability leads to a personal-data breach.",
  ],
];

/**
 * ISO/IEC 27001:2022 to NIS2, from two sources. The same-record links below are our reading, link
 * by link: one artefact answers both, so a signature on one credits the other. Every other link is
 * an overlap taken from ENISA's mapping table (mappings/enisa-iso27001.ts) and credits nothing.
 * Where both name the same pair, the same-record link stands.
 */
const iso27001Nis2SameRecordPairs: SatisfactionPair[] = [
  [
    "IS-5.1",
    "1.3",
    "Cl. 5.1(c) resource commitment is the same resourcing decision the 1.3 budget sign-off evidences (CIR 1.1.1(e)).",
    "equivalent",
  ],
  [
    "A.5.2",
    "1.2",
    "Same roles artefact: A.5.2 information security roles and responsibilities is the role assignment 1.2 records (CIR 1.2).",
    "equivalent",
  ],
  [
    "IS-6.1",
    "2.1",
    "Same methodology document: the Cl. 6.1 risk assessment methodology is the risk management methodology NIS2 CIR 2.1 requires.",
    "equivalent",
  ],
  [
    "IS-8.2",
    "2.3",
    "Same risk register: Cl. 8.2 operational risk assessment results are the 2.3 register rows.",
    "equivalent",
  ],
  [
    "IS-8.3",
    "2.3",
    "Same treatment records: Cl. 8.3 risk treatment implements the 2.3 register's treatment decisions.",
    "equivalent",
  ],
  [
    "A.5.9",
    "2.2",
    "Asset inventory (A.5.9) is the same register NIS2 CIR 12.4 / §30(2) Nr. 9 BSIG requires for asset identification.",
    "equivalent",
  ],
  [
    "A.5.24",
    "3.1",
    "Same incident response procedure: A.5.24 incident management planning produces the policy NIS2 CIR 3.1 requires.",
    "equivalent",
  ],
  [
    "A.5.25",
    "3.2",
    "Same event assessment process: A.5.25 covers the detection and logging NIS2 CIR 3.2/3.4 expects.",
    "equivalent",
  ],
  [
    "A.5.26",
    "3.1",
    "Response to IS incidents (A.5.26) implements the same response procedure; same incident record.",
    "equivalent",
  ],
  [
    "A.5.26",
    "3.3",
    "Response execution under A.5.26 and the NIS2 24h/72h CSIRT cascade share the same underlying event record.",
    "equivalent",
  ],
  [
    "A.5.27",
    "3.5",
    "Same lessons-learned report: A.5.27 output is the post-incident review NIS2 CIR 3.6 requires.",
    "equivalent",
  ],
  [
    "A.5.29",
    "4.1",
    "Same continuity policy: A.5.29 IS continuity policy is the BCP framework document NIS2 CIR 4.1 requires.",
    "equivalent",
  ],
  [
    "A.5.30",
    "4.3",
    "Same ICT readiness plan: A.5.30 maps directly to the NIS2 ICT continuity requirements; one plan satisfies both.",
    "equivalent",
  ],
  [
    "A.8.13",
    "4.4",
    "Same backup programme: A.8.13 backup controls satisfy the NIS2 backup management requirements under CIR 4.2.",
    "equivalent",
  ],
  [
    "A.5.19",
    "5.1",
    "Same supplier security policy: A.5.19 supplier relationship IS policy is the policy NIS2 CIR 5.1 requires.",
    "equivalent",
  ],
  [
    "A.5.20",
    "5.2",
    "Same contractual clauses: A.5.20 IS requirements in supplier agreements cover the clauses NIS2 CIR 5.1.4 mandates.",
    "equivalent",
  ],
  [
    "A.5.21",
    "5.3",
    "Same supplier risk assessment process satisfies both A.5.21 and the NIS2 CIR 5.1.6 monitoring obligation.",
    "equivalent",
  ],
  [
    "A.8.8",
    "6.3",
    "Same vulnerability programme: A.8.8 technical vulnerability management is the scanning programme NIS2 CIR 6.5/6.10 requires.",
    "equivalent",
  ],
  [
    "A.8.8",
    "6.4",
    "Same patch programme: A.8.8 timely remediation maps to the patch management cadence NIS2 CIR 6.6 mandates.",
    "equivalent",
  ],
  [
    "A.8.32",
    "6.5",
    "Same change record: A.8.32 change management is the CIR 6.4 change process requirement 6.5 tracks; both write the same change_request rows.",
    "equivalent",
  ],
  [
    "IS-9.1",
    "7.1",
    "Same KPI records: Cl. 9.1 monitoring, measurement and analysis produces the KPI evidence NIS2 CIR 7.1/7.2 requires.",
    "equivalent",
  ],
  [
    "IS-9.2",
    "7.2",
    "Internal audit programme (Cl. 9.2) is the independent review CIR 2.3 requires; same audit records.",
    "equivalent",
  ],
  [
    "IS-9.3",
    "7.3",
    "Same CEO sign-off artefact: Cl. 9.3 management review is the regular management reporting CIR 2.2.1 requires.",
    "equivalent",
  ],
  [
    "A.5.35",
    "7.2",
    "Same audit programme: A.5.35 independent review of information security is the CIR 2.3 independent review.",
    "equivalent",
  ],
  [
    "A.6.3",
    "8.2",
    "Same training programme satisfies both A.6.3 employee awareness and NIS2 CIR 8.1 awareness raising.",
    "equivalent",
  ],
  [
    "IS-7.2",
    "8.2",
    "Same training records: Cl. 7.2 competence records document the staff awareness NIS2 CIR 8.1 expects.",
    "equivalent",
  ],
  [
    "A.8.24",
    "9.1",
    "Same cryptography policy: A.8.24 is the policy NIS2 CIR 9.1 / BSI TR-02102 requires.",
    "equivalent",
  ],
  [
    "A.5.15",
    "10.1",
    "Same access control policy: A.5.15 is the policy NIS2 CIR 11.1 requires.",
    "equivalent",
  ],
  [
    "A.5.16",
    "10.2",
    "Same IAM programme: A.5.16 identity management covers the identity and access management NIS2 CIR 11.2 mandates.",
    "equivalent",
  ],
  [
    "A.5.18",
    "10.3",
    "Same access-rights records: A.5.18 produces the change-controlled access evidence NIS2 CIR 11.2 expects.",
    "equivalent",
  ],
  [
    "A.8.5",
    "11.1",
    "Same MFA control: A.8.5 secure authentication implements the MFA/continuous-authentication requirement NIS2 CIR 11.7 mandates.",
    "equivalent",
  ],
];

const sameRecord = new Set(
  iso27001Nis2SameRecordPairs.map(([iso, nis2]) => `${iso}|${nis2}`),
);

export const iso27001Nis2SatisfactionPairs: SatisfactionPair[] = [
  ...iso27001Nis2SameRecordPairs,
  ...enisaIso27001Pairs(
    nis2Categories.flatMap((category) => getNis2RequirementsForCategory(category.slug)),
    new Set(
      iso27001Categories.flatMap((category) =>
        getIso27001RequirementsForCategory(category.slug).map(({ code }) => code),
      ),
    ),
  ).filter(([iso, nis2]) => !sameRecord.has(`${iso}|${nis2}`)),
];

export const allSatisfactionPairs: SatisfactionPair[] = [
  ...nis2GdprSatisfactionPairs,
  ...aiActNis2SatisfactionPairs,
  ...aiActGdprSatisfactionPairs,
  ...craNis2SatisfactionPairs,
  ...craAiActSatisfactionPairs,
  ...craGdprSatisfactionPairs,
  ...iso27001Nis2SatisfactionPairs,
];
