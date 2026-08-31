## R0–R15: Complete Requirements Table

| Req | Requirement | Status |
|-----|-------------|--------|
| **R0** | If a supported Vercel CLI and its required runtime are installed in a common user-level macOS layout, Vercel Desktop can execute the CLI from a normal Finder/LaunchServices environment. | Core goal |
| **R1** | An authenticated CLI is recognized as authenticated without requiring relogin or user-created symlinks. | Must-have |
| **R2** | CLI absence, unusable CLI installation/runtime, signed-out CLI, and authenticated-session/API failure remain distinguishable in product state and UI guidance. | Must-have |
| **R3** | Runtime discovery is deterministic, bounded, and independent of interactive or user shell startup files. | Must-have |
| **R4** | The selected CLI and runtime pairing is validated by actual execution, not file existence alone. | Must-have |
| **R5** | A broken higher-priority candidate does not hide a later usable candidate. | Must-have |
| **R6** | Current working PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM layouts preserve their existing behavior. | Must-not-change |
| **R7** | Every Vercel CLI command in the app uses the same resolved executable/runtime environment as onboarding. | Must-have |
| **R8** | Resolution and authentication checks do not invoke shell profiles, prompt plugins, package-manager activation hooks, or network installation. | Must-have |
| **R9** | Paths containing spaces and symlinked CLI entrypoints are launched without shell-string interpolation. | Must-have |
| **R10** | On failure, diagnostics retain the attempted executable, launch category, exit status, and sanitized stderr needed for actionable UI and support. | Must-have |
| **R11** | Resolution does not mutate the user's filesystem, PATH, shell configuration, CLI authentication, or installed runtimes. | Must-not-change |
| **R12** | Unit tests can cover candidate ordering, runtime pairing, retry, and state classification without depending on the developer's machine. | Must-have |
| **R13** | At least one packaged-app or sanitized-environment integration test proves the shipped process boundary against a script using `#!/usr/bin/env node`. | Must-have |
| **R14** | Existing successful CLI commands retain current arguments, noninteractive behavior, timeout behavior, output capture, and working directory. | Must-not-change |
| **R15** | The fix remains scoped to Vercel CLI discovery/execution and onboarding diagnostics; it does not become a general shell-environment emulation system. | Must-have |

---

## Solution Shapes

### A: Explicit Shebang Parsing + Direct Runtime Launch

**Mechanism:** Parse CLI shebang at discovery time; pair with explicit runtime and validate by execution attempt.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | Candidate enumeration: same order as current (PATH, NVM, Homebrew, pnpm, fnm, Bun) | |
| **A2** | Shebang parser: extract `#!<runtime>` from first line of selected CLI executable | ⚠️ |
| **A3** | Runtime resolver: map shebang (e.g., `#!/usr/bin/env node`) to concrete binary (search PATH, NVM aliases, known layouts) | ⚠️ |
| **A4** | Validation by execution: launch `[resolved-runtime, cli-path, "whoami", "--json"]` with minimal PATH (current exe directory + system defaults) | |
| **A5** | Failure classification: exit code + stderr → `missing`, `runtimeMissing`, `signedOut`, `failed` | |
| **A6** | Onboarding guidance: map each state → action (install CLI, install Node, `vercel login`, recheck) | |
| **A7** | Command reuse: cache validated pair; use `[runtime, cli-path]` for all subsequent commands | |

**Unknowns flagged:**
- **A2:** Does shebang always resolve to `#!/usr/bin/env node`, or do non-Bun CLI installations use other patterns?
- **A3:** Which runtime layouts (fnm, pnpm, direct Node `/usr/local`) are populated in U1?

---

### B: Paired Candidate Discovery + Validation

**Mechanism:** For each CLI candidate, generate a list of compatible runtimes based on installation layout. Validate pair by execution; skip broken candidate and try next.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | CLI candidates: enumerate in priority order (PATH, `~/.bun/bin`, NVM `~/.nvm`, Homebrew, pnpm, fnm) | |
| **B2** | Runtime layout enumeration: for each candidate directory, generate candidate runtimes (e.g., for `~/.bun/bin/vercel` → try `~/.bun/bin/node`, system Node, NVM node) | ⚠️ |
| **B3** | Pair validation: execute CLI + runtime with repaired PATH (candidate directory + system defaults) | |
| **B4** | Skip-on-failure: if pair fails (exit 127, ENOENT), mark as broken and try next CLI candidate; accept first successful pair | |
| **B5** | Failure classification: if no pair succeeds, return reason for highest-priority broken candidate | |
| **B6** | Onboarding guidance: map failure reason → action | |
| **B7** | Command reuse: cache successful pair; use same PATH and executable for all commands | |

