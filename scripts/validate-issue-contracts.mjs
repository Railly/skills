#!/usr/bin/env bun
import { resolve } from "node:path";
import { validateIssueContracts } from "./lib/issue-contracts.mjs";

const repository = resolve(import.meta.dir, "..");
const { files, errors } = validateIssueContracts(
	repository,
	process.argv.slice(2),
);

if (errors.length) {
	console.error(
		`Issue Contract validation failed:\n${errors.map((error) => `  - ${error}`).join("\n")}`,
	);
	process.exit(1);
}

console.log(`✓ ${files.length} Issue Contract(s) valid.`);
