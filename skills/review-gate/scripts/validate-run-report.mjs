import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

const reportPath = process.argv[2] ? resolve(process.argv[2]) : "";
const structuralOnly = process.argv.includes("--structural");
if (!reportPath) {
	console.error("ERROR [report] run report path is required");
	process.exit(2);
}

let report;
try {
	report = JSON.parse(readFileSync(reportPath, "utf8"));
} catch (error) {
	console.error(`ERROR [report] cannot read JSON: ${error.message}`);
	process.exit(2);
}

const findings = [];
const text = (value) => typeof value === "string" && value.trim() !== "";
const requireText = (value, label) => {
	if (!text(value)) findings.push(`${label} is required`);
};
const requireArray = (value, label) => {
	if (!Array.isArray(value)) findings.push(`${label} must be an array`);
};
const localArtifact = (value, label) => {
	requireText(value, label);
	if (!text(value)) return null;
	if (/^https?:\/\//.test(value)) {
		findings.push(
			`${label} must be a local auditable file, not an unchecked URL`,
		);
		return null;
	}
	const path = resolve(dirname(reportPath), value);
	if (!existsSync(path) || !statSync(path).isFile()) {
		findings.push(`${label} does not exist as a file: ${path}`);
		return null;
	} else if (statSync(path).size === 0) {
		findings.push(`${label} is empty: ${path}`);
		return null;
	}
	return path;
};

if (report.schemaVersion !== 1) findings.push("schemaVersion must be 1");
if (report?.run?.status !== "complete") {
	findings.push("run.status must be complete before the gate can pass");
}
if (report?.run?.verdict !== "pass") {
	findings.push("run.verdict must be pass before the gate can pass");
}
if (!Array.isArray(report?.run?.gaps)) {
	findings.push("run.gaps must be an array");
} else if (report.run.gaps.length > 0) {
	findings.push("a pass report cannot contain run gaps");
}
if (
	!["mechanical", "standard", "high-risk", "external-pr"].includes(
		report?.run?.profile,
	)
) {
	findings.push("run.profile is invalid");
}
requireText(report?.run?.skill_revision, "run.skill_revision");

const execution = report?.execution;
const executionModes = [
	"native_subagent",
	"fx_worker",
	"herdr_worker",
	"sequential_isolated",
	"single_context",
	"unavailable",
];
if (!execution || !executionModes.includes(execution.mode)) {
	findings.push("execution.mode is invalid");
} else {
	if (
		execution.degraded_from !== null &&
		!executionModes.includes(execution.degraded_from)
	) {
		findings.push("execution.degraded_from is invalid");
	}
	if (execution.mode === "fx_worker") {
		const receiptPath = localArtifact(execution.receipt, "execution.receipt");
		if (receiptPath) {
			try {
				const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
				const expected = {
					kind: "fx-review",
					runtime: "fx_worker",
					provider: "vercel-ai-gateway",
					auth: "AI_GATEWAY_API_KEY",
					credential_source: "macos-keychain",
					status: "complete",
					exit_code: 0,
					timed_out: false,
				};
				for (const [field, value] of Object.entries(expected)) {
					if (receipt[field] !== value) {
						findings.push(
							`execution.receipt ${field} must equal ${JSON.stringify(value)}`,
						);
					}
				}
			} catch (error) {
				findings.push(
					`execution.receipt must contain valid JSON: ${error.message}`,
				);
			}
		}
	}
	if (
		["sequential_isolated", "single_context", "unavailable"].includes(
			execution.mode,
		) &&
		!text(execution.independence_gap)
	) {
		findings.push("degraded execution must name the independence gap");
	}
	if (
		!Number.isInteger(execution.schema_failures) ||
		execution.schema_failures < 0 ||
		execution.schema_failures > 3
	) {
		findings.push("execution.schema_failures must be 0 through 3");
	}
	if (!Array.isArray(execution.operations)) {
		findings.push("execution.operations must be an array");
	} else {
		let schemaFailures = 0;
		for (const [index, operation] of execution.operations.entries()) {
			const label = `execution.operations[${index}]`;
			requireText(operation?.operation, `${label}.operation`);
			if (
				!Number.isInteger(operation?.attempted_calls) ||
				operation.attempted_calls < 0
			) {
				findings.push(`${label}.attempted_calls must be non-negative`);
			}
			if (
				!Number.isInteger(operation?.schema_failures) ||
				operation.schema_failures < 0 ||
				operation.schema_failures > 1
			) {
				findings.push(`${label}.schema_failures must be 0 or 1`);
			}
			if (operation?.identical_retry !== false) {
				findings.push(`${label}.identical_retry must be false`);
			}
			schemaFailures += operation?.schema_failures ?? 0;
		}
		if (schemaFailures !== execution.schema_failures) {
			findings.push("execution.schema_failures must equal the operation total");
		}
	}
}