**Unknowns flagged:**
- **B2:** How many runtimes should be tried per candidate? Will this regress Homebrew (should it prefer system Node over Bun)?

---

### C: Lazy Runtime Validation on First Command

**Mechanism:** Accept CLI file as before; validate runtime only when first command executes. On failure, attempt retry with alternate runtimes; cache successful pair.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **C1** | CLI discovery: same as current (accept first executable file) | |
| **C2** | Launch plan generation: defer runtime selection until first command | |
| **C3** | First-command execution: attempt CLI with current logic; if fails (exit 127, `env: node: not found`), retry with known runtime candidates | ⚠️ |
| **C4** | Retry logic: on failure, generate alternate runtime list and try 2–3 candidates; cache first success | |
| **C5** | State tracking: onboarding still classifies as `signedOut`, but command handler recognizes launch-time failure and suggests remediation | ⚠️ |
| **C6** | Subsequent commands: reuse cached launch plan without retry overhead | |
| **C7** | Onboarding re-check: invalidate cache on user action; re-validate on next command | |

**Unknowns flagged:**
- **C3:** How do we reliably extract "node: not found" from stderr across shells/runtimes?
- **C5:** Can we distinguish "launch failed" from "authenticated failure" within the existing state enum without adding transient states?

---

### D: Minimal Error Digging + Enhanced Diagnostics

**Mechanism:** Keep current discovery and launch; add execution attempt at discovery time to validate pairing; return detailed failure reason; let onboarding map to guidance.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **D1** | CLI discovery: same as current (accept first executable) | |
| **D2** | Validation attempt: at discovery, run CLI with `whoami --json` in app's process PATH | |
| **D3** | Failure inspection: parse exit code and stderr; distinguish `ENOENT node` (runtime missing) from authentication error | |
| **D4** | Diagnostic retention: store failure details (executable path, exit code, sanitized stderr, launch environment) in app state or log | |
| **D5** | State classification: map to `missing` (no exe), `runtime-unavailable` (node not found), `signedOut` (explicit 401), `other-error` | |
| **D6** | Onboarding mapping: each state → actionable guidance ("Install Vercel CLI", "Install Node", "Run `vercel login`", "Check logs") | |
| **D7** | Command execution: use cached executable path; preserve all arguments, timeouts, output | |

**Unknowns flagged:** (None — this shape requires no unknown mechanisms)

---

## R × Shape Fit Check

| Req | Requirement | Status | A | B | C | D |
|-----|-------------|--------|---|---|---|---|
| **R0** | Execute CLI from normal Finder/LaunchServices in common layouts | Core goal | ✅ | ✅ | ✅ | ❌ |
| **R1** | Authenticated CLI recognized without relogin | Must-have | ✅ | ✅ | ✅ | ❌ |
| **R2** | Distinguish absence, broken, signed-out, API failure | Must-have | ✅ | ✅ | ⚠️ | ✅ |
| **R3** | Runtime discovery deterministic, bounded, no shell startup | Must-have | ✅ | ✅ | ⚠️ | ✅ |
| **R4** | Validated by actual execution | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R5** | Broken higher-priority doesn't hide later candidates | Must-have | ❌ | ✅ | ❌ | ❌ |
| **R6** | PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, NVM unchanged | Must-not-change | ✅ | ✅ | ✅ | ✅ |
| **R7** | Every command uses same resolved environment | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R8** | No shell profiles, plugins, hooks, network install | Must-have | ✅ | ✅ | ⚠️ | ✅ |
| **R9** | Paths with spaces and symlinks work | Must-have | ✅ | ✅ | ✅ | ✅ |
| **R10** | Diagnostics retain exe, category, exit code, stderr | Must-have | ✅ | ✅ | ⚠️ | ✅ |
| **R11** | No mutation of filesystem, PATH, shell, auth, runtimes | Must-not-change | ✅ | ✅ | ✅ | ✅ |
| **R12** | Unit tests without dev machine dependency | Must-have | ✅ | ✅ | ❌ | ✅ |
| **R13** | Integration test of process boundary vs `#!/usr/bin/env node` | Must-have | ✅ | ✅ | ✅ | ⚠️ |
| **R14** | Arguments, timeout, output, working directory unchanged | Must-not-change | ✅ | ✅ | ✅ | ✅ |
| **R15** | Scoped to CLI discovery/execution, not general shell emulation | Must-have | ✅ | ✅ | ⚠️ | ✅ |

