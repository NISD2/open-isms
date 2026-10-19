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
| `12.1` | document | P0 | on-change | Art. 3(1)-(2) | §28, §33(1) BSIG | A.5.31 |
| `12.2` | proof | P0 | one-time | Art. 3(3)-(4) | §33(1) BSIG | none |
| `12.3` | proof | P1 | on-change | Art. 3(4) | §33(5) BSIG | none |
| `12.4` | proof | P2 | ongoing | none | §30(1) S. 3, §31(2), §39, §34 BSIG | none |

### GOV: governance

BSI IT-Grundschutz module: `ISMS.1`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `1.1` | training | P0 | every-3-years | Art. 20(2) | §38(3) BSIG | AI-LIT.2 |
| `1.2` | proof | P1 | annual | Art. 21(2)(a) | §30(1) BSIG, CIR 1.2, CIR 10.1.3 | IS-5.2, IS-5.3, A.5.1, A.5.2, A.5.31 |
| `1.3` | proof | P1 | annual | Art. 20(1) | §38(1) BSIG, CIR 1.1.1(e) | IS-5.1, IS-9.3 |
| `1.4` | sign-off | P1 | on-change | Art. 20(1) | §38(2) BSIG | IS-5.1 |

### RSK: risk-management

BSI IT-Grundschutz module: `BSI-200-3`. Estimated effort: 60 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `2.1` | document | P0 | on-change | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.2 | G-ROP.1, AI-RSK.1, CRA-MFG.1, IS-6.1, IS-8.2, IS-8.3 |
| `2.2` | technical | P0 | ongoing | Art. 21(2)(a), Art. 21(2)(i) | §30(2) Nr. 1 und 9 BSIG, CIR 12 | G-ROP.1, AI-INV.1, A.5.9, A.8.1, A.8.10 |
| `2.3` | technical | P1 | annual | Art. 21(2)(a) | §30(2) Nr. 1 BSIG, CIR 2.1.1, 2.1.4 | G-ROP.1, AI-RSK.2, IS-8.2, IS-8.3, A.5.12, A.5.13 |
| `2.4` | sign-off | P0 | annual | Art. 20(1), Art. 21(2)(a) | §38(1) BSIG, CIR 1.1.1(k), 1.1.2, 2.1.1, 2.1.4 | G-TOM.1, CRA-MFG.2, IS-5.2, IS-6.1, IS-6.2 |

### SUP: supply-chain

BSI IT-Grundschutz module: `OPS.2.3`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `5.1` | document | P0 | annual | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1-5.2 | G-DPA.1, CRA-IMP.1, A.5.19 |
| `5.2` | document | P1 | on-change | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1.4 | G-DPA.1, G-DPA.2, CRA-IMP.2, A.5.20, A.5.21, A.5.23 |
| `5.3` | proof | P1 | annual | Art. 21(3) | §30(2) Nr. 4 BSIG, CIR 5.1.6, 5.1.7 | A.5.21, A.5.22 |
| `5.4` | proof | P1 | ongoing | Art. 21(2)(d) | §30(2) Nr. 4 BSIG, CIR 5.1.4(d) | A.5.22 |

### INC: incident-handling

BSI IT-Grundschutz module: `DER.2.1`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `3.1` | document | P0 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.1 | G-BRC.1, AI-INC.1, CRA-INC.1, A.5.24, A.5.26 |
| `3.2` | document | P1 | quarterly | Art. 21(2)(b), Art. 23(3) | §30(2) Nr. 2, §2 Nr. 11 BSIG, CIR 3.2-3.4, CIR Art. 4 | G-BRC.2, A.5.25, A.6.8, A.8.15, A.8.16 |
| `3.3` | proof | P0 | annual | Art. 23(4) | §32(1) Nr. 1-4, §32(2) BSIG | G-BRC.1, AI-INC.2, CRA-INC.2, A.5.26 |
| `3.4` | proof | P2 | annual | Art. 21(2)(f) | §30(2) Nr. 2+6 BSIG, CIR 3.5 | none |
| `3.5` | document | P1 | annual | Art. 21(2)(b) | §30(2) Nr. 2 BSIG, CIR 3.6 | G-BRC.2, G-BRC.3, CRA-INC.3, A.5.27 |

### CRY: cryptography

BSI IT-Grundschutz module: `CON.1`. Estimated effort: 30 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `9.1` | document | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.1, 9.3, BSI TR-02102 | G-TOM.1, A.8.24 |
| `9.2` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2(a) | G-TOM.1, A.8.5, A.8.3 |
| `9.3` | technical | P1 | annual | Art. 21(2)(h) | §30(2) Nr. 8 BSIG, CIR 9.2(c) | none |

### ACC: access-control

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `10.1` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.1 | G-TOM.1, A.5.15, A.8.3 |
| `10.2` | technical | P1 | on-change | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2, CIR 11.3 | A.5.16, A.5.17, A.8.18 |
| `10.3` | document | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 10.2, 10.3, 11.3 | A.5.18, A.8.18, A.6.1, A.6.5, A.8.2 |
| `10.4` | proof | P1 | annual | Art. 21(2)(i) | §30(2) Nr. 9 BSIG, CIR 11.2.3, 11.3.3 | A.5.18 |

### AUT: authentication

BSI IT-Grundschutz module: `ORP.4`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `11.1` | technical | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.7 | G-TOM.1, A.8.5, A.8.2 |
| `11.2` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG | A.5.16, A.5.14, A.8.20, A.8.21, A.8.22 |
| `11.3` | document | P1 | annual | Art. 21(2)(j) | §30(2) Nr. 10 BSIG, CIR 11.6, NIST SP 800-63B | none |

### PRO: procurement

BSI IT-Grundschutz module: `OPS.1.1.3`. Estimated effort: 45 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `6.1` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.1 | none |
| `6.2` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.2, 6.3 | A.5.7, A.5.5, A.8.9, A.8.25 |
| `6.3` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.5, 6.10 | CRA-VLN.1, A.8.8 |
| `6.4` | technical | P1 | ongoing | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.6 | CRA-VLN.3, A.8.8 |
| `6.5` | document | P1 | annual | Art. 21(2)(e) | §30(2) Nr. 5 BSIG, CIR 6.4 | A.8.25, A.8.29, A.8.31, A.8.32 |

