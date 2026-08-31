# Probe log

Base target: `vercel-labs/vercel-desktop` `c77537352ec3b1afee0a0c8e53ac8d1052248fa8`

## P1: Real graphical-app PATH reproduction

Affected: R0, R1, R4; OpenAI A1/A2; Anthropic B2/B3.

Command shape:

```sh
/usr/bin/env -i HOME="$HOME" PATH="$HOME/.bun/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin" \
  "$HOME/.bun/bin/vercel" whoami --json --no-color --non-interactive
```

Exit: `127`

Output:

```text
env: node: No such file or directory
```

Control adds `~/.nvm/versions/node/v24.18.0/bin` before system paths.

Exit: `0`

Output includes:

```json
{"username":"railly"}
```

Conclusion: direct CLI execution succeeds when the concrete runtime directory is part of the launch-plan PATH.

## P2: Real signed-out CLI semantics

Affected: R2, R4, R10; OpenAI A4/A7; Anthropic B5/B6.

Command shape:

```sh
/usr/bin/env -i HOME="<fresh temp home>" \
  PATH="$HOME/.bun/bin:$HOME/.nvm/versions/node/v24.18.0/bin:/usr/bin:/bin" \
  "$HOME/.bun/bin/vercel" whoami --json --no-color --non-interactive
```

Exit: `1`

Stdout:

```json
{"loggedIn":false}
```

Stderr contains the first-run telemetry notice. The CLI also creates telemetry/config files under the temporary HOME.

Conclusion: a nonzero `whoami` exit is not enough to identify an unusable runtime. Launchability must be established independently, and signed-out must be parsed from structured `whoami` output. A real CLI with a swapped HOME is not a mutation-free integration fixture.

## P3: Foundation.Process with symlinks and spaces

Affected: R0, R1, R9, R14; OpenAI A2 versus B2; Anthropic A versus B.

Fixture:

- CLI symlink: `/tmp/vercel desktop probe/cli bin/vercel` → real `vc.js` with `#!/usr/bin/env node`
- Runtime symlink: `/tmp/vercel desktop probe/runtime bin/node` → real NVM Node
- `Process.executableURL` is the CLI symlink
- PATH begins with the runtime and CLI directories
- Arguments are separate array values

Command:

```sh
swift '/tmp/vercel desktop probe/process-probe.swift'
```

Exit: `0`

Output includes authenticated user `railly`.

Conclusion: direct execution with a repaired PATH works across the exact Foundation process boundary, symlinked entrypoint, and space-containing paths. Explicit shebang parsing and `[node, cli-script]` invocation are unnecessary for the observed and required process shape.

## P4: Broken candidate versus usable later candidate

Affected: R4, R5, R10; OpenAI A3; Anthropic B4/B5.

Fixtures:

- Higher candidate shebang: `#!/usr/bin/env missing-vercel-runtime`
- Later candidate shebang: `#!/bin/sh`, returns `Vercel CLI fake 1.0.0`

Foundation result:

```text
broken launched=true status=127 stderr=env: missing-vercel-runtime: No such file or directory
good launched=true status=0 stdout=Vercel CLI fake 1.0.0
```

Conclusion: validation must inspect status/output after launch and continue to later candidate launch plans. `Process.run` throwing is not the only unusable-runtime shape.

## P5: Hermetic sanitized-environment integration fixture

Affected: R9, R11, R12, R13; OpenAI A8; Anthropic S3.

Fixture:

- Fake `node` shell executable that executes its first argument with `/bin/sh`
- Fake `vercel` with `#!/usr/bin/env node`
- Both paths contain spaces
- Sanitized HOME and PATH
- No globally installed Node is used

Command:

```sh
/usr/bin/swift '/tmp/vercel desktop hermetic/hermetic-probe.swift'
```

Exit: `0`

Output:

```text
args=["--version"] status=0 stdout=Vercel CLI fake 1.0.0
args=["whoami", "--json", "--no-color", "--non-interactive"] status=0 stdout={"username":"fixture-user"}
```

Conclusion: R13 can be satisfied by a sanitized-environment Swift integration test using hermetic fake executables. Packaged-app UI automation is not required by the frozen contract.

