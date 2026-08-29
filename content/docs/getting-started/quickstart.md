One command, on any machine with Docker. It downloads the configuration, generates the secrets, starts the four containers, waits until they are healthy, and loads the NIS 2 framework data.

```bash
curl -fsSL https://raw.githubusercontent.com/NISD2/open-isms/main/install.sh | bash
```

Then open [http://localhost:3026](http://localhost:3026).

<div class="docs-callout">

Piping a script into `bash` means running code you have not read. If you would rather look first, which is a reasonable habit for anyone whose job is security:

```bash
curl -fsSL https://raw.githubusercontent.com/NISD2/open-isms/main/install.sh -o install.sh
less install.sh
bash install.sh
```

</div>

## If you have never used Docker

Docker is the standard way to run server software without installing its parts one at a time. open-isms needs a database, an application and a file store; Docker runs all three from one configuration file, and removes them just as cleanly.

Install it first:

| Your machine | What to install |
|---|---|
| Windows or macOS | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| Linux server | [Docker Engine](https://docs.docker.com/engine/install/) |
| Synology NAS | Package Center, then **Container Manager**. See [Synology NAS](/docs/self-hosting/synology) |

Then run the command above in a terminal: **Terminal** on macOS, **PowerShell** on Windows, your SSH session on a server. The installer checks Docker is really running before it does anything, and says what to do if it is not.

## What the installer does

Nothing is hidden, and nothing is irreversible:

1. **Checks Docker** is installed and running.
2. **Makes a folder**, `./open-isms`, and downloads three files into it: `compose.yaml` (what to run), `.env` (your settings) and `framework-seed.sql`.
3. **Generates five secrets** with `openssl` and writes them into `.env`. Re-running never regenerates them, because a new database password would lock the database out of its own data.
4. **Picks free ports.** If something on the machine already uses 3026, 5432 or 9000, it moves to the next free port and keeps the settings that depend on it in step.
5. **Starts the stack** and waits for `/api/health` to answer.
6. **Checks the framework data** is loaded, and loads it if the image is an older one that does not do it itself.

Everything lives in that one folder. Delete it and the instance is gone.

## Check it worked

```bash
cd open-isms
curl -s http://localhost:3026/api/health
```

```json
{
  "status": "ok",
  "version": "0.2.8",
  "composeRevision": "1",
  "checks": { "database": "ok" }
}
```

`status: ok` means the application is running **and** reached its database. `version` is stamped into the image at release; `dev` there means the image was built somewhere else.

## The one thing that is still missing

You can open it, but nobody can sign in yet. Registration verifies the address with a one-time code, and a fresh instance has no way to send email.

Two ways forward, and the first needs no account anywhere:

**Read the code from the log.** Register in the browser, then:

```bash
docker compose logs app | grep "sign-in code"
```

```text
[mail] No RESEND_API_KEY is set, so nothing was sent. The sign-in code for you@example.com is 481920.
```

Good enough to get in and look around, and fine for a single administrator on a machine only they can reach.

**Or configure email properly**, which you want before inviting anyone else. Put a [Resend](https://resend.com) key in `.env` and restart:

```ini
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=isms@yourdomain.example
```

```bash
docker compose up -d
```

Details, including the Google sign-in alternative: [Email](/docs/self-hosting/email).

## Everyday commands

Run these from inside the `open-isms` folder.

| | |
|---|---|
| `docker compose logs -f app` | watch what it is doing |
| `docker compose pull && docker compose up -d` | update to the newest version |
| `docker compose down` | stop it. Your data stays |
| `docker compose down -v` | stop it **and delete all data** |

## Next

- [Domains and TLS](/docs/self-hosting/domains-and-tls) to put it on a real address with a certificate.
- [Backup and restore](/docs/self-hosting/backup-and-restore) before you put anything real in it.
- [Configuration](/docs/self-hosting/configuration) for every setting there is.
