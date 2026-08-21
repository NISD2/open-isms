# NIS2 + GDPR Reference

Generated from `@nisd2/grc-data-model` — the canonical EU NIS2 + GDPR data model.
Browse the structure of every requirement, every category, and every cross-framework satisfaction pair.

**This file is auto-generated.** Edit the source data in `src/frameworks/` and `src/satisfaction-pairs.ts`, then run `bun run docs:reference`.

## Contents

- [NIS2 Categories & Requirements](#nis2-categories--requirements)
- [GDPR Categories & Requirements](#gdpr-categories--requirements)
- [Cross-Framework Satisfaction Pairs](#cross-framework-satisfaction-pairs)
- [Article-Level Mapping](#article-level-mapping)
- [Coverage Summary](#coverage-summary)

## NIS2 Categories & Requirements

12 categories, 49 requirements. Sourced from BSIG (German NIS2 transposition) and CIR 2024/2690 (EU implementing regulation).

### REG — registration

BSI IT-Grundschutz module: `ISMS.1`. Estimated effort: 30 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `12.1` | document | P0 | on-change | Art. 3(1)-(2) | §28, §33(1) BSIG | — |
| `12.2` | proof | P0 | one-time | Art. 3(3)-(4) | §33(1) BSIG | — |
| `12.3` | proof | P1 | annual | Art. 3(4) | §33(5) BSIG | — |
| `12.4` | proof | P2 | ongoing | — | §30(1) S. 3, §31(2), §39, §34 BSIG | — |

### GOV — governance

BSI IT-Grundschutz module: `ISMS.1`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `1.1` | training | P1 | every-3-years | Art. 20(2) | §38(3) BSIG | — |
| `1.2` | proof | P1 | on-change | Art. 21(2)(a) | §30(1) BSIG, CIR 1.2 | — |
| `1.3` | proof | P1 | annual | Art. 20(1) | §38(1) BSIG, CIR 1.1.1(e) | — |
| `1.4` | sign-off | P1 | on-change | Art. 20(1) | §38(2) BSIG | — |

### RSK — risk-management

BSI IT-Grundschutz module: `BSI-200-3`. Estimated effort: 60 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `2.1` | document | P0 | on-change | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.2 | G-ROP.1 |
| `2.2` | technical | P0 | ongoing | Art. 21(2)(a), Art. 21(2)(i) | §30(2) Nr. 1 und 9 BSIG, CIR 12 | G-ROP.1 |
| `2.3` | technical | P1 | annual | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.1, 2.1.4 | G-ROP.1 |
| `2.4` | sign-off | P0 | annual | Art. 20(1), Art. 21(2)(a) | §38(1) BSIG, CIR 1.1.1(k), 2.1.1 | G-TOM.1 |

### SUP — supply-chain

BSI IT-Grundschutz module: `OPS.2.3`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `5.1` | document | P1 | annual | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1-5.2 | G-DPA.1 |
| `5.2` | document | P1 | on-change | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1.4 | G-DPA.1, G-DPA.2 |
| `5.3` | proof | P1 | annual | Art. 21(3) | §30(2) Nr. 4 BSIG, CIR 5.1.6, 5.1.7 | — |
| `5.4` | proof | P1 | ongoing | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1.4(d) | — |

### CRY — cryptography

BSI IT-Grundschutz module: `CON.1`. Estimated effort: 30 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `9.1` | document | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.1, 9.3, BSI TR-02102 | — |
| `9.2` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2(a) | — |
| `9.3` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2(c) | — |

### ACC — access-control

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `10.1` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.1 | — |
| `10.2` | technical | P1 | on-change | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2, CIR 11.3 | — |
| `10.3` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 10.2, 10.3, 11.3 | — |
| `10.4` | proof | P1 | quarterly | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2.3, 11.3.3 | — |

### AUT — authentication

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `11.1` | technical | P0 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.7 | — |
| `11.2` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG | — |
| `11.3` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.6, NIST SP 800-63B | — |

### PRO — procurement

BSI IT-Grundschutz module: `OPS.1.1.3`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `6.1` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.1 | — |
| `6.2` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.2, 6.3 | — |
| `6.3` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.5, 6.10 | — |
| `6.4` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.6 | — |
| `6.5` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.4 | — |

### INC — incident-handling

BSI IT-Grundschutz module: `DER.2.1`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `3.1` | document | P0 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.1 | G-BRC.1 |
| `3.2` | document | P1 | annual | Art. 21(2)(b), Art. 23(3) | §30(2) Nr. 2, §2 Nr. 11 BSIG, CIR 3.2-3.4 | G-BRC.2 |
| `3.3` | proof | P0 | annual | Art. 23(4) | §32(1) Nr. 1-4, §32(2) BSIG | G-BRC.1 |
| `3.4` | proof | P2 | annual | Art. 21(2)(f) | §30(2) Nr. 2+6 BSIG, CIR 3.5 | — |
| `3.5` | document | P1 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.6 | G-BRC.2 |

### BCP — business-continuity

BSI IT-Grundschutz module: `DER.4`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `4.1` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1.3 | — |
| `4.2` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1, 4.3 | — |
| `4.3` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1.2 | — |
| `4.4` | technical | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.2 | — |
| `4.5` | proof | P1 | annual | Art. 21(2)(c), Art. 21(2)(f) | §30(2) Nr. 3+6 BSIG, CIR 4.1.4, 4.3.4 | — |

### TRN — training

BSI IT-Grundschutz module: `ORP.3`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `8.1` | document | P1 | annual | Art. 21(2)(a), Art. 21(2)(g) | §30(2) Nr. 1+7 BSIG, CIR 1.1.1(i), 1.2.2 | — |
| `8.2` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.1 | — |
| `8.3` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.2 | — |
| `8.4` | proof | P2 | annual | Art. 21(2)(g), Art. 21(2)(f) | §30(2) Nr. 6+7 BSIG, CIR 8.1.3, 8.2.3 | — |

### EFF — effectiveness

BSI IT-Grundschutz module: `DER.3.1`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `7.1` | proof | P1 | quarterly | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 7.1, 7.2 | — |
| `7.2` | proof | P1 | annual | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 2.3 | — |
| `7.3` | sign-off | P1 | annual | Art. 21(2)(f), Art. 20(1) | §30(2) Nr. 6 BSIG, CIR 2.2.1, §38(1) | — |
| `7.4` | document | P1 | ongoing | Art. 21(2)(f), Art. 21(4) | §30(2) Nr. 6 BSIG, CIR 2.3.3, Art. 21(4) | — |

## GDPR Categories & Requirements

5 categories, 7 requirements. Sourced from GDPR (EU 2016/679).

### DPA — gdpr-processor-agreements

| Code | Evidence | Priority | Article | Legal ref | NIS2 sibling |
|---|---|---|---|---|---|
| `G-DPA.1` | document | P1 | Art. 28 | GDPR Art. 28(3) | 5.1, 5.2 |
| `G-DPA.2` | document | P1 | Art. 28 | GDPR Art. 28(2)/(4) | 5.2 |

### ROP — gdpr-records-of-processing

| Code | Evidence | Priority | Article | Legal ref | NIS2 sibling |
|---|---|---|---|---|---|
| `G-ROP.1` | document | P0 | Art. 30 | GDPR Art. 30(1) | 2.1, 2.2, 2.3 |

### TOM — gdpr-toms

| Code | Evidence | Priority | Article | Legal ref | NIS2 sibling |
|---|---|---|---|---|---|
| `G-TOM.1` | document | P0 | Art. 32 | GDPR Art. 32(1) | 2.4 |

### BRC — gdpr-breach-response

| Code | Evidence | Priority | Article | Legal ref | NIS2 sibling |
|---|---|---|---|---|---|
| `G-BRC.1` | document | P0 | Art. 33 | GDPR Art. 33 | 3.1, 3.3 |
| `G-BRC.2` | document | P1 | Art. 33 | GDPR Art. 33(5) | 3.2, 3.5 |

### DSR — gdpr-data-subject-rights

| Code | Evidence | Priority | Article | Legal ref | NIS2 sibling |
|---|---|---|---|---|---|
| `G-DSR.1` | document | P1 | Art. 15-22 | GDPR Art. 15-22 | — |

## Cross-Framework Satisfaction Pairs

11 bidirectional pairs. Signing one requirement marks its linked sibling complete because the same operational evidence supports both attestations.

| NIS2 | GDPR | Rationale |
|---|---|---|
| `5.1` | `G-DPA.1` | Same supplier rows feed both; the Art. 28 DPA itself is evidenced by the 5.2 contract clauses, not by the register alone. |
| `5.2` | `G-DPA.1` | Contractual security clauses cover the same processor obligations as Art. 28 DPAs. |
| `5.2` | `G-DPA.2` | Sub-processor lists live on the same supplier rows used for NIS2 governance and Art. 28(2)/(4). |
| `2.1` | `G-ROP.1` | Asset classification methodology defines the systems recorded in the Art. 30 register. |
| `2.2` | `G-ROP.1` | Asset rows inform the Art. 30 record, but a RoPA documents processing activities (purposes, recipients, retention), not IT assets. |
| `2.3` | `G-ROP.1` | Asset criticality under NIS2 informs Art. 30/35 high-risk processing. |
| `3.1` | `G-BRC.1` | Same incident response procedure satisfies the NIS2 detection-to-notification flow and the GDPR Art. 33 breach response. |
| `3.2` | `G-BRC.2` | Same incident rows; NIS2 detection/logging ↔ Art. 33(5) breach documentation. |
| `3.3` | `G-BRC.1` | Same underlying event, separate filings: the NIS2 24h/72h/1-month cascade goes to the BSI/BBK Meldestelle, the GDPR Art. 33 single 72h notification to the data protection authority. |
| `3.5` | `G-BRC.2` | Post-incident review evidence overlaps the Art. 33(5) breach documentation; the BSI final report itself is §32(1) Nr. 4 BSIG, tracked under 3.3. |
| `2.4` | `G-TOM.1` | CEO sign-off on the Art. 21(2) risk treatment plan attests the TOMs posture Art. 32 requires. |

## Article-Level Mapping

12 concept-level mappings between NIS2 articles and GDPR articles. Sources: ENISA NIS2 Technical Implementation Guidance v1.0; EDPB guidelines.

| NIS2 Article | GDPR Article | Concept | Link Type | Notes |
|---|---|---|---|---|
| Art. 35 | Art. 4(12), Art. 33, Art. 55, Art. 56, Art. 58(2)(i) | Infringements entailing a personal data breach — competent authority must inform DPA; ne bis in idem on fines | directive_explicit | Art. 35(1) NIS 2 (verbatim): where competent authorities become aware in supervision or enforcement that an infringement of Art. 21 or Art. 23 NIS 2 by an essential or important entity can entail a personal data breach as defined in Art. 4(12) GDPR which is to be notified pursuant to Art. 33 GDPR, they shall without undue delay inform the supervisory authorities referred to in Art. 55 or 56 GDPR. Art. 35(2): where DPA imposes an Art. 58(2)(i) GDPR fine, the NIS 2 competent authority shall not impose an Art. 34 NIS 2 administrative fine for an infringement arising from the same conduct. Art. 35(3): where the GDPR supervisory authority is established in another Member State, the NIS 2 competent authority informs the supervisory authority established in its own Member State. |
| Art. 21(1) | Art. 32(1) | Appropriate technical and organisational measures — verbatim language overlap | verbatim_language | Both articles use nearly identical chapeau: 'appropriate technical and organisational measures', 'state of the art', 'cost of implementation'. The substantive overlap is here. NIS 2 adds 'and proportionate' and 'operational' to the measure types. |
| Art. 21(2)(d) | Art. 28 | Supply-chain security ↔ Processor agreements | shared_data | The supplier row is the same. NIS 2 cares about supplier cybersecurity posture; GDPR Art. 28(3)(c) requires the processor contract to obligate the processor to take all Art. 32 GDPR measures. The GDPR DPA is the contractual baseline; NIS 2 adds risk-based ongoing oversight (Art. 21(2)(d) + Art. 21(3)). |
| Art. 21(2)(h) | Art. 32(1)(a) | Cryptography and encryption measures | shared_data | Same TOMs entry tagged with both regimes. Note: GDPR Art. 32(1)(a) names pseudonymisation alongside encryption — NIS 2 Art. 21(2)(h) does not. |
| Art. 21(2)(c) | Art. 32(1)(c) | Business continuity, recovery from incident, availability and resilience | shared_data | GDPR Art. 32(1)(c): 'the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident'. NIS 2 Art. 21(2)(c) covers BCP + crisis management more broadly. |
| Art. 21(2)(f) | Art. 32(1)(d) | Effectiveness assessment of security measures | shared_data | GDPR Art. 32(1)(d): 'a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures'. NIS 2 Art. 21(2)(f) requires the same in the cybersecurity context. Same operational artefact satisfies both. |
| Art. 21(2)(i) | Art. 28(3)(b), Art. 32 | HR security, confidentiality, access control | shared_data | Art. 28(3)(b) GDPR requires persons authorised to process to be bound by confidentiality. NIS 2 Art. 21(2)(i) covers HR security + access control + asset management as the cybersecurity equivalent. |
| Art. 21(2)(j) | Art. 32 (implicit) | MFA, continuous authentication, secure communications and emergency comms | structural_overlap | GDPR Art. 32 does not name MFA explicitly. The 'appropriate measures' clause implicitly covers it. CIR 2024/2690 explicitly mandates MFA for 11 digital-service-provider categories. For other entities, Art. 21(1) proportionality applies. |
| Art. 20(2) | Art. 39(1)(b) | Management body training | structural_overlap | NIS 2 Art. 20(2) requires management body training; non-delegable per §38(3) BSIG. GDPR Art. 39(1)(b) tasks the DPO with awareness-raising and training of staff (including management). Different audiences, distinct obligations. |
| Art. 21(2)(g) | Art. 39(1)(b) | Basic cyber hygiene practices and cybersecurity training (staff) | structural_overlap | NIS 2 Art. 21(2)(g): cyber hygiene + training for all staff. GDPR Art. 39(1)(b): DPO oversees awareness-raising and training 'of staff involved in processing operations'. GDPR scope is data-protection-specific and may be a staff subset; NIS 2 scope is broader. |
| Art. 23 | Art. 33, Art. 34 | Incident notification (parallel workflows) | parallel_workflow | Same incident may trigger both: NIS 2 Art. 23 24h/72h/intermediate/1mo to CSIRT; GDPR Art. 33 72h to supervisory authority; GDPR Art. 34 to data subjects when high risk. Different recipients, thresholds, and content. Until Art. 23a NIS 2 (Digital Omnibus 2026) Single Entry Point applies (~2028), both notifications must be filed in parallel. |
| (none) | Art. 30 | Records of processing activities — explicitly NOT a supplier register | no_mapping | GDPR Art. 30 requires the controller's records of its own processing activities (purposes, data categories, recipients, retention, security summary). Art. 30(1)(d) describes CATEGORIES of recipients, not a list of individual suppliers. The correct GDPR analog for NIS 2 Art. 21(2)(d) supply-chain security is Art. 28 (Processor), not Art. 30. This row exists to prevent future authors from re-introducing this common error. |

## Coverage Summary

| | Categories | Requirements |
|---|---|---|
| NIS2 | 12 | 49 |
| GDPR | 5 | 7 |

**Total satisfaction pairs:** 11 bidirectional (NIS2 ↔ GDPR).
**Article-level mappings:** 12 concept-level rows.

---

Maintained by [nisd2.eu](https://www.nisd2.eu). Issues and contributions welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
