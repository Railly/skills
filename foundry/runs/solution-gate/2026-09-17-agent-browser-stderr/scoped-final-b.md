# Scoped Final B: Post-readiness stderr drain

## Verdict

**Scoped shape K can Pass to detail. Exact candidate D cannot yet pass unchanged.** Hunter explicitly selected the narrow post-primary-readiness contract and a separate PR based on Simon Ellefsen’s #1527, with Simon credited as human coauthor. Broad R0–R10 artifacts remain historical.

D has strong macOS behavioral evidence, but adds no regression test, ignores thread-spawn failure, and has not proved normal resource release across relaunches. K below retains D’s small mechanism and adds only minimal handling and verification. No blanket cancellation, logging API, timeout rewrite, or framework is required. If ordinary owned Chrome close/relaunch leaks readers, K fails N4 and must change.

## Revised requirements

| R | Requirement | Status |
|---|---|---|
| N0 | Once primary DevToolsActivePort readiness is observed, arbitrary-volume stderr must not prevent ordinary commands from progressing. | Settled core |
| N1 | Preserve readiness selection and startup error/status diagnostics; make no pre-readiness/fallback claim. | Settled must |
| N2 | Commands omitting launch flags retain browser/session/page state; no restart workaround. | Settled must |
| N3 | Post-ready handling retains no unbounded buffer/file, accepts arbitrary bytes/newline-free chunks, and keeps stdout/JSON clean. | Settled must |
| N4 | Normal managed close/relaunch releases reader resources after owned writers exit, without caller EOF wait; prove by repetition. | Settled must |
| N5 | Preserve attached ownership, group/Job/profile cleanup, retry/idle behavior, and no global daemon state. | Settled must |
| N6 | Regression exercises the real launch boundary and fails on base; real-browser continuity is demonstrated. | Settled must |

## Scoped shape K: Simon drain plus bounded proof

| Part | Mechanism | Flag |
|---|---|:---:|
| K1 | After primary DevToolsActivePort readiness, take remaining child stderr and run one named standard thread copying raw bytes directly to `sink()` until EOF. Fallback remains untouched. | |
| K2 | Do not retain/join the reader in caller paths. Normal owned-tree closure supplies EOF; escaped third-party writers remain an explicit exclusion. | |
| K3 | Handle thread spawn failure synchronously as a specific launch-attempt error with existing attempt termination/cleanup/retry, rather than silently discarding `spawn()` failure. | |
| K4 | Add a launch-boundary regression using a fake executable that publishes DevToolsActivePort, emits beyond pipe capacity, then proves post-burst progress. It must fail unchanged base. | |
| K5 | Drive real Chrome with logging: open, marker, snapshot, marker read, ordinary omitted-flag commands, close; assert one PID/group and unchanged page state. | |
| K6 | Repeat normal close/relaunch and measure daemon thread plus descriptor/handle counts after owned writers exit; no monotonic reader growth. Include Windows runtime verification for its `File`/Job boundary. | |
| K7 | PR text credits Simon and explicitly excludes pre-readiness, fallback line/EOF, bounded startup diagnostics, CPU #1371, escaped writers, and general cancellation. | |

## Full binary fit check

| Req | Requirement | D exact | K scoped |
|---|---|:---:|:---:|
| N0 | Once primary DevToolsActivePort readiness is observed, arbitrary-volume stderr must not prevent ordinary commands from progressing. | ❌ | ✅ |
| N1 | Preserve existing readiness selection and startup error/status diagnostics, without claiming to fix pre-readiness or fallback limitations. | ✅ | ✅ |
| N2 | Ordinary commands omitting launch flags retain the same browser/session/page state; no restart workaround. | ✅ | ✅ |
| N3 | Post-ready handling retains no unbounded diagnostic buffer or file, accepts arbitrary bytes and newline-free chunks, and keeps CLI stdout/JSON clean. | ✅ | ✅ |
| N4 | Ordinary managed browser close/relaunch releases its output reader resources after owned writers exit, without adding a caller wait for EOF. Verify repetition rather than inferring cleanup from a single exit code. | ❌ | ✅ |
| N5 | Preserve attached-browser ownership, process-group/Job Object cleanup, profile, retry and idle behavior; do not introduce global daemon state. | ✅ | ✅ |
| N6 | Tests exercise the real launch boundary and fail on unchanged base; user-visible continuity must be demonstrated with a real browser. | ❌ | ✅ |

D fails N0 because ignored spawn failure can return a nominally successful launch without the intended reader; this is a risk, not a measured regression. D fails N4/N6 for missing repeated resource proof/tests. K’s checks are design-fit commitments; implementation must still produce evidence.

## Canonical failure-shape dispositions

| S | Disposition |
|---|---|
| S1 Over-reach | No hit: K changes only post-primary-readiness stderr consumption. |
| S2 Under-reach | No hit under selected N0; pre-readiness is explicitly separate, not hidden. |
| S3 Direction inheritance | No distinct opposite direction inside N0. |
| S4 Proxy property | No hit: K4/K5 prove output and command progress, not an adjacent status. |
| S5 Unregistered peer | Carried risk: detached reader is not lifecycle-registered. K6 must prove normal EOF cleanup; leakage blocks. |
| S6 Peer-version blindness | N/A: no protocol or persistent peer state. |
| S7 Wrong layer | No hit: daemon consumes the actual Chrome stderr; output need not reach users post-ready. |
| S8 Guard-derived cells | No hit: cells cover capacity, arbitrary bytes, relaunch, continuity, and platforms. |
| S9 Test pins wrong thing | Designed out: K4 must fail on unchanged base; K5 separately proves user behavior. |
| S10 Claim from prose | Controlled: verdict relies on returned execution, not hours/recurrence or universal EPIPE claims. |
| S11 Asymmetric validation | N/A: no user-input validator changes. |
| S12 Primitive-contract mismatch | No hit under explicit assumption: primitive ends at EOF after owned writers; escaped writers excluded. K6 verifies normal semantics. |
| S13 Invocation-state collapse | No hit: omitted-flag continuity is already evidenced and required by K5. |

## Detail and delivery verification targets

1. Base-failing K4 regression passes with K and does not rely on harness timeout as product behavior.
2. Real Chrome `--v=1` and `--v=2` continuity passes with clean stdout/JSON and no relaunch.
3. Repeated close/relaunch shows stable post-close thread and descriptor/handle counts. Any normal monotonic growth blocks.
4. Forced thread-spawn failure, through the cheapest local seam available, returns the specific attempt error and follows existing cleanup/retry.
5. Windows runtime pass confirms drain and Job cleanup; Mac evidence cannot substitute.
6. Build, format, focused tests, and scoped PR text pass. Separate PR credits `Co-authored-by: Simon Ellefsen` using the verified contributor email before commit.
