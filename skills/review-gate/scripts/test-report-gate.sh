#!/usr/bin/env bash
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "$script_dir/.." && pwd)"
validator="$script_dir/validate-run-report.mjs"
fixture="$skill_dir/evals/run-report-example.json"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
cp "$skill_dir/evals/independent-challenge-example.txt" "$tmp_dir/"

passes=0
failures=0

expect_pass() {
	local name="$1"
	shift
	local output
	if output=$("$@" 2>&1); then
		echo "PASS [test] $name"
		passes=$((passes + 1))
	else
		echo "FAIL [test] $name"
		printf '%s\n' "$output"
		failures=$((failures + 1))
	fi
}

expect_finding() {
	local name="$1"
	local pattern="$2"
	shift 2
	local output status
	output=$("$@" 2>&1)
	status=$?
	if [[ $status -eq 1 ]] && grep -Fq "$pattern" <<<"$output"; then
		echo "PASS [test] $name"
		passes=$((passes + 1))
	else
		echo "FAIL [test] $name"
		printf '%s\n' "$output"
		failures=$((failures + 1))
	fi
}

mutate_fixture() {
	local output="$1"
	local expression="$2"
	node - "$fixture" "$output" "$expression" <<'NODE'
const fs = require("node:fs");
const [input, output, expression] = process.argv.slice(2);
const report = JSON.parse(fs.readFileSync(input, "utf8"));
Function("report", expression)(report);
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
NODE
}

expect_pass "complete fixture passes through gate wrapper" "$script_dir/gate.sh" report "$fixture" --structural

expect_finding \
	"proxy-only evidence is rejected" \
	"property P1 relies on proxy-only evidence" \
	node "$validator" "$skill_dir/evals/proxy-only-report.json" --structural

expect_finding \
	"post-commit coverage gaps are rejected" \
	"commit point C1 has a failure partition without retry" \
	node "$validator" "$skill_dir/evals/post-commit-gap-report.json" --structural

open_finding="$tmp_dir/open-finding.json"
mutate_fixture "$open_finding" 'report.findings[0].resolution = "open";'
expect_finding "open findings block pass" "finding F1 remains open" node "$validator" "$open_finding" --structural

missing_challenge="$tmp_dir/missing-challenge.json"
mutate_fixture "$missing_challenge" 'report.risk.independent_challenge.satisfied = false;'
expect_finding \
	"high-risk work needs an independent challenge" \
	"high-risk work lacks an independent challenge" \
	node "$validator" "$missing_challenge" --structural

unchecked_url="$tmp_dir/unchecked-url.json"
mutate_fixture "$unchecked_url" 'report.risk.independent_challenge.artifact = "https://example.com/review";'
expect_finding \
	"unchecked challenge URLs are rejected" \
	"independent challenge artifact must be a local auditable file" \
	node "$validator" "$unchecked_url" --structural

missing_commit_point="$tmp_dir/missing-commit-point.json"
mutate_fixture "$missing_commit_point" 'report.side_effects.commit_points = [];'
expect_finding \
	"present side effects need commit points" \
	"side_effects assessment is present but no commit point is listed" \
	node "$validator" "$missing_commit_point" --structural

unverified_assumption="$tmp_dir/unverified-assumption.json"
mutate_fixture "$unverified_assumption" 'report.assumptions[0].status = "unverified";'
expect_finding \
	"unverified assumptions block pass" \
	"assumption A1 is unverified" \
	node "$validator" "$unverified_assumption" --structural

refuted_assumption="$tmp_dir/refuted-assumption.json"
mutate_fixture "$refuted_assumption" 'report.assumptions[0].status = "refuted";'
expect_finding \
	"refuted assumptions block pass" \
	"assumption A1 is refuted" \
	node "$validator" "$refuted_assumption" --structural

unverified_fixed_finding="$tmp_dir/unverified-fixed-finding.json"
mutate_fixture "$unverified_fixed_finding" '
report.findings[0].state = "unverified";
report.findings[0].resolution = "fixed";
'
expect_finding \
	"unverified findings cannot masquerade as fixed" \
	"finding F1 is unverified and cannot be resolved without evidence" \
	node "$validator" "$unverified_fixed_finding" --structural

missing_dimensions="$tmp_dir/missing-dimensions.json"
mutate_fixture "$missing_dimensions" 'report.behavioral_strength.dimensions.values = [];'
expect_finding \
	"behavioral proof needs an explicit dimension table" \
	"required behavioral strength must record explicit dimensions" \
	node "$validator" "$missing_dimensions" --structural

implementation_oracle="$tmp_dir/implementation-oracle.json"
mutate_fixture "$implementation_oracle" 'report.behavioral_strength.oracle.independent = false;'
expect_finding \
	"implementation-derived oracle is rejected" \
	"required behavioral strength needs an oracle independent of production" \
	node "$validator" "$implementation_oracle" --structural

synthetic_only="$tmp_dir/synthetic-only.json"
mutate_fixture "$synthetic_only" '
report.behavioral_strength.producer.status = "unverified";
report.behavioral_strength.producer.evidence = "Only hand-built event objects were used.";
'
expect_finding \
	"synthetic-only producer evidence is rejected" \
	"required behavioral strength must exercise the real input producer" \
	node "$validator" "$synthetic_only" --structural

