# Continuation decision: owned post-ready cancellation

## Status

**Reshape / blocked on the Windows mechanism and native verification. No overall Pass to detail or merge approval.** The human settled the contract by selecting **Cerrar también ese límite**: an external writer must not retain the consumer after ChromeProcess kill/Drop. This is no longer a Return to contract or a request to accept the original EOF lifetime.

Simon Ellefsen's #1527 remains credited for identifying the unread pipe and the effective post-primary-readiness byte drain. Its exact +19/-0 source copy and executable remain preserved. No contributor branch, original working checkout, GitHub comment/review, commit, push, merge or release was changed.

This continuation produced a maintainable regression plus disposable cancellation mechanisms. The Unix mechanism is experimentally validated; the Windows mechanism is a separate typechecked prototype and is not integrated into the launcher. These artifacts must not be described as a completed cross-platform production fix.

## Contract and selection history

- [Continuation input](input.md): following `continue`, validate the recommended narrow post-ready fix rather than redo startup/fallback.
- [Initial resource evidence](resources.md): inside the owned group, 12 cycles return to baseline; externally retained writers add one thread and one fd per cycle. This moved a structural risk to a measured property.
- Human choice, verbatim: **Cerrar también ese límite**. [Settled cancellation contract C0–C7](cancellation-contract.md).
- Independent post-reveal shapes: [A](cancellation-shape-a.md), [B](cancellation-shape-b.md). Not a second blind candidate audit.
- Evidence-fed final fit checks: [A](cancellation-final-a.md), [B](cancellation-final-b.md). No model vote is used: the Windows primitive has neither production integration nor native completion evidence.

Requirements remain C0–C7 in the linked contract and full fit tables. C1, C6 and C7 are not satisfied globally. C2/C3 source preservation is not equivalent to rerunning all compatibility workflows on the amendment. The 55 passing Chrome tests belong to the original candidate plus the new regression, not to the cancellation prototype.

## Verified changes and observations

| Artifact | What is verified | What is not |
|---|---|---|
| `post-ready-regression.patch` | 57 test-only additions in chrome.rs. Real try_launch_chrome, primary port readiness, two 2 MiB unterminated bursts with invalid byte, writer progress and automatic profile cleanup. | Does not itself test new cancellation. |
| Base plus identical regression | Exit 101 with `stderr burst 1 blocked after readiness`. | An expected negative control, not a product timeout. |
| Main + exact #1527 + regression | 55 Chrome tests pass; format pass. Production prefix is byte-identical to original candidate. | No Windows native execution, no new release. |
| Original candidate lifecycle spike | Same host, 24 cycles. Normal owned writers release; 12 external retained writers leave 12 readers/fds until closed. | Synthetic ownership discriminator, not evidence that normal Chrome escapes. |
| Unix cancellation in disposable real-launcher copy | macOS: all 24 cycles return to baseline even while 1–12 external write fds remain open; two construction-failure unwinds clean launch/profile. | Not production integration for all platforms. |
| Exact Unix primitive in Docker | Linux aarch64: 32 quiet + 32 burst + 32 continuous cycles; fd/task baseline restored; 97 children reaped. | Primitive-only, not Linux Chrome/CLI integration. |
| Windows standalone prototype | APIs and five tests cross-typecheck against windows-sys 0.52.0 and x86_64-pc-windows-msvc. | NOT linked, NOT executed, NOT wired into windows_process::Child/Job. |

Smallest representation selected: outcome table and textual sequence, with observations distinct from proposed mechanism.

Observed (references: resources.json and resources-cancel.json):

```text
Original: launch -> live 3 threads / 1 reader / 5 fds
          Drop + retained external writer -> reader remains
          12 cycles -> 14 threads / 12 readers / 16 fds
          close external writers -> baseline 2 / 0 / 4

Unix spike: launch -> live 3 threads / 1 reader / 7 fds
            kill/Drop while external writers stay open -> baseline 2 / 0 / 4
            after 12 external cycles and another second -> same baseline
```

The extra live Unix fds are the two wake endpoints. Cancellation does not depend on EOF. Quiet direct cancellation observed one poll across 300 ms and stop/join in 69 µs; continuous cancellation took 75 µs. Linux maximum observed Drop was 552 µs quiet and 326 µs continuous. These are measurements, not hard scheduling bounds or an SLA.

## Mechanism and forward effects

Proposed combined mechanism: own the consumer in ChromeProcess, keep the existing post-readiness insertion point, and leave the startup/fallback reader unchanged.

1. Unix nonblocking stderr + wake socket in `poll(-1)` (source/inferred) -> fixed 8 KiB raw consumption (observed through burst progress) -> later bytes continue progressing without retaining logs. Harmful branch: a continuously readable pipe could starve stop; the inner loop checks stop before every read, and continuous-writer cancellation survived on macOS/Linux.
2. Owner kill/Drop signals wake then joins (source/inferred) -> reader closes without EOF (observed with retained external writers) -> exact thread/fd baseline restored (observed). Cost: two extra wake fds per live browser, no periodic idle polling.
3. Construct ChromeProcess before fallible capture setup (source/inferred) -> setup error unwinds owned child/group/profile (observed at two injected setup stages). This is not an actual OS thread-exhaustion test.
4. Windows stop flag + repeated CancelSynchronousIo (source/inferred) -> outstanding read is requested to cancel, but request is not completion (specified). The loop handles the check-to-read race conceptually; persistent cancellation failure could still wait indefinitely. Completion and resource release are unverified on Windows.

