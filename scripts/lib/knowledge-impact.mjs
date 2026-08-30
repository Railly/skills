import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	appendFileSync,
	existsSync,
	readFileSync,
	realpathSync,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";

const IMPACT_ID = /^impact\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const PATTERN_ID = /^pattern\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const OUTCOMES = new Set([
	"accepted",
	"rejected",
	"absorbed",
	"superseded",
	"no-change",
]);
const EVALUATION_RESULTS = new Set(["pass", "fail", "inconclusive"]);
const AUTHORITIES = new Set(["human", "deterministic-gate"]);
const REQUIRED_VARIANTS = new Set([
	"no-skill",
	"released-skill",
	"candidate-skill",
]);
const IMPACT_KEYS = new Set([
	"schema_version",
	"kind",
	"id",
	"skill",
	"summary",
	"sources",
	"candidate",
	"evaluation",
	"decision",
	"active_skill",
	"supersedes",
]);
const SOURCES_KEYS = new Set(["patterns", "no_action_reason"]);
const CANDIDATE_KEYS = new Set(["path", "digest"]);
const EVALUATION_KEYS = new Set(["path", "result", "variants", "summary"]);
const DECISION_KEYS = new Set(["outcome", "authority", "path", "rationale"]);
const ACTIVE_SKILL_KEYS = new Set(["path", "before_digest", "after_digest"]);
const CANDIDATE_PATH =
	/^foundry\/runs\/proposal-impact\/[a-z0-9]+(?:[.-][a-z0-9]+)*\/candidate\.patch$/;

export function sha256(content) {
	return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function fileDigest(path) {
	return sha256(readFileSync(path));
}

export function activeSkillPath(registry, skill) {
	const channel = registry[skill]?.channel;
	if (!channel) return null;
	return channel === "stable"
		? `skills/${skill}/SKILL.md`
		: `skills/.experimental/${skill}/SKILL.md`;
}

export function parseImpactLedger(text, source = "impact ledger") {
	return text
		.split("\n")
		.map((line, index) => ({ line: line.trim(), number: index + 1 }))
		.filter((entry) => entry.line.length > 0)
		.map((entry) => {
			try {
				return JSON.parse(entry.line);
			} catch (error) {
				throw new Error(
					`${source}:${entry.number}: malformed impact JSON: ${error.message}`,
				);
			}
		});
}

function trackedRepositoryPaths(repository) {
	return new Set(
		execFileSync("git", ["ls-files", "-z"], {
			cwd: repository,
			encoding: "utf8",
		})
			.split("\0")
			.filter(Boolean),
	);
}

function safeRepositoryPath(repository, value) {
	if (typeof value !== "string" || value.length === 0) return null;
	if (isAbsolute(value) || value.startsWith("../") || value.includes("/../")) {
		return null;
	}
	const target = resolve(repository, value);
	return target.startsWith(`${resolve(repository)}/`) ? target : null;
}

function validateArtifactPath({
	repository,
	trackedPaths,
	value,
	label,
	errors,
}) {
	const target = safeRepositoryPath(repository, value);
	if (!target || !value.startsWith("foundry/")) {
		errors.push(`${label} must use a safe Foundry-relative path`);
		return null;
	}
	if (!existsSync(target)) {
		errors.push(`${label} references missing path "${value}"`);
		return null;
	}
	if (!realpathSync(target).startsWith(`${realpathSync(repository)}/`)) {
		errors.push(`${label} resolves outside the repository`);
		return null;
	}
	if (!trackedPaths.has(value)) {
		errors.push(`${label} must reference a tracked repository file`);
		return null;
	}
	return target;
}

function validateText(value, label, errors) {
	if (typeof value !== "string" || value.trim().length === 0) {
		errors.push(`${label} is required`);
	}
}

function validateKeys(value, allowed, label, errors) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		errors.push(`${label} must be an object`);
		return;
	}
	for (const key of Object.keys(value)) {
		if (!allowed.has(key))
			errors.push(`${label} contains unknown field "${key}"`);
	}
}

function validateCandidatePatch(path, expectedSkillPath, owner, errors) {
	const text = readFileSync(path, "utf8");
	const diffHeaders = [...text.matchAll(/^diff --git a\/(.+) b\/(.+)$/gm)];
	if (diffHeaders.length !== 1) {
		errors.push(`${owner}: candidate patch must contain exactly one file diff`);
		return;
	}
	const [, before, after] = diffHeaders[0];
	if (before !== expectedSkillPath || after !== expectedSkillPath) {
		errors.push(
			`${owner}: candidate patch must target only "${expectedSkillPath}"`,
		);
	}
	if (
		!text.includes(`--- a/${expectedSkillPath}\n`) ||
		!text.includes(`+++ b/${expectedSkillPath}\n`)
	) {
		errors.push(`${owner}: candidate patch has invalid skill file headers`);
	}
	if (!/^@@ /m.test(text)) {
		errors.push(`${owner}: candidate patch must contain a unified diff hunk`);
	}
}

