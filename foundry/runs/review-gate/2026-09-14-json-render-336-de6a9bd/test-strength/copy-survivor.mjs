import { readFileSync, writeFileSync, symlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = dirname(fileURLToPath(import.meta.url));
const { tmp } = JSON.parse(readFileSync(join(run, "isolation.json"), "utf8"));
const sourcePath = join(tmp, "src/types.ts");
const original = readFileSync(sourcePath, "utf8");
const anchor = 'case "copy": {\n      if (!patch.from) break;\n      const source = readByPath(obj, patch.from);\n      if (!source.valid || !source.exists) break;';
const mutation = original.replace(anchor, 'case "copy": {\n      if (!patch.from) break;\n      const source = readByPath(obj, patch.from);');
if (original === mutation) throw new Error("Mutation anchor absent");
try {
  symlinkSync("/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/node_modules", join(run, "node_modules"));
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
const observations = [];
function execute(name, args, cwd = run) {
  const p = spawnSync("/Users/raillyhugo/.nvm/versions/node/v24.18.0/bin/node", args, { cwd, encoding: "utf8", timeout: 30000 });
  writeFileSync(join(run, `logs/${name}.log`), (p.stdout ?? "") + (p.stderr ?? ""));
  observations.push({ name, exit_code: p.status, signal: p.signal, evidence: `logs/${name}.log` });
  console.log(JSON.stringify(observations.at(-1)));
}
try {
  writeFileSync(sourcePath, mutation);
  execute("copy-mutant-full-suite", [
    "/Users/raillyhugo/Programming/vercel/json-render-336-review/node_modules/vitest/vitest.mjs",
    "run", "--config", join(tmp, "vitest.config.mjs"),
  ], tmp);
  const built = await Bun.build({
    entrypoints: [join(tmp, "src/index.ts")],
    outdir: join(run, "mutated-copy"),
    target: "node",
    format: "esm",
    external: ["zod"],
  });
  if (!built.success) throw new Error(JSON.stringify(built.logs));
  execute("copy-mutant-own-key", [
    join(run, "copy-own-key-oracle.mjs"),
    join(run, "mutated-copy/index.js"),
    join(run, "copy-mutant-own-key.json"),
  ]);
} finally {
  writeFileSync(sourcePath, original);
}
execute("copy-restored-own-key", [
  join(run, "copy-own-key-oracle.mjs"),
  "/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/index.mjs",
  join(run, "copy-restored-own-key.json"),
]);
writeFileSync(join(run, "copy-survivor-results.json"), JSON.stringify(observations, null, 2));
