import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = "/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-json-render-336-de6a9bd/test-strength";
const checkout = "/Users/raillyhugo/Programming/vercel/json-render-336-review";
const esm = await import(`${checkout}/packages/core/dist/index.mjs`);
const utils = await import(`${checkout}/packages/core/dist/store-utils.mjs`);
const require = createRequire(import.meta.url);
const cjs = require(`${checkout}/packages/core/dist/index.js`);
const model = JSON.parse(readFileSync(join(run, "model.json"), "utf8"));
const started = performance.now();
let seed = 336;
const next = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
};
const tokens = new Set([...model.invalid_tokens, "-", "length", "0", "1", "2", "4294967294", "a~b", "a/b"]);
for (let i = 0; i < 250; i++) {
  const n = String(next() % 1000);
  tokens.add(["0" + n, n + "x", "+" + n, "-" + n, n + ".5", n + "e1", " " + n, n + "\n"][next() % 8]);
}
const encode = (s) => s.replaceAll("~", "~0").replaceAll("/", "~1");
function arrayIndexOracle(token) {
  const array = [];
  try {
    Object.defineProperty(array, token, { value: "sentinel", configurable: true });
    return array.length !== 0;
  } catch {
    return false;
  }
}
const observations = [];
let assertions = 0;
function eq(actual, expected, label) {
  assert.deepStrictEqual(actual, expected, label);
  assertions++;
}
for (const [format, core] of [["esm", esm], ["cjs", cjs]]) {
  let invalid = 0;
  let validReads = 0;
  for (const token of tokens) {
    const encoded = encode(token);
    if (arrayIndexOracle(token)) {
      const source = { items: ["zero", "one"] };
      eq(core.getByPath(source, `/items/${encoded}`), source.items[token], `${format}: canonical read ${token}`);
      validReads++;
      continue;
    }
    if (token === "-") continue;
    invalid++;
    const data = { items: ["zero", "one"] };
    eq(core.getByPath(data, `/items/${encoded}`), undefined, `${format}: invalid read ${token}`);
    for (const op of ["setByPath", "addByPath", "removeByPath"]) {
      const value = structuredClone(data);
      core[op](value, `/items/${encoded}`, "bad");
      eq(value, data, `${format}: ${op} ${token}`);
      eq(Object.keys(value.items), ["0", "1"], `${format}: own array keys ${token}`);
      const nested = { items: [{ nested: ["zero", "one"] }] };
      core[op](nested, `/items/0/nested/${encoded}/child`, "bad");
      eq(nested, { items: [{ nested: ["zero", "one"] }] }, `${format}: intermediate ${op} ${token}`);
    }
    const object = { records: {} };
    core.setByPath(object, `/records/${encoded}`, "literal");
    eq(object.records[token], "literal", `${format}: literal object ${token}`);
    const store = core.createStateStore(structuredClone(data));
    const before = store.getSnapshot();
    let notifications = 0;
    store.subscribe(() => notifications++);
    store.set(`/items/${encoded}`, "bad");
    store.update({ [`/items/${encoded}`]: "bad" });
    eq(store.getSnapshot() === before, true, `${format}: store identity ${token}`);
    eq(notifications, 0, `${format}: store notification ${token}`);
    for (const op of ["copy", "move"]) {
      for (const partition of ["source", "destination"]) {
        const initial = { source: "keep", items: ["zero", "one"] };
        const patch = partition === "source"
          ? { op, from: `/items/${encoded}`, path: "/result" }
          : { op, from: "/source", path: `/items/${encoded}` };
        const stream = [
          { op: "add", path: "/state", value: initial },
          { ...patch, from: "/state" + patch.from, path: "/state" + patch.path },
          { op: "add", path: "/state/later", value: true },
        ].map((line) => JSON.stringify(line)).join("\n") + "\n";
        const compiler = core.createSpecStreamCompiler({});
        for (let p = 0; p < stream.length; p += 7) compiler.push(stream.slice(p, p + 7));
        const result = compiler.getResult();
        eq(result.state, { ...initial, later: true }, `${format}: streamed ${op} invalid ${partition} ${token}`);
        eq(Object.hasOwn(result.state, "result"), false, `${format}: no undefined own property ${op} ${token}`);
      }
    }
  }
  observations.push({ format, invalidTokens: invalid, canonicalReads: validReads });
}
let adapterSnapshot = { items: ["zero", "one"], count: 0 };
let writes = 0;
const adapter = utils.createStoreAdapter({
  getSnapshot: () => adapterSnapshot,
  setSnapshot: (nextState) => {
    adapterSnapshot = nextState;
    writes++;
  },
  subscribe: () => () => {},
});
const prior = adapterSnapshot;
adapter.update({ "/items/01": "bad" });
eq(adapterSnapshot === prior, true, "adapter rejected identity");
eq(writes, 0, "adapter rejected count");
adapter.update({ "/items/01": "bad", "/count": 1 });
eq(adapterSnapshot, { items: ["zero", "one"], count: 1 }, "adapter mixed batch");
eq(writes, 1, "adapter mixed count");
const output = {
  seed: 336,
  tokenCount: tokens.size,
  assertions,
  observations,
  duration_ms: Math.round(performance.now() - started),
  oracle: "ECMAScript Array exotic own-property behavior through Object.defineProperty; no production parser used for expected classification.",
  producer: "JSON.stringify emits line-delimited operations; the built compiler consumes every stream in seven-character fragments.",
  status: "pass",
};
writeFileSync(new URL("./reused-corpus-results.json", import.meta.url), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
