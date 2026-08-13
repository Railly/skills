import { describe, expect, test } from "bun:test";
import { markdownLinkTargets } from "./markdown-links.mjs";

describe("markdownLinkTargets", () => {
	test("returns normal Markdown links", () => {
		expect(markdownLinkTargets("[Guide](docs/guide.md)")).toEqual([
			"docs/guide.md",
		]);
	});

	test("ignores JavaScript calls that resemble Markdown links", () => {
		expect(
			markdownLinkTargets(
				"`dispatch()` calls `SIGNERS[sub.format](body, sub.secret)` once.",
			),
		).toEqual([]);
	});

	test("ignores links inside fenced code", () => {
		expect(
			markdownLinkTargets("```js\nSIGNERS[sub.format](body)\n```\n"),
		).toEqual([]);
	});

	test("keeps links beside inline code", () => {
		expect(
			markdownLinkTargets(
				"Read `handler[value](arg)` in [the guide](guide.md).",
			),
		).toEqual(["guide.md"]);
	});

	test("supports longer code-span delimiters", () => {
		expect(markdownLinkTargets("``code with `tick` and [call](arg)``")).toEqual(
			[],
		);
	});
});
