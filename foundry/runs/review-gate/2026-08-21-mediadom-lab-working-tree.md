# Review Gate: mediadom-lab repair and real Cueva dogfood

Date: 2026-08-21
Base and HEAD: `241cd0b9e0478728c75a76ba850cd98fcf5f069a`
State: uncommitted working tree
Tracked diff SHA-256: `cd0c79f5948a5fee41dca661003e80572d804c911584107542e4d93afd7bee85`
Untracked-files SHA-256: `8ed4af3e62362baeb5edad5162bcf16cb4fa0a21ebe63b5868cec79971a5fd42`
Composite working-tree SHA-256: `6ae55b212ffa7c7773940af14dab87432adbc732b0f870044a7f1136e4d987cd`

## Verdict

Findings. The code repair is test-clean, but real Cueva dogfood exposed an open end-to-end verification defect.

`autocut` now inspects each final valley-snapped interval and skips only candidates that fully contain a current positive-length lexical observation. Partial overlaps remain eligible. Stores without lexical observations continue with explicit degraded status. The complete observation and EDL transition now holds the store lock.

The review found and fixed one pre-existing in-scope defect: `autocut` accepted `--lock-timeout` without acquiring the lock.

The full code suite passes at 671/671 and the repaired CLI contracts are covered. A real `gpt-5.6-luna` high editing run then produced a 5:01.096 master whose receipt, hash, duration, editorial brief, banned phrase check, hollow check, and ladder check all pass. `verify --no-name` still exits 7 because 17 of 97 seams are flagged and 4.820 seconds of detected silence survive. The tree is therefore not approved as a complete one-shot editor.

The author and reviewers are from the same broad model family. That can share priors. Independent evidence comes from real Scribe-produced lexical data, direct render hashes, receipt fidelity, and the Cueva source/render dogfood.

## Subsystem model

The foreground Bun CLI reads the newest visible generation independently per layer, proposes envelope-owned EDL bounds through `edlAppend`, adopts accepted immutable EDLs in memory, publishes `edl.json` atomically under the per-store lock, releases the lock, and emits one JSON or text summary.

Adjacent layers inspected:

- current versus historical lexical generations
- original candidate bounds versus final snapped bounds
- positive short spans and exact half-open edges
- partial overlaps in both directions
- existing active EDL entries and duplicate suppression
- store lock exclusion and timeout
- durable EDL publication followed by stdout failure
- schema and core skill parity
- transcript-text confidentiality in machine output

## Deterministic checks

- style: pass
- surfaces: acknowledged because `git diff` cannot see the untracked lexical test; the required CLI test exists and runs
- siblings `autocut`: acknowledged after reading every untouched passage; they are registration labels or the independent degenerate-floor contract
- callers `edlAppend`: acknowledged because its contract did not change; the new wrapper consumes the existing immutable result
- typecheck: pass
- focused Biome: pass
- focused tests: 17/17, 104 assertions
- full suite: 671/671
- manifest: pass
- `git diff --check`: pass
- force-red: pass for pre-snap, strict-boundary, and false-available mutations
- covered: unavailable until commit; frozen hashes identify the working tree

Radius recorded five git-visible changed symbols, 2,216 edges, and 5,282 unresolved calls. It under-covers and does not count the untracked new helper as changed, so it was used only for orientation.

## Test Strength

The explicit matrix covers lexical absence and presence; no overlap, left and right partial overlap, complete containment, exact-edge containment, and final-only post-snap containment; 10, 19, 110, and 120 ms spans; historical and current generations; empty, duplicate, locked, and post-commit-failure EDL states; and text-free available/degraded decision output.

The independent oracle is direct half-open containment of the final EDL interval against persisted positive-length lexical observations. ElevenLabs Scribe v2 produced 4,869 Fiorella records, 4,804 of which persisted after 65 zero-length records were rejected. The final replay accepted 315 candidates and skipped all five complete containments in 125 ms.

Mutations proved the tests reject original-bound classification, strict boundary comparisons, and a false `available` status with zero observations.

## Commit point and retry

`writeEdl` is the durable commit point. Foreground summary emission can fail after it. A forced stdout callback error left exactly one active EDL entry. Immediate retry exited 0, added zero, reported `duplicate-active-entry`, and preserved one active entry.

## Real Cueva dogfood

- Source SHA-256 before and after: `c6166f12df4b32d00530f52da4249c9ad5a41657d1a9ddf1150e57478b789d68`
- Master: `/Users/raillyhugo/Programming/mediadom-lab/out/cueva-luna-high-v2.m4a`
- Master SHA-256: `27ae9d5e99f2f83b4fa024834b6deba58b2c51cbad108146d3893b9ef41ab3bd`
- Expected and measured duration: `301096 ms`, drift `0 ms`
- Editorial review: pass, no banned phrase, no event markers, no surviving ladders
- Acoustic verify: fail, 17 flagged seams and `4820 ms` retained silence
- Render budget used: two; verify budget used: two

The failure is not receipt drift. It is a policy/tooling mismatch between intentional speech-discard edits, autocut seams, and acoustic certification. The second repair removed all hollow spans and ladders but could not make the remaining cuts certifiable within the bounded run.

## Exemptions claimed

- Exact HEAD coverage is unavailable because the requested state is uncommitted. The tracked, untracked, and composite hashes above identify the reviewed tree.
- Untouched autocut registration and floor-refusal passages remain accurate and carry no competing lexical policy.
- Existing `edlAppend` callers remain valid because its contract did not change.

## Issue candidates

- Make intentional lexical edits and autocut compose into a certifiable EDL. Evidence: the exact 5:01.096 Cueva render matches receipt and review but `verify` flags 17 seams plus 4.820 seconds retained silence.
- Bound agent inspection before mutation. The Cueva run consumed roughly 16.6M input tokens because it repeatedly rescanned transcript/store/code after compaction and debugged shell quoting. Persisting a compact edit workspace and generated stable-ref spec would remove that loop.
