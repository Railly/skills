import { expect, test } from "bun:test";
import { total } from "../src/total";

test("adds values", () => {
	expect(total([2, 3, 5])).toBe(10);
});
