# Proposal impact falsification

Date: 2026-08-29
Runtime: Bun 1.3.11 on macOS arm64
Scope: proposal packet selection, impact validation, append semantics, and active-procedure preservation

## Behavioral model

| Dimension | Classes | Required invariant |
|---|---|---|
| Decision | accepted, rejected, absorbed, superseded, no-change | Acceptance requires human authority and passing evaluation; non-acceptance cannot change active bytes |
| Candidate | patch, no-action | Patch identity is unique and matches tracked artifact bytes; no-action supplies a reason |
| Evaluation | no-skill, released-skill, candidate-skill | Every record contains all three variants |
| History | first append, identical retry, conflicting retry, supersession | Append is durable, identical retry is a no-op, conflicting identity fails, history remains ordered |
| Active state | current digest, stale digest, discontinuous chain | Latest ledger digest matches the active procedure and continues prior history |
| Packet scope | target history, unrelated history | A packet contains only the requested skill's impacts and linked evidence |
| Artifact boundary | tracked Foundry path, untracked file, missing file, escaping path | Only tracked repository artifacts under Foundry are accepted |

The no-change candidate class still runs the three-variant protocol. Private evidence content is out of scope because the ledger stores only tracked public decision artifacts and pattern IDs.

## Oracle and fixture provenance

The oracle is the shaped V4 contract plus the existing three-variant eval protocol and human promotion rule. Fixtures initialize a real temporary Git repository, stage the candidate, evaluation, and decision artifacts, and compute digests from the files read by the validator. The dogfood boundary also ran the packet CLI and recorder CLI against the staged repository artifacts.

## Fix-absent results

| Mutation | Falsification site | Intended red |
|---|---|---|
| Remove human-authority requirement for acceptance | validator branch | Acceptance-gate assertion failed because only the passing-eval error remained |
| Remove duplicate candidate-digest detection | validator branch | Unique-identity assertion failed |
| Remove non-acceptance byte-equality check | validator branch | Rejection-specific digest assertion failed; the independent latest-active check remained red |
| Permit untracked artifacts | repository boundary | Tracked-artifact assertion failed with an empty error set |
| Remove per-skill impact filter | packet builder | Bounded-history assertion exposed the unrelated impact |
| Disable identical-retry no-op | append call site | Retry raised duplicate ID and digest errors instead of returning no-op |
| Skip current-history validation before identical retry | append call site | A retry after active-procedure drift returned no-op instead of failing the stale digest |
| Remove latest-active digest verification | validator call site | Stale-active assertion failed with an empty error set |

All eight mutants were killed by the intended assertions. The source was restored after each mutation. The nine focused tests then passed twice consecutively before the final history-validation assertion was added; the complete suite passed with 29 expectations after that addition.

## Boundary evidence and gaps

The real packet CLI produced a bounded JSON artifact. The real recorder CLI appended one line, verified its final ID, and returned no-op on an identical retry while the ledger stayed at one line. Compilation projected the rejection into the generated index and graph. The active procedure digest remained `sha256:f6936a7f48ec672adfd7c888cb484e815ebd32416493ef62d371cf56547340ed`.

Filesystem crash atomicity below one synchronous append call was not fault-injected. Subagent timing, tokens, and tool-call metrics were unavailable. Those limits do not weaken the tested identity, validation, retry, and active-digest boundaries.
