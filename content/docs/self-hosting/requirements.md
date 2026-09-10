## Machine

- **Docker with Compose v2.** `docker compose version` should print `v2.x` or later.
- **x86-64 or ARM64.** Every release publishes both, each built on its own native runner rather than emulated, so an ARM NAS or a Raspberry Pi pulls the same version an Intel server does. `docker pull` picks the right one with no flags. Anything else has no image.
- **Postgres 16 or 17.** The compose file brings its own; skip that service if you already run one.

Nothing is compiled on your machine, so the 8 GB build figure that used to appear in this guide applies only if you deliberately [build from source](/docs/contributing/local-development). What the running stack needs on small hardware we have not measured. If you put this on a NAS or a modest VPS, an issue saying what it actually used would be genuinely useful.

Budget around ten minutes for a first install, most of it spent pulling images.

## Accounts

You do **not** need an AWS account, an AI provider or a Google Cloud project.

You do not need a mail account either, to get yourself in: `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` create the first account at startup, and Google OAuth skips the verification code entirely.

Anyone after you registers or is invited by email, and that needs a transport: an SMTP relay you already run, or a Resend account. See [Email](/docs/self-hosting/email).

## Ports

Everything binds to loopback by default, so a fresh install exposes nothing to the network.

| Service | Default | Variable |
|---|---|---|
| app | `127.0.0.1:3026` | `APP_BIND`, `APP_PORT` |
| postgres | `127.0.0.1:5432` | `POSTGRES_BIND`, `POSTGRES_PORT` |
| minio | `127.0.0.1:9000` | `MINIO_BIND`, `MINIO_PORT` |
| proxy | `0.0.0.0:80`, `:443`, `:443/udp` | profile `proxy` only |

<div class="docs-callout docs-callout--warning">

Publishing a container port on `0.0.0.0` bypasses `ufw`. Docker writes its own iptables rules ahead of it, so a firewall that looks closed is not. Use a provider-level firewall, or leave the bindings on loopback and let the `proxy` profile be the only thing facing the internet.

</div>

## Outbound network

Pulling images needs `ghcr.io` and `pkg-ghcr.githubusercontent.com`. The rest of the stack comes from Docker Hub.

At runtime the application calls out only to services you configure, plus one unconfigured call: `rdap.org` is queried during sign-up to check how old a registered domain is, as a throwaway-address signal. It has a short timeout and fails open.

Nothing reports to this project. Analytics renders no tag unless you set both `ANALYTICS_SCRIPT_URL` and `ANALYTICS_WEBSITE_ID` to your own endpoint, and there is no update check, no licence check and no telemetry. An air-gapped instance needs no extra setting to stay quiet, and it can still send mail: point `SMTP_HOST` at a relay inside your own network, which is reachable where a hosted mail API is not. Only the hosted API is off the table.
