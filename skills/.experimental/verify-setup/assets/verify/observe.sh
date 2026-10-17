#!/usr/bin/env bash
# Drive one feature on the real surface and keep the evidence.
# Usage: observe.sh <feature> [--runs N] [driver args...]
# `check` with no drive/check.sh runs check.sh, so a contract can require it.
# --runs N repeats the driver N times; the observation passes only if every run passes.
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
here="$root/.agents/verify"
. "$here/lib.sh"
feature="${1:?usage: observe.sh <feature> [--runs N]}"; shift
runs=1
if [ "${1:-}" = "--runs" ]; then runs="${2:?--runs needs a number}"; shift 2; fi
driver="$here/drive/$feature.sh"
[ "$feature" = check ] && [ ! -e "$driver" ] && driver="$here/check.sh"
[ -x "$driver" ] || [ -f "$driver" ] || { echo "no driver: $driver" >&2; exit 2; }

ts="$(date -u +%Y%m%dT%H%M%SZ)"
export EVIDENCE_DIR="$here/evidence/$ts-$feature"
mkdir -p "$EVIDENCE_DIR"
head="$(git -C "$root" rev-parse HEAD)"
dirty="$(tree_digest "$root")"

passed=0
for run in $(seq "$runs"); do
  [ "$runs" -gt 1 ] && echo "--- run $run/$runs"
  ( cd "$root" && if [ -x "$driver" ]; then "$driver" "$@"; else bash "$driver" "$@"; fi ) 2>&1 | tee -a "$EVIDENCE_DIR/output.log"
  [ "${PIPESTATUS[0]}" -eq 0 ] && passed=$((passed + 1))
done
code=0; [ "$passed" -eq "$runs" ] || code=1
files="$(find "$EVIDENCE_DIR" -type f ! -name output.log ! -name meta.json | wc -l | tr -d ' ')"

cat > "$EVIDENCE_DIR/meta.json" <<JSON
{"feature":"$feature","at":"$ts","head":"$head","dirty":"$dirty","exit":$code,"runs":$runs,"passed":$passed,"artifacts":$files}
JSON
echo "evidence: $EVIDENCE_DIR (exit $code, $passed/$runs runs passed, $files artifacts)"
exit "$code"
