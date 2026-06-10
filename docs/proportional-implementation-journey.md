# Proportional NIS2 Implementation Journey — Portal Source of Truth (v4.1)

> **v4.1 update.** Multi-persona validation pass (CISO, NIS2 auditor, CIR implementor, 50-person SME, 250-person mid-Mittelstand) surfaced **6 priority misclassifications** and **20 schema/UX actions**. Full report at `docs/journey-validation-report.md`. The priority changes (Section 4 + Section 6) and gap-report additions (Section 18.6 — new) are now reflected in this spec. The 20 actions are tracked in Section 19 (build order — re-prioritised).
>
> **What this is.** The internal specification for the in-product guided NIS2 walkthrough on nisd2.eu. Every step is derived from the platform's canonical data model + seeded dependency graph, cross-checked against BSIG 2025, CIR 2024/2690, NIS2 (Art. 20/21/23/27), BSI 200-1/-2/-3 Grundschutz, our own CEO course content, external practitioner research, and a multi-persona validation pass.
>
> **What's new in v4.** Per-step **RACI** (Responsible / Accountable / Consulted / Informed) and **multi-stage handoff sequence** (typically 4 stages: prepare → review → approve → verify). Legal basis for each role assignment cited. Court of validation: BSI 200-2 §2.4 (ISB role), CIR Annex 1.2.2 (sign-off accountability), §38(1)(2)(3) BSIG (non-delegable management duties). Adds "Common RACI failures" (8 patterns auditors flag) and master 49-requirement RACI matrix.
>
> **Method note on BSI.** There is no "BSI 300" standard set. The BSI Grundschutz standards are 200-1 (ISMS), 200-2 (methodology), 200-3 (risk analysis), and 200-4 (BCM). This spec uses those.
>
> **Anchor principle (from our CEO course Lesson 1.5):** *"The CISO can implement the measures. Only the management body can approve them."* That principle drives every RACI assignment below — Responsible/Consulted/Informed can be delegated; Accountable for §38 BSIG and Art. 20(1) NIS2 duties cannot.

---

## 1. Primary sources (12 — added 12, refined #4 with sign-off role)

| # | File / source | Provides | Why primary |
|---|---|---|---|
| 1 | `packages/grc-data-model/src/frameworks/nis2.ts` | 12 categories with sortOrder, 49 requirements with priority, evidence type, frequency, legal ref, framework ref, CIR ref, GDPR sibling, moduleRef, **`requiredSignOffRole`** (currently set to `"ceo"` for 1.3, 1.4, 2.4, 7.3) | Canonical data model |
| 2 | `drizzle/seed.ts:272-342` | 46 prerequisite rules with legal rationale | Already enforced |
| 3 | `lib/compliance/category-schemas.ts` | One Zod schema per category + `CATEGORY_FIELD_MAPPING` linking intake fields to requirement codes | "What data each step needs" |
| 4 | `packages/grc-data-model/src/satisfaction-pairs.ts` | 11 NIS2 ↔ GDPR satisfaction pairs (incl. `2.2 ↔ G-ROP.1` tier `equivalent`) | DSGVO carryover |
| 5 | `packages/grc-data-model/REFERENCE.md` | Auto-generated reference | Regen via `bun run docs:reference` |
| 6 | `messages/requirements/{de,en,nl}.json` | Display strings | i18n |
| 7 | `app/[locale]/(portal)/**/page.tsx` + `(portal)/compliance/[categorySlug]/page.tsx` | Portal routes | Verified to exist |
| 8 | `app/[locale]/wiki/umsetzung/*/page.tsx` | 29 wiki articles | Deep links |
| 9 | `lib/compliance/platform-defaults.ts` | BSI 200-3 defaults | Pre-fills 2.1 |
| 10 | `lib/compliance/bsi-threats.ts` | 47 BSI elementary threats (G 0.1–G 0.47) | Risk workshop |
| 11 | `data/nis2-registration-portals.json` | BSI portal status (operational since 2026-01-06, deadline 2026-03-06 passed) | Drives 12.2 UX |
| 12 | `courses/nis2-ceo/content/*.md` | 47 lessons across 6 modules: Foundation, The Law, Risk + 10 Measures, Decision Support, Protection, Final. **The management duties (approve / oversee / be liable / train) are spelled out per-lesson.** | What the CEO actually learns about RACI |

## 2. Cross-check sources

| Source | Used for |
|---|---|
[redacted for public release]
| ENISA TIG v1.0 (June 2025) | Operational guidance per measure; proportionality logic; ECSF role mapping (CISO, Cyber Incident Responder, Cybersecurity Implementer, Cyber Legal/Policy/Compliance Officer, Cybersecurity Auditor, Cybersecurity Risk Manager, Digital Forensics Investigator) |
| BSI 200-1, 200-2, 200-3, 200-4 | ISMS, methodology, risk, BCM standards; §2.4 ISB direct-report-to-top-management; §2.6 IS-Management-Team composition |
| CIR 2024/2690 Annex 1.2 | "Rollen, Verantwortlichkeiten und Weisungsbefugnisse" — Annex 1.2.2 mandates "at least one person directly accountable to the management body" — **the closest the law gets to a CISO** (the title is convention, not statute) |
| activeMind 8-phase Projektplan, unternehmeredition 6 steps, xmera 5-phase, openKRITIS, cybervize RACI guide, Pöppel D&O analysis | Practitioner consensus on phasing and RACI patterns |
| Vanta 5-step process | SaaS GRC reference |
| BSIG 2025 §§28, 30, 32, 33, 34, 35, 38, 39 | Legal ground truth + delegation limits |
| BGH IV ZR 66/25 (Nov 2025) | Narrowed D&O knowledge-exclusion — protective for GFs on oversight-gap claims |

> **Honest note on ENISA TIG.** Flat, not phased. The 4-phase framing in this spec is editorial synthesis consistent with ENISA's proportionality logic, not endorsed by it.
> **Honest note on "CISO."** CIR Annex 1.2.2 mandates a person "directly accountable to the management body" — not the title "CISO." BSI 200-2 names the role "ISB" (Informationssicherheitsbeauftragter). For brevity this spec uses "CISO" but every RACI assignment below survives the substitution `CISO → ISB → "the §30(1) accountable person."`

---

## 3. The 12 categories, in canonical platform order

`sortOrder` in `nis2.ts` lines 7–18. REG first (on-ramp), EFF last (rear-view mirror).

| sortOrder | Code | Slug | Min | Lead role | BSI module | NIS2 Art. | BSIG § |
|---|---|---|---|---|---|---|---|
| 0 | REG | registration | 30 | legal | ISMS.1 | Art. 3 | §28, §33 |
| 1 | GOV | governance | 45 | ceo | ISMS.1 | Art. 20 | §30(1), §38 |
| 2 | RSK | risk-management | 60 | ciso | BSI 200-3 | Art. 21(2)(a) | §30(2) Nr. 1 |
| 3 | SUP | supply-chain | 40 | cpo | ORP.5 | Art. 21(2)(d) | §30(2) Nr. 4 |
| 4 | CRY | cryptography | 30 | cto | CON.1 | Art. 21(2)(h) | §30(2) Nr. 8 |
| 5 | ACC | access-control | 40 | ciso + hr | ORP.4 | Art. 21(2)(i) | §30(2) Nr. 9 |
| 6 | AUT | authentication | 35 | cto | ORP.4 | Art. 21(2)(j) | §30(2) Nr. 10 |
| 7 | PRO | procurement | 45 | cto | OPS.1.1.3 | Art. 21(2)(e) | §30(2) Nr. 5 |
| 8 | INC | incident-handling | 50 | ciso | DER.2.1 | Art. 23, Art. 21(2)(b) | §30(2) Nr. 2, §32, §35 |
| 9 | BCP | business-continuity | 50 | coo | DER.4 | Art. 21(2)(c) | §30(2) Nr. 3 |
| 10 | TRN | training | 35 | ciso | ORP.3 | Art. 21(2)(g) | §30(2) Nr. 7 |
| 11 | EFF | effectiveness | 40 | ciso | DER.3.1 | Art. 21(2)(f) | §30(2) Nr. 6 |

---

## 4. The 49 controls (preserved — see `REFERENCE.md` for the auto-generated table) — **v4.1 priority changes**

12 categories · 49 requirements. Each requirement carries title, priority, frequency, evidence type, legal/framework/CIR refs, `moduleRef`, and (for 4 requirements today, **8 after v4.1 changes**) `requiredSignOffRole`. The `CATEGORY_FIELD_MAPPING` wires each intake field to one or more requirement codes — submitting the form auto-derives `companyRequirementStatus` for each linked requirement.

### v4.1 Priority changes (Section 18.6 — derived from validation report Section 6)

Multi-persona validation (auditor + CIR implementor concurring) showed that the framework data under-classified the §38 BSIG personal-duty requirements as P1 when they are statutory and non-deferrable. Updated:

| Code | Title | Old | New | Rationale |
|---|---|---|---|---|
| 1.1 | Management Cybersecurity Training | P1 | **P0** | §38(3) personal statutory duty, non-delegable, non-proportionalisable |
| 1.2 | Roles and Responsibilities | P1 | **P0** | CIR Annex 1.2 mandatory; §30(1) accountable person required by law |
| 1.4 | Personal Liability Acknowledgment | P1 | **P0** | §38(2) non-waivable personal liability |
| 2.3 | Risk Register & Treatment | P1 | **P0** | Without it 2.4 sign-off is uninformed (CEO course Lesson 2.1) — foundation under §30(2) Nr. 1 |
| 3.4 | Incident Response Drill | P2 | **P1** | Without drill, IR plan is paper; CIR 7.1 requires measuring effectiveness of IR |
| 12.4 | Compliance Evidence & KRITIS | P1 (all) | **P1 only for KRITIS** | §39 BSIG Nachweispflicht only applies to KRITIS — conditional surfacing |

**Updated totals: P0 = 12 (was 8), P1 = 37 (was 40 — four moved to P0, one moved in from P2), P2 = 0 (3.4 moved to P1). Total = 49.**

### `requiredSignOffRole = "ceo"` extension (Section 18.6 finding G)

Currently set on 1.3, 1.4, 2.4, 7.3. Validation showed four more requirements legally require management-body sign-off:

| Code | Title | Reason |
|---|---|---|
| 1.2 | Roles and Responsibilities | Board appoints the §30(1) accountable person; CISO can't appoint themselves |
| 2.1 | Risk Methodology (Akzeptanzschwelle component only) | CIR 2.1.1 — board sets risk-acceptance criteria |
| 4.2 | BCP + Crisis Mgmt Plan | Crisis-decision authority delegation is a board act |
| 5.2 | Supplier Security in Contracts | For critical (ABC class A) suppliers only — routine remains CISO |

Schema needs `requiredSignOffRole` to accept multiple roles + a `conditionalOn` field (e.g. supplier criticality) for 5.2.

---

## 5. The seeded dependency graph (46 rules, see v3 Section 5)

Five roots (no predecessor): **12.1** (Classification), **1.1** (CEO training — biggest unlock, gates 1.3/1.4/2.4/7.3/8.3), **1.2** (Roles), **2.1** (Risk methodology), **2.2** (Assets). Three critical convergence points: **2.3** (needs 2.1+2.2), **2.4** (needs 2.3+1.1 — Phase 1 milestone), **10.1** (gates ACC+AUT chain).

---

## 6. Four-phase summary (Phase 0/1/2A/2B/2C/3) — **v4.1 update**

Phase counts adjusted to reflect P0 promotions from Section 4. Net effect: Phase 1's defensibility milestone (Cat 2.4 sign-off) now sits on a fully-statutory minimum (no P1 reqs in Phase 1 are deferrable under proportionality).

| Phase | Controls (v4.1) | P0 count | Output | Time |
|---|---|---|---|---|
| **0 — Onramp** | Step 1 applicability, **12.1 P0**, **1.1 P0**, 12.2 P0, **1.2 P0** | 4 (was 2: 12.1, 12.2) | Classified entity + BSI registration + CEO trained + roles approved by board | Days 1–7 |
| **1 — Foundation** | **1.4 P0**, 2.1 P0, 2.2 P0, **2.3 P0**, 2.4 P0 (milestone), 3.1 P0, 3.3 P0, 10.1, 11.1 P0, 1.3 | 8 (was 6) | CEO-signed IS policy + residual risk accepted + IR plan + MFA enforced — minimum legally defensible posture | Months 1–6 |
| **2A** | 17 controls (4.1, 5.1, 6.1, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.3, 9.1, 10.2, 10.3, 11.2, 11.3, 3.2, 3.5) — plus **3.4 (was P2 → P1)** moves here | 0 (no new P0 — all foundational P0 done by Phase 1) | Operational machinery running | Months 6–12 |
| **2B** | 12 controls (4.2, 4.3, 4.4, 5.2, 5.3, 5.4, 6.2, 6.5, 7.4, 8.2, 9.2, 9.3) | 0 | Full coverage of Art. 21(2) | Months 12–18 |
| **2C** | 4 controls (4.5, 8.4, 10.4, 12.3) + 12.4 **conditional** if KRITIS | 0 | First recurring cycle | When predecessors land |
| **3 — Rhythm** | All recurring + on-change triggers | 0 | Continuous compliance | 4–8 h/month |

**Phase 0 now contains 4 P0 reqs** (was 2). Phase 0 is no longer just "onramp" — it's the **statutory minimum to be defensible while completing Phase 1**. Auditor would say: if Phase 0 P0 list is incomplete after 2 weeks of onboarding, the company is in worse standing than a company in mid-Phase 1.

---

## 7. Roles & sign-off framework — NEW in v4

### 7.1 Role taxonomy

