# Solution Gate — Isolated Shaping Reviewer 1

## Review basis

- Base verified as `c77537352ec3b1afee0a0c8e53ac8d1052248fa8`; working tree was clean. Command: `git rev-parse HEAD && git status --short`.
- Current discovery enumerates GUI `PATH`, pnpm, Bun, fnm, Homebrew, `/usr/local`, and NVM candidates, then accepts the first executable file: `apps/swift/Sources/VercelDesktop/VercelCLI.swift:4-24`.
- Every CLI command goes through `VercelCLI.run`, which launches the selected file directly and prepends only its directory plus fixed directories to `PATH`: `apps/swift/Sources/VercelDesktop/VercelCLI.swift:26-40`. Command: `rg -n "VercelCLI\\.run|run\\(" apps/swift/Sources apps/swift/Tests`.
- `ProcessRunner` already uses `Process.executableURL` and an argument array, retaining stdout, stderr, and status without shell-string interpolation: `apps/swift/Sources/VercelDesktop/ProcessRunner.swift:3-21`, `apps/swift/Sources/VercelDesktop/ProcessRunner.swift:54-69`.
- The present state model has only `ready`, `signedOut`, `missing`, and `failed`: `apps/swift/Sources/VercelDesktop/Models.swift:3-8`.
- `whoami` errors are collapsed to `signedOut`; later API failures become `failed`: `apps/swift/Sources/VercelDesktop/VercelCLI.swift:54-68`, `apps/swift/Sources/VercelDesktop/VercelCLI.swift:84-108`.
- Onboarding gives separate missing, login, and generic failure guidance, with Recheck calling `boot()`: `apps/swift/Sources/VercelDesktop/OnboardingView.swift:28-59`.
- Boot and polling are centralized in `AppModel`: `apps/swift/Sources/VercelDesktop/AppModel.swift:126-197`.
- All non-onboarding Vercel operations use the same `VercelCLI.run` seam: `apps/swift/Sources/VercelDesktop/VercelService.swift:48-81`, `apps/swift/Sources/VercelDesktop/VercelService.swift:145-206`, `apps/swift/Sources/VercelDesktop/VercelService.swift:267-289`.
- The package targets macOS 14 and has no third-party Swift dependency: `apps/swift/Package.swift:4-19`.
- Existing tests are ordinary Swift package tests; packaging builds and signs the app bundle: `apps/swift/scripts/test.sh:1-7`, `apps/swift/scripts/package-macos.sh:23-45`. Command: `rg -n "swift test|package|ProcessRunner" apps/swift .github/workflows`.
- No repository files were modified. Command: `git diff --stat && git status --porcelain=v1 --untracked-files=all`.

## Requirements (R)

| Req | Requirement | Status |
|---|---|---|
| R0 | If a supported Vercel CLI and its required runtime are installed in a common user-level macOS layout, Vercel Desktop can execute the CLI from a normal Finder/LaunchServices environment. | Core goal |
| R1 | An authenticated CLI is recognized as authenticated without requiring relogin or user-created symlinks. | Must-have |
| R2 | CLI absence, unusable CLI installation/runtime, signed-out CLI, and authenticated-session/API failure remain distinguishable in product state and UI guidance. | Must-have |
| R3 | Runtime discovery is deterministic, bounded, and independent of interactive or user shell startup files. | Must-have |
| R4 | The selected CLI and runtime pairing is validated by actual execution, not file existence alone. | Must-have |
| R5 | A broken higher-priority candidate does not hide a later usable candidate. | Must-have |
| R6 | Current working PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM layouts preserve their existing behavior. | Must-not-change |
| R7 | Every Vercel CLI command in the app uses the same resolved executable/runtime environment as onboarding. | Must-have |
| R8 | Resolution and authentication checks do not invoke shell profiles, prompt plugins, package-manager activation hooks, or network installation. | Must-have |
| R9 | Paths containing spaces and symlinked CLI entrypoints are launched without shell-string interpolation. | Must-have |
| R10 | On failure, diagnostics retain the attempted executable, launch category, exit status, and sanitized stderr needed for actionable UI and support. | Must-have |
| R11 | Resolution does not mutate the user's filesystem, PATH, shell configuration, CLI authentication, or installed runtimes. | Must-not-change |
| R12 | Unit tests can cover candidate ordering, runtime pairing, retry, and state classification without depending on the developer's machine. | Must-have |
| R13 | At least one packaged-app or sanitized-environment integration test proves the shipped process boundary against a script using `#!/usr/bin/env node`. | Must-have |
| R14 | Existing successful CLI commands retain current arguments, noninteractive behavior, timeout behavior, output capture, and working directory. | Must-not-change |
| R15 | The fix remains scoped to Vercel CLI discovery/execution and onboarding diagnostics; it does not become a general shell-environment emulation system. | Must-have |
| R16 | Any cached launch plan is in-process derived state, is cleared by Recheck, is invalidated after a launch failure, permits one bounded re-resolution, and does not survive app restart. | Derived must-have — frozen stateful contract |

