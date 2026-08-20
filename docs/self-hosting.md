# Self-hosting open-isms

Run your own instance of the NIS 2 ISMS behind nisd2.eu. AGPL-3.0, no licence key, no phone-home for entitlement.

This guide is written to be followed straight through by a person or by an AI agent. Every step has a command and an expected result. If a step's result does not match, stop and check the troubleshooting table at the bottom rather than continuing.

## What you need before you start

- Docker with Compose v2 (`docker compose version` prints v2.x or later)
- 8 GB RAM available to Docker. The Next.js build peaks around 3.5 GB.
- A Postgres 16 or 17 database. The compose file brings its own; skip it if you have one.
- 20 minutes, most of which is the first image build.

You do **not** need an AWS account, an AI provider, or a Google Cloud project to get a working instance. You do need a way to send email before a human can register. See [Third-party services](#third-party-services).

## Quick start

```bash
git clone https://github.com/NISD2/open-isms.git
cd open-isms
cp .env.example .env
```

Fill in four values in `.env`:

```bash
POSTGRES_PASSWORD=$(openssl rand -hex 16)
AUTH_SECRET=$(openssl rand -base64 32)
ERASURE_EMAIL_HASH_SALT=$(openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=http://localhost:3026
AUTH_URL=http://localhost:3026
```

Then:

```bash
docker compose up --build
```

Expected: the build takes 10 to 20 minutes the first time, then the app logs `[migrate] all chains complete` followed by `✓ Ready`. Open http://localhost:3026.

Verify the instance is actually healthy, not just serving:

```bash
curl -s http://localhost:3026/api/health
# {"status":"ok","timestamp":"...","checks":{"database":"ok"}}
```

## Load the framework data

A fresh database has zero requirements in it. Migrations create the tables; they do not populate NIS 2. The seed is a separate one-off step and it is **not** in the container image, so run it from your checkout. Compose publishes Postgres on `127.0.0.1:5432` for exactly this (loopback only, not reachable from outside the machine; change it with `POSTGRES_PORT` if that port is taken):

```bash
DATABASE_URL="postgres://openisms:YOUR_PASSWORD@localhost:5432/openisms" \
AUTH_SECRET="anything-at-least-32-characters-long" \
bun run drizzle/seed.ts
```

Expected: NIS 2 seeded with 12 categories and 49 requirements, then ISO 27001:2022 with 5 categories and 116 requirements, ending in `Seeded successfully`.

Two caveats worth knowing before you run it:

- The seed also creates a demo tenant called **Dev GmbH** with a `dev@nis2.local` user and sample assets, risks, and suppliers. That is deliberate for evaluation and wrong for a production instance. Delete the company row afterwards if you want a clean start.
- It needs `bun` and the repo checkout. There is no framework-only seed and no seed script inside the image yet.

## Environment variables

31 variables are read at runtime. You need **2** to boot, **7** for a genuinely usable instance, and the other 24 each unlock or harden one thing. Full annotated list in [`.env.example`](../.env.example).

### Required to start at all

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string. Compose builds this for you from `POSTGRES_*`. |
| `AUTH_SECRET` | Minimum 32 characters. `openssl rand -base64 32`. Startup fails with a Zod error below that length. |

### Required for a working instance

| Variable | What breaks without it |
|---|---|
| `AUTH_URL` | Behind a reverse proxy or TLS terminator, no login survives. Auth.js picks its cookie name from this URL's scheme; get it wrong and the middleware looks for a cookie that was never written. Set it to the URL your users type. |
| `NEXT_PUBLIC_APP_URL` | Links in emails and canonical URLs point at nisd2.eu instead of you. |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Nobody can register. Sign-up verifies the address with a one-time code, and without a key `sendMail` logs a warning and returns success, so the flow looks fine and the code never arrives. Google OAuth is the alternative, see below. |
| `ERASURE_EMAIL_HASH_SALT` | GDPR erasure throws in production rather than fall back to a committed constant. Everything else works until someone requests erasure. |

### Optional, each degrades one feature

| Variable | Without it |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No "Sign in with Google" button. Email and password still works. |
| `AWS_S3_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Evidence file uploads fail. Every other kind of evidence still records. |
| `AWS_S3_ENDPOINT` | Only needed to point storage at MinIO or another S3-compatible server instead of AWS. Setting it also switches the client to path-style URLs and rewrites the CSP `connect-src`, so browser uploads keep working. |
| `XAI_API_KEY` | The AI prefill button returns an error instead of filling the form. Manual entry unaffected. |
| `RAPIDAPI_KEY` | Company lookup in the applicability wizard falls back to typing the details in. |
| `CRON_SECRET` | The deadline and course-reminder endpoints have no bearer token to check. Leave the cron jobs unscheduled. |
| `CSP_UPGRADE_INSECURE=1` | Set this **only** once you are HTTPS-only with a real certificate. It turns on HSTS with a two-year max-age, which pins HTTPS for that hostname the moment anyone visits over TLS. |
| `PLATFORM_ADMIN_EMAILS` | No cross-tenant `/platform-admin` tier. Most self-hosters want this unset. |
| `SUPPORT_EMAIL`, `NEWSLETTER_REPLY_TO` | Contact addresses fall back to placeholder values. |
| `JOURNEY_ALLOWED_DOMAINS` | Defaults to `*`. Set an explicit comma-separated list only to narrow who reaches the guided journey. |
| `DISABLE_EMAIL=1` | Silences all outbound email. Useful for a staging copy of production data. |

## Third-party services

The platform talks to five external services at runtime. All five are replaceable or optional; the published sub-processor list at `/subprozessoren` reflects the hosted instance at nisd2.eu, not a requirement for yours.

| Service | Used for | Required? | Your alternatives |
|---|---|---|---|
| **Resend** | Registration codes, deadline reminders, notifications | Effectively yes. Without it nobody completes sign-up. | Google OAuth only (registration bypasses the code path because Google asserts the address is verified). There is no SMTP transport in the code today. Swapping the client in `lib/mail/resend.ts` is a contained change if you want nodemailer. |
| **AWS S3** | Evidence file storage, via presigned browser uploads | No | Any S3-compatible server via `AWS_S3_ENDPOINT`. MinIO is what the project's own e2e stack uses. |
| **Google OAuth** | Optional sign-in provider | No | Email and password is the default and needs no third party beyond the registration code. |
| **xAI (Grok)** | AI form prefill and requirement guidance | No | None wired. The feature errors out cleanly when the key is absent. Provider swap is via the Vercel AI SDK in `lib/ai/` and `lib/forms/llm-prefill-action.ts`. |
| **Implisense via RapidAPI** | German company lookup in the applicability wizard | No | Manual entry. |

Two more outbound calls have no key and no config:

- `rdap.org` is queried during sign-up to check how old a registered domain is, as a throwaway-address signal. It has a short timeout and fails open.
- `analytics.sorzel.com` is loaded on every page when `NODE_ENV=production`. **This is currently hardcoded to the nisd2.eu website ID.** A self-hosted production instance will send pageviews there. Until that is behind an env flag, strip the `<Script>` block at the end of `app/[locale]/layout.tsx` if you do not want it.

Everything else the app links to (EUR-Lex, gesetze-im-internet, BSI, ENISA) is an outbound hyperlink in content, not a runtime dependency.

## Putting it on the internet

Terminate TLS in front of the container. The app listens on port 3000 inside, is mapped to `APP_PORT` outside, runs as the non-root `node` user, and ships security headers from `next.config.ts`.

Once you have a certificate:

1. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the `https://` URL.
2. Set `CSP_UPGRADE_INSECURE=1`.
3. Restart. Confirm login works before you walk away, because a wrong `AUTH_URL` fails at the cookie layer with no error message.

Schedule two cron jobs against your public URL with an `Authorization: Bearer ${CRON_SECRET}` header:

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/cron/deadlines` | `0 6 * * *` | NIS 2 deadline reminders to assigned owners |
| `/api/cron/course-reminders` | `0 7 * * *` | Course follow-ups for enrolled users |

For Coolify specifically, see [coolify-deployment.md](./coolify-deployment.md).

## Upgrading

```bash
git pull
docker compose up --build -d
```

Migrations run automatically at container start, before the server binds. If a migration fails the container exits and your previous version keeps serving, so a bad upgrade does not take the instance down. Back up Postgres first anyway; the project has no downgrade path.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Environment validation failed: AUTH_SECRET` | Under 32 characters, or unset. |
| Container restarts, logs stop after `[migrate] connected to database` | A migration failed. Read the lines above the exit; the container deliberately refuses to serve on a half-applied schema. |
| Login redirects back to the sign-in page forever | `AUTH_URL` does not match the scheme users actually reach you on. This is the single most common self-host failure. |
| Sign-up says the code was sent, no email arrives | `RESEND_API_KEY` unset. The send path logs `[mail] RESEND_API_KEY not set, skipping email` and reports success anyway. |
| Portal loads but there are no requirements | The seed has not been run. See [Load the framework data](#load-the-framework-data). |
| Evidence upload fails in the browser with a CSP error | `AWS_S3_ENDPOINT` does not match the origin the browser is actually PUTting to. |
| Build killed at exit code 137 | Docker has under 4 GB. Raise the memory limit. |

## The other compose file

`apps/reference/docker-compose.yml` is a different, much smaller thing: a minimal demo of the workspace packages with a landing page, two portal pages, and magic-link auth that needs an SMTP transport you write yourself. Use it to understand the packages, not to run an ISMS.

## Getting help

Open an issue at https://github.com/NISD2/open-isms/issues. Include your compose file with secrets stripped, the output of `docker compose logs app | tail -50`, and what `curl -s localhost:3026/api/health` returns.
