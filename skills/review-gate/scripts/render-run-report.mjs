#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input) {
	console.error("Usage: render-run-report.mjs <run-report.json> [output.md]");
	process.exit(2);
}

let report;
try {
	report = JSON.parse(readFileSync(resolve(input), "utf8"));
} catch (error) {
	console.error(`ERROR [render] cannot read JSON: ${error.message}`);
	process.exit(2);
}

if (report.schemaVersion !== 1) {
	console.error("ERROR [render] schemaVersion must be 1");
	process.exit(1);
}

const list = (values, empty = "None.") =>
	Array.isArray(values) && values.length > 0
		? values.map((value) => `- ${value}`).join("\n")
		: empty;
const receipt = (name, value) =>
	`- ${name}: ${value?.status ?? "missing"}${value?.skill_revision ? ` at \`${value.skill_revision}\`` : ""}${value?.evidence ? `. ${value.evidence}` : value?.reason ? `. ${value.reason}` : ""}`;
const finding = (value) =>
	`${value.id}: ${value.state}, ${value.resolution}. ${value.claim}${value.evidence ? ` Evidence: ${value.evidence}` : ""}`;
const deterministic = (value) =>
	`\`${value.check}\`: ${value.outcome}${value.reason ? `. ${value.reason}` : ""}`;
const lens = (value) =>
	`${value.name}: ${value.status}${value.reason ? `. ${value.reason}` : ""}`;

const lines = [
	`# Review Gate: ${report.run?.repo ?? "unknown repository"}`,
	"",
	`Date: ${report.run?.date ?? "unknown"}`,
	`Repository: ${report.run?.repo ?? "unknown"}`,
	`Base: \`${report.run?.base ?? "unknown"}\``,
	`Head: \`${report.run?.head ?? "unknown"}\``,
	`Profile: ${report.run?.profile ?? "unknown"}`,
	`Skill revision: \`${report.run?.skill_revision ?? "unknown"}\``,
	`Verdict: ${report.run?.verdict ?? "unknown"}`,
	"",
	"## Execution",
	"",
	`- Mode: ${report.execution?.mode ?? "unknown"}`,
	`- Runtime receipt: ${report.execution?.receipt ?? "none"}`,
	`- Degraded from: ${report.execution?.degraded_from ?? "none"}`,
	`- Schema failures: ${report.execution?.schema_failures ?? "unknown"}`,
	`- Independence gap: ${report.execution?.independence_gap ?? "none"}`,
	"",
	"## Contract",
	"",
	`- Path: ${report.contract?.path ?? "not provided"}`,
	`- Spec status: ${report.contract?.spec_status ?? "unknown"}`,
	`- Acceptance reviewed: ${(report.contract?.acceptance_reviewed ?? []).join(", ") || "none"}`,
	"",
	"## Stage receipts",
	"",
	receipt("Test Strength", report.stage_receipts?.test_strength),
	receipt("Resilience Audit", report.stage_receipts?.resilience),
	receipt("Security Review", report.security_review),
	"",
	"## Verified properties",
	"",
	list(
		(report.properties ?? []).map(
			(value) => `${value.id}: ${value.claim} ${value.evidence}`,
		),
	),
	"",
	"## Deterministic checks",
	"",
	list((report.deterministic ?? []).map(deterministic)),
	"",
	"## Judgment lenses",
	"",
	list((report.lenses ?? []).map(lens)),
	"",
	"## Findings",
	"",
	list((report.findings ?? []).map(finding)),
	"",
	"## Gaps",
	"",
	list([...(report.run?.gaps ?? []), ...(report.contract?.gaps ?? [])]),
	"",
	"## Limits and provenance",
	"",
	`- Author model: ${report.provenance?.author_model ?? "unknown"}`,
	`- Reviewer model: ${report.provenance?.reviewer_model ?? "unknown"}`,
	`- Same family: ${report.provenance?.same_family === true ? "yes" : "no"}`,
	`- Independent challenge: ${report.risk?.independent_challenge?.satisfied === true ? "satisfied" : "not satisfied"}${report.risk?.independent_challenge?.evidence ? `. ${report.risk.independent_challenge.evidence}` : ""}`,
	"",
];

const markdown = lines.join("\n");
if (output) {
	writeFileSync(resolve(output), markdown);
	console.log(`Review Gate prose written: ${resolve(output)}`);
} else {
	process.stdout.write(markdown);
}