export function validateImpactLedger(
	repository,
	impacts,
	{ registry, patterns = [] } = {},
) {
	const errors = [];
	const trackedPaths = trackedRepositoryPaths(repository);
	const patternIds = new Set(patterns.map((pattern) => pattern.id));
	const impactIds = new Set();
	const candidateDigests = new Set();
	const previousSkillDigest = new Map();

	if (!Array.isArray(impacts)) {
		return { errors: ["impact ledger must contain an array of records"] };
	}

	for (const [index, impact] of impacts.entries()) {
		const owner = `foundry/knowledge/impact.jsonl:${index + 1}`;
		validateKeys(impact, IMPACT_KEYS, owner, errors);
		if (impact?.schema_version !== 1 || impact?.kind !== "skill-impact") {
			errors.push(`${owner}: expected schema_version 1 and kind skill-impact`);
		}
		if (!IMPACT_ID.test(impact?.id ?? "")) {
			errors.push(`${owner}: invalid impact id "${impact?.id}"`);
		}
		if (impactIds.has(impact?.id)) errors.push(`${owner}: duplicate impact id`);
		impactIds.add(impact?.id);
		if (!registry?.[impact?.skill]) {
			errors.push(`${owner}: unknown target skill "${impact?.skill}"`);
		}
		validateText(impact?.summary, `${owner}: summary`, errors);

		const sources = impact?.sources;
		validateKeys(sources, SOURCES_KEYS, `${owner}: sources`, errors);
		if (!sources || !Array.isArray(sources.patterns)) {
			errors.push(`${owner}: sources.patterns must be an array`);
		} else {
			for (const pattern of sources.patterns) {
				if (!PATTERN_ID.test(pattern) || !patternIds.has(pattern)) {
					errors.push(`${owner}: unknown source pattern "${pattern}"`);
				}
			}
		}
		if ((sources?.patterns?.length ?? 0) === 0) {
			validateText(
				sources?.no_action_reason,
				`${owner}: sources.no_action_reason`,
				errors,
			);
		}

		const outcome = impact?.decision?.outcome;
		validateKeys(impact?.decision, DECISION_KEYS, `${owner}: decision`, errors);
		if (!OUTCOMES.has(outcome)) {
			errors.push(`${owner}: invalid decision outcome "${outcome}"`);
		}
		if (!AUTHORITIES.has(impact?.decision?.authority)) {
			errors.push(
				`${owner}: invalid decision authority "${impact?.decision?.authority}"`,
			);
		}
		validateText(impact?.decision?.rationale, `${owner}: rationale`, errors);
		validateArtifactPath({
			repository,
			trackedPaths,
			value: impact?.decision?.path,
			label: `${owner}: decision.path`,
			errors,
		});

		const candidate = impact?.candidate;
		if (outcome === "no-change") {
			if (candidate !== null) {
				errors.push(`${owner}: no-change requires candidate null`);
			}
		} else if (!candidate) {
			errors.push(`${owner}: ${outcome} requires a candidate artifact`);
		}
		if (candidate) {
			validateKeys(candidate, CANDIDATE_KEYS, `${owner}: candidate`, errors);
			if (!CANDIDATE_PATH.test(candidate.path ?? "")) {
				errors.push(
					`${owner}: candidate.path must be a proposal-impact candidate.patch`,
				);
			}
			if (!DIGEST.test(candidate.digest ?? "")) {
				errors.push(`${owner}: candidate.digest must be sha256`);
			}
			if (candidateDigests.has(candidate.digest)) {
				errors.push(`${owner}: duplicate candidate diff identity`);
			}
			candidateDigests.add(candidate.digest);
			const candidatePath = validateArtifactPath({
				repository,
				trackedPaths,
				value: candidate.path,
				label: `${owner}: candidate.path`,
				errors,
			});
			if (candidatePath && DIGEST.test(candidate.digest ?? "")) {
				const actual = fileDigest(candidatePath);
				if (actual !== candidate.digest) {
					errors.push(`${owner}: candidate digest does not match its artifact`);
				}
				const expectedSkillPath = activeSkillPath(
					registry ?? {},
					impact?.skill,
				);
				if (expectedSkillPath) {
					validateCandidatePatch(
						candidatePath,
						expectedSkillPath,
						owner,
						errors,
					);
				}
			}
		}

		const evaluation = impact?.evaluation;
		validateKeys(evaluation, EVALUATION_KEYS, `${owner}: evaluation`, errors);
		if (!evaluation || !EVALUATION_RESULTS.has(evaluation.result)) {
			errors.push(
				`${owner}: evaluation.result must be pass, fail, or inconclusive`,
			);
		}
		if (!Array.isArray(evaluation?.variants)) {
			errors.push(`${owner}: evaluation.variants must be an array`);
		}
		const variants = new Set(
			Array.isArray(evaluation?.variants) ? evaluation.variants : [],
		);
		for (const required of REQUIRED_VARIANTS) {
			if (!variants.has(required)) {
				errors.push(`${owner}: evaluation is missing ${required} variant`);
			}
		}
		validateText(evaluation?.summary, `${owner}: evaluation.summary`, errors);
		validateArtifactPath({
			repository,
			trackedPaths,
			value: evaluation?.path,
			label: `${owner}: evaluation.path`,
			errors,
		});
		if (outcome === "accepted") {
			if (impact?.decision?.authority !== "human") {
				errors.push(`${owner}: accepted impact requires human authority`);
			}
			if (evaluation?.result !== "pass") {
				errors.push(`${owner}: accepted impact requires a passing evaluation`);
			}
		}

		const active = impact?.active_skill;
		validateKeys(active, ACTIVE_SKILL_KEYS, `${owner}: active_skill`, errors);
		const expectedPath = activeSkillPath(registry ?? {}, impact?.skill);
		if (!active || active.path !== expectedPath) {
			errors.push(`${owner}: active_skill.path must be "${expectedPath}"`);
		}
		if (!DIGEST.test(active?.before_digest ?? "")) {
			errors.push(`${owner}: active_skill.before_digest must be sha256`);
		}
		if (!DIGEST.test(active?.after_digest ?? "")) {
			errors.push(`${owner}: active_skill.after_digest must be sha256`);
		}
		if (
			outcome === "accepted" &&
			active?.before_digest === active?.after_digest
		) {
			errors.push(
				`${owner}: accepted impact must change the active skill digest`,
			);
		}
		if (
			["rejected", "absorbed", "superseded", "no-change"].includes(outcome) &&
			active?.before_digest !== active?.after_digest
		) {
			errors.push(`${owner}: ${outcome} cannot change the active skill digest`);
		}
		const priorDigest = previousSkillDigest.get(impact?.skill);
		if (priorDigest && active?.before_digest !== priorDigest) {
			errors.push(
				`${owner}: active skill digest does not continue prior history`,
			);
		}
		if (DIGEST.test(active?.after_digest ?? "")) {
			previousSkillDigest.set(impact?.skill, active.after_digest);
		}

		if (!Array.isArray(impact?.supersedes)) {
			errors.push(`${owner}: supersedes must be an array`);
		} else {
			for (const prior of impact.supersedes) {
				if (!impactIds.has(prior) || prior === impact.id) {
					errors.push(`${owner}: supersedes unknown prior impact "${prior}"`);
				}
			}
		}
		if (outcome === "superseded" && impact?.supersedes?.length === 0) {
			errors.push(`${owner}: superseded outcome requires a prior impact`);
		}
	}

	for (const [skill, digest] of previousSkillDigest.entries()) {
		const path = activeSkillPath(registry, skill);
		const target = path ? resolve(repository, path) : null;
		if (target && existsSync(target) && fileDigest(target) !== digest) {
			errors.push(
				`foundry/knowledge/impact.jsonl: latest impact for "${skill}" does not match the active skill digest`,
			);
		}
	}

	return { errors };
}

