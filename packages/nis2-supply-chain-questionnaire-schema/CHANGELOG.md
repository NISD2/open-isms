# Changelog

All notable changes to this repository are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] — 2026-10-04

A legal and proportionality review against the primary texts: Directive (EU) 2022/2555, Implementing Regulation (EU) 2024/2690 (CIR), ENISA's Technical Implementation Guidance v1.0 and its ISO 27001 mapping table v1.2, the GDPR, the Cyber Resilience Act (CRA) and, for one German example, § 11 StBerG. Three findings drove it. The questionnaire assumed every supplier is a software vendor: a cleaning company with office keys was asked about pen tests and admin MFA, and nothing about keys. Ten citations pointed at the customer's own security measures as if they bound the supplier. And it asked too much where the law points nowhere, too little where it does (physical access, end of security updates, encryption beyond SaaS, certificate scope).

50 fields, from 59. Every supplier answers 21; the rest depend on what it reaches at its customers. A cleaning company with keys now sees 26 questions that fit it, a tax adviser 36, a managed service provider 40, a SaaS vendor 42.

### Added
- What the supplier reaches, asked of everyone and deciding the rest: `processesCustomerData` (data or documents, electronically or on paper), `accessesCustomerSystems`, `accessesCustomerPremises` (CIR §11.1.2(a): access by external entities such as suppliers).
- `premisesAccessManaged`, `premisesConductRules` (visible when `accessesCustomerPremises`): keys, badges and codes, and rules on site (CIR §11.2.2(d), §13.3.2(b); TIG §5.1 TIPS).
- `customerAccessPersonalMfa`, `customerAccessLogged` (visible when `accessesCustomerSystems`): personal accounts with a second factor, also for remote maintenance, and logging of administrative access (CIR §5.1.4(a), §11.3.2(a), §3.2.3(e)). They replace two questions asked of MSPs only.
- `encryptionAtRest`, `encryptionInTransit` (visible when `processesCustomerData`): asked of every supplier that holds customer data, not only SaaS.
- `confidentialityCommitted` (visible when the supplier reaches data, systems or premises): replaces the consultant NDA question; professional secrecy by law counts.
- `dataProcessingAgreement` (enum): available / independent controller / no personal data / no. Replaces the yes/no `dpaAvailable`, which told a tax adviser, a controller by statute, that it lacked a contract it cannot sign as a processor.
- `certificationDetails` (visible when `hasIso27001OrEquivalent`): standard, issuer, validity and scope. A certificate for another part of the business proves nothing.
- `vulnerabilityDisclosurePolicy` (visible when `isSaas` or `isOnPrem`): replaces the on-prem-only question; NIS 2 Art. 21(3) points at every direct supplier's vulnerabilities, and the CRA requires such a policy from 11 December 2027.
- `onPremSupportEnd`: until when security updates are supplied (CIR §6.1.2(b), CRA Art. 13(19)).
- `subprocessorRequirementsPassedOn` (the second half of CIR §5.1.4(g)) and `secureDevelopment` (CIR §5.1.2(a)).
- `iso27001` on every field but identity: ISO/IEC 27001:2022 Annex A controls, from ENISA's mapping table.
- `visibleWhen` accepts `{ anyOf: [...] }`; `isVisible(field, response)` and `conditionsOf(field)` are exported. Field type `domain`: a bare host name.

### Removed (BREAKING)
- Sections `pro_services` and `managed_services`, and `isProfessionalServices`: their questions now depend on what the supplier reaches, not on a label it gives itself.
- `tagline`, `description`: marketing text with no legal basis; `serviceDescription` carries what a customer needs.
- `bsiRegistrationId`: being registered does not show that the measures are in place.
- `usesAiSystems`, `providesSbomForAi`, `aiSbomUrl`: neither Art. 21(2)(d) nor TIG chapter 5 mentions AI. AI services belong in the subcontractor list.
- `incidentAssistanceCommitment`, `hasExitPlan`: contract negotiation items. Exit is now part of `dataReturnOnTermination`.
- `proServicesBackgroundCheckScope`, `managedSessionRecording`, `managedOnCall24x7`: against CIR §10.2.1 ("to the extent feasible") or large-enterprise terms for a small MSP.
- `saasHostingRegion`, `securityPolicyReviewedAnnually`, `hasCryptographyPolicy`, `hasPrivilegedAccessMgmt`, `hasAssetInventory`, `notifyOnLocationChange`: duplicates of other answers.
- Replaced, see Added: `dpaAvailable`, `saasEncryptionAtRest`, `saasEncryptionInTransit`, `onPremVulnerabilityDisclosurePolicy`, `managedPrivilegedAccessMgmt`, `proServicesNdaInPlace`, `proServicesCustomerPremisesPolicy`.

