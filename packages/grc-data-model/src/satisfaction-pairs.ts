/**
 * Cross-framework satisfaction pairs.
 *
 * Each tuple is `[codeA, codeB, rationale, kind?]` where `kind` defaults to
 * `"overlapping"`. Pairs marked `"equivalent"` describe a relationship where
 * the SAME underlying artefact (same record, same methodology, same incident
 * row) satisfies both requirements; the propagation engine treats those as
 * transitively composable. Pairs marked `"overlapping"` describe partial
 * conceptual overlap; propagation credits the direct neighbour but does not
 * compose transitively.
 *
 * CIR Annex sub-point numbers in rationales are verified against the OJ text
 * of CIR (EU) 2024/2690 (point 5 = 5.1/5.2 only, point 7 = 7.1-7.3,
 * point 8 = 8.1/8.2 only, point 9 = 9.1-9.3). Separate legal notification
 * duties (NIS2 vs GDPR vs CRA vs AI Act) are never "equivalent": the filings
 * go to different authorities on different clocks, even when they share the
 * underlying event.
 */
export type EquivalenceKind = "equivalent" | "overlapping";

export type SatisfactionPair = readonly [
  codeA: string,
  codeB: string,
  rationale: string,
  kind?: EquivalenceKind,
];

export const nis2GdprSatisfactionPairs: SatisfactionPair[] = [
  ["5.1", "G-DPA.1", "Same supplier rows feed both; the Art. 28 DPA itself is evidenced by the 5.2 contract clauses, not by the register alone."],
  ["5.2", "G-DPA.1", "Contractual security clauses cover the same processor obligations as Art. 28 DPAs.", "equivalent"],
  ["5.2", "G-DPA.2", "Sub-processor lists live on the same supplier rows used for NIS2 governance and Art. 28(2)/(4).", "equivalent"],

  ["2.1", "G-ROP.1", "Asset classification methodology defines the systems recorded in the Art. 30 register."],
  ["2.2", "G-ROP.1", "Asset rows inform the Art. 30 record, but a RoPA documents processing activities (purposes, recipients, retention), not IT assets."],
  ["2.3", "G-ROP.1", "Asset criticality under NIS2 informs Art. 30/35 high-risk processing."],

  ["3.1", "G-BRC.1", "Same incident response procedure satisfies the NIS2 detection-to-notification flow and the GDPR Art. 33 breach response.", "equivalent"],
  ["3.2", "G-BRC.2", "Same incident rows; NIS2 detection/logging ↔ Art. 33(5) breach documentation.", "equivalent"],
  ["3.3", "G-BRC.1", "Same underlying event, separate filings: the NIS2 24h/72h/1-month cascade goes to the BSI/BBK Meldestelle, the GDPR Art. 33 single 72h notification to the data protection authority."],
  ["3.5", "G-BRC.2", "Post-incident review evidence overlaps the Art. 33(5) breach documentation; the BSI final report itself is §32(1) Nr. 4 BSIG, tracked under 3.3."],

  ["2.4", "G-TOM.1", "CEO sign-off on the Art. 21(2) risk treatment plan attests the TOMs posture Art. 32 requires."],
];

export const aiActNis2SatisfactionPairs: SatisfactionPair[] = [
  ["AI-LIT.1", "8.1", "AI literacy training programme overlaps with the topic-specific IT security rules under CIR 1.1.1(i)."],
  ["AI-LIT.2", "1.1", "Management body AI training (Art. 4 + 26(2)) overlaps with the §38(3) BSIG management cybersecurity training."],
  ["AI-INV.1", "2.2", "Same inventory: AI systems are assets, so one register satisfies both the NIS2 asset list and the AI Act inventory.", "equivalent"],
  ["AI-RSK.1", "2.1", "AI risk management framework reuses the methodology defined for NIS2 risk management (CIR 2.1).", "equivalent"],
  ["AI-RSK.2", "2.3", "Annual AI risk review feeds the same asset-classification update NIS2 expects.", "equivalent"],
  ["AI-INC.1", "3.1", "AI incident response procedure overlaps with the NIS2 incident handling policy under CIR 3.1."],
  ["AI-INC.2", "3.3", "Same underlying event, separate filings: the AI Act Art. 73 report goes to the market surveillance authority (15 days), the NIS2 24h/72h cascade to the BSI Meldestelle."],
];

