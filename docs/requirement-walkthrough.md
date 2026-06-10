# Requirement Walkthrough — Issues & Insights

## General Principles
- **Check the actual law** — don't paraphrase. Use §38 BSIG / Art. 20-21 NIS2 language.
- **No vague corporate filler** — if a description doesn't tell you what to DO, rewrite it.
- **Order must follow legal sequence** — if X is a prerequisite for Y, X comes first.
- **Don't duplicate what the platform already does** — sign-offs, audit trail, timestamps are built in. Don't ask users to confirm what the system already captures.
- **Platform-satisfied requirements** — when the platform IS the mechanism (e.g. oversight via dashboard + audit trail + notifications), don't ask users to "describe their process." Keep structured form fields (exportable, translatable) but pre-fill with the platform's answer. The sign-off confirms "this is how we do it."
- **No free-text paragraphs for structured data** — form fields must stay structured (key:value) for export, i18n, and auditability. English prose in description fields is not exportable evidence.
- **German required for BSI** — VwVfG §23(1) makes German the administrative language. All evidence and exports must be available in German for BSI audits.

## Key Legal Sources

| Source | What it is | Scope |
|--------|-----------|-------|
| **NIS2 Directive (EU) 2022/2555** | EU directive — Art. 20 (governance), Art. 21 (measures), Art. 23 (incident reporting) | Sets the framework, member states implement |
| **BSIG 2025** (German implementation) | §28 (scope/entities), §30 (risk management measures), §38 (management liability), §32 (incident reporting) | Legally binding in Germany |
| **CIR 2024/2690** | EU Commission Implementing Regulation — granular technical/methodological requirements for Art. 21 measures | Legally binding for DCI entities, authoritative reference for all |
| **BSI 200-1/200-2/200-3** | BSI standards for ISMS, methodology, and risk analysis | De facto standard for German companies, "Stand der Technik" |
| **ISO 27001** | International cybersecurity management standard | Maps ~95% to NIS2 Art. 20+21, gap: crisis management |

## ISO 27001 ↔ NIS2 Mapping (Source: [Advisera](https://www.youtube.com/watch?v=J6fYg2mG_8Q))

ISO 27001 covers almost all of NIS2 Articles 20 and 21:
- **Art. 20 (Governance)** → fully mapped: risk treatment (6.1.3), measurement/audit/management review (Clause 9), training (7.2, 7.3, Annex A)
- **Art. 21 (Measures)** → mapped except ONE gap: **crisis management** (NIS2 requires it, 27001 doesn't — that's ISO 22301)
- **Art. 23 (Incident reporting)** → NOT mapped. NIS2 is far more specific (early warning → notification → intermediate → progress → final reports to CSIRT). Must be built from NIS2 directly.

**Practical implications for our platform:**
- ISO 27001 is MORE detailed than NIS2 for risk management → using BSI 200-3 (German 27001 equivalent) as methodology framework is correct
- Companies with existing 27001 can map their docs to our form fields — they just need NIS2 references added
- Companies WITHOUT 27001 get guided through the same content via our structured forms — this is our value add vs. Advisera (templates) or doing it manually
- Belgium officially accepts ISO 27001 for NIS2 compliance. Germany hasn't yet, but BSI 200-series serves the same role
- When we re-add ISO 27001 as a framework, ~95% of NIS2 work transfers automatically. Only crisis management + incident reporting need separate work

## Architectural Insight: Governance vs. Effectiveness

The law creates two separate but overlapping articles:

- **Art. 20 NIS2 / §38 BSIG = Governance** — WHO is responsible and liable. The management body's personal duties: approve, oversee, get trained, be personally liable.
- **Art. 21(2)(f) NIS2 / §30(2) Nr. 6 BSIG = Effectiveness Assessment** — HOW you prove the measures actually work. The operational machinery: audits, KPIs, management reviews, gap analyses, improvement tracking.

**The overlap:** Management review (7.5) IS how management fulfills their oversight duty (old 1.2). The audit program IS how you prove effectiveness. The KPI dashboard IS how management sees what's working. Category 1 and Category 7 are the same activity viewed from two angles — the governance duty (on people) vs. the operational system (the company builds).

