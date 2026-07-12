#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const repository = resolve(import.meta.dir, "..");
const evals = JSON.parse(
	readFileSync(resolve(repository, "skills/unfold/evals/evals.json"), "utf8"),
);
const root = resolve("/tmp", `unfold-fixtures-${process.pid}`);

try {
	for (const item of evals.evals.filter((item) => item.fixture)) {
		const destination = resolve(root, item.name);
		const setup = spawnSync(
			"bun",
			[
				resolve(repository, "scripts/setup-eval-fixture.mjs"),
				item.fixture,
				destination,
			],
			{ encoding: "utf8" },
		);
		if (setup.status !== 0) {
			throw new Error(`${item.name}: fixture setup failed\n${setup.stderr}`);
		}

		const [command, ...args] = item.verification.command;
		const verification = spawnSync(command, args, {
			cwd: destination,
			encoding: "utf8",
		});
		if (verification.status !== item.verification.expected_exit) {
			throw new Error(
				`${item.name}: expected exit ${item.verification.expected_exit}, received ${verification.status}\n${verification.stdout}\n${verification.stderr}`,
			);
		}
		console.log(`✓ ${item.name}`);
	}
} finally {
	rmSync(root, { recursive: true, force: true });
}
