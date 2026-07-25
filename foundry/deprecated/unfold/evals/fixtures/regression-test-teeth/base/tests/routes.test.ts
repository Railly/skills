import { expect, test } from "bun:test";
import { findRoute } from "../src/routes";

test("finds a route by hostname", () => {
	const routes = [{ authority: "devbox.test:443", target: "app-a" }];
	expect(findRoute(routes, "devbox.test:443")?.target).toBe("app-a");
});
