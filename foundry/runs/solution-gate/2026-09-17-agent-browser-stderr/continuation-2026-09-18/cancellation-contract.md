# Owned post-ready cancellation: human contract decision

Source, verbatim: user selected **Cerrar también ese límite** in response to whether to keep the domain-limited fix or require termination even while a writer outside the owned browser group stays open. Description shown: `Exigir que el lector termine aunque un writer externo siga abierto; requiere diseñar y probar cancelación multiplataforma.` This settles the previously ambiguous lifetime boundary. No commit/push/merge/publication authorized.

Evidence: resources.md/json shows the real candidate's production launcher in one process across 24 cycles. Owned group release returns baseline in 12 cycles; 12 external duplicated writers retain exactly one thread+fd each after Drop until those writers close. This is synthetic ownership evidence, not evidence normal Chrome escapes. Separate targets now prove same regression fails on base (101) and all 55 Chrome tests pass with candidate (0). post-ready-results/verification.json is PASS; earlier shared-cache suite failure excluded.

## Requirements

| R | Requirement | Status |
|---|---|---|
| C0 | Consume post-primary-readiness Chrome stderr continuously as bytes, including invalid UTF-8 and unterminated bursts, so ordinary commands remain responsive. | Core |
| C1 | Release the post-ready consumer and read descriptor on ChromeProcess kill/Drop even if a writer outside the owned process group/Job stays open; do not wait for EOF. | Human-settled must |
| C2 | Preserve primary readiness, untouched stderr fallback/status/diagnostics, launch retry policy, attached-vs-owned distinction, group/Job/profile cleanup and daemon idle behavior. | Must |
| C3 | Omitted flags retain session PID/target/URL/marker; explicit close/relaunch keeps existing reset semantics. | Must |
| C4 | Bounded buffers and per-browser worker/fd costs; no default durable logs, stdout pollution, busy loop, or new public logging API. | Must |
| C5 | Consumer lifetime belongs to ChromeProcess, not the temporary launch worker/runtime. Construction failure must not leave a launched process or capture resource without its owner. | Derived must |
| C6 | The production design covers Unix and Windows using the repository's existing child and Job interfaces; runtime verification must be stated per platform. | Must |
| C7 | Removal-sensitive regression on the real launch path, plus same-host repeated resource accounting with retained external writers, proves the amended mechanism. | Must |

Startup/preburst/fallback redesign, generic CDP timeouts, daemon-SIGKILL guardians and the unreproduced #1371 high-CPU symptom remain out of scope.

## Candidate and material amendment

Simon Ellefsen's #1527 is reusable successful post-ready byte consumption at the right insertion point. The selected cancellation mechanism is not determined yet. Two independent post-reveal shape amendments must compare mechanisms, flag OS/API unknowns, and feed cheap probes back before Pass to detail. Preserve contributor credit. Do not make a full diagnostic collector or public abstraction merely to fix cancellation.

Source: post-ready copy (exact candidate runtime plus one 57-line test), candidate/cli/src/native/cdp/chrome.rs, candidate/cli/src/native/cdp/windows_process.rs, and the resource-probe spike. Parent and reviewers must not inspect credentials, private environments or unrelated worktrees.
