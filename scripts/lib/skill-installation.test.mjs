import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	compareSkillInstallation,
	skillPackageDigest,
	skillPackageDigestAtRevision,
} from "./skill-installation.mjs";

describe("skill installation identity", () => {
	test("distinguishes linked, exact-copy, and diverged installs", () => {
		const root = mkdtempSync(join(tmpdir(), "railly-skill-install-"));
		const canonical = join(root, "canonical");
		const exact = join(root, "exact");
		const diverged = join(root, "diverged");
		const linked = join(root, "linked");
		for (const path of [canonical, exact, diverged]) mkdirSync(path);
		writeFileSync(join(canonical, "SKILL.md"), "same\n");
		writeFileSync(join(exact, "SKILL.md"), "same\n");
		writeFileSync(join(diverged, "SKILL.md"), "different\n");
		symlinkSync(canonical, linked, "dir");
		expect(compareSkillInstallation(canonical, linked).status).toBe("linked");
		expect(compareSkillInstallation(canonical, exact).status).toBe(
			"exact-copy",
		);
		expect(compareSkillInstallation(canonical, diverged).status).toBe(
			"diverged",
		);
		expect(skillPackageDigest(canonical)).toBe(skillPackageDigest(exact));
	});

	test("distinguishes the working package from the committed revision", () => {
		const repository = mkdtempSync(join(tmpdir(), "railly-skill-revision-"));
		const canonical = join(repository, "skills", "example");
		mkdirSync(canonical, { recursive: true });
		writeFileSync(join(canonical, "SKILL.md"), "committed\n");
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

		expect(skillPackageDigestAtRevision(repository, "skills/example")).toBe(
			skillPackageDigest(canonical),
		);

		writeFileSync(join(canonical, "SKILL.md"), "working tree\n");
		expect(skillPackageDigestAtRevision(repository, "skills/example")).not.toBe(
			skillPackageDigest(canonical),
		);
	});
});
