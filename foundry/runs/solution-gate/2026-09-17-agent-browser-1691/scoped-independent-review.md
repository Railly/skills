# Revisión final independiente / Independent Final Review — Browser Use Cloud PR 1691

**Base de evidencia / Evidence base:** only the supplied packet (reconciled-contract.md, timing-feedback.md + FINAL AMENDMENT, excerpts of `cli/src/native/actions.rs`, `cli/src/native/providers.rs`, FINAL DIFF, DECISION TRAIL). No filesystem reads, no tests executed. / Solo el paquete suministrado; sin lecturas de disco ni ejecución de pruebas.

---

## 1. Hallazgos confirmados en el código / Confirmed code findings

**F1 — Asimetría de rollback en auto-launch (menor, conforme al contrato) / Rollback asymmetry in auto-launch (minor, contract-consistent).**
- **Trigger:** env-driven browser-use auto-launch fails or times out after `auto_launch_inner` has already written `state.proxy_credentials` (`actions.rs:3561-3568`) and cleared `state.plugin_init_scripts` (`actions.rs:3534`). Unlike `handle_launch_with_deadline` (`actions.rs:4310-4321`), the `auto_launch` wrapper (`actions.rs:3505-3522`) takes no snapshot and restores nothing.
- **Effect:** credenciales de proxy obsoletas y scripts vaciados persisten hasta el siguiente relanzamiento, que los recalcula desde el env. / Stale creds and cleared scripts persist until the next launch recomputes them from env.
- **Contract fit:** the FINAL AMENDMENT only mandates restoration for *explicit* Browser Use setup, so this is not a violation — but it is a real behavioral asymmetry.
- **Fix (no implementar / do not implement):** apply the same snapshot/restore pattern inside the `auto_launch` timeout wrapper.

**F2 — `write_provider_file` antes de pasos que aún pueden fallar / `write_provider_file` before still-fallible steps.**
- **Trigger:** browser-use attach succeeds, then `install_network_controls_or_close` or `load_storage_state_or_rollback` fails (`actions.rs:4685-4690`; same ordering in auto path at `3711-3715`). The provider file is written for a launch that ultimately errors and whose browser is closed.
- **Effect:** metadata de proveedor potencialmente obsoleta para una sesión sin navegador. / Potentially stale provider metadata for a browserless session. Severity low; `write_provider_file` semantics are not in the packet.
- **Fix:** write the provider file only after the launch fully succeeds, or remove it on the failure path.

**F3 — Cancelación del cleanup de 4 s puede omitir la contabilidad local / 4s cleanup cancellation can skip local bookkeeping.**
- **Trigger:** in `browser_use_setup_timeout` (`actions.rs:3450-3478`), the 4-second `tokio::time::timeout` can cancel `close_current_browser` after `state.browser.take()`/`mgr.close()` but before the bookkeeping lines (`actions.rs:2150-2156`: `launch_hash = None`, `iframe_sessions.clear()`, `reset_input_state`, `update_stream_client`).
- **Effect:** stale `launch_hash`, iframe/session maps and input state coexist with `state.browser == None`. Ownership is correctly retained (session cleared only after acknowledged stop, `actions.rs:2126-2132`), and any next command forces relaunch (`needs_launch` sees `browser == None`), so this self-heals — but skip-launch actions could observe stale bookkeeping in the interim.
- **Fix:** perform local state resets before awaiting the network stop, or re-run them in the `Err(_)` cleanup-timeout branch.

**F4 — Suposición de esquema sobre endpoints HTTP/S CDP / Schema assumption for HTTP/S CDP endpoints.**
- The DECISION TRAIL justifies accepting `http`/`https` `cdpUrl` (providers.rs:569-573) with "schema does not restrict CDP to WebSocket URLs" — the schema is not in the packet, and `BrowserManager::connect_cdp` behavior on an `http` URL is not supplied. Failure mode is bounded (8s attach timeout → retained-ownership cleanup), so this is safe, but the justification is an unsupported assumption in the trail, not proven.

Ningún defecto bloqueante confirmado. / No blocking defect confirmed in the supplied code.

---

## 2. Verificación de los puntos solicitados / Verification of requested points

