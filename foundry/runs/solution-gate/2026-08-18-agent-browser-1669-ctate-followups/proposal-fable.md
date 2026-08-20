# Fable 5 blind shaping artifact

Model: `claude-fable-5-thinking-xhigh`

Transcript SHA-256: `539b10958d7a45c57a57c3d55fb59092cdd18cba28a4f52157c8e0c3a29ffaf1`

The structured artifact below is preserved verbatim from the model response.

---

Research is complete. I inspected the base checkout only: the three installer package maps in `cli/src/install.rs`, the Eve sandbox dependency lists and bootstrap revision key in `packages/@agent-browser/eve/extension/lib/sandbox.ts`, the four independent launch envelope constructors in `cli/src/main.rs`, the daemon's `handle_launch` reuse hash and the `allowedDomains` tri-state precedent in `cli/src/native/actions.rs`, the env/config merge in `cli/src/flags.rs`, the MCP tool surface in `cli/src/mcp.rs`, and two additional first-party dependency-list owners the packet did not name (`packages/@agent-browser/sandbox/src/vercel.ts` and `examples/environments/lib/agent-browser-sandbox.ts`). No CA trust code exists anywhere in base. Here is the shaping artifact.

---

# Shaping artifact: selective CA trust on clean Linux installs and launch transitions

Mode: blind shaping against base `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`. No PRs, candidate branches, diffs, review comments, prior shaping outputs, sibling worktrees, or internet consulted.

## 1. Base evidence anchors

Facts established from the clean checkout that the shapes depend on:

- Four independent launch envelope constructors exist in `cli/src/main.rs`: auto-connect (line 1317), CDP (line 1361), provider (line 1458), and local launch config (line 1493). Each attaches options through separately called helpers. The provider envelope already drifts today: it attaches `colorScheme` but not `ignoreHTTPSErrors` or `downloadPath`, which the auto-connect and CDP envelopes do attach. This is the exact drift class behind F8.
- The daemon decides browser reuse via a `launch_hash` computed in `handle_launch` (`cli/src/native/actions.rs:4221`) and treats absent fields as env fallbacks specifically to keep the hash stable across follow-up commands (comment at line 4057). Any new launch field that enters the hash from the raw request rather than from resolved state will break reuse.
- A tri-state sticky precedent already exists: `allowedDomains` resolves as `requested.unwrap_or(existing)` (actions.rs:4097), where absence preserves prior state and an explicit empty list clears. `pinTab` similarly treats field absence as "leave untouched" (actions.rs:2225).
- First-party dependency-list owners total four files, not two: `cli/src/install.rs` (apt map at 533, dnf map at 628, yum map at 660), Eve `sandbox.ts` (APT list at 50, DNF list at 89, plus `EVE_BOOTSTRAP_REVISION = "3"` at 118 feeding a provisioning revalidation key), `packages/@agent-browser/sandbox/src/vercel.ts` (`CHROMIUM_SYSTEM_DEPS` at 22, installed with `dnf --skip-broken`), and `examples/environments/lib/agent-browser-sandbox.ts` (copy at 29). All install the NSS runtime (`libnss3`/`nss`) and none installs an NSS tools package, matching F2 and F3: the executable required by selective CA setup is `certutil`, provided by `libnss3-tools` (Debian family) and `nss-tools` (RPM family).
- Env vars and two config files (user and project `config.json`) merge into the same `Flags` struct (`cli/src/flags.rs:295`), so env and config are additional transition input paths, and the Eve extension builds CLI argv independently (`buildShellCommand` in `sandbox.ts`, plus flag pushing in `extension/lib/browser.ts`). MCP (`cli/src/mcp.rs`) exposes launch options as a distinct schema surface.
- An `--engine` flag selects Chrome vs Lightpanda (`cli/src/native/cdp/lightpanda.rs`); NSS-based trust is Chrome-specific.

## 2. R table

Settled requirements preserved verbatim from the packet; additions labeled Derived (forced by settled requirements plus base evidence) or Undecided (a real decision the evidence does not settle).

