# Evidence-return — Shape A

## A: Direct CLI execution with deterministic runtime PATH pairing

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Extract the existing ordered CLI candidate list into an injectable resolver. Build one deterministic runtime-inclusive PATH from the candidate directory, inherited PATH entries, current fixed Homebrew/system entries, fnm’s default alias, and at most 24 NVM version directories in semantic-version order. Normalize and deduplicate absolute directories while preserving first occurrence. | |
| A2 | Represent each option as a launch plan containing the CLI URL and complete environment. Launch the CLI file directly through `Process.executableURL` with separate arguments and the composed PATH. Do not create a CLI × Node Cartesian product, resolve shebangs, or invoke Node explicitly. | |
| A3 | Validate CLI candidates in their existing order. Inspect launch status and output and continue after thrown launch errors, interpreter exit `127`, or other failed validations so a broken candidate cannot hide a later usable plan. | |
| A4 | Validate each plan with `--version` while overlaying `NO_UPDATE_NOTIFIER=1` and `VERCEL_TELEMETRY_DISABLED=1`. Only after a plan passes, execute `whoami --json --no-color --non-interactive` to classify authentication. Return structured launch, timeout, exit, stdout, and sanitized-stderr evidence instead of flattening failures into `AppFailure.message`. | |
| A5 | Cache the validated plan only in process. Clear it on Recheck; after a later launch failure, invalidate it and perform one bounded re-resolution. | |
| A6 | Make `VercelCLI.run` consume the same launch plan for onboarding and every service command while preserving each command's existing environment overlays, arguments, noninteractive behavior, timeout, output capture, and `/tmp` working directory. The no-update and telemetry overlays are mandatory for the added resolution probe, not a redefinition of arbitrary service commands. | |
| A7 | Map no candidate file to `.missing`; candidate files with no plan passing `--version` to `.unusable`; structured `{"loggedIn":false}` to `.signedOut` even with nonzero status; authenticated `whoami` to `.ready`; and subsequent `/v2/user` or teams failures to `.failed`. Give each state distinct guidance and retain attempted executable, launch category, status, and sanitized stderr. | |
| A8 | Unit-test candidate ordering, composed-PATH ordering, deduplication, retry, cache invalidation, and classification through injected environment/filesystem/runner fixtures. Add a sanitized-environment Swift integration test with fake `node` and `#!/usr/bin/env node` Vercel executables, separate arguments, symlink and space-containing cases, and no globally installed Node. Add a fresh-HOME assertion that the controlled `--version` probe creates no files. | |

Flags cleared by evidence:

- A1 / U1: P6 establishes bounded sources, ordering precedent, deduplication, and the 24-version NVM cap. A deterministic composed PATH removes the need for an unproven CLI × Node pairing preference.
- A2 / U2: P1 and P3 prove direct execution with repaired `PATH`, symlinks, and spaces.
- A4 and A7 / U3: P2, P4, and the evidence-return classification constraints establish the validation and state boundary.
- A8 / U4: P5 proves the hermetic sanitized-environment test mechanism.
- A4, A6, and A8 / R11: P7 proves the controlled `--version` resolution probe is filesystem-pure under a fresh HOME. P7 also establishes that `whoami` performs CLI-owned config and telemetry-ID writes even with telemetry disabled, so authentication remains explicitly outside the resolution purity claim.

## Binary fit check (R × A)

| Req | Requirement | Status | A |
|---|---|---|:---:|
| R0 | If a supported Vercel CLI and its required runtime are installed in a common user-level macOS layout, Vercel Desktop can execute the CLI from a normal Finder/LaunchServices environment. | Core goal | ✅ |
| R1 | An authenticated CLI is recognized as authenticated without requiring relogin or user-created symlinks. | Must-have | ✅ |
| R2 | CLI absence, unusable CLI installation/runtime, signed-out CLI, and authenticated-session/API failure remain distinguishable in product state and UI guidance. | Must-have | ✅ |
| R3 | Runtime discovery is deterministic, bounded, and independent of interactive or user shell startup files. | Must-have | ✅ |
| R4 | The selected CLI and runtime pairing is validated by actual execution, not file existence alone. | Must-have | ✅ |
| R5 | A broken higher-priority candidate does not hide a later usable candidate. | Must-have | ✅ |
| R6 | Current working PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, and NVM layouts preserve their existing behavior. | Must-not-change | ✅ |
| R7 | Every Vercel CLI command in the app uses the same resolved executable/runtime environment as onboarding. | Must-have | ✅ |
| R8 | Resolution and authentication checks do not invoke shell profiles, prompt plugins, package-manager activation hooks, or network installation. | Must-have | ✅ |
| R9 | Paths containing spaces and symlinked CLI entrypoints are launched without shell-string interpolation. | Must-have | ✅ |
| R10 | On failure, diagnostics retain the attempted executable, launch category, exit status, and sanitized stderr needed for actionable UI and support. | Must-have | ✅ |
| R11 | Resolution does not mutate the user's filesystem, PATH, shell configuration, CLI authentication, or installed runtimes. | Must-not-change | ✅ |
| R12 | Unit tests can cover candidate ordering, runtime pairing, retry, and state classification without depending on the developer's machine. | Must-have | ✅ |
| R13 | At least one packaged-app or sanitized-environment integration test proves the shipped process boundary against a script using `#!/usr/bin/env node`. | Must-have | ✅ |
| R14 | Existing successful CLI commands retain current arguments, noninteractive behavior, timeout behavior, output capture, and working directory. | Must-not-change | ✅ |
| R15 | The fix remains scoped to Vercel CLI discovery/execution and onboarding diagnostics; it does not become a general shell-environment emulation system. | Must-have | ✅ |
| R16 | Any cached launch plan is in-process derived state, is cleared by Recheck, is invalidated after a launch failure, permits one bounded re-resolution, and does not survive app restart. | Derived must-have | ✅ |

No failure notes. Shape A has no remaining flagged unknowns and passes the Solution Gate.
