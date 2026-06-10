# Multi-Persona Validation Report — Proportional NIS2 Implementation Journey v4

> **Method.** Five personas red-team every step in `proportional-implementation-journey.md` v4. For each step: info-completeness check, 5 persona reactions, priority verdict (confirmed / re-prioritise / move phase). For Phase 2+3, validation is grouped per category for compactness. Cross-cutting findings (apply to many steps) are surfaced at the top so they're not repeated 49 times.
>
> **Status badges.**
> - ✅ **Confirmed** — step holds across all personas
> - ⚠️ **Issue** — step has a gap, mis-priority, or unrealistic assumption
> - 🔄 **Re-prioritise** — phase or priority should move
> - 🆕 **Add** — missing requirement or sub-step
>
> **Output.** Findings → Section 9 (Updates to push back into v4 spec). The user can decide which to act on.

---

## 1. The five personas

### 👤 CISO (mid-career, 5–10 years experience, doubles as the §30(1) accountable person)
- **Wants:** clear technical steps with concrete tool examples, ability to delegate, owners per row, "done" criteria that match audit reality.
- **Bias:** loves checklists; suspicious of vague legal language; values workshop time more than slack channels.
- **Pain points:** vendor proliferation; tooling cost approval; weak board IT literacy; CISO embedded under IT (role conflict).
- **What "good" looks like:** every requirement has an unambiguous Accountable, a workable "first 90 days" milestone, and a way to demonstrate progress to the board monthly.

### 👤 NIS2 Auditor (BSI inspector, IHK/TÜV-style external auditor, or external consultant brought in pre-BSI-audit)
- **Wants:** evidence chain integrity, immutable sign-off history, traceability from each control to §28-§39 BSIG + CIR Annex + Art. 21, German-language artefacts, retention dates, separation of duties.
- **Bias:** treats unsigned things as non-existent; assumes documents not produced in 5 minutes don't exist; cross-checks dates across artefacts; looks for the obvious miss first.
- **Pain points:** auditees treat "approved" as "we agreed in a meeting"; missing per-row owners; central log unowned; vendor list missing classification.
- **What "good" looks like:** every requirement is signed by the role required by law, dates align, no "approved in principle" status, and exporting the evidence pack takes < 60 seconds.

### 👤 CIR Implementor (consultant or in-house compliance lead translating CIR 2024/2690 Annex into implementation tasks)
- **Wants:** strict CIR-Annex traceability, "comply or explain" capture per requirement (Art. 2(2) — proportionality), all 7 CIR 1.1 IS Policy elements covered, CIR-mandatory documents present, CIR 11.1 access elements (J/M/L lifecycle, PAM, separation of duties) covered.
- **Bias:** treats CIR sub-references (e.g. CIR 6.10) as separate requirements; expects each measure to have its own CIR-aligned form/checklist; prefers tier-1 mandatory documents over upload-only proof.
- **Pain points:** CIR sub-items folded into single requirements; proportionality justifications missing; CIR 11.1 access lifecycle bundled inconsistently.
- **What "good" looks like:** every CIR Annex point is mapped to a portal field or wiki article, with proportionality justification captured when deferred.

### 👤 50-person company implementor (Mittelstand SaaS / consultancy / manufacturer, 50 staff, 1–2 sites)
- **Wants:** "what's the smallest legally-defensible posture, what does it cost in PT, who can wear two hats?"
- **Reality:** CEO + 1–2 GF, no dedicated CISO (CTO doubles), no internal auditor (consultant), no dedicated DPO (external lawyer), no COO (CEO runs ops), no CPO (CEO + admin). Maybe 30 IT/SaaS assets, 15–25 suppliers. No OT.
- **Bias:** wants to skip half of Phase 2; will under-classify their entity (important rather than essential) to reduce scope; suspicious of additional roles.
- **Pain points:** can't fund 4–5 hours of GF time per quarter; struggles to find a quarterly access reviewer who isn't IT-Lead; can't justify SIEM/EDR/NDR all at once.
- **What "good" looks like:** Phase 1 doable by 3 people in 6 months; quarterly rhythm under 4 h/month; consultant-led audit acceptable.

### 👤 250-person company implementor (Mittelstand manufacturer / regional service provider, 250 staff, multi-site, often KRITIS-adjacent or actually KRITIS)
- **Wants:** "how does this scale, how do we delegate, what's the formal sign-off chain across multi-site, how do we handle OT?"
- **Reality:** dedicated CISO, full IT team (5–10 people), dedicated DPO, formal procurement, internal audit function or contracted external. Maybe 1000+ assets, 50–100 suppliers, possibly OT environment. Multiple sites + locations.
- **Bias:** treats workshops differently — too long if 250 attendees, but per-department workshops needed; demands per-site BIA; expects formal CAB; SSO/Entra ID assumed.
- **Pain points:** asset workshop with 1000+ rows impossible in 4 hours; risk register with 200+ rows impossible in 2 hours; multi-site BCM requires per-site plans; OT requires IEC 62443 mapping.
- **What "good" looks like:** workshop pattern adapts (per-department / per-site mode), per-asset owners enforced, OT escalation path, multi-site BIA, all P0 in Phase 1 with realistic timelines.

---

## 2. Cross-cutting findings (apply to many steps — not repeated per step)

These would be repeated if I'd tagged each step individually; surfaced once here for efficiency.

### 2.1 ⚠️ **Sign-off integrity is implicit, not enforced.** Spec mentions `sign_off_history` as an audit trail but doesn't specify immutability, hash-chaining, or tamper-evidence. Auditor will ask for it.
- **Action:** add migration: `sign_off_history.checksum` (SHA-256 of snapshot JSON), `previousChecksum` (hash chain), `signedByUserChecksum` (snapshot of signer at sign time). Section 9.1.

### 2.2 ⚠️ **Evidence retention period unspecified.** CIR 1.1 requires "documented information retention" — the company must decide a retention period and stick to it (typically 6 years post-event for German Aufbewahrungsfristen, 3+ years for BSI). Spec captures `validUntil` on `evidence` but no policy field.
- **Action:** add `company.evidenceRetentionMonths` field with default 84 (7 years, conservative). Section 9.2.

### 2.3 ⚠️ **German-language requirement not enforced.** §23(1) VwVfG makes German the administrative language for BSI audits. Spec mentions DE/EN/NL i18n but doesn't enforce DE on artefacts that will be audited.
- **Action:** when generating policy documents, force DE version + flag missing DE translation as audit-blocking. Section 9.3.

