#!/usr/bin/env bash
# Enforcers from agent-browser #2135: a PR body without Problem / Changes /
# Visual proof, and an unrelated file swept into a commit by `git add -A`.
set -uo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
gate="$here/gate.sh"
fx="$here/../evals/fixtures/prbody"
fail=0
expect() { local want="$1"; shift; "$@" >/dev/null 2>&1; local got=$?; [ "$got" -eq "$want" ] || { echo "FAIL (want $want, got $got): $*"; fail=1; }; }

expect 1 bash "$gate" prbody "$fx/2135-original.md"
expect 0 bash "$gate" prbody "$fx/2135-final.md"
printf '## Problem\nx\n## Changes\ny\n## Visual proof\nnone yet\n' > /tmp/prbody-noproof.md
expect 1 bash "$gate" prbody /tmp/prbody-noproof.md

repo="$(mktemp -d)"; trap 'rm -rf "$repo"' EXIT
cd "$repo" && git init -q && mkdir -p www skills .agents/verify
printf -- '- surface: www/*\n' > .agents/verify/contract.md
echo a > www/index.astro && echo b > skills/fresh.sh && echo .agents/ >> .git/info/exclude
git add www/index.astro
expect 0 bash "$gate" scope
git add -A
expect 1 bash "$gate" scope
rm .agents/verify/contract.md
expect 1 bash "$gate" scope

[ "$fail" -eq 0 ] && echo "PASS: prbody and scope gates"
exit "$fail"
