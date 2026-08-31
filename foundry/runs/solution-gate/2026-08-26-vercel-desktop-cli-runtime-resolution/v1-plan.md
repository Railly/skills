# V1 plan: Finder launch recognizes Bun CLI with NVM Node

## Outcome

A Finder-like process environment can validate the installed Bun Vercel CLI, reuse the resulting launch plan for `whoami`, and advance an authenticated user to scopes.

## Scope

- Add injectable candidate and PATH composition logic with bounded NVM enumeration.
- Add `LaunchPlan` and a lock-protected process-only store.
- Validate direct CLI execution with controlled `--version`.
- Use the selected plan for structured `whoami` and existing session boot.
- Preserve existing failure states and UI until V2.

## Files expected to change

- `apps/swift/Sources/VercelDesktop/VercelCLI.swift`
- `apps/swift/Sources/VercelDesktop/ProcessRunner.swift` only if structured runner errors require it
- `apps/swift/Tests/VercelDesktopTests/VercelCLITests.swift`
- A focused resolver/integration test file if separation improves test ownership

## Acceptance

- Exact candidate order and composed PATH order are testable without machine state.
- NVM enumeration is semver ordered, deduplicated, and capped at 24.
- `Foundation.Process` directly launches a symlinked `#!/usr/bin/env node` fixture whose CLI and runtime paths contain spaces.
- The added `--version` probe overlays both mutation controls.
- Authenticated `whoami` uses the same plan and reaches `.ready`.
- Current arguments, timeout, output capture, noninteractive flags, and `/tmp` working directory remain unchanged.

## Demo

Launch the development app with a sanitized Finder-like PATH while the real CLI is in `~/.bun/bin` and Node is under NVM. The onboarding check advances to the scope chooser without login or symlink setup.
