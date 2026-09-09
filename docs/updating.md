# Updating a self-hosted instance

The canonical procedure lives at
[`content/docs/self-hosting/updating.md`](../content/docs/self-hosting/updating.md)
and is published at
[nisd2.eu/docs/self-hosting/updating](https://www.nisd2.eu/docs/self-hosting/updating).

This file used to carry a second copy, and the two had drifted.

The short version: back up first, because the project is forward-only and ships
no downgrade migrations. Migrations run at container start, before the server
binds, and almost all of them run inside a transaction, so a failure rolls back
and leaves your data untouched. The exception is a migration marked
`-- migrate:no-transaction`, which exists because Postgres will not build an
index `CONCURRENTLY` inside one: if that kind fails, the schema may be partly
changed. Either way the old version does not keep serving, because `up -d` has
already replaced the container, so a failure means a restart loop until you pin
the version you were on. `docs/migration-policy.md` is what actually carries the
guarantee that a release does not break the one before it, and CI enforces it.

Corrections belong in `content/docs/self-hosting/updating.md`. The website
renders that file directly.
