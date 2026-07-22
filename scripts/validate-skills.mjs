#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const SKILLS_DIR = "skills";
const MARKETPLACE_PATH = join(".claude-plugin", "marketplace.json");
const CATALOGS = [".curated", ".experimental", ".system"];
const REQUIRED = ["name", "description"];
const MAX_SKILL_LINES = 120;
const MATURITY_STATES = new Set([
	"experimental",
	"dogfooded",
	"evaluated",
	"validated",
	"deprecated",
]);
const errors = [];

function parseFrontmatter(text) {
	if (!text.startsWith("---")) return null;
	const end = text.indexOf("\n---", 3);
	if (end === -1) return null;
	const block = text.slice(3, end).trim();
	const keys = {};
	for (const line of block.split("\n")) {
		const match = line.match(/^([a-zA-Z0-9_-]+):/);
		if (match) keys[match[1]] = line.slice(match[0].length).trim();
	}
	return keys;
}

function markdownFiles(root) {
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		const path = join(root, entry.name);
		if (entry.isDirectory()) return markdownFiles(path);
		return entry.name.endsWith(".md") ? [path] : [];
	});
}

function discoverSkills() {
	const entries = [];
	for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
		const root = join(SKILLS_DIR, entry.name);
		if (existsSync(join(root, "SKILL.md"))) {
			entries.push({ name: entry.name, root, catalog: "stable" });
		}
	}
	for (const catalog of CATALOGS) {
		const container = join(SKILLS_DIR, catalog);
		if (!existsSync(container)) continue;
		for (const entry of readdirSync(container, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const root = join(container, entry.name);
			if (existsSync(join(root, "SKILL.md"))) {
				entries.push({ name: entry.name, root, catalog });
			}
		}
	}
	return entries;
}