export function stableImpact(impact) {
	return {
		schema_version: impact.schema_version,
		kind: impact.kind,
		id: impact.id,
		skill: impact.skill,
		summary: impact.summary,
		sources: {
			patterns: [...(impact.sources?.patterns ?? [])].sort(),
			no_action_reason: impact.sources?.no_action_reason ?? null,
		},
		candidate: impact.candidate
			? {
					path: impact.candidate.path,
					digest: impact.candidate.digest,
				}
			: null,
		evaluation: {
			path: impact.evaluation?.path,
			result: impact.evaluation?.result,
			variants: [...(impact.evaluation?.variants ?? [])].sort(),
			summary: impact.evaluation?.summary,
		},
		decision: {
			outcome: impact.decision?.outcome,
			authority: impact.decision?.authority,
			path: impact.decision?.path,
			rationale: impact.decision?.rationale,
		},
		active_skill: {
			path: impact.active_skill?.path,
			before_digest: impact.active_skill?.before_digest,
			after_digest: impact.active_skill?.after_digest,
		},
		supersedes: [...(impact.supersedes ?? [])].sort(),
	};
}

function canonicalJson(value) {
	if (Array.isArray(value)) {
		return `[${value.map(canonicalJson).join(",")}]`;
	}
	if (value && typeof value === "object") {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}

export function buildProposalPacket(repository, knowledge, skillName) {
	const registry = knowledge.maturity.skills;
	const catalog = registry[skillName];
	const provenance = knowledge.skills.find(
		(entry) => entry.skill === skillName,
	);
	if (!catalog || !provenance) {
		throw new Error(`unknown registered skill "${skillName}"`);
	}
	const path = activeSkillPath(registry, skillName);
	const activePath = resolve(repository, path);
	const patterns = provenance.patterns
		.map((id) => knowledge.patterns.find((pattern) => pattern.id === id))
		.filter(Boolean)
		.sort((left, right) => left.id.localeCompare(right.id));
	const evidence = [
		...(provenance.evidence ?? []),
		...patterns.flatMap((pattern) => pattern.evidence ?? []),
	]
		.map((entry) => ({
			path: entry.path,
			relationship: entry.relationship,
			visibility: entry.visibility,
			status: entry.status,
		}))
		.filter(
			(entry, index, entries) =>
				entries.findIndex(
					(candidate) =>
						candidate.path === entry.path &&
						candidate.relationship === entry.relationship &&
						candidate.status === entry.status,
				) === index,
		)
		.sort((left, right) =>
			`${left.path}:${left.relationship}`.localeCompare(
				`${right.path}:${right.relationship}`,
			),
		);
	const auditRecords = (knowledge.audit?.records ?? []).filter(
		(record) => record.skill === skillName,
	);
	const verdicts = auditRecords.reduce((counts, record) => {
		counts[record.classification] = (counts[record.classification] ?? 0) + 1;
		return counts;
	}, {});

	return {
		schema_version: 1,
		kind: "proposal-packet",
		skill: skillName,
		active_skill: {
			path,
			digest: fileDigest(activePath),
		},
		catalog: {
			channel: catalog.channel,
			maturity: catalog.maturity,
			summary: catalog.summary,
		},
		provenance: {
			source: provenance.source,
			summary: provenance.summary,
			patterns: [...provenance.patterns].sort(),
			decisions: [...provenance.decisions].sort(),
			gaps: [...provenance.gaps].sort((left, right) =>
				left.id.localeCompare(right.id),
			),
		},
		patterns: patterns.map((pattern) => ({
			id: pattern.id,
			title: pattern.title,
			status: pattern.status,
			summary: pattern.summary,
			source: pattern.source,
		})),
		impact_history: knowledge.impacts
			.filter((impact) => impact.skill === skillName)
			.map(stableImpact),
		catalog_outcomes: {
			reviewed_matches: auditRecords.length,
			verdicts: Object.fromEntries(
				Object.entries(verdicts).sort(([left], [right]) =>
					left.localeCompare(right),
				),
			),
		},
		source_evidence: evidence,
	};
}

export function recordImpact(repository, knowledge, proposed) {
	const validationOptions = {
		registry: knowledge.maturity.skills,
		patterns: knowledge.patterns,
	};
	const currentValidation = validateImpactLedger(
		repository,
		knowledge.impacts,
		validationOptions,
	);
	if (currentValidation.errors.length > 0) {
		throw new Error(currentValidation.errors.join("\n"));
	}
	const proposedValidation = validateImpactLedger(
		repository,
		[proposed],
		validationOptions,
	);
	if (proposedValidation.errors.length > 0) {
		throw new Error(proposedValidation.errors.join("\n"));
	}
	const existing = knowledge.impacts.find(
		(impact) => impact.id === proposed?.id,
	);
	if (
		existing &&
		canonicalJson(stableImpact(existing)) ===
			canonicalJson(stableImpact(proposed))
	) {
		return { appended: false, impacts: knowledge.impacts };
	}
	const validation = validateImpactLedger(
		repository,
		[...knowledge.impacts, proposed],
		validationOptions,
	);
	if (validation.errors.length > 0) {
		throw new Error(validation.errors.join("\n"));
	}
	const normalized = stableImpact(proposed);
	const ledgerPath = resolve(
		repository,
		"foundry",
		"knowledge",
		"impact.jsonl",
	);
	const prior = existsSync(ledgerPath) ? readFileSync(ledgerPath, "utf8") : "";
	const prefix = prior.length > 0 && !prior.endsWith("\n") ? "\n" : "";
	appendFileSync(ledgerPath, `${prefix}${canonicalJson(normalized)}\n`);
	const recorded = parseImpactLedger(readFileSync(ledgerPath, "utf8"));
	if (recorded.at(-1)?.id !== normalized.id) {
		throw new Error("impact append did not produce the expected final record");
	}
	return { appended: true, impacts: recorded };
}
