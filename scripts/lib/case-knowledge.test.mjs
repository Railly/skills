import { describe, expect, test } from "bun:test";
import { validateCaseKnowledge } from "./case-knowledge.mjs";

const path = "cases/skills/example.md";
const pattern = {
	id: "pattern.drive-the-surface",
	status: "active",
	evidence: [{ path, relationship: "application", status: "active" }],
};

function validate(fields, options = {}) {
	return validateCaseKnowledge({
		path,
		text: fields,
		patterns: options.patterns ?? [pattern],
		gaps: options.gaps ?? ["gap.record-a-case.missing-proof"],
	}).errors;
}

describe("case knowledge disposition", () => {
	test("keeps legacy cases valid without inventing a disposition", () => {
		expect(validate("# Legacy case")).toEqual([]);
		expect(
			validate(
				"# Missing schema\nKnowledge disposition: bogus\nKnowledge target: ../../secret",
			),
		).toContain(`${path}: knowledge fields require Case schema 2`);
	});

	test("requires exactly one disposition and typed target for schema 2", () => {
		expect(validate("Case schema: 2")).toContain(
			`${path}: Knowledge disposition must appear exactly once`,
		);
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: gap\nKnowledge disposition: no-change\nKnowledge target: none",
			),
		).toContain(`${path}: Knowledge disposition must appear exactly once`);
	});

	test("links an existing pattern back to the case", () => {
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: link-existing\nKnowledge target: pattern.drive-the-surface",
			),
		).toEqual([]);
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: link-existing\nKnowledge target: pattern.missing",
			),
		).toContain(`${path}: link-existing requires an existing pattern ID`);
		for (const relationship of ["contradiction", "rejection"]) {
			expect(
				validate(
					"Case schema: 2\nKnowledge disposition: link-existing\nKnowledge target: pattern.drive-the-surface",
					{
						patterns: [
							{
								...pattern,
								evidence: [{ path, relationship, status: "active" }],
							},
						],
					},
				),
			).toContain(
				`${path}: target pattern must link back with active supportive evidence`,
			);
		}
	});

	test("requires candidate status and source evidence when creating a pattern", () => {
		const fields =
			"Case schema: 2\nKnowledge disposition: create-candidate\nKnowledge target: pattern.drive-the-surface";
		expect(validate(fields)).toContain(
			`${path}: create-candidate target must have candidate status`,
		);
		expect(
			validate(fields, {
				patterns: [
					{
						...pattern,
						status: "candidate",
						evidence: [{ path, relationship: "origin", status: "active" }],
					},
				],
			}),
		).toEqual([]);
		expect(
			validate(fields, {
				patterns: [{ ...pattern, status: "candidate", evidence: [] }],
			}),
		).toContain(
			`${path}: target pattern must link back with active supportive evidence`,
		);
		expect(
			validate(fields, {
				patterns: [
					{
						...pattern,
						status: "candidate",
						evidence: [
							{ path, relationship: "contradiction", status: "active" },
						],
					},
				],
			}),
		).toContain(
			`${path}: target pattern must link back with active supportive evidence`,
		);
	});

	test("requires an existing gap ID or an explicit no-change target", () => {
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: gap\nKnowledge target: gap.record-a-case.missing-proof",
			),
		).toEqual([]);
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: gap\nKnowledge target: gap.unknown",
			),
		).toContain(`${path}: gap requires an existing knowledge gap ID`);
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: no-change\nKnowledge target: none",
			),
		).toEqual([]);
		expect(
			validate(
				"Case schema: 2\nKnowledge disposition: no-change\nKnowledge target: pattern.drive-the-surface",
			),
		).toContain(`${path}: no-change requires Knowledge target "none"`);
	});
});