function validateLinks(file) {
	const text = readFileSync(file, "utf8");
	const links = text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
	for (const [, target] of links) {
		if (/^(https?:|mailto:|#)/.test(target)) continue;
		const path = resolve(dirname(file), target.split("#")[0]);
		if (!existsSync(path))
			errors.push(`${file}: missing linked file "${target}"`);
	}
}

function validateCase(file) {
	const text = readFileSync(file, "utf8");
	const required = [
		"Status",
		"Validation",
		"Human review",
		"Maintainer acceptance",
		"Delivery",
		"Upstream status checked",
		"Visibility",
		"Repository",
		"Source",
	];
	for (const field of required) {
		if (!new RegExp(`^${field}:\\s+.+$`, "m").test(text)) {
			errors.push(`${file}: missing case field "${field}"`);
		}
	}
	if (!/^Visibility: public$/m.test(text)) {
		errors.push(`${file}: published cases must have public visibility`);
	}
	if (
		/\/Users\/|approved-private|internal review|reviewer identity/i.test(text)
	) {
		errors.push(`${file}: contains local or private-case material`);
	}
	if (/Unvalidated agent backfill/i.test(text)) {
		if (!/^Status: observed$/m.test(text)) {
			errors.push(
				`${file}: unvalidated agent backfill must have observed status`,
			);
		}
		if (!/^Validation: unvalidated$/m.test(text)) {
			errors.push(
				`${file}: unvalidated agent backfill must remain unvalidated`,
			);
		}
		if (!/^Human review: pending$/m.test(text)) {
			errors.push(
				`${file}: unvalidated agent backfill must have pending human review`,
			);
		}
	}
}

if (!existsSync(SKILLS_DIR)) {
	console.error(`No ${SKILLS_DIR}/ directory found.`);
	process.exit(1);
}

const skills = discoverSkills();
const names = skills.map((skill) => skill.name);

if (skills.length === 0) errors.push("No skills found under skills/.");
if (new Set(names).size !== names.length) {
	errors.push("Skill names must be unique across stable and catalog surfaces.");
}

if (!existsSync(MARKETPLACE_PATH)) {
	errors.push(
		"Missing .claude-plugin/marketplace.json skill grouping manifest.",
	);
} else {
	try {
		const marketplace = JSON.parse(readFileSync(MARKETPLACE_PATH, "utf8"));
		const declared = new Map();
		for (const plugin of marketplace.plugins ?? []) {
			for (const path of plugin.skills ?? []) {
				declared.set(path.replace(/^\.\//, ""), plugin.name);
			}
		}
		for (const skill of skills) {
			const group = declared.get(skill.root);
			const expected =
				skill.catalog === ".experimental" ? "candidates" : "stable";
			if (group !== expected) {
				errors.push(
					`${skill.name}: installer group must be "${expected}", received "${group ?? "missing"}"`,
				);
			}
		}
		for (const path of declared.keys()) {
			if (!skills.some((skill) => skill.root === path)) {
				errors.push(`Installer manifest references missing skill "${path}"`);
			}
		}
	} catch {
		errors.push("Malformed .claude-plugin/marketplace.json.");
	}
}

const maturityPath = join("foundry", "maturity.json");
if (!existsSync(maturityPath)) {
	errors.push("Missing foundry/maturity.json.");
} else {
	try {
		const maturity = JSON.parse(readFileSync(maturityPath, "utf8"));
		const registered = Object.keys(maturity.skills ?? {});
		for (const skill of skills) {
			const entry = maturity.skills?.[skill.name];
			if (!entry) {
				errors.push(`${skill.name}: missing maturity registry entry`);
				continue;
			}
			if (!MATURITY_STATES.has(entry.maturity)) {
				errors.push(
					`${skill.name}: invalid maturity state "${entry.maturity}"`,
				);
			}
			if (!entry.type || !entry.summary) {
				errors.push(`${skill.name}: maturity entry needs type and summary`);
			}
			if (
				skill.catalog === ".experimental" &&
				entry.maturity !== "experimental"
			) {
				errors.push(
					`${skill.name}: skills/.experimental entries must have experimental maturity`,
				);
			}
			if (entry.decision && !existsSync(join("foundry", entry.decision))) {
				errors.push(
					`${skill.name}: missing maturity decision "${entry.decision}"`,
				);
			}
		}
		for (const name of registered) {
			if (!names.includes(name))
				errors.push(`maturity registry references missing skill "${name}"`);
		}
	} catch {
		errors.push("Malformed foundry/maturity.json.");
	}
}

for (const { name: dir, root } of skills) {
	const skillPath = join(root, "SKILL.md");
	if (!existsSync(skillPath)) {
		errors.push(`${dir}: missing SKILL.md`);
		continue;
	}

	const skill = readFileSync(skillPath, "utf8");
	const frontmatter = parseFrontmatter(skill);
	if (!frontmatter) {
		errors.push(`${dir}: missing or malformed frontmatter block`);
		continue;
	}

	for (const key of REQUIRED) {
		if (!frontmatter[key]) errors.push(`${dir}: frontmatter missing "${key}"`);
	}
	if (frontmatter.name && frontmatter.name !== dir) {
		errors.push(
			`${dir}: frontmatter name "${frontmatter.name}" != folder name "${dir}"`,
		);
	}
	if (skill.split("\n").length > MAX_SKILL_LINES) {
		errors.push(
			`${dir}: SKILL.md exceeds ${MAX_SKILL_LINES} lines; disclose reference material`,
		);
	}

	const evalPath = join(root, "evals", "evals.json");
	if (existsSync(evalPath)) {
		try {
			const evals = JSON.parse(readFileSync(evalPath, "utf8"));
			if (evals.skill_name !== dir)
				errors.push(`${dir}: evals skill_name must match folder name`);
			if (!Array.isArray(evals.evals) || evals.evals.length === 0) {
				errors.push(`${dir}: evals must contain at least one case`);
			} else {
				for (const item of evals.evals) {
					if (item.id === undefined || !item.prompt || !item.expected_output) {
						errors.push(
							`${dir}: each eval needs id, prompt, and expected_output`,
						);
					}
					if (!Array.isArray(item.files)) {
						errors.push(`${dir}: eval ${item.id} files must be an array`);
					}
					if (item.assertions && !Array.isArray(item.assertions)) {
						errors.push(`${dir}: eval ${item.id} assertions must be an array`);
					}
					if (item.fixture) {
						const fixtureRoot = join(root, "evals", "fixtures", item.fixture);
						if (
							!existsSync(join(fixtureRoot, "base")) ||
							!existsSync(join(fixtureRoot, "changed"))
						) {
							errors.push(
								`${dir}: eval ${item.id} fixture must contain base and changed`,
							);
						}
					}
					if (item.verification) {
						if (
							!Array.isArray(item.verification.command) ||
							item.verification.command.length === 0
						) {
							errors.push(
								`${dir}: eval ${item.id} verification command must be a non-empty array`,
							);
						}
						if (!Number.isInteger(item.verification.expected_exit)) {
							errors.push(
								`${dir}: eval ${item.id} verification expected_exit must be an integer`,
							);
						}
					}
				}
			}
		} catch {
			errors.push(`${dir}: malformed evals/evals.json`);
		}
	}

	const triggerPath = join(root, "evals", "triggers.json");
	if (existsSync(triggerPath)) {
		try {
			const triggers = JSON.parse(readFileSync(triggerPath, "utf8"));
			if (!Array.isArray(triggers) || triggers.length === 0) {
				errors.push(`${dir}: triggers must contain at least one case`);
			} else {
				const ids = new Set();
				for (const item of triggers) {
					if (
						!item.id ||
						!item.query ||
						typeof item.should_trigger !== "boolean"
					) {
						errors.push(
							`${dir}: each trigger needs id, query, and should_trigger`,
						);
					}
					if (ids.has(item.id))
						errors.push(`${dir}: duplicate trigger id ${item.id}`);
					ids.add(item.id);
				}
			}
		} catch {
			errors.push(`${dir}: malformed evals/triggers.json`);
		}
	}
}

for (const file of [
	"README.md",
	...markdownFiles("skills"),
	...markdownFiles("cases"),
	...markdownFiles("foundry"),
]) {
	validateLinks(file);
}

const NON_CASE_BASENAMES = new Set(["README.md", "conventions.md"]);
for (const file of markdownFiles("cases").filter(
	(file) => !NON_CASE_BASENAMES.has(basename(file)),
)) {
	validateCase(file);
}

if (errors.length) {
	console.error(
		`Skill validation failed:\n${errors.map((error) => `  - ${error}`).join("\n")}`,
	);
	process.exit(1);
}

console.log(`✓ ${skills.length} skill(s) valid.`);