### 2.4 ⚠️ **Separation of duties not enforced.** Internal auditor (7.2) can't audit a category they're Accountable for. Spec's RACI doesn't catch self-audit.
- **Action:** journey UX warns when same `user.id` appears as both A on a category and R on 7.2 for that category. Section 9.4.

### 2.5 🆕 **Proportionality justification per CIR Art. 2(2).** Spec mentions this but the field isn't in the schema yet. Auditor expects "comply or explain" justification per deferred control, signed by management body if material.
- **Action:** add `companyRequirementStatus.skipReason text` + `skipReasonSignedBy + signedAt`. Section 9.5.

### 2.6 ⚠️ **"Approved" without dated signature is not approval.** Spec has `policy.status = approved` but doesn't enforce dated personal signature per CEO course Lesson 1.5 ("personal signature and date").
- **Action:** `policy.approvedAt + approvedBy` already exist but `approverSignatureFile` should be added (uploaded scan or e-signature). Section 9.6.

### 2.7 🆕 **Workshop scaling for 250-person companies.** Spec assumes 4-hour single workshop for Cat 2.2 (assets). At 250-person scale with 1000+ rows that's impossible.
- **Action:** workshop-mode supports "split by category" (per-asset-type or per-site) — N sub-workshops aggregating into one inventory. Section 9.7.

### 2.8 ⚠️ **OT/ICS scope escalation surfaces too late.** `isOT: true` exists on asset but no journey UX surfaces IEC 62443 mapping; 250-person manufacturer needs this in Phase 1, not Phase 3.
- **Action:** when any asset has `isOT: true`, surface "OT-NIS2 supplementary path" with IEC 62443 mapping immediately in Phase 1 (parallel to main flow). Section 9.8.

### 2.9 ⚠️ **Tools recommendations missing.** Spec says "vulnerability scanner (e.g. Qualys, Nessus)" but doesn't give a German-market shortlist. For SMEs this is the biggest blocker.
- **Action:** wiki article per category listing 3–5 recommended tools with cost band + integration status. Section 9.9 (not the spec — wiki).

### 2.10 🆕 **Multi-site BIA + BCM not modelled.** 250-person company often has 3–10 sites. Spec's single `company` record doesn't capture this. BCM under §30(2) Nr. 3 expects per-site recovery plans.
- **Action:** schema enhancement: `company.sites text[]` or new `site` table; per-site `criticalProcessCount`. Section 9.10.

### 2.11 ⚠️ **`requiredSignOffRole = "ceo"` is too coarse.** Currently only 1.3/1.4/2.4/7.3 have it. But 1.2 (Roles appointment) + 2.1 (Risk methodology Akzeptanzschwelle) + 4.2 (Crisis mgmt approval) + 5.2 (critical supplier contracts) also legally require GL approval. Auditor will flag these as missing GF signature.
- **Action:** extend `requiredSignOffRole = "ceo"` to: 1.2, 2.1 (Akzeptanzschwelle component), 4.2, 5.2 (only for critical/class-A suppliers). Section 9.11.

### 2.12 ⚠️ **D&O defence pack mentioned but not assembled.** Section 7.3 of spec lists 5 sign-offs but no export function.
- **Action:** `/portal/export/d-and-o-pack` route generates a single PDF with the 5 sign-offs + dates + checksums. Section 9.12.

### 2.13 ⚠️ **Cross-framework consistency (NIS2 ↔ ISO 27001) not surfaced in journey.** 250-person companies often have ISO 27001 — they want to see "this NIS2 control = this 27001 Annex A control, already done." Satisfaction pairs exist for GDPR but not (yet) for ISO 27001.
- **Action:** REFERENCE.md says 73 NIS2 ↔ ISO 27001 satisfaction pairs exist — surface in journey UX. Section 9.13.

### 2.14 🆕 **DPO conflict-of-interest memo for DPO=ISB dual-hat.** 50-person company often has CTO = CISO + external DPO. But for very small or larger companies sometimes DPO = ISB. BSI Lerneinheit 2.6 explicitly warns against this without a documented role-boundary memo.
- **Action:** journey UX detects DPO+ISB on same `user.id` → requires `roleBoundaryMemoUploaded` evidence row. Section 9.14.

### 2.15 🆕 **§32 incident reporting timer + DSGVO Art. 33 parallel.** Spec mentions parallel reporting but doesn't enforce the dual timer at incident time.
- **Action:** when incident has personal-data scope, surface BOTH §32 BSIG (24h to BSI) AND Art. 33 GDPR (72h to BfDI/State DPA) timers side-by-side. Section 9.15.

---

## 3. Phase 0 — Onramp validation (5 steps)

### Step 1 — Applicability assessment

**Priority claim:** Phase 0 entry. **Info we have:** `applicabilityLookup` table + public funnel + 3 wiki articles. **Info we lack:** group-structure handling (parent + subsidiaries each need classification), formal counsel review record.

- 👤 **CISO:** ✅ — "Gets me a verdict in 30 min, good. But I want to know which sector text to use in 12.1 — Annex II Nr. 11 vs Nr. 7 for ICT services."
- 👤 **NIS2 Auditor:** ⚠️ — "Self-classification is OK but I'll ask for written counsel analysis if it's a close call (multi-sector). Spec has no `applicabilityCounselMemo` field."
- 👤 **CIR Implementor:** ✅ — "Maps to NIS2 Art. 3 + §28 BSIG; verdict drives the rest."
- 👤 **50-person co:** ✅ — "CEO + lawyer in 30 min works. We're not borderline KRITIS so this is easy."
- 👤 **250-person co:** ⚠️ — "Group structure: parent classified important, subsidiary in different sector may be essential. Spec doesn't surface the group case. Multi-classification capture needed."

**Verdict:** ✅ Confirmed Phase 0 placement. **Action:** add `applicabilityCounselMemoUploaded` (optional evidence) + group-structure handling note in wiki.

---

### Step 2 — Cat 12.1 NIS2 Classification & Scope (P0 · one-time · document)

**Priority claim:** P0 Phase 0. **Info:** intake fields + auto-derived from Step 1.

