#!/usr/bin/env bun
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
	createWorkItemManifest,
	invalidateFrom,
	readWorkItemManifest,
	skillkitAnnotations,
	validateWorkItemManifest,
} from "./lib/work-item-manifest.mjs";

const [command, target, ...args] = process.argv.slice(2);

function option(name, fallback = null) {
	const index = args.indexOf(`--${name}`);
	return index === -1 ? fallback : args[index + 1];
}

function writeAtomic(path, value) {
	const resolved = resolve(path);
	mkdirSync(dirname(resolved), { recursive: true });
	const temporary = `${resolved}.tmp-${process.pid}`;
	writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
	renameSync(temporary, resolved);
}

function usage() {
	console.error(
		[
			"Usage:",
			"  bun scripts/work-item.mjs init <manifest.json> --source <source> --repository <owner/repo> --cwd <path> [--base <sha>] [--head <sha>] [--profile <profile>] [--authorization <level>]",
			"  bun scripts/work-item.mjs validate <manifest.json>",
			"  bun scripts/work-item.mjs receipt <manifest.json> --stage <stage> --from <receipt.json>",
			"  bun scripts/work-item.mjs section <manifest.json> --name <orchestration|outcome|close_cycle> --from <section.json>",
			"  bun scripts/work-item.mjs invalidate <manifest.json> --from-stage <stage> --reason <reason>",
			"  bun scripts/work-item.mjs annotations <manifest.json> [--output <annotations.json>]",
			"  bun scripts/work-item.mjs close-receipt <manifest.json>",
		].join("\n"),
	);
	process.exit(2);
}

if (!command || !target) usage();

try {
	if (command === "init") {
		const manifest = createWorkItemManifest({
			source: option("source"),
			repository: option("repository"),
			cwd: option("cwd"),
			base_sha: option("base"),
			head_sha: option("head"),
			profile: option("profile", "standard"),
			authorization: option("authorization", "read-only"),
		});
		const { errors } = validateWorkItemManifest(manifest);
		if (errors.length > 0) throw new Error(errors.join("\n"));
		writeAtomic(target, manifest);
		console.log(`Work item manifest created: ${resolve(target)}`);
		process.exit(0);
	}

	const manifest = readWorkItemManifest(resolve(target));
	if (command === "validate") {
		const { errors } = validateWorkItemManifest(manifest);
		if (errors.length > 0) throw new Error(errors.join("\n"));
		console.log("✓ work item manifest valid");
		process.exit(0);
	}
	if (command === "receipt") {
		const stage = option("stage");
		const source = option("from");
		if (!stage || !source || !(stage in manifest.stages)) usage();
		const receipt = JSON.parse(readFileSync(resolve(source), "utf8"));
		const next = structuredClone(manifest);
		next.stages[stage] = receipt;
		next.updated_at = new Date().toISOString();
		const { errors } = validateWorkItemManifest(next);
		if (errors.length > 0) throw new Error(errors.join("\n"));
		writeAtomic(target, next);
		console.log(`Stage receipt recorded: ${stage}`);
		process.exit(0);
	}
	if (command === "section") {
		const name = option("name");
		const source = option("from");
		if (
			!["orchestration", "outcome", "close_cycle"].includes(name) ||
			!source
		) {
			usage();
		}
		const value = JSON.parse(readFileSync(resolve(source), "utf8"));
		const next = structuredClone(manifest);
		next[name] = value;
		next.updated_at = new Date().toISOString();
		const { errors } = validateWorkItemManifest(next);
		if (errors.length > 0) throw new Error(errors.join("\n"));
		writeAtomic(target, next);
		console.log(`Manifest section recorded: ${name}`);
		process.exit(0);
	}
	if (command === "invalidate") {
		const stage = option("from-stage");
		const reason = option("reason");
		if (!stage || !reason) usage();
		const next = invalidateFrom(manifest, stage, reason);
		const { errors } = validateWorkItemManifest(next);
		if (errors.length > 0) throw new Error(errors.join("\n"));
		writeAtomic(target, next);
		console.log(`Downstream evidence invalidated from: ${stage}`);
		process.exit(0);
	}
	if (command === "annotations") {
		const annotations = skillkitAnnotations(manifest);
		const output = option("output");
		if (output) {
			writeAtomic(output, annotations);
			console.log(`SkillKit annotations written: ${resolve(output)}`);
		} else {
			process.stdout.write(`${JSON.stringify(annotations, null, 2)}\n`);
		}
		process.exit(0);
	}
	if (command === "close-receipt") {
		process.stdout.write(
			`${JSON.stringify(
				{
					handoff: manifest.close_cycle?.handoff ?? "pending",
					case: manifest.close_cycle?.case ?? "pending",
					git: manifest.close_cycle?.git ?? "pending",
					promotion: manifest.close_cycle?.promotion ?? "pending",
					outcome: manifest.outcome?.status ?? "unknown",
				},
				null,
				2,
			)}\n`,
		);
		process.exit(0);
	}
	usage();
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}
