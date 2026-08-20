import { describe, expect, test } from "bun:test";
import {
	artifactType,
	lensName,
	normalizeLensName,
	normalizeRepo,
	repoReference,
	tallyLenses,
} from "./run-report-identity.mjs";

describe("normalizeLensName", () => {
	test("collapses the spelling variants observed in the corpus", () => {
		// Every group below appears in foundry/runs/review-gate as separate strings.
		const groups = [
			["Docs-behavior parity", "docs-behavior parity", "docs-behavior-parity"],
			[
				"Error-path forcing",
				"error-path forcing",
				"error-path-forcing",
				"error-path forcing (missing/corrupt sources)",
			],
			[
				"Dogfood the built artifact",
				"dogfood the built artifact",
				"dogfood-the-built-artifact",
			],
			[
				"Cancellation and timeout hygiene",
				"cancellation and timeout hygiene",
				"cancellation-and-timeout-hygiene",
			],
		];
		for (const variants of groups) {
			const normalized = new Set(variants.map(normalizeLensName));
			expect(normalized.size).toBe(1);
		}
	});

	test("keeps distinct lenses distinct", () => {
		expect(normalizeLensName("Substrate verification")).not.toBe(
			normalizeLensName("Substrate differential corpus"),
		);
		expect(normalizeLensName("Choice audit")).not.toBe(
			normalizeLensName("Complexity budget"),
		);
	});

	test("rejects non-strings without throwing", () => {
		expect(normalizeLensName(null)).toBe("");
		expect(normalizeLensName(42)).toBe("");
	});
});

describe("lensName", () => {
	test("reads every entry shape the corpus recorded", () => {
		expect(lensName({ name: "Choice audit", status: "run" })).toBe(
			"Choice audit",
		);
		expect(lensName({ lens: "choice-audit", disposition: "run" })).toBe(
			"choice-audit",
		);
		expect(lensName(" bare string lens ")).toBe("bare string lens");
		expect(lensName(null)).toBe("");
	});
});

describe("normalizeRepo", () => {
	test("collapses the bare name onto the owner-qualified name", () => {
		const owner = "vercel-labs";
		expect(normalizeRepo("agent-browser", { defaultOwner: owner })).toBe(
			normalizeRepo("vercel-labs/agent-browser"),
		);
	});

	test("strips an inline issue reference", () => {
		expect(normalizeRepo("vercel-labs/agent-browser#1669")).toBe(
			"vercel-labs/agent-browser",
		);
		expect(normalizeRepo("vercel-labs/wterm#107")).toBe("vercel-labs/wterm");
	});

	test("keeps different repositories apart", () => {
		expect(normalizeRepo("vercel-labs/wterm")).not.toBe(
			normalizeRepo("vercel-labs/portless"),
		);
		expect(
			normalizeRepo("petdex", { defaultOwner: "crafter-station" }),
		).not.toBe(normalizeRepo("vercel-labs/petdex"));
	});

	test("does not invent an owner when none is supplied", () => {
		expect(normalizeRepo("agent-browser")).toBe("agent-browser");
	});
});

describe("repoReference", () => {
	test("recovers the reference normalizeRepo drops", () => {
		expect(repoReference("vercel-labs/agent-browser#1669")).toBe(1669);
		expect(repoReference("vercel-labs/agent-browser")).toBeNull();
	});
});

describe("artifactType", () => {
	test("separates run reports from Radius impact maps", () => {
		expect(artifactType({ run: { date: "2026-08-19" }, findings: [] })).toBe(
			"run-report",
		);
		expect(
			artifactType({ changed: [], impacted: [], stats: {} }),
		).toBe("impact-map");
		expect(artifactType({ unrelated: true })).toBe("unknown");
		expect(artifactType(null)).toBe("unknown");
	});
});

describe("tallyLenses", () => {
	test("merges spelling variants into one bucket and records them", () => {
		const tally = tallyLenses({
			lenses: [
				{ name: "Docs-behavior parity", status: "run" },
				{ name: "docs-behavior parity", status: "skipped" },
				{ name: "docs-behavior-parity", status: "run" },
			],
		});
		expect(tally.size).toBe(1);
		const bucket = tally.get("docs-behavior-parity");
		expect(bucket.total).toBe(3);
		expect(bucket.run).toBe(2);
		expect(bucket.skipped).toBe(1);
		expect(bucket.variants.size).toBe(3);
	});

	test("returns an empty tally for a report without lenses", () => {
		expect(tallyLenses({}).size).toBe(0);
		expect(tallyLenses(null).size).toBe(0);
	});
});
