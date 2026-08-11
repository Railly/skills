# Proposals: agent-browser issue #1068

Both proposals were produced independently from clean clones of `main` at `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`. Neither proposer saw issue #1068, PR #1117, PR #1340, or the other proposal.

## Proposer A: Claude Fable 5, high effort

The following response is preserved verbatim.

### Shape

**The isolation boundary is (session name → dedicated CDP browser context), opt-in via a sticky `--isolated` flag for shared-Chrome connections; default behavior is untouched.**

Where state lives:
- **In Chrome:** the partition itself. One `Target.createBrowserContext` per isolated boundary. Chrome — not agent-browser bookkeeping — enforces cookie/localStorage/IndexedDB separation. The context outlives the daemon (contexts persist until Chrome exits or they are disposed), which is what reconnect needs.
- **On disk:** the existing `{socket_dir}/{session}.target` binding file gains two serde-defaulted optional fields: the owned `browserContextId` and a sticky `isolated` bool (same sticky pattern as `pinned`). It reuses the file's existing atomic temp-file + fsync + rename write path. Old files parse (defaults), old binaries ignore unknown fields — no migration.
- **In daemon memory:** `BrowserManager` holds the owned context id and applies it as a filter in exactly the places that decide target membership today: `should_track_target`, `discover_and_attach_targets`, the `Target.targetCreated/targetInfoChanged/targetDestroyed` event handlers (`actions.rs` ~1312–1360), `tab new/list/close/switch`, and `ensure_page`.

Who owns each decision:
- **CLI (`flags.rs`)** expresses intent only (`--isolated` / `AGENT_BROWSER_ISOLATED`, `--no-isolated` to unstick), mirroring the existing `pin_tab`/`cli_pin_tab` plumbing.
- **Daemon connect path (`actions.rs`)** decides create vs. reattach vs. fail: no persisted context → create context + one `about:blank` target in it (never adopt existing tabs); persisted context present in `Target.getBrowserContexts` → attach only to its targets; persisted context absent (Chrome restarted) → typed `context_gone` error, mirroring `tab_gone`, instead of silently falling back to shared storage.
- **`BrowserManager`** owns target membership: a target belongs to the boundary iff its `browserContextId` matches.
- **`tab_binding.rs`** owns persistence and its corruption semantics (a corrupt file must not silently drop isolation, exactly as it already must not drop `pinned`).

Resulting contract: an isolated boundary exclusively owns its context's storage and targets from creation to `close`; `close` in isolated shared mode disposes only the owned context (`Target.disposeBrowserContext`), never `Browser.close`; `tab list` enumerates only owned targets; `--pin-tab` composes (pins one target *within* the owned context); `window new` under isolation creates a new window target inside the owned context rather than a second context. Per-context replay of `Browser.setDownloadBehavior` and `Security.setIgnoreCertificateErrors` follows the pattern the recording path already documents. Without `--isolated`, nothing changes: default-context sharing, pin-tab, named sessions, profiles, `t<N>`/label/targetId references, and `state save/load` file formats are byte-identical (`Network.getAllCookies` on a page session is already context-scoped, so state files work unmodified in both modes).

### Predictions

1. **Storage separation.** With Chrome on `--remote-debugging-port=9222`: `agent-browser --session a --cdp 9222 --isolated open https://example.com` then `agent-browser --session a eval "document.cookie='k=a'"`; then `agent-browser --session b --cdp 9222 --isolated open https://example.com` and `agent-browser --session b eval "document.cookie"` prints a value **not** containing `k=a` (and the symmetric localStorage check via `eval "localStorage.getItem('k')"` prints null). Falsified if session b observes session a's cookie or storage.
2. **Reconnect adopts nothing.** With both sessions live, kill session a's daemon (PID from `{socket_dir}/a.pid`), then run `agent-browser --session a tab list --json`. Every listed target's id appears in `curl http://127.0.0.1:9222/json/list` under a's persisted `browserContextId` (readable from `{socket_dir}/a.target`), and b's targetId never appears. Falsified if a's list contains b's target or if a creates its context anew (different id than the persisted one) while the old context still exists.
3. **Close destroys nothing foreign.** After `agent-browser --session a close`, `curl http://127.0.0.1:9222/json/list` still contains b's targetId and `agent-browser --session b eval "location.href"` succeeds. Falsified if b's target disappears or Chrome exits.
4. **Default path unchanged.** Without `--isolated`, two sessions on the same `--cdp 9222` still share `document.cookie` for one origin (deliberate shared-login workflow), and `--pin-tab` behavior matches current `e2e_tests.rs` expectations. Falsified if the cookie diverges or existing pin-tab e2e tests change outcome.