- 👤 **CISO:** ✅ — "Step 1 already gave us the verdict; this is the record-keeping moment."
- 👤 **NIS2 Auditor:** ✅ — "P0 correct; classification accuracy is fundamental. Wants `applicableSectors` to list all sector codes, not just dominant."
- 👤 **CIR Implementor:** ✅ — "Annex 1.1 scope element."
- 👤 **50-person co:** ✅ — "5 min, done."
- 👤 **250-person co:** ⚠️ — "Multi-sector → multi-classification handling needed. Currently `applicableSectors` is free-text. Should be multi-select against the Annex I/II list."

**Verdict:** ✅ Priority + phase confirmed. **Action:** change `applicableSectors` from `string` to `text[]` referencing Annex codes (Annex I Nr. 1–6, Annex II Nr. 7–22).

---

### Step 3 — Cat 1.1 Management Cybersecurity Training (P1 · every-3-years · training)

**Priority claim:** P1 Phase 0. **Info:** course delivery via `courses/nis2-ceo`, intake fields, per-GF `training_record` rows.

- 👤 **CISO:** ✅ — "Highest leverage: unlocks 1.3/1.4/2.4/7.3/8.3. Place it early."
- 👤 **NIS2 Auditor:** 🔄 — "Why is this **P1**? §38(3) BSIG is statutorily required, not 'recommended.' For Geschäftsführer, this is the FIRST audit question. **Should be P0.** Currently P1 means it can be deferred under proportionality — but you can't proportionalise a statutory personal duty."
- 👤 **CIR Implementor:** 🔄 — "Confirms: P0. Art. 20(2) NIS2 + CIR 8.3 list mgmt training as non-optional."
- 👤 **50-person co:** ✅ — "4–5 hours / GF member is doable. Course content looks right."
- 👤 **250-person co:** ⚠️ — "Larger board (4–6 GF members) — schedule conflict. Need staggered enrollment with reminders. Spec doesn't enforce per-GF nextReviewDate × N members."

**Verdict:** 🔄 **Re-prioritise to P0.** §38(3) is a personal statutory duty; auditor view aligns with CIR implementor. **Action:** Section 9.16 — update framework data for Cat 1.1 priority to P0.

---

### Step 4 — Cat 12.2 BSI Registration (P0 · one-time · proof)

**Priority claim:** P0 Phase 0. **Info:** MUK + BSI portal flow, intake, evidence upload, `bsi_registration` table.

- 👤 **CISO:** ✅ — "Operationally annoying (MUK lead time 5–10 days) but clear path."
- 👤 **NIS2 Auditor:** ✅ — "P0 correct. First thing I check. Deadline passed = late = fine independent of incident."
- 👤 **CIR Implementor:** ✅ — "Art. 27 + §33 BSIG. Mandatory."
- 👤 **50-person co:** ⚠️ — "Functional mailbox for §33(1) Nr. 6 contact — we don't have a `nis2@company.de` yet. Need wiki on setting one up."
- 👤 **250-person co:** ✅ — "Already have a SOC mailbox; KRITIS-adjacent companies have 24/7 contact requirement."

**Verdict:** ✅ Confirmed. **Action:** add wiki snippet on functional mailbox setup (mentioned but not detailed).

---

### Step 5 — Cat 1.2 Roles and Responsibilities (P1 · on-change · proof)

**Priority claim:** P1 Phase 0. **Info:** `company.cisoName`, `cisoReportsTo`, team invites, RACI implicit in `requirement_assignment`.

- 👤 **CISO:** ✅ — "Defining myself is easy. Defining RACI for 49 reqs is the big lift. Wiki gap noted."
- 👤 **NIS2 Auditor:** ⚠️ — "P1 understated. CIR 1.2 + Annex 1.2.2 ('at least one person directly accountable to leadership') is mandatory. CISO appointment + Weisungsbefugnisse — this is the second audit question. **Should be P0**, and `requiredSignOffRole = "ceo"` (board appoints the §30(1) person — CISO can't appoint themselves)."
- 👤 **CIR Implementor:** 🔄 — "P0 confirmed. CIR Annex 1.2 is explicit."
- 👤 **50-person co:** ⚠️ — "CISO often = CTO. Role conflict per BSI 200-2 §2.4 (ISB must NOT be embedded in IT). Spec mentions this but doesn't enforce. UX should flag dual-hat CTO+CISO."
- 👤 **250-person co:** ✅ — "Dedicated CISO already. RACI matrix exists informally; portal makes it formal."

**Verdict:** 🔄 **Re-prioritise to P0** + add CEO sign-off requirement. **Action:** Sections 9.11 + 9.16. UX flag for CTO+CISO dual-hat (Section 9.14 expands to cover this).

---

## 4. Phase 1 — Foundation validation (10 steps)

### Step 6 — Cat 1.4 Personal Liability Acknowledgment (P1 · one-time · CEO sign-off)

**Priority claim:** P1 Phase 1. **Info:** per-GF sign-off, `liabilityAcknowledged` boolean.

- 👤 **CISO:** ✅ — "Symbolic, fast. Get GF to sign before they argue about budget."
- 👤 **NIS2 Auditor:** ⚠️ — "P1 understated. §38(2) is non-waivable personal liability. **P0**, even if the act is fast. Auditor will ask for this signed document before any other proof."
- 👤 **CIR Implementor:** ✅ — "Maps to Art. 20(1) NIS2 + §38(2) BSIG. Confirmed."
- 👤 **50-person co:** ✅ — "5 min × 2 GF = 10 min. Easy."
- 👤 **250-person co:** ⚠️ — "Multi-board structures (Vorstand of AG with 5 members) — UX needs to clearly track per-member; currently rests on `requirement_assignment` per user, which works but is brittle if board composition changes."

**Verdict:** 🔄 **Re-prioritise to P0.** Statutory personal liability is not deferrable. **Action:** Section 9.16.

---

### Step 7 — Cat 2.1 Risk Assessment Methodology (P0 · one-time · document)

**Priority claim:** P0 Phase 1. **Info:** `company_risk_methodology` table, BSI 200-3 defaults, intake fields.

- 👤 **CISO:** ✅ — "BSI 200-3 default is one-click. Akzeptanzschwelle is the discussion."
- 👤 **NIS2 Auditor:** 🆕 — "**Akzeptanzschwelle missing as separate signed artefact.** CIR 2.1.1 wants the management body to set risk-acceptance criteria. Currently `riskAcceptanceThreshold` is just a field — auditor expects a board minute. Need `acceptanceThresholdSignedBy + signedAt` (cross-cutting 2.11)."
- 👤 **CIR Implementor:** ✅ — "CIR 2.1.2 elements covered (methodology, risk tolerance, criteria, threat analysis, CTI integration via `ctiSources`)."
- 👤 **50-person co:** ✅ — "One-click confirm. We don't customise BSI 200-3."
- 👤 **250-person co:** ⚠️ — "Custom scales likely; OT-specific scoring may need adjustment. `methodologyType` allows custom but no template for OT-aware methodology."

