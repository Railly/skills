# Blind probe and failure review, before candidate reveal

Inputs remain base aff6125, shared contract, shapes-a.md and shapes-b.md. Candidate artifacts remain sealed. No product implementation exists in this run.

## Normalized directions

N = A's shape A and B's shape A: output consumed before and after readiness, finite diagnostic state, readiness event independent of diagnostic tail, capture owned by attempt/browser. POSIX cancellation and cross-platform lifecycle are load-bearing.

File sink (A.B), closing the read end after readiness (A.C), runtime async conversion (B.B), and a collector process (B.C) remain alternatives, not a composition. A larger pipe only postpones exhaustion and is rejected.

## Driven evidence

| Probe | Command / handle | Observed outcome | Affected requirement / part |
|---|---|---|---|
| P1 bounded parser and quiet-writer cancellation | `python3 stream-spike.py`, exit 0; `stream-spike-results.json` in probe root | 65 marker split positions; 7,266,402 bytes consumed; max retained 196,703 under an explicit 266,240-byte state bound; readiness and error marker survive tail eviction; invalid bytes displayed lossily. Quiet-writer polling reader exits in 12.54 ms with writer still open. A blocking reader remains blocked until writer closes | R1/R2/R4/R8/R9, A.A2/A.A5, B.A2/A.A3/A.A6 |
| P2 line-read primitive | `rustc line-limit-probe.rs -o line-limit-probe && ./line-limit-probe`, exit 0 | std BufRead.read_until reads 1,048,576 bytes without a newline before any caller-applied cap. A post-read truncate is not a memory bound | R4/R8; A.A2 must use actually bounded reads, not an uncapped read_until followed by trimming |
| P3 pre-readiness burst | `python3 cli-proof.py <base-binary> preburst`, collection exit 0; `proofs/preburst-5b912fb9/results.json` | A wrapper writes ~1.2 MB of finite logs before exec of real Chrome. Base CLI has no result within 12 s; harness sends SIGTERM, returncode -15. Owned group cleaned | R0/D2, rejects any assumed after-readiness-only coverage |
| P4 failure diagnostic | `python3 cli-proof.py <base-binary> error`, collection exit 0; `proofs/error-db832b7b/results.json` | Native CLI exit 1 in 1.40 s; response contains exit status 42 and ERROR stderr-gate-status-42 marker | R2/D4; real baseline diagnostic oracle to preserve |
| P5 quiet inherited writer | `python3 cli-proof.py <base-binary> quiet-writer`, collection exit 0; `proofs/quiet-writer-ed948f9c/results.json` | Fixture exits 42 after an error line; child holds stderr open. Base CLI fails to respond within 12 s, terminated by harness. Group cleaned | R4/R9/D7, input EOF cannot be the only wait/cancellation bound |

Probe root: `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate`.

P1 is a POSIX Python prototype, not the eventual Rust implementation or a Windows pass. Its 256 KiB tail/error budget plus 4 KiB parser overhead is an experimental finite policy, not an approved public contract. P2 refutes only post-read capping, not every possible bounded adaptation of BufRead.

The first ordinary CLI run (`normal-02d74bb8`) mixed an explicit executable flag into later commands and observed two owned groups. It is not the continuity oracle. The harness was corrected to pass launch flags only to open; a clean ordinary same-session rerun is recorded separately. Previously measured real-Chrome pipe/file contrast remains valid evidence of the liveness symptom, not an implementation pass.

## Forward effects of N

1. Before-spawn stream ownership plus continuous consumption (proposed) → a finite producer can emit beyond pipe capacity without awaiting an unserviced sink (observed generic pipe mechanics, real-Chrome base fails) → normal browser command progress (unverified for a production N implementation). Harmful branch: parser per-byte work consumes CPU at high log rates (inferred); a bounded byte/chunk design must be profiled, not advertised as a CPU fix.
2. Finite diagnostic tail/error lanes (observed prototype) → old noise evicted while completed readiness remains available (observed prototype) → useful finite failure output (prototype marker observed; actual CLI integration unverified). Harmful branch: a novel early error may be evicted (inferred); retention/truncation is an explicit accepted policy, not preservation of unlimited history.
3. Private stop signal plus nonblocking/polled read (observed POSIX primitive) → an inherited quiet writer does not hold teardown hostage (observed 12.54 ms prototype) → no per-relaunch consumer leak (inferred, production loop unverified). Harmful branch: synchronous Windows pipe read cannot necessarily use this POSIX mechanism (unknown); the Windows part remains flagged.

File sink forward chain: pipe removed (observed prior control) → Chrome writes freely (observed) → disk use grows with total logging (inferred, unbounded lifetime). It fails R4 absent an additional bounded storage design. Closing the reader and async/sidecar mechanisms remain explicitly unprobed with the original flags; they cannot earn a pass from resemblance to N.

## Failure catalog, pre-reveal

| Case | Blind disposition |
|---|---|
| S1 | Exclude a general CDP timeout rewrite, new reaper, GPU tuning and unrelated engines. |
| S2 | P3 and P5 expose pre-ready and inherited-writer variants. Later-only consumption is insufficient for the shared contract. |
| S3 | Source shows primary readiness retains stderr while fallback drops it. Both lifetime directions need the same progress guarantee. |
| S4 | Port-file existence is not continued browser responsiveness; read-until-newline is not bounded retention. |
| S5 | New capture state needs per-attempt lifetime and cleanup; no default durable artifact. |
| S6 | Avoid a new external helper protocol; same-binary/platform internals still need delivery verification. |
| S7 | Preserve status and useful error marker through the actual JSON response, as P4 demonstrates. |
| S8 | Discriminators derive from byte streams and lifecycle orderings, not only one verbose flag. |
| S9 | P1 is not proof of production integration. Later candidate tests must be compared against these failing base cells. |
| S10 | Mark Windows cancellation and production resource flatness as unverified; do not upgrade source comments to execution. |
| S11 | Log consumers must not grant arbitrary metadata new launch/kill authority; retain current trust/ownership boundary. |
| S12 | File sink removes backpressure but does not satisfy bounded storage; larger pipe postpones the same defect. |
| S13 | Correct ordinary CLI proof uses launch flags only once and checks page/PID continuity. No omission-based reset is allowed as a workaround. |

## Ordinary CLI confirmation before reveal

`python3 cli-proof.py <base-binary> normal`, corrected to use launch flags only on open, collected exit 0. `proofs/normal-e31a6653/results.json` shows ordinary real Chrome launch still fails to respond within 12 s (CLI returncode -15 after harness SIGTERM); no wrapper and no manually prestarted daemon/config fingerprint were involved. All owned processes were cleaned. This independently confirms the earlier wrapper-based symptom; continuity cannot be tested on a launch that did not complete.

## Pre-reveal state

N is the narrowest direction worth carrying, but it is not Pass to detail: production integration and Windows cancellation/lifetime are not yet demonstrated. The candidate will face the same contract and discriminators; no candidate test or claimed mechanism will be grandfathered.
