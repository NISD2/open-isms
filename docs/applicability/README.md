# NIS2 Applicability Assessment

## Purpose

This module determines whether a company falls under the NIS2 directive (EU 2022/2555)
and its German implementation (NIS2UmsuCG / BSIG). The output is a classification:

- **Not in scope** — no NIS2 obligations
- **Wichtige Einrichtung** (important entity) — baseline NIS2 obligations
- **Besonders wichtige Einrichtung** (essential entity) — stricter supervision + higher penalties
- **Betreiber kritischer Anlagen** (KRITIS operator) — essential + additional audit/evidence obligations

This assessment replaces the manual "Betroffenheitsprufung" that companies must perform
themselves (there is no notification from BSI — self-identification is legally mandatory).

## Decision Tree

The assessment follows a strict 7-step decision tree. This maps directly to the
3-5 step form we will build.

```
Step 1: EXCLUSION CHECK
  Is the entity in an excluded category?
  (defense, national security, law enforcement, judiciary, parliament,
   central bank, German municipality)
  → YES → NOT IN SCOPE. Stop.
  → NO  → Continue to Step 2.

Step 2: SPECIAL CASE CHECK (size-independent entities)
  Is the entity any of the following?
  - Qualified trust service provider (qTSP)
  - TLD name registry
  - DNS service provider (not root name server operator)
  - Provider of public electronic communications network (medium+)
  - Provider of publicly available electronic communications service (medium+)
  - Entity identified as critical under CER Directive (EU 2022/2557)
  - KRITIS operator (Betreiber kritischer Anlagen per BSI-KritisV)
  - Sole provider of an essential service in a Member State
  - Central government entity
  → YES → IN SCOPE regardless of size. Classify per rules below. Skip to Step 5.
  → NO  → Continue to Step 3.

Step 3: SECTOR CHECK
  Does the entity operate in an Annex I or Annex II sector?
  (See sectors.md for the complete taxonomy)
  → NO  → NOT IN SCOPE. Stop.
  → YES → Record which Annex (I = high criticality, II = other critical).
           Continue to Step 4.

Step 4: SIZE CHECK
  Does the entity meet the medium enterprise threshold?
  (>= 50 employees  OR  (> EUR 10M turnover AND > EUR 10M balance sheet))

  IMPORTANT: Size is calculated at the ENTIRE enterprise level including
  associated/group companies per Commission Recommendation 2003/361/EC.
  German exception: linked enterprises with genuinely independent IT
  infrastructure may be excluded from aggregation.

  → NO  → NOT IN SCOPE (unless Member State designates otherwise or
           supply chain obligations apply contractually). Stop.
  → YES → Continue to Step 5.

Step 5: CLASSIFY — Essential or Important?
  A) Is the entity a KRITIS operator (critical facility per BSI-KritisV,
     typically >= 500,000 served persons)?
     → YES → BETREIBER KRITISCHER ANLAGEN (also besonders wichtig). Stop.

  B) Is the entity in a special-case category from Step 2?
     → Classify per special case rules (see thresholds.md). Stop.

  C) Is the entity a LARGE enterprise in an ANNEX I sector?
     (>= 250 employees  OR  (> EUR 50M turnover AND > EUR 43M balance sheet))
     → YES → BESONDERS WICHTIGE EINRICHTUNG (essential). Stop.

  D) Otherwise:
     → WICHTIGE EINRICHTUNG (important).
     (This covers: medium Annex I, medium Annex II, large Annex II)

Step 6: OBLIGATIONS SUMMARY
  Based on classification, present:
  - Applicable penalty ceiling
  - Supervision model (proactive vs reactive)
  - Audit/evidence requirements
  - Incident reporting obligations (same for all)
  - Management liability (same for all)
  - BSI registration deadline (March 6, 2026)

Step 7: NEXT STEPS
  - Register at BSI portal
  - Implement Section 30 BSIG measures (10 mandatory areas)
  - Assign management responsibility (Section 38)
  - Set up incident reporting capability
```

## Documents in This Directory

| File | Contents |
|------|----------|
| [sectors.md](./sectors.md) | Complete Annex I + II sector taxonomy with sub-sectors, entity types, NACE codes, and examples |
| [thresholds.md](./thresholds.md) | Size criteria, special cases (size-independent), exclusions, entity classification rules |
| [german-implementation.md](./german-implementation.md) | Germany-specific: BSIG, penalties, management liability, incident reporting, audit, timeline |
| [form-design.md](./form-design.md) | How to translate this into a 3-5 step self-assessment form in the app |

## Key Numbers

| Metric | Value |
|--------|-------|
| Total affected companies in Germany | ~29,500-30,000 |
| Essential entities (besonders wichtig) | ~8,250 |
| Important entities (wichtig) | ~21,600 |
| KRITIS operators (subset of essential) | ~2,000 |
| Previously regulated (old KRITIS regime) | ~4,500 |
| Sectors (Annex I + II) | 18 total (11 + 7) |

## Legal References

- **EU**: Directive (EU) 2022/2555 (NIS2), adopted 14 Dec 2022
- **DE**: NIS-2-Umsetzungs- und Cybersicherheitsstarkungsgesetz (NIS2UmsuCG)
- **DE**: Gesetz uber das Bundesamt fur Sicherheit in der Informationstechnik (BSIG), revised
- **BSI-KritisV**: KRITIS facility thresholds (unchanged by NIS2)
- **Commission Recommendation 2003/361/EC**: EU SME definition (size thresholds)
- **Directive (EU) 2022/2557**: CER Directive (critical entities resilience)
- **Regulation (EU) 2022/2554**: DORA (financial entities — NIS2 does not apply where DORA applies)
