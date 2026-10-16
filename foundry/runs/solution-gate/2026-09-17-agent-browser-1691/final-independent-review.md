## Findings / Hallazgos

Review of the exact supplied diff against the reconciled contract, C7 timing correction, and the V4 OpenAPI oracle. I read the fixed tree at the cited locations to confirm each claim; I did **not** execute any tests or builds this session — the green suite claim in the trail (1168+2 passed) is carried evidence, not mine.

### Confirmed defects

**D-1 (moderate, security-adjacent): domain filter not rolled back on 22s setup timeout.**
`handle_launch_inner` mutates the shared domain filter (`set_domain_filter_from_command`, `cli/src/native/actions.rs:4499`) after capturing `previous_domain_filter` (`actions.rs:4495`), and every explicit failure path calls `restore_domain_filter` — but the new `handle_launch` wrapper (`actions.rs:4296-4306`) cancels the inner future on timeout and returns `browser_use_setup_timeout`, which never restores the filter. Trigger: `launch --provider browseruse` with `--allowed-domains` (or clearing them) where create/attach stalls past 22s. Impact: the daemon retains the *new command's* filter with no browser; a subsequent auto-launch runs under a filter the operator never successfully applied — broader or narrower than intended, both wrong, and broader is a network-policy escape. Same class applies to any other state `handle_launch_inner` mutates before the cancellation point (e.g. `state.effective_ca_cert`), but the filter is the security-relevant one. This violates the spirit of R11 ("no new relaunch behavior") for the failure path.

