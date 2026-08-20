#!/usr/bin/env bash
# Serve-only entrypoint: bring the stack up and serve whatever state is in
# the e2e database on :3410. No wipe, no seed. Use it to browse the tenant
# a suite run left behind (fully signed off after the grand tour), and to
# run demo-evidence.ts against it. The database has no volume, so after a
# container restart the state is gone until the next full run.
set -euo pipefail
cd "$(dirname "$0")/.."
source e2e/app-env.sh

if [ ! -f .next/BUILD_ID ]; then
  echo "e2e serve: no production build (.next/BUILD_ID missing). Run 'bun run e2e' first." >&2
  exit 1
fi

docker compose -f e2e/docker-compose.yml up -d --wait
echo "[e2e] serving existing state on :3410 (no wipe)"
exec env "${APP_ENV[@]}" ./node_modules/.bin/next start -p 3410
