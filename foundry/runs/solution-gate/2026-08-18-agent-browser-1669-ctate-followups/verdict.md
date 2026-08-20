# Solution Gate verdict

Date: 2026-08-18

PR: `https://github.com/vercel-labs/agent-browser/pull/1669`

Base: `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`

Candidate: `2d4c797e62ce06171da858e6b138200b006ba35d`

## Verdict

**Amend.**

Keep the candidate. Its NSS trust primitive, private process-owned store,
sticky state, effective-content hashing, cleanup ordering, and public surfaces
match the selected blind shape.

Do not recreate it. The material gaps are bounded:

1. First-party Linux and sandbox setup does not install `certutil`.
2. The provider launch constructor drops explicit clear.
3. Tests do not bind either invariant, so the focused suite stays green while
   both reported failures remain.

## Required amendment

1. Extract one CA transition stamping helper and call it from local, provider,
   CDP, and auto-connect launch constructors.
2. Add `libnss3-tools` to apt setup and `nss-tools` to dnf/yum setup in:
   - CLI installer
   - Eve bootstrap
   - published `@agent-browser/sandbox` Vercel helper
   - first-party environments bootstrap
3. Bump `EVE_BOOTSTRAP_REVISION`.
4. Keep `benchmarks/bench.ts` aligned through shared ownership or document its
   private-tooling exemption.
5. Add a table test over all four constructors for set, omit, and clear.
6. Add daemon transition tests for prior set plus provider omit and prior set
   plus provider clear.
7. Extend the executable dependency invariant to all mandatory owners.
8. Verify clean Debian and Amazon Linux setup makes `certutil` resolvable.

## Failure-shape score

| Shape | Candidate | Disposition |
|---|---|---|
| S1 over-reach | No current hit | Package footprint is an accepted Linux setup cost. Verify no-CA runtime behavior remains unchanged. |
| S2 under-reach | Hit | The fix covered three constructors and two named setup owners, not the full class. Designed out by complete inventories and invariants. |
| S3 direction inheritance | No hit | Set, omit, changed, and clear are represented in the state model. |
| S4 proxy property | Hit | Actionable runtime failure is adjacent to first-party dependency ownership; resolver tests are adjacent to envelope delivery. |
| S5 unregistered peer | Hit | `certutil` is a new production dependency unknown to installers and bootstraps. |
| S6 peer-version blindness | Conditional hit | Eve package changes require a bootstrap revision bump so existing templates reinstall dependencies. |
| S7 wrong layer | Hit | Clear exists at parser and daemon layers but does not cross the provider envelope. |
| S8 guard-derived cells | Hit | Tests cover resolver and MCP branches, not the external prior-state × request × constructor domain. |
| S9 test pins wrong thing | Hit | Sixteen CA-focused tests pass while provider clear and clean setup still fail. |
| S10 claim from prose | No hit after cases | Package providers and runtime behavior have clean-image evidence. Keep clean-image verification in the amendment. |
| S11 asymmetric validation | No hit | The candidate uses one shared certificate loader before the NSS trust grant. |
| S12 primitive-contract mismatch | No hit | NSS anchor import matches selective CA trust and preserves ordinary verification. |
| S13 invocation-state collapse | Hit at transport boundary | Provider clear collapses to omission because the field is absent. The daemon state model itself is correct. |

S1 and S2 receive the highest weight because this candidate already fixes
earlier review findings. S2 is a direct hit, but its remedy is bounded and does
not require replacing the candidate's architecture.

## Smallest auditable visuals

Observed candidate:

```text
clear intent
  -> CLI/config/env/MCP/Eve boolean
  -> local, CDP, auto-connect envelopes
  -> daemon resolves before compatibility

clear intent
  -> provider envelope drops field
  -> daemon sees omission
  -> stale CA remains
```

Selected amendment:

```text
CaIntent(Set | Omit | Clear)
  -> one stamp helper
      |-> local
      |-> provider
      |-> CDP
      `-> auto-connect
  -> resolve effective state
  -> validate launch family
  -> hash effective digest
  -> reuse or replace browser
```

```text
certutil production call
  -> dependency invariant
      |-> CLI apt/dnf/yum
      |-> Eve apt/dnf + revision
      |-> published Vercel sandbox
      `-> first-party environments bootstrap
```

## Credit

Preserve the existing commit history and co-author credit for Chris Tate and
Martín Fernández. The amendment extends their compatible work and does not
replace its mechanism.

## Handoff to implementation and Review Gate

Implementation receives the eight required amendment items above.

Review Gate receives these forced cells:

- clean Debian after first-party setup
- clean Amazon Linux after first-party setup
- default Eve after bootstrap revision change
- missing `certutil` before browser launch with no leaked state
- prior set plus local omit
- prior set plus provider omit
- prior set plus provider clear
- prior unset plus provider clear
- prior set plus CDP clear
- prior set plus auto-connect clear
- set-same browser continuity
- set-changed replacement
- remove one installer mapping and require a red invariant
- remove clear stamping from one constructor and require a red test

No candidate code, GitHub comments, PR state, or remote refs were changed in
this Solution Gate run.
