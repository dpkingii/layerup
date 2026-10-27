#!/usr/bin/env bash
set -euo pipefail

PORT=$(./.superset/port.sh release)
[ -z "$PORT" ] && exit 0

pids=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "Stopping dev server on port $PORT"
  kill $pids || true
fi
