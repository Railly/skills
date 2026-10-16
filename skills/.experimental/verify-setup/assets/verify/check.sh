#!/usr/bin/env bash
# Deterministic layer: types, lint, unit tests. Must exit non-zero on any failure.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Replace with the repo's real commands, fastest first.
echo "check.sh: no checks configured" >&2
exit 1
