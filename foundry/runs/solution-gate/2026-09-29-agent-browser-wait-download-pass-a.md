# Shaping pass A: `wait --download` (agent-browser @ d01253d9)

Blind, read-only. Every mechanism claim is tagged **observed** (file:line), **inferred**, or **guessed**. Paths are relative to `cli/src/`.

## 0. Investigation of unknowns

### U1: Can a download that finished before the command be recovered from anything the daemon keeps?

**No, on base. Nothing retains download events.**

- `handle_waitfordownload` calls `mgr.client.subscribe()` at command time (observed, `native/actions.rs:11013`). `subscribe()` is `broadcast::Sender::subscribe` (observed, `native/cdp/client.rs:530-532`). A tokio broadcast receiver only sees messages sent after it was created, so any `downloadProgress` emitted before line 11013 is invisible to this handler (inferred from tokio semantics; consistent with F6).
- The daemon does hold a long-lived receiver, `DaemonState.event_rx`, created at browser attach (`subscribe_to_browser_events`, observed `actions.rs:822-826`, wired at `4128, 4171, 4228, 4295`). Channel capacity is 4096 (observed, `cdp/client.rs:254`).
- That receiver is consumed by `drain_cdp_events` (observed, `actions.rs:1604+`), which is run on a periodic daemon tick (observed, `native/daemon.rs:288, 442`) and inside many handlers (`actions.rs:2729, 3219, 6230, 7544, 8955, 9353, ...`). The drain matches `Target.*`, `Page.frameNavigated/frameDetached`, `WebMCP.*`, `Network.*` for HAR/tracking (observed, `actions.rs:1627-1790`) and any other method falls into `_ => {}` (observed, `actions.rs:1764`) and is dropped. `DrainedEvents` has no download field (observed, `actions.rs:237-258`). `EventTracker` stores only console and error entries (observed, `native/network.rs:580-584`).
- The `download` command's own loop consumes its private receiver and returns (observed, `actions.rs:7770-7840`); nothing is stored on state.
- Session-private routes (`subscribe_session`, `cdp/client.rs:540-548`) divert events with a session id away from broadcast; not used for downloads on base (observed: no callers with download intent).

Conclusion (observed + inferred): R0's "completed before the command" case cannot be satisfied by reading existing state. Any shape must add retention (a background download tracker) or a filesystem fallback.

### U2: Which CDP events carry the final file location or name; do browser-scope events fire for all targets?

From source only, partially answerable:

- Base reads `guid` from `Browser.downloadWillBegin` / `Page.downloadWillBegin` (observed, `actions.rs:7811-7818`) and `state` from `*.downloadProgress` (observed, `7822-7833`). No code reads `suggestedFilename`, `filePath`, or `url` from download events (observed: `grep filePath|suggestedFilename cli/src` hits only `output.rs:1176-1180`, a formatter for a response shape no Rust handler produces).
- `Browser.setDownloadBehavior` is sent two ways: at launch with `behavior: allow`, `downloadPath`, **no `eventsEnabled`**, on the browser session (`None`) (observed, `native/browser.rs:594-603`); and by `download` with `allowAndName`, `eventsEnabled: true`, on the **page** session id (observed, `browser.rs:2207-2221`). Whether `Browser.downloadProgress` fires at all when `eventsEnabled` was never set, and whether setting it on a page session scopes it to that target's browser context, is **not determinable from this repo** (guessed: per CDP docs `eventsEnabled` gates the `Browser.download*` events; `Page.download*` are deprecated but still emitted while `Page` is enabled, which `prepare_domains` does per page session at `browser.rs:839`). Spike S1.
- The "GUID as filename" behavior is only guaranteed under `allowAndName` (observed comment, `actions.rs:7842-7843`). Under `allow` (launch path) Chrome uses the suggested filename, so the final path is `<downloadPath>/<suggestedFilename>` and base has no code capturing that name (inferred). The completed `Browser.downloadProgress` may carry `filePath` on current Chrome; unverified here. Spike S1.
- Session matching: base already accepts browser-domain events regardless of session and page-domain events only when session matches the active page (observed, `actions.rs:11024-11028`, `7803-7809`). Popups get their own page session via `Target.setAutoAttach` flatten (observed, `browser.rs:819-823, 859-863`), cross-origin iframes get sessions tracked in `iframe_sessions` (observed, `actions.rs:590-595`). A download started from an iframe would emit `Page.downloadWillBegin` on the iframe session, which the `is_page_session` check rejects (inferred). Whether the `Browser.*` variant fires for it is Spike S1.

