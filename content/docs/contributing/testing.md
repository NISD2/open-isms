Four workflows, and everything they run is available locally.

## Locally, before a push

```bash
bun run typecheck            # strict, must be clean
bun run test:unit            # unit tests under lib, server, schema
bun run build                # the full Next.js build
```

Migration guards, which are fast and catch the mistakes that are expensive later:

```bash
bun run check:migrations              # journals match their .sql files
bun run check:migration-immutability  # nothing shipped has been edited
bun run check:migration-safety        # no one-step constraints on existing tables
```

## The end-to-end suite

Playwright against a real stack: Postgres and MinIO in Docker, migrated with the same `runtime-migrate.mjs` the image runs, seeded, built and served. No secrets anywhere; the whole stack is throwaway localhost dummies.

```bash
bun run test:l0     # schema-drift and coverage checks, seconds, no browser
bun run e2e         # the browser suite
bun run e2e:ui      # the same, with the Playwright UI
bun run e2e:image   # against the published image rather than a local build
```

`test:l0` exists to fail fast. It catches schema drift and coverage gaps in seconds, before anything spends minutes starting browsers.

## What CI runs

| Workflow | Trigger | What it proves |
|---|---|---|
| **CI** | every push | typecheck, unit tests, build, migration guards, shellcheck, and that the framework reference table still matches the data |
| **CI / migration-failure** | every push | a failing migration leaves the database untouched, by actually running one |
| **CI / compose** | every push | the self-host compose file and the Caddy config are valid |
| **E2E** | pull requests | the browser suite against a real stack |
| **Self-host stack** | pull requests, and weekly | install, update, rollback and a full backup-restore drill against real containers |
| **Release** | manual | see [Releases](/docs/contributing/releases) |

The weekly run of the self-host workflow is not redundant. Base images move underneath us: Postgres, node, MinIO, the updater. A scheduled run catches a stack that broke without anyone touching the repository.

### The drills

Three of those jobs are drills rather than tests, in the sense that they perform the failure instead of asserting a property of the code:

- **Migration failure.** Runs a migration that fails, then checks the database is exactly as it was.
- **Lifecycle.** Installs from scratch, updates to a second version through the updater API, then rolls back to the pinned previous version and checks it serves against the upgraded schema. It also asserts no service publishes a port beyond loopback and that the updater publishes none at all.
- **Backup drill.** Writes a database row and an object, takes a backup, destroys every volume, restores from the archive alone, and asserts both halves came back. A backup nobody has restored is a belief, not a control, and this project sells backup management as a NIS 2 measure, so the bar is higher here than "the job ran without error".

## Writing tests

Unit tests live next to what they test and run under `bun test`. End-to-end specs live in `e2e/`.

The useful question for a new test is which of the two it is. If it can be answered by calling a function with arguments, it is a unit test and belongs where the function is. If it only means something with a browser, a session and a database, it is an end-to-end spec, and it is worth writing it against behaviour a user would notice rather than against an implementation detail that will move.
