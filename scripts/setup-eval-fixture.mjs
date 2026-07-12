#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const [fixtureName, destinationArg] = process.argv.slice(2);

if (!fixtureName || !destinationArg) {
	console.error(
		"Usage: bun scripts/setup-eval-fixture.mjs <fixture> <destination>",
	);
	process.exit(1);
}

const root = resolve(
	import.meta.dir,
	"../skills/unfold/evals/fixtures",
	fixtureName,
);
const base = resolve(root, "base");
const changed = resolve(root, "changed");
const destination = resolve(destinationArg);

if (!existsSync(base) || !existsSync(changed)) {
	console.error(`Unknown or incomplete fixture: ${fixtureName}`);
	process.exit(1);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(base, destination, { recursive: true });

const git = (...args) =>
	execFileSync("git", args, {
		cwd: destination,
		encoding: "utf8",
		stdio: "pipe",
	});

git("init", "-q");
git("config", "user.name", "Skill Eval");
git("config", "user.email", "eval@example.invalid");
git("add", ".");
git("commit", "-qm", "fixture base");
cpSync(changed, destination, { recursive: true });

console.log(destination);
