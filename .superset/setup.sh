#!/usr/bin/env bash
set -euo pipefail

ROOT="${SUPERSET_ROOT_PATH:?SUPERSET_ROOT_PATH not set}"

npm ci

# Copy gitignored env files from the main checkout without clobbering local edits.
shopt -s nullglob
for f in "$ROOT"/.env*; do
  name=$(basename "$f")
  if [ -e "$name" ]; then
    echo "Skipping $name (already exists)"
  else
    cp "$f" "$name"
    echo "Copied $name"
  fi
done

echo "Dev server port: $(./.superset/port.sh get)"
