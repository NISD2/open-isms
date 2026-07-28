#!/usr/bin/env bash
# Playwright webServer entrypoint: stack up -> migrate -> seed -> build -> serve.
# The app-under-test gets ALL its env injected here; nobody's .env is read.
set -euo pipefail
cd "$(dirname "$0")/.."

E2E_DATABASE_URL="${E2E_DATABASE_URL:-postgres://e2e:e2e@localhost:5434/openisms_e2e}"

# Shell-level mirror of e2e/lib/env.ts assertE2eTargets(): parse the host and
# db name and check exactly, so laxer globs cannot accept e.g.
# postgres://u@localhost.evil.example/x_e2e (host "localhost.evil.example").
_after_at="${E2E_DATABASE_URL#*@}"       # host[:port]/db[?query]
_host="${_after_at%%/*}"; _host="${_host%%:*}"
_db="${_after_at#*/}"; _db="${_db%%\?*}"
case "$_host" in localhost|127.0.0.1|::1) ;; *)
  echo "e2e guard: DB host '$_host' is not localhost — refusing." >&2; exit 1 ;;
esac
case "$_db" in *_e2e) ;; *)
  echo "e2e guard: DB name '$_db' does not end in _e2e — refusing." >&2; exit 1 ;;
esac

APP_ENV=(
  DATABASE_URL="$E2E_DATABASE_URL"
  AUTH_SECRET="e2e-dummy-auth-secret-0123456789abcdef"
  # Auth.js v5 in a production build rejects unknown hosts (UntrustedHost)
  # without these. Localhost-only harness, so trusting the host is safe.
  AUTH_URL="http://localhost:3410"
  AUTH_TRUST_HOST="true"
  NEXT_PUBLIC_APP_URL="http://localhost:3410"
  AWS_S3_ENDPOINT="http://localhost:9000"
  AWS_S3_BUCKET="e2e-evidence"
  AWS_S3_REGION="eu-north-1"
  AWS_ACCESS_KEY_ID="minioadmin"
  AWS_SECRET_ACCESS_KEY="minioadmin"
)

echo "[e2e] starting docker stack"
# MinIO KMS key (32 bytes, base64) — computed here so no high-entropy blob
# is committed. Fixed value, localhost-only, not a secret.
E2E_MINIO_KMS_B64="$(printf 'e2e-minio-kms-0123456789abcdef!!' | base64)"
export E2E_MINIO_KMS_B64
docker compose -f e2e/docker-compose.yml up -d --wait

# Hermetic runs: wipe the e2e database entirely so migrations and seed
# always start from nothing. Re-seeding over a dirty DB crashes on FK
# references from module records the seed's cleanup predates (finding:
# cleanUserAndCompany does not cover newer tables like change_request).
echo "[e2e] resetting e2e database (hermetic run)"
docker compose -f e2e/docker-compose.yml exec -T postgres \
  psql -q -U e2e -d openisms_e2e \
  -c "DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;"

echo "[e2e] running migrations (same entrypoint as prod: scripts/runtime-migrate.mjs)"
env "${APP_ENV[@]}" node scripts/runtime-migrate.mjs

echo "[e2e] seeding (drizzle/seed.ts refuses NODE_ENV=production by itself)"
env "${APP_ENV[@]}" bun run drizzle/seed.ts

if [ ! -f .next/BUILD_ID ]; then
  echo "[e2e] building production bundle"
  env "${APP_ENV[@]}" SKIP_ENV_VALIDATION=1 bun run build:webpack
fi

echo "[e2e] starting next on :3410"
exec env "${APP_ENV[@]}" ./node_modules/.bin/next start -p 3410
