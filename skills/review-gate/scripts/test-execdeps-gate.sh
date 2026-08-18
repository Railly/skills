#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fixture="$(mktemp -d)"
trap 'rm -rf "$fixture"' EXIT

git -C "$fixture" init -q
git -C "$fixture" config user.email test@example.com
git -C "$fixture" config user.name Test
mkdir -p "$fixture/src" "$fixture/install"
printf '%s\n' 'fn main() {}' >"$fixture/src/tool.rs"
printf '%s\n' 'packages = ["runtime"]' >"$fixture/install/debian.txt"
printf '%s\n' 'packages = ["runtime"]' >"$fixture/install/fedora.txt"
printf '%s\n' '```execdeps' 'certutil :: src/tool.rs :: libnss3-tools|nss-tools :: install/debian.txt, install/fedora.txt' '```' >"$fixture/conventions.md"
git -C "$fixture" add .
git -C "$fixture" commit -qm base
printf '%s\n' 'fn main() { Command::new("certutil"); }' >"$fixture/src/tool.rs"

if (
	cd "$fixture"
	"$script_dir/gate.sh" execdeps "$fixture/conventions.md" HEAD >/tmp/review-gate-execdeps-red.txt 2>&1
); then
	echo "expected red fixture to fail"
	exit 1
fi
grep -q "install/debian.txt" /tmp/review-gate-execdeps-red.txt
grep -q "install/fedora.txt" /tmp/review-gate-execdeps-red.txt

printf '%s\n' 'packages = ["libnss3-tools"]' >"$fixture/install/debian.txt"
printf '%s\n' 'packages = ["nss-tools"]' >"$fixture/install/fedora.txt"
(
	cd "$fixture"
	"$script_dir/gate.sh" execdeps "$fixture/conventions.md" HEAD
)
