Independent reduction and choice-audit pass. Read-only, no tools. Review this frozen diff against the contract. Propose only necessary behavior-preserving simplifications, identify bugs or unsupported choices. Do not implement. Must explicitly audit declared decisions. Scope: auth-specific fill; no global fill edits. Native edit was probed in Chrome 152: trusted input, correct React19.2 controlled submit, Unicode, normal email/password/text/textarea. New regression fails at wrong-field DOM value on original PR and passes in fixed auth suite. Return findings with code context, smallest correction, or explicit no findings and limits.

# Auth duplicate-control correction contract

Base d01253d9db28d75080e36da3c1c31ef89454731e. Recreate PR #1999 (1b4cacd0) and fix verified wrong-field delivery. Authorize edits, tests, signed commit, upstream branch, replacement PR; no merge or original PR mutation.

R1: hidden/disabled/readonly-first matches must yield a usable visible username/password/submit, including explicit CSS selectors. Unusable twins stay untouched.
R2: each credential reaches only the selected DOM field. Detachment or focus redirection before insertion returns error without delivery elsewhere. No submit after fill rejection.
R3: ordinary fill remains unchanged. Auth retains native input events, controlled React state, Unicode, replacement of existing values, explicit CSS, delayed SPA and no-navigate origin binding.
R4: bounded selector polling; no credential-level retries after selecting an exact node. A caller may retry after restoring the form. Remote objects acquired by the new auth fill are released after both success and rejection.
R5: preserve Jony's human coauthor trailer. No new public flags, storage schema or protocol changes. MCP auth delegates the existing parser/action path.

Evidence: original before/after and pressure results in /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence. Original review report remains preserved.

Factory thresholds fixed before edits: cargo fmt --check; cargo clippy -- -D warnings; full cargo test without AGENT_BROWSER_NAMESPACE; serial auth E2E; representative ordinary form E2E. Reduction threshold: at most one auth-specific fill helper, no change to interaction::fill, no new polling budget, document listeners, state storage or dependency. Strength: new real-browser stale/focus regressions red at source PR, green with correction; guard and action-wiring mutants must die at intended behavioral assertions. Resilience: selection/focus/select/input detachment, redirection, script exception, timeout and immediate caller retry; record CDP disconnect/cancellation cleanup limitations honestly. Proof: built CLI hidden-first matrix plus replacement races, React 19.2 controlled form and ordinary fill.


DECISIONS
ts	phase	decision	why	evidence	result
2026-09-28T17:13:10.845Z	admission	Recreate the contributor patch on an upstream branch from current main with human coauthor credit	User explicitly requested recreation and blocker fix	PR1999 1b4cacd0; origin/main d01253d9	Own branch fix/1998-visible-auth-controls
2026-09-28T17:25:47.751895+00:00	shape	Use auth-only synchronous native edit with exact-node and focus checks	Eliminate page-level insertion gaps while retaining trusted input and leaving generic fill untouched	solution.md; primitive-results.json; primitive-extended-results.json; react-probe.json	No automatic retarget; reject stale fields and primitive failures


DIFF
diff --git a/cli/src/native/actions.rs b/cli/src/native/actions.rs
index 4ec9ae34..8979b450 100644
--- a/cli/src/native/actions.rs
+++ b/cli/src/native/actions.rs
@@ -63,6 +63,10 @@ const AUTH_LOGIN_SELECTOR_POLL_INTERVAL_MS: u64 = 100;
 /// fallback selectors are allowed.
 const AUTH_LOGIN_PREFERRED_SELECTOR_WINDOW_MS: u64 = 5_000;
 
