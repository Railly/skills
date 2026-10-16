# Blind shaping pass B: `wait --download` (agent-browser @ d01253d9)

Labels: **[O]** observed in source (file:line, cli/src/native unless noted), **[I]** inferred, **[G]** guessed / needs spike.

## 1. Investigation of unknowns

**Baseline mechanism**
- `handle_waitfordownload` subscribes at command time (`mgr.client.subscribe()`, actions.rs:11013), loops on the receiver, accepts `Browser.downloadProgress` (any session) or session-matched `Page.downloadProgress` with `state == "completed"` (11025-11031), and returns the requested path string or the literal `"download"` (11032-11036). No file I/O anywhere in it. [O]
- The CLI parser passes `path` as-is (cli/src/commands.rs:778-790), relative paths untouched; the daemon has its own cwd (compare 7729-7734, which joins to `current_dir`). [O]

**U1: recover a download that finished before the command?**
- The daemon keeps one persistent receiver, `event_rx` (actions.rs:571, subscribed at 824), drained by `drain_cdp_events` (1604+) on a tick (daemon.rs:278, 433-442) and before many commands (call sites 2729, 3219, 6230, 7544, 8955, 9353, ...). [O]
- The drain handles Target.*, Network.*, screencast, etc. No `download` match appears in the drain region; the only download references in actions.rs are at 7811-7873 and 11027-11028. So download events reach the drain and are dropped. [O, by grep over actions.rs]
- Broadcast capacity is 4096 (cdp/client.rs:254); a `Lagged` receiver in `wait` just `continue`s (11041), silently skipping events. [O]
- Conclusion: nothing is retained today, but the drain (or a new dedicated subscriber) is the natural place to record. Recovery works only for downloads that occur after a recorder exists; it cannot recover downloads from before the browser was attached. [I]
- The tick takes `state.lock()` (daemon.rs:279), and F5 is consistent with a mutex around command execution (daemon.rs:553 shows the lock; that it is held for the whole command is [I]). A drain-arm recorder would see a completion only on the next tick or pre-command drain; not every command drains first [G]. A dedicated task with its own `subscribe()` (pattern at actions.rs:824-835) avoids that race. [I]

**U2: which events carry file identity?**
- `downloadWillBegin` is used only for `guid` (actions.rs:7811-7821). No code reads `suggestedFilename`, `filePath` or `url` from download events (grep in cli/src finds only an unrelated output.rs:1176 hit). [O]
- From CDP protocol knowledge: `downloadWillBegin` has `guid`, `url`, `suggestedFilename` (+ `frameId` on Page); `downloadProgress` has `guid`, `totalBytes`, `receivedBytes`, `state`, and on recent Chrome an optional `filePath` on completion. [G: protocol memory, not in this repo; spike S1]
- Browser-domain events only fire if `eventsEnabled: true`. `set_download_behavior` sets it (browser.rs:2211-2216) but the launch-time call does not (browser.rs:594-600: `{behavior:"allow", downloadPath}`), so with `--download-path` set, Browser-domain events may never be emitted [I: protocol default false; effect G]. In F4 no behavior was set and completion was still seen, so Page-domain events (Page.enable issued, browser.rs:839, 990) flow without it. [I]
- `set_download_behavior` sends `Browser.setDownloadBehavior` with the page's session id (browser.rs:2207-2219) and `handle_download` (7721-7913) never restores the prior behavior. So after any `download` command the session stays `allowAndName` in that dir and later downloads land as bare GUID files. [O for no reset; I for persistence]. The changelog says launch behavior originally applied only to the default context (docs/src/app/changelog/page.mdx:675). [O]
- Popups/iframes/other tabs: Page-domain events are filtered to the active session only (11028, 7819). Browser-domain events are unfiltered. A download from a popup or a no-longer-active tab is invisible on the Page path. [O filter; I consequence]

**U3: remote/cloud browsers**
- `handle_download` does `create_dir_all` and `std::fs::rename` on the daemon's filesystem (7736-7743, 7847-7852) and sends that path to the browser as `downloadPath`, silently assuming a shared FS. Connection kinds `cdp`/`provider`/`auto_connect` are distinguishable (actions.rs:331-357). [O]
- For a remote browser the file is unreachable through any CDP download event; getting content would need another channel (Fetch/IO, in-page fetch). [G; spike S4]
- `auto_connect` to a local Chrome shares the FS but the browser was not launched by us and has its own download behavior. [I]

**U4: multiple pending downloads**
- `wait` returns on the first `completed` from any allowed source (11031-11036), with no guid correlation and no "started after the command" filter. [O] `download` keeps only the last guid seen (7818-7820), so concurrent downloads are mis-attributed even there. [O]
- With one command at a time (F5), a ledger with a claim flag gives a deterministic rule. Which rule is undecided (R7).

