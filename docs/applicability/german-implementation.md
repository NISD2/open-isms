# German NIS2 Implementation — NIS2UmsuCG / BSIG

## Timeline

| Date | Event |
|------|-------|
| 14 Dec 2022 | NIS2 Directive (EU) 2022/2555 published in EU Official Journal |
| 16 Jan 2023 | NIS2 enters into force at EU level |
| 17 Oct 2024 | Original EU transposition deadline (Germany missed it) |
| 17 Apr 2025 | Deadline for Member States to establish entity registries |
| 13 Nov 2025 | Bundestag passes NIS2UmsuCG |
| 21 Nov 2025 | Bundesrat approves |
| 5 Dec 2025 | Published in Bundesgesetzblatt |
| **6 Dec 2025** | **New BSIG enters into force — all obligations apply immediately** |
| 6 Jan 2026 | BSI registration portal goes live |
| **6 Mar 2026** | **Deadline for BSI registration (3 months after entry into force)** |
| ~2028 | KRITIS operators: first evidence of compliance due (3 years after entry into force) |
| Every 3 years | Ongoing KRITIS audit cycle thereafter |

**No transition period.** Risk management measures, incident reporting, and management
liability applied from the day the law entered into force (6 Dec 2025). The BSI has
indicated it will not launch extensive enforcement immediately, but expects "demonstrable
implementation progress" from day one.

---

## Entity Categories (German Terms)

Germany uses different terminology than the EU directive:

| EU Term | German Term | Abbreviation |
|---------|-------------|-------------|
| Essential entity | Besonders wichtige Einrichtung | bwE |
| Important entity | Wichtige Einrichtung | wE |
| Critical infrastructure operator | Betreiber kritischer Anlagen | KRITIS-Betreiber |

The hierarchy: **KRITIS ⊂ bwE ⊂ all NIS2 entities**

---

## Penalties (Section 65 BSIG)

### By Entity Category

| Category | Maximum Fine | Turnover-Based Alternative |
|----------|-------------|--------------------------|
| **Besonders wichtige Einrichtungen** | EUR 10,000,000 | 2% of worldwide annual group turnover (for companies > EUR 500M revenue) |
| **Wichtige Einrichtungen** | EUR 7,000,000 | 1.4% of worldwide annual group turnover (for companies > EUR 500M revenue) |

### By Violation Type

| Violation | Maximum Fine |
|-----------|-------------|
| Failure to implement cybersecurity measures (§30) | EUR 10M / EUR 7M (by category) |
| Failure to report incidents (§31) | EUR 10M / EUR 7M (by category) |
| Non-compliance with BSI directives | EUR 10M / EUR 7M (by category) |
| KRITIS: failure in critical component reporting (§41(5)) | EUR 5,000,000 |
| KRITIS: failure in audit evidence procedures | EUR 2,000,000 |
| KRITIS: incomplete audit documentation | EUR 1,000,000 |
| Registration violations, failure to notify BSI of changes | EUR 500,000 |
| Failure to provide defect remediation evidence | EUR 500,000 |
| Obstruction of BSI inspections/orders | EUR 500,000 |
| Contact accessibility failures | EUR 100,000 |

### Sector-Specific

| Sector | Maximum Fine |
|--------|-------------|
| IT system manufacturers | EUR 2,000,000 |
| Telecommunications providers (> 100K customers) | EUR 2,000,000 |
| Digital service providers | EUR 2,000,000 |

---

## Management Liability (Section 38 BSIG — Geschaeftsfuehrerhaftung)

This is one of the most impactful provisions of the German implementation.

### Three Core Duties

1. **Billigung (Approval)**: Management must formally approve cybersecurity risk
   management measures per Section 30 BSIG.
2. **Uberwachung (Oversight)**: Active monitoring of implementation — not passive
   awareness. Management must verify that measures are actually being implemented.
3. **Schulung (Training)**: Mandatory personal participation in cybersecurity training
   at minimum every 3 years. **This duty cannot be delegated.**

### Who is Covered

The statute applies to **all management bodies**:

| Role | Legal Basis |
|------|-------------|
| AG Vorstandsmitglieder (stock corporation board) | §93 AktG |
| GmbH Geschaftsfuhrer (limited liability company directors) | §43 GmbHG |
| Komplementare (general partners in KG/KGaA) | Applicable partnership law |
| Faktische Geschaftsfuhrer (de facto managers) | General corporate law |
| Foundation trustees (Stiftungsvorstande) | Foundation law |
| Association leaders (Vereinsvorstande) | Association law |

