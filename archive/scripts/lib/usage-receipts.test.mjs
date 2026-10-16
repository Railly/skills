import { describe, expect, test } from "bun:test";
import {
	compileUsageReceipts,
	validateUsageReceiptExport,
} from "./usage-receipts.mjs";

function receipt(overrides = {}) {
	return {
		receipt_id: "ur_1234567890abcdef12345678",
		skill_name: "review-gate",
		agent: "codex",
		session_id: "codex:session-1",
		project: "/private/project",
		first_seen_at: "2026-08-29T10:00:00Z",
		last_seen_at: "2026-08-29T10:05:00Z",
		invocation_count: 2,
		source_invocation_ids: ["event:e1", "event:e2"],
		procedure_path: "/private/SKILL.md",
		procedure_digest: `sha256:${"a".repeat(64)}`,
		digest_status: "observed-after-session",
		outcome: "corrected",
		outcome_confidence: 0.9,
		case_signal: "candidate",
		case_reason: "correction",
		summary: "Private summary",
		evidence_handles: ["session:private"],
		visibility: "private",
		created_at: "2026-08-29T10:06:00Z",
		updated_at: "2026-08-29T10:07:00Z",
		...overrides,
	};
}

function exported(receipts) {
	return {
		schema_version: 1,
		visibility: "private",
		created_receipts: receipts.length,
		receipts,
		next_cursor: null,
	};
}

describe("usage receipt compiler", () => {
	test("compiles safe candidates without copying private context", () => {
		const result = compileUsageReceipts(exported([receipt()]), ["review-gate"]);
		expect(result.candidates).toHaveLength(1);
		expect(result.candidates[0]?.evidence).toBe(
			"private:skillkit:ur_1234567890abcdef12345678",
		);
		const serialized = JSON.stringify(result);
		expect(serialized).not.toContain("/private/");
		expect(serialized).not.toContain("Private summary");
		expect(serialized).not.toContain("codex:session-1");
	});

	test("keeps routine counts separate from evidence", () => {
		const routine = receipt({
			outcome: "succeeded",
			case_signal: "routine",
			case_reason: "routine",
		});
		const result = compileUsageReceipts(exported([routine]), ["review-gate"]);
		expect(result.aggregates[0]?.receipt_count).toBe(1);
		expect(result.aggregates[0]?.invocation_count).toBe(2);
		expect(result.candidates).toEqual([]);
		expect(result.telemetry_is_evidence).toBe(false);
	});

	test("does not nominate unknown outcomes", () => {
		const result = compileUsageReceipts(
			exported([
				receipt({
					outcome: "unknown",
					outcome_confidence: null,
					case_signal: "unreviewed",
					case_reason: "unknown",
					summary: null,
					evidence_handles: [],
				}),
			]),
			["review-gate"],
		);
		expect(result.candidates).toEqual([]);
		expect(result.excluded.unknown_outcome_receipts).toBe(1);
	});

	test("nominates observable failures and explicit transfer signals", () => {
		const failure = receipt({
			receipt_id: "ur_aaaaaaaaaaaaaaaaaaaaaaaa",
			outcome: "failed",
			case_signal: "unreviewed",
			case_reason: "failure",
		});
		const transfer = receipt({
			receipt_id: "ur_bbbbbbbbbbbbbbbbbbbbbbbb",
			outcome: "succeeded",
			case_signal: "candidate",
			case_reason: "novel-transfer",
		});
		const result = compileUsageReceipts(exported([failure, transfer]), [
			"review-gate",
		]);
		expect(result.candidates).toHaveLength(2);
		expect(result.candidates.map((candidate) => candidate.case_reason)).toEqual([
			"failure",
			"novel-transfer",
		]);
	});

	test("excludes skills outside the Railly registry", () => {
		const result = compileUsageReceipts(
			exported([receipt({ skill_name: "private-skill" })]),
			["review-gate"],
		);
		expect(result.aggregates).toEqual([]);
		expect(result.excluded.unregistered_receipts).toBe(1);
	});

	test("fails closed on schema drift and unsafe visibility", () => {
		expect(() =>
			validateUsageReceiptExport({
				...exported([receipt()]),
				private_transcript: "secret",
			}),
		).toThrow('unknown field "private_transcript"');
		expect(() =>
			validateUsageReceiptExport(
				exported([receipt({ visibility: "public" })]),
			),
		).toThrow("visibility must be private");
	});

	test("fails closed on malformed identity, time, and semantic combinations", () => {
		expect(() =>
			validateUsageReceiptExport(
				exported([receipt({ last_seen_at: "not-a-date" })]),
			),
		).toThrow("must be an ISO 8601 UTC timestamp");
		expect(() =>
			validateUsageReceiptExport(
				exported([receipt({ last_seen_at: "2026-02-31T10:00:00Z" })]),
			),
		).toThrow("must be an ISO 8601 UTC timestamp");
		expect(() =>
			validateUsageReceiptExport(
				exported([receipt({ source_invocation_ids: [] })]),
			),
		).toThrow("count-consistent");
		expect(() =>
			validateUsageReceiptExport(
				exported([
					receipt({
						outcome: "succeeded",
						case_reason: "failure",
					}),
				]),
			),
		).toThrow("failure reason requires failed outcome");
		expect(() =>
			validateUsageReceiptExport(
				exported([
					receipt({
						summary: null,
						evidence_handles: [],
					}),
				]),
			),
		).toThrow("requires a private summary");
	});
});
