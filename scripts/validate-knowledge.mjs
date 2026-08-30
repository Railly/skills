import { resolve } from "node:path";
import { loadKnowledge, validateKnowledge } from "./lib/knowledge.mjs";
import {
	validateKnowledgeAuditAlignment,
	validateTextualMatchAudit,
} from "./lib/knowledge-audit.mjs";

const repository = resolve(import.meta.dirname, "..");
const enforceMaturity = process.argv.includes("--enforce-maturity");
let knowledge;
try {
	knowledge = loadKnowledge(repository);
} catch (error) {
	console.error(`ERROR ${error.message}`);
	process.exit(1);
}
const validation = validateKnowledge(repository, knowledge, {
	enforceMaturity,
});
if (!knowledge.audit) {
	validation.errors.push("missing reviewed textual match audit");
} else {
	validation.errors.push(
		...validateTextualMatchAudit(
			repository,
			Object.keys(knowledge.maturity.skills),
			knowledge.audit,
		).errors,
		...validateKnowledgeAuditAlignment(knowledge, knowledge.audit).errors,
	);
}

for (const warning of validation.warnings) console.warn(`WARN ${warning}`);
if (validation.errors.length > 0) {
	for (const error of validation.errors) console.error(`ERROR ${error}`);
	process.exit(1);
}

console.log(
	`Knowledge valid: ${knowledge.patterns.length} pattern(s), ${knowledge.skills.length} skill provenance page(s).`,
);
