import { describe, expect, test } from "bun:test";
import {
	createWorkItemManifest,
	invalidateFrom,
	skillkitAnnotations,
	validateWorkItemManifest,
} from "./work-item-manifest.mjs";

function manifest() {
	const value = createWorkItemManifest({
		source: "owner/repo#1",
		repository: "owner/repo",
		cwd: "/tmp/repo",
		base_sha: "base",
		head_sha: "head",
		profile: "standard",
		authorization: "local-write",
	});
	value.orchestration.independence_gap =
		"Single-context execution was selected because no independent runtime was requested.";
	return value;
}

describe("work item manifest", () => {
	test("accepts a complete initial manifest", () => {
		expect(validateWorkItemManifest(manifest()).errors).toEqual([]);
	});

	test("rejects repeated invalid orchestration calls", () => {
		const value = manifest();
		value.orchestration.schema_failures = 1;
		value.orchestration.operations = [
			{
				operation: "solution reviewer",
				attempted_calls: 2,
				schema_failures: 1,
				identical_retry: true,
			},
		];
		expect(validateWorkItemManifest(value).errors).toContain(
			"orchestration.operations[0].identical_retry must be false",
		);
	});

	test("rejects more than one schema failure per operation", () => {
		const value = manifest();
		value.orchestration.schema_failures = 2;
		value.orchestration.operations = [
			{
				operation: "review lens",
				attempted_calls: 2,
				schema_failures: 2,
				identical_retry: false,
			},
		];
		expect(validateWorkItemManifest(value).errors).toContain(
			"orchestration.operations[0].schema_failures must be 0 or 1",
		);
	});

	test("records the independence gap for degraded execution", () => {
		const value = manifest();
		value.orchestration.execution_mode = "sequential_isolated";
		value.orchestration.independence_gap = null;
		expect(validateWorkItemManifest(value).errors).toContain(
			"degraded orchestration modes must name the independence_gap",
		);
	});

	test("accepts FX as an independent execution mode", () => {
		const value = manifest();
		value.orchestration.execution_mode = "fx_worker";
		value.orchestration.independence_gap = null;
		expect(validateWorkItemManifest(value).errors).toEqual([]);
	});

	test("invalidates only downstream evidence", () => {
		const value = manifest();
		for (const stage of ["intake", "solution", "implementation", "spec"]) {
			value.stages[stage] = {
				...value.stages[stage],
				status: "pass",
				skill_revision: "git:abc",
				evidence: [`${stage} evidence`],
			};
		}
		const next = invalidateFrom(value, "implementation", "head changed");
		expect(next.stages.intake.status).toBe("pass");
		expect(next.stages.solution.status).toBe("pass");
		expect(next.stages.implementation.status).toBe("invalidated");
		expect(next.stages.spec.status).toBe("invalidated");
	});

	test("accepts dependency-aware receipt reuse across a non-intersecting head", () => {
		const value = manifest();
		value.stages.test_strength = {
			...value.stages.test_strength,
			status: "pass",
			skill_revision: "git:abc",
			evidence: ["mutation receipt"],
			fingerprint: {
				head_sha: "older",
				changed_paths_digest: "sha256:old",
				contract_digest: "sha256:contract",
				command: "bun test parser",
				environment_digest: "sha256:environment",
				skill_revision: "git:abc",
				relevant_paths: ["src/parser.ts"],
				reusable: true,
				reuse_evidence: "The follow-up changes only docs.",
				reuse: {
					source_head_sha: "older",
					target_head_sha: "head",
					changed_paths: ["docs/parser.md"],
					contract_digest: "sha256:contract",
					environment_digest: "sha256:environment",
					skill_revision: "git:abc",
				},
			},
		};
		expect(validateWorkItemManifest(value).errors).toEqual([]);
	});

	test("rejects receipt reuse when the later diff intersects its dependency cone", () => {
		const value = manifest();
		value.stages.test_strength = {
			...value.stages.test_strength,
			status: "pass",
			skill_revision: "git:abc",
			evidence: ["mutation receipt"],
			fingerprint: {
				head_sha: "older",
				changed_paths_digest: "sha256:old",
				contract_digest: "sha256:contract",
				command: "bun test parser",
				environment_digest: "sha256:environment",
				skill_revision: "git:abc",
				relevant_paths: ["src/parser.ts"],
				reusable: true,
				reuse_evidence: "Claimed reusable.",
				reuse: {
					source_head_sha: "older",
					target_head_sha: "head",
					changed_paths: ["src/parser.ts"],
					contract_digest: "sha256:contract",
					environment_digest: "sha256:environment",
					skill_revision: "git:abc",
				},
			},
		};
		expect(validateWorkItemManifest(value).errors).toContain(
			"stages.test_strength.fingerprint reuse intersects relevant path src/parser.ts",
		);
	});

	test("records profile defaults and resume telemetry", () => {
		const value = manifest();
		expect(value.work_item.budget_minutes).toBe(60);
		expect(value.outcome.exact_head_reuse_count).toBe(0);
		expect(value.outcome.interrupted_stages).toEqual([]);
		expect(value.outcome.restarted_stages).toEqual([]);
		value.work_item.budget_minutes = 90;
		expect(validateWorkItemManifest(value).errors).toContain(
			"work_item budget above the profile default needs budget_escalation evidence",
		);
	});

	test("derives SkillKit outcome annotations from stage receipts", () => {
		const value = manifest();
		value.stages.review = {
			...value.stages.review,
			status: "fail",
			receipt_id: "ur_1234567890abcdef12345678",
			reason: "one confirmed finding",
			evidence: ["foundry/runs/review-gate/run.json"],
		};
		expect(skillkitAnnotations(value)).toEqual([
			{
				receipt_id: "ur_1234567890abcdef12345678",
				outcome: "failed",
				outcome_confidence: 0.9,
				case_signal: "candidate",
				case_reason: "failure",
				summary: "one confirmed finding",
				evidence_handles: ["foundry/runs/review-gate/run.json"],
			},
		]);
	});
});
