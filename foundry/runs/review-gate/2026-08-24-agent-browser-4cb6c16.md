# Review Gate: agent-browser 4cb6c16

Status: pass

The exact-head diff fixes both observed release failures without changing product behavior. `cargo-zigbuild` 0.23.2 handles Rust 1.98's new ARM64 linker argument, and the Unix child-status test now polls to a deadline instead of assuming the child exits within 200 ms.

## Risk and claims

Risk is high because this crosses release toolchains, operating systems, architectures, libc variants, and process lifecycle behavior. The independent challenge artifact is `evidence/2026-08-24-agent-browser-release-recovery-reference-oracle.txt`.

- P1 verified: Rust 1.98, Zig 0.16, and cargo-zigbuild 0.23.2 built all four Linux release targets.
- P2 verified: GNU ARM64 and x64 artifacts require no GLIBC newer than 2.28; both musl artifacts are static.
- P3 verified: a real `/bin/sh` child is observed through `Child::try_wait`, exact exit code 42 is asserted, scheduler delay is tolerated, and timeout cleanup kills and waits for the child.

The upstream oracle is cargo-zigbuild commit `7e791b4`, which filters and tests the exact `-Wl,--fix-cortex-a53-843419` argument shown in the failed GitHub job.

## Behavioral strength

The process model covered an immediate exit and a one-second-delayed exit, the child-live `None` state, the post-exit `Some(status)` state, exact status 42, isolated execution, 100 repeated delayed executions, and full-suite contention.

The force-red variant restored the old fixed 200 ms implementation and used `sleep 1; exit 42`. It failed at the intended assertion because `try_wait` returned `None`. Restored deadline polling passed the same delayed producer, then passed 100 of 100 repetitions. The final immediate source passed again, and the macOS x64 CI-equivalent suite passed 1,145 tests with 101 ignored plus 2 doctor integration tests.

## Deterministic and substrate checks

- Review Gate style, surfaces, and timings: pass.
- Rust format and Clippy with the exact CI commands: pass.
- `git diff --check`: pass.
- Four Linux release builds: pass.
- ELF architecture, GNU 2.28 ceiling, and static musl checks: pass.
- Radius: 2 changed symbols, 0 impacted, 8,019 edges, and 2,445 unresolved calls. The map under-covers and was not used as absence-of-risk evidence.

No open findings remain.

## Exemptions claimed

- No docs or changelog change: the diff only updates an internal release dependency and cfg(test) logic.
- The ten-second deadline is test harness cleanup, not a new product timing contract.

## Issue candidates

- Improve Rust semantic indexing for agent-browser radius maps. The exact-head map has 2,445 unresolved calls and 81 SCIP-unmapped entries; this review-tooling gap is separate from the release recovery.
