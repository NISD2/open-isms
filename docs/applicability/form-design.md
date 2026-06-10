# NIS2 Applicability Self-Assessment — Form Design

## Goal

A 3-5 step form that tells a user whether their company falls under NIS2 and, if so,
what their classification is. This replaces the BSI's own "Betroffenheitsprufung" tool
with a better UX that feeds directly into our compliance platform.

The output is:
- Classification: not_in_scope | wichtig | besonders_wichtig | kritis
- Applicable sectors and sub-sectors
- Penalty ceiling
- Key obligations summary
- CTA: start compliance assessment or register with BSI

---

## Form Steps

### Step 1: Exclusion Check

**Question**: "Is your organization any of the following?"

Checkboxes (multi-select):
- [ ] Defence / national security entity
- [ ] Law enforcement agency
- [ ] Judiciary / court
- [ ] Parliament or legislative body
- [ ] Central bank (e.g., Bundesbank)
- [ ] Municipal institution (Kommune)
- [ ] None of the above

**Logic**:
- If any exclusion is checked (except "none") → **Not in scope**. Show result immediately.
- If "None of the above" → Continue to Step 2.

**UX note**: Most users will click "None of the above" instantly. This step exists for
correctness and to handle the rare edge case. Keep it quick.

---

### Step 2: Sector Selection

**Question**: "What sector(s) does your company operate in?"

Two-tier selection: first pick the sector, then pick the specific sub-sector(s).
Allow multiple sectors (a company can operate in multiple NIS2 sectors).

**Annex I — Sectors of High Criticality**:

| Sector | Sub-sectors |
|--------|------------|
| Energy | Electricity, District heating/cooling, Oil, Gas, Hydrogen |
| Transport | Air transport, Rail, Water/maritime, Road (ITS) |
| Banking | Credit institutions |
| Financial markets | Trading venues, Central counterparties |
| Health | Hospitals/clinics, Pharma (NACE C21), Medical devices, EU reference labs |
| Drinking water | Water supply and distribution |
| Wastewater | Collection, disposal, treatment |
| Digital infrastructure | IXP, DNS, TLD registry, Cloud, Data centres, CDN, Trust services, Telecom networks, Telecom services |
| ICT service management | Managed service providers (MSP), Managed security service providers (MSSP) |
| Public administration | Federal government entities |
| Space | Ground-based infrastructure |

**Annex II — Other Critical Sectors**:

| Sector | Sub-sectors |
|--------|------------|
| Postal/courier | Postal and courier services |
| Waste management | Waste collection, treatment, disposal |
| Chemicals | Manufacturing, production, distribution (NACE C20) |
| Food | Wholesale, industrial production, processing |
| Manufacturing | Medical devices, Computers/electronics (C26), Electrical equipment (C27), Machinery (C28), Motor vehicles (C29), Other transport equipment (C30) |
| Digital providers | Online marketplaces, Search engines, Social networks |
| Research | Applied research organizations (not universities) |

**Logic**:
- If no sector selected → **Not in scope**. Show result.
- If sector selected → Record which Annex (I, II, or both). Continue to Step 3.

**UX notes**:
- Show a searchable dropdown or card-based selector grouped by Annex.
- Include brief descriptions / examples under each sub-sector to help users identify themselves.
- Allow "I'm not sure" option → shows a helper with NACE codes and examples.
- Tag each sector with its Annex (I or II) visually.

---

### Step 3: Special Cases Check

**Question**: "Does any of the following apply to your organization?"

Checkboxes (multi-select):
- [ ] We are a qualified trust service provider (qTSP)
- [ ] We operate a TLD name registry (e.g., .de, .com)
- [ ] We provide DNS services (authoritative or recursive)
- [ ] We operate critical infrastructure classified under BSI-KritisV (KRITIS)
- [ ] We are the sole provider of an essential service in Germany
- [ ] We were previously identified as an Operator of Essential Services (OES) under NIS1
- [ ] None of the above

**Logic**:
- If any special case checked → **In scope regardless of size**. Skip Step 4.
  - qTSP, TLD, DNS, KRITIS, sole provider, OES → **Besonders wichtig** (essential)
  - KRITIS specifically → **Betreiber kritischer Anlagen**
- If "None" → Continue to Step 4.

