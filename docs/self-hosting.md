# Self-hosting open-isms

The self-hosting guide now lives in `content/docs/`, which is what
[nisd2.eu/docs](https://www.nisd2.eu/docs) publishes with search and cross-links.
This file used to carry a second copy of it. Two copies of an install procedure
drift, and the one about restoring a backup is the worst place for that to
happen, so this is now a table of contents rather than a duplicate.

Start here:

| Page | Source |
|---|---|
| [Requirements](https://www.nisd2.eu/docs/self-hosting/requirements) | [`content/docs/self-hosting/requirements.md`](../content/docs/self-hosting/requirements.md) |
| [Installation](https://www.nisd2.eu/docs/self-hosting/installation) | [`content/docs/self-hosting/installation.md`](../content/docs/self-hosting/installation.md) |
| [Configuration](https://www.nisd2.eu/docs/self-hosting/configuration) | [`content/docs/self-hosting/configuration.md`](../content/docs/self-hosting/configuration.md) |
| [Domains and TLS](https://www.nisd2.eu/docs/self-hosting/domains-and-tls) | [`content/docs/self-hosting/domains-and-tls.md`](../content/docs/self-hosting/domains-and-tls.md) |
| [Storage](https://www.nisd2.eu/docs/self-hosting/storage) | [`content/docs/self-hosting/storage.md`](../content/docs/self-hosting/storage.md) |
| [Email](https://www.nisd2.eu/docs/self-hosting/email) | [`content/docs/self-hosting/email.md`](../content/docs/self-hosting/email.md) |
| [Framework data](https://www.nisd2.eu/docs/self-hosting/framework-data) | [`content/docs/self-hosting/framework-data.md`](../content/docs/self-hosting/framework-data.md) |
| [Scheduled jobs](https://www.nisd2.eu/docs/self-hosting/scheduled-jobs) | [`content/docs/self-hosting/scheduled-jobs.md`](../content/docs/self-hosting/scheduled-jobs.md) |
| [Backup and restore](https://www.nisd2.eu/docs/self-hosting/backup-and-restore) | [`content/docs/self-hosting/backup-and-restore.md`](../content/docs/self-hosting/backup-and-restore.md) |
| [Updating](https://www.nisd2.eu/docs/self-hosting/updating) | [`content/docs/self-hosting/updating.md`](../content/docs/self-hosting/updating.md) |
| [Troubleshooting](https://www.nisd2.eu/docs/self-hosting/troubleshooting) | [`content/docs/self-hosting/troubleshooting.md`](../content/docs/self-hosting/troubleshooting.md) |
| [Synology / NAS](https://www.nisd2.eu/docs/self-hosting/synology) | [`content/docs/self-hosting/synology.md`](../content/docs/self-hosting/synology.md) |

Two things worth knowing before you pick a compose file:

**Use `compose.self-host.yml`.** It pulls a published image and builds nothing.
`install.sh` sets it up for you. The `docker-compose.yml` at the repository root
is the developer stack: it builds from source, takes 10 to 20 minutes and about
8 GB of RAM, and expects the whole repository as its build context.

**`apps/reference/docker-compose.yml` is a third, unrelated thing.** A minimal
demo of the workspace packages with a landing page, two portal pages and
magic-link auth that needs an SMTP transport you write yourself. Use it to
understand the packages, not to run an ISMS.

## Getting help

Open an issue at https://github.com/NISD2/open-isms/issues. Include your compose
file with secrets stripped, the output of `docker compose logs app | tail -50`,
and what `curl -s localhost:3026/api/health` returns.

Corrections to any page above are welcome as pull requests against the file in
`content/docs/`. The website renders that directory directly, so a merged fix is
live on the next deploy.