### U3: Remote/cloud browsers

- Remote attach is detectable: `is_cdp_connection()` = `browser_process.is_none()` (observed, `browser.rs:1409-1411`); provider direct-page mode via `is_direct_page_connection()` (observed, `browser.rs:1413-1415`), where the single page has `session_id: String::new()` (observed, `browser.rs:652-660`) and domains are enabled with `None` session (observed, `browser.rs:988-1006`). In direct-page mode `active_session_id()` returns `""` (observed, `browser.rs:1009-1015`) and events from the proxy likely carry `session_id: None`, so `is_page_session` is false and only `Browser.downloadProgress` can ever match (inferred).
- `download` does `create_dir_all` and `rename` on the daemon's filesystem (observed, `actions.rs:7744-7746, 7853-7855`); against a remote browser this silently targets the wrong disk. Base has no guard. Any path-placing shape must either refuse (R2) or fetch bytes via CDP. No CDP file-fetch mechanism exists in the repo (observed: no `IO.read` / `Browser.downloadProgress` stream usage; `grep -rn "IO.read" cli/src` not attempted here; mark inferred). Spike S3.

### U4: More than one pending download; which one to report

- Base `download` tracks a single `Option<String>` guid and breaks on the first `completed` from any matching download (observed, `actions.rs:7786, 7826-7829`). Base `wait --download` returns on the first `completed` of any download (observed, `11030-11039`). So with two concurrent downloads, either handler can attribute the wrong completion (inferred). The daemon runs one command at a time (F5, packet; consistent with a single `state.lock()` per command at `daemon.rs:279-553`), but the browser can have several downloads in flight from one click (guessed: e.g. `<a download>` inside a loop).
- Decision needed from the owner; I do not fabricate a rule. Candidate: `wait --download` targets the most recent `downloadWillBegin` that has not been consumed by a previous `wait`/`download`, and completion is matched by guid. Marked **undecided** (R6).

## 1. R table

| R | Requirement | Status | Source |
|---|---|---|---|
| R0 | After a command triggers a download, a later `wait --download` returns success once it completes, including when it completed before the command was sent | Core goal | packet |
| R1 | On success with `<path>`, the file exists at `<path>` and the reported path is where the file is | Must-have | packet |
| R2 | When no file can be placed or found, the command fails; never reports success for a missing file | Must-have | packet |
| M1 | `download <selector> <path>` behavior and output unchanged | Must-have | packet |
| M2 | Launch-time download path keeps working for downloads not awaited with a path | Must-have | packet |
| M3 | `wait --download` with no path keeps succeeding on completion | Must-have | packet |
| M4 | Page-domain events stay session-matched | Must-have | packet |
| M5 | Timeout behavior and error for "no download at all" stays a timeout error | Must-have | packet |
| R3 (derived) | The daemon retains download lifecycle events (`willBegin`, `progress`) independently of whether a `wait` is pending, because nothing on base does (U1; `actions.rs:1764`, `237-258`) | Must-have | derived from U1 |
| R4 (derived) | `wait --download <path>` against a browser whose filesystem is not the daemon's must fail with an explicit error rather than report a path (R2 + U3; `browser.rs:1409-1415`) | Must-have | derived from R2, U3 |
| R5 (derived) | The download directory the browser actually writes to must be known to the daemon before the trigger command runs, or the daemon must learn the final path from the completion event; otherwise R1 cannot be met (F4, `browser.rs:594-603`) | Must-have | derived from F4, U2 |
| R6 | With more than one download in flight, which one `wait --download` reports | Undecided | U4 |
| R7 (derived) | Retained download records must be bounded and consumed so a stale completed download is not returned by an unrelated later `wait --download` | Leaning yes | derived from R3 |
| R8 | Whether `wait --download` should also cover downloads triggered from iframe sessions | Undecided | U2 |

## 2. Shapes

### CURRENT (baseline, for reference)

| Part | Mechanism | Flag |
|---|---|---|
| C1 | Lazy `subscribe()` at command time, loop until any `completed` progress, echo `cmd.path` (`actions.rs:11008-11046`) | |
| C2 | `output.rs:1280` prints "Download saved to {path}" for the echoed path | |

