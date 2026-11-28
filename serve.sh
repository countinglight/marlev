#!/bin/bash
# Local preview only. Usage: ./serve.sh [port]
set -euo pipefail
cd -- "$(dirname -- "$0")/site"
if ! command -v python3 >/dev/null 2>&1; then
    echo "Python 3 is required. Install it, then run ./serve.sh again." >&2
    exit 1
fi
exec python3 -m http.server "${1:-8000}" --bind 127.0.0.1
