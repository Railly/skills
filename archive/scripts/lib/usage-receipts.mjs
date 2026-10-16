const TOP_LEVEL_FIELDS = new Set([
	"schema_version",
	"visibility",
	"created_receipts",
	"receipts",
	"next_cursor",
]);

const RECEIPT_FIELDS = new Set([
	"receipt_id",
	"skill_name",
	"agent",
	"session_id",
	"project",
	"first_seen_at",
	"last_seen_at",
	"invocation_count",
	"source_invocation_ids",
	"procedure_path",
	"procedure_digest",
	"digest_status",
	"outcome",
	"outcome_confidence",
	"case_signal",
	"case_reason",
	"summary",
	"evidence_handles",
	"visibility",
	"created_at",
	"updated_at",
]);

const OUTCOMES = new Set([
	"unknown",
	"succeeded",
	"failed",
	"interrupted",
	"corrected",
	"inconclusive",
]);

const SIGNALS = new Set([
	"unreviewed",
	"routine",
	"candidate",
	"reviewed",
]);

const REASONS = new Set([
	"unknown",
	"routine",
	"failure",
	"correction",
	"interruption",
	"novel-transfer",
	"maintainer-feedback",
]);

const DIGEST_STATUSES = new Set([
	"unknown",
	"observed-after-session",
	"exact",
]);

function unknownFields(value, allowed) {
	return Object.keys(value).filter((field) => !allowed.has(field));
}

function assertString(value, label, { nullable = false } = {}) {
	if (nullable && value === null) return;
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`${label} must be a non-empty string${nullable ? " or null" : ""}`);
	}
}

function assertStringArray(value, label) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
		throw new Error(`${label} must be an array of strings`);
	}
}

function assertTimestamp(value, label) {
	assertString(value, label);
	const format =
		/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{3})?Z$/;
	const parsed = new Date(value);
	const normalized = value?.includes(".") ? value : value?.replace("Z", ".000Z");
	if (!format.test(value) || !Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== normalized) {
		throw new Error(`${label} must be an ISO 8601 UTC timestamp`);
	}
}

function assertReceiptSemantics(receipt, label) {
	const expectedOutcomes = {
		routine: "succeeded",
		failure: "failed",
		correction: "corrected",
		interruption: "interrupted",
	};
	const expected = expectedOutcomes[receipt.case_reason];
	if (expected && receipt.outcome !== expected) {
		throw new Error(`${label}.${receipt.case_reason} reason requires ${expected} outcome`);
	}
	if (receipt.outcome === "unknown") {
		if (
			receipt.case_signal !== "unreviewed" ||
			receipt.case_reason !== "unknown" ||
			receipt.outcome_confidence !== null
		) {
			throw new Error(
				`${label}.unknown outcome must remain unreviewed with unknown reason and no confidence`,
			);
		}
	} else if (receipt.outcome_confidence === null) {
		throw new Error(`${label}.reviewed outcome requires outcome_confidence`);
	}
	if (
		receipt.case_signal === "routine" &&
		(receipt.case_reason !== "routine" || receipt.outcome !== "succeeded")
	) {
		throw new Error(`${label}.routine signal requires routine succeeded outcome`);
	}
	const candidate =
		receipt.case_signal === "candidate" ||
		receipt.case_signal === "reviewed" ||
		["failed", "interrupted", "corrected"].includes(receipt.outcome) ||
		["novel-transfer", "maintainer-feedback"].includes(receipt.case_reason);
	if (candidate && receipt.outcome !== "unknown") {
		if (!receipt.summary?.trim()) {
			throw new Error(`${label}.case candidate requires a private summary`);
		}
		if (receipt.evidence_handles.length === 0) {
			throw new Error(`${label}.case candidate requires an evidence handle`);
		}
	}
}

