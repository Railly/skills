import { expect, test } from "bun:test";
import { runChild } from "../src/run";

test("runs the child", async () => {
	await expect(runChild({})).resolves.toBe("ready");
});

test("surfaces the child failure", async () => {
	await expect(runChild({ CI_SIM: "1" })).rejects.toThrow("spawn npm ENOENT");
});
