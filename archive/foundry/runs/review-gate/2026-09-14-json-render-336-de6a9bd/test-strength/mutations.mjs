import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = dirname(fileURLToPath(import.meta.url));
const { tmp } = JSON.parse(readFileSync(join(run, "isolation.json"), "utf8"));
const model = JSON.parse(readFileSync(join(run, "model.json"), "utf8"));
const executable = "/Users/raillyhugo/Programming/vercel/json-render-336-review/node_modules/vitest/vitest.mjs";
const original = Object.fromEntries(
  ["path-utils.ts", "types.ts", "state-store.ts"].map((name) => [
    name,
    readFileSync(join(tmp, "src", name), "utf8"),
  ]),
);
const results = [];
mkdirSync(join(run, "logs"), { recursive: true });
function check(name, pattern) {
  const started = performance.now();
  const args = [executable, "run", "--config", join(tmp, "vitest.config.mjs")];
  if (pattern) args.push("-t", pattern);
  const p = spawnSync(process.execPath, args, {
    cwd: tmp,
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 2_000_000,
  });
  const output = (p.stdout ?? "") + (p.stderr ?? "");
  writeFileSync(join(run, "logs", `${name}.log`), output);
  const result = {
    name,
    command: [process.execPath, ...args],
    exit_code: p.status,
    signal: p.signal,
    duration_ms: Math.round(performance.now() - started),
    assertion_failure: /AssertionError|expected .* to|FAIL\s+src/.test(output),
    evidence: `logs/${name}.log`,
  };
  results.push(result);
  writeFileSync(join(run, "mutation-results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(result));
  return result;
}
function change(name, source, pattern, replace, tests) {
  if (!original[source].includes(pattern)) throw new Error(`No mutation anchor: ${name}`);
  writeFileSync(join(tmp, "src", source), original[source].replace(pattern, replace));
  try {
    check(name, tests);
  } finally {
    writeFileSync(join(tmp, "src", source), original[source]);
  }
}
check("baseline");
for (const [i, token] of model.invalid_tokens.entries()) {
  change(
    `invalid-token-${i}`,
    "path-utils.ts",
    "export function parseArrayIndex(token: string): number | undefined {",
    `export function parseArrayIndex(token: string): number | undefined {\n  if (token === ${JSON.stringify(token)}) return 1;`,
    "array JSON Pointer tokens",
  );
}
change(
  "move-callsite-preflight",
  "types.ts",
  "if (!canMoveByPath(obj, patch.from, patch.path, source.value)) {",
  "if (false) {",
  "malformed array paths",
);
change(
  "copy-callsite-source",
  "types.ts",
  'case "copy": {\n      if (!patch.from) break;\n      const source = readByPath(obj, patch.from);\n      if (!source.valid || !source.exists) break;',
  'case "copy": {\n      if (!patch.from) break;\n      const source = readByPath(obj, patch.from);',
  "malformed array paths",
);
change(
  "store-set-notification",
  "state-store.ts",
  "if (next === state) return;",
  "if (false) return;",
  "createStateStore",
);
check("restored-green");
