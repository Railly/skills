import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	lstatSync,
	readdirSync,
	readFileSync,
	realpathSync,
} from "node:fs";
import { join, relative } from "node:path";

function files(root, current = root) {
	return readdirSync(current, { withFileTypes: true })
		.flatMap((entry) => {
			const path = join(current, entry.name);
			if (entry.isDirectory()) return files(root, path);
			if (entry.isFile()) return [path];
			return [];
		})
		.sort();
}

function digestEntries(entries) {
	const hash = createHash("sha256");
	for (const [path, content] of entries) {
		hash.update(path);
		hash.update("\0");
		hash.update(content);
		hash.update("\0");
	}
	return `sha256:${hash.digest("hex")}`;
}

export function skillPackageDigest(root) {
	return digestEntries(
		files(root).map((path) => [
			relative(root, path).split("\\").join("/"),
			readFileSync(path),
		]),
	);
}

export function skillPackageDigestAtRevision(
	repository,
	packagePath,
	revision = "HEAD",
) {
	const output = execFileSync(
		"git",
		["ls-tree", "-r", "--name-only", "-z", revision, "--", packagePath],
		{ cwd: repository },
	);
	const paths = output.toString("utf8").split("\0").filter(Boolean).sort();
	if (paths.length === 0) {
		throw new Error(`${packagePath} does not exist at ${revision}`);
	}
	return digestEntries(
		paths.map((path) => [
			relative(packagePath, path).split("\\").join("/"),
			execFileSync("git", ["show", `${revision}:${path}`], {
				cwd: repository,
			}),
		]),
	);
}

export function compareSkillInstallation(canonical, installed) {
	const canonicalDigest = skillPackageDigest(canonical);
	if (!existsSync(installed)) {
		return {
			status: "missing",
			canonical_digest: canonicalDigest,
			installed_digest: null,
			installed_path: installed,
		};
	}
	const installedDigest = skillPackageDigest(installed);
	const linked =
		lstatSync(installed).isSymbolicLink() &&
		realpathSync(installed) === realpathSync(canonical);
	return {
		status: linked
			? "linked"
			: installedDigest === canonicalDigest
				? "exact-copy"
				: "diverged",
		canonical_digest: canonicalDigest,
		installed_digest: installedDigest,
		installed_path: installed,
	};
}
