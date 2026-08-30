import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	buildProposalPacket,
	fileDigest,
	parseImpactLedger,
	recordImpact,
	sha256,
	validateImpactLedger,
} from "./knowledge-impact.mjs";

const temporary = [];

afterEach(() => {
	for (const path of temporary.splice(0)) rmSync(path, { recursive: true });
});

function fixture() {
	const repository = mkdtempSync(join(tmpdir(), "railly-impact-"));
	temporary.push(repository);
	mkdirSync(join(repository, "skills", "alpha"), { recursive: true });
	mkdirSync(join(repository, "foundry", "knowledge"), { recursive: true });
	mkdirSync(join(repository, "foundry", "runs", "proposal-impact", "demo"), {
		recursive: true,
	});
	writeFileSync(join(repository, "skills", "alpha", "SKILL.md"), "# Alpha\n");
	writeFileSync(
		join(
			repository,
			"foundry",
			"runs",
			"proposal-impact",
			"demo",
			"candidate.patch",
		),
		"candidate one\n",
	);
	writeFileSync(
		join(repository, "foundry", "runs", "proposal-impact", "demo", "eval.json"),
		"{}\n",
	);
	writeFileSync(
		join(
			repository,
			"foundry",
			"runs",
			"proposal-impact",
			"demo",
			"decision.md",
		),
		"# Decision\n",
	);
	execFileSync("git", ["init", "-q"], { cwd: repository });
	execFileSync("git", ["add", "."], { cwd: repository });
	const registry = {
		alpha: { channel: "stable", maturity: "dogfooded", summary: "Alpha" },
	};
	const patterns = [
		{
			id: "pattern.drive-surface",
			title: "Drive surface",
			status: "active",
			summary: "Drive the real surface.",
			source: "foundry/knowledge/patterns/drive-surface.md",
			evidence: [],
		},
	];
	const activeDigest = fileDigest(
		join(repository, "skills", "alpha", "SKILL.md"),
	);
	const impact = {
		schema_version: 1,
		kind: "skill-impact",
		id: "impact.alpha.first-candidate",
		skill: "alpha",
		summary: "Reject a candidate that does not beat the released procedure.",
		sources: {
			patterns: ["pattern.drive-surface"],
			no_action_reason: null,
		},
		candidate: {
			path: "foundry/runs/proposal-impact/demo/candidate.patch",
			digest: fileDigest(
				join(
					repository,
					"foundry",
					"runs",
					"proposal-impact",
					"demo",
					"candidate.patch",
				),
			),
		},
		evaluation: {
			path: "foundry/runs/proposal-impact/demo/eval.json",
			result: "fail",
			variants: ["no-skill", "released-skill", "candidate-skill"],
			summary: "Candidate did not improve the target behavior.",
		},
		decision: {
			outcome: "rejected",
			authority: "deterministic-gate",
			path: "foundry/runs/proposal-impact/demo/decision.md",
			rationale: "The promotion threshold was not met.",
		},
		active_skill: {
			path: "skills/alpha/SKILL.md",
			before_digest: activeDigest,
			after_digest: activeDigest,
		},
		supersedes: [],
	};
	return { repository, registry, patterns, impact, activeDigest };
}

