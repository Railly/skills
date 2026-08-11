# Proposals: agent-browser PR #1589 review fixes

Both proposals were produced independently in detached worktrees at `fb3774908e28913280188b79b75286b924a6f86b`. Neither proposer saw the other proposal.

## Proposer A: Fable 5, high effort

The following response is preserved verbatim.

### Shape

**Defect A — the pin tri-state rides every daemon-bound envelope.** Ownership stays where it is: the client (flags.rs) owns computing the tri-state (`true` = CLI/env/config requested pin, `false` = explicit `--no-pin-tab`, absent = no preference), and the daemon's existing early handler (`cli/src/native/actions.rs:2225`) owns applying it — it already runs before `needs_launch` and before `apply_tab_binding_on_attach` (`cli/src/native/actions.rs:2772`), which already implements "pinned + no binding → fresh tab". The contract change is client-side only: one helper (mirroring `attach_plugins_to_command`) applies the tri-state `pinTab` field, and it is called for the main command (replacing the inline block at main.rs:1177), the batch injection (main.rs:1804), and all three launch envelopes (`--auto-connect`, `--cdp`, provider). Crucially, `pinTab` must not become a `LaunchOptions` field: the launch-compat hash (`cli/src/native/actions.rs:267`) is computed from `LaunchOptions`, so keeping `pinTab` out of it preserves idempotency of repeated compatible launches. Newly spawned daemons keep the existing env path (`cli/src/connection.rs:571` → `AGENT_BROWSER_PIN_TAB` → `DaemonState::new`), and MCP inherits the fix because it lowers `pinTab` into CLI flags (`cli/src/mcp.rs:2336`).

**Defect B — one sanitizer owns the policy, enforced at both boundaries.** `sanitize_url` changes from "parse and strip components" to a scheme allowlist: `http`/`https` keep scheme, host, port, and path (credentials, query, fragment stripped as today); `about:` passes through; every other scheme — including `data:`, `blob:`, `javascript:` — returns empty, so the binding omits the URL exactly like a malformed one. The second contract: the `bound_target_gone` field (`cli/src/native/browser.rs:406`) gains the invariant that its `last_url` is always sanitizer output, enforced at both capture sites (`browser.rs:1034` and `browser.rs:1048` — the latter is where a live `data:` URL currently reaches `tab_gone` without ever touching disk). Persistence keeps sanitizing at `cli/src/native/actions.rs:2748`; double-sanitizing is idempotent. No selection or navigation logic reads the diagnostic URL, so behavior there is untouched.

**Defect C — schema catches up to the parser, and equality becomes enforced.** Add a `pinTab` boolean property next to `autoConnect` in `agent-browser.schema.json:131` with a description aligned with the configuration docs and the MCP tool text, mirrored byte-for-byte in `docs/public/schema.json`. Because the drift happened precisely due to nothing enforcing it, add one test that asserts (a) the two schema files are byte-identical and (b) every `Config` struct field (camelCase) has a matching schema property. Draft 7 markers, `additionalProperties: true`, and all existing keys stay untouched.

**— Español —** Defecto A: el tri-estado de pin (`true`/`false`/ausente) lo calcula el cliente y lo aplica el handler temprano ya existente del daemon; el cambio de contrato es que *todo* envelope que pueda causar un attach (`--auto-connect`, `--cdp`, provider, batch y el comando principal) lleve el mismo campo `pinTab` mediante un helper único, sin meterlo en `LaunchOptions` para no perturbar el hash de compatibilidad. Defecto B: `sanitize_url` pasa a ser una allowlist de esquemas (`http`/`https` reducidos a esquema+host+puerto+ruta, `about:` intacto, todo lo demás omitido), y `bound_target_gone` adquiere la invariante de que su URL siempre es salida del sanitizador, aplicada en los dos puntos de captura. Defecto C: se añade `pinTab` booleano a ambos archivos de schema, idénticos byte a byte, más un test que fuerza esa igualdad y la cobertura de las claves del parser.

### Predictions