### Changed
- Citations corrected: `hasIso27001OrEquivalent` cited CIR §5.1.4(b), which is about the supplier's employees, now §5.1.2(a); `onPremSignedReleases` cited TIG §6.2, now CIR §6.6.1(c) and CRA Annex I Part II(7); identity fields cite CIR §5.2.
- Ten questions that cited the customer's own measures (NIS 2 Art. 21(2)(b), (c), (e), (h), (i), (j)) now lead with the supply chain point that makes the customer ask, and name the practice after it. A test keeps Art. 21(2) from standing first again.
- Gated by what the supplier reaches: the ISMS, certificate, vulnerability handling, incident plan, continuity plan and admin MFA questions (anything digital); `dataProcessingLocations` (customer data); `backgroundChecks` and `dataReturnOnTermination` (data, systems or premises); `hasPenetrationTestingProgram` (runs IT for customers).
- `incidentSlaHours`: the customer's 24-hour early warning applies to significant incidents and runs from becoming aware (Art. 23(4)(a)).
- `hasIso27001OrEquivalent`: counts ISO/IEC 27001 (also on the basis of IT-Grundschutz), BSI C5, TISAX, SOC 2 Type II, ISAE 3402 and European certificates, and only when their scope covers the service; no reference to any portal's upload tab.
- `dataReturnOnTermination`: also keys, badges, documents and accounts, and a usable documented format (CIR §5.1.2(d), vendor lock-in).
- `hasBusinessContinuityPlan`: includes backups kept apart and test-restored (CIR §4.2.1).
- Numbers the sources do not set are gone: annual training, annual or biennial pen tests, "SMS does not count", 30 days, three to five years, common RTO and patch values. `onPremPatchSlaCriticalHours` is optional.
- Labels a supplier can confirm or deny ("We ...") and German a Geschäftsführer reads without English terms.
- Reworded and new fields carry `en` and `de` only; the other locales fall back to English for them rather than keep a translation of text that no longer applies.

### Fixed
- `schema/supply-chain-questionnaire.schema.json` was an empty object: `zod-to-json-schema` predates zod 4. It is now generated by zod's own `z.toJSONSchema`, and a test fails if it is empty again.

### Migration
- A consumer that renders by `type` must handle `domain` (a plain text input will do) and `enum` (`dataProcessingAgreement`).
- A consumer that renders by `visibleWhen` must handle `anyOf` (use `isVisible`).
- A `dpaAvailable` answer maps to `dataProcessingAgreement`: true to `available`, false to `no`. The other replaced questions ask something broader than before, so their old answers do not carry over.
- Stored answers to removed fields stay where they are; nothing in the schema reads them.

## [3.1.0] — 2026-05-15

### Added
- **AI supply-chain disclosure block.** Three new fields covering the G7 / BSI / ACN / CISA "Software Bill of Materials (SBOM) for Artificial Intelligence — Minimum Elements" guideline published on 12 May 2026:
  - `profile.usesAiSystems` (boolean, required) — gates the AI block. Includes any AI / ML model the customer's data passes through, including third-party LLMs accessed via API.
  - `security_practices.providesSbomForAi` (boolean, optional, visible when `usesAiSystems = true`) — supplier states whether they publish an SBOM-for-AI per the G7 minimum elements.
  - `security_practices.aiSbomUrl` (url, optional, visible when `providesSbomForAi = true`) — public or customer-shared URL to the document.
- Legal basis anchored to **NIS2 Art. 21(2)(d) / ENISA TIG §5.1.2**. The G7 SBOM-for-AI guideline is referenced in the description as the recognised voluntary baseline, not as the legal authority — the underlying duty is supply-chain risk management; the G7 document operationalises one credible disclosure format.

### Migration
- Backward compatible. Existing supplier responses remain valid; new fields default to `null` until a supplier answers them. The `usesAiSystems` gate hides the entire AI block from suppliers that don't use AI.
- Consumers do not need to change anything. The visible-fields helper automatically skips the new conditional block based on the response state.

## [3.0.1] — 2026-04-28

### Changed
- **`dist/` is now committed to git.** Consumers no longer depend on the `prepare: tsc` lifecycle script running at install time, which was unreliable in some CI environments (notably Vercel) and caused consumer-side type resolution to break. The `prepare` script remains as a defence-in-depth.