export const aiActGdprSatisfactionPairs: SatisfactionPair[] = [
  ["AI-FRI.1", "G-TOM.1", "Fundamental Rights Impact Assessment overlaps with the GDPR Art. 35 DPIA when the AI system processes personal data."],
  ["AI-TRA.1", "G-ROP.1", "AI Act Art. 50 transparency to end users overlaps with GDPR Art. 13/14 information duties when the AI processes personal data."],
  ["AI-RSK.1", "G-TOM.1", "AI risk management framework under Art. 9 overlaps with the technical and organisational measures GDPR Art. 32 requires."],
  ["AI-DOC.1", "G-ROP.1", "Annex IV technical documentation overlaps with the GDPR Art. 30 records of processing when the AI system processes personal data."],
  ["AI-INC.1", "G-BRC.1", "AI Act Art. 73 incident response procedure overlaps with the GDPR Art. 33 breach response procedure when the incident involves personal data."],
];

export const craNis2SatisfactionPairs: SatisfactionPair[] = [
  ["CRA-VLN.1", "6.3", "Vulnerability handling procedures overlap with NIS2 vulnerability and patch management requirements."],
  ["CRA-VLN.3", "6.4", "Security updates without delay align with the NIS2 patch management cadence."],
  ["CRA-INC.1", "3.1", "Active-exploitation reporting reuses the same incident response procedure NIS2 expects.", "equivalent"],
  ["CRA-INC.2", "3.3", "Same underlying event, separate filings: CRA Art. 14 notifies the exploited product vulnerability to the CSIRT coordinator and ENISA, NIS2 §32 notifies the entity's own significant incident to the BSI."],
  ["CRA-INC.3", "3.5", "CRA 14-day final report and the NIS2 post-incident review share root-cause evidence; the NIS2 final report to the BSI is §32(1) Nr. 4, tracked under 3.3."],
  ["CRA-IMP.1", "5.1", "Importer due diligence on manufacturers overlaps with the NIS2 supplier security policy."],
  ["CRA-IMP.2", "5.2", "Distributor checks overlap with NIS2 supplier contractual security clauses."],
  ["CRA-MFG.1", "2.1", "Per-product cybersecurity risk assessment reuses the methodology defined for NIS2 risk management (CIR 2.1).", "equivalent"],
  ["CRA-MFG.2", "2.4", "Management body sign-off on CRA risk assessment overlaps with the CEO sign-off NIS2 risk treatment plan requires."],
];

export const craAiActSatisfactionPairs: SatisfactionPair[] = [
  ["CRA-ESS.1", "AI-RSK.1", "Essential cybersecurity requirements (Annex I) overlap with AI risk management for high-risk AI systems with embedded digital elements; Art. 12 CRA presumption-of-conformity links the two."],
  ["CRA-DOC.1", "AI-DOC.1", "Annex VII technical documentation overlaps with AI Act Annex IV for products that are both PDE and high-risk AI."],
  ["CRA-INC.1", "AI-INC.1", "Active-exploitation reporting overlaps with the AI Act incident response procedure when the AI system is also a product with digital elements."],
  ["CRA-DOC.1", "AI-DOC.2", "Annex VII technical documentation includes the logging and traceability evidence Art. 12 AI Act requires."],
];

export const craGdprSatisfactionPairs: SatisfactionPair[] = [
  ["CRA-ESS.1", "G-TOM.1", "Essential cybersecurity requirements (Annex I) overlap with the technical and organisational measures GDPR Art. 32 requires when the product processes personal data."],
  ["CRA-VLN.1", "G-BRC.1", "Vulnerability handling procedures feed the GDPR Art. 33 breach response when a vulnerability leads to a personal-data breach."],
];

