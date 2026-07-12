#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [skillName, workspaceArg, currentSkillArg, candidateSkillArg] =
	process.argv.slice(2);

if (!skillName || !workspaceArg || !currentSkillArg || !candidateSkillArg) {
	console.error(
		"Usage: bun scripts/setup-skill-eval.mjs <skill> <iteration-directory> <current-skill-path> <candidate-skill-path>",
	);
	process.exit(1);
}

const repository = resolve(import.meta.dir, "..");
const workspace = resolve(workspaceArg);
const evals = JSON.parse(
	readFileSync(
		resolve(repository, `skills/${skillName}/evals/evals.json`),
		"utf8",
	),
);
const variants = {
	no_skill: null,
	current: resolve(currentSkillArg),
	candidate: resolve(candidateSkillArg),
};

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

for (const item of evals.evals.filter((item) => item.fixture)) {
	const evalRoot = resolve(workspace, item.name);
	mkdirSync(evalRoot, { recursive: true });
	writeFileSync(
		resolve(evalRoot, "eval_metadata.json"),
		`${JSON.stringify(
			{
				eval_id: item.id,
				eval_name: item.name,
				prompt: item.prompt,
				assertions: item.assertions,
			},
			null,
			2,
		)}\n`,
	);

	for (const [variant, skillPath] of Object.entries(variants)) {
		const runRoot = resolve(evalRoot, variant);
		const repo = resolve(runRoot, "repo");
		mkdirSync(resolve(runRoot, "outputs"), { recursive: true });
		execFileSync(
			"bun",
			[
				resolve(repository, "scripts/setup-eval-fixture.mjs"),
				item.fixture,
				repo,
			],
			{ stdio: "pipe" },
		);
		writeFileSync(
			resolve(runRoot, "run.json"),
			`${JSON.stringify({ variant, skill_path: skillPath, repo, prompt: item.prompt }, null, 2)}\n`,
		);
	}
}

console.log(workspace);