### Reverted
- The literal-union schema refactor (briefly shipped in v3.0.0) is reverted. `z.nativeEnum(...)` is the right tool for `sectionSchema` / `fieldTypeSchema` — duplicating the enum values across a const + a literal union violated DRY. The original cause of the consumer-side type-resolution issue was the missing `dist/`, not `z.nativeEnum`'s `.d.ts` emit.

## [3.0.0] — 2026-04-28

### Changed (BREAKING)
- **Repository and package renamed.** `nis2-supply-chain-questionnaire` → `nis2-supply-chain-questionnaire-schema`. The `-schema` suffix clarifies what this package actually is: a data + schema artefact, not an app or runtime. Old GitHub URL auto-redirects.
- **Package name** is now `@nisd2/nis2-supply-chain-questionnaire-schema`. Code-level identifiers, exports, and field IDs are unchanged.
- Schema: replaced `z.nativeEnum(...)` with explicit `z.union([z.literal(...), ...])` for `sectionSchema` and `fieldTypeSchema`. The inferred TypeScript types are identical (`"profile" | "security_practices" | …`), but the emit through `.d.ts` is more deterministic — some downstream typecheckers (Turbopack on Vercel in particular) struggle to follow `z.nativeEnum`'s narrow union through compiled type declarations and end up treating consumer-side properties as `unknown`.

### Migration
- Update consumers: `@nisd2/nis2-supply-chain-questionnaire` → `@nisd2/nis2-supply-chain-questionnaire-schema`.
- Pin to `#v3.0.0` in `bun add github:...` install commands.

## [2.0.0] — 2026-04-28

### Removed (BREAKING)
- **`bsiBausteine` field removed from the schema.** The repo no longer publishes BSI Grundschutz Baustein tags. Rationale: ties an EU-level questionnaire to one member state's framework, defeating universal usability; BSI renumbered Bausteine in October 2025 (the v1.0 Lieferketten-Checkliste IDs no longer match), creating perpetual maintenance drift; and the Baustein labels added no value to actually using the questionnaire — the supplier's answer satisfies the EU obligation regardless of the national tag. Member-state national overlays belong in their own downstream extension repos.
- `data/bsi-lieferketten-mapping.md` removed.
- `scripts/generate-bsi-mapping.py` removed.
- `bun run generate:bsi-mapping` script removed.

### Fixed
- **Re-anchored 14 fields away from fabricated `CIR 2024/2690 §5.1.x` sub-letters.** CIR §5 is the supply-chain section only; non-supply-chain topics (incident handling, BCP, cryptography, privileged access, asset inventory, pen-testing) live in their own CIR sections. New citations point to the correct ENISA TIG sections (§3, §4, §6.5, §9, §11.3, §12.4, §1.1).
- **Re-anchored 9 BSI-cited technical fields** (SaaS encryption, MFA, RTO; on-prem signing/vuln-disclosure; pro-services NDA/access; managed-services privileged-access/session-recording/on-call) to NIS2 Art. 21(2) + ENISA TIG sections.
- `legalName`, `registeredAddress`, `country` no longer cited to `CIR 2024/2690 §5.2(a)` (which is "contact points"); now cite ENISA TIG §5.2 (the supplier register itself).
- `prepare: tsc` script (added in v1.4.1) ensures consumers installing from GitHub get a usable `dist/` build automatically.

### Changed
- README repositioned: explicitly EU-only, with a "what's deliberately out of scope" section explaining why national derivatives stay downstream.
- Test suite swap: removed BSI Baustein presence/regex tests; added a citation-provenance test that asserts every field cites an EU-level instrument and no field cites a banned national-derivative term.
- CONTRIBUTING.md updated to reflect EU-only scope.

### Migration
- Consumers depending on `field.bsiBausteine` need to remove that access — the property no longer exists.
- Consumers reading `data/supply-chain-questionnaire.json` directly: the same fields exist with the same IDs and types; only `legalBasis` strings have been updated and `bsiBausteine` arrays are gone.
- Consumers depending on the inverse mapping doc need to switch to a different source (BSI publishes its own Lieferketten-Checkliste; we no longer mirror it here).

## [1.4.2] — 2026-04-28

### Fixed
- `bsiBausteine` regex (`/^[A-Z]+(\.[0-9A-Z]+)+$/`) now anchors the tail correctly. The earlier pattern `/^[A-Z]+\.[0-9A-Z][0-9A-Z.]*$/` accepted trailing dots like `BES.A1.` Regression test added.

