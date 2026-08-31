#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
	compareSkillInstallation,
	skillPackageDigest,
	skillPackageDigestAtRevision,
} from "./lib/skill-installation.mjs";

const repository = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const installedIndex = args.indexOf("--installed");
const skillIndex = args.indexOf("--skill");
if (
	(installedIndex !== -1 && !args[installedIndex + 1]) ||
	(skillIndex !== -1 && !args[skillIndex + 1])
) {
	console.error("ERROR --installed and --skill require values");
	process.exit(2);
}
const installedRoot =
	installedIndex === -1
		? resolve(process.env.RAILLY_SKILLS_INSTALLED ?? ".agents/skills")
		: resolve(args[installedIndex + 1]);
const selected = skillIndex === -1 ? null : args[skillIndex + 1];
const json = args.includes("--json");
const allowMissing = args.includes("--allow-missing");

const marketplace = JSON.parse(
	readFileSync(join(repository, ".claude-plugin", "marketplace.json"), "utf8"),
);
const packages = marketplace.plugins
	.flatMap((plugin) => plugin.skills ?? [])
	.map((path) => path.replace(/^\.\//, ""))
	.filter((path) => !selected || basename(path) === selected);
if (packages.length === 0) {
	console.error(`ERROR unknown skill: ${selected}`);
	process.exit(2);
}
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
	cwd: repository,
	encoding: "utf8",
}).trim();
const results = packages.map((path) => {
	const name = basename(path);
	const canonicalPath = join(repository, path);
	const canonicalDigest = skillPackageDigest(canonicalPath);
	const revisionDigest = skillPackageDigestAtRevision(
		repository,
		path,
		revision,
	);
	return {
		name,
		canonical_path: canonicalPath,
		canonical_revision: revision,
		canonical_digest: canonicalDigest,
		revision_digest: revisionDigest,
		canonical_status: canonicalDigest === revisionDigest ? "clean" : "dirty",
		...compareSkillInstallation(canonicalPath, join(installedRoot, name)),
	};
});

if (json) {
	process.stdout.write(
		`${JSON.stringify(
			{
				repository,
				revision,
				installed_root: installedRoot,
				results,
			},
			null,
			2,
		)}\n`,
	);
} else {
	for (const result of results) {
		console.log(
			`${result.status.padEnd(10)} ${result.name} ${result.canonical_revision.slice(0, 12)} source=${result.canonical_status}`,
		);
	}
}

const failed = results.some(
	(result) =>
		result.canonical_status === "dirty" ||
		result.status === "diverged" ||
		(!allowMissing && result.status === "missing"),
);
process.exit(failed ? 1 : 0);
