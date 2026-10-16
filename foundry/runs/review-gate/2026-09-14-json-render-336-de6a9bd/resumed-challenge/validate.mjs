import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = dirname(fileURLToPath(import.meta.url));
const readJSON = (name) => JSON.parse(readFileSync(join(out, name), "utf8"));
const hash = (path) => "sha256:" + createHash("sha256").update(readFileSync(path)).digest("hex");
const receipt = readJSON("receipt.json");
const execution = readJSON("execution.json");
const frozen = readJSON("oracle-freeze.json");
const corpus = readJSON("corpus.json");
assert.equal(receipt.satisfied, true);
assert.equal(receipt.model_independence_claimed, false);
assert.equal(receipt.review_gate_pass, false);
assert.equal(receipt.exit_code, 0);
assert.equal(receipt.evidence_sha256.corpus, hash(join(out, "corpus.json")));
assert.equal(receipt.evidence_sha256.execution, hash(join(out, "execution.json")));
assert.equal(receipt.evidence_sha256.runner, hash(join(out, "verify.mjs")));
assert.equal(frozen.corpus_sha256, receipt.evidence_sha256.corpus);
assert.equal(frozen.runner_sha256, receipt.evidence_sha256.runner);
assert.equal(frozen.frozen_before_production_import, true);
assert.deepEqual(execution.summary, receipt.summary);
assert.equal(execution.summary.checks, execution.observations.length);
assert.equal(execution.summary.unexpected_failures, 0);
assert.equal(execution.summary.normative_diagnostic_mismatches, 2);
assert.ok(receipt.normative_diagnostic_mismatches.every((entry) => entry.id.endsWith("6901-5-empty-member-diagnostic") && entry.expected === "0" && !entry.pass));
assert.equal(execution.replay.exit_code, 0);
assert.equal(execution.replay.result.assertions, 9042);
assert.equal(readJSON("attempt-1-receipt.json").exit_code, 1);
assert.equal(readJSON("attempt-1-execution.json").observations.length, 0);
for (const path of [receipt.artifact, ...receipt.evidence]) assert.ok(readFileSync(path).length > 0);
for (const [path, digest] of Object.entries(execution.protected_files_before)) {
  assert.equal(hash(path), digest);
  assert.equal(execution.protected_files_after[path], digest);
}
for (const [path, digest] of Object.entries(execution.identity.dist_sha256)) {
  assert.equal(hash(path), digest);
  assert.equal(execution.dist_files_after[path], digest);
}
for (const source of Object.values(frozen.sources)) {
  assert.equal(hash(source.resolved_path), source.sha256);
  assert.equal(readFileSync(source.resolved_path, "utf8").split("\n").slice(source.lines[0] - 1, source.lines[1]).join("\n"), source.excerpt);
}
for (const observation of execution.observations) for (const source of observation.sources) assert.ok(corpus.sources[source]);
const commands = [];
for (const [args, expected] of [[ ["rev-parse", "HEAD"], receipt.head_sha + "\n" ], [ ["status", "--porcelain=v1"], "" ]]) {
  const result = spawnSync("git", args, { cwd: execution.identity.target, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, expected);
  commands.push({ command: "git " + args.join(" "), cwd: execution.identity.target, exit_code: result.status, stdout: result.stdout });
}
const artifacts = Object.fromEntries(readdirSync(out).filter((name) => name !== "validation.json").sort().map((name) => [name, hash(join(out, name))]));
const result = { status: "pass", exit_code: 0, command: `bun ${join(out, "validate.mjs")}`, receipt_path: join(out, "receipt.json"), satisfied: receipt.satisfied, checks: execution.summary, reused_corpus_assertions: execution.replay.result.assertions, source_map_checks: execution.identity.source_map_checks.length, artifacts, commands, protected_run_files_unchanged: true, target_head_clean: true, dist_unchanged: true, timestamp: new Date().toISOString() };
writeFileSync(join(out, "validation.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: result.status, exit_code: result.exit_code, satisfied: result.satisfied, source_map_checks: result.source_map_checks, protected_run_files_unchanged: true, target_head_clean: true, dist_unchanged: true, validation: join(out, "validation.json") }, null, 2));
