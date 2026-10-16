#!/usr/bin/env bash
# Exit 0 when a passing observation exists for the current tree state.
# Used by the verify-before-done Stop hook.
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
. "$root/.agents/verify/lib.sh"
dirty="$(tree_digest "$root")"
head="$(git -C "$root" rev-parse HEAD)"
for meta in "$root"/.agents/verify/evidence/*/meta.json; do
  [ -f "$meta" ] || continue
  grep -q "\"head\":\"$head\"" "$meta" && grep -q "\"dirty\":\"$dirty\"" "$meta" && grep -q '"exit":0' "$meta" && exit 0
done
echo "no passing observation for HEAD $head with dirty digest $dirty" >&2
exit 1
