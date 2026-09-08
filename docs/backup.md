# Backup and restore

The canonical procedure lives at
[`content/docs/self-hosting/backup-and-restore.md`](../content/docs/self-hosting/backup-and-restore.md)
and is published at
[nisd2.eu/docs/self-hosting/backup-and-restore](https://www.nisd2.eu/docs/self-hosting/backup-and-restore).

This file used to carry a second copy. The two had already drifted, which for a
restore procedure means one of them was wrong and there was no way to tell which
from the outside. There is now one.

The short version, so nobody has to open a second tab to learn the shape of it:
an instance is two stores, not one. Postgres holds the rows, including the
storage key of every uploaded file. The object store holds the bytes. A database
restored without its objects points at evidence that no longer exists, which is
worse than having no backup, because it looks fine until an auditor opens a
document. Back both up together, restore both from the same archive.

Corrections belong in `content/docs/self-hosting/backup-and-restore.md`. The
website renders that file directly.
