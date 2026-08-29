This is the production version of the [Quickstart](/docs/getting-started/quickstart): the same stack, with the profiles, the domain and the object store set up properly.

## The short way

The installer handles the whole of the next section, including a public hostname with automatic certificates:

```bash
curl -fsSL https://raw.githubusercontent.com/NISD2/open-isms/main/install.sh \
  | bash -s -- --domain isms.example.com
```

Point `isms.example.com` and `storage.isms.example.com` at the server **before** running it with `--domain`: certificates are ordered on first start, and an unresolvable name fails the order rather than serving anything.

Other options: `--dir <path>` to install somewhere other than `./open-isms`, `--url <url>` for an address without automatic certificates (behind a proxy you already run), `--no-start` to write the files and start nothing.

The rest of this page is what it does, for anyone who would rather do it by hand or needs to change something afterwards.

## The three files

```bash
mkdir open-isms && cd open-isms
curl -o compose.yaml https://raw.githubusercontent.com/NISD2/open-isms/main/compose.self-host.yml
curl -o .env         https://raw.githubusercontent.com/NISD2/open-isms/main/.env.self-host.example
curl -o Caddyfile    https://raw.githubusercontent.com/NISD2/open-isms/main/Caddyfile.self-host.example
```

`compose.yaml` pulls a published image and builds nothing. You never need a clone and you never need a fork, apart from the one seed step in [Framework data](/docs/self-hosting/framework-data).

## Profiles

Every optional service is defined in the compose file but only runs when its profile is on. A service behind an inactive profile is never created: no container, no port, no Docker socket.

| Profile | Service | What it gives you |
|---|---|---|
| `minio` | bundled object store | evidence uploads without an S3 account |
| `proxy` | Caddy on 443 | automatic HTTPS for your domain |
| `updater` | watchtower | an update that can be triggered over the internal network |
| `backup` | offen/docker-volume-backup | scheduled, encrypted, offsite archives |

Set them once in `.env`:

```ini
COMPOSE_PROFILES=minio,proxy,backup
```

Or pass them per command: `docker compose --profile minio --profile proxy up -d`.

Turning one on later is one command and never an edit to `compose.yaml`, which matters because that file lives on your server and we cannot update it for you.

<div class="docs-callout">

Add `proxy` only once your DNS already points at this server. Caddy orders real certificates on first start, so turning it on early fails the certificate order rather than serving anything.

</div>

## Fill in .env

The file is annotated; this is the shape of it.

```ini
OPEN_ISMS_VERSION=stable
COMPOSE_REVISION=1
COMPOSE_PROFILES=minio,proxy,backup

# Required
POSTGRES_PASSWORD=
AUTH_SECRET=
ERASURE_EMAIL_HASH_SALT=
AUTH_URL=https://isms.example.com
NEXT_PUBLIC_APP_URL=https://isms.example.com
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Proxy profile
APP_DOMAIN=isms.example.com
STORAGE_DOMAIN=storage.example.com

# Bundled object store
AWS_S3_BUCKET=evidence
AWS_ACCESS_KEY_ID=openisms
AWS_SECRET_ACCESS_KEY=
MINIO_KMS_KEY=
AWS_S3_ENDPOINT=https://storage.example.com
AWS_S3_INTERNAL_ENDPOINT=http://minio:9000
```

Generate the secrets rather than inventing them:

```bash
openssl rand -hex 16     # POSTGRES_PASSWORD, AWS_SECRET_ACCESS_KEY
openssl rand -base64 32  # AUTH_SECRET, MINIO_KMS_KEY
openssl rand -hex 32     # ERASURE_EMAIL_HASH_SALT
```

`AUTH_SECRET` under 32 characters fails startup with a Zod error naming the variable. `MINIO_KMS_KEY` must be exactly 32 bytes of base64 or every upload is rejected.

Full annotated list: [Configuration](/docs/self-hosting/configuration).

## Start

```bash
docker compose up -d
docker compose logs -f app
```

Expected: the image pulls, then `[migrate] all chains complete`, then `✓ Ready`. Migrations run before the server binds a port, so a container that never reaches `Ready` failed on the schema and not on the app.

Confirm health, which checks the database rather than just the process:

```bash
curl -s http://localhost:3026/api/health
```

```json
{"status":"ok","version":"0.2.8","composeRevision":"1","checks":{"database":"ok"}}
```

Under the `proxy` profile the bundled Caddyfile answers 404 for that path on the public side, so the version stays readable from the server and not from the internet.

The log also shows the framework data being loaded on a first start, which needs nothing from you:

```text
[seed] empty catalogue — loading db/framework-seed.sql
[seed] loaded 165 requirements
```

## Then, in order

1. [Email](/docs/self-hosting/email). Without it nobody can complete a first registration.
2. [Domains and TLS](/docs/self-hosting/domains-and-tls). Get `AUTH_URL` right before you walk away.
3. [Backup and restore](/docs/self-hosting/backup-and-restore). Before real evidence goes in, not after.
4. [Scheduled jobs](/docs/self-hosting/scheduled-jobs), if you want deadline reminders and the daily housekeeping to run.
5. [Framework data](/docs/self-hosting/framework-data), only if the portal came up empty.

Test one evidence upload before you consider the instance finished. Uploads are the one feature that fails visibly in the browser rather than degrading quietly, and they exercise the object store, the presigned URL and the Content-Security-Policy in one action.
