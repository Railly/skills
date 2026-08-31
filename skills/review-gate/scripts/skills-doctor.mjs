#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const roots = [
	process.env.RAILLY_SKILLS_REPO,
	join(homedir(), "Programming", "railly", "skills"),
	join(homedir(), "railly-skills"),
].filter(Boolean);
const root = roots
	.map(resolve)
	.find((path) => existsSync(join(path, "scripts", "skills-doctor.mjs")));
if (!root) {
	console.error("Canonical Railly Skills doctor not found.");
	process.exit(1);
}
const result = spawnSync(
	"bun",
	[join(root, "scripts", "skills-doctor.mjs"), ...process.argv.slice(2)],
	{ stdio: "inherit" },
);
process.exit(result.status ?? 1);
