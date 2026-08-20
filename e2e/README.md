# End-to-end suite

Playwright suite that drives the real app in a real browser against a real
database. No mocks: forms are filled through the UI, mutations are verified
in Postgres, files land in object storage.

```bash
bun run test:l0   # schema/classification unit layer (bun:test, seconds)
bun run e2e       # full browser suite (first run builds the app)
bun run e2e:ui    # same, with the Playwright UI
```

## Isolation

The harness is hermetic and cannot touch production by construction:

- Own Docker stack (`e2e/docker-compose.yml`): Postgres on :5434, MinIO on
  :9000/:9001, no volumes. `e2e/start-server.sh` drops and recreates the
  schema on every run, migrates through the production entrypoint
  (`scripts/runtime-migrate.mjs`), seeds, builds, serves on :3410.
- The app under test gets ALL its env injected by `start-server.sh`.
  Nobody's `.env` is read. Every value is a committed localhost dummy.
- Guards in `e2e/lib/env.ts` (`assertE2eTargets`, called on every direct DB
  query) and mirrored in `start-server.sh` refuse any database that is not
  localhost with a name ending in `_e2e`, and any non-localhost base URL.

## Layers

| Layer | Files | Covers |
|---|---|---|
| L0 | `l0/` | No browser: all 49 requirements classify, personas match schemas |
| smoke | `smoke.spec.ts`, `i18n-sidebar.spec.ts` | Journey renders 49 nodes, auth redirect, sidebar locale regression |
| L1 | `l1/` | Every intake form filled via UI, saved, round-trip verified; assets |
| L2 | `l2/` | Module CRUD sweep, the 9 bespoke editors, evidence upload round-trip, edit/delete, validation |
| L3 | `l3/` | Sign-off semantics incl. N-of-M with two sessions, cross-tenant isolation |
| L4 | `l4/grand-tour.spec.ts` | Walks all 49 journey items to a fully signed-off 49/49 |

Ordering is load-bearing: `workers: 1` and `fullyParallel: false` are
deliberate. One shared tenant flows through the layers (L1 makes seeded
requirements signable again before L3/L4 sign them). Do not parallelize.

## Data and seeding

- `drizzle/seed.ts` (app-level, `bun db:seed`) seeds framework reference
  data plus the Dev GmbH tenant (`dev@nis2.local`). The harness consumes
  it and only adds what a browser needs: `auth.setup.ts` injects a bcrypt
  password and provisions the second (management) user, then logs both in
  through the real signin form into storage states under `e2e/.auth/`.
- `personas/stadtwerk-musterstadt.ts` is the data the suite types into the
  UI. It is deliberately different from the seeded Dev GmbH values so
  round-trips prove real writes; `l0/schema-drift.test.ts` pins every
  persona field to the live schemas.
- Credentials (committed, localhost-only): `dev@nis2.local` /
  `e2e-Passw0rd-local-only`, plus `e2e-management@nis2.local`.

## Utilities (not tests)

- `coverage-report.ts` — which of the 49 requirements each layer exercises:
  `bun e2e/coverage-report.ts`
- `demo-evidence.ts` — after a suite run, uploads an example PDF per
  requirement through the real pipeline so the tenant is browsable with
  downloadable evidence: `bun run e2e:evidence`

To browse the finished tenant after a run, start only the server (the
stack and data are still up; re-running `start-server.sh` would wipe them)
and sign in with the credentials above.

## Gotchas

- `start-server.sh` only rebuilds when `.next/BUILD_ID` is missing. A stale
  `.next/` from another branch silently tests old code: `rm -rf .next`.
- A browser JWT from a previous run passes the middleware but 404s in the
  portal (user UUIDs change every wipe). Clear site data and sign in again.
- Docker must be running; ports 5434, 9000/9001 and 3410 must be free.
- MinIO needs the KMS env var only `start-server.sh` sets; hand-running
  `docker compose up` gives an empty KMS key and evidence uploads fail.
