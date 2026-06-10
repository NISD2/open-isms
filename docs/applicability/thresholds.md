# NIS2 Size Thresholds, Special Cases, and Exclusions

## Size Thresholds

NIS2 uses the EU SME definition from Commission Recommendation 2003/361/EC.
The thresholds work as **OR** conditions between employee count and financial metrics,
but financial metrics require **BOTH** turnover AND balance sheet to be exceeded.

### Entity Classification by Size

| Classification | Employee Threshold | Financial Threshold | Notes |
|---------------|-------------------|-------------------|-------|
| **Large enterprise** | >= 250 employees | > EUR 50M annual turnover **AND** > EUR 43M annual balance sheet | Either employee OR financial threshold triggers classification |
| **Medium enterprise** | >= 50 employees (and < 250) | > EUR 10M annual turnover **AND** > EUR 10M annual balance sheet | Either employee OR financial threshold triggers classification |
| **Small enterprise** | < 50 employees | <= EUR 10M turnover **AND** <= EUR 10M balance sheet | Generally out of NIS2 scope (unless special case) |

### How Classification Maps to NIS2 Entity Types

| Company Size | Annex I Sector | Annex II Sector |
|-------------|---------------|-----------------|
| **Large** | **Besonders wichtig** (essential) | **Wichtig** (important) |
| **Medium** | **Wichtig** (important) | **Wichtig** (important) |
| **Small** | Out of scope* | Out of scope* |

*Unless a special case applies (see below).

### Critical Calculation Rules

**1. Enterprise-level calculation (Verbundene Unternehmen)**
- Employee count, turnover, and balance sheet are calculated at the **entire enterprise level**
  including all associated enterprises per Commission Recommendation 2003/361/EC.
- **Foreign subsidiaries and parent companies count**: Even associated companies not
  operating in Germany or the EU are included.
- A small German subsidiary of a global corporation will typically be pulled into scope
  based on the parent's consolidated figures.

**2. German exception for independent IT**
- A subsidiary may be excluded from aggregation if it has genuinely independent IT
  systems, components, and processes under legal, economic, and factual circumstances.
- This is the key German deviation from the standard EU SME definition.

**3. Overall turnover applies (not segment turnover)**
- The company's **overall** turnover and balance sheet apply — not just figures from the
  critical business segment.
- Exception: Activities classified as "negligible" (geringfugig) may be disregarded per
  Section 28(3) BSIG. However, "negligible" is legally undefined, creating uncertainty.

---

## Special Cases (In Scope Regardless of Size)

These entities are covered by NIS2 **regardless** of employee count or financial metrics:

### Always Essential (Besonders wichtig)

| Entity Type | Legal Basis | German Term |
|-------------|-------------|-------------|
| Qualified trust service providers (qTSP) | Art. 3(1)(f) NIS2 | Qualifizierter Vertrauensdiensteanbieter |
| TLD name registries | Art. 3(1)(e) NIS2 | Top-Level-Domain-Namenregister |
| DNS service providers (not root name server operators) | Art. 3(1)(d) NIS2 | DNS-Diensteanbieter |
| KRITIS operators (critical facility per BSI-KritisV) | §28(1) BSIG | Betreiber kritischer Anlagen |
| Central government entities | Art. 3(1)(g) NIS2 | Bundesverwaltung |
| Entities identified as critical under CER Directive (EU 2022/2557) | Art. 3(1)(c) NIS2 | Als kritisch eingestufte Einrichtung |
| Sole provider of an essential service in a Member State | Art. 3(1)(b) NIS2 | Einziger Erbringer eines wesentlichen Dienstes |
| Entities whose disruption could cause significant systemic risk | Art. 3(1)(b) NIS2 | Systemisch bedeutende Einrichtung |
| Entities previously identified as OES under original NIS Directive | Art. 3(1)(h) NIS2 | Fruhere wesentliche Betreiber (Bestandsschutz) |

### Essential When Medium+ Size

| Entity Type | Legal Basis |
|-------------|-------------|
| Providers of public electronic communications networks | Art. 3(1)(a) NIS2 |
| Providers of publicly available electronic communications services | Art. 3(1)(a) NIS2 |

### Always Important (Wichtig)

| Entity Type | Legal Basis |
|-------------|-------------|
| Non-qualified trust service providers | Art. 3(2) NIS2 |
| Domain name registration service providers | Art. 2(2)(b) NIS2 |

---

## Exclusions (Not in NIS2 Scope)

### EU-Level Exclusions (Article 2(7) NIS2)

| Excluded Entity Type | Reason |
|---------------------|--------|
| National security entities | Sovereign function exemption |
| Defence entities | Sovereign function exemption |
| Public security entities | Sovereign function exemption |
| Law enforcement (prevention, investigation, detection, prosecution) | Sovereign function exemption |
| Judiciary | Explicitly excluded from "public administration entity" definition |
| Parliaments | Explicitly excluded from "public administration entity" definition |
| Central banks | Explicitly excluded from "public administration entity" definition |
| Root name server operators | Explicitly excluded from DNS service provider scope |

### Regulatory Overlap Exclusions

