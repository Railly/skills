#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { compileUsageReceipts } from "./lib/usage-receipts.mjs";

const repository = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const input = args[0];
const outputIndex = args.indexOf("--output");
const output = outputIndex === -1 ? null : args[outputIndex + 1];

if (!input || (outputIndex !== -1 && !output)) {
	console.error(
		"Usage: bun scripts/compile-usage-receipts.mjs <private-export.json> [--output foundry/runs/usage-receipts/<run>.json]",
	);
	process.exit(2);
}

try {
	const receiptExport = JSON.parse(
		input === "-"
			? await Bun.stdin.text()
			: readFileSync(resolve(input), "utf8"),
	);
	const maturity = JSON.parse(
		readFileSync(resolve(repository, "foundry", "maturity.json"), "utf8"),
	);
	const compilation = compileUsageReceipts(
		receiptExport,
		Object.keys(maturity.skills ?? {}),
	);
	const content = `${JSON.stringify(compilation, null, 2)}\n`;
	if (!output) {
		process.stdout.write(content);
		process.exit(0);
	}
	const target = resolve(repository, output);
	const normalized = relative(repository, target).split("\\").join("/");
	if (
		isAbsolute(output) ||
		!normalized.startsWith("foundry/runs/usage-receipts/") ||
		normalized.includes("../")
	) {
		throw new Error(
			"output must stay under foundry/runs/usage-receipts/ in this repository",
		);
	}
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, content);
	console.log(`Usage receipt compilation written: ${normalized}`);
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}
