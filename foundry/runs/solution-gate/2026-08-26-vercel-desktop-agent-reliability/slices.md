# Coding-agent reliability slices

## Slice summary

| # | Slice | Mechanism | Demo |
|---|---|---|---|
| V1 | CLI stable shared block | G1-G4, G8 | Run CLI dry-run against fixture rc files in either peer order: stdout reports unchanged; repeated apply does not change hash or mtime; missing/changed selected exports remain actionable. |
| V2 | Desktop truthful compatibility | G5-G6, G8 | A legacy CLI fixture shows one Update CLI state and no rotating row Fix buttons; a capable CLI fixture restores truthful green/red rows and separate advisories after model reconstruction. |
| V3 | Repair refresh continuity | G7-G8 | Fix one row, observe all four explicit CLI-agent rows refresh consistently; captured command list never contains `--all`; relaunch-equivalent reconstruction preserves statuses. |

## V1 affordances

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|
| N3 | CLI machine | capability-bearing JSON | emit | → N7 | → N2 |
| N4 | CLI planner | selected exports | call | → N5 | → N3, N10 |
| N5 | CLI apply | ownership-aware in-place merge | transform | → N6, S1 | → N4 |
| N6 | CLI apply | duplicate/malformed guard | validate | → N3 | → N5 |
| N10 | CLI apply | byte-equality no-write gate | call | → S1 | → N9 |
| S1 | shell rc | managed block | persistent | — | → N5, N10 |

## V2 affordances

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|
| U1 | Coding Agents pane | truthful row icon/message | render | — | — |
| U2 | Coding Agents pane | Check | click | → N1 | — |
| U4 | Coding Agents pane | shared update CLI state | render | — | — |
| U6 | Coding Agents pane | advisory text | render | — | — |
| N1 | AppModel | checkAgent | call | → N2 | → U1, U4, U6 |
| N2 | VercelService | previewAgents | call | → N3 | → N1 |
| N7 | VercelService | capability-aware classifier | parse | → S2, S3 | → N1 |
| S2 | AppModel | capability set | ephemeral | — | → N7 |
| S3 | AppModel | row/shared UI states | ephemeral | — | → U1, U4, U6 |

## V3 affordances

| # | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|
| U3 | Coding Agents pane | Fix | click | → N9 | — |
| U7 | Coding Agents pane | peer Fix disabled | render | — | — |
| N9 | AppModel | fixAgent + shared-change branch | call | → N10, N11 | → U1 |
| N11 | AppModel | explicit supported-row refresh | call | → N2 | → N9 |
| S4 | AppModel | active shared repair task | ephemeral | — | → U7, N9 |

## Slice acceptance

- Each slice is independently reviewable and revertible.
- V1 has an observable CLI stdout demo, can ship without Desktop source changes, and fixes standalone CLI idempotence.
- V2 can merge after G4 exists; it safely handles both capable and legacy fixtures.
- V3 depends on V2's status model but does not broaden CLI selection.
- Review Gate receives R0-R10 and the must-not-change set as executable checks.
