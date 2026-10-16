#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const start = "<!-- before-after:start -->";
const end = "<!-- before-after:end -->";
const args = process.argv.slice(2);
const values = new Map();

for (let index = 0; index < args.length; index += 2) {
	const key = args[index];
	const value = args[index + 1];
	if (!key?.startsWith("--") || value === undefined) {
		throw new Error("Expected --key value arguments");
	}
	values.set(key.slice(2), value);
}

const required = (key) => {
	const value = values.get(key);
	if (!value) throw new Error(`--${key} is required`);
	return resolve(value);
};

const bodyPath = required("body");
const sectionPath = required("section");
const outputPath = required("out");
const body = readFileSync(bodyPath, "utf8").trimEnd();
const section = readFileSync(sectionPath, "utf8").trim();

if (section.includes(start) || section.includes(end)) {
	throw new Error("Section content must not contain before-after markers");
}

const startIndex = body.indexOf(start);
const endIndex = body.indexOf(end);
if ((startIndex === -1) !== (endIndex === -1)) {
	throw new Error("PR body contains an incomplete before-after marker pair");
}
if (
	startIndex !== -1 &&
	(endIndex < startIndex || body.indexOf(start, startIndex + start.length) !== -1)
) {
	throw new Error("PR body contains invalid or duplicate before-after markers");
}

const block = `${start}\n${section}\n${end}`;
const output =
	startIndex === -1
		? `${body}${body ? "\n\n" : ""}${block}\n`
		: `${body.slice(0, startIndex)}${block}${body.slice(endIndex + end.length).trimEnd()}\n`;

writeFileSync(outputPath, output);
console.log(outputPath);
