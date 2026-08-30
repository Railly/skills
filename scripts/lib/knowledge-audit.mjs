import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const EXTENSIONS = new Set([".md", ".json"]);
const CLASSIFICATIONS = new Set([
	"application",
	"evaluation",
	"decision",
	"reference",
	"planned",
	"incidental",
]);
const SCOPES = ["cases", "foundry/runs", "foundry/rounds"];

function files(directory) {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) return files(path);
		const extension = entry.name.slice(entry.name.lastIndexOf("."));
		return EXTENSIONS.has(extension) ? [path] : [];
	});
}

function escaped(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenPattern(skill) {
	return new RegExp(`(?<![a-z0-9-])${escaped(skill)}(?![a-z0-9-])`);
}

function fingerprint(matches) {
	return createHash("sha256")
		.update(matches.map((match) => `${match.line}:${match.text}`).join("\n"))
		.digest("hex");
}

function normalize(repository, path) {
	return relative(repository, path).split("\\").join("/");
}

export function discoverTextualMatches(repository, skillNames) {
	const root = resolve(repository);
	const corpus = SCOPES.flatMap((scope) => files(join(root, scope))).sort();
	const records = [];
	for (const path of corpus) {
		const lines = readFileSync(path, "utf8").split("\n");
		for (const skill of skillNames) {
			const pattern = tokenPattern(skill);
			const matches = lines.flatMap((text, index) =>
				pattern.test(text) ? [{ line: index + 1, text: text.trim() }] : [],
			);
			if (matches.length === 0) continue;
			records.push({
				skill,
				path: normalize(root, path),
				matches,
				fingerprint: fingerprint(matches),
			});
		}
	}
	return records.sort((left, right) =>
		`${left.skill}:${left.path}`.localeCompare(`${right.skill}:${right.path}`),
	);
}

export function matchKey(record) {
	return `${record.skill}:${record.path}`;
}

export function suggestClassification(record) {
	const runPrefix = `foundry/runs/${record.skill}/`;
	const context = record.matches.map((match) => match.text).join(" ");
	if (record.path.startsWith(runPrefix)) return "application";
	if (record.path.startsWith("foundry/rounds/")) {
		if (record.path.endsWith("foundry/rounds/README.md")) return "reference";
		if (record.path.includes("002-review-gate-blind-replication")) {
			return "evaluation";
		}
		if (record.path.includes("003-distribution-ladder")) return "decision";
		if (record.path.includes("004-skill-lifecycle-audit")) {
			return record.skill === "handoff" ? "reference" : "decision";
		}
		if (record.path.includes("006-usage-based-reclassification")) {
			return "evaluation";
		}
		if (record.path.includes("005-issue-intake-rename")) {
			return record.skill === "issue-intake" ? "decision" : "evaluation";
		}
		if (record.path.includes("005-register-xref")) {
			return record.skill === "xref" ? "decision" : "reference";
		}
		if (record.path.includes("007-human-override-promotions")) {
			return ["handoff", "solution-gate"].includes(record.skill)
				? "decision"
				: "reference";
		}
		if (record.path.includes("008-register-before-after")) {
			return record.skill === "before-after" ? "decision" : "reference";
		}
		if (record.path.includes("009-register-simplify")) {
			return record.skill === "simplify" ? "decision" : "reference";
		}
		if (record.path.includes("010-retire-pick-an-issue")) return "decision";
		if (record.path.includes("011-register-software-factory")) {
			return record.skill === "software-factory" ? "decision" : "reference";
		}
		if (record.path.includes("011-register-workstream-reconcile")) {
			return record.skill === "workstream-reconcile" ? "decision" : "reference";
		}
		if (record.path.includes("012-register-herdr-workstreams")) {
			return record.skill === "herdr-workstreams" ? "decision" : "reference";
		}
		if (record.path.includes("013-register-factory-loop")) {
			return ["factory-loop", "software-factory"].includes(record.skill)
				? "decision"
				: "reference";
		}
		if (record.path.includes("006-work-intake")) return "decision";
		return "reference";
	}
	if (record.path.startsWith("cases/")) {
		if (record.skill === "handoff") return "incidental";
		if (
			record.path.endsWith("conventions.md") ||
			record.path === "cases/README.md"
		) {
			return "reference";
		}
		if (
			/applied as written|ran the .{0,30}(pass|skill)|run[s]? on|found and closed|caught by|mutations failed|review-gate pass|review-gate round|review-gate skill|blind review-gate run|own review-gate finding|review gate (is|records|reports|found)|solution-gate run|solution-gate proposals|solution gate (is|records|reports)|went through \[?solution-gate|factory loop|factory-loop/i.test(
				context,
			)
		) {
			return "application";
		}
		return "reference";
	}
	if (record.skill === "handoff") return "incidental";
	if (record.skill === "trail-decisions") return "planned";
	if (
		record.skill === "xref" &&
		/xref found|`xref |"check"\s*:\s*"xref|xref final|xref graph/i.test(context)
	) {
		return "application";
	}
	if (
		record.skill === "test-strength" &&
		/mutations|after test-strength|test-strength additions/i.test(context)
	) {
		return "application";
	}
	return "reference";
}

export function buildDraftAudit(repository, skillNames) {
	return {
		schema_version: 1,
		scope: SCOPES,
		unit: "skill-file",
		records: discoverTextualMatches(repository, skillNames).map((record) => {
			const classification = suggestClassification(record);
			return {
				skill: record.skill,
				path: record.path,
				fingerprint: record.fingerprint,
				classification,
				supports_application: classification === "application",
				rationale:
					"DRAFT: inspect matched lines before accepting this classification.",
			};
		}),
	};
}

export function validateTextualMatchAudit(repository, skillNames, audit) {
	const errors = [];
	if (audit?.schema_version !== 1 || audit?.unit !== "skill-file") {
		errors.push(
			"textual match audit: expected schema_version 1 and skill-file unit",
		);
	}
	if (!Array.isArray(audit?.records)) {
		return {
			errors: [...errors, "textual match audit: records must be an array"],
		};
	}
	const discovered = discoverTextualMatches(repository, skillNames);
	const current = new Map(
		discovered.map((record) => [matchKey(record), record]),
	);
	const recorded = new Map();
	for (const record of audit.records) {
		const key = matchKey(record);
		if (recorded.has(key))
			errors.push(`textual match audit: duplicate "${key}"`);
		recorded.set(key, record);
		if (!CLASSIFICATIONS.has(record.classification)) {
			errors.push(`textual match audit: invalid classification for "${key}"`);
		}
		if (typeof record.supports_application !== "boolean") {
			errors.push(
				`textual match audit: missing application verdict for "${key}"`,
			);
		}
		if (
			typeof record.rationale !== "string" ||
			record.rationale.length === 0 ||
			record.rationale.startsWith("DRAFT:")
		) {
			errors.push(`textual match audit: unreviewed rationale for "${key}"`);
		}
	}
	for (const [key, record] of current) {
		const audited = recorded.get(key);
		if (!audited) {
			errors.push(`textual match audit: unclassified current match "${key}"`);
		} else if (audited.fingerprint !== record.fingerprint) {
			errors.push(`textual match audit: stale fingerprint for "${key}"`);
		}
	}
	for (const key of recorded.keys()) {
		if (!current.has(key)) {
			errors.push(
				`textual match audit: recorded match no longer exists "${key}"`,
			);
		}
	}
	return { errors, discovered };
}

export function validateKnowledgeAuditAlignment(knowledge, audit) {
	const errors = [];
	const records = new Map(
		(audit?.records ?? []).map((record) => [matchKey(record), record]),
	);
	for (const skill of knowledge.skills) {
		for (const evidence of skill.evidence ?? []) {
			if (evidence.relationship !== "application") continue;
			const key = `${skill.skill}:${evidence.path}`;
			const audited = records.get(key);
			if (audited && !audited.supports_application) {
				errors.push(
					`textual match audit: "${key}" is linked as application evidence but the reviewed match does not support application`,
				);
			}
		}
	}
	return { errors };
}

export function summarizeTextualMatchAudit(audit) {
	const counts = new Map();
	const support = new Map();
	for (const record of audit.records) {
		if (!counts.has(record.skill)) counts.set(record.skill, new Map());
		const skill = counts.get(record.skill);
		skill.set(
			record.classification,
			(skill.get(record.classification) ?? 0) + 1,
		);
		if (record.supports_application) {
			support.set(record.skill, (support.get(record.skill) ?? 0) + 1);
		}
	}
	const classifications = [...CLASSIFICATIONS];
	const rows = [...counts.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([skill, values]) => {
			const total = [...values.values()].reduce((sum, value) => sum + value, 0);
			return `| ${skill} | ${total} | ${support.get(skill) ?? 0} | ${classifications.map((classification) => values.get(classification) ?? 0).join(" | ")} |`;
		});
	return [
		"# Textual match audit coverage",
		"",
		"Generated from the reviewed skill-file classifications. Each fingerprint covers the exact matching lines in its source file.",
		"",
		`| Skill | Total | Supports application | ${classifications.join(" | ")} |`,
		`|---|---:|---:|${classifications.map(() => "---:").join("|")}|`,
		...rows,
		"",
	].join("\n");
}
