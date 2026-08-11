# Proposals: agent-browser issue #1677

Both proposals were produced independently in fresh clones of `vercel-labs/agent-browser` at `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`. Neither proposer saw the other proposal.

## Proposer A: Claude Fable 5, high effort

The following response is preserved verbatim.

### Shape

*(EN)* The root cause: `cdp_loop.rs:133` handles only `Page.frameNavigated`, which Chrome fires solely for cross-document navigations. History API and anchor navigations fire `Page.navigatedWithinDocument`, whose params are only `frameId`, `url`, `navigationType` — no `parentId` — so main-frame detection by "parentId absent" cannot be reused there.

State: the per-bind inner loop in `cdp_event_loop` (`cli/src/native/stream/cdp_loop.rs:115`) gains one local, `main_frame_id: Option<String>`. It is owned entirely by the event loop; nothing outside the stream module reads or writes it, and it dies when the loop rebinds (client change, session change, viewport change), which is exactly when it could go stale.

Ownership of decisions:
- Seeding: at bind time, after the status broadcast and only when the engine is Chrome, the loop asks the active session `Page.getFrameTree` (same call pattern as `state.rs:278` and `network.rs:51`) under a short timeout and records `frameTree.frame.id`. This covers the client-connects-after-page-load case where no `frameNavigated` will ever precede an anchor navigation.
- Refresh: every main-frame `Page.frameNavigated` (existing `parentId`-absent test, unchanged) also records `frame.id`, keeping the identity current across cross-document navigations and redirects.
- Emission: `Page.navigatedWithinDocument` emits the existing `{"type":"url", ...}` message and mirrors the existing `last_tabs` active-tab URL update **iff** `params.frameId == main_frame_id`. Unknown `main_frame_id` drops the event — conservative, preserving child-frame isolation over completeness.

The contract becomes: the streamed `url` message tracks *all* main-frame navigations (cross-document, historyApi, fragment), not just cross-document ones; child frames — same-process or OOPIF — never produce it. Wire format, screencast, acks, non-Chrome paths, and the dashboard consumer (`packages/dashboard/src/store/stream.ts:211`) are untouched.

*(ES)* El estado es un único `Option<String>` local al bucle de eventos, sembrado vía `Page.getFrameTree` al enlazar y refrescado por cada `frameNavigated` del frame principal; `navigatedWithinDocument` solo emite si su `frameId` coincide. El contrato pasa a ser: la URL transmitida sigue todas las navegaciones del frame principal, y los frames hijos quedan aislados.

### Predictions

1. *(EN)* A new tokio unit test in `cli/src/native/stream/` (mock CDP WebSocket server per the `start_mock_cdp_browser_*` pattern in `browser.rs:3482`, `CdpClient::connect` to it, `StreamServer::start`, one stream WS client): the mock answers `Page.getFrameTree` with main frame id `F-MAIN`, then emits `Page.navigatedWithinDocument` with `{frameId:"F-MAIN", navigationType:"historyApi"}`, then `{frameId:"F-MAIN", navigationType:"fragment"}`, then `{frameId:"F-CHILD", navigationType:"fragment"}`. Run `cargo test --manifest-path cli/Cargo.toml stream`. Pass: the client receives exactly two `type:"url"` messages with the new URLs and none within a 300 ms `expect_no_frame`-style window after the child event. Fail on current main: zero `url` messages arrive — that failing-first run is the falsification of the bug's existence. *(ES: la prueba nueva falla en `main` actual y pasa con el arreglo.)*
2. *(EN)* Seeding prediction: a variant of the same test that emits **no** `Page.frameNavigated` at all before the same-document event still delivers the `url` message, proving `getFrameTree` seeding works for clients that connect after page load. If the implementation only learns the main frame from `frameNavigated`, this test times out — observably false. *(ES: sin `frameNavigated` previo, la URL igualmente llega gracias a la siembra.)*
3. *(EN)* Regression prediction: `cargo test --manifest-path cli/Cargo.toml -- native::stream` passes with zero modifications to the 20 existing tests in `stream/mod.rs` (frame pacing, acks, caps, shutdown), and the mock must answer exactly one additional method (`Page.getFrameTree`) — any test needing more mock surface indicates scope creep. *(ES: las pruebas existentes pasan sin tocarlas.)*
4. *(EN)* Manual probe: with the daemon streaming and `websocat ws://127.0.0.1:<port>` attached, `agent-browser eval "history.pushState({},'','/spa-route')"` produces a `{"type":"url","url":".../spa-route"}` line within 2 seconds; on current main it produces nothing. *(ES: sonda manual con `websocat` y `pushState`.)*

### Cost

*(EN)* One production file: `cli/src/native/stream/cdp_loop.rs` (~30 lines: one local field, one seeding call, one event arm that shares the existing URL-emit/tab-cache block with the `frameNavigated` arm). Tests land in `stream/mod.rs` or `cdp_loop.rs` tests plus a small mock CDP server (~80 lines, following `browser.rs:3482`). No schema, dashboard, protocol, or migration changes; the wire message already exists. One added CDP round trip (`Page.getFrameTree`) per loop bind — client connect, session switch, viewport change — not per frame or per navigation. Maintenance obligation: the stream loop now holds a private notion of "main frame id" that `network.rs` and `a11y/mod.rs` also derive independently; if a shared frame tracker ever appears, this is a third call site to consolidate. *(ES: un archivo de producción, un viaje de ida y vuelta extra por enlace, y una tercera derivación del frame principal que consolidar en el futuro.)*