| Req | Requirement | Status |
|---|---|---|
| R0 | A first-party-supported local Chromium session on Linux can trust certificates issued by one user-supplied private CA without disabling ordinary certificate verification. | Settled (Core goal) |
| R1 | After the product's first-party dependency setup on each supported Linux package family and in the default Eve sandbox, selective CA trust works without a second manual package-install step. | Settled (Must-have) |
| R2 | Every production external executable introduced by the feature is mapped to the package that provides it in every first-party installer and sandbox bootstrap that owns the feature. | Settled (Must-have) |
| R3 | A missing or failing prerequisite produces an actionable error before Chromium launches and leaves no created trust or browser state behind. | Settled (Must-have) |
| R4 | Without CA configuration, existing installation and launch behavior remains unchanged. | Settled (Must-not-change) |
| R5 | In a continuing named session, omission preserves the prior effective CA. Explicit clear removes it. Set, omit, and clear remain distinct through every independently constructed launch envelope. | Settled (Must-have) |
| R6 | After local CA trust is set, `provider + explicit clear` removes the local-only state before provider compatibility is evaluated, so the provider launch is not rejected because of stale CA state. | Settled (Must-have) |
| R7 | After local CA trust is set, `provider + omitted CA input` retains the effective CA and is rejected clearly before provider work begins. | Settled (Must-have) |
| R8 | A provider request that tries to set local-only CA trust is rejected clearly before provider work begins. | Settled (Must-have) |
| R9 | Local, provider, CDP, auto-connect, MCP, config, environment, and Eve paths express one consistent set, omit, and clear contract or reject unsupported transitions before partial work. | Settled (Must-have) |
| R10 | Repeating the same effective CA reuses the live local browser. Changing or explicitly clearing it replaces only the browser as declared, without collapsing omission into removal. | Settled (Must-have) |
| R11 | Tests derive transition cells from the external state domain and all independent envelope constructors, not from only the implementation branch changed by the fix. | Settled (Must-have) |
| R12 | The CLI's own outbound TLS trust remains outside the change. | Settled (Must-not-change) |
| R13 | Useful candidate work and contributor attribution are preserved when compatible with the selected contract. | Settled (Must-have) |
| R14 | Explicit clear has a dedicated wire representation distinct from field absence, and that representation survives JSON serialization, broadcast field stripping, argv round-trips through wrapper builders, and env/config merging without aliasing into omission. | Derived (from F8, U3; base strips internal fields at actions.rs:2186 and attach helpers skip absent options) |
| R15 | Any change to a sandbox dependency set invalidates existing provisioning caches, so already-bootstrapped sandboxes re-run dependency install (bump `EVE_BOOTSTRAP_REVISION` so `agentBrowserRevalidationKey` changes). | Derived (from R1, R2; sandbox.ts:118-128) |
| R16 | The browser reuse decision incorporates the effective CA identity computed after transition resolution against sticky state, never the raw requested field, so omission does not force spurious relaunches and set-same reuses while set-changed and clear replace exactly once. | Derived (from R5, R10; launch_hash mechanism at actions.rs:4221 and the stability comment at 4057) |
| R17 | The installer inventory for R2 covers all four in-repo dependency-list owners: `cli/src/install.rs` (apt, dnf, yum), Eve `sandbox.ts` (apt, dnf), `packages/@agent-browser/sandbox/src/vercel.ts`, and `examples/environments/lib/agent-browser-sandbox.ts`, and a deterministic test binds every feature-required executable to a package in each map so removing a mapping fails CI. | Derived (from R2, U1; base inventory is larger than the two paths the packet names) |
| R18 | The feature ships with all parity surfaces updated in the same change: `cli/src/output.rs` help, README, `skill-data/core`, docs site MDX, inline doc comments, and an MCP tool surface in `cli/src/mcp.rs` that expresses the same set/omit/clear semantics. | Derived (from F10, R9; AGENTS.md Documentation and CLI/MCP Parity) |
| R19 | Behavior of CA trust under `--engine lightpanda`: NSS-based trust is Chrome-specific, so a non-Chrome engine combined with CA set must reject before launch or the mechanism must be proven on that engine. | Undecided |
| R20 | Scope of the trust store: session-scoped NSS DB (HOME override or equivalent) versus user-global `~/.pki/nssdb` with namespaced nicknames. Cross-session isolation and concurrent sessions with different CAs hinge on this. | Undecided |
| R21 | Env and config clear semantics: whether `AGENT_BROWSER_TRUST_CA=""` or a config `"trustCa": ""` means explicit clear or means unset, and precedence of a per-invocation clear flag over a persistent env set. | Undecided |

