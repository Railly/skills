# Review Gate: vercel-labs/agent-browser

Date: 2026-09-17
Repository: vercel-labs/agent-browser
Base: `fbd046c23a2c1156891bda294aaaee715c23b3f1`
Head: `da4c99fa1c781b6bd6a440348c147287f0cdb603`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: independent-correctness-review.json
- Degraded from: fx_worker
- Schema failures: 2
- Independence gap: Native reviewer is another OpenAI-family context and author model is unknown. Saved official API contract supplies an independent protocol oracle, but there is no complete cross-family lifecycle challenge.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/contract.md
- Spec status: not_provided
- Acceptance reviewed: A1, A2, A3, A4

## Stage receipts

- Test Strength: unavailable. No upstream receipt supplied or found for this head. Review Gate consumes Test Strength, not a substitute authored-test receipt.
- Resilience Audit: unavailable. Managed remote lifecycle and partial commit points trigger this stage; no passing exact-head receipt found. Focused reproductions establish findings only.
- Security Review: pass

## Verified properties

- P1: V4 create yields a usable CDP session and retains cleanup ownership. Wire names verified; full successful remote create/attach and failure cleanup not observed.
- P2: Profile, country/direct, and recording settings reach the V4 create body. Two authored Browser Use tests pass and schema keys match; live option effects remain unverified.
- P3: Close stops the owned session or reports and preserves a retryable cleanup failure. cleanup-probe-final.log reproduced success after failed stop; retained session=false; STOP_TRANSPORT_ATTEMPTS=1 after two closes.
- P4: Provider setup and failure leave the daemon able to respond or terminate within a finite deadline. Final dogfood.json: open exceeded 36.004s, close exceeded 5.004s; daemon survived explicit 1s idle timeout. Releasing fixture restores progress.

## Deterministic checks

- `style`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/style.log
- `surfaces`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/surfaces.log
- `stale`: acknowledged. Only CHANGELOG.md:546 retains old endpoint as historical release record; read and exempted.
- `siblings`: acknowledged. Unchanged API-key setup examples remain correct; doctor/providers.rs only tests required credential presence; current provider source reads existing key. No stale behavior in those passages.
- `callers`: acknowledged. Every listed caller read in actions.rs, including failed attach and close ownership; F1/F2 remain open.
- `callers-options`: acknowledged. Every listed caller read in actions.rs, including failed attach and close ownership; F1/F2 remain open.
- `cleanup-callers`: acknowledged. Every listed caller read in actions.rs, including failed attach and close ownership; F1/F2 remain open.
- `timings`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/timings.log
- `execdeps`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/execdeps.log
- `diff-check`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/diff-check.log
- `fmt`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1691-da4c99f/fmt.log
- `covered initial`: acknowledged. Implementation checks only directory name; passed because run directory contains head prefix before report existed. Final report validator is authoritative.
- `exact skill identity`: pass. skill-identity.json; canonical tracked skill clean and installed symlink resolves to revision.
- `cargo build --locked`: pass. build.log, exact binary digest recorded in dogfood.json.
- `cargo clippy --locked`: pass. fmt-clippy.log exit 0.
- `cargo test --locked -- --test-threads=1`: pass. tests.log: 1157 unit tests and 2 integration tests passed; 107 tests ignored.
- `radius impact`: acknowledged. impact-map.json saved canonically; rust-analyzer duplicate-symbol diagnostics limit completeness. All material caller edges independently enumerated by rg.
- `docs production build`: pass. bun run --cwd docs build --webpack exit 0, docs-build-webpack.log. Unchanged package manifest with temporary reused dependencies. Default Turbopack rejected out-of-root dependency symlinks; no source build error found.
- `failed-stop caller probe`: pass. cleanup-probe-final.log: clean rerun exit 0, explicitly asserts the defective behavior; confirms F2 rather than accepting the implementation.
- `final identity`: pass. final-state.json: remote PR head unchanged, local dirty state clean, final binary SHA matches replayed dogfood; review-created dependency symlinks removed.

## Judgment lenses

