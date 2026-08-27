# Coolify deployment notes

Self-hosting nisd2.eu on Coolify.

## Build

Coolify auto-detects the `Dockerfile` at the repo root. No build configuration changes needed in the Coolify UI beyond pointing it at the Git repo.

Build args:
- None required. `SKIP_ENV_VALIDATION=1` is set in the Dockerfile so the build does not require runtime secrets.

Build context:
- Repo root. `.dockerignore` excludes `node_modules`, `.next`, `.git`, and `.env*` so the build context stays small.

## Runtime environment variables

Set these in the Coolify project's Environment Variables section:

### Required
- `DATABASE_URL` — PostgreSQL connection string (Coolify-provisioned Postgres or external)
- `AUTH_SECRET` — random secret, generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `NEXT_PUBLIC_APP_URL` — public URL (e.g. `https://nisd2.eu`)

### Required for full functionality
- `AWS_S3_REGION` — e.g. `eu-north-1`
- `AWS_S3_BUCKET` — evidence upload bucket
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `RESEND_API_KEY` — transactional email
- `RESEND_FROM_EMAIL` — sender address
- `XAI_API_KEY` — Grok (form prefill / AI features)
- `CRON_SECRET` — Bearer token for `/api/cron/deadlines` and `/api/cron/course-reminders`

### Optional
- `DISABLE_EMAIL=1` — set to silence email sending in non-prod
- `AUTH_TRUST_HOST=true` — already in Dockerfile, override only if proxying differently

Already set by the Dockerfile (do NOT override unless needed):
- `NODE_ENV=production`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`

## Migrations

Migrations run automatically at container start, before the server binds. The
Dockerfile's `CMD` chains `scripts/runtime-migrate.mjs` ahead of `node
server.js`, so a failed migration exits the container and Coolify keeps the
previous version serving.

Do **not** configure a pre-deployment migrate command. It would run the same
migrations a second time from a container that does not ship `drizzle-kit`
anyway, and Coolify's build network cannot reliably reach the managed Postgres
host — which is why the migrate step moved into the runtime container in the
first place.

Only one instance may migrate at a time. The runner takes a Postgres advisory
lock for the whole run, so a second replica waits rather than racing, but
scaling the app to more than one instance across an upgrade is still not
supported.

## Cron schedules

Configure as Coolify "Scheduled tasks" or external cron pointing at the
public URL with the `Authorization: Bearer ${CRON_SECRET}` header.

| Path | Schedule (UTC) | What it does |
|---|---|---|
| `/api/cron/deadlines` | `0 6 * * *` (06:00 daily) | Sends NIS 2 deadline reminders to assigned users |
| `/api/cron/course-reminders` | `0 7 * * *` (07:00 daily) | Sends CEO course follow-up reminders to enrolled users |

Both endpoints reject requests without a matching `CRON_SECRET` bearer
token. The previous `vercel.json` (deleted 2026-06-11) declared these
schedules to Vercel; Coolify ignores `vercel.json` entirely, so the
table above is now the source of truth.

### Option B — Manual

Run from your dev machine against the prod `DATABASE_URL` before each deploy:

```bash
DATABASE_URL=<prod-url> bun db:migrate
```

### Option C — Sidecar / init container

Spin up a separate one-shot container that runs `drizzle-kit migrate` against the same DB, before the main service starts. Cleanest in a docker-compose context but unnecessary on Coolify.

## Healthcheck

The Dockerfile's `HEALTHCHECK` hits `GET /api/health`, which checks DB connectivity. Coolify reads the health status from this. If `DATABASE_URL` is wrong or DB is unreachable, the container reports unhealthy and Coolify will block traffic.

Healthcheck behaviour:
- Interval: 30s
- Timeout: 5s
- Start period: 15s (gives Next.js time to boot)
- Retries: 3

## Ports

- Container listens on `3000`. Coolify proxies your public domain to this port.

## Storage

- `.next/cache` is created at runtime as the `node` user. If you want this persistent across deployments, mount a Coolify Volume at `/app/.next/cache`. Without a volume, ISR cache is rebuilt fresh each deploy (fine for low-traffic launch).

## Security

- Runs as the non-root `node` user (set in Dockerfile).
- `output: "standalone"` in `next.config.ts` ships only the minimum runtime — no devDependencies, no source maps in production.
- HTTP security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) are set in `next.config.ts` via the `headers()` hook and apply on every response.
- Next.js 16.1.6 is past CVE-2025-29927 (middleware auth bypass, fixed in 15.2.3+). No known unpatched CVEs at this version as of 2026-05.

To stay current:
- Rebuild the image periodically. `oven/bun:1` and `node:22-bookworm-slim` auto-update minor/security patches when rebuilt.
- Watch the Next.js security advisories: https://github.com/vercel/next.js/security/advisories
- Run `bun outdated` quarterly; update Next.js minor versions when they include security fixes.

## Local testing

Build and run locally to verify:

```bash
docker build -t nisd2 .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host.docker.internal:5432/nis2 \
  -e AUTH_SECRET=dev-secret \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  nisd2
```

Then open http://localhost:3000 and http://localhost:3000/api/health.

## Things that intentionally do NOT happen in Docker

- `bun run db:migrate` — handled by Coolify pre-deploy hook, not the Dockerfile
- `bun run db:seed` — **local databases only**. It is not tenant-scoped: it
  deletes every company's evidence, requirement statuses and intake answers
  before reseeding, so it refuses any non-localhost `DATABASE_URL`. A fresh
  production database needs no seed: framework reference data ships as a
  migration and is applied at container start.
- Source-map upload to error tracker — separate CI step if/when added
- AWS credentials rotation — managed in Coolify, not baked into image
