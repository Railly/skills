# Solution Gate: wterm #118 fractional scroll ownership

- Date: 2026-08-13
- Target: `vercel-labs/wterm` at `4a73024d9f9003972f9efa6fe1a9086d1c90417b`
- Trigger: #118 is a regression from the #115 scroll-anchoring fix, and the alternatives differ in scroll ownership and event attribution.
- Proposers: `anthropic/claude-fable-5` and `gemini-3.1-pro`, blind to each other.
- Synthesizer and future implementer: Codex root runtime, which proposed neither shape.
- Proposals: `2026-08-13-wterm-118-fractional-scroll-4a73024-proposals.md`
- Drawing: `2026-08-13-wterm-118-fractional-scroll-4a73024.html`

## 0. Trigger

Fires. This is a fix for a previous review round, and more than one attribution contract is plausible.

## 1. Defect contract

### Property

A scroll initiated by wterm must not change output-following state as though the user had moved the viewport.

### Observable

On a fractional-layout environment, continuous output from a terminal that was already following finishes no more than one CSS pixel from the bottom.

### Must not change

- Reading history preserves the viewport while output continues.
- Returning manually to the bottom resumes following.
- Keyboard input returns the viewport to the bottom.
- Resize preserves the visible history anchor.
- Ring-buffer rollover preserves the visible history row.
- Scroll handling remains bounded and does not create a render loop.

## 2. Independent proposals

Both proposals converge on changing `_programmaticScrollTop` from the requested value to the value accepted by the browser.

Fable keeps strict equality after read-back and makes `_setScrollTop` the only writer. Gemini adds a one-pixel pre-write tolerance but also keeps strict equality for the event.

Both proposals are preserved in the proposals record.

## 3. Forward chains

### Proposal A: read-back plus strict equality

1. `_setScrollTop` assigns a target (`observed`: current helper is the programmatic write path).
2. The browser synchronously clamps the value (`observed`: DOM probe).
3. Read-back records the accepted value (`inferred`: proposal).
4. `_onScroll` compares the later event with strict equality (`inferred`: proposal).
5. A layout change between assignment and event can clamp the offset again (`observed`: DOM probe), so strict equality can still fail.

Harmful branches:

- A second clamp misclassifies wterm's own event as user movement.
- A direct product write outside the helper creates an unowned scroll source.

### Proposal B: pre-write tolerance plus read-back

1. A target within one pixel is treated as already reached (`inferred`: proposal).
2. Avoiding the write avoids a scroll event and token creation (`inferred`).
3. Larger moves assign and record read-back (`inferred`).
4. The event still uses strict equality (`observed`: proposal text).
5. A second clamp can still differ from the read-back (`observed`), leaving the core defect reachable.

Harmful branches:

- A one-pixel no-op can leave a one-pixel bottom gap.
- Strict event equality remains an under-reach.

### Synthesized shape

1. `_scrollToBottom` assigns past the end and lets the browser select its true maximum (`inferred`, supported by the current DOM API).
2. `_setScrollTop` records the value accepted after assignment (`inferred`, supported by the clamping probe).
3. `_onScroll` accepts a difference of at most one CSS pixel (`inferred`, supported by the second-clamp probe).
4. The token is consumed once, bounding attribution (`inferred`).
5. All product writes use the helper, preventing unowned programmatic events (`inferred`, source grep identifies one remaining direct reset).

Harmful branch:

- A one-pixel user movement while a token is pending can be consumed. Existing bottom semantics already treat any position within five pixels as following, which bounds the behavior change at the bottom. History movement larger than one pixel continues to take the user branch.

## 4. Probe log

| Probe | Command or measurement | Observed result |
|---|---|---|
| Local reproduction | Headless Chromium at DPR 1, 1.25 and 1.6 against the built Vite example | macOS Chromium stayed at the bottom. The Electron/Linux compositor failure from #118 does not reproduce on this machine. |
| Fractional assignment | Assign `100.1`, `100.25`, `100.5`, `100.75` at DPR 1.25 | Browser accepted integer values `100`, `100`, `101`, `101`. JavaScript targets do not round-trip generally. |
| No-op event | Assign beyond the end while already at the bottom | Browser accepted the same position and emitted no event. A helper must not leave a new token for a no-op. |
| Coalescing | Assign `100`, `200`, `300` in one task | Browser emitted one event at `300`. Pending-event counters are unsafe. |
| Second clamp | Assign bottom at `900`, then change fractional viewport height before the event | Browser re-clamped to `899` and emitted the event at `899`. Read-back plus strict equality is refuted. |
| User delta | Wheel deltas at DPR 1.25 | A `0.5` wheel delta produced a one-pixel scroll. The claim that no user gesture moves one pixel or less is false. |
| Trusted event | Inspect `event.isTrusted` for a programmatic assignment | Programmatic scroll emitted `isTrusted: true`. Trust does not distinguish ownership. |
| Resize direction | Shrink content while positioned 50 pixels above the old bottom | Browser clamped the viewport to the new bottom. Recomputing follow-state from position would mistake layout clamping for user intent. |
| Product writers | `rg "element\\.scrollTop\\s*=|\\.scrollTop\\s*=" packages/@wterm/dom/src` | `_setScrollTop` plus one direct no-scrollback reset exist in product code. |
| DOM unit baseline | `pnpm --filter @wterm/dom test -- --run` | 145 of 145 passed. |
| Chromium baseline | `pnpm exec playwright test e2e/tests/terminal.spec.ts --config e2e/playwright.config.ts --project chromium --workers 1` | 16 of 16 passed. |

