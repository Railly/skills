import {
	lstatSync,
	mkdirSync,
	realpathSync,
	renameSync,
	rmSync,
	symlinkSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import {
	skillPackageDigest,
	skillPackageDigestAtRevision,
} from "./skill-installation.mjs";

function pathEntryExists(path) {
	try {
		lstatSync(path);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}

function linksTo(path, target) {
	if (!pathEntryExists(path) || !lstatSync(path).isSymbolicLink()) return false;
	try {
		return realpathSync(path) === realpathSync(target);
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}

function packageState(repository, path, revision) {
	const canonical = join(repository, path);
	return {
		name: basename(path),
		path,
		canonical,
		canonical_digest: skillPackageDigest(canonical),
		revision_digest: skillPackageDigestAtRevision(repository, path, revision),
	};
}

export function planSkillLinks({
	repository,
	installedRoot,
	packagePaths,
	revision = "HEAD",
	backupRoot,
}) {
	const resolvedRepository = resolve(repository);
	const resolvedInstalledRoot = resolve(installedRoot);
	const resolvedBackupRoot = resolve(
		backupRoot ?? join(dirname(resolvedInstalledRoot), "skill-backups"),
	);
	const packages = packagePaths.map((path) => {
		const state = packageState(resolvedRepository, path, revision);
		const installed = join(resolvedInstalledRoot, state.name);
		const alreadyLinked = linksTo(installed, state.canonical);
		return {
			...state,
			installed,
			backup: join(resolvedBackupRoot, state.name),
			action: alreadyLinked ? "keep" : "link",
		};
	});
	const dirty = packages.filter(
		(item) => item.canonical_digest !== item.revision_digest,
	);
	if (dirty.length > 0) {
		throw new Error(
			`canonical packages differ from ${revision}: ${dirty
				.map((item) => item.name)
				.join(", ")}`,
		);
	}
	return {
		repository: resolvedRepository,
		installed_root: resolvedInstalledRoot,
		backup_root: resolvedBackupRoot,
		revision,
		packages,
	};
}

export function applySkillLinks(plan) {
	const changed = [];
	try {
		for (const item of plan.packages) {
			if (item.action === "keep") continue;
			mkdirSync(dirname(item.installed), { recursive: true });
			mkdirSync(dirname(item.backup), { recursive: true });
			if (pathEntryExists(item.backup)) {
				throw new Error(`backup already exists: ${item.backup}`);
			}
			const hadInstalled = pathEntryExists(item.installed);
			if (hadInstalled) renameSync(item.installed, item.backup);
			try {
				symlinkSync(
					relative(dirname(item.installed), item.canonical),
					item.installed,
					"dir",
				);
			} catch (error) {
				if (hadInstalled) renameSync(item.backup, item.installed);
				throw error;
			}
			changed.push({ item, hadInstalled });
		}
		return plan;
	} catch (error) {
		for (const { item, hadInstalled } of changed.reverse()) {
			if (pathEntryExists(item.installed)) rmSync(item.installed);
			if (hadInstalled && pathEntryExists(item.backup)) {
				renameSync(item.backup, item.installed);
			}
		}
		throw error;
	}
}