### BCP: business-continuity

BSI IT-Grundschutz module: `DER.4`. Estimated effort: 50 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `4.1` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1.3 | A.5.29 |
| `4.2` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1, 4.3 | A.5.29 |
| `4.3` | document | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.1.2 | G-TOM.1, A.5.30, A.8.14 |
| `4.4` | technical | P1 | annual | Art. 21(2)(c) | §30(2) Nr. 3 BSIG, CIR 4.2 | G-TOM.1, A.8.13 |
| `4.5` | proof | P1 | annual | Art. 21(2)(c), Art. 21(2)(f) | §30(2) Nr. 3+6 BSIG, CIR 4.1.4, 4.3.4 | A.5.29, A.8.6 |

### TRN: training

BSI IT-Grundschutz module: `ORP.3`. Estimated effort: 35 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `8.1` | document | P1 | annual | Art. 21(2)(a), Art. 21(2)(g) | §30(2) Nr. 1+7 BSIG, CIR 1.1.1(i), 1.2.2 | AI-LIT.1, A.6.3, A.5.10 |
| `8.2` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.1 | A.6.3, IS-7.2 |
| `8.3` | training | P1 | annual | Art. 21(2)(g) | §30(2) Nr. 7 BSIG, CIR 8.2 | IS-7.2, A.6.3 |
| `8.4` | proof | P2 | annual | Art. 21(2)(g), Art. 21(2)(f) | §30(2) Nr. 6+7 BSIG, CIR 8.1.3, 8.2.3 | none |

### EFF: effectiveness

BSI IT-Grundschutz module: `DER.3.1`. Estimated effort: 40 minutes.

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `7.1` | proof | P1 | quarterly | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 7.1, 7.2 | G-TOM.1, IS-9.1, A.5.36 |
| `7.2` | proof | P1 | annual | Art. 21(2)(f) | §30(2) Nr. 6 BSIG, CIR 2.3 | G-TOM.1, IS-9.2, A.5.35 |
| `7.3` | sign-off | P1 | annual | Art. 21(2)(f), Art. 20(1) | §30(2) Nr. 6 BSIG, CIR 2.2.1, §38(1) | IS-9.3 |
| `7.4` | document | P1 | ongoing | Art. 21(2)(f), Art. 21(4) | §30(2) Nr. 6 BSIG, CIR 2.3.3, Art. 21(4) | IS-10.1 |

## GDPR

6 categories, 9 requirements. Cites Regulation (EU) 2016/679, with the German BDSG where it modifies a duty.

### DPA: gdpr-processor-agreements

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-DPA.1` | document | P1 | annual | Art. 28 | GDPR Art. 28(3) | 5.1, 5.2 |
| `G-DPA.2` | document | P1 | annual | Art. 28 | GDPR Art. 28(2), Art. 28(4) | 5.2 |

### ROP: gdpr-records-of-processing

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-ROP.1` | document | P0 | annual | Art. 30 | GDPR Art. 30(1), (5) | 2.1, 2.2, 2.3, AI-TRA.1, AI-DOC.1 |

### TOM: gdpr-toms

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-TOM.1` | document | P0 | annual | Art. 32 | GDPR Art. 32(1) | 2.4, 9.1, 9.2, 4.4, 4.3, 7.1, 7.2, 10.1, 11.1, AI-FRI.1, AI-RSK.1, CRA-ESS.1 |

### BRC: gdpr-breach-response

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-BRC.1` | document | P0 | annual | Art. 33 | GDPR Art. 33(1)-(4) | 3.1, 3.3, AI-INC.1, CRA-VLN.1 |
| `G-BRC.2` | document | P1 | on-change | Art. 33 | GDPR Art. 33(5) | 3.2, 3.5 |
| `G-BRC.3` | document | P1 | on-change | Art. 34 | GDPR Art. 34 | 3.5 |

### DSR: gdpr-data-subject-rights

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `G-DSR.1` | document | P1 | ongoing | Art. 12-22 | GDPR Art. 12(3)-(6), Art. 15-22 | none |

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
| `IS-5.1` | sign-off | P0 | annual | 5.1 | ISO 27001:2022 Cl. 5.1 | 1.3, 1.4 |
| `IS-5.2` | document | P0 | annual | 5.2 | ISO 27001:2022 Cl. 5.2 | 1.2, 2.4 |
| `IS-5.3` | document | P0 | on-change | 5.3 | ISO 27001:2022 Cl. 5.3 | 1.2 |
| `IS-6.1` | document | P0 | annual | 6.1 | ISO 27001:2022 Cl. 6.1 | 2.1, 2.4 |
| `IS-6.2` | document | P1 | annual | 6.2 | ISO 27001:2022 Cl. 6.2 | 2.4 |
| `IS-6.3` | document | P1 | on-change | 6.3 | ISO 27001:2022 Cl. 6.3 | none |
| `IS-7.1` | document | P1 | annual | 7.1 | ISO 27001:2022 Cl. 7.1 | none |
| `IS-7.2` | training | P1 | annual | 7.2 | ISO 27001:2022 Cl. 7.2 | 8.2, 8.3 |
| `IS-7.3` | training | P1 | annual | 7.3 | ISO 27001:2022 Cl. 7.3 | none |
| `IS-7.4` | document | P2 | on-change | 7.4 | ISO 27001:2022 Cl. 7.4 | none |
| `IS-7.5` | document | P1 | on-change | 7.5 | ISO 27001:2022 Cl. 7.5 | none |
| `IS-8.1` | document | P0 | on-change | 8.1 | ISO 27001:2022 Cl. 8.1 | none |
| `IS-8.2` | document | P0 | annual | 8.2 | ISO 27001:2022 Cl. 8.2 | 2.1, 2.3 |
| `IS-8.3` | document | P0 | annual | 8.3 | ISO 27001:2022 Cl. 8.3 | 2.3, 2.1 |
| `IS-9.1` | proof | P1 | monthly | 9.1 | ISO 27001:2022 Cl. 9.1 | 7.1 |
| `IS-9.2` | proof | P0 | annual | 9.2 | ISO 27001:2022 Cl. 9.2 | 7.2 |
| `IS-9.3` | sign-off | P0 | annual | 9.3 | ISO 27001:2022 Cl. 9.3 | 1.3, 7.3 |
| `IS-10.1` | proof | P1 | ongoing | 10.1 | ISO 27001:2022 Cl. 10.1 | 7.4 |
| `IS-10.2` | document | P1 | on-change | 10.2 | ISO 27001:2022 Cl. 10.2 | none |