- **Cancelación de `handle_launch`:** confirmed. `handle_launch` delegates to `handle_launch_with_deadline` (`actions.rs:4294-4323`); browser-use commands are wrapped in the 18s timeout; timeout invokes `browser_use_setup_timeout` with bounded 4s cleanup and pending-UUID recovery text.
- **Preservación de domain_filter/proxy_credentials/plugin scripts:** confirmed for explicit launch — snapshot before, restore on any error (`4310-4321`); tests `test_browser_use_canceled_launch_restores_domain_filter` (`actions.rs:13197`) and `test_browser_use_failed_launch_restores_domain_filter` (`13236`).
- **Timeouts agregados / Aggregate timeouts:** confirmed. `BROWSER_USE_CREATE_DEADLINE = 10s`, `BROWSER_USE_STOP_DEADLINE = 4s` (`providers.rs:12-13`), `BROWSER_USE_ATTACH_DEADLINE = 8s` (`actions.rs:2068`), `BROWSER_USE_SETUP_DEADLINE = 18s` (`3448`), cleanup 4s (`3452-3456`). Create/attach are *nested inside* the 18s (subordinate, not additive). 18 + 4 = 22s ≤ 26s budget, 8s margin under the 30s floor. Constants locked by tests (`13186`, `providers.rs:1388`). Docs (README, MDX, output.rs, commands.md) match exactly; no residue of the superseded 22s figure.
- **Propiedad retenida durante cancelación / Retained ownership through cancellation:** confirmed. `on_session` callback applies ownership *before* the async receipt write (`providers.rs:555-565`); cancellation-during-receipt test (`providers.rs:1287-1340`); cancelled stop keeps ownership (`actions.rs:13321-13383`); failed close retains ID and stays retryable (`13386-13415`); pending ownership blocks new launch via `?` at `actions.rs:4541` (`13418-13441`).
- **Protocolo create/stop:** confirmed. Single POST `/browsers` per attempt, no transport-triggered replay (R9 messages via `BROWSER_USE_UNKNOWN_OUTCOME`); stop is PATCH `{"action":"stop"}` requiring body acknowledgment `id == pending && status == "stopped"` (`providers.rs:644-659`); 404/5xx/non-ack all error; UUID-shaped-credential guards at `549` and `605`; fixed secret-safe error strings (tests `1363`, `1473`, `1602`, `13254`).
- **Docs:** consistent across README, `docs/src/app/providers/browser-use/page.mdx`, `cli/src/output.rs`, `skill-data/core/references/commands.md`: 18s/4s/10s/8s/4s, close-only-on-acknowledgment, receipt path and API-key-free contents, conservative 404 with manual new `--session` recovery.

---

## 3. Hipótesis refutadas / Refuted hypotheses

1. **`handler.rs` existe** — refutado; no such file is supplied or diffed. Changes live in `actions.rs`, `providers.rs`, `output.rs`, docs.
2. **Deadlines subordinados se suman fuera de los 18s** — refuted; nested timeouts (`3513`, `4313`).
3. **Cancelación durante la escritura del receipt pierde el ID** — refuted (callback-before-write + test `providers.rs:1287`).
4. **404 tratado como stop exitoso** — refuted (`providers.rs:631-637`; matrix test `1624`); conservative 404 is explicit contract, not a bug.
5. **Cierre implícito previo escapa del deadline** — refuted; the pre-launch close moved into `auto_launch_inner` (`3528-3530`) and the redundant close was removed from `execute_command` (diff at 2513-2524), matching the C7 requirement that prior close be inside setup.
6. **Fuga de credenciales/cuerpos hostiles en errores o receipts** — refuted (fixed messages, hostile-body and UUID-credential tests `1473`, `1602`, `1363`, `1395`, `13254`).
7. **Un stop fallido reporta éxito o limpia el ID** — refuted (`2126-2132`, acknowledgment gate, retry test `13386`).

---

## 4. Brechas de evidencia residuales / Residual evidence gaps (not bugs)

- **Semántica en vivo de Cloud:** ack schema variants (e.g., a hosted `"stopping"` status would make every close fail conservatively), repeated-stop, billing, profile/recording persistence, real latency — no credentials; carried limit per packet.
- **Rutas de apagado del daemon:** the contract's probe claims `daemon.rs:333/350` discards close errors; `close_all_browser_backends` returns the error (`2168-2186`) but daemon.rs is not supplied — D4 relies on the receipt, unverified here.
- **`handle_close` / acotación de `mgr.close()`** for browser-use CDP close: not in packet.
- **Mapeo CLI de `-p browseruse` al campo `provider` del comando launch:** the 18s wrapper gates on the cmd field (`4303-4307`); front-end mapping not supplied.
- **Claims del implementador** (cargo fmt/clippy/test "1168+2 passed", decision trail 07:22) — unverifiable in this context; treated as claims, not evidence. The trail's honest gap ("no wire-level positive close through execute_command; stop base hardcoded") stands.
- **`restore_domain_filter` implementation** not supplied (assumed faithful restore; test only covers the read-back).

---

## 5. Disposición / Disposition

**APPROVE (aprobar).** The supplied final code satisfies R0–R11 as reconciled: bounded 18s setup with nested 10s/8s subordinate limits, 4s bounded post-timeout cleanup, ownership retained through cancellation and failed stop, acknowledgment-gated close, no replacement launch over pending ownership, secret-safe errors and receipts, conservative 404 with documented manual `--session` recovery, and consistent documentation. Findings F1–F4 are minor/observational (fixes optional, none blocking); the remaining gaps are carried evidence limits explicitly acknowledged by the contract, not defects.

**Disposición en una línea / One-line disposition:** aprobado con cuatro observaciones menores no bloqueantes y brechas de evidencia declaradas / approved with four minor non-blocking observations and declared evidence gaps.