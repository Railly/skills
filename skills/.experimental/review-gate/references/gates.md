# Gate catalog

Admission rule: a gate enters this catalog only from a recorded case ([cases/](../../../../cases)) or a confirmed external-review miss. A gate is marked **promoted** when it recurs across two or more independent cases or a maintainer-confirmed miss validates it. Everything else is **candidate**.

Each entry carries: what triggers it, the binary check or pass question, and provenance.

## Deterministic gates

Run via [scripts/gate.sh](../scripts/gate.sh) or the listed command. Binary outcome; findings are fixed or acknowledged, never skipped silently.

| Gate | Trigger | Check | Status | Provenance |
|---|---|---|---|---|
| Stale-value zero-hits | The diff renames or retires a value duplicated across surfaces (a flag, an action name, a message) | Repo-wide search for the old value returns zero hits. Fixing the copies already known is closure by enumeration; the number of copies found is itself the signal that more exist | promoted | [1553](../../../../cases/agent-browser/1553-error-detail-and-help-drift.md) (fourth lesson, maintainer-confirmed miss) |
| Force-red | The diff adds a test meant to catch a specific drift or regression | Revert the fix (not the test) and confirm the new test goes red. A drift test asserts the invariant, not the failure message already observed | promoted | [1553](../../../../cases/agent-browser/1553-error-detail-and-help-drift.md) (third lesson) + [portless 305](../../../../cases/portless/305-windows-command-length.md) (revert-to-falsify) |
| Surface sweep | The diff touches a path listed in the project's surface map | Every required surface for that path appears in the diff, or its absence is acknowledged with a reason | promoted | [1552](../../../../cases/agent-browser/1552-getbyrole-implicit-roles-regression.md) + [1553](../../../../cases/agent-browser/1553-error-detail-and-help-drift.md) (round-1 misses on help/MCP and README/eval-harness surfaces) |
| Silent-revert signature | About to fix a bug reported as "still broken in main" while a changelog or nearby PR claims it was already fixed | Reference graph of the original fix checked for same-day merges touching the same file with an unrelated declared scope, before writing new code | candidate | [1552](../../../../cases/agent-browser/1552-getbyrole-implicit-roles-regression.md) (primary lesson) |
| PR staleness | Evaluating or reviving a PR whose branch is weeks old | `git merge-base` + `git log <base>..main -- <subsystem>` enumerates invariants that landed after the branch was cut; the PR is checked against each | candidate | portless #363 (competing WS-over-H2 PRs; case pending sync) |
| Comment punctuation | The diff adds comments | No ` -- ` used as prose punctuation in added comment lines; no em dash in added lines. Write `,`, `;`, or a period instead | candidate | agent-browser #1553 round-2 review miss |

## Lenses

One focused pass per triggered lens. Findings from a lens are candidates until step 4 (verify) confirms them.

### Inverse regression surface (promoted)

- **Trigger:** the diff replaces a matcher, parser, or lookup's data source (syntactic → semantic, one API → another).
- **Pass question:** the change has two regression surfaces, not one. Beyond "what does the new source see that the old one missed?", ask the inverse: "what did the old source accept that the new one erases?" Values whose meaning is absence from the new source are structurally invisible to a test matrix built from the first question alone.
- **Provenance:** [1552](../../../../cases/agent-browser/1552-getbyrole-implicit-roles-regression.md) (third lesson: presentational roles are exactly the values a semantic source omits); converges with the new-domain matrix lens across two repos.

### New-domain matrix (promoted)

- **Trigger:** the diff widens a trigger condition or relaxes a validator (a guard accepts more inputs than before).
- **Pass question:** the verification matrix is regenerated from the new input domain, not inherited from the bug report. Enumerate the input classes the code now reaches, the previously-impossible values flowing into every downstream consumer, and exercise one of each. Helpers the code reuses carry gaps that were benign only because they were unreachable.
- **Provenance:** portless #365 (multi-segment TLDs: both bugs lived in matrix cells outside the reported case) and #366 (script indirection: build scripts, compound scripts, `--flag=value` forms); cases pending sync; same mechanism as the inverse-regression-surface lens.

### Reference-implementation oracle (candidate)

