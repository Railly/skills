import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = dirname(fileURLToPath(import.meta.url));
const canonical = '/Users/raillyhugo/Programming/railly/skills';
const cwd = '/tmp/wterm-pr138-review.XmFrHh';
const base = '0065c68c9d90ed831608d3b17eced9a14bcde609';
const head = '75960737e5a8e21934c94ffa7ee5acc93d460bf3';
const git = args => execFileSync('git', args, { cwd, encoding: 'utf8' });
const digest = value => `sha256:${createHash('sha256').update(value).digest('hex')}`;
if (git(['rev-parse', 'HEAD']).trim() !== head || git(['status', '--porcelain']).trim()) throw new Error('Reviewed tree changed');
const identity = JSON.parse(readFileSync(resolve(out, 'skill-identity.json'), 'utf8')).results[0];
if (identity.canonical_digest !== identity.revision_digest) throw new Error('Skill identity changed');
const revision = `git:${identity.canonical_revision}`;
const changed = git(['diff', '--name-only', base, head]);
const dirty = digest(git(['diff', '--binary', 'HEAD', '--']));
const security = JSON.parse(readFileSync(resolve(out, 'security-review.json'), 'utf8'));
if (security.fingerprint.changed_path_digest !== digest(changed) || security.fingerprint.dirty_digest !== dirty) throw new Error('Security receipt state mismatch');
const fingerprint = {
  head_sha: head,
  changed_paths_digest: digest(changed),
  contract_digest: digest('Execute each submitted command once; preserve actual final cwd across subsequent commands including ordinary nonzero exits; retain supported initial paths and completion.'),
  command: `node ${out}/dogfood.mjs ${cwd}; pnpm --filter @wterm/just-bash test; pnpm --filter @wterm/just-bash type-check`,
  environment_digest: digest(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, dependency: 'just-bash@2.14.2', lock: digest(readFileSync(resolve(cwd, 'pnpm-lock.yaml'))) })),
  skill_revision: revision,
  relevant_paths: changed.trim().split('\n'),
  reusable: false,
  reuse_evidence: null
};
const gaps = [
  'No current Test Strength receipt: changed shell adapter/state transition requires behavioral falsification coverage beyond selected probes.',
  'No current Resilience Audit receipt: command side effects and post-execution output/state failures need ownership and retry evidence.',
  'Separate reviewer context exists, but different-family provenance or another qualifying high-risk independent challenge was not established.',
  'Browser terminal input/render integration was not driven; built public BashShell API was driven under Node 24.18.0.',
  'No pre-existing Issue Contract, Solution or Spec receipt was supplied; claims were reconstructed from the exact PR and documentation.'
];
const execution = {
  mode: 'native_subagent', degraded_from: 'fx_worker', independence_gap: gaps[2], receipt: 'independent-review.json', schema_failures: 1,
  operations: [
    { operation: 'FX wrapper launch and native reviewer fallback', attempted_calls: 2, schema_failures: 1, identical_retry: false },
    { operation: 'Focused security classification', attempted_calls: 1, schema_failures: 0, identical_retry: false }
  ]
};
const lensReasons = {
  'Inverse regression surface': 'Compared mutable/absent/scoped PWD against actual pwd output and subsequent execution; F1.',
  'Resolution-rule consistency across consumers': 'Followed cwd through getter, prompt, next exec and completion; F1/F2.',
  'Shell re-parse append domain': 'Old command prepend/replay removed; reproduced append once and retained shell-special path tests.',
  'Deliberate-default check': 'Compared parent behavior with current defaults; duplicate side effects accidental, cwd normalization/validation were lost.',
  'Substrate differential corpus': 'Bounded real just-bash old/new corpus exercised assignment, unset, function-local PWD, nonzero, exit, relative and missing cwd. Not exhaustive Test Strength.',
  'Reference-implementation oracle': 'Used real just-bash pwd and filesystem effects rather than env.PWD proxy; not a full native Bash conformance audit.',
  'Error-path forcing': 'Nonzero and explicit exit driven; missing cwd repeated failure confirmed; exception coverage from authored tests only, missing resilience receipt remains.',
  'Substrate verification': 'Read actual virtual file content for effect-once; observed actual next command and completion output for cwd.',
  'Dogfood the built artifact': 'Built dist with tsc and ran dogfood.mjs before relying on authored test run.',
  'Newly-asserted invariant ownership': 'Shell commands can assign/unset/scope PWD; adapter does not own all its writers, F1.',
  'Docs-behavior parity': 'New final-directory guarantee refuted by F1 and explicit exit; sibling API/options examples otherwise unchanged.'
};
const catalog = readFileSync(resolve(canonical, 'skills/review-gate/references/gates.md'), 'utf8');
const lenses = [...catalog.matchAll(/^### (.+)$/gm)].map(([, title]) => {
  const name = title.replace(/ \([^)]*\)$/, '');
  return { name, status: lensReasons[name] ? 'run' : 'skipped', reason: lensReasons[name] || 'No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.' };
});
const findings = [
  { id: 'F1', priority: 'P2', state: 'confirmed', claim: 'Do not use mutable env.PWD as authoritative final cwd.', path: 'packages/@wterm/just-bash/src/index.ts:60-64', layer: 'Public BashShell API and next command', source: 'lens', resolution: 'open', evidence: 'dogfood.log:6-84,215-217. PWD=/tmp; pwd prints /home/user then changes next execution to /tmp. cd /tmp; unset PWD; pwd and local-PWD function lose the actual cd. Base preserves actual directory for all three. Obtain authoritative execution cwd without replaying user input.' },
  { id: 'F2', priority: 'P2', state: 'confirmed', claim: 'Normalize relative initial cwd before passing it to exec and completion.', path: 'packages/@wterm/just-bash/src/index.ts:113-116', layer: 'Public configuration and Tab completion', source: 'lens', resolution: 'open', evidence: "dogfood.log:140-149,177-185,218. cwd='home/user', files={'/home/user/homefile':'HOME'}: after pwd, base cwd=/home/user and cat home<Tab> appends file. Head cwd=home/user and Tab appends nothing; directory is resolved relative to itself." },
  { id: 'F3', priority: 'P2', state: 'confirmed', claim: 'Keep the default shell out of a nonexistent working directory.', path: 'packages/@wterm/just-bash/src/index.ts:113-116', layer: 'Default constructor and repeated public command execution', source: 'lens', resolution: 'open', evidence: 'dogfood.log:151-169,187-205,219. new BashShell(); pwd; ls; ls: base reports missing /home/user then recovers to / and both ls succeed. Head claims /home/user and both ls fail. files={} suppresses dependency default layout, and ExecOptions.cwd does not create or validate that directory.' }
];
const property = (id, claim, status, evidence, proxy, counterexample) => ({
  id, claim, kind: 'lifecycle', status,
  oracle: { observes: 'Actual virtual file content or subsequent public command/completion output', layer: 'Built public BashShell API using real just-bash', method: 'Compare baseline and built head via dogfood.mjs', proxy_only: false },
  proxy_challenge: { proxy, counterexample, attempted: true, outcome: 'separated', evidence },
  substrates: [{ name: 'Node 24.18.0 with just-bash 2.14.2 and built adapter dist', status: 'exercised', evidence }, { name: 'Browser terminal integration', status: 'unavailable', evidence: gaps[3] }], evidence
});
const report = {
  schemaVersion: 1,
  run: { date: '2026-09-14', repo: 'vercel-labs/wterm', base, remote_base: '4e82669024d94b63ec31716160aa91d3817c246c', head, profile: 'external-pr', skill_revision: revision, status: 'incomplete', verdict: 'findings', gaps },
  execution,
  contract: { path: 'https://github.com/vercel-labs/wterm/pull/138', spec_status: 'incomplete', acceptance_reviewed: ['P1','P2','P3'], gaps: [gaps[4]] },
  provenance: { author_model: 'unknown', reviewer_model: 'native inherited runtime, exact model not exposed', same_family: null },
  risk: { level: 'high', triggers: ['execution-count semantics of potentially externally visible command side effects'], independent_challenge: { required: true, satisfied: false, method: 'separate_native_context', artifact: 'independent-review.json', evidence: gaps[2] } },
  security_review: security,
  claim_inventory: [
    { source: 'contract', location: 'PR #138 body', status: 'reviewed', properties: ['P1','P2','P3'], evidence: 'Execute each submitted command once, current cwd passed to just-bash, final cwd tracked including nonzero exits.' },
    { source: 'design', location: 'No separate design contract supplied', status: 'not_provided', properties: [], evidence: gaps[4] },
    { source: 'user_facing', location: 'apps/docs/content/docs/just-bash.mdx:54; package README:88-89', status: 'reviewed', properties: ['P1','P2'], evidence: 'Once-only command and final directory/prompt claims.' },
    { source: 'implementation', location: 'packages/@wterm/just-bash/src/index.ts:60-64,113-125', status: 'reviewed', properties: ['P1','P2','P3'], evidence: 'Deletes replay and cd prefix; adopts options.cwd and env.PWD as persistent directory source.' }
  ],
  properties: [
    property('P1','A submitted append executes once','verified','dogfood.log:172-175,207-214: base once twice, head once once.','One mock exec invocation','A mock can report one exec while filesystem effects duplicate; actual file proves one effect.'),
    property('P2','Final actual working directory survives into prompt and subsequent command','refuted','F1; dogfood.log:6-84. Ordinary nonzero passes, explicit exit fails both versions.','env.PWD looks absolute','Assignment, unset or local scope makes PWD disagree with execution cwd.'),
    property('P3','Existing initial-directory semantics remain usable','refuted','F2/F3; dogfood.log:140-205.','Exec accepts options.cwd','Accepted relative/nonexistent values break completion or repeated ls.')
  ],
  stage_receipts: {
    test_strength: { required: true, status: 'unavailable', skill_revision: null, artifact: null, evidence: gaps[0], reason: gaps[0], fingerprint: null },
    resilience: { required: true, status: 'unavailable', skill_revision: null, artifact: null, evidence: gaps[1], reason: gaps[1], fingerprint: null }
  },
  assumptions: [
    { id: 'A1', source: 'Implementation', claim: 'Returned PWD always identifies actual final cwd', status: 'refuted', evidence: 'F1; mutable shell variable differs from pwd result.' },
    { id: 'A2', source: 'Implementation', claim: 'ExecOptions.cwd retains cd normalization and validity checking', status: 'refuted', evidence: 'F2/F3; relative and nonexistent cwd accepted verbatim.' },
    { id: 'A3', source: 'Dependency contract', claim: 'ExecOptions.cwd is per-execution, not persistent Bash instance cwd', status: 'verified', evidence: 'just-bash dist/Bash.d.ts:165-180; independent dependency inspection.' }
  ],
  lenses,
  deterministic: [
    { check: 'skill identity', outcome: 'pass', reason: 'skills-doctor --json exit 0; canonical, revision and installed digest match.' },
    { check: 'git diff --check 0065c68c9d90ed831608d3b17eced9a14bcde609 HEAD', outcome: 'pass', reason: 'exit 0' },
    { check: 'gate.sh style 0065c68c9d90ed831608d3b17eced9a14bcde609', outcome: 'pass', reason: 'exit 0' },
    { check: 'gate.sh covered', outcome: 'acknowledged', reason: 'Initial exit 0 was false coverage: grep matched reviewer-prompt.txt containing SHA, not a report. Discarded, no pass inferred.' },
    { check: 'gate.sh surfaces', outcome: 'acknowledged', reason: 'exit 1: old convention expects apps/docs/src/app/**/page.mdx, now content/docs/just-bash.mdx and updated; core README only requires package inventory links, unchanged.' },
    { check: 'gate.sh siblings BashShell', outcome: 'acknowledged', reason: 'exit 1: package/docs API examples, constructor/getter tables and new feature descriptions read. Unchanged examples do not need duplicating once-only prose. False blanket final-cwd claim is retained in F1 and IC1.' },
    { check: 'gate.sh callers handleInput', outcome: 'acknowledged', reason: 'Scoped sweep exit 1. Real consumers: hero, Next, Vite, Vue, Svelte delegate input to BashShell with populated files; Svelte programmatic command includes CR. ChatShell, StreamingShell and DOM InputHandler are unrelated same-name definitions/callers. No signature/return contract change.' },
    { check: 'radius impact --base 0065c68c9d90ed831608d3b17eced9a14bcde609', outcome: 'pass', reason: 'exit 0; impact-map.json; 137 files, 497 symbols, 5118 unresolved calls: guidance only.' },
    { check: 'pnpm --filter @wterm/just-bash build', outcome: 'pass', reason: 'tsc exit 0; built artifact dogfood performed before authored tests.' },
    { check: `node ${out}/dogfood.mjs ${cwd}`, outcome: 'acknowledged', reason: 'FAIL, exit 1: five failing cases covering three introduced root causes, tracked as open F1/F2/F3; append-once proof passes.' },
    { check: 'pnpm --filter @wterm/just-bash test', outcome: 'pass', reason: 'exit 0, 42 tests in 2 files.' },
    { check: 'pnpm --filter @wterm/just-bash type-check', outcome: 'pass', reason: 'exit 0' },
    { check: 'pnpm exec prettier --check packages/@wterm/just-bash/src/index.ts packages/@wterm/just-bash/src/__tests__/bash-shell.test.ts packages/@wterm/just-bash/src/__tests__/bash-shell.integration.test.ts', outcome: 'pass', reason: 'exit 0; repository-native formatter on changed TypeScript only.' },
    { check: 'Force-red', outcome: 'acknowledged', reason: 'Baseline in-memory append proves original double effect while built head is green for once-only property. Complete authored-test mutation coverage not claimed; Test Strength receipt missing.' },
    { check: 'GitHub exact-head checks', outcome: 'pass', reason: 'github-exact-head-checks.json: all six check runs success on exact SHA; Vercel status also success. PR still OPEN, REVIEW_REQUIRED, BLOCKED.' }
  ],
  findings,
  exemptions: [
    { claim: 'No root/core README update', evidence: 'No package/API inventory or usage-contract change there; dedicated just-bash docs and README updated.' },
    { claim: 'No Zig/WASM rebuild or repository-wide local build', evidence: 'Diff touches only just-bash adapter tests/docs. Focused package build/tests relevant; exact-head CI supplies broader green results, not local proof.' },
    { claim: 'No vulnerability from F1-F3', evidence: 'security-review.json: command author already has arbitrary emulator-script and virtual-path authority; no changed host or network boundary.' }
  ],
  issue_candidates: [
    { id: 'IC1', claim: 'cd /tmp; exit 1 loses cwd in both versions; new docs nevertheless promise updates after every command.', evidence: 'dogfood.log:113-139; narrow docs or handle explicit exit metadata before promising blanket behavior.', disposition: 'Pre-existing runtime defect; new documentation must not overclaim.' },
    { id: 'IC2', claim: 'Gate covered accepts arbitrary text containing SHA and surfaces can pass on unresolved base.', evidence: 'Initial covered returned pass from reviewer prompt; missing-base surfaces returned empty diff. Revalidated exact merge-base manually.', disposition: 'Review tooling follow-up; not a wterm regression.' }
  ]
};
writeFileSync(resolve(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
const manifestPath = resolve(canonical, 'foundry/missions/vercel-labs-wterm/138.manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.work_item.base_sha = base;
manifest.work_item.remote_base_sha = report.run.remote_base;
manifest.work_item.dirty_digest = dirty;
manifest.skill_revisions['review-gate'] = { revision, digest: identity.canonical_digest, path: identity.canonical_path, status: 'exact' };
manifest.orchestration = { execution_mode: execution.mode, degraded_from: execution.degraded_from, independence_gap: execution.independence_gap, schema_failures: execution.schema_failures, operations: execution.operations };
manifest.updated_at = new Date().toISOString();
const temporary = `${manifestPath}.tmp-${process.pid}`;
writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
renameSync(temporary, manifestPath);
const finished = new Date();
const receipt = { status: 'fail', skill: 'review-gate', skill_revision: revision, head_sha: head, started_at: manifest.work_item.budget_started_at, finished_at: finished.toISOString(), duration_ms: finished.getTime() - new Date(manifest.work_item.budget_started_at).getTime(), evidence: [resolve(out,'report.json'),resolve(out,'report.md'),resolve(out,'dogfood.log'),resolve(out,'security-review.json')], reason: 'Three confirmed correctness regressions; verdict findings, with required upstream proof/independence gaps explicit.', receipt_id: 'review-gate:vercel-labs-wterm:138:7596073', fingerprint };
writeFileSync(resolve(out, 'review-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
console.log('Wrote exact-head findings report, manifest identity and review receipt.');
