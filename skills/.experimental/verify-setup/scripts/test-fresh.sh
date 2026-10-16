#!/usr/bin/env bash
# fresh.sh must judge each feature by its latest observation for the tree:
# an older pass never outvotes a newer fail.
set -uo pipefail
kit="$(cd "$(dirname "$0")/../assets/verify" && pwd)"
repo="$(mktemp -d)"; trap 'rm -rf "$repo"' EXIT
git -C "$repo" init -q && echo x > "$repo/a" && git -C "$repo" add a && git -C "$repo" -c user.email=t@t -c user.name=t commit -qm init
mkdir -p "$repo/.agents" && cp -R "$kit" "$repo/.agents/verify"
printf '#!/usr/bin/env bash\nexit "${RESULT:-0}"\n' > "$repo/.agents/verify/drive/f.sh" && chmod +x "$repo/.agents/verify/drive/f.sh"
echo ".agents/" >> "$repo/.git/info/exclude"
cd "$repo"
fail=0
RESULT=0 bash .agents/verify/observe.sh f >/dev/null; sleep 1
bash .agents/verify/fresh.sh 2>/dev/null || { echo "FAIL: a lone pass should be fresh"; fail=1; }
RESULT=1 bash .agents/verify/observe.sh f >/dev/null
if bash .agents/verify/fresh.sh 2>/dev/null; then echo "FAIL: an older pass outvoted a newer fail"; fail=1; fi
sleep 1; RESULT=0 bash .agents/verify/observe.sh f >/dev/null
bash .agents/verify/fresh.sh 2>/dev/null || { echo "FAIL: a newer pass should be fresh again"; fail=1; }
[ "$fail" -eq 0 ] && echo "PASS: fresh.sh uses the latest observation per feature"
exit "$fail"