### Changed
- `examples/drizzle-storage-reference.ts` is now typechecked in CI via `tsconfig.examples.json` so it cannot rot. Added `drizzle-orm` as a dev dependency.
- README install command updated to v1.4.1 (was stale at v1.4.0).

## [1.4.1] — 2026-04-28

### Added
- `prepare: tsc` script so consumers installing from GitHub get a usable `dist/` build automatically.

## [1.4.0] — 2026-04-28

### Changed
- **Repository and package renamed.** `nis2-supplier-questionnaire` → `nis2-supply-chain-questionnaire`. The data this represents is the supply-chain due diligence form, which matches the NIS2 Art. 21(2)(d) "supply chain security" obligation language and the BSI Lieferketten-Checkliste terminology. Old GitHub URL auto-redirects; consumers should update package.json references when convenient.
- **Package name** is now `@nisd2/nis2-supply-chain-questionnaire`. Code-level identifiers (`supplierQuestionnaire`, `SupplierField`, `groupBySection`, `visibleFields`) are unchanged — they describe the supplier-facing artefacts in code, not the questionnaire's domain.
- Data file renamed: `data/supplier-questionnaire.json` → `data/supply-chain-questionnaire.json`. Same for `schema/`.
- README rewritten to lead with what the artefact is (an open data format), not how to use it.
- Test suite trimmed: removed checks that duplicate Zod's own validation; kept cross-reference, semantic, and helper-function tests; added a `visibleWhen.equals` type-match check.

### Migration
- Update your `package.json`: `@nisd2/nis2-supplier-questionnaire` → `@nisd2/nis2-supply-chain-questionnaire`.
- If you imported `data/supplier-questionnaire.json` directly, the new path is `data/supply-chain-questionnaire.json`.
- The Zod schema, exported helper functions, and field IDs are unchanged.

## [1.3.0] — 2026-04-28

### Added
- Test suite (`tests/invariants.test.ts`) covering field-ID uniqueness, enum validity, `visibleWhen` reference integrity, BSI Baustein regex format, locale completeness, and helper-function behaviour.
- Generated JSON Schema artefact at `schema/supplier-questionnaire.schema.json` for non-TS consumers (Python, Go, Excel, etc.) to validate responses without re-deriving rules.
- `CONTRIBUTING.md` with PR checklist, regulatory-change reporting flow, and release process.
- `SECURITY.md` — vulnerability reporting policy.
- Issue and pull-request templates under `.github/`.

### Changed
- CI now runs `bun test` on every push and pull request.
- README restructured with table of contents and a 30-second quickstart.

## [1.2.0] — 2026-04-28

### Changed
- **Source of truth inverted.** TypeScript files in `src/fields/<section>.ts` are now the source; `data/supplier-questionnaire.json` is generated from them via `bun run build:json`. This gives full type safety on enums and Baustein IDs while keeping the published JSON byte-stable for non-TS consumers.
- CI now runs `check:json-in-sync` to catch drift between TS source and the bundled JSON.
- README documents the new source layout and authoring workflow.

### Backwards compatibility
- Public package exports (`supplierQuestionnaire`, `groupBySection`, `visibleFields`, schemas, types) are unchanged.
- Consumers reading `data/supplier-questionnaire.json` directly continue to work.

## [1.1.0] — 2026-04-28

### Added
- `bsiBausteine` array on every field, citing the Bausteine of the [BSI NIS-2 Lieferketten-Checkliste v1.0 (5 June 2025)](https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/NIS-2/nis-2-lieferkette_grundschutz-checkliste.pdf) that the supplier's answer helps satisfy. 56 fields tagged across 46 unique Bausteine, 72 total mappings.
- Inverse Baustein → fields view at `data/bsi-lieferketten-mapping.md`, regenerated by `scripts/generate-bsi-mapping.py`.

### Backwards compatibility
- `bsiBausteine` is optional. v1.0.0 consumers continue to validate against v1.1.0 data.

## [1.0.0] — 2026-04-25

### Added
- Initial public release. 56 fields across 6 sections (`profile`, `security_practices`, `saas_technical`, `on_prem_technical`, `pro_services`, `managed_services`).
- Zod schema as runtime-validated source of truth.
- Anchored to NIS2 Art. 21(2), CIR 2024/2690 §5.1.x and §5.2, ENISA Technical Implementation Guidance v1.0, BSI IT-Grundschutz, GDPR Art. 28.
- Drizzle storage reference at `examples/drizzle-storage-reference.ts`.
- Form-rendering example at `examples/render-form.ts`.
- Dual licence: MIT for code, CC BY 4.0 for content.
