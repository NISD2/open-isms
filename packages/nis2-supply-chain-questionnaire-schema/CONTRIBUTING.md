# Contributing

Thanks for taking the time. This repo is small and opinionated. Read this once before opening a PR.

## What we accept

- **Corrections to `legalBasis`** — if you read a directive article differently, open a PR with the primary-source citation. Press articles, blog posts, and consultancy whitepapers are not enough on their own.
- **Localised string fixes** — typos, awkward German phrasing, terminology corrections. Native-speaker review preferred.
- **New fields** that map to a NIS2 article, a CIR section, an ENISA TIG section, or another EU instrument we don't currently cover. Open an issue first so we can discuss whether the field belongs in the questionnaire or at the contract level.
- **New translations** (FR, IT, ES, NL, PL, ...) — but only if you can commit to keeping them in sync. A stale translation is worse than no translation. The current locale schema is `{ en, de }`; extending it is a 2.0.0 breaking change.

## What we don't accept

- **AI-generated questionnaire content without disclosure.** If you used an LLM to draft new fields or translations, say so in the PR. We'll review more carefully.
- **Sector-specific obligations bolted onto the base 6 sections.** KRITIS-specific or sector-specific fields belong in a separate section that composes with the base.
- **Drift between the TS source and the bundled JSON.** CI runs `bun run check:json-in-sync` and will fail.
- **`as any` casts, non-null assertions (`!`), or `@ts-ignore`.** Fix the type, narrow the input, or open an issue.

## Local setup

```bash
git clone git@github.com:NISD2/nis2-supply-chain-questionnaire-schema.git
cd nis2-supply-chain-questionnaire-schema
bun install --no-save
bun test
bun run typecheck
bun run validate
```

## Editing fields

The TypeScript files in `src/fields/` are the source of truth. Do not edit `data/supply-chain-questionnaire.json` directly — it is regenerated.

```bash
# 1. Edit the relevant section file
$EDITOR src/fields/security-practices.ts

# 2. Regenerate the JSON artefact
bun run build:json

# 3. Verify everything is consistent
bun run typecheck
bun run validate
bun test
```

## PR checklist

Before requesting review:

- [ ] Tests pass (`bun test`)
- [ ] Typecheck passes (`bun run typecheck`)
- [ ] Schema validates (`bun run validate`)
- [ ] JSON artefact is in sync (`bun run check:json-in-sync`)
- [ ] Every new `legalBasis` cites an EU-level primary source (NIS2, CIR 2024/2690, ENISA TIG, GDPR, CRA) — no national-derivative citations
- [ ] Every new field has both `en` and `de` for `label` and `description`
- [ ] Bumped `VERSION` in `src/data.ts` if shipping (semver: minor for added fields, patch for wording, major for breaking changes)

## Releasing (maintainers only)

```bash
# 1. Bump VERSION + LAST_UPDATED in src/data.ts and "version" in package.json
# 2. Regenerate JSON
bun run build:json

# 3. Commit + tag
git commit -am "vX.Y.Z: <one-line summary>"
git tag vX.Y.Z
git push origin main --tags

# 4. Create release notes
gh release create vX.Y.Z --title "vX.Y.Z — <summary>" --notes "<changelog excerpt>"
```

## Reporting a regulatory change

If ENISA publishes a new TIG version, the NIS2 Directive is amended, or CIR 2024/2690 is updated, open an issue with:

- The publishing source (ENISA URL, EUR-Lex link)
- The published date
- A short summary of what changed and which fields are affected

We update on a best-effort schedule, faster if customers depend on the change.

## Not legal advice

This repository is structured guidance based on our reading of the NIS2 Directive, CIR 2024/2690, and ENISA Technical Implementation Guidance. It does not constitute legal advice. If you need that, hire counsel.
