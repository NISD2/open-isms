#!/usr/bin/env bash
# Proves the migrator explains a refused password instead of dumping a stack.
#
#   DATABASE_URL=postgres://... scripts/ci/wrong-password-drill.sh
#
# 28P01 is the most common self-host failure after the first install, and it is
# never a bug in the release: the Docker volume outlives both `compose down`
# and `rm -rf` of the install directory, Postgres sets its password once at
# initdb, and a reinstall generates a new one. Until this was handled the app
# hit an unhandled rejection and printed forty lines of pg-protocol internals,
# which is indistinguishable from a crash and sent people to open issues.
#
# Three claims:
#
#   1. It names the error and exits 1, rather than throwing.
#   2. It prints a recovery someone can paste. Both routes appear, because
#      "delete your database" is wrong advice for an instance that has data.
#   3. No stack trace survives. A single pg-protocol frame is enough to make
#      the reader stop reading and conclude the software is broken.

set -euo pipefail

DB="${DATABASE_URL:?DATABASE_URL is required}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Same connection in every respect but the password, so 28P01 is the only
# thing under test. A wrong host or database would fail differently.
WRONG_DB="$(printf '%s' "$DB" | sed 's|://\([^:]*\):[^@]*@|://\1:a-password-this-database-never-had@|')"
[ "$WRONG_DB" != "$DB" ] || { echo "[drill] FAIL: could not rewrite the password in DATABASE_URL"; exit 1; }

echo "[drill] running the migrator against the right database with the wrong password"
set +e
OUT="$(cd "$ROOT" && DATABASE_URL="$WRONG_DB" node scripts/runtime-migrate.mjs 2>&1)"
CODE=$?
set -e

[ "$CODE" -eq 1 ] || {
  echo "[drill] FAIL: expected exit 1, got $CODE"; echo "$OUT" | tail -20; exit 1;
}

for phrase in "28P01" "docker compose down -v" "ALTER USER"; do
  echo "$OUT" | grep -qF "$phrase" || {
    echo "[drill] FAIL: the message never mentions '$phrase'"; echo "$OUT"; exit 1;
  }
done

echo "$OUT" | grep -q "pg-protocol" && {
  echo "[drill] FAIL: a raw stack trace reached the log"; echo "$OUT"; exit 1;
}

echo "[drill] refused password explained, both recovery routes offered, no stack trace"

# And the same script still connects when the password is right, so the guard
# cannot pass by refusing everything.
echo "[drill] running the migrator with the correct password"
OUT="$(cd "$ROOT" && DATABASE_URL="$DB" node scripts/runtime-migrate.mjs 2>&1)"
echo "$OUT" | grep -q "\[migrate\] connected to database" || {
  echo "[drill] FAIL: the correct password no longer connects"; echo "$OUT" | tail -20; exit 1;
}

echo "[drill] passed"
