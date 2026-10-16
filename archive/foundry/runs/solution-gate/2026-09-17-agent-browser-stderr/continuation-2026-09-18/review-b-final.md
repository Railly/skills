# Review B final: narrow post-ready shape gate

## Evidence status

The candidate’s narrow mechanism is now materially evidenced on macOS.

- Production `try_launch_chrome` takes stderr only after primary `DevToolsActivePort` readiness and starts the byte-oriented sink thread. Fallback remains separate because it already takes stderr.
- The +57 test-only patch calls that production function directly. Two post-ready rounds each write an invalid byte plus 2 MiB without newline and require progress while the same child remains alive. It adds no runtime abstraction.
- Reported fresh candidate run passed in 0.44 s. The identical test in pristine base failed with exit 101, `stderr burst 1 blocked after readiness`. The allowed `verification.json` confirms the expected base exit 101. The earlier shared-target suite result is excluded because cache reuse confounded its control binary.
- The final 55-test candidate suite is **not yet receipted as complete**: `post-ready-results/verification.json` has no overall `PASS` and contains only `negative-base`.

The lifecycle spike is release proof, not automatic shape approval. In one host PID, 12 owned cycles, split across quiet/8 MiB writers and kill-then-Drop/Drop-only, returned from live `3 threads / 1 reader / 5 fds` to the exact `2/0/4` baseline every cycle. Drop did not block. Conversely, 12 externally held duplicated write ends accumulated exactly 12 drain threads and 12 host fds after Drop; all returned to baseline only when those write ends closed. This proves EOF-dependent retention, not a normal Chrome escape or permanent leak.

## Full narrow R × D fit check

| Req | Requirement | Status | D |
|---|---|---|:---:|
| R0a | After primary readiness succeeds, browser stderr volume must not block later commands, including long unterminated output and invalid bytes. | Core | ✅ |
| R0b | Pre-readiness output and existing stderr fallback redesign are separate follow-up work. Do not improve, worsen, or claim them fixed here. | Must | ✅ |
| R1 | Preserve primary readiness and fallback detection/status/diagnostics. No new bounded-diagnostic promise for the untouched fallback. | Must | ✅ |
| R2 | Preserve existing owned-vs-attached process/group/Job/profile cleanup, retries, idle policy and platform interfaces. | Must | ✅ |
| R3 | Omitted launch flags preserve PID/target/URL/application state. Explicit close/relaunch resets browser state according to existing semantics. | Must | ✅ |
| R4 | Post-ready output consumption retains bounded bytes and no default durable logs or stdout pollution. | Must | ✅ |
| R5 | Measure worker/fd release during repeated launch/kill/drop, including a quiet writer in the owned boundary; disclose retention outside it rather than silently accepting it. | Must | ❌ |
| R6 | Windows runtime and Linux runtime cannot be claimed from macOS. No Unix-only production implementation hidden behind a common API. | Must | ✅ |
| R7 | A maintainable regression exercises the production launch path and fails if consumption is removed, without a test-only runtime abstraction. | Must | ✅ |

R5 is the sole shape-gate failure. Its owned-boundary measurement passes strongly. Its outside-boundary branch is no longer an unknown: each held writer retains one thread and fd without a candidate-side bound, while Drop remains nonblocking. Because that is a newly measured lifetime cost, `continue` is not acceptance. Before Pass, a human must explicitly choose either:

1. accept EOF lifetime outside the owned process group/Job as the narrow contract boundary, with the measured retention disclosed; or
2. require bounded cancellation/ownership and return the shape for modification.

That decision must not be inferred from the clean owned-cycle plateau. Nor does the synthetic external writer alone justify a general collector, logging system, or reaper.

## S1–S13 compact dispositions

| S | Disposition |
|---|---|
| S1 Over-reach | No hit. Production remains a 19-line post-ready sink; the patch is test-only. |
| S2 Under-reach | No hit against narrowed R0a. Pre-readiness/fallback remain explicitly out, not claimed fixed. |
| S3 Direction inheritance | No hit. Primary and fallback stderr ownership remain distinguished. |
| S4 Proxy property | No hit. Test observes completion of two over-capacity writes, not readiness alone. |
| S5 Unregistered peer | **Measured concern.** Owned teardown releases it; outside writers retain one unregistered reader each. Human boundary decision remains. |
| S6 Peer-version blindness | N/A. No protocol/version change. |
| S7 Wrong layer | No hit. Regression invokes production `try_launch_chrome` and its actual drain. |
| S8 Guard-derived cells | No hit. Post-ready volume, lifecycle, and outside-writer discriminators preceded this update. |
| S9 Test pins wrong thing | No hit. Removing consumption fails pristine base. Final candidate suite receipt remains pending. |
| S10 Claim from prose | Controlled. Credit 0.44 s positive as supplied and exit-101 base as receipted; exclude the cache-confounded suite and do not claim final 55-test PASS. |
| S11 Asymmetric validation | No hit. Sink parses nothing; fallback behavior is untouched. |
| S12 Primitive-contract mismatch | **Hit unless accepted.** `io::copy` correctly drains bytes but its lifetime is EOF, not bounded by `ChromeProcess` when a writer escapes ownership. |
| S13 Invocation-state collapse | No hit based on prior same-session evidence; this focused regression does not independently retest CLI state continuity. |

## Gate conclusion

The narrow correction and its owned lifecycle behavior are supported, and R7 now has a credible differential regression. **Withhold Pass solely pending explicit human acceptance or rejection of the measured outside-boundary EOF lifetime.** Also keep the final 55-test suite receipt conditional until the canonical verification JSON records `PASS`.

This is not production, merge, commit, or publication authorization. Linux/Windows runtime evidence, broader startup/fallback work, and any delivery decision remain separate.