### Liability Scope

- Executives are personally liable **to their own company** when they culpably violate duties.
- Liability arises from general corporate law principles.
- **Delegation of operational tasks is permitted** (e.g., to an Informationssicherheits-
  beauftragter / ISB), but **strategic responsibility and oversight remain with management**.
- Management cannot claim lack of technical knowledge as defense.

### Settlement/Waiver Restrictions

Section 38 BSIG **explicitly prohibits** contractual liability waivers by shareholders
that are "grossly disproportionate to existing uncertainty regarding rights." A
Gesellschafterversammlung cannot simply waive the Geschaftsfuhrer's liability for
NIS2 breaches.

### D&O Insurance

- D&O insurance can mitigate financial exposure but does not eliminate statutory obligations.
- Separate cyber insurance addresses breach damages.
- Neither policy removes the requirement to fulfill approval, monitoring, and training duties.

### Practical Scenario

> IT department reports critical security gaps to the Geschaftsfuhrung. Management
> decides to delay fixes for cost reasons. A ransomware attack occurs three months later,
> causing EUR 2M in damages. Management is personally liable to the company for the EUR 2M
> because they (a) failed to approve adequate measures and (b) failed to act on oversight
> information — both duties under Section 38.

---

## Incident Reporting (Sections 31-34 BSIG — Meldepflichten)

All besonders wichtige and wichtige Einrichtungen must report **erhebliche
Sicherheitsvorfalle** (significant security incidents) to the BSI.

### Three-Stage Reporting

| Stage | Deadline | Content |
|-------|----------|---------|
| **Erstmeldung / Fruhwarnung** (Early warning) | **24 hours** after becoming aware | Whether the incident is suspected to be caused by unlawful/malicious acts; whether it could have cross-border impact |
| **Aktualisierte Meldung** (Updated notification) | **72 hours** after becoming aware | Severity assessment, impact assessment, indicators of compromise, root cause (if available) |
| **Abschlussmeldung** (Final report) | **1 month** after the incident | Detailed description, root cause, mitigation measures, preventive steps, cross-border impact |

### What Counts as "Significant" (erheblich)

A security incident qualifies when it either:
- Has caused or is capable of causing **severe operational disruption** or **financial
  losses** for the entity, OR
- Has affected or is capable of affecting **other natural or legal persons** by causing
  considerable material or immaterial damage.

### Additional Rules

- BSI may request **interim reports** between the 72-hour update and 1-month final report.
- **KRITIS operators** must additionally specify which critical infrastructure and
  services are affected.
- BSI may **direct customer notifications** for significant breaches.
- Finance, IT, Digital Services: **immediate notification of potentially affected customers**
  with countermeasure information may be required.
- Reporting channel: **BSI Portal** (operational since January 6, 2026).

---

## Audit and Evidence Requirements (Nachweispflichten)

### KRITIS Operators (Section 39 BSIG)

- Must demonstrate compliance with Sections 30 (risk management), 31 (reporting), and
  38 (management training) through **audits, inspections, or certifications** every **3 years**.
- Initial evidence deadline: Set by BSI at registration (~2028, at least 3 years after entry into force).
- Previous KRITIS operators: BSI preserves their existing audit cycle (next deadline =
  at least 3 years after last submission under old Section 8a(3)).
- Must include **attack detection systems** (Angriffserkennung) in their measures.

### Besonders wichtige Einrichtungen (non-KRITIS)

- **No regular mandatory audit cycle**, but must maintain comprehensive documentation.
- BSI may conduct **proactive, ex-ante spot checks** and order evidence at any time.
- BSI uses **risk-based selection** for inspections (Section 61(4)).

### Wichtige Einrichtungen

- Must document implementation of all required measures.
- BSI inspections are **reactive/ex-post** only — triggered by incidents or justified
  suspicion of non-compliance.

### Acceptable Evidence Forms

- Internal or external audit reports
- Certifications (ISO 27001, BSI IT-Grundschutz, etc.)
- Comprehensive documentation of risk assessments, implemented measures, and effectiveness reviews

**Note**: ISO 27001 or IT-Grundschutz certification supports but does not guarantee compliance —
the BSIG requirements may go beyond standard certification scope.

---

## BSI Registration (Registrierungspflicht)

### Who Must Register

