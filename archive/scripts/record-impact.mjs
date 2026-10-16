#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadKnowledge } from "./lib/knowledge.mjs";
import { recordImpact } from "./lib/knowledge-impact.mjs";

const repository = resolve(import.meta.dirname, "..");
const input = process.argv[2];
if (!input) {
	console.error("Usage: bun scripts/record-impact.mjs <impact-record.json>");
	process.exit(2);
}

let proposed;
let knowledge;
try {
	proposed = JSON.parse(readFileSync(resolve(input), "utf8"));
	knowledge = loadKnowledge(repository);
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}

let result;
try {
	result = recordImpact(repository, knowledge, proposed);
} catch (error) {
	for (const message of error.message.split("\n"))
		console.error(`ERROR ${message}`);
	process.exit(1);
}
console.log(
	result.appended
		? `Impact recorded: ${proposed.id}`
		: `Impact already recorded: ${proposed.id}`,
);