export function validateUsageReceiptExport(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error("usage receipt export must be an object");
	}
	const topUnknown = unknownFields(value, TOP_LEVEL_FIELDS);
	if (topUnknown.length > 0) {
		throw new Error(`usage receipt export has unknown field "${topUnknown[0]}"`);
	}
	if (value.schema_version !== 1) {
		throw new Error("usage receipt export requires schema_version 1");
	}
	if (value.visibility !== "private") {
		throw new Error("usage receipt export must be private");
	}
	if (!Number.isInteger(value.created_receipts) || value.created_receipts < 0) {
		throw new Error("usage receipt export created_receipts must be a non-negative integer");
	}
	if (!Array.isArray(value.receipts)) {
		throw new Error("usage receipt export receipts must be an array");
	}
	if (
		value.next_cursor !== null &&
		(typeof value.next_cursor !== "string" ||
			!/^ur_[a-f0-9]{24}$/.test(value.next_cursor))
	) {
		throw new Error("usage receipt export next_cursor is invalid");
	}
	const ids = new Set();
	for (const [index, receipt] of value.receipts.entries()) {
		const label = `receipts[${index}]`;
		if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
			throw new Error(`${label} must be an object`);
		}
		const receiptUnknown = unknownFields(receipt, RECEIPT_FIELDS);
		if (receiptUnknown.length > 0) {
			throw new Error(`${label} has unknown field "${receiptUnknown[0]}"`);
		}
		assertString(receipt.receipt_id, `${label}.receipt_id`);
		if (!/^ur_[a-f0-9]{24}$/.test(receipt.receipt_id)) {
			throw new Error(`${label}.receipt_id has invalid format`);
		}
		if (ids.has(receipt.receipt_id)) {
			throw new Error(`${label}.receipt_id is duplicated`);
		}
		ids.add(receipt.receipt_id);
		assertString(receipt.skill_name, `${label}.skill_name`);
		assertString(receipt.agent, `${label}.agent`);
		if (!/^[a-z0-9][a-z0-9._-]*$/.test(receipt.agent)) {
			throw new Error(`${label}.agent has invalid format`);
		}
		assertString(receipt.session_id, `${label}.session_id`, { nullable: true });
		assertString(receipt.project, `${label}.project`, { nullable: true });
		assertTimestamp(receipt.first_seen_at, `${label}.first_seen_at`);
		assertTimestamp(receipt.last_seen_at, `${label}.last_seen_at`);
		if (Date.parse(receipt.first_seen_at) > Date.parse(receipt.last_seen_at)) {
			throw new Error(`${label}.first_seen_at must not follow last_seen_at`);
		}
		if (!Number.isInteger(receipt.invocation_count) || receipt.invocation_count < 1) {
			throw new Error(`${label}.invocation_count must be a positive integer`);
		}
		assertStringArray(receipt.source_invocation_ids, `${label}.source_invocation_ids`);
		if (
			receipt.source_invocation_ids.length !== receipt.invocation_count ||
			receipt.source_invocation_ids.some(
				(source) => !/^(?:event|invocation):[^/\s]+$/.test(source),
			) ||
			new Set(receipt.source_invocation_ids).size !==
				receipt.source_invocation_ids.length
		) {
			throw new Error(
				`${label}.source_invocation_ids must be unique, opaque, and count-consistent`,
			);
		}
		assertString(receipt.procedure_path, `${label}.procedure_path`, {
			nullable: true,
		});
		assertString(receipt.procedure_digest, `${label}.procedure_digest`, {
			nullable: true,
		});
		if (!DIGEST_STATUSES.has(receipt.digest_status)) {
			throw new Error(`${label}.digest_status is invalid`);
		}
		if (
			receipt.procedure_digest !== null &&
			!/^sha256:[a-f0-9]{64}$/.test(receipt.procedure_digest)
		) {
			throw new Error(`${label}.procedure_digest has invalid format`);
		}
		if (receipt.digest_status === "unknown" && receipt.procedure_digest !== null) {
			throw new Error(`${label}.unknown digest status cannot carry a digest`);
		}
		if (
			receipt.digest_status !== "unknown" &&
			receipt.procedure_digest === null
		) {
			throw new Error(`${label}.digest_status requires a procedure digest`);
		}
		if (!OUTCOMES.has(receipt.outcome)) {
			throw new Error(`${label}.outcome is invalid`);
		}
		if (
			receipt.outcome_confidence !== null &&
			(typeof receipt.outcome_confidence !== "number" ||
				receipt.outcome_confidence < 0 ||
				receipt.outcome_confidence > 1)
		) {
			throw new Error(`${label}.outcome_confidence must be null or 0 through 1`);
		}
		if (!SIGNALS.has(receipt.case_signal)) {
			throw new Error(`${label}.case_signal is invalid`);
		}
		if (!REASONS.has(receipt.case_reason)) {
			throw new Error(`${label}.case_reason is invalid`);
		}
		if (
			["candidate", "reviewed"].includes(receipt.case_signal) &&
			["unknown", "routine"].includes(receipt.case_reason)
		) {
			throw new Error(`${label}.case_signal requires a high-signal reason`);
		}
		assertString(receipt.summary, `${label}.summary`, { nullable: true });
		assertStringArray(receipt.evidence_handles, `${label}.evidence_handles`);
		if (
			receipt.evidence_handles.some((handle) => handle.trim().length === 0) ||
			new Set(receipt.evidence_handles).size !== receipt.evidence_handles.length
		) {
			throw new Error(`${label}.evidence_handles must be non-empty and unique`);
		}
		if (receipt.visibility !== "private") {
			throw new Error(`${label}.visibility must be private`);
		}
		assertTimestamp(receipt.created_at, `${label}.created_at`);
		assertTimestamp(receipt.updated_at, `${label}.updated_at`);
		if (Date.parse(receipt.created_at) > Date.parse(receipt.updated_at)) {
			throw new Error(`${label}.created_at must not follow updated_at`);
		}
		assertReceiptSemantics(receipt, label);
	}
	return value;
}