### What it makes worse

*(EN)* Two real regressions in kind. First, chattiness: fragment navigations can fire at high frequency (scrollspy pages rewrite the hash on every scroll tick), and each now produces a `url` broadcast on the ordered `frame_tx` channel (capacity 64, `mod.rs:331`), so a slow WS client is likelier to hit `RecvError::Lagged` and lose interleaved console messages it would previously have received. Second, bind latency: the `getFrameTree` seed adds a blocking call before the event loop starts; against a wedged renderer (the discarded-tab class of hangs this repo already fights, `browser.rs:727`) it delays first frames, so it must be timeout-bounded (~1 s), and when that timeout fires, same-document URL sync is silently degraded until the next full navigation. *(ES: más tráfico de mensajes `url` que puede provocar `Lagged` en clientes lentos, y una llamada de siembra que retrasa el arranque del stream ante un renderer colgado.)*

### Rejected alternatives

*(EN / ES notas por ítem)*
- **Session-id match instead of frame-id match** (emit when `evt.session_id` equals the active session): killed by same-process child iframes, which share the parent's CDP session — an iframe's fragment navigation would be adopted as the main URL. The prediction-1 child-frame probe kills it directly. *(ES: los iframes del mismo proceso comparten sesión; la sonda del frame hijo lo mata.)*
- **Assume main frame id == target id**: the stream server stores only the session id (`mod.rs:190`), so this needs threading the target id through `set_cdp_session_id` and every caller — wider surface — and the equality is an undocumented Chrome invariant that breaks on prerender activation, where the activated page keeps its own frame id. A prerender-activation manual probe showing dropped `url` messages kills it. *(ES: invariante no documentada que se rompe con prerender.)*
- **Poll `location.href` via `Runtime.evaluate` on a timer**: adds a per-tick round trip on the shared CDP connection competing with screencast acks, bounds staleness by the poll interval instead of eliminating it, and misses rapid transitions. Measuring CDP commands/second before and after kills it on cost alone. *(ES: sondeo periódico añade carga y latencia medibles.)*
- **Handle it in the command layer** (`browser.rs`/`actions.rs` pushing through `broadcast_tabs`): navigations initiated inside the browser — a human clicking an anchor in a headed session — never pass through the daemon command path, so the probe "click an in-page anchor with no CLI command issued" emits nothing and kills it. *(ES: un clic humano en un ancla no pasa por el daemon; nada se emitiría.)*

## Proposer B: OpenAI GPT-5.6-sol, high effort

The following response is preserved verbatim.

### Shape

`StreamServer` retains active-tab ownership through `cdp_session_id`. The Chrome CDP loop owns a transient `main_frame_id`, seeded with `Page.getFrameTree` and refreshed by active-session `Page.frameNavigated` events.

A shared publisher updates the cached active tab and sends the ordered `url` message. It accepts:

- Active main-frame `Page.frameNavigated`
- Active-session `Page.navigatedWithinDocument` only when `frameId` equals `main_frame_id`

Same-process child frames fail the frame check; out-of-process and background frames fail the session check. Non-Chrome engines retain their existing path. Screencast handling remains separate and unchanged.

### Predictions

- `cd cli && cargo test e2e_stream_url_tracks_main_frame_navigation_categories -- --ignored --test-threads=1` will receive correct URL messages after full, History API, and anchor navigation, then receive none after an iframe same-document navigation.
- `cd cli && cargo test native::stream::cdp_loop::tests::navigation_event_filter_uses_active_session_and_main_frame -- --exact` will prove that only active-session main-frame events update `last_tabs` and publish.
- `cd cli && cargo test native::stream::tests::test_ack_of_the_wire_id_releases_the_next_frame -- --exact` will continue passing, demonstrating unchanged frame acknowledgement behavior.

### Cost

Runtime changes belong in `cli/src/native/stream/cdp_loop.rs`; integration coverage belongs in `cli/src/native/e2e_tests.rs`. Documentation updates are required in `cli/src/output.rs`, `README.md`, `skill-data/core/SKILL.md`, `skill-data/core/references/streaming.md`, and `docs/src/app/streaming/page.mdx`.

One transient main-frame identifier is added, with no persistence or migration. Chrome incurs one `Page.getFrameTree` round trip when binding the event loop to a page session, not per navigation. No protocol fields, MCP parser changes, or client migrations are needed.

### What it makes worse

Stream attachment or active-tab switching gains one Chrome CDP round trip. The event loop also becomes more dependent on correct session bookkeeping; a stale `cdp_session_id` would suppress valid URL updates instead of publishing a potentially incorrect one.

### Rejected alternatives

- Publish every `Page.navigatedWithinDocument`: killed by an iframe `history.pushState` probe, which would adopt the child URL.
- Filter only by session ID: killed by same-process iframes, whose events share the top-level target session.
- Learn the main frame only from future `Page.frameNavigated` events: killed by connecting to an already-loaded SPA and immediately calling `pushState`.
- Publish from CLI navigation commands: killed by page-script History API calls, anchor clicks, browser controls, and other navigation not initiated by a command.
- Inject history and hash listeners into page JavaScript: killed by early navigation races, overwritten wrappers, isolated worlds, and the requirement not to alter non-Chrome behavior.
