#!/usr/bin/env bash
# Push packages/incident-notification-schema/ to
# github.com:NISD2/nis2-incident-notification-schema
# with all AI co-author lines stripped from commit messages.
#
# Mirrors scripts/push-grc-data-model.sh; see that file for the reasoning
# behind the filter-branch dance.
#
# Usage: bash scripts/push-incident-notification-schema.sh [--dry-run]

set -euo pipefail

PREFIX="packages/incident-notification-schema"
REMOTE_URL="git@github.com:NISD2/nis2-incident-notification-schema.git"
REMOTE_BRANCH="main"
SPLIT_BRANCH="incident-notification-schema-split-$$"
DRY_RUN="${1:-}"

cd "$(git rev-parse --show-toplevel)"

if [ ! -d "$PREFIX" ]; then
  echo "error: $PREFIX not found at repo root" >&2
  exit 1
fi

if ! git diff-index --quiet HEAD --; then
  echo "error: working tree has uncommitted changes; filter-branch will refuse to run" >&2
  echo "       commit or stash before pushing:" >&2
  git status --short >&2
  exit 1
fi

export FILTER_BRANCH_SQUELCH_WARNING=1

echo "→ Splitting $PREFIX into $SPLIT_BRANCH"
git subtree split --prefix="$PREFIX" -b "$SPLIT_BRANCH" >/dev/null

echo "→ Stripping AI co-author lines"
FILTER_LOG=$(mktemp)
if ! git filter-branch --force --msg-filter '
  sed -e "/^Co-Authored-By: Claude/d" \
      -e "/^Co-authored-by: Claude/d" \
      -e "/^🤖 Generated with/d"
' --tag-name-filter cat -- "$SPLIT_BRANCH" >"$FILTER_LOG" 2>&1; then
  echo "error: filter-branch failed:" >&2
  cat "$FILTER_LOG" >&2
  rm -f "$FILTER_LOG"
  git branch -D "$SPLIT_BRANCH" >/dev/null 2>&1 || true
  exit 1
fi
rm -f "$FILTER_LOG"

git update-ref -d "refs/original/refs/heads/$SPLIT_BRANCH" 2>/dev/null || true

CLEAN_HEAD=$(git rev-parse "$SPLIT_BRANCH")
REMAINING=$(git log "$SPLIT_BRANCH" --format=%B | grep -c "Co-Authored-By: Claude" || true)

if [ "$REMAINING" -ne 0 ]; then
  echo "error: $REMAINING Claude line(s) remain after rewrite; aborting" >&2
  git branch -D "$SPLIT_BRANCH" >/dev/null 2>&1 || true
  exit 1
fi

echo "→ Clean split head: $CLEAN_HEAD ($REMAINING Claude lines)"

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "→ Dry run; not pushing. Inspect branch: $SPLIT_BRANCH"
  exit 0
fi

echo "→ Force-pushing $SPLIT_BRANCH → $REMOTE_URL $REMOTE_BRANCH"
git push --force "$REMOTE_URL" "$SPLIT_BRANCH:$REMOTE_BRANCH"

echo "→ Cleaning up local split branch"
git branch -D "$SPLIT_BRANCH" >/dev/null 2>&1 || true

echo "✓ done. Verify at https://github.com/NISD2/nis2-incident-notification-schema/commits/main"