+/// Local snapshot ref used to keep the auth element selected during detection
+/// bound to the exact DOM node used by the subsequent interaction.
+const AUTH_LOGIN_ELEMENT_REF: &str = "e1";
+
 const AUTH_LOGIN_NO_NAVIGATE_PAGE_ERROR: &str = "auth login --no-navigate requires an existing active HTTP(S) browser page; open the login page first";
 
 pub struct PendingConfirmation {
@@ -12222,7 +12226,76 @@ async fn handle_http_credentials(cmd: &Value, state: &mut DaemonState) -> Result
 // Auth handlers
 // ---------------------------------------------------------------------------
 
-/// Wait for any selector in `selectors` to appear and return the first match.
+struct AuthLoginElement {
+    ref_map: RefMap,
+}
+
+impl AuthLoginElement {
+    async fn fill(
+        &self,
+        client: &super::cdp::client::CdpClient,
+        session_id: &str,
+        value: &str,
+    ) -> Result<(), String> {
+        let (object_id, effective_session_id) = super::element::resolve_element_object_id(
+            client,
+            session_id,
+            &self.ref_map,
+            AUTH_LOGIN_ELEMENT_REF,
+            &HashMap::new(),
+        )
+        .await?;
+        let result = client
+            .send_command_typed::<_, super::cdp::types::EvaluateResult>(
+                "Runtime.callFunctionOn",
+                &super::cdp::types::CallFunctionOnParams {
+                    function_declaration: r#"function(value) {
+                        const editable = () => this.isConnected &&
+                            !this.matches(':disabled') && !this.readOnly;
+                        const focused = () => editable() &&
+                            this.ownerDocument.activeElement === this;
+                        if (!editable()) return false;
+                        this.focus();
+                        if (!focused()) return false;
+                        this.select();
+                        if (!focused()) return false;
+                        const inserted = this.ownerDocument.execCommand(
+                            value === '' ? 'delete' : 'insertText', false, value
+                        );
+                        return inserted && this.isConnected;
+                    }"#
+                    .to_string(),
+                    object_id: Some(object_id.clone()),
+                    arguments: Some(vec![super::cdp::types::CallArgument {
+                        value: Some(json!(value)),
+                        object_id: None,
+                    }]),
+                    return_by_value: Some(true),
+                    await_promise: Some(false),
+                },
+                Some(&effective_session_id),
+            )
+            .await;
+        let _ = client
+            .send_command(
+                "Runtime.releaseObject",
+                Some(json!({ "objectId": object_id })),
+                Some(&effective_session_id),
+            )
+            .await;
+        let result = result?;
+        if result.exception_details.is_some() || result.result.value != Some(json!(true)) {
+            return Err(
+                "Could not fill the selected login field; it may have changed or lost focus"
+                    .to_string(),
+            );
+        }
+        Ok(())
+    }
+}
+
+/// Wait for any selector in `selectors` to match a usable element and retain
+/// that element's stable backend node identity for the subsequent interaction.
 ///
 /// This is used by `auth_login` auto-detection so SPA login forms can render
 /// after initial navigation without requiring global network-idle.
@@ -12231,33 +12304,29 @@ async fn wait_for_any_selector(
     session_id: &str,
     selectors: &[&str],
     timeout_ms: u64,
-) -> Result<String, String> {
+) -> Result<AuthLoginElement, String> {
     let deadline = tokio::time::Instant::now() + tokio::time::Duration::from_millis(timeout_ms);
 
     loop {
         for selector in selectors {
             let expression = format!(
                 r#"(() => {{
-                    const el = document.querySelector({sel});
-                    if (!el) return false;
-
-                    const r = el.getBoundingClientRect();
-                    const s = window.getComputedStyle(el);
-                    const opacity = parseFloat(s.opacity || '1');
-                    const isVisible =
-                        r.width > 0 &&
-                        r.height > 0 &&
-                        s.visibility !== 'hidden' &&
-                        s.display !== 'none' &&
-                        (!Number.isFinite(opacity) || opacity > 0);
-
-                    if (!isVisible) return false;
-                    if (el.matches(':disabled')) return false;
-
-                    if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
-                    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.readOnly) return false;
-
-                    return true;
+                    return Array.from(document.querySelectorAll({sel})).find((el) => {{
+                        const r = el.getBoundingClientRect();
+                        const s = window.getComputedStyle(el);
+                        const opacity = parseFloat(s.opacity || '1');
+                        const isVisible =
+                            r.width > 0 &&
+                            r.height > 0 &&
+                            s.visibility !== 'hidden' &&
+                            s.display !== 'none' &&
+                            (!Number.isFinite(opacity) || opacity > 0);
+
+                        if (!isVisible || el.matches(':disabled')) return false;
+                        if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
+                        if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.readOnly) return false;
+                        return true;
+                    }}) || null;
                 }})()"#,
                 sel = serde_json::to_string(selector).unwrap_or_default()
             );
