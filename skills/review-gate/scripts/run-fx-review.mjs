#!/usr/bin/env bun
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const KEYCHAIN_SERVICE = "Vercel AI Gateway";
const KEYCHAIN_ACCOUNT = "vercel-ai-gateway";
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;

function option(args, name) {
	const index = args.indexOf(name);
	if (index === -1) return null;
	if (!args[index + 1] || args[index + 1].startsWith("--")) {
		throw new Error(`${name} requires a value`);
	}
	return args[index + 1];
}

function redact(value, secret) {
	return String(value ?? "")
		.split(secret)
		.join("[REDACTED]");
}

function parseJson(value, label) {
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`${label} did not return valid JSON`);
	}
}

export function runFxReview({
	promptFile,
	output,
	cwd = process.cwd(),
	fxBin = process.env.FX_BIN ?? "fx",
	securityBin = process.env.SECURITY_BIN ?? "/usr/bin/security",
	timeoutMs = Number(process.env.FX_REVIEW_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
}) {
	if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
		throw new Error("FX review timeout must be a positive integer");
	}
	const startedAt = new Date();
	let key;
	try {
		key = execFileSync(
			securityBin,
			[
				"find-generic-password",
				"-s",
				KEYCHAIN_SERVICE,
				"-a",
				KEYCHAIN_ACCOUNT,
				"-w",
			],
			{ encoding: "utf8" },
		).trim();
	} catch {
		throw new Error(
			`missing macOS Keychain item ${KEYCHAIN_SERVICE} / ${KEYCHAIN_ACCOUNT}`,
		);
	}
	if (!key) throw new Error("AI Gateway Keychain item is empty");

	const env = {
		...process.env,
		AI_GATEWAY_API_KEY: key,
		FX_DISABLE_KEYCHAIN: "1",
	};
	const statusCall = spawnSync(fxBin, ["status", "--json"], {
		cwd,
		env,
		encoding: "utf8",
		timeout: 10_000,
	});
	if (statusCall.error) {
		throw new Error(
			`fx status failed: ${redact(statusCall.error.message, key)}`,
		);
	}
	if (statusCall.status !== 0) {
		throw new Error(
			`fx status failed: ${redact(statusCall.stderr, key).trim()}`,
		);
	}
	const status = parseJson(statusCall.stdout, "fx status");
	if (status.auth !== "AI_GATEWAY_API_KEY") {
		throw new Error(
			`fx reported unsupported auth mode: ${status.auth ?? "missing"}`,
		);
	}

	const prompt = readFileSync(resolve(promptFile), "utf8");
	const reviewCall = spawnSync(
		fxBin,
		[
			"ask",
			"--json",
			"--no-save",
			"--no-color",
			"--system",
			"Review the frozen repository state read-only. Do not modify files. Return concise findings with file and line evidence.",
			"--",
			prompt,
		],
		{ cwd, env, encoding: "utf8", timeout: timeoutMs },
	);
	const finishedAt = new Date();
	const sanitizedStdout = redact(reviewCall.stdout, key);
	const diagnostics = [
		redact(reviewCall.stderr, key).trim(),
		reviewCall.error
			? `fx ask failed: ${redact(reviewCall.error.message, key)}`
			: "",
	].filter(Boolean);
	let response = {};
	let responseParseFailed = false;
	if (sanitizedStdout.trim()) {
		try {
			response = JSON.parse(sanitizedStdout);
		} catch {
			responseParseFailed = true;
			diagnostics.push("fx ask did not return valid JSON");
		}
	}
	const complete =
		reviewCall.status === 0 && !reviewCall.error && !responseParseFailed;
	const artifact = {
		schema_version: 1,
		kind: "fx-review",
		runtime: "fx_worker",
		provider: "vercel-ai-gateway",
		auth: "AI_GATEWAY_API_KEY",
		credential_source: "macos-keychain",
		model: status.model ?? null,
		cwd: resolve(cwd),
		started_at: startedAt.toISOString(),
		finished_at: finishedAt.toISOString(),
		duration_ms: finishedAt.getTime() - startedAt.getTime(),
		exit_code: complete ? 0 : (reviewCall.status ?? 1),
		status: complete ? "complete" : "failed",
		timed_out: reviewCall.error?.code === "ETIMEDOUT",
		final_output: redact(
			response.final_output ?? response.output ?? sanitizedStdout,
			key,
		),
		diagnostics: diagnostics.join("\n") || null,
	};
	mkdirSync(dirname(resolve(output)), { recursive: true });
	writeFileSync(resolve(output), `${JSON.stringify(artifact, null, 2)}\n`);
	return artifact;
}

if (import.meta.main) {
	try {
		const args = process.argv.slice(2);
		const promptFile = option(args, "--prompt-file");
		const output = option(args, "--output");
		const cwd = option(args, "--cwd") ?? process.cwd();
		const timeout = option(args, "--timeout-ms");
		if (!promptFile || !output) {
			throw new Error(
				"Usage: run-fx-review.mjs --prompt-file <path> --output <path> [--cwd <repo>] [--timeout-ms <milliseconds>]",
			);
		}
		const artifact = runFxReview({
			promptFile,
			output,
			cwd,
			timeoutMs: timeout === null ? undefined : Number(timeout),
		});
		console.log(
			`FX review ${artifact.status}: ${resolve(output)} (${artifact.duration_ms}ms)`,
		);
		process.exitCode = artifact.exit_code === 0 ? 0 : 1;
	} catch (error) {
		console.error(`ERROR ${error.message}`);
		process.exitCode = 1;
	}
}
