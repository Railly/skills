import { rename } from "node:fs/promises";

const dir = import.meta.dir;
const m = await Bun.file(`${dir}/manifest.json`).json();
const evidence = m.environment.fixture_root;
const revision = m.skill_revision;
const fingerprint = {
  head_sha: m.head_sha,
  changed_paths_digest: m.changed_paths_digest,
  contract_digest: m.contract_digest,
  command: "bun verify.mjs; bun pressure.mjs race; bun pressure.mjs matrix; cargo test e2e_auth_login -- --ignored --test-threads=1",
  environment_digest: m.environment_digest,
  skill_revision: revision,
  relevant_paths: [...m.changed_paths, "cli/src/native/interaction.rs", "cli/src/native/cdp/client.rs"],
  reusable: false,
  reuse_evidence: null,
};
const testStrength = {
  required: true,
  status: "fail",
  reason: "The three added tests protect hidden-first examples but pass while detached-node credential misdelivery remains possible.",
  skill_revision: revision,
  artifact: `${dir}/test-strength.json`,
  evidence: "Three contributor regressions fail for selector timeouts on parent production code and pass on PR head. All eight auth E2E tests pass, but none guards detached-node credential delivery. The independent race oracle fails on head.",
  fingerprint,
  dimensions: {
    values: [
      "control: username, password, submit",
      "first match: hidden, disabled, readonly, normal",
      "selector source: automatic, explicit CSS",
      "node lifetime: attached, replaced between selection and action",
      "partial progress: no missing control, missing password, missing submit, immediate retry",
      "navigation: ordinary, no-navigate, cross-origin rejection, delayed SPA",
    ],
    exclusions: [
      "Readonly only applies to input controls; submit has no readonly semantics.",
      "Only macOS Chrome 152 was exercised; no claim of a Linux/Chrome 154 rerun.",
      "No fix-absent mutation for every disabled/readonly cell or transient CDP-failure partition. Those cells cannot establish exhaustive protection.",
    ],
    evidence: `${evidence}/before-after-results.json; ${evidence}/matrix-results.json; ${evidence}/race-results.json; force-red.log; auth-e2e.log`,
  },
  oracle: {
    source: "Issue 1998 requires visible form values and submission. The PR separately promises exact-node action and safe stale failure. DOM input-event targets and actual submitted values are observed independently of CLI success.",
    independent: true,
    evidence: "Both builds report success during the race, while only head writes the password into the username field. The DOM oracle separates the property from the success proxy.",
  },
  producer: {
    name: "Exact compiled agent-browser binaries and real Chrome DOM mutation, input events, and form submission",
    status: "exercised",
    evidence: `${evidence}/verify.mjs; ${evidence}/pressure.mjs`,
  },
  falsification: [
    {
      mutation: "Retain PR's new e2e_tests.rs on an isolated parent production tree with the complete fix absent.",
      red_evidence: "force-red.log: 0 passed, 3 failed at the intended username/password/submit timeout assertions; no compilation or setup failure.",
      restored_green_evidence: "auth-e2e.log: exact untouched PR head passes all 8 auth E2E tests, including the same 3 added regressions.",
    },
  ],
  gaps: [
    "Current authored suite passes despite the detached-node misdelivery in F1.",
    "Descriptor failure, cancellation, and per-class disabled/readonly mutations were not exhaustively forced.",
  ],
};
const resilience = {
  required: true,
  status: "fail",
  reason: "Forced node replacement silently corrupts the credential destination and returns success; descriptor and cancellation partitions also remain unverified.",
  skill_revision: revision,
  artifact: `${dir}/resilience.json`,
  evidence: "Missing password and submit produce bounded errors and permit immediate retry after the fixture restores the missing control. Replacement of selected username/password instead silently corrupts input and returns loggedIn:true, reproduced twice for each control on head; the parent remains correct.",
  fingerprint,
  commit_points: [
    {
      id: "C1",
      effect: "Username text becomes visible in the page.",
      owner: "handle_auth_login -> interaction::fill",
      commit_event: "Input.insertText",
      later_fallible_stages: ["password selection and fill", "submit selection and click"],
      failure_partitions: [
        {
          ownership_region: "password selection",
          covers: ["password selection and fill"],
          forced: true,
          residual_observed: "Username remains filled; password absent; no submission.",
          cleanup_owner: "The page retains input; next auth_login overwrites it. No rollback is promised by this existing contract.",
          retry: { attempted: true, outcome: "success", evidence: "matrix-results.json missing-pass restores only the missing DOM control and immediately repeats auth_login successfully." },
          evidence: `${evidence}/matrix-results.json`,
        },
        {
          ownership_region: "submit selection",
          covers: ["submit selection and click"],
          forced: true,
          residual_observed: "Both intended fields remain filled; no submission.",
          cleanup_owner: "Existing page state, overwritten by the next auth_login.",
          retry: { attempted: true, outcome: "success", evidence: "matrix-results.json missing-submit restores only the missing button and immediately repeats auth_login successfully." },
          evidence: `${evidence}/matrix-results.json`,
        },
      ],
    },
    {
      id: "C2",
      effect: "A backend node is retained for a credential fill.",
      owner: "wait_for_any_selector and resolve_element_object_id",
      commit_event: "DOM.describeNode yields backendNodeId; local exact ref is created.",
      later_fallible_stages: ["node lifetime", "focus", "keyboard insertion"],
      failure_partitions: [
        {
          ownership_region: "DOM node replacement before fill",
          covers: ["node lifetime", "focus", "keyboard insertion"],
          forced: true,
          residual_observed: "Detached object resolves successfully. Focus no-ops; the real browser inserts the credential into the previously focused field, then submits and reports success.",
          cleanup_owner: "No stale-node rejection before Input.insertText; F1 remains open.",
          retry: { attempted: false, outcome: "not_attempted", evidence: "The first operation falsely reports success, leaving no error that could trigger safe retry. No repair was authorized." },
          evidence: `${evidence}/race-results-first.json; ${evidence}/race-results.json`,
        },
      ],
    },
  ],
  gaps: ["DOM.describeNode refusal/retry and Runtime.releaseObject failure were not forced; cancellation cleanup is not proven."],
};
const security = {
  status: "pass",
  fingerprint: {
    repository: m.repository,
    base_sha: m.base_sha,
    head_sha: m.head_sha,
    dirty_digest: "clean",
    changed_path_digest: m.changed_paths_digest,
    skill_revision: revision,
  },
  claim: {
    property: "The change must not grant a lower-trust principal new access to credentials or bypass the existing no-navigate origin binding.",
    attacker: "Page JavaScript on the authorized origin; unrelated origins; untrusted selector text",
    scope: "PR 1999 exact diff. This receipt does not approve credential delivery correctness.",
  },
  trust_model: {
    assets: ["Decrypted credentials", "Bound top-level browser page"],
    principals: [
      "Local user already authorizes auth login and selects the credential profile.",
      "Authorized page JavaScript already reads values in both intended credential inputs.",
      "An unrelated origin must not receive no-navigate credential entry.",
    ],
    boundaries: ["Local credential store to authorized browser page", "No-navigate effective credential origin to active page"],
    entrypoints: ["auth_login", "Credential selector overrides", "Browser-controlled DOM changes"],
    sinks: ["interaction::fill / Input.insertText", "interaction::click"],
  },
  observations: [
    {
      id: "SEC-001",
      classification: "non_security_defect",
      scope: "unrelated_bug",
      prerequisites: ["Selected input is replaced between detection and filling", "Detached DOM object remains resolvable"],
      chain: {
        capability: "Page may replace and retain its own DOM nodes.",
        reachability: "Confirmed with local real-browser A/B fixture.",
        control: "The same authorized page controls both the intended input and alternate focused input.",
        boundary: "No newly empowered principal was demonstrated; page JS already had access to the intended password input.",
        impact: "Password is displayed in the username field and the login is falsely reported successful. Blocking correctness defect F1; no separate exploitable security boundary is claimed.",
      },
      confidence: "high",
      evidence: [`${evidence}/race-results.json`, "cli/src/native/element.rs:700-706", "cli/src/native/interaction.rs:146-189"],
    },
    {
      id: "SEC-002",
      classification: "informational",
      scope: "out_of_scope_hardening",
      prerequisites: [],
      confidence: "high",
      evidence: ["All 8 current auth E2E tests pass, including cross-origin no-navigate rejection and preservation of the active page with local/provider credentials.", "The diff leaves origin validation call sites intact and serializes selectors through serde_json before JavaScript evaluation."],
    },
  ],
  verification: {
    authorized_scope: "Read-only code review and bounded local fixtures with disposable credentials only.",
    commands: [fingerprint.command],
    cleanup: "All CLI fixture profiles deleted and sessions closed. Three profiles left by intentional red E2E assertions removed with auth delete; cleanup.json.",
    gaps: [],
  },
  merge_relevance: {
    security_blockers: [],
    follow_ups: [],
    routed_non_security_defects: ["F1: detached node credential misdelivery is a correctness blocker, not a demonstrated new attacker capability."],
  },
  artifact: `${dir}/security-review.json`,
};
await Bun.write(testStrength.artifact, JSON.stringify(testStrength, null, 2));
await Bun.write(resilience.artifact, JSON.stringify(resilience, null, 2));
await Bun.write(security.artifact, JSON.stringify(security, null, 2));

