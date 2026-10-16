#!/usr/bin/env bun
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const candidates = [
	process.env.RAILLY_SKILLS_REPO,
	join(homedir(), "Programming", "railly", "skills"),
	join(homedir(), "railly-skills"),
].filter(Boolean);

for (const candidate of candidates) {
	const root = resolve(candidate);
	if (
		existsSync(join(root, "foundry", "maturity.json")) &&
		existsSync(join(root, ".claude-plugin", "marketplace.json")) &&
		existsSync(join(root, "cases"))
	) {
		console.log(realpathSync(root));
		process.exit(0);
	}
}

console.error(
	"Railly Skills source repo not found. Set RAILLY_SKILLS_REPO to the canonical checkout.",
);
process.exit(1);
