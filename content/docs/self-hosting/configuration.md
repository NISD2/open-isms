Configuration is one `.env` file next to `compose.yaml`. Two variables are needed to boot, seven for an instance a human can actually use, and the rest each unlock or harden exactly one thing.

`.env.self-host.example` is the annotated version of everything below and is the file you copy. This page is the reference.

## Required to start at all

Startup validates the environment with Zod and refuses to run on a bad value, naming the variable in the error.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string. The compose file builds it for you from `POSTGRES_PASSWORD`. |
| `AUTH_SECRET` | Minimum 32 characters. `openssl rand -base64 32`. Anything shorter fails startup. |

## Required for a usable instance

| Variable | What breaks without it |
|---|---|
| `AUTH_URL` | Every login. Auth.js derives its cookie name from this URL's scheme, so behind TLS with an `http://` value set the middleware looks for a cookie that was never written. Set it to the URL your users type. |
| `NEXT_PUBLIC_APP_URL` | Links in outgoing email and canonical URLs point at nisd2.eu instead of you. |
| `SMTP_HOST` **or** `RESEND_API_KEY`, plus `MAIL_FROM_EMAIL` | Registration for anyone but you. Sign-up verifies the address with a one-time code; with no transport the code goes to the container log instead of to the person. `BOOTSTRAP_ADMIN_EMAIL` gets *you* in without either, and Google OAuth skips the code entirely. See [Email](/docs/self-hosting/email). |
| `ERASURE_EMAIL_HASH_SALT` | GDPR erasure, which throws in production rather than fall back to a committed constant. Everything else works until someone requests erasure. |

## Storage

| Variable | Notes |
|---|---|
| `AWS_S3_BUCKET` | Bucket for evidence files. With the `minio` profile a one-shot container creates it on first start. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credentials. Under the `minio` profile these are also MinIO's root user and password; the secret needs at least 8 characters. |
| `AWS_S3_REGION` | Defaults to `eu-north-1`. Irrelevant for MinIO, required for AWS. |
| `AWS_S3_ENDPOINT` | The address the **browser** uses. Setting it switches the S3 client to path-style URLs and rewrites the CSP so browser uploads are allowed. |
| `AWS_S3_INTERNAL_ENDPOINT` | The address the **server** uses, when it differs. Falls back to `AWS_S3_ENDPOINT`. Set with bundled MinIO, unset on AWS. |
| `MINIO_KMS_KEY` | Bundled MinIO only, and mandatory there: every upload sends `x-amz-server-side-encryption: AES256`, which MinIO answers out of a KMS. Exactly 32 bytes of base64. |

Why two endpoints, and what goes wrong with one: [Evidence storage](/docs/self-hosting/storage).

## Optional, one feature each

| Variable | Without it |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No "Sign in with Google". Email and password still works. |
| `XAI_API_KEY` | The AI prefill button returns an error instead of filling the form. Manual entry is unaffected. |
| `RAPIDAPI_KEY` | Company lookup in the applicability wizard falls back to typing the details in. |
| `CRON_SECRET` | The deadline and course-reminder endpoints have no bearer token to check. Leave those jobs unscheduled. |
| `PLATFORM_ADMIN_EMAILS` | No cross-tenant `/platform-admin` tier. Most single-organisation installs want this unset. |
| `SUPPORT_EMAIL`, `NEWSLETTER_REPLY_TO` | Contact addresses fall back to placeholder values. |
| `RESEND_FROM_EMAIL_NEWS` | Newsletter sends from `RESEND_FROM_EMAIL` instead of its own mailbox. |
| `ANALYTICS_SCRIPT_URL`, `ANALYTICS_WEBSITE_ID` | No analytics tag, which is the default. Both are required together, and the CSP allows the script's origin only when the URL is set. Nothing is reported to this project either way. |
| `CAL_LINK` | The booking UI is not rendered at all. Empty by default on purpose: a self-hosted instance must not embed someone else's calendar. |
| `DISABLE_EMAIL=1` | Silences all outbound email. Useful for a staging copy of production data. |
| `CSP_UPGRADE_INSECURE=1` | Set this **only** once you are HTTPS-only with a real certificate. It turns on HSTS with a two-year max-age, which pins HTTPS for that hostname the moment anyone visits over TLS. |

## Third-party services

These are the outbound calls the software can make. Every one of them is behind a key you supply, so an instance with none of these set makes none of these calls.