**Resolution:** Governance (Category 1) should be thin — just the things genuinely unique to management's personal duties. Everything operational belongs in its respective category.

### What Governance actually is:
- Register the Geschäftsführung members (names, roles)
- Each one acknowledges personal liability under §38(2)
- Each one completes cybersecurity training every 3 years (§38(3))
- Define roles (CISO appointment, RACI) and allocate budget
- Then they use the platform: log in, review, sign off. The audit trail IS the governance evidence.

### What Effectiveness (Cat 7) actually is:
- Guided processes with evidence: "You need an internal audit. Here's what to cover. Upload the report."
- "You need a management review meeting. Here's the agenda template. Upload minutes with attendee list."
- "You need KPIs. Here are the ones BSI expects. Record your measurements."
- The platform prescribes what to do, the user provides evidence they did it.

### Cross-requirement references:
Some governance requirements are "pointers" — they reference operational work done in other categories:
- Old 1.2 (Oversight) → satisfied by platform + 7.5 (Management Review)
- Old 1.4 (Info Security Policy) → duplicates 2.1 (Risk Management)
- Old 1.5 (ISMS Scope) → duplicates 2.6 (Risk Management)

These should be removed from governance. The evidence lives in the operational category; the governance layer is just the sign-off.

## Category 1: Governance & Liability (§38 BSIG / Art. 20 NIS2)

### Requirements to REMOVE (redundant with platform or other categories):

**Old 1.1 — Management Approval of Risk Measures → REMOVE**
- Platform already has per-requirement sign-off (signedOffBy, signedOffAt, signOffSnapshot). Management signing off on completed requirements IS the Art. 20(1) approval.

**Old 1.2 — Management Oversight of Implementation → REMOVE**
- Art. 20(1) / §38(1) requires oversight. But the platform IS the oversight mechanism: dashboard shows compliance status, audit trail records all actions, notifications flag overdue items. The formal periodic review lives in 7.5 (Management Review). No separate form needed.

**Old 1.4 — Information Security Policy → REMOVE from GOV**
- Duplicates 2.1 in Risk Management. The policy content belongs in RSK. Governance's role is just signing off on it, which the platform's sign-off mechanism handles.

**Old 1.5 — ISMS Scope Definition → REMOVE from GOV**
- Duplicates 2.6 in Risk Management. Same logic — scope definition is operational, sign-off is governance.

### Requirements to KEEP (genuinely unique to management):

| New code | Old code | Title | Law | Rationale |
|---|---|---|---|---|
| 1.1 | 1.3 | Management Cybersecurity Training | §38(3) BSIG / Art. 20(2) | Unique to GF members, every 3 years, can't be auto-derived |
| 1.2 | 1.6 | Roles & Responsibilities | §30(1) BSIG / Art. 20(1) | Who does what — CISO appointment, RACI matrix |
| 1.3 | 1.7 | Budget Allocation | §38(1) BSIG / Art. 20(1) | Prove resources exist for cybersecurity |
| 1.4 | 1.8 | Personal Liability Acknowledgment | §38(2) BSIG / Art. 20(1) | Each GF member signs — non-waivable liability |

### Implementation Status: ✅ DONE
- [x] Schema: `requirement_assignment` junction table (assignment = sign-off)
- [x] Seed: 8 → 4 requirements (1.1 Training, 1.2 Roles, 1.3 Budget, 1.4 Liability)
- [x] Backend: `signOff` checks assignment table, multi-assign support
- [x] Frontend: assignment-based sign-off progress in RequirementDetail
- [x] DB indexes: `idx_user_company`, `idx_category_framework`, `idx_framework_active`
- [x] SSR waterfall elimination on all 3 compliance pages
- [x] Legal references populated in seed data
- [x] Pushed to main: `040ff50`

---

## Category 2: Risk Management (§30(2) Nr. 1 BSIG / Art. 21(2)(a) NIS2)

**The law:** "Konzepte in Bezug auf die Risikoanalyse und Sicherheit für Informationssysteme" — concepts for risk analysis and information system security.

