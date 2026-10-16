# Probe feedback to independent Shaping

Base remains aff6125c023b810ea3f2e5deec5379e9a4270bdc. No production code changed. This is evidence return, not a request to implement or to borrow another reviewer's shape.

## Completed browser matrix

`bun repro-1371.ts` exited 0 on the corrected harness, five cells completed. `probe-data/results.json` in /Users/raillyhugo/Programming/vercel/agent-browser-1371-repro contains argv, CLI exit codes, raw JSON responses, process snapshots, CPU, profiles, and cleanup.

- close: zero group processes and removed profile within the first 2-second sample.
- SIGTERM: same.
- SIGKILL, blank page: twelve Chrome group processes remain at 2/4/6 seconds; Chrome PPID changed from daemon 60896 to 1. Group CPU 0.4/0.4/0.5%, retained temp profile.
- SIGKILL, deliberately animated 1280x720 gradient canvas: twelve Chrome group processes remain, PPID 1, CPU 9.1/8.7/9.7%, retained profile.
- explicit idle 3000 ms: alive at 2 seconds, gone and profile removed at 4/6 seconds.
- JS marker/title/URL retained and lifecycle.reused=true, restartedBackground=false through ordinary CLI commands in all five cells.
- WebGL renderer query reported `ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro, Unspecified Version)`, while the launch command includes `--enable-unsafe-swiftshader`. User agent reports HeadlessChrome/152.0.0.0. Thus presence of that flag does NOT establish software rendering on this host. Blank cells include a detached WebGL renderer-query canvas, not a pristine never-scripted browser. No repeated unexplained blank-page high CPU was observed.
- All test-owned leaked groups were revalidated against launch identity and removed afterward; cleanupRemaining=[] in every cell. No global close-all or user browser cleanup.
- `cargo test --locked --manifest-path cli/Cargo.toml idle_timeout -- --test-threads=1`: exit 0, 17 passed, 0 failed. This validates parser/default/explicit-zero mechanics, not a live full one-hour soak or cross-invocation config contract.

## Mechanism refutation spike

`python3 spike-lifetime.py`, disposable stand-ins, no production edits. Source and logs in the same reproduction directory.

- Post-launch registration shape: owner starts /bin/sleep in a fresh group then is killed before any reaper registration. Stand-in survives. This is an intentionally forced schedule proving the ordering hole, not a timing-frequency claim.
- Guardian owns child before readiness: daemon-side pipe writer retained; ordinary child command exit and owner SIGSTOP leave stand-in alive. SIGKILL of owner closes lease, guardian kills/reaps stand-in. Confirms EOF/lifetime primitive on macOS with this fixture only, not production FD inheritance or Linux behavior.
- Guardian dies first, owner then dies: stand-in survives. A guardian moves cleanup agency outside daemon, but its own hard death remains a failure boundary. No blanket owner-death guarantee is justified.
- Initial spike failed before launching because Python 3.9 does not support subprocess process_group; corrected to preexec_fn=os.setpgrp.
- First successful functional run used cross-process monotonic timestamps, invalid on this Python build; that latency value is discarded. Corrected run measures cleanup observation entirely in the parent clock. No latency claim based on the invalid receipt.

## Required revisions / adversarial questions

1. Any post-launch sentinel must mark the spawn-to-registration gap as a failure unless it has a concrete pre-established ownership mechanism. Existing primitives alone do not prove the protocol.
2. A helper that exits when only the Chrome leader exits can leave children in the group. A leader identity guard that refuses to act after leader exit is safe against some PID reuse but does not prove whole-tree cleanup. Retain/reap ownership and test leader-first death; do not count an unresolved identity mechanism as pass.
3. Explicit user-profile launches still own the Chrome process. Exclude the profile path from deletion, not the entire process from death cleanup. Named profile copies are agent-created temp directories under the existing launch logic.
4. A registry introduced today cannot retroactively identify pre-existing orphans that never wrote it. A future-invocation sweep has no bounded autonomous cleanup guarantee. Consider scope and new persistent-state costs before adding it.
5. Windows Job Objects cover processes on death, not filesystem temp-profile deletion by themselves. Do not claim a full file cleanup guarantee from kill-on-close alone.
6. Guardian death scope must be explicit; it cannot be silently generalized from daemon death. Whether simultaneous guardian/daemon hard-kill needs automatic containment is undecided. Residual gap is observed in the fixture.
7. No live attached-browser isolation, user-profile sentinel, leader-first group exit, production launch-phase matrix, Linux or Windows validation exists yet. These are required before high-risk Pass to detail, not implied by source inspection.
8. Do not change GPU/backgrounding flags on this evidence. Do not shorten/replace the already shipped idle policy to solve daemon death.

Update your own R statuses, mechanism parts/flags and binary fit checks. Preserve the initial artifact as history and write an appended feedback revision or separate `shaping-<letter>-updated.md`. If no fully evidenced shape survives, record Reshape and exact required spikes instead of optimistic passes. No implementation, no credential/environment inspection, no further browser execution.
