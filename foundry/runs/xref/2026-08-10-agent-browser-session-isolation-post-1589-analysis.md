# Session isolation cluster after PR #1589

Checked: 2026-08-10

## PR #1589 accounting

| Classification | Count | Nodes |
|---|---:|---|
| Closed structurally | 3 issues | #1530, #214, #1265 |
| Superseded and closed with credit | 3 PRs | #1426, #1531, #883 |
| Progressed but still open | 6 direct nodes | #326, #896, #86, #1211, #1272, #899 |

PR #1589 merged as `861e76ddf48ea48f4ce5fe0e79dc725b084d0e8b`.

## Root-cause clusters

| Cluster | Root cause | Members | Action |
|---|---|---:|---|
| Persisted tab identity | Sessions sharing one CDP browser lacked a durable selected-target binding | 7 | shipped by #1589 |
| Shared profile singleton | Multiple daemons launch Chrome with the same `user-data-dir`, so Chrome redirects them into one process | 2 | next target |
| Sticky headed/profile launch | Later commands can change the launch fingerprint or let startup tabs replace the active page | 3 | re-reproduce on merged main |
| External CDP restart | An existing daemon keeps the stale browser websocket after Chrome restarts | 2 | independent quick win |
| BrowserContext storage isolation | Tabs share cookies and storage because every session uses the default BrowserContext | 3 | shape before implementation |
| Context/window semantics | Shared-cookie and current-context window requirements pull in different directions | 2 | needs explicit product contract |
| Umbrella reports | Broad multi-session reports combine several mechanisms now tracked separately | 2 | close as resolved/split |

### Persisted tab identity

| Node | State | Verdict |
|---|---|---|
| #1589 | merged | canonical implementation |
| #1530 | closed | fixed by #1589 |
| #214 | closed | fixed by #1589 |
| #1265 | closed | fixed by #1589 |
| #1426 | closed | superseded by #1589, credit @soichisumi |
| #1531 | closed | superseded by #1589, credit @dandaka |
| #883 | closed | superseded by #1589, credit @mvanhorn |

### Shared profile singleton

| Node | State | PR | Verdict |
|---|---|---|---|
| #896 | open | #899 | next target; issue score 51.8 with 15 inbound references |
| #899 | open, conflicting | self | absorb and update on current main, credit @ctate |

The mechanism remains present on merged main: `launch_options_from_env` still passes `AGENT_BROWSER_PROFILE` unchanged. PR #899 is small at +85/-2 across five files, but predates #1589 and needs a fresh compatibility and migration review.

### Sticky headed/profile launch

| Node | State | PR | Verdict |
|---|---|---|---|
| #1211 | open | #1258, #1525 | re-run against merged main before selecting a fix |
| #1258 | open, conflicting | self | its background-target part overlaps #1589 |
| #1525 | open, conflicting | self | broader candidate; includes sticky-profile relaunch state |

#1589 likely removes the event-discovered-tab portion. It does not obviously implement #1525's sticky launch-profile state. The latest issue report also reproduces with `--headed` alone, so the original issue title no longer describes the full input class.

### External CDP restart

| Node | State | PR | Verdict |
|---|---|---|---|
| #1272 | open | #1274 | independent and bounded |
| #1274 | open, conflicting | self | second target after #896; +10/-2 across two files |

This path needs a fresh test against the existing-daemon launch changes from #1589 before absorption.

### BrowserContext storage isolation

| Node | State | PR | Verdict |
|---|---|---|---|
| #1068 | open | #1117, #1340 | high impact, shape first |
| #1117 | open, conflicting | self | smaller implementation, +182/-2 across 14 files |
| #1340 | open, conflicting | self | overlapping broad implementation, +2035/-61 across 13 files |

#1068 has the highest cluster-specific heat at 54.5 and 13 inbound references, but it is a product and lifecycle design rather than a cleanup fix. The two PRs overlap significantly across browser, action, state, output, CLI, README, and docs surfaces.

### Context and window semantics

| Node | State | Verdict |
|---|---|---|
| #1352 | open | asks for shared cookies across isolated sessions, which is not the same contract as #1068 |
| #1624 | open | asks for `window new` in the current context; define interaction with named BrowserContexts |

### Umbrella reports

| Node | State | Verdict |
|---|---|---|
| #326 | open | close as resolved/split: named sessions answer the original collision, #1589 answers shared-CDP tab identity, and remaining mechanisms have dedicated issues |
| #86 | open | close as resolved/answered: runtime isolation uses `--session`, while the latest counterexample incorrectly uses `--session-name` |

## Recommended order

1. #896/#899: absorb the small profile-singleton fix on current main, add real two-session Chrome coverage, and verify profile migration semantics.
2. #1272/#1274: rebase the explicit CDP reconnect behavior and test browser restart with an already-running daemon.
3. Close #326 and #86 with links to the dedicated remaining mechanisms.
4. #1211: re-reproduce headed and profile variants after #1589, then absorb only the still-red sticky-launch portion and close the competing PR.
5. #1068: shape BrowserContext ownership, naming, persistence, disposal, window behavior, and shared-cookie opt-outs before choosing between #1117 and #1340.

## Artifacts

- `2026-08-10-agent-browser-1589-post-merge.json`
- `2026-08-10-agent-browser-session-isolation-post-1589.json`
- `2026-08-10-agent-browser-896-post-1589.json`
- `2026-08-10-agent-browser-1068-post-1589.json`