**Verdict:** ✅ P0 confirmed. ⚠️ **Add Akzeptanzschwelle as separate signed artefact** + `requiredSignOffRole = "ceo"` for the Akzeptanzschwelle component. **Action:** Sections 9.11 + 9.17.

---

### Step 8 — Cat 2.2 Asset Inventory, Scope & Classification (P0 · ongoing · technical) — WORKSHOP

**Priority claim:** P0 Phase 1. **Info:** `asset` module, DSGVO satisfaction pair, intake field.

- 👤 **CISO:** ⚠️ — "4-hour workshop is OK for 50 systems; impossible for 1000. Workshop scaling needed (cross-cutting 2.7)."
- 👤 **NIS2 Auditor:** ⚠️ — "Per-row owner column **must** be enforced. Currently `asset.owner` is optional? Should be required. Auditor flag: 'vendor/asset list with no owner column' is the #4 RACI failure in Section 7.6."
- 👤 **CIR Implementor:** ✅ — "CIR Annex 12 elements covered. Plus CIR 2.1.2 ('appropriate and proportionate' covers scope)."
- 👤 **50-person co:** ✅ — "30 SaaS subscriptions + 5 servers + 5 endpoints. DSGVO carryover pre-fills most. 2-hour workshop sufficient."
- 👤 **250-person co:** ⚠️ — "1000+ rows. Per-department workshops (IT / ops / HR / finance / each business unit). Multi-day. Spec single-workshop assumption breaks. Need workshop-split UX (cross-cutting 2.7)."

**Verdict:** ✅ P0 + Phase 1 confirmed. **Action:** enforce `asset.owner NOT NULL` (Section 9.18) + workshop-split (Section 9.7).

---

### Step 9 — Cat 2.3 Risk Register & Treatment (P1 · annual · technical) — WORKSHOP

**Priority claim:** P1 Phase 1. **Info:** risk + risk_asset + risk_treatment tables, 47 BSI threats reference.

- 👤 **CISO:** ✅ — "Workshop pattern works; 47 BSI threats × top critical assets."
- 👤 **NIS2 Auditor:** 🔄 — "**P0**, not P1. Without a risk register, 2.4 sign-off is uninformed (CEO course Lesson 2.1). Risk register IS the §30(2) Nr. 1 foundation. Why P1?"
- 👤 **CIR Implementor:** 🔄 — "Confirms P0. CIR 2.1.1 makes this mandatory (not deferrable)."
- 👤 **50-person co:** ✅ — "2-hour workshop fine. Top 20 risks covers it."
- 👤 **250-person co:** ⚠️ — "200+ risks. Workshop-walk impossible. Need split: critical assets only in workshop, rest by Asset Owner async, CISO reviews."

**Verdict:** 🔄 **Re-prioritise to P0**, retain Phase 1 placement. **Action:** Section 9.16. + workshop-split for 250-person scale.

---

### Step 10 — Cat 2.4 Risk Acceptance + IS Policy Sign-Off (P0 · one-time · CEO sign-off) — PHASE 1 MILESTONE

**Priority claim:** P0 Phase 1, milestone. **Info:** policy row, GF signature per member, IS Policy doc, satisfies G-TOM.1.

- 👤 **CISO:** ✅ — "The big moment. Need policy template that's actually used."
- 👤 **NIS2 Auditor:** ⚠️ — "Sign-off integrity (cross-cutting 2.1) + dated personal signature (cross-cutting 2.6) + German version (cross-cutting 2.3). Three gaps right at the milestone."
- 👤 **CIR Implementor:** ⚠️ — "`cir11Checklist` field exists with the 7 CIR 1.1 elements — but UX doesn't currently force checking all 7 before sign-off. Auditor will flag missing elements."
- 👤 **50-person co:** ✅ — "Template-driven policy + 1-hour board meeting. Doable."
- 👤 **250-person co:** ⚠️ — "Vorstand of 5 — schedule risk. Per-member sign-off + audit trail per signer. Currently works via `requirement_assignment` per GF + `sign_off_history` per signature, but spec doesn't surface the multi-sign-state ('3 of 5 signed') in UX."

**Verdict:** ✅ Priority + phase confirmed. ⚠️ **Three audit gaps to fix**: sign-off immutability, dated signature, German enforcement. **Action:** Sections 9.1, 9.3, 9.6.

---

### Step 11 — Cat 3.1 Incident Response Plan & Team (P0 · annual · document)

**Priority claim:** P0 Phase 1. **Info:** intake fields, `policy` row type `incident_response`.

- 👤 **CISO:** ✅ — "IR plan template needed; spec mentions 'template via lib/compliance/' — verify."
- 👤 **NIS2 Auditor:** ⚠️ — "P0 OK, but spec is too thin on what the plan must contain. CIR 3.1 specifies content (roles, detection, classification, response, communication, post-incident, lessons learned). Missing detailed CIR 3.1 checklist on UX."
- 👤 **CIR Implementor:** ⚠️ — "CIR 3.1 has 6 sub-elements; spec doesn't enforce coverage. Need `cir31Checklist` multi-select."
- 👤 **50-person co:** ✅ — "IR plan = doc + IRT lead + escalation. We probably name CTO as IRT lead."
- 👤 **250-person co:** ⚠️ — "Multi-site IR — escalation per site, primary + backup IRT lead. Spec captures `incidentLead` (singular). Should support primary + backup."

**Verdict:** ✅ Priority confirmed. **Action:** add `cir31Checklist` field (matches our `cir11Checklist` pattern); support `incidentLeadBackup`. Section 9.19.

---

### Step 12 — Cat 3.3 BSI Reporting (24h/72h/1m) (P0 · on-change · proof)

**Priority claim:** P0 Phase 1 (config now, triggered at incident). **Info:** `bsi_incident_report` rows, timers, `bsiReportingRegistered` reused from 12.2.

