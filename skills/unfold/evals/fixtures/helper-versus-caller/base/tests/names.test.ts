import { expect, test } from "bun:test";
import { namesForApps } from "../src/names";

test("keeps names unchanged without a prefix", () => {
	expect(namesForApps(["web", "docs"], null)).toEqual(["web", "docs"]);
});
