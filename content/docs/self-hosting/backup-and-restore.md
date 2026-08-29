An instance is two stores, not one. Postgres holds the rows, including the storage key of every uploaded file. The object store holds the bytes. A database restored without its objects points at evidence that no longer exists, which is worse than having no backup at all, because it looks fine until an auditor opens a document.

So they are backed up together, in one archive, and restored together from that same archive.

Everything below has been run end to end: data written, backed up, every volume destroyed, then restored and verified. The repository runs the same drill in CI on every change to the compose file or the backup configuration.

## Turning it on

Add `backup` to `COMPOSE_PROFILES` and set a target:

```ini
BACKUP_S3_BUCKET=openisms-backups
BACKUP_S3_ENDPOINT=s3.eu-central-1.amazonaws.com   # host only, no scheme
BACKUP_S3_ENDPOINT_PROTO=https
BACKUP_S3_ACCESS_KEY=
BACKUP_S3_SECRET_KEY=
BACKUP_PASSPHRASE=          # openssl rand -base64 32
BACKUP_CRON=0 3 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_NOTIFICATION_URL=    # optional shoutrrr URL, notified only on failure
```

```bash
docker compose up -d
```

<div class="docs-callout docs-callout--warning">

`BACKUP_PASSPHRASE` encrypts each archive with GPG before it leaves the machine. **Keep it somewhere other than this server.** Without it nobody can read the archives, including you, and a passphrase stored only on the machine being backed up protects nothing.

With no bucket configured, archives stay in the `backup-archive` volume on this machine. That is a copy, not a backup: it dies with the server.

</div>

## What one archive contains

```text
/backup/database/database.sql   pg_dump --clean --if-exists of the whole database
/backup/evidence/               the object store's data directory, byte for byte
```

The dump is written by a command that runs inside the Postgres container immediately before the archive is created, so the SQL and the objects come from the same moment.

It is a logical dump on purpose: it restores into a newer Postgres major version, which a copy of the data directory cannot. That matters more than it sounds. Postgres 17 will eventually go out of support, and this is the path across.

## Take one now

```bash
docker compose exec backup backup
```

Worth doing before every update, and the only honest way to know the job works. Expect log lines for the pre-command, the archive, the encryption and the copy to each configured target.

## Restore

Order matters. The object store's data directory has to be in place **before** MinIO starts, and the database has to be restored into a running Postgres.

```bash
# 1. Stop everything. The restore replaces both stores wholesale.
docker compose down

# 2. Fetch the archive from wherever it lives, then decrypt it.
gpg --decrypt --batch --passphrase "$BACKUP_PASSPHRASE" \
  openisms-2026-08-26T03-00-00.tar.gz.gpg > restore.tar.gz

# 3. Unpack.
mkdir restored && tar -xzf restore.tar.gz -C restored

# 4. Put the objects back first, while MinIO is not running. Replace the
#    volume name if your project directory is not called open-isms;
#    `docker volume ls` shows the real names.
docker run --rm \
  -v open-isms_minio-data:/data \
  -v "$PWD/restored/backup/evidence":/src:ro \
  busybox sh -c 'rm -rf /data/* && cp -a /src/. /data/'

# 5. Start the database and the object store, but not the app: the app would
#    migrate a database you are halfway through restoring.
docker compose up -d postgres minio

# 6. Restore the database. The dump drops and recreates what it owns.
docker compose exec -T postgres \
  psql -U openisms -d openisms < restored/backup/database/database.sql

# 7. Now bring the app back.
docker compose up -d
```

Check the instance before you call it done: log in, open a requirement that has evidence attached, and download the file. That exercises both halves at once, which is the only check here that means anything.

## Restoring into a version you are not running

The dump carries the schema of whichever release took it. Start the app at **that** version (`OPEN_ISMS_VERSION`), let it come up, and only then update forward. Migrations run in order at startup, so going forward from an old backup works. Asking a newer release to interpret an older schema without migrating it does not.

## Test the restore

An untested backup is a belief, not a control. Twice a year, restore the newest archive into a throwaway copy of the stack: a different directory, which gives a different compose project and different volumes. Confirm a row count and one evidence download. It takes about fifteen minutes and it is the only evidence that any of this works.

This is also a requirement you can point at during an audit rather than describe. The platform models backup as a control; a dated restore test is what proves it.

## What is not covered

`.env` is not in the archive, and it holds `AUTH_SECRET`, the database password and the storage credentials. Losing it does not lose data, but a restore without it is a rebuild. Keep a copy in a password manager, not on the server.