The issue reporter's CDP measurements on Electron 43.4.0, Chromium 150, Linux/Wayland at DPR 1.25 and 1.6 remain the external reproduction source. Exact Linux verification is a carried implementation target.

## 5. Prediction disposition

| Prediction | Result |
|---|---|
| Fractional targets can be clamped | Survived. Directly observed. |
| Read-back plus strict equality closes the class | Refuted. A second clamp changed `900` to `899` before the event. |
| A one-pixel tolerance cannot overlap user movement | Refuted. A fractional wheel delta produced a one-pixel movement. |
| Counters can model pending assignments | Refuted. Three writes coalesced into one event. |
| `isTrusted` distinguishes user scroll | Refuted. Programmatic events were trusted. |
| Position alone can own follow-state | Refuted. Layout shrink clamped history to the bottom without user intent. |
| Existing resize and rollover gates are green before implementation | Survived. Unit 145/145 and Chromium 16/16. |

## 6. Failure-shape scoring

| Shape | Fable strict read-back | Gemini tolerant write | Synthesized shape |
|---|---|---|---|
| S1 over-reach | Low, but the proposed single-writer cleanup touches another reset path. | Hit: pre-write tolerance changes every programmatic target. | Designed down: tolerance applies to attribution, while assignments still request their full target. |
| S2 under-reach | Hit: second clamp leaves the defect open one event deeper. | Hit: event comparison remains strict. | Designed out for the observed one-pixel clamp class; larger discrepancies remain user-owned. |
| S3 direction inheritance | Handles request-to-clamp only. | Handles request-to-clamp only. | Covers initial clamp, later re-clamp, and no-op direction. |
| S4 proxy property | Accepted read-back is a proxy for later event position. Hit. | Near-target write suppression is adjacent to event ownership. Hit. | The token plus bounded event-distance directly models ownership under browser rounding. |
| S5 unregistered peer | No persistent peer. | No persistent peer. | No hit. |
| S6 peer-version blindness | No cross-process contract. | No cross-process contract. | No hit. |
| S7 wrong layer | Correct layer: WTerm owns scroll intent. | Correct layer. | Correct layer; renderer arithmetic remains unchanged. |
| S8 guard-derived cells | Fractional case only. | Tolerance cells derive from the fix. Hit. | Tests must include no-op, coalescing, second clamp, one-pixel user movement, resize, and rollover. |
| S9 test pins wrong thing | A simple DPR test can pass on macOS and miss Linux. Hit. | Same hit. | Requires a deterministic clamping double for unit coverage plus Electron/Linux acceptance evidence. |
| S10 claim from prose | “Read-back remains stable until event” was unexecuted and false. Hit. | “No user gesture below one pixel” was false. Hit. | Load-bearing DOM claims were executed locally; Linux behavior remains explicitly external. |

## 7. Synthesis

**Kind: graft, with one correction supplied by the probes.**

Take from both proposals:

- Keep attribution state on `WTerm`.
- Store the browser-accepted value, not the requested value.
- Keep follow-state ownership out of `_onScroll`.
- Route every product scroll write through `_setScrollTop`.

Add from the probes:

- `_scrollToBottom` requests `element.scrollHeight`, letting the browser clamp to its actual maximum instead of subtracting two rounded getters.
- `_setScrollTop` assigns first, reads the accepted value, and creates or replaces the token only if the position moved.
- `_onScroll` consumes the token when the event is within one CSS pixel of the accepted value, covering a second clamp between assignment and delivery.
- The no-scrollback reset uses `_setScrollTop`.
- Do not use a time window, boolean, counter, `isTrusted`, or position-only follow-state.

The one-pixel attribution tolerance is accepted because:

1. the observed browser re-clamp reached exactly one CSS pixel;
2. the existing `_isScrolledToBottom()` contract already treats a five-pixel band as following;
3. the token is single-use and larger history movement remains user-owned.

## 8. Carried assumptions and implementation targets

1. A deterministic unit fixture must model requested, accepted, and event positions separately, including `900 → 899`.
2. A no-op assignment must not create a new token or erase an outstanding token for an earlier moving assignment.
3. Multiple assignments before one event must replace the token with the latest accepted position.
4. A matching event consumes the token exactly once.
5. A non-matching event clears the token, disables following, and schedules the virtual-window render.
6. `_pendingResizeScrollTop` retains priority over ordinary scroll attribution.
7. Bottom follow must end within one pixel at DPR 1, 1.25 and 1.6.
8. History reading, manual return to bottom, keyboard return, resize anchoring, and rollover must be driven.
9. The exact reporter environment, Electron 43.4.0 on Linux/Wayland with fractional scaling, remains the release acceptance gate.
10. Deleting accepted-value read-back or event tolerance independently must fail distinct tests.

## 9. Verdict

**Accepted for implementation.**

Implement the synthesized shape in a clean worktree from `origin/main@4a73024`. Do not edit the `lab/v034-checkpoint` worktree because it contains the evidence harness. Run Review Gate after the focused unit and Chromium checks, then verify the packaged Electron/Linux reproduction before releasing `v0.3.5`.
