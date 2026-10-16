import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import * as esm from "/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/index.mjs";
import * as utils from "/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/store-utils.mjs";

const require = createRequire(import.meta.url);
const cjs = require("/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/index.js");
const observations = [];
for (const [format, core] of [["esm", esm], ["cjs", cjs]]) {
  const before = { items: [{ name: "first" }, { name: "second" }], keys: { "01": "literal" } };
  const after = { items: [{ name: "second" }, { name: "first" }], keys: { "01": "changed", "a/b~c": "escaped" } };
  const produced = core.diffToPatches(before, after);
  const compiler = core.createSpecStreamCompiler(structuredClone(before));
  const wire = produced.map(patch => JSON.stringify(patch)).join("\n") + "\n";
  for (let i = 0; i < wire.length; i += 7) compiler.push(wire.slice(i, i + 7));
  assert.deepEqual(compiler.getResult(), after);
  const moved = core.compileSpecStream([
    { op: "add", path: "/items", value: ["A", "B", "C"] },
    { op: "move", from: "/items/0", path: "/items/2" },
    { op: "move", from: "/items/01", path: "/bad" },
    { op: "move", from: "/items/0", path: "/items/01" },
    { op: "copy", from: "/items/1", path: "/items/-" },
    { op: "add", path: "/done", value: true },
  ].map(patch => JSON.stringify(patch)).join("\n"));
  assert.deepEqual(moved, { items: ["B", "C", "A", "C"], done: true });
  const store = core.createStateStore({ items: ["A"], keys: { "01": "literal" } });
  let notifications = 0;
  store.subscribe(() => notifications++);
  const initial = store.getSnapshot();
  store.update({ "/items/01": "bad", "/items/-/nested": "bad", "/constructor/blocked": true });
  assert.equal(store.getSnapshot(), initial);
  assert.equal(notifications, 0);
  store.update({ "/items": ["B", "C"], "/items/0": "B", "/keys/01": "changed" });
  assert.deepEqual(store.getSnapshot(), { items: ["B", "C"], keys: { "01": "changed" } });
  assert.equal(notifications, 1);
  assert.deepEqual(initial, { items: ["A"], keys: { "01": "literal" } });
  observations.push({ format, producer: "diffToPatches + JSON.stringify", patchCount: produced.length, fragmentedStream: "pass", moveCopyStream: "pass", rejectedSnapshotIdentity: true, notificationsAfterAcceptedBatch: notifications });
}

let snapshot = { items: ["A"] };
let writes = 0;
const adapter = utils.createStoreAdapter({
  getSnapshot: () => snapshot,
  setSnapshot: next => { snapshot = next; writes++; },
  subscribe: () => () => {},
});
const initial = snapshot;
adapter.update({ "/items/01": "bad", "/items/1e1": "bad" });
assert.equal(snapshot, initial);
assert.equal(writes, 0);
adapter.update({ "/items": ["B"], "/items/0": "B" });
assert.equal(writes, 1);
assert.deepEqual(snapshot, { items: ["B"] });
observations.push({ export: "store-utils", rejectedWrites: 0, acceptedBatchWrites: writes, identityPreserved: true });

const result = { status: "pass", head: "de6a9bdbc0100ac778dff1ad48ab2f732b7d181e", observations };
writeFileSync(new URL("./public-export-probe.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
