# Changelog

## 0.10.0 - 2026-06-02

### Added
- `nis2-gdpr.ts` mapping expanded from 7 rows to 12 rows, anchored to primary EU sources verified verbatim against EUR-Lex.
- **NIS 2 Art. 35 ↔ GDPR Art. 4(12), Art. 33, Art. 55, Art. 56, Art. 58(2)(i)** — the directive-level explicit cross-reference. Where an essential or important entity's infringement of NIS 2 Art. 21 or 23 can entail a personal data breach, the competent authority must inform the GDPR supervisory authority. Where the DPA imposes an Art. 58(2)(i) GDPR fine, NIS 2 cannot impose an Art. 34 NIS 2 fine for the same conduct (built-in non-bis-in-idem).
- **NIS 2 Art. 21(1) ↔ GDPR Art. 32(1)** — verbatim language overlap. Both use "appropriate technical and organisational measures", "state of the art", "cost of implementation".
- **NIS 2 Art. 21(2)(f) ↔ GDPR Art. 32(1)(d)** — effectiveness testing (regular assessment of TOMs).
- **NIS 2 Art. 21(2)(g) ↔ GDPR Art. 39(1)(b)** — cyber hygiene + staff training (distinct from Art. 20(2) management training).
- **Negative mapping for GDPR Art. 30** — explicitly flagged as NOT a supplier register. Art. 30 GDPR is the controller's own RoPA; the correct supply-chain anchor is Art. 28 GDPR (processor). Defensive entry to prevent re-introduction of this common error.

### Changed
- `LinkType` enum expanded from 3 values to 7: `directive_explicit`, `verbatim_language`, `shared_data`, `parallel_workflow`, `structural_overlap`, `no_mapping`, `informational`. The first two and the last (`no_mapping`) are new.
- `MappingRow` interface gains three optional fields: `eurLexCitation` (anchor to EUR-Lex), `nis2RecitalRef`, `gdprRecitalRef`.
- Source comment updated from vague "EDPB guidelines" to specific primary citations (EUR-Lex CELEX 32022L2555 Art. 35, CELEX 32016R0679 Art. 28/30/32/33/39, ENISA TIG v1.0 June 2025, EDPB-EDPS Joint Opinion 4/2026).
- `findByGdprArticle()` now matches via `.includes()` to handle rows that cite multiple GDPR articles in one row (e.g. the Art. 35 row).

### Added (helpers)
- `findByLinkType(linkType)` — query rows by link type, useful for surfacing the `directive_explicit` and `no_mapping` rows specifically.

### Why this matters
- The 7-row mapping was missing the directive-level cross-reference (Art. 35) — the only NIS 2 article that explicitly names GDPR provisions. Any pre-0.10 consumer claiming "NIS 2 / GDPR overlap" should cite Art. 35 first.
- The `no_mapping` row for GDPR Art. 30 is defensive: this is the most common mapping error in the wild (treating RoPA as a supplier register). Marking it explicitly stops future contributors from re-introducing it.
- The `verbatim_language` link type captures the strongest substantive overlap (Art. 21(1) ↔ Art. 32(1)) which was previously implicit in the per-sub-letter rows.