## P6: Bounded runtime sources

Affected: R3, R6, R12, R15; OpenAI SP1; Anthropic S1/S2.

Observed current production candidate sources are finite except NVM versions: inherited PATH, `PNPM_HOME`, `BUN_INSTALL/bin`, fnm default alias, `/opt/homebrew/bin`, `/usr/local/bin`, `~/Library/pnpm`, `~/.local/share/pnpm`, `~/.bun/bin`, and `NVM_DIR/versions/node/*/bin`.

Source: `origin/main:apps/swift/Sources/VercelDesktop/VercelCLI.swift:4-24`.

The retired Zig discovery implementation provides an observed bounded precedent: maximum 24 NVM versions, semantic-version order, deduplicated absolute PATH entries, and candidate retry.

Source: commit `c036a81`, `src/cli_discovery.zig:3-5,80-111,113-172,175-230`.

Conclusion: the survivor can preserve current sources while making resolution bounded by capping NVM enumeration, deduplicating paths, and validating launch plans in deterministic order. No shell-profile emulation is needed.

## P7: Mutation boundary for launchability and authentication

Affected: R4, R8, R11, R14; OpenAI A4/A6; Anthropic B3/B7.

Launchability command shape against a fresh HOME:

```sh
/usr/bin/env -i HOME="<fresh temp home>" \
  PATH="$HOME/.bun/bin:$HOME/.nvm/versions/node/v24.18.0/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  NO_UPDATE_NOTIFIER=1 VERCEL_TELEMETRY_DISABLED=1 \
  "$HOME/.bun/bin/vercel" --version
```

Exit: `0`

Output:

```text
59.1.4
```

Files below the fresh HOME: none.

The same environment with `whoami --json --no-color --non-interactive` returned exit `1` and:

```json
{"loggedIn":false}
```

It also created:

```text
Library/Application Support/com.vercel.cli/config.json
Library/Application Support/com.vercel.cli/telemetry-device.json
Library/Application Support/com.vercel.cli/telemetry-session.json
```

Adding `CI=1` did not prevent those writes. Installed CLI source confirms why: `VERCEL_TELEMETRY_DISABLED` prevents event sending and the first-run notice, but `TelemetryEventStore` creates device and session files before checking whether telemetry is enabled. `NO_UPDATE_NOTIFIER` disables the independent update check.

Control against the real authenticated HOME, with both variables, returned exit `0` and authenticated JSON for `railly` in team `vercel-labs`.

Conclusion:

- The resolver's `--version` validation can satisfy R11 when its environment overlays `NO_UPDATE_NOTIFIER=1` and `VERCEL_TELEMETRY_DISABLED=1`.
- `whoami` is a later authentication check, not part of runtime resolution. It may perform CLI-owned config and telemetry-ID writes already inherent in the current onboarding command.
- The selected shape must not claim that `VERCEL_TELEMETRY_DISABLED=1` makes arbitrary Vercel CLI commands filesystem-pure.
- Regular service commands retain their current environment semantics under R14. The no-update and telemetry controls are mandatory for the added `--version` resolution probe, not a justification to redefine every command's behavior.

## Evidence-return constraints

- Probe with `--version` to establish that a launch plan can execute the CLI.
- Run that resolution probe with `NO_UPDATE_NOTIFIER=1` and `VERCEL_TELEMETRY_DISABLED=1`; P7 proves it creates no files under a fresh HOME for CLI 59.1.4.
- Only after a usable plan exists, use `whoami --json` to classify `.ready`, `.signedOut`, or `.failed` from structured output.
- If candidate files exist but no launch plan passes `--version`, classify `.unusable` and retain attempted executable, status, and sanitized stderr.
- If no candidate file exists, classify `.missing`.
- If `whoami` returns `{"loggedIn":false}`, classify `.signedOut` even though status is nonzero.
- If authenticated `whoami` succeeds but `/v2/user` or teams fail, classify `.failed`, not `.signedOut` or `.unusable`.
- The selected mechanism must be direct CLI execution with a plan-specific PATH; do not add shebang parsing unless a future failing fixture proves it necessary.