Three layers: **statutory roles** (named or functionally required by law), **organisational roles** (necessary for delivery but title chosen by company), and **ECSF profiles** (ENISA's published role map — useful for the journey UX where it matters).

| Layer | Role | Source of authority | Statutory? |
|---|---|---|---|
| Statutory | **Management body** (Geschäftsleitung) | §38 BSIG, Art. 20 NIS2 | **Yes, named** |
| Statutory | **§30(1) accountable person** — "at least one person directly accountable to the management body for cybersecurity" | CIR 2024/2690 Annex 1.2.2 | **Yes, function** (title is convention) |
| Statutory | **BSI contact / §33(1) Nr. 6** — registration contact | §33 BSIG | **Yes, function** — practitioners recommend functional mailbox |
| Statutory (KRITIS) | **24/7 incident contact** | §33(2) Nr. 5 BSIG | **Yes**, KRITIS only |
| Statutory adjacent | **DPO** | Art. 37 GDPR | NIS2: Consulted only, never Accountable |
| Organisational | **CISO / ISB** (de facto §30(1) accountable person) | BSI 200-2 §2.4 | Practice; not statutory title |
| Organisational | **CTO / IT-Lead** | Practice | No |
| Organisational | **COO / Operations Lead** | Practice — runs BCM | No |
| Organisational | **CPO / Procurement Lead** | Practice — supply chain | No |
| Organisational | **HR-Lead** | Practice — personnel + offboarding | No |
| Organisational | **Compliance / Legal Lead** | Practice — registration, contracts | No |
| Organisational | **Internal Auditor** | BSI 200-2 + ENISA TIG | Recommended; external acceptable |
| Organisational | **Asset Owner / Process Owner** | BSI 200-2 §2.6, ENISA TIG, web auditor consensus | **Required per asset row** — auditors fail vendor/asset lists missing an owner column |
| ECSF | **Cyber Legal/Policy/Compliance Officer** | ENISA TIG | Often unfilled — ENISA flags as most-skipped role |
| ECSF | **Cybersecurity Risk Manager** | ENISA TIG | Often combined with CISO in mid-sized entities |
| ECSF | **Cybersecurity Auditor** | ENISA TIG | For Art. 21(2)(f) effectiveness |
| ECSF | **Cyber Incident Responder** | ENISA TIG | For Cat 3 |
| ECSF | **Cybersecurity Implementer** | ENISA TIG | For Cat 6 + 8 + 9 + 10 + 11 |

### 7.2 Delegation — what's non-delegable

From §38 BSIG, Art. 20(1) NIS2, BSI 200-2 §2.4, CIR 1.1, and CEO course Lesson 1.5 + 1.6:

| Duty | Delegable? | Source | Why |
|---|---|---|---|
| **Approve §30 measures** | **NO** | §38(1) BSIG, Art. 20(1) | Formal legal act; documented signature of management body required |
| **Oversee implementation** | **NO** strategic; operational drafting **YES** | §38(1), Lesson 1.5 | "Oversee is an ongoing obligation that does not end when you sign, requiring regular reporting … and at least one formal annual review" |
| **Personal liability** | **NO** | §38(2) | Statutory, no contractual waiver |
| **Management cybersecurity training** | **NO** | §38(3), Art. 20(2), Lesson 1.6 | "You cannot send your CISO, your lawyer, or your assistant to attend on your behalf" |
| **Approve IS-Leitlinie (top policy)** | **NO** | BSI 200-2 §2.4 | "Sicherheitsleitlinie = GL approval; ISB drafts, GL signs" |
| **Residual-risk acceptance** above threshold | **NO** | CIR 2.1.1, secjur | Akzeptanzschwelle set by GL; sign-off above it non-delegable |
| **Drafting policies, configuring controls, day-to-day risk-treatment** | **YES** | Lesson 1.5 anchor | "Only the management body can approve them" — implementation is CISO's job |
| **Incident classification operationally** | **YES** to CISO | ENISA TIG Scenario 2 | "Significant" escalation must be documented |
| **Sign-off on routine supplier contracts** | **YES** — but critical suppliers stay with management body | Art. 21(2)(d), securitytoday | Critical = ABC class A |

### 7.3 The 5 documented sign-offs every Geschäftsführer must retain (for §38(2) personal defence)

Source: BGH IV ZR 66/25 (Nov 2025), Pöppel D&O analysis, Behrschmidt.

1. **Training certificates** (4h+ every 3y per BSI rec)
2. **Geschäftsleitungsbeschluss approving §30 measures** (date, attendees, scope)
3. **Quarterly CISO oversight reports filed in board minutes**
4. **Residual-risk acceptance log** (which risks accepted, at what threshold, on what basis)
5. **ISMS evidence pack** (ISO 27001 / VdS 10000 / BSI Grundschutz status, plus our own compliance dashboard export)

The portal's `sign_off_history` table + `requirement_assignment` + per-requirement `evidence` rows already capture all five if used consistently. The journey UX should explicitly bundle these as a "**D&O defence pack**" exportable PDF on demand.

### 7.4 The 4-stage handoff pattern

For most stepped requirements, the right RACI shape is:

```
[1] PREPARE     →  drafting / data gathering
        by the operational role (asset owner, IT engineer, HR lead, vendor manager)
                ↓
[2] REVIEW      →  technical / legal validation
        by CISO (technical) + Compliance/Legal (legal/contractual) + DPO (if personal data)
                ↓
[3] APPROVE     →  formal sign-off
        by CISO if requirement has no requiredSignOffRole
        by management body if Art. 20(1) / §38(1) duty (4 reqs today: 1.3, 1.4, 2.4, 7.3)
                ↓
[4] VERIFY      →  periodic independent check
        by Internal Auditor (annual) or external auditor (BSI / certification body)
```

Single-stage exceptions: employee AUP acknowledgment (employee signs, end), MFA enrollment (user does it, no separate review).

### 7.5 Schema implication

Current `user.role: varchar(100)` carries only `admin / member / viewer` — insufficient for RACI enforcement. Recommended additions:

- `user.functionalRoles text[]` with allowed values: `ceo, ciso, cto, coo, cpo, hr_lead, compliance_lead, dpo, asset_owner, process_owner, internal_auditor, bsi_contact, employee`
- `requirement_assignment.raciRole enum` with values `responsible, accountable, consulted, informed`
- Existing `requirement.requiredSignOffRole` extends to allow any value from `user.functionalRoles` (currently only `"ceo"` is used)

Until the migration lands, the journey UX uses `user.isManagement` + `user.jobTitle` heuristics; spec calls out where this is brittle.

### 7.6 Common RACI failures (8 patterns auditors flag — Section 17 has the inline-step crosslink)

1. **CEO signed but never trained** — sign-off without training certificate; worse than not signing for §38 defence
2. **No documented Akzeptanzschwelle** — residual risk "accepted" without GL Beschluss = liability gap
3. **CISO signs policies the law requires GL to sign** — Sicherheitsleitlinie countersigned only by ISB
4. **Vendor list with no owner column** — entries lack owner+level+last-review; "vendor list breaks in two hours under audit pressure"
5. **Incident escalation path undefined** — who decides §32 trigger? If unclear, 24h deadline becomes uncontrolled risk
6. **DPO+ISB are same person, no role boundary doc** — BSI flags conflict of interest
7. **Central log management unowned** — single most-flagged technical control in first BSI audits
8. **No Cyber Legal/Compliance Officer for incident notifications** — ENISA's most-skipped ECSF profile

---

## 8. Reading data flow + RACI per step

Each enriched Phase 0/1 step now uses this anatomy:

| Field | What it tells the implementer |
|---|---|
| **Operational interpretation** | What the law actually requires — what a BSI auditor will look for |
| **Predecessor(s)** | Codes seeded in `requirement_prerequisite` |
| **Inputs needed** | Intake fields from `CATEGORY_FIELD_MAPPING` + module data |
| **Where inputs come from** | Prior step / schema table / external upload / user typing |
| **Outputs / artefacts** | Intake row, module rows, evidence file, sign-off snapshot |
| **🧑‍🤝‍🧑 RACI** | Responsible / Accountable / Consulted / Informed roles |
| **🔁 Handoff sequence** | 4-stage Prepare → Review → Approve → Verify, with named role at each stage |
| **🏛 Legal basis for the role assignment** | Why this role and not another |
| **Sign-off mechanic** | `requirement_assignment` rows + `sign_off_history` snapshots + `requiredSignOffRole` |
| **Portal route + module** | Verified route, schema table written to |
| **Wiki article** | ✓ / ◆ / ✗ |
| **Workshop?** | yes/no + length + attendees + choreography |
| **Effort** | Person-hours / PT |
| **❓ Exec questions (from CEO course)** | "What to ask your team" — lifted from the relevant course lesson |
[redacted for public release]

---

## 9. Phase 0 — Onramp (5 steps, ~7 hours)

### Step 1 — Applicability assessment (Phase 0 entry gate, no requirement code)

**Operational interpretation.** Determine whether the entity falls under §28 BSIG before any compliance work. Skip this and the journey is pointless.

**Predecessor(s).** None — entry gate.

**Inputs needed.** Sector (NIS2 Annex I/II), employee count, annual turnover, value-chain criticality, KRITIS thresholds.

**Where inputs come from.** Public funnel `/applicability` → `applicabilityLookup` cache.

**Outputs.** `applicability_lookup` row with verdict (`essential | important | out_of_scope | kritis`).

**🧑‍🤝‍🧑 RACI.**
- **R:** Compliance/Legal Lead (gathers attributes), CEO (provides authoritative numbers)
- **A:** CEO (decisions about classification carry liability if wrong)
- **C:** External counsel if sector classification ambiguous (e.g. multi-sector SaaS)
- **I:** CISO, COO

**🔁 Handoff sequence.**
1. **Prepare** — Compliance Lead enters sector + headcount + turnover
2. **Review** — Legal Lead (or external counsel) sanity-checks edge cases (Annex II Nr. 11 "ICT service management" boundary; KRITIS thresholds against current `KRITIS-VO`)
3. **Approve** — CEO confirms the verdict in writing
4. **Verify** — periodic re-check when business profile changes (growth past size threshold, sector expansion, acquisition)

**🏛 Legal basis.** §28 BSIG defines essential vs important; classification accuracy is GF's duty under §38(1) ("Billigung" presumes correct scope). CEO course Lesson 1.4: *"The first thing the regulator checks when they start any audit … there is no grey area."*

**Sign-off mechanic.** No requirement code yet — verdict feeds Cat 12.1. CEO confirmation captured as `applicability_lookup.confirmedBy = user.id, confirmedAt = timestamp`.

**Portal route + module.** Public: `/applicability`. Internal admin: `/portal/applicability-admin`. Writes: `applicability_lookup`.

**Wiki article.** ✓ `nis2-anwendungsbereich`, ✓ `sektoren`, ✓ `umsetzung-mittelstand`

**Effort.** 30 min.

**❓ Exec questions (Lesson 1.2, 1.4).** *"Does NIS2 apply to us? When was that last reviewed? Do we have written analysis from counsel?"*

**⚠️ Commonly missed.** KRITIS thresholds change (`KRITIS-VO` is a moving target); group structures (parent + subsidiaries) each need separate classification.

---

### Step 2 — Cat 12.1 — NIS2 Classification & Scope (P0 · one-time · document)

**Operational interpretation.** Formally record Step 1's verdict inside the compliance record. §28 BSIG.

**Predecessor(s).** None seeded. Practically: Step 1.

**Inputs needed.** From `REG_SCHEMA`: `entityClassification` enum, `applicableSectors` string.

**Where inputs come from.** Pre-filled from Step 1 verdict; user confirms.

**Outputs.** `company_category_intake` row for REG; auto-derives 12.1.

**🧑‍🤝‍🧑 RACI.**
- **R:** Compliance Lead enters; CEO confirms
- **A:** CEO (Art. 20(1) governance duty: knowing scope is part of "approving")
- **C:** Legal (if multi-sector); CISO
- **I:** Whole management body

**🔁 Handoff sequence.** Single-stage (verdict-confirmation). Auto-completes once Step 1 + intake submission done.

**🏛 Legal basis.** §28 BSIG + CIR 1.1 (scope is one of the IS Policy mandatory elements).

**Sign-off mechanic.** Intake save = complete. Proof-type — no signer required, but `requirement_assignment` records who confirmed.

**Portal route + module.** `/portal/compliance/registration`. Writes: `company_category_intake.answers.entityClassification`, `.applicableSectors`.

**Wiki article.** ✓ `nis2-anwendungsbereich`

**Effort.** 5 minutes if Step 1 done.

**❓ Exec questions.** *"Are we essential or important, and which Annex categories apply?"*

**⚠️ Commonly missed.** Multi-sector SaaS picks dominant only — record all applicable; under-classification is its own §32 BSIG-fineable violation.

---

### Step 3 — Cat 1.1 — Management Cybersecurity Training (P1 · every-3-years · training)

**Operational interpretation.** §38(3) BSIG + Art. 20(2): every Geschäftsleitung member must complete training covering **three** competence areas: identifying risks, assessing measures, assessing impact on services. Personal, non-delegable, triennial floor (annual recommended by BSI). 4h equivalent content sufficient. CEO course `nis2-ceo` is designed for this (47 lessons in 6 modules ≈ 4–5 hours).

**Predecessor(s).** None seeded. Highest-leverage step — gates 1.3 / 1.4 / 2.4 / 7.3 / 8.3.

**Inputs needed.** From `GOV_SCHEMA`: `managementTrainingProvider`, `lastManagementTraining` (date). Per GF: `training_record` row with `isManagement: true`.

**Where inputs come from.** Course delivery via `courses/nis2-ceo` (`trainingLessonProgress` rows per lesson); aggregate into `training_record`. External providers (BSI Akademie, SANS) recorded as free-form `providerName`.

**Outputs.** N × `training_record` rows (1/GF member); intake fields; auto-derives 1.1.

**🧑‍🤝‍🧑 RACI.**
- **R:** Each Geschäftsleitung member individually (the course must be completed by them personally)
- **A:** Each Geschäftsleitung member personally (non-delegable per §38(3))
- **C:** CISO (provides recommended content); HR (tracks completion as employment record)
- **I:** Compliance Lead (verifies certificates archived for D&O defence pack)

**🔁 Handoff sequence.**
1. **Prepare** — CISO / HR selects course content (we recommend `courses/nis2-ceo`); enrols each GF member
2. **Review** — CISO confirms three competence areas covered (course indexes match)
3. **Approve** — N/A: this is a "complete the training," not "approve the training" — GF member's own act
4. **Verify** — Compliance Lead archives certificates; sets `nextReviewDate = completedAt + 3 years`

**🏛 Legal basis.** §38(3) BSIG personal duty + Art. 20(2) NIS2 + CEO course Lesson 1.6: *"The training duty is personal and non-delegable. You cannot send your CISO, your lawyer, or your assistant to attend on your behalf."*

**Sign-off mechanic.** `requirement_assignment` per GF member; status complete only when ALL assigned have recent (< 3y) completion. Triennial review enforced via `nextReviewDate`. Plus **4 trigger events** (Lesson 1.6): composition change, business process change, risk exposure change, measures change — should be surfaced as "interim refresh" prompts in journey UX, not just calendar-based.

**Portal route + module.** Delivery: `/portal/training` + `courses/nis2-ceo`. Status: `/portal/compliance/governance`. Writes: `training_record`, `training_lesson_progress`, `company_category_intake`.

**Wiki article.** ✓ `geschaeftsleitungs-schulung-nis2`

**Effort.** 4–5 hours/GF member (course completion).

**❓ Exec questions (Lesson 1.6).** *"Do we have a record of the last time every member of the management body completed cybersecurity training, and does it document the content covered and the time spent?"*

**⚠️ Commonly missed.** **Non-delegable** (sending the assistant = breach). **Three competence areas** (cover only one or two = sub-standard). **Documentation is what auditor asks for** — not which body issued the certificate. **4 interim-trigger events** — most plans schedule on calendar only; the trigger events shift the floor.

---

### Step 4 — Cat 12.2 — BSI Registration (P0 · one-time · proof)

**Operational interpretation.** §33 BSIG-neu + Art. 27 NIS2: register with BSI within 3 months of becoming subject (deadline was 2026-03-06 — now passed). Two-stage: register via Mein Unternehmenskonto (MUK) first (5–10 working days), then NIS-2 registration at https://mip2.bsi.bund.de. Missing/incorrect registration is a separate §32 BSIG fine.

**Predecessor(s).** Seeded: `12.1 → 12.2`.

**Inputs needed.** From `REG_SCHEMA`: `mukAccountId`, `bsiRegistrationDate`, `contactPersonName`, `contactPersonEmail`, `registrationProofUploaded` (file). Plus dedicated `bsi_registration` table fields (`registrationRef`, `ipRangesV4`, `euCountries`).

**Where inputs come from.** External: user registers at MUK + BSI portal; returns to nisd2.eu to enter MUK ID + upload confirmation PDF.

**Outputs.** `company.bsi_registration_id`; `bsi_registration` row; `evidence` row with confirmation PDF; intake updates; auto-derives 12.2.

**🧑‍🤝‍🧑 RACI.**
- **R:** Compliance Lead (drives the MUK + BSI registration process)
- **A:** CEO (signature is required on the BSI registration data submission)
- **C:** CISO (for the §33(1) Nr. 6 contact-person designation — operational reachability); Legal (for sector classification text)
- **I:** Whole management body; CTO (for IP ranges if applicable)

**🔁 Handoff sequence.**
1. **Prepare** — Compliance Lead initiates MUK organisation certificate request (5–10 working days lead time)
2. **Review** — CISO validates `contactPersonName` + `contactPersonEmail` (use a **functional mailbox** like `nis2-contact@company.de`, not personal — practitioner consensus); CEO reviews all data
3. **Approve** — CEO signs the registration submission; Compliance Lead uploads to BSI portal
4. **Verify** — Compliance Lead retains BSI confirmation PDF in `evidence`; sets annual review reminder (Step 12.3)

**🏛 Legal basis.** §33 BSIG-neu; CEO course Lesson 1.4: *"Late or incorrect registration is sanctioned separately under Article 32. It is its own violation."* Personal review by GF required per Lesson 1.4: *"Personally review the submission before it goes in."*

**Sign-off mechanic.** Evidence upload = complete (proof type). No `requiredSignOffRole` set in framework data, but practical Accountable is CEO.

**Portal route + module.** `/portal/compliance/registration`. Writes: `company.bsi_registration_id`, `bsi_registration`, `evidence`, `company_category_intake`.

**Wiki article.** ✓ `nis2-registration-portals`

**Effort.** 5–10 working days lead (MUK) + 1 hour active.

**❓ Exec questions (Lesson 1.4).** *"Are we registered with the competent authority under NIS2, and when was the registration last reviewed for accuracy?"*

**⚠️ Commonly missed.** **MUK lead time** — UX must show the wait. **Functional mailbox for §33 contact** — personal addresses break when individuals leave. **Update duty** (§33(3)): any change in registered information requires update without delay — not just annual. **For KRITIS:** §33(2) Nr. 5 requires the contact to be 24/7-reachable (SOC-equivalent).

---

### Step 5 — Cat 1.2 — Roles and Responsibilities (P1 · on-change · proof)

**Operational interpretation.** §30(1) BSIG + CIR Annex 1.2.2: define roles and responsibilities; at minimum, "**at least one person directly accountable to the management body**" for cybersecurity (= CISO/ISB by convention). BSI 200-2 §2.4 requires the ISB to report directly to top management, not embedded in IT (avoids role conflict).

**Predecessor(s).** None seeded. Gates 3.1 + 8.1.

**Inputs needed.** From `company` table: `cisoName`, `cisoReportsTo`. From `user` table: N × users with `companyId` set + `role` (admin/member/viewer) + `jobTitle` + `isManagement` + (recommended) `functionalRoles[]`. Implicit RACI via `requirement_assignment` rows that mark per-control owner.

**Where inputs come from.** User typing. Inviting team members via `/portal/team` fires `company_invite`; on acceptance, `user.companyId` set.

**Outputs.** `company.cisoName`, `.cisoReportsTo`; N × `user` rows; `company_invite` rows; auto-derives 1.2.

**🧑‍🤝‍🧑 RACI.**
- **R:** CISO (often drafts the RACI matrix based on operational reality)
- **A:** CEO (Art. 20(1) approval; CISO appointment is GF act)
- **C:** Legal (employment contracts, scope of authority — Weisungsbefugnisse); HR (org chart)
- **I:** Whole management body; new appointees

**🔁 Handoff sequence.**
1. **Prepare** — CISO drafts RACI matrix for the 49 requirements; identifies the §30(1) accountable person (themselves, or another)
2. **Review** — Legal validates Weisungsbefugnisse (delegation authority for each role) per CIR Annex 1.2.2
3. **Approve** — CEO formally appoints CISO + RACI matrix (board minute); per-user invitations sent
4. **Verify** — annual re-affirmation in management review (Cat 7.3); on-change triggers when someone leaves or new role is created

**🏛 Legal basis.** §30(1) BSIG + CIR 2024/2690 Annex 1.2.2 ("Rollen, Verantwortlichkeiten und Weisungsbefugnisse") + BSI 200-2 §2.4 (ISB direct-report). CEO course Lesson 1.5 anchor: *"The CISO can implement the measures. Only the management body can approve them."*

**Sign-off mechanic.** Proof — completion = "CISO named in `company.cisoName` + ≥1 team member invited". No `requiredSignOffRole` today; v4 recommends adding `requiredSignOffRole = "ceo"` to 1.2 since appointment is a GF act.

**Portal route + module.** Primary: `/portal/team`. Secondary: `/portal/organization`. Writes: `user`, `company.cisoName`, `company_invite`, `requirement_assignment`.

**Wiki article.** ✗ — **write one** ("RACI for the 10 NIS2 measures in a 50-person SME"). High priority — this is the role definition wiki the journey leans on.

**Effort.** 30 minutes (CISO known) — 2 hours (CISO to be hired).

**❓ Exec questions.** *"Who is our §30(1) accountable person? Do they report directly to me, not buried under IT? Have I seen the RACI for the other 9 measures and signed it?"*

**⚠️ Commonly missed.** **CISO embedded under IT** = BSI 200-2 §2.4 violation (role conflict). **"CISO" as title is not statutorily required** — what matters is the function. **No Weisungsbefugnisse documented** — auditors flag this as ambiguous accountability. **No Cyber Legal/Compliance Officer named** — ENISA's most-skipped ECSF role; for SMEs, fold into Compliance Lead with explicit incident-notification scope.

---

## 10. Phase 1 — Foundation (10 steps, ~5 PT, months 1–6)

### Step 6 — Cat 1.4 — Personal Liability Acknowledgment (P1 · one-time · CEO sign-off)

**Operational interpretation.** §38(2) BSIG makes GF personally liable for breaches of management duties. Non-waivable. Each member individually signs an acknowledgment.

**Predecessor(s).** Seeded: `1.1 → 1.4`.

**Inputs needed.** `GOV_SCHEMA.liabilityAcknowledged` boolean — per GF member.

**Where inputs come from.** User signs in portal; `requirement_assignment` row per GF + `sign_off_history` snapshot per signature.

**Outputs.** N × `requirement_assignment` + `sign_off_history`; auto-derives 1.4.

**🧑‍🤝‍🧑 RACI.**
- **R:** Each GF member personally
- **A:** Each GF member personally (`requiredSignOffRole = "ceo"` in framework data; ALL members must sign)
- **C:** Legal (may draft the acknowledgment text; usually unchanged from BSIG-Begründung wording)
- **I:** Compliance Lead (archives for D&O defence pack)

**🔁 Handoff sequence.** Single-stage per person — each GF reviews the §38(2) acknowledgment text and signs personally. No delegation.

**🏛 Legal basis.** §38(2) BSIG; §35 GmbHG / §76 AktG (each managing director / board member individually). Pöppel D&O analysis: BSIG-Begründung explicitly preserves D&O insurability — the signed acknowledgment is part of personal defence record.

**Sign-off mechanic.** `requiredSignOffRole: "ceo"`; ALL GF members must sign individually. Status `completed` only when assignment count = signed count.

**Portal route + module.** `/portal/compliance/governance`. Writes: `requirement_assignment`, `sign_off_history`, `company_category_intake`.

**Wiki article.** ✗ — write a short standalone explainer of §38(2).

**Effort.** 5 min/GF member.

**❓ Exec questions.** *"Has every member of the Geschäftsleitung personally signed the §38(2) acknowledgment? Is the signed document in our D&O file?"*

**⚠️ Commonly missed.** **One signs for all.** Per-member sign-off enforced by `requirement_assignment` row per GF. **GmbH & Co. KG** — Komplementär-GmbH's GF signs; limited partners do not. Schema's `legalForm` field drives per-form sign-off list.

---

### Step 7 — Cat 2.1 — Risk Assessment Methodology (P0 · one-time · document)

**Operational interpretation.** Pick the methodology (BSI 200-3 default with 4×4 matrix, semi-quantitative). CIR 2.1.2 requires: methodology, risk tolerance, acceptance criteria, threat analysis approach, CTI integration.

**Predecessor(s).** None seeded — root.

**Inputs needed.** Single `company_risk_methodology` row with `methodology` (default `bsi_200_3`), `methodologyType` (`semi-quantitative`), `likelihoodScale` + `impactScale` (default `4-level`), `riskAcceptanceThreshold` (default `"Mittel oder darunter"`), `cisoAcceptanceLevel`, `ceoAcceptanceLevel`, `allHazardsConfirmed: true`, `ctiSources` (multi-select), optional `methodologyDocument` upload.

**Where inputs come from.** Pre-filled from `platform-defaults.ts`. User confirms.

**Outputs.** `company_risk_methodology` row; auto-derives 2.1.

**🧑‍🤝‍🧑 RACI.**
- **R:** CISO (drafts/selects methodology, configures scales)
- **A:** CEO (Akzeptanzschwelle is a GL decision; CIR 2.1.2 requires management approval of methodology)
- **C:** Cybersecurity Risk Manager (ECSF role) — often combined with CISO in SMEs
- **I:** Whole management body; internal auditor (so audit scope can use the same scales later)

**🔁 Handoff sequence.**
1. **Prepare** — CISO confirms BSI 200-3 defaults (1-click) or customises scales
2. **Review** — CISO + Legal validate the **risk acceptance thresholds** match what the GL intends (don't accept `Hoch` risks if the GL would never approve them)
3. **Approve** — CEO formally approves methodology + acceptance thresholds (board minute); this is the Akzeptanzschwelle decision
4. **Verify** — re-confirmed annually in management review; on-change when threat landscape or risk appetite shifts

**🏛 Legal basis.** §30(2) Nr. 1 BSIG, CIR 2.1.2 (methodology + risk tolerance + criteria + threat analysis + CTI), BSI 200-3. CEO course Lesson 2.1: *"If you sign off on a set of cybersecurity measures without understanding the risk picture behind them, your signature is uninformed — and an uninformed sign-off does not protect you under Article 20(1)."*

**Sign-off mechanic.** Document type. CEO sign-off captured in 2.4 (IS Policy umbrella). No separate `requiredSignOffRole` at 2.1 today; recommended to add CEO sign-off here since Akzeptanzschwelle is a GL decision per secjur and CIR 2.1.1.

**Portal route + module.** `/portal/compliance/risk-management`. Writes: `company_risk_methodology`.

**Wiki article.** ✓ `nis2-risikomanagement`

**Effort.** 15 min (one-click) — 1 hour (custom).

**❓ Exec questions (Lesson 2.1).** *"Show me the risk matrix and walk me through the top-right corner. What's our Akzeptanzschwelle, and did I personally approve it?"*

**⚠️ Commonly missed.** **`allHazardsConfirmed`** — §30(2) "gefahrenübergreifend" = cyber + physical + environmental; ticking this commits to flood/fire/power assessment. **CTI integration** — CIR 2.1.2 requires this; pick BSI Lagebild minimum. **GL never sets Akzeptanzschwelle explicitly** — major audit failure pattern (secjur). The Akzeptanzschwelle is a separate GL-signed artefact, not buried in the risk register.

---

### Step 8 — Cat 2.2 — Asset Inventory, Scope & Classification (P0 · ongoing · technical) — **WORKSHOP**

**Operational interpretation.** Identify every in-scope asset (IT, OT, cloud, data store, network segment), classify by protection requirement (BSI 200-2: Normal / Hoch / Sehr Hoch), tag criticality. CIR 12 makes inventory mandatory. Satisfaction pair `2.2 ↔ G-ROP.1` tier `equivalent` — DSGVO records of processing carry over.

**Predecessor(s).** None seeded — root.

**Inputs needed.** N × `asset` rows with `name, type, description, isCritical, isOT, owner, location, hostname, ipAddress, operatingSystem, softwareVersion, hasMfa, encryptionAtRest, encryptionInTransit, cryptoImplementation, hasBackup, backupFrequency, backupLocation, lastBackupTestDate, rto, rpo, lastPatchDate, lastVulnScanDate`. Plus intake `classificationLevels` (3-level default).

**Where inputs come from.** Three sources: (a) DSGVO Verzeichnis-der-Verarbeitungstätigkeiten import via satisfaction pair — pre-fills ~50–80%; (b) CMDB / asset-mgmt-tool CSV; (c) Workshop entry.

**Outputs.** N × `asset` rows; `evidence` rows for inventory exports / network diagrams; auto-derives 2.2.

**🧑‍🤝‍🧑 RACI.**
- **R:** **Asset Owner per row** (operational owner of each asset) drafts/maintains the row; CISO orchestrates
- **A:** CISO (overall inventory accountability under §30(2) Nr. 1); per-asset accountability sits with the named Asset Owner
- **C:** IT-Lead/CTO (technical attributes), HR (HR systems, persons-as-assets), DPO (personal-data scope tagging — for the satisfaction pair to work)
- **I:** CEO (sees inventory summary in management review); auditor

**🔁 Handoff sequence.**
1. **Prepare** — Asset Owners fill in their rows (per-system, per-process); workshop kicks off with DSGVO import
2. **Review** — CISO validates protection-requirement classifications per asset (Normal / Hoch / Sehr Hoch); DPO confirms personal-data scope tags
3. **Approve** — CISO signs off on the inventory completeness; CEO acknowledges the inventory in the IS Policy sign-off (Step 10, Cat 2.4)
4. **Verify** — internal auditor periodically samples assets; on-change updates per joiner/mover/leaver and asset onboarding/decommissioning

**🏛 Legal basis.** §30(2) Nr. 1 + CIR 12 + §28 BSIG + BSI 200-2 Schutzbedarfsfeststellung. CEO course Lesson 2.2: *"An asset is anything the business depends on. … If the inventory is wrong, nothing built on top of it is reliable."*

**Sign-off mechanic.** Technical type — auto-derives when ≥1 asset exists + `classificationLevels` set. Quality gates (≥80% coverage) added in v2 of UX.

**Portal route + module.** Inventory: `/portal/assets`. Form: `/portal/compliance/risk-management`. Writes: `asset`, `company_category_intake`.

**Wiki article.** ✓ `wie-asset-inventar-erstellen-nis2`, ✓ `nis2-anlagenmanagement`

**Workshop.** ~4 h. Attendees: CISO + IT-Lead + ops + HR + GF representative. Choreography: (1) DSGVO import; (2) review pre-filled rows; (3) tag protection requirement per asset; (4) flag OT assets (`isOT: true`); (5) close gaps in discussion; (6) export PDF for evidence.

**Effort.** 1.5 PT (workshop + tidying).

**❓ Exec questions (Lesson 2.2).** *"Show me the asset inventory. When was it last updated, and does it include cloud subscriptions and contractor access?"*

**⚠️ Commonly missed.** **No owner column per row** — auditor failure pattern; the vendor/asset list breaks under audit pressure. The `asset.owner` field is non-optional in BSI 200-2; v4 spec recommends making it required in schema. **OT/ICS in scope** (`isOT: true`) triggers IEC 62443 mapping later. **Cloud + SaaS as assets.** **Asset coverage threshold** — no legal threshold but <80% is flagged.

---

### Step 9 — Cat 2.3 — Risk Register & Treatment (P1 · annual · technical) — **WORKSHOP**

**Operational interpretation.** Per asset, assess threats × likelihood × impact using 2.1's methodology, decide treatment (mitigate/accept/transfer/avoid), document plan with owner + deadline. CIR 2.1.1 + 2.1.2. BSI 200-3 provides 47 elementary threats — `lib/compliance/bsi-threats.ts`.

**Predecessor(s).** Seeded: `2.1 → 2.3`, `2.2 → 2.3`.

**Inputs needed.** Per `risk` row: `title, description, category, likelihood, impact, treatment, treatmentDescription, residualLikelihood, residualImpact, riskOwner, lastReviewedAt, nextReviewDate`. Plus `risk_asset` link rows + `risk_treatment` rows per active mitigation.

**Where inputs come from.** Workshop walk-through: 47 BSI threats × top-N critical assets from 2.2; CTI feed adjustments.

**Outputs.** N × `risk` + M × `risk_asset` + K × `risk_treatment`; auto-derives 2.3.

**🧑‍🤝‍🧑 RACI.**
- **R:** **Asset Owner** (knows their system's threat surface) + CISO (orchestrates, runs methodology); **Cybersecurity Risk Manager** (ECSF — often = CISO in SMEs)
- **A:** CISO (operational sign-off on the register); CEO (accepts residual risk in 2.4 — this is the 3-stage handoff the user asked about)
- **C:** IT-Lead (technical mitigations), DPO (personal-data risks), Procurement Lead (supplier-side risks), Legal (regulatory consequences of accepted risks)
- **I:** Whole management body (residual risk summary surfaces in 2.4)

**🔁 Handoff sequence — this is the canonical 3-stage example the user asked about.**
1. **Prepare (Asset Owner / Supplier Owner)** — for each owned asset/supplier, drafts the risk row with proposed likelihood × impact; lists existing controls
2. **Review (CISO)** — methodology consistency check; cross-asset deduplication; aggregates into risk register
3. **Approve operationally (CISO)** — signs off on the register and treatment plan; passes residual-risk acceptance decisions to the GL
4. **Approve strategically (CEO)** — accepts the residual risk in 2.4 (separate step; cannot happen here because 2.4 requires the full 2.3 register first)
5. **Verify** — internal auditor reviews methodology adherence (Cat 7.2); annual reassessment + incident-triggered (CIR 2.1.4)

(Note: in practice this is 5 stages because the GL approval at Step 4 lives in Cat 2.4 — the user's "asset owner → CISO → CEO" pattern is preserved across two requirements.)

**🏛 Legal basis.** §30(2) Nr. 1, CIR 2.1.1 + 2.1.2 + 2.1.4, BSI 200-3. Three-stage handoff confirmed by cybervize RACI guide + activeMind Projektplan.

**Sign-off mechanic.** Technical type — auto-derives when ≥1 risk with treatment exists. Annual `nextReviewDate` enforced.

**Portal route + module.** `/portal/risks` (workshop mode). Writes: `risk`, `risk_asset`, `risk_treatment`.

**Wiki article.** ✓ `wie-nis2-risikoanalyse-durchfuehren`, ✓ `nis2-risikomanagement`

**Workshop.** ~2 h. Attendees: CISO + IT-Lead + GF rep. Choreography: walk 47 threats × top critical assets; score L×I; assign treatment + owner.

**Effort.** 1 PT.

**❓ Exec questions (Lesson 2.1).** *"Show me the top-right corner of the matrix. What are we treating, what are we accepting, who's the owner of each, when's the deadline?"*

**⚠️ Commonly missed.** **Treatment without owner / deadline** — `risk_treatment.responsibleUserId` + `dueAt` are not optional. **Third-party risks split out** — should be in the same register with `category: "supply_chain"`. **Risk acceptance without GL beschluss** — operational CISO approval ≠ Akzeptanzschwelle approval; the latter lives in 2.4. **Annual reassessment + incident-triggered** — most plans schedule annual but skip the incident-triggered re-assessment (CIR 2.1.4).

---

### Step 10 — Cat 2.4 — Risk Acceptance + IS Policy Sign-Off (P0 · one-time · CEO sign-off) — **PHASE 1 MILESTONE**

**Operational interpretation.** Two obligations under one event: (a) §38(1) GL formally accepts residual risk; (b) CIR 1.1 IS Policy (objectives, resources, roles, retention, monitoring, management approval) is published and signed. Satisfies GDPR G-TOM.1.

**Predecessor(s).** Seeded: `2.3 → 2.4`, `1.1 → 2.4`.

**Inputs needed.** From `RSK_SCHEMA`: `residualRiskCount`, `policyVersion`, `policyApprovalDate`. Plus IS Policy document (`policy` row type `security`). Plus per-GF sign-off rows.

**Where inputs come from.** Counts derived from Cat 2.3 `risk` rows where `treatment = "accept"`. Policy: template generation + customisation. Sign-off: each GF individually.

**Outputs.** `policy` row (status `approved`); `evidence`; intake updates; N × `requirement_assignment` + `sign_off_history`; auto-derives 2.4.

**🧑‍🤝‍🧑 RACI.**
- **R:** CISO drafts the IS Policy + presents residual-risk summary to GL
- **A:** Each Geschäftsleitung member personally (`requiredSignOffRole: "ceo"`, ALL must sign — Sicherheitsleitlinie + Restrisiko-Akzeptanz)
- **C:** Legal (policy language compliance), DPO (interplay with G-TOM.1 / Art. 32 GDPR)
- **I:** Whole organisation (policy must be communicated to all employees per CIR 1.1 — distribution recorded via `policy_acknowledgment`)

**🔁 Handoff sequence — the canonical milestone handoff.**
1. **Prepare (CISO)** — drafts IS Policy v1.0 from template + 2.1 methodology + 2.2 scope + 2.3 register
2. **Review (DPO + Legal)** — DPO checks GDPR satisfaction (G-TOM.1 via the satisfaction pair); Legal validates legal language
3. **Approve (each GF member personally)** — every Geschäftsleitung member individually signs in the portal; status flips only when all signed
4. **Verify** — policy is **annually reviewed** (BSI 200-2 requires top-level policy review at minimum every 2 years; CEO course Lesson 1.5 says "personal signature + date"); internal auditor checks acknowledgment coverage

**🏛 Legal basis.** §38(1) + CIR 1.1 + CIR 2.1.1 + Art. 20(1). CEO course Lesson 1.5: *"Three duties, each failing independently. Approve - a formal legal act. It must be documented, it must name what you are approving, and it must be dated with your personal signature."*

**Sign-off mechanic.** `requiredSignOffRole: "ceo"`; ALL GF members must sign individually (uses `requirement_assignment` per GF member).

**Portal route + module.** Form: `/portal/compliance/risk-management`. Policy artefact: `/portal/policies`. Writes: `policy`, `evidence`, `company_category_intake`, `requirement_assignment`, `sign_off_history`.

**Wiki article.** ✓ `nis2-documents`

**Workshop.** ~1 h. Attendees: all GF members. Choreography: each opens IS Policy → individually signs → portal records per-person stamp → milestone celebration UX. Then distribute to all staff for acknowledgment (Cat 8.1 handles this).

**Effort.** 0.5 PT.

**❓ Exec questions (Lessons 1.5 + 2.1).** *"Is my personal signature on the IS Policy, dated, with the version number? Did I see the residual-risk summary before I signed it? Is there a process for regular reporting back to me on whether the measures are being implemented?"*

**⚠️ Commonly missed.** **Policy without acceptance criteria** — CIR 1.1 demands monitoring indicators; `cir11Checklist` field forces all 7 CIR 1.1 elements. **Single-signer GmbH & Co. KG.** **CISO signs but GL does not** — most-flagged pattern (Section 7.6 #3). **Policy "approved" but never communicated to employees** — CIR 1.1 requires distribution; track via `policy_acknowledgment`.

---

### Step 11 — Cat 3.1 — Incident Response Plan & Team (P0 · annual · document)

**Operational interpretation.** §30(2) Nr. 2 + Art. 21(2)(b) + CIR 3.1. Written plan + IRT lead + escalation paths + classification scheme + secure OOB comms + detection tooling. Satisfies GDPR G-BRC.1.

**Predecessor(s).** Seeded: `1.2 → 3.1`.

**Inputs needed.** From `INC_SCHEMA`: `incidentLead`, `irtTeamSize`, `secureCommsChannel`, `detectionTools`, `incidentEscalationContacts`. Plus `policy` row of type `incident_response`.

**Where inputs come from.** User typing + IR plan upload (templates in `lib/compliance/`).

**Outputs.** `policy` row + `evidence`; auto-derives 3.1.

**🧑‍🤝‍🧑 RACI.**
- **R:** CISO drafts; Cyber Incident Responder (ECSF) operationalises
- **A:** CISO (operational accountability); CEO (informed but not sign-off — under 2.4 IS Policy umbrella)
- **C:** **Cyber Legal/Policy/Compliance Officer (ECSF)** for notification language; DPO for personal-data scenarios; Legal for liability language
- **I:** Whole management body; IRT members; external CERT contacts

**🔁 Handoff sequence.**
1. **Prepare (CISO)** — drafts IR plan from template; selects IRT lead; documents detection tools
2. **Review (Cyber Legal/Compliance Officer + DPO)** — validates notification templates align with §32 BSIG + Art. 33 GDPR; reviews escalation thresholds
3. **Approve (CISO)** — signs operational plan; archives version
4. **Verify (internal auditor)** — annual table-top exercise (Cat 3.4) tests the plan in practice

**🏛 Legal basis.** §30(2) Nr. 2 + CIR 3.1 + ENISA TIG Scenario 2 (incident classification → notification decision flow).

**Sign-off mechanic.** Document type — completion when `policy.status = approved`.

**Portal route + module.** Form: `/portal/compliance/incident-handling`. Plan artefact: `/portal/policies`. Writes: `policy`, `evidence`, `company_category_intake`.

**Wiki article.** ✓ `nis2-vorfallbehandlung`

**Effort.** 0.5 PT.

**❓ Exec questions.** *"Who decides if an incident is significant? What's the escalation path to me, and at what threshold? Have we tested the OOB comms in the last 90 days?"*

**⚠️ Commonly missed.** **OOB secure comms** — §30(2) Nr. 10 + CIR 11.2; primary IT comp will compromise email AND Teams. **Detection ≠ response.** **Cyber Legal/Compliance Officer role unfilled** — ENISA's most-skipped ECSF profile.

---

### Step 12 — Cat 3.3 — BSI Reporting (24h / 72h / 1m) (P0 · on-change · proof)

**Operational interpretation.** §32 BSIG. Three reports per significant incident: early warning ≤24h, notification ≤72h, final ≤1 month. **Same incident gets three updates, not three documents.** Modelled as one `incident` row with multiple `bsi_incident_report` rows (`reportType` enum). DSGVO 72h parallel obligation may apply.

**Predecessor(s).** Seeded: `3.1 → 3.3`.

**Inputs needed.** From `INC_SCHEMA`: `earlyWarningSlaHours` (max 24), `bsiReportingRegistered` (auto from 12.2). At incident time: `bsi_incident_report` rows per report stage.

**Where inputs come from.** Config pre-filled from Cat 12.2. Per-incident: triggered when user marks incident `severity: "significant"`.

**Outputs.** `bsi_incident_report` rows per incident; auto-derives 3.3.

**🧑‍🤝‍🧑 RACI.**
- **R:** **Cybersecurity Implementer** detects; **CISO** classifies vs §32 threshold; **Cyber Legal/Compliance Officer** drafts notification
- **A:** **CISO** operationally; **management body** for "significant" classification decision (ENISA TIG Scenario 2 confirms operational classification with management informed) — within hours, formal approval if disputed
- **C:** **DPO** parallel-tracks Art. 33 GDPR (separate notification to BfDI / State DPA); **Legal** for customer-impact language
- **I:** Whole management body within hours; Cyber Legal/Compliance Officer drives external CSIRT comms

**🔁 Handoff sequence — significant incident workflow.**
1. **Detect (Cybersecurity Implementer)** — alerts the IRT
2. **Classify (CISO)** — applies `significantIncidentCriteria` (from 3.2); decides "significant" yes/no
3. **Inform (CISO → management body)** — within hours of classification; documented escalation
4. **Draft (Cyber Legal/Compliance Officer)** — early warning content (24h deadline)
5. **Approve (CISO)** — operational approval; management body informed
6. **Submit** — via BSI portal; portal records `submittedAt`
7. **Parallel: DPO** — drafts Art. 33 GDPR notification if personal data scope; submits within 72h to BfDI
8. **Update (72h, then 1 month final)** — same workflow, same `incident` row, new `bsi_incident_report` rows

**🏛 Legal basis.** §32 BSIG + Art. 23(4) NIS2 + CIR 3.4. ENISA TIG Scenario 2 explicitly maps the classification → notification flow with CISO operational + management informed.

**Sign-off mechanic.** Proof — completion when configuration + (post-incident) ≥1 full reporting cycle. Triggered on-change at incident creation.

**Portal route + module.** Config: `/portal/compliance/incident-handling`. Live reporting: `/portal/incidents`. Writes: `bsi_incident_report`, `incident`.

**Wiki article.** ✓ `nis2-meldepflicht`, ✓ `wie-bsi-vorfall-melden-24h`

**Effort.** 30 min config + variable at incident time.

**❓ Exec questions (Lesson 1.5 + 1.11).** *"Who decides what counts as 'significant'? When was the last time we tested this — drill or real incident? What's our current OOB classification escalation path?"*

**⚠️ Commonly missed.** **Three reports as separate docs** ≠ one incident with three updates (we handle this correctly via data model). **DSGVO 72h parallel** — must trigger if personal data scope. **§35 BSIG customer notification is SEPARATE** — currently bundled in Cat 3.5 (mismatch flagged in Section 16.2). **Incident classification escalation path undefined** — most-flagged audit pattern (Section 7.6 #5).

---

### Step 13 — Cat 10.1 — Access Control Policy & Model (P1 · annual · document)

**Operational interpretation.** §30(2) Nr. 9 + CIR 11.1. Written access policy: model (RBAC / ABAC), least-privilege, privileged-role definition, approval workflow.

**Predecessor(s).** Seeded: `2.2 → 10.1`.

**Inputs needed.** `company_policy_config` row type `access_control`; plus `policy`.

**Where inputs come from.** Policy editor / generator. Asset list from 2.2 informs scope.

**Outputs.** `company_policy_config`; `policy`; `evidence`; auto-derives 10.1. Unlocks 10.2, 10.3, 10.4, 11.1, 11.2, 11.3.

**🧑‍🤝‍🧑 RACI.**
- **R:** CISO drafts; IT-Lead/CTO implements technical RBAC; HR contributes for joiners/movers/leavers
- **A:** CISO (operational sign-off — folds into 2.4 IS Policy umbrella for GL)
- **C:** HR-Lead (lifecycle), DPO (data classification ↔ access mapping), Legal (privileged-role authority)
- **I:** Whole management body; employees (via Cat 8.1 distribution)

**🔁 Handoff sequence.**
1. **Prepare (CISO)** — drafts policy with RBAC model + privileged-role definitions
2. **Review (IT-Lead + HR-Lead)** — IT validates technical feasibility; HR confirms JML mapping
3. **Approve (CISO)** — operational sign-off
4. **Verify** — quarterly access review (Cat 10.4) audits actual vs policy

**🏛 Legal basis.** §30(2) Nr. 9 + CIR 11.1 + ENISA TIG.

**Sign-off mechanic.** Document type — completion when `policy.status = approved`.

**Portal route + module.** Editor: `/portal/compliance/access-control`. Artefact: `/portal/policies`. Writes: `company_policy_config`, `policy`.

**Wiki article.** ✓ `nis2-zugriffskontrolle`

**Effort.** 0.5 PT.

**❓ Exec questions.** *"Do I personally use the access controls I approved (MFA, least-privilege, periodic re-auth)? If not, that's an audit finding."*

**⚠️ Commonly missed.** **No separate privileged-role definition.** **Cloud + SaaS scope** (Microsoft 365, GitHub, Notion). **CEO exempts self from MFA** = direct CEO course Lesson 1.5 finding.

---

### Step 14 — Cat 11.1 — Multi-Factor Authentication (P0 · annual · technical)

**Operational interpretation.** §30(2) Nr. 10 + CIR 11.7. MFA for privileged access + remote access + high-risk users.

**Predecessor(s).** Seeded: `10.1 → 11.1`.

**Inputs needed.** From `AUT_SCHEMA`: `mfaTool`, `mfaMethods`, `mfaCoverage` (enum), `mfaCoveragePct`, `adminMfaEnforced`.

**Where inputs come from.** User typing + IdP export ideally.

**Outputs.** Intake fields; auto-derives 11.1.

**🧑‍🤝‍🧑 RACI.**
- **R:** IT-Lead/CTO (deploys, configures); CISO (sets policy from 10.1)
- **A:** CTO (technical accountability); CISO (compliance accountability — coverage% report to GL)
- **C:** HR (helps with employee enrollment + onboarding); Legal (for any exception with business justification)
- **I:** Management body (coverage report); employees (training on tool)

**🔁 Handoff sequence.**
1. **Prepare (CTO + IT-Lead)** — selects tool (Microsoft Authenticator / YubiKey / Duo), defines methods
2. **Review (CISO)** — verifies policy alignment from 10.1; defines coverage scope (`critical_only | remote_access | all_users | all_systems`)
3. **Approve (CISO)** — operational rollout sign-off
4. **Verify** — quarterly coverage% report to management body; admin MFA enforced check

**🏛 Legal basis.** §30(2) Nr. 10 + CIR 11.7.

**Sign-off mechanic.** Technical — completion when fields populated; coverage threshold (≥95%) added as quality gate v2.

**Portal route + module.** `/portal/compliance/authentication`. Writes: `company_category_intake`.

**Wiki article.** ✓ `mfa-pflicht-nis2`

**Effort.** 30 min config + IT rollout (variable).

**❓ Exec questions.** *"Am I personally on MFA — phishing-resistant (FIDO2/hardware)? What's the coverage% for the full user population, including service accounts?"*

**⚠️ Commonly missed.** **MFA bypass via service accounts / legacy systems.** **`mfaCoveragePct` reflects in-scope user population, not configured systems.** **Phishing-resistant MFA** for highest-risk roles (CIR 11.7 increasingly expects FIDO2 / hardware token).

---

### Step 15 — Cat 1.3 — Budget Allocation (P1 · annual · CEO sign-off) — **closes Phase 1**

**Operational interpretation.** §38(1) BSIG GL allocates resources. CIR doesn't fix a number — test is "appropriate." Practical: annual EUR + approver + date. LAST in Phase 1 because now you know what the measures cost.

**Predecessor(s).** Seeded: `1.1 → 1.3`. Practical: also 2.3 + 3.1 + 4.1 + 6.x + 8.x cost estimates.

**Inputs needed.** From `GOV_SCHEMA`: `annualSecurityBudget`, `budgetApprovalDate`.

**Where inputs come from.** User typing. Future: portal sums `risk_treatment` + `policy` cost estimates + supplier contracts.

**Outputs.** Intake fields; `requirement_assignment` for CEO sign-off; auto-derives 1.3.

**🧑‍🤝‍🧑 RACI.**
- **R:** CISO + CFO/Finance Lead draft the budget proposal with line items
- **A:** CEO (`requiredSignOffRole: "ceo"`, single sign-off — budget is a single board decision)
- **C:** CFO (financial planning), Compliance Lead (proportionality math vs revenue % benchmarks)
- **I:** Whole management body; auditor

**🔁 Handoff sequence.**
1. **Prepare (CISO + CFO)** — line-item budget with tools, services, training, audits, insurance
2. **Review (CFO)** — financial planning fit
3. **Approve (CEO)** — board minute formalising the budget Beschluss
4. **Verify (CFO + CISO)** — quarterly burn rate review; surface under-spend or over-spend in management review (Cat 7.3)

**🏛 Legal basis.** §38(1) BSIG; Art. 20(1) NIS2. CEO course Lesson 1.5: *"Approve - a formal legal act."*

**Sign-off mechanic.** `requiredSignOffRole: "ceo"` — single signer (one CEO, not all GF, since budget is a single board act).

**Portal route + module.** `/portal/compliance/governance` + `/portal/organization`. Writes: `company_category_intake`, `requirement_assignment`, `sign_off_history`.

**Wiki article.** ✗ — write a short article on auditor benchmarks (% of revenue, headcount).

**Effort.** 30 min.

**❓ Exec questions.** *"Is the budget grounded in line items from real measures (2.3, 3.1, 6.x), or is it a top-down number? Do I have a 3-year view, not just annual?"*

**⚠️ Commonly missed.** **No multi-year view.** **EUR amount without breakdown** (red flag). **Budget approved without underlying measures plan** — uninformed sign-off (Lesson 1.5).

**🎯 Phase 1 closes here. The company now has: registered, classified entity; trained management with liability acknowledged; risk methodology, asset inventory, risk register, CEO-signed IS policy; IR plan + BSI reporting configured; access policy + MFA enforced; budget signed. Minimum legally defensible posture.**

---

## 11. Phase 2A — Immediate parallel unlocks (17 steps, ~7 PT, months 6–12)

After Phase 1, Kanban-style "what's unlocked." Each block carries RACI + handoff.

### Cat 4.1 — Business Impact Analysis & Recovery Targets
- **Pred:** 2.3 · **Inputs:** `biaCompletionDate`, `criticalProcessCount`, `rpoTargetHours`, `rtoTargetHours`, `crisisTeamLead`, `bcpActivationCriteria`
- **RACI:** R = COO + Process Owners; A = COO; C = CISO + IT-Lead + CEO (for accept of RTO/RPO); I = management body
- **Handoff:** Process Owners → COO consolidates → CISO validates risk-mapping → CEO endorses RTO/RPO in management review · annual
- **Route:** `/portal/compliance/business-continuity` · **Wiki:** ✓ `nis2-business-continuity` · **Effort:** 0.5 PT
- **⚠️ Missed:** RPO/RTO per-system instead of per-process — auditors want process-level

### Cat 5.1 — Supplier Register & Classification
- **Pred:** 2.2 · **Inputs:** supplier rows (`name, riskLevel, hasAccessToSystems, hasAccessToData, isCritical, hasSecurityClauses, hasIncidentNotificationClause, hasAuditRights, hasSubcontractorFlowDown`); `singlePointOfFailureCount`
- **RACI:** R = Procurement Lead/CPO (per-supplier owner); A = CISO (overall register); C = Legal (contract clauses), Asset Owners (which systems each supplier touches); I = CEO (critical supplier list)
- **Handoff:** Procurement adds row → CISO classifies risk + criticality → Legal reviews contract clauses → CISO signs off operationally → CEO approves critical (ABC class A) suppliers · annual
- **Route:** `/portal/suppliers` · **Wiki:** ✓ `nis2-lieferkette` · **Effort:** 1 PT
- **⚠️ Missed:** **Vendor list with no owner column per row** (Section 7.6 #4 — auditors fail this); sub-processor chains truncated at first hop

### Cat 6.1 — Secure Procurement
- **Pred:** 2.3 · **Inputs:** `company_policy_config` type `procurement`
- **RACI:** R = Procurement Lead; A = CISO; C = Legal + Finance; I = management body
- **Handoff:** Procurement drafts → CISO reviews security requirements clauses → Legal validates contractual → CISO approves
- **Route:** `/portal/compliance/procurement` · **Wiki:** ✗ (gap) · **Effort:** 0.5 PT
- **⚠️ Missed:** Confused with 5.x supplier management (6.1 = buying process; 5.x = ongoing management)

### Cat 6.3 — Vulnerability Management
- **Pred:** 2.2 · **Inputs:** `vulnerabilityScanningFrequency`, `vulnerabilityScanTool`, `lastPentestDate`, `vulnerabilityDisclosureUrl`; N × `vulnerability` rows
- **RACI:** R = Cybersecurity Implementer / IT-Lead (operates scanner); A = CISO; C = External pentester (annual); I = management body via KPIs
- **Handoff:** IT-Lead runs scans → Cybersecurity Implementer triages → CISO reviews CVE prioritisation → owner per vuln resolves → CISO verifies closure
- **Route:** `/portal/vulnerabilities` · **Wiki:** ✓ `nis2-schwachstellenmanagement` · **Effort:** 0.5 PT setup + ongoing
- **⚠️ Missed:** **CVD URL** (CIR 6.10 + NIS2 Art. 12) — security.txt minimum

### Cat 6.4 — Patch Management
- **Pred:** 2.2 · **Inputs:** N × `patchRecord` per asset (`patchIdentifier, severity, appliedAt, exceptionApprovedBy`)
- **RACI:** R = Asset Owner (applies patch); IT-Lead (orchestrates); A = CISO (overall SLA compliance); C = Cybersecurity Implementer; I = management body via KPIs
- **Handoff:** Asset Owner applies → IT-Lead validates → CISO confirms SLA compliance · ongoing; exceptions: A = CISO sign-off via `exceptionApprovedBy`
- **Route:** `/portal/patches` · **Wiki:** ✗ (gap — patch SLA matrix article) · **Effort:** ongoing
- **⚠️ Missed:** **No SLA per severity** — CIR 6.6 expects priority-based (critical <7d, high <30d)

### Cat 7.1 — Security KPIs & Metrics
- **Pred:** 2.3 · **Inputs:** `kpisDefinedCount`, `kpiDashboardTool`, `trendAnalysisTool`; monthly `kpiMeasurement` rows
- **RACI:** R = CISO defines KPIs; Cybersecurity Implementer captures monthly; A = CISO; C = management body (KPI selection alignment with risk register); I = whole management body via dashboard
- **Handoff:** CISO defines (board-approved KPI set) → Implementer captures monthly → CISO trends → management body sees in 7.3 review · monthly
- **Route:** `/portal/kpis` · **Wiki:** ✓ `nis2-wirksamkeitsbewertung` · **Effort:** 0.5 PT setup + 1–2h/month
- **⚠️ Missed:** KPIs defined but not trended (single data points)

### Cat 7.2 — Internal Audit
- **Pred:** 2.3 · **Inputs:** `auditFrequency`, `lastAuditDate`; `internalAudit` + `auditFinding` rows
- **RACI:** R = **Cybersecurity Auditor (ECSF)** — internal or external; A = CISO; C = Audited control owners; I = management body (findings)
- **Handoff:** Auditor scopes → audits → reports findings → CISO assigns owners + due dates → improvement items track closure → CISO confirms closure
- **Route:** `/portal/internal-audits` · **Wiki:** ✓ `wie-bsi-audit-vorbereiten` · **Effort:** 1 PT setup + 1 PT/year ongoing
- **⚠️ Missed:** **Auditor independence** — same person can't audit what they manage; SMEs rotate or use external

### Cat 7.3 — Management Review
- **Pred:** 1.1 · **Inputs:** `lastManagementReview`, `managementReviewReportUploaded`; `managementReview` row (`reviewDate, attendees, topicsCovered, decisions, minutesFileKey`)
- **RACI:** R = CISO prepares dossier; A = **Each GF member personally** (`requiredSignOffRole: "ceo"` — ALL must sign minutes); C = DPO, Legal, COO; I = whole organisation
- **Handoff:** CISO compiles inputs from 7.1 (KPIs) + 7.2 (audit) + incidents + supplier changes → presents to GL → GL discusses + makes decisions → minutes signed by all GF members
- **Route:** `/portal/management-reviews` · **Wiki:** ◆ partial in `wie-bsi-audit-vorbereiten` · **Effort:** 1 PT incl. prep
- **⚠️ Missed:** Topic-list completeness (CIR 7.3 lists required topics — skipping any = finding); "CEO attended but did not sign" — `sign_off_history` must record per-GF signature

### Cat 8.1 — IT Security Policy & Acceptable Use
- **Pred:** 1.2 · **Inputs:** `itSecurityPolicyPublished`; `policy` row + N × `policy_acknowledgment` per employee
- **RACI:** R = CISO drafts; A = CISO operational + CEO statutory (under 2.4 umbrella); C = HR (employment-contract integration), Legal; I = all employees
- **Handoff:** CISO drafts → HR reviews employment integration → CISO approves → distributed to all employees → each employee signs `policy_acknowledgment`
- **Route:** `/portal/policies` · **Wiki:** ✓ `nis2-documents` · **Effort:** 0.5 PT
- **⚠️ Missed:** AUP and IS Policy merged with no distinction; auditor wants both contents present

### Cat 8.3 — Role-Specific & Management Training
- **Pred:** 1.1 · **Inputs:** `roleSpecificTrainingProvider`; `training_record` per role-specific completion
- **RACI:** R = HR + CISO orchestrate; per-user A = each user personally (training is personal); C = role owners (admin, dev, finance); I = management body via 7.1 KPI
- **Handoff:** HR identifies role-targeted needs (admins, devs, finance, HR) → CISO selects content → users complete → completion captured per user → CISO reports rate via 8.4
- **Route:** `/portal/training` · **Wiki:** ✓ `geschaeftsleitungs-schulung-nis2` · **Effort:** 1 PT rollout + recurring
- **⚠️ Missed:** "Role-specific" reduced to "general for all" (CIR 8.3 wants targeted content)

### Cat 9.1 — Cryptography Policy & Standards
- **Pred:** 2.3 · **Inputs:** `company_policy_config` type `cryptography`
- **RACI:** R = CISO + CTO; A = CISO (under 2.4 IS Policy umbrella); C = Legal (export controls); I = management body
- **Handoff:** CTO drafts per BSI TR-02102 → CISO reviews policy alignment → CISO approves → IT-Lead implements per 9.2
- **Route:** `/portal/compliance/cryptography` + `/portal/policies` · **Wiki:** ✓ `kryptographie-nis2` · **Effort:** 0.5 PT
- **⚠️ Missed:** Outdated BSI TR-02102 reference (ships quantum-resistant additions)

### Cat 10.2 — Per-Asset Access Assignment
- **Pred:** 10.1 · **Inputs:** per-asset access fields (`owner, access method, privileged accounts`)
- **RACI:** R = **Asset Owner** + IT-Lead; A = CISO; C = HR (JML), DPO (data scope); I = each user
- **Handoff:** Asset Owner proposes access matrix → IT-Lead configures → CISO reviews privileged accounts → quarterly access review (10.4) verifies
- **Route:** `/portal/assets` (per-asset access view) · **Wiki:** ◆ `nis2-zugriffskontrolle` · **Effort:** 0.5 PT
- **⚠️ Missed:** **Shared service accounts** (CIR 11.3 disallows); admin pool accounts common pattern

### Cat 10.3 — User Lifecycle (JML) & PAM
- **Pred:** 10.1 · **Inputs:** `jmlTool`, `backgroundCheckScope`, `pamTool`, `newEmployeeOnboarding`
- **RACI:** R = **HR-Lead** + IT-Lead; A = HR-Lead operational + CISO compliance; C = Legal (background check legality, GDPR data minimisation); I = management body
- **Handoff:** HR initiates joiner/mover/leaver event → IT-Lead provisions/de-provisions → CISO verifies revocation → quarterly access review confirms
- **Route:** `/portal/team` + `/portal/policies` · **Wiki:** ✗ (gap) · **Effort:** 0.5 PT
- **⚠️ Missed:** **Background checks scope vague** (`backgroundCheckScope` field forces written answer); offboarding revoke incomplete (cloud SaaS, GitHub, password mgr)

### Cat 11.2 — Secure & Emergency Communications
- **Pred:** 10.1 · **Inputs:** `secureCommsTools`, `emergencyCommsChannel`, `lastEmergencyCommsTest`
- **RACI:** R = CISO selects tools; IT-Lead deploys; A = CISO; C = Legal (E2EE legal); I = IRT members + management body
- **Handoff:** CISO selects tools → IT-Lead deploys → IRT trained on OOB channel → quarterly drill validates → `lastEmergencyCommsTest` updated
- **Route:** `/portal/compliance/authentication` + `/portal/policies` · **Wiki:** ✗ (gap) · **Effort:** 0.5 PT
- **⚠️ Missed:** **Test never run** — empty `lastEmergencyCommsTest` common audit finding

### Cat 11.3 — Authentication Standards
- **Pred:** 10.1 · **Inputs:** `ssoTool`, `passwordMinLength`, `sessionTimeoutMinutes`
- **RACI:** R = IT-Lead/CTO; A = CISO; C = HR (password policy in employee handbook); I = whole organisation
- **Handoff:** CTO configures IdP per policy → CISO validates BSI TR-03107 alignment → CTO publishes → users informed via 8.1
- **Route:** `/portal/compliance/authentication` + `/portal/policies` · **Wiki:** ✗ (gap — BSI TR-03107 summary) · **Effort:** 0.5 PT
- **⚠️ Missed:** Triennial review skipped (`every-3-years` floor); BSI TR-03107 updates trigger immediate refresh

### Cat 3.2 — Detection, Classification & Logging
- **Pred:** 3.1 · **Inputs:** `classificationScheme`, `detectionTools`, `significantIncidentCriteria`; ongoing `incident` rows
- **RACI:** R = Cybersecurity Implementer (operates SIEM); CISO (defines criteria); A = CISO; C = Asset Owners (per-system log relevance), Legal (log retention legality / GDPR); I = management body via KPI
- **Handoff:** CISO defines classification criteria + retention → IT-Lead configures SIEM/EDR/NDR → Implementer monitors → CISO reviews monthly
- **Route:** `/portal/incidents` · **Wiki:** ✓ `nis2-logging-protokollierung` · **Effort:** 0.5 PT setup
- **⚠️ Missed:** **Logging retention <90d breaks forensics**; **central log management unowned** = Section 7.6 #7 (most-flagged technical control)

### Cat 3.5 — Post-Incident Review & Lessons Learned
- **Pred:** 3.1 · **Inputs:** `postIncidentReviewOwner`; `improvementItem` rows sourced from incidents
- **RACI:** R = `postIncidentReviewOwner` (typically CISO); A = CISO; C = IRT members, Cyber Legal/Compliance Officer; I = management body
- **Handoff:** Incident closed → review meeting → root cause + lessons → improvement items created → owners assigned + due dates → CISO tracks closure
- **Route:** `/portal/improvements` · **Wiki:** ◆ partial in `nis2-vorfallbehandlung` · **Effort:** ~30 min per significant incident
- **⚠️ Missed:** **§35 BSIG bundled here incorrectly** — see Section 16.2 split recommendation (3.5a lessons + 3.5b customer notification)

---

## 12. Phase 2B — Downstream depth (12 steps, ~5 PT, months 12–18) — compact RACI

### Cat 4.2 — BCP + Crisis Mgmt Plan
- **Pred:** 4.1 · **RACI:** R = COO drafts; A = CEO sign-off recommended (crisis-mgmt strategic decisions); C = CISO + Legal + Comms Lead; I = whole organisation
- **Handoff:** COO drafts → CISO reviews IT-side resilience → Legal/Comms reviews stakeholder templates → CEO endorses crisis-decision authority delegation
- **Wiki:** ✓ · **⚠️ Missed:** Crisis comms templates absent

### Cat 4.3 — Disaster Recovery Plan
- **Pred:** 4.1 · **RACI:** R = Asset Owners + IT-Lead per system; A = CTO; C = COO; I = CISO
- **Handoff:** Asset Owner drafts runbook per asset → IT-Lead validates → CTO approves → CISO archives
- **Wiki:** ◆ · **⚠️ Missed:** Never tested cold (→ 4.5)

### Cat 4.4 — Backup & Restore
- **Pred:** 4.1 · **RACI:** R = IT-Lead + Asset Owners; A = CTO; C = CISO (RPO compliance); I = COO
- **Handoff:** Asset Owner configures per-asset backup → IT-Lead aggregates → CTO confirms; quarterly restore test
- **Wiki:** ✓ · **⚠️ Missed:** 3-2-1 rule not verified; immutable backup absent

### Cat 5.2 — Supplier Security in Contracts
- **Pred:** 5.1 · **RACI:** R = Procurement + Legal; A = CISO (compliance) + CEO (critical suppliers); C = DPO (Art. 28 DPA overlap); I = Asset Owners
- **Handoff:** Procurement drafts → Legal reviews clauses → CISO verifies security alignment → CEO signs for ABC class A suppliers
- **Wiki:** ✓ · **⚠️ Missed:** Art. 23 downstream cascade clause absent

### Cat 5.3 — Supplier Assessment & Monitoring
- **Pred:** 5.1 · **RACI:** R = Procurement + CISO; A = CISO; C = Asset Owners; I = management body for critical suppliers
- **Handoff:** Procurement initiates assessment → CISO reviews response → risk treatment per supplier → annual re-assessment
- **Wiki:** ✓ · **⚠️ Missed:** One-shot only, no ongoing monitoring

### Cat 5.4 — Supplier Incident Notification
- **Pred:** 5.1 · **RACI:** R = CISO (defines SLA); Procurement (enforces in contracts); A = CISO; C = Cyber Legal/Compliance Officer; I = customers if cascade
- **Handoff:** Supplier reports → CISO triages relevance → if cascade impact: notify our customers via `incidentBroadcast`
- **Wiki:** ✓ · **⚠️ Missed:** **Outbound cascade to customers entirely missed** — Section 16.2 §35/3.5b finding

### Cat 6.2 — Secure Development & Configuration
- **Pred:** 6.1 · **RACI:** R = CTO + Dev Lead; A = CTO; C = CISO (security baselines); I = management body
- **Handoff:** Dev Lead drafts SDLC → CTO approves dev side → CISO ensures baselines for non-dev IT/OT systems
- **Wiki:** ✓ · **⚠️ Missed:** Only applies if in-house dev (secure CONFIGURATION applies to everyone)

### Cat 6.5 — Change Management
- **Pred:** 6.1 · **RACI:** R = Change Requester (any role); A = Change Approver = IT-Lead for routine, CISO for security-impacting; C = Asset Owner; I = stakeholders
- **Handoff:** Requester submits → IT-Lead triages → if security impact: CISO reviews → change approved → CAB minute → implemented
- **Wiki:** ✗ (gap) · **⚠️ Missed:** `securityImpactAssessment` blank; CAB exists but security review absent

### Cat 8.2 — Security Awareness Program
- **Pred:** 8.1 · **RACI:** R = HR + CISO; A = CISO; C = managers (cascade to teams); I = whole organisation
- **Handoff:** HR + CISO select platform → enrol all → quarterly campaigns → CISO reports rate
- **Wiki:** ✓ · **⚠️ Missed:** Completion not tied to access (non-completers retain access)

### Cat 9.2 — Data Encryption
- **Pred:** 9.1 · **RACI:** R = IT-Lead + Asset Owners; A = CTO; C = CISO (compliance with policy); I = DPO (personal data)
- **Handoff:** Asset Owner declares per-asset encryption status → IT-Lead verifies → CTO sign-off → CISO confirms compliance
- **Wiki:** ✓ · **⚠️ Missed:** TLS version too low on legacy; HSTS not enforced

### Cat 9.3 — Key & Certificate Management
- **Pred:** 9.1 · **RACI:** R = IT-Lead; A = CTO; C = CISO; I = DevOps
- **Handoff:** IT-Lead configures HSM/KMS → CTO approves → CISO verifies rotation policy → ongoing monitoring
- **Wiki:** ✓ · **⚠️ Missed:** Key rotation absent

### Cat 7.4 — Corrective Actions & Continuous Improvement
- **Pred:** 7.1 · **RACI:** R = CISO orchestrates; per-item R = item Owner; A = CISO; C = audit findings/KPI breaches as sources; I = management body
- **Handoff:** Item created (audit, incident, KPI) → CISO assigns Owner + due date → Owner closes → CISO verifies
- **Wiki:** ✓ · **⚠️ Missed:** Open count grows monotonically — closure throughput is the metric

---

## 13. Phase 2C — Recurring kick-off (4 steps)

### Cat 4.5 — BCP/DR Testing
- **Pred:** 4.2 · **RACI:** R = COO orchestrates; CISO + IT-Lead operate; A = COO; C = Asset Owners; I = management body
- **Handoff:** COO scopes scenario → CISO runs tabletop → IT-Lead exercises systems → lessons captured → improvement items → CISO follows up
- **Recurrence:** annual escalating (tabletop → functional → full-scale)
- **Wiki:** ◆ via `nis2-business-continuity` · **Effort:** 0.5 PT/year
- **⚠️ Missed:** Tabletop only; never escalates to functional

### Cat 8.4 — Phishing Simulations & Training Effectiveness
- **Pred:** 8.2 · **RACI:** R = HR + CISO operate platform; A = CISO; C = managers (cascade re-training); I = management body via KPI
- **Handoff:** CISO designs campaign → HR launches → click rate measured → repeat clickers re-trained → CISO trends in 7.1
- **Recurrence:** quarterly · **Effort:** 1h/quarter
- **Wiki:** ✓ · **⚠️ Missed:** Click rate not vs industry baseline; no targeted re-training

### Cat 10.4 — Access Reviews
- **Pred:** 10.1 · **RACI:** R = managers (per-team review); A = CISO; C = HR; I = each user reviewed
- **Handoff:** CISO triggers quarterly review → managers review their team's access → discrepancies flagged → IT-Lead remediates → CISO archives evidence
- **Recurrence:** quarterly · **Effort:** 2h/quarter
- **Wiki:** ✗ (gap — quarterly review playbook) · **⚠️ Missed:** Privileged accounts at lower frequency than admin

### Cat 12.3 — Registration Maintenance
- **Pred:** 12.2 · **RACI:** R = Compliance Lead; A = CEO (re-signs); C = CISO (contact accuracy); I = management body
- **Handoff:** Compliance Lead reviews registered data → confirms all current → CEO re-signs annually → submit updates to BSI portal as needed
- **Recurrence:** annual + on-change (name, address, contact, sector)
- **Wiki:** ✓ · **⚠️ Missed:** Data drifts (CISO leaves, email outdated); §33(3) requires updates without delay

---

## 14. Phase 3 — Ongoing rhythm (4–8 h/month) with RACI

Each cadence's RACI summary:

### Monthly (~1–2 h)
- **7.1 KPIs** — R = Cybersecurity Implementer captures; A = CISO; trends in 7.1 dashboard. Triggers `improvementItem` rows.

### Quarterly (~3–6 h spread)
- **8.4 Phishing** — R = HR + CISO; A = CISO; quarterly cycle
- **10.4 Access reviews** — R = managers; A = CISO; quarterly cycle

### Annual (~0.5–2 PT each, spread)
- **1.3 Budget refresh** — R = CISO + CFO; A = CEO
- **2.3 Risk reassessment** — R = Asset Owners + CISO; A = CISO operationally; CEO ratifies acceptance changes
- **3.4 IR drill** — R = CISO + IRT; A = CISO
- **4.5 BCP test** — R = COO; A = COO
- **5.1 / 5.3 Supplier register + assessment** — R = Procurement + CISO; A = CISO; CEO for critical suppliers
- **6.1 / 6.2 / 6.5 Policy refresh** — R = CTO/CISO; A = CISO
- **7.2 Internal audit** — R = Cybersecurity Auditor; A = CISO
- **7.3 Management review** — R = CISO compiles; A = each GF personally
- **8.1 / 8.3 Policy + training refresh** — R = HR + CISO; A = CISO
- **9.1 / 9.2 / 9.3 Crypto** — R = CTO; A = CISO
- **10.1 / 11.1 Access + MFA refresh** — R = IT-Lead; A = CISO
- **12.3 Registration maintenance** — R = Compliance Lead; A = CEO

### Every-3-years
- **1.1 CEO training refresh** — R = each GF personally (non-delegable); A = each GF; HR tracks
- **11.3 Authentication standards review** — R = CTO; A = CISO; check BSI TR-03107 updates

### On-change triggers
- **1.2 Roles** — R = CISO drafts changes; A = CEO approves
- **3.3 BSI Reporting** — R = Cybersecurity Implementer/CISO; A = CISO operationally + management body for significant
- **3.5 Lessons learned** — R = CISO; A = CISO
- **5.2 Contract changes** — R = Procurement + Legal; A = CISO operational + CEO for critical
- **10.2 / 10.3 Access changes** — R = HR-Lead + IT-Lead; A = CISO
- **2.3 Risk reassessment after incident** — R = Asset Owner + CISO; A = CISO operationally + GL Akzeptanzschwelle re-confirmation if exceeded

---

## 15. Data-flow cross-reference map (unchanged from v3 — see Section 15 there)

For each requirement, which earlier step's data it consumes. Every requirement's RACI in this v4 is consistent with the data flow — no role drives data they don't have access to.

---

## 16. External-source check (expanded)

### 16.1 Confirmed
Same as v3 — 4-phase shape consistent with practitioner consensus; proportionality CIR-anchored; §38 trio non-delegable; GDPR satisfaction-pair carryover is real.

**New v4 confirmations:**
- **"CISO is required" is a misstatement** — CIR Annex 1.2.2 requires "at least one person directly accountable to leadership." Title is convention. Survives `CISO → ISB → §30(1) accountable person`.
- **Multi-stage handoff (Asset Owner → CISO → CEO)** is the canonical pattern — confirmed by cybervize RACI guide + activeMind + ENISA TIG Scenario 2.
- **5 documented sign-offs for D&O defence** — confirmed by Pöppel + Behrschmidt + BGH IV ZR 66/25 (Nov 2025) narrowed-knowledge-exclusion ruling.
- **DPO is Consulted, never Accountable** on §32 — confirmed by BDO + ComputerWeekly.

### 16.2 The §35 / Cat 3.5 mismatch (preserved from v3)

Cat 3.5 currently bundles §35 BSIG customer notification + CIR 3.6 lessons learned. Split recommended.

### 16.3 New v4 contradictions / nuances

| Claim | Correction |
|---|---|
| "Owner column on supplier list is optional" | **No** — auditors fail vendor lists missing per-row owner. Web research consensus (securitytoday, becon). v4 spec adds Asset Owner / Supplier Owner as named role with per-row R. |
| "Cyber Legal/Compliance Officer is just Legal" | **No** — ENISA ECSF profile has specific incident-notification scope (drafting §32 and Art. 33 GDPR notifications). For SMEs, fold into Compliance Lead with explicit scope. |
| "DPO can be CISO in a small company" | **Dual-hat with role-boundary memo, otherwise BSI flags conflict.** Web research (becon, BSI). |

### 16.4 Possibly missed (new v4)
- **Akzeptanzschwelle as separate GL-signed artefact** — should not be buried in risk register; surface as its own evidence row (secjur). Recommend: add field on `company_risk_methodology` for `acceptanceThresholdSignedBy + signedAt`.
- **CISO oversight reports quarterly to board** — required for §38(1) "Überwachung" defence; should be a structured artefact (extend `management_review` to quarterly cadence option, not just annual).
- **Functional mailbox for §33 contact** — should be enforced in UX: warn if `contactPersonEmail` looks personal.

### 16.5 Sources (v4 additions)
- ENISA TIG ECSF mapping (June 2025): https://www.enisa.europa.eu/sites/default/files/2025-06/Mapping%20NIS%202%20obligations%20with%20ECSF%20role%20profiles.pdf
- CIR 2024/2690 Annex 1.2: https://nis2-umsetzung.com/nis2umsvoannex/1-2-rollen-verantwortlichkeiten-und-weisungsbefugnisse/
- BSI Lerneinheit 2.4 (ISB role): https://www.bsi.bund.de/.../Lektion_2_04_node.html
- BSI Lerneinheit 2.6 (IS-Management-Team): https://www.bsi.bund.de/.../Lektion_2_06_node.html
- BSI 200-2 PDF: https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Grundschutz/BSI_Standards/standard_200_2.pdf
- §38 personal liability — secjur, cortina, solidaris, Pöppel, Behrschmidt
- BGH IV ZR 66/25 (D&O knowledge-exclusion narrowing)
- cybervize NIS2 Ownership RACI: https://www.cybervize.de/de/blog/nis2-ownership-verantwortung-keine-frage-des-organigramms
- Vendor list audit findings — SecurityToday: https://www.securitytoday.de/2026/05/08/nis2-audit-lieferketten-vendor-liste-evidenz-2026/
- First BSI audit findings — SecurityToday: https://www.securitytoday.de/2026/03/14/nis2-audit-vorbereitung-bsi-pruefung-checkliste-reboot-2026/
- DPO/NIS2 interface — BDO: https://www.bdo.de/de-de/insights/aktuelles/assurance/datenschutz-nis2-was-unternehmen-jetzt-fuer-sicherheit-und-compliance-tun-muessen

---

## 17. Master RACI matrix — all 49 requirements

R = Responsible (does the work) · A = Accountable (signs off, one only) · C = Consulted · I = Informed
Roles: **CEO** = each GF member · **CISO** = §30(1) accountable person · **CTO**/IT-Lead · **COO** · **CPO**/Procurement · **HR** · **DPO** · **Leg** = Compliance/Legal · **AO** = Asset Owner · **Emp** = Employees · **Aud** = Internal Auditor

| Code | Title | CEO | CISO | CTO | COO | CPO | HR | DPO | Leg | AO | Emp | Aud |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 12.1 | Classification & Scope | **A** | C | | | | | | R | | | I |
| 12.2 | BSI Registration | **A** | C | | | | | | R | | | I |
| 12.3 | Reg Maintenance | **A** | C | | | | | | R | | | I |
| 12.4 | Compliance Evidence | I | A | | | | | C | R | C | | C |
| 1.1 | Mgmt Training | **A R** | C | | | | C | | | | | I |
| 1.2 | Roles & Resp | **A** | R | | | | C | | C | | I | I |
| 1.3 | Budget | **A** | R | | | | | | C | | | I |
| 1.4 | Liability Ack | **A R** | | | | | | | C | | | I |
| 2.1 | Risk Methodology | **A** | R | | | | | | | | | C |
| 2.2 | Asset Inventory | I | A | C | C | | C | C | | **R** | | C |
| 2.3 | Risk Register | I | A | C | | C | | C | C | **R** | | C |
| 2.4 | Risk Accept + IS Pol | **A** | R | | | | | C | C | | I | I |
| 3.1 | IR Plan | I | A R | C | | | | C | C | | | C |
| 3.2 | Detection/Logging | I | A | C | | | | C | | C | | C |
| 3.3 | BSI Reporting | I | **A** R | | | | | C | R | | | I |
| 3.4 | IR Drill | I | A R | C | | | | | | | C | C |
| 3.5 | Post-Incident Review | I | A R | C | | | | C | C | | | C |
| 4.1 | BIA | I | C | C | **A R** | | | | | C | | C |
| 4.2 | BCP + Crisis | **A** | C | C | R | | | | C | | | C |
| 4.3 | DR Plan | I | C | A | C | | | | | R | | C |
| 4.4 | Backup & Restore | I | C | A | C | | | | | R | | C |
| 4.5 | BCP/DR Test | I | C | C | **A R** | | | | | C | | C |
| 5.1 | Supplier Register | I | A | | | R | | C | C | C | | C |
| 5.2 | Contracts | **A**\* | C | | | R | | C | R | C | | C |
| 5.3 | Supplier Assessment | I | A | | | R | | C | | C | | C |
| 5.4 | Supplier Incident | I | A R | | | C | | | C | | | I |
| 6.1 | Secure Procurement | I | A | C | | R | | | C | | | C |
| 6.2 | Secure Dev | I | C | A R | | | | | | C | | C |
| 6.3 | Vuln Mgmt | I | A | R | | | | | | C | | C |
| 6.4 | Patch Mgmt | I | A | R | | | | | | **R** | | C |
| 6.5 | Change Mgmt | I | C | A R | | | | | | C | | C |
| 7.1 | KPIs | I | **A R** | | | | | | | | | C |
| 7.2 | Internal Audit | I | A | | | | | | | | | **R** |
| 7.3 | Mgmt Review | **A** | R | | | | | C | C | | | I |
| 7.4 | Corrective Actions | I | A R | | | | | | | C | | C |
| 8.1 | IT Policy + AUP | I | A R | | | | C | | C | | I | C |
| 8.2 | Awareness | I | A | | | | R | | | | I | I |
| 8.3 | Role Training | I | A | | | | R | | | | I | I |
| 8.4 | Phishing Sim | I | A | | | | R | | | | I | I |
| 9.1 | Crypto Policy | I | A | R | | | | | C | | | C |
| 9.2 | Encryption | I | C | A | | | | C | | R | | C |
| 9.3 | Key & Cert Mgmt | I | C | A | | | | | | R | | C |
| 10.1 | AC Policy | I | A R | C | | | C | C | C | | | C |
| 10.2 | Per-Asset Access | I | A | C | | | C | C | | **R** | | C |
| 10.3 | User Lifecycle | I | A | C | | | **R** | | C | | I | C |
| 10.4 | Access Reviews | I | A | | | | C | | | C | | **R** |
| 11.1 | MFA | I | A | R | | | C | | | | I | C |
| 11.2 | Secure Comms | I | A | R | | | | | C | | I | C |
| 11.3 | Auth Standards | I | A | R | | | C | | | | I | C |

\* Critical suppliers (ABC class A); routine = CISO accountable

**Validation: every requirement has exactly one A. No double accountability.**

---

## 18. Gap report — updated for v4

### 18.1 Coverage gaps (unchanged from v3)
Cat 6 sub-controls, Cat 10 personnel specifics, Cat 12 asset handling, Cat 13 physical (deferred).

### 18.2 §35 / Cat 3.5 split (preserved from v3 Section 16.2)
Split 3.5 → 3.5a Lessons Learned + 3.5b Customer Notification (§35 BSIG).

### 18.3 RACI / role schema gaps (new v4)
- **`user.functionalRoles[]` field needed** (Section 7.5) — current `role: admin/member/viewer` insufficient
- **`requirement_assignment.raciRole` enum** — to enforce R/A/C/I per assignment
- **Per-asset `owner` field non-optional** — auditor finding (Section 7.6 #4)
- **Akzeptanzschwelle as separate signed artefact** — extend `company_risk_methodology` (Section 16.4)
- **Quarterly CISO oversight reports** — extend `management_review` to quarterly cadence option (Section 16.4)
- **Functional mailbox heuristic** — warn if `contactPersonEmail` looks personal (Section 16.4)
- **D&O defence pack export** — assemble 5 sign-offs into single PDF on demand (Section 7.3)

### 18.4 Wiki gaps (unchanged from v3 + 1 new)
10 articles to write (1.2, 1.3, 1.4, 3.4, 6.1, 6.4, 6.5, 10.4, 11.2, 11.3) + 3.5b customer notification + a new **"RACI for the 10 NIS2 measures"** wiki article (Step 5 / Cat 1.2 — high priority).

### 18.5 Portal route gap (unchanged)
Only `/portal/journey` missing.

### 18.6 v4.1 validation findings (full report at `docs/journey-validation-report.md`)

Multi-persona red-team validated every step against CISO + NIS2 Auditor + CIR Implementor + 50-person SME + 250-person mid-Mittelstand perspectives. Surfaced 20 actions across 6 severity tiers. Highlights below; full list in Section 19 (build order).

**T-1 (push now — already reflected in Section 4 priority changes above):**
- 6 priority misclassifications (1.1, 1.2, 1.4, 2.3 → P0; 3.4 → P1; 12.4 → KRITIS-conditional)
- `requiredSignOffRole = "ceo"` extension to 1.2, 2.1, 4.2, 5.2 (critical only)

**T-2 (push now — schema/UX):**
- `asset.owner NOT NULL` migration (auditor flag — "vendor/asset list with no owner column" is #4 RACI failure)
- `companyRequirementStatus.skipReason text + skipReasonSignedBy` for CIR Art. 2(2) "comply or explain"
- Akzeptanzschwelle as separate signed artefact (`company_risk_methodology.acceptanceThresholdSignedBy + signedAt`)
- `applicableSectors text[]` referencing NIS2 Annex codes (was single string)
- CIR sub-checklists matching `cir11Checklist` pattern: `cir31Checklist` (3.1 IR plan content), `cir41Checklist` (4.x BCM elements), `cir111Checklist` (10.1 access policy elements)
- Conditional 12.4 surfacing when `entityClassification = kritis`

**T-3 (push next — moderate effort):**
- Sign-off integrity (`sign_off_history.checksum + previousChecksum` hash chain)
- Workshop-split UX for 250-person scale (Cat 2.2 + 2.3 per-dept / per-site)
- Multi-site BIA + BCM (`company.sites text[]` or `site` table)
- D&O defence pack export route
- DPO+ISB / CTO+CISO dual-hat boundary-memo enforcement
- DSGVO Art. 33 parallel timer for personal-data incidents
- External-auditor branch on Cat 7.2 (50-person SME reality)
- Sub-processor chain schema on supplier
- OT/ICS Phase 1 escalation when any `asset.isOT = true`

**T-4 (deferred):**
- Cat 6 sub-items fold-out (6.5 config + 6.7 network + 6.8 segmentation + 6.9 anti-malware → adds 4 reqs, 49 → 53)
- Group-structure applicability (multi-entity)
- Cross-framework ISO 27001 surfacing in journey (data exists — 73 satisfaction pairs in REFERENCE.md)
- Tools wiki (per-category recommended German-market tools)
- Per-asset `cryptoIntegrityMechanisms` field for HMAC/signature coverage

**Persona signal — concentrated views:**
- **CISO:** wants per-step technical tooling, workshop scaling, clear "first 90 days" milestone — substantially served by v4.1 RACI + handoffs ✓
- **NIS2 Auditor:** 8 of 10 audit-fail patterns are addressed in v4.1 (sign-off integrity, per-row owners, Akzeptanzschwelle, separation of duties, German artefacts, evidence retention, dated personal signature, DPO+ISB memo). Outstanding: workshop-split + multi-site.
- **CIR Implementor:** all CIR Annex points mapped at 1:1 except the 4 folded sub-items in Cat 6 (Section 16.1). Proportionality justification now captured via `skipReason`.
- **50-person SME:** main pain points (external auditor for 7.2, "skip with reason" for 6.2 if no in-house dev, single-site BCM) all surfaced as T-2 actions.
- **250-person mid-Mittelstand:** workshop scaling (Cat 2.2 + 2.3 per-department), multi-site BCM, sub-processor depth, OT escalation surfaced as T-3 actions. Schema gap on multi-site is the biggest single item.

---

## 19. Build order — re-prioritised for v4.1

Tiered by validation-report severity. T-1 items unblock priority-correctness; T-2 items address auditor-fail patterns; T-3 items address scale + cross-cutting; T-4 is deferred.

### T-1 — Priority + sign-off corrections (push now, ~1.5 dev days)
1. **Framework data: 6 priority changes + 4 requiredSignOffRole extensions** (Section 4 / 18.6). Update `packages/grc-data-model/src/frameworks/nis2.ts`, regenerate `REFERENCE.md`, re-seed dev DB. **0.5 dev day.**
2. **Schema: `requiredSignOffRole` allows multiple roles + `conditionalOn` field** for 5.2 (critical-only). **0.5 dev day.**
3. **Schema: priority audit log** — any priority change retroactively requires re-evaluation of completed requirements (re-derive status). **0.5 dev day.**

### T-2 — Auditor-fail patterns (push now, ~6 dev days)
4. **`user.functionalRoles[]` + `requirement_assignment.raciRole enum`** — enable RACI enforcement (preserved from v4). **1 dev day.**
5. **`asset.owner NOT NULL`** + migration backfill. **0.5 dev day.**
6. **`companyRequirementStatus.skipReason + skipReasonSignedBy + signedAt`** for proportionality. **0.5 dev day.**
7. **Akzeptanzschwelle separate signed artefact** on `company_risk_methodology`. **0.5 dev day.**
8. **`applicableSectors text[]`** referencing NIS2 Annex codes. **0.5 dev day.**
9. **CIR sub-checklists**: `cir31Checklist`, `cir41Checklist`, `cir111Checklist` + UX enforcement of all four `cir*Checklist` fields before sign-off. **1 dev day.**
10. **Conditional 12.4 KRITIS surfacing**. **0.5 dev day.**
11. **Sign-off integrity** — `sign_off_history.checksum + previousChecksum` hash chain. **1 dev day.**
12. **Split Cat 3.5 → 3.5a + 3.5b** (Section 16.2). **0.5 dev day.**

### T-3 — Scale + UX + cross-cutting (next sprint, ~7 dev days)
13. **`/portal/journey` orchestrator** with priority badges, phase progress, recurring-this-month, RACI display. **2 dev days.**
14. **Workshop mode** for 2.2, 2.3, 2.4, 4.5, 3.4 + **workshop-split UX** for 250-person scale (per-department / per-site). **2.5 dev days** (was 2, added 0.5 for split).
15. **Multi-site model** — `company.sites text[]` or new `site` table; per-site `criticalProcessCount`, per-site DR. **1.5 dev days.**
16. **D&O defence pack export** (Section 7.3) — `/portal/export/d-and-o-pack` route. **1 dev day.**
17. **DSGVO Art. 33 parallel timer** for personal-data-scope incidents. **0.5 dev day.**
18. **Dual-hat memo enforcement** — DPO+ISB or CTO+CISO on same user.id → require `roleBoundaryMemoUploaded` evidence. **0.5 dev day.**
19. **DSGVO records upload + 2.2 pre-fill** via satisfaction pair. **2 dev days.**
20. **External-auditor branch** for Cat 7.2 (extend `internalAudit` or add `externalAudit` flag). **0.5 dev day.**
21. **Sub-processor chain** on supplier (`subProcessor` table or array). **1 dev day.**
22. **OT/ICS Phase 1 escalation** when any `asset.isOT = true` (surface IEC 62443 mapping resources). **1 dev day.**

### T-4 — Deferred / research-blocked
23. Cat 6 sub-items fold-out (6.5 config, 6.7 network, 6.8 segmentation, 6.9 anti-malware) — adds 4 reqs, framework grows 49 → 53. **1 dev day if approved.**
24. Group-structure applicability (multi-entity). **1 dev day.**
25. Cross-framework ISO 27001 surfacing in journey (73 satisfaction pairs already in REFERENCE.md). **0.5 dev day.**
26. Tools wiki (per-category recommended German-market tools). **3 dev days copy.**
27. **CTI feed integration** for Cat 2.1 (v2). **2 dev days.**
28. **(Defer) Cat 13 PHYS / Cat 14 PER** — until KRITIS / HR-heavy customer asks.

### Build-effort summary
- **T-1: 1.5 dev days** (priority corrections)
- **T-2: 6 dev days** (auditor-fail patterns)
- **T-3: 12.5 dev days** (scale + cross-cutting + journey UX) — biggest tier
- **T-4: 7.5 dev days** if approved

**To ship v4.1 statutory-defensible journey UX: T-1 + T-2 = 7.5 dev days.** (Down from v4's 12 dev days because v4.1 sequencing front-loads what auditors specifically check.)

**Full v4.1 journey including 250-person scale support: T-1 + T-2 + T-3 = 20 dev days.**

---

## 20. Resolved questions (unchanged)

- BSI portal operational since 2026-01-06; deadline 2026-03-06 passed — "do-now-late"
- 47 BSI elementary threats at `lib/compliance/bsi-threats.ts`
- GDPR carryover via `2.2 ↔ G-ROP.1` tier `equivalent`
- Cat 13 / Cat 14: defer
- PT vs hours: hours default, PT tooltip
- ENISA TIG: flat, not phased — our framing is editorial synthesis

---

## 21. Memory snapshot

If approved: canonical sources are `packages/grc-data-model/`, `drizzle/seed.ts:272-342`, `lib/compliance/category-schemas.ts`, `courses/nis2-ceo/content/*.md` (for what the CEO learns), `data/nis2-registration-portals.json` (BSI portal status). v4 key findings:

1. **CISO is convention, not statute.** CIR Annex 1.2.2 = "person directly accountable to leadership." Use `§30(1) accountable person` as the schema-portable label.
2. **§38 trio non-delegable.** Approve / Oversee / Train / Liable / Use-the-controls-personally — confirmed by BSIG + CEO course.
3. **Asset/Supplier Owner per row is required** — auditor consensus.
4. **5 documented sign-offs for D&O defence** — bundle as exportable pack.
5. **Cat 3.5 bundles §35 customer notification with CIR 3.6 lessons** — split before journey hardens.
6. **Cyber Legal/Compliance Officer** is the most-skipped ECSF role — fold into Compliance Lead with explicit scope.
7. **3-stage handoff (Asset Owner → CISO → CEO)** is the canonical pattern for risk-bearing decisions.

---

*v4: per-step RACI + multi-stage handoffs, course-aligned exec questions, validation against BSIG + CIR + BSI 200 series + ENISA TIG + our own CEO course. Master 49-requirement RACI matrix. Schema additions for enforceable role-based sign-off. Two structural findings unchanged from v3 (§35/3.5 split) plus four new (functionalRoles taxonomy, Akzeptanzschwelle artefact, quarterly CISO oversight cadence, D&O defence pack).*