| Service | Used for | Required? | Alternative |
|---|---|---|---|
| Resend | Registration codes, deadline reminders, notifications | No. A mail transport is effectively required, but Resend is not the only one. | Your own SMTP relay: set `SMTP_HOST` and it wins even if a Resend key is present. That is the option that keeps an air-gapped instance working. Google OAuth alone also gets people in, because Google asserts the address is already verified. See [Email](/docs/self-hosting/email). |
| S3 storage | Evidence uploads, through presigned browser PUTs | No | The bundled MinIO container, `COMPOSE_PROFILES=minio`, or any S3-compatible server via `AWS_S3_ENDPOINT`. |
| Google OAuth | Optional sign-in provider | No | Email and password is the default. |
| xAI (Grok) | AI form prefill and requirement guidance | No | None wired. The feature errors cleanly when `XAI_API_KEY` is absent. The provider is reached through the Vercel AI SDK in `lib/ai/` and `lib/forms/llm-prefill-action.ts`. |
| Implisense, via RapidAPI | German company lookup in the applicability wizard | No | Typing the details in. |
| IndexNow | Submits public sitemap URLs to search engines, from the `/api/cron/indexnow` job | No | Leave `INDEXNOW_KEY` unset and the job makes no call. Nothing but URLs already in your sitemap is sent. |

Two more outbound calls have no key and no setting:

- `rdap.org` is queried at sign-up to see how old a registered domain is, as a throwaway-address signal. Short timeout, fails open (`lib/auth/email-quality.ts`).
- Analytics is off unless you turn it on. With `ANALYTICS_SCRIPT_URL` or `ANALYTICS_WEBSITE_ID` unset, no tag is rendered and the CSP does not permit one. Nothing is reported to this project either way.

Everything else the application links to (EUR-Lex, gesetze-im-internet, BSI, ENISA) is a hyperlink in content, not a runtime dependency.

### This table is not a sub-processor register

The two questions are different, and answering the second with the first is how a register ends up wrong. This table is "what can the software call". An Art. 28 register is "who processes personal data on my behalf", which depends on what you switched on, where you host, and who your own suppliers are. IndexNow receives sitemap URLs and rdap.org receives a domain name, so neither is processing personal data for you; your hosting provider is, and it is not on this list because it is yours, not ours.

The published register at [nisd2.eu/en/subprocessors](/en/subprocessors) names five processors for the hosted instance at nisd2.eu, including its hosting provider. That page describes our instance. Yours will differ.

## The compose file, not the app

These are read by the stack rather than by the application, and several have no effect unless their profile is on.

| Variable | Purpose |
|---|---|
| `OPEN_ISMS_VERSION` | Which image tag runs. `stable`, or an exact version to pin and to roll back. |
| `COMPOSE_REVISION` | Which revision of `compose.yaml` you are running. Reported at `/api/health` so a deployment cannot quietly drift from what a release expects. |
| `COMPOSE_PROFILES` | Which optional services run: `minio`, `proxy`, `updater`, `backup`. |
| `POSTGRES_PASSWORD`, `POSTGRES_USER`, `POSTGRES_DB` | The bundled database. Only the password has no default. |
| `APP_DOMAIN`, `STORAGE_DOMAIN` | `proxy` profile. Both must resolve to this server before first start or the certificate order fails. |
| `BACKUP_*` | `backup` profile. Target bucket, schedule, retention, and the GPG passphrase. See [Backup and restore](/docs/self-hosting/backup-and-restore). |
| `UPDATE_API_TOKEN` | `updater` profile. Authenticates a request to the updater over the internal network. |
| `APP_BIND`, `APP_PORT`, `POSTGRES_BIND`, `POSTGRES_PORT`, `MINIO_BIND`, `MINIO_PORT` | Host bindings. Loopback by default. |

### Migration tunables

Rarely touched, and set on the app container. The migrator takes a Postgres advisory lock so two containers starting at once cannot migrate the same database twice.

| Variable | Default | Meaning |
|---|---|---|
| `MIGRATE_LOCK_WAIT` | `300s` | How long to wait for another instance to finish migrating before giving up. |
| `MIGRATE_LOCK_TIMEOUT` | `10s` | Ceiling on how long a single statement waits for its lock. A DDL statement blocked by a long-running query fails the migration instead of blocking startup forever. |
| `MIGRATE_STATEMENT_TIMEOUT` | `600s` | Ceiling on a single statement inside a migration. |

### Declared but not implemented

`UPDATE_MODE` is carried through `.env` and the compose file, and **no application code reads it**. Setting it to `notify` does nothing: the instance makes no outbound update request and nothing appears in the admin area. It is documented here because the variable exists and would otherwise look broken rather than unbuilt. See [Updating](/docs/self-hosting/updating) for how to check for new versions today.

## Development-only switches

Present for local work and inert in the published image, which runs with `NODE_ENV=production`.

| Variable | Effect |
|---|---|
| `ENABLE_DEV_AUTH=true` | Adds a password-less "Dev Login" provider. Guarded by a `NODE_ENV !== "production"` check as well as the variable, so it cannot be turned on in a released image. |
| `ENABLE_EMAIL_IN_DEV=true` | Sends real email from a development machine, which is otherwise hard-blocked. |
| `SKIP_ENV_VALIDATION=1` | Skips the Zod check. For build steps that have no database, never for a running instance. |
