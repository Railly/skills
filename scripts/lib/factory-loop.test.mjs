import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repository = resolve(import.meta.dir, "../..");
const read = (path) => readFileSync(resolve(repository, path), "utf8");

describe("factory workflow contract", () => {
	test("loop scales ceremony by class and ends steps on command output", () => {
		const loop = read("skills/.experimental/loop/SKILL.md");
		const observe = loop.indexOf("## 3. Observe");
		const review = loop.indexOf("## 4. Review");
		const promote = loop.indexOf("## 5. Human promotion");
		const record = loop.indexOf("## 6. Record and correct");
		expect(observe).toBeGreaterThan(-1);
		expect(review).toBeGreaterThan(observe);
		expect(promote).toBeGreaterThan(review);
		expect(record).toBeGreaterThan(promote);
		expect(loop).toContain("A step ends when its command says so.");
		expect(loop).toContain("`bash .agents/verify/fresh.sh` must exit 0");
		expect(loop).toContain("gate.sh drift <reviewed-patch-id>");
		expect(loop).toContain("Skill(correct)");
		expect(loop).toContain("PRs target the default branch");
	});

	test("contract maps every acceptance item to an observation", () => {
		const contract = read("skills/.experimental/contract/SKILL.md");
		expect(contract).toContain("observe: <feature>");
		expect(contract).toContain("No acceptance item without an observation or a named gap.");
		for (const size of ["`trivial`", "`normal`", "`heavy`"]) expect(contract).toContain(size);
	});

	test("isolated review prefers FX through AI Gateway and excludes Cursor", () => {
		const review = read("skills/review-gate/SKILL.md");
		expect(review).toContain("scripts/run-fx-review.mjs");
		expect(review).toContain("Vercel AI Gateway");
		expect(review).toContain("Cursor and `cursor-agent` are not supported");
	});

	test("the public graph shows the core in order", () => {
		const graph = read("www/src/components/WorkflowGraph.astro");
		const order = ["Contract", "Implement", "Observe", "Review", "Promote", "Record", "Correct"].map(
			(name) => graph.indexOf(`name: "${name}"`),
		);
		expect(order[0]).toBeGreaterThan(-1);
		for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
	});

	test("the public graph and release summary scale from current data", () => {
		const styles = read("www/src/styles/global.css");
		const evidence = read("www/src/components/EvidenceKey.astro");
		expect(styles).toContain(
			"grid-template-columns: repeat(7, minmax(145px, 1fr));",
		);
		expect(styles.match(/min-width: 1015px;/g)).toHaveLength(2);
		expect(evidence).toContain(
			'import { evaluatedCount, release, skills } from "../data/skills"',
		);
		expect(evidence).not.toContain("Release 0.0.5");
	});
});