const runReasons = {
  "Inverse regression surface": "Moving from selector re-resolution to a retained backend node introduces F1 when the DOM replaces an input.",
  "New-domain matrix": "Exercised hidden, disabled, readonly, explicit CSS, stable, and replaced controls; matrix-results.json and race-results.json.",
  "Resolution-rule consistency across consumers": "All three auth control selections use exact local refs; constructors preserve role fallback for existing snapshot refs.",
  "Emission channel and one-shot latch reachability": "New stale error is returned through the daemon error path, but detached objects skip it and produce false success (F1).",
  "Deliberate-default check": "Issue 1998, existing visible-selector waits, and authored regressions establish that the hidden-first timeout is unintended.",
  "Substrate differential corpus": "Real Chrome A/B compares stable, hidden, disabled, readonly and removed nodes. Detached DOM identity does not imply connected/focusable.",
  "New-failure-outcome propagation": "Reviewed caller sweep; exact refs remain local to auth. Missing later controls preserve partial form state and retry; stale path fails to reject.",
  "Flag-propagation dispatch sweep": "Internal allow_role_fallback is true in all existing constructors and false only for add_exact_backend_node called by auth.",
  "Error-path forcing": "Forced missing password, missing submit, and node replacement. Descriptor refusal/cancellation remain named gaps.",
  "Non-destructive recovery": "The selected-node policy avoids role retargeting on resolution errors, but cannot prevent misdirected keyboard input after detached-node resolution.",
  "Cancellation and timeout hygiene": "Missing-control timeouts and immediate retries exercised; transient CDP failure and cancellation are not exhaustively forced.",
  "Boundary pipeline trace": "Traced Runtime.evaluate -> DOM.describeNode -> local ref -> DOM.resolveNode -> focus -> page-level Input.insertText. Last boundary breaks P3.",
  "Substrate verification": "Observed actual DOM values, input-event targets, and submission, with isolated namespaces per compiled binary.",
  "Dogfood the built artifact": "Both exact debug binaries drove CLI auth before contributor tests were trusted.",
  "Newly-asserted invariant ownership": "The PR's safe-stale claim is false: DOM.resolveNode can return a detached object and focus can leave the previous input active.",
  "Docs-behavior parity": "Custom CSS and normal auth contracts remain documented; hidden-duplicate fix is a repair of intended form filling. PR stale-safety prose is refuted by F1.",
  "Complexity budget": "Each selector materializes N matches and scans them linearly; per-poll cost O(sum of selector match counts), without nested per-node lookup.",
};
const skipReasons = {
  "Shell re-parse append domain": "No shell argument construction is changed.",
  "Shim hermeticity": "No executable shim or PATH mock is added.",
  "Fresh-seam scan": "No new framework signal or callback is introduced.",
  "Reference-implementation oracle": "No getByRole, ARIA mapping, or adopted Playwright contract is changed; DOM lifetime is checked directly on Chrome.",
  "Demonstrative example": "No documentation example is added.",
  "Choice audit": "No author decision trail was supplied.",
};
const catalog = await Bun.file("/Users/raillyhugo/Programming/railly/skills/skills/review-gate/references/gates.md").text();
const names = [...catalog.matchAll(/^### (.+?) \(/gm)].map(x => x[1]);
const lenses = names.map(name => ({name, status: runReasons[name] ? "run" : "skipped", reason: runReasons[name] ?? skipReasons[name] ?? "No trigger in this diff."}));
function property(id, claim, status, records, proxy, counterexample) {
  return {
    id, claim: `${status.toUpperCase()}: ${claim}`, kind: "browser interaction", status,
    oracle: {observes: "Actual DOM values, event targets, submission and failure state", layer: "Real Chrome through compiled CLI", method: records, proxy_only: false},
    proxy_challenge: {proxy, counterexample, attempted: true, outcome: status === "refuted" ? "separated" : "not_separated", evidence: records},
    substrates: [{name: "macOS arm64, Rust 1.98.1, Chrome 152, exact compiled commits", status: "exercised", evidence: records}],
    evidence: records,
  };
}
const report = {
  schemaVersion: 1,
  run: {
    date: "2026-09-28",
    repo: m.repository,
    base: m.base_sha,
    head: m.head_sha,
    profile: "external-pr",
    skill_revision: revision,
    status: "complete",
    verdict: "incomplete",
    gaps: [
      "Confirmed P1 F1 prevents promotion: a detached password target can place the password in the username field and return loggedIn:true.",
      "Required Test Strength and Resilience receipts fail on the missing stale-node protection; transient descriptor/cancellation partitions remain unverified.",
      "Reviewer runtime protocol failure: two malformed specialist-spawn calls exceeded the per-operation limit. FX then failed its authentication-mode check and the native reviewer failed with a provider capability error. No independent model review completed; the primary runtime finished a disclosed sequential pass.",
    ],
  },
  execution: {
    mode: "sequential_isolated",
    degraded_from: "native_subagent",
    independence_gap: "FX authentication-mode verification failed; native reviewer failed before returning evidence (Service Unavailable, then web search not supported). The primary runtime performed the sequential pass in the same conversation with separate frozen input/output artifacts. This is not blind review or cross-family independence.",
    schema_failures: 4,
    operations: [
      {operation: "abandoned specialist spawn", attempted_calls: 2, schema_failures: 2, identical_retry: false, outcome: "protocol_failure"},
      {operation: "FX independent review wrapper", attempted_calls: 1, schema_failures: 1, identical_retry: false, outcome: "unsupported auth mode: missing; inspected status once without exposing credentials"},
      {operation: "native independent lens review", attempted_calls: 1, schema_failures: 1, identical_retry: false, outcome:"provider capability failure; no output"},
      {operation: "sequential frozen-tree lens pass", attempted_calls: 1, schema_failures: 0, identical_retry: false, outcome:"F1 confirmed; separate input/output retained with independence gap"},
    ],
  },
  contract: {path: m.contract, spec_status: "not_required", acceptance_reviewed: ["A1","A2","A3","A4","A5"], gaps: ["A3 refuted; A5 transient transport partitions not fully exercised."]},
  provenance: {author_model: "unknown external contributor", reviewer_model: "primary Codex runtime; independent gpt-6-astra reviewer unavailable", same_family: null},
  risk: {
    level: "high",
    triggers: m.risk_triggers,
    independent_challenge: {
      required: true, satisfied: true, method: "substrate_corpus",
      artifact: `${evidence}/race-results.json`,
      evidence: "Expected form destinations were defined by the issue/contract. Real Chrome event targets refute the implementation's success result; parent and head driven twice per selected control. This is substrate evidence, not an independent model review.",
    },
  },
  security_review: security,
  claim_inventory: [
    {source:"contract",location:m.contract,status:"reviewed",properties:["P1","P2","P3","P4","P5"],evidence:"Issue 1998 plus PR claims frozen in A1-A5."},
    {source:"design",location:"No separately supplied design gate",status:"not_provided",properties:[],evidence:"No upstream manifest, design receipt, or decision trail for this PR was found."},
    {source:"user_facing",location:"remote-pr.json; README.md; cli/src/output.rs; docs/src/app/commands/page.mdx; skill-data/core/references/authentication.md",status:"reviewed",properties:["P1","P3","P4","P5"],evidence:"PR promises duplicate control selection and stale safety; current CLI and docs describe CSS overrides, waiting and origin behavior."},
    {source:"implementation",location:m.changed_paths.join(", "),status:"reviewed",properties:["P1","P2","P3","P4","P5"],evidence:"Selection retains backend identity; old constructors keep fallback; exact refs add stale branches."},
  ],
  properties: [
    property("P1","Hidden-first username/password/submit controls do not prevent filling and submitting visible controls.","verified",`${evidence}/before-after-results.json; force-red.log; auth-e2e.log`,"CLI success","Hidden fields could be filled or submitted while CLI claims success; inspected all hidden and visible values and click markers."),
    property("P2","Automatic selection skips disabled/readonly duplicates; explicit CSS overrides work for hidden duplicates.","verified",`${evidence}/matrix-results.json`,"Selector returns a node","A node may exist but be unusable; checked forbidden fields stay empty and correct inputs receive exact values."),
    property("P3","Selected auth node remains the actual input destination, and stale selections fail safely.","refuted",`${evidence}/race-results-first.json; ${evidence}/race-results.json`,"DOM.resolveNode success and loggedIn:true","A detached node still resolves; focus no-ops and page-level Input.insertText targets the old active input. Both success proxies remain true while the password goes into username."),
    property("P4","Existing auth origin checks, no-navigation state, provider login and delayed forms remain functional.","verified","auth-e2e.log: 8 passed; matrix-results.json: normal and explicit CSS pass","Happy-path command return","Existing real-browser tests assert page state, cross-origin rejection, and correct DOM values."),
    {id:"P5",claim:"UNVERIFIED: Transient descriptor failures repoll and remote object cleanup remains safe under failure/cancellation.",kind:"lifecycle",status:"unverified",oracle:{observes:"Remote handle lifecycle and retry after forced CDP failure",layer:"CDP transport and page",method:"Source inspection only; direct fault partitions incomplete",proxy_only:true},proxy_challenge:{proxy:"Source contains continue and Runtime.releaseObject",counterexample:"Transport failure/cancellation could prevent cleanup or exceed the timeout",attempted:false,outcome:"not_executed",evidence:"Named verification gap; no safety claim."},substrates:[{name:"Forced CDP descriptor/cleanup failure",status:"not_exercised",evidence:"Review stopped short of promotion after confirmed F1."}],evidence:"actions.rs:12286-12316 has intended normal/error cleanup ordering; no forced-failure receipt."},
  ],
  stage_receipts: {test_strength:testStrength,resilience},
  assumptions: [
    {id:"A1",source:"Execution",claim:"Base and head evidence used the corresponding exact binaries and isolated daemon namespaces.",status:"verified",evidence:`${evidence}/before-after-results.json records absolute binary paths and namespaces; separate worktrees/targets; final clean HEAD check.`},
    {id:"A2",source:"Implementation stale-node claim",claim:"A successful DOM.resolveNode proves a usable, connected auth input.",status:"refuted",evidence:`${evidence}/race-results.json observes detachedConnected:false while login reports success and credentials reach the wrong field.`},
  ],
  lenses,
  deterministic: [
    {check:"covered (initial)",outcome:"acknowledged",reason:"No exact-head report existed. This run materializes one; no prior pass was reused."},
    {check:"skill identity",outcome:"pass",reason:"skills-doctor: exact-copy review-gate 77fdde3e8d7e source=clean; skill-identities.json records content hashes."},
    {check:"exact head and live base",outcome:"pass",reason:"Local HEAD and remote PR remain 1b4cacd0; live main equals d01253d9 parent; target working tree clean."},
    {check:"style",outcome:"pass",reason:"style.log"},
    {check:"surfaces",outcome:"acknowledged",reason:"Existing docs describe form waiting and CSS selectors without promising first-match semantics. No new flag, schema, or intentional public contract was added. PR's stronger stale-safety sentence is reviewed as F1."},
    {check:"callers wait_for_any_selector",outcome:"pass",reason:"All callers are in changed auth handler."},
    {check:"callers resolve_element_object_id/center",outcome:"acknowledged",reason:"All existing constructors retain allow_role_fallback:true; new false refs are local to auth and never enter state.ref_map. Read interaction fill/click and browser upload paths; F1 captures the affected new exact-ref path."},
    {check:"timings",outcome:"pass",reason:"No new wait ceiling; existing interval retained."},
    {check:"cargo build --locked --bin agent-browser",outcome:"pass",reason:"Exact base/head compiled; build-base.log and build-head.log."},
    {check:"cargo fmt -- --check",outcome:"pass",reason:"fmt.log"},
    {check:"cargo clippy --bin agent-browser -- -D warnings",outcome:"pass",reason:"clippy.log"},
    {check:"cargo test --bin agent-browser -- --test-threads=1",outcome:"pass",reason:"tests-clean-env.log: 1391 passed, 0 failed, 145 ignored. Initial namespace-injected run had 15 harness/path failures; normalized environment rerun passes."},
    {check:"auth E2E",outcome:"pass",reason:"auth-e2e.log: 8 passed including all 3 new regressions."},
    {check:"force-red contributor regressions",outcome:"pass",reason:"force-red.log: 3 intended timeouts with parent implementation; all green at head."},
    {check:"radius",outcome:"pass",reason:"radius-impact-map.json saved as attention guidance only."},
  ],
  findings: [
    {
      id:"F1",severity:"P1",state:"confirmed",
      claim:"Reject detached exact auth refs before keyboard input: a replaced password field can receive no input while its password is appended to username, then submitted with loggedIn:true.",
      evidence:`Repeated twice per username/password race. Parent fills replacement correctly. Head stale-user inserts into decoy; head stale-pass produces user=review@example.testlocal-test-password, pass='', submitted=true. ${evidence}/race-results.json`,
      layer:"Real browser input delivery",source:"lens",
      path:"cli/src/native/element.rs:700-706 -> cli/src/native/interaction.rs:146-189, newly reached through actions.rs:12694-12703",
      resolution:"open",
      recommendation:"Validate connectedness and successful focus on the exact selected node before page-level insertion; fail or safely repoll before sending credentials. Add a real-browser replacement regression that asserts actual input destination and forbids false success.",
    },
  ],
  exemptions: [
    {claim:"Unchanged ordinary snapshot refs",evidence:"All preexisting constructors set allow_role_fallback:true; the only add_exact_backend_node caller is the new local auth selector helper."},
    {claim:"No confirmed new attacker capability",evidence:"The reproducing page already owns both credential input DOM nodes and can read their values; F1 is a blocking delivery defect without a demonstrated new principal crossing."},
  ],
  issue_candidates: [],
  outcomes: {external_findings:0,review_rounds:1,human_corrections:0,escaped_finding_class:"not_applicable",publication:"none",product_source_edits:"none"},
};
await Bun.write(`${dir}/run-report-1b4cacd0.json`, JSON.stringify(report,null,2)+"\n");
m.stages.test_strength={status:testStrength.status,artifact:testStrength.artifact,fingerprint};
m.stages.resilience={status:resilience.status,artifact:resilience.artifact,fingerprint};
m.stages.security={status:security.status,artifact:security.artifact,fingerprint:security.fingerprint};
m.stages.review={status:"complete",verdict:"incomplete",artifact:`${dir}/run-report-1b4cacd0.json`,head_sha:m.head_sha,skill_revision:revision,blocking_findings:["F1"]};
await Bun.write(`${dir}/manifest.json.tmp`,JSON.stringify(m,null,2)+"\n");
await rename(`${dir}/manifest.json.tmp`,`${dir}/manifest.json`);