### Sources verified verbatim against
- [Directive (EU) 2022/2555 (NIS 2) — EUR-Lex](https://eur-lex.europa.eu/eli/dir/2022/2555/oj) — Art. 21, Art. 23, Art. 35, Recitals 106, 108
- [Regulation (EU) 2016/679 (GDPR) — EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) — Art. 4(12), 28, 30, 32, 33, 34, 39, 55, 56, 58(2)(i)
- ENISA Technical Implementation Guidance v1.0 (June 2025)
- EDPB-EDPS Joint Opinion 4/2026 on Cybersecurity Act 2 + NIS 2 amendments

## 0.9.0 - 2026-05-13

### Changed
- `seedFramework` is now upsert-only. It no longer deletes existing categories or requirements before re-seeding; it matches by natural key (framework code, category slug, requirement code) and updates metadata in place. Foreign-key references from operational tables (sign-offs, assignments, audit history) are preserved across re-runs.
- Re-seeding a framework is now safe in any environment, including production. Earlier callers gated the seed with `NODE_ENV !== "production"` because the destructive path could cascade-delete user data; that guard is no longer needed.

### Why this matters
- A framework rewrite (renamed slug, new category, restructured requirement codes) used to be a destructive operation that could only run on a dev DB. Now the same script evolves prod metadata without touching live data.
- Orphan handling is deliberate: requirements that disappear from the spec are NOT auto-deleted. Removing a requirement remains a manual curation step that should run only after confirming no live sign-offs reference it.

## 0.8.0 - 2026-05-08

### Added
- `equivalenceKindEnum` pg enum with values `equivalent` and `overlapping`.
- `equivalenceKind` column on `requirement_satisfaction` (default `overlapping`, not null, indexed). Non-destructive migration: existing rows keep the safe default.
- Optional 4th element on the `SatisfactionPair` tuple: `kind?: "equivalent" | "overlapping"`. Pairs that name the same underlying artefact (same supplier register, same incident row, same methodology, same final report) are tagged `equivalent`. All others stay `overlapping`.
- 16 pairs across the four binary intersections tagged `equivalent` based on rationale wording. The rest of the 38-pair set remains `overlapping`.
- `linkSatisfactionPairs` now writes the 4th tuple element to the new column and updates existing rows on re-seed, so the package stays the single source of truth for both the rationale and the equivalence classification.
- Integrity test asserts every `equivalent` pair's rationale carries shared-artefact wording (same, share, shared, reuse, same underlying), keeping the data set honest.

### Why this matters
- Two failure modes the old single-hop design could not handle: (1) a chain X-eq-Y-eq-Z where signing X should credit Z because all three reference one artefact; (2) a chain X-overlap-Y-eq-Z where signing X must NOT credit Z because the X-Y overlap is only partial. The `equivalenceKind` column gives consumers the metadata they need to BFS the graph safely.
- Direct credit is unchanged: signing any X still credits every direct neighbour regardless of kind, because the rationale on every pair justifies a one-hop attestation. The change only affects transitive composition.

## 0.7.0 - 2026-05-13

### Added
- 10 new cross-framework satisfaction pairs that fill the 4-way overlap landscape:
  - AI Act <-> GDPR: AI-RSK.1 <-> G-TOM.1, AI-DOC.1 <-> G-ROP.1, AI-INC.1 <-> G-BRC.1 (3 new, total 5)
  - CRA <-> NIS 2: CRA-INC.3 <-> 3.5, CRA-MFG.1 <-> 2.1, CRA-MFG.2 <-> 2.4 (3 new, total 9)
  - CRA <-> AI Act: CRA-INC.1 <-> AI-INC.1, CRA-DOC.1 <-> AI-DOC.2 (2 new, total 4)
  - CRA <-> GDPR: CRA-ESS.1 <-> G-TOM.1, CRA-VLN.1 <-> G-BRC.1 (2 new, the first GDPR <-> CRA pairs)
- New `craGdprSatisfactionPairs` const array.
- Integrity tests cover the new pair set (12 tests, all pass).

Direct propagation can now traverse single-step links across all four frameworks. Sign once on a NIS 2 risk methodology requirement and the matching GDPR Art. 32, AI Act Art. 9, and CRA Art. 13 obligations all complete in one go.

## 0.6.0 - 2026-05-13

### Added
- Generic seeder at `@nisd2/grc-data-model/seed`. `seedFramework(db, spec)` upserts a framework, its categories, and its requirements into a Postgres database; `linkSatisfactionPairs(db, pairs)` inserts cross-framework satisfaction pairs. Both are idempotent and scoped strictly to the rows they own.
- `FrameworkCode` type derived from the `frameworkEnum` pg enum values, so callers cannot pass an unknown code.
- `SeedDb` type alias for any Drizzle PgDatabase instance.

Consumer apps no longer need to hand-roll the framework-row plumbing. Example usage and full surface documented in `src/seed.ts`. The previous app-side `seed-aiact-cra.ts` script (~190 lines) now reads as ~70 lines of thin caller.

## 0.5.0 - 2026-05-13

### Added
- EU AI Act framework (Regulation (EU) 2024/1689): 10 categories, 24 requirements covering literacy (Art 4), prohibited practices (Art 5), inventory and classification (Art 6, 25, 26), risk management (Art 9), fundamental rights impact assessment (Art 27), human oversight (Art 14), transparency (Art 50), incident reporting (Art 73), technical documentation (Annex IV), GPAI obligations (Art 51-55).
- EU Cyber Resilience Act framework (Regulation (EU) 2024/2847): 10 categories, 20 requirements covering manufacturer obligations (Art 13), essential cybersecurity requirements (Annex I Part I), vulnerability handling (Annex I Part II), active-exploitation reporting (Art 14), conformity assessment (Art 24, 27), technical documentation (Annex VII), support period (Art 13(8)), SBOM, importer and distributor duties (Art 18, 19), open-source steward role (Art 24).
- Cross-framework satisfaction pairs: AI Act and NIS 2 (7 pairs), AI Act and GDPR (2 pairs), CRA and NIS 2 (6 pairs), CRA and AI Act (2 pairs).
- Two new framework enum values: `eu_ai_act`, `eu_cra`.
- Generic `SatisfactionPair` tuple now supports any two-framework pairing. Combined export `allSatisfactionPairs`.
- Integrity tests cover both new frameworks and all four new satisfaction-pair sets (11 tests total).

## 0.4.0 — 2026-05-09

### Added
- `assetSupplierOffering` table — bilateral asset×supplier-relationship row with service-type branch fields (saas / on_prem / pro_services / managed) for hosting region, SBOM provenance, NDA, privileged-access management, etc.
- `assetServiceTypeEnum` (saas / on_prem / pro_services / managed).

Both were previously in the consumer app despite FK-ing into `asset` and `supplier` (which already lived in this package). Relocated to keep bilateral GRC data with its peers; consumers see no behavior change.

## 0.3.0 — 2026-05-05

### Removed
- Supplier-portal-specific columns from `incident` (`customer_relationship_id`, `broadcast_status`, `broadcast_sent_at`, `broadcast_count`) and `asset` (`customer_relationship_id`, `service_type`, `service_description`, `data_processing_locations`, `saas_hosting_region`, `on_prem_*`, `pro_services_*`, `managed_*`). These were consumer-app-specific and didn't belong on a generic GRC schema.
- `assetServiceTypeEnum` and `supplierPublicationBroadcastStatusEnum` (consumed only by the removed columns).
- Cross-table FK constraints from incident/asset to supplier (no longer needed).

Consumers who used these fields should add their own join tables in their app.

## 0.2.0 — 2026-05-05

### Added
- Drizzle table definitions for the GRC core: `complianceFramework`, `requirementCategory`, `requirement`, `requirementPrerequisite`, `requirementSatisfaction`, `supplier`, `asset`, `risk`, `riskAsset`, `riskSupplier`, `incident`.
- Framework metadata for NIS2 (12 categories, 49 requirements) and GDPR (5 categories, 7 requirements).
- 11 NIS2↔GDPR satisfaction pairs with rationale.
- Article-level NIS2↔GDPR mapping (`/mappings/nis2-gdpr`).
- Integrity tests covering pair-code references, duplicate codes, slug uniqueness.

### Removed
- Zod-only scaffolds (`/ropa`, `/dpa`, `/toms`, `/supplier`, `/asset`, `/risk`, `/incident`) that described tables that didn't exist anywhere. Drizzle definitions now serve as the source of truth; Zod schemas can be derived via drizzle-zod when needed.
- 21 app-specific enums (Stripe billing, sales CRM, AI feature flags, app's notification system, app-only operational tables) that didn't belong in a shared GRC schema.

### Changed
- Cross-boundary FK constraints on package tables (e.g. `supplier.company_id`) are no longer declared in the package; the consuming app adds them via its own migration.

## 0.1.0 — 2026-04-30

Initial scaffold.
