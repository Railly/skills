# Independent Review — PR #1879 (Browser Use V4 integration, reduced scope)

**Evidence:** supplied diff (base `aff6125` → head `427d7a4`), current source excerpts, contract, decision trail. No tools were used; conclusions are limited to this packet.
**Evidencia:** el diff suministrado, extractos de código actual, el contrato y el decision trail. Sin herramientas; las conclusiones se limitan a este paquete.

---

## 1. Correctness / lifecycle verification (EN + ES)

### Invariants I verified as preserved / Invariantes verificadas como preservadas

1. **Same-ID ownership on stop failure.** `close_active_provider_session` (actions.rs:2473–2480) uses `as_ref()` and `?` so `active_provider_session` and `active_provider_connection` are cleared **only** after a successful stop. Failed stop retains the exact ID; `execute_command("close")` retries the same browser; `execute_command("launch")` is blocked via `close_current_browser(state).await?` at actions.rs:5088. Test `test_browser_use_failed_close_retains_id_and_blocks_replacement` exercises this through the public command surface, not the implementation.
   *La retención del mismo ID tras un stop fallido está correctamente implementada y probada a través de la superficie pública.*

2. **Cancellation-safe ownership before attach (the invariant that replaced the receipt callback).** In both call sites (actions.rs:4195–4208 and 5194–5218), between `connect_provider…().await?` returning the ID and `remember_active_provider_session(...)`, there is **no await point** for the browser-use path (`direct_page` is always `false` for browser-use, so the only intervening await is unreachable; `take_agentcore_ws_headers` is sync). The contract's claim "create returns an ID and endpoint without any subsequent await" holds in the shipped code. Cancellation during the create HTTP itself (ID never received) is the documented "outcome unknown" case.
   *La afirmación del contrato se cumple: no existe punto de `await` entre obtener el ID y registrarlo en memoria; la ventana de cancelación durante el POST está documentada como "outcome unknown".*

3. **Cancellation of `close_current_browser`.** The reorder at actions.rs:2482–2511 (state flags cleared synchronously **before** the first await) means cancellation mid-close still leaves `launch_hash`/`screencasting`/`network_auto_attach_installed` cleared while `active_provider_session` is retained. The `closing=true` branch of `test_browser_use_canceled_setup_and_stop_preserve_state` demonstrates this with a real stalled socket — this is executed coverage, not mirroring.
   *El reordenamiento hace que la cancelación deje las banderas limpias y la sesión retenida; la prueba lo demuestra con un socket real.*

4. **Configuration rollback.** Both `auto_launch` (4026–4043) and `handle_launch_with_deadline` (4846–4859) snapshot before and restore on any error, including timeout. `auto_launch` deliberately omits the domain-filter snapshot — correct, because `auto_launch_inner` never writes `domain_filter` (it only reads `current_allowed_domains`), whereas `handle_launch_inner` can write it (5037–5044) and its wrapper restores it.
   *El rollback es coherente: `auto_launch` no restaura el filtro de dominios porque nunca lo modifica; `handle_launch` sí lo hace y sí lo restaura.*

5. **Secret safety.** `browser_use_response` (providers.rs:395–411) never surfaces response bodies (status code only) or reqwest error details (classified into three fixed strings). Redirect policy `none` (providers.rs:390) prevents the API key header from following a hostile 3xx. `attach_provider_cdp` replaces the raw attach error (which could echo a `cdpUrl` containing credentials) with a fixed string. Hostile-body tests exercise this.
   *Los errores nunca exponen cuerpos de respuesta, claves ni la cdpUrl; la política de no-redirección evita fuga de la cabecera de API key.*

6. **No unrelated provider behavior change.** Browserbase/browserless/kernel/agentcore/plugin close paths still swallow errors and return `Ok(())`; the `Result` signature change is consumed but functionally identical for them. Decision-trail item 2's rationale (browser-use never uses `direct_page`, so `let _ =` in that branch is behavior-preserving) is verified: `connect_browser_use` sets `direct_page: false` (providers.rs:75–83).
   *Los demás proveedores conservan su comportamiento; el razonamiento del decision trail es correcto.*

---

## 2. Findings / Hallazgos

