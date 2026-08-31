#!/usr/bin/env bun
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
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

const required = (key) => {
	const value = values.get(key);
	if (!value) throw new Error(`--${key} is required`);
	return value;
};

const output = resolve(required("out"));
if (extname(output) !== ".html") {
	throw new Error("--out must end in .html");
}

const beforeSource = resolve(required("before"));
const afterSource = resolve(required("after"));
for (const [label, path] of [
	["before", beforeSource],
	["after", afterSource],
]) {
	if (!existsSync(path)) throw new Error(`--${label} does not exist: ${path}`);
	if (extname(path).toLowerCase() !== ".png") {
		throw new Error(`--${label} must be a PNG file`);
	}
}

const pngDimensions = (path) => {
	const bytes = readFileSync(path);
	if (
		bytes.length < 33 ||
		!bytes
			.subarray(0, 8)
			.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
		bytes.readUInt32BE(8) !== 13 ||
		bytes.subarray(12, 16).toString("ascii") !== "IHDR"
	) {
		throw new Error(`Invalid PNG file: ${path}`);
	}
	const width = bytes.readUInt32BE(16);
	const height = bytes.readUInt32BE(20);
	if (width === 0 || height === 0) throw new Error(`Invalid PNG file: ${path}`);
	return { width, height };
};

const beforeDimensions = pngDimensions(beforeSource);
const afterDimensions = pngDimensions(afterSource);
const dimensionsMatch =
	beforeDimensions.width === afterDimensions.width &&
	beforeDimensions.height === afterDimensions.height;
const allowSizeChange = values.get("allow-size-change") === "true";

if (!dimensionsMatch && !allowSizeChange) {
	throw new Error(
		`Capture dimensions differ: before ${beforeDimensions.width}x${beforeDimensions.height}, after ${afterDimensions.width}x${afterDimensions.height}. Pass --allow-size-change true only when size is the intended visual change.`,
	);
}

const title = values.get("title") ?? "What changed";
const subject = values.get("subject") ?? "Web visual proof";
const summary =
	values.get("summary") ??
	"The same browser surface before and after the visible change.";
const date = values.get("date") ?? new Date().toISOString().slice(0, 10);
const beforeHeading = values.get("before-heading") ?? "Observed baseline";
const afterHeading = values.get("after-heading") ?? "Observed change";
const beforeCopy =
	values.get("before-copy") ?? "The browser state before the change.";
const afterCopy =
	values.get("after-copy") ?? "The same browser state after the change.";
const baseline = values.get("baseline") ?? "Baseline identity not supplied";
const changed = values.get("changed") ?? "Changed identity not supplied";
const url = values.get("url") ?? "URL not supplied";
const selector = values.get("selector") ?? "Selector not supplied";
const caveat =
	values.get("caveat") ??
	"This evidence proves the rendered visual difference, not behavior outside the captured state.";

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(
	join(skillRoot, "assets", "template.html"),
	"utf8",
);
const assetDir = join(
	dirname(output),
	`${basename(output, extname(output))}.assets`,
);
const cssPath = join(assetDir, "vercel-brand.css");
const beforePath = join(assetDir, "before.png");
const afterPath = join(assetDir, "after.png");
const manifestPath = join(
	dirname(output),
	`${basename(output, extname(output))}.json`,
);

mkdirSync(dirname(output), { recursive: true });
mkdirSync(assetDir, { recursive: true });

const foundationCss = values.get("foundation-css");
if (foundationCss !== undefined) {
	writeFileSync(cssPath, foundationCss);
} else {
	const response = await fetch("https://vercel.com/geist/vercel-brand.css");
	if (!response.ok) {
		throw new Error(`Could not fetch Vercel foundation: ${response.status}`);
	}
	writeFileSync(cssPath, await response.text());
}
copyFileSync(beforeSource, beforePath);
copyFileSync(afterSource, afterPath);

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");

const dimensionLabel = dimensionsMatch
	? `${beforeDimensions.width} × ${beforeDimensions.height} px`
	: `${beforeDimensions.width} × ${beforeDimensions.height} px → ${afterDimensions.width} × ${afterDimensions.height} px`;

const replacements = {
	__TITLE__: title,
	__SUBJECT__: subject,
	__SUMMARY__: summary,
	__DATE__: date,
	__CSS_HREF__: relative(dirname(output), cssPath),
	__BEFORE_IMAGE__: relative(dirname(output), beforePath),
	__AFTER_IMAGE__: relative(dirname(output), afterPath),
	__BEFORE_WIDTH__: beforeDimensions.width,
	__BEFORE_HEIGHT__: beforeDimensions.height,
	__AFTER_WIDTH__: afterDimensions.width,
	__AFTER_HEIGHT__: afterDimensions.height,
	__BEFORE_HEADING__: beforeHeading,
	__AFTER_HEADING__: afterHeading,
	__BEFORE_COPY__: beforeCopy,
	__AFTER_COPY__: afterCopy,
	__BASELINE__: baseline,
	__CHANGED__: changed,
	__URL__: url,
	__SELECTOR__: selector,
	__DIMENSIONS__: dimensionLabel,
	__CAVEAT__: caveat,
};

let html = template;
for (const [placeholder, value] of Object.entries(replacements)) {
	html = html.replaceAll(placeholder, escapeHtml(value));
}

writeFileSync(output, html);
writeFileSync(
	manifestPath,
	`${JSON.stringify(
		{
			version: 1,
			title,
			subject,
			summary,
			date,
			url,
			selector,
			baseline,
			changed,
			caveat,
			captures: {
				before: {
					path: relative(dirname(output), beforePath),
					width: beforeDimensions.width,
					height: beforeDimensions.height,
				},
				after: {
					path: relative(dirname(output), afterPath),
					width: afterDimensions.width,
					height: afterDimensions.height,
				},
			},
			dimensionsMatch,
			sizeChangeAllowed: allowSizeChange,
		},
		null,
		2,
	)}\n`,
);
process.stdout.write(`${output}\n${manifestPath}\n`);
