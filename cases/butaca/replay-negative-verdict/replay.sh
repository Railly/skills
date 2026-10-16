#!/usr/bin/env bash
# Replays the butaca negative-verdict fixtures against the current loop skill.
# Fails if a headline concludes absence, or if the control stops concluding removal.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
skill="$here/../../../skills/.experimental/loop/SKILL.md"
runs=${RUNS:-3}
out=$(mktemp -d)
ask() { claude -p --no-session-persistence --tools "" \
	--system-prompt "You are a software engineering agent. Follow this skill exactly:
$(cat "$skill")" "$(cat "$here/$1.txt")" >"$out/$1-$2.txt"; }
for i in $(seq "$runs"); do ask fx-butaca2 "$i" & ask fx-control "$i" & done
wait
fail=0
for f in "$out"/fx-butaca2-*.txt; do
	head -c 400 "$f" | grep -qi "needs-human" || { echo "FAIL headline not needs-human: $f"; fail=1; }
done
for f in "$out"/fx-control-*.txt; do
	head -c 400 "$f" | grep -qiE "can be removed|safe to remove|se puede (eliminar|borrar)" || { echo "FAIL control hedged: $f"; fail=1; }
done
[ "$fail" = 0 ] && echo "PASS ($runs runs per fixture, outputs in $out)"
exit "$fail"
