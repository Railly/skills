import { readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const run = dirname(here);
const read = (path) => JSON.parse(readFileSync(join(here, path), "utf8"));
const identity = read("../identity.json");
const model = read("model.json");
const mutations = read("mutation-results.json");
const corpus = read("corpus-results.json");
const started = statSync(join(here, "isolation.json")).birthtime;
const revision = identity.skill_revisions["test-strength"].revision;
const receipt = {
  schema_version: 1,
  skill: "test-strength",
  required: true,
  status: "fail",
  reason: "Authored tests allow removal of the copy-source guard, and real renderer callers violate the newly hardened rejection contract.",
  skill_revision: revision,
  artifact: join(here, "receipt.json"),
  head_sha: identity.head_sha,
  base_sha: identity.base_sha,
  repository: identity.repository,
  started_at: started.toISOString(),
  finished_at: new Date().toISOString(),
  elapsed_ms: Date.now() - started.getTime(),
  fingerprint: {
    head_sha: identity.head_sha,
    changed_paths_digest: identity.changed_paths_digest,
    contract_digest: identity.contract_digest,
    environment_digest: identity.environment_digest,
    skill_revision: revision,
    command: "node test-strength/mutations.mjs; bun test-strength/copy-survivor.mjs; node test-strength/corpus.mjs; built React consumer probes",
    relevant_paths: [
      "packages/core/src/path-utils.ts", "packages/core/src/types.ts",
      "packages/core/src/types.test.ts", "packages/core/src/state-store.ts",
      "packages/core/src/state-store.test.ts", "packages/react/src/hooks.ts",
      "packages/react-state/src/index.tsx", "packages/solid/src/hooks.ts",
      "packages/vue/src/hooks.ts", "packages/svelte/src/streaming.svelte.ts",
      "packages/react-native/src/hooks.ts",
    ],
    reusable: false,
    reuse_evidence: null,
  },
  dimensions: {
    values: Object.entries(model.dimensions).map(([key, values]) => `${key}: ${values.join(", ")}`),
    exclusions: model.exclusions,
    evidence: "model.json enumerates classes and exclusions; no full Cartesian-matrix claim.",
  },
  oracle: {
    source: "RFC 6901 section 4; RFC 6902 sections 4.4-4.5; product contract A1-A4; ECMAScript Array exotic property semantics",
    independent: true,
    evidence: "Corpus classifies tokens by Object.defineProperty effect on a real array length. Own-key and DOM/callback observations are independent of production helper results. Normative artifacts: ../rfc6901.txt and ../rfc6902.txt.",
  },
  producer: {
    name: "JSON.stringify JSONL, built diffToPatches, fragmented core compiler, built React useUIStream and StateProvider",
    status: "exercised",
    evidence: "corpus-results.json: 9042 assertions, 220 deterministic tokens, ESM/CJS and seven-character chunks. ../public-export-probe.json uses built diffToPatches. ../coordinator/hook-proof-recheck.json and ../consumer/result.json exercise renderer boundaries.",
  },
  falsification: mutations.filter((m) => !["baseline", "restored-green"].includes(m.name)).map((m) => ({
    mutation: m.name,
    site: m.name.startsWith("invalid-token") ? "parseArrayIndex definition" : "production operation call site",
    outcome: m.exit_code === 1 && m.assertion_failure ? "killed" : "survived",
    red_evidence: m.exit_code === 1 && m.assertion_failure ? m.evidence : `No authored red: ${m.evidence}`,
    restored_green_evidence: "logs/restored-green.log (203 tests); restoration.json matches exact frozen source",
  })),
  campaign: {
    corpus,
    repeated_corpus: "corpus-results-first.json and corpus-results.json agree on cases and assertions; 26ms and 25ms",
    authored_tests: { baseline: 203, restored: 203, full_core_existing_run: 577 },
    mutants: { total: 20, killed: 19, survived: 1 },
    copy_survivor: {
      mutation: "Remove only source valid/exists guard in applySpecStreamPatch copy arm, line 918",
      full_narrow_suite: "203 tests remain green in logs/copy-mutant-full-suite.log",
      direct_oracle: "Own copy property with undefined observed in copy-mutant-own-key.json",
      supplemental_red: "logs/copy-mutant-own-key.log fails intended assertion",
      restored_green: "logs/copy-restored-own-key.log passes against built exact head",
    },
  },
  findings: [
    {
      id: "TS-1", severity: "P1", kind: "production_regression",
      claim: "Legacy renderer compound dispatchers bypass rejection preflight and lose move source data.",
      location: "packages/core/src/types.ts:907",
      consumer_location: "packages/react/src/hooks.ts:186",
      evidence: ["../coordinator/hook-proof-recheck.json", "../coordinator/hook-proof-base.json"],
      detail: "Move /state/source to /state/items/01 through built useUIStream deletes source and rejects destination; malformed copy source creates own undefined. Base transfers a value instead. React directly exercised; sibling frameworks statically traced.",
    },
    {
      id: "TS-2", severity: "P2", kind: "production_regression",
      claim: "StateProvider reports rejected batch entries as actual changes.",
      location: "packages/core/src/state-store.ts:164",
      consumer_location: "packages/react-state/src/index.tsx:163",
      evidence: ["../consumer/result.json", "../consumer/base-result.json"],
      detail: "Mixed /items/01 and /count update preserves array at head but callback still includes rejected value; base callback matched the coerced write.",
    },
    {
      id: "TS-3", severity: "P2", kind: "coverage_gap",
      claim: "Malformed copy-source test ignores an own undefined property and survives removal of its fix.",
      location: "packages/core/src/types.test.ts:624",
      evidence: ["copy-survivor-results.json", "logs/copy-mutant-full-suite.log", "copy-mutant-own-key.json", "copy-restored-own-key.json"],
      detail: "toEqual ignores an extra undefined-valued own property. An own-key assertion or strict equality protects the claimed no-undefined insertion behavior.",
    },
  ],
  gaps: [
    "No passing receipt while TS-1, TS-2 and the authored copy-guard survivor remain unresolved.",
    "No complete per-cell falsifier coverage for canonical upper-bound acceptance, literal-key inference, null/primitive branch replacement, reserved tokens, or every batch ordering; positive examples do not discharge those obligations.",
    "Only React runtime exercised for downstream consumers; Solid/Vue/Svelte/React Native are static traces.",
    "Inherited implementation exposure preceded the model; independent oracle evidence is host semantics and normative text, not cross-family reviewer provenance.",
  ],
  scope: {
    source_edits: false,
    mutations: "Only disposable copy in isolation.json; restored content hashes in restoration.json.",
    manifest_ownership: "Coordinator merges this receipt atomically; specialist did not edit shared manifest.",
  },
  verification_notes: [
    "A Bun-run Vitest setup failure was excluded; final authored-test falsification commands execute Node v24.18.0.",
    "Source, head and status rechecked: exact de6a9bd and clean target.",
    `Canonical artifact root: ${run}`,
  ],
};
writeFileSync(join(here, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify({
  artifact: receipt.artifact,
  status: receipt.status,
  mutants: receipt.campaign.mutants,
  assertions: corpus.assertions,
  elapsed_ms: receipt.elapsed_ms,
}));
