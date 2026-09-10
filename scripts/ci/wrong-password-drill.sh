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

for phrase in "28P01" "docker compose down -v" "\\password"; do
  echo "$OUT" | grep -qF "$phrase" || {
    echo "[drill] FAIL: the message never mentions '$phrase'"; echo "$OUT"; exit 1;
  }
done

echo "$OUT" | grep -q "pg-protocol" && {
  echo "[drill] FAIL: a raw stack trace reached the log"; echo "$OUT"; exit 1;
}

echo "[drill] refused password explained, both recovery routes offered, no stack trace"

# A connection failure that is NOT 28P01 must also be explained rather than
# thrown. This is the path a Coolify-style deployment takes when the database
# host is renamed or POSTGRES_DB changes, where compose's service_healthy gate
# does not exist to catch it first.
echo "[drill] running the migrator against a database that does not exist"
MISSING_DB="${DB%/*}/no-such-database"
set +e
OUT="$(cd "$ROOT" && DATABASE_URL="$MISSING_DB" node scripts/runtime-migrate.mjs 2>&1)"
CODE=$?
set -e

[ "$CODE" -eq 1 ] || { echo "[drill] FAIL: expected exit 1, got $CODE"; echo "$OUT" | tail -20; exit 1; }
echo "$OUT" | grep -qF "Could not connect" || {
  echo "[drill] FAIL: a non-28P01 connection failure was not explained"; echo "$OUT" | tail -20; exit 1;
}
echo "$OUT" | grep -q "pg-protocol" && {
  echo "[drill] FAIL: a raw stack trace reached the log"; echo "$OUT"; exit 1;
}
echo "[drill] other connection failures explained too"

# And the same script still connects when the password is right, so the guard
# cannot pass by refusing everything. set +e around it deliberately: under
# `set -e` a failing assignment kills the script before the diagnostic below
# can say what went wrong, which is the least useful report for the assertion
# that matters most here.
echo "[drill] running the migrator with the correct password"
set +e
OUT="$(cd "$ROOT" && DATABASE_URL="$DB" node scripts/runtime-migrate.mjs 2>&1)"
CODE=$?
set -e

[ "$CODE" -eq 0 ] || {
  echo "[drill] FAIL: the correct password no longer connects (exit $CODE)"; echo "$OUT" | tail -20; exit 1;
}
echo "$OUT" | grep -q "\[migrate\] connected to database" || {
  echo "[drill] FAIL: no connection line"; echo "$OUT" | tail -20; exit 1;
}

# No teardown, deliberately. The two drills that run before this one in the
# same job already migrate and seed this database, and the migrator is
# idempotent, so the final run above changes nothing. Dropping the schema to
# "clean up" would leave the database emptier than this drill found it, which
# is the opposite of the property bootstrap-admin-drill.sh preserves when it
# deletes only the single row it created.

echo "[drill] passed"
