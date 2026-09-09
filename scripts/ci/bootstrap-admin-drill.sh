#!/usr/bin/env bash
# Proves the one thing that decides whether a self-hoster with no mail can use
# this at all: BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD produce an
# account the app will actually let in.
#
#   DATABASE_URL=postgres://... scripts/ci/bootstrap-admin-drill.sh
#
# Three claims, each one a way this has already been got wrong somewhere:
#
#   1. It creates the account, with a bcrypt hash the login path accepts and
#      email_verified_at set. A hash the credentials provider rejects, or a
#      null verified-at, both produce a row that exists and cannot sign in.
#   2. It never touches an existing account. A second start must not rewrite
#      the password, or the variables are a permanent backdoor rather than a
#      one-time bootstrap.
#   3. A bad value is refused and startup continues. Crash-looping a container
#      over a typo in an optional variable is worse than the typo.

set -euo pipefail

DB="${DATABASE_URL:?DATABASE_URL is required}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

psql() { docker run --rm --network host -e PGPASSWORD -i postgres:17-alpine psql "$DB" "$@"; }
run_migrate() { ( cd "$ROOT" && node scripts/runtime-migrate.mjs 2>&1 ); }

EMAIL="drill-admin@example.test"
PASSWORD="a-bootstrap-password"

echo "[drill] first start, with the bootstrap variables set"
OUT="$(DATABASE_URL="$DB" BOOTSTRAP_ADMIN_EMAIL="$EMAIL" BOOTSTRAP_ADMIN_PASSWORD="$PASSWORD" run_migrate)"
echo "$OUT" | grep -q "\[bootstrap\] created $EMAIL" || {
  echo "[drill] FAIL: no creation line for $EMAIL"; echo "$OUT" | tail -20; exit 1;
}

ROW="$(psql -tAc "SELECT role || '|' || (email_verified_at IS NOT NULL)::text || '|' || left(password_hash, 4) FROM \"user\" WHERE email = '$EMAIL';")"
[ "$ROW" = "member|true|\$2b\$" ] || [ "$ROW" = "member|true|\$2a\$" ] || {
  echo "[drill] FAIL: unexpected row shape: $ROW"; exit 1;
}
echo "[drill] account created, verified, bcrypt-hashed"

HASH_BEFORE="$(psql -tAc "SELECT password_hash FROM \"user\" WHERE email = '$EMAIL';")"

echo "[drill] second start, same address, DIFFERENT password"
OUT="$(DATABASE_URL="$DB" BOOTSTRAP_ADMIN_EMAIL="$EMAIL" BOOTSTRAP_ADMIN_PASSWORD="a-completely-different-one" run_migrate)"
echo "$OUT" | grep -q "already has an account" || {
  echo "[drill] FAIL: second start did not report the account as existing"; exit 1;
}

HASH_AFTER="$(psql -tAc "SELECT password_hash FROM \"user\" WHERE email = '$EMAIL';")"
[ "$HASH_BEFORE" = "$HASH_AFTER" ] || {
  echo "[drill] FAIL: the password was rewritten on restart — this is a backdoor, not a bootstrap"; exit 1;
}
echo "[drill] existing account untouched"

echo "[drill] a password that is too short is refused, and startup continues"
OUT="$(DATABASE_URL="$DB" BOOTSTRAP_ADMIN_EMAIL="other@example.test" BOOTSTRAP_ADMIN_PASSWORD="short" run_migrate)"
echo "$OUT" | grep -q "must be 8-128 characters" || {
  echo "[drill] FAIL: a 5-character password was not refused by name"; exit 1;
}
echo "$OUT" | grep -q "\[migrate\] all chains complete" || {
  echo "[drill] FAIL: migrations did not complete after the refusal"; exit 1;
}
COUNT="$(psql -tAc "SELECT count(*) FROM \"user\" WHERE email = 'other@example.test';")"
[ "$COUNT" = "0" ] || { echo "[drill] FAIL: refused address was created anyway"; exit 1; }

psql -q -c "DELETE FROM \"user\" WHERE email = '$EMAIL';"
echo "[drill] PASS"
