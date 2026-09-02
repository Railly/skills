#!/usr/bin/env bun
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = join(import.meta.dir, "upsert-github-section.mjs");

function run(body, section) {
	const root = mkdtempSync(join(tmpdir(), "before-after-github-test-"));
	const bodyPath = join(root, "body.md");
	const sectionPath = join(root, "section.md");
	const outputPath = join(root, "output.md");
	writeFileSync(bodyPath, body);
	writeFileSync(sectionPath, section);
	const result = Bun.spawnSync({
		cmd: [
			"bun",
			script,
			"--body",
			bodyPath,
			"--section",
			sectionPath,
			"--out",
			outputPath,
		],
		stdout: "pipe",
		stderr: "pipe",
	});
	return {
		result,
		output: result.exitCode === 0 ? readFileSync(outputPath, "utf8") : "",
	};
}

describe("GitHub before-after section upsert", () => {
	test("appends one bounded section and preserves the existing body", () => {
		const { result, output } = run(
			"# Summary\n\nExisting details.\n",
			"## Before / after\n\nVisual proof.",
		);
		expect(result.exitCode).toBe(0);
		expect(output).toBe(
			"# Summary\n\nExisting details.\n\n<!-- before-after:start -->\n## Before / after\n\nVisual proof.\n<!-- before-after:end -->\n",
		);
	});

	test("replaces only the existing bounded section", () => {
		const { result, output } = run(
			"# Summary\n\nBefore.\n\n<!-- before-after:start -->\nOld proof.\n<!-- before-after:end -->\n\n## Testing\n\nAfter.\n",
			"## Before / after\n\nNew proof.",
		);
		expect(result.exitCode).toBe(0);
		expect(output).toContain("# Summary\n\nBefore.");
		expect(output).toContain("## Before / after\n\nNew proof.");
		expect(output).toContain("## Testing\n\nAfter.");
		expect(output).not.toContain("Old proof.");
		expect(output.match(/<!-- before-after:start -->/g)).toHaveLength(1);
	});

	test("rejects incomplete marker pairs", () => {
		const { result } = run(
			"# Summary\n\n<!-- before-after:start -->\nOld proof.",
			"New proof.",
		);
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr.toString()).toContain("incomplete");
	});
});
