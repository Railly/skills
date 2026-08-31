# V2 plan: Broken installations get accurate recovery

## Outcome

Onboarding distinguishes missing, unusable runtime, signed-out, ready, and later API failure, and a broken higher-priority candidate cannot hide a usable later candidate.

## Scope

- Continue candidate validation after throw, interpreter status `127`, timeout, or invalid version output.
- Add structured launch attempts with bounded sanitized diagnostics.
- Add `CLIState.unusable` and its runtime-repair onboarding guidance.
- Parse structured signed-out JSON independently of exit status.
- Add Recheck invalidation and current-check diagnostic replacement.

## Files expected to change

- `apps/swift/Sources/VercelDesktop/VercelCLI.swift`
- `apps/swift/Sources/VercelDesktop/Models.swift`
- `apps/swift/Sources/VercelDesktop/AppModel.swift`
- `apps/swift/Sources/VercelDesktop/OnboardingView.swift`
- `apps/swift/Tests/VercelDesktopTests/VercelCLITests.swift`
- `apps/swift/Tests/VercelDesktopTests/OnboardingTests.swift`

## Acceptance

- No candidate file maps to `.missing`.
- Candidate files with no passing plan map to `.unusable`.
- A later candidate succeeds after an earlier launched process exits `127`.
- `{"loggedIn":false}` maps to `.signedOut` with status `1`.
- Authenticated `whoami` followed by user/team API failure maps to `.failed`.
- Runtime-repair guidance never instructs the user to log in.
- Copied diagnostics redact token-bearing values and cap each stderr entry at 2 KiB.
- Fresh-HOME controlled `--version` creates no files.

## Demo

Run fixtures for a broken first candidate and a usable second candidate, then for only a broken candidate. The first reaches scopes; the second renders runtime-repair guidance with safe diagnostics.
