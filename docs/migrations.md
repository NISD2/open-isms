# Migrations — split-package architecture

Three layered drizzle directories, each owned by the package whose tables it covers, **each with its own bookkeeping table**:

| Directory | Owner | Tables | Bookkeeping table |
|---|---|---|---|
| `packages/grc-data-model/drizzle/` | `@nisd2/grc-data-model` | GRC entity model — framework, requirement, supplier, asset, risk, incident, … | `drizzle.__drizzle_migrations_grc` |
| `packages/isms-schema/drizzle/` | `@nisd2/isms-schema` | ISMS process — audit_log, evidence, sign_off_history, organization, policies, training, … | `drizzle.__drizzle_migrations_isms` |
| `drizzle/` (this repo) | NIS2 private app | SaaS-only — lead, email_otp, company_invite, supplier_invite, BSIG modules | `drizzle.__drizzle_migrations_saas` |

Each has its own `drizzle.config.ts` pointing at its own schema sources, and each sets `migrations: { table: "...", schema: "drizzle" }` so it tracks applied migrations in its own dedicated table. The legacy `drizzle.__drizzle_migrations` (without a suffix) stays in place on existing prod as a historical record of the 16 consolidated migrations applied before the cutover.

## Why per-package bookkeeping tables

drizzle-orm's migrator skips already-applied migrations using a **timestamp comparison**, not a hash lookup:

```js
// drizzle-orm/pg-core/dialect.cjs
if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
  // apply this migration
}
```

If three independent journals (grc, isms, saas) shared one bookkeeping table, a newer GRC migration would advance `lastDbMigration` past an older ISMS migration's `folderMillis`, causing the ISMS one to be silently skipped on its next run. Per-package tables eliminate this cross-chain race.

## Generating new migrations

```bash
# After editing GRC table schemas in packages/grc-data-model/src/schema/*
bun db:generate:grc

# After editing ISMS table schemas in packages/isms-schema/src/tables/*
bun db:generate:isms

# After editing SaaS-only schemas in schema/tables/* or schema/modules/*
bun db:generate
```

Each command writes into the corresponding package's `drizzle/` directory. Migrations are local to the package that owns the schema.

## Applying migrations

```bash
bun db:migrate
```

Runs the chain in dependency order: **grc → isms → saas**. ISMS tables FK into GRC tables, so GRC must exist first. SaaS tables FK into ISMS/GRC tables, so those must exist before SaaS runs. The chain in `package.json` does:

```jsonc
"db:migrate": "bun run --cwd packages/grc-data-model db:migrate && bun run --cwd packages/isms-schema db:migrate && drizzle-kit migrate"
```

Each `drizzle-kit migrate` invocation reads its own config and `drizzle/` dir, applies pending migrations, and records the applied hashes in its **own** `__drizzle_migrations_*` table.

## Cutover on existing prod databases

The pre-cutover NIS2 prod DB was built from the legacy consolidated `drizzle/` (16 migrations covering everything). It already has every table. Running the new fresh baselines would fail with "table already exists".

Before the first post-cutover deploy, run the convergence script **once** per prod DB:

```bash
# Inspect (no writes)
bun run scripts/converge-prod-migrations.ts

# Mark all three baselines as already-applied
bun run scripts/converge-prod-migrations.ts --apply
```

This inserts one row per baseline into the matching `__drizzle_migrations_*` table:
- grc baseline hash + `folderMillis` from `packages/grc-data-model/drizzle/meta/_journal.json` → `drizzle.__drizzle_migrations_grc`
- isms baseline hash + folderMillis → `drizzle.__drizzle_migrations_isms`
- saas baseline hash + folderMillis → `drizzle.__drizzle_migrations_saas`

`created_at` matches the baseline's `folderMillis` from its journal (not `Date.now()`). drizzle-orm's skip logic then sees `lastDbMigration.created_at == baseline.folderMillis`, so the baseline is treated as already-applied and **any future migration with a greater folderMillis** (which all future ones will have) applies normally.

After convergence, deploying this branch is safe — `bun db:migrate` finds nothing to apply (everything's marked done) and the next schema change in any of the three packages produces a clean incremental migration.

## OSS consumers (apps/reference)

OSS apps only ship the GRC + ISMS packages. Their startup chain is just:

```bash
bun run --cwd packages/grc-data-model db:migrate
bun run --cwd packages/isms-schema db:migrate
```

Wired in `apps/reference/package.json`. On a fresh DB this creates the 12 GRC tables (in `__drizzle_migrations_grc`) then the 30 ISMS tables (in `__drizzle_migrations_isms`). No SaaS layer. No convergence needed because the DB is empty.

## Where the legacy migrations went

The 16 pre-cutover migrations live in `drizzle.legacy/` for historical reference. They are NOT shipped (not in any `drizzle.config.ts`'s `out`, not COPY'd by the Dockerfile, not in the mirror script's allowlist) and no migrator reads them. The prod `drizzle.__drizzle_migrations` table is also untouched by convergence — it still lists the 16 legacy migrations as applied, just for the historical record. Delete `drizzle.legacy/` from disk when comfortable that the convergence worked everywhere.
