import { describe, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFxReview } from "./run-fx-review.mjs";

function executable(path, text) {
	writeFileSync(path, text);
	chmodSync(path, 0o755);
}

describe("FX review worker", () => {
	test("reads the Gateway key from Keychain and writes a sanitized receipt", () => {
		const root = mkdtempSync(join(tmpdir(), "fx-review-"));
		const security = join(root, "security");
		const fx = join(root, "fx");
		const promptFile = join(root, "prompt.md");
		const output = join(root, "review.json");
		executable(security, "#!/bin/sh\nprintf 'test-secret\\n'\n");
		executable(
			fx,
			`#!/bin/sh
if [ "$1" = "status" ]; then
  printf '{"auth":"AI_GATEWAY_API_KEY","model":"test/reviewer"}\\n'
  exit 0
fi
if [ "$AI_GATEWAY_API_KEY" != "test-secret" ]; then
  exit 9
fi
if [ "$FX_DISABLE_KEYCHAIN" != "1" ]; then
  exit 10
fi
printf '{"final_output":"finding without key; accidental test-secret"}\\n'
`,
		);
		writeFileSync(promptFile, "Review this diff.");

		const artifact = runFxReview({
			promptFile,
			output,
			cwd: root,
			fxBin: fx,
			securityBin: security,
		});

		expect(artifact.runtime).toBe("fx_worker");
		expect(artifact.provider).toBe("vercel-ai-gateway");
		expect(artifact.credential_source).toBe("macos-keychain");
		expect(artifact.status).toBe("complete");
		expect(artifact.timed_out).toBe(false);
		expect(artifact.final_output).toContain("[REDACTED]");
		expect(readFileSync(output, "utf8")).not.toContain("test-secret");
	});

	test("refuses FX when Gateway API-key auth is not active", () => {
		const root = mkdtempSync(join(tmpdir(), "fx-review-auth-"));
		const security = join(root, "security");
		const fx = join(root, "fx");
		const promptFile = join(root, "prompt.md");
		executable(security, "#!/bin/sh\nprintf 'test-secret\\n'\n");
		executable(
			fx,
			'#!/bin/sh\nprintf \'{"auth":"missing","model":"test/reviewer"}\\n\'\n',
		);
		writeFileSync(promptFile, "Review this diff.");

		expect(() =>
			runFxReview({
				promptFile,
				output: join(root, "review.json"),
				cwd: root,
				fxBin: fx,
				securityBin: security,
			}),
		).toThrow("unsupported auth mode");
	});

	test("writes a failed receipt when FX exits with partial non-JSON output", () => {
		const root = mkdtempSync(join(tmpdir(), "fx-review-failure-"));
		const security = join(root, "security");
		const fx = join(root, "fx");
		const promptFile = join(root, "prompt.md");
		const output = join(root, "review.json");
		executable(security, "#!/bin/sh\nprintf 'test-secret\\n'\n");
		executable(
			fx,
			`#!/bin/sh
if [ "$1" = "status" ]; then
  printf '{"auth":"AI_GATEWAY_API_KEY","model":"test/reviewer"}\\n'
  exit 0
fi
printf 'partial test-secret'
printf 'gateway failed with test-secret\\n' >&2
exit 7
`,
		);
		writeFileSync(promptFile, "Review this diff.");

		const artifact = runFxReview({
			promptFile,
			output,
			cwd: root,
			fxBin: fx,
			securityBin: security,
		});

		expect(artifact.status).toBe("failed");
		expect(artifact.exit_code).toBe(7);
		expect(artifact.final_output).toBe("partial [REDACTED]");
		expect(artifact.diagnostics).toContain("did not return valid JSON");
		expect(readFileSync(output, "utf8")).not.toContain("test-secret");
	});

	test("rejects an unbounded timeout", () => {
		const root = mkdtempSync(join(tmpdir(), "fx-review-timeout-"));
		const promptFile = join(root, "prompt.md");
		writeFileSync(promptFile, "Review this diff.");

		expect(() =>
			runFxReview({
				promptFile,
				output: join(root, "review.json"),
				cwd: root,
				timeoutMs: 0,
			}),
		).toThrow("positive integer");
	});
});
