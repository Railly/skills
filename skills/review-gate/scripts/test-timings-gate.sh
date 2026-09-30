#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fixture="$(mktemp -d)"
trap 'rm -rf "$fixture"' EXIT

git -C "$fixture" init -q
git -C "$fixture" config user.email test@example.com
git -C "$fixture" config user.name Test
git -C "$fixture" config commit.gpgsign false
mkdir -p "$fixture/src"
printf '%s\n' 'const POLL_INTERVAL_MS: u64 = 500;' >"$fixture/src/chrome.rs"
git -C "$fixture" add .
git -C "$fixture" commit -qm base

# A Rust Duration ceiling is a wait ceiling (agent-browser #2026).
printf '%s\n' 'const POLL_INTERVAL_MS: u64 = 500;' \
	'const VERIFY_TIMEOUT: Duration = Duration::from_secs(30);' >"$fixture/src/chrome.rs"
out=$(cd "$fixture" && "$script_dir/gate.sh" timings HEAD 2>&1 || true)
if grep -q "adds no wait ceiling" <<<"$out"; then
	echo "Duration ceiling was not detected:"
	echo "$out"
	exit 1
fi
grep -q "VERIFY_TIMEOUT = 30000" <<<"$out"
# No larger peer in the changed files is not a clearance: the consumer's
# timeout may live elsewhere.
grep -q "NOTE \[timings\].*consumer" <<<"$out"

# A larger Duration peer in the changed files is compared in the same unit.
printf '%s\n' 'const POLL_INTERVAL_MS: u64 = 500;' \
	'const READ_TIMEOUT: Duration = Duration::from_millis(45_000);' \
	'const VERIFY_TIMEOUT: Duration = Duration::from_secs(30);' >"$fixture/src/chrome.rs"
out=$(cd "$fixture" && "$script_dir/gate.sh" timings HEAD 2>&1 || true)
grep -q "FINDING \[timings\] 'VERIFY_TIMEOUT = 30000'" <<<"$out"
grep -q "READTIMEOUT = 45000" <<<"$out"
echo "PASS test-timings-gate"
