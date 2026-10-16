# Revisión de seguimiento / Follow-up Review — Enmiendas F1/F3 y cierre de F2/F4

**Base de evidencia / Evidence base:** solo el diff final y los extractos suministrados (`actions.rs`, `providers.rs`, `browser.rs:594-635, 2371-2408`, `stream/discovery.rs`, `actions.rs:920-966, 2122-2175, 3490-3590, 8210-8250`). Sin herramientas, sin ejecución de pruebas. / Supplied packet only; no tools, no test execution.

---

## 1. Verificación de las enmiendas / Amendment verification

**F1 — RESUELTO / RESOLVED.** El wrapper `auto_launch` (`actions.rs:3506-3530`) ahora toma snapshot de `proxy_credentials` (3514) y `plugin_init_scripts` (3515) antes del timeout de 18 s y los restaura ante cualquier `Err` (3525-3528), cubriendo tanto el timeout como fallos internos. La prueba `test_browser_use_failed_auto_launch_restores_configuration` verifica exactamente el escenario de F1: env con `AGENT_BROWSER_PROVIDER=browser-use`, credenciales previas y script previo restaurados tras fallo. La asimetría con `handle_launch_with_deadline` desaparece. Nota conforme: `domain_filter` no se snapshotea en `auto_launch`, pero `auto_launch_inner` solo lo *lee* vía `current_allowed_domains` (3560), nunca lo escribe — no se requiere restauración. / Wrapper now mirrors the explicit-launch pattern; domain filter omission is correct since the auto path never mutates it.

**F3 — RESUELTO / RESOLVED.** `close_current_browser` (`actions.rs:2135-2163`) ahora ejecuta la contabilidad local de forma **síncrona antes de cualquier await de red**: `browser.take()`, `launch_hash = None`, `network_auto_attach_installed = false`, limpieza de iframe maps, `screencasting = false`, `reset_input_state()` (2136-2142) preceden a `mgr.close()` (2145-2146) y al cierre del proveedor (2151). La cancelación del cleanup de 4 s ya no puede dejar bookkeeping obsoleto junto a `browser == None`. La prueba `test_browser_use_canceled_stop_keeps_ownership` ahora ejercita `close_current_browser` real (proxy bloqueado en la petición de stop, cancelación vía drop en `tokio::select!`) y verifica ambos lados: campos reseteados (`launch_hash == None`, `!screencasting`, `!network_auto_attach_installed`) **y** ownership retenido (`active_provider_session` + `active_provider_connection`). Cierra F3 completamente.

**F2 — CERRADO como no-defecto / CLOSED as non-issue.** `discovery.rs:25-39` confirma que el archivo `<session>.provider` (`write_provider_file`, `actions.rs:8216-8221`) solo alimenta el listado de sesiones de descubrimiento; la vitalidad se decide por `is_process_alive(pid)` (18), no por el marcador. Un marcador escrito para un launch que luego falla es metadata cosmética, no una afirmación de conexión viva. Retiro F2. / Marker is selection metadata gated by pid liveness; withdrawn.

**F4 — CERRADO / CLOSED.** `resolve_cdp_url` (`browser.rs:2371-2397`) prueba que `connect_cdp` acepta `http`/`https`: hosts estilo proveedor sin puerto se convierten a `ws`/`wss` (2381-2389); en otro caso se hace descubrimiento HTTP CDP por host/puerto (2391-2396). El filtro de esquemas en `providers.rs` es consistente con el consumidor real; la prueba `test_browser_use_accepts_http_cdp_endpoint` queda respaldada. Retiro F4. / The trail's assumption is now evidence-backed; withdrawn.

---

## 2. Bloqueadores introducidos por las enmiendas / Blockers introduced by the amendments

Busqué regresiones específicas del reordenamiento y del endurecimiento de `close_active_provider_session`:

