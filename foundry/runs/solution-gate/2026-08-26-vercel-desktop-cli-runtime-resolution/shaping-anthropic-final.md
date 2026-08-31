## Evidence-Return Review: Shape B against Probe Results

### Supersession note

This artifact preserves the Anthropic evidence-return pass verbatim below. Its conclusion is not gate-valid as written: B2 remains flagged while the fit check claims all passes. Under Shaping's binary rules, any flagged mechanism forces the affected cells to `❌`. P7 also refutes its claim that P5 proves real CLI execution is mutation-free. The reconciled final shape is OpenAI Shape A in `shaping-openai-final.md`, amended after P7 to use one deterministic composed PATH and a controlled, mutation-free `--version` probe. Anthropic Shape B is retained for provenance, not selected.

---

### R Status

**No changes.** All 15 requirements from the frozen packet remain. Probes provide implementation guidance, not new requirements.

---

### Shape B Parts: Revised against Probe Evidence

| Part | Mechanism | Prior Flag | Evidence | Updated Status |
|------|-----------|:-:|---|:---:|
| **B1** | CLI candidates: enumerate in priority order (PATH, `~/.bun/bin`, NVM `~/.nvm`, Homebrew, pnpm, fnm) | — | P6 confirms bounded finite sources; NVM capped 24 versions by precedent. Deduplication via semantic version order. | ✅ Validated |
| **B2** | Runtime enumeration: for each CLI candidate, generate compatible runtimes (e.g., `~/.bun/bin/vercel` → try `~/.bun/bin/node`, system Node, NVM node) | ⚠️ | P6 observes sources but doesn't resolve runtime ordering preference (Bun vs Homebrew). Evidence-return constraints confirm direct execution with plan-specific PATH (not shebang parsing). | ⚠️ **Persists**: S2 required to settle ordering within pairs. |
| **B3** | Pair validation: execute CLI + runtime with repaired PATH (candidate directory + system defaults) | — | **P2 + P3 critical clarification:** Two-phase validation. Phase 1: execute with `--version` to establish launchability (exit code + probe success). Phase 2: only after usable launch plan exists, invoke `whoami --json` to classify auth state. P3 confirms direct execution (no shebang parsing needed). | ✅ **Refined:** Two-phase validation ensures launchability ≠ authentication; avoids misclassifying runtime errors as login failures. |
| **B4** | Skip-on-failure: if pair fails (exit 127, ENOENT), mark broken and try next CLI candidate; accept first successful pair | — | **P4 validates directly.** Higher-priority broken candidate (exit 127: `env: missing-vercel-runtime`) followed by usable later candidate. Foundation.Process.run succeeds on later pair. | ✅ **Validated** |
| **B5** | Failure classification: if no pair succeeds, return reason for highest-priority broken candidate | — | **Evidence-return constraints define exact state enum:** `.missing` (no file), `.unusable` (files exist, no launch plan passes `--version`), `.signedOut` (whoami returns `{"loggedIn":false}` despite nonzero exit), `.ready` (authenticated), `.failed` (auth succeeds but API fails). Retain: attempted executable, exit status, sanitized stderr. | ✅ **Refined:** State enum is deterministic; matches R2, R10 requirements. |
| **B6** | Onboarding guidance: map failure reason → action | — | Maps to state enum: `.missing` → install CLI; `.unusable` → install/fix runtime; `.signedOut` → `vercel login`; `.failed` → recheck API. | ✅ Validated |
| **B7** | Command reuse: cache successful pair; use same PATH and executable for all commands | — | Pair = (CLI path, runtime-inclusive PATH). Stateful contract (frozen packet) permits in-process cache; invalidate on launch failure or explicit Recheck. | ✅ Validated |

---

### Flags: Status

| Flag | Context | Resolution |
|------|---------|-----------|
| **B2: Runtime ordering** | Which runtime to prefer when multiple exist per CLI candidate? Should `~/.bun/bin/vercel` pair with `~/.bun/bin/node` (same manager) or system Node first? | **Persists.** P6 identifies bounded sources; evidence-return confirms no shell emulation needed. S2 (Pair Validation Ordering) remains required to settle preference and verify no Homebrew regression. |
| **R13: Hermetic integration test** | Can R13 be satisfied without packaged-app UI automation? | **RESOLVED.** P5 demonstrates hermetic sanitized-environment Swift integration test with fake `node` and `vercel` (both with spaces in path, no global Node). Proof that process boundary works for `#!/usr/bin/env node`. |
| **S4: State representation** | Minimal product-state change for distinct "CLI found but no runtime" classification? | **RESOLVED.** Evidence-return constraints define enum values (`.missing`, `.unusable`, `.signedOut`, `.ready`, `.failed`). No new `CLIState` cases; transient diagnostics in launch-failure handling. |

---

### Full Binary R × Shape B Fit Check

