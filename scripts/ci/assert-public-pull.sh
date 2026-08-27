#!/usr/bin/env bash
# Fails unless a published tag can be fetched with no credentials at all.
#
# Every job in the release workflow logs in with GITHUB_TOKEN, so a green
# pipeline proves only that org members can pull. A GHCR package is private
# when it is first created, and the compose file self-hosters are handed pulls
# anonymously: a private package turns their first `docker compose up -d` into
# an authentication error about a repository they have no account for.
#
# Nothing in the workflow can fix that, because visibility is a package
# setting rather than anything the push controls. So this reports it loudly on
# the release that introduced it, instead of leaving it for the first person
# who tries to install.
#
#   assert-public-pull.sh <image> <tag> [attempts]

set -euo pipefail

image="${1:?image required, e.g. ghcr.io/nisd2/open-isms}"
tag="${2:?tag required}"
attempts="${3:-5}"

repository="${image#ghcr.io/}"

# Distinguishes the two ways this fails, because the fixes are unrelated: a
# private package needs a visibility change, a missing tag means the manifest
# never got pushed.
reachable=""

for attempt in $(seq 1 "$attempts"); do
  # An unauthenticated token request for a private package returns a body with
  # no token rather than an HTTP error, so an empty token is the signal.
  token=$(curl -fsS --max-time 10 \
    "https://ghcr.io/token?scope=repository:${repository}:pull&service=ghcr.io" \
    2>/dev/null | sed -n 's/.*"token":"\([^"]*\)".*/\1/p') || token=""

  if [[ -n "$token" ]]; then
    reachable="yes"
    if curl -fsS --max-time 10 -o /dev/null \
        -H "Authorization: Bearer ${token}" \
        -H "Accept: application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json" \
        "https://ghcr.io/v2/${repository}/manifests/${tag}" 2>/dev/null; then
      echo "${image}:${tag} is pullable without credentials"
      exit 0
    fi
  fi

  if (( attempt < attempts )); then
    echo "  not visible yet, retrying (${attempt}/${attempts})"
    sleep 10
  fi
done

if [[ -n "$reachable" ]]; then
  echo "::error::${repository} is public, but the tag ${tag} is not in it. The manifest was never pushed, or it was pushed under a different name."
else
  echo "::error::${repository} cannot be read anonymously. Set the package to Public (org Packages settings, then the package's own visibility), or every self-hoster's first 'docker compose up -d' fails on authentication."
fi
exit 1
