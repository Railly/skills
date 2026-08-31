#!/usr/bin/env bun
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = join(import.meta.dir, "create.mjs");
const css = "body{font-family:system-ui}";

function png(width, height) {
	const bytes = Buffer.alloc(33);
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
	bytes.writeUInt32BE(13, 8);
	bytes.write("IHDR", 12, "ascii");
	bytes.writeUInt32BE(width, 16);
	bytes.writeUInt32BE(height, 20);
	return bytes;
}

function run({ before = png(752, 72), after = png(752, 72), extra = [] } = {}) {
	const root = mkdtempSync(join(tmpdir(), "before-after-test-"));
	const beforePath = join(root, "before.png");
	const afterPath = join(root, "after.png");
	const output = join(root, "proof.html");
	writeFileSync(beforePath, before);
	writeFileSync(afterPath, after);

	return {
		root,
		output,
		result: Bun.spawnSync({
			cmd: [
				"bun",
				script,
				"--out",
				output,
				"--before",
				beforePath,
				"--after",
				afterPath,
				"--title",
				"<Visible change>",
				"--subject",
				"Factory row",
				"--summary",
				"Dot becomes collecting history.",
				"--baseline",
				"commit 60330e0",
				"--changed",
				"local diff",
				"--url",
				"http://localhost:3000/",
				"--selector",
				'div[data-row="repo"]',
				"--foundation-css",
				css,
				...extra,
			],
			stdout: "pipe",
			stderr: "pipe",
		}),
	};
}

describe("before-after report generator", () => {
	test("writes escaped HTML, copied captures, and a manifest", () => {
		const { output, result } = run();
		expect(result.exitCode).toBe(0);
		const html = readFileSync(output, "utf8");
		const manifest = JSON.parse(
			readFileSync(output.replace(/\.html$/, ".json"), "utf8"),
		);

		expect(html).toContain("&lt;Visible change&gt;");
		expect(html).toContain('width="752" height="72"');
		expect(html).not.toMatch(/__[A-Z_]+__/);
		expect(manifest.dimensionsMatch).toBe(true);
		expect(manifest.selector).toBe('div[data-row="repo"]');
		expect(manifest.captures.before).toEqual({
			path: "proof.assets/before.png",
			width: 752,
			height: 72,
		});
	});

	test("rejects invalid PNG input", () => {
		const { result } = run({ before: Buffer.from("not a png") });
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr.toString()).toContain("Invalid PNG file");
	});

	test("rejects mismatched dimensions by default", () => {
		const { result } = run({ after: png(760, 72) });
		expect(result.exitCode).not.toBe(0);
		expect(result.stderr.toString()).toContain("Capture dimensions differ");
	});

	test("allows an intentional size change when explicitly declared", () => {
		const { output, result } = run({
			after: png(760, 72),
			extra: ["--allow-size-change", "true"],
		});
		expect(result.exitCode).toBe(0);
		const manifest = JSON.parse(
			readFileSync(output.replace(/\.html$/, ".json"), "utf8"),
		);
		expect(manifest.dimensionsMatch).toBe(false);
		expect(manifest.sizeChangeAllowed).toBe(true);
	});
});
