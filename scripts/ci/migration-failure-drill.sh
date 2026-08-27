#!/usr/bin/env bash
# Proves what happens to a customer's data when a migration fails.
#
# Every other migration test asks "does the good path work". This asks the
# question a self-hoster actually cares about: their instance holds audit
# evidence and sign-offs, an update goes wrong, and they need to know the
# database is not left half-changed.
#
# The claim in docs/updating.md is that a failing migration rolls back and the
# container refuses to serve rather than running against a half-applied schema.
# That was an untested claim in a document until this script existed.
#
#   DATABASE_URL=postgres://... scripts/ci/migration-failure-drill.sh
#
# The failing migration creates a table and THEN divides by zero, so a pass
# means the rollback undid work that had already succeeded inside the
# transaction — not merely that the failing statement failed.

set -euo pipefail

DB="${DATABASE_URL:?DATABASE_URL is required}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

psql() { docker run --rm --network host -e PGPASSWORD -i postgres:17-alpine psql "$DB" "$@"; }
fingerprint() {
  psql -tAc "
    SELECT string_agg(table_name || ':' || column_name || ':' || data_type, ',' ORDER BY table_name, column_name)
    FROM information_schema.columns WHERE table_schema = 'public';"
}
bookkeeping() {
  psql -tAc "
    SELECT coalesce(string_agg(t || ':' || n, ',' ORDER BY t), 'none') FROM (
      SELECT 'grc' t, count(*)::text n FROM drizzle.__drizzle_migrations_grc
      UNION ALL SELECT 'isms', count(*)::text FROM drizzle.__drizzle_migrations_isms
      UNION ALL SELECT 'saas', count(*)::text FROM drizzle.__drizzle_migrations_saas
    ) x;"
}

echo "[drill] bringing the database to the current schema"
( cd "$ROOT" && DATABASE_URL="$DB" node scripts/runtime-migrate.mjs ) | tail -2

echo "[drill] writing a row that stands in for customer data"
psql -q -c "CREATE TABLE IF NOT EXISTS drill_customer_data (id int primary key, note text);
            INSERT INTO drill_customer_data VALUES (1, 'sign-off evidence')
            ON CONFLICT (id) DO NOTHING;"

SCHEMA_BEFORE="$(fingerprint)"
BOOKS_BEFORE="$(bookkeeping)"
echo "[drill] snapshot taken"

# A copy of the real chains with one deliberately poisoned migration appended.
# The real drizzle/ is never touched.
cp -R "$ROOT/drizzle" "$WORK/drizzle"
mkdir -p "$WORK/packages/grc-data-model" "$WORK/packages/isms-schema"
cp -R "$ROOT/packages/grc-data-model/drizzle" "$WORK/packages/grc-data-model/drizzle"
cp -R "$ROOT/packages/isms-schema/drizzle" "$WORK/packages/isms-schema/drizzle"

cat > "$WORK/drizzle/9999_drill_poison.sql" <<'SQL'
CREATE TABLE drill_should_not_survive (id int);
--> statement-breakpoint
SELECT 1/0;
SQL

python3 - "$WORK/drizzle/meta/_journal.json" <<'PY'
import json, sys
path = sys.argv[1]
j = json.load(open(path))
last = max(e["when"] for e in j["entries"])
j["entries"].append({
    "idx": len(j["entries"]), "version": j["entries"][-1]["version"],
    "when": last + 1, "tag": "9999_drill_poison", "breakpoints": True,
})
json.dump(j, open(path, "w"))
PY

echo "[drill] applying a migration that fails partway through"
set +e
# The repo's own migrator, so `pg` resolves from the repo's node_modules,
# but with cwd on the poisoned tree, since the chain paths are relative.
( cd "$WORK" && DATABASE_URL="$DB" node "$ROOT/scripts/runtime-migrate.mjs" ) > "$WORK/out.log" 2>&1
EXIT=$?
set -e
tail -3 "$WORK/out.log" | sed 's/^/    /'

fail=0
check() { if [ "$2" = "$3" ]; then echo "  PASS  $1"; else echo "  FAIL  $1"; echo "        expected: $3"; echo "        actual:   $2"; fail=1; fi; }

echo "[drill] verdict"
[ "$EXIT" -ne 0 ] && echo "  PASS  the migrator exited non-zero (${EXIT}), so the container would refuse to serve" \
                 || { echo "  FAIL  the migrator exited 0 despite a failing migration"; fail=1; }
check "the schema is byte-identical to before the failure" "$(fingerprint)" "$SCHEMA_BEFORE"
check "no migration was recorded as applied" "$(bookkeeping)" "$BOOKS_BEFORE"
check "the table created before the failing statement was rolled back" \
      "$(psql -tAc "SELECT to_regclass('public.drill_should_not_survive') IS NULL;" | tr -d '[:space:]')" "t"
check "the customer row survived untouched" \
      "$(psql -tAc "SELECT note FROM drill_customer_data WHERE id = 1;" | tr -d '[:space:]')" "sign-offevidence"

echo "[drill] and the database is still usable afterwards"
( cd "$ROOT" && DATABASE_URL="$DB" node scripts/runtime-migrate.mjs ) 2>&1 | grep -q "all chains complete" \
  && echo "  PASS  a clean migrator run still succeeds against it" \
  || { echo "  FAIL  the database was left wedged"; fail=1; }

exit "$fail"