Fails R0 (pre-completed), R1, R2 by construction.

### Shape A: Always-on download tracker + eager `allowAndName` at launch, move on `wait`

State ownership: a new `downloads: DownloadRegistry` on `DaemonState` (guid -> record), filled by a background task. Lifecycle: from browser attach to close. Boundary: the daemon owns the download directory for the whole session.

| Part | Mechanism | Flag |
|---|---|---|
| A1 | `start_download_tracker()` spawned alongside `start_fetch_handler`/`start_dialog_handler` at `actions.rs:4128-4130, 4171-4173, 4228-4230, 4295`: a `client.subscribe()` task that records `*.downloadWillBegin` (guid, suggestedFilename, url, session_id) and updates state on `*.downloadProgress` into `Arc<Mutex<DownloadRegistry>>`; page-domain events keep the session filter (M4) | |
| A2 | At every attach point, after `prepare_domains`, send `Browser.setDownloadBehavior { allowAndName, downloadPath: <dir>, eventsEnabled: true }` where `<dir>` = launch `download_path` (`browser.rs:402, 594`) if set, else a daemon-owned temp dir (`<session tmp>/downloads`) | ⚠️ (interaction with M2: `allowAndName` renames files to GUIDs, which changes what a user finds in their `--download-path` dir; and remote/provider sessions, U3) |
| A3 | `handle_waitfordownload`: look up registry for a candidate (R6 rule); if already `completed`, skip waiting; else wait on a registry `Notify` until completed or timeout (M5 error text unchanged) | |
| A4 | If `cmd.path` given: `rename(<dir>/<guid>, <path>)` with the same 10x100ms flush wait as `download` (`actions.rs:7845-7852`), then `exists()` check; error otherwise (R2). If no path: return `{ "path": <dir>/<guid or suggestedFilename> }` (M3) | |
| A5 | Guard: if `mgr.is_cdp_connection()` or `is_direct_page_connection()` and `cmd.path` given → `Err("remote browser filesystem; use download-path on the remote side")` (R4) | |
| A6 | Registry bounded (e.g. drop records once consumed by `wait`/`download`, plus a cap) (R7) | |
| A7 | `download` handler keeps its own loop (M1) but could also consume the registry record so a later `wait --download` does not re-report it (R7) | |

