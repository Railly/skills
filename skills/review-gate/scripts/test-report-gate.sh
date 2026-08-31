#!/usr/bin/env bash
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "$script_dir/.." && pwd)"
validator="$script_dir/validate-run-report.mjs"
fixture="$skill_dir/evals/run-report-example.json"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
cp "$skill_dir/evals/independent-challenge-example.txt" "$tmp_dir/"
cp "$skill_dir/evals/fx-review-example.json" "$tmp_dir/"

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

rendered="$tmp_dir/rendered.md"
rendered_again="$tmp_dir/rendered-again.md"
expect_pass "schema-v1 JSON renders one deterministic human report" "$script_dir/gate.sh" render "$fixture" "$rendered"
"$script_dir/gate.sh" render "$fixture" "$rendered_again" >/dev/null
expect_pass "rendered prose is byte-stable" cmp "$rendered" "$rendered_again"
expect_pass "rendered prose carries exact state and receipts" grep -Fq '## Stage receipts' "$rendered"

expect_finding \
	"proxy-only evidence is rejected" \
	"property P1 relies on proxy-only evidence" \
	node "$validator" "$skill_dir/evals/proxy-only-report.json" --structural

post_commit_gap="$tmp_dir/post-commit-gap.json"
mutate_fixture "$post_commit_gap" '
report.stage_receipts.resilience.commit_points[0].failure_partitions[0].retry.attempted = false;
report.stage_receipts.resilience.commit_points[0].failure_partitions[0].retry.outcome = "failed";
'
expect_finding \
	"post-commit coverage gaps are rejected" \
	"commit point C1 has a failure partition without retry" \
	node "$validator" "$post_commit_gap" --structural

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

missing_security_review="$tmp_dir/missing-security-review.json"
mutate_fixture "$missing_security_review" 'delete report.security_review;'
expect_finding \
	"security-sensitive work needs a security receipt" \
	"security-sensitive work requires a security_review receipt" \
	node "$validator" "$missing_security_review" --structural

stale_security_review="$tmp_dir/stale-security-review.json"
mutate_fixture "$stale_security_review" 'report.security_review.fingerprint.head_sha = "stale-head";'
expect_finding \
	"stale security receipts are rejected" \
	"security_review receipt head does not match run.head" \
	node "$validator" "$stale_security_review" --structural

security_blocker="$tmp_dir/security-blocker.json"
mutate_fixture "$security_blocker" '
report.security_review.status = "findings";
report.security_review.observations[0] = {
  id: "SEC-001",
  classification: "confirmed_vulnerability",
  scope: "in_scope_security_regression",
  confidence: "high",
  evidence: ["A lower-trust principal crossed the authorization boundary."]
};
report.security_review.merge_relevance.security_blockers = ["SEC-001"];
'
expect_finding \
	"open security blockers block pass" \
	"security_review has unresolved security blockers" \
	node "$validator" "$security_blocker" --structural

security_gap="$tmp_dir/security-gap.json"
mutate_fixture "$security_gap" '
report.security_review.status = "incomplete";
report.security_review.observations[0] = {
  id: "SEC-001",
  classification: "verification_gap",
  scope: "adjacent_security_blocker",
  confidence: "low",
  evidence: ["The supported reverse-proxy behavior is unknown."]
};
report.security_review.verification.gaps = ["Reverse-proxy behavior was not available to test."];
'
expect_finding \
	"security verification gaps block pass" \
	"security_review has unresolved verification gaps" \
	node "$validator" "$security_gap" --structural

hardening_only="$tmp_dir/hardening-only.json"
mutate_fixture "$hardening_only" '
report.security_review.observations = [
  {
    id: "SEC-001",
    classification: "hardening",
    scope: "out_of_scope_hardening",
    confidence: "high",
    evidence: ["The receiver already has equivalent authority."]
  },
  {
    id: "SEC-002",
    classification: "non_security_defect",
    scope: "unrelated_bug",
    confidence: "high",
    evidence: ["Startup reports success before bind completion."]
  }
];
'
expect_pass \
	"hardening and non-security observations do not block" \
	node "$validator" "$hardening_only" --structural

missing_commit_point="$tmp_dir/missing-commit-point.json"
mutate_fixture "$missing_commit_point" 'report.stage_receipts.resilience.commit_points = [];'
expect_finding \
	"present side effects need commit points" \
	"required resilience receipt needs commit points" \
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
mutate_fixture "$missing_dimensions" 'report.stage_receipts.test_strength.dimensions.values = [];'
expect_finding \
	"behavioral proof needs an explicit dimension table" \
	"required behavioral strength must record explicit dimensions" \
	node "$validator" "$missing_dimensions" --structural

implementation_oracle="$tmp_dir/implementation-oracle.json"
mutate_fixture "$implementation_oracle" 'report.stage_receipts.test_strength.oracle.independent = false;'
expect_finding \
	"implementation-derived oracle is rejected" \
	"required behavioral strength needs an oracle independent of production" \
	node "$validator" "$implementation_oracle" --structural

synthetic_only="$tmp_dir/synthetic-only.json"
mutate_fixture "$synthetic_only" '
report.stage_receipts.test_strength.producer.status = "unverified";
report.stage_receipts.test_strength.producer.evidence = "Only hand-built event objects were used.";
'
expect_finding \
	"synthetic-only producer evidence is rejected" \
	"required behavioral strength must exercise the real input producer" \
	node "$validator" "$synthetic_only" --structural

