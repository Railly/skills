# Blind proposals: wterm #118 fractional scroll ownership

- Date: 2026-08-13
- Isolated base: `4a73024d9f9003972f9efa6fe1a9086d1c90417b`
- Proposal A: `anthropic/claude-fable-5` through Vercel AI Gateway
- Proposal B: `gemini-3.1-pro` through Cursor Agent
- Neither proposer saw the other proposal. Both worked from detached read-only worktrees without candidate changes.

## Neutral contract

Property: A scroll initiated by wterm must not change output-following state as though the user had moved the viewport.

Observable: On fractional-layout environments, continuous output from a terminal that was already following must finish no more than one CSS pixel from the bottom.

Must not change:

- When the user is reading history, new output preserves the viewport position.
- When the user manually returns to the bottom, subsequent output follows.
- Keyboard input returns the viewport to the bottom.
- Resize preserves the visible history anchor when the user is not following.
- Ring-buffer rollover preserves the visible history row.
- Programmatic scroll handling remains bounded and does not create a render or scroll-event loop.

## Proposal A: Fable 5

### Shape

The bug lives in the ownership handshake between `_setScrollTop` and `_onScroll`. `_setScrollTop` records the requested value. On fractional layouts the browser can clamp or round the assignment, so the scroll event reports a value that fails exact equality. The handler then takes the user branch and revokes following.

- Keep `_shouldScrollToBottom`, `_programmaticScrollTop`, and `_pendingResizeScrollTop` on `WTerm`.
- Change `_programmaticScrollTop` from the requested value to the value accepted by the browser. `_setScrollTop` assigns, immediately reads `scrollTop`, and records that read-back.
- Make `_setScrollTop` the only product path that writes `element.scrollTop`, including the no-scrollback reset.
- Keep `write()` as the owner of follow-state and `_onScroll` as the owner of attribution.
- Preserve resize and rollover arithmetic.

### Predictions

1. Running the bottom-follow browser test at fractional scale will currently finish more than one pixel from the bottom, then finish within one pixel after the change.
2. On a fractional layout, assigning the rounded `scrollHeight - clientHeight` target will not always round-trip through `scrollTop`.
3. Existing rollover and resize tests remain green because their compensation arithmetic is unchanged.

### Cost

- One product file and no new fields.
- `_programmaticScrollTop` gains a new semantic meaning.
- Every future product scroll write must use `_setScrollTop`.
- One synchronous `scrollTop` read follows each programmatic write.

### What it makes worse

A user scroll that lands exactly on the tracked value while the token is outstanding can be swallowed as programmatic. The collision window is one event.

### Rejected alternatives

- Tolerance comparison because it can swallow nearby user movement.
- Time-window suppression because continuous output can keep the window open.
- Recomputing follow-state in `_onScroll` because it creates a second owner and can conflict with resize.
- A boolean or counter because no-op assignments and coalesced events can leak suppression state.

## Proposal B: Gemini 3.1 Pro

### Shape

- Keep `_shouldScrollToBottom` and `_programmaticScrollTop` on `WTerm`.
- `_setScrollTop` owns programmatic writes and records the browser's synchronous read-back.
- `_onScroll` owns attribution and consumes an exact match.
- Add a one-pixel tolerance before writing, so an already-near target does not cause repeated DOM writes.

### Predictions

1. On a fractional layout, `scrollTop = 100.5` reads back a value different from `100.5`.
2. Without a tolerance, repeated renders can continue assigning a target the browser cannot represent and can produce repeated scroll work.

### Cost

- One product file and no new fields.
- `_programmaticScrollTop` changes from requested to accepted value.
- A one-pixel tolerance becomes part of the internal scroll contract.
- Future programmatic scrolls must route through `_setScrollTop`.

### What it makes worse

Allowing a one-pixel no-op tolerance can leave the terminal fractionally away from the mathematical bottom.

### Rejected alternatives

- Recompute follow-state on every scroll because it can create a render and scroll loop.
- Round the target in JavaScript because browser engines and scale factors clamp differently.
- Detect user movement only through wheel or touch events because scrollbar and keyboard scrolling would be missed.