export const iso27001Nis2SatisfactionPairs: SatisfactionPair[] = [
  // ── Governance (NIS2 1.x) ────────────────────────────────────────────────────
  ["IS-5.1", "1.3", "Cl. 5.1(c) resource commitment is the same resourcing decision the 1.3 budget sign-off evidences (CIR 1.1.1(e)).", "equivalent"],
  ["IS-5.1", "1.4", "Leadership commitment under Cl. 5.1 supports the liability briefing 1.4 documents; ISO defines no liability-acknowledgment artefact (§38(2) BSIG is a liability rule, not a sign-off duty)."],
  ["IS-5.2", "1.2", "The Cl. 5.2 policy assigns responsibilities that 1.2's team mapping reflects; the policy document itself is a different artefact (see 2.4)."],
  ["IS-5.2", "2.4", "The Cl. 5.2 information security policy is the document the 2.4 IS-Leitlinie sign-off approves; scopes differ (full ISMS policy vs risk-acceptance sign-off)."],
  ["IS-5.3", "1.2", "Documented roles and responsibilities (Cl. 5.3) fulfil the governance structure NIS2 Art. 20(1) requires."],
  ["A.5.1",  "1.2", "Policies for information security (A.5.1) overlap with the governance framework NIS2 §30(1) requires."],
  ["A.5.2",  "1.2", "Same roles artefact: A.5.2 information security roles and responsibilities is the role assignment 1.2 records (CIR 1.2).", "equivalent"],
  ["A.5.31", "1.2", "The legal-requirements register (A.5.31) keeps regulatory duties owned by named roles; its NIS2 home is the 12.1 classification step."],
  ["A.5.31", "12.1", "Same determine-your-legal-position work: the A.5.31 register documents the NIS2/BSIG applicability that 12.1 assesses."],
  ["IS-9.3", "1.3", "Management review records (Cl. 9.3) evidence the resourcing oversight the 1.3 budget sign-off documents (CIR 1.1.1(e))."],

  // ── Risk management (NIS2 2.x) ───────────────────────────────────────────────
  ["IS-6.1", "2.1", "Same methodology document: the Cl. 6.1 risk assessment methodology is the risk management methodology NIS2 CIR 2.1 requires.", "equivalent"],
  ["IS-6.1", "2.4", "Cl. 6.1.3's risk treatment plan with risk-owner approval of residual risks is what the 2.4 sign-off accepts."],
  ["IS-8.2", "2.1", "Cl. 8.2 re-runs the 2.1 methodology; its artefact is the recurring assessment results, which live in the 2.3 register."],
  ["IS-8.2", "2.3", "Same risk register: Cl. 8.2 operational risk assessment results are the 2.3 register rows.", "equivalent"],
  ["IS-8.3", "2.3", "Same treatment records: Cl. 8.3 risk treatment implements the 2.3 register's treatment decisions.", "equivalent"],
  ["IS-6.2", "2.4", "Cl. 6.2 sets security objectives that the signed IS-Leitlinie carries; the risk treatment plan with owner approval is Cl. 6.1.3 (in IS-6.1's scope)."],
  ["IS-8.3", "2.1", "Operational risk treatment (Cl. 8.3) implements the plan required by NIS2 CIR 2.1."],
  ["A.5.9",  "2.2", "Asset inventory (A.5.9) is the same register NIS2 CIR 12.4 / §30(2) Nr. 9 BSIG requires for asset identification.", "equivalent"],
  ["A.8.1",  "2.2", "User endpoint device protection (A.8.1) presupposes the endpoint entries in the same asset register NIS2 mandates."],
  ["A.8.10", "2.2", "Information deletion (A.8.10) is exercised against the retention data of the asset register (CIR 12.2/12.5 territory)."],
  ["A.5.12", "2.3", "Information classification scheme (A.5.12) drives the asset criticality ratings NIS2 CIR 2.1.2 expects."],
  ["A.5.13", "2.3", "Information labelling (A.5.13) implements the classification that underpins NIS2 asset classification."],

  // ── Incident handling (NIS2 3.x) ─────────────────────────────────────────────
  ["A.5.24", "3.1", "Same incident response procedure: A.5.24 incident management planning produces the policy NIS2 CIR 3.1 requires.", "equivalent"],
  ["A.5.25", "3.2", "Same event assessment process: A.5.25 covers the detection and logging NIS2 CIR 3.2/3.4 expects.", "equivalent"],
  ["A.5.26", "3.1", "Response to IS incidents (A.5.26) implements the same response procedure; same incident record.", "equivalent"],
  ["A.5.26", "3.3", "Response execution under A.5.26 and the NIS2 24h/72h CSIRT cascade share the same underlying event record.", "equivalent"],
  ["A.5.27", "3.5", "Same lessons-learned report: A.5.27 output is the post-incident review NIS2 CIR 3.6 requires.", "equivalent"],
  ["A.6.8",  "3.2", "IS event reporting channel (A.6.8) is the employee/supplier/customer reporting mechanism NIS2 CIR 3.3 requires."],
  ["A.8.15", "3.2", "Logging controls (A.8.15) generate the evidence trail NIS2 CIR 3.2 expects for incident detection."],
  ["A.8.16", "3.2", "Monitoring activities (A.8.16) overlap with NIS2 detection and alerting requirements."],

  // ── Business continuity (NIS2 4.x) ───────────────────────────────────────────
  ["A.5.29", "4.1", "Same continuity policy: A.5.29 IS continuity policy is the BCP framework document NIS2 CIR 4.1 requires.", "equivalent"],
  ["A.5.29", "4.2", "Same IS continuity policy covers the BCP plan content NIS2 CIR 4.1/4.3 requires."],
  ["A.5.29", "4.5", "Continuity policy requirements include testing obligations that map to NIS2 BCP exercise requirements (CIR 4.1.4)."],
  ["A.5.30", "4.3", "Same ICT readiness plan: A.5.30 maps directly to the NIS2 ICT continuity requirements; one plan satisfies both.", "equivalent"],
  ["A.8.13", "4.4", "Same backup programme: A.8.13 backup controls satisfy the NIS2 backup management requirements under CIR 4.2.", "equivalent"],
  ["A.8.14", "4.3", "Redundancy of processing facilities (A.8.14) overlaps with NIS2 availability and resilience requirements (CIR 4.2.4)."],
  ["A.8.6",  "4.5", "Capacity management (A.8.6) feeds the resource-adequacy review NIS2 CIR 4.2.5 expects as part of BCP testing."],

  // ── Supply chain (NIS2 5.x) ───────────────────────────────────────────────────
  ["A.5.19", "5.1", "Same supplier security policy: A.5.19 supplier relationship IS policy is the policy NIS2 CIR 5.1 requires.", "equivalent"],
  ["A.5.20", "5.2", "Same contractual clauses: A.5.20 IS requirements in supplier agreements cover the clauses NIS2 CIR 5.1.4 mandates.", "equivalent"],
  ["A.5.21", "5.2", "ICT supply chain IS management (A.5.21) overlaps with NIS2 supply-chain security contract requirements."],
  ["A.5.21", "5.3", "Same supplier risk assessment process satisfies both A.5.21 and the NIS2 CIR 5.1.6 monitoring obligation.", "equivalent"],
  ["A.5.22", "5.3", "Supplier service monitoring and review (A.5.22) covers the ongoing monitoring NIS2 CIR 5.1.6/5.1.7 requires."],
  ["A.5.22", "5.4", "Regular supplier reviews (A.5.22) generate the monitoring evidence the CIR 5.1.4(d) notification clause expects."],
  ["A.5.23", "5.2", "Cloud services IS requirements (A.5.23) extend supplier agreement controls to cloud providers as NIS2 requires."],

  // ── Procurement / vulnerability management (NIS2 6.x) ────────────────────────
  ["A.5.7",  "6.2", "Threat intelligence (A.5.7) informs secure development and configuration decisions; the vulnerability-monitoring duty itself is CIR 6.10 under requirement 6.3."],
  ["A.5.5",  "6.2", "Contacts with authorities (A.5.5) support the coordinated-vulnerability-disclosure channel (CIR 6.10.2(e), requirement 6.3)."],
  ["A.8.8",  "6.3", "Same vulnerability programme: A.8.8 technical vulnerability management is the scanning programme NIS2 CIR 6.5/6.10 requires.", "equivalent"],
  ["A.8.8",  "6.4", "Same patch programme: A.8.8 timely remediation maps to the patch management cadence NIS2 CIR 6.6 mandates.", "equivalent"],
  ["A.8.9",  "6.2", "Configuration management (A.8.9) implements the secure-configuration half of 6.2 (CIR 6.3); 6.2's secure development life cycle half (CIR 6.2) is separate."],
  ["A.8.25", "6.2", "Same development discipline: A.8.25 secure development life cycle is the CIR 6.2 duty requirement 6.2 carries."],
  ["A.8.25", "6.5", "Secure development life cycle (A.8.25, CIR 6.2) overlaps 6.5 where changes ship through the development process."],
  ["A.8.29", "6.5", "Security testing (A.8.29, CIR 6.5) validates changes before release, supporting the 6.5 change process."],
  ["A.8.31", "6.5", "Separation of dev/test/prod (A.8.31) is part of the change-control discipline (CIR 6.4) and the secure development environment (CIR 6.2)."],
  ["A.8.32", "6.5", "Same change record: A.8.32 change management is the CIR 6.4 change process requirement 6.5 tracks; both write the same change_request rows.", "equivalent"],

  // ── Effectiveness (NIS2 7.x) ──────────────────────────────────────────────────
  ["IS-9.1", "7.1", "Same KPI records: Cl. 9.1 monitoring, measurement and analysis produces the KPI evidence NIS2 CIR 7.1/7.2 requires.", "equivalent"],
  ["IS-9.2", "7.2", "Internal audit programme (Cl. 9.2) is the independent review CIR 2.3 requires; same audit records.", "equivalent"],
  ["IS-9.3", "7.3", "Same CEO sign-off artefact: Cl. 9.3 management review is the regular management reporting CIR 2.2.1 requires.", "equivalent"],
  ["A.5.35", "7.2", "Same audit programme: A.5.35 independent review of information security is the CIR 2.3 independent review.", "equivalent"],
  ["A.5.36", "7.1", "Compliance with policies and standards (A.5.36) overlaps with the NIS2 policy-effectiveness measurement."],
  ["IS-10.1", "7.4", "Continual improvement records (Cl. 10.1) evidence the corrective actions CIR 2.3.3 and Art. 21(4) require."],

  // ── Training and awareness (NIS2 8.x) ────────────────────────────────────────
  ["A.6.3",  "8.1", "The A.6.3 awareness programme teaches the rules the 8.1 policy sets; the training equivalence lives on 8.2."],
  ["A.6.3",  "8.2", "Same training programme satisfies both A.6.3 employee awareness and NIS2 CIR 8.1 awareness raising.", "equivalent"],
  ["IS-7.2", "8.2", "Same training records: Cl. 7.2 competence records document the staff awareness NIS2 CIR 8.1 expects.", "equivalent"],
  ["IS-7.2", "8.3", "Same competence records cover role-specific security training under CIR 8.2."],
  ["A.6.3",  "8.3", "Role-specific awareness content (A.6.3) overlaps with the CIR 8.2 security training requirement."],
  ["A.5.10", "8.1", "Acceptable use rules for information and assets (A.5.10) are the same topic-specific policy content the 8.1 IT-Sicherheitsrichtlinie carries (CIR 1.1.1(i))."],

  // ── Cryptography (NIS2 9.x) ───────────────────────────────────────────────────
  ["A.8.24", "9.1", "Same cryptography policy: A.8.24 is the policy NIS2 CIR 9.1 / BSI TR-02102 requires.", "equivalent"],
  ["A.8.5",  "9.2", "Secure authentication (A.8.5) is access-control territory (CIR 11.6/11.7, requirement 11.1); it touches 9.2 only via encrypted authentication channels."],
  ["A.8.3",  "9.2", "Information access restriction (A.8.3) complements encryption of data at rest (CIR 9.2(a)); the control's home is access control (10.1)."],

  // ── Access control (NIS2 10.x) ───────────────────────────────────────────────
  ["A.5.15", "10.1", "Same access control policy: A.5.15 is the policy NIS2 CIR 11.1 requires.", "equivalent"],
  ["A.5.16", "10.2", "Same IAM programme: A.5.16 identity management covers the identity and access management NIS2 CIR 11.2 mandates.", "equivalent"],
  ["A.5.17", "10.2", "Authentication information management (A.5.17) implements the privileged account controls NIS2 CIR 11.2/11.3 requires."],
  ["A.5.18", "10.3", "Same access-rights records: A.5.18 produces the change-controlled access evidence NIS2 CIR 11.2 expects.", "equivalent"],
  ["A.5.18", "10.4", "Same periodic review: A.5.18 access-rights review is the documented review CIR 11.2.3 requires at planned intervals (quarterly is the platform default)."],
  ["A.8.3",  "10.1", "Information access restriction (A.8.3) enforces the access control policy NIS2 CIR 11.1 requires."],
  ["A.8.18", "10.2", "Privileged utility programs (A.8.18) are governed by the privileged-account rules (CIR 11.3) documented in 10.3; 10.2's per-asset rows record where they apply."],
  ["A.8.18", "10.3", "Same privileged-account discipline: A.8.18 restrictions implement the CIR 11.3 policies documented in 10.3."],
  ["A.6.1",  "10.3", "Screening (A.6.1) is the background verification CIR 10.2 requires; 10.3 documents the process it belongs to."],
  ["A.6.5",  "10.3", "Responsibilities after termination (A.6.5) implement the CIR 10.3 termination procedures inside 10.3's lifecycle process."],

  // ── Authentication (NIS2 11.x) ───────────────────────────────────────────────
  ["A.8.5",  "11.1", "Same MFA control: A.8.5 secure authentication implements the MFA/continuous-authentication requirement NIS2 CIR 11.7 mandates.", "equivalent"],
  ["A.8.2",  "11.1", "Privileged access rights (A.8.2) are CIR 11.3 territory (requirement 10.3); MFA (CIR 11.7) protects those accounts but is a different artefact."],
  ["A.8.2",  "10.3", "Same privileged-account discipline: A.8.2 privileged access rights implement the CIR 11.3 policies documented in 10.3."],
  ["A.5.16", "11.2", "Identity management (A.5.16) underpins who may use the secured communication channels 11.2 establishes."],
  ["A.5.14", "11.2", "Information transfer rules (A.5.14) govern the secured voice/video/text channels Art. 21(2)(j) requires; the emergency-communication half of 11.2 is separate."],
  ["A.8.20", "11.2", "Network security controls (A.8.20) protect the channels 11.2 relies on; segmentation itself is CIR 6.8, which has no dedicated NIS2 step."],
  ["A.8.21", "11.2", "Security of network services (A.8.21) supports secured communications; the underlying network-security duty is CIR 6.7."],
  ["A.8.22", "11.2", "Network segregation (A.8.22, CIR 6.8) hardens the environment secured communications run in; different artefact."],
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
