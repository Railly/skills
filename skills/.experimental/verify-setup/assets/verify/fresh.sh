#!/usr/bin/env bash
# Exit 0 when the current tree has a passing observation of every feature the
# contract names (lines "observe: <feature>" in contract.md), or of any feature
# when there is no contract. Used by the verify-before-done Stop hook.
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
here="$root/.agents/verify"
. "$here/lib.sh"
dirty="$(tree_digest "$root")"
head="$(git -C "$root" rev-parse HEAD)"

passed() {
  for meta in "$here"/evidence/*/meta.json; do
    [ -f "$meta" ] || continue
    grep -q "\"head\":\"$head\"" "$meta" && grep -q "\"dirty\":\"$dirty\"" "$meta" \
      && grep -q '"exit":0' "$meta" && grep -q "\"feature\":\"$1\"" "$meta" && return 0
  done
  return 1
}

required="$(sed -nE 's/^[-*[:space:]]*observe:[[:space:]]*([A-Za-z0-9_-]+).*/\1/p' "$here/contract.md" 2>/dev/null | sort -u)"
if [ -z "$required" ]; then
  passed '[^"]*' && exit 0
  echo "no passing observation for HEAD $head with tree digest $dirty" >&2
  exit 1
fi
missing=""
for f in $required; do passed "$f" || missing="$missing $f"; done
[ -z "$missing" ] && exit 0
echo "contract features without a passing observation for this tree:$missing" >&2
exit 1
