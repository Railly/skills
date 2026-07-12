#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const [skillName, workspaceArg] = process.argv.slice(2);

if (!skillName || !workspaceArg) {
	console.error(
		"Usage: bun scripts/aggregate-skill-eval.mjs <skill> <iteration-directory>",
	);
	process.exit(1);
}

const workspace = resolve(workspaceArg);
const variants = ["no_skill", "current", "candidate"];
const evalDirs = readdirSync(workspace, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => resolve(workspace, entry.name))
	.sort();
const benchmark = {
	skill_name: skillName,
	iteration: basename(workspace),
	timing: "unavailable from collaboration-agent notifications",
	variants: Object.fromEntries(
		variants.map((variant) => [
			variant,
			{ passed: 0, total: 0, pass_rate: 0, evals: {} },
		]),
	),
};

for (const evalDir of evalDirs) {
	const name = basename(evalDir);
	for (const variant of variants) {
		const gradingPath = resolve(evalDir, variant, "grading.json");
		if (!existsSync(gradingPath)) {
			console.error(`Missing grading: ${gradingPath}`);
			process.exit(1);
		}
		const grading = JSON.parse(readFileSync(gradingPath, "utf8"));
		const passed = grading.expectations.filter((item) => item.passed).length;
		const total = grading.expectations.length;
		benchmark.variants[variant].passed += passed;
		benchmark.variants[variant].total += total;
		benchmark.variants[variant].evals[name] = {
			passed,
			total,
			pass_rate: passed / total,
		};
	}
}

for (const variant of variants) {
	const result = benchmark.variants[variant];
	result.pass_rate = result.total ? result.passed / result.total : 0;
}

benchmark.candidate_delta_vs_current =
	benchmark.variants.candidate.pass_rate - benchmark.variants.current.pass_rate;
benchmark.current_delta_vs_no_skill =
	benchmark.variants.current.pass_rate - benchmark.variants.no_skill.pass_rate;

writeFileSync(
	resolve(workspace, "benchmark.json"),
	`${JSON.stringify(benchmark, null, 2)}\n`,
);

const percent = (value) => `${(value * 100).toFixed(1)}%`;
const lines = [
	`# ${skillName} benchmark`,
	"",
	"| Variant | Passed | Total | Pass rate |",
	"|---|---:|---:|---:|",
	...variants.map((variant) => {
		const result = benchmark.variants[variant];
		return `| ${variant} | ${result.passed} | ${result.total} | ${percent(result.pass_rate)} |`;
	}),
	"",
	`Candidate delta versus current: ${percent(benchmark.candidate_delta_vs_current)}`,
	"",
	`Current delta versus no skill: ${percent(benchmark.current_delta_vs_no_skill)}`,
	"",
	"Timing and token data were not emitted by the collaboration-agent interface.",
];

writeFileSync(resolve(workspace, "benchmark.md"), `${lines.join("\n")}\n`);
console.log(resolve(workspace, "benchmark.json"));
