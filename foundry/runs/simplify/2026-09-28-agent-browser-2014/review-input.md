Perform a completed independent review, not acknowledgement. User requests an 80/20 test reduction for PR2014. Production is byte-identical. Review the frozen test-only change below. Previous PR731 additions (496tests,221production,14docs); current478 (243tests,221production,14docs). Preserved core contract: usable duplicate controls for both credentials and submit; never deliver a credential to another focused field after target replacement; do not submit after rejection; preserve input/textarea/contenteditable and absent execCommand behavior; release remote result/exception/node handles and retry selector discovery. Consolidation removes duplicate HTTPserver and3wrapper tests by adding hidden twins to each lifecycle row, reuses preexisting stateful HTTPserver. Two websocket mocks become one selection->fill workflow with4failure rows. Intentionally dropped malformed/non-node/false CDP mock rows: non-node/malformed represent same release owners already forced via exceptions/descriptor errors; real E2E guards false rejection. Assess whether this selection has a real lost invariant, falsepositive, oracleweakness, or unnecessary scaffolding. Do not expand scope or request exhaustive Cartesian testing. Give actionable blockers or LGTM with concise rationale. No tools: all required source and diff supplied.

Current unit regression:
    #[tokio::test]
    async fn test_auth_login_releases_remote_objects_after_failures() {
        use futures_util::{SinkExt, StreamExt};
        use tokio_tungstenite::tungstenite::Message;

        for failure in ["selection", "describe", "fill-exception", "fill-protocol"] {
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let url = format!("ws://{}", listener.local_addr().unwrap());
            let server = tokio::spawn(async move {
                let (stream, _) = listener.accept().await.unwrap();
                let mut ws = tokio_tungstenite::accept_async(stream).await.unwrap();
                let mut releases = Vec::new();
                let mut attempts = 0;
                while let Some(Ok(Message::Text(text))) = ws.next().await {
                    let request: Value = serde_json::from_str(&text).unwrap();
                    let mut response = json!({ "id": request["id"] });
                    response["result"] = match request["method"].as_str().unwrap() {
                        "Runtime.evaluate" => {
                            attempts += 1;
                            if failure == "selection" && attempts == 1 {
                                json!({
                                    "result": { "type": "object", "objectId": "rejected-result" },
                                    "exceptionDetails": { "text": "Invalid selector",
                                        "exception": { "type": "object", "objectId": "exception" } }
                                })
                            } else {
                                json!({ "result": { "type": "object", "subtype": "node",
                                    "objectId": format!("node-{attempts}") } })
                            }
                        }
                        "DOM.describeNode" if failure == "describe" && attempts == 1 => {
                            response["error"] =
                                json!({ "code": -32000, "message": "Node unavailable" });
                            Value::Null
                        }
                        "DOM.describeNode" => json!({ "node": { "backendNodeId": 42 } }),
                        "DOM.resolveNode" => {
                            json!({ "object": { "type": "object", "objectId": "login-node" } })
                        }
                        "Runtime.callFunctionOn" if failure == "fill-exception" => json!({
                            "result": { "type": "object", "objectId": "rejected-result" },
                            "exceptionDetails": { "text": "Page exception",
                                "exception": { "type": "object", "objectId": "exception" } }
                        }),
                        "Runtime.callFunctionOn" if failure == "fill-protocol" => {
                            response["error"] = json!({ "code": -32000, "message": "CDP failure" });
                            Value::Null
                        }
                        "Runtime.callFunctionOn" => {
                            json!({ "result": { "type": "boolean", "value": true } })
                        }
                        "Runtime.releaseObject" => {
                            releases
                                .push(request["params"]["objectId"].as_str().unwrap().to_string());
                            json!({})
                        }
                        other => panic!("Unexpected command: {other}"),
                    };
                    ws.send(Message::Text(response.to_string())).await.unwrap();
                }
                (attempts, releases)
            });
            let client = CdpClient::connect(&url).await.unwrap();
            let element = super::wait_for_any_selector(&client, "session", &["input"], 1_000)
                .await
                .unwrap();
            let filled = element.fill(&client, "session", "test-value").await;
            client.close().await;
            let (attempts, mut releases) = server.await.unwrap();
            assert_eq!(filled.is_ok(), !failure.starts_with("fill"), "{failure}");
            assert_eq!(attempts, if failure.starts_with("fill") { 1 } else { 2 });
            let mut expected = match failure {
                "selection" => vec!["exception", "rejected-result", "node-2", "login-node"],
                "describe" => vec!["node-1", "node-2", "login-node"],
                "fill-exception" => vec!["node-1", "rejected-result", "exception", "login-node"],
                _ => vec!["node-1", "login-node"],
            };
            releases.sort();
            expected.sort();
            assert_eq!(releases, expected, "{failure}");
        }
    }