## 2. Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | After a command triggers a download, a later `wait --download` succeeds when it completes, including when it completed before the wait was sent | Settled |
| R1 | On success with `<path>`, the file exists at `<path>` and the reported path is where the file is | Settled |
| R2 | If no file can be placed or found, fail with an error; never report success for a non-existent file | Settled |
| M1 | `download <selector> <path>` behavior/output unchanged | Settled |
| M2 | Launch-time download path keeps working for downloads not awaited with a path | Settled |
| M3 | `wait --download` with no path keeps succeeding on completion | Settled |
| M4 | Page-domain events stay session-matched | Settled |
| M5 | "No download at all" stays a timeout error | Settled |
| R3 | A relative `<path>` resolves against the CLI caller's cwd, not the daemon's, as `download` does (7729-7734) | Derived: R1; commands.rs:778-790 passes the raw string [I: daemon cwd may differ] |
| R4 | Missing parent dirs of `<path>` are created, as in `download` (7743) | Derived: parity with F2; otherwise R1 fails for new dirs |
| R5 | Pathless `wait --download` reports the real file location when known (not the literal `"download"`) | Derived: R2 spirit + F8. Must not fail if unknown (M3). Payload change undecided |
| R6 | Download attribution across tabs/popups: a completed download from any tab in the same browser counts for `wait` | Undecided (M4 forbids attributing other sessions' Page events; Browser events are unscoped) |
| R7 | With several downloads available, `wait` reports a deterministic one and never the same one twice | Undecided (U4); candidate: oldest unclaimed |
| R8 | Remote browsers: fail clearly (R2) rather than mis-report when the file is not on the daemon's FS | Derived: R2 + U3 |
| R9 | A failed move leaves the source untouched and errors | Derived: R2 |
| R10 | Downloads that began before a recorder existed are out of scope | Derived: U1 [I] |

## 3. Shapes

### A: Daemon ledger + daemon-owned download dir, move on wait
State owner: daemon (in-memory ledger). Chrome writes files to a daemon-known directory.

| Part | Mechanism | Flags |
|---|---|---|
| A1 | Recorder: a dedicated `client.subscribe()` task (pattern actions.rs:824) or a new arm in `drain_cdp_events` (1604+) recording `downloadWillBegin` (guid, url, suggestedFilename, session) and `downloadProgress` (state, filePath) into `DaemonState.downloads` | Drain race, lag (cdp/client.rs:254) [I] |
| A2 | Arm at launch/attach: with no user path, `Browser.setDownloadBehavior{allowAndName, downloadPath:<daemon temp dir>, eventsEnabled:true}`. With a user path (M2), keep `allow` at that path but add `eventsEnabled:true` (browser.rs:594-600) | Effect of eventsEnabled on `allow` [G, S1]; new contexts must re-apply (browser.rs:401-402) |
| A3 | `wait --download [path]`: first take an unclaimed `completed` record from the ledger; else wait live for a new one (existing loop 11013-11045); mark claimed | U4 rule |
| A4 | Locate file: `<dir>/<guid>` (allowAndName) or `filePath` from the event; poll briefly like 7838-7845; else error (R2) | `filePath` availability [G, S1] |
| A5 | If a path is given: resolve against caller cwd (parser change, R3), mkdir (R4), rename; copy+remove on cross-device failure [I: `fs::rename` fails across devices] | Parser change at commands.rs:778-790 |
| A6 | Return the real final path (or the real located path when none requested) | R5 payload |
| A7 | `handle_download` unchanged (M1); the recorder must mark its guid claimed so `wait` cannot re-report it | Interaction [I] |
| A8 | Guard: if connection is non-local (actions.rs:331-357), skip file ops and return a clear error when a path is requested | R8 |

### B: Stateless filesystem reconciliation at wait time
State owner: filesystem. No ledger; `wait` keeps today's lazy subscription plus directory scans.

| Part | Mechanism | Flags |
|---|---|---|
| B1 | Keep lazy subscribe (11013); on entry scan candidate dirs (configured download path, else OS default Downloads) for files newer than some reference time | Default dir per OS [G]; no "last command time" tracked in what I read [G] |
| B2 | On live `completed`, pick the newest file in candidate dirs | Cannot attribute a file to a download [I] |
| B3 | Move/copy to `<path>`; error if none | `.crdownload`, collision renames like "name (1)" [G] |

### C: Command-scoped arming (trigger commands own the capture)
State owner: the trigger command. Each page-mutating command arms a capture before acting and stores the resulting guid; `wait --download` claims it.

| Part | Mechanism | Flags |
|---|---|---|
| C1 | Generalize `handle_download` (7721) into an `arm_download_capture()` helper called before interaction commands (click, press, eval, ...): sets allowAndName to a temp dir and subscribes | Touches many handlers; changes global Chrome behavior per click; conflicts with M2 |
| C2 | Keep the captured record until `wait --download` or next arming | Expiry undecided |
| C3 | `wait` claims the record and moves the file | as A4-A5 |

## 4. Fit check (R x Shape)

| Req | A | B | C |
|---|---|---|---|
| R0 pre-completed | Pass | Fail: only mtime heuristics; cannot tell which file belongs to the trigger | Pass, only for downloads started by an arming command |
| R1 file at path | Pass (A4-A5) | Fail: cannot prove the located file is the download | Pass |
| R2 error, not false success | Pass (A4 existence check, A5 errors) | Fail: "newest file" can be unrelated | Pass |
| M1 | Pass if A7 done | Pass | Fail: C1 rewrites `handle_download` into a shared helper; large blast radius |
| M2 | Pass conditionally: user path stays `allow` (A2), so files keep original names and A4 needs `filePath` or a name match. Fails if `filePath` is absent (S1) | Pass | Fail: arming overrides launch behavior on every command |
| M3 | Pass | Pass | Pass |
| M4 | Pass: recorder stores session id; Page events recorded only for tracked sessions, Browser events unscoped as today | Pass | Pass |
| M5 | Pass: empty ledger + no live event falls into existing timeout (11017-11019) | Pass | Pass |
| R3 cwd | Pass (parser change) | Pass | Pass |
| R4 mkdir | Pass | Pass | Pass |
| R5 real path | Pass | Fail: no reliable identity | Pass |
| R6 cross-tab | Pass if Browser events enabled (A2); popups depend on S3 | Fail: undefined | Fail: capture bound to the arming session |
| R7 determinism | Pass (claim flag, ordering) | Fail | Pass for one record, but loses concurrent downloads |
| R8 remote | Pass (A8) | Fail: scans the wrong FS | Pass with the same guard |
| R9 failed move | Pass | Fail | Pass |
| R10 | Pass | n/a | Pass |

## 5. Recommendation

**Shape A.** Record download events in the daemon from browser attach onward (dedicated subscriber preferred over a drain arm), enable Browser-domain events, resolve the real file through `filePath` or the GUID name in a daemon-owned dir, and move it on `wait --download <path>`, failing with an error when the file cannot be found or the browser is remote. It is the only shape that meets R0, R1 and R2 together while leaving `download` untouched (A7).

**Rejected**
- B: filesystem heuristics cannot attribute a file to a download, so R1/R2 fail by construction, and the default Downloads dir is OS-specific (F4 shows `~/Downloads`).
- C: changes browser-wide download behavior on every command, violates M1/M2, and ties capture to one session (R6).
- Only moving `~/Downloads/<name>` at wait time: does not address R0 and still guesses the file.

**Left undecided for the owner:** R5 payload change, R6 scope, R7 ordering (oldest unclaimed vs newest), recorder as drain arm vs own task.

## 6. Required spikes (before implementation)

- **S1: CDP payloads on current Chrome.** Real Chrome with (a) no behavior, (b) launch `allow`+path, (c) `allowAndName`+eventsEnabled: capture raw Browser and Page `downloadWillBegin`/`downloadProgress`; check `guid`, `suggestedFilename`, `filePath`, on-disk name, whether Browser events fire when `eventsEnabled` is omitted (browser.rs:594-600), and collision naming under `allow`.
- **S2: pre-completion timing.** Trigger a download with `click`, wait past completion, then run `wait --download` on a recorder prototype; confirm the recorder sees it despite the state lock (daemon.rs:279) and that broadcast lag does not drop it.
- **S3: multi-target coverage.** Downloads from a popup, an inactive tab, a cross-origin iframe, and a second context (`window new`, actions.rs:11048+): which domain/session delivers them, and whether `Browser.setDownloadBehavior` with a page session id (browser.rs:2207) is browser-wide or context-scoped.
- **S4: remote/provider.** With `--cdp` to a browser on another FS or a provider, confirm what `downloadPath` means, that `filePath` is unreachable, and that the daemon can detect the case (actions.rs:331-357).
- **S5: `download` interplay.** After `download <sel> <path>`, confirm the session stays `allowAndName` (no reset in 7721-7913) and that a following click-triggered download is GUID-named; decide whether the recorder double-claims `download`'s guid.
- **S6: cross-device and Windows rename** for final placement (A5).
