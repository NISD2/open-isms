Updates are published as versioned images at `ghcr.io/nisd2/open-isms`. Your `compose.yaml` names a tag; updating means pulling a newer image behind that tag and recreating the container. No clone, no fork, nothing compiled.

Each release carries its own database migrations, and the container applies them at startup before it serves anything. That includes framework content: when a legal interpretation changes or a requirement is reworded, it reaches your instance the same way a code change does.

## Pick how you track versions

```ini
OPEN_ISMS_VERSION=stable    # follow releases
OPEN_ISMS_VERSION=0.2.8     # stay exactly here until you decide otherwise
```

`stable` moves only after a release has passed the upgrade gate in CI, which pulls the published image, applies the previous release's migrations to a database, fills it with realistic data including the shapes a careless constraint would reject, applies the new release's migrations, checks they are idempotent, and boots the result. Pinning an exact version is the more conservative choice, and it is also how you roll back.

## Update

```bash
# 1. Take a backup. Migrations are forward-only; there is no undo.
docker compose exec backup backup     # if you run the backup profile

# 2. Update.
docker compose pull
docker compose up -d

# 3. Confirm.
curl -s https://isms.example.com/api/health | jq
```

The health response reports the running version, so you can watch the new one take effect. Read the release notes first when an update contains migrations. If you are several versions behind they all apply in sequence during one startup, which is supported and makes the backup step matter more.

## When a migration fails

Each migration runs inside a transaction. If one fails it rolls back and the container exits rather than serving against a half-changed schema. **Your data is intact**, and the migrations that succeeded before it stay applied.

What is not true, and is worth knowing before you need it: the old version does *not* keep running. `docker compose up -d` has already replaced the container by the time migrations run, so the failure leaves a container restarting in a loop and the site down. Coolify and similar tools that swap containers only after a health check do hold the old version; plain Docker Compose does not.

Recover by pinning the version you were on:

```ini
OPEN_ISMS_VERSION=0.2.7
```

```bash
docker compose up -d
```

Every release is built to keep the release before it working against the schema a newer migration left behind, so this brings the instance straight back up. Then send us the container log: `docker compose logs app | tail -50`.

If you do not remember which version you were on, `docker image ls ghcr.io/nisd2/open-isms` lists what has been pulled on this machine. The previous image is kept on purpose rather than cleaned up after an update, so recovery works immediately and without network access. Each release you keep costs about 500 MB of disk; run `docker image prune` once an update has proven itself in use.

## Rolling back a successful update

Same mechanism: pin the previous version and `up -d`. One step back is supported by design. Two or more steps back is not: restore from backup instead, and note that restoring loses anything written since the backup ran.

## Checking for new versions

There is no update check inside the application. `UPDATE_MODE` exists in `.env` and the compose file and **nothing reads it**, so setting it to `notify` does nothing at all.

Until that is built, watch [the tags](https://github.com/NISD2/open-isms/tags), or ask the registry directly:

```bash
curl -s "https://ghcr.io/token?scope=repository:nisd2/open-isms:pull&service=ghcr.io" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p' \
  | xargs -I{} curl -s -H "Authorization: Bearer {}" \
      https://ghcr.io/v2/nisd2/open-isms/tags/list
```

Compare that against what your instance reports at `/api/health`.

When it is built, the intent is one request a day to the GitHub releases API, with no instance identifier and no telemetry: it asks what the newest release is and compares locally. Unattended updates are deliberately not planned. They apply migrations to a compliance database with nobody watching and no fresh backup, which is a poor trade for the convenience.

## The updater profile

With `--profile updater` the stack runs a small companion container (watchtower) that can pull a new image and recreate the app on request. It exposes an HTTP endpoint on the internal network, authenticated with `UPDATE_API_TOKEN`.

The in-app button that would call it does not exist yet, so today the endpoint is only reachable by something you drive yourself. `docker compose pull && docker compose up -d` does the same job with nothing extra installed, which is why the profile is off by default.

What it does and does not do:

- It publishes no port and is reachable only from inside the stack.
- With no polling configured it never acts on its own; it acts when asked.
- It is scoped by label to the app container and will not touch anything else on the host.
- Cleanup is deliberately off, so the image you were running is still on disk when you need to roll back.
- It mounts the Docker socket, which is root-equivalent on the host. That is true of every self-update mechanism, including the ones built into Coolify and Portainer, and it is why the profile is off by default and why the application itself never holds the socket.

Enable it later without editing `compose.yaml`:

```bash
docker compose --profile updater up -d
```

## No internet at all

An instance with no outbound access still updates, by hand. On a machine that does have access:

```bash
docker pull ghcr.io/nisd2/open-isms:0.2.8
docker save ghcr.io/nisd2/open-isms:0.2.8 | gzip > openisms-0.2.8.tar.gz
```

Move the file across, `docker load < openisms-0.2.8.tar.gz`, set `OPEN_ISMS_VERSION=0.2.8`, and `docker compose up -d`. Migrations apply at startup exactly as they would otherwise, and nothing in the app reaches out on its own, so an air-gapped instance needs no extra setting to stay quiet.

A fully offline instance cannot send email, and sign-up verifies addresses with a one-time code, so nobody can complete a first login without a mail route. Plan for that before disconnecting.

## Egress-restricted networks

Pulling images needs `ghcr.io` and `pkg-ghcr.githubusercontent.com`. The rest of the stack comes from Docker Hub.

## When the compose file itself changes

`COMPOSE_REVISION` in `.env` records which revision of `compose.yaml` you are running. Some releases need a change there, a new service or a new variable, and the release notes say so. The app reports the value it was given at `/api/health` as `composeRevision`, so you can see what your deployment believes it is running.
