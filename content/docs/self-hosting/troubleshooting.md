Start with these three, in order. Between them they explain most of what goes wrong.

```bash
docker compose ps                        # is anything restarting
docker compose logs app | tail -50       # why
curl -s http://localhost:3026/api/health # does it reach the database
```

## Startup

| Symptom | Cause |
|---|---|
| `Bind for 0.0.0.0:3026 failed: port is already allocated` | Another program on the machine holds that port. Change `APP_PORT`, `POSTGRES_PORT` or `MINIO_PORT` in `.env` and start again. If you change `MINIO_PORT`, move `AWS_S3_ENDPOINT` to the same port: presigned upload URLs are signed for that exact address. The installer picks free ports by itself. |
| `password authentication failed`, Postgres code `28P01` | The database was created with a different `POSTGRES_PASSWORD` than the one it is being given now. See [Reinstalling](#reinstalling-and-28p01) below, which is where this nearly always comes from. |
| `Environment validation failed: AUTH_SECRET` | Under 32 characters, or unset. |
| Container restarts, logs stop after `[migrate] connected to database` | A migration failed. Read the lines above the exit. The container refuses to serve on a half-applied schema, and your data is intact. Pin the previous version to get back up: [Updating](/docs/self-hosting/updating). |
| Migration waits, then gives up | Another container is migrating the same database, or a long-running query holds a lock. The migrator takes a Postgres advisory lock and waits `MIGRATE_LOCK_WAIT`, 300s by default. |
| `no matching manifest for linux/...` | The architecture is neither x86-64 nor ARM64. Those are the two published. |
| Build killed at exit code 137 | Only reachable when building from source. Docker has under 4 GB. A normal install pulls the image and compiles nothing. |

## Reinstalling, and 28P01

Reinstalling does not start over, and this catches almost everyone who tries it.

The database does not live in the install directory. It lives in a Docker volume named after the compose project, which is named after the directory. `docker compose down` keeps that volume by design, and so does deleting the directory: creating a directory with the same name again re-attaches the same volume. Postgres, for its part, sets the password exactly once, when `initdb` first creates the data directory, and never looks at `POSTGRES_PASSWORD` again.

So a second install writes a new random password into a new `.env`, hands it to a database that has never seen it, and the app crash-loops with:

```
error: password authentication failed for user "openisms"
  code: '28P01'
```

Nothing is wrong with the release. Pick whichever of these is true for you.

**The instance is empty and you want a genuinely clean start.** Deleting the volumes is what "start over" actually requires:

```bash
docker compose down -v
docker compose up -d
```

Your `.env` is untouched, so the new database is created with the password already in it.

`-v` removes **every** volume this project owns, not only the database: `postgres-data`, `minio-data`, `database-dump`, `backup-archive`, `caddy-data` and `caddy-config`. If you have uploaded evidence, or you keep local archives from the `backup` profile, those go too, and none of it can be undone. "Empty" has to mean empty of files as well as of compliance rows.

**The instance holds data and you still have the old `.env`.** Put it back next to `compose.yaml`. That is the only thing that opens the instance as it stands, and it is by far the best of the three: it recovers the object store and the erasure salt along with the database.

**The instance holds data and the old `.env` is gone.** The database is recoverable. Some other things are not, so read this before you start.

Change the database's password to the one in your new `.env`. No old password is needed, because Postgres trusts connections made from inside its own container:

```bash
docker compose exec postgres psql -U openisms -d openisms
```

At the `openisms=#` prompt:

```
\password openisms
```

It asks twice. Paste the `POSTGRES_PASSWORD` value from `.env`, then `\q` to leave, then `docker compose restart app`. If you changed `POSTGRES_USER` or `POSTGRES_DB`, use those names instead.

Use `\password` rather than writing the `ALTER USER` yourself. It prompts instead of taking the password as an argument, so the value never reaches your shell history or the process list, and a password containing quotes needs no escaping.

One trap if you write `POSTGRES_PASSWORD` by hand rather than letting the installer generate it: compose interpolates `.env` before it hands the value to the container, so a `$` starts a variable reference and usually expands to nothing. `pa$$word` reaches Postgres as `pa`. Write `$$` for a literal `$`, or avoid the character. The same applies to every secret in that file.

What a lost `.env` costs you, beyond the database:

| Value | What its loss does |
|---|---|
| `MINIO_KMS_KEY` | Every evidence file already in the bundled object store was encrypted under it and cannot be decrypted without it. There is no recovery. |
| `AUTH_SECRET` | Everyone is signed out once. Harmless. |
| `ERASURE_EMAIL_HASH_SALT` | Digests written by past GDPR erasures stop matching. Past erasures stay erased; the record of which address they covered no longer resolves. |
| `AWS_SECRET_ACCESS_KEY` | Doubles as the bundled MinIO root password, so the store has to be given the new one the same way Postgres was. |
| `BACKUP_PASSPHRASE` | Existing encrypted archives cannot be read, including by you. |

This is why the installer refuses to write a fresh `.env` over a surviving instance instead of doing it for you.

One thing that will not help you here: `docker compose ps` reports Postgres as **healthy** throughout. The health check is `pg_isready`, which asks whether the server accepts connections, not whether your credentials work. It answers yes for a user that does not exist.

## Login

| Symptom | Cause |
|---|---|
| Login redirects back to the sign-in page forever | `AUTH_URL` does not match the scheme users actually reach you on. This is the single most common self-host failure. Auth.js picks its cookie name from that URL's scheme, so the middleware is looking for a cookie the browser never received. |
| Sign-up says the code was sent, no email arrives | Neither `SMTP_HOST` nor `RESEND_API_KEY` is set, so nothing was sent. The code is in the log: `docker compose logs app \| grep "sign-in code"`. For your own first account, `BOOTSTRAP_ADMIN_EMAIL` skips this entirely. See [Email](/docs/self-hosting/email). |
| Set `BOOTSTRAP_ADMIN_*` and still cannot sign in | Read `docker compose logs app \| grep "\[bootstrap\]"`. A malformed address or a password outside 8-128 characters is refused there by name, and the instance starts anyway rather than crash-looping. If the line says the account already exists, the variables are being ignored on purpose: they only ever create, and never reset a password. |
| SMTP configured, nothing sends, the log says "refusing to send" | `MAIL_FROM_EMAIL` is unset, so the From address would be this project's default on a domain you do not own. Set it to an address on your own domain. |
| Mail that used to arrive has stopped | `docker compose logs app \| grep "\[mail\] send failed"` lists every send that failed and the reason the transport gave. The same records appear as a **Failed sends** card on the email tab of `/platform-admin`, if your address is in `PLATFORM_ADMIN_EMAILS`; that variable ships empty, so on a default install the log is the view you have. |
| Registration succeeds but no code, and the domain is new | Sign-up checks domain age over RDAP as a throwaway-address signal. It fails open, so this is rarely the cause, but a very new domain is worth ruling out. |

## Content

| Symptom | Cause |
|---|---|
| Portal loads but there are no requirements | The framework data did not load. From 0.2.9 the container does this itself at startup, so check the log for a `[seed]` line saying why. On older versions it was a manual step: [Framework data](/docs/self-hosting/framework-data). |
| Requirement counts look wrong after an update | The framework migration in that release has not applied. Check `docker compose logs app` for `[migrate` lines and confirm the version at `/api/health`. |

## Evidence uploads

| Symptom | Cause |
|---|---|
| Upload fails in the browser with a CSP error | `AWS_S3_ENDPOINT` does not match the origin the browser is PUTting to. The policy is computed per request, so `curl -sI https://your-url/ \| grep -i content-security-policy` shows exactly what it currently allows. |
| An evidence row appears but the file is not in the bucket | The browser's upload was refused and the server never learned. Presigning is offline, so nothing server-side notices a blocked PUT. Check the CSP row above first, then that the bucket exists. |
| Upload rejected, MinIO logs mention server-side encryption | `MINIO_KMS_KEY` is unset or is not 32 bytes of base64. |
| Upload works, deleting an evidence file fails | `AWS_S3_INTERNAL_ENDPOINT` is wrong. Uploads never touch it; deletion is the first call the server actually makes. |
| `Bind for 0.0.0.0:9000 failed: port is already allocated` | Something else on the box uses 9000. Set `MINIO_PORT` and match `AWS_S3_ENDPOINT` to it. |

## Certificates

| Symptom | Cause |
|---|---|
| TLS error instead of a page, right after enabling `proxy` | DNS did not resolve to this server when Caddy ordered the certificate. Point the record, then `docker compose restart proxy`. |
| The app works but evidence uploads fail over HTTPS | `STORAGE_DOMAIN` has no certificate, or `AWS_S3_ENDPOINT` still says `http://localhost:9000`. Both names need to resolve here and both have to match. |

## Getting help

Open an issue at [github.com/NISD2/open-isms/issues](https://github.com/NISD2/open-isms/issues). Include:

- your `compose.yaml` and `.env` with every secret stripped,
- `docker compose logs app | tail -50`,
- what `curl -s localhost:3026/api/health` returns.

The version in that health response is the first thing anyone will ask for.
