# Migration policy

Once a version is published, other people's databases run our migrations
without us. There is no console to log into and no way to fix a bad migration
in place: whatever ships, runs, on data we have never seen. These rules exist
so that stays safe. They are cheap to follow and impossible to retrofit.

For how the three chains work mechanically, see [migrations.md](./migrations.md).
For how updates reach a self-hosted instance, see [updating.md](./updating.md).

## 1. A shipped migration is immutable

Every database records the migrations it has run and never runs them again.
Editing a migration after it has shipped therefore does not change the
databases that already applied it. It changes only the ones that have not,
which leaves two populations holding different schemas while both reporting
the same version. Nothing at runtime notices.

So: once a migration is in a release, its `.sql` file and its journal entry
never change again. Corrections go in a new migration. `bun run
check:migration-immutability` fails CI if anything that shipped in the latest
release tag has moved, and the migrator warns at boot when a recorded hash no
longer matches the file.

The same applies to the journal itself. New entries append to the end with a
fresh timestamp. If CI rejects a journal because timestamps are out of order
(two branches generated migrations concurrently and the other one merged
first), regenerate yours so it gets a new timestamp. Do not reorder the array
to make the error go away: a database sitting past your migration's timestamp
skips it permanently and silently.

## 2. A release must not break the release before it

During an update there is always a moment when the new schema is live and old
code is still running, and a self-hoster who has to roll back runs the
previous image against the schema the failed update left behind. Both only
work if migration N keeps release N-1's code working. In practice that means
**expand, then contract**, across two releases:

| Change | Release N | Release N+1 |
|---|---|---|
| New column the code needs | add it nullable, backfill, start writing it | make it `NOT NULL` once every row has a value |
| Removing a column | stop reading and writing it in code | drop it |
| Renaming | add the new one, write both, backfill | drop the old one |
| New table | create it, start using it | — |

Never rename a column in the same release that changes the code using it.
A rename is an add plus a drop, and the drop belongs to the next release.

## 3. Constraints are added in three steps, never in one

The upgrade gate in CI runs migrations against a schema it built from scratch,
so it can only ever see clean data. A self-hoster's database has years of real
tenant data in it: nulls where you did not expect them, duplicates a
constraint would reject. A bare `ALTER TABLE ... SET NOT NULL` or a new
`UNIQUE` index passes CI by construction and fails on their machine, which
under a plain `docker compose up -d` means a crash-looping container.

Add the column or index nullable and unvalidated, backfill the existing rows
in the same migration, and validate in a later one. Reconcile duplicates in
code before the constraint exists rather than assuming there are none.

`CREATE UNIQUE INDEX CONCURRENTLY` is the right tool on a large table, and
Postgres refuses to run it inside a transaction block — which every migration
otherwise is. Opt that file out with a first line of:

```sql
-- migrate:no-transaction
```

Understand what you are giving up. A migration that runs outside a transaction
and fails partway leaves the schema partly changed, and is not recorded as
applied, so the next boot retries it from the top. Every statement in such a
file must therefore be safe to re-run: `IF NOT EXISTS`, or an explicit guard.
Use it only where the transaction is genuinely the obstacle.

## 4. A migration may not depend on the app that shipped with it

Someone who has not updated in a year goes from 1.2 to 2.0 in a single boot.
Every migration between the two replays back to back, with none of the
intermediate application versions ever running. A data migration that assumes
"by now the app has been writing column X for a while" is correct on our
production instance, which upgraded gradually, and wrong on theirs.

Migrations are self-contained SQL against the schema as it exists at that
point in the chain. If a change genuinely requires application logic, do the
work in application code guarded so it is safe to run repeatedly, not in the
migration.

## 5. Framework content: codes are permanent identifiers

Framework updates ship as generated upsert migrations (see
`scripts/generate-framework-migration.ts`). They key on natural identifiers:
`requirement.code`, and `(framework_id, slug)` for categories. Every tenant's
evidence, status, assignments and sign-offs hang off those rows.

That makes the identifiers permanent. Renaming or recoding a requirement does
not rename anything downstream: the upsert inserts a **new** row, and every
tenant's work stays attached to the old one, which now has no counterpart in
the framework data and never gets updated again. It is silent, and it is
exactly the kind of damage a compliance tool must not do.

- Wording, legal references, priority, sort order, Grundschutz mapping: edit
  freely. The upsert carries the change to every instance on the next update.
- Retiring a requirement: mark it deprecated. Never delete it — tenants have
  evidence attached, and the sync migrations contain no deletes by design.
- Genuinely replacing a requirement: add the new code, and write an explicit
  data migration that repoints tenant rows from the old code to the new one.
  This is the only case where the sync migration is not enough on its own.

Local edits are also lost here: the upserts overwrite reference rows
unconditionally, so a self-hoster who edits a shipped requirement sees it
revert on the next update. Custom requirements need their own codes that we
will never issue.

## 6. Long statements need a ceiling

`runtime-migrate.mjs` sets `lock_timeout` and `statement_timeout` before it
applies anything. A migration that cannot take its lock fails cleanly instead
of blocking startup indefinitely behind someone's long-running query — an
unbounded `ALTER` on a hot table has crash-looped a container here before.
Write migrations that finish quickly on a large table, and reach for
`CONCURRENTLY` rather than raising the timeouts.

## 7. Releases are linear

Migration selection is by timestamp: everything newer than the newest applied
entry runs, in journal order. A migration authored on a maintenance branch and
released after a later version already shipped carries an older timestamp and
is skipped forever on any instance that took the newer release first.

Until that is addressed, releases go out in a straight line. A fix for an
older release means a new release from the tip, not a backport branch.