- **Trigger:** the diff reimplements behavior that has a reference implementation or a written spec (a Playwright semantic, a W3C contract, an RFC).
- **Pass question:** the reference's full contract is enumerated and each behavior is checked, not only the cases the bug report cited. Borrowing one semantic from the reference while ignoring its neighbors is how the long tail ships broken.
- **Provenance:** agent-browser #1552 round-2 misses (role-synonym normalization, ordered fallback role lists); every one already solved by the reference implementation the fix cited.

### Error-path forcing (promoted)

- **Trigger:** the diff adds any branch, guard, wrapper, or "this can't happen" fallback.
- **Pass question:** each new branch is its own claim, validated by forcing it: the worst case is observed, not reasoned about. Check ordering too: validation that runs after expensive setup produces errors that name the wrong fault. Wrapped errors preserve the guidance the unwrapped path carried.
- **Provenance:** [1553](../../../../cases/agent-browser/1553-error-detail-and-help-drift.md) (primary lesson: the "impossible" fallback was a silent client-side timeout) + round-2 misses (validation ordering, wrapped-error guidance).

### Non-destructive recovery (candidate)

- **Trigger:** the diff adds a recovery action driven by a heuristic detector (no reliable signal exists).
- **Pass question:** the recovery is harmless on a false positive. Making the false positive cost nothing is stronger than tuning the detector to misfire less often.
- **Provenance:** [1532](../../../../cases/agent-browser/1532-discarded-tab-revival.md) (activation recovers a dead renderer but only focuses a live one).

### Cancellation and timeout hygiene (candidate)

- **Trigger:** the diff adds an async operation, a timeout, or a cancellable request.
- **Pass question:** every new wait is bounded below the ceiling it could otherwise ride; a cancelled operation leaves no pending state behind (verified by a leak test with teeth: disabling the guard must make it fail).
- **Provenance:** [1532](../../../../cases/agent-browser/1532-discarded-tab-revival.md) (unbounded reload; cancelled probe leaked its pending entry).

### Boundary pipeline trace (candidate)

- **Trigger:** the diff extends a feature across a new boundary (a frame, a shadow root, a process, a protocol).
- **Pass question:** every pipeline stage crosses the boundary: discovery, resolution, action, cleanup. Discovery alone is useless when a later stage still stops at the old boundary.
- **Provenance:** [1266](../../../../cases/agent-browser/1266-shadow-dom-locators.md).

### Substrate verification (promoted)

- **Trigger:** the change's success is asserted from a command's own output, or verified against a long-lived process.
- **Pass question:** the effect is observed on the substrate (DOM, filesystem, serialized artifact, process identity), not on the command's report of itself. When a daemon or server may have answered, the process that responded is identified before either the broken or the fixed result is trusted.
- **Provenance:** [1105](../../../../cases/agent-browser/1105-select-silent-success.md), [1204](../../../../cases/agent-browser/1204-har-response-bodies.md), [shared-daemon](../../../../cases/agent-browser/shared-daemon-cross-worktree-contamination.md).

### Docs-behavior parity (candidate)

- **Trigger:** the diff changes observable behavior (semantics, defaults, matching rules, accepted inputs, output shape), not only internals.
- **Pass question:** first enumerate the behavior deltas the diff introduces, establishing each empirically against the built artifact; then, for each delta, walk the project's surface list (CLI help, MCP descriptions, README, web docs, skill files) and check that each surface's prose states the new behavior precisely, including its scope: what the behavior applies to and what it deliberately does not. The deterministic surface sweep proves the files were touched; this lens proves the words agree with the binary. An assertive sentence that misstates the behavior (broader, narrower, wrong, or ambiguous in scope) is always a finding; silence is a finding only on the surface that carries the full contract for that behavior. A terse command listing need not restate semantics.
- **Provenance:** agent-browser #1552, both review rounds (round 1: help and MCP still described the old `--exact` semantics; round 2: docs did not scope case-insensitive matching to role accessible names). Two maintainer-confirmed misses; the only answer-key item invisible to the catalog in blind-replication round 002.

### Demonstrative example (candidate)

- **Trigger:** the diff adds or edits a documentation example meant to demonstrate a capability.
- **Pass question:** the example actually requires the capability: it would fail without the fix. An example that passes under both the broken and the fixed code proves nothing regardless of the comments attached to it, and agents copy examples, not comments.
- **Provenance:** [1552](../../../../cases/agent-browser/1552-getbyrole-implicit-roles-regression.md) (secondary lesson).