- 👤 **CISO:** ✅ — "Data model handles three-stage updates as one incident with N reports — correct."
- 👤 **NIS2 Auditor:** ⚠️ — "DSGVO 72h parallel (cross-cutting 2.15) — UX must surface BOTH timers when personal-data scope. Currently §32 only."
- 👤 **CIR Implementor:** ✅ — "Art. 23(4) cascade modelled correctly."
- 👤 **50-person co:** ✅ — "Hopefully never use it. Configuration moment."
- 👤 **250-person co:** ⚠️ — "Incident command structure missing. For 250-person, IRT lead + tactical commander + comms officer + legal liaison — Spec captures `incidentLead` and `incidentEscalationContacts` (free text). Need structured incident-command roles."

**Verdict:** ✅ Confirmed. **Action:** Section 9.15 (DSGVO parallel timer). Defer structured incident command to v5.

---

### Step 13 — Cat 10.1 Access Control Policy & Model (P1 · annual · document)

**Priority claim:** P1 Phase 1. **Info:** `company_policy_config` type `access_control`, `policy` row.

- 👤 **CISO:** ⚠️ — "P1 OK but UX needs RBAC vs ABAC selection guidance — practitioners pick the wrong model without it."
- 👤 **NIS2 Auditor:** ⚠️ — "Privileged-role definition is mandatory (CIR 11.3); spec doesn't enforce separation from regular roles. Auditor flag: 'privileged role definition missing.'"
- 👤 **CIR Implementor:** ⚠️ — "CIR 11.1 has 7 elements (purpose, scope, roles, lifecycle, J/M/L, privileged accounts, periodic review). Spec doesn't enforce coverage."
- 👤 **50-person co:** ✅ — "Microsoft 365 + GitHub access. RBAC sufficient. Privileged = admin + finance leads."
- 👤 **250-person co:** ✅ — "RBAC + per-system overlays. Already mostly done; spec captures the policy artefact."

**Verdict:** ✅ Priority confirmed. **Action:** add `cir111Checklist` for the 7 CIR 11.1 elements; enforce privileged-role definition. Section 9.20.

---

### Step 14 — Cat 11.1 Multi-Factor Authentication (P0 · annual · technical)

**Priority claim:** P0 Phase 1. **Info:** `mfaTool`, methods, coverage%, admin MFA flag.

- 👤 **CISO:** ✅ — "P0 right. Quick win for boards: 'we have MFA, here's coverage%'."
- 👤 **NIS2 Auditor:** ⚠️ — "P0 OK. `mfaCoveragePct` claim must be verifiable — request IdP export. Currently no IdP API integration; manual entry."
- 👤 **CIR Implementor:** ⚠️ — "CIR 11.7 increasingly references phishing-resistant MFA (FIDO2/HW token) for highest-risk roles. Spec captures `mfaMethods` but doesn't differentiate phishing-resistant from soft tokens."
- 👤 **50-person co:** ✅ — "Microsoft Authenticator for all + YubiKey for CEO/CTO. Done in week 1."
- 👤 **250-person co:** ⚠️ — "Need to handle: service accounts (often excluded), legacy systems (no MFA), break-glass accounts. `mfaCoveragePct` should be 'in-scope user population' not 'configured systems' — spec mentions this but UX doesn't enforce the distinction."

**Verdict:** ✅ Confirmed. **Action:** add `mfaPhishingResistantCoverage` % field; clarify coverage denominator in UX. Section 9.21.

---

### Step 15 — Cat 1.3 Budget Allocation (P1 · annual · CEO sign-off) — PHASE 1 CLOSER

**Priority claim:** P1 Phase 1 closer. **Info:** `annualSecurityBudget` string + date.

- 👤 **CISO:** ✅ — "Closing Phase 1 with budget grounded in real measures is right."
- 👤 **NIS2 Auditor:** ⚠️ — "Budget proportional to revenue — CIR test is 'appropriate.' Auditor benchmark: 3–8% of IT budget is typical. Spec doesn't capture revenue % or IT-budget %, so auditor can't validate proportionality."
- 👤 **CIR Implementor:** ⚠️ — "CIR 1.1 wants 'resource allocation' as IS Policy element. Spec captures budget but not headcount allocation. Need `securityHeadcount` / `securityFte` field."
- 👤 **50-person co:** ⚠️ — "Single line item EUR amount. CFO will ask for breakdown — spec doesn't capture line items."
- 👤 **250-person co:** ✅ — "Multi-year budget pattern. Spec annual-only — minor gap."

**Verdict:** ✅ Confirmed. **Action:** add `securityHeadcountFte` + `revenuePctBudget` fields. Section 9.22.

---

## 5. Phase 2A/B/C + Phase 3 — Compressed validation by category

For each category, persona-level verdict + items needing action.

### Cat 4 BCP (Business Continuity) — 5 reqs (4.1 BIA · 4.2 BCP+Crisis · 4.3 DR · 4.4 Backup · 4.5 Test)

- 👤 **CISO:** ✅ — "Standard BCM. RPO/RTO per process makes sense."
- 👤 **NIS2 Auditor:** ⚠️ — "**Crisis comms templates absent** — 4.2 expects stakeholder templates (employees, customers, regulators, press). Auditor will ask. + Multi-site BIA (cross-cutting 2.10)."
- 👤 **CIR Implementor:** ⚠️ — "CIR 4.1 has 5 elements (BIA, BC plan, DR plan, backup, test). Maps 1:1 to our 4.1–4.5 ✅. But `cir41Checklist` not present."
- 👤 **50-person co:** ✅ — "1 site, 5 critical processes, RPO 24h / RTO 4h. Doable."
- 👤 **250-person co:** ⚠️ — "**Per-site BIA required.** Currently `criticalProcessCount` is single number; for multi-site, need per-site. Cross-cutting 2.10 needs to land before 4.x."

**Verdict:** ✅ Phase 2A/B placement correct. **Action:** crisis-comms templates (wiki), multi-site BIA schema (Section 9.10), `cir41Checklist`.

---

### Cat 5 SUP (Supply Chain) — 4 reqs (5.1 Register · 5.2 Contracts · 5.3 Assessment · 5.4 Notification)

