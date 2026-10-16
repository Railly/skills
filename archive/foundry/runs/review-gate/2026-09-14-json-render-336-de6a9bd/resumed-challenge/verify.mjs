import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inspect } from "node:util";

const out = dirname(fileURLToPath(import.meta.url));
const run = dirname(out);
const canonical = "/Users/raillyhugo/Programming/railly/skills";
const target = "/Users/raillyhugo/Programming/vercel/json-render-336-review";
const head = "de6a9bdbc0100ac778dff1ad48ab2f732b7d181e";
const base = "6c7164342a37fab055907f1666658e1333e2cb86";
const skillRevision = "77fdde3e8d7e13b7c27c7660f7c15619839e38af";
const started = new Date().toISOString();
const sha = (data) => "sha256:" + createHash("sha256").update(data).digest("hex");
const hashFile = (path) => sha(readFileSync(path));
const readJSON = (path) => JSON.parse(readFileSync(path, "utf8"));
const save = (name, value) => writeFileSync(join(out, name), JSON.stringify(value, null, 2) + "\n");
const clone = (value) => structuredClone(value);
const commands = [];
const observations = [];
let identity;
let replay;
let blocker = null;
function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  commands.push({ command: "git " + args.map((arg) => JSON.stringify(arg)).join(" "), cwd, exit_code: result.status, stdout_sha256: sha(result.stdout ?? ""), stderr: result.stderr });
  assert.equal(result.status, 0, `git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout;
}
function record(id, actual, expected, sources, diagnostic = false) {
  let pass = true;
  try { assert.deepStrictEqual(actual, expected); } catch { pass = false; }
  observations.push({ id, pass, diagnostic, sources, expected: inspect(expected, { depth: null, sorted: true }), actual: inspect(actual, { depth: null, sorted: true }) });
}
function hashes(paths) {
  return Object.fromEntries(paths.map((path) => [path, hashFile(path)]));
}
const corpus = readJSON(join(out, "corpus.json"));
const protectedPaths = ["manifest.json", "run-report.json", "run-report.md", "contract.json", "identity.json", "test-strength/corpus.mjs", "test-strength/model.json", "test-strength/corpus-results.json", "test-strength/receipt.json", "test-strength/copy-survivor-results.json"].map((path) => join(run, path));
const dist = join(target, "packages/core/dist");
const distPaths = readdirSync(dist).sort().map((name) => join(dist, name));
const protectedBefore = hashes(protectedPaths);
const distBefore = hashes(distPaths);
const corpusHash = hashFile(join(out, "corpus.json"));
try {
  const manifest = readJSON(join(run, "manifest.json"));
  assert.equal(manifest.work_item.head_sha, head);
  assert.equal(manifest.work_item.base_sha, base);
  assert.equal(manifest.work_item.authorization, "read-only");
  assert.equal(git(target, "rev-parse", "HEAD").trim(), head);
  assert.equal(git(target, "rev-parse", `${base}^{commit}`).trim(), base);
  assert.equal(git(target, "status", "--porcelain=v1"), "");
  assert.equal(git(canonical, "rev-parse", "HEAD").trim(), skillRevision);
  assert.equal(git(canonical, "rev-parse", `${skillRevision}:skills/review-gate`).trim(), "54c8a332dab0febea175fc4fc375785e8745e6c4");
  assert.equal(git(canonical, "status", "--porcelain=v1", "--", "skills/review-gate"), "");
  const changedPaths = git(target, "diff", "--name-only", base, head).trim().split("\n");
  assert.deepEqual(changedPaths, readJSON(join(run, "identity.json")).changed_paths);
  assert.equal(sha(JSON.stringify(readJSON(join(run, "contract.json")))), manifest.stages.review.fingerprint.contract_digest);
  const mapChecks = [];
  for (const path of distPaths.filter((path) => path.endsWith(".map"))) {
    const map = readJSON(path);
    for (let i = 0; i < map.sources.length; i++) {
      const source = resolve(dirname(path), map.sources[i]);
      assert.ok(source.startsWith(join(target, "packages/core/src") + "/"));
      const current = readFileSync(source, "utf8");
      const committed = git(target, "show", `${head}:${relative(target, source)}`);
      assert.equal(map.sourcesContent[i], committed, `source map HEAD mismatch: ${source}`);
      assert.equal(current, committed, `current source HEAD mismatch: ${source}`);
      mapChecks.push({ map: relative(target, path), source: relative(target, source), source_sha256: sha(committed), matches_head: true });
    }
  }
  for (const required of ["packages/core/src/path-utils.ts", "packages/core/src/types.ts", "packages/core/src/state-store.ts", "packages/core/src/store-utils.ts"]) {
    assert.ok(mapChecks.some((check) => check.source === required), `Missing source-map identity: ${required}`);
  }
  const sourceEvidence = {};
  for (const [key, ref] of Object.entries(corpus.sources)) {
    const path = ref.path.startsWith("target:") ? join(target, ref.path.slice(7)) : resolve(out, ref.path);
    const text = readFileSync(path, "utf8");
    if (ref.path.startsWith("target:")) assert.equal(text, git(target, "show", `${head}:${relative(target, path)}`));
    sourceEvidence[key] = { ...ref, resolved_path: path, sha256: sha(text), excerpt: text.split("\n").slice(ref.lines[0] - 1, ref.lines[1]).join("\n") };
  }
  identity = { target, head_sha: head, base_sha: base, dirty_digest: "clean", authorization: "read-only", changed_paths: changedPaths, contract_digest: sha(JSON.stringify(readJSON(join(run, "contract.json")))), contract_file_sha256: hashFile(join(run, "contract.json")), contract_digest_serialization: "JSON.stringify(JSON.parse(file)), preserving key order", skill_revision: `git:${skillRevision}`, skill_tree: "git-tree:54c8a332dab0febea175fc4fc375785e8745e6c4", runtime: { executable: process.execPath, bun: process.versions.bun ?? null, node_compatibility: process.version, os: process.platform, arch: process.arch }, build_log: { path: join(run, "core-build.log"), sha256: hashFile(join(run, "core-build.log")) }, build_binding: "Saved successful build log plus all current sourcemap sourcesContent compared byte-for-byte to exact HEAD. No rebuild or signed build attestation; output bytes pinned by hashes.", dist_sha256: distBefore, source_map_checks: mapChecks };
  save("oracle-freeze.json", { frozen_before_production_import: true, timestamp: new Date().toISOString(), corpus_sha256: corpusHash, runner_sha256: hashFile(fileURLToPath(import.meta.url)), sources: sourceEvidence, identity });
  const pkg = readJSON(join(target, "packages/core/package.json"));
  const require = createRequire(import.meta.url);
  const formats = [
    ["esm", await import(pathToFileURL(join(target, "packages/core", pkg.exports["."].import)).href), await import(pathToFileURL(join(target, "packages/core", pkg.exports["./store-utils"].import)).href)],
    ["cjs", require(join(target, "packages/core", pkg.exports["."].require)), require(join(target, "packages/core", pkg.exports["./store-utils"].require))],
  ];
  for (const [format, core, utils] of formats) {
    for (const test of corpus.pointer_cases) {
      record(`${format}/${test.id}`, core.getByPath(clone(test.input ?? corpus.pointer_document), test.path), test.expected, test.sources, Boolean(test.scope));
    }
    for (const test of [...corpus.patch_cases, ...corpus.compound_policy_cases]) {
      const direct = clone(test.input);
      for (const patch of clone(test.patches)) core.applySpecStreamPatch(direct, patch);
      record(`${format}/${test.id}/public-apply`, direct, test.expected, test.sources);
      for (const chunkSize of [1, 7]) {
        const compiler = core.createSpecStreamCompiler(clone(test.input));
        const wire = test.patches.map((patch) => JSON.stringify(patch)).join("\n") + "\n";
        for (let i = 0; i < wire.length; i += chunkSize) compiler.push(wire.slice(i, i + chunkSize));
        record(`${format}/${test.id}/jsonl-${chunkSize}`, compiler.getResult(), test.expected, test.sources);
      }
    }
    for (const policy of [corpus.array_policy, corpus.range_policy]) {
      for (const token of policy.invalid_tokens ?? policy.tokens) {
        for (const position of ["leaf", "intermediate"]) {
          const path = `/items/${token}${position === "intermediate" ? "/child" : ""}`;
          record(`${format}/array/${JSON.stringify(token)}/${position}/get`, core.getByPath(clone(corpus.array_policy.input), path), undefined, policy.sources);
          for (const operation of ["setByPath", "addByPath", "removeByPath"]) {
            const data = clone(corpus.array_policy.input);
            core[operation](data, path, corpus.array_policy.write_value);
            record(`${format}/array/${JSON.stringify(token)}/${position}/${operation}`, data, policy.expected_after_write_or_remove, policy.sources);
            record(`${format}/array/${JSON.stringify(token)}/${position}/${operation}/own-keys`, Object.keys(data.items), corpus.array_policy.expected_own_keys, policy.sources);
          }
        }
      }
    }
    for (const test of corpus.store_policy_cases) {
      for (const kind of ["store", "adapter"]) {
        let events = 0;
        let snapshot = clone(test.input);
        const before = snapshot;
        const store = kind === "store" ? core.createStateStore(snapshot) : utils.createStoreAdapter({ getSnapshot: () => snapshot, setSnapshot: (next) => { snapshot = next; events++; }, subscribe: () => () => {} });
        if (kind === "store") store.subscribe(() => events++);
        const prior = store.getSnapshot();
        store.update(clone(test.updates));
        record(`${format}/${test.id}/${kind}/value`, store.getSnapshot(), test.expected, test.sources);
        record(`${format}/${test.id}/${kind}/identity`, store.getSnapshot() === prior, test.expected_same_identity, test.sources);
        record(`${format}/${test.id}/${kind}/events`, events, test.expected_events, test.sources);
        record(`${format}/${test.id}/${kind}/original-snapshot`, before, test.input, test.sources);
      }
    }
    const reserved = corpus.reserved_policy;
    for (const token of reserved.tokens) {
      const path = `/records/${token}`;
      record(`${format}/reserved/${token}/read-own-member`, core.getByPath(clone(reserved.input), path), undefined, reserved.sources);
      for (const operation of ["setByPath", "addByPath", "removeByPath"]) {
        const data = clone(reserved.input);
        core[operation](data, path, "bad");
        record(`${format}/reserved/${token}/${operation}`, data, reserved.expected_after_mutation, reserved.sources);
      }
      const store = core.createStateStore(clone(reserved.input));
      const before = store.getSnapshot();
      let events = 0;
      store.subscribe(() => events++);
      store.set(path, "bad");
      store.update({ [path]: "bad" });
      record(`${format}/reserved/${token}/store-identity`, store.getSnapshot() === before, true, reserved.sources);
      record(`${format}/reserved/${token}/store-events`, events, 0, reserved.sources);
      for (const op of ["move", "copy"]) {
        for (const partition of ["source", "destination"]) {
          const patch = partition === "source" ? { op, from: path, path: "/result" } : { op, from: "/source", path };
          const compiler = core.createSpecStreamCompiler(clone(reserved.input));
          compiler.push(JSON.stringify(patch) + "\n");
          record(`${format}/reserved/${token}/${op}/${partition}`, compiler.getResult(), reserved.expected_after_mutation, reserved.sources);
        }
      }
    }
  }
  const original = readFileSync(join(run, "test-strength/corpus.mjs"), "utf8");
  const relocation = [
    ["const run = dirname(fileURLToPath(import.meta.url));", `const run = ${JSON.stringify(join(run, "test-strength"))};`],
    ["writeFileSync(join(run, \"corpus-results.json\"),", "writeFileSync(new URL(\"./reused-corpus-results.json\", import.meta.url),"],
  ];
  let relocated = original;
  for (const [from, to] of relocation) {
    assert.equal(relocated.split(from).length, 2);
    relocated = relocated.replace(from, to);
  }
  writeFileSync(join(out, "reused-corpus.mjs"), relocated);
  const replayCommand = [process.execPath, join(out, "reused-corpus.mjs")];
  const replayProcess = spawnSync(replayCommand[0], replayCommand.slice(1), { cwd: out, encoding: "utf8" });
  writeFileSync(join(out, "reused-corpus.stdout.log"), replayProcess.stdout ?? "");
  writeFileSync(join(out, "reused-corpus.stderr.log"), replayProcess.stderr ?? "");
  replay = { command: replayCommand, cwd: out, exit_code: replayProcess.status, signal: replayProcess.signal, source_sha256: sha(original), relocated_sha256: sha(relocated), replacements: relocation, scope: "Exact saved assertions and oracle reused with only input/output relocation. Supplemental regression evidence, not sole proof of external normative independence." };
  assert.equal(replayProcess.status, 0, replayProcess.stderr);
  const replayResult = readJSON(join(out, "reused-corpus-results.json"));
  const oldResult = readJSON(join(run, "test-strength/corpus-results.json"));
  assert.equal(replayResult.assertions, oldResult.assertions);
  assert.equal(replayResult.tokenCount, oldResult.tokenCount);
  assert.deepEqual(replayResult.observations, oldResult.observations);
  replay.result = replayResult;
  assert.equal(hashFile(join(out, "corpus.json")), corpusHash);
  assert.deepEqual(hashes(protectedPaths), protectedBefore);
  assert.deepEqual(hashes(distPaths), distBefore);
  assert.equal(git(target, "rev-parse", "HEAD").trim(), head);
  assert.equal(git(target, "status", "--porcelain=v1"), "");
} catch (error) {
  blocker = error.stack ?? String(error);
}
const failures = observations.filter((entry) => !entry.pass && !entry.diagnostic);
const divergences = observations.filter((entry) => !entry.pass && entry.diagnostic);
const satisfied = !blocker && failures.length === 0 && observations.some((entry) => entry.pass && entry.id.includes("6902-A7"));
const evidence = { started_at: started, finished_at: new Date().toISOString(), identity, corpus_sha256: corpusHash, commands, observations, replay, blocker, summary: { checks: observations.length, passed: observations.filter((entry) => entry.pass).length, unexpected_failures: failures.length, normative_diagnostic_mismatches: divergences.length, full_rfc_conformance_claimed: false }, protected_files_before: protectedBefore, protected_files_after: hashes(protectedPaths), dist_files_after: hashes(distPaths), limits: corpus.limits };
save("execution.json", evidence);
const receipt = {
  schema_version: 1,
  obligation: "independent_challenge",
  repository: "vercel-labs/json-render",
  pr: 336,
  head_sha: head,
  base_sha: base,
  dirty_digest: identity?.dirty_digest ?? "unverified",
  required: true,
  satisfied,
  status: satisfied ? "satisfied" : "blocked",
  method: "reference_oracle",
  independence_type: corpus.independence_type,
  model_independence_claimed: false,
  execution_mode: "sequential_local_reference_corpus",
  degraded_from: "inherited fx_worker/native_subagent attempt, not retried",
  independence_gap: "No cross-model-family, independent human or blinded reviewer provenance. Corpus authorship follows inherited implementation exposure; its external normative oracle does not derive from production.",
  artifact: join(out, "corpus.json"),
  evidence: [join(out, "oracle-freeze.json"), join(out, "execution.json"), join(out, "reused-corpus-results.json"), join(out, "provenance.md")],
  evidence_sha256: { corpus: corpusHash, execution: hashFile(join(out, "execution.json")), runner: hashFile(fileURLToPath(import.meta.url)) },
  skill_revision: `git:${skillRevision}`,
  command: `bun ${join(out, "verify.mjs")}`,
  exit_code: satisfied ? 0 : 1,
  summary: evidence.summary,
  normative_diagnostic_mismatches: divergences,
  blocker: blocker ?? (failures.length ? failures : null),
  reason: satisfied ? "The saved RFC 6901/6902 texts supply explicit example outputs and object/array, decoding, insertion and move/copy rules independent of production. Frozen fixtures exercise both existing public package formats and actual JSONL compiler boundaries. Product-only expected values are separately attributed and not passed off as RFC requirements. Root-slash normative mismatches remain explicit. This closes only the independent challenge-source obligation." : "Independent challenge not discharged; inspect blocker and failed expectations without changing the oracle.",
  review_gate_pass: false,
  existing_stage_receipts_changed: false,
  manifest_or_run_report_changed: false,
  fixes_publication_installs_builds_mutations: false,
  limits: corpus.limits,
};
save("receipt.json", receipt);
console.log(JSON.stringify({ satisfied, checks: evidence.summary, reused_corpus_assertions: replay?.result?.assertions ?? null, replay_exit_code: replay?.exit_code ?? null, blocker, receipt: join(out, "receipt.json") }, null, 2));
process.exitCode = receipt.exit_code;
