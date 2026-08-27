#!/bin/bash
# Regenerates pitch deck screenshots for mobile view.
# Requires the dev server to be running on port 3026 (bun run dev).
# Usage: bun run screenshots
#        bun run screenshots -- --slide 3   (reshoot one slide, 0-indexed)

set -e

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="public/pitch/slides"
URL="https://nisd2.eu/pitch-preview"
LOCALES=("en" "de")
TOTAL=11

# Parse optional --slide argument
SINGLE_SLIDE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --slide) SINGLE_SLIDE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

echo "Shooting pitch slides from $URL ..."

for locale in "${LOCALES[@]}"; do
  mkdir -p "$OUT/$locale"

  if [[ -n "$SINGLE_SLIDE" ]]; then
    slides=("$SINGLE_SLIDE")
  else
    mapfile -t slides < <(seq 0 $((TOTAL - 1)))
  fi

  for i in "${slides[@]}"; do
    n=$(printf "%02d" "$i")
    "$CHROME" \
      --headless=new \
      --screenshot="$OUT/$locale/slide-$n.png" \
      --window-size=896,504 \
      --hide-scrollbars \
      "$URL?s=$i&l=$locale" 2>/dev/null
    echo "  ok  $locale/slide-$n.png"
  done
done

echo "Done. Commit public/pitch/slides/ to update mobile screenshots."