- 👤 **CISO:** ⚠️ — "P1 OK but supply chain is increasingly the attack vector (xz, npm, MOVEit). Should some sub-step be P0? Specifically 5.4 (downstream cascade) — Art. 23 cascade can hit our customers."
- 👤 **NIS2 Auditor:** ⚠️ — "**Per-supplier-row owner missing** (cross-cutting Section 7.6 #4). + **`hasSubcontractorFlowDown` is boolean only** — auditor wants to see the actual chain (sub-processor list)."
- 👤 **CIR Implementor:** ✅ — "CIR 5.1–5.5 covered by our 5.1–5.4 (we collapse 5.4+5.5)."
- 👤 **50-person co:** ✅ — "15–25 suppliers. Mostly SaaS. ABC classification: critical = 5, important = 10, rest = ignored except cumulative."
- 👤 **250-person co:** ⚠️ — "**Sub-processor depth** matters at scale; currently flow-down is boolean. Need explicit `subProcessor` rows linked to each supplier."

**Verdict:** ✅ Phase 2A/B confirmed. **Action:** per-row supplier owner required; add `subProcessor` table or array on `supplier`. Section 9.23.

---

### Cat 6 PRO (Procurement / Secure Operations) — 5 reqs (6.1 Procurement · 6.2 Dev · 6.3 Vuln · 6.4 Patch · 6.5 Change)

- 👤 **CISO:** ⚠️ — "P1 across the board, but 6.3 + 6.4 are operational hygiene — daily. 6.2 Secure Dev is only relevant if in-house dev (often skip-able for SaaS-only)."
- 👤 **NIS2 Auditor:** ⚠️ — "**6.3 CVD URL is a thing** — currently `vulnerabilityDisclosureUrl` optional. Auditor wants security.txt minimum. Should be required for essential entities."
- 👤 **CIR Implementor:** ⚠️ — "CIR 6 has 10 sub-items; we have 5. Sub-items folded under others:"
  - CIR 6.6 (patch) → 6.4 ✅
  - CIR 6.5 (config) → 6.2 ✅
  - CIR 6.7 (network) → folded into policies ⚠️ (Section 16.1)
  - CIR 6.8 (segmentation) → folded ⚠️
  - CIR 6.9 (anti-malware) → folded ⚠️
  - CIR 6.10 (CVD) → 6.3 ✅
- 👤 **50-person co:** ⚠️ — "Don't have internal devs; skip 6.2. Need 'comply or explain' for that defer."
- 👤 **250-person co:** ⚠️ — "Have CAB + dev team. 6.2 + 6.5 relevant. Need formal Change Advisory Board minute records (currently `changeRequest` table — fine but minute upload not enforced)."

**Verdict:** ⚠️ **Cat 6 has 4 CIR sub-items folded (6.5 config, 6.7 network, 6.8 segmentation, 6.9 anti-malware)** — flagged in v3/v4 already (Section 16.1). 50-person co needs explicit "skip with reason" UX for 6.2. **Action:** add the 4 folded sub-items as explicit requirements (raises framework from 49 to 53) OR keep folded but add CIR sub-checklists on the host requirements.

---

### Cat 7 EFF (Effectiveness) — 4 reqs (7.1 KPIs · 7.2 Audit · 7.3 Mgmt Review · 7.4 Improvements)

- 👤 **CISO:** ✅ — "Standard ISMS effectiveness loop."
- 👤 **NIS2 Auditor:** ⚠️ — "**Separation of duties** (cross-cutting 2.4): auditor cannot be the responsible person for what's audited. 50-person company: same person = CISO + auditor — auditor view: bring external. Currently spec mentions rotation but doesn't enforce."
- 👤 **CIR Implementor:** ✅ — "CIR 7.1–7.4 covered."
- 👤 **50-person co:** ⚠️ — "**No internal auditor.** Spec assumes one. Need 'external auditor acceptable' branch in 7.2 + ability to upload external audit report."
- 👤 **250-person co:** ✅ — "Internal audit function exists. Quarterly KPI cadence works."

**Verdict:** ✅ Phase 2A confirmed. **Action:** explicit "external auditor" branch on 7.2 (currently `internalAudit` table is internal-only — extend or add `externalAudit` flag). Section 9.24.

---

### Cat 8 TRN (Training) — 4 reqs (8.1 Policy + AUP · 8.2 Awareness · 8.3 Role · 8.4 Phishing)

[redacted for public release]
- 👤 **NIS2 Auditor:** ✅ — "Completion rate + phishing click rate are exactly what we ask for."
- 👤 **CIR Implementor:** ✅ — "CIR 8.1–8.4 covered."
- 👤 **50-person co:** ⚠️ — "Annual training is realistic; quarterly phishing might be too aggressive. Need flexibility."
- 👤 **250-person co:** ✅ — "Quarterly comfortable; integrated with HR LMS."

**Verdict:** ✅ Confirmed. **Action:** allow `phishingSimFrequency: semi_annual` for 50-person SMEs.

---

### Cat 9 CRY (Cryptography) — 3 reqs (9.1 Policy · 9.2 Encryption · 9.3 Keys & Certs)

- 👤 **CISO:** ✅ — "Policy → per-asset crypto fields → key mgmt. Aligns with BSI TR-02102."
- 👤 **NIS2 Auditor:** ⚠️ — "BSI TR-02102 ships new versions (post-quantum). Policy must reference current version. Spec doesn't enforce version check."
- 👤 **CIR Implementor:** ⚠️ — "CIR 9 has 5 sub-items (policy, at-rest, in-transit, integrity, key mgmt). We have 3. Integrity may be missed (HMAC, digital signatures)."
- 👤 **50-person co:** ✅ — "Mostly inherits cloud defaults (AWS KMS, Cloudflare TLS). Policy is writedown."
- 👤 **250-person co:** ⚠️ — "On-prem crypto + HSM. More complex. `cryptoImplementation` per asset captures it."

**Verdict:** ✅ Phase 2A/B confirmed. **Action:** add `cryptoIntegrityMechanisms` field for HMAC/signature coverage. Section 9.25.

---

### Cat 10 ACC (Access Control) — 4 reqs (10.1 Policy · 10.2 Per-asset · 10.3 Lifecycle/PAM · 10.4 Reviews)

- 👤 **CISO:** ✅ — "Solid model. PAM (10.3) and access review (10.4) are the audit fail points."
- 👤 **NIS2 Auditor:** ⚠️ — "**Shared service accounts** (CIR 11.3 disallows for accountability) — currently no check. Need `hasSharedAccounts: boolean` with "comply or explain" if true."
- 👤 **CIR Implementor:** ⚠️ — "CIR 11.1 has 7 elements; spec doesn't enforce. (Section 9.20 — same action as 10.1 above.)"
- 👤 **50-person co:** ⚠️ — "Background checks (`backgroundCheckScope`) — common gap. 'Privileged roles only' is acceptable answer."
- 👤 **250-person co:** ⚠️ — "PAM tool required (CyberArk, BeyondTrust, Teleport) — spec captures `pamTool` ✅. Per-asset access matrix at 1000+ assets is massive — UX needs batching."

