#!/usr/bin/env bash
# Per-workspace dev-server port registry, shared across all worktrees of this repo.
# Usage: port.sh get      -> print this workspace's port, reserving one if needed
#        port.sh release  -> drop this workspace's reservation and print the freed port
set -euo pipefail

WORKSPACE="${SUPERSET_WORKSPACE_PATH:-$(pwd)}"
REGISTRY_DIR="$HOME/.superset/port-registry"
REGISTRY="$REGISTRY_DIR/layerup"
LOCK="$REGISTRY.lock"
BASE=3100
MAX=3199

mkdir -p "$REGISTRY_DIR"
touch "$REGISTRY"

until mkdir "$LOCK" 2>/dev/null; do sleep 0.1; done
trap 'rmdir "$LOCK"' EXIT

case "${1:-get}" in
  get)
    existing=$(awk -v ws="$WORKSPACE" '$2 == ws { print $1 }' "$REGISTRY")
    if [ -n "$existing" ]; then
      echo "$existing"
      exit 0
    fi
    for ((p = BASE; p <= MAX; p++)); do
      grep -q "^$p " "$REGISTRY" && continue
      lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1 && continue
      echo "$p $WORKSPACE" >> "$REGISTRY"
      echo "$p"
      exit 0
    done
    echo "No free port in $BASE-$MAX" >&2
    exit 1
    ;;
  release)
    awk -v ws="$WORKSPACE" '$2 == ws { print $1 }' "$REGISTRY"
    awk -v ws="$WORKSPACE" '$2 != ws' "$REGISTRY" > "$REGISTRY.tmp"
    mv "$REGISTRY.tmp" "$REGISTRY"
    ;;
esac
