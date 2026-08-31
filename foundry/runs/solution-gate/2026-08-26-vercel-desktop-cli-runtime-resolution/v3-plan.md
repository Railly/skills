# V3 plan: Every command keeps the validated plan

## Outcome

Every Vercel CLI consumer uses the selected executable and runtime environment, with bounded invalidation and no unsafe command replay.

## Scope

- Route the central `VercelCLI.run` seam through `LaunchPlanStore`.
- Preserve command-specific environment overlays and existing process semantics.
- Clear the plan on explicit Recheck.
- On launch-level failure, invalidate and perform one resolution probe without replaying the failed command.
- Keep timeout and ordinary nonzero command exits as command failures, not runtime switching signals.
- Complete concurrency and lifecycle regression coverage.

## Files expected to change

- `apps/swift/Sources/VercelDesktop/VercelCLI.swift`
- `apps/swift/Sources/VercelDesktop/AppModel.swift`
- `apps/swift/Tests/VercelDesktopTests/VercelCLITests.swift`
- Focused service regression tests where exact command contracts already live

## Acceptance

- Onboarding and an existing service command observe the same executable URL and PATH.
- Concurrent boot/poll calls do not race cache state or run unbounded resolution.
- Recheck clears the cache before resolving.
- Launch-level failure triggers at most one resolution probe and zero service-command replays.
- Timeout, API status failure, and auth failure do not switch installations automatically.
- App restart has no persisted launch plan.
- Existing service arguments, timeouts, output capture, noninteractive behavior, and `/tmp` working directory remain byte-for-byte equivalent where observable.

## Demo

Under the sanitized environment, complete onboarding and invoke one existing CLI-backed read action. Show that both runner captures contain the same executable and PATH. Then invalidate via Recheck and show one new plan is selected.