missing_falsification="$tmp_dir/missing-falsification.json"
mutate_fixture "$missing_falsification" 'report.stage_receipts.test_strength.falsification = [];'
expect_finding \
	"behavioral proof needs fix-absent falsification" \
	"required behavioral strength needs at least one fix-absent falsification" \
	node "$validator" "$missing_falsification" --structural

standard_report="$tmp_dir/standard-report.json"
mutate_fixture "$standard_report" '
report.run.profile = "standard";
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
report.stage_receipts = {
  test_strength: {
    required: false,
    status: "not_triggered",
    reason: "The pure transformation is not a behavioral translation boundary."
  },
  resilience: {
    required: false,
    status: "not_triggered",
    reason: "The pure transformation creates no durable or externally visible state."
  }
};
'
expect_pass "standard risk without side effects passes" node "$validator" "$standard_report" --structural

head_mismatch="$tmp_dir/head-mismatch.json"
head="$(git rev-parse HEAD)"
parent="$(git rev-parse HEAD~1)"
mutate_fixture "$head_mismatch" "
report.run.base = \"$parent\";
report.run.head = \"$parent\";
report.run.profile = \"standard\";
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
report.stage_receipts = {
  test_strength: {
    required: false,
    status: \"not_triggered\",
    reason: \"The selected historical diff is not a behavioral translation boundary.\"
  },
  resilience: {
    required: false,
    status: \"not_triggered\",
    reason: \"The selected historical diff has no declared side effect.\"
  }
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
git -C "$behavioral_repo" config commit.gpgsign false
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
report.run.profile = \"standard\";
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
report.stage_receipts = {
  test_strength: {
    required: false,
    status: \"not_triggered\",
    reason: \"Behavioral proof was incorrectly skipped.\"
  },
  resilience: {
    required: false,
    status: \"not_triggered\",
    reason: \"The event encoder creates no durable or external side effect.\"
  }
};
"
original_dir="$PWD"
cd "$behavioral_repo"
expect_finding \
	"event-translation diff requires behavioral strength" \
	"diff signals mandatory behavioral strength but Test Strength receipt is not required" \
	node "$validator" "$behavioral_report"
cd "$original_dir"

identical_retry="$tmp_dir/identical-retry.json"
mutate_fixture "$identical_retry" '
report.execution.schema_failures = 1;
report.execution.operations = [{
  operation: "independent review",
  attempted_calls: 1,
  schema_failures: 1,
  identical_retry: true
}];
'
expect_finding \
	"identical invalid orchestration calls are rejected" \
	"execution.operations[0].identical_retry must be false" \
	node "$validator" "$identical_retry" --structural

missing_fx_receipt="$tmp_dir/missing-fx-receipt.json"
mutate_fixture "$missing_fx_receipt" 'report.execution.receipt = "";'
expect_finding \
	"FX execution requires an auditable receipt" \
	"execution.receipt is required" \
	node "$validator" "$missing_fx_receipt" --structural

wrong_fx_auth="$tmp_dir/wrong-fx-auth.json"
cp "$skill_dir/evals/fx-review-example.json" "$tmp_dir/wrong-fx-review.json"
node - "$tmp_dir/wrong-fx-review.json" <<'NODE'
const fs = require("node:fs");
const path = process.argv[2];
const receipt = JSON.parse(fs.readFileSync(path, "utf8"));
receipt.auth = "fx login";
fs.writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
NODE
mutate_fixture "$wrong_fx_auth" 'report.execution.receipt = "wrong-fx-review.json";'
expect_finding \
	"FX execution rejects a non-Gateway auth receipt" \
	"execution.receipt auth must equal \"AI_GATEWAY_API_KEY\"" \
	node "$validator" "$wrong_fx_auth" --structural

stale_receipt="$tmp_dir/stale-receipt.json"
mutate_fixture "$stale_receipt" '
report.stage_receipts.test_strength.fingerprint.head_sha = "older-head";
report.stage_receipts.test_strength.fingerprint.reusable = false;
'
expect_finding \
	"stale required receipts are rejected" \
	"stage_receipts.test_strength is stale for the reviewed head" \
	node "$validator" "$stale_receipt" --structural

intersecting_reuse="$tmp_dir/intersecting-reuse.json"
mutate_fixture "$intersecting_reuse" '
report.stage_receipts.test_strength.fingerprint.head_sha = "older-head";
report.stage_receipts.test_strength.fingerprint.reusable = true;
report.stage_receipts.test_strength.fingerprint.reuse_evidence = "Claimed unaffected.";
report.stage_receipts.test_strength.fingerprint.reuse = {
  source_head_sha: "older-head",
  target_head_sha: report.run.head,
  changed_paths: ["src/auth.ts"],
  contract_digest: report.stage_receipts.test_strength.fingerprint.contract_digest,
  environment_digest: report.stage_receipts.test_strength.fingerprint.environment_digest,
  skill_revision: report.stage_receipts.test_strength.fingerprint.skill_revision
};
'
expect_finding \
	"receipt reuse is rejected when the later diff intersects its dependency cone" \
	"stage_receipts.test_strength reuse intersects relevant path src/auth.ts" \
	node "$validator" "$intersecting_reuse" --structural

echo "RESULT [test] $passes passed, $failures failed"
[[ $failures -eq 0 ]]