## 3. Solution shapes

### Shape A. Packaged certutil with one transition serializer

Mechanism parts:

- A1 Trust writer: shell out to `certutil -A -d sql:<db> -t "C,," -n <session-namespaced nickname>` to add the CA, `certutil -D` to remove it. DB location per R20 decision, default session-scoped.
- A2 Package mapping: add `libnss3-tools` to the apt spec list (install.rs:533 and Eve APT list), `nss-tools` to the dnf and yum lists (install.rs:628/660, Eve DNF list, Vercel `CHROMIUM_SYSTEM_DEPS`, examples copy). Bump `EVE_BOOTSTRAP_REVISION` to "4".
- A3 Transition type: one `CaTrustTransition` enum (`Set(path)` / `Omit` / `Clear`) defined once in the CLI, with a single `attach_ca_trust_to_launch_command` helper called by all four envelope constructors in `main.rs`. Wire format uses two fields so clear cannot alias to omission: `trustCa: "<path>"` for set, `clearTrustCa: true` for clear, both absent for omit (R14). MCP and the Eve argv builder route through the same flag pair (`--trust-ca <path>` / `--clear-ca`).
- A4 Daemon sticky store: effective CA (path plus certificate fingerprint) held in `DaemonState`, resolved as requested-or-existing exactly like `allowedDomains` (actions.rs:4097). The transition is applied to sticky state before any compatibility evaluation and before any browser close. `launch_hash` consumes the resolved effective fingerprint (R16).
- A5 Preflight and rollback: before mutating anything, verify `certutil` resolvable and the CA file parses as a PEM certificate; on any downstream launch failure, delete the added NSS entry and restore the prior sticky state (R3).
- A6 Compatibility gate: after transition resolution, provider/CDP/auto-connect with `Set` reject before provider or attach work (R8); retained effective CA via omission rejects with a message naming the retained CA and the clear syntax (R7); `Clear` applies first, then the launch proceeds ordinarily (R6).
- A7 Test derivation: unit-level transition matrix generated from the packet's temporal table (prior state x request x launch family); a constructor-inventory parity test that builds the envelope JSON from each of the four `main.rs` paths plus the MCP command builder plus the Eve argv builder and asserts the clear field survives each (R11, R14); a deterministic executable-to-package manifest test per R17; containerized clean-install e2e for Debian Bookworm and AL2023 asserting `certutil` resolvability after first-party setup.

Flagged unknowns: whether Chrome for Testing headless consults the NSS user DB under an overridden HOME (load-bearing, spike S1); Lightpanda behavior (R19); env clear semantics (R21).

### Shape B. In-process NSS store writer, no external executable

Mechanism parts:

