A NAS is what most Mittelstand operators and public bodies actually have, rather than a server. If open-isms runs there, it runs where the documents already are, which for anyone who cannot put compliance evidence in someone else's cloud is the whole point.

Two ways: the terminal, which is the same one command as anywhere else, or Container Manager, which is clicking.

<div class="docs-callout docs-callout--warning">

**What has been verified, and what has not.**

Verified: the images are published for x86-64 and ARM64, each built on its own native runner, and the compose file pulls a finished image rather than building one. The installer has been run end to end against the published image, and the framework data loads from it.

Not verified: **nobody has run this on a Synology yet.** The DSM-specific steps below come from Synology's documented behaviour rather than from a machine we have in front of us, and the two things most likely to differ are whether Container Manager's project import reads your `.env` and whether it honours `COMPOSE_PROFILES`. If either does not, the SSH route further down avoids both questions entirely.

If you run this on a NAS, an issue saying what actually happened is worth more to us than a star: [github.com/NISD2/open-isms/issues](https://github.com/NISD2/open-isms/issues).

</div>

## What you need

- **DSM 7.2 or later** with **Container Manager** from Package Center. On DSM 6 the package is called Docker and behaves differently enough that this page would mislead you.
- **A model with an x86-64 or ARM64 processor.** Both are published and `docker pull` picks the right one. Storage Manager, then Info Center, names the CPU. Older Atom and ARMv7 models have no image.
- **Disk and memory.** The application image is about 500 MB unpacked, and the stack adds Postgres and the object store beside it. Nothing is compiled on the NAS, so the build memory figures you may have seen do not apply. What the running stack needs on a small machine we have not measured, which is a gap rather than a reassurance: if you try it, tell us what it actually used.

<div class="docs-callout docs-callout--warning">

If a previous attempt failed with something like "the container will not start", check whether the compose file being used builds from source. The one in this repository's root (`docker-compose.yml`) is for developers and expects the whole repository next to it; a Next.js build needs more memory than most NAS models have. The file to use is `compose.self-host.yml`, which pulls a finished image and builds nothing. The installer below fetches the right one.

</div>

## Option 1: SSH, one command

Faster and less error-prone than clicking, if you are comfortable with a terminal.

Enable SSH in **Control Panel → Terminal & SNMP → Enable SSH service**, then from your own computer:

```bash
ssh your-admin-name@your-nas-address
sudo -i
cd /volume1/docker            # create it in File Station first if it is missing
curl -fsSL https://raw.githubusercontent.com/NISD2/open-isms/main/install.sh | bash
```

The installer needs root because Container Manager's Docker socket is root-owned on DSM.

When it finishes it prints an address. Change it before you use it from another computer, because the default assumes you are on the NAS itself. In `/volume1/docker/open-isms/.env`:

```ini
AUTH_URL=http://192.168.1.50:3026
NEXT_PUBLIC_APP_URL=http://192.168.1.50:3026
```

Use the NAS's own address. Then:

```bash
cd /volume1/docker/open-isms
docker compose up -d
```

Getting this wrong is the single most common self-host failure: sign-in appears to work, then bounces back to the sign-in page, because the session cookie was written for a different address than the one in the browser.

## Option 2: Container Manager, no terminal

1. **File Station.** Make a folder `docker/open-isms`.
2. **Download two files** on your own computer and upload them into it:
   - [`compose.self-host.yml`](https://raw.githubusercontent.com/NISD2/open-isms/main/compose.self-host.yml), renamed to `docker-compose.yml`
   - [`.env.self-host.example`](https://raw.githubusercontent.com/NISD2/open-isms/main/.env.self-host.example), renamed to `.env`
3. **Edit `.env`** in Text Editor and fill in the five values below. Every one of them has to be different from the example and from each other.

   ```ini
   POSTGRES_PASSWORD=<20+ random characters>
   AUTH_SECRET=<at least 32 characters>
   ERASURE_EMAIL_HASH_SALT=<at least 32 characters>
   AWS_SECRET_ACCESS_KEY=<20+ random characters>
   MINIO_KMS_KEY=<exactly 32 bytes, base64: see below>

   AUTH_URL=http://192.168.1.50:3026
   NEXT_PUBLIC_APP_URL=http://192.168.1.50:3026
   AWS_S3_ENDPOINT=http://192.168.1.50:9000
   COMPOSE_PROFILES=minio
   ```

   `MINIO_KMS_KEY` has to be exactly 32 bytes encoded as base64, which a password generator will not give you. If you cannot run `openssl rand -base64 32` anywhere, leave `minio` out of `COMPOSE_PROFILES` and use an S3 bucket instead ([Evidence storage](/docs/self-hosting/storage)); the rest of the platform works either way, only evidence file uploads depend on it.

4. **Container Manager → Project → Create.** Path: the folder from step 1. Source: "Use existing docker-compose.yml". Start it.
5. **Watch it come up.** The first start pulls four images, a few hundred megabytes in total. In the project's log you are waiting for `[migrate] all chains complete`, then `[seed] loaded 165 requirements`, then `✓ Ready`.
6. **Open** `http://your-nas-address:3026`.

If the project starts but the object store never appears, Container Manager did not apply `COMPOSE_PROFILES` from your `.env`. That is the unverified part of this page. Either add `--profile minio` through the SSH route, or drop the bundled store and point `AWS_S3_*` at an S3 bucket instead. Everything except evidence file uploads works either way.

## Signing in the first time

Nobody can register until the instance can send email, because sign-up verifies the address with a one-time code. On a NAS the quickest path is to read the code out of the log instead:

**Container Manager → Container → the `app` container → Log**, and search for `sign-in code`. The line looks like this:

```text
[mail] No RESEND_API_KEY is set, so nothing was sent. The sign-in code for you@example.com is 481920.
```

That is fine for one administrator on a machine only they can reach. Before inviting colleagues, configure a mail provider so codes reach them: [Email](/docs/self-hosting/email).

## Backups

DSM's own Hyper Backup does not know how to make a consistent copy of a running Postgres, and a database file copied mid-write may not restore. Use the `backup` profile instead, which takes a proper dump and the evidence files together in one encrypted archive: [Backup and restore](/docs/self-hosting/backup-and-restore).

If you would rather have Hyper Backup do the offsite part, point the backup profile at a local folder and let Hyper Backup carry the finished archives away.

## Reaching it from outside the office

Do not forward port 3026 from the internet to the NAS. It has no certificate, so passwords and evidence would cross the internet in clear text.

Two better options:

- **A VPN into the office network.** DSM has one built in, and it keeps the instance completely off the public internet. For a single organisation this is usually the right answer.
- **A real hostname with a certificate**, if people need access from outside without a VPN. That means DNS pointing at your connection and the `proxy` profile, or DSM's own reverse proxy in front. See [Domains and TLS](/docs/self-hosting/domains-and-tls).

## If it will not start

| What you see | What it is |
|---|---|
| The container restarts over and over | Read the log. If it stops shortly after `[migrate] connected to database`, a migration failed and your data is untouched: pin the previous version and report it. |
| `no matching manifest for linux/...` | The NAS has an older Intel Atom or an ARMv7 processor. Only x86-64 and ARM64 have images. |
| Port already allocated | Something else on the NAS uses that port. Change `APP_PORT`, `POSTGRES_PORT` or `MINIO_PORT` in `.env`, and keep `AWS_S3_ENDPOINT` on the same port as `MINIO_PORT`. |
| Sign-in bounces back to the sign-in page | `AUTH_URL` is not the address you typed in the browser. |
| Uploads fail in the browser | `AWS_S3_ENDPOINT` must be an address your browser can reach, so the NAS's address rather than `localhost`. |

More in [Troubleshooting](/docs/self-hosting/troubleshooting).