### ORG: organizational-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.5.1` | document | P0 | annual | A.5.1 | ISO 27001:2022 A.5.1 | 1.2 |
| `A.5.2` | document | P0 | on-change | A.5.2 | ISO 27001:2022 A.5.2 | 1.2 |
| `A.5.3` | document | P1 | on-change | A.5.3 | ISO 27001:2022 A.5.3 | none |
| `A.5.4` | proof | P1 | annual | A.5.4 | ISO 27001:2022 A.5.4 | none |
| `A.5.5` | proof | P1 | annual | A.5.5 | ISO 27001:2022 A.5.5 | 6.2 |
| `A.5.6` | proof | P2 | annual | A.5.6 | ISO 27001:2022 A.5.6 | none |
| `A.5.7` | proof | P1 | ongoing | A.5.7 | ISO 27001:2022 A.5.7 | 6.2 |
| `A.5.8` | document | P1 | on-change | A.5.8 | ISO 27001:2022 A.5.8 | none |
| `A.5.9` | technical | P0 | ongoing | A.5.9 | ISO 27001:2022 A.5.9 | 2.2 |
| `A.5.10` | document | P1 | annual | A.5.10 | ISO 27001:2022 A.5.10 | 8.1 |
| `A.5.11` | document | P1 | on-change | A.5.11 | ISO 27001:2022 A.5.11 | none |
| `A.5.12` | document | P1 | annual | A.5.12 | ISO 27001:2022 A.5.12 | 2.3 |
| `A.5.13` | technical | P2 | on-change | A.5.13 | ISO 27001:2022 A.5.13 | 2.3 |
| `A.5.14` | document | P1 | on-change | A.5.14 | ISO 27001:2022 A.5.14 | 11.2 |
| `A.5.15` | document | P0 | annual | A.5.15 | ISO 27001:2022 A.5.15 | 10.1 |
| `A.5.16` | technical | P0 | on-change | A.5.16 | ISO 27001:2022 A.5.16 | 10.2, 11.2 |
| `A.5.17` | technical | P0 | on-change | A.5.17 | ISO 27001:2022 A.5.17 | 10.2 |
| `A.5.18` | proof | P0 | quarterly | A.5.18 | ISO 27001:2022 A.5.18 | 10.3, 10.4 |
| `A.5.19` | document | P0 | annual | A.5.19 | ISO 27001:2022 A.5.19 | 5.1 |
| `A.5.20` | document | P0 | on-change | A.5.20 | ISO 27001:2022 A.5.20 | 5.2 |
| `A.5.21` | proof | P1 | annual | A.5.21 | ISO 27001:2022 A.5.21 | 5.2, 5.3 |
| `A.5.22` | proof | P1 | annual | A.5.22 | ISO 27001:2022 A.5.22 | 5.3, 5.4 |
| `A.5.23` | document | P0 | annual | A.5.23 | ISO 27001:2022 A.5.23 | 5.2 |
| `A.5.24` | document | P0 | annual | A.5.24 | ISO 27001:2022 A.5.24 | 3.1 |
| `A.5.25` | document | P0 | on-change | A.5.25 | ISO 27001:2022 A.5.25 | 3.2 |
| `A.5.26` | proof | P0 | on-change | A.5.26 | ISO 27001:2022 A.5.26 | 3.1, 3.3 |
| `A.5.27` | proof | P1 | on-change | A.5.27 | ISO 27001:2022 A.5.27 | 3.5 |
| `A.5.28` | document | P2 | on-change | A.5.28 | ISO 27001:2022 A.5.28 | none |
| `A.5.29` | document | P1 | annual | A.5.29 | ISO 27001:2022 A.5.29 | 4.1, 4.2, 4.5 |
| `A.5.30` | technical | P1 | annual | A.5.30 | ISO 27001:2022 A.5.30 | 4.3 |
| `A.5.31` | document | P1 | annual | A.5.31 | ISO 27001:2022 A.5.31 | 1.2, 12.1 |
| `A.5.32` | proof | P2 | annual | A.5.32 | ISO 27001:2022 A.5.32 | none |
| `A.5.33` | technical | P1 | ongoing | A.5.33 | ISO 27001:2022 A.5.33 | none |
| `A.5.34` | document | P0 | annual | A.5.34 | ISO 27001:2022 A.5.34 | none |
| `A.5.35` | proof | P0 | annual | A.5.35 | ISO 27001:2022 A.5.35 | 7.2 |
| `A.5.36` | proof | P1 | annual | A.5.36 | ISO 27001:2022 A.5.36 | 7.1 |
| `A.5.37` | document | P1 | on-change | A.5.37 | ISO 27001:2022 A.5.37 | none |

### PPL: people-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.6.1` | proof | P1 | on-change | A.6.1 | ISO 27001:2022 A.6.1 | 10.3 |
| `A.6.2` | document | P1 | on-change | A.6.2 | ISO 27001:2022 A.6.2 | none |
| `A.6.3` | training | P0 | annual | A.6.3 | ISO 27001:2022 A.6.3 | 8.1, 8.2, 8.3 |
| `A.6.4` | document | P2 | on-change | A.6.4 | ISO 27001:2022 A.6.4 | none |
| `A.6.5` | document | P1 | on-change | A.6.5 | ISO 27001:2022 A.6.5 | 10.3 |
| `A.6.6` | document | P1 | on-change | A.6.6 | ISO 27001:2022 A.6.6 | none |
| `A.6.7` | document | P1 | annual | A.6.7 | ISO 27001:2022 A.6.7 | none |
| `A.6.8` | proof | P0 | on-change | A.6.8 | ISO 27001:2022 A.6.8 | 3.2 |

### PHY: physical-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.7.1` | document | P1 | annual | A.7.1 | ISO 27001:2022 A.7.1 | none |
| `A.7.2` | proof | P1 | annual | A.7.2 | ISO 27001:2022 A.7.2 | none |
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
| `A.7.13` | proof | P1 | annual | A.7.13 | ISO 27001:2022 A.7.13 | none |
| `A.7.14` | proof | P1 | on-change | A.7.14 | ISO 27001:2022 A.7.14 | none |

