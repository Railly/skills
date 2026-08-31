import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const PROFILE_BUDGETS = {
	mechanical: 20,
	standard: 60,
	"high-risk": 180,
	"external-pr": 90,
};

export const STAGE_ORDER = [
	"intake",
	"solution",
	"implementation",
	"spec",
	"test_strength",
	"resilience",
	"review",
	"before_after",
	"promotion",
	"handoff",
	"case",
];

const AUTHORIZATIONS = new Set([
	"read-only",
	"local-write",
	"commit",
	"push",
	"pull-request",
	"merge",
	"release",
	"deploy",
	"external-communication",
]);
const EXECUTION_MODES = new Set([
	"native_subagent",
	"fx_worker",
	"herdr_worker",
	"sequential_isolated",
	"single_context",
	"unavailable",
]);
const STAGE_STATUSES = new Set([
	"pending",
	"running",
	"pass",
	"fail",
	"skipped",
	"not_triggered",
	"unavailable",
	"waiting_human",
	"invalidated",
]);
const OUTCOMES = new Set([
	"unknown",
	"succeeded",
	"failed",
	"interrupted",
	"corrected",
	"inconclusive",
]);
const DELIVERY_OUTCOMES = new Set([
	"unknown",
	"pending",
	"merged",
	"rejected",
	"not_applicable",
]);

function text(value) {
	return typeof value === "string" && value.trim() !== "";
}

function nullableText(value) {
	return value === null || text(value);
}

function timestamp(value) {
	return text(value) && Number.isFinite(Date.parse(value));
}

function requireText(errors, value, label) {
	if (!text(value)) errors.push(`${label} must be a non-empty string`);
}

function requireStringArray(errors, value, label) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
		errors.push(`${label} must be an array of strings`);
	}
}

export function digestJson(value) {
	return `sha256:${createHash("sha256")
		.update(JSON.stringify(value))
		.digest("hex")}`;
}

export function emptyStage(skill = null) {
	return {
		status: "pending",
		skill,
		skill_revision: null,
		head_sha: null,
		started_at: null,
		finished_at: null,
		duration_ms: null,
		evidence: [],
		reason: null,
		receipt_id: null,
		fingerprint: null,
	};
}

export function createWorkItemManifest(input) {
	const now = new Date().toISOString();
	const profile = input.profile ?? "standard";
	return {
		schema_version: 1,
		work_item: {
			source: input.source,
			repository: input.repository,
			cwd: input.cwd,
			base_sha: input.base_sha ?? null,
			head_sha: input.head_sha ?? null,
			dirty_digest: input.dirty_digest ?? null,
			authorization: input.authorization ?? "read-only",
			profile,
			budget_minutes: input.budget_minutes ?? PROFILE_BUDGETS[profile],
			budget_started_at: now,
			budget_escalation: null,
		},
		skill_revisions: {},
		orchestration: {
			execution_mode: "single_context",
			degraded_from: null,
			independence_gap:
				"No independent runtime has been selected for this work item.",
			schema_failures: 0,
			operations: [],
		},
		stages: Object.fromEntries(
			STAGE_ORDER.map((stage) => [stage, emptyStage()]),
		),
		outcome: {
			status: "unknown",
			delivery: "unknown",
			external_findings: null,
			review_rounds: null,
			regression_7d: null,
			regression_30d: null,
			human_corrections: null,
			exact_head_reuse_count: 0,
			interrupted_stages: [],
			restarted_stages: [],
			escaped_finding_classes: [],
		},
		close_cycle: {
			handoff: "pending",
			case: "pending",
			git: "pending",
			promotion: "pending",
		},
		updated_at: now,
	};
}

