# Backup and restore

An instance is two stores, not one. Postgres holds the rows, including the
storage key of every uploaded file; the object store holds the bytes. A
database restored without its objects points at evidence that no longer
exists, which is a worse position than having no backup at all, because it
looks fine until an auditor opens a document.

So they are backed up together, in one archive, and restored together from
the same archive.

The commands below have been run end to end: data written, backed up,
every volume destroyed, then restored and verified. If you change anything
here, run the drill again rather than assuming.

## Turning it on

Add `backup` to `COMPOSE_PROFILES` in `.env` and set a target:

```bash
BACKUP_S3_BUCKET=openisms-backups
BACKUP_S3_ENDPOINT=s3.eu-central-1.amazonaws.com   # host only, no https://
BACKUP_S3_ENDPOINT_PROTO=https
BACKUP_S3_ACCESS_KEY=...
BACKUP_S3_SECRET_KEY=...
BACKUP_PASSPHRASE=...          # openssl rand -base64 32
BACKUP_CRON=0 3 * * *
BACKUP_RETENTION_DAYS=30
```

Then `docker compose up -d`.

`BACKUP_PASSPHRASE` encrypts each archive with GPG before it leaves the
machine. Compliance evidence should not sit unencrypted in someone else's
object store. **Keep the passphrase somewhere other than this server.**
Without it nobody can read the archives, including you, and a passphrase
stored only on the machine you are backing up protects nothing.

With no bucket configured, archives stay in the `backup-archive` volume on
this machine. That is a copy, not a backup: it dies with the server.

## What one archive contains

```
/backup/database/database.sql   pg_dump --clean --if-exists of the whole database
/backup/evidence/               the object store's data directory, byte for byte
```

The dump is written by a command that runs inside the Postgres container
immediately before the archive is created, so the SQL and the objects come
from the same moment. It is a logical dump on purpose: it restores into a
newer Postgres major version, which a copy of the data directory cannot. That
matters more than it sounds, because Postgres 17 will eventually go out of
support and this is the path across.

## Take one now

```bash
docker compose exec backup backup
```

Useful before an update, and the only honest way to know the job works. Expect
log lines for the pre-command, the archive, the encryption, and the copy to
each configured storage.

## Restore

The order matters: the object store's data directory has to be in place
**before** MinIO starts, and the database has to be restored into a running
Postgres.

```bash
# 1. Stop everything. The restore replaces both stores wholesale.
docker compose down

# 2. Fetch the archive from wherever it lives, then decrypt it.
gpg --decrypt --batch --passphrase "$BACKUP_PASSPHRASE" \
  openisms-2026-08-26T03-00-00.tar.gz.gpg > restore.tar.gz

# 3. Unpack.
mkdir restored && tar -xzf restore.tar.gz -C restored

# 4. Put the objects back first, while MinIO is not running. Replace the
#    volume name if your project directory is not called open-isms:
#    `docker volume ls` shows the real names.
docker run --rm \
  -v open-isms_minio-data:/data \
  -v "$PWD/restored/backup/evidence":/src:ro \
  busybox sh -c 'rm -rf /data/* && cp -a /src/. /data/'

# 5. Start the database and the object store, but not the app: the app
#    would migrate a database you are halfway through restoring.
docker compose up -d postgres minio

# 6. Restore the database. The dump drops and recreates what it owns.
docker compose exec -T postgres \
  psql -U openisms -d openisms < restored/backup/database/database.sql

# 7. Now bring the app back.
docker compose up -d
```

Check the instance before you call it done: log in, open a requirement that
has evidence attached, and download the file. That exercises both halves at
once, which is the only check that means anything here.

## Restoring into a version you are not running

The dump carries the schema of whichever release took it. Start the app at
**that** version (`OPEN_ISMS_VERSION` in `.env`), let it come up, and only
then update forward. Migrations run in order at startup, so going forward
from an old backup works; asking a newer release to interpret an older
schema without migrating it does not.

## Test the restore

An untested backup is a belief, not a control. Twice a year, restore the
newest archive into a throwaway copy of the stack (a different directory, so
a different compose project and different volumes), and confirm the row count
and one evidence download. It takes fifteen minutes and it is the only
evidence that any of this works.

The repository runs this drill on every change to the compose file or the
backup configuration: `.github/workflows/self-host.yml`, the `backup-drill`
job. It writes a row and an object, backs up, destroys every volume, restores,
and asserts both came back.

## What is not covered

`.env` is not in the archive, and it holds `AUTH_SECRET`, your database
password, and the storage credentials. Losing it does not lose data, but a
restore without it is a rebuild. Keep a copy in a password manager, not on
the server.
