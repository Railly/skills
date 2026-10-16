#!/usr/bin/env bash
# Drive one feature on the real surface and keep the evidence.
# Usage: observe.sh <feature> [driver args...]
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
here="$root/.agents/verify"
. "$here/lib.sh"
feature="${1:?usage: observe.sh <feature>}"; shift
driver="$here/drive/$feature.sh"
[ -x "$driver" ] || { echo "no executable driver: $driver" >&2; exit 2; }

ts="$(date -u +%Y%m%dT%H%M%SZ)"
export EVIDENCE_DIR="$here/evidence/$ts-$feature"
mkdir -p "$EVIDENCE_DIR"
head="$(git -C "$root" rev-parse HEAD)"
dirty="$(tree_digest "$root")"

( cd "$root" && "$driver" "$@" ) 2>&1 | tee "$EVIDENCE_DIR/output.log"
code="${PIPESTATUS[0]}"
files="$(find "$EVIDENCE_DIR" -type f ! -name output.log ! -name meta.json | wc -l | tr -d ' ')"

cat > "$EVIDENCE_DIR/meta.json" <<JSON
{"feature":"$feature","at":"$ts","head":"$head","dirty":"$dirty","exit":$code,"artifacts":$files}
JSON
echo "evidence: $EVIDENCE_DIR (exit $code, $files artifacts)"
exit "$code"
