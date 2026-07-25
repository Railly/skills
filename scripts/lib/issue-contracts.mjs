import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const requiredHeadings = [
	"Outcome",
	"Observed",
	"Expected",
	"Acceptance",
	"Non-goals",
	"Invariants",
	"Change surface",
	"Verification",
	"Risk",
	"Promotion",
];
const missionStates = new Set([
	"selected",
	"reproducing",
	"reproduced",
	"implementing",
	"proof-ready",
	"spec-reviewed",
	"standards-reviewed",
	"closed",
]);

function markdownFiles(path) {
	if (!existsSync(path)) return [];
	if (statSync(path).isFile()) return path.endsWith(".md") ? [path] : [];
	return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
		markdownFiles(join(path, entry.name)),
	);
}

function section(text, heading) {
	const marker = `## ${heading}\n`;
	const start = text.indexOf(marker);
	if (start === -1) return "";
	const body = text.slice(start + marker.length);
	const end = body.search(/^## /m);
	return end === -1 ? body : body.slice(0, end);
}

export function defaultIssueContractPaths(repository) {
	return [
		resolve(
			repository,
			"foundry/candidates/2026-07-issue-contract-pilot/contracts",
		),
		resolve(repository, "foundry/missions"),
	];
}

export function validateIssueContracts(repository, inputs = []) {
	const roots = inputs.length
		? inputs.map((path) => resolve(path))
		: defaultIssueContractPaths(repository);
	const files = roots
		.flatMap(markdownFiles)
		.filter((file) => !["README.md", "_template.md"].includes(basename(file)));
	const errors = [];

	for (const file of files) {
		const text = readFileSync(file, "utf8");
		for (const heading of requiredHeadings) {
			if (!new RegExp(`^## ${heading}$`, "m").test(text)) {
				errors.push(`${file}: missing heading "${heading}"`);
			}
		}
		if (/\.agents\/skills|\.claude\/skills/.test(text)) {
			errors.push(`${file}: installed skill path is not a valid destination`);
		}

		const acceptance = [...text.matchAll(/^- (A\d+):/gm)].map(
			(match) => match[1],
		);
		const nonGoals = [...text.matchAll(/^- (N\d+):/gm)].map(
			(match) => match[1],
		);
		const invariants = [...text.matchAll(/^- (I\d+):/gm)].map(
			(match) => match[1],
		);
		for (const [label, ids] of [
			["acceptance", acceptance],
			["non-goal", nonGoals],
			["invariant", invariants],
		]) {
			if (ids.length === 0) errors.push(`${file}: missing ${label} IDs`);
			if (new Set(ids).size !== ids.length) {
				errors.push(`${file}: duplicate ${label} ID`);
			}
		}

		const verification = section(text, "Verification");
		if (!/->/.test(verification) || !/\b[AI]\d+\b/.test(verification)) {
			errors.push(
				`${file}: verification must map a command or oracle to claim IDs`,
			);
		}

		if (file.includes(`${join("foundry", "missions")}/`)) {
			const state = text.match(/^Status: ([a-z-]+)$/m)?.[1];
			if (!state || !missionStates.has(state)) {
				errors.push(`${file}: invalid or missing live mission Status`);
			}
			for (const heading of ["Handoff", "Contract changes"]) {
				if (!new RegExp(`^## ${heading}$`, "m").test(text)) {
					errors.push(`${file}: live mission missing heading "${heading}"`);
				}
			}
			for (const id of acceptance) {
				if (!new RegExp(`\\b${id}\\b`).test(verification)) {
					errors.push(`${file}: ${id} has no verification mapping`);
				}
			}
		}
	}

	return { files, errors };
}
