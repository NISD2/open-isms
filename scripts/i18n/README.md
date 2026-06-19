# i18n translation pipeline

Generates next-intl message translations for the locale expansion plan.
Source of truth for the *strategy* behind this lives in the private notebook:
`NIS2/2026-06-19-i18n-language-expansion-assessment.md`.

## Locked decisions (2026-06-19)

- **Source locale:** `en` (most complete; cleaner machine-translation source
  into Romance/Slavic languages than the German compounds).
- **Wave 1 targets:** `fr`, `it`, `es`, `pl` — the four largest non-DACH,
  non-English-operating markets in scope.
- **Wave 2 targets:** `cs`, `pt`, `ro`.
- **Skipped on purpose:** Swedish / Danish / Finnish (top-tier English, B2B
  runs in English) and the smaller CEE/Med markets. Served via `en`/`de`.
- **Legal-nuance reviewer:** the model, with an explicit **stricter-version**
  policy — on any ambiguous nuance, choose the more conservative obligation
  reading. Encoded in `glossary.ts` (`LEGAL_FIDELITY_POLICY`).

Why these languages and not "biggest population": transposition status no
longer filters anything (by mid-2026 nearly every member state has transposed,
including France in Dec 2024). The real filters are English-sufficiency and
local-language buying culture. See the assessment doc.

## Files

| File | Role |
|---|---|
| `plan.ts` | Locales, source, model, national context per locale. Single source of truth. |
| `glossary.ts` | Term-lock (do-not-translate) + legal-fidelity + structure rules injected into every prompt. |
| `translate.ts` | Runner. Reads `messages/<ns>/en.json`, translates, writes `messages/<ns>/<locale>.json`. |

## Usage

```bash
# Preview scope + token estimate, no API key needed:
bun run scripts/i18n/translate.ts --wave 1 --dry-run

# Translate one namespace into French (cheap smoke test):
bun --env-file=.env run scripts/i18n/translate.ts --locale fr --namespace common

# Translate the whole product shell into all Wave 1 locales:
bun --env-file=.env run scripts/i18n/translate.ts --wave 1

# Re-translate (overwrite existing target files):
bun --env-file=.env run scripts/i18n/translate.ts --locale fr --force
```

Flags: `--locale <code>` (repeatable), `--wave 1|2`, `--all`, `--namespace <ns>`,
`--dry-run`, `--force`, `--include-wiki`.

Uses the repo's existing xAI provider (`XAI_API_KEY`, Vercel AI SDK). Override
the model with `I18N_TRANSLATE_MODEL`.

## The wiki is excluded on purpose

`messages/info/` is the ~247k-word wiki — ~79% of the entire translation
surface, and German-market-specific (BSIG, IT-Grundschutz). A literal French
translation of a BSIG page is *wrong* for a French reader on the ANSSI regime.
So the runner refuses `info` unless you pass `--include-wiki`.

The right move for the wiki per language is a **curated EU-core subset**
(~30–50k words: the Directive, Art 20/21/23 explainers, applicability,
supplier/incident schemas, the free tools) plus one properly-localised national
status page (data already exists under `app/[locale]/wiki/zeit-und-status/`).
That is a separate content task, not this pipeline.

## What this pipeline does NOT do

It does **not** activate locales. Listing a locale in `plan.ts` only tells the
runner what to generate. Serving a locale to users is a deliberate go-live step:

1. Translate + review the product-shell namespaces for the locale.
2. Add the code to `i18n/routing.ts` `locales` and add localized `pathnames`
   (URL slugs) for it.
3. Confirm `i18n/request.ts` loads it (it iterates the namespace list, so new
   locales work automatically once the JSON files exist).
4. Localize course content (`courses/**/*.<locale>.md`) separately.

Half-translated locales must never reach prod. Keep activation as the last step.

## Review workflow

1. `--dry-run` to confirm scope.
2. Translate the product shell (everything except `info`).
3. Spot-check placeholder warnings printed by the runner (it flags any string
   whose `{...}` / `<tag>` set changed).
4. Sanity-read the high-stakes namespaces (`compliance`, `requirements`,
   `incidents`, `riskAssessment`, `supplierPortal`) for the stricter-version
   policy before activating.