- Inverse regression surface: run. Direct unowned WebSocket connection becomes remote POST plus retained session; reviewed API discovery/cleanup differences. P1 gap retained.
- New-domain matrix: skipped. No validator widening; provider protocol replacement covered by inverse/reference and lifecycle lenses.
- Resolution-rule consistency across consumers: skipped. No changed discovery/precedence rule; the new env helper has one production caller shared by both launch families.
- Shell re-parse append domain: skipped. No shell command construction changed.
- Emission channel and one-shot latch reachability: run. Missing-key error reached CLI JSON. Provider errors returned through callers; silent stop failure is F2.
- Shim hermeticity: skipped. Contributor adds no external-binary shim.
- Deliberate-default check: run. Historical direct-WSS changelog is deliberate past behavior but current normative Cloud docs require V4 create/CDP/stop. Live root-cause claim remains unverified.
- Fresh-seam scan: skipped. No runtime signal patch or framework seam.
- Substrate differential corpus: skipped. No substrate-modeling guard or detector added.
- Reference-implementation oracle: run. Saved official V4 OpenAPI verifies API fields and stop semantics; full live matrix missing.
- New-failure-outcome propagation: run. All auto-launch, explicit launch and cleanup call sites enumerated through gate and radius, read at caller layer; F1/F2 cover lock and ownership failures.
- Flag-propagation dispatch sweep: run. Both provider dispatch variants reach same env lookup. MCP inherits process env and existing CLI provider dispatch; no new per-command flags. Live configuration transition matrix not verified.
- Error-path forcing: run. Missing API key, stalled create and failed cleanup transport forced. Required full resilience partitions unavailable.
- Non-destructive recovery: skipped. No heuristic recovery added.
- Cancellation and timeout hygiene: run. Real CLI exceeded 36s; close blocked, 1s idle timeout ineffective; F1.
- Boundary pipeline trace: run. Traced create, body decode, CDP connect, active session remember, close and shutdown; parse-before-ownership gap noted.
- Substrate verification: run. Binary SHA and responding daemon process verified. Stop proxy observes attempt count and response failure; no remote billing assertion from mere closed output.
- Dogfood the built artifact: run. Actual CLI help, missing key, blocked provider setup and recovery driven before authored tests. Live happy path unavailable.
- Newly-asserted invariant ownership: run. Close/billing invariant depends on remote stop outcome, which helper discards and caller forgets; F2.
- Docs-behavior parity: run. All changed surfaces consistent on env fields. New billing-stop guarantee disproved by F2 and idle shutdown guarantee defeated by F1.
- Demonstrative example: run. New docs example uses new env settings, verified structurally against API; not executed against a paid session.
- Choice audit: skipped. No contributor decision trail supplied.
- Complexity budget: skipped. No per-element loop, membership or candidate scan added.

## Findings

- F1: confirmed, open. Bound the new Browser Use create request so a stalled connection cannot monopolize the daemon command lock. Evidence: dogfood.json: actual open still blocked after 36.004s, close blocked past 5s, and daemon remains alive despite AGENT_BROWSER_IDLE_TIMEOUT_MS=1000. actions.rs awaits provider creation under daemon.rs:553-554 state lock; reqwest Client::new has no request deadline. Releasing localhost proxy restores progress.
- F2: confirmed, open. Do not discard the managed Browser Use session after an unacknowledged stop. Evidence: New Some(ProviderSession) at providers.rs:469-472 activates the cleanup path. actions.rs:2067-2069 takes ownership before stop; providers.rs:140-151 ignores transport and HTTP results. cleanup-probe-final.log forces CONNECT 502, observes closed:true, no retained id, and no second stop attempt on retry. Official docs state disconnect does not stop the cloud browser.

## Gaps

- Required exact-head passing Test Strength receipt is unavailable. Authored green tests do not establish fix-absent falsification or a complete provider protocol matrix.
- Required exact-head passing Resilience Audit receipt is unavailable. The two focused failure probes do not cover all post-create/CDP/cleanup ownership partitions.
- No BROWSER_USE_API_KEY was present in the environment; live Cloud create, CDP attach, profile persistence, recording, stop and billing observations remain unverified.
- Native reviewer is another OpenAI-family context and author model is unknown. Saved official API contract supplies an independent protocol oracle, but there is no complete cross-family lifecycle challenge.
- Successful create with id but absent/null cdpUrl is permitted by the response schema and loses cleanup ownership in the parser. No live active-browser instance of that shape was observed; it remains a producer-verification gap.

## Limits and provenance

- Author model: unknown; contributor MagMueller
- Reviewer model: gpt-6-astra native isolated reviewer; same OpenAI family, existing empirical evidence visible
- Same family: yes
- Independent challenge: not satisfied. Official API schemas and lifecycle text are saved and checked. Independent protocol evidence supports F2; cross-family lifecycle review remains unavailable.