**Verdict:** ✅ Confirmed. **Action:** + `hasSharedAccounts` flag, + per-asset access batch UX.

---

### Cat 11 AUT (Authentication) — 3 reqs (11.1 MFA · 11.2 Secure Comms · 11.3 Auth Standards)

- 👤 **CISO:** ✅ — "MFA P0, comms test quarterly, auth standards triennial."
- 👤 **NIS2 Auditor:** ⚠️ — "11.2 `lastEmergencyCommsTest` empty for years = common finding. Surface as overdue when > 90 days."
- 👤 **CIR Implementor:** ✅ — "CIR 11.6 + 11.7 covered."
- 👤 **50-person co:** ⚠️ — "Emergency comms test = Signal group ping? Spec doesn't define test depth."
- 👤 **250-person co:** ✅ — "IRT Signal channel + monthly ping suffices."

**Verdict:** ✅ Confirmed. **Action:** surface 11.2 test as overdue if > 90 days; wiki snippet on test depth.

---

### Cat 12 REG (Registration & Compliance Evidence) — covered in Phase 0 detail

12.3 + 12.4 in Phase 2C / Phase 3.

- 👤 **NIS2 Auditor:** ⚠️ — "12.4 KRITIS Nachweispflicht (§39) — every 3 years for KRITIS only. Currently 12.4 surfaces for all entities. Should be conditional on `entityClassification = kritis` (cross-cutting Section 9.26)."

**Verdict:** ⚠️ **Conditional surfacing for 12.4 KRITIS only.** Action: Section 9.26.

---

## 6. Priority re-evaluation table

Based on persona-aware review, the following requirements need priority change:

| Code | Title | Current | Proposed | Rationale | Personas concurring |
|---|---|---|---|---|---|
| **1.1** | Management Training | P1 | **P0** | §38(3) personal statutory duty, not deferrable | Auditor + CIR + (CEO course Lesson 1.6 anchor) |
| **1.2** | Roles and Responsibilities | P1 | **P0** | CIR Annex 1.2 mandatory; §30(1) accountable person required | Auditor + CIR |
| **1.4** | Personal Liability Acknowledgment | P1 | **P0** | §38(2) non-waivable personal liability | Auditor + CIR |
| **2.3** | Risk Register & Treatment | P1 | **P0** | §30(2) Nr. 1 foundation; without it 2.4 sign-off is uninformed (Lesson 2.1) | Auditor + CIR |
| **12.4** | Compliance Evidence & KRITIS | P1 (all) | **P1 only for KRITIS** | §39 BSIG only applies to KRITIS | Auditor |
| **3.4** | Incident Response Drill | P2 | **P1** | Without drill, IR plan is paper. CIR 7 requires effectiveness measurement of IR. P2 is too low. | Auditor + CISO |

**Net effect:** P0 count grows from 8 → 12 (+4); P2 count drops from 1 → 0 (3.4 moves to P1). Phase 0/1 list of P0 reqs becomes legally complete. Reduces auditor risk of "deferred mandatory duty under proportionality."

---

## 7. 50-person vs 250-person variant table

For each step, what differs:

| Step | Cat | 50-person reality | 250-person reality | Spec adjustment needed |
|---|---|---|---|---|
| 1 | Apply | CEO + lawyer in 30 min | Per-entity in group structure | Group-structure handling |
| 2 | 12.1 | Single sector tag | Multi-sector tags | `applicableSectors text[]` (Section 9.18a) |
| 3 | 1.1 | 2 GF, ~10h total | 5 GF, scheduled over months | Per-GF cadence reminders |
| 4 | 12.2 | Single MUK org cert | Already had MUK (other regulations) | none |
| 5 | 1.2 | CTO = CISO (dual-hat, role-boundary memo needed) | Dedicated CISO | UX flag for dual-hat (cross-cutting 2.14) |
| 6 | 1.4 | 2 GF sign in 5 min | 5 GF sign over weeks | UX: track per-member state visibly |
| 7 | 2.1 | One-click BSI 200-3 default | Custom methodology likely (OT-aware) | OT-aware methodology template |
| 8 | 2.2 | 30 assets, 2h workshop | 1000+ assets, multi-day per-dept | Workshop-split UX (cross-cutting 2.7) |
| 9 | 2.3 | 20 risks, 2h workshop | 200+ risks, split: critical sync + tail async | Same workshop-split |
| 10 | 2.4 | 1h GF meeting | 1h GF meeting (high stakes) | Sign-off integrity matters more (cross-cutting 2.1) |
| 11 | 3.1 | CTO = IRT lead | Dedicated IRT + tactical command | `incidentLeadBackup` + structured command roles |
| 12 | 3.3 | Hopefully never used | Multi-site escalation | DSGVO parallel timer + cmd structure |
| 13 | 10.1 | RBAC simple | RBAC + per-system overlays | None at spec level |
| 14 | 11.1 | Coverage 100% trivially | Service-account / legacy exclusions | `mfaPhishingResistantCoverage` |
| 15 | 1.3 | EUR + date | Multi-year, line items, headcount FTE | `securityHeadcountFte`, line items |
| 4.x | BCP | Single site | Multi-site BIA + per-site DR | Multi-site BIA schema (cross-cutting 2.10) |
| 5.x | SUP | 25 suppliers | 100+ suppliers + sub-processor chains | `subProcessor` table |
| 6.x | PRO | Skip 6.2 + 6.5 | Full CAB + dev SDLC | "skip with reason" UX |
| 7.x | EFF | External auditor | Internal audit function | `externalAudit` branch |
| 8.x | TRN | Annual ok | Quarterly comfortable | None |
| 11.2 | AUT | Signal group | IRT channel + drills | None |
| 12.4 | REG | Skipped if not KRITIS | Triennial Nachweispflicht if KRITIS | Conditional surfacing (Section 9.26) |

---

## 8. Verdict summary