- B1 Trust writer: write the NSS `cert9.db` SQLite store directly from Rust (rusqlite plus hand-encoded PKCS#11 trust objects, CKA_TRUST_SERVER_AUTH = trusted delegator), eliminating `certutil` entirely. Directly answers F12/U2 by removing the executable boundary.
- B2 Transport: identical to A3/A4/A6/A7 (transition serializer, sticky store, gate, tests).
- B3 Packaging: no installer changes needed; R1/R2 satisfied vacuously.

Flagged unknowns: `cert9.db` schema and trust-object encoding are NSS internals with no stability contract; partial-write corruption of a store the browser later opens; behavior when Chromium holds the DB open. All currently unknown (F12 marks exactly this open).

### Shape C. Spot fixes with exhaustive tests, no shared serializer

Mechanism parts:

- C1 Add `--trust-ca`/`--clear-ca` handling separately inside each of the four envelope constructors, MCP, and Eve, without a shared type or helper.
- C2 Add the tools package to each dependency map independently.
- C3 Enforce parity purely through the transition-matrix e2e suite (which lives behind `#[ignore]` per the repo's e2e convention).

Flagged unknowns: none mechanical; the open question is durability, which is the U4 "exhaustive tests" arm.

### Shape D. CA trust as daemon state commands, launches read-only

Mechanism parts:

- D1 New daemon actions `ca_set`, `ca_clear`, `ca_show` mutate sticky trust state; launch envelopes carry no CA fields.
- D2 Every launch family evaluates compatibility against current daemon state only.
- D3 CLI convenience flags sequence a state command before the launch command.

Flagged unknowns: atomicity of the two-command sequence; how a request-level explicit clear combined with a provider launch is expressed at all.

## 4. Fit check

Binary fit; Partial counts as No.

| Req | A | B | C | D |
|---|:---:|:---:|:---:|:---:|
| R0 | Yes | Yes | Yes | Yes |
| R1 | Yes | Yes | Yes | Yes |
| R2 | Yes | Yes | Yes | Yes |
| R3 | Yes | No | Yes | Yes |
| R4 | Yes | Yes | Yes | Yes |
| R5 | Yes | Yes | Yes | No |
| R6 | Yes | Yes | Yes | No |
| R7 | Yes | Yes | Yes | Yes |
| R8 | Yes | Yes | Yes | Yes |
| R9 | Yes | Yes | No | No |
| R10 | Yes | Yes | Yes | Yes |
| R11 | Yes | Yes | Yes | Yes |
| R12 | Yes | Yes | Yes | Yes |
| R13 | Yes | No | Yes | No |
| R14 | Yes | Yes | Yes | Yes |
| R15 | Yes | Yes | Yes | Yes |
| R16 | Yes | Yes | Yes | Yes |
| R17 | Yes | Yes | Yes | Yes |
| R18 | Yes | Yes | Yes | Yes |
| R19 | Open | Open | Open | Open |
| R20 | Open | Yes | Open | Open |
| R21 | Open | Open | Open | Open |

Failure notes:

- B fails R3: a hand-rolled `cert9.db` write has no transactional guarantee against the NSS schema; a partial or subtly wrong write leaves corrupted trust state behind that no preflight can detect, violating "leaves no created trust or browser state behind." B fails R13: it discards the executable-based mechanism the evidence trail is built around, so compatible candidate work on packaging and preflight is thrown away. B uniquely satisfies R20 (it can target any DB path natively), which is why it stays alive as a spike rather than a survivor.
- C fails R9: parity is enforced only by convention plus an ignored e2e suite. The provider envelope's existing drift (missing `ignoreHTTPSErrors`/`downloadPath` attachments that the CDP and auto-connect envelopes have) demonstrates this failure class already occurring in base; a fifth constructor added later re-opens F8 silently. The packet's discriminator "any independent wrapper drops explicit clear must fail a test" needs the constructor-inventory test of A7, which is precisely the structural element C omits.
- D fails R5: set, omit, and clear no longer travel through launch envelopes, so the request-level distinction the contract requires cannot be expressed. D fails R6: `provider + explicit clear` becomes two IPC commands with a failure window that clears trust and then never launches, which is partial work. D fails R13 by restructuring the surface beyond what any envelope-based candidate could share.

## 5. Recommendation

Survivor: Shape A, packaged certutil with one transition serializer.

Rejected alternatives: B (unproven NSS internals, R3 and R13 failures; retained as spike S4 to answer F12 for the future), C (no structural parity guarantee, R9 failure, and the base already exhibits the drift class it cannot prevent), D (cannot express the settled per-request transition contract).

Required spikes before or during implementation:

- S1 (load-bearing for A1 and R20): in a clean Debian Bookworm container, install Chrome for Testing plus `libnss3-tools`, add a private CA to `sql:$HOME/.pki/nssdb` with `certutil`, serve a page with a certificate signed by that CA, and verify headless CfT loads it without certificate errors. Repeat with HOME overridden to a session directory before launching Chromium. If the HOME-override half fails, R20 falls back to user-global DB with namespaced nicknames and ownership checks on clear.
- S2 (load-bearing for A2): verify `libnss3-tools` on Bookworm/Ubuntu 24.04 (including that the apt conflict simulation at install.rs:696 proposes no removals) and `nss-tools` on Amazon Linux 2023 and a yum-only family both make `certutil` resolvable. Also verify the Vercel sandbox `dnf --skip-broken` path does not silently skip the new package.
- S3 (load-bearing for R14): a pure unit harness building the four `main.rs` envelopes, the MCP command, and the Eve argv for `--clear-ca`, asserting the dedicated clear field survives each, including the stream-broadcast field stripping at actions.rs:2186.
- S4 (answers F12, non-blocking): attempt a direct `cert9.db` trust-anchor write in a scratch directory and check `certutil -L` and Chromium accept it. Outcome only informs whether the executable dependency can ever be dropped; it does not gate Shape A.

## 6. Forward effects of Shape A

1. Harmful: trust-store scope leakage. If S1's HOME-override half fails and the fallback is the user-global `~/.pki/nssdb`, every concurrent session's browser silently trusts a CA that one session set, and an explicit clear in one session can revoke trust a live sibling session still needs. This is a security-relevant cross-session bleed. Mitigation is session-namespaced nicknames plus refusing to delete entries the session does not own, but omission-versus-removal accounting across sessions gets strictly harder.
2. Harmful: installer regression surface. Adding a package to all seven map locations grows every install, including for users who never touch CA trust. Two concrete branches: the apt conflict simulation may newly abort installs on images where the tools package conflicts, and the `--skip-broken` dnf paths in the Vercel and Eve bootstraps can silently skip the package, reintroducing F2/F3 while the clean-install test reports green if that test only exercises the CLI installer. The R17 manifest test plus per-bootstrap e2e is what keeps this branch closed.
3. Harmful: reuse-hash regression. If `launch_hash` consumes the raw `trustCa` request field, every follow-up command that omits CA flips the hash and relaunches the browser onto about:blank, destroying exactly the continuity R10 protects and repeating the regression class the headless-field comment at actions.rs:4057 documents. The design must resolve the transition against sticky state first and hash only the effective fingerprint; A4/R16 encode this, and the matrix test's "set, then omit, expect same browser generation" cell is the guard.
4. Beneficial: the `CaTrustTransition` serializer plus the constructor-inventory parity test become the template for every future sticky launch option; `allowedDomains` and `pinTab` can migrate onto it, and the next independently constructed envelope fails a fast unit test instead of shipping an F8-class field drop.
5. Beneficial: the preflight gives `cli/src/doctor` a deterministic new check (certutil resolvability plus CA file parse), converting F4's "clear runtime error is insufficient" into an install-time guarantee with an actionable pre-launch error path.

## 7. Cheapest falsifying probes for the weakest load-bearing assumptions

Ordered weakest first:

1. Assumption: headless Chrome for Testing on Linux consults the NSS user DB for locally added anchors (and does so under overridden HOME). This is the single assumption the whole survivor stands on, and modern Chrome's built-in root store makes it non-obvious. Probe: S1, a roughly fifteen-line container script with a self-signed CA and a local TLS server. Falsified means Shape A's trust writer is dead and the shape pivots to S4's library write or a different anchor path.
2. Assumption: `libnss3-tools` and `nss-tools` exist and provide `certutil` on every supported family, including minimal AL2023, without apt removal conflicts or dnf skip-broken masking. Probe: S2, two `docker run` one-liners per family checking `command -v certutil` after the exact installer commands the product runs.
3. Assumption: a dedicated clear field survives every wrapper between user intent and daemon parse. Probe: S3, a no-browser unit harness over all envelope builders; falsified output pinpoints which constructor drops it, which is the F8 mechanism made visible in seconds.
4. Assumption: the provider compatibility gate can run after transition resolution with zero provider side effects on rejection. Probe: a daemon unit test with a stub provider asserting no connect call occurs for the "prior set, omitted CA" cell and that connect occurs exactly once after the "prior set, explicit clear" cell.
5. Assumption: including the effective CA fingerprint in `launch_hash` preserves reuse under omission. Probe: an in-process daemon test running set, then an omitted follow-up, asserting `reused: true` and an unchanged browser generation.