- **Retención en error de cierre de proveedor:** `close_active_provider_session` (2126-2133) ahora usa `as_ref()` + `?`, así que ante error el session id se **retiene** (no se limpia como hacía el `take()` anterior) y `active_provider_connection` permanece — coherente con el contrato de retry y con `test_execute_command_close_failure_retains_browser_use_ownership_and_retries`. Para proveedores no browser-use los errores siguen tragándose dentro de `close_provider_session_with_plugins` (`let _ =` en sus ramas), devolviendo `Ok(())` — comportamiento previo preservado. **No bloqueante.**
- **Doble error combinado:** el fallo de `mgr.close()` ya no aborta el intento de stop del proveedor; ambos errores se combinan (2151-2158). Correcto: antes un fallo del navegador local podía impedir el stop de Cloud. Mejora, no regresión.
- **`close_before_implicit_relaunch` (2039-2051):** propaga errores solo para browser-use; para el resto replica el antiguo `let _ =`. La detección de browser-use se hace **antes** del close (correcto, ya que un close exitoso limpiaría la sesión). **No bloqueante.**
- **Idempotencia de ownership en el path owned:** `connect_owned_provider` fija ownership vía callback dentro de `connect_browser_use_owned`, y luego `remember_active_provider_session(state, conn.session.clone(), ...)` lo reescribe con la misma sesión antes del attach — idempotente; el error de attach pasa por `close_active_provider_session`, que retiene ante fallo de stop. **No bloqueante.**

**Ningún bloqueador introducido. / No blocker introduced.**

---

## 3. Observaciones menores nuevas (no bloqueantes) / New minor observations (non-blocking)

**N1 — Drop de `BrowserManager` sin `close()` bajo cancelación tardía.** Con la reordenación, si el timeout de 4 s (o el de 18 s) cancela `close_current_browser` *entre* el take del navegador y la finalización de `mgr.close()` (2145-2146), la variable local `browser` se dropea sin close explícito. Para browser-use el manager es un attach CDP (`browser_process: None`, `browser.rs:620`), así que solo se dropea un socket — inocuo. Si un navegador **local** estuviera activo antes de un relanzamiento implícito a browser-use que agota los 18 s, el proceso local podría quedar huérfano según la semántica de `Drop`, que no está en el paquete. Riesgo acotado y preexistente al diseño C7 (el close implícito ya vivía dentro del deadline en el código previamente revisado); lo registro como límite, no como regresión.

**N2 — `update_stream_client().await` es un punto de await dentro del bloque de reset (2143).** Cancelación exacta durante ese await dejaría el slot del stream apuntando al cliente antiguo mientras `state.browser == None`; el siguiente launch lo reescribe (`update_stream_client` se invoca en cada transición). Autocurable, ventana mínima. Fix opcional: mover el `update_stream_client` detrás de un guard no cancelable o repetirlo en la rama `Err(_)` del cleanup — no lo exijo.

---

## 4. Límites residuales / Residual limits

Sin cambios respecto a la revisión previa y no re-litigados aquí (código sin cambios ya revisado): semántica en vivo de Cloud (sin credenciales, ninguna afirmación en vivo hecha ni requerida), `daemon.rs` no suministrado, semántica de `Drop` de `BrowserManager` (N1), implementación de `restore_domain_filter`, mapeo del front-end `-p browseruse` → campo `provider`. Las afirmaciones de fmt/clippy/tests del implementador siguen siendo afirmaciones, no evidencia.

---

## 5. Disposición / Disposition

**APPROVE — sin hallazgos bloqueantes / no blocking findings.** F1 y F3 quedan verificados como resueltos en el diff final con cobertura de prueba directa; F2 y F4 quedan cerrados por la nueva evidencia (`discovery.rs`, `resolve_cdp_url`). Las enmiendas no introducen ningún bloqueador; quedan dos observaciones menores autocurables (N1, N2) y los límites de evidencia declarados.

**Una línea / One line:** enmiendas verificadas, F1/F3 resueltos, F2/F4 retirados, cero bloqueadores nuevos; aprobado con dos observaciones menores. / Amendments verified, F1/F3 resolved, F2/F4 withdrawn, zero new blockers; approved with two minor observations.