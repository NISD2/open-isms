#!/usr/bin/env bash
# Push packages/grc-data-model/ to github.com:NISD2/grc-data-model
# with all AI co-author lines stripped from commit messages.
#
# Why this exists: `git subtree push` (the documented mirror command in
# CLAUDE.md) re-extracts monorepo commit messages verbatim. Monorepo
# commits often carry "Co-Authored-By: Claude" lines that should not
# end up on the public OSS repo. This wrapper:
#   1. Splits packages/grc-data-model/ into a synthetic history
#   2. Strips Co-Authored-By: Claude lines from every commit message
#   3. Force-pushes the cleaned history to the OSS repo
#
# Use this instead of the raw `git subtree push` documented in CLAUDE.md.
# The OSS repo's history is owned by this script; force-push is expected.
#
# Usage: bash scripts/push-grc-data-model.sh [--dry-run]

set -euo pipefail

PREFIX="packages/grc-data-model"
REMOTE_URL="git@github.com:NISD2/grc-data-model.git"
REMOTE_BRANCH="main"
SPLIT_BRANCH="grc-data-model-split-$$"
DRY_RUN="${1:-}"

cd "$(git rev-parse --show-toplevel)"

if [ ! -d "$PREFIX" ]; then
  echo "error: $PREFIX not found at repo root" >&2
  exit 1
fi

# git filter-branch refuses to run with unstaged changes anywhere in the
# working tree — even in files completely unrelated to $PREFIX. Detect
# this up front so we don't silently produce an unfiltered split branch
# and then push commit-message bodies that still contain Claude lines.
if ! git diff-index --quiet HEAD --; then
  echo "error: working tree has uncommitted changes; filter-branch will refuse to run" >&2
  echo "       commit or stash before pushing:" >&2
  git status --short >&2
  exit 1
fi

# Squelch git-filter-branch's loud deprecation warning. Yes, filter-repo
# is the recommended tool, but it's an external dep and filter-branch
# does the job here.
export FILTER_BRANCH_SQUELCH_WARNING=1

echo "→ Splitting $PREFIX into $SPLIT_BRANCH"
git subtree split --prefix="$PREFIX" -b "$SPLIT_BRANCH" >/dev/null

echo "→ Stripping AI co-author lines"
# Captured to a log so failures (e.g. dirty tree, ref permissions) are
# visible rather than swallowed by /dev/null.
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

# Clear the backup ref filter-branch leaves behind, so a re-run doesn't
# trip on "A previous backup already exists".
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

echo "✓ done. Verify at https://github.com/NISD2/grc-data-model/commits/main"
