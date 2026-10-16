# Explicit scope selection, 2026-09-18

Source, verbatim: "good hazlo please tu recomendacion! recuerda si funca clonar PR a parte y agregar como coauthor trabajar sobre ello"

Hunter selected the coordinator recommendation in decision.md: post-readiness fix based on Simon Ellefsen's #1527, add a regression, verify resources over relaunches, keep startup/fallback defects separate. Authorized isolated implementation and separate PR if verified, with Simon as human coauthor. No authority to modify/close/comment on #1527, merge, or release. Main remains aff6125; original candidate remains f89be85. Previous broad contract and verdict are historical, not overwritten.

## Revised settled contract

| R | Requirement | Status |
|---|---|---|
| N0 | Once primary DevToolsActivePort readiness is observed, arbitrary-volume stderr must not prevent ordinary commands from progressing. | Core |
| N1 | Preserve existing readiness selection and startup error/status diagnostics, without claiming to fix pre-readiness or fallback limitations. | Must |
| N2 | Ordinary commands omitting launch flags retain the same browser/session/page state; no restart workaround. | Must |
| N3 | Post-ready handling retains no unbounded diagnostic buffer or file, accepts arbitrary bytes and newline-free chunks, and keeps CLI stdout/JSON clean. | Must |
| N4 | Ordinary managed browser close/relaunch releases its output reader resources after owned writers exit, without adding a caller wait for EOF. Verify repetition rather than inferring cleanup from a single exit code. | Must |
| N5 | Preserve attached-browser ownership, process-group/Job Object cleanup, profile, retry and idle behavior; do not introduce global daemon state. | Must |
| N6 | Tests exercise the real launch boundary and fail on unchanged base; user-visible continuity must be demonstrated with a real browser. | Must |

## Boundaries and assumptions

- Pre-readiness bursts, fallback indefinite line/EOF reads, bounded startup diagnostics, and #1371 sustained idle CPU are excluded and must be named explicitly in the PR.
- EOF is expected after the owned Chrome process tree closes. A third-party executable that escapes group/Job ownership and keeps a duplicated writer alive is not made safe by this scope selection. Do not claim universal cancellation; retain that limitation visibly. If normal Chrome relaunches leak readers, the shape fails N4 and must change.
- Windows uses a std File stderr, Unix ChildStderr. Platform runtime verification remains an implementation/delivery obligation, not evidence supplied by macOS tests.
- No logging API, new flags, default durable log, generalized cancellation framework, reaper, or unrelated source changes.

Use the existing independently shaped candidate K/D and evidence, not another blind reconstruction after reveal. Update the native R/parts/full binary fit check against this explicit scope, preserve earlier artifacts, and distinguish design unknowns from implementation proof owed. Record S1-S13 dispositions from the canonical failure catalog. Do not implement before a scoped Pass to detail.
