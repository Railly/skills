# Reconciliation

Date: 2026-08-18

Mode: candidate audit

Reviewers:

- Cursor `claude-fable-5-thinking-xhigh`
- Cursor `cursor-grok-4.6-xhigh`

## Synthesis kind

Graft. Both reviewers independently selected the same core shape. The
reconciled shape takes Fable's explicit effective-state hashing and
session-scoped NSS ownership, plus Grok's forced-send rule and complete
constructor and installer inventory.

## Reconciled requirements

| Req | Requirement | Status |
|---|---|---|
| R0 | A first-party-supported local Chromium session on Linux can trust certificates issued by one user-supplied private CA without disabling ordinary certificate verification. | Core goal |
| R1 | After first-party dependency setup on each supported Linux package family and in the default Eve sandbox, selective CA trust works without a second manual package-install step. | Must-have |
| R2 | Every production external executable introduced by the feature is mapped to its provider package in every first-party installer and sandbox bootstrap that owns the feature. | Must-have |
| R3 | A missing or failing prerequisite produces an actionable error before Chromium launches and leaves no created trust or browser state behind. | Must-have |
| R4 | Without CA configuration, existing installation and launch behavior remains unchanged. | Must-not-change |
| R5 | In a continuing named session, omission preserves the prior effective CA, while explicit clear removes it. Set, omit, and clear remain distinct through every launch envelope. | Must-have |
| R6 | After local CA trust is set, provider plus explicit clear removes local-only state before provider compatibility is evaluated. | Must-have |
| R7 | After local CA trust is set, provider plus omitted CA retains the CA and rejects before provider work. | Must-have |
| R8 | A provider request that sets local-only CA trust rejects before provider work. | Must-have |
| R9 | Local, provider, CDP, auto-connect, MCP, config, environment, and Eve paths express one set, omit, and clear contract or reject before partial work. | Must-have |
| R10 | Set-same reuses the browser. Set-changed and explicit clear replace only the browser as declared. Omission never aliases to removal. | Must-have |
| R11 | Tests derive cells from prior state, request transition, and every independent launch constructor. | Must-have |
| R12 | The CLI's own outbound TLS trust remains outside this change. | Must-not-change |
| R13 | Useful candidate work and contributor attribution are preserved when compatible with the contract. | Must-have |
| R14 | Explicit clear has a dedicated, non-empty wire representation distinct from omission and preserved by JSON, argv, MCP, config, environment, and Eve. | Derived must-have |
| R15 | Set and clear always produce a daemon-visible launch command. Provider, CDP, and auto-connect stamp the transition onto their own envelope. | Derived must-have |
| R16 | Browser reuse hashes the effective certificate digest after transition resolution, never the raw invocation field or path. | Derived must-have |
| R17 | The owned dependency inventory includes CLI apt/dnf/yum, Eve apt/dnf, the published Vercel sandbox helper, and the first-party environments bootstrap. Eve's bootstrap revision changes with its dependency set. | Derived must-have |
| R18 | A deterministic invariant fails if a required executable loses a package mapping or any launch constructor loses explicit clear. | Derived must-have |
| R19 | CA set rejects for Lightpanda and unsupported platforms before partial work. | Settled by candidate-compatible shape |
| R20 | Trust storage is isolated per launched Chromium process through a private NSS HOME/XDG environment. | Settled by prior runtime probe and candidate-compatible shape |
| R21 | CLI, config, environment, MCP, and Eve use a dedicated clear boolean whose precedence cannot alias to omission. | Settled by candidate-compatible shape |

## Ownership reconciliation

The reviewers found five dependency-list copies. They are not equal owners.

| Path | Classification | Requirement |
|---|---|---|
| `cli/src/install.rs` | Production installer | Must install `libnss3-tools` on apt and `nss-tools` on dnf/yum |
| `packages/@agent-browser/eve/extension/lib/sandbox.ts` | Production Eve bootstrap | Must install both provider packages and bump `EVE_BOOTSTRAP_REVISION` |
| `packages/@agent-browser/sandbox/src/vercel.ts` | Published production sandbox helper | Must install `nss-tools` |
| `examples/environments/lib/agent-browser-sandbox.ts` | First-party deployable example with copied bootstrap | Must stay aligned or consume the published shared list |
| `benchmarks/bench.ts` | Private benchmark tooling | Not a blocker for R2, but should consume the shared list or carry an explicit exemption to prevent drift |

