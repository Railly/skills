# Review Gate: vercel-labs/agent-browser

Date: 2026-09-09
Repository: vercel-labs/agent-browser
Base: `eb05921bad874cd2a1b4fa5d1149f1ed26576cae`
Head: `323449d9618693c85d2191f7dd10010ad22f640b`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: independent-review.json
- Degraded from: fx_worker
- Schema failures: 3
- Independence gap: Same-family review; author model unknown. Reference-oracle independence limited to W3C combobox commitment.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-09-agent-browser-1770-323449d/contract.md
- Spec status: not_provided
- Acceptance reviewed: A1, A2, A3, A4, A5, A6

## Stage receipts

- Test Strength: unavailable. Required passing exact-head Test Strength receipt is unavailable; authored green tests are not behavioral falsification.
- Resilience Audit: unavailable. Required passing exact-head Resilience Audit receipt is unavailable; full failure ownership and immediate retry proof are not established.
- Security Review: missing

## Verified properties

- P1: Native selection verifies the current live selected control after activation. REFUTED by F6: the new verification accepted a detached original select while the live replacement remained us. Basic and multiple selection cases still passed.
- P2: Combobox success corresponds to committed state, including keyboard-highlighted options. F1: W3C reference widget returned success with input C and open popup; manual Enter committed Alabama.
- P3: Value/label matching survives popup removal after successful activation. F3: ca matched Canada, clicked and committed, then timed out after popup removal.
- P4: Configured action timeout bounds every retry and activation path. F2: 500 ms configured deadline allowed 2421 Enter events over 2.513 seconds.
- P5: Input-backed filtering replaces previous text and verifies successful filtered selection. REFUTED by F4: macOS replacement retained Re and typed ReBlue. F5 is an acknowledged unverifiable-state limitation, not a blocker.
- P6: Explicit multiselect final sets and supported dialog handoff work in the supplied cases. 7 authored ARIA E2E tests passed after built-artifact dogfood, including multiselect and active-descendant confirm-dialog handoff; exhaustive failure/retry coverage remains unavailable.
- P7: CLI, MCP and guidance agree on expanded select scope. All required documentation surfaces are touched; MCP forwards selector and all values; parser/schema tests pass; WebDriver explicitly rejects select. Runtime selection promises themselves fail under F1-F5.

## Deterministic checks

- `identity`: pass. Exact-copy skill doctor at 77fdde3e; exact clean head and binary digest in identity.json.
- `covered`: acknowledged. Packaged check matched the newly created SHA-named directory before any report existed; not accepted as prior coverage. Final report generated and exact SHA rechecked.
- `style`: pass. style.log
- `surfaces`: pass. surfaces.log
- `callers select_option`: pass. All callers in changed files; callers.log; radius Impact Map saved.
- `timings`: pass. timings.log; numerical sweep does not detect the F2 missing branch check.
- `siblings select`: acknowledged. doc-passages.log read: unchanged hits are selectors/tab selection/security policy or historical changelogs, terse native dropdown examples, jq select, and navigation paths; canonical selection prose updated. No missing required surface.
- `cargo build --locked`: pass. build.log; exact binary digest in identity.json.
- `cargo fmt -- --check`: pass. fmt.log
- `cargo test --locked`: pass. 1219 unit + 6 integration tests passed, 116 ignored; unit.log.
- `cargo clippy -- -D warnings`: pass. clippy.log; rustc 1.98.1.
- `cargo test e2e_aria_select -- --ignored --test-threads=1`: pass. 7 passed after independent built-artifact dogfood; aria-e2e.log.
- `GitHub checks`: acknowledged. Fetched for exact head; Native E2E skipped remotely, local selection E2E run.
- `stale/producers/shellmeta/artifacts/rawinput/flagsweep/execdeps`: acknowledged. No retired duplicated value, narrowed error classifier, shell detector, new persistent artifact, deepened shared resolver, new flag or external executable.

## Judgment lenses