Current browser regression:
#[tokio::test]
#[ignore]
async fn e2e_auth_login_selects_usable_controls_and_preserves_credential_targets() {
    let (base_url, _, server) = start_stateful_auth_login_server().await;
    let mut state = DaemonState::new();
    let profile = unique_auth_profile_name("changed-target");
    for command in [
        json!({ "id": "launch", "action": "launch", "headless": true }),
        json!({ "id": "open", "action": "navigate", "url": base_url }),
        json!({ "id": "save", "action": "auth_save", "name": profile,
            "url": base_url, "username": "target@example.test", "password": "target-password" }),
    ] {
        assert_success(&execute_command(&command, &mut state).await);
    }
    let mut results = Vec::new();
    for field in ["user", "pass"] {
        for phase in [
            "normal",
            "selection",
            "focus-detach",
            "focus-redirect",
            "select-redirect",
            "focus-readonly",
            "input-detach",
            "exception",
            "textarea",
            "contenteditable",
            "no-native-edit",
            "no-native-edit-textarea",
            "no-native-edit-contenteditable",
        ] {
            let script = format!(
                r#"(() => {{
                    document.body.innerHTML = '<form><input id="decoy" value="decoy:"><input id="hidden-user" type="email" autocomplete="username" hidden><input id="user" type="email" autocomplete="username webauthn"><input id="hidden-pass" type="password" hidden><input id="pass" type="password"><button hidden type="submit" onclick="window.hiddenClicked = true">Hidden</button><button type="submit">Sign in</button></form>';
                    if ('{phase}'.endsWith('textarea')) document.getElementById('{field}').outerHTML = '<textarea id="{field}">old value</textarea>';
                    if ('{phase}'.endsWith('contenteditable')) document.getElementById('{field}').outerHTML = '<div id="{field}" contenteditable="true">old value</div>';
                    window.events = [];
                    window.submitted = false;
                    window.hiddenClicked = false;
                    window.nativeEdit ??= document.execCommand;
                    document.execCommand = '{phase}'.startsWith('no-native-edit') ? undefined : window.nativeEdit;
                    const decoy = document.getElementById('decoy');
                    const target = document.getElementById('{field}');
                    const replace = () => {{
                        window.detached = target;
                        target.replaceWith(target.cloneNode(true));
                        decoy.focus();
                    }};
                    window.detached = null;
                    document.querySelector('form').onsubmit = event => {{
                        event.preventDefault();
                        window.submitted = true;
                    }};
                    document.oninput = event => window.events.push({{
                        id: event.target.id, value: event.target.value ?? event.target.textContent,
                        trusted: event.isTrusted
                    }});
                    decoy.focus();
                    decoy.setSelectionRange(6, 6);
                    if ('{phase}' === 'selection') {{
                        const box = target.getBoundingClientRect.bind(target);
                        target.getBoundingClientRect = () => {{
                            const rect = box();
                            queueMicrotask(replace);
                            return rect;
                        }};
                    }}
                    if ('{phase}' === 'focus-detach') target.onfocus = replace;
                    if ('{phase}' === 'focus-redirect') target.onfocus = () => decoy.focus();
                    if ('{phase}' === 'select-redirect') target.select = () => decoy.focus();
                    if ('{phase}' === 'focus-readonly') target.onfocus = () => target.readOnly = true;
                    if ('{phase}' === 'input-detach') target.oninput = replace;
                    if ('{phase}' === 'exception') target.focus = () => {{ throw new Error('page failure'); }};
                }})()"#
            );
            assert_success(
                &execute_command(
                    &json!({ "id": "fixture", "action": "evaluate", "script": script }),
                    &mut state,
                )
                .await,
            );
            let mut command = json!({
                "id": "login", "action": "auth_login", "name": profile,
                "noNavigate": true, "timeout": 200
            });
            if phase.ends_with("textarea") || phase.ends_with("contenteditable") {
                command["usernameSelector"] = json!("#user");
                command["passwordSelector"] = json!("#pass");
            }
            let login = execute_command(&command, &mut state).await;
            let observation = execute_command(
                &json!({
                    "id": "observe", "action": "evaluate",
                    "script": "({ user: document.getElementById('user').value ?? document.getElementById('user').textContent, pass: document.getElementById('pass').value ?? document.getElementById('pass').textContent, decoy: document.getElementById('decoy').value, events: window.events, hiddenUser: document.getElementById('hidden-user').value, hiddenPass: document.getElementById('hidden-pass').value, hiddenClicked: window.hiddenClicked, submitted: window.submitted, detached: !!window.detached && !window.detached.isConnected })"
                }),
                &mut state,
            )
            .await;
            results.push((field, phase, login, observation));
        }
    }
    for command in [
        json!({ "id": "delete", "action": "auth_delete", "name": profile }),
        json!({ "id": "close", "action": "close" }),
    ] {
        assert_success(&execute_command(&command, &mut state).await);
    }
    server.abort();
    for (field, phase, login, observation) in results {
        assert_success(&observation);
        let observed = &get_data(&observation)["result"];
        let normal = ["normal", "textarea", "contenteditable"].contains(&phase)
            || phase.starts_with("no-native-edit");
        assert_eq!(observed["decoy"], "decoy:", "{field}/{phase}: {observed}");
        assert_eq!(observed["hiddenUser"], "", "{field}/{phase}: {observed}");
        assert_eq!(observed["hiddenPass"], "", "{field}/{phase}: {observed}");
        assert_eq!(
            observed["hiddenClicked"], false,
            "{field}/{phase}: {observed}"
        );
        assert_eq!(login["success"], normal, "{field}/{phase}: {login}");
        assert_eq!(observed["submitted"], normal, "{field}/{phase}: {observed}");
        if phase == "selection" || phase == "focus-detach" || phase == "input-detach" {
            assert_eq!(observed["detached"], true, "{field}/{phase}: {observed}");
        }
        for event in observed["events"].as_array().unwrap() {
            let expected = match event["id"].as_str().unwrap() {
                "user" => "target@example.test",
                "pass" => "target-password",
                other => panic!("{field}/{phase}: input delivered to {other}: {event}"),
            };
            assert_eq!(event["value"], expected, "{field}/{phase}: {event}");
            assert_eq!(
                event["trusted"],
                !phase.starts_with("no-native-edit"),
                "{field}/{phase}: {event}"
            );
        }
        let expected_user = if normal || field == "pass" || phase == "input-detach" {
            "target@example.test"
        } else {
            ""
        };
        let expected_pass = if normal || (field == "pass" && phase == "input-detach") {
            "target-password"
        } else {
            ""
        };
        assert_eq!(
            observed["user"], expected_user,
            "{field}/{phase}: {observed}"
        );
        assert_eq!(
            observed["pass"], expected_pass,
            "{field}/{phase}: {observed}"
        );
    }
}