### TEC: technological-controls

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `A.8.1` | technical | P0 | annual | A.8.1 | ISO 27001:2022 A.8.1 | 2.2 |
| `A.8.2` | proof | P0 | quarterly | A.8.2 | ISO 27001:2022 A.8.2 | 11.1, 10.3 |
| `A.8.3` | technical | P0 | on-change | A.8.3 | ISO 27001:2022 A.8.3 | 9.2, 10.1 |
| `A.8.4` | technical | P0 | on-change | A.8.4 | ISO 27001:2022 A.8.4 | none |
| `A.8.5` | technical | P0 | annual | A.8.5 | ISO 27001:2022 A.8.5 | 9.2, 11.1 |
| `A.8.6` | proof | P1 | ongoing | A.8.6 | ISO 27001:2022 A.8.6 | 4.5 |
| `A.8.7` | technical | P0 | ongoing | A.8.7 | ISO 27001:2022 A.8.7 | none |
| `A.8.8` | technical | P0 | ongoing | A.8.8 | ISO 27001:2022 A.8.8 | 6.3, 6.4 |
| `A.8.9` | document | P1 | on-change | A.8.9 | ISO 27001:2022 A.8.9 | 6.2 |
| `A.8.10` | proof | P1 | on-change | A.8.10 | ISO 27001:2022 A.8.10 | 2.2 |
| `A.8.11` | technical | P2 | on-change | A.8.11 | ISO 27001:2022 A.8.11 | none |
| `A.8.12` | technical | P1 | ongoing | A.8.12 | ISO 27001:2022 A.8.12 | none |
| `A.8.13` | technical | P0 | annual | A.8.13 | ISO 27001:2022 A.8.13 | 4.4 |
| `A.8.14` | proof | P1 | annual | A.8.14 | ISO 27001:2022 A.8.14 | 4.3 |
| `A.8.15` | technical | P0 | ongoing | A.8.15 | ISO 27001:2022 A.8.15 | 3.2 |
| `A.8.16` | technical | P0 | ongoing | A.8.16 | ISO 27001:2022 A.8.16 | 3.2 |
| `A.8.17` | technical | P2 | ongoing | A.8.17 | ISO 27001:2022 A.8.17 | none |
| `A.8.18` | proof | P1 | on-change | A.8.18 | ISO 27001:2022 A.8.18 | 10.2, 10.3 |
| `A.8.19` | document | P1 | on-change | A.8.19 | ISO 27001:2022 A.8.19 | none |
| `A.8.20` | technical | P0 | annual | A.8.20 | ISO 27001:2022 A.8.20 | 11.2 |
| `A.8.21` | document | P1 | annual | A.8.21 | ISO 27001:2022 A.8.21 | 11.2 |
| `A.8.22` | technical | P1 | on-change | A.8.22 | ISO 27001:2022 A.8.22 | 11.2 |
| `A.8.23` | technical | P2 | annual | A.8.23 | ISO 27001:2022 A.8.23 | none |
| `A.8.24` | document | P0 | annual | A.8.24 | ISO 27001:2022 A.8.24 | 9.1 |
| `A.8.25` | document | P1 | annual | A.8.25 | ISO 27001:2022 A.8.25 | 6.2, 6.5 |
| `A.8.26` | document | P1 | on-change | A.8.26 | ISO 27001:2022 A.8.26 | none |
| `A.8.27` | document | P1 | on-change | A.8.27 | ISO 27001:2022 A.8.27 | none |
| `A.8.28` | proof | P1 | ongoing | A.8.28 | ISO 27001:2022 A.8.28 | none |
| `A.8.29` | technical | P1 | on-change | A.8.29 | ISO 27001:2022 A.8.29 | 6.5 |
| `A.8.30` | document | P2 | on-change | A.8.30 | ISO 27001:2022 A.8.30 | none |
| `A.8.31` | technical | P1 | on-change | A.8.31 | ISO 27001:2022 A.8.31 | 6.5 |
| `A.8.32` | proof | P0 | on-change | A.8.32 | ISO 27001:2022 A.8.32 | 6.5 |
| `A.8.33` | proof | P1 | on-change | A.8.33 | ISO 27001:2022 A.8.33 | none |
| `A.8.34` | document | P2 | on-change | A.8.34 | ISO 27001:2022 A.8.34 | none |

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
| `CRA-MFG.2` | sign-off | P0 | on-change | Art. 13 | CRA Art. 13(1) | 2.4 |

### CRA-ESS: cra-essential-requirements

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-ESS.1` | technical | P0 | ongoing | Annex I | CRA Annex I Part I | AI-RSK.1, G-TOM.1 |
| `CRA-ESS.2` | technical | P0 | ongoing | Annex I | CRA Annex I Part I §3(a) | none |
| `CRA-ESS.3` | proof | P0 | on-change | Annex I | CRA Annex I Part I §1 | none |

### CRA-VLN: cra-vulnerability-handling

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-VLN.1` | document | P0 | one-time | Annex I | CRA Annex I Part II §1-2 | 6.3, G-BRC.1 |
| `CRA-VLN.2` | document | P0 | one-time | Annex I | CRA Annex I Part II §5 | none |
| `CRA-VLN.3` | technical | P0 | ongoing | Annex I | CRA Annex I Part II §3 | 6.4 |
| `CRA-VLN.4` | proof | P1 | on-change | Annex I | CRA Annex I Part II §8 | none |

### CRA-INC: cra-incident-reporting

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-INC.1` | proof | P0 | on-change | Art. 14 | CRA Art. 14(2)(a) | 3.1, AI-INC.1 |
| `CRA-INC.2` | proof | P0 | on-change | Art. 14 | CRA Art. 14(2)(b) | 3.3 |
| `CRA-INC.3` | proof | P0 | on-change | Art. 14 | CRA Art. 14(2)(c) | 3.5 |
| `CRA-INC.4` | proof | P0 | on-change | Art. 14 | CRA Art. 14(4) | none |

### CRA-CONF: cra-conformity-assessment

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-CONF.1` | document | P0 | on-change | Art. 24 | CRA Art. 24 | none |
| `CRA-CONF.2` | proof | P0 | on-change | Art. 27 | CRA Art. 27 | none |