missing_falsification="$tmp_dir/missing-falsification.json"
mutate_fixture "$missing_falsification" 'report.behavioral_strength.falsification = [];'
expect_finding \
	"behavioral proof needs fix-absent falsification" \
	"required behavioral strength needs at least one fix-absent falsification" \
	node "$validator" "$missing_falsification" --structural

standard_report="$tmp_dir/standard-report.json"
mutate_fixture "$standard_report" '
report.risk = {
  level: "standard",
  triggers: [],
  independent_challenge: {
    required: false,
    satisfied: true,
    method: "not_required",
    artifact: "",
    evidence: "No high-risk trigger applies."
  }
};
report.properties[0].kind = "correctness";
report.side_effects = {
  assessment: "none",
  evidence: "The pure transformation creates no durable or externally visible state.",
  commit_points: []
};
report.behavioral_strength = {
  assessment: "not_required",
  triggers: [],
  dimensions: { values: [], exclusions: [], evidence: "" },
  oracle: { source: "", independent: false, evidence: "" },
  producer: { name: "", status: "not_applicable", evidence: "" },
  falsification: [],
  evidence: "The pure transformation is not a protocol, parser, serializer, state machine, lifecycle, event translation, adapter, or compatibility layer."
};
'
expect_pass "standard risk without side effects passes" node "$validator" "$standard_report" --structural

head_mismatch="$tmp_dir/head-mismatch.json"
head="$(git rev-parse HEAD)"
parent="$(git rev-parse HEAD~1)"
mutate_fixture "$head_mismatch" "
report.run.base = \"$parent\";
report.run.head = \"$parent\";
report.risk = {
  level: \"standard\",
  triggers: [],
  independent_challenge: {
    required: false,
    satisfied: true,
    method: \"not_required\",
    artifact: \"\",
    evidence: \"No high-risk trigger applies.\"
  }
};
report.properties[0].kind = \"correctness\";
report.side_effects = {
  assessment: \"none\",
  evidence: \"The selected historical diff has no declared side effect.\",
  commit_points: []
};
report.behavioral_strength = {
  assessment: \"not_required\",
  triggers: [],
  dimensions: { values: [], exclusions: [], evidence: \"\" },
  oracle: { source: \"\", independent: false, evidence: \"\" },
  producer: { name: \"\", status: \"not_applicable\", evidence: \"\" },
  falsification: [],
  evidence: \"The selected historical diff is not a behavioral translation boundary.\"
};
"
expect_finding \
	"report head must match checkout head" \
	"does not match checkout HEAD $head" \
	node "$validator" "$head_mismatch"

behavioral_repo="$tmp_dir/behavioral-repo"
mkdir -p "$behavioral_repo/src"
git -C "$behavioral_repo" init -q
git -C "$behavioral_repo" config user.name "Review Gate Fixture"
git -C "$behavioral_repo" config user.email "fixture@example.com"
printf '%s\n' 'export const identity = (value) => value;' >"$behavioral_repo/src/base.ts"
git -C "$behavioral_repo" add src/base.ts
git -C "$behavioral_repo" commit -qm "base"
behavioral_base="$(git -C "$behavioral_repo" rev-parse HEAD)"
printf '%s\n' \
	'export function encodeKeyboardEvent(event: KeyboardEvent) {' \
	'  return event.type === "keyup" ? "release" : "press";' \
	'}' >"$behavioral_repo/src/keyboard-input.ts"
git -C "$behavioral_repo" add src/keyboard-input.ts
git -C "$behavioral_repo" commit -qm "add keyboard event translation"
behavioral_head="$(git -C "$behavioral_repo" rev-parse HEAD)"
behavioral_report="$behavioral_repo/report.json"
mutate_fixture "$behavioral_report" "
report.run.base = \"$behavioral_base\";
report.run.head = \"$behavioral_head\";
report.risk = {
  level: \"standard\",
  triggers: [],
  independent_challenge: {
    required: false,
    satisfied: true,
    method: \"not_required\",
    artifact: \"\",
    evidence: \"No high-risk trigger applies.\"
  }
};
report.properties[0].kind = \"correctness\";
report.side_effects = {
  assessment: \"none\",
  evidence: \"The event encoder creates no durable or external side effect.\",
  commit_points: []
};
report.behavioral_strength = {
  assessment: \"not_required\",
  triggers: [],
  dimensions: { values: [], exclusions: [], evidence: \"\" },
  oracle: { source: \"\", independent: false, evidence: \"\" },
  producer: { name: \"\", status: \"not_applicable\", evidence: \"\" },
  falsification: [],
  evidence: \"Behavioral proof was incorrectly skipped.\"
};
"
original_dir="$PWD"
cd "$behavioral_repo"
expect_finding \
	"event-translation diff requires behavioral strength" \
	"diff signals mandatory behavioral strength but assessment is not required" \
	node "$validator" "$behavioral_report"
cd "$original_dir"

echo "RESULT [test] $passes passed, $failures failed"
[[ $failures -eq 0 ]]
