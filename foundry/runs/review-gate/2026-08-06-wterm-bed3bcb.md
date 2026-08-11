# Review gate: vercel-labs/wterm PR #106 rerun

- Base: `origin/main` at `a1e12a10f10eeffae1e803aea7ede0ed030374ae`
- Head: `bed3bcbd392b5674336bf1383bf693c499dbfe09`
- PR: `fix: render synchronized output atomically`, open and mergeable, closes #57
- Target worktree: clean and unchanged at the requested HEAD after review
- Status: **INCOMPLETE, BLOCKING**. The findings are confirmed, but a real browser could not be driven because the in-app browser runtime exposed no browser instance.
- Spec review: not provided. Issue #57 and the linked synchronized-updates specification were used as Standards-review inputs, not as a substitute for a separate Spec pass.
- **Same-family warning:** `same_family=true` was supplied; a GPT-5/Codex reviewer may share the author's priors and blind spots.

## Findings

### High — the timeout paints once without ending synchronized mode

`_scheduleSynchronizedOutputFallback()` clears only its timer and schedules a render (`packages/@wterm/dom/src/wterm.ts:217-223`); it never clears mode 2026 in the core. Driving the built `@wterm/dom` package with the committed WASM produced this sequence:

1. `CSI ? 2026 h` plus `FIRST` stayed hidden until the 1,000 ms fallback.
2. The fallback painted `FIRST`, but `term.bridge.synchronizedOutput()` remained `true`.
3. A later ordinary `SECOND` write stayed hidden for another full second.

The linked specification says a timeout should “prematurely end the update”; xterm.js's reference handler explicitly sets `synchronizedOutput = false` before flushing. At this HEAD the terminal remains in a degraded one-second batching loop until an eventual ESU or reset. The same built-artifact drive also confirmed that another BSU at 900 ms does not extend the deadline: output paints at the original ~1,000 ms deadline, contrary to the specification's repeated-BSU rule.

Propagation: `Terminal.setPrivateMode(2026) → WasmBridge.synchronizedOutput() → WTerm._scheduleSynchronizedOutputFallback() → _scheduleRender()`, with no reverse transition at timeout.

### Medium — two previously identified cancellation seams still lack force-red tests

The prior report required timer-to-RAF cancellation and destroy cleanup to be guarded. The new tests do not create either state:

- Removing `_cancelScheduledRender()` only from the synchronized `write()` branch left all 37 committed `wterm.test.ts` tests green. A focused test that first promoted a normal render to RAF, then delivered BSU, passed at HEAD and failed with that cancellation removed.
- Removing `_cancelSynchronizedOutputFallback()` from `destroy()` also left all 37 committed tests green.

Other force-red cells are valid: disabling mode-2026 tracking made Zig and core tests fail; removing immediate response draining, timeout scheduling, hold suppression, or resize deferral made their focused tests fail. The missing queued-frame and destroy cells are regression gaps on seams already named by the previous review.

### Medium — the user-visible atomic-render behavior is still undocumented

The previous public-getter documentation finding is fixed: `packages/@wterm/core/README.md` and the web API reference now list `synchronizedOutput()`. However, a repo-wide documentation sweep finds only those two getter rows. No user surface says that `WTerm` suppresses paints between DECSET/DECRESET 2026 or that it falls back after one second. The root README and docs landing feature lists still describe ordinary rAF dirty-row rendering only, and `@wterm/dom`'s README does not describe the behavior it implements.

This is observable bug-fix behavior under the repository's explicit “any user-facing change” documentation rule. Document the DOM behavior and its timeout semantics in the relevant feature surfaces; the getter row alone describes core state, not the feature delivered by PR #106.

## Prior finding verification

- **Host responses blocked behind paint:** fixed. A built-package/committed-WASM drive of `CSI ? 2026 h`, text, and DSR delivered CPR immediately while the text remained unpainted. Removing `_drainResponses()` from `write()` makes the new focused test fail.
- **Unterminated block freezes forever:** partially fixed, but regressed into the high finding above. It paints after one second yet does not exit the mode.
- **Resize exposes partial output:** fixed. The implementation defers renderer setup while held; reverting resize deferral makes the new resize test fail.
- **No DOM regression coverage:** mostly fixed. Hold/close, response, timeout-paint, and resize tests are force-red; queued RAF cancellation and destroy cleanup remain unguarded.
- **Missing public API docs:** fixed for the new getter. The broader DOM behavior documentation remains missing as a new regression-radius finding.

## Subsystem model and radius

The in-process topology is: transport/application calls `WTerm.write()` → `TerminalCore.writeString/writeRaw()` → built-in Zig streaming parser toggles mode 2026 → WASM exports the mode → `WTerm` owns the `setTimeout(0) → requestAnimationFrame → Renderer.render()` paint chain. Responses use a separate synchronous callback path after this PR; resize is an independent grid and renderer-shape producer; destroy owns both render and synchronized-fallback timer cancellation. `GhosttyCore` is an alternate core and does not expose the optional mode signal.

The fix assumed these adjacent layers were correct: timeout must transition state rather than merely paint, repeated BSU must define timer re-arming, a queued pre-BSU RAF must be cancelled, destroy must make both timer stages inert, and user documentation must describe DOM behavior rather than only the core getter.

