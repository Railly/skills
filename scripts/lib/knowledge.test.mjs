import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	compileKnowledge,
	loadKnowledge,
	parseKnowledgeMetadata,
	renderKnowledge,
	validateKnowledge,
} from "./knowledge.mjs";

const temporary = [];

afterEach(() => {
	for (const path of temporary.splice(0)) rmSync(path, { recursive: true });
});

function fixture() {
	const repository = mkdtempSync(join(tmpdir(), "railly-knowledge-"));
	temporary.push(repository);
	mkdirSync(join(repository, "foundry", "knowledge", "patterns"), {
		recursive: true,
	});
	mkdirSync(join(repository, "foundry", "knowledge", "skills"), {
		recursive: true,
	});
	mkdirSync(join(repository, "cases"), { recursive: true });
	mkdirSync(join(repository, "foundry", "rounds", "001"), { recursive: true });
	writeFileSync(join(repository, "cases", "one.md"), "# Case\n");
	writeFileSync(
		join(repository, "foundry", "rounds", "001", "README.md"),
		"# Round\n",
	);
	writeFileSync(
		join(repository, "foundry", "maturity.json"),
		JSON.stringify({
			schema_version: 1,
			skills: {
				alpha: {
					channel: "stable",
					maturity: "dogfooded",
					summary: "Alpha skill",
				},
			},
		}),
	);
	writeFileSync(
		join(repository, "foundry", "knowledge", "patterns", "drive-surface.md"),
		`# Pattern\n\n## Metadata\n\n\`\`\`json\n${JSON.stringify(
			{
				schema_version: 1,
				kind: "pattern",
				id: "pattern.drive-surface",
				title: "Drive the surface",
				status: "active",
				summary: "Drive the artifact users receive.",
				evidence: [
					{
						path: "cases/one.md",
						relationship: "origin",
						visibility: "public",
						status: "active",
					},
				],
				skills: [
					{ name: "alpha", relationship: "motivates", status: "active" },
				],
				supersedes: [],
			},
			null,
			2,
		)}\n\`\`\`\n`,
	);
	writeFileSync(
		join(repository, "foundry", "knowledge", "skills", "alpha.md"),
		`# Skill\n\n## Metadata\n\n\`\`\`json\n${JSON.stringify(
			{
				schema_version: 1,
				kind: "skill",
				skill: "alpha",
				summary: "Evidence for alpha.",
				patterns: ["pattern.drive-surface"],
				evidence: [
					{
						path: "cases/one.md",
						relationship: "application",
						visibility: "public",
						status: "active",
					},
				],
				decisions: ["foundry/rounds/001/README.md"],
				gaps: [],
			},
			null,
			2,
		)}\n\`\`\`\n`,
	);
	return repository;
}

describe("knowledge metadata", () => {
	test("parses the JSON block", () => {
		const metadata = parseKnowledgeMetadata(
			'# Page\n\n## Metadata\n\n```json\n{"schema_version":1}\n```\n',
		);
		expect(metadata.schema_version).toBe(1);
	});

	test("rejects malformed JSON", () => {
		expect(() =>
			parseKnowledgeMetadata(
				"# Page\n\n## Metadata\n\n```json\n{broken}\n```\n",
			),
		).toThrow("malformed metadata JSON");
	});
});

describe("knowledge compiler", () => {
	test("validates and renders deterministic projections", () => {
		const repository = fixture();
		const knowledge = loadKnowledge(repository);
		const validation = validateKnowledge(repository, knowledge, {
			enforceMaturity: true,
		});
		expect(validation.errors).toEqual([]);
		const first = renderKnowledge(compileKnowledge(knowledge));
		const second = renderKnowledge(compileKnowledge(knowledge));
		expect(first).toEqual(second);
		expect(first["foundry/knowledge/coverage.md"]).toContain(
			"| alpha | stable | dogfooded | supported | 1 | 0 | 1 | 0 |",
		);
	});

	test("fails red when public evidence is missing", () => {
		const repository = fixture();
		const knowledge = loadKnowledge(repository);
		knowledge.patterns[0].evidence[0].path = "cases/missing.md";
		const validation = validateKnowledge(repository, knowledge);
		expect(validation.errors.join("\n")).toContain(
			'references missing path "cases/missing.md"',
		);
	});

	test("fails red on duplicate IDs and unknown relationships", () => {
		const repository = fixture();
		const knowledge = loadKnowledge(repository);
		knowledge.patterns.push({ ...knowledge.patterns[0] });
		knowledge.patterns[0].skills[0].relationship = "mentions";
		const validation = validateKnowledge(repository, knowledge);
		expect(validation.errors.join("\n")).toContain("duplicate pattern id");
		expect(validation.errors.join("\n")).toContain(
			'invalid skill relationship "mentions"',
		);
	});

	test("fails red when private evidence exposes a local path", () => {
		const repository = fixture();
		const knowledge = loadKnowledge(repository);
		knowledge.patterns[0].evidence[0] = {
			path: "private:/Users/person/secret.md",
			relationship: "origin",
			visibility: "approved-private",
			status: "active",
		};
		const validation = validateKnowledge(repository, knowledge);
		expect(validation.errors.join("\n")).toContain("exposes a local path");
	});

	test("fails red when a registered skill has no provenance page", () => {
		const repository = fixture();
		const knowledge = loadKnowledge(repository);
		knowledge.maturity.skills.beta = {
			channel: "experimental",
			maturity: "experimental",
			summary: "Beta skill",
		};
		const validation = validateKnowledge(repository, knowledge);
		expect(validation.errors.join("\n")).toContain(
			'missing provenance page for "beta"',
		);
	});

	test("can enforce maturity support after the audit", () => {
		const repository = fixture();
		const knowledge = loadKnowledge(repository);
		knowledge.skills[0].evidence[0].relationship = "origin";
		const advisory = validateKnowledge(repository, knowledge);
		expect(advisory.errors).toEqual([]);
		expect(advisory.warnings).toHaveLength(1);
		const enforced = validateKnowledge(repository, knowledge, {
			enforceMaturity: true,
		});
		expect(enforced.errors.join("\n")).toContain(
			"dogfooded maturity has no application evidence",
		);
	});
});
