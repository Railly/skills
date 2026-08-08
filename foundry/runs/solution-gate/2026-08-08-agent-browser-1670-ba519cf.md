# Solution gate — agent-browser #1670, CA trust handling

- **Date:** 2026-08-08
- **Repo / branch:** vercel-labs/agent-browser, `railly/cli-native-ca` (PR #1670, stacked on #1669)
- **Implementer / synthesizer:** claude-opus-5 (also the author of the shape under examination)
- **Proposer A:** gpt-5.6-sol via codex, `read-only` sandbox, reasoning effort high, in `/tmp/sg-a`
- **Proposer B:** fable-5 via subagent, in `/tmp/sg-b`
- **Holdout:** the implementer's shape was committed locally as `ba519cf` and never pushed. Both proposers worked in fresh clones of the pushed head `1c251b4`, which carries the defects and neither fix. Isolation was structural, verified by `grep -c add_ca_bundle` returning 0 in both checkouts.

## Skill version caveat

This run executed the copy of the skill installed at `~/kai/.agents/skills/solution-gate`, which is stale relative to the canonical checkout: its step 3 is "run the cheapest probe that could refute", while canonical since 2026-07-30 is "trace each proposal forward, and mark every link". The probe discipline recorded below is therefore the older method, faithfully applied. The forward-tracing step was not run. Whether it would have found anything the probes did not is open; the two are complementary rather than substitutes, and the second-order chain from each proposal is exactly what was never examined here.

Root cause: `~/kai/.agents/skills/review-gate` and `.../solution-gate` are real directories rather than symlinks into the canonical repo, so they froze at their install date.

## Trigger

Clause 3: both changes are the fix for findings from the previous review round, the empirically most defect-dense commit class. Clause 2 also fires on defect 1, which changes what a flag accepts.

## Step 1 — the brief

Handed to both proposers verbatim as `/tmp/sg-brief.md`, containing property, observable, and must-not-change for each defect, and no proposed solution.

**Defect in the brief itself.** The brief asserted that `cli/src/connection.rs` spawns the daemon with `Stdio::null()` for stderr, citing line 751. That line is the Windows `taskkill` path. The daemon spawns at 888-890 and 909-911 with `Stdio::piped()`, read only on early exit and then dropped unread. Proposer B corrected it unprompted; proposer A's shape does not depend on the distinction. The effect on the conclusion is nil (the pipe is dropped, so the warning is discarded either way), but a brief carrying a wrong load-bearing fact can contaminate both proposers, and it nearly did here. Recorded as a method finding.

## Step 2 — proposals

Both verbatim in `2026-08-08-agent-browser-1670-proposals.md` beside this file.

**Independent convergence.** Neither saw the other, and both:

- moved all CA-file interpretation into a single loader in `cli/src/tls.rs`, with `compute_spki_hash` losing its own file interpretation;
- rejected prefix sniffing, requiring instead that the discriminator be "a certificate parser accepted it";
- gave the same security argument: hashing a certificate the CLI trust store rejected grants Chromium an exception for a key outside the accepted trust set, and `--ignore-certificate-errors-spki-list` suppresses every certificate error for chains carrying that key, which is more power than adding a root;
- explicitly rejected **the implementer's shipped shape** ("teach only the CLI loader to recognize DER … recreates the exact drift that caused the defect");
- rejected PEM-only-on-both-sides as a compatibility regression;
- rejected forwarding or tailing daemon stderr.

**Divergence.** Defect 2 delivery. B computes the diagnostic in the foreground CLI from the same environment the daemon will read. A returns diagnostics as data in the daemon response envelope, rendered by `output.rs`, with warnings inside the JSON document in JSON mode. Each named the other's cost without seeing it: B listed its own preflight TOCTOU as a downside; A rejected "validate only in the foreground CLI" because the file can change before the daemon consumes it and non-CLI entry points bypass the check.

## Step 3 — probe log

| # | Prediction under test | Command | Observed | Verdict |
|---|---|---|---|---|
| 1 | Non-CA leaf accepted as a trust anchor | `--ca-cert srv.pem doctor` | `plus 1 certificate(s)` | Survives. `RootCertStore::add` validates encoding, not `basicConstraints`. Not a hole: webpki enforces CA:TRUE during path building, so a leaf anchor validates only itself |
| 2 | The browser path hashes bytes that are not a certificate | crafted 37-byte DER that openssl refuses (`unable to load certificate`), then `--ca-cert garbage.der open` | `--ignore-certificate-errors-spki-list=jJGq7in4FA+Hn6gwfMAE1CH34fX0HZTyFqg1l+Pq8MI=` | **Refutes the assumption that the browser path validates.** `extract_spki_from_der` walks six TLV elements positionally and takes the seventh, with no OID, signature, or structure check |
| 3 | `rustls-pemfile` skips a text preamble | source read, `rustls-pemfile-2.2.0/src/tests.rs::skips_leading_junk` | test exists | Survives, B's claim correct |
| 4 | The implementer's prefix sniff regresses preamble PEM | A/B: pre-fix `1c251b4` vs `ba519cf`, same file | pre-fix `plus 1 certificate(s)`; after `unusable, ignored`. Plain PEM identical on both | **Refutes the implementer's shape.** S1 confirmed with a control |
| 5 | Multi-cert bundle: consumers disagree on count | `--ca-cert two.pem doctor` and the spawned Chromium argv | CLI `plus 2 certificate(s)`; argv carries 2 hashes | Survives, no defect. A's count prediction already holds |
| 6 | Partial trust from a bundle with one malformed block | `--ca-cert mixed.pem` on both consumers | both refuse (`InvalidCharacter(45)` / `Invalid symbol 33`) | Survives, no defect. **Trims A's transactional requirement**: partial trust is not reachable for PEM today |
| 7 | Daemon stderr disposition | read `connection.rs:884-896` | `Stdio::piped()`, not null | **Refutes the brief.** Corrected above |

Unprobeable: none. Every prediction that distinguished the shapes had a cheap observation.

## Step 4 — failure-shape scoring

| Shape | Implementer (`ba519cf`) | Proposer A | Proposer B |
|---|---|---|---|
| S1 over-reach | **HIT, confirmed by probe 4.** Preamble PEM worked and no longer does | Risk on transactional strictness; **trimmed by probe 6**, partial bundles already fail | Clear. Accepts a superset of today |
| S2 under-reach | **HIT.** Closes the DER instance, leaves the class: two parsers remain, and `apply_to_reqwest` is a third that calls `reqwest::Certificate::from_pem_bundle` independently | Clear, one loader | Clear, one loader; B named the reqwest third parser explicitly |
| S3 direction inheritance | **HIT.** Fixed DER-rejected-by-CLI, never asked about the opposite direction, which probe 4 then found | Clear | Clear |
| S4 proxy property | **HIT.** `starts_with("-----BEGIN")` proves a prefix; the property needed is "this file holds a certificate" | Clear, discriminator is the parser's verdict | Clear, same |
| S5 unregistered peer | Clear | **HIT.** A new warning collection in the response envelope must be preserved by `run_batch`, MCP, and every future response path. This repo has a recorded instance: the gate-miss ledger records `run_batch` silently dropping the existing singular `warning` field | Clear, no new cross-process state |
| S6 peer-version | Clear | Envelope change is a cross-process contract; an old daemon never sends the collection | Clear |
| S7 wrong layer | Addressed for defect 2 | Addressed most completely, including JSON and daemon-side | Addressed for the CLI path; A's objection about non-CLI entry points stands |
| S9 test pins wrong thing | Prior round's test asserted a message, not the invariant; already corrected | n/a | n/a |
| S10 claim from prose | Clear, claims were probed | Clear | Clear, B verified rustls internals against the vendored source |

## Step 5 — synthesis: **graft**

**Defect 1 — take the converged shape whole, drop the implementer's.** One loader in `cli/src/tls.rs` owns CA-file interpretation. The discriminator is a parser verdict, never a byte prefix: PEM via `rustls_pemfile` (which skips preamble), and on zero PEM items exactly one whole-file DER attempt validated by the same trust-anchor conversion `RootCertStore::add` performs. Both consumers are fed from that one result, and `compute_spki_hash` stops reading and interpreting files. This simultaneously closes the DER divergence, preserves preamble PEM (probe 4), and closes the unvalidated-hash gap (probe 2) that neither the external bot nor the review-gate round found.

Taken from A specifically: the atomic framing, that a failure anywhere yields no root installed *and* no SPKI argument, so the two consumers can never trust different sets. Probe 6 shows PEM already behaves that way, so this is a property to preserve rather than a refactor to perform.

**Defect 2 — take B's shape, not A's, and graft one correction from A.** The foreground CLI computes the diagnostic from the same environment the daemon will read. A's envelope refactor is the better mechanism in the abstract and is rejected on cost against a recorded S5 in this repo: `run_batch` already drops the singular `warning` field, so widening that field to a collection adds an invariant every future response path must remember, to deliver one line the CLI can compute locally.

Grafted from A: the implementer gated the warning on `!flags.json`, which leaves a JSON consumer with no signal at all. The warning goes to stderr, never stdout, so JSON stdout stays parseable whether or not the line is emitted; the `--json` suppression is therefore unnecessary and is removed.

**What the losing proposal had that was better.** A's diagnostics-as-data is the only shape that also covers a daemon started outside the CLI and a warning raised after the spawning client has exited. That is a real gap in what ships. It is recorded as an issue candidate rather than built, because the delivery it buys is the same single line in the common path, at the cost of a cross-process contract change.

**Seam check.** The two halves meet at `TrustOptions`. The loader is called by the preflight in the CLI process and again by `build_root_store` in whichever process builds the store. Both read the same environment and the same file, so they agree unless the file changes between them.

## Carried assumptions

1. The preflight and the daemon can disagree if the CA file changes between them. Window is milliseconds; the failure mode is a stale or missing warning, never a wrong trust decision. Accepted, not designed out.
2. A daemon started outside the CLI, or a trust failure raised after the client exits, still emits only into a dropped pipe. Not covered by the chosen shape.
3. `apply_to_reqwest` builds `reqwest::Certificate::from_pem_bundle` independently, a third parser for the same flag. It must be folded into the shared loader in the same change or the divergence regrows.
4. Whether `webpki`'s trust-anchor conversion is reachable directly, or only through `RootCertStore::add`, is to be confirmed against the vendored rustls 0.23.37 during implementation rather than assumed from B's report.

## Issue candidates

- **`extract_spki_from_der` accepts non-certificates.** Probe 2. The code ships in PR #1669, so per the project's "a defect in code the PR ships is fixed in the PR" norm it belongs in #1669, not here. If #1669 merges alone it ships the gap.
- **`doctor` reports an explicitly named unusable bundle as "ignored"** while the same flag hard-errors on a real command. The diagnostic disagrees with the tool, the same shape as the install/doctor mismatch found in the review-gate round.
- **Diagnostics from a daemon the CLI did not spawn reach nobody.** Assumption 2 above.

## Method findings

- A brief carrying a wrong load-bearing fact (`Stdio::null()`) went out to both proposers. One corrected it, one ignored it, neither was misled, but the brief is an input nobody gates. Worth a check: every factual claim in the brief carries a file:line, and the line is read before the brief is sent.
- The gate's value here was not the debate. Both proposals argued for a shape; the thing that decided it was probe 4, a two-command A/B against a build of the pre-fix commit, which refuted the implementer's shipped fix with a control. Probes 2 and 6 likewise moved the answer, and each cost under a minute.
