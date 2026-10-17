#!/usr/bin/env bash
# From the wterm runs (vercel-labs/wterm#241-#243): a noisy benchmark passed on
# one run out of two, must-not-change items could only say "covered by check.sh",
# and a driver could observe a stale build.
set -uo pipefail
kit="$(cd "$(dirname "$0")/../assets/verify" && pwd)"
repo="$(mktemp -d)"; trap 'rm -rf "$repo"' EXIT
git -C "$repo" init -q && echo x > "$repo/a" && git -C "$repo" add a && git -C "$repo" -c user.email=t@t -c user.name=t commit -qm init
mkdir -p "$repo/.agents" && cp -R "$kit" "$repo/.agents/verify" && echo ".agents/" >> "$repo/.git/info/exclude"
cd "$repo"; v=.agents/verify; fail=0
no() { echo "FAIL: $*"; fail=1; }

# Flaky driver: passes on odd calls only.
export FLAKY_COUNTER="$(mktemp)"
printf '#!/usr/bin/env bash\nn=$(cat "$FLAKY_COUNTER" 2>/dev/null); n=$((${n:-0}+1)); echo $n > "$FLAKY_COUNTER"; [ $((n %% 2)) -eq 1 ]\n' > $v/drive/bench.sh && chmod +x $v/drive/bench.sh
printf -- '- observe: bench x4\n' > $v/contract.md
bash $v/observe.sh bench >/dev/null 2>&1 || no "first single run should pass"
bash $v/fresh.sh 2>/dev/null && no "one run satisfied a contract asking for x4"
bash $v/observe.sh bench --runs 4 >/dev/null 2>&1 && no "a flaky driver passed 4 runs"
grep -q '"runs":4,"passed":2' $(ls -d $v/evidence/*-bench | tail -1)/meta.json || no "meta does not record 2 of 4 runs"
printf '#!/usr/bin/env bash\nexit 0\n' > $v/drive/bench.sh
bash $v/observe.sh bench --runs 4 >/dev/null 2>&1 || no "a stable driver failed 4 runs"
bash $v/fresh.sh 2>/dev/null || no "4 passing runs did not satisfy x4"

# observe: check runs check.sh.
printf '#!/usr/bin/env bash\nexit "${CHECK_RESULT:-0}"\n' > $v/check.sh
printf -- '- observe: check\n' > $v/contract.md
CHECK_RESULT=1 bash $v/observe.sh check >/dev/null 2>&1 && no "observe check ignored a failing check.sh"
bash $v/fresh.sh 2>/dev/null && no "a failing check.sh satisfied observe: check"
bash $v/observe.sh check >/dev/null 2>&1 || no "observe check failed on a passing check.sh"
bash $v/fresh.sh 2>/dev/null || no "a passing check.sh did not satisfy observe: check"

# artifact_current refuses a build older than its sources.
mkdir -p src && echo 1 > src/main.c && sleep 1 && echo bin > app && sleep 1 && echo 2 > src/main.c
( . $v/lib.sh; artifact_current app src ) 2>/dev/null && no "stale artifact accepted"
touch app
( . $v/lib.sh; artifact_current app src ) 2>/dev/null || no "fresh artifact rejected"
( . $v/lib.sh; artifact_current missing src ) 2>/dev/null && no "missing artifact accepted"

[ "$fail" -eq 0 ] && echo "PASS: runs, observe check, artifact_current"
exit "$fail"
