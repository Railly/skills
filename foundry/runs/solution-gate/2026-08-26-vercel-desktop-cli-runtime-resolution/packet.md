# Frozen packet: Vercel Desktop CLI runtime resolution

Mode: greenfield

Target repository: `vercel-labs/vercel-desktop`

Base commit: `c77537352ec3b1afee0a0c8e53ac8d1052248fa8` (`origin/main`, release `v0.0.19`)

Trigger: the defect crosses process-launch environment, executable discovery, onboarding state classification, and compatibility with multiple Node installation layouts. The mechanism is not mechanically determined.

## Frame

### Violated property

Vercel Desktop treats an executable Vercel CLI file as a usable CLI without proving that the graphical app can launch its interpreter. When the launch fails before the CLI runs, onboarding classifies the failure as an unauthenticated Vercel session and instructs an already-authenticated user to log in.

### Desired outcome

Vercel Desktop can locate and execute a supported Vercel CLI from a normal macOS graphical-app environment when the CLI and its required runtime are installed through common user-level layouts. It reports installation, launchability, authentication, and later API failures as distinct states with actionable guidance.

## Evidence-only facts

| ID | Status | Fact | Source handle |
|---|---|---|---|
| F1 | observed | The installed app is Vercel Desktop `0.0.18`; `0.0.19` is the latest published release. | `plutil -p /Applications/Vercel.app/Contents/Info.plist`; `gh release list`; `gh release view v0.0.19` |
| F2 | observed | The terminal resolves Vercel CLI to `~/.bun/bin/vercel`, version `59.1.4`, and `vercel whoami` reports authenticated user `railly`. | `command -v vercel`; `vercel --version`; `vercel whoami` |
| F3 | observed | `~/.bun/bin/vercel` is a symlink to a JavaScript entrypoint whose shebang is `#!/usr/bin/env node`. | `ls -l ~/.bun/bin/vercel`; `file ~/.bun/bin/vercel`; `head -3 ~/.bun/bin/vercel` |
| F4 | observed | The active Node binary is `~/.nvm/versions/node/v24.18.0/bin/node`; no Node binary exists in the app's default PATH. | `command -v node`; `node --version`; `launchctl getenv PATH`; `ps eww -p <VercelDesktop PID>` |
| F5 | observed | Under the graphical app PATH plus the discovered CLI directory, executing the CLI exits `127` with `env: node: No such file or directory`. Adding the active NVM Node directory makes the same command return authenticated JSON with exit `0`. | Probe P1 in this run: `/usr/bin/env -i HOME=... PATH=... ~/.bun/bin/vercel whoami --json --no-color --non-interactive` |
| F6 | inferred | `VercelCLI.executable()` accepts the first executable file candidate. It includes `~/.bun/bin/vercel` and NVM Vercel executables, but does not resolve or validate the selected file's interpreter. | `origin/main:apps/swift/Sources/VercelDesktop/VercelCLI.swift:4-24` |
| F7 | inferred | `VercelCLI.run` prepends only the selected executable's directory and fixed system package-manager directories to PATH, then launches the CLI file directly. | `origin/main:apps/swift/Sources/VercelDesktop/VercelCLI.swift:26-40`; `ProcessRunner.swift:9-69` |
| F8 | inferred | Any thrown `whoami` error or empty output becomes `.signedOut`; the cause is discarded. | `origin/main:apps/swift/Sources/VercelDesktop/VercelCLI.swift:54-68`; `VercelCLITests.swift:15-21` |
| F9 | inferred | Onboarding maps `.signedOut` to `vercel login`, `.missing` to CLI installation, and `.failed` to a generic recheck. | `origin/main:apps/swift/Sources/VercelDesktop/OnboardingView.swift:28-57` |
| F10 | observed | `VercelCLI.swift` and `ProcessRunner.swift` are byte-identical between releases `0.0.18` and `0.0.19`; the `0.0.19` changelog contains no CLI runtime/discovery fix. | `git diff --quiet v0.0.18 v0.0.19 -- ...`; `git show v0.0.19:apps/swift/CHANGELOG.md` |
| F11 | inferred | The earlier Zig implementation had a dedicated discovery component that paired the executable with a runtime PATH and retried candidates when execution failed; it is not part of the current Swift production app. | Commit `c036a81`, `src/cli_discovery.zig` and `src/app.zig` diff |
| F12 | observed | The production Swift package has no third-party runtime-discovery dependency and targets macOS 14. | `origin/main:apps/swift/Package.swift:1-19` |
| F13 | specified | Vercel Desktop must not execute arbitrary shell startup files as part of routine CLI checks. | Product safety constraint for a signed graphical app; prior history `0e4a3c8` and replacement `c036a81` show this boundary was previously contested. |
| F14 | specified | Current working configurations using PATH, Homebrew, `/usr/local`, pnpm, fnm, Bun, or NVM must not regress. | Compatibility constraint derived from current candidate list in `VercelCLI.swift:7-22`. |

## Settled requirements

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

## Unknowns

| ID | Question | Status |
|---|---|---|
| U1 | Which runtime layouts beyond the observed NVM case are present in supported user environments and need explicit candidate generation? | Investigate |
| U2 | Should a Node-script CLI be launched directly with a repaired PATH or explicitly as `[node, cli-script]` after shebang inspection? | Investigate |
| U3 | What is the smallest product-state change that preserves detailed cause without expanding `CLIState` into transient implementation details? | Investigate |
| U4 | Can the packaged Swift app integration test run hermetically in current CI without relying on a globally installed Node? | Investigate |

## Must-not-change workflows

| Workflow | Required continuity |
|---|---|
| CLI already on the GUI process PATH | Same executable remains eligible and commands behave as before. |
| Homebrew or `/usr/local` global CLI | It remains discoverable and executable. |
| pnpm/fnm/Bun/NVM CLI candidates | A usable installation remains eligible; a broken candidate may be skipped but must not block later candidates. |
| Signed-out usable CLI | Onboarding still asks the user to run `vercel login`. |
| Missing CLI | Onboarding still offers installation guidance. |
| Authenticated CLI whose later `/v2/user` or teams API call fails | It is not misreported as missing or signed out. |
| All non-onboarding CLI commands | They reuse the same resolved launch plan and retain arguments, timeouts, output, and noninteractive flags. |

## Stateful contract

No new persistent product state is required by the frozen contract. Any in-process resolution cache is derived state owned by the running app and must be invalidated after a launch failure or explicit Recheck. It must not outlive app restart or replace execution validation.

| Prior state | Action | Required result |
|---|---|---|
| No cached launch plan | Boot/Recheck | Enumerate and validate candidates; retain one usable plan or a classified failure. |
| Usable cached launch plan | Later CLI command | Reuse the same launch plan. |
| Cached launch plan becomes unusable | Later CLI command fails before/at launch | Invalidate, perform one bounded re-resolution, then return classified failure if none works. |
| Failed resolution | User installs/fixes CLI and presses Recheck | Run resolution again without requiring app restart. |
| App restarts | Boot | Resolve again from current filesystem/environment. |

## Reviewer output contract

Use the Shaping methodology. Produce:

1. The complete R table, preserving settled requirements and labelling additions as derived or undecided.
2. Materially distinct shapes with concrete mechanism parts and flagged unknowns.
3. A binary R × Shape fit check with failure notes.
4. A recommended survivor, rejected alternatives, and required spikes.
5. No breadboard, slicing, candidate inspection, implementation, or edits to the target repository.