**D-2 (operational livelock, contract-consistent but user-hostile): 404 stop wedges the daemon permanently.**
`stop_browser_use_session_at` treats 404 as failure (`providers.rs`, acknowledgment matrix test confirms). If the Cloud browser was stopped externally (dashboard, 4-hour hard limit per oracle, or the session's own `timeout`), the ID no longer exists: `close` fails forever with "status 404", ownership is retained, `handle_launch_inner` (`actions.rs:4368`) and `close_before_implicit_relaunch` block every launch and every plain command that needs relaunch. The only exits are unsetting the state via daemon restart. The reconciliation explicitly chose 404 ≠ success, so this is not a contract violation, but the diff provides no disambiguation path — a single `GET /browsers/{id}` (documented in the oracle, returns `status: stopped`) would resolve it. User impact: a routine dashboard cleanup bricks the local session until the operator kills the daemon. Flagging as a defect in resilience even though R1/D1 are technically satisfied.

**D-3 (minor, doc/behavior mismatch): receipt removal is detached and unawaited.**
`let _removal = tokio::task::spawn_blocking(...)` after an acknowledged stop drops the JoinHandle. On a `close` immediately followed by daemon exit (the common "close then shutdown" path via `close_notify`), the runtime can drop before removal runs, leaving a receipt for a confirmed-stopped browser. Docs (README, MDX, commands.md) state unconditionally "It is removed after an acknowledged stop." The contract permits a conservative stale record, so this is a documentation-accuracy defect plus a false-positive operator alarm, not a leak. Also note `assert_receipt_removed` polls up to 1s in tests, tacitly acknowledging the race.

**D-4 (minor): timing margin can hit exactly zero.**
Worst composite for a restore-key change into a Browser Use relaunch: prior Browser Use stop up to 4s (`apply_restore_config_after_confirmation`, outside the wrapper) + 22s setup + 4s timeout cleanup = 30s, exactly the CLI floor, before counting `auto_save_restore_state`. The contract carves this out as "not an unconditional whole-command bound," but the documented "4 seconds below the 30-second floor" claim is false for this reachable path. A client-side timeout here would race the daemon's own truthful error.

### Risks limited by unavailable hosted evidence (not confirmed defects)

**H-1: ws/wss-only `cdpUrl` validation may reject valid sessions.** The oracle types `cdpUrl` as a plain nullable string with no scheme constraint. The old code accepted any string; the new filter (`url::Url::parse` + `ws|wss` + host) rolls back — i.e. **stops and bills-refunds a healthy paid browser** — if Cloud ever returns an `http(s)` DevTools endpoint (a form `connect_cdp` plausibly handled for other providers). Cannot be verified without a live key. Behavior on trigger is safe (bounded rollback, honest error), but it converts a working session into a failure.

**H-2: repeated-stop semantics.** Acknowledgment requires `status == "stopped"` on the PATCH response; a second stop of an already-stopped browser presumably acknowledges (schema allows it), making close idempotent — unverified. Billing/refund, recording, and profile effects remain unverified as the contract already records.

**H-3: residual unwrapped path.** `connect_browser_use` (the non-owned variant) is still wired into `connect_provider_with_plugins_and_options`. Both known call sites now intercept via `connect_owned_provider`, but if any other caller (restore/replay) reaches the generic dispatcher with a browser-use provider string, that path has per-request timeouts but no 22s composite, no ownership callback. I did not find such a caller in the touched files; a full-tree caller audit is owed.

### Checks that passed

- **Cancellation ownership:** `on_session(Some(session))` fires synchronously after ID validation and *before* the awaited receipt write; the blocked-worker cancellation test proves the ID survives a cancelled future. `close_active_provider_session` peeks (`as_ref`) and clears state only after an acknowledged stop, so cancellation mid-stop retains ownership (verified at `actions.rs:2126-2133`).
- **Callback/registration timing:** ownership is registered before CDP attach in both callers; attach failure runs retained-state cleanup and, on stop failure, keeps the same UUID and blocks replacement (`test_launch_cannot_overwrite_pending_browser_use_ownership`). Duplicate `remember_active_provider_session` after `connect_owned_provider` is idempotent, not a bug.
- **Composite deadline coverage:** the implicit prior close moved from `execute_command` into `auto_launch_inner`, so auto-path relaunch close is inside the 22s budget as C7 requires. The env-gating gap I suspected does not exist: `handle_launch_inner` reads provider only from the command (`actions.rs:4557`), and the CLI client injects `AGENT_BROWSER_PROVIDER` into the launch command (`handler.rs:2871`), so no unwrapped Browser Use launch path via env fallback.
- **Body stalls:** reqwest per-request `.timeout` covers the full response body for both create and stop; the stalled-body test bounds it. Redirect policy `none` prevents blind replay of the non-idempotent POST (R9) and credential forwarding to redirect targets.
- **Other-provider compatibility (R4):** non-Browser-Use branches of `close_provider_session_with_plugins` keep their `let _ =` best-effort semantics and return `Ok(())`; `close_before_implicit_relaunch` swallows their errors as before; external CDP detach and plugin cleanup are untouched; the attach timeout applies only to Browser Use.
- **Secrets (R6):** new errors are fixed strings with numeric status and validated UUID only; hostile response bodies, the key, and endpoint query strings are excluded (tests assert each). Receipt content contains only the ID and a curl template referencing the env var, never its value. UUID validation of `session_id` before URL/filename interpolation blocks path traversal and URL injection. The UUID-shaped-key collision guard refuses to echo the ID; note the accepted tradeoff that in that (adversarial, near-impossible) case a real created browser gets neither stop nor receipt — the error's Cloud-inspection instruction is the only recovery.
- **Schema conformance:** `POST /browsers`, `PATCH /browsers/{id}` with `{"action":"stop"}`, header `X-Browser-Use-API-Key`, and the `profileId`/`proxyCountryCode`/`enableRecording` fields match the V4 oracle. Explicit-launch `options` are dropped for Browser Use in `connect_owned_provider`, but the create body was always env-derived, so no behavior change.
- **Omission continuity (R2):** the wrappers gate on setup entry only; healthy plain-command reuse (`needs_launch == false`) never enters them.

### Security boundary classification

- **Hardened:** secret reflection (fixed errors), path/URL injection (UUID gate), redirect-based key exfiltration and POST replay (Policy::none), resource identity spoofing (key≠id check, case-insensitive).
- **Regressed:** D-1 domain-filter persistence after cancelled launch — the one finding with a policy-bypass flavor.
- **Neutral/accepted:** receipt file uses default umask (contains only an ID); detached removal (D-3).

### Choice audit of the decision trail

The trail is internally coherent: the 07:11 reshape (composite deadline superseding summed budgets) correctly responded to the identified gap, and the 07:23 C7 correction (ownership callback before async receipt write) is faithfully implemented. Two choices deserve scrutiny. First, the 07:09/07:14 decision to hardcode the production base URL and accept "missing positive wiring coverage" for `execute_command`-level close is defensible against test-seam risk, but it means the only ownership-retention coverage at the command layer uses a missing-key failure, which exercises a different code path than a wire-level stop failure; the proxy-based cancellation test partially compensates. Second, the 14:14 reduction ("include implicit previous close inside setup deadline") was applied to the auto path but the trail never revisited timeout-path state rollback — which is exactly where D-1 lives; the reduction reviewed error *messages* on failure paths, not state mutations on the *cancellation* path. No decision in the trail is unjustified, but the cancellation-rollback blind spot is a process gap, not just a code gap.

### Verdict

No merge-blocking contract violation against the settled R-rows, but **D-1 should be fixed before merge** (restore the domain filter — and audit other pre-cancellation state mutations — in the timeout handler), **D-2 deserves a decision** (a bounded GET-based 404 disambiguation, or an explicit documented daemon-restart escape), and the docs should be softened for D-3/D-4. H-1 needs a live-key check or a relaxed validator before this ships to users whose Cloud returns non-ws endpoints.

---

## Resumen en español

Revisión del diff exacto contra el contrato reconciliado y el esquema V4. No ejecuté pruebas; la suite verde del historial es evidencia heredada.

**Defectos confirmados:** (D-1) al expirar el plazo de 22s en `handle_launch`, el filtro de dominios ya mutado en `actions.rs:4499` no se restaura — el temporizador cancela el futuro sin ejecutar `restore_domain_filter`, dejando una política de red que el operador nunca aplicó con éxito; es el hallazgo con implicación de seguridad. (D-2) un stop con 404 (navegador detenido desde el dashboard o por el límite de 4 horas) bloquea permanentemente `close` y todo relanzamiento hasta reiniciar el daemon; es coherente con el contrato pero operativamente hostil, y un `GET /browsers/{id}` lo resolvería. (D-3) la eliminación del recibo tras un stop confirmado se hace en una tarea desprendida sin esperar; con cierre seguido de apagado del daemon puede quedar un recibo obsoleto, contradiciendo la documentación. (D-4) el peor caso compuesto (cierre por cambio de clave de restauración 4s + 22s + 4s) llega exactamente a los 30s, anulando el margen documentado de 4s.

**Riesgos sin evidencia hospedada:** la validación ws/wss de `cdpUrl` podría rechazar (y detener) una sesión válida si Cloud devuelve un endpoint http(s) — el esquema no restringe el esquema de URL; la semántica de stop repetido y facturación queda sin verificar; queda pendiente auditar si algún otro llamador alcanza `connect_browser_use` sin envoltura.

**Verificado correcto:** propiedad retenida ante cancelación (callback antes de la escritura del recibo), plazos compuestos que incluyen el cierre implícito previo, sin fuga de secretos en errores ni recibos, compatibilidad preservada con los demás proveedores y CDP externo, conformidad con el esquema V4, y continuidad de comandos simples sin envoltura.

**Veredicto:** ningún incumplimiento de las filas asentadas del contrato, pero D-1 debe corregirse antes del merge, D-2 requiere una decisión explícita, y la documentación debe ajustarse para D-3/D-4.

(≈1600 words / palabras)