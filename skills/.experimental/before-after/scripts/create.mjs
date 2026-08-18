#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const outputArg = values.get("out");
if (!outputArg) {
	throw new Error("--out is required");
}

const output = resolve(outputArg);
if (extname(output) !== ".html") {
	throw new Error("--out must end in .html");
}

const title = values.get("title") ?? "What changed";
const subject = values.get("subject") ?? "Before / after";
const summary =
	values.get("summary") ??
	"Put the old and new behavior on one shared basis so the difference is visible.";
const date = values.get("date") ?? new Date().toISOString().slice(0, 10);
const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(join(skillRoot, "assets", "template.html"), "utf8");
const assetDir = join(
	dirname(output),
	`${basename(output, extname(output))}.assets`,
);
const cssPath = join(assetDir, "vercel-brand.css");

mkdirSync(dirname(output), { recursive: true });
mkdirSync(assetDir, { recursive: true });

const response = await fetch("https://vercel.com/geist/vercel-brand.css");
if (!response.ok) {
	throw new Error(`Could not fetch Vercel foundation: ${response.status}`);
}
writeFileSync(cssPath, await response.text());

const escapeHtml = (value) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

const html = template
	.replaceAll("__TITLE__", escapeHtml(title))
	.replaceAll("__SUBJECT__", escapeHtml(subject))
	.replaceAll("__SUMMARY__", escapeHtml(summary))
	.replaceAll("__DATE__", escapeHtml(date))
	.replaceAll("__CSS_HREF__", relative(dirname(output), cssPath));

writeFileSync(output, html);
process.stdout.write(`${output}\n`);