function emptyAggregate(skill, agent) {
	return {
		skill,
		agent,
		receipt_count: 0,
		invocation_count: 0,
		outcomes: {},
		digest_statuses: {},
	};
}

function increment(record, key, amount = 1) {
	record[key] = (record[key] ?? 0) + amount;
}

function isCandidate(receipt) {
	return (
		receipt.case_signal === "candidate" ||
		receipt.case_signal === "reviewed" ||
		["failed", "interrupted", "corrected"].includes(receipt.outcome) ||
		["novel-transfer", "maintainer-feedback"].includes(receipt.case_reason)
	);
}

export function compileUsageReceipts(value, registeredSkills) {
	const input = validateUsageReceiptExport(value);
	const registry = new Set(registeredSkills);
	const aggregates = new Map();
	const candidates = [];
	let excludedUnregistered = 0;
	let pendingUnknown = 0;

	for (const receipt of input.receipts) {
		if (!registry.has(receipt.skill_name)) {
			excludedUnregistered++;
			continue;
		}
		const key = `${receipt.skill_name}\u0000${receipt.agent}`;
		const aggregate =
			aggregates.get(key) ?? emptyAggregate(receipt.skill_name, receipt.agent);
		aggregate.receipt_count++;
		aggregate.invocation_count += receipt.invocation_count;
		increment(aggregate.outcomes, receipt.outcome);
		increment(aggregate.digest_statuses, receipt.digest_status);
		aggregates.set(key, aggregate);

		if (receipt.outcome === "unknown") pendingUnknown++;
		if (!isCandidate(receipt) || receipt.outcome === "unknown") continue;
		candidates.push({
			candidate_id: `usage.${receipt.receipt_id}`,
			skill: receipt.skill_name,
			agent: receipt.agent,
			observed_at: receipt.last_seen_at,
			outcome: receipt.outcome,
			outcome_confidence: receipt.outcome_confidence,
			case_reason: receipt.case_reason,
			procedure_digest: receipt.procedure_digest,
			digest_status: receipt.digest_status,
			evidence: `private:skillkit:${receipt.receipt_id}`,
			requires_human_review: true,
			canonical_case_created: false,
		});
	}

	return {
		schema_version: 1,
		kind: "usage-receipt-compilation",
		telemetry_is_evidence: false,
		aggregates: [...aggregates.values()].sort((left, right) =>
			`${left.skill}:${left.agent}`.localeCompare(`${right.skill}:${right.agent}`),
		),
		candidates: candidates.sort((left, right) =>
			left.candidate_id.localeCompare(right.candidate_id),
		),
		excluded: {
			unregistered_receipts: excludedUnregistered,
			unknown_outcome_receipts: pendingUnknown,
		},
		promotion: {
			automatic_case_creation: false,
			automatic_knowledge_change: false,
			automatic_procedure_change: false,
			human_review_required: true,
		},
	};
}
