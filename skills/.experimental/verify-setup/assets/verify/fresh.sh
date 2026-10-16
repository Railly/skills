#!/usr/bin/env bash
# Exit 0 when the current tree has a passing observation of every feature the
# contract names (lines "observe: <feature>" in contract.md; "observe: none (reason)"
# marks a named gap and requires nothing), or of any feature
# when there is no contract. Used by the verify-before-done Stop hook.
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
here="$root/.agents/verify"
. "$here/lib.sh"
dirty="$(tree_digest "$root")"
head="$(git -C "$root" rev-parse HEAD)"

# Latest observation of a feature for this exact tree, or nothing. Evidence
# directories are named <UTC timestamp>-<feature>, so a lexical sort is a time sort.
latest() {
  local meta found=""
  for meta in "$here"/evidence/*-"$1"/meta.json; do
    [ -f "$meta" ] || continue
    grep -q "\"feature\":\"$1\"" "$meta" && grep -q "\"head\":\"$head\"" "$meta" && grep -q "\"dirty\":\"$dirty\"" "$meta" && found="$meta"
  done
  [ -n "$found" ] && echo "$found"
}

passed() {
  local meta
  meta="$(latest "$1")" || return 1
  grep -q '"exit":0' "$meta"
}

required="$(sed -nE 's/^[-*[:space:]]*observe:[[:space:]]*([A-Za-z0-9_-]+).*/\1/p' "$here/contract.md" 2>/dev/null | grep -vx none | sort -u)"
if [ -z "$required" ]; then
  # No contract: every feature observed on this tree must have passed last time.
  required="$(for d in "$here"/evidence/*/; do [ -f "$d/meta.json" ] && sed -nE 's/.*"feature":"([^"]+)".*/\1/p' "$d/meta.json"; done | sort -u | while read -r f; do latest "$f" >/dev/null && echo "$f"; done)"
  if [ -z "$required" ]; then
    echo "no observation for HEAD $head with tree digest $dirty" >&2
    exit 1
  fi
fi
missing=""
for f in $required; do passed "$f" || missing="$missing $f"; done
[ -z "$missing" ] && exit 0
echo "contract features without a passing observation for this tree:$missing" >&2
exit 1