### CRA-DOC: cra-technical-documentation

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-DOC.1` | document | P0 | on-change | Annex VII | CRA Annex VII, Art. 28 | AI-DOC.1, AI-DOC.2 |

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
| `CRA-IMP.1` | proof | P1 | on-change | Art. 18 | CRA Art. 18 | 5.1 |
| `CRA-IMP.2` | proof | P1 | on-change | Art. 19 | CRA Art. 19 | 5.2 |

### CRA-OSS: cra-oss-steward

| Code | Evidence | Priority | Frequency | Article | Legal ref | Linked to |
|---|---|---|---|---|---|---|
| `CRA-OSS.1` | document | P1 | one-time | Art. 24 | CRA Art. 24 | none |

## Cross-Framework Satisfaction Pairs

134 pairs. `equivalent` marks the same record in both frameworks; `overlapping` marks a partial overlap, where the other framework still asks for more.

### NIS2 and GDPR (20)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `5.1` | `G-DPA.1` | overlapping | Same supplier rows feed both; the Art. 28 DPA itself is evidenced by the 5.2 contract clauses, not by the register alone. |
| `5.2` | `G-DPA.1` | overlapping | CIR 5.1.4 covers part of an Art. 28(3) DPA: its cybersecurity requirements (a) speak to Art. 28(3)(c), its audit rights (e) to (h), its subcontracting rules (g) to (d), its termination retrieval and disposal (h) to (g). Art. 28(3) points (a), (b), (e) and (f) have no CIR counterpart: documented instructions, confidentiality, assistance with data subject rights, and assistance with Arts. 32 to 36. Nor does CIR 5.1.4 carry the Art. 28(3) statement of subject-matter, duration, nature, purpose, data types and categories of data subjects. CIR 5.1.4 clauses are also owed only 'where appropriate'; Art. 28(3) is unconditional. A 5.2 clause set is not a DPA. |
| `5.2` | `G-DPA.2` | equivalent | Sub-processor lists live on the same supplier rows used for NIS2 governance and Art. 28(2)/(4). |
| `2.1` | `G-ROP.1` | overlapping | Asset classification methodology defines the systems recorded in the Art. 30 register. |
| `2.2` | `G-ROP.1` | overlapping | Asset rows inform the Art. 30 record, but a RoPA documents processing activities (purposes, recipients, retention), not IT assets. |
| `2.3` | `G-ROP.1` | overlapping | Asset criticality under NIS2 informs Art. 30/35 high-risk processing. |
| `3.1` | `G-BRC.1` | equivalent | Same incident response procedure satisfies the NIS2 detection-to-notification flow and the GDPR Art. 33 breach response. |
| `3.2` | `G-BRC.2` | equivalent | Same incident rows; NIS2 detection/logging ↔ Art. 33(5) breach documentation. |
| `3.3` | `G-BRC.1` | overlapping | Same underlying event, separate filings: the NIS2 24h/72h/1-month cascade goes to the BSI/BBK Meldestelle, the GDPR Art. 33 single 72h notification to the data protection authority. |
| `3.5` | `G-BRC.2` | overlapping | Post-incident review evidence overlaps the Art. 33(5) breach documentation; the BSI final report itself is §32(1) Nr. 4 BSIG, tracked under 3.3. |
| `2.4` | `G-TOM.1` | overlapping | CEO sign-off on the Art. 21(2) risk treatment plan attests the TOMs posture Art. 32 requires. |
| `9.1` | `G-TOM.1` | overlapping | Art. 21(2)(h) ↔ Art. 32(1)(a): the CIR 9.1 cryptography policy is the documented position on encryption that Art. 32(1)(a) expects. Scope differs in one direction only: Art. 32(1)(a) names pseudonymisation alongside encryption and NIS2 does not, so the policy can satisfy the encryption half and leave pseudonymisation unaddressed. |
| `9.2` | `G-TOM.1` | overlapping | Art. 21(2)(h) ↔ Art. 32(1)(a): encryption at rest and in transit is the same control under both regimes. NIS2 applies it to network and information systems, Art. 32 to personal data, so the measure carries over while the scope statement does not. |
| `4.4` | `G-TOM.1` | overlapping | Art. 21(2)(c) ↔ Art. 32(1)(c): 'the ability to restore the availability and access to personal data in a timely manner in the event of a physical or technical incident' is what a tested backup and restore programme evidences. A restore that has never been tested evidences neither. |
| `4.3` | `G-TOM.1` | overlapping | Art. 21(2)(c) ↔ Art. 32(1)(c): the disaster recovery plan carries the recovery-time side of the same restore duty. Art. 32(1)(c) bounds it by 'in a timely manner' rather than by a stated RTO, so the NIS2 target is evidence for it and not a substitute. |
| `7.1` | `G-TOM.1` | overlapping | Art. 21(2)(f) ↔ Art. 32(1)(d): 'a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures'. The CIR 7.1 KPI records are that process running. Art. 32(1)(d) is the one enumerated item creating an ongoing duty rather than a one-off measure. |
| `7.2` | `G-TOM.1` | overlapping | Art. 21(2)(f) ↔ Art. 32(1)(d): the internal audit programme is the assessing and evaluating half of the same clause, where 7.1 is the measuring half. |
| `10.1` | `G-TOM.1` | overlapping | Art. 21(2)(i) ↔ Art. 32(1)(b): the access control policy is the primary evidence for 'ongoing confidentiality' of processing systems. Art. 32(1)(b) also covers integrity, availability and resilience, which this requirement does not reach. |
| `11.1` | `G-TOM.1` | overlapping | Art. 21(2)(j) ↔ Art. 32 by implication: Art. 32 nowhere names MFA, and its 'appropriate measures' clause is what carries it. CIR 11.7 mandates MFA outright for the eleven digital-service entity types; for everyone else Art. 21(1) proportionality decides, exactly as Art. 32(1) does. Never 'equivalent': one is a named control, the other an open standard that the control happens to meet. |
| `3.5` | `G-BRC.3` | overlapping | Art. 23(1) subpara. 2 ↔ Art. 34: both require telling people outside the authority about an incident, and the post-incident communication is where a company decides who hears what. The duties do not merge. NIS2 addresses the recipients of the service when provision is adversely affected; Art. 34 addresses the data subjects when the breach is likely to result in a high risk to their rights and freedoms, and the Art. 34(3) carve-outs apply to the GDPR side only. |

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
| `CRA-VLN.3` | `6.4` | overlapping | Security updates without delay align with the NIS2 patch management cadence. |
| `CRA-INC.1` | `3.1` | overlapping | Different artefacts: CIR 3.1 is the internal incident handling policy, CRA Art. 14(2)(a) is a 24h early warning filed to the CSIRT coordinator and ENISA via the Art. 16 platform. The policy is where you name who files it; having the policy does not discharge the filing. |
| `CRA-INC.2` | `3.3` | overlapping | Same underlying event, separate filings: CRA Art. 14 notifies the exploited product vulnerability to the CSIRT coordinator and ENISA, NIS2 §32 notifies the entity's own significant incident to the BSI. |
| `CRA-INC.3` | `3.5` | overlapping | CRA 14-day final report and the NIS2 post-incident review share root-cause evidence; the NIS2 final report to the BSI is §32(1) Nr. 4, tracked under 3.3. |
| `CRA-IMP.1` | `5.1` | overlapping | Importer due diligence on manufacturers overlaps with the NIS2 supplier security policy. |
| `CRA-IMP.2` | `5.2` | overlapping | Distributor checks overlap with NIS2 supplier contractual security clauses. |
| `CRA-MFG.1` | `2.1` | equivalent | Per-product cybersecurity risk assessment reuses the methodology defined for NIS2 risk management (CIR 2.1). |
| `CRA-MFG.2` | `2.4` | overlapping | Management body sign-off on CRA risk assessment overlaps with the CEO sign-off NIS2 risk treatment plan requires. |

### EU Cyber Resilience Act and EU AI Act (4)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `CRA-ESS.1` | `AI-RSK.1` | overlapping | Essential cybersecurity requirements (Annex I) overlap with AI risk management for high-risk AI systems with embedded digital elements. CRA Art. 12 grants presumption of conformity with AI Act Art. 15 (accuracy, robustness, cybersecurity) only; it does not reach the Art. 9 risk management system AI-RSK.1 tracks. |
| `CRA-DOC.1` | `AI-DOC.1` | overlapping | Annex VII technical documentation overlaps with AI Act Annex IV for products that are both PDE and high-risk AI. |
| `CRA-INC.1` | `AI-INC.1` | overlapping | Active-exploitation reporting overlaps with the AI Act incident response procedure when the AI system is also a product with digital elements. |
| `CRA-DOC.1` | `AI-DOC.2` | overlapping | Annex VII technical documentation includes the logging and traceability evidence Art. 12 AI Act requires. |

### EU Cyber Resilience Act and GDPR (2)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `CRA-ESS.1` | `G-TOM.1` | overlapping | Essential cybersecurity requirements (Annex I) overlap with the technical and organisational measures GDPR Art. 32 requires when the product processes personal data. |
| `CRA-VLN.1` | `G-BRC.1` | overlapping | Vulnerability handling procedures feed the GDPR Art. 33 breach response when a vulnerability leads to a personal-data breach. |

### ISO/IEC 27001:2022 and NIS2 (87)

| First | Second | Kind | Rationale |
|---|---|---|---|
| `IS-5.1` | `1.3` | equivalent | Cl. 5.1(c) resource commitment is the same resourcing decision the 1.3 budget sign-off evidences (CIR 1.1.1(e)). |
| `IS-5.1` | `1.4` | overlapping | Leadership commitment under Cl. 5.1 supports the liability briefing 1.4 documents; ISO defines no liability-acknowledgment artefact (§38(2) BSIG is a liability rule, not a sign-off duty). |
| `IS-5.2` | `1.2` | overlapping | The Cl. 5.2 policy assigns responsibilities that 1.2's team mapping reflects; the policy document itself is a different artefact (see 2.4). |
| `IS-5.2` | `2.4` | overlapping | The Cl. 5.2 information security policy is the document the 2.4 IS-Leitlinie sign-off approves; scopes differ (full ISMS policy vs risk-acceptance sign-off). |
| `IS-5.3` | `1.2` | overlapping | Cl. 5.3 assigns and communicates roles and authorities, which is what 1.2 records under §30(1) BSIG and CIR 1.2 (Art. 21(2)(a)). Art. 20(1) is a separate duty: management-body approval of the risk management measures, oversight of implementation and liability, tracked in 1.3 and 1.4. |
| `A.5.1` | `1.2` | overlapping | Policies for information security (A.5.1) overlap with the governance framework NIS2 §30(1) requires. |
| `A.5.2` | `1.2` | equivalent | Same roles artefact: A.5.2 information security roles and responsibilities is the role assignment 1.2 records (CIR 1.2). |
| `A.5.31` | `1.2` | overlapping | The legal-requirements register (A.5.31) keeps regulatory duties owned by named roles; its NIS2 home is the 12.1 classification step. |
| `A.5.31` | `12.1` | overlapping | Same determine-your-legal-position work: the A.5.31 register documents the NIS2/BSIG applicability that 12.1 assesses. |
| `IS-9.3` | `1.3` | overlapping | Management review records (Cl. 9.3) evidence the resourcing oversight the 1.3 budget sign-off documents (CIR 1.1.1(e)). |
| `IS-6.1` | `2.1` | equivalent | Same methodology document: the Cl. 6.1 risk assessment methodology is the risk management methodology NIS2 CIR 2.1 requires. |
| `IS-6.1` | `2.4` | overlapping | Cl. 6.1.3's risk treatment plan with risk-owner approval of residual risks is what the 2.4 sign-off accepts. |
| `IS-8.2` | `2.1` | overlapping | Cl. 8.2 re-runs the 2.1 methodology; its artefact is the recurring assessment results, which live in the 2.3 register. |
| `IS-8.2` | `2.3` | equivalent | Same risk register: Cl. 8.2 operational risk assessment results are the 2.3 register rows. |
| `IS-8.3` | `2.3` | equivalent | Same treatment records: Cl. 8.3 risk treatment implements the 2.3 register's treatment decisions. |
| `IS-6.2` | `2.4` | overlapping | Cl. 6.2 sets security objectives that the signed IS-Leitlinie carries; the risk treatment plan with owner approval is Cl. 6.1.3 (in IS-6.1's scope). |
| `IS-8.3` | `2.1` | overlapping | Operational risk treatment (Cl. 8.3) implements the plan required by NIS2 CIR 2.1. |
| `A.5.9` | `2.2` | equivalent | Asset inventory (A.5.9) is the same register NIS2 CIR 12.4 / §30(2) Nr. 9 BSIG requires for asset identification. |
| `A.8.1` | `2.2` | overlapping | User endpoint device protection (A.8.1) presupposes the endpoint entries in the same asset register NIS2 mandates. |
| `A.8.10` | `2.2` | overlapping | Information deletion (A.8.10) is exercised against the retention data of the asset register (CIR 12.2/12.5 territory). |
| `A.5.12` | `2.3` | overlapping | Information classification scheme (A.5.12) drives the asset classification CIR 12.1 requires; CIR 2.1.3 feeds that classification into risk treatment prioritisation, and 2.3 records the resulting criticality ratings. |
| `A.5.13` | `2.3` | overlapping | Information labelling (A.5.13) implements the classification that underpins NIS2 asset classification. |
| `A.5.24` | `3.1` | equivalent | Same incident response procedure: A.5.24 incident management planning produces the policy NIS2 CIR 3.1 requires. |
| `A.5.25` | `3.2` | equivalent | Same event assessment process: A.5.25 covers the detection and logging NIS2 CIR 3.2/3.4 expects. |
| `A.5.26` | `3.1` | equivalent | Response to IS incidents (A.5.26) implements the same response procedure; same incident record. |
| `A.5.26` | `3.3` | equivalent | Response execution under A.5.26 and the NIS2 24h/72h CSIRT cascade share the same underlying event record. |
| `A.5.27` | `3.5` | equivalent | Same lessons-learned report: A.5.27 output is the post-incident review NIS2 CIR 3.6 requires. |
| `A.6.8` | `3.2` | overlapping | IS event reporting channel (A.6.8) is the employee/supplier/customer reporting mechanism NIS2 CIR 3.3 requires. |
| `A.8.15` | `3.2` | overlapping | Logging controls (A.8.15) generate the evidence trail NIS2 CIR 3.2 expects for incident detection. |
| `A.8.16` | `3.2` | overlapping | Monitoring activities (A.8.16) overlap with NIS2 detection and alerting requirements. |
| `A.5.29` | `4.1` | equivalent | Same continuity policy: A.5.29 IS continuity policy is the BCP framework document NIS2 CIR 4.1 requires. |
| `A.5.29` | `4.2` | overlapping | Same IS continuity policy covers the BCP plan content NIS2 CIR 4.1/4.3 requires. |
| `A.5.29` | `4.5` | overlapping | Continuity policy requirements include testing obligations that map to NIS2 BCP exercise requirements (CIR 4.1.4). |
| `A.5.30` | `4.3` | equivalent | Same ICT readiness plan: A.5.30 maps directly to the NIS2 ICT continuity requirements; one plan satisfies both. |
| `A.8.13` | `4.4` | equivalent | Same backup programme: A.8.13 backup controls satisfy the NIS2 backup management requirements under CIR 4.2. |
| `A.8.14` | `4.3` | overlapping | Redundancy of processing facilities (A.8.14) overlaps with NIS2 availability and resilience requirements (CIR 4.2.4). |
| `A.8.6` | `4.5` | overlapping | Capacity management (A.8.6) feeds the resource-adequacy review NIS2 CIR 4.2.5 expects as part of BCP testing. |
| `A.5.19` | `5.1` | equivalent | Same supplier security policy: A.5.19 supplier relationship IS policy is the policy NIS2 CIR 5.1 requires. |
| `A.5.20` | `5.2` | equivalent | Same contractual clauses: A.5.20 IS requirements in supplier agreements cover the clauses NIS2 CIR 5.1.4 mandates. |
| `A.5.21` | `5.2` | overlapping | ICT supply chain IS management (A.5.21) overlaps with NIS2 supply-chain security contract requirements. |
| `A.5.21` | `5.3` | equivalent | Same supplier risk assessment process satisfies both A.5.21 and the NIS2 CIR 5.1.6 monitoring obligation. |
| `A.5.22` | `5.3` | overlapping | Supplier service monitoring and review (A.5.22) covers the ongoing monitoring NIS2 CIR 5.1.6/5.1.7 requires. |
| `A.5.22` | `5.4` | overlapping | Regular supplier reviews (A.5.22) generate the monitoring evidence the CIR 5.1.4(d) notification clause expects. |
| `A.5.23` | `5.2` | overlapping | Cloud services IS requirements (A.5.23) extend supplier agreement controls to cloud providers as NIS2 requires. |
| `A.5.7` | `6.2` | overlapping | Threat intelligence (A.5.7) informs secure development and configuration decisions; the vulnerability-monitoring duty itself is CIR 6.10 under requirement 6.3. |
| `A.5.5` | `6.2` | overlapping | Contacts with authorities (A.5.5) support the coordinated-vulnerability-disclosure channel (CIR 6.10.2(e), requirement 6.3). |
| `A.8.8` | `6.3` | equivalent | Same vulnerability programme: A.8.8 technical vulnerability management is the scanning programme NIS2 CIR 6.5/6.10 requires. |
| `A.8.8` | `6.4` | equivalent | Same patch programme: A.8.8 timely remediation maps to the patch management cadence NIS2 CIR 6.6 mandates. |
| `A.8.9` | `6.2` | overlapping | Configuration management (A.8.9) implements the secure-configuration half of 6.2 (CIR 6.3); 6.2's secure development life cycle half (CIR 6.2) is separate. |
| `A.8.25` | `6.2` | overlapping | Same development discipline: A.8.25 secure development life cycle is the CIR 6.2 duty requirement 6.2 carries. |
| `A.8.25` | `6.5` | overlapping | Secure development life cycle (A.8.25, CIR 6.2) overlaps 6.5 where changes ship through the development process. |
| `A.8.29` | `6.5` | overlapping | Security testing (A.8.29, CIR 6.5) validates changes before release, supporting the 6.5 change process. |
| `A.8.31` | `6.5` | overlapping | Separation of dev/test/prod (A.8.31) is part of the change-control discipline (CIR 6.4) and the secure development environment (CIR 6.2). |
| `A.8.32` | `6.5` | equivalent | Same change record: A.8.32 change management is the CIR 6.4 change process requirement 6.5 tracks; both write the same change_request rows. |
| `IS-9.1` | `7.1` | equivalent | Same KPI records: Cl. 9.1 monitoring, measurement and analysis produces the KPI evidence NIS2 CIR 7.1/7.2 requires. |
| `IS-9.2` | `7.2` | equivalent | Internal audit programme (Cl. 9.2) is the independent review CIR 2.3 requires; same audit records. |
| `IS-9.3` | `7.3` | equivalent | Same CEO sign-off artefact: Cl. 9.3 management review is the regular management reporting CIR 2.2.1 requires. |
| `A.5.35` | `7.2` | equivalent | Same audit programme: A.5.35 independent review of information security is the CIR 2.3 independent review. |
| `A.5.36` | `7.1` | overlapping | Compliance with policies and standards (A.5.36) overlaps with the NIS2 policy-effectiveness measurement. |
| `IS-10.1` | `7.4` | overlapping | Continual improvement records (Cl. 10.1) evidence the corrective actions CIR 2.3.3 and Art. 21(4) require. |
| `A.6.3` | `8.1` | overlapping | The A.6.3 awareness programme teaches the rules the 8.1 policy sets; the training equivalence lives on 8.2. |
| `A.6.3` | `8.2` | equivalent | Same training programme satisfies both A.6.3 employee awareness and NIS2 CIR 8.1 awareness raising. |
| `IS-7.2` | `8.2` | equivalent | Same training records: Cl. 7.2 competence records document the staff awareness NIS2 CIR 8.1 expects. |
| `IS-7.2` | `8.3` | overlapping | Same competence records cover role-specific security training under CIR 8.2. |
| `A.6.3` | `8.3` | overlapping | Role-specific awareness content (A.6.3) overlaps with the CIR 8.2 security training requirement. |
| `A.5.10` | `8.1` | overlapping | Acceptable use rules for information and assets (A.5.10) are the same topic-specific policy content the 8.1 IT-Sicherheitsrichtlinie carries (CIR 1.1.1(i)). |
| `A.8.24` | `9.1` | equivalent | Same cryptography policy: A.8.24 is the policy NIS2 CIR 9.1 / BSI TR-02102 requires. |
| `A.8.5` | `9.2` | overlapping | Secure authentication (A.8.5) is access-control territory (CIR 11.6/11.7, requirement 11.1); it touches 9.2 only via encrypted authentication channels. |
| `A.8.3` | `9.2` | overlapping | Information access restriction (A.8.3) complements encryption of data at rest (CIR 9.2(a)); the control's home is access control (10.1). |
| `A.5.15` | `10.1` | equivalent | Same access control policy: A.5.15 is the policy NIS2 CIR 11.1 requires. |
| `A.5.16` | `10.2` | equivalent | Same IAM programme: A.5.16 identity management covers the identity and access management NIS2 CIR 11.2 mandates. |
| `A.5.17` | `10.2` | overlapping | Authentication information management (A.5.17) implements the privileged account controls NIS2 CIR 11.2/11.3 requires. |
| `A.5.18` | `10.3` | equivalent | Same access-rights records: A.5.18 produces the change-controlled access evidence NIS2 CIR 11.2 expects. |
| `A.5.18` | `10.4` | overlapping | Same periodic review: A.5.18 access-rights review is the documented review CIR 11.2.3 requires at planned intervals (the platform default is yearly, quarterly for privileged accounts). |
| `A.8.3` | `10.1` | overlapping | Information access restriction (A.8.3) enforces the access control policy NIS2 CIR 11.1 requires. |
| `A.8.18` | `10.2` | overlapping | Privileged utility programs (A.8.18) are governed by the privileged-account rules (CIR 11.3) documented in 10.3; 10.2's per-asset rows record where they apply. |
| `A.8.18` | `10.3` | overlapping | Same privileged-account discipline: A.8.18 restrictions implement the CIR 11.3 policies documented in 10.3. |
| `A.6.1` | `10.3` | overlapping | Screening (A.6.1) is the background verification CIR 10.2 requires; 10.3 documents the process it belongs to. |
| `A.6.5` | `10.3` | overlapping | Responsibilities after termination (A.6.5) implement the CIR 10.3 termination procedures inside 10.3's lifecycle process. |
| `A.8.5` | `11.1` | equivalent | Same MFA control: A.8.5 secure authentication implements the MFA/continuous-authentication requirement NIS2 CIR 11.7 mandates. |
| `A.8.2` | `11.1` | overlapping | Privileged access rights (A.8.2) are CIR 11.3 territory (requirement 10.3); MFA (CIR 11.7) protects those accounts but is a different artefact. |
| `A.8.2` | `10.3` | overlapping | Same privileged-account discipline: A.8.2 privileged access rights implement the CIR 11.3 policies documented in 10.3. |
| `A.5.16` | `11.2` | overlapping | Identity management (A.5.16) underpins who may use the secured communication channels 11.2 establishes. |
| `A.5.14` | `11.2` | overlapping | Information transfer rules (A.5.14) govern the secured voice/video/text channels Art. 21(2)(j) requires; the emergency-communication half of 11.2 is separate. |
| `A.8.20` | `11.2` | overlapping | Network security controls (A.8.20) protect the channels 11.2 relies on; segmentation itself is CIR 6.8, which has no dedicated NIS2 step. |
| `A.8.21` | `11.2` | overlapping | Security of network services (A.8.21) supports secured communications; the underlying network-security duty is CIR 6.7. |
| `A.8.22` | `11.2` | overlapping | Network segregation (A.8.22, CIR 6.8) hardens the environment secured communications run in; different artefact. |

## Article-Level Mapping, NIS2 and GDPR

12 concept-level mappings between NIS2 articles and GDPR articles.

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
| GDPR | 6 | 9 |
| ISO/IEC 27001:2022 | 5 | 116 |
| EU AI Act | 10 | 24 |
| EU Cyber Resilience Act | 10 | 21 |

**Satisfaction pairs:** 134, in 7 framework combinations.
**Article-level mappings:** 12 concept-level rows.

---

Maintained by [nisd2.eu](https://www.nisd2.eu). Issues and contributions welcome: see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