### F1 — Low (unverified external contract, not a demonstrated bug): stop acknowledgment shape
`stop_browser_use_session_at` (providers.rs:469–478) requires the PATCH response to echo the same `id` **and** literal `status == "stopped"`. If the real V4 API returns e.g. `"stopping"`, `"STOPPED"`, or omits the id echo, `close` will fail permanently and the pending guard will block all future launches for that session name. The HTTP tests encode the same assumed wire shape, so they cannot detect a mismatch with the real API. This is a fail-closed design (consistent with the contract's "acknowledged as stopped"), but it should be verified once against the live V4 API before merge. **Not requesting a new test** — a test would only mirror the same assumption.
*Suposición externa no verificable desde el paquete: si el API real responde `"stopping"` o no hace eco del id, `close` fallará para siempre. Diseño fail-closed correcto, pero verificar una vez contra el API real.*

### F2 — Low: unrecoverable pending session when API key parses as the session UUID
providers.rs:457–459 rejects a stop whenever `uuid(key) == id`. Combined with connect-side filtering (providers.rs:436), this state should be unreachable via this code's own creates, but if it ever arises (e.g., key rotated to a UUID colliding with a pre-existing pending id), `close` fails forever with no force-release path; the documented `--session` workaround is described only for the 404 case. Cosmetic doc gap, negligible probability.
*Estado teóricamente inalcanzable pero sin vía de liberación forzada si ocurre; la documentación solo cubre el caso 404.*

### F3 — Low: 18s deadline misattributed when `AGENT_BROWSER_CDP` and browser-use env coexist
`auto_launch` gates the 18s wrapper on `AGENT_BROWSER_PROVIDER` alone (actions.rs:4022), but `auto_launch_inner` takes the `AGENT_BROWSER_CDP` branch first (4096) when both are set. A slow direct CDP connect would then be cancelled at 18s with a "Browser Use setup timed out" message that names the wrong subsystem, and the 4s cleanup close runs against a non-Browser-Use browser. Same shape exists in `handle_launch_with_deadline` if a command carries both `provider:"browseruse"` and `cdpUrl` (cdpUrl branch wins at 5120). Functional impact is a confusing error plus an unrequested timeout on the CDP path; no state corruption (rollback still restores config).
*Con ambas variables definidas, la ruta CDP hereda el deadline de Browser Use y un mensaje de error engañoso. Sin corrupción de estado.*

### F4 — Info: exact-string provider match in `browser_use_setup_timeout`
actions.rs:3867 compares `provider == "browser-use"` while everything else uses `provider_is_browser_use`. Currently unreachable divergence (sessions are only constructed with `"browser-use"`, providers.rs:441), but a future `ProviderSession` spelled `"browseruse"` would silently drop the recovery hint from the timeout message. One-line robustness fix.
*Divergencia hoy inalcanzable; conviene usar el helper para robustez futura.*

### F5 — Info: `BROWSER_USE_ENABLE_RECORDING` truthiness is permissive
providers.rs:506–514: any value outside `0|false|no|""` (e.g., `"off"`) enables recording. Docs only show `"true"`. Minor UX footgun with a privacy-adjacent flag; consider documenting or tightening. Intentional-simplicity territory, not a defect.
*Valores como `"off"` activan la grabación; documentar o restringir. No es un defecto.*

### F6 — Info: attach cancellation after handler startup relies on implicit teardown
If the 18s timeout cancels `handle_launch_inner` after `start_fetch_handler()`/`subscribe_to_browser_events()` but before completion, cleanup goes through `close_current_browser`, which clears flags and closes the manager; background handlers are torn down only implicitly by the dying connection. This mirrors the pre-existing rollback pattern in the base code, so I classify it as inherited risk, not a regression introduced here.
*Riesgo heredado del patrón base, no una regresión de este PR.*

### F7 — Info / scope note: attach-failure cleanup timing changed for all providers
Moving `remember_active_provider_session` before `attach_provider_cdp` means every provider's session is now state-visible during attach, and attach failure cleans up via `close_active_provider_session` instead of the inline `close_provider_session_with_plugins`. For non-browser-use providers this is functionally equivalent (their stops swallow errors → `Ok` → state cleared) and actually improves cancellation/shutdown coverage. Technically this touches unrelated providers' lifecycle *timing*, but it is the mechanism the authorized scope requires and is behavior-preserving; I do not flag it as a scope violation.
*Cambio de temporización funcionalmente equivalente para otros proveedores; requerido por el alcance autorizado, no lo considero violación.*

---

## 3. Decision-trail audit / Auditoría del decision trail

- **Decision 1 (remove disk receipts, keep in-memory ownership + rollback):** Sound. The one distinct invariant the receipt feature provided — **crash-safe persistence of the browser ID across daemon exit** — is gone, but this is an *intentional, documented scope removal*, not a silent drop: README, provider docs, `output.rs` help text, and skill-data all state "if the daemon exits before a stop succeeds, inspect the Browser Use Cloud dashboard." The receipt could never have covered the other orphan window (cancellation before the create response arrives), which is separately documented. No undocumented invariant was lost.
  *La única invariante distinta eliminada (persistencia del ID ante crash del daemon) fue retirada deliberadamente y está documentada en los cuatro artefactos; nada se perdió en silencio.*
- **Decision 2 (leave direct-page rejection cleanup, only consume the Result):** Verified correct — browser-use always sets `direct_page: false`, so swallowing cleanup errors in that branch cannot affect this fix, and both launch paths were treated identically.
  *Verificado: la rama direct-page es inalcanzable para browser-use.*

## 4. Test audit / Auditoría de pruebas

The retained tests guard **distinct boundaries** with executed behavior (real sockets, real timeouts, hostile bodies, public `execute_command` surface, one ignored real-Chrome continuity test), not implementation mirrors. The `browser_use_create_body_from_lookup` table rows are borderline but minimal and cover the `null`-vs-absent proxy semantics, which is genuine wire behavior. I request **no additional tests**; the only outstanding verification (F1) is against the live API, which a unit test cannot provide. Parallel env mutation depends on `EnvGuard` serialization semantics, which I cannot verify from this packet — assumed to be the existing project utility.
*No solicito pruebas adicionales; la única verificación pendiente (F1) es contra el API real, no algo que una prueba unitaria pueda aportar.*

## 5. Conclusion / Conclusión

**No blocking findings.** All authorized invariants — V4 create/stop wire format, options mapping, 10/8/18/4s budgets, secret-safe errors, UUID validation, same-ID retention on stop failure and cancellation, pending-session replacement guard, configuration rollback on both setup callers, existing local/external browser continuity, unchanged unrelated providers — are verifiably preserved in the supplied code. F1 warrants a one-time manual verification against the live V4 stop response; F3 and F4 are cheap follow-up hardening; F2, F5–F7 are informational.

**Sin hallazgos bloqueantes.** Todas las invariantes autorizadas se preservan de forma verificable en el código suministrado. F1 merece una verificación manual única contra el API real; F3 y F4 son endurecimientos baratos de seguimiento; F2 y F5–F7 son informativos. La simplificación no eliminó ninguna invariante distinta sin documentarla: la única capacidad retirada (recuperación tras salida del daemon) fue una remoción de alcance deliberada y explícita.