#!/usr/bin/env bash
# Shared app-under-test environment, sourced by e2e/start-server.sh (full
# hermetic run) and e2e/serve.sh (serve-only). The app gets ALL its env
# from here; nobody's .env is read. Every value is a committed localhost
# dummy. Defines APP_ENV, exports E2E_MINIO_KMS_B64, and guards the DB
# target before anything else can run.

E2E_DATABASE_URL="${E2E_DATABASE_URL:-postgres://e2e:e2e@localhost:5434/openisms_e2e}"

# Shell-level mirror of e2e/lib/env.ts assertE2eTargets(): parse the host and
# db name and check exactly, so laxer globs cannot accept e.g.
# postgres://u@localhost.evil.example/x_e2e (host "localhost.evil.example").
_after_at="${E2E_DATABASE_URL#*@}"       # host[:port]/db[?query]
_host="${_after_at%%/*}"; _host="${_host%%:*}"
_db="${_after_at#*/}"; _db="${_db%%\?*}"
case "$_host" in localhost|127.0.0.1|::1) ;; *)
  echo "e2e guard: DB host '$_host' is not localhost, refusing." >&2; exit 1 ;;
esac
case "$_db" in *_e2e) ;; *)
  echo "e2e guard: DB name '$_db' does not end in _e2e, refusing." >&2; exit 1 ;;
esac

# MinIO KMS key (32 bytes, base64), computed here so no high-entropy blob
# is committed. Fixed value, localhost-only, not a secret.
E2E_MINIO_KMS_B64="$(printf 'e2e-minio-kms-0123456789abcdef!!' | base64)"
export E2E_MINIO_KMS_B64

# Consumed by e2e/start-server.sh and e2e/serve.sh, which source this file.
# shellcheck disable=SC2034
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