**Strong (validated across all personas):**
- 4-phase shape is right
- Dependency graph (42 prereqs) is right
- Schema coverage of 49 requirements is solid
- RACI per step is novel and correct (no other journey doc has this)
- The §35 / Cat 3.5 split finding is real
- The 5 D&O sign-offs is real and valuable

**Issues that need addressing (in priority order — see Section 9):**

| # | Issue | Severity | Personas raising |
|---|---|---|---|
| A | **6 priority misclassifications** (Section 6) — 1.1, 1.2, 1.4, 2.3 → P0; 3.4 → P1; 12.4 → conditional KRITIS | High | Auditor, CIR |
| B | **Sign-off integrity** (immutability + hash chain) | High | Auditor |
| C | **Per-row Asset Owner / Supplier Owner enforcement** | High | Auditor |
| D | **Akzeptanzschwelle as separate signed artefact** | High | Auditor, CIR |
| E | **Workshop-split for 250-person scale** (Cat 2.2, 2.3) | High | 250-person co |
| F | **Functional roles taxonomy** (`user.functionalRoles[]` + `requirement_assignment.raciRole`) | High | All (enables RACI enforcement) |
| G | **`requiredSignOffRole = "ceo"` extension** to 1.2, 2.1 (Akzeptanzschwelle), 4.2, 5.2 (critical only) | High | Auditor, CIR |
| H | **DSGVO Art. 33 parallel timer** | Medium | Auditor |
| I | **Multi-site BIA + BCM** | Medium | 250-person co |
| J | **OT/ICS escalation surfaced in Phase 1** | Medium | 250-person manufacturer |
| K | **CIR sub-checklists** (`cir11Checklist` exists; add `cir31Checklist`, `cir41Checklist`, `cir111Checklist`) | Medium | CIR |
| L | **Cat 6 sub-items folded** (6.7 network, 6.8 segmentation, 6.9 anti-malware) | Medium | CIR |
| M | **External auditor branch** for Cat 7.2 | Medium | 50-person co |
| N | **D&O defence pack export** function | Medium | All |
| O | **Sub-processor chain** schema | Medium | 250-person co + Auditor |
| P | **Group-structure applicability** | Low | 250-person co |
| Q | **Cross-framework satisfaction surfacing** (NIS2 ↔ ISO 27001) | Low | 250-person co |
| R | **"Comply or explain" `skipReason`** + signed evidence | High | CIR, Auditor |
| S | **CTO+CISO dual-hat boundary memo** enforcement | Medium | 50-person co + Auditor |
| T | **German-language artefact enforcement** | Medium | Auditor |

---

## 9. Updates to push back into the v4 spec

(Each item maps to a Section 9.x referenced inline above.)

- **9.1** Sign-off integrity: add `sign_off_history.checksum + previousChecksum`
- **9.2** Evidence retention: `company.evidenceRetentionMonths` default 84
- **9.3** German-language enforcement on audited artefacts
- **9.4** Separation of duties check for 7.2 auditor
- **9.5** `companyRequirementStatus.skipReason + skipReasonSignedBy`
- **9.6** `policy.approverSignatureFile`
- **9.7** Workshop-split UX (per-dept / per-site)
- **9.8** OT/ICS Phase 1 escalation when `asset.isOT = true`
- **9.9** Tools wiki (per category, 3–5 recommended German-market tools)
- **9.10** Multi-site model (`company.sites text[]` or `site` table)
- **9.11** Extend `requiredSignOffRole = "ceo"` to 1.2, 2.1 (Akzeptanzschwelle), 4.2, 5.2 (critical)
- **9.12** `/portal/export/d-and-o-pack` route
- **9.13** ISO 27001 satisfaction-pair surfacing in journey
- **9.14** DPO+ISB dual-hat memo enforcement + CTO+CISO same
- **9.15** DSGVO Art. 33 parallel timer for personal-data incidents
- **9.16** Priority changes (Section 6) — update framework data: 1.1, 1.2, 1.4, 2.3 to P0; 3.4 to P1; 12.4 conditional
- **9.17** Akzeptanzschwelle separate signed artefact on `company_risk_methodology`
- **9.18** `asset.owner NOT NULL` migration
- **9.18a** `applicableSectors text[]` referencing NIS2 Annex codes
- **9.19** `cir31Checklist` for Cat 3.1 IR plan content elements; `incidentLeadBackup`
- **9.20** `cir111Checklist` for Cat 10.1 + `cir11Checklist` UX enforcement
- **9.21** `mfaPhishingResistantCoverage` field + coverage denominator clarification
- **9.22** `securityHeadcountFte` + `revenuePctBudget` on Cat 1.3
- **9.23** `subProcessor` schema (table or column) + per-row supplier owner required
- **9.24** `externalAudit` branch for Cat 7.2
- **9.25** `cryptoIntegrityMechanisms` field for Cat 9.x
- **9.26** Conditional 12.4 KRITIS surfacing

---

## 10. Recommendations — what to push into v4 immediately vs defer

### Push now (high-value, low-effort, no ambiguity)
1. **Priority changes (9.16)** — 6 priority updates. Framework data change. Re-seed.
2. **`asset.owner NOT NULL` (9.18)** — schema migration + UX.
3. **Akzeptanzschwelle separate artefact (9.17)** — single column addition.
4. **`requiredSignOffRole = "ceo"` extension (9.11)** — framework data change for 4 reqs.
5. **`skipReason` + signed (9.5 / R)** — schema + UX for proportionality justification.
6. **CIR sub-checklists (9.19 / 9.20 / K)** — match existing `cir11Checklist` pattern.
7. **Conditional 12.4 KRITIS (9.26)** — UX logic.

### Push next (medium effort, high value)
8. **Sign-off integrity (9.1)** — migration + hash chain.
9. **Workshop-split UX (9.7)** — UX refactor.
10. **D&O export (9.12)** — new export route.
11. **Multi-site model (9.10)** — schema design decision.

### Defer (low priority or research-blocked)
12. **Cat 6 fold-out (L)** — adds 4 requirements; decide later whether to split.
13. **OT escalation surface (9.8)** — needs more research on IEC 62443 specifics.
14. **Tools wiki (9.9)** — content work, not blocker.

---

*Method note. This validation was performed in one pass against the v4 spec by role-playing the 5 personas, cross-checking every claim against §38 BSIG / Art. 20-23 NIS2 / CIR 2024/2690 Annex / BSI 200-1/-2/-3/-4 / our CEO course / external practitioner research. Findings are unsigned — Simon to triage which to push.*