describe("impact ledger", () => {
	test("parses JSONL and rejects malformed lines with location", () => {
		expect(parseImpactLedger('{"id":"one"}\n\n{"id":"two"}\n')).toEqual([
			{ id: "one" },
			{ id: "two" },
		]);
		expect(() => parseImpactLedger("{}\n{broken}\n", "ledger.jsonl")).toThrow(
			"ledger.jsonl:2: malformed impact JSON",
		);
	});

	test("accepts one rejected atomic candidate with complete variants", () => {
		const { repository, registry, patterns, impact } = fixture();
		const validation = validateImpactLedger(repository, [impact], {
			registry,
			patterns,
		});
		expect(validation.errors).toEqual([]);
	});

	test("requires valid sources, unique identities, and a complete eval matrix", () => {
		const { repository, registry, patterns, impact } = fixture();
		const duplicate = structuredClone(impact);
		duplicate.evaluation.variants = ["candidate-skill"];
		const validation = validateImpactLedger(repository, [impact, duplicate], {
			registry,
			patterns,
		});
		const errors = validation.errors.join("\n");
		expect(errors).toContain("duplicate impact id");
		expect(errors).toContain("duplicate candidate diff identity");
		expect(errors).toContain("missing no-skill variant");
		expect(errors).toContain("missing released-skill variant");
		impact.evaluation.variants = { candidate: true };
		expect(
			validateImpactLedger(repository, [impact], {
				registry,
				patterns,
			}).errors.join("\n"),
		).toContain("evaluation.variants must be an array");
		impact.sources.patterns = ["pattern.missing"];
		expect(
			validateImpactLedger(repository, [impact], {
				registry,
				patterns,
			}).errors.join("\n"),
		).toContain('unknown source pattern "pattern.missing"');
	});

	test("gates accepted outcomes on human authority and passing evidence", () => {
		const { repository, registry, patterns, impact, activeDigest } = fixture();
		impact.decision.outcome = "accepted";
		const errors = validateImpactLedger(repository, [impact], {
			registry,
			patterns,
		}).errors.join("\n");
		expect(errors).toContain("accepted impact requires human authority");
		expect(errors).toContain("accepted impact requires a passing evaluation");
		expect(errors).toContain(
			"accepted impact must change the active skill digest",
		);
		impact.decision.authority = "human";
		impact.evaluation.result = "pass";
		impact.active_skill.before_digest = sha256("previous skill\n");
		impact.active_skill.after_digest = activeDigest;
		expect(
			validateImpactLedger(repository, [impact], { registry, patterns }).errors,
		).toEqual([]);
	});

	test("keeps rejection and no-change outcomes byte-identical", () => {
		const { repository, registry, patterns, impact } = fixture();
		impact.active_skill.after_digest = sha256("changed skill\n");
		expect(
			validateImpactLedger(repository, [impact], {
				registry,
				patterns,
			}).errors.join("\n"),
		).toContain("rejected cannot change the active skill digest");
		impact.decision.outcome = "no-change";
		impact.candidate = null;
		impact.sources.patterns = [];
		impact.sources.no_action_reason =
			"Evidence does not support a procedure change.";
		impact.active_skill.after_digest = impact.active_skill.before_digest;
		expect(
			validateImpactLedger(repository, [impact], { registry, patterns }).errors,
		).toEqual([]);
	});

	test("verifies candidate bytes and the latest active skill state", () => {
		const { repository, registry, patterns, impact } = fixture();
		impact.candidate.digest = sha256("different bytes\n");
		let errors = validateImpactLedger(repository, [impact], {
			registry,
			patterns,
		}).errors.join("\n");
		expect(errors).toContain("candidate digest does not match its artifact");
		impact.candidate.digest = fileDigest(
			join(
				repository,
				"foundry",
				"runs",
				"proposal-impact",
				"demo",
				"candidate.patch",
			),
		);
		impact.active_skill.after_digest = sha256("stale active\n");
		impact.active_skill.before_digest = impact.active_skill.after_digest;
		errors = validateImpactLedger(repository, [impact], {
			registry,
			patterns,
		}).errors.join("\n");
		expect(errors).toContain("does not match the active skill digest");
	});

	test("rejects untracked proposal artifacts", () => {
		const { repository, registry, patterns, impact } = fixture();
		const path = join(
			repository,
			"foundry",
			"runs",
			"proposal-impact",
			"demo",
			"untracked.patch",
		);
		writeFileSync(path, "untracked candidate\n");
		impact.candidate.path = "foundry/runs/proposal-impact/demo/untracked.patch";
		impact.candidate.digest = fileDigest(path);
		expect(
			validateImpactLedger(repository, [impact], {
				registry,
				patterns,
			}).errors.join("\n"),
		).toContain("must reference a tracked repository file");
	});

	test("builds one bounded packet with relevant history and retrieval handles", () => {
		const { repository, registry, patterns, impact, activeDigest } = fixture();
		const unrelatedImpact = {
			...structuredClone(impact),
			id: "impact.beta.unrelated",
			skill: "beta",
		};
		const knowledge = {
			maturity: { skills: registry },
			patterns,
			skills: [
				{
					skill: "alpha",
					source: "foundry/knowledge/skills/alpha.md",
					summary: "Alpha provenance.",
					patterns: ["pattern.drive-surface"],
					evidence: [
						{
							path: "cases/alpha.md",
							relationship: "application",
							visibility: "public",
							status: "active",
						},
					],
					decisions: [],
					gaps: [],
				},
			],
			impacts: [impact, unrelatedImpact],
			audit: {
				records: [
					{
						skill: "alpha",
						classification: "application",
						supports_application: true,
					},
					{
						skill: "beta",
						classification: "reference",
						supports_application: false,
					},
				],
			},
		};
		const packet = buildProposalPacket(repository, knowledge, "alpha");
		expect(packet.skill).toBe("alpha");
		expect(packet.active_skill.digest).toBe(activeDigest);
		expect(packet.patterns.map((pattern) => pattern.id)).toEqual([
			"pattern.drive-surface",
		]);
		expect(packet.impact_history.map((entry) => entry.id)).toEqual([
			"impact.alpha.first-candidate",
		]);
		expect(packet.catalog_outcomes).toEqual({
			reviewed_matches: 1,
			verdicts: { application: 1 },
		});
		expect(packet.source_evidence).toEqual([
			{
				path: "cases/alpha.md",
				relationship: "application",
				visibility: "public",
				status: "active",
			},
		]);
	});

	test("appends once, retries idempotently, and rejects identity conflicts", () => {
		const { repository, registry, patterns, impact } = fixture();
		const knowledge = {
			maturity: { skills: registry },
			patterns,
			impacts: [],
		};
		const first = recordImpact(repository, knowledge, impact);
		expect(first.appended).toBe(true);
		const ledger = join(repository, "foundry", "knowledge", "impact.jsonl");
		const firstBytes = readFileSync(ledger, "utf8");
		const retry = recordImpact(
			repository,
			{ ...knowledge, impacts: first.impacts },
			{
				...impact,
				evaluation: {
					...impact.evaluation,
					variants: [...impact.evaluation.variants].reverse(),
				},
				sources: {
					no_action_reason: impact.sources.no_action_reason,
					patterns: [...impact.sources.patterns].reverse(),
				},
			},
		);
		expect(retry.appended).toBe(false);
		expect(readFileSync(ledger, "utf8")).toBe(firstBytes);
		const conflict = { ...impact, summary: "Different meaning." };
		expect(() =>
			recordImpact(
				repository,
				{ ...knowledge, impacts: first.impacts },
				conflict,
			),
		).toThrow("duplicate impact id");
		writeFileSync(
			join(repository, "skills", "alpha", "SKILL.md"),
			"# Drifted\n",
		);
		expect(() =>
			recordImpact(
				repository,
				{ ...knowledge, impacts: first.impacts },
				impact,
			),
		).toThrow("does not match the active skill digest");
	});
});
