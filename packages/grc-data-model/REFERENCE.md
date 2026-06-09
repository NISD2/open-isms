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
| `12.1` | document | P0 | one-time | Art. 3(1)-(2) | §28 BSIG | — |
| `12.2` | proof | P0 | one-time | Art. 3(3)-(4) | §33 BSIG | — |
| `12.3` | proof | P1 | annual | Art. 3(3)-(4) | §33(3) BSIG | — |
| `12.4` | proof | P1 | annual | — | §34, §39, §§61-65 BSIG | — |

### GOV — governance

BSI IT-Grundschutz module: `ISMS.1`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `1.1` | training | P1 | every-3-years | Art. 20(2) | §38(3) BSIG | — |
| `1.2` | proof | P1 | on-change | Art. 20(1) | §30(1) BSIG | — |
| `1.3` | proof | P1 | annual | Art. 20(1) | §38(1) BSIG | — |
| `1.4` | sign-off | P1 | one-time | Art. 20(1) | §38(2) BSIG | — |

### RSK — risk-management

BSI IT-Grundschutz module: `BSI-200-3`. Estimated effort: 60 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `2.1` | document | P0 | one-time | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.2 | G-ROP.1 |
| `2.2` | technical | P0 | ongoing | Art. 21(1), Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 12, §28 BSIG | G-ROP.1 |
| `2.3` | technical | P1 | annual | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.1, CIR 2.1.2 | G-ROP.1 |
| `2.4` | sign-off | P0 | one-time | Art. 20(1), Art. 21(2)(a) | §38(1) BSIG, CIR 1.1, CIR 2.1.1 | G-TOM.1 |

### SUP — supply-chain

BSI IT-Grundschutz module: `ORP.5`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `5.1` | document | P1 | annual | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1-5.2 | G-DPA.1 |
| `5.2` | document | P1 | on-change | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.3 | G-DPA.1, G-DPA.2 |
| `5.3` | proof | P1 | annual | Art. 21(3) | §30(2) Nr. 4 BSIG, CIR 5.4 | — |
| `5.4` | proof | P1 | ongoing | Art. 21(2)(d), Art. 23 | §30(2) Nr. 4 BSIG, CIR 5.5, §32 | — |

### CRY — cryptography

BSI IT-Grundschutz module: `CON.1`. Estimated effort: 30 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `9.1` | document | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.1, BSI TR-02102 | — |
| `9.2` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2-9.3 | — |
| `9.3` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.4-9.5 | — |

### ACC — access-control

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `10.1` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.1 | — |
| `10.2` | technical | P1 | on-change | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2, CIR 11.3 | — |
| `10.3` | document | P1 | on-change | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 10, CIR 11.3 | — |
| `10.4` | proof | P1 | quarterly | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2 | — |

### AUT — authentication

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `11.1` | technical | P0 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.7 | — |
| `11.2` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 12, §32 | — |
| `11.3` | document | P1 | every-3-years | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.6, BSI TR-03107 | — |

### PRO — procurement

BSI IT-Grundschutz module: `OPS.1.1.3`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `6.1` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.1 | — |
| `6.2` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.2-6.3, NIS2 Art. 12 | — |
| `6.3` | technical | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.5, 6.10 | — |
| `6.4` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.6 | — |
| `6.5` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.4 | — |

### INC — incident-handling

BSI IT-Grundschutz module: `DER.2.1`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `3.1` | document | P0 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.1 | G-BRC.1 |
| `3.2` | document | P1 | annual | Art. 23(3) | §32(1) BSIG, CIR 3.2, 3.4 | G-BRC.2 |
| `3.3` | proof | P0 | on-change | Art. 23(4) | §32(1) Nr. 1-4 BSIG | G-BRC.1 |
| `3.4` | proof | P2 | annual | Art. 21(2)(f) | §30(2) Nr. 2+6 BSIG, CIR 3.5 | — |
| `3.5` | document | P1 | on-change | Art. 23(2) | §35 BSIG, CIR 3.6 | G-BRC.2 |

### BCP — business-continuity

BSI IT-Grundschutz module: `DER.4`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `4.1` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1 | — |
| `4.2` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1, 4.3 | — |
| `4.3` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1 | — |
| `4.4` | technical | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.2 | — |
| `4.5` | proof | P1 | annual | Art. 21(2)(c), Art. 21(2)(f) | §30(2) Nr. 3+6 BSIG, CIR 4.1 | — |

### TRN — training

BSI IT-Grundschutz module: `ORP.3`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `8.1` | document | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.1 | — |
| `8.2` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.2, §38(3) | — |
| `8.3` | training | P1 | annual | Art. 21(2)(g), Art. 20(2) | §30(2) Nr. 7 BSIG, CIR 8.3, §38(3) | — |
| `8.4` | proof | P1 | quarterly | Art. 21(2)(g), Art. 21(2)(f) | §30(2) Nr. 6+7 BSIG, CIR 8.4 | — |