Radius reported 9 changed TS symbols, 10 impacted items, 515 edges, and 2,576 unresolved calls. Because unresolved calls dwarf edges, the map materially under-covers. Both convergence items were inspected first: `wasm-memory-growth.test.ts` cleared the DataView-growth invariant, and the DOM mock-bridge convergence exposed the test-contract review surface. All three findings came from exploration outside the map.

## Deterministic and empirical checks

- `gate.sh covered ... 106`: correctly red before report creation; pass after this exact-HEAD JSON exists.
- `gate.sh style origin/main`: pass.
- `gate.sh surfaces conventions.md origin/main`: pass mechanically; manual surface reading found the documentation finding.
- `gate.sh siblings 'synchronized output' origin/main` and `siblings '2026'`: pass.
- `gate.sh callers synchronizedOutput origin/main`: pass.
- `gate.sh timings origin/main packages/@wterm/dom/src`: pass.
- Stale-value, shellmeta, artifacts, rawinput, and producer checks: not triggered; the mode/getter are additive, no shell detector or persistent file was added, no resolution rule deepened, and no classifier narrowed.
- `zig build test`: pass at HEAD; force-red mode-tracking mutation fails the synchronized-output Zig test.
- `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm format:check`: pass in the clean scratch clone. Lint retains one pre-existing docs warning.
- Focused core: 59/59 pass. Focused DOM: 82/82 pass.
- ReleaseSmall WASM rebuild SHA-256 equals the committed binary: `cf9db3d8edc49a661ad0cc1573433a53f2f21563b251102fac488068c63d0730`.
- `git diff --check`: pass.
- GitHub PR checks: CI, Vercel Agent Review, Vercel deployment, preview comments, and Socket checks pass.
- Built-package/committed-WASM drive: hold/close, immediate CPR delivery, timeout behavior, post-timeout write behavior, and repeated-BSU timing exercised under jsdom.
- Real-browser drive: unavailable; the browser runtime listed zero browser instances. This is an explicit verification gap, not a refutation.
- `pnpm outdated`: five latest-stable maintenance updates found (`vitest`, `@vitest/coverage-v8`, `@playwright/test`, `prettier`, `turbo`); no dependency was changed because the target is read-only and this is outside PR scope.

## Lens dispositions

Run: new-domain matrix; fresh-seam scan; reference-implementation oracle; flag/mode propagation dispatch sweep; error-path forcing; non-destructive recovery; cancellation and timeout hygiene; boundary pipeline trace; substrate verification; dogfood the built artifact; docs-behavior parity; complexity budget.

Skipped: inverse regression surface (no source replacement); resolution-rule consistency (no input-resolution rule changed); shell re-parse domain (no shell construction); emission/latch reachability (no process/channel latch); shim hermeticity (no shim); deliberate-default check (additive behavior); substrate differential corpus (no external-substrate guard); new-failure propagation (no new error outcome); demonstrative example (no example); choice audit (no `.decisions.tsv`).

## Exemptions claimed

- No stale-value sweep: mode 2026 and `synchronizedOutput` are additive; nothing was renamed or retired.
- DCS-form BSU/ESU and DECRQM are exempt from this PR: its summary and issue reproducer scope the change to DEC private mode `?2026`; the linked spec calls DECSET/DECRESET the preferred pair and DECRQM is optional.
- The one-second duration is not itself rejected: the linked specification suggests no default. The defect is failure to end mode and re-arm on repeated BSU.
- Title changes need not be deferred: the specification explicitly makes title deferral optional.
- React and Vue API pages need no separate method change: they inherit `WTerm` behavior and expose no new prop. The shared DOM behavior still requires one canonical documented surface.
- `GhosttyCore` remains source-compatible because `synchronizedOutput` is optional and called with optional chaining; feature parity is an issue candidate.
- Navigation, page titles, release files, versions, portless setup, and changelog are unaffected because no page/package/release/dev-server surface was added.

## Issue candidates

- **Coordinate overlapping PRs #105 and #106 before merge.** Xref reports nine shared files, including `terminal-core.ts`, `wasm-bridge.ts`, the committed WASM, Zig terminal/API code, tests, and `WTerm`; either merge order can silently discard the other's response or synchronized-output contract without an explicit rebase and combined gate.
- **Define synchronized-output parity for alternative cores.** `GhosttyCore` has no `synchronizedOutput()` signal, so `WTerm` cannot hold its paints even if libghostty recognizes mode 2026. This is outside the built-in-core scope of #106.
- **Fix review-gate wildcard surface matching.** The mechanical surface gate passed even though the DOM behavior is absent from relevant package/root/docs feature surfaces; manual reading was required again.
- **Refresh repository development dependencies.** `pnpm outdated` reports five stable updates; this maintenance is unrelated to PR #106 and the target was required read-only.

## Gaps

- No separate Issue Contract or Spec-review result was supplied (`spec_status: not_provided`).
- No real browser was available, so DOM paint timing was not visually driven in Chromium/WebKit/Firefox; built code with committed WASM was exercised under jsdom instead.
- Same-family review may share author priors and is recorded as a non-blocking provenance warning.

