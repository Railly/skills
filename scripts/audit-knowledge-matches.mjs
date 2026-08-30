import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	buildDraftAudit,
	summarizeTextualMatchAudit,
	validateTextualMatchAudit,
} from "./lib/knowledge-audit.mjs";

const repository = resolve(import.meta.dirname, "..");
const maturity = JSON.parse(
	readFileSync(resolve(repository, "foundry/maturity.json"), "utf8"),
);
const skillNames = Object.keys(maturity.skills).sort();
const auditPath = resolve(
	repository,
	"foundry/knowledge/audits/2026-08-29-textual-match-audit.json",
);
const summaryPath = resolve(
	repository,
	"foundry/knowledge/audits/2026-08-29-textual-match-coverage.md",
);

if (process.argv.includes("--write-draft")) {
	const draft = buildDraftAudit(repository, skillNames);
	writeFileSync(auditPath, `${JSON.stringify(draft, null, 2)}\n`);
	console.log(`Drafted ${draft.records.length} skill-file classifications.`);
	process.exit(0);
}

if (!existsSync(auditPath)) {
	console.error("ERROR missing textual match audit");
	process.exit(1);
}

const audit = JSON.parse(readFileSync(auditPath, "utf8"));
const validation = validateTextualMatchAudit(repository, skillNames, audit);
if (validation.errors.length > 0) {
	for (const error of validation.errors) console.error(`ERROR ${error}`);
	process.exit(1);
}

const summary = summarizeTextualMatchAudit(audit);
if (process.argv.includes("--check")) {
	if (
		!existsSync(summaryPath) ||
		readFileSync(summaryPath, "utf8") !== summary
	) {
		console.error(
			"STALE foundry/knowledge/audits/2026-08-29-textual-match-coverage.md",
		);
		process.exit(1);
	}
} else {
	writeFileSync(summaryPath, summary);
}

console.log(
	`Textual match audit valid: ${audit.records.length} skill-file pairs.`,
);
