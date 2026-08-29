# Updating a self-hosted instance

> Also published at **[nisd2.eu/docs/self-hosting/updating](https://www.nisd2.eu/docs/self-hosting/updating)**.

Updates are published as versioned images at `ghcr.io/nisd2/open-isms`. You do
not need a clone of this repository, and you never need a fork. Your
`compose.yaml` names a tag; updating means pulling a newer image behind that
tag and recreating the container.

Each release carries its own database migrations, and the container applies
them to your database at startup before it serves anything. That includes
framework content: when a legal interpretation changes or a requirement is
reworded, it reaches your instance the same way a code change does.

## Pick how you track versions

In `.env`:

```bash
OPEN_ISMS_VERSION=stable    # follow releases
OPEN_ISMS_VERSION=0.2.8     # stay exactly here until you decide otherwise
```

`stable` moves only after a release has passed the upgrade gate in CI, which
installs it from scratch, upgrades into it from the previous release, and
boots it. Pinning an exact version is the more conservative choice and is what
you set when you need to roll back.

## Update

```bash
# 1. Take a backup. Migrations are forward-only; there is no undo.
#    Setup and restore: docs/backup.md
docker compose exec backup backup    # if you run the backup profile
# 2. Update.
docker compose pull
docker compose up -d
# 3. Confirm.
curl -s https://your-domain/api/health | jq
```

The health response reports the running version, so you can see the new one
took effect.

Read the release notes first when the update contains migrations. If you are
several versions behind, they all apply in sequence during one startup, which
is supported but makes the backup step matter more.

## When a migration fails

Each migration runs inside a transaction. If one fails, it rolls back and the
container exits rather than serving against a half-changed schema. **Your data
is intact**, and the migrations that succeeded before it stay applied.

What is not true, and is worth knowing before you need it: the old version
does *not* keep running. `docker compose up -d` has already replaced the
container by the time migrations run, so the failure leaves a container
restarting in a loop and the site down. (Coolify and similar tools that swap
containers only after a health check do hold the old version; plain Docker
Compose does not.)

Recover by pinning the version you were on and starting it again:

```bash
# .env
OPEN_ISMS_VERSION=0.2.7
docker compose up -d
```

The previous release's code is supported against the schema left behind by a
partial upgrade, so this brings the instance straight back up. Then send us
the container log: `docker compose logs app | tail -50`.

If you do not remember which version you were on, `docker image ls
ghcr.io/nisd2/open-isms` lists what has been pulled on this machine. The
previous image is kept on purpose rather than cleaned up after an update, so
this recovery works immediately and without network access. Each release you
keep costs about 500 MB of disk; run `docker image prune` to reclaim it once an
update has proven itself in use.

## Rolling back a successful update

Same mechanism: pin the previous version and `up -d`. Each release is built to
keep the release before it working against the newer schema, so one step back
is safe. Two or more steps back is not covered — restore from backup instead,
and note that restoring loses anything written since the backup ran.

## Update notifications

**Not implemented yet.** `UPDATE_MODE` and `UPDATE_API_TOKEN` are carried
through `.env` and the compose file, but no application code reads either one
today. Setting `UPDATE_MODE=notify` does nothing: the instance makes no
outbound update request, and nothing appears in the admin area. Documented
here because the variables exist and would otherwise look broken rather than
unbuilt.

Until it lands, checking for updates is a manual step. Watch the tags at
`github.com/NISD2/open-isms/tags`, or ask the registry directly:

```bash
curl -s "https://ghcr.io/token?scope=repository:nisd2/open-isms:pull&service=ghcr.io" \
  | sed -n 's/.*"token":"\([^"]*\)".*/\1/p' \
  | xargs -I{} curl -s -H "Authorization: Bearer {}" \
      https://ghcr.io/v2/nisd2/open-isms/tags/list
```

Compare that against what your instance reports at `/api/health`.

When it is built, the intent is one request a day to the GitHub releases API,
with no instance identifier and no telemetry: it asks what the newest release
is and compares locally. Unattended updates are deliberately not planned. They
apply migrations to a compliance database with nobody watching and no fresh
backup, which is a poor trade for the convenience.

Egress-restricted networks: pulling images needs `ghcr.io` and
`pkg-ghcr.githubusercontent.com`, and the rest of the stack comes from Docker
Hub.

## The updater profile

With `--profile updater`, the stack runs a small companion container
(watchtower) that can pull a new image and recreate the app on request. It
exposes an HTTP endpoint on the internal network, authenticated with
`UPDATE_API_TOKEN`.

The in-app button that would call it does not exist yet, so today the endpoint
is only reachable by something you drive yourself. Running `docker compose
pull && docker compose up -d` does the same job with nothing extra installed,
which is why this profile is off by default.

It publishes no port, is reachable only from within the stack, and does
nothing on its own: with no periodic polling configured it acts only when
called. It is scoped by label to the app container and will not touch anything
else on the host.

It does mount the Docker socket, which is root-equivalent on the host. That is
true of every self-update mechanism, including the ones built into Coolify and
Portainer, and it is why the profile is off by default and why the application
itself never holds the socket. Running updates from the command line instead
is a perfectly good way to operate and gives up nothing but the button.

Enable it later without editing `compose.yaml`:

```bash
docker compose --profile updater up -d
```

## No internet at all

An instance with no outbound access still updates, just by hand. On a machine
that does have access:

```bash
docker pull ghcr.io/nisd2/open-isms:0.2.8
docker save ghcr.io/nisd2/open-isms:0.2.8 | gzip > openisms-0.2.8.tar.gz
```

Move the file across, then `docker load < openisms-0.2.8.tar.gz`, set
`OPEN_ISMS_VERSION=0.2.8`, and `docker compose up -d`. Migrations apply at
startup exactly as they would otherwise. Nothing in the app reaches out on its
own today, so an air-gapped instance needs no extra setting to keep it quiet.

Note that a fully offline instance cannot send email, and the sign-up flow
verifies addresses with a one-time code, so no one can complete a first login
without a mail route. Plan for that before disconnecting.

## When the compose file itself changes

`COMPOSE_REVISION` in `.env` records which revision of `compose.yaml` you are
running. Some releases need a change there — a new service, a new variable —
and the tag notes say so. The app reports the value it was given at
`/api/health` as `composeRevision`, so you can see what your deployment
believes it is running. Comparing that against what a release expects is the
manual half of the notification feature above.