No undecided requirements were added.

## A: Direct CLI execution with deterministic runtime PATH pairing

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Extract the existing ordered CLI candidate list into an injectable resolver. Generate runtime-directory candidates from the GUI environment and explicit manager layouts, including CLI-co-located runtimes and NVM version directories. | ⚠️ U1 |
| A2 | Represent each option as a launch plan containing the CLI URL and complete environment. Launch the CLI file directly while placing the paired runtime directory before the inherited and fixed system paths. | ⚠️ U2 |
| A3 | Try current direct-launch plans first to preserve successful behavior, then repaired runtime variants. Continue after spawn/interpreter failures so a broken candidate cannot hide a later plan. | |
| A4 | Validate plans by executing `whoami --json --no-color --non-interactive`. Return structured spawn, timeout, exit, stderr, and authentication outcomes instead of flattening them to `AppFailure.message`. | ⚠️ U3 |
| A5 | Cache the validated plan only in process. Clear it on Recheck; after a later launch failure, invalidate it and perform one bounded re-resolution. | |
| A6 | Make `VercelCLI.run` consume the same launch plan for onboarding and every service command while preserving arguments, timeout, output, and `/tmp` working directory. | |
| A7 | Map no candidate, unusable launch, signed-out response, and post-authentication API failure to distinct state/guidance while retaining sanitized diagnostics. | ⚠️ U3 |
| A8 | Unit-test resolver inputs through injected environment/filesystem/runner fixtures, plus a sanitized or packaged-app shebang test. | ⚠️ U4 |

The observed packet probe F5 directly supports A2 for the reported Bun CLI plus NVM Node case.

## B: Explicit Node interpreter launch plan

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Extract and inject the existing ordered CLI candidates and generate deterministic Node executable candidates from explicit manager layouts. | ⚠️ U1 |
| B2 | Resolve symlinked CLI entrypoints and inspect the first line. For `#!/usr/bin/env node`, construct a plan with Node as the executable and the CLI file as the first argument; retain direct execution for non-Node entrypoints. | ⚠️ U2 |
| B3 | Preserve successful direct plans first, then try explicit Node/CLI pairings, continuing after unusable pairings. | |
| B4 | Validate with `whoami` and return structured launch, exit, authentication, and diagnostic outcomes. | ⚠️ U3 |
| B5 | Cache, invalidate, and re-resolve the selected plan under the R16 contract. | |
| B6 | Route every `VercelCLI.run` call through the selected plan; pass Node, CLI path, and command arguments as separate `Process` arguments. | |
| B7 | Extend product state and onboarding guidance using the structured result. | ⚠️ U3 |
| B8 | Add injected unit fixtures and a packaged or sanitized symlink/shebang test. | ⚠️ U4 |

## C: Import a login-shell environment

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | Preserve current GUI and explicit candidates, then invoke the user’s configured login shell with a fixed command and timeout to emit its environment. | |
| C2 | Parse the emitted environment and add its `PATH` directories as candidate/runtime sources. Launch candidate CLIs directly through `Process`, not an interpolated shell command. | |
| C3 | Validate candidates with `whoami`, retry after unusable candidates, and cache the selected plan under R16. | |
| C4 | Classify launch, authentication, and later API outcomes while retaining diagnostics. | ⚠️ U3 |
| C5 | Route all Vercel CLI commands through the resolved plan. | |
| C6 | Present distinct onboarding guidance for missing, unusable, signed-out, and API failures. | ⚠️ U3 |
| C7 | Unit-test environment parsing, ordering, retry, and cache invalidation with fixtures. | |
| C8 | Add the packaged or sanitized shebang integration test. | ⚠️ U4 |

## D: Bundled Node fallback

