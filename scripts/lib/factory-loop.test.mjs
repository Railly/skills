import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repository = resolve(import.meta.dir, "../..");
const read = (path) => readFileSync(resolve(repository, path), "utf8");

describe("factory workflow contract", () => {
	test("hardening precedes final test strength", () => {
		const skill = read("skills/.experimental/software-factory/SKILL.md");
		const diagramHarden = skill.indexOf("→ 3. harden");
		const diagramStrengthen = skill.indexOf("→ 4. strengthen");
		const tableHarden = skill.indexOf("| harden |");
		const tableStrengthen = skill.indexOf("| strengthen |");
		expect(diagramHarden).toBeGreaterThan(-1);
		expect(diagramStrengthen).toBeGreaterThan(diagramHarden);
		expect(tableHarden).toBeGreaterThan(-1);
		expect(tableStrengthen).toBeGreaterThan(tableHarden);
		expect(skill).toContain("Skill(resilience-audit)");
		expect(skill).toContain("after any hardening fix, rerun Test Strength");
	});

	test("the master loop preserves independent downstream gates", () => {
		const skill = read("skills/.experimental/factory-loop/SKILL.md");
		const spec = skill.indexOf("## 5. Gate Spec and Standards separately");
		const show = skill.indexOf("## 6. Build the human acceptance artifact");
		const promote = skill.indexOf("## 7. Stop at the promotion gate");
		expect(spec).toBeGreaterThan(-1);
		expect(show).toBeGreaterThan(spec);
		expect(promote).toBeGreaterThan(show);
		expect(skill).toContain("Any code or contract change invalidates every downstream artifact");
		expect(skill).toContain("human promote → deliver → record");
		expect(skill).toContain("Skill(ship)");
		expect(skill).toContain("If an owning workflow is unavailable");
	});

	test("Herdr stays a runtime adapter instead of becoming a lifecycle owner", () => {
		const loop = read("skills/.experimental/factory-loop/SKILL.md");
		const factory = read("skills/.experimental/software-factory/SKILL.md");
		expect(loop).toContain("`herdr-workstreams` is an optional runtime adapter");
		expect(loop).toContain("Topology and lifecycle state never satisfy a phase");
		expect(factory).toContain("Skill(herdr-workstreams)");
		expect(factory).toContain("Visibility never satisfies a stage");
		expect(factory).toContain("Skill(resilience-audit)");
	});

	test("the public graph exposes Spec, delivery, and case capture in order", () => {
		const graph = read("www/src/components/WorkflowGraph.astro");
		const select = graph.indexOf('name: "Select"');
		const admit = graph.indexOf('name: "Admit"');
		const contract = graph.indexOf('name: "Contract"');
		const shape = graph.indexOf('name: "Shape"');
		const execute = graph.indexOf('name: "Execute"');
		const spec = graph.indexOf('name: "Spec"');
		const review = graph.indexOf('name: "Review"');
		const show = graph.indexOf('name: "Show"');
		const promote = graph.indexOf('name: "Promote"');
		const deliver = graph.indexOf('name: "Deliver"');
		const record = graph.indexOf('name: "Record"');
		expect(select).toBeGreaterThan(-1);
		expect(admit).toBeGreaterThan(select);
		expect(contract).toBeGreaterThan(admit);
		expect(shape).toBeGreaterThan(contract);
		expect(execute).toBeGreaterThan(shape);
		expect(spec).toBeGreaterThan(execute);
		expect(review).toBeGreaterThan(spec);
		expect(show).toBeGreaterThan(review);
		expect(promote).toBeGreaterThan(show);
		expect(deliver).toBeGreaterThan(promote);
		expect(record).toBeGreaterThan(deliver);
	});

	test("the public graph and release summary scale from current data", () => {
		const styles = read("www/src/styles/global.css");
		const evidence = read("www/src/components/EvidenceKey.astro");
		expect(styles).toContain("grid-template-columns: repeat(11, minmax(145px, 1fr));");
		expect(styles.match(/min-width: 1595px;/g)).toHaveLength(2);
		expect(evidence).toContain('import { evaluatedCount, release, skills } from "../data/skills"');
		expect(evidence).not.toContain("Release 0.0.5");
	});
});
