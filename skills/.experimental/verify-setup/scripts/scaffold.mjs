#!/usr/bin/env node
// Copy the verify kit into <repo>/.agents/verify without overwriting existing files.
// --local keeps the kit out of git through .git/info/exclude, for repos you do not own.
// --check exits 1 when the generic scripts in an installed kit drifted from this skill.
import { execFileSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const local = args.includes("--local");
const check = args.includes("--check");
const target = resolve(args.find((a) => !a.startsWith("--")) ?? ".");
if (!existsSync(join(target, ".git"))) {
	console.error(`not a git repo root: ${target}`);
	process.exit(2);
}
const kit = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "verify");
const dest = join(target, ".agents", "verify");

// Repo-specific files (doctor.sh, check.sh, drivers, features, ENFORCERS.md)
// are meant to diverge; these are not.
const GENERIC = ["lib.sh", "observe.sh", "fresh.sh"];
if (check) {
	const stale = GENERIC.filter((name) => {
		const installed = join(dest, name);
		return !existsSync(installed) || readFileSync(installed, "utf8") !== readFileSync(join(kit, name), "utf8");
	});
	console.log(JSON.stringify({ dest: relative(target, dest), stale }, null, 2));
	if (stale.length > 0) {
		console.error(`kit drifted from verify-setup: ${stale.join(", ")}; copy them from ${relative(target, kit)}`);
		process.exit(1);
	}
	process.exit(0);
}

const created = [];
const kept = [];
function walk(dir) {
	for (const name of readdirSync(dir)) {
		const src = join(dir, name);
		if (statSync(src).isDirectory()) {
			walk(src);
			continue;
		}
		const out = join(dest, relative(kit, src));
		if (existsSync(out)) kept.push(relative(target, out));
		else {
			cpSync(src, out, { recursive: true });
			created.push(relative(target, out));
		}
	}
}
walk(kit);
if (local) {
	const common = execFileSync("git", ["-C", target, "rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim();
	const exclude = resolve(target, common, "info", "exclude");
	const current = existsSync(exclude) ? readFileSync(exclude, "utf8") : "";
	if (!current.split("\n").includes(".agents/verify/")) appendFileSync(exclude, `${current.endsWith("\n") || !current ? "" : "\n"}.agents/verify/\n`);
}
console.log(JSON.stringify({ dest: relative(target, dest), local, created, kept }, null, 2));
