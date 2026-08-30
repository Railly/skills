import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { summarizeTextualMatchAudit } from "./knowledge-audit.mjs";

const PATTERN_STATUSES = new Set([
	"candidate",
	"active",
	"contradicted",
	"superseded",
	"stale",
]);
const EVIDENCE_RELATIONSHIPS = new Set([
	"origin",
	"application",
	"evaluation",
	"transfer",
	"contradiction",
	"rejection",
]);
const SKILL_RELATIONSHIPS = new Set([
	"motivates",
	"supports",
	"contradicts",
	"supersedes",
]);
const VISIBILITIES = new Set(["public", "approved-private"]);
const RELATIONSHIP_STATUSES = new Set([
	"active",
	"contradicted",
	"superseded",
	"stale",
]);
const GENERATED_FILES = new Set(["index.md", "coverage.md"]);
const METADATA_PATTERN = /^## Metadata\s*\n+```json\s*\n([\s\S]*?)\n```/m;

function markdownFiles(directory) {
	if (!existsSync(directory)) return [];
	return readdirSync(directory, { withFileTypes: true })
		.filter(
			(entry) =>
				entry.isFile() &&
				entry.name.endsWith(".md") &&
				!GENERATED_FILES.has(entry.name) &&
				!entry.name.startsWith("_"),
		)
		.map((entry) => join(directory, entry.name))
		.sort();
}

function normalizePath(repository, path) {
	return relative(repository, path).split("\\").join("/");
}

function sortedEvidence(evidence = []) {
	return [...evidence].sort((left, right) =>
		`${left.path}:${left.relationship}`.localeCompare(
			`${right.path}:${right.relationship}`,
		),
	);
}

function stablePattern(pattern) {
	return {
		...pattern,
		evidence: sortedEvidence(pattern.evidence),
		skills: [...(pattern.skills ?? [])].sort((left, right) =>
			`${left.name}:${left.relationship}`.localeCompare(
				`${right.name}:${right.relationship}`,
			),
		),
		supersedes: [...(pattern.supersedes ?? [])].sort(),
	};
}

function stableSkill(skill) {
	return {
		...skill,
		patterns: [...(skill.patterns ?? [])].sort(),
		evidence: sortedEvidence(skill.evidence),
		decisions: [...(skill.decisions ?? [])].sort(),
		gaps: [...(skill.gaps ?? [])].sort((left, right) =>
			left.id.localeCompare(right.id),
		),
	};
}

function safeRepositoryPath(repository, value) {
	if (typeof value !== "string" || value.length === 0) return null;
	if (isAbsolute(value) || value.startsWith("../") || value.includes("/../")) {
		return null;
	}
	const target = resolve(repository, value);
	return target.startsWith(`${resolve(repository)}/`) ? target : null;
}

function resolvesInsideRepository(repository, target) {
	const root = realpathSync(repository);
	const resolved = realpathSync(target);
	return resolved.startsWith(`${root}/`);
}

function validateEvidence(repository, owner, evidence, errors) {
	if (!Array.isArray(evidence) || evidence.length === 0) {
		errors.push(`${owner}: evidence must contain at least one entry`);
		return;
	}
	for (const [index, entry] of evidence.entries()) {
		const label = `${owner}: evidence[${index}]`;
		if (!EVIDENCE_RELATIONSHIPS.has(entry?.relationship)) {
			errors.push(`${label} has invalid relationship "${entry?.relationship}"`);
		}
		if (!VISIBILITIES.has(entry?.visibility)) {
			errors.push(`${label} has invalid visibility "${entry?.visibility}"`);
		}
		if (!RELATIONSHIP_STATUSES.has(entry?.status)) {
			errors.push(`${label} has invalid status "${entry?.status}"`);
		}
		if (entry?.visibility === "approved-private") {
			if (
				typeof entry.path !== "string" ||
				!entry.path.startsWith("private:")
			) {
				errors.push(`${label} private evidence must use a private: pointer`);
			}
			if (/\/Users\/|\\Users\\/.test(entry?.path ?? "")) {
				errors.push(`${label} exposes a local path`);
			}
			continue;
		}
		const target = safeRepositoryPath(repository, entry?.path);
		if (!target) {
			errors.push(`${label} must use a safe repository-relative path`);
		} else if (!existsSync(target)) {
			errors.push(`${label} references missing path "${entry.path}"`);
		} else if (!resolvesInsideRepository(repository, target)) {
			errors.push(`${label} resolves outside the repository`);
		}
	}
}

