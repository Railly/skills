# Probe log

Candidate head: `2d4c797e62ce06171da858e6b138200b006ba35d`

Base: `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`

## P1. External executable ownership

Command:

```text
skills/review-gate/scripts/gate.sh execdeps cases/agent-browser/conventions.md 548b159b30eef119ccf6846c8bc807d0eaa3f6f8
```

Observed:

```text
FINDING [execdeps] 'certutil' is added under 'cli/src/native/cdp/chrome.rs' but 'cli/src/install.rs' installs no package matching /libnss3-tools|nss-tools/
FINDING [execdeps] 'certutil' is added under 'cli/src/native/cdp/chrome.rs' but 'packages/@agent-browser/eve/extension/lib/sandbox.ts' installs no package matching /libnss3-tools|nss-tools/
```

Result: refuted. The candidate does not satisfy the existing executable
dependency gate.

## P2. Launch-constructor clear inventory

Command:

```text
nl -ba cli/src/main.rs | sed -n '1368,1410p;1480,1512p;1524,1565p;1632,1656p'
```

Observed:

- Auto-connect stamps `caCert` and `clearCaCert`.
- CDP stamps `caCert` and `clearCaCert`.
- Local launch stamps `caCert` and `clearCaCert`.
- Provider stamps neither field.

Result: refuted. Three of four constructors preserve clear. Provider aliases
explicit clear to omission.

## P3. Transition ordering in the daemon

Command:

```text
nl -ba cli/src/native/actions.rs | sed -n '4153,4170p;4284,4310p'
```

Observed:

1. `resolve_effective_ca_cert(cmd, state)` runs at the start of `handle_launch`.
2. The resolved state is applied to `LaunchOptions`.
3. `validate_ca_cert_launch_mode` runs afterward.
4. Provider work is reached only after validation.

Result: survived. If clear reaches the daemon, it is resolved before provider,
CDP, or auto-connect compatibility.

## P4. Clear-only local forced send

Command:

```text
nl -ba cli/src/main.rs | sed -n '205,233p'
```

Observed:

- `flags.clear_ca_cert` makes `should_send_local_launch_config` true.
- The local envelope is suppressed only when provider, CDP, or auto-connect has
  its own envelope.

Result: survived for local launches. For providers, correctness therefore
depends entirely on stamping clear into the provider envelope, which P2
refuted.

## P5. Effective-state hashing

Command:

```text
rg -n "resolve_effective_ca_cert|apply_effective_ca_cert|ca_cert_digest|launch_hash" cli/src/native/actions.rs
```

Observed:

- Omission resolves to `state.effective_ca_cert`.
- Same certificate content reuses the current effective certificate.
- `launch_hash` consumes `ca_cert_digest`, not the request path.

Result: survived. The candidate closes the earlier set-to-omit continuity
failure.

## P6. Candidate unit tests

Commands:

```text
cargo test --manifest-path cli/Cargo.toml ca_cert -- --nocapture
cargo test --manifest-path cli/Cargo.toml common_global_args_include_clear_ca_cert -- --nocapture
```

Observed:

- CA-focused suite: 16 passed.
- MCP clear argv test: 1 passed.
- No test builds all four launch envelopes for the same clear transition.
- No test covers provider plus clear after a prior CA is set.

Result: existing tests survive, but do not discriminate the reported provider
failure. This is a green suite with a missing contract cell.

## P7. First-party dependency ownership

Commands:

```text
rg -n "libnss3|nss-tools|libnss3-tools|CHROMIUM_SYSTEM_DEPS|EVE_BOOTSTRAP_REVISION" cli packages examples benchmarks
```

Observed:

- `cli/src/install.rs`: production apt/dnf/yum owner.
- Eve `sandbox.ts`: production apt/dnf owner and cached bootstrap revision.
- `packages/@agent-browser/sandbox/src/vercel.ts`: published production dnf
  owner.
- `examples/environments/lib/agent-browser-sandbox.ts`: first-party deployable
  copied bootstrap.
- `benchmarks/bench.ts`: private benchmark copy.

Result: survived with reconciliation. The first four are mandatory alignment
surfaces. The benchmark is not a production blocker but should not remain an
untracked copy.

## P8. Candidate cleanliness

Commands:

```text
git diff --check 548b159b30eef119ccf6846c8bc807d0eaa3f6f8..HEAD
git status --short
```

Observed:

- Diff check passed.
- Only pre-existing `.decisions.tsv` is untracked.

Result: survived. No candidate files were modified during this audit.

## Evidence visual

```text
User intent: CLEAR
  |-- local envelope --------> clearCaCert=true --------> daemon clears [P2,P3]
  |-- CDP envelope ----------> clearCaCert=true --------> daemon clears [P2,P3]
  |-- auto-connect envelope -> clearCaCert=true --------> daemon clears [P2,P3]
  `-- provider envelope -----> field absent ------------> daemon omits [P2]
                                                        `-> stale CA retained
                                                            `-> provider rejected
```
