# End-to-end suite

Playwright suite that drives the app through a real browser against a real
Postgres. Forms are filled in the UI; assertions check both what the page
shows and what actually landed in the database.

```bash
bun run test:l0            # schema/classification unit layer (bun:test, seconds)
bun run e2e                # full browser suite (first run builds the app)
bun run e2e:ui             # same, with the Playwright UI
bun run e2e:serve          # serve the state a run left behind, without wiping it
bun run e2e:demo-evidence  # attach example evidence PDFs to that state
```

## Isolation

The harness cannot reach production by construction:

- Own docker stack (`e2e/docker-compose.yml`): Postgres on :5434, MinIO on
  :9000/:9001, no volumes. `e2e/start-server.sh` drops the schema on every
  run, migrates through the production entrypoint
  (`scripts/runtime-migrate.mjs`), seeds, builds and serves on :3410.
- The app under test gets all of its env from `e2e/app-env.sh`. Nobody's
  `.env` is read. Every value is a committed localhost dummy.
- `assertE2eTargets()` in `e2e/lib/env.ts` runs before every direct DB
  query and refuses any database that is not localhost with a name ending
  in `_e2e`, and any non-localhost base URL. `app-env.sh` mirrors the DB
  check on the shell side.

## Layers

| Layer | Files | Covers |
|---|---|---|
| L0 | `l0/` | No browser: all 49 requirements classify, personas match schemas |
| smoke | `smoke.spec.ts`, `i18n-sidebar.spec.ts` | Journey renders 49 nodes, auth redirect, sidebar locale regression |
| L1 | `l1/` | Every intake form filled via UI, saved, round-trip verified; assets |
| L2 | `l2/` | Module CRUD sweep, the 9 bespoke editors, evidence upload round-trip, edit/delete, validation |
| L3 | `l3/` | Sign-off semantics incl. N-of-M with two sessions, cross-tenant isolation |
| L4 | `l4/grand-tour.spec.ts` | Walks all 49 journey items to a fully signed-off 49/49 |

Ordering is load-bearing. `workers: 1` and `fullyParallel: false` are
deliberate: one tenant flows through the layers, and L1 makes seeded
requirements signable again before L3 and L4 sign them. Don't parallelize.

## Data and seeding

`drizzle/seed.ts` is app infrastructure (`bun db:seed`). It creates the
framework reference data and the Dev GmbH tenant (`dev@nis2.local`). The
harness consumes that seed and adds only what a browser needs:
`auth.setup.ts` injects a bcrypt password, provisions the second
management user for the N-of-M specs, and signs both in through the real
form (`lib/signin.ts`) into storage states under `e2e/.auth/`.

`personas/stadtwerk-musterstadt.ts` is what the suite types into the UI.
It is intentionally different from the seeded Dev GmbH values, so a
passing round-trip proves a real write. `l0/schema-drift.test.ts` pins
every persona field to the live schemas.

Credentials (committed, localhost-only): `dev@nis2.local` /
`e2e-Passw0rd-local-only`, plus `e2e-management@nis2.local`.

## Browsing the result

After `bun run e2e` the database holds a fully signed-off company. To look
at it:

```bash
bun run e2e:serve           # no wipe; http://localhost:3410
bun run e2e:demo-evidence   # optional: one example PDF per requirement
```

Sign in with the credentials above. The demo-evidence script uses the
app's own upload pipeline (presign, MinIO PUT, client-side SHA-256,
confirm), so the files are real and downloadable; surfaces without an
evidence panel are skipped and reported. The other utility here is
`coverage-report.ts`: `bun e2e/coverage-report.ts` prints which of the 49
requirements each layer exercises.

## Gotchas

- `start-server.sh` only rebuilds when `.next/BUILD_ID` is missing. A
  stale `.next/` from another branch silently tests old code. `rm -rf
  .next` when in doubt.
- A browser JWT from a previous run passes the middleware but 404s in the
  portal, because user UUIDs change on every wipe. Clear site data for
  localhost:3410 and sign in again.
- Docker must be running. Ports 5434, 9000/9001 and 3410 must be free.
- The compose stack reads the MinIO KMS var that `app-env.sh` exports.
  Starting compose by hand gives MinIO an empty KMS key and evidence
  uploads fail on the SSE header.