Risk: A2 changes M2 semantics (GUID filenames in user's dir when not awaited). Mitigation variant A2': keep `allow` when a user download path is set and rely on final filename from the completion event (needs S1). That makes A2 depend on S1.

### Shape B: Always-on tracker, no behavior change at launch, filesystem placement from event metadata

State ownership: same `DownloadRegistry` (B1 = A1). Lifecycle: same. Boundary: the daemon never sets download behavior outside `download`; it discovers where Chrome wrote the file.

| Part | Mechanism | Flag |
|---|---|---|
| B1 | = A1 tracker | |
| B2 | On attach, send `Browser.setDownloadBehavior` only with `eventsEnabled: true` plus the existing behavior (`allow` + launch path if set, else `default`), so events flow without renaming (M2 intact) | ⚠️ (whether `behavior: "default"` with `eventsEnabled` is accepted, and whether Chrome then reports a final path; S1) |
| B3 | `handle_waitfordownload` = A3 | |
| B4 | Final source path = `filePath` from completed `Browser.downloadProgress` if present; else `<launch download_path or ~/Downloads>/<suggestedFilename>` | ⚠️ (existence of `filePath`; default dir discovery is platform-dependent, no source in repo) |
| B5 | If `cmd.path` given: `rename`/copy from B4 path to `<path>`, `exists()` check, error otherwise (R2). Cross-device rename fallback to copy+remove | |
| B6 | = A5 remote guard | |
| B7 | = A6 bounding | |

### Shape C: Pre-arm at `wait` time only (no tracker), arm-then-drain

State ownership: none new; the `wait` command arms behavior and drains the broadcast. Boundary unchanged from CURRENT.

| Part | Mechanism | Flag |
|---|---|---|
| C1 | `handle_waitfordownload` sets `allowAndName` to `parent(<path>)` then subscribes and waits, renames guid like `download` | |
| C2 | Pre-completed case: scan `parent(<path>)` (or launch dir) for a file newer than the previous command's `last_command_finished` (`actions.rs:564`) | ⚠️ (heuristic; wrong file possible) |

Physically cannot satisfy R0 for downloads that began before the command (U1: the events are already gone, `actions.rs:1764`) and cannot satisfy R1 for a download that Chrome already routed to ~/Downloads before C1 changed behavior. Included to show why a tracker is required, not as a candidate.

## 3. Fit check (binary)

| R | A | B | C |
|---|---|---|---|
| R0 | ✅ (A1+A3) | ✅ (B1+B3) | ❌ events before command are dropped (`actions.rs:1764`); C2 is a flagged heuristic |
| R1 | ❌ A2 flagged: remote/provider sessions and `allowAndName` semantics unverified (S1, S3) | ❌ B2/B4 flagged: final path source unverified (S1) | ❌ download already routed to default dir before arming (F4) |
| R2 | ✅ (A4 exists check + A5) | ✅ (B5 + B6) | ❌ C2 can return a wrong existing file |
| M1 | ✅ `download` handler untouched except optional registry consume (A7) | ✅ | ✅ |
| M2 | ❌ A2 renames files to GUIDs in the user's `--download-path` when no `wait` consumes them, changing observed behavior | ✅ B2 keeps `allow` + path | ✅ |
| M3 | ✅ A4 no-path branch | ✅ B3 | ✅ |
| M4 | ✅ tracker keeps `is_page_session` filter (`actions.rs:11024-11028` pattern) | ✅ | ✅ |
| M5 | ✅ A3 keeps "Timeout waiting for download" | ✅ | ✅ |
| R3 | ✅ A1 | ✅ B1 | ❌ no retention |
| R4 | ✅ A5 | ✅ B6 | ❌ no guard |
| R5 | ✅ A2 fixes dir before trigger (when flag resolves) | ❌ B4 relies on event metadata (flagged) | ❌ |
| R6 | ❌ undecided | ❌ undecided | ❌ |
| R7 | ✅ A6 | ✅ B7 | ❌ |
| R8 | ❌ undecided | ❌ undecided | ❌ |

## 4. Recommendation

**Recommended: Shape A with variant A2'** (tracker + daemon-owned download dir). Reasoning: R0 is only satisfiable by retention (U1 proved from `actions.rs:1604-1790`, `237-258`), and R1/R5 are most robust when the daemon decides the directory *before* the trigger, mirroring the already-working `download` handler (`actions.rs:7767, 7842-7855`) instead of reverse-engineering where Chrome put the file. The M2 fail is the one real cost: resolve it by scoping `allowAndName` to the case where no user `--download-path` is set (use a daemon temp dir), and when a user path is set keep `allow` and depend on S1 for the final filename. If S1 shows the completed `Browser.downloadProgress` carries `filePath`, A converges toward B for the user-path case and M2 passes.

**Rejected:**
- Shape B: keeps M2 clean but makes R1 hinge entirely on event metadata that base never reads and this repo cannot confirm (U2). If S1 comes back negative, B has no mechanism for R1 at all, while A still has GUID renaming.
- Shape C: proven unable to meet R0 (events gone before subscription) and R1 (F4 ordering). It is the shape the current code already approximates.

**Spikes required before implementation:**
- **S1 (CDP events)**: On the Chrome version agent-browser launches, with (a) no `setDownloadBehavior`, (b) `allow` + path without `eventsEnabled` (launch path, `browser.rs:594-603`), (c) `allow` + `eventsEnabled`, (d) `allowAndName` on a page session: which of `Browser.downloadWillBegin/Progress` and `Page.downloadWillBegin/Progress` arrive, with which `session_id`, and does the completed progress event include `filePath`/`suggestedFilename`? Repeat for a popup target and a cross-origin iframe trigger. Answer lets us fix A2' and decide R8.
- **S2 (scope of `setDownloadBehavior` on a page session)**: does sending it with a page `sessionId` (as `browser.rs:2208-2217` does) apply to the whole browser or only that target's context, and does it persist across navigations and new tabs? Determines whether A2 needs re-sending on every attach (`actions.rs:4128, 4171, 4228, 4295`) or once.
- **S3 (remote/provider)**: for `--cdp` and direct-page provider connections (`browser.rs:612-660`), confirm download events arrive with `session_id: None`, and record what behavior the provider allows for `setDownloadBehavior`. Answer fixes A5's guard and error text.
- **S4 (owner decision, not a spike)**: R6 selection rule and R8 iframe coverage.
