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
| `Environment validation failed: AUTH_SECRET` | Under 32 characters, or unset. |
| Container restarts, logs stop after `[migrate] connected to database` | A migration failed. Read the lines above the exit. The container refuses to serve on a half-applied schema, and your data is intact. Pin the previous version to get back up: [Updating](/docs/self-hosting/updating). |
| Migration waits, then gives up | Another container is migrating the same database, or a long-running query holds a lock. The migrator takes a Postgres advisory lock and waits `MIGRATE_LOCK_WAIT`, 300s by default. |
| `no matching manifest for linux/...` | The architecture is neither x86-64 nor ARM64. Those are the two published. |
| Build killed at exit code 137 | Only reachable when building from source. Docker has under 4 GB. A normal install pulls the image and compiles nothing. |

## Login

| Symptom | Cause |
|---|---|
| Login redirects back to the sign-in page forever | `AUTH_URL` does not match the scheme users actually reach you on. This is the single most common self-host failure. Auth.js picks its cookie name from that URL's scheme, so the middleware is looking for a cookie the browser never received. |
| Sign-up says the code was sent, no email arrives | `RESEND_API_KEY` is unset, so nothing was sent. The code is in the log: `docker compose logs app \| grep "sign-in code"`. Configure a provider before inviting anyone else. See [Email](/docs/self-hosting/email). |
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