@@ -12267,22 +12336,48 @@ async fn wait_for_any_selector(
                     "Runtime.evaluate",
                     &super::cdp::types::EvaluateParams {
                         expression,
-                        return_by_value: Some(true),
+                        return_by_value: Some(false),
                         await_promise: Some(true),
                     },
                     Some(session_id),
                 )
                 .await?;
 
-            if result
-                .result
-                .value
-                .as_ref()
-                .and_then(|v| v.as_bool())
-                .unwrap_or(false)
+            if result.exception_details.is_some()
+                || result.result.subtype.as_deref() != Some("node")
             {
-                return Ok((*selector).to_string());
+                continue;
             }
+
+            let Some(object_id) = result.result.object_id else {
+                continue;
+            };
+            let describe = client
+                .send_command(
+                    "DOM.describeNode",
+                    Some(json!({ "objectId": object_id })),
+                    Some(session_id),
+                )
+                .await;
+            let _ = client
+                .send_command(
+                    "Runtime.releaseObject",
+                    Some(json!({ "objectId": object_id })),
+                    Some(session_id),
+                )
+                .await;
+            let Ok(describe) = describe else {
+                continue;
+            };
+            let Some(backend_node_id) = describe
+                .pointer("/node/backendNodeId")
+                .and_then(Value::as_i64)
+            else {
+                continue;
+            };
+            let mut ref_map = RefMap::new();
+            ref_map.add_exact_backend_node(AUTH_LOGIN_ELEMENT_REF.to_string(), backend_node_id);
+            return Ok(AuthLoginElement { ref_map });
         }
 
         if tokio::time::Instant::now() >= deadline {
@@ -12589,11 +12684,10 @@ async fn handle_auth_login(cmd: &Value, state: &mut DaemonState) -> Result<Value
         .or(stored_submit_selector);
 
     // Find and fill username
-    let user_sel = if let Some(s) = username_sel {
-        wait_for_selector(&mgr.client, &session_id, &s, "visible", auth_timeout_ms)
+    let user_element = if let Some(s) = username_sel {
+        wait_for_any_selector(&mgr.client, &session_id, &[s.as_str()], auth_timeout_ms)
             .await
-            .map_err(|_| format!("Timed out waiting for username selector '{}'", s))?;
-        s
+            .map_err(|_| format!("Timed out waiting for username selector '{}'", s))?
     } else {
         let preferred_window_ms = auth_timeout_ms.min(AUTH_LOGIN_PREFERRED_SELECTOR_WINDOW_MS);
         let fallback_window_ms = auth_timeout_ms.saturating_sub(preferred_window_ms);
@@ -12638,23 +12732,16 @@ async fn handle_auth_login(cmd: &Value, state: &mut DaemonState) -> Result<Value
     if let (Some(bound_page), Some(expected_origin)) = (&bound_page, &expected_origin) {
         validate_auth_login_active_page(mgr, bound_page, expected_origin).await?;
     }
-    interaction::fill(
-        &mgr.client,
-        &session_id,
-        &state.ref_map,
-        &user_sel,
-        &username,
-        &state.iframe_sessions,
-    )
-    .await?;
+    user_element
+        .fill(&mgr.client, &session_id, &username)
+        .await?;
 
     // Find and fill password
     let pass_sel = password_sel.unwrap_or_else(|| "input[type=password]".to_string());
-    wait_for_selector(
+    let pass_element = wait_for_any_selector(
         &mgr.client,
         &session_id,
-        &pass_sel,
-        "visible",
+        &[pass_sel.as_str()],
         auth_timeout_ms,
     )
     .await
@@ -12662,22 +12749,15 @@ async fn handle_auth_login(cmd: &Value, state: &mut DaemonState) -> Result<Value
     if let (Some(bound_page), Some(expected_origin)) = (&bound_page, &expected_origin) {
         validate_auth_login_active_page(mgr, bound_page, expected_origin).await?;
     }
-    interaction::fill(
-        &mgr.client,
-        &session_id,
-        &state.ref_map,
-        &pass_sel,
-        &password,
-        &state.iframe_sessions,
-    )
-    .await?;
+    pass_element
+        .fill(&mgr.client, &session_id, &password)
+        .await?;
 
     // Find and click submit
-    let sub_sel = if let Some(s) = submit_sel {
-        wait_for_selector(&mgr.client, &session_id, &s, "visible", auth_timeout_ms)
+    let submit_element = if let Some(s) = submit_sel {
+        wait_for_any_selector(&mgr.client, &session_id, &[s.as_str()], auth_timeout_ms)
             .await
-            .map_err(|_| format!("Timed out waiting for submit selector '{}'", s))?;
-        s
+            .map_err(|_| format!("Timed out waiting for submit selector '{}'", s))?
     } else {
         wait_for_any_selector(
             &mgr.client,
@@ -12699,8 +12779,8 @@ async fn handle_auth_login(cmd: &Value, state: &mut DaemonState) -> Result<Value
     let result = interaction::click(
         &mgr.client,
         &session_id,
-        &state.ref_map,
-        &sub_sel,
+        &submit_element.ref_map,
+        AUTH_LOGIN_ELEMENT_REF,
         "left",
         1,
         &state.iframe_sessions,
diff --git a/cli/src/native/e2e_tests.rs b/cli/src/native/e2e_tests.rs
index 4bee8b52..e64124c7 100644
--- a/cli/src/native/e2e_tests.rs
+++ b/cli/src/native/e2e_tests.rs
@@ -6038,6 +6038,89 @@ async fn start_stateful_auth_login_server(
     (base_url, document_requests, handle)
 }
 
+#[derive(Clone, Copy)]
+enum DuplicateAuthControl {
+    Username,
+    Password,
+    Submit,
+}
+
+/// Starts a login page with a hidden duplicate before one visible auth control.
+async fn start_duplicate_auth_login_server(
+    duplicate: DuplicateAuthControl,
+) -> (String, tokio::task::JoinHandle<()>) {
+    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
+    let port = listener.local_addr().unwrap().port();
+    let base_url = format!("http://127.0.0.1:{}", port);
+
+    let handle = tokio::spawn(async move {
+        for _ in 0..100 {
+            let Ok((mut stream, _)) = listener.accept().await else {
+                break;
+            };
+            tokio::spawn(async move {
+                let mut buf = vec![0u8; 8192];
+                let _ = stream.read(&mut buf).await;
+                let controls = match duplicate {
+                    DuplicateAuthControl::Username => {
+                        r#"
+      <div style="display:none">
+        <input id="hidden-user" type="email" autocomplete="username" />
+      </div>
+      <input id="visible-user" type="email" autocomplete="username webauthn" />
+      <input id="visible-pass" type="password" />
+      <button id="visible-submit" type="submit" onclick="window.__visibleClicked = true">Sign in</button>"#
+                    }
+                    DuplicateAuthControl::Password => {
+                        r#"
+      <input id="visible-user" type="email" autocomplete="username webauthn" />
+      <div style="display:none">
+        <input id="hidden-pass" type="password" />
+      </div>
+      <input id="visible-pass" type="password" />
+      <button id="visible-submit" type="submit" onclick="window.__visibleClicked = true">Sign in</button>"#
+                    }
+                    DuplicateAuthControl::Submit => {
+                        r#"
+      <input id="visible-user" type="email" autocomplete="username webauthn" />
+      <input id="visible-pass" type="password" />
+      <div style="display:none">
+        <button id="hidden-submit" type="submit" onclick="window.__hiddenClicked = true">Sign in</button>
+      </div>
+      <button id="visible-submit" type="submit" onclick="window.__visibleClicked = true">Sign in</button>"#
+                    }
+                };
+                let body = format!(
+                    r#"<!doctype html>
+<html>
+  <head><meta charset="utf-8"><title>Duplicate Login</title><link rel="icon" href="data:," /></head>
+  <body>
+    <form id="visible-login">
+      {controls}
+    </form>
+    <script>
+      document.getElementById('visible-login').addEventListener('submit', (event) => {{
+        event.preventDefault();
+        window.__submitted = true;
+      }});
+    </script>
+  </body>
+</html>"#,
+                );
+                let response = format!(
+                    "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
+                    body.len(),
+                    body,
+                );
+                let _ = stream.write_all(response.as_bytes()).await;
+                let _ = stream.flush().await;
+            });
+        }
+    });
+
+    (base_url, handle)
+}
+
 fn unique_auth_profile_name(suffix: &str) -> String {
     format!(
         "e2e-auth-login-{}-{}",
@@ -6049,6 +6132,151 @@ fn unique_auth_profile_name(suffix: &str) -> String {
     )
 }
 
+#[tokio::test]
+#[ignore]
+async fn e2e_auth_login_rejects_changed_credential_targets() {
+    let (base_url, _, server) = start_stateful_auth_login_server().await;
+    let mut state = DaemonState::new();
+    let profile = unique_auth_profile_name("changed-target");
+    assert_success(
+        &execute_command(
+            &json!({ "id": "launch", "action": "launch", "headless": true }),
+            &mut state,
+        )
+        .await,
+    );
+    assert_success(
+        &execute_command(
+            &json!({ "id": "open", "action": "navigate", "url": base_url }),
+            &mut state,
+        )
+        .await,
+    );
+    assert_success(
+        &execute_command(
+            &json!({
+                "id": "save", "action": "auth_save", "name": profile,
+                "url": base_url, "username": "target@example.test",
+                "password": "target-password"
+            }),
+            &mut state,
+        )
+        .await,
+    );
+    let mut results = Vec::new();
+    for field in ["user", "pass"] {
+        for phase in [
+            "selection",
+            "focus-detach",
+            "focus-redirect",
+            "select-redirect",
+            "focus-readonly",
+            "input-detach",
+            "exception",
+            "normal",
+        ] {
+            let script = format!(
+                r#"(() => {{
+                    document.body.innerHTML = '<form><input id="decoy" value="decoy:"><input id="user" type="email"><input id="pass" type="password"><button type="submit">Sign in</button></form>';
+                    window.events = [];
+                    window.submitted = false;
+                    const decoy = document.getElementById('decoy');
+                    const target = document.getElementById('{field}');
+                    const replace = () => {{
+                        window.detached = target;
+                        target.replaceWith(target.cloneNode(true));
+                        decoy.focus();
+                    }};
+                    window.detached = null;
+                    document.querySelector('form').onsubmit = event => {{
+                        event.preventDefault();
+                        window.submitted = true;
+                    }};
+                    document.oninput = event => window.events.push({{
+                        id: event.target.id, value: event.target.value,
+                        trusted: event.isTrusted
+                    }});
+                    decoy.focus();
+                    decoy.setSelectionRange(6, 6);
+                    if ('{phase}' === 'selection') {{
+                        const box = target.getBoundingClientRect.bind(target);
+                        target.getBoundingClientRect = () => {{
+                            const rect = box();
+                            queueMicrotask(replace);
+                            return rect;
+                        }};
+                    }}
+                    if ('{phase}' === 'focus-detach') target.onfocus = replace;
+                    if ('{phase}' === 'focus-redirect') target.onfocus = () => decoy.focus();
+                    if ('{phase}' === 'select-redirect') target.select = () => decoy.focus();
+                    if ('{phase}' === 'focus-readonly') target.onfocus = () => target.readOnly = true;
+                    if ('{phase}' === 'input-detach') target.oninput = replace;
+                    if ('{phase}' === 'exception') target.focus = () => {{ throw new Error('page failure'); }};
+                }})()"#
+            );
+            assert_success(
+                &execute_command(
+                    &json!({ "id": "fixture", "action": "evaluate", "script": script }),
+                    &mut state,
+                )
+                .await,
+            );
+            let login = execute_command(
+                &json!({
+                    "id": "login", "action": "auth_login", "name": profile,
+                    "noNavigate": true, "timeout": 200
+                }),
+                &mut state,
+            )
+            .await;
+            let observation = execute_command(
+                &json!({
+                    "id": "observe", "action": "evaluate",
+                    "script": "({ user: document.getElementById('user').value, pass: document.getElementById('pass').value, decoy: document.getElementById('decoy').value, events: window.events, submitted: window.submitted, detached: !!window.detached && !window.detached.isConnected })"
+                }),
+                &mut state,
+            )
+            .await;
+            results.push((field, phase, login, observation));
+        }
+    }
+    assert_success(
+        &execute_command(
+            &json!({ "id": "delete", "action": "auth_delete", "name": profile }),
+            &mut state,
+        )
+        .await,
+    );
+    assert_success(
+        &execute_command(&json!({ "id": "close", "action": "close" }), &mut state).await,
+    );
+    server.abort();
+    for (field, phase, login, observation) in results {
+        assert_success(&observation);
+        let observed = &get_data(&observation)["result"];
+        let normal = phase == "normal";
+        assert_eq!(observed["decoy"], "decoy:", "{field}/{phase}: {observed}");
+        assert_eq!(login["success"], normal, "{field}/{phase}: {login}");
+        assert_eq!(observed["submitted"], normal, "{field}/{phase}: {observed}");
+        if phase == "selection" || phase == "focus-detach" || phase == "input-detach" {
+            assert_eq!(observed["detached"], true, "{field}/{phase}: {observed}");
+        }
+        for event in observed["events"].as_array().unwrap() {
+            let expected = match event["id"].as_str().unwrap() {
+                "user" => "target@example.test",
+                "pass" => "target-password",
+                other => panic!("{field}/{phase}: input delivered to {other}: {event}"),
+            };
+            assert_eq!(event["value"], expected, "{field}/{phase}: {event}");
+            assert_eq!(event["trusted"], true, "{field}/{phase}: {event}");
+        }
+        if normal {
+            assert_eq!(observed["user"], "target@example.test");
+            assert_eq!(observed["pass"], "target-password");
+        }
+    }
+}
+
 #[tokio::test]
 #[ignore]
 async fn e2e_auth_login_no_navigate_preserves_active_page_state() {
@@ -6137,6 +6365,100 @@ async fn e2e_auth_login_no_navigate_preserves_active_page_state() {
     assert_success(&execute_command(&json!({ "id": "99", "action": "close" }), &mut state).await);
 }
 
+async fn assert_auth_login_uses_visible_duplicate(duplicate: DuplicateAuthControl, suffix: &str) {
+    let (base_url, _server) = start_duplicate_auth_login_server(duplicate).await;
+    let mut state = DaemonState::new();
+    let profile_name = unique_auth_profile_name(suffix);
+
+    assert_success(
+        &execute_command(
+            &json!({ "id": "1", "action": "launch", "headless": true }),
+            &mut state,
+        )
+        .await,
+    );
+    assert_success(
+        &execute_command(
+            &json!({ "id": "2", "action": "navigate", "url": format!("{}/login", base_url) }),
+            &mut state,
+        )
+        .await,
+    );
+    assert_success(
+        &execute_command(
+            &json!({
+                "id": "3",
+                "action": "auth_save",
+                "name": profile_name.clone(),
+                "url": format!("{}/login", base_url),
+                "username": "visible-user@example.com",
+                "password": "visible-password-secret",
+            }),
+            &mut state,
+        )
+        .await,
+    );
+
+    let login = execute_command(
+        &json!({
+            "id": "4",
+            "action": "auth_login",
+            "name": profile_name.clone(),
+            "noNavigate": true,
+            "timeout": 1_000,
+        }),
+        &mut state,
+    )
+    .await;
+    assert_success(&login);
+
+    let verify = execute_command(
+        &json!({
+            "id": "5",
+            "action": "evaluate",
+            "script": "({ hiddenUser: document.querySelector('#hidden-user')?.value ?? '', hiddenPass: document.querySelector('#hidden-pass')?.value ?? '', hiddenClicked: !!window.__hiddenClicked, visibleUser: document.querySelector('#visible-user').value, visiblePass: document.querySelector('#visible-pass').value, visibleClicked: !!window.__visibleClicked, submitted: !!window.__submitted })",
+        }),
+        &mut state,
+    )
+    .await;
+    assert_success(&verify);
+    let result = &get_data(&verify)["result"];
+    assert_eq!(result["hiddenUser"], "");
+    assert_eq!(result["hiddenPass"], "");
+    assert_eq!(result["hiddenClicked"], false);
+    assert_eq!(result["visibleUser"], "visible-user@example.com");
+    assert_eq!(result["visiblePass"], "visible-password-secret");
+    assert_eq!(result["visibleClicked"], true);
+    assert_eq!(result["submitted"], true);
+
+    let _ = execute_command(
+        &json!({ "id": "6", "action": "auth_delete", "name": profile_name }),
+        &mut state,
+    )
+    .await;
+    assert_success(&execute_command(&json!({ "id": "99", "action": "close" }), &mut state).await);
+}
+
+#[tokio::test]
+#[ignore]
+async fn e2e_auth_login_uses_visible_duplicate_username() {
+    assert_auth_login_uses_visible_duplicate(DuplicateAuthControl::Username, "visible-username")
+        .await;
+}
+
+#[tokio::test]
+#[ignore]
+async fn e2e_auth_login_uses_visible_duplicate_password() {
+    assert_auth_login_uses_visible_duplicate(DuplicateAuthControl::Password, "visible-password")
+        .await;
+}
+
+#[tokio::test]
+#[ignore]
+async fn e2e_auth_login_uses_visible_duplicate_submit() {
+    assert_auth_login_uses_visible_duplicate(DuplicateAuthControl::Submit, "visible-submit").await;
+}
+
 #[cfg(unix)]
 #[tokio::test]
 #[ignore]
diff --git a/cli/src/native/element.rs b/cli/src/native/element.rs
index a74035e6..82737cea 100644
--- a/cli/src/native/element.rs
+++ b/cli/src/native/element.rs
@@ -13,6 +13,7 @@ pub struct RefEntry {
     pub nth: Option<usize>,
     pub selector: Option<String>,
     pub frame_id: Option<String>,
+    allow_role_fallback: bool,
 }
 
 #[derive(Clone)]
@@ -67,6 +68,25 @@ impl RefMap {
                 nth,
                 selector: None,
                 frame_id: frame_id.map(|s| s.to_string()),
+                allow_role_fallback: true,
+            },
+        );
+    }
+
+    /// Add a ref that must keep resolving to this exact backend node. This is
+    /// used for actions that select a concrete DOM node before interacting;
+    /// falling back by role/name could silently target a different element.
+    pub fn add_exact_backend_node(&mut self, ref_id: String, backend_node_id: i64) {
+        self.map.insert(
+            ref_id,
+            RefEntry {
+                backend_node_id: Some(backend_node_id),
+                role: String::new(),
+                name: String::new(),
+                nth: None,
+                selector: None,
+                frame_id: None,
+                allow_role_fallback: false,
             },
         );
     }
@@ -88,6 +108,7 @@ impl RefMap {
                 nth,
                 selector: Some(selector),
                 frame_id: None,
+                allow_role_fallback: true,
             },
         );
     }
@@ -437,6 +458,9 @@ pub async fn resolve_element_center(
                 .await?;
                 return Ok((x, y, effective_session_id.to_string()));
             }
+            if !entry.allow_role_fallback {
+                return Err(format!("Element ref {ref_id} is stale"));
+            }
             // backend_node_id is stale; re-query the accessibility tree below
         }
 
@@ -678,6 +702,9 @@ pub async fn resolve_element_object_id(
                     return Ok((object_id, effective_session_id.to_string()));
                 }
             }
+            if !entry.allow_role_fallback {
+                return Err(format!("Element ref {ref_id} is stale"));
+            }
             // backend_node_id is stale; re-query the accessibility tree below
         }
 
