# Updating a self-hosted instance

The canonical procedure lives at
[`content/docs/self-hosting/updating.md`](../content/docs/self-hosting/updating.md)
and is published at
[nisd2.eu/docs/self-hosting/updating](https://www.nisd2.eu/docs/self-hosting/updating).

This file used to carry a second copy, and the two had drifted.

The short version: back up first, because the project is forward-only and ships
no downgrade migrations. Migrations run at container start, before the server
binds, each inside a transaction, so a failed one rolls back and leaves your data
untouched. It does not leave the old version serving: `up -d` has already
replaced the container, so a failure means a restart loop until you pin the
version you were on. `docs/migration-policy.md` is what actually carries the
guarantee that a release does not break the one before it, and CI enforces it.

Corrections belong in `content/docs/self-hosting/updating.md`. The website
renders that file directly.