- Inverse regression surface: run. Reviewed preserved native matching and multiselect; new filtered and popup-removal states fail F3/F4/F6.
- New-domain matrix: run. Compared native, combobox, listbox, selected-preview, filtering, unmount, disabled/unknown, and dialog states. F1-F4/F6 refute expanded claims; exhaustive specialist matrix unavailable.
- Resolution-rule consistency across consumers: run. Compared native JS matching, ARIA state matchValues, Rust matching and committed-value fallback; F3 loses value/label aliases after popup unmount.
- Shell re-parse append domain: skipped. No shell command rewriting added.
- Emission channel and one-shot latch reachability: run. Selection errors observed in attached CLI JSON, preserving target and available-options context; examined opened/filter_input_sent latches.
- Shim hermeticity: skipped. No new external executable shims.
- Deliberate-default check: run. Native input/change and single/multiple guards inspected against prior implementation and tests; no separately confirmed default regression beyond recorded findings.
- Fresh-seam scan: skipped. No framework or runtime signal forwarding patch.
- Substrate differential corpus: run. Exact binary on Chrome and independent W3C example contradict success predicate; full substrate matrix remains a gap.
- Reference-implementation oracle: run. Official W3C example driven without code edits; highlighted aria-selected option is committed only by Enter. F1.
- New-failure-outcome propagation: run. handle_select and dispatch read after caller sweep; F3/F5 return errors after actual selection side effects.
- Flag-propagation dispatch sweep: skipped. No new flag, mode, or config bit. Existing timeout is traced in boundary/timeout lenses.
- Error-path forcing: run. Unknown/unverified authored E2E and local post-commit failures exercised. Required Resilience receipt remains missing.
- Non-destructive recovery: run. Inspected partial filter/selection state and subsequent errors; F3/F4/F6 leave mutated widgets. Complete cleanup/retry ownership not proven.
- Cancellation and timeout hygiene: run. F2 reproduces missed deadline and repeated Enter; general resilience receipt absent.
- Boundary pipeline trace: run. CLI parser to handle_select to selection helper to CDP input and verification; MCP delegates same parser; WebDriver rejects early.
- Substrate verification: run. Built exact SHA and drove Chrome; W3C reference state checked independently. Other supported substrates not exercised.
- Dogfood the built artifact: run. Native and adversarial ARIA cases run before trusting authored tests. dogfood.json and w3c-preview-repro.json.
- Newly-asserted invariant ownership: run. Postconditions owned in aria_selection_confirmed disagree with actual widget commitment (F1/F3/F5).
- Docs-behavior parity: run. Surface sweep passes, but timeout/commit/filter guarantees are contradicted by F1-F4/F6.
- Demonstrative example: run. HTML snippet is schematic, with no event handlers; command examples describe supported API but do not prove live behavior. Actual browser fixtures supplied in run artifacts.
- Choice audit: skipped. No contributor decision trail supplied.
- Complexity budget: run. ARIA state scans associated options on each poll and matches requested values; worst-case O(options * requested-values) plus layout reads. No performance benchmark or independent performance guarantee claimed.

## Findings

- F1: confirmed, open. [P1] Do not treat a highlighted combobox option as a committed value Evidence: w3c-preview-repro.json: on the official W3C editable combobox example, type C, ArrowDown, then select the highlighted Alabama. CLI returns success but the input remains C and aria-expanded remains true. Manual Enter then commits Alabama. aria-selected is also used for popup navigation; this early return bypasses activation. Local fixture independently returned success with commits=0.
- F2: confirmed, open. [P1] Enforce the deadline on the active-descendant Enter branch Evidence: dogfood.json: with AGENT_BROWSER_DEFAULT_TIMEOUT=500, a non-committing active option received 2421 Enter events over 2.513 seconds. The fixture removed the option after 2500 ms to bound the experiment. The unconditional continue avoids every deadline check while the active option remains available. Already reported by the Vercel review on this exact head; review-comments.json records attribution.
- F3: confirmed, open. [P2] Retain the matched option identity when verifying an unmounted popup Evidence: dogfood.json: request ca for an option value=ca/text=Canada. Trusted click commits Canada and removes the popup; commits=1 and display=Canada, but CLI returns timeout. Post-commit fallback compares the display only against raw request ca and loses the value-to-label relationship it used to select the option.
- F4: confirmed, open. [P2] Clear the existing filter reliably before typing a replacement on macOS Evidence: independent-dogfood.json: a Chrome combobox starts with Red. Selecting Blue results in ReBlue, input events Red/Re/ReB/ReBl/ReBlu/ReBlue, commits=[], and timeout. The Meta+A CDP chord does not select all in this tested macOS Chrome path, so Backspace deletes only the last character. This new caller needs a verified select-all operation.
- F5: exempted, not_applicable. Popup closure with unchanged filtered text supplies no independent standard commitment signal Evidence: independent-dogfood.json: an initially empty combobox filters on Blue, then a trusted option click commits Blue, closes the popup, and removes its options. The command still times out although commits=[blue] and value=Blue. committed_before_activation was already Blue due to filtering, so requiring a change in text rejects this ordinary successful commit. Cleared after independent challenge: the PR explicitly rejects unverifiable widgets, and this state is indistinguishable from filter cancellation. Keep as a documented coverage/support limitation rather than a blocker.
- F6: confirmed, open. [P1] Verify the live native select after change handlers can replace it Evidence: supplemental-native-rerender.json: native #country change handler replaces the control. select ca returns success, but document.querySelector(#country).value is us and the live selected label is USA. New verification reuses the detached original object_id after input/change, so it confirms an obsolete node instead of the visible control.

## Gaps

- Required passing exact-head Test Strength receipt is unavailable; authored green tests are not behavioral falsification.
- Required passing exact-head Resilience Audit receipt is unavailable; full failure ownership and immediate retry proof are not established.
- Independent agent uses the same OpenAI family; author model is unknown. W3C reference drive provides an independent oracle for combobox commitment, not exhaustive cross-family review.
- Linux, Windows, Lightpanda, cross-document/native-dialog edge states and full trusted-input failure partitions were not exercised.
- No separately approved Solution Gate/Spec or prior work-item manifest supplied. Review criteria derived from issue and PR.

## Limits and provenance

- Author model: unknown (PR author ctate)
- Reviewer model: GPT-6 root; independent GPT-6 Astra; supplemental native specialist
- Same family: yes
- Independent challenge: satisfied. Official W3C APG editable combobox reference reproduces F1 and manual Enter provides the independent commitment oracle. This is bounded oracle independence, not cross-family model review.
