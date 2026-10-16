# Solution gate: agent-browser `wait --download` (#561, #1300)

- Base: vercel-labs/agent-browser `d01253d9`. Mode: candidate audit (#2023 @ `2fb5863`, #1507, #1858, #664, #562), profile `external-pr`.
- Proposers: pass A `fable` (native subagent), pass B `sonnet` (native subagent). Synthesizer: `claude-opus-5.5` (proposed neither).
- `execution_mode: native_subagent`, `degraded_from: fx_worker`, `schema_failures: 0`. FX `gpt-5.6-sol` pass failed before running: `fx status` reported `auth: missing` (a stored API key is selected in fx config, overriding `AI_GATEWAY_API_KEY`). `independence_gap`: both proposers are Anthropic models.
- Session restart mid-run cleared `/tmp`; both passes resumed from transcript with output moved to a persistent dir. Packet unchanged (copied from the worktrees).

## Frozen contract
R0 late wait sees a finished download. R1 file exists at `<path>` and the report matches. R2 never report success for a missing file. M1 `download` unchanged. M2 launch download path unchanged. M3 no-path wait succeeds. M4 page events stay session-matched. M5 no download stays a timeout.

## Observed behavior (evidence only)
| ID | Command | Result |
|---|---|---|
| P1 | 0.38.0: click, wait 2s, `wait --download /tmp/out561.bin` | prints "Download saved to /tmp/out561.bin"; file absent; file in `~/Downloads` |
| P2 | 0.38.0: click, sleep 0, `wait --download` | success after 3s (download still in progress); prints "Download saved to download" |
| P3 | 0.38.0: click, sleep 5, `wait --download --timeout 4000` | timeout |
| P4 | raw CDP, Chrome 154, no behavior set | only `Page.download*`; completed has no `filePath` |
| P5 | `allow` without `eventsEnabled` (current launch config) | only `Page.download*`; no `filePath`; file keeps real name |
| P6 | `allow` + `eventsEnabled` | `Browser.download*` too; completed carries `filePath` = real path, real name |
| P7 | `allowAndName` + `eventsEnabled` | `filePath` = GUID-named file |
| P8 | `allowAndName` + `eventsEnabled` sent on page session | `Browser.*` events delivered with that page sessionId |
| P9 | `default` + `eventsEnabled` | file stays in `~/Downloads`; `filePath` reports it, including Chrome's collision rename `big (1).bin` |
| P10 | source actions.rs drain | no download arm; events fall to the catch-all; `subscribe()` in `handle_waitfordownload` sees only later events |

## Proposed shape (argument, not evidence)
Both blind passes converged on a ledger shape. Selected, after probes:
1. At browser attach (and on relaunch/reconnect), re-send the current download behavior with `eventsEnabled: true`: `default` when no download path is configured, `allow` + the path otherwise (P6, P9: location and names unchanged). `inferred` for new contexts from `window new`.
2. The drain records `Browser.downloadWillBegin`/`downloadProgress` into a per-daemon ledger keyed by guid: state, `filePath`, completion time. Cleared on browser close/relaunch. `observed` that the events carry what is needed (P6, P9).
3. `wait --download [path]` claims the oldest unclaimed completed record, else waits for the next one. With `<path>`: resolve against the caller cwd, create the parent, move `filePath` there, verify it exists, report `<path>`. Without a path: report the real `filePath`. No `filePath` (older engines, remote browsers): error, never a fake path.

Transition table: ledger lifetime = one browser instance; omission of `path` means "leave in place", not "discard".

## Candidate reveal
- #2023: completed-guid buffer in the drain, consumed set, `take_completed_download`. Fixes R0 only; R1/R2 still fail (returns the requested path without moving). TTL 60s and cap 16 have no stated authority.
- #1507: sets `allowAndName` at wait time, then renames. The download was triggered by an earlier command (serial daemon, P3), so the behavior arrives too late; fails R0 by design. Rejected mechanism.
- #1858: browser-scope `setDownloadBehavior`. Independent of this contract (P8 shows page-session delivery works). Left open.
- #664, #562: remove TypeScript files that no longer exist. Obsolete.

## Failure catalog
- S5 unregistered peer: ledger must reset on relaunch and be invisible across daemons. Designed in (lifetime = browser instance).
- S6 peer-version: `filePath` absent on older Chrome or other engines. Designed out by R2 error, not a guessed path.
- S7 wrong layer: `eventsEnabled` must be re-applied on reconnect and possibly per browser context. Carried assumption A1.
- S13 omission vs removal: no-path wait leaves the file and reports its real location. Designed in.
- S1 over-reach: enabling events on a user's own Chrome (`--auto-connect`) changes no location (P9). Accepted.

## Verdict
**Pass to detail.** Candidate verdicts: #2023 **absorb and recreate** (ledger idea, credit @WianBroes); #1507 **reject** mechanism (thank @justjavac, #1300 scope); #1858 unaffected; #664 and #562 obsolete.

Owner decisions carried: which download `wait` reports when several are pending (proposed: oldest unclaimed completed); whether iframe and popup downloads are in scope.
Carried assumptions for implementation and Review Gate: A1 new browser contexts inherit `eventsEnabled` or need it re-sent; A2 remote/provider browsers produce a `filePath` that is not on the daemon's disk and must error.
Review Gate must-not-change set: M1-M5 plus P9 location invariance.

## Implementation receipt
- Owner decisions (Hunter, 2026-09-29): oldest unclaimed finished download; iframe and popup downloads included (browser-wide events, order-based claim).
- PR vercel-labs/agent-browser#2027, head `fee506c0`, branch `railly/wait-download-ledger`.
- Found during implementation and designed in: provider (`direct_page`) connections emit only `Page.*` events, so the ledger also records them; `Page.downloadProgress` completes before `Browser.downloadProgress` carries `filePath`, so once any `Browser.*` event is seen only `Browser.*` can finish a record.
- Observed, pre-existing, not addressed: with `--download-path`, Chrome `allow` overwrites same-named downloads (two clicks, one `big.bin`, same `filePath`); the second wait now fails instead of reporting success. Docs say downloads without `--download-path` go to a temporary directory; observed location was `~/Downloads`.