function pathsIntersect(left, right) {
	const normalize = (value) => value.replace(/^\.\//, "").replace(/\/+$/, "");
	const a = normalize(left);
	const b = normalize(right);
	return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function validateStage(stage, name, currentHead, errors) {
	const label = `stages.${name}`;
	if (!stage || typeof stage !== "object" || Array.isArray(stage)) {
		errors.push(`${label} must be an object`);
		return;
	}
	if (!STAGE_STATUSES.has(stage.status)) {
		errors.push(`${label}.status is invalid`);
	}
	for (const field of [
		"skill",
		"skill_revision",
		"head_sha",
		"started_at",
		"finished_at",
		"reason",
		"receipt_id",
	]) {
		if (!nullableText(stage[field]))
			errors.push(`${label}.${field} is invalid`);
	}
	if (
		stage.duration_ms !== null &&
		(!Number.isInteger(stage.duration_ms) || stage.duration_ms < 0)
	) {
		errors.push(`${label}.duration_ms must be null or a non-negative integer`);
	}
	requireStringArray(errors, stage.evidence, `${label}.evidence`);
	if (
		["pass", "fail", "invalidated"].includes(stage.status) &&
		stage.evidence.length === 0
	) {
		errors.push(`${label}.${stage.status} needs evidence`);
	}
	if (
		["skipped", "not_triggered", "unavailable", "invalidated"].includes(
			stage.status,
		) &&
		!text(stage.reason)
	) {
		errors.push(`${label}.${stage.status} needs a reason`);
	}
	if (stage.status === "pass" && !text(stage.skill_revision)) {
		errors.push(`${label}.pass needs skill_revision`);
	}
	if (stage.fingerprint !== null) {
		const fingerprint = stage.fingerprint;
		if (
			!fingerprint ||
			typeof fingerprint !== "object" ||
			Array.isArray(fingerprint)
		) {
			errors.push(`${label}.fingerprint must be null or an object`);
		} else {
			for (const field of [
				"head_sha",
				"changed_paths_digest",
				"contract_digest",
				"command",
				"environment_digest",
				"skill_revision",
			]) {
				requireText(
					errors,
					fingerprint[field],
					`${label}.fingerprint.${field}`,
				);
			}
			requireStringArray(
				errors,
				fingerprint.relevant_paths,
				`${label}.fingerprint.relevant_paths`,
			);
			if (typeof fingerprint.reusable !== "boolean") {
				errors.push(`${label}.fingerprint.reusable must be boolean`);
			}
			if (fingerprint.head_sha !== currentHead) {
				if (!fingerprint.reusable) {
					errors.push(`${label}.fingerprint is stale for work_item.head_sha`);
				}
				if (!text(fingerprint.reuse_evidence)) {
					errors.push(`${label}.reusable fingerprint needs reuse_evidence`);
				}
				const reuse = fingerprint.reuse;
				if (!reuse || typeof reuse !== "object" || Array.isArray(reuse)) {
					errors.push(`${label}.reusable fingerprint needs a reuse record`);
				} else {
					requireText(
						errors,
						reuse.source_head_sha,
						`${label}.fingerprint.reuse.source_head_sha`,
					);
					requireText(
						errors,
						reuse.target_head_sha,
						`${label}.fingerprint.reuse.target_head_sha`,
					);
					requireStringArray(
						errors,
						reuse.changed_paths,
						`${label}.fingerprint.reuse.changed_paths`,
					);
					if (reuse.source_head_sha !== fingerprint.head_sha) {
						errors.push(
							`${label}.fingerprint reuse source must match fingerprint head`,
						);
					}
					if (reuse.target_head_sha !== currentHead) {
						errors.push(
							`${label}.fingerprint reuse target must match work_item.head_sha`,
						);
					}
					for (const field of [
						"contract_digest",
						"environment_digest",
						"skill_revision",
					]) {
						if (reuse[field] !== fingerprint[field]) {
							errors.push(`${label}.fingerprint reuse changed ${field}`);
						}
					}
					for (const changed of reuse.changed_paths ?? []) {
						for (const relevant of fingerprint.relevant_paths ?? []) {
							if (pathsIntersect(changed, relevant)) {
								errors.push(
									`${label}.fingerprint reuse intersects relevant path ${relevant}`,
								);
							}
						}
					}
				}
			} else if (fingerprint.reusable || fingerprint.reuse != null) {
				errors.push(
					`${label}.fingerprint reuse is only valid across different heads`,
				);
			}
		}
	}
}

export function validateWorkItemManifest(manifest) {
	const errors = [];
	if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
		return { errors: ["manifest must be an object"] };
	}
	if (manifest.schema_version !== 1) {
		errors.push("schema_version must be 1");
	}
	const workItem = manifest.work_item;
	if (!workItem || typeof workItem !== "object" || Array.isArray(workItem)) {
		errors.push("work_item must be an object");
	} else {
		for (const field of ["source", "repository", "cwd"]) {
			requireText(errors, workItem[field], `work_item.${field}`);
		}
		for (const field of ["base_sha", "head_sha", "dirty_digest"]) {
			if (!nullableText(workItem[field])) {
				errors.push(`work_item.${field} is invalid`);
			}
		}
		if (!AUTHORIZATIONS.has(workItem.authorization)) {
			errors.push("work_item.authorization is invalid");
		}
		if (!(workItem.profile in PROFILE_BUDGETS)) {
			errors.push("work_item.profile is invalid");
		}
		if (
			!Number.isInteger(workItem.budget_minutes) ||
			workItem.budget_minutes < 1
		) {
			errors.push("work_item.budget_minutes must be a positive integer");
		}
		if (!timestamp(workItem.budget_started_at)) {
			errors.push("work_item.budget_started_at must be a timestamp");
		}
		if (
			workItem.budget_minutes > PROFILE_BUDGETS[workItem.profile] &&
			!text(workItem.budget_escalation)
		) {
			errors.push(
				"work_item budget above the profile default needs budget_escalation evidence",
			);
		}
	}
	if (
		!manifest.skill_revisions ||
		typeof manifest.skill_revisions !== "object" ||
		Array.isArray(manifest.skill_revisions)
	) {
		errors.push("skill_revisions must be an object");
	} else {
		for (const [name, revision] of Object.entries(manifest.skill_revisions)) {
			const label = `skill_revisions.${name}`;
			requireText(errors, revision?.revision, `${label}.revision`);
			requireText(errors, revision?.digest, `${label}.digest`);
			requireText(errors, revision?.path, `${label}.path`);
			if (!["exact", "diverged", "unresolved"].includes(revision?.status)) {
				errors.push(`${label}.status is invalid`);
			}
		}
	}
	const orchestration = manifest.orchestration;
	if (
		!orchestration ||
		typeof orchestration !== "object" ||
		Array.isArray(orchestration)
	) {
		errors.push("orchestration must be an object");
	} else {
		if (!EXECUTION_MODES.has(orchestration.execution_mode)) {
			errors.push("orchestration.execution_mode is invalid");
		}
		if (
			orchestration.degraded_from !== null &&
			!EXECUTION_MODES.has(orchestration.degraded_from)
		) {
			errors.push("orchestration.degraded_from is invalid");
		}
		if (!nullableText(orchestration.independence_gap)) {
			errors.push("orchestration.independence_gap is invalid");
		}
		if (
			["sequential_isolated", "single_context", "unavailable"].includes(
				orchestration.execution_mode,
			) &&
			!text(orchestration.independence_gap)
		) {
			errors.push(
				"degraded orchestration modes must name the independence_gap",
			);
		}
		if (
			!Number.isInteger(orchestration.schema_failures) ||
			orchestration.schema_failures < 0 ||
			orchestration.schema_failures > 3
		) {
			errors.push("orchestration.schema_failures must be 0 through 3");
		}
		if (!Array.isArray(orchestration.operations)) {
			errors.push("orchestration.operations must be an array");
		} else {
			let schemaFailures = 0;
			for (const [index, operation] of orchestration.operations.entries()) {
				const label = `orchestration.operations[${index}]`;
				requireText(errors, operation?.operation, `${label}.operation`);
				if (
					!Number.isInteger(operation?.attempted_calls) ||
					operation.attempted_calls < 0
				) {
					errors.push(`${label}.attempted_calls must be non-negative`);
				}
				if (
					!Number.isInteger(operation?.schema_failures) ||
					operation.schema_failures < 0 ||
					operation.schema_failures > 1
				) {
					errors.push(`${label}.schema_failures must be 0 or 1`);
				}
				if (operation?.identical_retry !== false) {
					errors.push(`${label}.identical_retry must be false`);
				}
				schemaFailures += operation?.schema_failures ?? 0;
			}
			if (schemaFailures !== orchestration.schema_failures) {
				errors.push(
					"orchestration.schema_failures must equal the operation total",
				);
			}
		}
	}
	if (
		!manifest.stages ||
		typeof manifest.stages !== "object" ||
		Array.isArray(manifest.stages)
	) {
		errors.push("stages must be an object");
	} else {
		for (const stage of STAGE_ORDER) {
			validateStage(
				manifest.stages[stage],
				stage,
				manifest.work_item?.head_sha,
				errors,
			);
		}
	}
	const outcome = manifest.outcome;
	if (!outcome || typeof outcome !== "object" || Array.isArray(outcome)) {
		errors.push("outcome must be an object");
	} else {
		if (!OUTCOMES.has(outcome.status)) errors.push("outcome.status is invalid");
		if (!DELIVERY_OUTCOMES.has(outcome.delivery)) {
			errors.push("outcome.delivery is invalid");
		}
		for (const field of [
			"external_findings",
			"review_rounds",
			"human_corrections",
			"exact_head_reuse_count",
		]) {
			if (
				outcome[field] !== null &&
				(!Number.isInteger(outcome[field]) || outcome[field] < 0)
			) {
				errors.push(`outcome.${field} must be null or non-negative`);
			}
		}
		for (const field of ["regression_7d", "regression_30d"]) {
			if (outcome[field] !== null && typeof outcome[field] !== "boolean") {
				errors.push(`outcome.${field} must be null or boolean`);
			}
		}
		requireStringArray(
			errors,
			outcome.escaped_finding_classes,
			"outcome.escaped_finding_classes",
		);
		requireStringArray(
			errors,
			outcome.interrupted_stages,
			"outcome.interrupted_stages",
		);
		requireStringArray(
			errors,
			outcome.restarted_stages,
			"outcome.restarted_stages",
		);
	}
	if (
		!manifest.close_cycle ||
		typeof manifest.close_cycle !== "object" ||
		Array.isArray(manifest.close_cycle)
	) {
		errors.push("close_cycle must be an object");
	} else {
		for (const field of ["handoff", "case", "git", "promotion"]) {
			requireText(errors, manifest.close_cycle[field], `close_cycle.${field}`);
		}
	}
	if (!timestamp(manifest.updated_at)) {
		errors.push("updated_at must be a timestamp");
	}
	return { errors };
}

export function readWorkItemManifest(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

export function invalidateFrom(manifest, stage, reason) {
	const start = STAGE_ORDER.indexOf(stage);
	if (start === -1) throw new Error(`Unknown stage: ${stage}`);
	const next = structuredClone(manifest);
	for (const name of STAGE_ORDER.slice(start)) {
		const current = next.stages[name];
		if (current.status === "pending") continue;
		next.stages[name] = {
			...emptyStage(current.skill),
			status: "invalidated",
			reason,
			evidence: [`invalidated from ${stage}: ${reason}`],
		};
	}
	next.updated_at = new Date().toISOString();
	return next;
}

export function skillkitAnnotations(manifest) {
	const annotations = [];
	for (const [stageName, stage] of Object.entries(manifest.stages ?? {})) {
		if (!text(stage.receipt_id)) continue;
		if (["pending", "running", "waiting_human"].includes(stage.status))
			continue;
		const evidence = stage.evidence ?? [];
		if (stage.status === "pass") {
			annotations.push({
				receipt_id: stage.receipt_id,
				outcome: "succeeded",
				outcome_confidence: evidence.length > 0 ? 0.95 : 0.7,
				case_signal: "routine",
				case_reason: "routine",
			});
			continue;
		}
		const mapping = {
			fail: ["failed", "failure"],
			invalidated: ["corrected", "correction"],
			unavailable: ["inconclusive", "novel-transfer"],
		};
		const resolved = mapping[stage.status];
		if (!resolved) continue;
		annotations.push({
			receipt_id: stage.receipt_id,
			outcome: resolved[0],
			outcome_confidence: evidence.length > 0 ? 0.9 : 0.6,
			case_signal: "candidate",
			case_reason: resolved[1],
			summary: stage.reason ?? `${stageName} ended as ${stage.status}`,
			evidence_handles:
				evidence.length > 0 ? evidence : [`manifest:${stageName}`],
		});
	}
	return annotations;
}
