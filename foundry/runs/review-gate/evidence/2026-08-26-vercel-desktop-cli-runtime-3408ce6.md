# Vercel Desktop CLI runtime evidence

Target: `vercel-labs/vercel-desktop@3408ce66b12adfbb078694188f5b4e80305c3d50`

## Subsystem model

- The GUI process starts without an interactive shell and launches the selected Vercel CLI URL directly through `Foundation.Process`.
- A CLI entrypoint can be executable while its `#!/usr/bin/env node` interpreter is absent from the GUI PATH.
- Candidate discovery, launch validation, authentication, and every service command must consume one runtime-inclusive launch plan.
- A service command is never replayed automatically because it may have reached a remote side effect before its local failure became visible.
- Recheck invalidates derived in-process state. It must not wait behind a slow launch probe or allow the old probe to republish stale state.

## Exact-head verification

- `git diff --check origin/main...HEAD`: pass.
- `pnpm --dir apps/swift check`: pass.
- `pnpm --dir apps/swift build`: pass, release arm64 binary linked.
- `swift test --package-path apps/swift --disable-sandbox --filter VercelCLI`: 25 of 25 pass.
- `pnpm --dir apps/swift test`: 88 of 89 Swift tests pass plus 11 of 11 Node tests. The only failure is the pre-existing host-specific `geistFontsResolveAfterBundleRegistration`, where AppKit reports `GeistMono-Regular.isFixedPitch == false`. The same failure existed on the base before this change.
- `gate.sh style`, `surfaces`, `callers onboardingState`, and `timings`: pass.
- `gate.sh callers VercelCLI.run` enumerated all seven service call sites. Each already uses the central adapter and preserves its arguments and timeout.
- `gate.sh callers ProcessRunner.run` enumerated two updater call sites. Both accept the typed timeout through the existing `throws` contract and do not depend on the old concrete error value.

## Real process boundary

The installed CLI resolves to `~/.bun/bin/vercel`, a symlink to `vercel/dist/vc.js` with `#!/usr/bin/env node`. Under `env -i` with only `/usr/bin:/bin`, `vercel --version` exits 127 with `env: node: No such file or directory`. Adding `~/.nvm/versions/node/v24.18.0/bin` makes the same CLI return Vercel CLI 59.1.4. No shell profile was sourced.

The integration fixture also launches a symlinked CLI and NVM-style Node through real `Foundation.Process`, with spaces in both paths. The fresh-HOME probe leaves only its pre-created fixture directory.

## Behavioral dimensions

- Candidate source: inherited PATH, PNPM_HOME, BUN_INSTALL, fnm, Homebrew, `/usr/local`, pnpm, Bun, or up to 24 semver-ordered NVM versions.
- Candidate result: missing file, throw before launch, timeout, exit 127, other nonzero exit, invalid output, or valid semver output.
- Authentication result: authenticated username, structured `loggedIn:false` with exit 1, runtime disappearance, or later API failure.
- Cache state: cold, warm, concurrent cold callers, explicit Recheck during a probe, or launch failure after validation.
- Service result: success, timeout, ordinary API failure, launch throw, or exit 127.
- Recovery: later candidate during resolution, re-resolution without command replay, and explicit user retry using the newly selected plan.

## Falsification

- Removing NVM directories from the composed PATH made the real process-boundary test fail, then restoration returned it green.
- Stopping after the first broken candidate made the retry test fail, then restoration returned it green.
- Collapsing authentication errors to signed-out made the state-separation test fail, then restoration returned it green.
- Replacing semantic version-output validation with a non-empty check selected the invalid first candidate. The targeted test failed at the executable assertion, then passed after restoration.
- Disabling the Recheck generation increment allowed the in-flight stale probe to publish. The targeted test observed one probe instead of the required two, then passed after restoration.

## Findings resolved before the exact HEAD

1. The initial version probe accepted any non-empty output with exit 0. It now requires a version-shaped output and retries the next candidate. A dedicated mutation proves the test rejects the weak implementation.
2. The initial resolver held its lock while launching a probe, so MainActor Recheck could block for the probe timeout. Process work now occurs outside an `NSCondition`; generation invalidation discards stale results. A deterministic semaphore test proves Recheck returns immediately and forces a fresh probe.

No finding remains open.
