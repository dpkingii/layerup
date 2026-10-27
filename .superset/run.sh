#!/usr/bin/env bash
set -euo pipefail

PORT=$(./.superset/port.sh get)
echo "Starting dev server on http://localhost:$PORT"
exec npx next dev --port "$PORT"