Test-only diff:
diff --git a/cli/src/native/actions.rs b/cli/src/native/actions.rs
index 6509c369..7ba21c89 100644
--- a/cli/src/native/actions.rs
+++ b/cli/src/native/actions.rs
@@ -13686,12 +13686,11 @@ fn attach_tab_gone_data(resp: &mut Value, state: &DaemonState) {
 #[cfg(test)]
 mod tests {
     #[tokio::test]
-    async fn test_auth_login_selection_releases_rejected_objects() {
+    async fn test_auth_login_releases_remote_objects_after_failures() {
         use futures_util::{SinkExt, StreamExt};
-        use serde_json::{json, Value};
         use tokio_tungstenite::tungstenite::Message;
 
-        for outcome in ["exception", "non-node", "describe-error", "missing-node-id"] {
+        for failure in ["selection", "describe", "fill-exception", "fill-protocol"] {
             let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
             let url = format!("ws://{}", listener.local_addr().unwrap());
             let server = tokio::spawn(async move {
@@ -13705,28 +13704,38 @@ mod tests {
                     response["result"] = match request["method"].as_str().unwrap() {
                         "Runtime.evaluate" => {
                             attempts += 1;
-                            let mut result = json!({
-                                "result": { "type": "object", "subtype": "node", "objectId": format!("node-{attempts}") }
-                            });
-                            if attempts == 1 && outcome == "exception" {
-                                result["result"]["subtype"] = json!("error");
-                                result["exceptionDetails"] = json!({
-                                    "text": "Invalid selector",
-                                    "exception": { "type": "object", "objectId": "exception" }
-                                });
-                            } else if attempts == 1 && outcome == "non-node" {
-                                result["result"]["subtype"] = json!("array");
+                            if failure == "selection" && attempts == 1 {
+                                json!({
+                                    "result": { "type": "object", "objectId": "rejected-result" },
+                                    "exceptionDetails": { "text": "Invalid selector",
+                                        "exception": { "type": "object", "objectId": "exception" } }
+                                })
+                            } else {
+                                json!({ "result": { "type": "object", "subtype": "node",
+                                    "objectId": format!("node-{attempts}") } })
                             }
-                            result
                         }
-                        "DOM.describeNode" if attempts == 1 => {
-                            if outcome == "describe-error" {
-                                response["error"] =
-                                    json!({ "code": -32000, "message": "Node unavailable" });
-                            }
-                            json!({ "node": {} })
+                        "DOM.describeNode" if failure == "describe" && attempts == 1 => {
+                            response["error"] =
+                                json!({ "code": -32000, "message": "Node unavailable" });
+                            Value::Null
                         }
                         "DOM.describeNode" => json!({ "node": { "backendNodeId": 42 } }),
+                        "DOM.resolveNode" => {
+                            json!({ "object": { "type": "object", "objectId": "login-node" } })
+                        }
+                        "Runtime.callFunctionOn" if failure == "fill-exception" => json!({
+                            "result": { "type": "object", "objectId": "rejected-result" },
+                            "exceptionDetails": { "text": "Page exception",
+                                "exception": { "type": "object", "objectId": "exception" } }
+                        }),
+                        "Runtime.callFunctionOn" if failure == "fill-protocol" => {
+                            response["error"] = json!({ "code": -32000, "message": "CDP failure" });
+                            Value::Null
+                        }
+                        "Runtime.callFunctionOn" => {
+                            json!({ "result": { "type": "boolean", "value": true } })
+                        }
                         "Runtime.releaseObject" => {
                             releases
                                 .push(request["params"]["objectId"].as_str().unwrap().to_string());
@@ -13738,95 +13747,24 @@ mod tests {
                 }
                 (attempts, releases)
             });
-            let client = super::super::cdp::client::CdpClient::connect(&url)
+            let client = CdpClient::connect(&url).await.unwrap();
+            let element = super::wait_for_any_selector(&client, "session", &["input"], 1_000)
                 .await
                 .unwrap();
-            let result = super::wait_for_any_selector(&client, "session", &["input"], 1_000).await;
+            let filled = element.fill(&client, "session", "test-value").await;
             client.close().await;
-            assert!(result.is_ok(), "{outcome}");
             let (attempts, mut releases) = server.await.unwrap();
-            assert_eq!(attempts, 2, "{outcome}");
-            releases.sort();
-            let expected = if outcome == "exception" {
-                vec!["exception", "node-1", "node-2"]
-            } else {
-                vec!["node-1", "node-2"]
+            assert_eq!(filled.is_ok(), !failure.starts_with("fill"), "{failure}");
+            assert_eq!(attempts, if failure.starts_with("fill") { 1 } else { 2 });
+            let mut expected = match failure {
+                "selection" => vec!["exception", "rejected-result", "node-2", "login-node"],
+                "describe" => vec!["node-1", "node-2", "login-node"],
+                "fill-exception" => vec!["node-1", "rejected-result", "exception", "login-node"],
+                _ => vec!["node-1", "login-node"],
             };
-            assert_eq!(releases, expected, "{outcome}");
-        }
-    }
-
-    #[tokio::test]
-    async fn test_auth_login_fill_releases_remote_object() {
-        use super::{AuthLoginElement, RefMap, AUTH_LOGIN_ELEMENT_REF};
-        use futures_util::{SinkExt, StreamExt};
-        use serde_json::{json, Value};
-        use tokio_tungstenite::tungstenite::Message;
-
-        for outcome in ["filled", "rejected", "exception", "protocol-error"] {
-            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
-            let url = format!("ws://{}", listener.local_addr().unwrap());
-            let server = tokio::spawn(async move {
-                let (stream, _) = listener.accept().await.unwrap();
-                let mut ws = tokio_tungstenite::accept_async(stream).await.unwrap();
-                let mut releases = Vec::new();
-                while let Some(Ok(Message::Text(text))) = ws.next().await {
-                    let request: Value = serde_json::from_str(&text).unwrap();
-                    let mut response = json!({ "id": request["id"] });
-                    response["result"] = match request["method"].as_str().unwrap() {
-                        "DOM.resolveNode" => {
-                            json!({ "object": { "type": "object", "objectId": "login-node" } })
-                        }
-                        "Runtime.callFunctionOn" => match outcome {
-                            "filled" => json!({ "result": { "type": "boolean", "value": true } }),
-                            "rejected" => {
-                                json!({ "result": { "type": "boolean", "value": false } })
-                            }
-                            "exception" => json!({
-                                "result": { "type": "object", "objectId": "call-result" },
-                                "exceptionDetails": {
-                                    "text": "forced script exception",
-                                    "exception": { "type": "object", "objectId": "call-exception" }
-                                }
-                            }),
-                            _ => {
-                                response["error"] =
-                                    json!({ "code": -32000, "message": "forced CDP failure" });
-                                Value::Null
-                            }
-                        },
-                        "Runtime.releaseObject" => {
-                            releases.push(request["params"]["objectId"].clone());
-                            json!({})
-                        }
-                        other => panic!("Unexpected command: {other}"),
-                    };
-                    ws.send(Message::Text(response.to_string())).await.unwrap();
-                }
-                releases
-            });
-            let client = super::super::cdp::client::CdpClient::connect(&url)
-                .await
-                .unwrap();
-            let mut ref_map = RefMap::new();
-            ref_map.add_exact_backend_node(AUTH_LOGIN_ELEMENT_REF.to_string(), 42);
-            let result = AuthLoginElement { ref_map }
-                .fill(&client, "session", "test-value")
-                .await;
-            client.close().await;
-            assert_eq!(result.is_ok(), outcome == "filled", "{outcome}: {result:?}");
-            let mut releases = server.await.unwrap();
-            releases.sort_by_key(|id| id.as_str().unwrap().to_string());
-            let expected = if outcome == "exception" {
-                vec![
-                    json!("call-exception"),
-                    json!("call-result"),
-                    json!("login-node"),
-                ]
-            } else {
-                vec![json!("login-node")]
-            };
-            assert_eq!(releases, expected, "{outcome}");
+            releases.sort();
+            expected.sort();
+            assert_eq!(releases, expected, "{failure}");
         }
     }
 
diff --git a/cli/src/native/e2e_tests.rs b/cli/src/native/e2e_tests.rs
index ca209013..6079f556 100644
--- a/cli/src/native/e2e_tests.rs
+++ b/cli/src/native/e2e_tests.rs
@@ -6038,89 +6038,6 @@ async fn start_stateful_auth_login_server(
     (base_url, document_requests, handle)
 }
 
-#[derive(Clone, Copy)]
-enum DuplicateAuthControl {
-    Username,
-    Password,
-    Submit,
-}
-
-/// Starts a login page with a hidden duplicate before one visible auth control.
-async fn start_duplicate_auth_login_server(
-    duplicate: DuplicateAuthControl,
-) -> (String, tokio::task::JoinHandle<()>) {
-    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
-    let port = listener.local_addr().unwrap().port();
-    let base_url = format!("http://127.0.0.1:{}", port);
-
-    let handle = tokio::spawn(async move {
-        for _ in 0..100 {
-            let Ok((mut stream, _)) = listener.accept().await else {
-                break;
-            };
-            tokio::spawn(async move {
-                let mut buf = vec![0u8; 8192];
-                let _ = stream.read(&mut buf).await;
-                let controls = match duplicate {
-                    DuplicateAuthControl::Username => {
-                        r#"
-      <div style="display:none">
-        <input id="hidden-user" type="email" autocomplete="username" />
-      </div>
-      <input id="visible-user" type="email" autocomplete="username webauthn" />
-      <input id="visible-pass" type="password" />
-      <button id="visible-submit" type="submit" onclick="window.__visibleClicked = true">Sign in</button>"#
-                    }
-                    DuplicateAuthControl::Password => {
-                        r#"
-      <input id="visible-user" type="email" autocomplete="username webauthn" />
-      <div style="display:none">
-        <input id="hidden-pass" type="password" />
-      </div>
-      <input id="visible-pass" type="password" />
-      <button id="visible-submit" type="submit" onclick="window.__visibleClicked = true">Sign in</button>"#
-                    }
-                    DuplicateAuthControl::Submit => {
-                        r#"
-      <input id="visible-user" type="email" autocomplete="username webauthn" />
-      <input id="visible-pass" type="password" />
-      <div style="display:none">
-        <button id="hidden-submit" type="submit" onclick="window.__hiddenClicked = true">Sign in</button>
-      </div>
-      <button id="visible-submit" type="submit" onclick="window.__visibleClicked = true">Sign in</button>"#
-                    }
-                };
-                let body = format!(
-                    r#"<!doctype html>
-<html>
-  <head><meta charset="utf-8"><title>Duplicate Login</title><link rel="icon" href="data:," /></head>
-  <body>
-    <form id="visible-login">
-      {controls}
-    </form>
-    <script>
-      document.getElementById('visible-login').addEventListener('submit', (event) => {{
-        event.preventDefault();
-        window.__submitted = true;
-      }});
-    </script>
-  </body>
-</html>"#,
-                );
-                let response = format!(
-                    "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
-                    body.len(),
-                    body,
-                );
-                let _ = stream.write_all(response.as_bytes()).await;
-                let _ = stream.flush().await;
-            });
-        }
-    });
-
-    (base_url, handle)
-}
-
 fn unique_auth_profile_name(suffix: &str) -> String {
     format!(
         "e2e-auth-login-{}-{}",
@@ -6134,38 +6051,22 @@ fn unique_auth_profile_name(suffix: &str) -> String {
 
 #[tokio::test]
 #[ignore]
-async fn e2e_auth_login_rejects_changed_credential_targets() {
+async fn e2e_auth_login_selects_usable_controls_and_preserves_credential_targets() {
     let (base_url, _, server) = start_stateful_auth_login_server().await;
     let mut state = DaemonState::new();
     let profile = unique_auth_profile_name("changed-target");
-    assert_success(
-        &execute_command(
-            &json!({ "id": "launch", "action": "launch", "headless": true }),
-            &mut state,
-        )
-        .await,
-    );
-    assert_success(
-        &execute_command(
-            &json!({ "id": "open", "action": "navigate", "url": base_url }),
-            &mut state,
-        )
-        .await,
-    );
-    assert_success(
-        &execute_command(
-            &json!({
-                "id": "save", "action": "auth_save", "name": profile,
-                "url": base_url, "username": "target@example.test",
-                "password": "target-password"
-            }),
-            &mut state,
-        )
-        .await,
-    );
+    for command in [
+        json!({ "id": "launch", "action": "launch", "headless": true }),
+        json!({ "id": "open", "action": "navigate", "url": base_url }),
+        json!({ "id": "save", "action": "auth_save", "name": profile,
+            "url": base_url, "username": "target@example.test", "password": "target-password" }),
+    ] {
+        assert_success(&execute_command(&command, &mut state).await);
+    }
     let mut results = Vec::new();
     for field in ["user", "pass"] {
         for phase in [
+            "normal",
             "selection",
             "focus-detach",
             "focus-redirect",
@@ -6173,7 +6074,6 @@ async fn e2e_auth_login_rejects_changed_credential_targets() {
             "focus-readonly",
             "input-detach",
             "exception",
-            "normal",
             "textarea",
             "contenteditable",
             "no-native-edit",
@@ -6182,11 +6082,12 @@ async fn e2e_auth_login_rejects_changed_credential_targets() {
         ] {
             let script = format!(
                 r#"(() => {{
-                    document.body.innerHTML = '<form><input id="decoy" value="decoy:"><input id="user" type="email"><input id="pass" type="password"><button type="submit">Sign in</button></form>';
+                    document.body.innerHTML = '<form><input id="decoy" value="decoy:"><input id="hidden-user" type="email" autocomplete="username" hidden><input id="user" type="email" autocomplete="username webauthn"><input id="hidden-pass" type="password" hidden><input id="pass" type="password"><button hidden type="submit" onclick="window.hiddenClicked = true">Hidden</button><button type="submit">Sign in</button></form>';
                     if ('{phase}'.endsWith('textarea')) document.getElementById('{field}').outerHTML = '<textarea id="{field}">old value</textarea>';
                     if ('{phase}'.endsWith('contenteditable')) document.getElementById('{field}').outerHTML = '<div id="{field}" contenteditable="true">old value</div>';
                     window.events = [];
                     window.submitted = false;
+                    window.hiddenClicked = false;
                     window.nativeEdit ??= document.execCommand;
                     document.execCommand = '{phase}'.startsWith('no-native-edit') ? undefined : window.nativeEdit;
                     const decoy = document.getElementById('decoy');
@@ -6242,7 +6143,7 @@ async fn e2e_auth_login_rejects_changed_credential_targets() {
             let observation = execute_command(
                 &json!({
                     "id": "observe", "action": "evaluate",
-                    "script": "({ user: document.getElementById('user').value ?? document.getElementById('user').textContent, pass: document.getElementById('pass').value ?? document.getElementById('pass').textContent, decoy: document.getElementById('decoy').value, events: window.events, submitted: window.submitted, detached: !!window.detached && !window.detached.isConnected })"
+                    "script": "({ user: document.getElementById('user').value ?? document.getElementById('user').textContent, pass: document.getElementById('pass').value ?? document.getElementById('pass').textContent, decoy: document.getElementById('decoy').value, events: window.events, hiddenUser: document.getElementById('hidden-user').value, hiddenPass: document.getElementById('hidden-pass').value, hiddenClicked: window.hiddenClicked, submitted: window.submitted, detached: !!window.detached && !window.detached.isConnected })"
                 }),
                 &mut state,
             )
@@ -6250,16 +6151,12 @@ async fn e2e_auth_login_rejects_changed_credential_targets() {
             results.push((field, phase, login, observation));
         }
     }
-    assert_success(
-        &execute_command(
-            &json!({ "id": "delete", "action": "auth_delete", "name": profile }),
-            &mut state,
-        )
-        .await,
-    );
-    assert_success(
-        &execute_command(&json!({ "id": "close", "action": "close" }), &mut state).await,
-    );
+    for command in [
+        json!({ "id": "delete", "action": "auth_delete", "name": profile }),
+        json!({ "id": "close", "action": "close" }),
+    ] {
+        assert_success(&execute_command(&command, &mut state).await);
+    }
     server.abort();
     for (field, phase, login, observation) in results {
         assert_success(&observation);
@@ -6267,6 +6164,12 @@ async fn e2e_auth_login_rejects_changed_credential_targets() {
         let normal = ["normal", "textarea", "contenteditable"].contains(&phase)
             || phase.starts_with("no-native-edit");
         assert_eq!(observed["decoy"], "decoy:", "{field}/{phase}: {observed}");
+        assert_eq!(observed["hiddenUser"], "", "{field}/{phase}: {observed}");
+        assert_eq!(observed["hiddenPass"], "", "{field}/{phase}: {observed}");
+        assert_eq!(
+            observed["hiddenClicked"], false,
+            "{field}/{phase}: {observed}"
+        );
         assert_eq!(login["success"], normal, "{field}/{phase}: {login}");
         assert_eq!(observed["submitted"], normal, "{field}/{phase}: {observed}");
         if phase == "selection" || phase == "focus-detach" || phase == "input-detach" {
@@ -6394,100 +6297,6 @@ async fn e2e_auth_login_no_navigate_preserves_active_page_state() {
     assert_success(&execute_command(&json!({ "id": "99", "action": "close" }), &mut state).await);
 }
 
-async fn assert_auth_login_uses_visible_duplicate(duplicate: DuplicateAuthControl, suffix: &str) {
-    let (base_url, _server) = start_duplicate_auth_login_server(duplicate).await;
-    let mut state = DaemonState::new();
-    let profile_name = unique_auth_profile_name(suffix);
-
-    assert_success(
-        &execute_command(
-            &json!({ "id": "1", "action": "launch", "headless": true }),
-            &mut state,
-        )
-        .await,
-    );
-    assert_success(
-        &execute_command(
-            &json!({ "id": "2", "action": "navigate", "url": format!("{}/login", base_url) }),
-            &mut state,
-        )
-        .await,
-    );
-    assert_success(
-        &execute_command(
-            &json!({
-                "id": "3",
-                "action": "auth_save",
-                "name": profile_name.clone(),
-                "url": format!("{}/login", base_url),
-                "username": "visible-user@example.com",
-                "password": "visible-password-secret",
-            }),
-            &mut state,
-        )
-        .await,
-    );
-
-    let login = execute_command(
-        &json!({
-            "id": "4",
-            "action": "auth_login",
-            "name": profile_name.clone(),
-            "noNavigate": true,
-            "timeout": 1_000,
-        }),
-        &mut state,
-    )
-    .await;
-    assert_success(&login);
-
-    let verify = execute_command(
-        &json!({
-            "id": "5",
-            "action": "evaluate",
-            "script": "({ hiddenUser: document.querySelector('#hidden-user')?.value ?? '', hiddenPass: document.querySelector('#hidden-pass')?.value ?? '', hiddenClicked: !!window.__hiddenClicked, visibleUser: document.querySelector('#visible-user').value, visiblePass: document.querySelector('#visible-pass').value, visibleClicked: !!window.__visibleClicked, submitted: !!window.__submitted })",
-        }),
-        &mut state,
-    )
-    .await;
-    assert_success(&verify);
-    let result = &get_data(&verify)["result"];
-    assert_eq!(result["hiddenUser"], "");
-    assert_eq!(result["hiddenPass"], "");
-    assert_eq!(result["hiddenClicked"], false);
-    assert_eq!(result["visibleUser"], "visible-user@example.com");
-    assert_eq!(result["visiblePass"], "visible-password-secret");
-    assert_eq!(result["visibleClicked"], true);
-    assert_eq!(result["submitted"], true);
-
-    let _ = execute_command(
-        &json!({ "id": "6", "action": "auth_delete", "name": profile_name }),
-        &mut state,
-    )
-    .await;
-    assert_success(&execute_command(&json!({ "id": "99", "action": "close" }), &mut state).await);
-}
-
-#[tokio::test]
-#[ignore]
-async fn e2e_auth_login_uses_visible_duplicate_username() {
-    assert_auth_login_uses_visible_duplicate(DuplicateAuthControl::Username, "visible-username")
-        .await;
-}
-
-#[tokio::test]
-#[ignore]
-async fn e2e_auth_login_uses_visible_duplicate_password() {
-    assert_auth_login_uses_visible_duplicate(DuplicateAuthControl::Password, "visible-password")
-        .await;
-}
-
-#[tokio::test]
-#[ignore]
-async fn e2e_auth_login_uses_visible_duplicate_submit() {
-    assert_auth_login_uses_visible_duplicate(DuplicateAuthControl::Submit, "visible-submit").await;
-}
-
 #[cfg(unix)]
 #[tokio::test]
 #[ignore]
