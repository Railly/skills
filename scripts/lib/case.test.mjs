import { describe, expect, test } from "bun:test";
import { validateCase } from "./case.mjs";

const path = "cases/example/1-thing.md";
const base = [
	"Status: closed",
	"Validation: independently-validated",
	"Human review: pending",
	"Delivery: merged",
	"Visibility: public",
	"Repository: owner/repo",
	"Source: https://github.com/owner/repo/pull/1",
].join("\n");
const run = (extra) => validateCase({ path, text: `${base}\n${extra}` });

describe("case", () => {
	test("accepts a check or a reasoned none", () => {
		expect(run("Enforcer: check: .agents/verify/drive/login-wall.sh")).toEqual([]);
		expect(run("Enforcer: none: lesson is about judgment, no observable signal")).toEqual([]);
	});

	test("requires the enforcer", () => {
		expect(run("")).toContain(`${path}: missing case field "Enforcer"`);
		expect(run("Enforcer: later")).toContain(
			`${path}: Enforcer must be "check: <path or command>" or "none: <reason>"`,
		);
		expect(run("Enforcer: none: n/a")).toContain(
			`${path}: Enforcer must be "check: <path or command>" or "none: <reason>"`,
		);
		expect(run("Enforcer: check: a\nEnforcer: check: b")).toContain(
			`${path}: Enforcer must appear exactly once`,
		);
	});

	test("rejects private material and non-public cases", () => {
		expect(run("Enforcer: check: x\nSee /Users/someone/notes.md")).toContain(
			`${path}: contains local or private-case material`,
		);
		expect(
			validateCase({ path, text: `${base.replace("public", "approved-private")}\nEnforcer: check: x` }),
		).toContain(`${path}: published cases must have public visibility`);
	});
});
