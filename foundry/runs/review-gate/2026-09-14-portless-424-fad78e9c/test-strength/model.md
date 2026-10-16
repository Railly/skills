# Hosts safety test-strength model

PR vercel-labs/portless#424; HEAD fad78e9c5e3f1958558eca616d747313e4d4ba60; base 1ad573bb95810daf6cd50c1718707015450f3f09; skill revision 77fdde3e8d7e13b7c27c7660f7c15619839e38af. Both revisions and clean frozen worktree inspected. Full test-strength SKILL.md (77 lines) read. No manifest existed at initial inspection. Parent owns manifest updates; this stage will not edit it.

## Independent contract and dimensions

Oracle: README.md added manual-sync contract, CLI public success/error semantics, and Node synchronous filesystem semantics (read throws vs successful empty-string read; write success does not establish readback success). Expected hostnames and unrelated fixture records must be asserted independently, never via production buildBlock/removeBlock/blockMatchesHostnames.

Dimensions: operation sync(empty | populated) or cleanup; initial read throws | empty readable | readable matching | stale managed block with unrelated records before/after; write fails | succeeds and lands | succeeds without landing; verification readable exact | readable mismatched | throws; CLI root | non-root, escalation success | failure. Entries use reserved .test hostnames, 127.0.0.1 loopback and 192.0.2.10 documentation address. No system hosts access or actual sudo permitted.

| ID | Pre-state + operation / event | Required output and post-state | Smallest falsifier | Existing claimed coverage |
|---|---|---|---|---|
| I-P | initial read throws + populated sync | false; one read; zero writes | coalesce failed initial read to empty | hosts mutation safety |
| I-E | initial read throws + empty sync | false; one read; zero writes | coalesce failed initial read to empty | hosts mutation safety; built CLI root/non-root |
| I-C | initial read throws + cleanup | false; one read; zero writes | coalesce cleanup read to empty | hosts mutation safety; built CLI root |
| V-P | stale block + populated sync + write lands + readback throws | false; one write | accept null readback | hosts mutation safety |
| V-E | stale block + empty sync + write lands + readback throws | false; one write | null readback becomes empty | hosts mutation safety; built CLI root |
| M-P | populated sync + successful write + readable mismatched readback | false | skip exact readback predicate | hosts mutation safety |
| M-E | empty sync + successful write + stale readable readback | false | return true after readable readback | named candidate gap |
| W-P | populated sync + write throws | false; no verification | ignore write exception | hosts mutation safety |
| N-E | readable empty hosts + empty sync | true; zero writes | reject all falsey reads | hosts mutation safety; built CLI |
| N-P | readable exact block + populated sync | true; zero writes | always rewrite | hosts mutation safety |
| R-E | stale block + empty sync + successful exact readback | true; stale entries removed; unrelated records preserved | skip empty reconciliation | hosts mutation safety; built CLI |
| R-P | stale block + populated sync + successful exact readback | true; requested set replaces stale; unrelated records preserved | pass empty list at CLI call site | helper tested; CLI populated candidate gap |
| C-E | readable no block + cleanup | true; zero writes | cleanup always false | named candidate gap |
| C-S | stale block + cleanup + write succeeds | true; unrelated records preserved | cleanup never writes | named candidate gap |
| C-W | stale block + cleanup + write throws | false | cleanup swallows failure as success | named candidate gap |
| B-R | CLI sync/clean helper false, root | exit 1; error; no sudo | ignore helper result at dispatcher | built CLI tests |
| B-U | CLI sync helper false, non-root, sudo stub succeeds | forwards hosts sync; exit 0; zero initial writes | remove escalation | built CLI test |
| B-F | CLI sync helper false, non-root, sudo stub fails | exit 1 | ignore escalation status | named candidate gap |

Partition/exclusions: write/verification dimensions unreachable after initial read failure; verification unreachable after no-op or thrown write. Cleanup does not promise post-write verification in the changed manual-sync contract, so cleanup readback is excluded, not called an introduced defect. Missing-file and permission-denied errors are equivalent for the changed catch-all guard; actual OS permission behavior remains an unavailable-producer gap. Windows elevation and system hosts producer are not driven on Darwin, per safety constraints. Proxy startup/shutdown, top-level clean CA trust/state, DNS parsing/malformed markers, route-store corruption and concurrent filesystem writers are outside compact changed-hosts scope. No blanket claim of exhaustive filesystem/parser coverage.

## Plan and handoff

Read-only preflight: no write probes in frozen checkout. Built CLI preload inspected: exact hosts-path read/write interception and sudo spawnSync stub with syncBuiltinESMExports. Focused selection must exclude DNS resolution tests because resolver may consult system hosts. Test imports and top-level hooks need one final inspection before execution.

Ready for parent/resilience reviewer to drive built CLI first. No authored tests or test commands have run at readiness. After parent evidence exists, materialize only src/hosts.ts, src/hosts.test.ts, src/cli.test.ts and dist into this stage's disposable directory. Existing dependencies may be read through symlinks; test caches/temp files must stay inside this stage. Probe both helper and built CLI call site, restore between mutants, capture exact commands, outputs, exit codes and timings. Record meaningful survivors as absent regression coverage, not introduced production defects. Add narrow scratch-only independent probes only after parent boundary drive.