**UX notes**:
- Show tooltips explaining each category (most users won't know what a qTSP is).
- If "KRITIS" is selected, add a sub-question about which KRITIS sector and whether they
  serve >= 500,000 persons.

---

### Step 4: Company Size

**Question**: "What is the size of your organization?"

Three input groups:

1. **Employee count** (number input)
   - Label: "Total number of employees (FTE, including all group companies)"
   - Helper: "Include employees of parent companies, subsidiaries, and associated
     enterprises unless they have fully independent IT infrastructure."

2. **Annual turnover** (number input, in EUR millions)
   - Label: "Annual turnover of the entire enterprise group (EUR)"
   - Helper: "Use worldwide consolidated turnover, not just German operations."

3. **Annual balance sheet total** (number input, in EUR millions)
   - Label: "Annual balance sheet total of the entire enterprise group (EUR)"
   - Helper: "Use worldwide consolidated balance sheet."

Optional checkbox:
- [ ] Our German entity has fully independent IT systems from the parent group
  (If checked, only use the German entity's own figures.)

**Logic**:

```
IF employees >= 250 OR (turnover > 50M AND balance_sheet > 43M):
  size = "large"
ELSE IF employees >= 50 OR (turnover > 10M AND balance_sheet > 10M):
  size = "medium"
ELSE:
  size = "small" → NOT IN SCOPE. Show result with supply chain note.
```

Then classify:
```
IF size == "large" AND has_annex_i_sector:
  → BESONDERS WICHTIGE EINRICHTUNG
ELSE:
  → WICHTIGE EINRICHTUNG
(All medium entities = wichtig. Large Annex II entities = also wichtig.)
```

---

### Step 5: Results

Show a clear result card with:

#### If NOT IN SCOPE:
- Clear "Not in scope" status
- Brief explanation of why (no covered sector / below size threshold)
- Note about supply chain: "Even if your company is not directly in scope, you may
  face NIS2 requirements through contracts with in-scope customers."
- CTA: "Want to prepare anyway? Start a voluntary assessment."

#### If IN SCOPE:

**Classification card:**
- Entity type badge: wichtig / besonders wichtig / KRITIS
- Applicable sector(s)
- Maximum penalty: EUR X million or X% of global turnover

**Obligations summary:**
| Obligation | Details |
|-----------|---------|
| BSI Registration | By March 6, 2026 via BSI portal |
| Risk Management | 10 mandatory measures (Section 30 BSIG) |
| Incident Reporting | 24h / 72h / 1 month cascade to BSI |
| Management Liability | Personal liability for Geschaftsfuhrung/Vorstand (Section 38) |
| Management Training | Mandatory cybersecurity training every 3 years |
| Audit (KRITIS only) | Evidence of compliance every 3 years |
| Supervision | Proactive (bwE) or Reactive (wE) |

**CTA**: "Start your NIS2 compliance assessment" → feeds into the main compliance flow.

---

## Data Model Integration

The applicability assessment maps directly to existing schema fields:

| Form Output | DB Field | Table |
|-------------|----------|-------|
| Selected sector | `company.sector` | `company` |
| Selected sub-sector | `company.sub_sector` | `company` |
| Entity classification | `company.entity_type` | `company` (enum: essential / important / kritis) |
| Employee count | `company.employee_count` | `company` |
| Annual revenue | `company.annual_revenue` | `company` |
| Global turnover | `company.global_turnover` | `company` |

The classification also determines which requirements apply via:
- `requirement.applies_to_essential`
- `requirement.applies_to_important`
- `requirement.applies_to_kritis`
- `requirement.sector_specific` (array of sector codes)

---

## Implementation as a Framework Module

This could be implemented as a framework in the existing multi-framework architecture:

**Option A: Standalone pre-assessment (recommended)**
- New route: `/applicability` (public, no auth required — this IS the top-of-funnel)
- Independent of the compliance assessment
- Result feeds into company setup (`/setup`) if user decides to proceed
- Could be the landing page CTA: "Check if NIS2 applies to you — free, 2 minutes"

**Option B: Framework module (like NIS2, DSGVO)**
- Add `applicability` to the `frameworkEnum`
- 1 category with 3-5 requirements (the form steps)
- Uses the same SchemaForm pipeline
- Heavier, but consistent with existing architecture

**Recommendation**: Option A. The applicability check is a funnel tool, not a compliance
exercise. It should be fast, public, and friction-free. The compliance framework kicks in
after the user knows they're in scope.

---

## Sector Data Structure

For the sector selector, we need a structured data file. Suggested shape:

```typescript
type NIS2Sector = {
  id: string;              // e.g., "energy"
  annex: "I" | "II";
  name: { en: string; de: string };
  subSectors: {
    id: string;            // e.g., "energy_electricity"
    name: { en: string; de: string };
    description: { en: string; de: string };
    naceCode?: string;     // e.g., "C26"
    entityTypes: string[]; // for tooltip/description
    examples: string[];    // real company examples
    sizeIndependent?: boolean;
    defaultClassification?: "essential" | "important";
  }[];
};
```

This data lives as a static constant (not in DB) since it's regulatory and doesn't change
per-company. It drives the form UI and the classification logic.

---

## Form Flow Diagram

```
[Landing Page]
    |
    v
[/applicability]
    |
    v
Step 1: Exclusion Check ──── excluded ──→ "Not in scope" result
    |
    not excluded
    |
    v
Step 2: Sector Selection ──── no sector ──→ "Not in scope" result
    |
    sector(s) selected
    |
    v
Step 3: Special Cases ──── special case ──→ Skip to Step 5 (auto-classify)
    |
    no special case
    |
    v
Step 4: Company Size ──── small ──→ "Not in scope" result (+ supply chain note)
    |
    medium or large
    |
    v
Step 5: Results ──→ Classification + Obligations + CTA
    |
    v
[/setup] ──→ Start compliance assessment
```
