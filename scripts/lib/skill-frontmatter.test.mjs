import { describe, expect, test } from "bun:test";
import { parseSkillFrontmatter } from "./skill-frontmatter.mjs";

describe("parseSkillFrontmatter", () => {
	test("accepts a quoted scalar containing a colon", () => {
		const result = parseSkillFrontmatter(`---
name: example
description: "Use this skill: it validates YAML."
---
`);

		expect(result?.name).toBe("example");
	});

	test("rejects an unquoted scalar containing a colon followed by whitespace", () => {
		const result = parseSkillFrontmatter(`---
name: example
compatibility: Requires a command: install it first.
---
`);

		expect(result).toBeNull();
	});
});