1. **Strict attach against a running daemon.** Pre-start a daemon for session S (no `.target` file), point shared Chrome at :9222 with one tab on `http://example.com/shared`, then run `agent-browser --cdp 9222 --pin-tab open http://localhost:8000/mine`. Measurement: `curl http://localhost:9222/json/list` must show the shared tab still on `/shared` plus a distinct target on `/mine`; the `S.target` file must contain `"pinned":true` with the new target id; the PID in `S.pid` must be unchanged. At `fb37749` this fails — the shared tab is navigated. After the fix it passes, and the same holds substituting `--auto-connect` for `--cdp`, and sourcing the preference from `AGENT_BROWSER_PIN_TAB=1` or config.
2. **Opaque URL never persists or discloses.** Pin a session, navigate to `data:text/html,SECRETXYZ`, kill that tab from another client, run any page command. Measurement: `grep SECRETXYZ "$AGENT_BROWSER_SOCKET_DIR"/*.target` finds nothing, and the `tab_gone:` error text contains the target id but not `SECRETXYZ`. At `fb37749` both greps hit. Meanwhile `sanitize_url("https://user:pw@example.com/reset?token=x#f")` still yields `https://example.com/reset` and `sanitize_url("about:blank")` still yields `about:blank` (existing unit test stays green).
3. **Schema parity.** `cmp agent-browser.schema.json docs/public/schema.json` exits 0, both contain `"pinTab": {"type": "boolean", ...}`, and validating `{"pinTab": true}` with an ajv draft-07 validator produces no errors. At `fb37749`, the property lookup fails in both files.

**— Español —** (1) Con daemon corriendo y Chrome compartido, `--cdp 9222 --pin-tab open` debe dejar la pestaña compartida intacta, crear un target distinto y persistir `pinned:true` con el mismo PID — hoy falla. (2) Tras fijar una pestaña `data:` y cerrarla externamente, ni el archivo `.target` ni el error `tab_gone` contienen el secreto — hoy ambos lo contienen. (3) Ambos schemas son idénticos byte a byte y definen `pinTab` booleano — hoy no.

### Cost

Touched files: `cli/src/main.rs` (one helper, four call sites), `cli/src/native/tab_binding.rs` (sanitizer rewrite plus test cases for `data:`/`blob:`/`javascript:`), `cli/src/native/browser.rs` (two capture sites plus a leak test), both schema JSON files, and one new schema-parity test. No new persisted fields and no migration: existing binding files deserialize unchanged, and a previously-persisted opaque URL is overwritten on the next write (optionally, `load` could re-sanitize as one-time hardening). No additional IPC round trips — `pinTab` rides envelopes that are already sent. New coupling: `browser.rs` calls `tab_binding::sanitize_url`, and future contributors must update two schema files in lockstep (now machine-enforced instead of by convention).

**— Español —** Cinco archivos de código más los dos schemas y un test nuevo; sin migración de datos ni round trips adicionales; el acoplamiento nuevo es `browser.rs` → `sanitize_url` y la obligación (ahora verificada por test) de mantener los dos schemas sincronizados.

### What it makes worse

Diagnostics degrade for legitimate non-HTTP workflows: a pinned tab on `file://`, `chrome://`, or `chrome-extension://` now produces `tab_gone: <target-id>` with no URL hint at all, even though those URLs are usually harmless, making recovery guidance vaguer for local-file testing. Secondarily, a `pinTab: true` sitting in a config file now flips a long-running daemon to strict mode at attach time rather than one command later — the end state is the same, but the earlier timing may surprise users who relied on the launch envelope being pin-neutral.

**— Español —** El diagnóstico empeora para flujos legítimos no-HTTP (`file://`, `chrome://` pierden la pista de URL en `tab_gone`), y un `pinTab: true` en config ahora activa el modo estricto en el attach mismo, un mensaje antes que hoy.

### Rejected alternatives

- **Respawn the daemon when the pin preference differs from its state.** Rejected by the gate itself: the daemon PID must remain unchanged, and a restart discards live tabs and iframe sessions.
- **Parse `pinTab` inside `handle_launch` as a `LaunchOptions` field.** Rejected because `LaunchOptions` feeds `launch_hash` (`actions.rs:267`); a differing pin preference would make an otherwise-identical launch envelope "incompatible", breaking the required idempotency of repeated compatible launches (relaunch or extra tabs).
- **Make every no-binding attach strict by default (always a fresh tab).** Rejected by the must-not-change list: commands with no pin preference must leave behavior unchanged, and the legacy index-0 fallback (`actions.rs:2817`) is load-bearing for unpinned sessions.
- **Detect opacity via the url crate's `cannot_be_a_base` instead of an allowlist.** Rejected because `about:blank` is itself cannot-be-a-base (the required exception turns it into an allowlist anyway), and the parser property silently admits future hierarchical-but-sensitive schemes instead of failing closed.
- **Sanitize only at the `tab_gone_error` sink.** Rejected because the raw opaque URL would keep living in `bound_target_gone` memory, one future call site or debug log away from disclosure; sanitizing at capture makes the invariant structural rather than per-sink.
- **Generate both schemas from the Rust `Config` struct (schemars).** Rejected as machinery disproportionate to a two-file sync problem: it adds a build dependency and churns hand-written descriptions, while the byte-equality plus key-coverage test closes the gate with one test.

