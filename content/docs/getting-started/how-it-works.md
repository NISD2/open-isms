An instance is four moving parts: the application container, Postgres, an object store, and whatever terminates TLS in front. Everything else in the compose file is optional.

## The stack

| Service | Image | Required | What it holds |
|---|---|---|---|
| `app` | `ghcr.io/nisd2/open-isms` | yes | nothing. Stateless. |
| `postgres` | `postgres:17-alpine` | yes | every row, including the storage key of each uploaded file |
| `minio` | `minio/minio` | profile `minio` | the evidence files themselves |
| `proxy` | `caddy:2-alpine` | profile `proxy` | certificates |
| `updater` | `nickfedor/watchtower` | profile `updater` | nothing |
| `backup` | `offen/docker-volume-backup` | profile `backup` | archives, until they are shipped offsite |

The application container holds no state at all, which is what makes updating it a container swap rather than a procedure.

## What happens at container start

The image's command is `node scripts/runtime-migrate.mjs && exec node server.js`. Migrations therefore run **before** the server binds a port, and a failed migration means no server rather than a server on a half-changed schema.

The migrator is deliberately not `drizzle-kit`, which is a development dependency and not present in the runner image. It reimplements the drizzle-orm Postgres migrator against the `pg` client that ships in the production bundle:

1. Create the `drizzle` schema if it does not exist.
2. Create the per-chain bookkeeping table if it does not exist.
3. Read the newest recorded migration timestamp.
4. Apply every journal entry newer than that, each wrapped in a transaction, recording its hash and timestamp inside the same transaction.

Because the bookkeeping insert commits with the DDL or not at all, a failed migration leaves the database exactly as it was. That is not an assertion: `scripts/ci/migration-failure-drill.sh` proves it on every push.

### Three chains, not one

Migrations live in three independent sets, each with its own bookkeeping table:

| Chain | Source | Bookkeeping table |
|---|---|---|
| `grc` | `packages/grc-data-model/drizzle` | `drizzle.__drizzle_migrations_grc` |
| `isms` | `packages/isms-schema/drizzle` | `drizzle.__drizzle_migrations_isms` |
| `saas` | `drizzle/` | `drizzle.__drizzle_migrations_saas` |

They run in that order at every boot and are idempotent: a restart applies nothing. See [Migrations](/docs/contributing/migrations) for what this means when writing one.

## Where the data lives

Two stores, not one. Postgres holds the rows, including the storage key of every uploaded file. The object store holds the bytes.

Evidence files never pass through the application server. The browser asks for a presigned URL and uploads straight to the object store, which is why there are two endpoint variables and why a wrong one fails in the browser rather than in a server log. [Evidence storage](/docs/self-hosting/storage) has the details.

The practical consequence: a database restored without its objects points at documents that no longer exist. Back them up together, restore them together. [Backup and restore](/docs/self-hosting/backup-and-restore) treats them as one unit for exactly this reason.

## Rendering

Next.js 16 App Router, server-side rendering first. The image is built with `output: "standalone"`, runs as the non-root `node` user, listens on port 3000 inside the container and is published on `APP_PORT` outside, 3026 by default.

Security headers come from `next.config.ts`, except the Content-Security-Policy, which is computed per request in `proxy.ts` from the environment the container was actually started with. That matters for self-hosting: `connect-src` has to name *your* object storage origin, and a policy frozen at build time would name whoever ran the build.

## Versions

The tag in `compose.yaml` decides what runs, through `OPEN_ISMS_VERSION`:

```ini
OPEN_ISMS_VERSION=stable    # follows releases
OPEN_ISMS_VERSION=0.2.8     # stays here until you change it
```

`stable` moves only after a release passes the upgrade gate in CI, which installs it from scratch, upgrades into it from the previous release with realistic data in the database, and boots it. Pinning is the conservative choice, and it is also how you roll back. See [Updating](/docs/self-hosting/updating).

Images are published for `linux/amd64` and `linux/arm64`, each built on its own native runner rather than emulated, so an ARM NAS pulls the same version an Intel server does and `docker pull` picks the right one with no flags.