### EFF — effectiveness

BSI IT-Grundschutz module: `DER.3.1`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | GDPR sibling |
|---|---|---|---|---|---|---|
| `7.1` | proof | P1 | monthly | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 7.1 | — |
| `7.2` | proof | P1 | annual | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 7.2 | — |
| `7.3` | sign-off | P1 | annual | Art. 21(2)(f), Art. 20(1) | §30(2) Nr. 6 BSIG, CIR 7.3, §38(1) | — |
| `7.4` | document | P1 | ongoing | Art. 21(2)(f), Art. 21(4) | §30(2) Nr. 6 BSIG, CIR 7.4, Art. 21(4) | — |

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
| `5.1` | `G-DPA.1` | Same supplier register; NIS2 §30(2) Nr. 4 ↔ GDPR Art. 28 DPA evidence. |
| `5.2` | `G-DPA.1` | Contractual security clauses cover the same processor obligations as Art. 28 DPAs. |
| `5.2` | `G-DPA.2` | Sub-processor lists live on the same supplier rows used for NIS2 governance and Art. 28(2)/(4). |
| `2.1` | `G-ROP.1` | Asset classification methodology defines the systems recorded in the Art. 30 register. |
| `2.2` | `G-ROP.1` | Same asset inventory; NIS2 asset-classification ↔ GDPR Art. 30 records of processing. |
| `2.3` | `G-ROP.1` | Asset criticality under NIS2 informs Art. 30/35 high-risk processing. |
| `3.1` | `G-BRC.1` | Same incident response procedure satisfies the NIS2 detection-to-notification flow and the GDPR Art. 33 breach response. |
| `3.2` | `G-BRC.2` | Same incident rows; NIS2 detection/logging ↔ Art. 33(5) breach documentation. |
| `3.3` | `G-BRC.1` | NIS2 24h/72h cascade and Art. 33's 72h breach notification share the same clock. |
| `3.5` | `G-BRC.2` | Same final incident report: NIS2 §35 and Art. 33(5) share the root-cause evidence and lessons-learned write-up. |
| `2.4` | `G-TOM.1` | CEO sign-off on the Art. 21(2) risk treatment plan attests the TOMs posture Art. 32 requires. |

## Article-Level Mapping

7 concept-level mappings between NIS2 articles and GDPR articles. Sources: ENISA NIS2 Technical Implementation Guidance v1.0; EDPB guidelines.

| NIS2 Article | GDPR Article | Concept | Link Type | Notes |
|---|---|---|---|---|
| Art. 21(2)(d) | Art. 28 | Supply-chain security ↔ Processor agreements | shared_data | The supplier row is the same; NIS2 cares about supplier cybersecurity posture, GDPR cares about Art. 28 contract clauses on the same row. |
| Art. 21(2)(h) | Art. 32(1)(a) | Cryptography measures | shared_data | Same TOMs entry tagged with both regimes. |
| Art. 21(2)(c) | Art. 32(1)(c) | Business continuity ↔ Availability and resilience | shared_data | — |
| Art. 21(2)(j) | Art. 32 (implicit) | Access control | shared_data | — |
| Art. 23 | Art. 33/34 | Incident reporting | parallel_workflow | Same incident may trigger both: NIS2 24h/72h/1mo cyber notification AND GDPR 72h personal-data-breach notification. Different recipients (national CSIRT vs DPA), different content requirements. |
| Art. 21(2)(i) | Art. 32 (implicit) | HR security ↔ persons authorised bound by confidentiality | shared_data | Art. 28(3)(b) requires processor staff to be bound by confidentiality; same control under NIS2 personnel security. |
| Art. 20(2) | Art. 39(1)(b) | Training | shared_data | NIS2 management body training ↔ DPO duty to train staff. Different audiences within the same training programme. |

## Coverage Summary

| | Categories | Requirements |
|---|---|---|
| NIS 2 | 12 | 49 |
| GDPR | 5 | 7 |
| EU AI Act | 5 | 24 |
| CRA | 4 | 21 |
| ISO 27001:2022 | 5 | 116 |
| **Total** | **31** | **217** |

**Satisfaction pairs:** 111 total.

| Pair set | Count |
|---|---|
| NIS 2 ↔ GDPR | 11 |
| AI Act ↔ NIS 2 | 7 |
| AI Act ↔ GDPR | 5 |
| CRA ↔ NIS 2 | 9 |
| CRA ↔ AI Act | 4 |
| CRA ↔ GDPR | 2 |
| ISO 27001 ↔ NIS 2 | 73 |

**Article-level mappings:** 7 concept-level rows (NIS 2 ↔ GDPR).

---

Maintained by [nisd2.eu](https://www.nisd2.eu). Issues and contributions welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
