#!/usr/bin/env bash
# Waits until the app answers /api/health reporting an expected version.
#
# This is the check a self-hoster's browser makes after clicking update: the
# server it was talking to is gone, and the only way to know the new one
# arrived is to keep asking until the reported version changes. Connection
# refused is normal here — it means the swap is still in progress.
#
#   wait-for-version.sh <expected-version> [url] [timeout-seconds]

set -euo pipefail

expected="${1:?expected version required}"
url="${2:-http://localhost:3026/api/health}"
timeout="${3:-300}"
deadline=$(( SECONDS + timeout ))
last=""

while (( SECONDS < deadline )); do
  if body=$(curl -fsS --max-time 5 "$url" 2>/dev/null); then
    reported=$(printf '%s' "$body" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')
    if [[ "$reported" == "$expected" ]]; then
      echo "healthy, reporting ${reported}"
      exit 0
    fi
    if [[ "$reported" != "$last" ]]; then
      echo "  serving ${reported:-<no version field>}, waiting for ${expected}"
      last="$reported"
    fi
  fi
  sleep 5
done

echo "::error::Timed out after ${timeout}s waiting for version ${expected} at ${url}."
echo "Last response: ${body:-<none, the app never answered>}"
exit 1