## Selected shape: packaged certutil with one transition stamp

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Keep the private per-browser NSS HOME/XDG store and `certutil` import mechanism. | |
| A2 | Add `libnss3-tools` and `nss-tools` to every owned first-party setup map. Bump Eve bootstrap revision. | |
| A3 | Represent invocation intent once as set, omit, or clear and stamp it through one helper called by local, provider, CDP, and auto-connect constructors. | |
| A4 | Resolve intent against sticky daemon state before compatibility checks. Hash the effective certificate digest. | |
| A5 | Preserve preflight and cleanup: parse the CA and prepare the replacement NSS store before closing the active browser. | |
| A6 | Reject retained or newly set local CA for external launches. Apply explicit clear first, then permit the external launch. | |
| A7 | Add constructor-matrix, transition-matrix, installer-invariant, Eve revision, and clean-image tests. | |

## Fit check: R × A

| Req | Requirement | Status | A |
|---|---|---|:---:|
| R0 | A first-party-supported local Chromium session on Linux can trust certificates issued by one user-supplied private CA without disabling ordinary certificate verification. | Core goal | ✅ |
| R1 | After first-party dependency setup on each supported Linux package family and in the default Eve sandbox, selective CA trust works without a second manual package-install step. | Must-have | ✅ |
| R2 | Every production external executable introduced by the feature is mapped to its provider package in every first-party installer and sandbox bootstrap that owns the feature. | Must-have | ✅ |
| R3 | A missing or failing prerequisite produces an actionable error before Chromium launches and leaves no created trust or browser state behind. | Must-have | ✅ |
| R4 | Without CA configuration, existing installation and launch behavior remains unchanged. | Must-not-change | ✅ |
| R5 | In a continuing named session, omission preserves the prior effective CA, while explicit clear removes it. Set, omit, and clear remain distinct through every launch envelope. | Must-have | ✅ |
| R6 | After local CA trust is set, provider plus explicit clear removes local-only state before provider compatibility is evaluated. | Must-have | ✅ |
| R7 | After local CA trust is set, provider plus omitted CA retains the CA and rejects before provider work. | Must-have | ✅ |
| R8 | A provider request that sets local-only CA trust rejects before provider work. | Must-have | ✅ |
| R9 | Local, provider, CDP, auto-connect, MCP, config, environment, and Eve paths express one set, omit, and clear contract or reject before partial work. | Must-have | ✅ |
| R10 | Set-same reuses the browser. Set-changed and explicit clear replace only the browser as declared. Omission never aliases to removal. | Must-have | ✅ |
| R11 | Tests derive cells from prior state, request transition, and every independent launch constructor. | Must-have | ✅ |
| R12 | The CLI's own outbound TLS trust remains outside this change. | Must-not-change | ✅ |
| R13 | Useful candidate work and contributor attribution are preserved when compatible with the contract. | Must-have | ✅ |
| R14 | Explicit clear has a dedicated, non-empty wire representation distinct from omission and preserved by JSON, argv, MCP, config, environment, and Eve. | Derived must-have | ✅ |
| R15 | Set and clear always produce a daemon-visible launch command. Provider, CDP, and auto-connect stamp the transition onto their own envelope. | Derived must-have | ✅ |
| R16 | Browser reuse hashes the effective certificate digest after transition resolution, never the raw invocation field or path. | Derived must-have | ✅ |
| R17 | The owned dependency inventory includes CLI apt/dnf/yum, Eve apt/dnf, the published Vercel sandbox helper, and the first-party environments bootstrap. Eve's bootstrap revision changes with its dependency set. | Derived must-have | ✅ |
| R18 | A deterministic invariant fails if a required executable loses a package mapping or any launch constructor loses explicit clear. | Derived must-have | ✅ |
| R19 | CA set rejects for Lightpanda and unsupported platforms before partial work. | Settled | ✅ |
| R20 | Trust storage is isolated per launched Chromium process through a private NSS HOME/XDG environment. | Settled | ✅ |
| R21 | CLI, config, environment, MCP, and Eve use a dedicated clear boolean whose precedence cannot alias to omission. | Settled | ✅ |

## Losing material

- Direct writes to `cert9.db` remain rejected because they rely on unstable NSS
  internals and add corruption risk.
- A provider-only hole patch remains rejected because it leaves the next
  constructor drift structurally possible.
- An out-of-band state command remains rejected because clear plus launch would
  no longer be atomic.
- Vendoring `certutil` remains rejected because distro packages already supply
  it and the bundled-binary portability and licensing costs are unnecessary.

## Carried verification targets

1. Clean Debian setup resolves `certutil` through `libnss3-tools`.
2. Clean Amazon Linux setup resolves `certutil` through `nss-tools`, including
   the `dnf --skip-broken` paths.
3. Every launch constructor distinguishes clear from omit.
4. Provider plus clear reaches the daemon as clear.
5. Provider plus omit retains CA and rejects before provider work.
6. Set-same and set-omit preserve browser and page continuity.
7. Eve dependency changes invalidate its bootstrap key.