| Excluded Entity Type | Reason |
|---------------------|--------|
| Financial entities subject to DORA (Reg. (EU) 2022/2554) | NIS2 does not apply regarding incident reporting and risk management where DORA already applies |
| Entities subject to sector-specific legislation deemed equivalent | Member States may adopt sector-specific rules with equivalent or stronger effect |

### German-Specific Exclusions

| Excluded Entity Type | Reason |
|---------------------|--------|
| Municipal institutions (Kommunen) | Generally excluded from BSIG scope |
| Federal authorities and public-law IT service providers | Receive broad exemptions from management training/monitoring obligations (some cybersecurity obligations still apply) |

---

## Classification Examples

### Example 1: Mid-size Manufacturing Company
> **Acme Maschinenbau GmbH** — 120 employees, EUR 25M turnover, EUR 18M balance sheet.
> Manufactures industrial machinery (NACE C28).
>
> - Sector: Annex II — Manufacturing (Machinery C28) ✓
> - Size: Medium (>= 50 employees) ✓
> - Classification: **Wichtige Einrichtung** (important)
> - Max fine: EUR 7M or 1.4% global turnover
> - Supervision: Reactive (ex-post)

### Example 2: Large Energy Utility
> **Stadtwerke Grossstadt AG** — 2,500 employees, EUR 800M turnover.
> Operates electricity distribution network + district heating.
>
> - Sector: Annex I — Energy (Electricity + District heating) ✓
> - Size: Large (>= 250 employees) ✓
> - KRITIS check: Serves > 500,000 persons → KRITIS operator ✓
> - Classification: **Betreiber kritischer Anlagen** (KRITIS + besonders wichtig)
> - Max fine: EUR 10M or 2% global turnover
> - Supervision: Proactive (ex-ante) + mandatory audit every 3 years

### Example 3: Small IT Company
> **SecureTech GmbH** — 30 employees, EUR 5M turnover.
> Provides managed security services (MSSP) to enterprise clients.
>
> - Sector: Annex I — ICT Service Management (MSSP) ✓
> - Size: Small (< 50 employees, < EUR 10M turnover) ✗
> - Special case: No (MSSP is not size-independent)
> - Classification: **Not in scope** (below medium threshold)
> - Note: May still face NIS2 requirements contractually via supply chain obligations

### Example 4: Global Cloud Provider (German subsidiary)
> **CloudCorp Germany GmbH** — 80 employees in Germany,
> parent company has 50,000 employees and EUR 30B global turnover.
>
> - Sector: Annex I — Digital Infrastructure (Cloud computing) ✓
> - Size: Calculated at group level → Large (parent has >= 250 employees) ✓
> - Classification: **Besonders wichtige Einrichtung** (essential)
> - Max fine: EUR 10M or 2% global turnover (of the group!)

### Example 5: DNS Service Provider
> **TinyDNS UG** — 3 employees, EUR 500K turnover.
> Operates authoritative DNS for 200+ domains.
>
> - Sector: Annex I — Digital Infrastructure (DNS)
> - Size: Irrelevant — DNS providers are size-independent
> - Classification: **Besonders wichtige Einrichtung** (essential)
> - Note: Even a one-person DNS provider is in scope

### Example 6: Regional Hospital
> **Kreiskrankenhaus Musterstadt** — 400 employees, EUR 60M turnover.
> 200-bed general hospital.
>
> - Sector: Annex I — Health (Healthcare provider) ✓
> - Size: Large (>= 250 employees) ✓
> - KRITIS check: < 30,000 full inpatient cases/year → Not KRITIS
> - Classification: **Besonders wichtige Einrichtung** (essential, non-KRITIS)
> - Max fine: EUR 10M or 2% global turnover
> - Supervision: Proactive (BSI spot checks possible)

### Example 7: Automotive Supplier
> **PrecisionParts GmbH** — 600 employees, EUR 120M turnover.
> Manufactures transmission components (NACE C29).
>
> - Sector: Annex II — Manufacturing (Motor vehicles C29) ✓
> - Size: Large (>= 250 employees) ✓
> - Classification: **Wichtige Einrichtung** (important)
> - Note: Even though the company is large, Annex II large → important (not essential)
> - Max fine: EUR 7M or 1.4% global turnover

### Example 8: Law Firm
> **Kanzlei Recht & Partner** — 200 employees, EUR 50M turnover.
> Provides legal services.
>
> - Sector: Not in any Annex I or Annex II sector ✗
> - Classification: **Not in scope**
> - Note: Even though the firm is large, legal services are not a covered sector

### Example 9: Chemical Distributor
> **ChemDistri GmbH** — 55 employees, EUR 80M turnover, EUR 12M balance sheet.
> Distributes chemical substances.
>
> - Sector: Annex II — Chemicals ✓
> - Size: Medium (>= 50 employees) ✓
> - Classification: **Wichtige Einrichtung** (important)
> - Note: High turnover doesn't make them essential — Annex II entities max out at important

### Example 10: Financial Institution (DORA overlap)
> **Investmentbank AG** — 1,000 employees, EUR 500M turnover.
> Credit institution, already subject to DORA.
>
> - Sector: Annex I — Banking ✓
> - DORA applicability: Yes — already complying with DORA ✓
> - Classification: Still classified as **besonders wichtig**, BUT NIS2 incident
>   reporting and risk management requirements are displaced by DORA
> - Must still register with BSI
