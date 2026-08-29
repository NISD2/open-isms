Once a version is published, other people's databases run our migrations without us. There is no console to log into and no way to fix a bad migration in place: whatever ships, runs, on data we have never seen.

The rules below exist so that stays safe. They are cheap to follow and impossible to retrofit. The canonical text is [`docs/migration-policy.md`](https://github.com/NISD2/open-isms/blob/main/docs/migration-policy.md); this is the same policy in one place with the mechanics attached.

## Three chains

| Chain | Source | Bookkeeping table |
|---|---|---|
| `grc` | `packages/grc-data-model/drizzle` | `drizzle.__drizzle_migrations_grc` |
| `isms` | `packages/isms-schema/drizzle` | `drizzle.__drizzle_migrations_isms` |
| `saas` | `drizzle/` | `drizzle.__drizzle_migrations_saas` |

Each has its own journal and its own bookkeeping table, and they run in that order at every container start. The split exists because the packages are published independently: a consumer who installs `@nisd2/grc-data-model` gets its migrations without inheriting the application's.

Generate against the right one:

```bash
bun run db:generate:grc     # packages/grc-data-model
bun run db:generate:isms    # packages/isms-schema
bun run db:generate         # the app's own drizzle/
bun run db:migrate          # applies all three, in order
```

Never `drizzle-kit push`. It bypasses migration tracking and produces two databases that report the same version while holding different schemas.

## 1. A shipped migration is immutable

Every database records what it has run and never runs it again, so editing a shipped migration changes only the databases that have not applied it yet. You end up with two populations holding different schemas, both reporting the same version, and nothing at runtime notices.

Corrections go in a new migration. `bun run check:migration-immutability` fails CI if anything that shipped in the latest release tag has moved, and the migrator warns at boot when a recorded hash no longer matches the file.

The journal is immutable in the same way. New entries append with a fresh timestamp. If CI rejects a journal because timestamps are out of order, because two branches generated migrations concurrently and the other merged first, regenerate yours. Do not reorder the array to silence the error: a database sitting past your migration's timestamp skips it permanently and silently.

## 2. A release must not break the release before it

There is always a moment during an update when the new schema is live and old code is still running, and a self-hoster who has to roll back runs the previous image against the schema the failed update left behind. Both only work if migration N keeps release N-1 working. In practice, expand then contract, across two releases:

| Change | Release N | Release N+1 |
|---|---|---|
| New column the code needs | add nullable, backfill, start writing it | make it `NOT NULL` once every row has a value |
| Removing a column | stop reading and writing it | drop it |
| Renaming | add the new one, write both, backfill | drop the old one |
| New table | create it, start using it | |

Never rename a column in the release that changes the code using it. A rename is an add plus a drop, and the drop belongs to the next release.

## 3. Constraints in three steps, never one

CI runs migrations against a schema built from scratch, so it only ever sees clean data. A real database has nulls where you did not expect them and duplicates a constraint would reject. A bare `ALTER TABLE ... SET NOT NULL` passes CI by construction and crash-loops someone's container.

Add the column or index nullable and unvalidated, backfill in the same migration, validate in a later one. Reconcile duplicates in code before the constraint exists.

`CREATE UNIQUE INDEX CONCURRENTLY` is the right tool on a large table, and Postgres refuses to run it inside a transaction block, which every migration otherwise is. Opt a file out with a first line of:

```sql
-- migrate:no-transaction
```

Understand the trade. A migration outside a transaction that fails part way leaves the schema partly changed and is not recorded as applied, so the next boot retries it from the top. Every statement in such a file has to be safe to re-run. `bun run check:migration-safety` enforces the marker is only used where something actually needs it.

## 4. A migration may not depend on the app that shipped with it

Someone who has not updated in a year goes from an old version to the newest in a single boot. Every migration in between replays back to back, and none of the intermediate application versions ever runs. A data migration that assumes "by now the app has been writing column X for a while" is right on our instance and wrong on theirs.

Migrations are self-contained SQL against the schema as it exists at that point in the chain. Work that genuinely needs application logic belongs in application code, guarded so it is safe to run repeatedly.

## 5. Framework codes are permanent identifiers

Framework updates ship as generated upsert migrations, keyed on `requirement.code` and on `(framework_id, slug)` for categories. Every tenant's evidence, statuses, assignments and sign-offs hang off those rows, which makes those identifiers permanent.

Renaming or recoding a requirement does not rename anything downstream. The upsert inserts a **new** row, every tenant's work stays attached to the old one, and the old one never gets updated again. It is silent, and it is exactly the kind of damage a compliance tool must not do.

- Wording, legal references, priority, sort order, Grundschutz mapping: edit freely. The upsert carries the change to every instance on the next update.
- Retiring a requirement: mark it deprecated. Never delete it.
- Genuinely replacing one: add the new code and write an explicit data migration that repoints tenant rows. This is the only case where the generated sync migration is not enough.

Note the consequence for self-hosters: the upserts overwrite reference rows unconditionally, so a locally edited shipped requirement reverts on the next update. Custom requirements need their own codes that we will never issue.

## 6. Long statements need a ceiling

`runtime-migrate.mjs` sets `lock_timeout` and `statement_timeout` before applying anything, and takes a Postgres advisory lock so two containers starting together cannot both migrate. A migration that cannot take its lock fails cleanly instead of blocking startup behind someone's long-running query. An unbounded `ALTER` on a hot table has crash-looped a container here before.

Write migrations that finish quickly on a large table, and reach for `CONCURRENTLY` rather than raising the timeouts.

## 7. Releases are linear

Selection is by timestamp: everything newer than the newest applied entry runs, in journal order. A migration authored on a maintenance branch and released after a later version already shipped carries an older timestamp and is skipped forever on any instance that took the newer release first.

Until that is addressed, releases go out in a straight line. A fix for an older release is a new release from the tip, not a backport branch.
