#!/usr/bin/env bash
# Run the e2e suite against a published image, in the published compose stack.
#
# CI builds a bundle and serves it with `next start`, so the behavioural suite
# has never touched the artifact self-hosters actually pull. That gap is not
# theoretical: running this against 0.2.0 by hand is what found the
# Content-Security-Policy storage origin frozen at build time, which blocked
# browser evidence uploads on every self-hosted instance and which no
# local-build run could have surfaced.
#
#   scripts/e2e-against-image.sh                # :stable
#   scripts/e2e-against-image.sh 0.2.3          # a specific version
#   scripts/e2e-against-image.sh stable --keep  # leave the stack running
#
# The database is named openisms_e2e so the harness's own never-on-prod guard
# (e2e/lib/env.ts assertE2eTargets) is satisfied honestly rather than bypassed:
# the suite writes directly to it and it is genuinely disposable.

set -euo pipefail

VERSION="${1:-stable}"
KEEP="${2:-}"
IMAGE="ghcr.io/nisd2/open-isms"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK="$(mktemp -d)"
PROJECT="e2e-image-$$"

log() { printf '\n\033[1m[e2e-image]\033[0m %s\n' "$1"; }

cleanup() {
  if [[ "$KEEP" == "--keep" ]]; then
    log "left running in $STACK (docker compose -p $PROJECT down -v to remove)"
    return
  fi
  log "tearing down"
  docker compose -p "$PROJECT" -f "$STACK/compose.yaml" --env-file "$STACK/.env" down -v >/dev/null 2>&1 || true
  rm -rf "$STACK"
}
trap cleanup EXIT

# A free port, so this coexists with whatever else is already bound. The
# harness pins nothing now that the storage target is configurable.
free_port() {
  python3 - "$1" <<'PY'
import socket, sys
start = int(sys.argv[1])
for port in range(start, start + 200):
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", port)); print(port); break
    except OSError:
        continue
    finally:
        s.close()
PY
}

APP_PORT="$(free_port 3410)"
PG_PORT="$(free_port 15432)"
MINIO_PORT="$(free_port 19000)"

log "version=${VERSION}  app=${APP_PORT}  postgres=${PG_PORT}  minio=${MINIO_PORT}"

cp "$ROOT/compose.self-host.yml" "$STACK/compose.yaml"
cp "$ROOT/Caddyfile.self-host.example" "$STACK/Caddyfile"

# Every value here is a throwaway localhost dummy, same as e2e/app-env.sh.
cat > "$STACK/.env" <<ENVEOF
OPEN_ISMS_VERSION=${VERSION}
COMPOSE_PROFILES=minio
POSTGRES_USER=e2e
POSTGRES_PASSWORD=e2e
POSTGRES_DB=openisms_e2e
POSTGRES_PORT=${PG_PORT}
APP_PORT=${APP_PORT}
MINIO_PORT=${MINIO_PORT}
AUTH_SECRET=e2e-dummy-auth-secret-0123456789abcdef
ERASURE_EMAIL_HASH_SALT=e2e-dummy-erasure-salt-0123456789abcdef
AUTH_URL=http://localhost:${APP_PORT}
NEXT_PUBLIC_APP_URL=http://localhost:${APP_PORT}
AWS_S3_BUCKET=e2e-evidence
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_ENDPOINT=http://localhost:${MINIO_PORT}
AWS_S3_INTERNAL_ENDPOINT=http://minio:9000
MINIO_KMS_KEY=$(printf 'e2e-minio-kms-0123456789abcdef!!' | base64)
ENVEOF

log "pulling ${IMAGE}:${VERSION} and starting the stack"
docker compose -p "$PROJECT" -f "$STACK/compose.yaml" --env-file "$STACK/.env" up -d --pull always

log "waiting for /api/health"
for _ in $(seq 1 60); do
  if body=$(curl -fsS --max-time 3 "http://localhost:${APP_PORT}/api/health" 2>/dev/null); then
    echo "  $body"
    break
  fi
  sleep 3
done
if [[ -z "${body:-}" ]]; then
  echo "::error::the stack never became healthy"
  docker compose -p "$PROJECT" -f "$STACK/compose.yaml" --env-file "$STACK/.env" logs app | tail -40
  exit 1
fi

# Framework data is not in the image yet (issue #102), so the suite would find
# an empty portal without this. Seed refuses NODE_ENV=production by itself.
log "seeding framework data"
DATABASE_URL="postgres://e2e:e2e@localhost:${PG_PORT}/openisms_e2e" \
AUTH_SECRET="e2e-dummy-auth-secret-0123456789abcdef" \
NODE_ENV=development \
  bun run "$ROOT/drizzle/seed.ts" | tail -3

log "running the suite against the container"
cd "$ROOT"
E2E_BASE_URL="http://localhost:${APP_PORT}" \
E2E_DATABASE_URL="postgres://e2e:e2e@localhost:${PG_PORT}/openisms_e2e" \
E2E_S3_ENDPOINT="http://localhost:${MINIO_PORT}" \
E2E_S3_BUCKET="e2e-evidence" \
E2E_S3_ACCESS_KEY_ID="minioadmin" \
E2E_S3_SECRET_ACCESS_KEY="minioadmin" \
  bun run e2e -- "${@:3}"
