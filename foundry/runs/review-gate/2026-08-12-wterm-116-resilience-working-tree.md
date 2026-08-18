# Review Gate: wterm #116 resilience fixes

Date: 2026-08-12
Base: `4852dde5481439883eecf7f61f32f6091be5b468`
Tracked product-diff fingerprint: `ce4c7a8fb0cccd8ddd48bcf3d67b1fc8b6a1dcf249efa6057790fc1000783c61`
Status: **incomplete only for exact-head coverage**

The diff is technically green. It is not eligible to be called an exact-head pass until committed and reviewed under its resulting SHA.

## Outcome

No confirmed product finding remains. The cross-family choice audit found a hardcoded row-height oracle; it was fixed by measuring the rendered row. Its remaining concerns were refuted:

- `saturated: true` already signals that the capacity remains exhausted when the saturating rejection count reaches `u32::MAX`.
- The WASM values come from the package's own typed exports; older binaries are handled by absence, not arbitrary malformed values.
- Ghostty never exposed the cached object identity. `getCell()` creates a new `CellData`, and the DOM groups links by the string `linkKey`.

## Deterministic layer

- `git diff --check`: pass.
- Style: pass.
- WASM source/artifact drift: pass.
- Callers of `getResourceState`: pass.
- Surfaces: acknowledged.
  - Root README already describes OSC 8 and need not expose internal resource telemetry.
  - Navigation and page-title registries are unaffected because no route changed.
  - The Vite README is unaffected because `?debug` only exposes the existing fixture to E2E.
- Docs siblings: prior audit reports and `.decisions.tsv` are evidence artifacts, not public contract surfaces.
- Radius: 13 changed symbols, 52 impacted items, 557 edges and 3665 unresolved calls. The map under-covers and was used only for orientation.
- Exact-head coverage: pending because the reviewed artifact is an uncommitted working tree.

## Subsystem model

- WTerm explicitly owns discarded-row compensation.
- Chromium native anchoring was a second owner during frame-separated top-row removal.
- Resize setup destroys geometry, but WTerm captures and restores the pending offset.
- Virtualized scrolling is asynchronous: assigning `scrollTop` schedules the DOM window update on RAF, so browser tests must observe after that render.
- Built-in hyperlink identity state belongs to the host lifetime. Ghostty page metadata remains authoritative and needs no JavaScript identity cache.

## Lenses

- New-domain matrix: run for rollover timing, RIS/init, older WASM and 1600 Ghostty identities.
- New-failure-outcome propagation: run. Resource state is optional and public docs describe capacity rejection.
- Error-path forcing: run. Saturation, counter overflow and missing exports were forced.
- Non-destructive recovery: run. RIS preserves state and init resets it.
- Boundary pipeline trace: run across Zig, WASM exports, bridge types and docs.
- Substrate verification: run against real WASM and Chromium.
- Dogfood built artifact: run through the Vite fixture.
- Docs-behavior parity: run.
- Choice audit: run with Claude Sonnet. One test-oracle finding fixed; three concerns refuted at their contract layer.
- Complexity budget: run. Changes are constant-time counters or removal of a Map.
- Inverse regression surface: skipped, no data source replacement.
- Resolution-rule consistency: skipped, no resolution rule changed.
- Cancellation and timeout: skipped, no timer contract changed.
- Demonstrative example: skipped, no example was added.
- Shell, shim, flag and reference-oracle lenses: skipped, triggers absent.

## Verification

- Zig: pass
- Core: 72 tests
- DOM: 134 tests
- Ghostty: 49 tests
- Build, type-check, lint and format: pass; lint has one pre-existing PostCSS warning
- Chromium: 15/15
- Rollover repetition: 5/5
- Resize repetition: 5/5

## Exemptions claimed

- No root README change for internal saturation telemetry because the existing feature statement remains true and the API is documented in the core README and API reference.
- No navigation or title registry change because no page was added or renamed.
- No Vite README change because query-driven debug exposure is test harness plumbing.
- No changelog or version change because releases remain maintainer-controlled.

## Issue candidates

- Long-duration RSS and forced-GC pressure remains useful but is not required to validate the removed Ghostty Map.

## Blocking gap

Commit the worktree, rerun exact-head Review Gate on the new SHA, then push or request review. PR #116 currently remains remotely at `4852dde`.
