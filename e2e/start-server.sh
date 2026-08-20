#!/usr/bin/env bash
# Playwright webServer entrypoint: stack up -> wipe -> migrate -> seed ->
# build -> serve. Hermetic by design; see e2e/README.md. Serve without the
# wipe: e2e/serve.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
source e2e/app-env.sh

echo "[e2e] starting docker stack"
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