| Part | Mechanism | Flag |
|---|---|:---:|
| D1 | Preserve the current candidate list and validate existing direct-launch behavior first. | |
| D2 | Package and sign a pinned Node runtime inside the app. When a Node-script CLI cannot launch directly, construct a fallback plan using bundled Node with the CLI path as a separate argument and bundled Node on `PATH`. | ⚠️ Derived: compatibility, signing, update, and licensing mechanics |
| D3 | Validate direct and bundled-runtime plans by execution, retrying later candidates after unusable plans. | |
| D4 | Return structured launch, authentication, and API failure outcomes with diagnostics. | ⚠️ U3 |
| D5 | Cache and invalidate the selected plan under R16. | |
| D6 | Route every Vercel command through the same plan and expose distinct onboarding guidance. | |
| D7 | Unit-test candidate ordering, direct-first fallback, retry, and state mapping through injected fixtures. | |
| D8 | Exercise the signed packaged app against a symlinked `#!/usr/bin/env node` fixture. | ⚠️ U4 |

## Binary fit check

| Req | Requirement | Status | A | B | C | D |
|---|---|---|:---:|:---:|:---:|:---:|
| R0 | If a supported Vercel CLI and its required runtime are installed in a common user-level macOS layout, Vercel Desktop can execute the CLI from a normal Finder/LaunchServices environment. | Core goal | ❌ | ❌ | ✅ | ❌ |
| R1 | An authenticated CLI is recognized as authenticated without requiring relogin or user-created symlinks. | Must-have | ❌ | ❌ | ✅ | ❌ |
| R2 | CLI absence, unusable CLI installation/runtime, signed-out CLI, and authenticated-session/API failure remain distinguishable in product state and UI guidance. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R3 | Runtime discovery is deterministic, bounded, and independent of interactive or user shell startup files. | Must-have | ✅ | ✅ | ❌ | ✅ |
| R4 | The selected CLI and runtime pairing is validated by actual execution, not file existence alone. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R5 | A broken higher-priority candidate does not hide a later usable candidate. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R6 | Current working PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM layouts preserve their existing behavior. | Must-not-change | ✅ | ✅ | ✅ | ✅ |
| R7 | Every Vercel CLI command in the app uses the same resolved executable/runtime environment as onboarding. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R8 | Resolution and authentication checks do not invoke shell profiles, prompt plugins, package-manager activation hooks, or network installation. | Must-have | ✅ | ✅ | ❌ | ✅ |
| R9 | Paths containing spaces and symlinked CLI entrypoints are launched without shell-string interpolation. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R10 | On failure, diagnostics retain the attempted executable, launch category, exit status, and sanitized stderr needed for actionable UI and support. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R11 | Resolution does not mutate the user's filesystem, PATH, shell configuration, CLI authentication, or installed runtimes. | Must-not-change | ✅ | ✅ | ❌ | ✅ |
| R12 | Unit tests can cover candidate ordering, runtime pairing, retry, and state classification without depending on the developer's machine. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R13 | At least one packaged-app or sanitized-environment integration test proves the shipped process boundary against a script using `#!/usr/bin/env node`. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R14 | Existing successful CLI commands retain current arguments, noninteractive behavior, timeout behavior, output capture, and working directory. | Must-not-change | ✅ | ✅ | ✅ | ✅ |
| R15 | The fix remains scoped to Vercel CLI discovery/execution and onboarding diagnostics; it does not become a general shell-environment emulation system. | Must-have | ✅ | ✅ | ❌ | ✅ |
| R16 | Any cached launch plan is in-process derived state, is cleared by Recheck, is invalidated after a launch failure, permits one bounded re-resolution, and does not survive app restart. | Derived must-have | ✅ | ✅ | ✅ | ✅ |

### Failure notes

- A fails R0 and R1 because A1/A2 remain flagged: supported runtime-layout coverage and direct shebang execution have not been established beyond packet probe F5.
- A fails R2 and R10 because A4/A7 lack a proven error taxonomy and product-state boundary.
- A fails R13 because the packaged/sanitized test mechanism is unknown.
- B fails R0 and R1 because runtime coverage and safe, compatible explicit interpreter invocation remain flagged.
- B fails R2 and R10 because its classifier/state boundary remains unknown.
- B fails R13 because its integration-test mechanism remains unknown.
- C fails R3 and R8 because executing login-shell startup files is the mechanism.
- C fails R11 because arbitrary startup files can have side effects outside the app’s control.
- C fails R15 because it becomes shell-environment emulation.
- C fails R2, R10, and R13 on the same unresolved classification and integration-test mechanics.
- D fails R0 and R1 because compatibility and distribution of the bundled runtime are unproved.
- D fails R2 and R10 because classification remains unresolved.
- D fails R13 because the packaged test mechanism remains unresolved.

No shape currently passes the Solution Gate: all retain flagged unknowns that force binary failures.

## Recommended survivor

**A: Direct CLI execution with deterministic runtime PATH pairing** is the conditional survivor.