**Why it matters:** This is the FOUNDATION category. Every other NIS2 measure (incident response, supply chain, crypto, access control) depends on first knowing your risks. BSI expects a complete risk management cycle: define scope → identify assets → assess risks → treat → accept residual → review.

### Key legal sources
- **§30(2) Nr. 1 BSIG** — risk analysis concepts
- **Art. 21(2)(a) NIS2** — policies on risk analysis and IS security
- **CIR 2024/2690 Annex Section 2** — granular risk management requirements (EU Commission Implementing Regulation, legally binding for DCI entities, authoritative reference for all others)
- **BSI 200-3** — risk analysis methodology (de facto standard for German companies)
- Links: [NIS2 Art. 21](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html) · [§30 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__30.html) · [CIR Annex](https://advisera.com/cir-2024-2690/technical-and-methodological-requirements-referred-to-in-article-2-of-this-regulation/)

### Design principle: Policy LAST, sign-off after all items

The IS Policy (old 2.1) is a management commitment document that summarizes the company's approach to information security. You can't write a meaningful policy without first knowing your scope, assets, risks, and treatment plan. The practical flow:

1. Do the work (scope → assets → classification → methodology → assessment → treatment)
2. Write the policy based on what you found
3. Sign off on it

**Category-level sign-off:** The IS Policy requirement is the LAST item in the category. Once all preceding requirements are completed, the user writes/uploads the policy and signs off — confirming "this is our approach." The policy sign-off effectively serves as the category completion sign-off.

### Advisera comparison: documents vs. structured forms

**Advisera's NIS2 Documentation Toolkit** (77 Word/Excel templates, $999) maps the same CIR requirements to downloadable document templates. Their mandatory risk management documents:

| Advisera Document | CIR ref | Their approach | Our approach |
|---|---|---|---|
| Policy on Information System Security | CIR 1.1 | Word template, fill in blanks | Structured form fields |
| Risk Assessment Methodology | CIR 2.1 | Word template with scales/matrix | Form: methodology, scales, thresholds, acceptance criteria |
| Risk Assessment Table | CIR 2.1 | Excel spreadsheet | Form metadata + platform risk module / file upload |
| Risk Treatment Table | CIR 2.1 | Excel spreadsheet | Merged into register (same artifact) |
| Risk Treatment Plan | CIR 2.1 | Word template | Merged into register |
| Acceptance of Residual Risks | CIR 2.1 | Word template for CEO signature | Platform sign-off (`requiredSignOffRole: "ceo"`) |
| IT Asset Register | CIR 12 | Excel spreadsheet | Form metadata + platform asset module / file upload |
| Asset Management Procedure | CIR 12 | Word template | **MISSING — need to add** |
| Information Classification Policy | CIR (DCI) | Word template | Form: levels, labeling method, handling rules |
| Corrective Action Procedure | CIR 2.3.3 | Word template | **Belongs in Cat 7** |

**Key insight:** Advisera treats each obligation as "here's a Word doc, fill it out." We want the SAME content captured as structured form fields — exportable, translatable, auditable, comparable across companies. We are NOT replacing documents with uploads — we're replacing documents with structured data entry that IS the document.

**Where uploads still make sense:** The risk register and asset inventory can be massive (147 risks, 1325 assets in our seed data). These are managed in external tools (CMDB, GRC tool, Excel) or in our platform's operational modules. For these, we capture metadata in form fields (total count, critical count, tool used, last update) and accept a file upload as evidence. The form fields give us structured data; the upload gives BSI the full artifact.

**What Advisera has that we're missing:**
- Asset Management Procedure (CIR 12) — how assets are managed, not just listed
- Corrective Action Procedure + Form (CIR 2.3.3) — belongs in Cat 7
- Advisera's 16-step implementation puts assets INSIDE risk assessment (step 7: "identifies assets, threats, and vulnerabilities"), not as a separate step. Their scope definition is implicit in the IS Policy.

### BSI 200-3 process flow (the correct order)

The BSI 200 standards form one pipeline. Each step feeds the next:

```
BSI 200-1 (ISMS)           BSI 200-2 (Methodology)       BSI 200-3 (Risk Analysis)
────────────────            ────────────────────           ─────────────────────────
1. Scope Definition         3. Asset Inventory             5. Threat Identification
   What systems,               List ALL target objects:       47 BSI elementary threats
   locations, services         servers, apps, processes,      + org-specific scenarios
   are in/out                  rooms, network segments
                                                           6. Risk Assessment
2. Risk Assessment          4. Protection Requirements        Likelihood × Impact
   Methodology                 Assign each asset:             → Risk Matrix (4×4)
   Scales, thresholds,         Normal / High / Very High      → Low/Med/High/Very High
   acceptance criteria
                                                           7. Risk Treatment
                                                              Avoid / Reduce / Transfer / Accept
                                                              → Plan with owners + deadlines

                                                           8. Residual Risk Acceptance
                                                              CEO signs off
```

**You can't skip ahead:** You can't assess risks (step 6) to assets you haven't listed (step 3). You can't list assets outside your scope (step 1). You can't treat risks (step 7) without assessment criteria (step 2). The order is not arbitrary.

### Current state: 10 requirements — code analysis

**29 of 39 company data fields are orphaned** — they exist in `seed-company-data.ts` but have no intake form field in `RSK_SCHEMA` to render them. Users see skeleton forms or no form at all.

| Req | Title | Intake fields | Company data fields | Gap |
|-----|-------|:---:|:---:|:---:|
| 2.1 | Information Security Policy | 0 | 4 | 4 orphaned |
| 2.2 | Risk Assessment Methodology | 1 (methodology enum) | 4 | 3 orphaned |
| 2.3 | Asset Inventory | 0 | 4 | 4 orphaned |
| 2.4 | Risk Register | 2 (riskTool, riskRegisterUploaded) | 4 | 2 orphaned |
| 2.5 | Risk Treatment Plan | 0 | 6 | 6 orphaned |
| 2.6 | Scope Definition | 2 (criticalSystemsCount, allSystemsCovered) | 6 | 4 orphaned |
| 2.7 | Annual Risk Review | 2 (lastAssessmentDate, reviewCycle) | 4 | 2 orphaned |
| 2.8 | Risk Acceptance Sign-Off | 2 (riskAppetiteDocumented, riskAcceptanceThreshold) | 2 | 0 |
| 2.9 | OT Asset Inventory | 0 | 3 | 3 orphaned |
| 2.10 | Data Classification Scheme | 1 (dataClassificationLevels) | 2 | 1 orphaned |

### Issues found per requirement

**2.1 — Information Security Policy** (P0, document)
- Law: CIR 1.1 — policy with objectives, resources, roles, retention, monitoring, management approval date
- Code: Zero form fields. Company data (`policyVersion`, `lastApprovalDate`, `communicationMethod`, `coversOt`) is orphaned
- **Move to LAST position** — policy summarizes everything, sign-off = category completion

**2.2 — Risk Assessment Methodology** (P1, document, one-time)
- Law: CIR 2.1.2 — methodology, risk tolerance, criteria, threat analysis approach, CTI integration
- Code: 1 dropdown (`methodology` enum). Company data has scales, thresholds, OT flag — orphaned
- **Underdone.** Need: likelihood scale, impact scale, acceptance threshold, who can accept which level

**2.3 — Asset Inventory** (P1, technical, ongoing)
- Law: CIR 12 + BSI 200-2 — complete register with protection requirements, managed by procedure
- Code: Zero form fields. Company data (`totalAssets`, `criticalAssets`, `lastInventoryUpdate`, `inventoryTool`) orphaned
- **Merge with 2.9 (OT).** One inventory, conditional OT section

**2.4 — Risk Register** (P1, technical)
- Law: CIR 2.1.1 + 2.1.2 — risks identified, assessed, treated, documented with owners/deadlines
- Code: 2 fields (`riskTool`, `riskRegisterUploaded`). Company data has counts — orphaned
- **Merge with 2.5 (Treatment).** One artifact. Need: total risks, critical count, treatment breakdown, coverage %

**2.5 — Risk Treatment Plan** (P1, document)
- Law: Same CIR 2.1.2 as 2.4
- Code: Zero form fields. Rich company data (`mitigateCount: 118`, `acceptCount: 21`, etc.) — orphaned
- **Redundant.** Merge into 2.4. Treatment IS part of the register

**2.6 — Scope Definition** (P0, document, one-time)
- Law: §28 BSIG (who), §30(1) (what systems), CIR Art. 2(2) (document exclusions)
- Code: 2 fields (`criticalSystemsCount`, `allSystemsCovered`). Company data has locations, system types, exclusions, threat sources — orphaned
- **Move to FIRST position.** Need: locations, systems in scope, exclusions with justification, network diagram upload

**2.7 — Annual Risk Review** (P2, document)
- Law: CIR 2.1.4 — review at least annually + after significant incidents/changes
- Code: 2 fields (`lastAssessmentDate`, `reviewCycle`). Company data has review results — orphaned
- **Move to Cat 7.** This is effectiveness assessment, not risk management setup. Merge into Management Review (7.5)

**2.8 — Risk Acceptance Sign-Off** (P1, sign-off)
- Law: CIR 2.1.1, §38(1) BSIG — management body must accept residual risks
- Code: 2 fields (`riskAppetiteDocumented`, `riskAcceptanceThreshold`). OK
- **Keep.** Needs `requiredSignOffRole: "ceo"`. Second-to-last (before policy)

**2.9 — OT Asset Inventory** (P1, technical, ongoing)
- Law: Same as 2.3 — §30(2) "gefahrenübergreifend" (all-hazards) means IT+OT in one framework
- Code: Zero form fields. Company data (`otAssetCount`, segmentation, Purdue model) — orphaned
- **Redundant.** Merge into 2.3. Conditional section: "Do you operate OT/SCADA/ICS systems?"

**2.10 — Data Classification Scheme** (P1, document, one-time)
- Law: BSI 200-2 protection requirements + CIR (DCI-mandatory Information Classification Policy)
- Code: 1 dropdown (`dataClassificationLevels`). Company data has labeling method — orphaned
- **Underdone.** Need: classification levels with names, handling rules per level, labeling method

### Legal gaps — things we're MISSING entirely

| Gap | CIR source | What's needed |
|-----|-----------|---------------|
| **Compliance monitoring + reporting** | CIR 2.2.1-2.2.3 | Regular compliance review system, management reports on security status |
| **Independent review** | CIR 2.3.1-2.3.4 | Impartial audit of risk management approach specifically (Cat 7 has general audit but CIR 2.3 is risk-specific) |
| **Incident-triggered review** | CIR 2.1.4 | Risk reassessment after significant incidents — not captured anywhere |
| **Proportionality documentation** | CIR Art. 2(2) | "Comply or explain" — if you skip something, document why |
| **Cyber threat intelligence** | CIR 2.1.2 | Risk analysis must use CTI. Company data has `threatSources` but it's orphaned |
| **Asset management procedure** | CIR 12 | HOW assets are managed (lifecycle, disposal, updates), not just listed |

### Risk Management vs. Cybersecurity — why Cat 2 exists separately

Risk management (Cat 2) is the ANALYSIS — "what can go wrong and how bad is it?"
Cybersecurity (Cats 3-12) is the RESPONSE — the actual measures you implement BECAUSE of the risks you found.

```
Cat 2:  "Ransomware could encrypt our fleet system. Likelihood: 4, Impact: 5, Risk: Critical."
Cat 3:  "Therefore we have an incident response plan for ransomware."
Cat 4:  "Therefore we vet our software suppliers."
Cat 5:  "Therefore we encrypt data at rest."
Cat 6:  "Therefore we enforce MFA and access control."
Cat 8:  "Therefore we do backup and disaster recovery."
```

§30(2) BSIG lists 10 measure areas. Nr. 1 (risk analysis) tells you WHERE the problems are. Nr. 2-10 tell you WHAT to do about them. Risk management is the foundation; everything else is built on top of it.

### Proposed restructure: 10 → 4

Following BSI 200-3 process flow + CIR mandatory documents + Advisera's mapping.
Methodology is independent (HOW you assess), then scope+assets are one thing (WHAT you're protecting), then assessment, then sign-off.

#### 2.1 — Risk Assessment Methodology
**Law:** CIR 2.1.2, §30(2) Nr. 1 BSIG, BSI 200-3
**Why first:** HOW you assess risks is independent of WHAT you assess. You decide "BSI 200-3 with 4×4 matrix" before scoping assets. And we can DEFAULT this to BSI 200-3 — 90% of German SMEs will just confirm.
**Default values (BSI 200-3):**
- `methodology: "bsi_200_3"` (pre-filled)
- `likelihoodScale: "4-level"` (selten / mittel / häufig / sehr häufig)
- `impactScale: "4-level"` (vernachlässigbar / begrenzt / beträchtlich / existenzbedrohend)
- `allHazardsConfirmed: true`

**Form fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `methodology` | enum | `bsi_200_3` | BSI 200-3 / ISO 31000 / OCTAVE / FAIR / custom |
| `methodologyType` | enum | `semi-quantitative` | qualitative / semi-quantitative / quantitative |
| `likelihoodScale` | enum | `4-level` | 3-level / 4-level / 5-level |
| `impactScale` | enum | `4-level` | 3-level / 4-level / 5-level |
| `riskAcceptanceThreshold` | string | `"Mittel oder darunter"` | e.g., "Score < 12" or "Medium or below" |
| `cisoAcceptanceLevel` | string | `"Mittel"` | Max risk level CISO can accept |
| `ceoAcceptanceLevel` | string | `"Hoch und darüber"` | Min risk level requiring CEO acceptance |
| `includesOt` | boolean | — | Methodology covers OT/ICS systems? |
| `allHazardsConfirmed` | boolean | `true` | Covers cyber + physical + environmental (§30(2) "gefahrenübergreifend") |
| `ctiSources` | multi-select | — | BSI Lagerbild / ENISA / Sector ISAC / commercial / internal (CIR 2.1.2) |
| `methodologyDocument` | file | — | Upload methodology document |

#### 2.2 — Asset Inventory, Scope & Classification
**Law:** CIR 12, CIR Art. 2(2), §28 BSIG, BSI 200-2
**Why combined:** Scope = "these locations and system types." Asset inventory = "here are the specific assets at those locations." Classification = "how sensitive is each." These are three zoom levels of the same question: WHAT are you protecting? For a 50-150 person company, "define scope", "list assets", and "classify them" happen in the same meeting. BSI 200-2 does them sequentially (Strukturanalyse → Schutzbedarfsfeststellung) but they produce one artifact.

**47 elementary threats:** When building the risk register (2.3), users are guided through BSI 200-3's 47 elementary threats (G 0.1 Feuer through G 0.47 Schädliche Seiteneffekte IT-gestützter Angriffe) as a checklist against their assets. Threats marked as applicable become rows in the risk register. The 47 threats live in a reference data file (`data/bsi/elementary-threats.ts`) used across the platform.

**Form fields:**

| Field | Type | Description |
|-------|------|-------------|
| `scopeLocations` | text[] | Locations covered (e.g., "Hamburg HQ", "Bremen DC") |
| `locationCount` | number | Total locations in scope |
| `scopeIncludes` | multi-select | it-systems / ot-systems / cloud-services / network-infra / endpoints / data-centers / third-party |
| `criticalServiceDescription` | text | Essential/important service provided (§28 BSIG entity classification) |
| `criticalSystemsCount` | number | Critical information systems in scope |
| `hasExclusions` | boolean | Any systems/locations excluded? |
| `exclusionJustification` | text | Why excluded (CIR Art. 2(2) "comply or explain" — mandatory if hasExclusions=true) |
| `totalAssets` | number | Total assets in scope |
| `criticalAssets` | number | Assets classified High or Very High |
| `inventoryTool` | enum | spreadsheet / cmdb / platform-module / grc-tool / other |
| `lastInventoryUpdate` | date | Last inventory update |
| `classificationLevels` | enum | 3-level (BSI: Normal/Hoch/Sehr Hoch) / 4-level / 2-level |
| `classificationLevelNames` | text | Level names (e.g., "Öffentlich, Intern, Vertraulich, Streng Vertraulich") |
| `labelingMethod` | enum | manual / automated / hybrid |
| `handlingRulesDocumented` | boolean | Handling rules defined per classification level? |
| `hasOtAssets` | boolean | Operates OT/SCADA/ICS systems? (conditional section) |
| `otAssetCount` | number | (conditional) OT asset count |
| `hasNetworkSegmentation` | boolean | (conditional) IT/OT networks segmented? |
| `purdueModelDocumented` | boolean | (conditional) OT architecture per Purdue model? |
| `hasNetworkDiagram` | boolean | Network diagram showing scope boundaries exists? |
| `networkDiagram` | file | Upload network diagram |
| `assetRegister` | file | Upload asset register (CSV/Excel/CMDB export) |

#### 2.3 — Risk Register & Treatment
**Law:** CIR 2.1.1 + 2.1.2, BSI 200-3 Steps 1-4
**Why combined:** The register and treatment plan are one artifact. Every risk register row has: threat, likelihood, impact, risk level, owner, treatment decision, measures, deadline. The CIR says "documenting chosen risk treatment measures in a risk treatment plan" — those are columns in the same spreadsheet.

**BSI 200-3 guided assessment:** Users are prompted to consider each of the 47 elementary threats against their assets from 2.2. The platform shows the threat list, the user marks applicable ones, assesses likelihood × impact using the methodology from 2.1, and records treatment decisions. The full risk register (potentially hundreds of rows) is managed in an external tool or the platform's risk module and uploaded as evidence.

**Form fields:**

| Field | Type | Description |
|-------|------|-------------|
| `riskTool` | enum | platform-module / grc-tool / spreadsheet / other |
| `totalRisks` | number | Total risks identified |
| `criticalRisks` | number | Risks rated High or Very High |
| `riskCoverage` | number | % of in-scope assets with assessed risks |
| `mitigateCount` | number | Risks being mitigated |
| `acceptCount` | number | Risks formally accepted |
| `transferCount` | number | Risks transferred (insurance, SLA) |
| `avoidCount` | number | Risks avoided (stopped the activity) |
| `verificationMethod` | enum | testing / audit / combined / other |
| `thirdPartyRisksIncluded` | boolean | Supplier/vendor risks assessed? (CIR 2.1.2) |
| `lastRegisterUpdate` | date | Last update to risk register |
| `riskRegister` | file | Upload risk register |

#### 2.4 — Risk Acceptance & IS Policy Sign-Off
**Law:** CIR 2.1.1 (residual risk acceptance), CIR 1.1 (IS policy), §38(1) BSIG (management must implement + oversee), §38(2) (personal liability)
**Why combined:** Risk acceptance and the IS policy are the same event — the Geschäftsleitung reviews everything done in 2.1-2.3, accepts the residual risk, and signs the IS policy that documents the approach. One requirement, dual purpose, CEO sign-off = category done.

**Prerequisite:** Cat 1 Req 1.1 (Management Training) must be completed first. §38(3) BSIG requires management to be trained before they can accept risks. Enforced via `requirementPrerequisite` table: `1.1 → 2.4`.

**Who must sign — "Geschäftsleitungen" (§38(1) BSIG):**

| Company form | Who signs | Law |
|---|---|---|
| GmbH | ALL Geschäftsführer | §35 GmbHG |
| AG | Vorstand (executive board) as a whole | §76 AktG |
| GmbH & Co. KG | GF of the Komplementär-GmbH | Managing partner entity |
| Single founder GmbH | The one Geschäftsführer | Just them |

Use `requirement_assignment` junction table: assign ALL GF members → all must sign → requirement complete only when all signed.

**Form fields:**

| Field | Type | Description |
|-------|------|-------------|
| `riskAppetiteDocumented` | boolean | Risk appetite and acceptance criteria documented? |
| `riskAcceptanceThreshold` | string | Threshold (should match 2.1, e.g., "Mittel oder darunter") |
| `residualRiskCount` | number | How many risks formally accepted |
| `highestAcceptedRiskLevel` | enum | low / medium / high |
| `acceptanceJustification` | text | Reasons justifying acceptance (CIR 2.1.2 mandatory) |
| `policyVersion` | string | IS policy version (e.g., "v1.0") |
| `policyApprovalDate` | date | Formal management approval date (CIR 1.1) |
| `communicationMethod` | enum | email / intranet / signed-acknowledgment / all-hands |
| `coversOt` | boolean | Policy covers OT systems? |
| `cir11Checklist` | multi-select | Confirm policy addresses: IS objectives / continuous improvement / resource allocation / roles & responsibilities / documentation retention / topic-specific policy references / monitoring indicators (CIR 1.1) |
| `policyDocument` | file | Upload IS policy document |
| **Platform sign-off** | — | `requiredSignOffRole: "geschaeftsfuehrung"`, ALL GF members must sign |

### Removed from Cat 2
- **Old 2.7 (Annual Risk Review)** → Cat 7 (Management Review). Ongoing review = effectiveness assessment
- **Old 2.9 (OT Assets)** → Merged into 2.2. One inventory, conditional OT section
- **Old 2.5 (Treatment Plan)** → Merged into 2.3. One artifact
- **Old 2.10 (Classification)** → Merged into 2.2. Classification IS protection requirement assignment
- **Old 2.1 (IS Policy)** → Merged into 2.4. Policy is the category completion document
- **Old 2.6 (Scope)** → Merged into 2.2. Scope IS the asset boundary definition

### Cross-category references + prerequisites
- **Cat 1 Req 1.1 (Training) → Cat 2 Req 2.4 (Sign-Off)**: §38(3) prerequisite. GF must be trained before they can accept risks. Seed into `requirementPrerequisite` table.
- **2.2 (Assets) ← Cat 1 old 1.5**: This is where old GOV 1.5 (ISMS Scope) lives now
- **2.4 (Policy) ← Cat 1 old 1.4**: This is where old GOV 1.4 (IS Policy) lives now
- **Old 2.7 → Cat 7**: Annual risk review merges into management review (7.5)
- **CIR 2.2 (Compliance monitoring)** → Cat 7 requirement
- **CIR 2.3 (Independent review)** → Cat 7 (internal audit)

### Implementation tasks

#### Code changes (Cat 2 restructure)
- [x] Rewrite `MOCK_RSK` in `seed-data.ts`: 10 → 4 requirements with new codes, descriptions, legal refs
- [x] Rewrite `RSK_SCHEMA` in `category-schemas.ts` with all new form fields (20 fields: 5+6+5+4)
- [x] Rewrite `CATEGORY_FIELD_MAPPING.RSK` for new requirement codes
- [x] Add BSI 200-3 defaults to `platform-defaults.ts` (methodology, 4-level scales, threshold)
- [x] Rewrite `seed-company-data.ts` RSK section for new field structure
- [x] Rewrite `seed-intake-data.ts` RSK section
- [x] Also fixed `seed-company-data.ts` GOV section (was still 8 entries, now 4)
- [x] Also fixed `seed-intake-data.ts` GOV section (was still old fields, now matches GOV_SCHEMA)
- [ ] Seed `requirementPrerequisite` row: 1.1 → 2.4
- [ ] Move old 2.7 (Annual Review) fields to Cat 7 schema

#### New reference data files
- [ ] Create `data/bsi/elementary-threats.ts` — 47 BSI 200-3 elementary threats (G 0.1 - G 0.47) with code, DE name, EN name, category (cyber/physical/environmental)
- [ ] Create `data/bsi/protection-levels.ts` — BSI 200-2 protection levels (Normal/Hoch/Sehr Hoch) with descriptions
- [ ] Create `data/bsi/risk-matrix.ts` — BSI 200-3 4×4 risk matrix with risk level definitions

#### Setup page + team page enhancements (separate from Cat 2)
- [ ] Setup: ask company legal form (GmbH, AG, GmbH & Co. KG, etc.)
- [ ] Setup: explain who counts as "Geschäftsleitung" based on legal form (§38 BSIG)
- [ ] Team page: when adding a user with role "geschaeftsfuehrung", auto-assign to requirements with `requiredSignOffRole: "geschaeftsfuehrung"`
- [ ] Default mapping: GF members → auto-assigned to 1.4 (Liability), 2.4 (Risk Acceptance + IS Policy)

### Implementation Status: ✅ Core restructure done (typecheck + build pass)

---

## Categories 3–12
- Status: Not yet started
