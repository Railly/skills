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

# Latest observation of a feature for this exact tree contents, or nothing.
# The digest is content-addressed, so a commit of the observed code keeps it valid. Evidence
# directories are named <UTC timestamp>-<feature>, so a lexical sort is a time sort.
latest() {
  local meta found=""
  for meta in "$here"/evidence/*-"$1"/meta.json; do
    [ -f "$meta" ] || continue
    grep -q "\"feature\":\"$1\"" "$meta" && grep -q "\"dirty\":\"$dirty\"" "$meta" && found="$meta"
  done
  [ -n "$found" ] && echo "$found"
}

# passed <feature> [min-runs]: latest observation passed, over at least min-runs runs.
passed() {
  local meta runs
  meta="$(latest "$1")" || return 1
  grep -q '"exit":0' "$meta" || return 1
  runs="$(sed -nE 's/.*"runs":([0-9]+).*/\1/p' "$meta")"
  [ "${runs:-1}" -ge "${2:-1}" ]
}

# Contract lines: "observe: <feature>" or "observe: <feature> x<N>" (N runs, all passing).
required="$(sed -nE 's/^[-*[:space:]]*observe:[[:space:]]*([A-Za-z0-9_-]+)([[:space:]]+x([0-9]+))?.*/\1:\3/p' "$here/contract.md" 2>/dev/null | grep -v '^none:' | sort -u)"
if [ -z "$required" ]; then
  # No contract: every feature observed on this tree must have passed last time.
  required="$(for d in "$here"/evidence/*/; do [ -f "$d/meta.json" ] && sed -nE 's/.*"feature":"([^"]+)".*/\1/p' "$d/meta.json"; done | sort -u | while read -r f; do latest "$f" >/dev/null && echo "$f:"; done)"
  if [ -z "$required" ]; then
    echo "no observation for tree $dirty (HEAD $head)" >&2
    exit 1
  fi
fi
missing=""
for spec in $required; do
  f="${spec%%:*}"; n="${spec#*:}"
  passed "$f" "${n:-1}" || missing="$missing $f${n:+ x$n}"
done
[ -z "$missing" ] && exit 0
echo "contract features without a passing observation for this tree:$missing" >&2
exit 1
