# Contributing

Thanks for considering a contribution. This package is the canonical NIS2 + GDPR data model used in production by [nisd2.eu](https://www.nisd2.eu); changes need to be defensible against the underlying regulations.

## What lives here

- **`src/schema/`** — Drizzle table definitions for the GRC core (framework, requirement, supplier, asset, risk, incident).
- **`src/frameworks/`** — categories + requirements for NIS2 and GDPR.
- **`src/satisfaction-pairs.ts`** — bidirectional NIS2↔GDPR pairs that drive cross-framework attestation.
- **`src/mappings/nis2-gdpr.ts`** — article-level concept mapping.
- **`src/enums.ts`** — shared PG enums.
- **`REFERENCE.md`** — auto-generated browseable reference, regenerate with `bun run docs:reference`.

## Common changes

### Adding or correcting a satisfaction pair

Edit `src/satisfaction-pairs.ts`. Each entry is `[nis2Code, gdprCode, rationale]`. The rationale must defensibly explain why signing one regime's requirement implies the same operational evidence supports the other.

A pair is justified when:
- Both attestations rely on the same underlying rows (same supplier register, same asset inventory, same incident records).
- The legal scope of the linked requirement is fully covered by the source.

A pair is **not** justified when one regime requires something the other doesn't (e.g., GDPR DSAR has no NIS2 mirror and is intentionally unmapped).

### Adding a requirement

Edit the relevant framework file in `src/frameworks/`. Follow the existing `mkReq` factory pattern. Always cite a primary source (BSIG paragraph, CIR section, GDPR article) in `legalRef`.

### Adding a translation key for a requirement

Translations are not currently shipped from this package — they live in the consuming app's i18n. This may change in a future minor version.

### Correcting a typo in a code

Codes are part of the public API surface. Renaming a code is a **breaking change** and bumps the major version. Open an issue to discuss before submitting a PR.

## Workflow

```bash
bun install
bun run typecheck    # tsc --noEmit, must pass
bun run test         # vitest, integrity tests must pass
bun run build        # tsup, ESM + DTS
bun run docs:reference   # regenerate REFERENCE.md
```

Every PR must:
1. Pass `bun run typecheck`
2. Pass `bun run test` (6 integrity tests minimum, more welcome)
3. Regenerate `REFERENCE.md` if data changed (`bun run docs:reference` and commit the result)
4. Add a CHANGELOG entry under the current pending version
5. Cite primary sources for any new requirement or pair (BSIG, CIR, GDPR article, ENISA guidance)

## What not to PR

- Frameworks beyond NIS2 + GDPR — defer until a clear need (we plan to add ISO 27001 + national transpositions over time).
- App-specific tables — this is the GRC core. App-only tables (auth, billing, audit log, notifications) belong in the consumer's app, not here.
- Translations of regulatory text — read the regulations in their authoritative language and keep field labels in English to avoid divergence.

## Reporting an issue

For incorrect mappings or factually wrong legal references, open an issue with:
- The requirement code or pair
- The current value
- The correct value with a primary-source citation

For security issues, see [`SECURITY.md`](./SECURITY.md).