## Windows blocker, precisely

There is an installed MSVC Rust standard-library target, but no Windows runtime or Wine. Available Docker reports `linux aarch64`.

The successful typecheck establishes API names, features and Rust handle types. It does not show that a Windows anonymous-pipe read actually stops, that the thread exits, or that handles return to baseline. The standalone prototype is not yet integrated into the existing Child/Job boundary. Its retry loop also has no proven terminating outcome for persistent unexpected cancellation failure.

Do not adopt a silent timeout-and-detach workaround: it would violate the human's chosen release guarantee. Likewise, a polling `PeekNamedPipe` shortcut is not established as nonblocking: [Microsoft explicitly warns about synchronous handles in multithreaded applications](https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-peeknamedpipe). [CancelSynchronousIo requests cancellation but does not wait for completion](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelsynchronousio). An ERROR_NOT_FOUND race is not proof of completion or, alone, grounds to reject a retry design.

No cross-platform teardown claim is made. Next useful work is on a native Windows x86_64 runner: execute the prepared quiet-writer, delayed-entry race, burst, continuous and repeated-cycle tests, then settle the cancellation mechanism/failure behavior and integrate it with the real Child/Job. If the existing synchronous transport cannot meet the contract, probe an overlapped transport separately while preserving fallback and handle inheritance. Do not assume that alternative passes merely from its API name.

## S1–S13 summary

S1: no collector, startup rewrite, public logging API or reaper. S2: Windows remains uncovered. S3: primary/fallback kept distinct. S4: retained writers are verified open; typecheck not treated as runtime. S5: owned consumer releases on Unix. S6: no peer protocol added, platform behavior stated separately. S7: macOS uses real launcher; Windows still standalone. S8: quiet/burst/continuous/external/failure cells derive from the input domain. S9: original consumption has a removal-sensitive test; cancellation still needs maintainable integrated differential tests. S10: API prose limitations are disclosed, not upgraded to execution. S11: discard-only consumer has no extra parsing authority. S12: request is not completion. S13: no new launch-flag semantics; amendment continuity still needs re-execution before delivery.

## Commands, exact status and limits

Root P: `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate`.

- `python3 verify-post-ready.py`, from P: **PASS, exit 0**. Its exact argv/cwd/returncodes are in `post-ready-verification.json`. Negative base is expected 101; positive suite **55 passed, 0 failed**, 0.43 s test time; `cargo fmt --manifest-path cli/Cargo.toml -- --check` exit 0. Original gate integrity also exit 0, 474 base files intact and exact candidate unchanged.
- `/usr/bin/python3 probe.py`, from P/resource-cancellation-probe: **exit 0**. Underlying `cargo test --offline --locked --bin agent-browser native::cdp::chrome::resource_probe::resource_lifecycle_spike -- --ignored --exact --nocapture --test-threads=1`: **1 passed, 0 failed**, 28 helpers reaped, 28 profiles removed, zero supervisor cleanup kills.
- `sh /Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/unix-cancellation-probe/run.sh`: **exit 0**, 1 passed, 0 failed, all 97 children reaped, container removed.
- `cargo check --offline --target x86_64-pc-windows-msvc --tests --target-dir target`, from P/windows-cancellation-probe: **exit 0**, compile-only. Native five tests **NOT RUN**.

Windows next command (not executed; omit `--offline` on a fresh runner that needs the pinned public dependency):

```text
cargo test --locked --target x86_64-pc-windows-msvc --target-dir target -- --test-threads=1
```

Review Gate handoff must include the full C0–C7 contract, original useful-error and continuity checks, retained-writer cancellation accounting, negative controls, all platform limits and contributor credit. No review/merge gate has passed.

## Failed attempts and preservation

Retained rather than erased: Python 3.9 rejected tarfile's `filter=` parameter, then extraction used system tar after proving the destination empty. An initial shared Cargo target reused the negative-control test binary for the positive source; that false failure is excluded. Separate APFS-cloned targets, with only each clone's package artifacts cleaned, produced the final differential.

The initial resource observer had protocol/count/marker races, all recorded in resources.md. Some initial Cargo invocations selected integration targets and replaced the shared candidate runtime; its exact original bytes were hash-restored and independently rechecked. Subsequent probes use private targets. Linux's first harness run buffered readiness; a flush fixed the harness, and the failed attempt remains. Neither incident is represented as a product regression.

Candidate executable SHA-256 remains `6d24863eef6216c684527fc6c1ffe5a084479020bec67ea01e5d7627ea595ead`. Original dirty checkout is still on fix/1401-orphan-tree-on-launch-error, behind 58, with its pre-existing chrome.rs modification. Prior broad-contract artifacts are retained unchanged; this continuation carries its own contract and receipt.