function tableCell(value) {
	return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function parseKnowledgeMetadata(text, source = "knowledge page") {
	const match = text.match(METADATA_PATTERN);
	if (!match) {
		throw new Error(`${source}: missing JSON block under Metadata`);
	}
	try {
		return JSON.parse(match[1]);
	} catch (error) {
		throw new Error(`${source}: malformed metadata JSON: ${error.message}`);
	}
}

export function loadKnowledge(repository) {
	const root = resolve(repository);
	const maturityPath = join(root, "foundry", "maturity.json");
	const maturity = JSON.parse(readFileSync(maturityPath, "utf8"));
	const parseFiles = (directory) =>
		markdownFiles(directory).map((file) => ({
			...parseKnowledgeMetadata(
				readFileSync(file, "utf8"),
				normalizePath(root, file),
			),
			source: normalizePath(root, file),
		}));
	const patterns = parseFiles(join(root, "foundry", "knowledge", "patterns"));
	const skills = parseFiles(join(root, "foundry", "knowledge", "skills"));
	const auditPath = join(
		root,
		"foundry",
		"knowledge",
		"audits",
		"2026-08-29-textual-match-audit.json",
	);
	const audit = existsSync(auditPath)
		? JSON.parse(readFileSync(auditPath, "utf8"))
		: null;
	return { repository: root, maturity, patterns, skills, audit };
}

export function validateKnowledge(
	repository,
	knowledge,
	{ enforceMaturity = false } = {},
) {
	const errors = [];
	const warnings = [];
	const registry = knowledge.maturity?.skills ?? {};
	const patternIds = new Set();
	const skillNames = new Set();
	const patternsById = new Map();
	const skillsByName = new Map();

	for (const pattern of knowledge.patterns) {
		const owner = pattern.source ?? pattern.id ?? "pattern";
		if (pattern.schema_version !== 1 || pattern.kind !== "pattern") {
			errors.push(`${owner}: expected schema_version 1 and kind pattern`);
		}
		if (!/^pattern\.[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pattern.id ?? "")) {
			errors.push(`${owner}: invalid pattern id "${pattern.id}"`);
		}
		if (patternIds.has(pattern.id))
			errors.push(`${owner}: duplicate pattern id`);
		patternIds.add(pattern.id);
		if (!patternsById.has(pattern.id)) patternsById.set(pattern.id, pattern);
		if (basename(pattern.source ?? "", ".md") !== pattern.id?.slice(8)) {
			errors.push(`${owner}: filename must match pattern id`);
		}
		if (!PATTERN_STATUSES.has(pattern.status)) {
			errors.push(`${owner}: invalid status "${pattern.status}"`);
		}
		if (typeof pattern.title !== "string" || pattern.title.length === 0) {
			errors.push(`${owner}: title is required`);
		}
		if (typeof pattern.summary !== "string" || pattern.summary.length === 0) {
			errors.push(`${owner}: summary is required`);
		}
		validateEvidence(repository, owner, pattern.evidence, errors);
		if (!Array.isArray(pattern.skills) || pattern.skills.length === 0) {
			errors.push(`${owner}: skills must contain at least one relationship`);
		} else {
			for (const link of pattern.skills) {
				if (!registry[link?.name]) {
					errors.push(`${owner}: unknown skill "${link?.name}"`);
				}
				if (!SKILL_RELATIONSHIPS.has(link?.relationship)) {
					errors.push(
						`${owner}: invalid skill relationship "${link?.relationship}"`,
					);
				}
				if (!RELATIONSHIP_STATUSES.has(link?.status)) {
					errors.push(
						`${owner}: invalid skill relationship status "${link?.status}"`,
					);
				}
			}
		}
		if (!Array.isArray(pattern.supersedes)) {
			errors.push(`${owner}: supersedes must be an array`);
		}
	}

	for (const skill of knowledge.skills) {
		const owner = skill.source ?? skill.skill ?? "skill provenance";
		if (skill.schema_version !== 1 || skill.kind !== "skill") {
			errors.push(`${owner}: expected schema_version 1 and kind skill`);
		}
		if (!registry[skill.skill])
			errors.push(`${owner}: unknown skill "${skill.skill}"`);
		if (skillNames.has(skill.skill))
			errors.push(`${owner}: duplicate skill page`);
		skillNames.add(skill.skill);
		if (!skillsByName.has(skill.skill)) skillsByName.set(skill.skill, skill);
		if (basename(skill.source ?? "", ".md") !== skill.skill) {
			errors.push(`${owner}: filename must match skill name`);
		}
		if (typeof skill.summary !== "string" || skill.summary.length === 0) {
			errors.push(`${owner}: summary is required`);
		}
		if (!Array.isArray(skill.patterns)) {
			errors.push(`${owner}: patterns must be an array`);
		}
		if (!Array.isArray(skill.evidence)) {
			errors.push(`${owner}: evidence must be an array`);
		} else if (skill.evidence.length > 0) {
			validateEvidence(repository, owner, skill.evidence, errors);
		}
		if (!Array.isArray(skill.decisions)) {
			errors.push(`${owner}: decisions must be an array`);
		} else {
			for (const decision of skill.decisions) {
				const target = safeRepositoryPath(repository, decision);
				if (
					!target ||
					!existsSync(target) ||
					!resolvesInsideRepository(repository, target)
				) {
					errors.push(`${owner}: missing decision "${decision}"`);
				}
			}
		}
		if (!Array.isArray(skill.gaps)) {
			errors.push(`${owner}: gaps must be an array`);
		} else {
			for (const gap of skill.gaps) {
				if (
					typeof gap?.id !== "string" ||
					gap.id.length === 0 ||
					typeof gap?.description !== "string" ||
					gap.description.length === 0
				) {
					errors.push(`${owner}: every gap needs an id and description`);
				}
			}
		}
	}
	for (const name of Object.keys(registry)) {
		if (!skillNames.has(name)) {
			errors.push(
				`foundry/knowledge/skills: missing provenance page for "${name}"`,
			);
		}
	}

	for (const pattern of knowledge.patterns) {
		for (const superseded of pattern.supersedes ?? []) {
			if (!patternIds.has(superseded)) {
				errors.push(
					`${pattern.source}: unknown superseded pattern "${superseded}"`,
				);
			}
		}
		for (const link of pattern.skills ?? []) {
			const skill = skillsByName.get(link.name);
			if (skill && !(skill.patterns ?? []).includes(pattern.id)) {
				errors.push(
					`${pattern.source}: skill "${link.name}" does not link back to "${pattern.id}"`,
				);
			}
		}
	}
	for (const skill of knowledge.skills) {
		for (const pattern of skill.patterns ?? []) {
			if (!patternIds.has(pattern)) {
				errors.push(`${skill.source}: unknown pattern "${pattern}"`);
			} else if (
				!(patternsById.get(pattern)?.skills ?? []).some(
					(link) => link.name === skill.skill,
				)
			) {
				errors.push(
					`${skill.source}: pattern "${pattern}" does not link back to "${skill.skill}"`,
				);
			}
		}

		const maturity = registry[skill.skill]?.maturity;
		const applied = (skill.evidence ?? []).some(
			(entry) =>
				entry.relationship === "application" && entry.status === "active",
		);
		if (maturity && maturity !== "experimental" && !applied) {
			const message = `${skill.source}: ${maturity} maturity has no application evidence`;
			if (enforceMaturity) errors.push(message);
			else warnings.push(message);
		}
	}

	return { errors, warnings };
}

export function compileKnowledge(knowledge) {
	const registry = knowledge.maturity.skills;
	const patterns = knowledge.patterns
		.map(stablePattern)
		.sort((left, right) => left.id.localeCompare(right.id));
	const authoredSkills = new Map(
		knowledge.skills.map((skill) => [skill.skill, stableSkill(skill)]),
	);
	const skills = Object.keys(registry)
		.sort()
		.map((name) => {
			const provenance = authoredSkills.get(name);
			return {
				name,
				channel: registry[name].channel,
				maturity: registry[name].maturity,
				summary: registry[name].summary,
				provenance: provenance ?? null,
			};
		});
	const textualMatches = [...(knowledge.audit?.records ?? [])].sort(
		(left, right) =>
			`${left.skill}:${left.path}`.localeCompare(
				`${right.skill}:${right.path}`,
			),
	);
	const nodes = [
		...patterns.map((pattern) => ({
			id: pattern.id,
			kind: "pattern",
			status: pattern.status,
			title: pattern.title,
		})),
		...skills.map((skill) => ({
			id: `skill.${skill.name}`,
			kind: "skill",
			channel: skill.channel,
			maturity: skill.maturity,
		})),
	];
	const edges = patterns
		.flatMap((pattern) =>
			pattern.skills.map((skill) => ({
				from: pattern.id,
				to: `skill.${skill.name}`,
				relationship: skill.relationship,
			})),
		)
		.sort((left, right) =>
			`${left.from}:${left.to}:${left.relationship}`.localeCompare(
				`${right.from}:${right.to}:${right.relationship}`,
			),
		);
	return {
		schema_version: 1,
		patterns,
		skills,
		nodes,
		edges,
		textual_matches: textualMatches,
	};
}

export function renderKnowledge(compiled) {
	const patternLines = compiled.patterns.length
		? compiled.patterns.map(
				(pattern) =>
					`- [${pattern.id}](patterns/${pattern.id.slice(8)}.md): ${pattern.summary} Status: ${pattern.status}.`,
			)
		: ["No patterns authored yet."];
	const provenance = compiled.skills.filter((skill) => skill.provenance);
	const skillLines = provenance.length
		? provenance.map(
				(skill) =>
					`- [${skill.name}](skills/${skill.name}.md): ${skill.provenance.summary}`,
			)
		: ["No skill provenance pages authored yet."];
	const index = [
		"# Compiled knowledge index",
		"",
		"Generated by `bun scripts/compile-knowledge.mjs`. Do not edit by hand.",
		"",
		"## Patterns",
		"",
		...patternLines,
		"",
		"## Skill provenance",
		"",
		...skillLines,
		"",
	].join("\n");

	const coverageRows = compiled.skills.map((skill) => {
		const provenancePage = skill.provenance;
		const applications = provenancePage
			? provenancePage.evidence.filter(
					(entry) =>
						entry.relationship === "application" && entry.status === "active",
				).length
			: 0;
		const gaps = provenancePage?.gaps.length ?? 0;
		const auditedApplications = compiled.textual_matches.filter(
			(record) => record.skill === skill.name && record.supports_application,
		).length;
		const status = !provenancePage
			? "missing"
			: applications > 0
				? "supported"
				: gaps > 0
					? "gap"
					: "unsupported";
		return `| ${tableCell(skill.name)} | ${skill.channel} | ${skill.maturity} | ${status} | ${applications} | ${auditedApplications} | ${provenancePage?.patterns.length ?? 0} | ${gaps} |`;
	});
	const coverage = [
		"# Knowledge coverage",
		"",
		"Generated by `bun scripts/compile-knowledge.mjs`. Do not edit by hand.",
		"",
		"| Skill | Channel | Maturity | Provenance | Linked applications | Audited application sources | Patterns | Gaps |",
		"|---|---|---|---|---:|---:|---:|---:|",
		...coverageRows,
		"",
	].join("\n");

	return {
		"foundry/knowledge/index.md": index,
		"foundry/knowledge/coverage.md": coverage,
		"foundry/knowledge/graph.json": `${JSON.stringify(compiled, null, 2)}\n`,
		...(compiled.textual_matches.length > 0
			? {
					"foundry/knowledge/audits/2026-08-29-textual-match-coverage.md":
						summarizeTextualMatchAudit({ records: compiled.textual_matches }),
				}
			: {}),
	};
}
