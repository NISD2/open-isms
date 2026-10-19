# Framework Reference

Generated from `@nisd2/grc-data-model`: every category and requirement of each framework the package carries, and every link between requirements of two frameworks.

**This file is auto-generated.** Edit the source data in `src/frameworks/` and `src/satisfaction-pairs.ts`, then run `bun run docs:reference`.

## Contents

- [NIS2](#nis2)
- [GDPR](#gdpr)
- [ISO/IEC 27001:2022](#isoiec-270012022)
- [EU AI Act](#eu-ai-act)
- [EU Cyber Resilience Act](#eu-cyber-resilience-act)
- [Cross-Framework Satisfaction Pairs](#cross-framework-satisfaction-pairs)
- [Article-Level Mapping, NIS2 and GDPR](#article-level-mapping-nis2-and-gdpr)
- [Coverage Summary](#coverage-summary)

## NIS2

12 categories, 49 requirements. Cites Directive (EU) 2022/2555 and Implementing Regulation (EU) 2024/2690, with the German BSIG as transposition.

### REG: registration

BSI IT-Grundschutz module: `ISMS.1`. Estimated effort: 30 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `12.1` | document | P0 | on-change | Art. 3(1)-(2) | §28, §33(1) BSIG | none |
| `12.2` | proof | P0 | one-time | Art. 3(3)-(4) | §33(1) BSIG | none |
| `12.3` | proof | P1 | on-change | Art. 3(4) | §33(5) BSIG | none |
| `12.4` | proof | P2 | ongoing | none | §30(1) S. 3, §31(2), §39, §34 BSIG | IS-5.2, A.5.1, A.5.36, A.5.4, IS-9.3 |

### GOV: governance

BSI IT-Grundschutz module: `ISMS.1`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `1.1` | training | P0 | every-3-years | Art. 20(2) | §38(3) BSIG | AI-LIT.2 |
| `1.2` | proof | P1 | annual | Art. 21(2)(a) | §30(1) BSIG, CIR 1.2, CIR 10.1.3 | A.5.2, IS-5.3, A.5.3, A.5.4, IS-7.1, IS-7.2, A.6.2, A.6.3 |
| `1.3` | proof | P1 | annual | Art. 20(1) | §38(1) BSIG, CIR 1.1.1(e) | IS-5.1, IS-5.2, A.5.1, A.5.36, A.5.4, IS-9.3 |
| `1.4` | sign-off | P1 | on-change | Art. 20(1) | §38(2) BSIG | none |

### RSK: risk-management

BSI IT-Grundschutz module: `BSI-200-3`. Estimated effort: 60 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `2.1` | document | P0 | on-change | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.2 | G-ROP.1, AI-RSK.1, CRA-MFG.1, IS-6.1, IS-6.2, IS-8.2, IS-8.3, A.5.7, A.5.19, A.5.20, A.5.21 |
| `2.2` | technical | P0 | ongoing | Art. 21(2)(a), Art. 21(2)(i) | §30(2) Nr. 1 und 9 BSIG, CIR 12 | G-ROP.1, AI-INV.1, A.5.9, A.5.12, A.5.13 |
| `2.3` | technical | P1 | annual | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.1, 2.1.4 | G-ROP.1, AI-RSK.2, IS-8.2, IS-8.3, IS-6.1, IS-6.2, A.5.7, A.5.19, A.5.20, A.5.21 |
| `2.4` | sign-off | P0 | annual | Art. 20(1), Art. 21(2)(a) | §38(1) BSIG, CIR 1.1.1(k), 1.1.2, 2.1.1, 2.1.4 | G-TOM.1, CRA-MFG.2, IS-5.2, A.5.1, A.5.36, A.5.4, IS-9.3, IS-6.1, IS-6.2, IS-8.2, IS-8.3, A.5.7, A.5.19, A.5.20, A.5.21 |

### SUP: supply-chain

BSI IT-Grundschutz module: `OPS.2.3`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `5.1` | document | P0 | annual | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1-5.2 | G-DPA.1, CRA-IMP.1, A.5.19, A.5.20, A.5.21, A.8.30, A.5.22 |
| `5.2` | document | P1 | on-change | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1.4 | G-DPA.1, G-DPA.2, CRA-IMP.2, A.5.20, A.5.19, A.5.21, A.8.30 |
| `5.3` | proof | P1 | annual | Art. 21(3) | §30(2) Nr. 4 BSIG, CIR 5.1.6, 5.1.7 | A.5.21, A.5.19, A.5.20, A.8.30 |
| `5.4` | proof | P1 | ongoing | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1.4(d) | A.5.19, A.5.20, A.5.21, A.8.30 |

### INC: incident-handling

BSI IT-Grundschutz module: `DER.2.1`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `3.1` | document | P0 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.1 | G-BRC.1, AI-INC.1, CRA-INC.1, A.5.24, A.5.26 |
| `3.2` | document | P1 | quarterly | Art. 21(2)(b), Art. 23(3) | §30(2) Nr. 2, §2 Nr. 11 BSIG, CIR 3.2-3.4, CIR Art. 4 | G-BRC.2, A.5.25, A.5.28, A.8.15, A.8.16, A.8.17, A.6.8 |
| `3.3` | proof | P0 | annual | Art. 23(4) | §32(1) Nr. 1-4, §32(2) BSIG | G-BRC.1, AI-INC.2, CRA-INC.2, A.5.26 |
| `3.4` | proof | P2 | annual | Art. 21(2)(f) | §30(2) Nr. 2+6 BSIG, CIR 3.5 | A.5.26 |
| `3.5` | document | P1 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.6 | G-BRC.2, G-BRC.3, CRA-INC.3, A.5.27 |

### CRY: cryptography

BSI IT-Grundschutz module: `CON.1`. Estimated effort: 30 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `9.1` | document | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.1, 9.3, BSI TR-02102 | G-TOM.1, A.8.24, A.5.31 |
| `9.2` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2(a) | G-TOM.1 |
| `9.3` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2(c) | none |

### ACC: access-control

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `10.1` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.1 | G-TOM.1, A.5.15, A.7.2, A.8.3, A.8.21 |
| `10.2` | technical | P1 | on-change | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2, CIR 11.3 | A.5.16, A.5.3, A.5.18, A.8.2, A.8.18 |
| `10.3` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 10.2, 10.3, 11.3 | A.5.18, A.6.1, A.6.5, A.8.2, A.8.18 |
| `10.4` | proof | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2.3, 11.3.3 | A.5.3, A.5.18, A.8.2, A.8.18 |

### AUT: authentication

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `11.1` | technical | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.7 | G-TOM.1, A.8.5 |
| `11.2` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG | none |
| `11.3` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.6, NIST SP 800-63B | A.5.17 |

### PRO: procurement

BSI IT-Grundschutz module: `OPS.1.1.3`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `6.1` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.1 | A.5.21, A.5.23 |
| `6.2` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.2, 6.3 | A.8.25, A.8.31, A.8.9 |
| `6.3` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.5, 6.10 | CRA-VLN.1, A.8.8, A.8.29, A.8.33, A.8.34 |
| `6.4` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.6 | CRA-VLN.3, A.8.8, A.8.31, A.8.32 |
| `6.5` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.4 | A.8.32, IS-6.3, IS-8.1, A.7.13 |

### BCP: business-continuity

BSI IT-Grundschutz module: `DER.4`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `4.1` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1.3 | A.5.29, A.5.30 |
| `4.2` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1, 4.3 | A.5.29, A.5.30, A.5.26 |
| `4.3` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1.2 | G-TOM.1, A.5.30, A.5.29 |
| `4.4` | technical | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.2 | G-TOM.1, A.8.13, A.8.14 |
| `4.5` | proof | P1 | annual | Art. 21(2)(c), Art. 21(2)(f) | §30(2) Nr. 3+6 BSIG, CIR 4.1.4, 4.3.4 | A.5.29, A.5.30, A.8.13, A.8.14, A.5.26 |

### TRN: training

BSI IT-Grundschutz module: `ORP.3`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `8.1` | document | P1 | annual | Art. 21(2)(a), Art. 21(2)(g) | §30(2) Nr. 1+7 BSIG, CIR 1.1.1(i), 1.2.2 | AI-LIT.1, IS-5.2, A.5.1, A.5.36, A.5.4, IS-9.3, IS-5.3, A.5.2, A.5.3 |
| `8.2` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.1 | A.6.3, IS-7.2, IS-7.3, A.8.7 |
| `8.3` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.2 | IS-7.2, A.6.3 |
| `8.4` | proof | P2 | annual | Art. 21(2)(g), Art. 21(2)(f) | §30(2) Nr. 6+7 BSIG, CIR 8.1.3, 8.2.3 | IS-7.3, A.6.3, A.8.7, IS-7.2 |

### EFF: effectiveness

BSI IT-Grundschutz module: `DER.3.1`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `7.1` | proof | P1 | quarterly | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 7.1, 7.2 | G-TOM.1, IS-9.1, IS-6.2, IS-9.3 |
| `7.2` | proof | P1 | annual | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 2.3 | G-TOM.1, IS-9.2, A.5.35, IS-10.1, A.8.34 |
| `7.3` | sign-off | P1 | annual | Art. 21(2)(f), Art. 20(1) | §30(2) Nr. 6 BSIG, CIR 2.2.1, §38(1) | IS-9.3, IS-9.2, A.5.31, A.5.35, A.5.36 |
| `7.4` | document | P1 | ongoing | Art. 21(2)(f), Art. 21(4) | §30(2) Nr. 6 BSIG, CIR 2.3.3, Art. 21(4) | IS-9.2, IS-10.1, A.5.35, A.8.34 |

## GDPR

6 categories, 9 requirements. Cites Regulation (EU) 2016/679, with the German BDSG where it modifies a duty.

### DPA: gdpr-processor-agreements

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-DPA.1` | document | P1 | on-change | Art. 28 | GDPR Art. 28(1), (3), (9) | 5.1, 5.2 |
| `G-DPA.2` | document | P1 | on-change | Art. 28 | GDPR Art. 28(2), 28(3)(d) | 5.2 |

### ROP: gdpr-records-of-processing

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-ROP.1` | document | P0 | on-change | Art. 30 | GDPR Art. 30(1), (5) | 2.1, 2.2, 2.3, AI-TRA.1, AI-DOC.1 |

### TOM: gdpr-toms

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-TOM.1` | document | P0 | on-change | Art. 32 | GDPR Art. 32(1) | 2.4, 9.1, 9.2, 4.4, 4.3, 7.1, 7.2, 10.1, 11.1, AI-FRI.1, AI-RSK.1, CRA-ESS.1 |

### BRC: gdpr-breach-response

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-BRC.1` | document | P0 | on-change | Art. 33 | GDPR Art. 33(1), (3), (4) | 3.1, 3.3, AI-INC.1, CRA-VLN.1 |
| `G-BRC.2` | document | P1 | on-change | Art. 33 | GDPR Art. 33(5) | 3.2, 3.5 |
| `G-BRC.3` | document | P1 | on-change | Art. 34 | GDPR Art. 34, §29(1) BDSG | 3.5 |

### DSR: gdpr-data-subject-rights

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-DSR.1` | document | P1 | ongoing | Art. 12-22 | GDPR Art. 12(3)-(6), Art. 15-22, §§34, 35 BDSG | none |

### DPO: gdpr-data-protection-officer

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-DPO.1` | document | P0 | on-change | Art. 37-39 | GDPR Art. 37-39, §38 BDSG | none |

## ISO/IEC 27001:2022

5 categories, 116 requirements. Cites Clause and Annex A control numbers of ISO/IEC 27001:2022 with Amendment 1:2024; the standard's text is not reproduced.

### ISMS: isms-clauses

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `IS-4.1` | document | P0 | annual | 4.1 | ISO 27001:2022 Cl. 4.1 | none |
| `IS-4.2` | document | P0 | annual | 4.2 | ISO 27001:2022 Cl. 4.2 | none |
| `IS-4.3` | document | P0 | on-change | 4.3 | ISO 27001:2022 Cl. 4.3 | none |
| `IS-4.4` | document | P0 | on-change | 4.4 | ISO 27001:2022 Cl. 4.4 | none |
| `IS-5.1` | sign-off | P0 | annual | 5.1 | ISO 27001:2022 Cl. 5.1 | 1.3 |
| `IS-5.2` | document | P0 | annual | 5.2 | ISO 27001:2022 Cl. 5.2 | 1.3, 2.4, 8.1, 12.4 |
| `IS-5.3` | document | P0 | on-change | 5.3 | ISO 27001:2022 Cl. 5.3 | 1.2, 8.1 |
| `IS-6.1` | document | P0 | annual | 6.1 | ISO 27001:2022 Cl. 6.1 | 2.1, 2.3, 2.4 |
| `IS-6.2` | document | P1 | annual | 6.2 | ISO 27001:2022 Cl. 6.2 | 2.1, 2.3, 2.4, 7.1 |
| `IS-6.3` | document | P1 | on-change | 6.3 | ISO 27001:2022 Cl. 6.3 | 6.5 |
| `IS-7.1` | document | P1 | annual | 7.1 | ISO 27001:2022 Cl. 7.1 | 1.2 |
| `IS-7.2` | training | P1 | annual | 7.2 | ISO 27001:2022 Cl. 7.2 | 8.2, 1.2, 8.3, 8.4 |
| `IS-7.3` | training | P1 | annual | 7.3 | ISO 27001:2022 Cl. 7.3 | 8.2, 8.4 |
| `IS-7.4` | document | P2 | on-change | 7.4 | ISO 27001:2022 Cl. 7.4 | none |
| `IS-7.5` | document | P1 | on-change | 7.5 | ISO 27001:2022 Cl. 7.5 | none |
| `IS-8.1` | document | P0 | on-change | 8.1 | ISO 27001:2022 Cl. 8.1 | 6.5 |
| `IS-8.2` | document | P0 | annual | 8.2 | ISO 27001:2022 Cl. 8.2 | 2.3, 2.1, 2.4 |
| `IS-8.3` | document | P0 | annual | 8.3 | ISO 27001:2022 Cl. 8.3 | 2.3, 2.1, 2.4 |
| `IS-9.1` | proof | P1 | monthly | 9.1 | ISO 27001:2022 Cl. 9.1 | 7.1 |
| `IS-9.2` | proof | P0 | annual | 9.2 | ISO 27001:2022 Cl. 9.2 | 7.2, 7.3, 7.4 |
| `IS-9.3` | sign-off | P0 | annual | 9.3 | ISO 27001:2022 Cl. 9.3 | 7.3, 1.3, 2.4, 7.1, 8.1, 12.4 |
| `IS-10.1` | proof | P1 | ongoing | 10.1 | ISO 27001:2022 Cl. 10.1 | 7.2, 7.4 |
| `IS-10.2` | document | P1 | on-change | 10.2 | ISO 27001:2022 Cl. 10.2 | none |

### ORG: organizational-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.5.1` | document | P0 | annual | A.5.1 | ISO 27001:2022 A.5.1 | 1.3, 2.4, 8.1, 12.4 |
| `A.5.2` | document | P0 | on-change | A.5.2 | ISO 27001:2022 A.5.2 | 1.2, 8.1 |
| `A.5.3` | document | P1 | on-change | A.5.3 | ISO 27001:2022 A.5.3 | 1.2, 8.1, 10.2, 10.4 |
| `A.5.4` | proof | P1 | annual | A.5.4 | ISO 27001:2022 A.5.4 | 1.2, 1.3, 2.4, 8.1, 12.4 |
| `A.5.5` | proof | P1 | annual | A.5.5 | ISO 27001:2022 A.5.5 | none |
| `A.5.6` | proof | P2 | annual | A.5.6 | ISO 27001:2022 A.5.6 | none |
| `A.5.7` | proof | P1 | ongoing | A.5.7 | ISO 27001:2022 A.5.7 | 2.1, 2.3, 2.4 |
| `A.5.8` | document | P1 | on-change | A.5.8 | ISO 27001:2022 A.5.8 | none |
| `A.5.9` | technical | P0 | ongoing | A.5.9 | ISO 27001:2022 A.5.9 | 2.2 |
| `A.5.10` | document | P1 | annual | A.5.10 | ISO 27001:2022 A.5.10 | none |
| `A.5.11` | document | P1 | on-change | A.5.11 | ISO 27001:2022 A.5.11 | none |
| `A.5.12` | document | P1 | annual | A.5.12 | ISO 27001:2022 A.5.12 | 2.2 |
| `A.5.13` | technical | P2 | on-change | A.5.13 | ISO 27001:2022 A.5.13 | 2.2 |
| `A.5.14` | document | P1 | on-change | A.5.14 | ISO 27001:2022 A.5.14 | none |
| `A.5.15` | document | P0 | annual | A.5.15 | ISO 27001:2022 A.5.15 | 10.1 |
| `A.5.16` | technical | P0 | on-change | A.5.16 | ISO 27001:2022 A.5.16 | 10.2 |
| `A.5.17` | technical | P0 | on-change | A.5.17 | ISO 27001:2022 A.5.17 | 11.3 |
| `A.5.18` | proof | P0 | quarterly | A.5.18 | ISO 27001:2022 A.5.18 | 10.3, 10.2, 10.4 |
| `A.5.19` | document | P0 | annual | A.5.19 | ISO 27001:2022 A.5.19 | 5.1, 2.1, 2.3, 2.4, 5.2, 5.3, 5.4 |
| `A.5.20` | document | P0 | on-change | A.5.20 | ISO 27001:2022 A.5.20 | 5.2, 2.1, 2.3, 2.4, 5.1, 5.3, 5.4 |
| `A.5.21` | proof | P1 | annual | A.5.21 | ISO 27001:2022 A.5.21 | 5.3, 2.1, 2.3, 2.4, 5.1, 5.2, 5.4, 6.1 |
| `A.5.22` | proof | P1 | annual | A.5.22 | ISO 27001:2022 A.5.22 | 5.1 |
| `A.5.23` | document | P0 | annual | A.5.23 | ISO 27001:2022 A.5.23 | 6.1 |
| `A.5.24` | document | P0 | annual | A.5.24 | ISO 27001:2022 A.5.24 | 3.1 |
| `A.5.25` | document | P0 | on-change | A.5.25 | ISO 27001:2022 A.5.25 | 3.2 |
| `A.5.26` | proof | P0 | on-change | A.5.26 | ISO 27001:2022 A.5.26 | 3.1, 3.3, 3.4, 4.2, 4.5 |
| `A.5.27` | proof | P1 | on-change | A.5.27 | ISO 27001:2022 A.5.27 | 3.5 |
| `A.5.28` | document | P2 | on-change | A.5.28 | ISO 27001:2022 A.5.28 | 3.2 |
| `A.5.29` | document | P1 | annual | A.5.29 | ISO 27001:2022 A.5.29 | 4.1, 4.2, 4.3, 4.5 |
| `A.5.30` | technical | P1 | annual | A.5.30 | ISO 27001:2022 A.5.30 | 4.3, 4.1, 4.2, 4.5 |
| `A.5.31` | document | P1 | annual | A.5.31 | ISO 27001:2022 A.5.31 | 7.3, 9.1 |
| `A.5.32` | proof | P2 | annual | A.5.32 | ISO 27001:2022 A.5.32 | none |
| `A.5.33` | technical | P1 | ongoing | A.5.33 | ISO 27001:2022 A.5.33 | none |
| `A.5.34` | document | P0 | annual | A.5.34 | ISO 27001:2022 A.5.34 | none |
| `A.5.35` | proof | P0 | annual | A.5.35 | ISO 27001:2022 A.5.35 | 7.2, 7.3, 7.4 |
| `A.5.36` | proof | P1 | annual | A.5.36 | ISO 27001:2022 A.5.36 | 1.3, 2.4, 7.3, 8.1, 12.4 |
| `A.5.37` | document | P1 | on-change | A.5.37 | ISO 27001:2022 A.5.37 | none |

### PPL: people-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.6.1` | proof | P1 | on-change | A.6.1 | ISO 27001:2022 A.6.1 | 10.3 |
| `A.6.2` | document | P1 | on-change | A.6.2 | ISO 27001:2022 A.6.2 | 1.2 |
| `A.6.3` | training | P0 | annual | A.6.3 | ISO 27001:2022 A.6.3 | 8.2, 1.2, 8.3, 8.4 |
| `A.6.4` | document | P2 | on-change | A.6.4 | ISO 27001:2022 A.6.4 | none |
| `A.6.5` | document | P1 | on-change | A.6.5 | ISO 27001:2022 A.6.5 | 10.3 |
| `A.6.6` | document | P1 | on-change | A.6.6 | ISO 27001:2022 A.6.6 | none |
| `A.6.7` | document | P1 | annual | A.6.7 | ISO 27001:2022 A.6.7 | none |
| `A.6.8` | proof | P0 | on-change | A.6.8 | ISO 27001:2022 A.6.8 | 3.2 |

### PHY: physical-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.7.1` | document | P1 | annual | A.7.1 | ISO 27001:2022 A.7.1 | none |
| `A.7.2` | proof | P1 | annual | A.7.2 | ISO 27001:2022 A.7.2 | 10.1 |
| `A.7.3` | document | P1 | annual | A.7.3 | ISO 27001:2022 A.7.3 | none |
| `A.7.4` | technical | P2 | ongoing | A.7.4 | ISO 27001:2022 A.7.4 | none |
| `A.7.5` | document | P1 | annual | A.7.5 | ISO 27001:2022 A.7.5 | none |
| `A.7.6` | document | P2 | on-change | A.7.6 | ISO 27001:2022 A.7.6 | none |
| `A.7.7` | proof | P1 | annual | A.7.7 | ISO 27001:2022 A.7.7 | none |
| `A.7.8` | proof | P1 | annual | A.7.8 | ISO 27001:2022 A.7.8 | none |
| `A.7.9` | document | P0 | annual | A.7.9 | ISO 27001:2022 A.7.9 | none |
| `A.7.10` | proof | P1 | on-change | A.7.10 | ISO 27001:2022 A.7.10 | none |
| `A.7.11` | proof | P2 | annual | A.7.11 | ISO 27001:2022 A.7.11 | none |
| `A.7.12` | proof | P2 | annual | A.7.12 | ISO 27001:2022 A.7.12 | none |
| `A.7.13` | proof | P1 | annual | A.7.13 | ISO 27001:2022 A.7.13 | 6.5 |
| `A.7.14` | proof | P1 | on-change | A.7.14 | ISO 27001:2022 A.7.14 | none |

### TEC: technological-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.8.1` | technical | P0 | annual | A.8.1 | ISO 27001:2022 A.8.1 | none |
| `A.8.2` | proof | P0 | quarterly | A.8.2 | ISO 27001:2022 A.8.2 | 10.2, 10.3, 10.4 |
| `A.8.3` | technical | P0 | on-change | A.8.3 | ISO 27001:2022 A.8.3 | 10.1 |
| `A.8.4` | technical | P0 | on-change | A.8.4 | ISO 27001:2022 A.8.4 | none |
| `A.8.5` | technical | P0 | annual | A.8.5 | ISO 27001:2022 A.8.5 | 11.1 |
| `A.8.6` | proof | P1 | ongoing | A.8.6 | ISO 27001:2022 A.8.6 | none |
| `A.8.7` | technical | P0 | ongoing | A.8.7 | ISO 27001:2022 A.8.7 | 8.2, 8.4 |
| `A.8.8` | technical | P0 | ongoing | A.8.8 | ISO 27001:2022 A.8.8 | 6.3, 6.4 |
| `A.8.9` | document | P1 | on-change | A.8.9 | ISO 27001:2022 A.8.9 | 6.2 |
| `A.8.10` | proof | P1 | on-change | A.8.10 | ISO 27001:2022 A.8.10 | none |
| `A.8.11` | technical | P2 | on-change | A.8.11 | ISO 27001:2022 A.8.11 | none |
| `A.8.12` | technical | P1 | ongoing | A.8.12 | ISO 27001:2022 A.8.12 | none |
| `A.8.13` | technical | P0 | annual | A.8.13 | ISO 27001:2022 A.8.13 | 4.4, 4.5 |
| `A.8.14` | proof | P1 | annual | A.8.14 | ISO 27001:2022 A.8.14 | 4.4, 4.5 |
| `A.8.15` | technical | P0 | ongoing | A.8.15 | ISO 27001:2022 A.8.15 | 3.2 |
| `A.8.16` | technical | P0 | ongoing | A.8.16 | ISO 27001:2022 A.8.16 | 3.2 |
| `A.8.17` | technical | P2 | ongoing | A.8.17 | ISO 27001:2022 A.8.17 | 3.2 |
| `A.8.18` | proof | P1 | on-change | A.8.18 | ISO 27001:2022 A.8.18 | 10.2, 10.3, 10.4 |
| `A.8.19` | document | P1 | on-change | A.8.19 | ISO 27001:2022 A.8.19 | none |
| `A.8.20` | technical | P0 | annual | A.8.20 | ISO 27001:2022 A.8.20 | none |
| `A.8.21` | document | P1 | annual | A.8.21 | ISO 27001:2022 A.8.21 | 10.1 |
| `A.8.22` | technical | P1 | on-change | A.8.22 | ISO 27001:2022 A.8.22 | none |
| `A.8.23` | technical | P2 | annual | A.8.23 | ISO 27001:2022 A.8.23 | none |
| `A.8.24` | document | P0 | annual | A.8.24 | ISO 27001:2022 A.8.24 | 9.1 |
| `A.8.25` | document | P1 | annual | A.8.25 | ISO 27001:2022 A.8.25 | 6.2 |
| `A.8.26` | document | P1 | on-change | A.8.26 | ISO 27001:2022 A.8.26 | none |
| `A.8.27` | document | P1 | on-change | A.8.27 | ISO 27001:2022 A.8.27 | none |
| `A.8.28` | proof | P1 | ongoing | A.8.28 | ISO 27001:2022 A.8.28 | none |
| `A.8.29` | technical | P1 | on-change | A.8.29 | ISO 27001:2022 A.8.29 | 6.3 |
| `A.8.30` | document | P2 | on-change | A.8.30 | ISO 27001:2022 A.8.30 | 5.1, 5.2, 5.3, 5.4 |
| `A.8.31` | technical | P1 | on-change | A.8.31 | ISO 27001:2022 A.8.31 | 6.2, 6.4 |
| `A.8.32` | proof | P0 | on-change | A.8.32 | ISO 27001:2022 A.8.32 | 6.5, 6.4 |
| `A.8.33` | proof | P1 | on-change | A.8.33 | ISO 27001:2022 A.8.33 | 6.3 |
| `A.8.34` | document | P2 | on-change | A.8.34 | ISO 27001:2022 A.8.34 | 6.3, 7.2, 7.4 |

## EU AI Act

10 categories, 24 requirements. Cites Regulation (EU) 2024/1689.

### AI-LIT: aiact-literacy

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-LIT.1` | training | P1 | annual | Art. 4 | AI Act Art. 4 | 8.1 |
| `AI-LIT.2` | training | P1 | every-3-years | Art. 4 | AI Act Art. 4, Art. 26(2) | 1.1 |

### AI-PRO: aiact-prohibited

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-PRO.1` | document | P0 | on-change | Art. 5 | AI Act Art. 5(1)(a)-(i) | none |
| `AI-PRO.2` | proof | P0 | on-change | Art. 5 | AI Act Art. 5 | none |

### AI-INV: aiact-inventory

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-INV.1` | document | P0 | ongoing | Art. 6 | AI Act Art. 6, Art. 26 | 2.2 |
| `AI-INV.2` | proof | P0 | on-change | Art. 6 | AI Act Art. 6, Art. 50 | none |
| `AI-INV.3` | proof | P1 | on-change | Art. 25 | AI Act Art. 25 | none |

### AI-RSK: aiact-risk-management

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-RSK.1` | document | P0 | one-time | Art. 9 | AI Act Art. 9 | 2.1, G-TOM.1, CRA-ESS.1 |
| `AI-RSK.2` | proof | P1 | annual | Art. 9 | AI Act Art. 9 | 2.3 |

### AI-FRI: aiact-fundamental-rights

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-FRI.1` | document | P0 | on-change | Art. 27 | AI Act Art. 27 | G-TOM.1 |

### AI-OVS: aiact-human-oversight

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-OVS.1` | proof | P0 | on-change | Art. 14 | AI Act Art. 14, Art. 26(2) | none |
| `AI-OVS.2` | proof | P1 | annual | Art. 14 | AI Act Art. 14 | none |

### AI-TRA: aiact-transparency

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-TRA.1` | document | P1 | on-change | Art. 50 | AI Act Art. 50(1) | G-ROP.1 |
| `AI-TRA.2` | technical | P1 | ongoing | Art. 50 | AI Act Art. 50(2) | none |
| `AI-TRA.3` | proof | P1 | on-change | Art. 50 | AI Act Art. 50(4) | none |

### AI-INC: aiact-incident-reporting

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-INC.1` | document | P0 | one-time | Art. 73 | AI Act Art. 73 | 3.1, G-BRC.1, CRA-INC.1 |
| `AI-INC.2` | proof | P0 | on-change | Art. 73 | AI Act Art. 73 | 3.3 |

### AI-DOC: aiact-technical-documentation

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-DOC.1` | document | P1 | on-change | Annex IV | AI Act Annex IV, Art. 11, Art. 18 | G-ROP.1, CRA-DOC.1 |
| `AI-DOC.2` | technical | P1 | ongoing | Art. 12 | AI Act Art. 12, Art. 19 | CRA-DOC.1 |
| `AI-DOC.3` | sign-off | P0 | on-change | Art. 47 | AI Act Art. 47, Annex V | none |

### AI-GPI: aiact-gpai

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `AI-GPI.1` | document | P1 | on-change | Art. 53 | AI Act Art. 53(1)(a) | none |
| `AI-GPI.2` | document | P1 | one-time | Art. 53 | AI Act Art. 53(1)(c) | none |
| `AI-GPI.3` | document | P1 | on-change | Art. 53 | AI Act Art. 53(1)(d) | none |
| `AI-GPI.4` | proof | P0 | ongoing | Art. 55 | AI Act Art. 55 | none |

## EU Cyber Resilience Act

10 categories, 21 requirements. Cites Regulation (EU) 2024/2847.

### CRA-MFG: cra-manufacturer-obligations

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-MFG.1` | document | P0 | on-change | Art. 13 | CRA Art. 13(2) | 2.1 |
| `CRA-MFG.2` | sign-off | P0 | on-change | Art. 13 | CRA Art. 13(5) | 2.4 |

### CRA-ESS: cra-essential-requirements

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-ESS.1` | technical | P0 | ongoing | Annex I | CRA Annex I Part I | AI-RSK.1, G-TOM.1 |
| `CRA-ESS.2` | technical | P0 | ongoing | Annex I | CRA Annex I Part I §2(b) | none |
| `CRA-ESS.3` | proof | P0 | on-change | Annex I | CRA Annex I Part I §2(a) | none |

### CRA-VLN: cra-vulnerability-handling

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-VLN.1` | document | P0 | one-time | Annex I | CRA Annex I Part II §1-2 | 6.3, G-BRC.1 |
| `CRA-VLN.2` | document | P0 | one-time | Annex I | CRA Annex I Part II §5-6 | none |
| `CRA-VLN.3` | technical | P0 | ongoing | Annex I | CRA Annex I Part II §2, §7-8 | 6.4 |
| `CRA-VLN.4` | proof | P1 | on-change | Annex I | CRA Annex I Part II §3 | none |

### CRA-INC: cra-incident-reporting

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-INC.1` | proof | P0 | on-change | Art. 14 | CRA Art. 14(2)(a) | 3.1, AI-INC.1 |
| `CRA-INC.2` | proof | P0 | on-change | Art. 14 | CRA Art. 14(2)(b) | 3.3 |
| `CRA-INC.3` | proof | P0 | on-change | Art. 14 | CRA Art. 14(2)(c) | 3.5 |
| `CRA-INC.4` | proof | P0 | on-change | Art. 14 | CRA Art. 14(8) | none |

### CRA-CONF: cra-conformity-assessment

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-CONF.1` | document | P0 | on-change | Art. 32 | CRA Art. 32(1) | none |
| `CRA-CONF.2` | proof | P0 | on-change | Art. 28 | CRA Art. 28, Art. 30 | none |

### CRA-DOC: cra-technical-documentation

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-DOC.1` | document | P0 | on-change | Annex VII | CRA Art. 31, Annex VII | AI-DOC.1, AI-DOC.2 |

### CRA-SUP: cra-support-period

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-SUP.1` | sign-off | P0 | one-time | Art. 13 | CRA Art. 13(8) | none |

### CRA-SBOM: cra-sbom

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-SBOM.1` | document | P1 | on-change | Annex I | CRA Annex I Part II §1 | none |

### CRA-IMP: cra-importer-distributor

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-IMP.1` | proof | P1 | on-change | Art. 19 | CRA Art. 19 | 5.1 |
| `CRA-IMP.2` | proof | P1 | on-change | Art. 20 | CRA Art. 20 | 5.2 |

### CRA-OSS: cra-oss-steward

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-OSS.1` | document | P1 | one-time | Art. 24 | CRA Art. 24 | none |

## Cross-Framework Satisfaction Pairs

212 pairs. `equivalent` marks the same record in both frameworks; `overlapping` marks a partial overlap, where the other framework still asks for more.

### NIS2 and GDPR (20)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `5.1` | `G-DPA.1` | overlapping | Same supplier rows feed both; neither the register nor the 5.2 clauses is the Art. 28 agreement. |
| `5.2` | `G-DPA.1` | overlapping | CIR 5.1.4 covers part of an Art. 28(3) DPA: its cybersecurity requirements (a) speak to Art. 28(3)(c), its audit rights (e) to (h), its subcontracting rules (g) to (d), its termination retrieval and disposal (h) to (g). Art. 28(3) points (a), (b), (e) and (f) have no CIR counterpart: documented instructions, confidentiality, assistance with data subject rights, and assistance with Arts. 32 to 36. Nor does CIR 5.1.4 carry the Art. 28(3) statement of subject-matter, duration, nature, purpose, data types and categories of data subjects. CIR 5.1.4 clauses are also owed only 'where appropriate'; Art. 28(3) is unconditional. A 5.2 clause set is not a DPA. |
| `5.2` | `G-DPA.2` | overlapping | Same supplier rows hold sub-processor lists; the Art. 28(2) authorisation is not recorded. |
| `2.1` | `G-ROP.1` | overlapping | The 2.1 method rates assets; Art. 30 records processing activities. |
| `2.2` | `G-ROP.1` | overlapping | Asset rows inform the Art. 30 record, but a RoPA documents processing activities (purposes, recipients, retention), not IT assets. |
| `2.3` | `G-ROP.1` | overlapping | Asset ratings can point to high-risk processing (Art. 35); Art. 30 records no risk. |
| `3.1` | `G-BRC.1` | overlapping | The incident plan can carry the Art. 33 notification but lacks its risk test and the late-filing reasons. |
| `3.2` | `G-BRC.2` | overlapping | Incident rows can hold Art. 33(5) facts, effects and remedy, but only for IT incidents; Art. 4(12) is wider. |
| `3.3` | `G-BRC.1` | overlapping | Same underlying event, separate filings: the NIS2 24h/72h/1-month cascade goes to the BSI/BBK Meldestelle, the GDPR Art. 33 notification, in phases if need be (Art. 33(4)), to the data protection authority. |
| `3.5` | `G-BRC.2` | overlapping | Post-incident review evidence overlaps the Art. 33(5) breach documentation; the BSI final report itself is §32(1) Nr. 4 BSIG, tracked under 3.3. |
| `2.4` | `G-TOM.1` | overlapping | The risk treatment plan lists measures Art. 32 asks for too; Art. 32 asks for the measures, not an approval. |
| `9.1` | `G-TOM.1` | overlapping | Art. 21(2)(h) ↔ Art. 32(1)(a): the CIR 9.1 cryptography policy is the documented position on encryption that Art. 32(1)(a) expects. Scope differs in one direction only: Art. 32(1)(a) names pseudonymisation alongside encryption and NIS2 does not, so the policy can satisfy the encryption half and leave pseudonymisation unaddressed. |
| `9.2` | `G-TOM.1` | overlapping | Art. 21(2)(h) ↔ Art. 32(1)(a): encryption at rest and in transit is the same control under both regimes. NIS2 applies it to network and information systems, Art. 32 to personal data, so the measure carries over while the scope statement does not. |
| `4.4` | `G-TOM.1` | overlapping | Art. 21(2)(c) ↔ Art. 32(1)(c): 'the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident' is what a tested backup and restore programme evidences. A restore that has never been tested evidences neither. |
| `4.3` | `G-TOM.1` | overlapping | Art. 21(2)(c) ↔ Art. 32(1)(c): the disaster recovery plan carries the recovery-time side of the same restore duty. Art. 32(1)(c) bounds it by 'in a timely manner' rather than by a stated RTO, so the NIS2 target is evidence for it and not a substitute. |
| `7.1` | `G-TOM.1` | overlapping | Art. 21(2)(f) ↔ Art. 32(1)(d): 'a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures'. The CIR 7.1 KPI records are that process running. Art. 32(1)(d) is the one enumerated item creating an ongoing duty rather than a one-off measure. |
| `7.2` | `G-TOM.1` | overlapping | Art. 21(2)(f) ↔ Art. 32(1)(d): the internal audit programme is the assessing and evaluating half of the same clause, where 7.1 is the measuring half. |
| `10.1` | `G-TOM.1` | overlapping | Art. 21(2)(i) ↔ Art. 32(1)(b): the access control policy is the primary evidence for 'ongoing confidentiality' of processing systems. Art. 32(1)(b) also covers integrity, availability and resilience, which this requirement does not reach. |
| `11.1` | `G-TOM.1` | overlapping | Art. 21(2)(j) ↔ Art. 32 by implication: Art. 32 nowhere names MFA, and its 'appropriate measures' clause is what carries it. CIR 11.7.1 asks for MFA or continuous authentication where appropriate, for the CIR's entity types; for everyone else Art. 21(1) proportionality decides, exactly as Art. 32(1) does. Never 'equivalent': one is a named control, the other an open standard that the control happens to meet. |
| `3.5` | `G-BRC.3` | overlapping | Art. 23(1) ↔ Art. 34: both require telling people outside the authority about an incident, and the post-incident communication is where a company decides who hears what. The duties do not merge. NIS2 addresses the recipients of the service when provision is adversely affected; Art. 34 addresses the data subjects when the breach is likely to result in a high risk to their rights and freedoms, and the Art. 34(3) carve-outs apply to the GDPR side only. |

### EU AI Act and NIS2 (7)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `AI-LIT.1` | `8.1` | overlapping | AI literacy training programme overlaps with the topic-specific IT security rules under CIR 1.1.1(i). |
| `AI-LIT.2` | `1.1` | overlapping | Management body AI training (Art. 4 + 26(2)) overlaps with the §38(3) BSIG management cybersecurity training. |
| `AI-INV.1` | `2.2` | equivalent | Same inventory: AI systems are assets, so one register satisfies both the NIS2 asset list and the AI Act inventory. |
| `AI-RSK.1` | `2.1` | overlapping | The process shape carries over: CIR 2.1.2 requires identification, analysis, assessment and treatment of risks, which is the loop Art. 9(2) describes. The scope does not: CIR 2.1 is bounded to risks to network and information systems, while Art. 9 covers risks to health, safety and fundamental rights and pulls in post-market monitoring data (Art. 9(2)(c)). Both sides require residual risk to be accepted, but against different criteria (Art. 9(5) vs CIR 2.1.1). Art. 9(10) lets you combine the procedures; it does not merge the duties. |
| `AI-RSK.2` | `2.3` | equivalent | Annual AI risk review feeds the same asset-classification update NIS2 expects. |
| `AI-INC.1` | `3.1` | overlapping | AI incident response procedure overlaps with the NIS2 incident handling policy under CIR 3.1. |
| `AI-INC.2` | `3.3` | overlapping | Same underlying event, separate filings: the AI Act Art. 73 report goes to the market surveillance authority, the NIS2 24h/72h cascade to the BSI Meldestelle. Art. 73(2) sets 15 days, but a serious and irreversible disruption of the management or operation of critical infrastructure (Art. 3(49)(b)) is due within two days under Art. 73(3), and a death within 10 days under Art. 73(4). Entities in NIS2 scope should plan for the two-day clock. |

### EU AI Act and GDPR (5)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `AI-FRI.1` | `G-TOM.1` | overlapping | Fundamental Rights Impact Assessment overlaps with the GDPR Art. 35 DPIA when the AI system processes personal data. |
| `AI-TRA.1` | `G-ROP.1` | overlapping | AI Act Art. 50 transparency to end users overlaps with GDPR Art. 13/14 information duties when the AI processes personal data. |
| `AI-RSK.1` | `G-TOM.1` | overlapping | AI risk management framework under Art. 9 overlaps with the technical and organisational measures GDPR Art. 32 requires. |
| `AI-DOC.1` | `G-ROP.1` | overlapping | Annex IV technical documentation overlaps with the GDPR Art. 30 records of processing when the AI system processes personal data. |
| `AI-INC.1` | `G-BRC.1` | overlapping | AI Act Art. 73 incident response procedure overlaps with the GDPR Art. 33 breach response procedure when the incident involves personal data. |

### EU Cyber Resilience Act and NIS2 (9)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `CRA-VLN.1` | `6.3` | overlapping | Vulnerability handling procedures overlap with NIS2 vulnerability and patch management requirements. |
| `CRA-VLN.3` | `6.4` | overlapping | The maker issues updates; 6.4 has the entity install them. No shared record. |
| `CRA-INC.1` | `3.1` | overlapping | Different artefacts: CIR 3.1 is the internal incident handling policy, CRA Art. 14(2)(a) is a 24h early warning filed to the CSIRT coordinator and ENISA via the Art. 16 platform. The policy is where you name who files it; having the policy does not discharge the filing. |
| `CRA-INC.2` | `3.3` | overlapping | Same event, separate filings: CRA Art. 14(2)(b) notifies the exploited product vulnerability to the CSIRT coordinator and ENISA, NIS2 Art. 23(4)(b) the entity's own significant incident to its CSIRT. |
| `CRA-INC.3` | `3.5` | overlapping | The CRA 14-day report (Art. 14(2)(c)) names the fix, not a root cause; the fix feeds the NIS2 post-incident review. NIS2's final report (Art. 23(4)(d)) is 3.3. |
| `CRA-IMP.1` | `5.1` | overlapping | Importer due diligence on manufacturers overlaps with the NIS2 supplier security policy. |
| `CRA-IMP.2` | `5.2` | overlapping | Distributor checks overlap with NIS2 supplier contractual security clauses. |
| `CRA-MFG.1` | `2.1` | overlapping | The per-product assessment can reuse the 2.1 method, but Art. 13(3) analyses each product's use. |
| `CRA-MFG.2` | `2.4` | overlapping | Our practice: the CRA wants no sign-off on Art. 13(5) due diligence; management signs it here, as for 2.4. |

### EU Cyber Resilience Act and EU AI Act (4)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `CRA-ESS.1` | `AI-RSK.1` | overlapping | Essential cybersecurity requirements (Annex I) overlap with AI risk management for high-risk AI systems with embedded digital elements. CRA Art. 12(1) deems them to meet AI Act Art. 15 on cybersecurity, not on accuracy or robustness; it does not reach the Art. 9 risk management system AI-RSK.1 tracks. |
| `CRA-DOC.1` | `AI-DOC.1` | overlapping | For a product that is also high-risk AI, CRA Art. 31(3) wants one technical file with Annex VII and AI Act Annex IV. |
| `CRA-INC.1` | `AI-INC.1` | overlapping | Active-exploitation reporting overlaps with the AI Act incident response procedure when the AI system is also a product with digital elements. |
| `CRA-DOC.1` | `AI-DOC.2` | overlapping | Annex VII holds no logging evidence; the AI Act Art. 12 logs are a capability of the system itself. |

### EU Cyber Resilience Act and GDPR (2)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `CRA-ESS.1` | `G-TOM.1` | overlapping | Essential cybersecurity requirements (Annex I) overlap with the technical and organisational measures GDPR Art. 32 requires when the product processes personal data. |
| `CRA-VLN.1` | `G-BRC.1` | overlapping | Vulnerability handling procedures feed the GDPR Art. 33 breach response when a vulnerability leads to a personal-data breach. |

### ISO/IEC 27001:2022 and NIS2 (165)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `IS-5.1` | `1.3` | equivalent | Cl. 5.1(c) resource commitment is the same resourcing decision the 1.3 budget sign-off evidences (CIR 1.1.1(e)). |
| `A.5.2` | `1.2` | equivalent | Same roles artefact: A.5.2 information security roles and responsibilities is the role assignment 1.2 records (CIR 1.2). |
| `IS-6.1` | `2.1` | equivalent | Same methodology document: the Cl. 6.1 risk assessment methodology is the risk management methodology NIS2 CIR 2.1 requires. |
| `IS-8.2` | `2.3` | equivalent | Same risk register: Cl. 8.2 operational risk assessment results are the 2.3 register rows. |
| `IS-8.3` | `2.3` | equivalent | Same treatment records: Cl. 8.3 risk treatment implements the 2.3 register's treatment decisions. |
| `A.5.9` | `2.2` | equivalent | Asset inventory (A.5.9) is the same register NIS2 CIR 12.4 / §30(2) Nr. 9 BSIG requires for asset identification. |
| `A.5.24` | `3.1` | equivalent | Same incident response procedure: A.5.24 incident management planning produces the policy NIS2 CIR 3.1 requires. |
| `A.5.25` | `3.2` | equivalent | Same event assessment process: A.5.25 covers the detection and logging NIS2 CIR 3.2/3.4 expects. |
| `A.5.26` | `3.1` | equivalent | Response to IS incidents (A.5.26) implements the same response procedure; same incident record. |
| `A.5.26` | `3.3` | equivalent | Response execution under A.5.26 and the NIS2 24h/72h CSIRT cascade share the same underlying event record. |
| `A.5.27` | `3.5` | equivalent | Same lessons-learned report: A.5.27 output is the post-incident review NIS2 CIR 3.6 requires. |
| `A.5.29` | `4.1` | equivalent | Same continuity policy: A.5.29 IS continuity policy is the BCP framework document NIS2 CIR 4.1 requires. |
| `A.5.30` | `4.3` | equivalent | Same ICT readiness plan: A.5.30 maps directly to the NIS2 ICT continuity requirements; one plan satisfies both. |
| `A.8.13` | `4.4` | equivalent | Same backup programme: A.8.13 backup controls satisfy the NIS2 backup management requirements under CIR 4.2. |
| `A.5.19` | `5.1` | equivalent | Same supplier security policy: A.5.19 supplier relationship IS policy is the policy NIS2 CIR 5.1 requires. |
| `A.5.20` | `5.2` | equivalent | Same contractual clauses: A.5.20 IS requirements in supplier agreements cover the clauses NIS2 CIR 5.1.4 mandates. |
| `A.5.21` | `5.3` | equivalent | Same supplier risk assessment process satisfies both A.5.21 and the NIS2 CIR 5.1.6 monitoring obligation. |
| `A.8.8` | `6.3` | equivalent | Same vulnerability programme: A.8.8 technical vulnerability management is the scanning programme NIS2 CIR 6.5/6.10 requires. |
| `A.8.8` | `6.4` | equivalent | Same patch programme: A.8.8 timely remediation maps to the patch management cadence NIS2 CIR 6.6 mandates. |
| `A.8.32` | `6.5` | equivalent | Same change record: A.8.32 change management is the CIR 6.4 change process requirement 6.5 tracks; both write the same change_request rows. |
| `IS-9.1` | `7.1` | equivalent | Same KPI records: Cl. 9.1 monitoring, measurement and analysis produces the KPI evidence NIS2 CIR 7.1/7.2 requires. |
| `IS-9.2` | `7.2` | equivalent | Internal audit programme (Cl. 9.2) is the independent review CIR 2.3 requires; same audit records. |
| `IS-9.3` | `7.3` | equivalent | Same CEO sign-off artefact: Cl. 9.3 management review is the regular management reporting CIR 2.2.1 requires. |
| `A.5.35` | `7.2` | equivalent | Same audit programme: A.5.35 independent review of information security is the CIR 2.3 independent review. |
| `A.6.3` | `8.2` | equivalent | Same training programme satisfies both A.6.3 employee awareness and NIS2 CIR 8.1 awareness raising. |
| `IS-7.2` | `8.2` | equivalent | Same training records: Cl. 7.2 competence records document the staff awareness NIS2 CIR 8.1 expects. |
| `A.8.24` | `9.1` | equivalent | Same cryptography policy: A.8.24 is the policy NIS2 CIR 9.1 / BSI TR-02102 requires. |
| `A.5.15` | `10.1` | equivalent | Same access control policy: A.5.15 is the policy NIS2 CIR 11.1 requires. |
| `A.5.16` | `10.2` | equivalent | Same IAM programme: A.5.16 identity management covers the identity and access management NIS2 CIR 11.2 mandates. |
| `A.5.18` | `10.3` | equivalent | Same access-rights records: A.5.18 produces the change-controlled access evidence NIS2 CIR 11.2 expects. |
| `A.8.5` | `11.1` | equivalent | Same MFA control: A.8.5 secure authentication implements the MFA/continuous-authentication requirement NIS2 CIR 11.7 mandates. |
| `IS-5.3` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 5.3 for CIR point 1.2: a relevant reference, not the same record. |
| `A.5.3` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.3 for CIR point 1.2: a relevant reference, not the same record. |
| `A.5.4` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.4 for CIR point 1.2: a relevant reference, not the same record. |
| `IS-7.1` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 7.1 for CIR point 10.1: a relevant reference, not the same record. |
| `IS-7.2` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 7.2 for CIR point 10.1: a relevant reference, not the same record. |
| `A.6.2` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.2 for CIR point 10.1: a relevant reference, not the same record. |
| `A.6.3` | `1.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.3 for CIR point 10.1: a relevant reference, not the same record. |
| `IS-5.2` | `1.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 5.2 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.1` | `1.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.1 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.36` | `1.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.36 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.4` | `1.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.4 for CIR point 1.1: a relevant reference, not the same record. |
| `IS-9.3` | `1.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.3 for CIR point 1.1: a relevant reference, not the same record. |
| `IS-6.2` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.2 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-8.2` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 8.2 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-8.3` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 8.3 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.7` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.7 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.19` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.19 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.20` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.20 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.21` | `2.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.12` | `2.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.12 for CIR point 12.1: a relevant reference, not the same record. |
| `A.5.13` | `2.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.13 for CIR point 12.1: a relevant reference, not the same record. |
| `IS-6.1` | `2.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.1, 6.1.2, 6.1.3 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-6.2` | `2.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.2 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.7` | `2.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.7 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.19` | `2.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.19 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.20` | `2.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.20 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.21` | `2.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-5.2` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 5.2 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.1` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.1 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.36` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.36 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.4` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.4 for CIR point 1.1: a relevant reference, not the same record. |
| `IS-9.3` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.3 for CIR point 1.1: a relevant reference, not the same record. |
| `IS-6.1` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.1, 6.1.2, 6.1.3 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-6.2` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.2 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-8.2` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 8.2 for CIR point 2.1: a relevant reference, not the same record. |
| `IS-8.3` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 8.3 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.7` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.7 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.19` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.19 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.20` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.20 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.21` | `2.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 2.1: a relevant reference, not the same record. |
| `A.5.28` | `3.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.28 for CIR point 3.2: a relevant reference, not the same record. |
| `A.8.15` | `3.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.15 for CIR point 3.2: a relevant reference, not the same record. |
| `A.8.16` | `3.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.16 for CIR point 3.2: a relevant reference, not the same record. |
| `A.8.17` | `3.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.17 for CIR point 3.2: a relevant reference, not the same record. |
| `A.6.8` | `3.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.8 for CIR point 3.3: a relevant reference, not the same record. |
| `A.5.26` | `3.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.26 for CIR point 3.5: a relevant reference, not the same record. |
| `A.5.30` | `4.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.30 for CIR point 4.1: a relevant reference, not the same record. |
| `A.5.29` | `4.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.29 for CIR point 4.1; A.5.29 for CIR point 4.3: a relevant reference, not the same record. |
| `A.5.30` | `4.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.30 for CIR point 4.1; A.5.30 for CIR point 4.3: a relevant reference, not the same record. |
| `A.5.26` | `4.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.26 for CIR point 4.3: a relevant reference, not the same record. |
| `A.5.29` | `4.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.29 for CIR point 4.1: a relevant reference, not the same record. |
| `A.8.14` | `4.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.14 for CIR point 4.2: a relevant reference, not the same record. |
| `A.5.29` | `4.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.29 for CIR point 4.1; A.5.29 for CIR point 4.3: a relevant reference, not the same record. |
| `A.5.30` | `4.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.30 for CIR point 4.1; A.5.30 for CIR point 4.3: a relevant reference, not the same record. |
| `A.8.13` | `4.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.13 for CIR point 4.2: a relevant reference, not the same record. |
| `A.8.14` | `4.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.14 for CIR point 4.2: a relevant reference, not the same record. |
| `A.5.26` | `4.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.26 for CIR point 4.3: a relevant reference, not the same record. |
| `A.5.20` | `5.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.20 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.21` | `5.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 5.1: a relevant reference, not the same record. |
| `A.8.30` | `5.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.30 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.22` | `5.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.22 for CIR point 5.2: a relevant reference, not the same record. |
| `A.5.19` | `5.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.19 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.21` | `5.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 5.1: a relevant reference, not the same record. |
| `A.8.30` | `5.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.30 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.19` | `5.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.19 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.20` | `5.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.20 for CIR point 5.1: a relevant reference, not the same record. |
| `A.8.30` | `5.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.30 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.19` | `5.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.19 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.20` | `5.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.20 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.21` | `5.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 5.1: a relevant reference, not the same record. |
| `A.8.30` | `5.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.30 for CIR point 5.1: a relevant reference, not the same record. |
| `A.5.21` | `6.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.21 for CIR point 6.1: a relevant reference, not the same record. |
| `A.5.23` | `6.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.23 for CIR point 6.1: a relevant reference, not the same record. |
| `A.8.25` | `6.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.25 for CIR point 6.2: a relevant reference, not the same record. |
| `A.8.31` | `6.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.31 for CIR point 6.2: a relevant reference, not the same record. |
| `A.8.9` | `6.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.9 for CIR point 6.3: a relevant reference, not the same record. |
| `A.8.29` | `6.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.29 for CIR point 6.5: a relevant reference, not the same record. |
| `A.8.33` | `6.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.33 for CIR point 6.5: a relevant reference, not the same record. |
| `A.8.34` | `6.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.34 for CIR point 6.5: a relevant reference, not the same record. |
| `A.8.31` | `6.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.31 for CIR point 6.6: a relevant reference, not the same record. |
| `A.8.32` | `6.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.32 for CIR point 6.6: a relevant reference, not the same record. |
| `IS-6.3` | `6.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.3 for CIR point 6.4: a relevant reference, not the same record. |
| `IS-8.1` | `6.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 8.1 for CIR point 6.4: a relevant reference, not the same record. |
| `A.7.13` | `6.5` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.7.13 for CIR point 6.4: a relevant reference, not the same record. |
| `IS-6.2` | `7.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 6.2 for CIR point 7.1: a relevant reference, not the same record. |
| `IS-9.3` | `7.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.3 for CIR point 7.1: a relevant reference, not the same record. |
| `IS-10.1` | `7.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 10.1 for CIR point 2.3: a relevant reference, not the same record. |
| `A.8.34` | `7.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.34 for CIR point 2.3: a relevant reference, not the same record. |
| `IS-9.2` | `7.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.2 for CIR point 2.2: a relevant reference, not the same record. |
| `A.5.31` | `7.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.31 for CIR point 2.2: a relevant reference, not the same record. |
| `A.5.35` | `7.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.35 for CIR point 2.2: a relevant reference, not the same record. |
| `A.5.36` | `7.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.36 for CIR point 2.2: a relevant reference, not the same record. |
| `IS-9.2` | `7.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.2 for CIR point 2.3: a relevant reference, not the same record. |
| `IS-10.1` | `7.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 10.1 for CIR point 2.3: a relevant reference, not the same record. |
| `A.5.35` | `7.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.35 for CIR point 2.3: a relevant reference, not the same record. |
| `A.8.34` | `7.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.34 for CIR point 2.3: a relevant reference, not the same record. |
| `IS-5.2` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 5.2 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.1` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.1 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.36` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.36 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.4` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.4 for CIR point 1.1; A.5.4 for CIR point 1.2: a relevant reference, not the same record. |
| `IS-9.3` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.3 for CIR point 1.1: a relevant reference, not the same record. |
| `IS-5.3` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 5.3 for CIR point 1.2: a relevant reference, not the same record. |
| `A.5.2` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.2 for CIR point 1.2: a relevant reference, not the same record. |
| `A.5.3` | `8.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.3 for CIR point 1.2: a relevant reference, not the same record. |
| `IS-7.3` | `8.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 7.3 for CIR point 8.1: a relevant reference, not the same record. |
| `A.8.7` | `8.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.7 for CIR point 8.1: a relevant reference, not the same record. |
| `IS-7.2` | `8.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 7.2 for CIR point 8.2: a relevant reference, not the same record. |
| `A.6.3` | `8.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.3 for CIR point 8.2: a relevant reference, not the same record. |
| `IS-7.3` | `8.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 7.3 for CIR point 8.1: a relevant reference, not the same record. |
| `A.6.3` | `8.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.3 for CIR point 8.1; A.6.3 for CIR point 8.2: a relevant reference, not the same record. |
| `A.8.7` | `8.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.7 for CIR point 8.1: a relevant reference, not the same record. |
| `IS-7.2` | `8.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 7.2 for CIR point 8.2: a relevant reference, not the same record. |
| `A.5.31` | `9.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.31 for CIR point 9.1: a relevant reference, not the same record. |
| `A.7.2` | `10.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.7.2 for CIR point 11.1: a relevant reference, not the same record. |
| `A.8.3` | `10.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.3 for CIR point 11.1: a relevant reference, not the same record. |
| `A.8.21` | `10.1` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.21 for CIR point 11.1: a relevant reference, not the same record. |
| `A.5.3` | `10.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.3 for CIR point 11.2: a relevant reference, not the same record. |
| `A.5.18` | `10.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.18 for CIR point 11.2: a relevant reference, not the same record. |
| `A.8.2` | `10.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.2 for CIR point 11.3: a relevant reference, not the same record. |
| `A.8.18` | `10.2` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.18 for CIR point 11.3: a relevant reference, not the same record. |
| `A.6.1` | `10.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.1 for CIR point 10.2: a relevant reference, not the same record. |
| `A.6.5` | `10.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.6.5 for CIR point 10.3: a relevant reference, not the same record. |
| `A.8.2` | `10.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.2 for CIR point 11.3: a relevant reference, not the same record. |
| `A.8.18` | `10.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.18 for CIR point 11.3: a relevant reference, not the same record. |
| `A.5.3` | `10.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.3 for CIR point 11.2: a relevant reference, not the same record. |
| `A.5.18` | `10.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.18 for CIR point 11.2: a relevant reference, not the same record. |
| `A.8.2` | `10.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.2 for CIR point 11.3: a relevant reference, not the same record. |
| `A.8.18` | `10.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.8.18 for CIR point 11.3: a relevant reference, not the same record. |
| `A.5.17` | `11.3` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.17 for CIR point 11.6: a relevant reference, not the same record. |
| `IS-5.2` | `12.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 5.2 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.1` | `12.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.1 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.36` | `12.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.36 for CIR point 1.1: a relevant reference, not the same record. |
| `A.5.4` | `12.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 A.5.4 for CIR point 1.1: a relevant reference, not the same record. |
| `IS-9.3` | `12.4` | overlapping | ENISA mapping table v1.2 lists ISO 27001 9.3 for CIR point 1.1: a relevant reference, not the same record. |

## Article-Level Mapping, NIS2 and GDPR

12 concept-level mappings between NIS2 articles and GDPR articles.

| NIS2 Article | GDPR Article | Concept | Link Type | Notes |
|---|---|---|---|---|
| Art. 35 | Art. 4(12), Art. 33, Art. 55, Art. 56, Art. 58(2)(i) | Infringements entailing a personal data breach — competent authority must inform DPA; ne bis in idem on fines | directive_explicit | Art. 35(1) NIS 2 (paraphrased): where competent authorities become aware in supervision or enforcement that an infringement of Articles 21 and 23 NIS 2 by an essential or important entity can entail a personal data breach as defined in Art. 4(12) GDPR which is to be notified pursuant to Art. 33 GDPR, they shall without undue delay inform the supervisory authorities referred to in Art. 55 or 56 GDPR. Art. 35(2): where DPA imposes an Art. 58(2)(i) GDPR fine, the NIS 2 competent authority shall not impose an Art. 34 NIS 2 administrative fine for an infringement arising from the same conduct. Art. 35(3): where the GDPR supervisory authority is established in another Member State, the NIS 2 competent authority informs the supervisory authority established in its own Member State. |
| Art. 21(1) | Art. 32(1) | Appropriate technical and organisational measures — verbatim language overlap | verbatim_language | Both articles use nearly identical chapeau: 'appropriate technical and organisational measures', 'state of the art', 'cost of implementation'. The substantive overlap is here. NIS 2 adds 'and proportionate' and 'operational' to the measure types. |
| Art. 21(2)(d) | Art. 28 | Supply-chain security ↔ Processor agreements | structural_overlap | The supplier is the same; the records are not: a NIS 2 supplier row is no Art. 28(3) contract. NIS 2 cares about supplier cybersecurity posture; GDPR Art. 28(3)(c) requires the processor contract to obligate the processor to take all Art. 32 GDPR measures. The GDPR DPA is the contractual baseline; NIS 2 adds risk-based ongoing oversight (Art. 21(2)(d) + Art. 21(3)). |
| Art. 21(2)(h) | Art. 32(1)(a) | Cryptography and encryption measures | structural_overlap | The same encryption measure can serve both. GDPR Art. 32(1)(a) names pseudonymisation alongside encryption; NIS 2 Art. 21(2)(h) does not. |
| Art. 21(2)(c) | Art. 32(1)(c) | Business continuity, recovery from incident, availability and resilience | structural_overlap | GDPR Art. 32(1)(c): 'the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident'. NIS 2 Art. 21(2)(c) covers BCP + crisis management more broadly. |
| Art. 21(2)(f) | Art. 32(1)(d) | Effectiveness assessment of security measures | structural_overlap | GDPR Art. 32(1)(d): 'a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures'. NIS 2 Art. 21(2)(f) asks for the same in the cybersecurity context; the GDPR one also covers measures for personal data that NIS 2 does not reach. |
| Art. 21(2)(i) | Art. 29, Art. 32(4) | HR security, confidentiality, access control | structural_overlap | For the company's own staff, Art. 29 GDPR: persons acting under the authority of the controller 'shall not process those data except on instructions from the controller', and Art. 32(4): the controller takes steps to ensure they do not. NIS 2 Art. 21(2)(i) covers HR security + access control + asset management as the cybersecurity equivalent. Art. 28(3)(b), confidentiality of the processor's staff, is a clause in the processor contract and belongs to the supply-chain row. |
| Art. 21(2)(j) | Art. 32 (implicit) | MFA, continuous authentication, secure communications and emergency comms | structural_overlap | GDPR Art. 32 does not name MFA explicitly. The 'appropriate measures' clause implicitly covers it. CIR 2024/2690 Annex 11.7.1, for the entity types the CIR covers, asks for multiple authentication factors or continuous authentication 'where appropriate, in accordance with the classification of the asset to be accessed'. For other entities, Art. 21(1) proportionality applies. |
| Art. 20(2) | Art. 39(1)(b) | Management body training | structural_overlap | NIS 2 Art. 20(2) requires management body training; non-delegable per §38(3) BSIG. GDPR Art. 39(1)(b) tasks the DPO with monitoring compliance, including the awareness-raising and training of staff involved in processing operations. Different audiences, distinct obligations. |
| Art. 21(2)(g) | Art. 39(1)(b) | Basic cyber hygiene practices and cybersecurity training (staff) | structural_overlap | NIS 2 Art. 21(2)(g): cyber hygiene + training for all staff. GDPR Art. 39(1)(b): DPO oversees awareness-raising and training 'of staff involved in processing operations'. GDPR scope is data-protection-specific and may be a staff subset; NIS 2 scope is broader. |
| Art. 23 | Art. 33, Art. 34 | Incident notification (parallel workflows) | parallel_workflow | Same incident may trigger both: NIS 2 Art. 23 24h/72h/intermediate/1mo to CSIRT; GDPR Art. 33 72h to supervisory authority; GDPR Art. 34 to data subjects when high risk. Different recipients, thresholds, and content. Recital 106 asks Member States to provide technical means such as a single entry point; that eases filing but merges neither duty into the other, so both notifications are owed. |
| (none) | Art. 30 | Records of processing activities — explicitly NOT a supplier register | no_mapping | GDPR Art. 30 requires the controller's records of its own processing activities (purposes, data categories, recipients, retention, security summary). Art. 30(1)(d) describes CATEGORIES of recipients, not a list of individual suppliers. The correct GDPR analog for NIS 2 Art. 21(2)(d) supply-chain security is Art. 28 (Processor), not Art. 30. This row exists to prevent future authors from re-introducing this common error. |

## Coverage Summary

| | Categories | Requirements |
|---|---|---|
| NIS2 | 12 | 49 |
| GDPR | 6 | 9 |
| ISO/IEC 27001:2022 | 5 | 116 |
| EU AI Act | 10 | 24 |
| EU Cyber Resilience Act | 10 | 21 |

**Satisfaction pairs:** 212, in 7 framework combinations.
**Article-level mappings:** 12 concept-level rows.

---

Maintained by [nisd2.eu](https://www.nisd2.eu). Issues and contributions welcome: see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