### Cost

- **Files:** `cli/src/flags.rs` (flag, env var, sticky merge, `cli_isolated` explicit-disable plumbing); `cli/src/native/tab_binding.rs` (+2 optional fields); `cli/src/native/browser.rs` (owned-context field, filters in discovery/event tracking/tab ops, dispose-on-close); `cli/src/native/actions.rs` (connect/reconnect/close paths, target-event filtering, `context_gone` error, per-context replays); `agent-browser.schema.json` and `docs/src/app/sessions/page.mdx` + `cdp-mode` page; new e2e coverage in `cli/src/native/e2e_tests.rs`.
- **Fields:** `TabBinding.browserContextId: Option<String>`, `TabBinding.isolated: bool` (default false); `BrowserManager.owned_browser_context_id`.
- **Round trips:** +1 `Target.createBrowserContext` on first connect; +1 `Target.getBrowserContexts` per reconnect; +1 `Target.createTarget`; +2 per-context setting replays; +1 `Target.disposeBrowserContext` on close. All local-socket, millisecond-scale; steady-state commands add zero round trips (filtering is in-memory).
- **Migration:** none. Old `.target` files load via serde defaults; new files are readable by old binaries (unknown fields ignored), which simply behave as today.
- **Future maintenance:** a standing invariant that *every* future target-enumeration or target-creation code path must apply the context filter/parameter, and every browser-level Chrome setting added at launch (download dir, cert errors, future emulation-like settings) must also be replayed per context; the pin-tab × isolated matrix must be covered in parity/e2e tests; `context_gone` recovery must stay documented.

### What it makes worse

Isolated boundaries cannot survive a Chrome restart. Non-default browser contexts are memory-backed and die with the Chrome process, so all cookies/logins in an isolated boundary vanish when the shared Chrome exits — the user gets a hard `context_gone` error and must re-authenticate or `state load`, where today's shared-context session would have silently kept the profile's persisted cookies. Isolation also pins a full extra storage partition per boundary in the shared Chrome's memory, and the stricter failure mode means reconnects that used to "just work" (by adopting someone's tab) now surface errors that users must handle.

### Rejected alternatives

- **Make isolation the default for `--cdp`.** Killed by the contract and by the documented "Import auth from your browser" workflow: sharing one logged-in Chrome *requires* operating in the default context, and existing `.target` files bind default-context targets that an isolated daemon could no longer adopt.
- **Extend pin-tab to own a *set* of targets without a browser context.** Killed by Chrome's architecture: cookies and localStorage are partitioned per browser context, not per target — two tabs in the default context share `document.cookie` no matter how targets are bookkept, so the "separate cookies and storage" criterion is unsatisfiable at the target level.
- **One Chrome (or user-data-dir) per boundary.** Killed by the criterion's own wording: the boundaries must share "one Chrome"; per-boundary Chromes is the existing default-session behavior and changes the local-profile and resource model the contract freezes.
- **Partition via network interception (rewrite cookies per session with Fetch/Network domains).** Killed by physics of the web platform: localStorage/IndexedDB/service-worker writes never traverse the network layer, so interception cannot separate them; it also collides with the existing proxy-credential and domain-filter interception machinery on overlapping targets.
- **Persist the context id in a new separate per-session file.** Killed by crash-consistency: two rename-written files describing one boundary can desync (binding pins target T while the sibling file names a context that no longer contains T); `tab_binding.rs` already provides the single atomic, fsynced, restart-surviving record for exactly this class of state.

## Proposer B: OpenAI GPT-5.6-sol, high effort

The following response is preserved verbatim.

### Shape

Add explicit, sticky `--isolate-context` mode for named CDP and auto-connect sessions. Existing non-isolated and shared-login workflows remain unchanged.

Extend the existing `{session}.target` sidecar with optional, backward-compatible isolation state:

