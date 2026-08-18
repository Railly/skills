# Review Gate: wterm #118 fractional scroll ownership

Status: incomplete. No unresolved code finding was confirmed, but the implementation is uncommitted, the reporter's Linux/Wayland substrate is unavailable, and the independent Claude audit did not return.

Base: `4a73024d9f9003972f9efa6fe1a9086d1c90417b`

Working-tree diff SHA-256: `43d8343a65706496f647a2993a608aec299a78b0354fcd6b5b24bb36ef141826`

Decision-trail SHA-256: `7698e757a9bebd22e2fc0510ac6319f0a9a5a63b875413fb71609ef4df9c1862`

## Outcome

The working tree implements the shape accepted by Solution Gate:

- Bottom requests assign `scrollHeight` and let the browser clamp.
- Programmatic ownership records the accepted position.
- A later event within one CSS pixel consumes the token once.
- Larger deltas remain user-owned.
- No-op assignments preserve an earlier pending token.
- The no-scrollback reset uses the same ownership helper.

No confirmed correctness bug remains in the reviewed diff.

## Contract exercised

- A browser re-clamp from 900 to 899 does not disable following.
- The matching token is single-use.
- A delta larger than one pixel disables following and schedules rendering.
- Consecutive programmatic assignments retain the latest accepted position.
- A later no-op does not erase an earlier moving assignment.
- The browser owns the bottom clamp.
- Existing bottom follow, history reading, input-to-bottom, resize anchoring, and rollover behavior remain green.

## Verification

- Focused DOM: 70/70.
- Full DOM: 151/151.
- Full repository tests: pass.
- Type-check: pass.
- Build: pass.
- Lint: pass with one pre-existing anonymous-default-export warning in `apps/docs/postcss.config.mjs`.
- Format check: pass.
- Chromium: 17/17, repeated three times for 51/51.
- `git diff --check`: pass.
- Force-red: strict event equality fails the second-clamp test.
- Force-red: storing the requested target fails the accepted-position test.
- Firefox and WebKit were not configured as Playwright projects, so those runs were unavailable.

## Deterministic gate

- Style: pass.
- Callers `_setScrollTop`: pass. Every call site is in a diffed file.
- Callers `_scrollToBottom`: pass. Every call site is in a diffed file.
- Surfaces: acknowledged. The DOM README and vanilla docs already state the exact behavior this fix restores: output follows only when already at the bottom, history reading does not enable follow, and input returns to the bottom. No API, option, route, or public promise changed.
- Exact-head coverage: pending because the implementation is uncommitted.

## Subsystem model

`WTerm` owns scroll intent. `_setScrollTop` is the product write boundary, `_onScroll` attributes the next delivered event, `_shouldScrollToBottom` stores follow intent, and `_pendingResizeScrollTop` has priority while renderer setup temporarily destroys geometry.

The adjacent layer assumed correct is the browser compositor between synchronous assignment/read-back and later scroll-event delivery. The deterministic fixture models requested, accepted, and delivered positions separately. The exact Electron 43.4.0, Chromium 150, Linux/Wayland environment remains unavailable locally.

## Radius

The map reports 4 changed and 17 impacted symbols, with 561 edges and 3,871 unresolved calls. Because unresolved calls materially exceed resolved edges, the map under-covers and was used only for orientation. The one convergence item was a DOM synchronization test module and produced no finding.

## Lens disposition

- New-domain matrix: run against no-op, latest assignment, second clamp, single-use token, larger user delta, resize, and rollover.
- Emission channel and one-shot latch reachability: run. The token is written only after movement, replaced by the latest moving assignment, preserved by a no-op, consumed once, and cleared by a non-match.
- Fresh-seam scan: run across all producers and consumers of `_programmaticScrollTop`, `_shouldScrollToBottom`, and `_pendingResizeScrollTop`.
- Substrate verification: incomplete. Chromium macOS and deterministic fixtures passed; Linux/Wayland Electron is unavailable.
- Dogfood built artifact: run through the Vite production fixture in Chromium.
- Docs-behavior parity: run. Existing prose already states the restored behavior.
- Choice audit: incomplete. Three Claude CLI review attempts returned no output and were terminated.
- Inverse regression, resolution consistency, shell re-parse, shim hermeticity, deliberate default, reference oracle, new failure propagation, flag propagation, error forcing, recovery, cancellation, boundary pipeline, demonstrative example, and complexity budget: skipped because their triggers do not apply.

## Exemptions claimed

- No documentation edit: the DOM README and vanilla docs already describe the intended follow, history, and input behavior; this patch restores it on fractional layouts.
- No changelog or version edit: releases are manual and maintainer-controlled.
- No core README edit: no core contract or package relationship changed.

## Issue candidates

- Validate the packaged fix in Electron 43.4.0, Chromium 150, Linux/Wayland at DPR 1.25 and 1.6 before release.
- Consider adding Firefox and WebKit Playwright projects if cross-browser scroll ownership becomes a supported CI contract.

## Remaining gate

After an authorized commit, rerun Review Gate against the exact SHA. Before release, run the reporter's packaged Linux/Wayland reproduction. Any code change, rebase, or force-push retires this working-tree report.
