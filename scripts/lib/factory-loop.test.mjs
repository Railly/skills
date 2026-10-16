import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repository = resolve(import.meta.dir, "../..");
const read = (path) => readFileSync(resolve(repository, path), "utf8");

describe("factory workflow contract", () => {
	test("loop scales ceremony by class and ends steps on command output", () => {
		const loop = read("skills/.experimental/loop/SKILL.md");
		const observe = loop.indexOf("## 3. Observe");
		const review = loop.indexOf("## 5. Review");
		const promote = loop.indexOf("## 6. Human promotion");
		const record = loop.indexOf("## 7. Record");
		expect(observe).toBeGreaterThan(-1);
		expect(review).toBeGreaterThan(observe);
		expect(promote).toBeGreaterThan(review);
		expect(record).toBeGreaterThan(promote);
		expect(loop).toContain("A step ends when its command says so.");
		expect(loop).toContain("`bash .agents/verify/fresh.sh` must exit 0");
		expect(loop).toContain("gate.sh drift <reviewed-patch-id>");
		expect(loop).toContain("Skill(ship)");
	});

	test("contract maps every acceptance item to an observation", () => {
		const contract = read("skills/.experimental/contract/SKILL.md");
		expect(contract).toContain("observe: <feature>");
		expect(contract).toContain("No acceptance item without an observation or a named gap.");
		for (const size of ["`trivial`", "`normal`", "`heavy`"]) expect(contract).toContain(size);
	});

	test("isolated review prefers FX through AI Gateway and excludes Cursor", () => {
		const review = read("skills/review-gate/SKILL.md");
		const runtime = read(
			"skills/solution-gate/references/orchestration-runtime.md",
		);
		expect(review).toContain("scripts/run-fx-review.mjs");
		expect(review).toContain("Vercel AI Gateway");
		expect(review).toContain("Cursor and `cursor-agent` are not supported");
		expect(runtime).toContain("execution_mode: fx_worker");
		expect(runtime).toContain("auth=AI_GATEWAY_API_KEY");
	});

	test("the public graph exposes observation, delivery, and case capture in order", () => {
		const graph = read("www/src/components/WorkflowGraph.astro");
		const select = graph.indexOf('name: "Select"');
		const contract = graph.indexOf('name: "Contract"');
		const shape = graph.indexOf('name: "Shape"');
		const implement = graph.indexOf('name: "Implement"');
		const observe = graph.indexOf('name: "Observe"');
		const review = graph.indexOf('name: "Review"');
		const show = graph.indexOf('name: "Show"');
		const promote = graph.indexOf('name: "Promote"');
		const deliver = graph.indexOf('name: "Deliver"');
		const record = graph.indexOf('name: "Record"');
		expect(select).toBeGreaterThan(-1);
		expect(contract).toBeGreaterThan(select);
		expect(shape).toBeGreaterThan(contract);
		expect(implement).toBeGreaterThan(shape);
		expect(observe).toBeGreaterThan(implement);
		expect(review).toBeGreaterThan(observe);
		expect(show).toBeGreaterThan(review);
		expect(promote).toBeGreaterThan(show);
		expect(deliver).toBeGreaterThan(promote);
		expect(record).toBeGreaterThan(deliver);
	});

	test("the public graph and release summary scale from current data", () => {
		const styles = read("www/src/styles/global.css");
		const evidence = read("www/src/components/EvidenceKey.astro");
		expect(styles).toContain(
			"grid-template-columns: repeat(10, minmax(145px, 1fr));",
		);
		expect(styles.match(/min-width: 1450px;/g)).toHaveLength(2);
		expect(evidence).toContain(
			'import { evaluatedCount, release, skills } from "../data/skills"',
		);
		expect(evidence).not.toContain("Release 0.0.5");
	});
});
