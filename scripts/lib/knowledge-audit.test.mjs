import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	buildDraftAudit,
	discoverTextualMatches,
	validateKnowledgeAuditAlignment,
	validateTextualMatchAudit,
} from "./knowledge-audit.mjs";

const temporary = [];

afterEach(() => {
	for (const path of temporary.splice(0)) rmSync(path, { recursive: true });
});

function fixture() {
	const repository = mkdtempSync(join(tmpdir(), "railly-audit-"));
	temporary.push(repository);
	mkdirSync(join(repository, "cases"), { recursive: true });
	mkdirSync(join(repository, "foundry", "runs", "alpha"), { recursive: true });
	mkdirSync(join(repository, "foundry", "rounds"), { recursive: true });
	writeFileSync(
		join(repository, "cases", "one.md"),
		"alpha ran here\nalphabet is not a token\n",
	);
	writeFileSync(
		join(repository, "foundry", "runs", "alpha", "run.md"),
		"alpha application\n",
	);
	return repository;
}

describe("textual match audit", () => {
	test("discovers exact skill tokens and groups by file", () => {
		const repository = fixture();
		const records = discoverTextualMatches(repository, ["alpha"]);
		expect(records).toHaveLength(2);
		expect(records[0].matches).toHaveLength(1);
	});

	test("rejects draft rationales", () => {
		const repository = fixture();
		const audit = buildDraftAudit(repository, ["alpha"]);
		const validation = validateTextualMatchAudit(repository, ["alpha"], audit);
		expect(validation.errors.join("\n")).toContain("unreviewed rationale");
	});

	test("rejects a missing application verdict", () => {
		const repository = fixture();
		const audit = buildDraftAudit(repository, ["alpha"]);
		for (const record of audit.records) record.rationale = "Reviewed fixture.";
		delete audit.records[0].supports_application;
		const validation = validateTextualMatchAudit(repository, ["alpha"], audit);
		expect(validation.errors.join("\n")).toContain(
			"missing application verdict",
		);
	});

	test("rejects new and changed matches", () => {
		const repository = fixture();
		const audit = buildDraftAudit(repository, ["alpha"]);
		for (const record of audit.records) record.rationale = "Reviewed fixture.";
		writeFileSync(join(repository, "cases", "one.md"), "alpha changed here\n");
		writeFileSync(join(repository, "cases", "two.md"), "alpha new match\n");
		const validation = validateTextualMatchAudit(repository, ["alpha"], audit);
		expect(validation.errors.join("\n")).toContain("stale fingerprint");
		expect(validation.errors.join("\n")).toContain(
			"unclassified current match",
		);
	});

	test("rejects application evidence contradicted by the audit", () => {
		const repository = fixture();
		const audit = buildDraftAudit(repository, ["alpha"]);
		const record = audit.records.find((entry) => entry.path === "cases/one.md");
		record.supports_application = false;
		const knowledge = {
			skills: [
				{
					skill: "alpha",
					evidence: [{ path: "cases/one.md", relationship: "application" }],
				},
			],
		};
		const validation = validateKnowledgeAuditAlignment(knowledge, audit);
		expect(validation.errors.join("\n")).toContain(
			"linked as application evidence",
		);
	});
});
