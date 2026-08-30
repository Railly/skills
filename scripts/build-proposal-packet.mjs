#!/usr/bin/env bun
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { loadKnowledge, validateKnowledge } from "./lib/knowledge.mjs";
import { buildProposalPacket } from "./lib/knowledge-impact.mjs";

const repository = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const skill = args[0];
const outputIndex = args.indexOf("--output");
const output = outputIndex >= 0 ? args[outputIndex + 1] : null;

if (!skill || (outputIndex >= 0 && !output)) {
	console.error(
		"Usage: bun scripts/build-proposal-packet.mjs <skill> [--output foundry/runs/proposal-impact/<run>/packet.json]",
	);
	process.exit(2);
}

let knowledge;
try {
	knowledge = loadKnowledge(repository);
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}
const validation = validateKnowledge(repository, knowledge);
if (validation.errors.length > 0) {
	for (const error of validation.errors) console.error(`ERROR ${error}`);
	process.exit(1);
}

let packet;
try {
	packet = buildProposalPacket(repository, knowledge, skill);
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}
const content = `${JSON.stringify(packet, null, 2)}\n`;

if (!output) {
	process.stdout.write(content);
	process.exit(0);
}

const target = resolve(repository, output);
const normalized = relative(repository, target).split("\\").join("/");
if (
	isAbsolute(output) ||
	!normalized.startsWith("foundry/runs/proposal-impact/") ||
	normalized.includes("../")
) {
	console.error(
		"ERROR output must stay under foundry/runs/proposal-impact/ in this repository",
	);
	process.exit(1);
}
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, content);
console.log(`Proposal packet written: ${normalized}`);
