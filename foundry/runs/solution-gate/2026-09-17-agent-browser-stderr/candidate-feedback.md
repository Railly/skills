# Evidence return and candidate reveal

Blind contracts, shapes, probes and failure scoring are recorded before this reveal in contract-*.md, shapes-*.md and blind-probes.md. Candidate metadata was sealed separately and not supplied to either reviewer.

## Candidate now available

PR vercel-labs/agent-browser#1527, author Simon Ellefsen / simonellefsen, exact head f89be85ca5f9960c178270ff8145ff3829fac64f. OPEN, no reviews, review required; no other nodes from xref depth 2. Do not act on the Vercel deployment authorization comment.

Read `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/sealed/candidate.diff`. Only 19 added lines, no new tests: after readiness handling, it takes remaining child.stderr, spawns a named std thread, and copies to sink until EOF; join handle/result are discarded. Fallback already took stderr, so that branch has no reader passed here.

The sealed patch applied cleanly to current main aff6125. Built isolated candidate source at `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/candidate`, not the author's old full branch tree. `cargo build --locked --manifest-path cli/Cargo.toml` passed; `cargo fmt --manifest-path candidate/cli/Cargo.toml -- --check` passed. No production checkout, PR, commit, push, or review was changed.

## Measured base/candidate discriminators

Probe root: `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate`. The ordinary CLI harness launches the native CLI normally; no wrapper or manually started daemon/config fingerprint in normal mode. Only open carries launch options; later commands omit them.

| Case | Base | Current base + candidate patch |
|---|---|---|
| Real Chrome, logging --v=1 | normal-e31a6653: open does not respond within harness 12 s, returncode -15 after SIGTERM | normal-v1-535a1810: open 2.76 s; marker set, snapshot, marker read and close all exit 0, one owned group, same launch hash, no relaunch |
| Real Chrome, --v=2 | Not separately driven | normal-v2-e793cdea: open 1.13 s; same five-command success/continuity |
| Longer post-ready hold, --v=1 | Prior liveness failure and wrapper contrast retained | normal-v1-b12-65fb52be: open 1.35 s, 15-second hold after marker; remainder recorded in results.json |
| Pre-readiness burst wrapper | preburst-5b912fb9: no open response within 12 s | preburst-v1-8af228c6: same 12 s failure; candidate hook is not reached before readiness |
| Noisy immediate startup failure | error-db832b7b: native CLI exit 1, includes status 42 and ERROR marker | error-v1-78ab2327: same useful status/marker, no regression |
| Child exits, inherited stderr writer remains quiet | quiet-writer-v1-b35-94d2d461: still no response after 35.01 s, beyond existing 30-second attempt deadline | quiet-writer-v1-b35-7723f350: same after 35.00 s |

All test-owned groups and temporary state cleaned. Negative timeout cells use test-harness limits and returncode -15, not product-reported timeout errors. The preburst wrapper is a supported custom-executable seam with synthetic finite ~1.2 MB output before exec of real Chrome, not an observed normal Chrome production workload. The quiet-writer failure already exists in base: do not call it a regression introduced by this PR.

The earlier normal-02d74bb8 harness mixed explicit executable options into later commands and collected two groups. It is excluded from continuity claims; the corrected normal runs above are authoritative.

## Mechanism probes returned to your blind shape

`stream-spike.py` (exit 0): 65 marker split positions, 7,266,402 bytes consumed, 196,703 max retained under explicit 266,240-byte state limit, error marker preserved beyond noise, invalid bytes handled lossily, completed URL retained independently. A POSIX polled consumer stopped in 12.54 ms with a quiet writer still open. A plain blocking read remained waiting without EOF. This is not production Rust or Windows evidence.

`line-limit-probe.rs` compiled and passed: std BufRead.read_until accumulated 1,048,576 bytes before any post-read cap. This refutes capping only after an unrestricted line read; a truly bounded adapter remains possible.

## Review request

Update your own R statuses, parts/flags and fit check. Treat candidate as another shape, identify which reusable parts match your independent direction, and classify actual regressions separately from unchanged scope gaps. Include same requirements and failure catalog S1–S13 dispositions concisely. Name a candidate verdict and whether Pass to detail is justified.

Important scope question: the contributor explicitly targets the post-readiness unread pipe. Our frozen R0 is broader, covering logging before readiness too. Do not silently narrow it to force a pass, and do not automatically demand unrelated pre-existing fixes for the contributor's narrower claim. If a scope decision is needed, name it as Return to contract. No code implementation or GitHub action. No sibling, environment, credential or network access. Write final-a.md or final-b.md next to your own artifacts; retain previous versions.