const diffSignals = {
	highRisk: [],
	security: [],
	sideEffects: [],
	behavioral: [],
};
if (!structuralOnly) {
	try {
		const repositoryHead = execFileSync("git", ["rev-parse", "HEAD"], {
			encoding: "utf8",
		}).trim();
		const reportHead = execFileSync("git", ["rev-parse", report.run.head], {
			encoding: "utf8",
		}).trim();
		if (repositoryHead !== reportHead) {
			findings.push(
				`report head ${reportHead} does not match checkout HEAD ${repositoryHead}`,
			);
		}
		execFileSync(
			"git",
			["rev-parse", "--verify", `${report.run.base}^{commit}`],
			{
				stdio: "ignore",
			},
		);
		const files = execFileSync(
			"git",
			["diff", "--name-only", report.run.base, report.run.head],
			{ encoding: "utf8" },
		)
			.split("\n")
			.filter(
				(file) =>
					file &&
					!/(^|\/)(__tests__|tests?|spec|fixtures?|docs?)(\/|$)/i.test(file) &&
					!/\.(md|mdx|json|lock|snap|map)$/.test(file),
			);
		for (const file of files) {
			const added = execFileSync(
				"git",
				["diff", "--unified=0", report.run.base, report.run.head, "--", file],
				{ encoding: "utf8" },
			)
				.split("\n")
				.filter((line) => line.startsWith("+") && !line.startsWith("+++"))
				.join("\n");
			if (
				/(^|\/)(protocol|parser|serializer|codec|encoder|decoder|state[-_]?machine|adapter|compat|keyboard|mouse)(\/|[-_.])/i.test(
					file,
				) ||
				/\b(KeyboardEvent|MouseEvent|PointerEvent|keydown|keyup|mousedown|mouseup|encode|decode|serialize|deserialize|state machine|state transition|protocol flags?)\b/i.test(
					added,
				)
			) {
				diffSignals.behavioral.push(file);
			}
			if (
				/\b(secret|private[_-]?key|credential|password|token|authentication|authorization|permission|access[_ -]?control|acl|encrypt|certificate)\b/i.test(
					added,
				)
			) {
				diffSignals.highRisk.push(`${file}: security-sensitive state`);
				diffSignals.security.push(`${file}: security-sensitive state`);
			}
			if (
				/\b(writeFile(?:Sync)?|appendFile(?:Sync)?|createWriteStream|rename(?:Sync)?|link(?:Sync)?|symlink(?:Sync)?|unlink(?:Sync)?|mkdir(?:Sync)?|File::create|fs::write|std::fs::|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|\.persist\s*\(|\.save\s*\()\b/i.test(
					added,
				) ||
				/\b(listen\s*\(|serve\s*\(|spawn\s*\(|exec(?:File)?\s*\(|fork\s*\()/.test(
					added,
				) ||
				/\bfetch\s*\([\s\S]{0,800}\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(
					added,
				)
			) {
				diffSignals.highRisk.push(`${file}: durable or external side effect`);
				diffSignals.sideEffects.push(file);
			}
		}
	} catch (error) {
		findings.push(
			`cannot inspect the exact base-to-head diff in this checkout: ${error.message}`,
		);
	}
}

const risk = report?.risk;
if (!risk || !["standard", "high"].includes(risk.level)) {
	findings.push("risk.level must be standard or high");
} else {
	requireArray(risk.triggers, "risk.triggers");
	if (risk.level === "high" && risk.triggers?.length === 0) {
		findings.push("high-risk work must name at least one risk trigger");
	}
}
if (risk?.level === "high") {
	if (risk.independent_challenge?.required !== true) {
		findings.push("high-risk work must require an independent challenge");
	}
	if (risk.independent_challenge?.satisfied !== true) {
		findings.push("high-risk work lacks an independent challenge");
	}
	if (
		![
			"cross_family_review",
			"human_review",
			"reference_oracle",
			"substrate_corpus",
		].includes(risk.independent_challenge?.method)
	) {
		findings.push("high-risk work has no valid independent challenge method");
	}
	localArtifact(
		risk.independent_challenge?.artifact,
		"independent challenge artifact",
	);
	requireText(
		risk.independent_challenge?.evidence,
		"risk.independent_challenge.evidence",
	);
}

const requiredSources = ["contract", "design", "user_facing", "implementation"];
if (!Array.isArray(report?.claim_inventory)) {
	findings.push("claim_inventory must be an array");
} else {
	for (const source of requiredSources) {
		const matches = report.claim_inventory.filter(
			(item) => item?.source === source,
		);
		if (matches.length !== 1) {
			findings.push(
				`claim_inventory must contain source class once: ${source}`,
			);
			continue;
		}
		const item = matches[0];
		if (!["reviewed", "not_provided", "not_applicable"].includes(item.status)) {
			findings.push(`claim source ${source} has an invalid status`);
		}
		requireText(item.location, `claim source ${source}.location`);
		requireText(item.evidence, `claim source ${source}.evidence`);
		requireArray(item.properties, `claim source ${source}.properties`);
		if (item.status === "reviewed" && item.properties?.length === 0) {
			findings.push(
				`claim source ${source} is reviewed but maps to no property`,
			);
		}
	}
}

const highRiskKinds = new Set([
	"confidentiality",
	"integrity",
	"authorization",
	"durability",
	"atomicity",
	"lifecycle",
]);
const propertyIds = new Set();
if (!Array.isArray(report?.properties) || report.properties.length === 0) {
	findings.push("properties must contain every material changed property");
} else {
	for (const property of report.properties) {
		const label = `property ${property?.id || "<missing-id>"}`;
		requireText(property?.id, `${label}.id`);
		requireText(property?.claim, `${label}.claim`);
		if (propertyIds.has(property?.id))
			findings.push(`${label}.id is duplicated`);
		propertyIds.add(property?.id);
		if (property?.status !== "verified")
			findings.push(`${label} is not verified`);
		if (property?.oracle?.proxy_only !== false) {
			findings.push(`${label} relies on proxy-only evidence`);
		}
		for (const field of ["observes", "layer", "method"]) {
			requireText(property?.oracle?.[field], `${label}.oracle.${field}`);
		}
		if (property?.proxy_challenge?.attempted !== true) {
			findings.push(`${label} proxy challenge was not attempted`);
		}
		if (
			!["separated", "not_separated"].includes(
				property?.proxy_challenge?.outcome,
			)
		) {
			findings.push(`${label} proxy challenge has no valid outcome`);
		}
		for (const field of ["proxy", "counterexample", "evidence"]) {
			requireText(
				property?.proxy_challenge?.[field],
				`${label}.proxy_challenge.${field}`,
			);
		}
		if (
			!Array.isArray(property?.substrates) ||
			property.substrates.length === 0
		) {
			findings.push(`${label} has no substrate or environment evidence`);
		} else {
			for (const substrate of property.substrates) {
				if (substrate?.status !== "exercised") {
					findings.push(`${label} has an unexercised substrate`);
				}
				requireText(substrate?.name, `${label}.substrate.name`);
				requireText(substrate?.evidence, `${label}.substrate.evidence`);
			}
		}
		requireText(property?.evidence, `${label}.evidence`);
	}
}
for (const source of report?.claim_inventory ?? []) {
	for (const id of source?.properties ?? []) {
		if (!propertyIds.has(id)) {
			findings.push(`claim_inventory references missing property: ${id}`);
		}
	}
}
const propertySignalsHighRisk = (report?.properties ?? []).some((property) =>
	highRiskKinds.has(property?.kind),
);
if (
	(diffSignals.highRisk.length > 0 || propertySignalsHighRisk) &&
	risk?.level !== "high"
) {
	findings.push(
		"diff or property signals high risk but risk.level is not high",
	);
}
if (report?.run?.profile === "high-risk" && risk?.level !== "high") {
	findings.push("high-risk profile requires risk.level high");
}

const securityKinds = new Set([
	"confidentiality",
	"integrity",
	"authorization",
]);
const securityPropertySignals = (report?.properties ?? []).some((property) =>
	securityKinds.has(property?.kind),
);
const securityRiskSignals = (risk?.triggers ?? []).some((trigger) =>
	/\b(auth(?:entication|orization)?|credential|secret|token|password|confidentiality|integrity|origin|tenant|sandbox|privilege|injection|deserializ)/i.test(
		String(trigger),
	),
);
const securityReviewRequired =
	diffSignals.security.length > 0 ||
	securityPropertySignals ||
	securityRiskSignals;
const securityReview = report?.security_review;
if (securityReviewRequired && !securityReview) {
	findings.push("security-sensitive work requires a security_review receipt");
}
if (securityReview) {
	const fingerprint = securityReview.fingerprint;
	requireText(
		fingerprint?.repository,
		"security_review.fingerprint.repository",
	);
	requireText(
		fingerprint?.dirty_digest,
		"security_review.fingerprint.dirty_digest",
	);
	requireText(
		fingerprint?.changed_path_digest,
		"security_review.fingerprint.changed_path_digest",
	);
	requireText(
		fingerprint?.skill_revision,
		"security_review.fingerprint.skill_revision",
	);
	if (fingerprint?.base_sha !== report?.run?.base) {
		findings.push("security_review receipt base does not match run.base");
	}
	if (fingerprint?.head_sha !== report?.run?.head) {
		findings.push("security_review receipt head does not match run.head");
	}
	if (securityReview.status !== "pass") {
		findings.push(
			`security_review status is not pass: ${securityReview.status || "<missing>"}`,
		);
	}
	requireText(securityReview.artifact, "security_review.artifact");
	if (!Array.isArray(securityReview.verification?.gaps)) {
		findings.push("security_review.verification.gaps must be an array");
	} else if (securityReview.verification.gaps.length > 0) {
		findings.push("security_review has unresolved verification gaps");
	}
	if (!Array.isArray(securityReview.merge_relevance?.security_blockers)) {
		findings.push(
			"security_review.merge_relevance.security_blockers must be an array",
		);
	} else if (securityReview.merge_relevance.security_blockers.length > 0) {
		findings.push("security_review has unresolved security blockers");
	}
	if (!Array.isArray(securityReview.observations)) {
		findings.push("security_review.observations must be an array");
	} else {
		const classifications = new Set([
			"confirmed_vulnerability",
			"likely_vulnerability",
			"hardening",
			"non_security_defect",
			"informational",
			"verification_gap",
		]);
		const scopes = new Set([
			"in_scope_security_regression",
			"adjacent_security_blocker",
			"out_of_scope_hardening",
			"unrelated_bug",
		]);
		for (const observation of securityReview.observations) {
			const label = `security observation ${observation?.id || "<missing-id>"}`;
			requireText(observation?.id, `${label}.id`);
			if (!classifications.has(observation?.classification)) {
				findings.push(`${label} has an invalid classification`);
			}
			if (!scopes.has(observation?.scope)) {
				findings.push(`${label} has an invalid scope`);
			}
			if (!["high", "medium", "low"].includes(observation?.confidence)) {
				findings.push(`${label} has an invalid confidence`);
			}
			if (
				!Array.isArray(observation?.evidence) ||
				observation.evidence.length === 0
			) {
				findings.push(`${label} has no evidence`);
			}
			if (observation?.classification === "verification_gap") {
				findings.push(`${label} is an unresolved verification gap`);
			}
			if (
				["confirmed_vulnerability", "likely_vulnerability"].includes(
					observation?.classification,
				) &&
				["in_scope_security_regression", "adjacent_security_blocker"].includes(
					observation?.scope,
				)
			) {
				findings.push(`${label} is a blocking security finding`);
			}
		}
	}
}

if (!Array.isArray(report?.assumptions)) {
	findings.push("assumptions must be present, even when empty");
} else {
	for (const assumption of report.assumptions) {
		const label = `assumption ${assumption?.id || "<missing-id>"}`;
		for (const field of ["id", "source", "claim", "evidence"]) {
			requireText(assumption?.[field], `${label}.${field}`);
		}
		if (assumption?.status !== "verified") {
			findings.push(`${label} is ${assumption?.status || "missing status"}`);
		}
	}
}

function validateFingerprint(receipt, label) {
	const fingerprint = receipt?.fingerprint;
	if (!fingerprint || typeof fingerprint !== "object") {
		findings.push(`${label}.fingerprint is required`);
		return;
	}
	for (const field of [
		"head_sha",
		"changed_paths_digest",
		"contract_digest",
		"command",
		"environment_digest",
		"skill_revision",
	]) {
		requireText(fingerprint[field], `${label}.fingerprint.${field}`);
	}
	requireArray(
		fingerprint.relevant_paths,
		`${label}.fingerprint.relevant_paths`,
	);
	if (fingerprint.skill_revision !== receipt.skill_revision) {
		findings.push(`${label} fingerprint skill revision does not match receipt`);
	}
	if (fingerprint.head_sha !== report?.run?.head) {
		if (fingerprint.reusable !== true || !text(fingerprint.reuse_evidence)) {
			findings.push(`${label} is stale for the reviewed head`);
			return;
		}
		const reuse = fingerprint.reuse;
		if (!reuse || typeof reuse !== "object" || Array.isArray(reuse)) {
			findings.push(`${label} reusable fingerprint needs a reuse record`);
			return;
		}
		for (const field of ["source_head_sha", "target_head_sha"]) {
			requireText(reuse[field], `${label}.fingerprint.reuse.${field}`);
		}
		requireArray(
			reuse.changed_paths,
			`${label}.fingerprint.reuse.changed_paths`,
		);
		if (reuse.source_head_sha !== fingerprint.head_sha) {
			findings.push(`${label} reuse source does not match receipt head`);
		}
		if (reuse.target_head_sha !== report?.run?.head) {
			findings.push(`${label} reuse target does not match reviewed head`);
		}
		for (const field of [
			"contract_digest",
			"environment_digest",
			"skill_revision",
		]) {
			if (reuse[field] !== fingerprint[field]) {
				findings.push(`${label} reuse changed ${field}`);
			}
		}
		const normalize = (value) => value.replace(/^\.\//, "").replace(/\/+$/, "");
		for (const changed of reuse.changed_paths ?? []) {
			for (const relevant of fingerprint.relevant_paths ?? []) {
				const a = normalize(changed);
				const b = normalize(relevant);
				if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) {
					findings.push(`${label} reuse intersects relevant path ${relevant}`);
				}
			}
		}
	} else if (fingerprint.reusable || fingerprint.reuse != null) {
		findings.push(`${label} reuse is only valid across different heads`);
	}
}

function validateReceiptIdentity(receipt, label) {
	if (!receipt || typeof receipt !== "object") {
		findings.push(`${label} is required`);
		return false;
	}
	if (receipt.required !== true && receipt.required !== false) {
		findings.push(`${label}.required must be boolean`);
	}
	if (
		!["pass", "not_triggered", "unavailable", "fail"].includes(receipt.status)
	) {
		findings.push(`${label}.status is invalid`);
	}
	if (receipt.required && receipt.status !== "pass") {
		findings.push(`${label} is required but did not pass`);
	}
	if (receipt.status === "pass") {
		requireText(receipt.skill_revision, `${label}.skill_revision`);
		localArtifact(receipt.artifact, `${label}.artifact`);
		requireText(receipt.evidence, `${label}.evidence`);
		validateFingerprint(receipt, label);
	} else {
		requireText(receipt.reason, `${label}.reason`);
	}
	return receipt.status === "pass";
}

const testStrength = report?.stage_receipts?.test_strength;
const testStrengthPassed = validateReceiptIdentity(
	testStrength,
	"stage_receipts.test_strength",
);
if (diffSignals.behavioral.length > 0 && testStrength?.required !== true) {
	findings.push(
		"diff signals mandatory behavioral strength but Test Strength receipt is not required",
	);
}
if (testStrengthPassed && testStrength.required) {
	if (
		!Array.isArray(testStrength.dimensions?.values) ||
		testStrength.dimensions.values.length === 0
	) {
		findings.push(
			"required behavioral strength must record explicit dimensions",
		);
	}
	requireArray(
		testStrength.dimensions?.exclusions,
		"stage_receipts.test_strength.dimensions.exclusions",
	);
	requireText(
		testStrength.dimensions?.evidence,
		"stage_receipts.test_strength.dimensions.evidence",
	);
	if (testStrength.oracle?.independent !== true) {
		findings.push(
			"required behavioral strength needs an oracle independent of production",
		);
	}
	requireText(
		testStrength.oracle?.source,
		"stage_receipts.test_strength.oracle.source",
	);
	requireText(
		testStrength.oracle?.evidence,
		"stage_receipts.test_strength.oracle.evidence",
	);
	if (testStrength.producer?.status !== "exercised") {
		findings.push(
			"required behavioral strength must exercise the real input producer",
		);
	}
	requireText(
		testStrength.producer?.name,
		"stage_receipts.test_strength.producer.name",
	);
	requireText(
		testStrength.producer?.evidence,
		"stage_receipts.test_strength.producer.evidence",
	);
	if (
		!Array.isArray(testStrength.falsification) ||
		testStrength.falsification.length === 0
	) {
		findings.push(
			"required behavioral strength needs at least one fix-absent falsification",
		);
	} else {
		for (const [index, mutation] of testStrength.falsification.entries()) {
			for (const field of [
				"mutation",
				"red_evidence",
				"restored_green_evidence",
			]) {
				requireText(
					mutation?.[field],
					`stage_receipts.test_strength.falsification[${index}].${field}`,
				);
			}
		}
	}
}

const resilience = report?.stage_receipts?.resilience;
const resiliencePassed = validateReceiptIdentity(
	resilience,
	"stage_receipts.resilience",
);
if (diffSignals.sideEffects.length > 0 && resilience?.required !== true) {
	findings.push(
		"diff contains durable or external side-effect signals but Resilience receipt is not required",
	);
}
if (resiliencePassed && resilience.required) {
	if (
		!Array.isArray(resilience.commit_points) ||
		resilience.commit_points.length === 0
	) {
		findings.push("required resilience receipt needs commit points");
	} else {
		for (const point of resilience.commit_points) {
			const label = `commit point ${point?.id || "<missing-id>"}`;
			for (const field of ["id", "effect", "owner", "commit_event"]) {
				requireText(point?.[field], `${label}.${field}`);
			}
			requireArray(
				point?.later_fallible_stages,
				`${label}.later_fallible_stages`,
			);
			requireArray(point?.failure_partitions, `${label}.failure_partitions`);
			const covered = new Set();
			for (const partition of point?.failure_partitions ?? []) {
				requireArray(partition?.covers, `${label}.failure_partition.covers`);
				for (const stage of partition?.covers ?? []) covered.add(stage);
				if (partition?.forced !== true) {
					findings.push(`${label} has an unforced failure partition`);
				}
				for (const field of [
					"ownership_region",
					"residual_observed",
					"cleanup_owner",
					"evidence",
				]) {
					requireText(
						partition?.[field],
						`${label}.failure_partition.${field}`,
					);
				}
				if (partition?.retry?.attempted !== true) {
					findings.push(`${label} has a failure partition without retry`);
				}
				if (
					!["success", "documented_recovery"].includes(
						partition?.retry?.outcome,
					)
				) {
					findings.push(`${label} retry outcome is not safe`);
				}
				requireText(
					partition?.retry?.evidence,
					`${label}.failure_partition.retry.evidence`,
				);
			}
			for (const stage of point?.later_fallible_stages ?? []) {
				if (!covered.has(stage)) {
					findings.push(
						`${label} does not force the post-commit stage: ${stage}`,
					);
				}
			}
		}
	}
}
if (resilience?.required === true && risk?.level !== "high") {
	findings.push("required resilience receipt requires risk.level high");
}

if (!Array.isArray(report?.lenses)) {
	findings.push("lenses must be present");
} else {
	for (const lens of report.lenses) {
		requireText(lens?.name, "lens.name");
		if (!["run", "skipped"].includes(lens?.status)) {
			findings.push(`lens ${lens?.name || "<missing>"} has an invalid status`);
		}
		if (lens?.status === "skipped")
			requireText(lens?.reason, `lens ${lens.name}.reason`);
	}
}
if (!Array.isArray(report?.deterministic)) {
	findings.push("deterministic must be present");
} else {
	for (const check of report.deterministic) {
		requireText(check?.check, "deterministic.check");
		if (!["pass", "finding-fixed", "acknowledged"].includes(check?.outcome)) {
			findings.push(
				`deterministic ${check?.check || "<missing>"} has an invalid outcome`,
			);
		}
		if (check?.outcome !== "pass") {
			requireText(check?.reason, `deterministic ${check.check}.reason`);
		}
	}
}

if (!Array.isArray(report?.findings)) {
	findings.push("findings must be present, even when empty");
} else {
	for (const finding of report.findings) {
		const label = `finding ${finding?.id || "<missing-id>"}`;
		if (!["open", "fixed", "not_applicable"].includes(finding?.resolution)) {
			findings.push(`${label} has an invalid resolution`);
			continue;
		}
		if (finding.resolution === "open") findings.push(`${label} remains open`);
		if (finding?.state === "unverified" && finding.resolution !== "open") {
			findings.push(
				`${label} is unverified and cannot be resolved without evidence`,
			);
		}
		if (
			["confirmed", "unverified"].includes(finding?.state) &&
			finding.resolution === "not_applicable"
		) {
			findings.push(`${label} is ${finding.state} but marked not_applicable`);
		}
	}
}
requireArray(report?.exemptions, "exemptions");
requireArray(report?.issue_candidates, "issue_candidates");

if (findings.length > 0) {
	for (const finding of findings) console.error(`FINDING [report] ${finding}`);
	process.exit(1);
}

console.log(
	"PASS [report] exact state, skill revision, circuit breaker, specialist receipts, proof ledger, findings, and risk independence are complete",
);
