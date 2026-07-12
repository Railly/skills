import { expect, test } from "bun:test";
import { applyPrefix, namesForApps } from "../src/names";

test("keeps names unchanged without a prefix", () => {
	expect(namesForApps(["web", "docs"], null)).toEqual(["web", "docs"]);
});

test("applies a prefix to one name", () => {
	expect(applyPrefix("web", "feature-x")).toBe("feature-x.web");
});
