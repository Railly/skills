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
const requireText = (value, label) => {
	if (typeof value !== "string" || value.trim() === "")
		findings.push(`${label} is required`);
};

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

const diffSignals = { highRisk: [], sideEffects: [] };
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
			{ stdio: "ignore" },
		);
		execFileSync(
			"git",
			["rev-parse", "--verify", `${report.run.head}^{commit}`],
			{ stdio: "ignore" },
		);
		const files = execFileSync(
			"git",
			["diff", "--name-only", report.run.base, report.run.head],
			{
				encoding: "utf8",
			},
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
				/\b(secret|private[_-]?key|credential|password|token|authentication|authorization|permission|access[_ -]?control|acl|encrypt|certificate)\b/i.test(
					added,
				)
			) {
				diffSignals.highRisk.push(`${file}: security-sensitive state`);
			}
			if (
				/\b(writeFile(?:Sync)?|appendFile(?:Sync)?|createWriteStream|rename(?:Sync)?|link(?:Sync)?|symlink(?:Sync)?|unlink(?:Sync)?|mkdir(?:Sync)?|File::create|fs::write|std::fs::|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|\.persist\s*\(|\.save\s*\()\b/i.test(
					added,
				)
			) {
				diffSignals.highRisk.push(`${file}: durable state`);
				diffSignals.sideEffects.push(`${file}: durable state`);
			}
			if (
				/\b(listen\s*\(|serve\s*\(|spawn\s*\(|exec(?:File)?\s*\(|fork\s*\(|axios\.(?:post|put|patch|delete)|requests\.(?:post|put|patch|delete))/.test(
					added,
				) ||
				/\bfetch\s*\([\s\S]{0,800}\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i.test(
					added,
				)
			) {
				diffSignals.highRisk.push(`${file}: external side effect`);
				diffSignals.sideEffects.push(`${file}: external side effect`);
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
	if (!Array.isArray(risk.triggers)) {
		findings.push("risk.triggers must be an array");
	} else if (risk.level === "high" && risk.triggers.length === 0) {
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
	requireText(
		risk.independent_challenge?.method,
		"risk.independent_challenge.method",
	);
	requireText(
		risk.independent_challenge?.artifact,
		"risk.independent_challenge.artifact",
	);
	requireText(
		risk.independent_challenge?.evidence,
		"risk.independent_challenge.evidence",
	);
	const artifact = risk.independent_challenge?.artifact;
	if (typeof artifact === "string" && artifact.trim() !== "") {
		if (/^https?:\/\//.test(artifact)) {
			findings.push(
				"independent challenge artifact must be a local auditable file, not an unchecked URL",
			);
		} else {
			const artifactPath = resolve(dirname(reportPath), artifact);
			if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
				findings.push(
					`independent challenge artifact does not exist as a file: ${artifactPath}`,
				);
			} else if (statSync(artifactPath).size === 0) {
				findings.push(
					`independent challenge artifact is empty: ${artifactPath}`,
				);
			}
		}
	}
}
const highRiskPropertyKinds = new Set([
	"confidentiality",
	"integrity",
	"authorization",
	"durability",
	"atomicity",
	"lifecycle",
]);
const propertySignalsHighRisk = (report?.properties || []).some((property) =>
	highRiskPropertyKinds.has(property?.kind),
);
if (
	(diffSignals.highRisk.length > 0 || propertySignalsHighRisk) &&
	risk?.level !== "high"
) {
	findings.push(
		`diff signals high risk but risk.level is not high: ${[...new Set(diffSignals.highRisk)].join("; ")}`,
	);
}

const requiredClaimSources = new Set([
	"contract",
	"design",
	"user_facing",
	"implementation",
]);
if (!Array.isArray(report?.claim_inventory)) {
	findings.push(
		"claim_inventory must inventory contract, design, user_facing, and implementation sources",
	);
} else {
	const sourceCounts = new Map();
	for (const source of report.claim_inventory) {
		const label = `claim source ${source?.source || "<missing>"}`;
		sourceCounts.set(
			source?.source,
			(sourceCounts.get(source?.source) || 0) + 1,
		);
		if (!requiredClaimSources.has(source?.source))
			findings.push(`${label} has an invalid source class`);
		if (
			!["reviewed", "not_provided", "not_applicable"].includes(source?.status)
		) {
			findings.push(`${label} has an invalid status`);
		}
		requireText(source?.location, `${label}.location`);
		requireText(source?.evidence, `${label}.evidence`);
		if (!Array.isArray(source?.properties))
			findings.push(`${label}.properties must be an array`);
		if (source?.status === "reviewed" && source?.properties?.length === 0) {
			findings.push(`${label} is reviewed but maps to no property`);
		}
	}
	for (const source of requiredClaimSources) {
		const count = sourceCounts.get(source) || 0;
		if (count === 0)
			findings.push(`claim_inventory is missing source class: ${source}`);
		if (count > 1)
			findings.push(`claim_inventory duplicates source class: ${source}`);
	}
	const implementationSource = report.claim_inventory.find(
		(source) => source?.source === "implementation",
	);
	if (
		implementationSource?.status !== "reviewed" ||
		implementationSource?.properties?.length === 0
	) {
		findings.push(
			"implementation claims must be reviewed and mapped to at least one property",
		);
	}
}

if (!Array.isArray(report?.properties) || report.properties.length === 0) {
	findings.push("properties must contain every material changed property");
} else {
	const seenPropertyIds = new Set();
	const allowedPropertyKinds = new Set([
		"correctness",
		"confidentiality",
		"integrity",
		"availability",
		"durability",
		"atomicity",
		"authorization",
		"lifecycle",
		"other",
	]);
	for (const property of report.properties) {
		const label = `property ${property?.id || "<missing-id>"}`;
		requireText(property?.id, `${label}.id`);
		requireText(property?.claim, `${label}.claim`);
		if (seenPropertyIds.has(property?.id))
			findings.push(`${label}.id is duplicated`);
		seenPropertyIds.add(property?.id);
		if (!allowedPropertyKinds.has(property?.kind)) {
			findings.push(
				`${label}.kind is invalid: ${property?.kind || "<missing>"}`,
			);
		}
		requireText(property?.oracle?.observes, `${label}.oracle.observes`);
		requireText(property?.oracle?.layer, `${label}.oracle.layer`);
		requireText(property?.oracle?.method, `${label}.oracle.method`);
		requireText(property?.evidence, `${label}.evidence`);
		if (property?.status !== "verified")
			findings.push(`${label} is not verified`);
		if (property?.oracle?.proxy_only !== false)
			findings.push(`${label} relies on proxy-only evidence`);
		requireText(
			property?.proxy_challenge?.proxy,
			`${label}.proxy_challenge.proxy`,
		);
		requireText(
			property?.proxy_challenge?.counterexample,
			`${label}.proxy_challenge.counterexample`,
		);
		requireText(
			property?.proxy_challenge?.evidence,
			`${label}.proxy_challenge.evidence`,
		);
		if (property?.proxy_challenge?.attempted !== true)
			findings.push(`${label} proxy challenge was not attempted`);
		if (
			!["separated", "not_separated"].includes(
				property?.proxy_challenge?.outcome,
			)
		) {
			findings.push(`${label} proxy challenge has no valid outcome`);
		}
		if (
			!Array.isArray(property?.substrates) ||
			property.substrates.length === 0
		) {
			findings.push(`${label} has no substrate or environment evidence`);
		} else {
			for (const substrate of property.substrates) {
				requireText(substrate?.name, `${label}.substrate.name`);
				requireText(substrate?.evidence, `${label}.substrate.evidence`);
				if (substrate?.status !== "exercised") {
					findings.push(
						`${label} has an unexercised substrate: ${substrate?.name || "<missing-name>"}`,
					);
				}
			}
		}
	}
}

const propertyIds = new Set(
	(report?.properties || []).map((property) => property?.id).filter(Boolean),
);
const inventoriedPropertyIds = new Set(
	(report?.claim_inventory || [])
		.flatMap((source) => source?.properties || [])
		.filter(Boolean),
);
for (const id of inventoriedPropertyIds) {
	if (!propertyIds.has(id))
		findings.push(`claim_inventory references missing property: ${id}`);
}
for (const id of propertyIds) {
	if (!inventoriedPropertyIds.has(id))
		findings.push(`property ${id} is absent from the claim inventory`);
}

if (!Array.isArray(report?.assumptions)) {
	findings.push("assumptions must be present, even when empty");
} else {
	for (const assumption of report.assumptions) {
		const label = `assumption ${assumption?.id || "<missing-id>"}`;
		requireText(assumption?.id, `${label}.id`);
		requireText(assumption?.source, `${label}.source`);
		requireText(assumption?.claim, `${label}.claim`);
		requireText(assumption?.evidence, `${label}.evidence`);
		if (assumption?.status !== "verified")
			findings.push(`${label} is ${assumption?.status || "missing status"}`);
	}
}

const sideEffects = report?.side_effects;
if (!sideEffects || !["none", "present"].includes(sideEffects.assessment)) {
	findings.push("side_effects.assessment must be none or present");
} else {
	requireText(sideEffects.evidence, "side_effects.evidence");
	const points = sideEffects.commit_points;
	if (!Array.isArray(points)) {
		findings.push("side_effects.commit_points must be an array");
	} else if (sideEffects.assessment === "none" && points.length > 0) {
		findings.push(
			"side_effects assessment is none but commit points are listed",
		);
	} else if (sideEffects.assessment === "present" && points.length === 0) {
		findings.push(
			"side_effects assessment is present but no commit point is listed",
		);
	} else {
		for (const point of points) {
			const label = `commit point ${point?.id || "<missing-id>"}`;
			requireText(point?.id, `${label}.id`);
			requireText(point?.effect, `${label}.effect`);
			requireText(point?.owner, `${label}.owner`);
			requireText(point?.commit_event, `${label}.commit_event`);
			if (!Array.isArray(point?.later_fallible_stages)) {
				findings.push(`${label}.later_fallible_stages must be an array`);
				continue;
			}
			if (!Array.isArray(point?.failure_partitions)) {
				findings.push(`${label}.failure_partitions must be an array`);
				continue;
			}
			const covered = new Set();
			for (const partition of point.failure_partitions) {
				requireText(
					partition?.ownership_region,
					`${label}.failure_partition.ownership_region`,
				);
				if (
					!Array.isArray(partition?.covers) ||
					partition.covers.length === 0
				) {
					findings.push(
						`${label} has a failure partition with no covered stage`,
					);
				} else {
					for (const stage of partition.covers) covered.add(stage);
				}
				if (partition?.forced !== true)
					findings.push(`${label} has an unforced failure partition`);
				requireText(
					partition?.residual_observed,
					`${label}.failure_partition.residual_observed`,
				);
				requireText(
					partition?.cleanup_owner,
					`${label}.failure_partition.cleanup_owner`,
				);
				requireText(partition?.evidence, `${label}.failure_partition.evidence`);
				if (partition?.retry?.attempted !== true)
					findings.push(`${label} has a failure partition without retry`);
				if (
					!["success", "documented_recovery"].includes(
						partition?.retry?.outcome,
					)
				) {
					findings.push(
						`${label} retry outcome is not safe: ${partition?.retry?.outcome || "<missing>"}`,
					);
				}
				requireText(
					partition?.retry?.evidence,
					`${label}.failure_partition.retry.evidence`,
				);
			}
			for (const stage of point.later_fallible_stages) {
				if (!covered.has(stage))
					findings.push(
						`${label} does not force the post-commit stage: ${stage}`,
					);
			}
		}
	}
}
if (
	diffSignals.sideEffects.length > 0 &&
	sideEffects?.assessment !== "present"
) {
	findings.push(
		`diff contains durable or external side-effect signals but side_effects.assessment is not present: ${[
			...new Set(diffSignals.sideEffects),
		].join("; ")}`,
	);
}
if (sideEffects?.assessment === "present" && risk?.level !== "high") {
	findings.push(
		"durable or externally visible side effects require risk.level high",
	);
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

if (findings.length > 0) {
	for (const finding of findings) console.error(`FINDING [report] ${finding}`);
	process.exit(1);
}

console.log(
	"PASS [report] verdict, claim inventory, proof ledger, assumptions, commit points, retries, and risk independence are complete",
);
