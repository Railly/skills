import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const run = import.meta.dir;
const skills = "/Users/raillyhugo/Programming/railly/skills";
const repo = "/Users/raillyhugo/Programming/vercel/agent-browser-1999-fix";
const ev = "/Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence";
const base = "d01253d9db28d75080e36da3c1c31ef89454731e";
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const hash = value => "sha256:" + createHash("sha256").update(value).digest("hex");
const head = git("rev-parse", "HEAD");
if (head === base || git("status", "--porcelain")) throw new Error("Commit and freeze the final tree first");
const m = JSON.parse(await readFile(`${run}/manifest.json`, "utf8"));
const dir = `${skills}/foundry/runs/review-gate/2026-09-28-agent-browser-1999-fix-${head.slice(0, 8)}`;
await mkdir(dir, { recursive: true });
const json = (path, object) => writeFile(path, JSON.stringify(object, null, 2) + "\n");
const changedPaths = git("diff", "--name-only", base, head).split("\n");
const environment = {
  ...m.environment,
  lightpanda: "1.0.0-nightly.9842+ce46f90f1",
  react: "19.2.0",
};
Object.assign(m, {
  head_sha: head,
  tree_sha: git("rev-parse", "HEAD^{tree}"),
  dirty_digest: "clean",
  changed_paths: changedPaths,
  changed_paths_digest: hash(changedPaths.join("\n")),
  contract_digest: hash(await readFile(m.contract)),
  environment,
  environment_digest: hash(JSON.stringify(environment)),
});
const command = "cargo test -- --test-threads=1; cargo test e2e_auth_login -- --ignored --test-threads=1; cargo clippy -- -D warnings; bun compatibility.mjs; bun lifecycle-final.mjs; bun pressure-fix.mjs fix-race; bun lightpanda-probe.mjs lightpanda-race; bun react-cli-probe.mjs; bun react-lightpanda-probe.mjs";
const fingerprint = {
  head_sha: head,
  changed_paths_digest: m.changed_paths_digest,
  contract_digest: m.contract_digest,
  command,
  environment_digest: m.environment_digest,
  skill_revision: m.skill_revision,
  relevant_paths: [...changedPaths, "cli/src/native/interaction.rs", "cli/src/native/cdp/client.rs"],
  reusable: false,
  reuse_evidence: null,
};
const testStrength = {
  required: true,
  status: "pass",
  skill_revision: m.skill_revision,
  artifact: `${dir}/test-strength.json`,
  fingerprint,
  evidence: `${run}/auth-final.log; ${run}/unit-final.log; ${ev}/lifecycle-final-results.json; ${ev}/compatibility-results.json`,
  dimensions: {
    values: [
      "Destination: username and password; submit selection remains exact-node click.",
      "Selection: automatic and explicit CSS; stable, hidden-first, disabled-first, readonly-first, and missing controls.",
      "Lifecycle: selected node replaced, focus detachment, focus redirection, selection redirection, readonly transition, post-input detachment, page exception.",
      "Editing capability: present native edit, absent native edit, native false, native exception.",
      "Editable surface: input, textarea, contenteditable; old values replaced with exact Unicode values.",
      "Substrate: Chrome 152 and real Lightpanda nightly9842 on macOS arm64; React 19.2 controlled form in both.",
      "Failure recovery: same auth operation immediately retried after removing page fault; missing password/submit restored without profile or session reset.",
      "Remote handles: normal completion, rejected fill, JS exception, CDP error, rejected evaluate, non-node result, descriptor error and malformed descriptor.",
    ],
    exclusions: [
      "Readonly is an input/textarea property, not a submit-button state.",
      "Auth discovery remains top-level CSS; iframe/shadow-root discovery is not introduced.",
      "No new guarantee of visual occlusion, ancestor opacity or cross-version browser event equality.",
      "Lifecycle partitions are applied to each credential input. Textarea/contenteditable are separate selection and value-replacement compatibility partitions.",
      "The formatter, help text, and existing parser delegation require deterministic checks rather than behavioral mutants.",
      "Arbitrary future cancellation and destroyed CDP contexts are outside the completed-command cleanup claim.",
    ],
    evidence: `${ev}/fix-matrix-results.json; ${ev}/lightpanda-matrix-results.json; ${ev}/lifecycle-final-results.json; ${ev}/compatibility-results.json; ${run}/auth-final.log`,
  },
  oracle: {
    source: "Issue/contract define the intended credential fields. Actual DOM values, decoy state, event destinations, submitted state and controlled React state are read independently of command success.",
    independent: true,
    evidence: "The original PR reports success while the password enters username. The same CLI fixture rejects that result and accepts the corrected safe rejection. Field values are asserted on every authored success/rejection path.",
  },
  producer: {
    name: "Built agent-browser CLI, real Chrome and Lightpanda DOM/focus/input lifecycle, actual React controlled form, and protocol-shaped CDP fault server",
    status: "exercised",
    evidence: `${ev}/bin/original-pr; ${ev}/bin/fixed; ${ev}/lifecycle-final.mjs; ${ev}/react-cli-probe.json; ${ev}/react-lightpanda-probe.json`,
  },
  falsification: [
    {
      mutation: "Omit release of Runtime.callFunctionOn exception/result handles despite returnByValue.",
      red_evidence: `${run}/fill-exception-red.log: only login-node released; expected call-result and call-exception too. V8 wrapEvaluateResult independently establishes fixture validity in ${ev}/v8-injected-script.cc.`,
      restored_green_evidence: `${run}/unit-final.log: final cleanup test passes.`,
    },
    {
      mutation: "Run new lifecycle test at original PR production wiring.",
      red_evidence: `${run}/regression-red.log: user/selection delivers username to decoy and submits; intended destination assertion fails.`,
      restored_green_evidence: `${run}/auth-final.log: all 9 auth tests pass with final helper at both call sites.`,
    },
    {
      mutation: "Remove the post-selection focus check.",
      red_evidence: `${run}/mutant-select.log: user/select-redirect places credential in decoy.`,
      restored_green_evidence: `${run}/auth-final.log; ${ev}/lifecycle-final-results.json`,
    },
    {
      mutation: "Remove rejected-evaluation remote-object release.",
      red_evidence: `${run}/mutant-rejected-object.log: release list lacks exception and rejected node handles.`,
      restored_green_evidence: `${run}/unit-final.log: rejected-object cleanup test passes.`,
    },
    {
      mutation: "Force native editing when execCommand is absent.",
      red_evidence: `${run}/mutant-no-fallback.log: user/no-native-edit fails required success; ${ev}/lightpanda-exec-only-red.json independently observes actual engine regression.`,
      restored_green_evidence: `${run}/auth-final.log; ${ev}/compatibility-results.json; ${ev}/react-lightpanda-probe.json`,
    },
    {
      mutation: "Omit explicit contentEditable recognition in the Lightpanda compatibility path.",
      red_evidence: `${ev}/compatibility-lp-diagnose.json: actual Lightpanda has contentEditable=true and isContentEditable=false; both credential contenteditable cells reject.`,
      restored_green_evidence: `${ev}/compatibility-results.json: 8/8 Chrome/Lightpanda credential/surface cells pass.`,
    },
    {
      mutation: "Remove contributor usable-duplicate discovery.",
      red_evidence: `${skills}/foundry/runs/review-gate/2026-09-28-agent-browser-1999-1b4cacd/force-red.log: all three hidden-first contributor regressions fail on parent production.`,
      restored_green_evidence: `${run}/auth-final.log; ${ev}/fix-matrix-results.json; ${ev}/lightpanda-matrix-results.json`,
    },
  ],
  gaps: [],
};
const partition = (region, covers, residual, cleanup, evidence, retryEvidence) => ({
  ownership_region: region, covers, forced: true, residual_observed: residual,
  cleanup_owner: cleanup, evidence,
  retry: { attempted: true, outcome: "success", evidence: retryEvidence },
});
const resilience = {
  required: true,
  status: "pass",
  skill_revision: m.skill_revision,
  artifact: `${dir}/resilience.json`,
  fingerprint,
  evidence: `${ev}/lifecycle-final-results.json: 32 rejections and 32 immediate retries; both engine missing-control matrices; CDP unit partitions.`,
  commit_points: [
    {
      id: "C1",
      effect: "Username becomes page-visible.",
      owner: "AuthLoginElement::fill",
      commit_event: "Native insertText or exact-element native value setter",
      later_fallible_stages: ["password selection and entry", "submit selection", "synchronous input callback"],
      failure_partitions: [
        partition("password selection and entry", ["password selection and entry"], "Username remains correct; password absent or unchanged; no submission or wrong-field delivery.", "Page owns already-entered values; caller retries after restoring the field.", `${ev}/fix-matrix-results.json; ${ev}/lightpanda-matrix-results.json; ${ev}/lifecycle-final-results.json`, "Both missing-password matrices and all password lifecycle cells immediately repeat auth successfully after removing the page fault."),
        partition("submit selection", ["submit selection"], "Both correct credentials remain; no command submission.", "Page retains form values; no transaction rollback is promised.", `${ev}/fix-matrix-results.json; ${ev}/lightpanda-matrix-results.json`, "Missing-submit fixture restores the button then repeats the same auth operation successfully."),
        partition("input callback", ["synchronous input callback"], "Input reaches selected field; immediate field removal is detected; no submit and decoy unchanged.", "Page owns its DOM mutation; command rejects without credential retarget.", `${ev}/lifecycle-final-results.json`, "All input-detach cells restore the page fault and retry successfully on both engines."),
      ],
    },
    {
      id: "C2",
      effect: "CDP remote element handle acquired.",
      owner: "wait_for_any_selector / AuthLoginElement::fill",
      commit_event: "Runtime.evaluate / DOM.resolveNode",
      later_fallible_stages: ["selection description", "focus and edit"],
      failure_partitions: [
        partition("selection description", ["selection description"], "Rejected result/exception handles and described node handle are released; selector polling resumes.", "Selection helper releases each observed handle once.", `${run}/unit-final.log: test_auth_login_selection_releases_rejected_objects`, "Each exception/non-node/descriptor-error/malformed-descriptor cell immediately repolls and succeeds on attempt two."),
        partition("focus and edit", ["focus and edit"], "Safe rejection; resolved element handle release attempted on success, false, JS exception and protocol error.", "Fill helper owns acquired handles; transport/context destruction is best effort.", `${run}/unit-final.log: test_auth_login_fill_releases_remote_object; ${ev}/lifecycle-final-results.json`, "Same user operation succeeds after removing every injected page fault; protocol cleanup directly observed by CDP mock."),
      ],
    },
  ],
  limitations: [
    "Existing daemon awaits execute_command under its state lock; a CLI disconnect does not cancel this future.",
    "No guarantee of release completion after arbitrary task abortion, renderer destruction, or unavailable transport.",
    "No automatic credential retry or rollback of credentials already entered into intended fields.",
    "Lightpanda document-level input-event bubbling differs from Chrome. Its destination/value and React controlled-state proof are separate.",
  ],
  gaps: [],
};
const security = {
  status: "pass",
  artifact: `${dir}/security-review.json`,
  fingerprint: {
    repository: m.repository, base_sha: base, head_sha: head, dirty_digest: "clean",
    changed_path_digest: m.changed_paths_digest, skill_revision: m.skill_revision,
  },
  claim: {
    property: "No new principal obtains saved credentials; existing no-navigate origin binding remains effective, and auth does not silently insert into a different focused field.",
    attacker: "Authorized-origin page JavaScript, unrelated origins, and selector text supplied by the local caller.",
    scope: "Replacement of PR1999 on exact final head; disposable local credentials only.",
  },
  trust_model: {
    assets: ["Saved/decrypted credentials", "Selected DOM destination", "Bound active origin"],
    principals: ["Local authorized caller", "Authorized page already able to read its own credential inputs", "Unrelated origins lacking authorization"],
    boundaries: ["Credential store to authorized page", "Active no-navigate page to effective profile URL"],
    entrypoints: ["auth_login", "CSS selector overrides", "Page DOM callbacks"],
    sinks: ["Synchronous exact-target edit", "Existing submit click"],
  },
  observations: [
    {
      id: "SEC-1", classification: "hardening", scope: "out_of_scope_hardening",
      prerequisites: ["Selected field replaced or focus redirected by page behavior"],
      chain: {
        capability: "Page already controls DOM and reads intended input values.",
        reachability: "Original CLI race reproduced on Chrome and Lightpanda.",
        control: "Existing authorized origin, not a newly empowered principal.",
        boundary: "No new attacker authority is established by the original misdelivery.",
        impact: "The replacement prevents credential destination corruption and false successful submission.",
      },
      confidence: "high",
      evidence: [`${ev}/fix-race-results.json`, `${ev}/lightpanda-race-results.json`, `${ev}/lifecycle-final-results.json`],
    },
    {
      id: "SEC-2", classification: "informational", scope: "out_of_scope_hardening",
      prerequisites: [], confidence: "high",
      evidence: ["Origin checks and profile/plugin resolution remain unchanged; all no-navigate origin/state E2E tests pass.", "Selectors are JSON-serialized and credentials passed as CDP arguments. No credential logging or storage changes added."],
    },
  ],
  verification: {
    authorized_scope: "User-authorized local implementation and bounded browser fixtures.",
    commands: [command],
    cleanup: "Fixture profiles removed and sessions closed by harness finalizers; production store schema unchanged.",
    gaps: [],
  },
  merge_relevance: { security_blockers: [], follow_ups: [], routed_non_security_defects: [] },
};
const runReasons = {
  "Inverse regression surface": "Auth-only helper leaves ordinary interaction::fill unchanged. Native/absent capability, textarea/contenteditable and React compatibility driven.",
  "New-domain matrix": "Automatic/explicit selectors, unusable twins, both credential targets, both engines and lifecycle/capability partitions exercised.",
  "Resolution-rule consistency across consumers": "Both credentials share AuthLoginElement::fill; submit uses exact ref. Existing RefMap constructors retain role fallback.",
  "Emission channel and one-shot latch reachability": "Fill failure propagates through ? before password/submit; JS false and exception become command errors.",
  "Deliberate-default check": "Issue1998 requires the usable duplicate; DOM oracle and original before/after establish the defect.",
  "Fresh-seam scan": "Synchronous focus/select/input callbacks pressured; checks before edit prevent wrong-field delivery; post-input detachment stops submit.",
  "Substrate differential corpus": "Original and fixed compiled CLIs driven against real Chrome and actual Lightpanda with DOM state observations.",
  "New-failure-outcome propagation": "Only auth creates exact refs; caller ? stops on rejection. Immediate retry and retained intended partial values verified.",
  "Flag-propagation dispatch sweep": "Internal fallback boolean defaults true in all old constructors; false only in add_exact_backend_node.",
  "Error-path forcing": "32 real-engine failure cases with immediate retry plus descriptor and CDP error mock partitions.",
  "Non-destructive recovery": "No automatic retarget/retry; caller retry is explicit and succeeds after page fault removal.",
  "Cancellation and timeout hygiene": "Existing bounded polling and CDP waits retained. Missing controls time out and retry; no task-abort cleanup claim.",
  "Boundary pipeline trace": "Discovery -> exact backend -> resolve -> synchronous guarded edit -> release. No page-level Input.insertText on credential path.",
  "Substrate verification": "Independent DOM values, decoy, submission and controlled React state distinguish correctness from CLI success.",
  "Dogfood the built artifact": "Stable named binaries prevent shared Cargo-cache identity mistakes; invalid earlier runs preserved and excluded.",
  "Newly-asserted invariant ownership": "No blanket hidden/occlusion or arbitrary cancellation claim; docs describe checked properties and pre-entry rejection.",
  "Docs-behavior parity": "README/help/MCP/docs/skill references aligned. Terse command/plugin listings remain valid; historical changelog unchanged.",
  "Choice audit": "Kimi reduction-review challenged initial C2; native final review challenges C3 and actual engine evidence; trail preserved.",
  "Complexity budget": "Per selector querySelectorAll plus linear find; bounded polling; no nested per-node search introduced.",
};
const skipReasons = {
  "Shell re-parse append domain": "No shell parsing or command construction change.",
  "Shim hermeticity": "No executable shim or PATH mock.",
  "Reference-implementation oracle": "No ARIA/getByRole/reference-library behavior changed; real DOM is the oracle.",
  "Demonstrative example": "No new command example; behavior statements are directly exercised.",
};
const catalog = await readFile(`${skills}/skills/review-gate/references/gates.md`, "utf8");
const lenses = [...catalog.matchAll(/^### (.+?) \(/gm)].map(([, name]) => ({
  name, status: runReasons[name] ? "run" : "skipped",
  reason: runReasons[name] ?? skipReasons[name] ?? "No trigger in this diff.",
}));
const property = (id, claim, evidence, proxy, counterexample) => ({
  id, claim, kind: "browser interaction", status: "verified",
  oracle: { observes: claim, layer: "Real browser DOM and CLI, supplemented by CDP handle recorder", method: evidence, proxy_only: false },
  proxy_challenge: { proxy, counterexample, attempted: true, outcome: "not_separated", evidence },
  substrates: [{ name: "macOS arm64, Chrome152 and Lightpanda nightly9842; React19.2", status: "exercised", evidence }],
  evidence,
});
const report = {
  schemaVersion: 1,
  run: { date: "2026-09-28", repo: m.repository, base, head, profile: "high-risk", skill_revision: m.skill_revision, status: "complete", verdict: "pass", gaps: [] },
  execution: {
    mode: "native_subagent", degraded_from: "fx_worker",
    independence_gap: "Native final reviewer shares the Codex model family. Independent challenge additionally uses the pre-solution DOM destination corpus and Kimi's separate-family shape/reduction review. Packaged FX auth-mode check failed; direct FX shape/reduction artifacts used its existing stored credential and are not represented as packaged API-key receipts.",
    schema_failures: 2,
    operations: [
      { operation: "packaged FX review", attempted_calls: 1, schema_failures: 1, identical_retry: false, outcome: "stored-credential mode fails wrapper API-key-mode requirement; native fallback used" },
      { operation: "native reviewer initialization", attempted_calls: 1, schema_failures: 1, identical_retry: false, outcome: "invalid empty override fields; capability inspected and valid native call used" },
      { operation: "native frozen-tree review", attempted_calls: 1, schema_failures: 0, identical_retry: false, outcome: "completed, native-review-final.md" },
    ],
  },
  contract: { path: m.contract, spec_status: "not_required", acceptance_reviewed: ["R1", "R2", "R3", "R4", "R5"], gaps: [] },
  provenance: { author_model: "Codex GPT-6 with retained Jony contribution", reviewer_model: "Independent native Codex reviewer; supplemental Moonshot Kimi K3 Fast reduction review", same_family: true },
  risk: {
    level: "high", triggers: m.risk_triggers,
    independent_challenge: { required: true, satisfied: true, method: "substrate_corpus", artifact: `${ev}/fix-race-results.json`, evidence: "Destination oracle was defined from the issue and original PR failure before implementation. Both original and corrected binaries driven; native independent code review artifact and Kimi choice challenge also retained." },
  },
  security_review: security,
  claim_inventory: [
    { source: "contract", location: m.contract, status: "reviewed", properties: ["P1","P2","P3","P4","P5"], evidence: "R1-R5 and explicit C3 refinement verified." },
    { source: "design", location: `${run}/solution.md`, status: "reviewed", properties: ["P2","P3","P4"], evidence: "C2 reshaped to C3 using actual engine evidence; native false/throw never falls back." },
    { source: "user_facing", location: changedPaths.filter(p=>!p.includes("/native/")).join(", "), status: "reviewed", properties: ["P1","P2"], evidence: "Control filtering and pre-entry rejection described consistently without blanket visual-hidden claim." },
    { source: "implementation", location: "actions.rs, element.rs, e2e_tests.rs", status: "reviewed", properties: ["P1","P2","P3","P4","P5"], evidence: "Scoped exact refs, guarded credential edit, handle cleanup, unchanged general fill and existing MCP delegation." },
  ],
  properties: [
    property("P1","Usable duplicate control selection fills intended fields and leaves unusable twins untouched.",`${ev}/fix-matrix-results.json; ${ev}/lightpanda-matrix-results.json; ${run}/auth-final.log`,"A matching node exists","Hidden/disabled/readonly twins match CSS but are not valid destinations; inspect both twins and submission."),
    property("P2","Replaced/focus-redirected credential fields reject without wrong-field entry or command submission.",`${ev}/fix-race-results.json; ${ev}/lightpanda-race-results.json; ${ev}/lifecycle-final-results.json`,"Backend resolve succeeds","Detached nodes still resolve in the original PR; actual destination and submit observations falsify the proxy."),
    property("P3","Normal auth preserves tested editable surfaces, exact Unicode values and controlled React state on both exercised engines.",`${ev}/compatibility-results.json; ${ev}/react-cli-probe.json; ${ev}/react-lightpanda-probe.json; ${run}/ordinary-fill.log`,"DOM value is updated","A direct property assignment can leave React state stale; actual submitted controlled state is observed."),
    property("P4","Selection repolls after descriptor rejection, observed handles are released on completed command paths, and page-fault retries succeed.",`${run}/unit-final.log; ${ev}/lifecycle-final-results.json; ${ev}/fix-matrix-results.json; ${ev}/lightpanda-matrix-results.json`,"releaseObject call exists in source","Mock recorder and removal mutant expose missing releases; immediate same-operation retries observe caller recovery."),
    property("P5","Existing origin/no-navigation/provider behavior and general fill remain intact; attribution and packaging match authorized scope.",`${run}/auth-final.log; ${run}/ordinary-fill.log; git show ${head}; ${run}/gate-surfaces.log`,"General suite is green","Direct auth state/origin E2E, ordinary interaction E2E and signed human trailer inspect the specific contract."),
  ],
  stage_receipts: { test_strength: testStrength, resilience },
  assumptions: [
    { id: "A1", source: "Build identity", claim: "Recorded final binary is built from the reviewed worktree, not a shared-target sibling.", status: "verified", evidence: `${run}/build-final.log explicitly compiles agent-browser-1999-fix; stable original-pr and fixed binaries; artifact-identities.json.` },
    { id: "A2", source: "C3 compatibility", claim: "Missing execCommand in actual Lightpanda requires the exact-target fallback; Chrome trusted editing remains available.", status: "verified", evidence: `${ev}/lightpanda-exec-only-red.json; ${ev}/primitive-lightpanda-results.json; ${ev}/react-lightpanda-probe.json; ${ev}/lifecycle-final-results.json` },
    { id: "A3", source: "Cancellation scope", claim: "Normal CLI disconnect does not abort the executing command future.", status: "verified", evidence: "daemon.rs:554 awaits execute_command while holding daemon state; no new cancellation owner added. Transport destruction remains best effort." },
  ],
  lenses,
  deterministic: [
    { check: "exact identity", outcome: "pass", reason: `Clean committed tree ${m.tree_sha}; live main ${base}; original PR remains 1b4cacd0.` },
    { check: "skill identity", outcome: "pass", reason: `${run}/skill-identity.log: linked review-gate 77fdde3e8d7e source=clean.` },
    { check: "style and surfaces", outcome: "pass", reason: `${run}/gate-style.log; ${run}/gate-surfaces.log` },
    { check: "callers and timings", outcome: "pass", reason: `${run}/gate-callers.log; ${run}/gate-timings.log: all auth selector callsites in diff; no new wait ceiling.` },
    { check: "doc sibling sweep", outcome: "acknowledged", reason: "commands.rs is syntax/parser tests; configuration/plugins pages describe provider setup; core SKILL and template give terse examples and no conflicting selection promise; changelog is historical. Unchanged README/help/docs passages concern navigation, origin, plugin or syntax and remain true." },
    { check: "cargo fmt and git diff --check", outcome: "pass", reason: "Final format and whitespace checks pass." },
    { check: "cargo clippy -- -D warnings", outcome: "pass", reason: `${run}/post-cleanup-checks.log` },
    { check: "cargo test", outcome: "pass", reason: `${run}/unit-final.log: 1393 unit and 6 integration passed; 146 unit E2E and 2 pin-tab integration ignored by repository defaults.` },
    { check: "auth E2E", outcome: "pass", reason: `${run}/auth-final.log: 9 passed; ordinary-fill.log passed.` },
    { check: "force red and restored green", outcome: "pass", reason: "Test Strength records source-PR, focus guard, cleanup, capability and actual-engine contenteditable falsifiers." },
    { check: "radius", outcome: "pass", reason: `${run}/radius-impact-map.json retained as attention guidance only.` },
  ],
  findings: [
    { id: "F1", severity: "P1", state: "refuted", claim: "Original PR silently delivers credentials to another focused field after replacement.", evidence: "Original remains red; exact-target synchronous edit rejects in both real engines; 32 failure/retry partitions pass.", layer: "Real browser input delivery", source: "original PR review", resolution: "fixed" },
    { id: "F2", severity: "P2", state: "refuted", claim: "Rejected selector evaluation retains remote handles.", evidence: `${run}/unit-final.log; ${run}/mutant-rejected-object.log`, layer: "CDP object lifecycle", source: "Kimi independent review", resolution: "fixed" },
    { id: "F3", severity: "P2", state: "refuted", claim: "Unconditional native edit or select regresses supported engine/editable forms.", evidence: `${ev}/compatibility-results.json; ${ev}/react-lightpanda-probe.json; ${ev}/lifecycle-final-results.json`, layer: "Browser compatibility", source: "native independent review", resolution: "fixed" },
  ],
  exemptions: [
    { claim: "Ordinary snapshot role fallback", evidence: "All existing ref constructors retain true; exact false refs are local to auth." },
    { claim: "No new public parser/schema", evidence: "MCP auth uses the existing CLI parser; full parser/MCP unit tests pass." },
    { claim: "No blanket cleanup after cancellation or dead transport", evidence: "Explicitly scoped contract and PR note; normal command completion/error cleanup tested." },
  ],
  issue_candidates: [],
  outcomes: { external_findings: 0, review_rounds: 3, human_corrections: 0, escaped_finding_class: "not_applicable", publication: "replacement PR pending" },
};
const nativeReview = await readFile(`${run}/native-review-final.md`, "utf8");
if (!nativeReview.trim()) throw new Error("Missing independent final review artifact");
await json(testStrength.artifact, testStrength);
await json(resilience.artifact, resilience);
await json(security.artifact, security);
const reportPath = `${dir}/run-report-${head.slice(0, 8)}.json`;
await json(reportPath, report);
const identities = {};
for (const name of ["original-pr", "fixed", "lightpanda"]) identities[name] = hash(await readFile(`${ev}/bin/${name}`));
await json(`${dir}/artifact-identities.json`, { head, tree: m.tree_sha, binaries: identities });
m.stages.implementation = { status: "complete", head_sha: head, tree_sha: m.tree_sha };
m.stages.test_strength = { status: "pass", artifact: testStrength.artifact, fingerprint };
m.stages.resilience = { status: "pass", artifact: resilience.artifact, fingerprint };
m.stages.security = { status: "pass", artifact: security.artifact, fingerprint: security.fingerprint };
m.stages.review = { status: "pending_validation", artifact: reportPath, head_sha: head, skill_revision: m.skill_revision };
await json(`${run}/manifest.json.tmp`, m);
await rename(`${run}/manifest.json.tmp`, `${run}/manifest.json`);
await json(`${dir}/manifest.json`, m);
console.log(reportPath);
