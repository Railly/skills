import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const core = await import(pathToFileURL(process.argv[2]).href);
const state = { items: ["zero", "one"] };
core.applySpecStreamPatch(state, { op: "copy", from: "/items/01", path: "/copy" });
const observation = {
  state,
  keys: Object.keys(state),
  forbiddenOwnProperty: Object.hasOwn(state, "copy"),
  copiedValueIsUndefined: state.copy === undefined,
};
writeFileSync(process.argv[3], JSON.stringify(observation, null, 2));
console.log(JSON.stringify(observation));
assert.equal(observation.forbiddenOwnProperty, false, "Rejected copy must not create an own undefined property");
