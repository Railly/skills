#!/usr/bin/env bash
# Exit 0 only when every precondition the drivers need is present.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
fail=0
need() { if command -v "$1" >/dev/null 2>&1; then echo "ok   $1"; else echo "MISS $1"; fail=1; fi; }

# Edit this list: binaries, env vars, running services the drivers rely on.
need git

exit "$fail"