- Browser fingerprint
- Primary `browserContextId`
- Set of owned context IDs
- Existing `targetId`, URL, and `pinned` fields remain authoritative

`DaemonState` chooses isolation mode and persists lifecycle state. `BrowserManager` owns context creation, scoped target creation, and the ownership predicate: a target is visible only when its `browserContextId` belongs to the boundary. Owned top-level sessions use related-target auto-attach for popups, workers, and iframes instead of browser-wide attachment.

`tab new` creates targets in the primary context. Features intentionally creating another context, such as `window new` and recording, register that context as owned. State-save temporary targets use the active owned context.

Reconnect validates the browser fingerprint, verifies the saved context still exists, discovers only its targets, and restores the existing target binding and pin semantics. It never falls back to another context. If Chrome restarted, a fresh context is created without touching surviving foreign targets.

Closing an attached boundary calls `Target.disposeBrowserContext` only for its owned contexts. It never calls `Browser.close` or individually closes foreign targets. The resulting contract is: an isolated boundary exclusively owns every storage partition and target it exposes from creation until disposal.

### Predictions

- `cd cli && cargo test e2e_isolated_cdp_storage -- --ignored --test-threads=1` will prove the design false if two `--session` values using `--cdp 9222 --isolate-context` can observe each other’s same-origin cookie, localStorage, sessionStorage, IndexedDB, or cache value.
- `cd cli && cargo test e2e_isolated_cdp_target_lifecycle -- --ignored --test-threads=1` will prove it false if creating a popup in boundary B changes `agent-browser --session a tab list --json`, if reconnecting A binds B’s `targetId`, or if closing A removes any target whose `browserContextId` belongs to B.
- Measuring `Target.getTargets` before and after `agent-browser --session a close` will prove it false if any B-owned target disappears, or if any A-owned target remains after A’s context disposal.

### Cost

Primary files:

- `cli/src/native/browser.rs`: context ownership fields, filtered discovery, scoped creation, reconnect, and disposal
- `cli/src/native/actions.rs`: isolation selection, event filtering, auto-attach changes, `window new`, recording, and teardown
- `cli/src/native/tab_binding.rs`: optional isolation manifest and atomic persistence
- `cli/src/native/state.rs`: context-scoped temporary targets
- `cli/src/native/cdp/types.rs`: browser-context request and response types
- `cli/src/flags.rs`, `cli/src/main.rs`, `cli/src/output.rs`, `cli/src/mcp.rs`: CLI and MCP parity
- `cli/src/native/e2e_tests.rs` and `parity_tests.rs`: storage, ownership, reconnect, close, legacy, and pin coverage
- README, core skill references, and docs pages required by repository policy

New fields include isolation mode, browser fingerprint, primary context ID, and owned context IDs.

Initial attach adds one context-creation round trip, followed by existing target creation and attachment. Reconnect adds context enumeration and target discovery. Close adds one disposal round trip per owned context.

Existing state JSON files require no migration. Existing `.target` files deserialize as non-isolated. Future maintenance must ensure every target-producing feature registers its context and every browser-wide CDP event is ownership-filtered.

### What it makes worse

Isolated sessions cannot automatically see the attached Chrome profile’s existing login. Each context also consumes additional Chrome memory, and losing the sidecar can orphan an incognito context until Chrome exits. Browser-wide features such as downloads and permissions must be reapplied per context.

### Rejected alternatives

- Target binding alone: target IDs separate tabs, but same-context cookies and origin storage remain shared.
- Saving and restoring cookies around commands: pages, workers, IndexedDB, cache, and background requests continue concurrently, so ownership is never exclusive.
- Filtering only `tab list`: browser-wide discovery and auto-attach can still attach, pause, adopt, or close foreign targets.
- Tracking ownership only by target ID: popups and workers create targets asynchronously, making registry updates race-prone, while storage remains shared.
- Automatically isolating every named CDP session: this breaks existing workflows that deliberately attach multiple sessions to one logged-in profile.
- Separate profile directories: Chrome cannot provide independent profile storage partitions inside the same running browser through this workflow, and it would alter local profile behavior.
- Closing owned targets individually: incomplete discovery can leave orphan targets, while mistaken adoption can destroy another boundary’s targets. Context disposal is the atomic ownership primitive.