All entities classified as besonders wichtige Einrichtungen or wichtige Einrichtungen.

### Two-Step Process

1. **Step 1 — Mein Unternehmenskonto (MUK)**: Create an account via the ELSTER-based
   "Mein Unternehmenskonto" service. BSI recommended completion by end of 2025.

2. **Step 2 — BSI Portal**: Register via the BSI portal (went live **6 January 2026**).
   This portal serves as both registration platform and incident reporting channel.

### Deadline

**March 6, 2026** (3 months after the BSIG took effect on December 6, 2025).

### Required Information

- Entity name, address, contact details
- Relevant sector(s) and sub-sector(s)
- Member State(s) of operation
- IP address ranges
- Declaration of entity category (besonders wichtig / wichtig / Betreiber kritischer Anlagen)
- For KRITIS operators: specific ICT component types

### Self-Identification

- Registration is a **self-identification obligation** — no notification from BSI.
- Companies must determine themselves whether they are in scope.
- The BSI can also **order** a company to register if it determines the company falls within scope.
- BSI provides an official online "NIS-2-Betroffenheitsprufung" tool and a decision tree
  PDF for preliminary self-assessment.

---

## 10 Mandatory Risk Management Measures (Section 30 BSIG)

All besonders wichtige and wichtige Einrichtungen must implement these measures
(no transition period — effective since December 6, 2025):

1. **Risikoanalyse und Informationssicherheit** — Risk analysis and information systems security policies
2. **Bewaltigung von Sicherheitsvorfallen** — Incident handling procedures
3. **Business Continuity** — Backup management, disaster recovery, crisis management
4. **Lieferkettensicherheit** — Supply chain security (including assessment of all direct suppliers)
5. **Sicherheit bei Erwerb, Entwicklung, Wartung** — Security in acquisition, development, and maintenance of IT systems (including vulnerability management and disclosure)
6. **Wirksamkeitsbewertung** — Policies and procedures for assessing effectiveness of risk management measures
7. **Cyberhygiene und Schulungen** — Basic cybersecurity training and awareness practices
8. **Kryptographie** — Cryptography policies and procedures (including encryption where appropriate)
9. **Personalsicherheit, Zugriffskontrolle, Asset Management** — Personnel security, access control, asset management
10. **Multi-Faktor-Authentifizierung** — MFA, secured voice/video/text communication, secured emergency communication systems

---

## German-Specific Additions Beyond EU Minimum

| Addition | Description |
|----------|-------------|
| **Bundes-CISO (Section 48)** | Federal Chief Information Security Officer role — no EU requirement |
| **Critical components ban (Section 41)** | Federal government can prohibit use of critical IT components from certain manufacturers for national security |
| **Parallel KRITIS regime** | Germany maintains facility-based KRITIS thresholds (BSI-KritisV) alongside NIS2 entity classification |
| **KRITIS-Dachgesetz** | Separate physical resilience law (CER Directive implementation) advancing in parallel |
| **Sector-specific catalogs** | TKG (telecoms), EnWG (energy), DORA (financial) apply in addition to BSIG |
| **Siedlungsabfallentsorgung** | Municipal waste management has KRITIS-level treatment with facility thresholds |
| **Linked enterprise exception** | Subsidiaries with genuinely independent IT may be excluded from group-level size aggregation |
| **Negligible activity exception** | Section 28(3) — activities classified as "negligible" may be disregarded (legally undefined term) |

---

## Supervision Model

| Aspect | Besonders wichtig (bwE) | Wichtig (wE) |
|--------|------------------------|--------------|
| Supervision approach | **Proactive (ex-ante)** — BSI can audit, inspect, request info at any time | **Reactive (ex-post)** — action only when evidence of non-compliance emerges |
| Maximum fine | EUR 10M or 2% global turnover | EUR 7M or 1.4% global turnover |
| Audit requirements | Spot checks by BSI (risk-based) | Only on justified suspicion |
| KRITIS audit cycle | Every 3 years (if KRITIS operator) | N/A |
| Incident reporting | Same 24h/72h/1month | Same 24h/72h/1month |
| Risk management (§30) | Same 10 measures | Same 10 measures |
| Management liability (§38) | Same | Same |
| BSI registration | Mandatory by March 2026 | Mandatory by March 2026 |
| BSI enforcement powers | Can order specific security measures, ban components, temporarily ban management | Can order measures, but less intrusive powers |
