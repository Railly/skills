import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import {
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readlinkSync,
	realpathSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySkillLinks, planSkillLinks } from "./skill-linking.mjs";

function fixture() {
	const repository = mkdtempSync(join(tmpdir(), "railly-link-source-"));
	const installedRoot = mkdtempSync(join(tmpdir(), "railly-link-installed-"));
	const backupRoot = mkdtempSync(join(tmpdir(), "railly-link-backup-"));
	const skill = join(repository, "skills", "example");
	mkdirSync(skill, { recursive: true });
	writeFileSync(join(skill, "SKILL.md"), "canonical\n");
	execFileSync("git", ["init"], { cwd: repository });
	execFileSync("git", ["config", "user.email", "test@example.com"], {
		cwd: repository,
	});
	execFileSync("git", ["config", "user.name", "Test"], { cwd: repository });
	execFileSync("git", ["add", "."], { cwd: repository });
	execFileSync(
		"git",
		["-c", "commit.gpgsign=false", "commit", "-m", "fixture"],
		{ cwd: repository },
	);
	return { repository, installedRoot, backupRoot, skill };
}

describe("skill linking", () => {
	test("backs up an installed copy and creates a relative canonical link", () => {
		const { repository, installedRoot, backupRoot, skill } = fixture();
		const installed = join(installedRoot, "example");
		mkdirSync(installed);
		writeFileSync(join(installed, "SKILL.md"), "installed\n");
		const plan = planSkillLinks({
			repository,
			installedRoot,
			backupRoot,
			packagePaths: ["skills/example"],
		});

		applySkillLinks(plan);

		expect(lstatSync(installed).isSymbolicLink()).toBe(true);
		expect(realpathSync(installed)).toBe(realpathSync(skill));
		expect(readlinkSync(installed)).not.toStartWith("/");
		expect(readFileSync(join(backupRoot, "example", "SKILL.md"), "utf8")).toBe(
			"installed\n",
		);
	});

	test("refuses to link a canonical package that differs from its revision", () => {
		const { repository, installedRoot, backupRoot, skill } = fixture();
		writeFileSync(join(skill, "SKILL.md"), "dirty\n");

		expect(() =>
			planSkillLinks({
				repository,
				installedRoot,
				backupRoot,
				packagePaths: ["skills/example"],
			}),
		).toThrow("canonical packages differ");
		expect(existsSync(join(installedRoot, "example"))).toBe(false);
	});

	test("keeps an existing link without creating a backup", () => {
		const { repository, installedRoot, backupRoot, skill } = fixture();
		const installed = join(installedRoot, "example");
		execFileSync("ln", ["-s", skill, installed]);
		const plan = planSkillLinks({
			repository,
			installedRoot,
			backupRoot,
			packagePaths: ["skills/example"],
		});

		expect(plan.packages[0].action).toBe("keep");
		applySkillLinks(plan);
		expect(realpathSync(installed)).toBe(realpathSync(skill));
		expect(existsSync(join(backupRoot, "example"))).toBe(false);
	});

	test("backs up and replaces a broken installed link", () => {
		const { repository, installedRoot, backupRoot, skill } = fixture();
		const installed = join(installedRoot, "example");
		const missingTarget = join(installedRoot, "missing");
		symlinkSync(missingTarget, installed, "dir");
		const plan = planSkillLinks({
			repository,
			installedRoot,
			backupRoot,
			packagePaths: ["skills/example"],
		});

		expect(plan.packages[0].action).toBe("link");
		applySkillLinks(plan);

		expect(realpathSync(installed)).toBe(realpathSync(skill));
		expect(lstatSync(join(backupRoot, "example")).isSymbolicLink()).toBe(true);
		expect(readlinkSync(join(backupRoot, "example"))).toBe(missingTarget);
	});

	test("rolls back earlier links when a later backup target already exists", () => {
		const { repository, installedRoot, backupRoot } = fixture();
		const second = join(repository, "skills", "second");
		mkdirSync(second);
		writeFileSync(join(second, "SKILL.md"), "second canonical\n");
		execFileSync("git", ["add", "."], { cwd: repository });
		execFileSync(
			"git",
			["-c", "commit.gpgsign=false", "commit", "-m", "second"],
			{ cwd: repository },
		);
		for (const name of ["example", "second"]) {
			const installed = join(installedRoot, name);
			mkdirSync(installed);
			writeFileSync(join(installed, "SKILL.md"), `${name} installed\n`);
		}
		mkdirSync(join(backupRoot, "second"));
		const plan = planSkillLinks({
			repository,
			installedRoot,
			backupRoot,
			packagePaths: ["skills/example", "skills/second"],
		});

		expect(() => applySkillLinks(plan)).toThrow("backup already exists");
		for (const name of ["example", "second"]) {
			const installed = join(installedRoot, name);
			expect(lstatSync(installed).isDirectory()).toBe(true);
			expect(readFileSync(join(installed, "SKILL.md"), "utf8")).toBe(
				`${name} installed\n`,
			);
		}
		expect(existsSync(join(backupRoot, "example"))).toBe(false);
	});
});