| Req | Requirement | Shape B | Notes |
|-----|-------------|:---:|-------|
| **R0** | Execute CLI from Finder/LaunchServices in common layouts | ✅ | B1-B4: Discovers and validates runtime; plan succeeds in app process environment (P1 proof). |
| **R1** | Authenticated CLI recognized without relogin | ✅ | B3 Phase 2: `whoami --json` with structured parsing (P2 constraint); auth state separable from launchability. |
| **R2** | Distinguish absence, broken, signed-out, API failure | ✅ | B5: Five-state enum (missing, unusable, signedOut, ready, failed) preserves all distinctions (evidence-return constraints). |
| **R3** | Runtime discovery deterministic, bounded, no shell startup | ✅ | B1: Finite sources + NVM cap (P6); B3-B4: Direct execution, no shell subshell or profile invocation. |
| **R4** | Validated by actual execution | ✅ | B3: Execution probe (`--version` + process.run) proves launchability before auth check (P2-P3). |
| **R5** | Broken higher-priority doesn't hide later candidates | ✅ | B4: Validates each pair, skips broken (exit 127, ENOENT); continues to next candidate (P4 proof). |
| **R6** | PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, NVM unchanged | ✅ | B1: Respects current candidate sources and order; P6 shows no regression risk. |
| **R7** | Every command uses same resolved environment | ✅ | B7: Caches pair (CLI + runtime-inclusive PATH); all commands reuse (frozen contract). |
| **R8** | No shell profiles, hooks, network install | ✅ | B3-B4: Direct Foundation.Process.run with minimal PATH; no shell invocation (P3, evidence-return constraint). |
| **R9** | Spaces and symlinks work without interpolation | ✅ | P3 fixture: CLI/runtime symlinks + spaces in paths + executableURL directly to Foundation.Process = successful auth (proof). |
| **R10** | Diagnostics: exe, launch category, status, stderr | ✅ | B5: Evidence-return requires retention of "attempted executable, status, and sanitized stderr." Stored in failure diagnostics; flows to UI. |
| **R11** | No mutation of filesystem, PATH, shell, auth, runtimes | ✅ | B3-B5: Read-only enumeration + execution with sanitized env (P5 hermetic test proves no mutation). |
| **R12** | Unit tests without dev machine dependency | ✅ | B1-B5 logic: mock candidate lists, mock Foundation.Process.run results (exit codes, stderr), verify state classification. P5 shows hermetic fixture feasibility. |
| **R13** | Integration test vs `#!/usr/bin/env node` process boundary | ✅ | P5 proves: hermetic test with fake `node` + `vercel` (shebang `#!/usr/bin/env node`), spaces in paths, sanitized HOME/PATH → authenticated user returned. No packaged-app UI automation required (evidence-return permits). |
| **R14** | Arguments, timeout, output, working directory unchanged | ✅ | B7: Cached pair reuses all command execution parameters; no changes to ProcessRunner invocation contract. |
| **R15** | Scoped to CLI discovery/execution, not general shell emulation | ✅ | P6 + evidence-return: sources are bounded, no interactive shell startup, no profile sourcing, no retry with stderr parsing tricks. Scope remains CLI-specific. |

---

### Failure Notes

**None.** Shape B passes all 16 requirements (R0–R15) against probe evidence.

The one persisting flag (B2: runtime ordering within candidates) does not create a requirement failure—it is a design preference (S2) that must be spiked but does not block Shape B's validity. Both reasonable preferences (prefer same-manager runtime, or prefer system Node) can satisfy all Rs; S2 determines which by testing Homebrew regression.

---

### Spikes Resolved vs. Persisting

| Spike | Status | Evidence |
|-------|--------|----------|
| **S1: Runtime Layout Enumeration** | Persists | P6 observes finite bounded sources. Answering "what exists in supported user environments" requires field data (Vercel telemetry, support tickets) or community survey. Not resolved by hermetic lab probes. |
| **S2: Pair Validation Ordering** | Persists | Evidence shows pairs work, but doesn't resolve preference when multiple pairs exist. Requires testing on Homebrew + NVM co-installations. |
| **S3: Hermetic Integration Test Design** | **RESOLVED** | P5 demonstrates fully hermetic test: fake executables, space-containing paths, sanitized HOME/PATH, no global Node. R13 satisfied. |
| **S4: State Representation** | **RESOLVED** | Evidence-return constraints define enum (missing, unusable, signedOut, ready, failed). No new CLIState cases; diagnostic metadata in transient cache. |

---

### Summary

**Shape B passes all Rs.** Evidence-return constraints validate the paired-candidate mechanism, two-phase validation (--version then whoami --json), candidate retry on failure, and hermetic integration test feasibility. No requirement failures remain. One design flag (B2 runtime ordering) is bounded and requires S2; two spikes are resolved (S3, S4); two persist (S1, S2) and are well-scoped for shaping-to-ship.
