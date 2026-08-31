#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { applySkillLinks, planSkillLinks } from "./lib/skill-linking.mjs";

const args = process.argv.slice(2);
const installedIndex = args.indexOf("--installed");
const backupIndex = args.indexOf("--backup");
const skillIndex = args.indexOf("--skill");
const sourceIndex = args.indexOf("--source");
if (
	installedIndex === -1 ||
	!args[installedIndex + 1] ||
	(backupIndex !== -1 && !args[backupIndex + 1]) ||
	(skillIndex !== -1 && !args[skillIndex + 1]) ||
	(sourceIndex !== -1 && !args[sourceIndex + 1])
) {
	console.error(
		"Usage: bun scripts/link-skills.mjs --installed <skills-root> [--source <repository>] [--backup <backup-root>] [--skill <name>] [--apply] [--json]",
	);
	process.exit(2);
}

const repository = resolve(
	sourceIndex === -1
		? resolve(import.meta.dirname, "..")
		: args[sourceIndex + 1],
);
const marketplace = JSON.parse(
	readFileSync(join(repository, ".claude-plugin", "marketplace.json"), "utf8"),
);
const selected = skillIndex === -1 ? null : args[skillIndex + 1];
const installedRoot = resolve(args[installedIndex + 1]);
const packagePaths = marketplace.plugins
	.flatMap((plugin) => plugin.skills ?? [])
	.map((path) => path.replace(/^\.\//, ""))
	.filter((path) => !selected || basename(path) === selected);
if (packagePaths.length === 0) {
	console.error(`ERROR unknown skill: ${selected}`);
	process.exit(2);
}

try {
	const revision = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: repository,
		encoding: "utf8",
	}).trim();
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const plan = planSkillLinks({
		repository,
		installedRoot,
		backupRoot:
			backupIndex === -1
				? join(dirname(installedRoot), "skill-backups", timestamp)
				: args[backupIndex + 1],
		packagePaths,
		revision,
	});
	if (args.includes("--apply")) applySkillLinks(plan);
	const result = {
		mode: args.includes("--apply") ? "applied" : "dry-run",
		...plan,
	};
	if (args.includes("--json")) {
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} else {
		console.log(`${result.mode}: ${revision}`);
		console.log(`backup: ${plan.backup_root}`);
		for (const item of plan.packages) {
			console.log(`${item.action.padEnd(5)} ${item.name} -> ${item.canonical}`);
		}
	}
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}
