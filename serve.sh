#!/bin/bash
# Local preview compatibility wrapper. Usage: ./serve.sh [port]
set -euo pipefail
cd -- "$(dirname -- "$0")"
exec npm run preview:site -- --port "${1:-8000}"
