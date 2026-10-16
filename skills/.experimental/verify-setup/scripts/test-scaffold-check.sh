#!/usr/bin/env bash
# The pilot kit in agent-browser #2135 ran an old fresh.sh. --check must catch that.
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(mktemp -d)"; trap 'rm -rf "$repo"' EXIT
git -C "$repo" init -q
node "$here/scaffold.mjs" "$repo" --local >/dev/null
fail=0
node "$here/scaffold.mjs" "$repo" --check >/dev/null 2>&1 || { echo "FAIL: fresh kit reported as drifted"; fail=1; }
echo "# local edit" >> "$repo/.agents/verify/fresh.sh"
node "$here/scaffold.mjs" "$repo" --check >/dev/null 2>&1 && { echo "FAIL: drifted fresh.sh not caught"; fail=1; }
echo "# repo specific" >> "$repo/.agents/verify/doctor.sh"
cp "$here/../assets/verify/fresh.sh" "$repo/.agents/verify/fresh.sh"
node "$here/scaffold.mjs" "$repo" --check >/dev/null 2>&1 || { echo "FAIL: repo-specific doctor.sh treated as drift"; fail=1; }
[ "$fail" -eq 0 ] && echo "PASS: scaffold --check"
exit "$fail"