It is the narrowest mechanism aligned with the observed failure: packet probe F5 already shows that direct execution succeeds when the required NVM runtime directory is added to `PATH`. It also preserves the repository’s established process boundary—direct URL plus argument array—and can be introduced behind the single `VercelCLI.run` seam (`VercelCLI.swift:26-40`) used by all service commands.

**Gate disposition: hold for the four required spikes below.** A is not yet a passing selected shape. If the direct-versus-explicit spike disproves A2, B becomes the next candidate rather than silently combining A and B.

## Rejected alternatives

- **B — Explicit Node interpreter:** Reject for now. It adds symlink resolution, shebang parsing, interpreter selection, and changed invocation semantics despite F5 showing repaired `PATH` is sufficient for the observed case.
- **C — Login-shell environment import:** Hard reject. It directly violates R3, R8, R11, R15, and the frozen F13 safety constraint.
- **D — Bundled Node fallback:** Reject. It makes the desktop release responsible for Node compatibility, signing, licensing, security updates, and artifact size when the observed installation already has a usable runtime.

## Required spikes

### SP1: Deterministic runtime-layout coverage

**Context:** A and B cannot satisfy R0 until supported runtime sources and pairing precedence are concrete.

**Questions**

| # | Question |
|---|---|
| SP1-Q1 | Which concrete Node paths and metadata are produced by supported PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM installations in Finder-launched environments? |
| SP1-Q2 | Which runtime directory should be paired first with each current CLI candidate, especially NVM-co-located CLIs and Bun/pnpm CLI symlinks? |
| SP1-Q3 | What finite ordering preserves current successful candidates while permitting later recovery plans? |
| SP1-Q4 | Which filesystem and environment inputs must be injectable for hermetic unit tests? |

**Acceptance:** Complete when the candidate/runtime matrix, bounded ordering, duplicate handling, and injectable resolver inputs can be described without consulting shell startup files.

### SP2: Direct repaired PATH versus explicit Node

**Context:** U2 determines whether A or B survives.

**Questions**

| # | Question |
|---|---|
| SP2-Q1 | How does Foundation `Process` execute an executable symlink whose resolved entrypoint uses `#!/usr/bin/env node` when the paired Node directory is prepended to `PATH`? |
| SP2-Q2 | Does direct execution behave correctly when the CLI path, runtime path, or symlink target contains spaces? |
| SP2-Q3 | Which supported CLI entrypoint forms are not Node scripts and therefore require preserved direct execution? |
| SP2-Q4 | Does explicit `[node, cli-script, …arguments]` change CLI behavior, process identity, signal handling, update behavior, or child-process resolution? |

**Acceptance:** Complete when both invocation mechanisms have been exercised with symlinked and space-containing fixtures and their exact compatibility differences can be described.

### SP3: Launch and authentication failure taxonomy

**Context:** Current code discards the reason for `whoami` failure and cannot satisfy R2 or R10.

**Questions**

| # | Question |
|---|---|
| SP3-Q1 | Which errors can Foundation throw before process launch, and what launch category should each produce? |
| SP3-Q2 | What status, stdout, and stderr does the supported CLI return for signed-out, malformed authentication, timeout, and network/API failures? |
| SP3-Q3 | Which evidence proves that the CLI launched successfully even when `whoami` reports signed-out? |
| SP3-Q4 | What smallest result/state structure preserves executable, category, status, and sanitized stderr without exposing transient resolver internals as persistent `CLIState`? |
| SP3-Q5 | Which later `/v2/user` and teams failures must remain `.failed` after authentication has succeeded? |

**Acceptance:** Complete when each observed process outcome maps unambiguously to missing, unusable installation/runtime, signed-out, ready, or later API failure, with the retained diagnostic fields identified.

### SP4: Packaged-app integration boundary

**Context:** The package currently runs Swift unit tests and separately packages/signs the app; no existing test proves CLI shebang execution from a sanitized GUI-like environment.

**Questions**

| # | Question |
|---|---|
| SP4-Q1 | Can CI create temporary fake Node and Vercel executables, including symlinks and paths with spaces, without relying on globally installed Node? |
| SP4-Q2 | Can the packaged app be launched with a sanitized environment and a deterministic completion/result marker using the existing launch seam in `AppDelegate.swift:13-21`? |
| SP4-Q3 | What app-visible probe is needed to report the resolved plan and classified result without mutating persistent product state? |
| SP4-Q4 | Where should this test run relative to `pnpm test`, packaging, signing, and release verification? |

**Acceptance:** Complete when the hermetic fixture, packaged launch command, observable result, cleanup boundary, and CI placement can be described end-to-end.