**Notes:**

- **A fails R5:** Only tries first discovered candidate; if Bun Node is broken and Homebrew has Node, it won't fall back.
- **B satisfies R5 uniquely:** Skips broken pair and tries next candidate.
- **C flagged R2, R8, R15:** Retry logic couples runtime discovery to command execution; harder to classify state distinctly; adds risk of shell-dependent retry if stderr parsing is naive.
- **C flagged R12:** State transitions (cache, retry, classify) depend on runtime behavior; hard to unit test without real Node versions.
- **D fails R0, R1, R5:** Doesn't solve the core problem—still doesn't execute if Node isn't in process PATH; can't guide authenticated user to relogin because error is misclassified.
- **D flagged R13:** Will still fail the integration test; runtime isn't available to the app.

---

## Recommended Survivor, Rejects, Spikes

**Survivor: Shape B** (Paired Candidate Discovery + Validation)

**Rationale:**
B is the only shape that passes all must-haves *and* the must-not-change constraints. It solves R5 (the key gap in the current implementation) by enumerating both CLI candidates and their compatible runtimes, validating pairs, and skipping broken ones. It remains backward-compatible (R6) by respecting the current candidate order and only adding runtime discovery logic alongside it. R7 is satisfied by caching the validated pair. Unit tests (R12) can mock candidate/runtime lists and validate ordering without touching the developer's machine.

**Rejected Alternatives:**

- **A (Explicit Shebang Parsing):** Passes fit check but introduces two flagged unknowns (U2, U3) that require investigation. Shebang parsing is domain-specific and adds complexity for unclear gain—B's paired approach works without parsing. A also fails R5; once a shebang is parsed for the first candidate, there's no mechanism to try a second.
- **C (Lazy Validation):** Defers the core problem to runtime and makes state classification ambiguous. R12 becomes very hard (state cache invalidation is stateful). R8 is at risk if retry logic doesn't carefully avoid shell subprocesses.
- **D (Minimal Error Digging):** Does not solve the core problem. A user with NVM Node can't run the app because the process PATH doesn't include `~/.nvm`. Enhanced diagnostics help, but they don't get the user to a working state.

**Required Spikes:**

| Spike | Goal | Questions |
|-------|------|-----------|
| **S1: Runtime Layout Enumeration** | Understand which runtime layouts exist in supported user environments and what candidates to generate | Which package managers (pnpm, fnm, Bun, system, Homebrew, `/usr/local/bin`) have Node installed in the wild? For each, where is the binary and what heuristics can reliably find it? Is NVM always at `~/.nvm/versions/node/*/bin/node`? |
| **S2: Pair Validation Ordering** | Clarify which runtime to prefer when multiple candidates exist | If Bun is installed globally (PATH) and NVM is installed locally (`~/.nvm`), which pair should be tried first? Should we prefer `~/.bun/bin/vercel` + `~/.bun/bin/node`, or `PATH/vercel` + `PATH/node`? |
| **S3: Hermetic Integration Test Design** | Verify that a packaged Swift app can run the integration test without relying on the developer's globally installed Node | Can we create a hermetic test environment (sandbox Node, or bundled Node in test fixture) that the app can discover and execute? |
| **S4: State Representation for Pairing** | Design the minimal product-state change to represent "CLI found but no runtime" distinctly from "CLI not found" | Should `CLIState` add a `.runtimeUnavailable` case, or should pairing metadata be stored separately in a transient cache? How does Onboarding distinguish these without adding new UI states? |

---

## Summary Table: R × Shape Status

|  | **A** | **B** | **C** | **D** |
|:--:|:--:|:--:|:--:|:--:|
| **Pass all must-haves** | 12/16 | **16/16** | 12/16 | 11/16 |
| **Pass all must-not-change** | ✅ | ✅ | ✅ | ✅ |
| **R5 (skip broken)** | ❌ | ✅ | ❌ | ❌ |
| **Flagged unknowns** | 2 | 1 | 2 | 0 |
| **Spikes needed** | U1, U2 | U1, S1, S2, S3, S4 | U1, U2, U3 | none |
| **Complexity** | Medium | Medium-High | Medium | Low |

**Conclusion:** Shape B solves the problem space comprehensively. It requires investigation into runtime layout enumeration (S1) and pair ordering preference (S2), plus integration test design (S3) and state representation (S4), all of which are bounded and well-scoped.
