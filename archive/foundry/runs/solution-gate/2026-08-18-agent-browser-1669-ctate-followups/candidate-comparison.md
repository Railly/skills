# Candidate comparison

PR: `vercel-labs/agent-browser#1669`

Candidate: `2d4c797e62ce06171da858e6b138200b006ba35d`

Selected blind shape: packaged `certutil` with one set, omit, and clear
transition stamp.

## Comparison

| Dimension | Blind result | Candidate | Delta |
|---|---|---|---|
| Contract observable | Selective CA trust after first-party setup; sticky omission; explicit clear through all launch families | Selective NSS trust and sticky omission work, but clean setup and provider clear fail | Material bounded delta |
| Primitive semantics | Private per-browser NSS store populated with `certutil` | Same | Equivalent |
| Authority and trust boundary | Chromium remains verifier; only one CA anchor is added | Same | Equivalent |
| Negative discriminator cells | Wrong host and unrelated CA reject; provider omit rejects; provider clear proceeds | TLS negative matrix preserved; provider clear is dropped | One failed cell |
| Ownership and lifecycle | Chrome process owns private NSS HOME and cleanup | Same | Equivalent |
| Compatibility and portability | Linux local Chrome only; unsupported engines reject | Same | Equivalent |
| Reusable implementation | Shared loader, private HOME/XDG, effective digest, sticky state, clear boolean, MCP/Eve/docs | Candidate contains all of these | Preserve |
| External executable delivery | All first-party installers provide `certutil` | Runtime error and docs ask users to install it manually | Missing package ownership |
| Transition delivery | One helper stamps all four envelopes | Three copied blocks; provider omitted | Structural drift |
| Verification | Constructor matrix plus installer invariant and clean images | Resolver, parser, MCP, and isolated mode tests | Test-strength amendment |
| New accepted costs | Tools packages added to Linux setup; Eve cache invalidated | Not yet accepted in implementation | Add explicitly |

## Requirement fit

| Req | Candidate | Evidence |
|---|:---:|---|
| R0 | ✅ | Private NSS mechanism matches the previously probed trust contract |
| R1 | ❌ | P1 |
| R2 | ❌ | P1 and P7 |
| R3 | ✅ | NSS preparation occurs before Chrome launch and cleans failed preparation |
| R4 | ✅ | `certutil` is invoked only when effective CA exists |
| R5 | ❌ | P2 |
| R6 | ❌ | Provider never sends clear, despite correct daemon ordering in P3 |
| R7 | ✅ | Omission retains effective CA and external launch validation rejects |
| R8 | ✅ | CLI and daemon reject CA set with provider before provider work |
| R9 | ❌ | Provider transport differs from local, CDP, and auto-connect |
| R10 | ✅ | P4 and P5 |
| R11 | ❌ | P6 |
| R12 | ✅ | CLI outbound TLS is untouched |
| R13 | ✅ | Existing commits preserve Chris Tate and Martín Fernández credit |
| R14 | ❌ | Dedicated boolean exists, but provider transport drops it |
| R15 | ❌ | Provider owns an envelope but does not stamp the transition |
| R16 | ✅ | P5 |
| R17 | ❌ | P7 |
| R18 | ❌ | P1, P2, and P6 |
| R19 | ✅ | Unsupported engine and platform checks exist |
| R20 | ✅ | Candidate uses private HOME/XDG NSS state |
| R21 | ✅ | Dedicated clear boolean exists across CLI, config, environment, MCP, and Eve |

## Candidate forward trace

```text
CA file
  -> shared certificate loader [observed]
  -> effective digest in daemon state [observed]
  -> private NSS HOME prepared before browser replacement [observed]
  -> Chrome receives HOME and XDG_DATA_HOME [observed]
  -> normal Chromium verifier trusts the supplied anchor [previously observed]
```

Harmful branches:

```text
new certutil invocation
  -> first-party dependency maps unchanged [observed P1]
  -> clean installation lacks executable [observed case]
  -> feature fails before browser launch [observed case]
```

```text
explicit provider clear
  -> provider constructor omits clearCaCert [observed P2]
  -> daemon interprets absence as omission [observed]
  -> effective CA remains set [inferred from resolver]
  -> provider compatibility rejects stale local CA [observed case]
```

## Reusable work

Preserve:

- NSS trust primitive and private HOME/XDG ownership
- shared CA loader
- sticky effective CA state
- certificate-content digest and browser reuse behavior
- preflight and cleanup ordering
- dedicated `clearCaCert` representation
- CLI, config, environment, MCP, Eve, schemas, help, docs, and skill surfaces
- contributor credit already present in commit history

Amend:

- one shared transition-stamping helper called by all four launch constructors
- provider clear transport
- `libnss3-tools` and `nss-tools` across the reconciled owner inventory
- Eve bootstrap revision
- constructor and transition matrix tests
- executable-to-installer invariant and clean-image checks

Reject:

- manual-install documentation as fulfillment of first-party setup ownership
- copying another provider-only CA block without structural coupling

## Equivalence probes

The candidate and selected shape are equivalent only where these probes
survive:

- NSS primitive: previously recorded trust matrix.
- effective-state reuse: P5.
- clear representation through MCP/config/env: P6 plus existing flag tests.
- all constructors: P2, currently refuted.
- setup ownership: P1, currently refuted.

The refuted equivalence probes are bounded amendments. They do not invalidate
the candidate's trust primitive or state model.