**— Español —** Se rechazó: reiniciar el daemon (el PID debe permanecer), meter `pinTab` en `LaunchOptions` (rompería la idempotencia vía `launch_hash`), hacer estricto todo attach sin binding (rompe la semántica legacy protegida), detectar opacidad con `cannot_be_a_base` (excluiría `about:blank` y admite esquemas sensibles futuros), sanear solo en el sink del error (deja el payload crudo en memoria), y generar los schemas desde Rust con schemars (maquinaria desproporcionada frente a un test de igualdad byte a byte).

## Proposer B: OpenAI GPT-5.6-sol, high effort

The following response is preserved verbatim.

### Shape

- Preserve pin intent as `Option<bool>` through parsing, with precedence CLI, environment, config. `None` leaves sticky state unchanged; `Some(false)` disables it.
- Stamp that tri-state `pinTab` onto every launch envelope and browser command, including CDP, auto-connect, batch, and MCP-delegated commands.
- The daemon owns the final decision. Before connecting, it transactionally applies explicit pin intent, loads the persisted binding, and creates an attachment plan containing strictness and target ID.
- Browser attachment accepts that plan up front. It must not expose a manager or activate an existing target before it has restored the target, entered `tab_gone`, created a fresh strict target, or deliberately selected legacy behavior.
- Compatible repeated launch envelopes reuse the current attachment. Pin state remains outside the launch compatibility hash, avoiding daemon restarts and duplicate tabs.
- Introduce a diagnostic URL type used by persistent bindings and in-memory `tab_gone` state. Its only permitted values are:
  - HTTP or HTTPS scheme, host, port, and path, without credentials, query, or fragment.
  - Exactly `about:blank`.
  - Empty for opaque, unsupported, or malformed URLs.
- Enforce sanitization when capturing a closed tab, saving a binding, loading legacy bindings, and formatting errors. Lazily rewrite unsafe legacy binding URLs atomically before returning them. Target IDs and `pinned` remain unchanged. Diagnostic URLs are never inputs to navigation or target selection.
- Add boolean `pinTab` beside `autoConnect` in a canonical Draft 7 schema, publish identical copies to `agent-browser.schema.json` and `docs/public/schema.json`, and add a byte-equality test. The current copies already differ in `allowedDomains` and `idleTimeout` descriptions, so synchronization must retain the more complete existing wording for each rather than inventing new descriptions.

### Predictions

- `cd cli && cargo test e2e_pin_tab_precedes_cdp_attach -- --ignored --test-threads=1` will show an unchanged daemon PID, an unchanged original HTTP target, a different session target, and a persisted binding containing that target with `"pinned":true`.
- `cd cli && cargo test tab_binding::tests::test_diagnostic_url_contract` will prove that `data:text/html,<secret>` produces neither persisted nor `tab_gone` disclosure, while HTTP paths and `about:blank` remain visible.
- `cmp -s agent-browser.schema.json docs/public/schema.json && jq -e '.properties.pinTab.type == "boolean"' agent-browser.schema.json` will exit successfully.

### Cost

Changes concentrate in `cli/src/flags.rs`, `cli/src/main.rs`, `cli/src/native/actions.rs`, `cli/src/native/browser.rs`, `cli/src/native/tab_binding.rs`, both schema files, and their unit, parity, and end-to-end tests. The attachment APIs gain a binding-plan parameter and tighter coupling to session binding policy. Loading an old unsafe binding may add one atomic disk rewrite. No new client-to-daemon round trip or binding-file field is required.

### What it makes worse

A read-only or failing socket directory can now block attachment when an unsafe legacy diagnostic needs rewriting. Attachment code also becomes more complex because target discovery and initial target selection can no longer be treated as one legacy operation.

### Rejected alternatives

- Add `pinTab` only to the eventual `open` command: rejected because the preceding launch command has already attached under legacy semantics.
- Set strict mode after `connect_cdp` or `connect_auto`: rejected because target discovery and initial selection have already occurred.
- Put pin preference in the launch compatibility hash: rejected because changing it would restart the daemon, violate the PID requirement, and risk extra tabs.
- Treat every successfully parsed URL as safe: rejected because `data:`, `javascript:`, `blob:`, and similar schemes can contain the complete secret payload.
- Persist only HTTP origins: rejected because the documented diagnostic contract requires retaining paths.
- Patch both schema files independently: rejected because `cmp` already demonstrates drift and nothing would prevent another divergence.
