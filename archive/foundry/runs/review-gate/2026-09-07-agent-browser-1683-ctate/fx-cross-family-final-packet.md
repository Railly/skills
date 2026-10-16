Read-only cross-family final follow-up. NO TOOLS. You are reviewing a frozen packet extracted with git show/diff from clean HEAD 5b2b1cc6b0b03b584799fe89d0a61f46df5d1355, base 8a346a2cfc0afa5dc259b02b896355ac476fa6e2, original PR e2607d6a511cb7757a4d3e412e4284d9971f5133, integrated main 219c47a9dab1776f320d11e66ce934fd239b2cb7. The orchestrator verified this identity; you should label packet-based limits, not claim running commands. No other agent's worktree is in this packet. Do not invoke skills or tools. Return a concise final assessment (up to 1200 words), with concrete remaining defects, locations, triggers, and limitations. Do not repeat speculative findings without identifying an actual reachable wrong behavior.

Contract: Downloads must configure only their isolated BrowserContext. Failed requests cannot newly commit sticky isolation. A compatible successful isolated connection persists intent across flag omission/reconnect. Previously persisted sessions retain continuity after errors. Explicit close resets isolation (baseline). Separate CLI launch and action envelopes are not an atomic transaction. New unpersisted contexts on failed requests must roll back, including when replacing a dead browser. Existing persisted contexts must not be torn down for ordinary action errors after reconnect. BrowserContexts partition cooperative sessions, not global CDP authorities. No crash-atomicity guarantee is added.

Your prior packet review raised teardown, latched context_recreated, and absent-binding-snapshot findings. Those were reproduced with real Chrome and fixed in 5b2b1cc. The final incremental diff consolidates rollback after the final drain, checks actual unpersisted context ownership rather than historical recreation, and rejects a commit whose new context still lacks a durable target binding. Please independently assess whether these changes close the actual holes without weakening rollback or prior-state semantics. Check the whole original fix too. Explicitly assess late-drain commit ordering.

Evidence from real runs (do not claim you executed them): original 1256-test suite, 5 isolation e2e and 3 compiled CLI tests (10 stress rounds) all passed. The behavioral tests marked #[ignore] are intentionally run using --ignored; this is repository convention for Chrome. Current 5 e2e passed with new continuity assertions. The new helper-level target-disappearance test passed, for fresh and previously persisted contexts; it closes a target through real Chrome and drains actual events. It exercises the commit helper, not a forced race across the entire command. Four current-tree mutations independently went red: eager sticky assignment (state equality), early binding (unexpected durable file), missing sticky commit (false state), missing download context (isolated download canceled). Full final rerun is running separately.

Earlier packet limitations resolved with extra excerpts: DaemonState::new reads persisted browser_context_id; main attaches isolateContext on primary, CDP/auto-prelaunch, and batch commands; inject_lifecycle deliberately returns for failed responses, so error envelopes never promised lifecycle fields. The other setDownloadBehavior is in BrowserManager::launch for owned Chrome only. Real compiled CLI checks assert download payloads and destination settings in default/A/B including simultaneous A/B; no observed event crossover, but this is not exhaustive scheduling proof. No Windows/Linux, real auto-discovery, abrupt death or transport loss during cleanup/final-drain fault injection. Preserve those as evidence limits.

COMPLETE FIX DIFF:
diff --git a/cli/src/connection.rs b/cli/src/connection.rs
index bf46d15..ca78c7f 100644
--- a/cli/src/connection.rs
+++ b/cli/src/connection.rs
@@ -464,7 +464,6 @@ pub struct DaemonOptions<'a> {
     pub engine: Option<&'a str>,
     pub auto_connect: bool,
     pub pin_tab: bool,
-    pub isolate_context: bool,
     pub idle_timeout: Option<&'a str>,
     pub default_timeout: Option<u64>,
     pub cdp: Option<&'a str>,
@@ -573,9 +572,6 @@ fn apply_daemon_env(cmd: &mut Command, session: &str, opts: &DaemonOptions) {
     if opts.pin_tab {
         cmd.env("AGENT_BROWSER_PIN_TAB", "1");
     }
-    if opts.isolate_context {
-        cmd.env("AGENT_BROWSER_ISOLATE_CONTEXT", "1");
-    }
     if let Some(idle) = opts.idle_timeout {
         cmd.env("AGENT_BROWSER_IDLE_TIMEOUT_MS", idle);
     }
@@ -1280,7 +1276,6 @@ mod tests {
             engine: None,
             auto_connect: false,
             pin_tab: false,
-            isolate_context: false,
             idle_timeout,
             default_timeout: None,
             cdp: None,
diff --git a/cli/src/doctor/launch.rs b/cli/src/doctor/launch.rs
index f63971c..677e3ba 100644
--- a/cli/src/doctor/launch.rs
+++ b/cli/src/doctor/launch.rs
@@ -83,7 +83,6 @@ pub(super) fn check(checks: &mut Vec<Check>, opts: &DoctorOptions) {
         engine: None,
         auto_connect: false,
         pin_tab: false,
-        isolate_context: false,
         idle_timeout: None,
         default_timeout: None,
         cdp: None,
diff --git a/cli/src/doctor/webgpu.rs b/cli/src/doctor/webgpu.rs
index 8e1d467..e618571 100644
--- a/cli/src/doctor/webgpu.rs
+++ b/cli/src/doctor/webgpu.rs
@@ -198,7 +198,6 @@ pub(super) fn check(checks: &mut Vec<Check>, opts: &DoctorOptions) {
         init_scripts: &[],
         enable: &[],
         pin_tab: false,
-        isolate_context: false,
         args: None,
         user_agent: None,
         proxy: None,
diff --git a/cli/src/main.rs b/cli/src/main.rs
index 23df0e6..39f5c79 100644
--- a/cli/src/main.rs
+++ b/cli/src/main.rs
@@ -1722,7 +1722,6 @@ fn main() {
         engine: flags.engine.as_deref(),
         auto_connect: flags.auto_connect,
         pin_tab: flags.pin_tab,
-        isolate_context: flags.isolate_context,
         idle_timeout: flags.idle_timeout.as_deref(),
         default_timeout: flags.default_timeout,
         cdp: flags.cdp.as_deref(),
diff --git a/cli/src/native/actions.rs b/cli/src/native/actions.rs
index 52a1cbc..306f89e 100644
--- a/cli/src/native/actions.rs
+++ b/cli/src/native/actions.rs
@@ -2398,7 +2398,7 @@ async fn close_after_network_control_failure(
     state: &mut DaemonState,
     error: String,
 ) -> Result<(), String> {
-    let close_error = close_current_browser(state).await.err();
+    let close_error = rollback_failed_launch(state).await.err();
     Err(match close_error {
         Some(close_error) => format!(
             "Failed to install browser network controls: {} (also failed to close browser: {})",
@@ -2634,19 +2634,17 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
         }
         _ => {}
     }
-    if cmd.get("isolateContext").and_then(Value::as_bool) == Some(true) {
-        if action != "launch"
-            && state
-                .browser
-                .as_ref()
-                .is_some_and(|manager| !manager.is_isolated())
-        {
-            return error_response(
-                &id,
-                "--isolate-context requires reconnecting with --cdp, --auto-connect, or connect <port|url>",
-            );
-        }
-        state.isolate_context = true;
+    if cmd.get("isolateContext").and_then(Value::as_bool) == Some(true)
+        && action != "launch"
+        && state
+            .browser
+            .as_ref()
+            .is_some_and(|manager| !manager.is_isolated())
+    {
+        return error_response(
+            &id,
+            "--isolate-context requires reconnecting with --cdp, --auto-connect, or connect <port|url>",
+        );
     }
 
     let skip_launch = skip_launch_action(action);
@@ -2754,7 +2752,14 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
                 let _ = auto_save_restore_state(state).await;
                 let _ = close_current_browser(state).await;
             }
-            if let Err(e) = auto_launch(state, plugins_from_command_or_env(cmd)).await {
+            if let Err(e) = auto_launch(
+                state,
+                plugins_from_command_or_env(cmd),
+                state.isolate_context
+                    || cmd.get("isolateContext").and_then(Value::as_bool) == Some(true),
+            )
+            .await
+            {
                 let context = auto_launch_error_context(env::var("AGENT_BROWSER_CDP").is_ok());
                 return error_response(&id, &format!("{}: {}", context, e));
             }
@@ -3018,6 +3023,11 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
         _ => Err(format!("Not yet implemented: {}", action)),
     };
 
+    let isolated_launch = (lifecycle_launched || action == "launch")
+        && state
+            .browser
+            .as_ref()
+            .is_some_and(BrowserManager::is_isolated);
     if result.is_ok() && should_validate_restore_after_action(action) {
         validate_restore_if_pending(state).await;
     }
@@ -3032,7 +3042,7 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
     // Persist the session-to-tab binding (write-on-change) so a fresh daemon
     // re-attaches to this session's tab instead of adopting the browser's
     // most recently active one.
-    let persist_error = if !skip_launch {
+    let persist_error = if !skip_launch && !isolated_launch {
         maybe_persist_tab_binding(state)
     } else {
         None
@@ -3082,6 +3092,20 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
             lifecycle_relaunched_browser,
         );
     }
+    if isolated_launch {
+        if resp.get("success").and_then(Value::as_bool) == Some(true) {
+            if let Err(error) = commit_isolated_connection(state).await {
+                resp = error_response(&id, &error);
+            }
+        } else if state
+            .browser
+            .as_ref()
+            .is_some_and(BrowserManager::has_unpersisted_isolated_context)
+            || !state.isolate_context
+        {
+            let _ = rollback_failed_launch(state).await;
+        }
+    }
     state.context_recreated = false;
     attach_webmcp_availability(&mut resp, action, state).await;
 
@@ -3192,6 +3216,10 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
         state.pin_tab = true;
     }
     let pin = state.pin_tab;
+    let isolated = state
+        .browser
+        .as_ref()
+        .is_some_and(BrowserManager::is_isolated);
     if state.browser.is_none() {
         return Ok(false);
     }
@@ -3201,7 +3229,13 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
     }
     let established = match binding {
         Some(b) => {
-            let restored = if state.context_recreated {
+            let context_changed = isolated
+                && b.browser_context_id.as_deref()
+                    != state
+                        .browser
+                        .as_ref()
+                        .and_then(BrowserManager::isolated_context_id);
+            let restored = if state.context_recreated || context_changed {
                 false
             } else {
                 state
@@ -3220,7 +3254,7 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
                     mgr.revive_and_enable_active().await?;
                 }
             }
-            if restored || pin || state.isolate_context {
+            if restored || pin || isolated {
                 // Restored, or entered the tab_gone state (the stale binding
                 // file is intentionally kept so the state is re-derived if
                 // the daemon restarts again before the agent re-binds).
@@ -3234,7 +3268,7 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
             }
         }
         None => {
-            if pin && !state.isolate_context {
+            if pin && !isolated {
                 // A pinned session never implicitly adopts an existing tab:
                 // start it on a fresh one.
                 if let Some(ref mut mgr) = state.browser {
@@ -3242,15 +3276,15 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
                 }
                 true
             } else {
-                state.isolate_context
+                isolated
             }
         }
     };
-    if established {
+    if established && !isolated {
         if let Some(err) = maybe_persist_tab_binding(state) {
             // Strict pinning is only as durable as the binding file: fail
             // the attach instead of pretending the pin is in place.
-            if state.pin_tab || state.isolate_context {
+            if state.pin_tab {
                 return Err(format!(
                     "cannot persist the session isolation binding: {}. \
                      --pin-tab and --isolate-context require a writable socket directory",
@@ -3262,6 +3296,31 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
     Ok(established)
 }
 
+async fn commit_isolated_connection(state: &mut DaemonState) -> Result<(), String> {
+    if state
+        .browser
+        .as_ref()
+        .is_some_and(BrowserManager::is_isolated)
+    {
+        let persist_error = maybe_persist_tab_binding(state).or_else(|| {
+            state
+                .browser
+                .as_ref()
+                .is_some_and(BrowserManager::has_unpersisted_isolated_context)
+                .then(|| "isolated context has no persistable target".to_string())
+        });
+        if let Some(error) = persist_error {
+            let _ = rollback_failed_launch(state).await;
+            return Err(format!(
+                "cannot persist the session isolation binding: {}",
+                error
+            ));
+        }
+        state.isolate_context = true;
+    }
+    Ok(())
+}
+
 fn persisted_browser_context_id(state: &DaemonState) -> Result<Option<String>, String> {
     tab_binding::ensure_writable(&state.session_id)?;
     let binding = tab_binding::load(&state.session_id)?;
@@ -3271,8 +3330,9 @@ fn persisted_browser_context_id(state: &DaemonState) -> Result<Option<String>, S
 async fn connect_external_cdp(
     state: &DaemonState,
     endpoint: &str,
+    isolate_context: bool,
 ) -> Result<BrowserManager, String> {
-    if state.isolate_context {
+    if isolate_context {
         let context_id = persisted_browser_context_id(state)?;
         BrowserManager::connect_cdp_isolated(endpoint, context_id.as_deref()).await
     } else {
@@ -3280,8 +3340,11 @@ async fn connect_external_cdp(
     }
 }
 
-async fn connect_external_auto(state: &DaemonState) -> Result<BrowserManager, String> {
-    if state.isolate_context {
+async fn connect_external_auto(
+    state: &DaemonState,
+    isolate_context: bool,
+) -> Result<BrowserManager, String> {
+    if isolate_context {
         let context_id = persisted_browser_context_id(state)?;
         BrowserManager::connect_auto_isolated(context_id.as_deref()).await
     } else {
@@ -3880,8 +3943,9 @@ async fn apply_session_setup(state: &mut DaemonState, session_id: &str) -> Resul
 async fn auto_launch(
     state: &mut DaemonState,
     plugins: Vec<crate::plugins::PluginConfig>,
+    isolate_context: bool,
 ) -> Result<(), String> {
-    if state.isolate_context
+    if isolate_context
         && env::var("AGENT_BROWSER_CDP").is_err()
         && env::var("AGENT_BROWSER_AUTO_CONNECT").is_err()
     {
@@ -3944,7 +4008,7 @@ async fn auto_launch(
             restore_key: restore_key.as_deref(),
             storage_state,
         })?;
-        let mgr = connect_external_cdp(state, &cdp).await?;
+        let mgr = connect_external_cdp(state, &cdp, isolate_context).await?;
         let hash = launch_hash(
             &options,
             &allowed_domains,
@@ -3993,7 +4057,7 @@ async fn auto_launch(
             None,
         );
         state.reset_input_state();
-        state.browser = Some(connect_external_auto(state).await?);
+        state.browser = Some(connect_external_auto(state, isolate_context).await?);
         if !apply_tab_binding_on_attach_or_rollback(state).await? {
             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
                 let _ = rollback_failed_launch(state).await;
@@ -4686,6 +4750,8 @@ async fn try_load_storage_state(state: &mut DaemonState, path: &Option<String>)
 // ---------------------------------------------------------------------------
 
 async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
+    let isolate_context =
+        state.isolate_context || cmd.get("isolateContext").and_then(Value::as_bool) == Some(true);
     let effective_ca_cert = resolve_effective_ca_cert(cmd, state)?;
     // Absent field falls back to the daemon's spawn-time env (mirrors
     // hideScrollbars/webgpu), keeping the launch hash stable when follow-up
@@ -4701,7 +4767,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
         .and_then(|v| v.as_bool())
         .unwrap_or(false);
     let provider_name = cmd.get("provider").and_then(|v| v.as_str());
-    if state.isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
+    if isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
         return Err(
             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
         );
@@ -4895,7 +4961,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
         let was_external = mgr.is_cdp_connection();
         let hash_changed = state.launch_hash != Some(new_hash);
         let storage_state_requires_clean_launch = storage_state_owned.is_some() && !is_external;
-        let isolation_changed = is_external && state.isolate_context != mgr.is_isolated();
+        let isolation_changed = is_external && isolate_context != mgr.is_isolated();
         is_external != was_external
             || hash_changed
             || isolation_changed
@@ -4951,7 +5017,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
 
     if let Some(url) = cdp_url {
         state.reset_input_state();
-        state.browser = Some(connect_external_cdp(state, url).await?);
+        state.browser = Some(connect_external_cdp(state, url, isolate_context).await?);
         state.launch_hash = Some(new_hash);
         state.subscribe_to_browser_events();
         state.start_fetch_handler();
@@ -4968,7 +5034,8 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
 
     if let Some(port) = cdp_port {
         state.reset_input_state();
-        state.browser = Some(connect_external_cdp(state, &port.to_string()).await?);
+        state.browser =
+            Some(connect_external_cdp(state, &port.to_string(), isolate_context).await?);
         state.launch_hash = Some(new_hash);
         state.subscribe_to_browser_events();
         state.start_fetch_handler();
@@ -4985,7 +5052,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
 
     if auto_connect {
         state.reset_input_state();
-        state.browser = Some(connect_external_auto(state).await?);
+        state.browser = Some(connect_external_auto(state, isolate_context).await?);
         if !apply_tab_binding_on_attach_or_rollback(state).await? {
             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
                 let _ = rollback_failed_launch(state).await;
@@ -14176,6 +14243,148 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         assert_eq!(resp["data"]["url"], "https://example.com");
     }
 
+    #[tokio::test]
+    #[ignore]
+    async fn test_isolation_commit_requires_a_durable_context_without_a_target() {
+        let guard = EnvGuard::new(&[
+            "AGENT_BROWSER_SOCKET_DIR",
+            "XDG_RUNTIME_DIR",
+            "AGENT_BROWSER_SESSION",
+            "AGENT_BROWSER_ISOLATE_CONTEXT",
+        ]);
+        let dir = tempfile::tempdir().unwrap();
+        guard.set("AGENT_BROWSER_SOCKET_DIR", dir.path().to_str().unwrap());
+        guard.remove("XDG_RUNTIME_DIR");
+        guard.set("AGENT_BROWSER_SESSION", "isolation-missing-target");
+        guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
+        let mut host = BrowserManager::launch(LaunchOptions::default(), None)
+            .await
+            .unwrap();
+        for persisted in [false, true] {
+            let mut state = DaemonState::new();
+            let manager = BrowserManager::connect_cdp_isolated(host.get_cdp_url(), None)
+                .await
+                .unwrap();
+            let (target, _) = manager.binding_snapshot().unwrap();
+            state.browser = Some(manager);
+            state.subscribe_to_browser_events();
+            if persisted {
+                commit_isolated_connection(&mut state).await.unwrap();
+            }
+            host.client
+                .send_command(
+                    "Target.closeTarget",
+                    Some(json!({"targetId": target})),
+                    None,
+                )
+                .await
+                .unwrap();
+            tokio::time::timeout(std::time::Duration::from_secs(5), async {
+                loop {
+                    state.drain_cdp_events_background().await.unwrap();
+                    if state.browser.as_ref().unwrap().binding_snapshot().is_none() {
+                        break;
+                    }
+                    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
+                }
+            })
+            .await
+            .unwrap();
+            let result = commit_isolated_connection(&mut state).await;
+            if persisted {
+                assert!(result.is_ok(), "{result:?}");
+                assert!(state.isolate_context);
+                assert!(state.browser.is_some());
+                assert!(DaemonState::new().isolate_context);
+                close_current_browser(&mut state).await.unwrap();
+            } else {
+                assert!(result.is_err(), "{result:?}");
+                assert!(!state.isolate_context);
+                assert!(state.browser.is_none());
+                assert!(tab_binding::load(&state.session_id).unwrap().is_none());
+                let contexts = host
+                    .client
+                    .send_command_no_params("Target.getBrowserContexts", None)
+                    .await
+                    .unwrap();
+                assert!(contexts["browserContextIds"].as_array().unwrap().is_empty());
+            }
+        }
+        host.close().await.unwrap();
+    }
+
+    #[tokio::test]
+    async fn test_isolation_invalid_launch_does_not_change_sticky_state() {
+        let guard = EnvGuard::new(&["AGENT_BROWSER_ISOLATE_CONTEXT"]);
+        guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
+        for prior in [false, true] {
+            for cmd in [
+                json!({"id": "invalid", "action": "launch", "isolateContext": true}),
+                json!({"id": "invalid", "action": "launch", "isolateContext": true, "provider": "ios"}),
+                json!({"id": "invalid", "action": "launch", "isolateContext": true, "cdpUrl": "invalid://endpoint"}),
+                json!({"id": "invalid", "action": "navigate", "isolateContext": true, "url": "about:blank"}),
+            ] {
+                let mut state = DaemonState::new();
+                state.isolate_context = prior;
+                let response = execute_command(&cmd, &mut state).await;
+                assert_eq!(response["success"], false, "{response}");
+                assert_eq!(state.isolate_context, prior, "{cmd}: {response}");
+                assert!(state.browser.is_none());
+                let response =
+                    execute_command(&json!({"id": "next", "action": "session_info"}), &mut state)
+                        .await;
+                assert_eq!(response["success"], true, "{response}");
+                assert_eq!(state.isolate_context, prior);
+            }
+        }
+    }
+
+    #[tokio::test]
+    async fn test_isolation_skipped_command_does_not_commit_sticky_state() {
+        let guard = EnvGuard::new(&["AGENT_BROWSER_ISOLATE_CONTEXT"]);
+        guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
+        let mut state = DaemonState::new();
+        let response = execute_command(
+            &json!({"id": "info", "action": "session_info", "isolateContext": true}),
+            &mut state,
+        )
+        .await;
+        assert_eq!(response["success"], true, "{response}");
+        assert!(!state.isolate_context);
+        assert!(state.browser.is_none());
+    }
+
+    #[tokio::test]
+    async fn test_isolation_policy_rejection_does_not_commit_sticky_state() {
+        let guard = EnvGuard::new(&["AGENT_BROWSER_ISOLATE_CONTEXT"]);
+        guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
+        let dir = tempfile::tempdir().unwrap();
+        let policy_path = dir.path().join("policy.json");
+        for decision in ["deny", "confirm"] {
+            fs::write(&policy_path, json!({decision: ["navigate"]}).to_string()).unwrap();
+            let mut state = DaemonState::new();
+            state.policy = Some(ActionPolicy::load(policy_path.to_str().unwrap()).unwrap());
+            let response = execute_command(
+                &json!({"id": "policy", "action": "navigate", "isolateContext": true, "url": "about:blank"}),
+                &mut state,
+            ).await;
+            if decision == "deny" {
+                assert_eq!(response["success"], false, "{response}");
+                assert!(response["error"]
+                    .as_str()
+                    .unwrap()
+                    .contains("denied by policy"));
+            } else {
+                assert_eq!(
+                    response["data"]["confirmation_required"], true,
+                    "{response}"
+                );
+            }
+            assert!(!state.isolate_context);
+            assert!(state.browser.is_none());
+        }
+    }
+
     fn webmcp_tool(name: &str, origin: &str) -> webmcp::ToolRecord {
         webmcp::ToolRecord {
             name: name.to_string(),
@@ -15095,7 +15304,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--profile"), "got: {}", error);
         assert!(
@@ -15134,7 +15345,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--args"), "got: {}", error);
         assert!(error.contains("--user-data-dir"), "got: {}", error);
@@ -15166,7 +15379,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--restore"), "got: {}", error);
         assert!(
@@ -15197,7 +15412,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--state/storageState"), "got: {}", error);
         assert!(
diff --git a/cli/src/native/browser.rs b/cli/src/native/browser.rs
index 7d352fa..930acc6 100644
--- a/cli/src/native/browser.rs
+++ b/cli/src/native/browser.rs
@@ -1502,6 +1502,10 @@ impl BrowserManager {
         self.isolated_context_unpersisted = false;
     }
 
+    pub fn has_unpersisted_isolated_context(&self) -> bool {
+        self.isolated_context_unpersisted
+    }
+
     pub async fn dispose_unpersisted_isolated_context(&mut self) -> Result<(), String> {
         if !self.isolated_context_unpersisted {
             return Ok(());
@@ -2349,14 +2353,18 @@ impl BrowserManager {
 
     pub async fn set_download_behavior(&self, download_path: &str) -> Result<(), String> {
         let session_id = self.active_session_id()?;
+        let mut params = json!({
+            "behavior": "allowAndName",
+            "downloadPath": download_path,
+            "eventsEnabled": true,
+        });
+        if let Some(context_id) = self.isolated_context_id() {
+            params["browserContextId"] = json!(context_id);
+        }
         self.client
             .send_command(
                 "Browser.setDownloadBehavior",
-                Some(json!({
-                    "behavior": "allowAndName",
-                    "downloadPath": download_path,
-                    "eventsEnabled": true,
-                })),
+                Some(params),
                 Some(session_id),
             )
             .await?;
diff --git a/cli/src/native/e2e_tests.rs b/cli/src/native/e2e_tests.rs
index 581be71..53e1b9a 100644
--- a/cli/src/native/e2e_tests.rs
+++ b/cli/src/native/e2e_tests.rs
@@ -9946,6 +9946,7 @@ fn binding_test_env() -> (EnvGuard<'static>, tempfile::TempDir) {
         "AGENT_BROWSER_SESSION",
         "AGENT_BROWSER_PIN_TAB",
         "AGENT_BROWSER_ISOLATE_CONTEXT",
+        "AGENT_BROWSER_CDP",
     ]);
     let dir = tempfile::tempdir().unwrap();
     guard.set("AGENT_BROWSER_SOCKET_DIR", dir.path().to_str().unwrap());
@@ -9953,6 +9954,7 @@ fn binding_test_env() -> (EnvGuard<'static>, tempfile::TempDir) {
     guard.remove("AGENT_BROWSER_NAMESPACE");
     guard.remove("AGENT_BROWSER_PIN_TAB");
     guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
+    guard.remove("AGENT_BROWSER_CDP");
     (guard, dir)
 }
 
@@ -10595,6 +10597,18 @@ async fn e2e_isolated_context_recreates_after_chrome_restart_and_restores_state(
         .and_then(|mgr| mgr.isolated_context_id())
         .unwrap();
     assert_ne!(new_context, old_context);
+    let new_context = new_context.to_string();
+    let resp = execute_command(
+        &json!({"id": "invalid-after-recreation", "action": "launch", "isolateContext": true}),
+        &mut recreated,
+    )
+    .await;
+    assert_eq!(resp["success"], false, "{resp}");
+    assert!(recreated.browser.is_some(), "{resp}");
+    assert_eq!(
+        recreated.browser.as_ref().unwrap().isolated_context_id(),
+        Some(new_context.as_str())
+    );
 
     let resp = execute_command(
         &json!({ "id": "nav-restored", "action": "navigate", "url": base_url }),
@@ -10636,6 +10650,295 @@ async fn e2e_isolated_context_recreates_after_chrome_restart_and_restores_state(
     cleanup_restore_state_files(&restore_key);
 }
 
+#[tokio::test]
+#[ignore]
+async fn e2e_isolation_pinned_transition_and_implicit_validation() {
+    let (guard, _dir) = binding_test_env();
+    let (base_url, _server) = start_cookie_login_server().await;
+    let (mut host, ws_url) = launch_binding_host(&guard).await;
+    let mut pinned =
+        attach_pinned_session(&guard, "e2e-pinned-isolation", &ws_url, &base_url).await;
+    let old_target = pinned
+        .browser
+        .as_ref()
+        .unwrap()
+        .binding_snapshot()
+        .unwrap()
+        .0;
+    assert_success(&execute_command(
+        &json!({"id": "isolate-pinned", "action": "launch", "cdpUrl": ws_url, "isolateContext": true}),
+        &mut pinned,
+    ).await);
+    let binding = super::tab_binding::load(&pinned.session_id)
+        .unwrap()
+        .unwrap();
+    assert!(binding.browser_context_id.is_some());
+    assert_ne!(binding.target_id, old_target);
+    assert!(pinned
+        .browser
+        .as_ref()
+        .unwrap()
+        .binding_snapshot()
+        .is_some());
+    assert!(DaemonState::new().isolate_context);
+    assert_success(&execute_command(&json!({"id": "close", "action": "close"}), &mut pinned).await);
+
+    guard.set("AGENT_BROWSER_SESSION", "e2e-implicit-isolation");
+    guard.set("AGENT_BROWSER_CDP", &ws_url);
+    let mut implicit = DaemonState::new();
+    let response = execute_command(
+        &json!({"id": "missing-url", "action": "navigate", "isolateContext": true}),
+        &mut implicit,
+    )
+    .await;
+    assert_eq!(response["success"], false, "{response}");
+    assert!(!implicit.isolate_context);
+    assert!(implicit.browser.is_none());
+    assert!(super::tab_binding::load(&implicit.session_id)
+        .unwrap()
+        .is_none());
+    assert_success(&execute_command(
+        &json!({"id": "implicit-success", "action": "navigate", "url": base_url, "isolateContext": true}),
+        &mut implicit,
+    ).await);
+    assert!(implicit.isolate_context);
+    let context = implicit
+        .browser
+        .as_ref()
+        .unwrap()
+        .isolated_context_id()
+        .unwrap()
+        .to_string();
+    assert_success(
+        &execute_command(&json!({"id": "flagless", "action": "url"}), &mut implicit).await,
+    );
+    assert_eq!(
+        implicit.browser.as_ref().unwrap().isolated_context_id(),
+        Some(context.as_str())
+    );
+    assert!(DaemonState::new().isolate_context);
+    let binding = super::tab_binding::load(&implicit.session_id)
+        .unwrap()
+        .unwrap();
+    close_current_browser(&mut implicit).await.unwrap();
+    let response = execute_command(
+        &json!({"id": "reconnected-invalid-action", "action": "navigate"}),
+        &mut implicit,
+    )
+    .await;
+    assert_eq!(response["success"], false, "{response}");
+    assert!(implicit.browser.is_some(), "{response}");
+    assert!(implicit.isolate_context);
+    assert_eq!(
+        implicit.browser.as_ref().unwrap().isolated_context_id(),
+        Some(context.as_str())
+    );
+    assert_eq!(
+        super::tab_binding::load(&implicit.session_id)
+            .unwrap()
+            .unwrap(),
+        binding
+    );
+    assert_success(
+        &execute_command(
+            &json!({"id": "after-error", "action": "url"}),
+            &mut implicit,
+        )
+        .await,
+    );
+    assert_success(
+        &execute_command(&json!({"id": "close", "action": "close"}), &mut implicit).await,
+    );
+    guard.remove("AGENT_BROWSER_CDP");
+    assert_success(
+        &execute_command(&json!({"id": "host-close", "action": "close"}), &mut host).await,
+    );
+}
+
+#[tokio::test]
+#[ignore]
+async fn e2e_isolation_commits_only_after_successful_connection() {
+    let (guard, dir) = binding_test_env();
+    let (base_url, _server) = start_cookie_login_server().await;
+    let (mut host, ws_url) = launch_binding_host(&guard).await;
+    guard.set("AGENT_BROWSER_SESSION", "e2e-isolation-commit");
+    let mut state = DaemonState::new();
+    let invalid_state = dir.path().join("invalid-state.json");
+    std::fs::write(&invalid_state, "invalid JSON").unwrap();
+    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
+    let dead_port = listener.local_addr().unwrap().port();
+    drop(listener);
+    let binding_tmp = super::tab_binding::binding_path(&state.session_id)
+        .with_extension(format!("target.tmp.{}", std::process::id()));
+    std::fs::create_dir(&binding_tmp).unwrap();
+    let response = execute_command(
+        &json!({"id": "binding-failure", "action": "launch", "cdpUrl": ws_url, "isolateContext": true}),
+        &mut state,
+    ).await;
+    assert_eq!(response["success"], false, "{response}");
+    assert!(response["error"]
+        .as_str()
+        .unwrap()
+        .contains("cannot persist"));
+    assert!(!state.isolate_context);
+    assert!(state.browser.is_none());
+    assert!(super::tab_binding::load(&state.session_id)
+        .unwrap()
+        .is_none());
+    let contexts = host
+        .browser
+        .as_ref()
+        .unwrap()
+        .client
+        .send_command_no_params("Target.getBrowserContexts", None)
+        .await
+        .unwrap();
+    assert!(
+        contexts["browserContextIds"].as_array().unwrap().is_empty(),
+        "{contexts}"
+    );
+    std::fs::remove_dir(&binding_tmp).unwrap();
+    for cmd in [
+        json!({"id": "invalid-mode", "action": "launch", "isolateContext": true}),
+        json!({"id": "transport", "action": "launch", "isolateContext": true, "cdpPort": dead_port}),
+        json!({"id": "post-attach", "action": "launch", "isolateContext": true, "cdpUrl": ws_url, "storageState": invalid_state}),
+    ] {
+        let response = execute_command(&cmd, &mut state).await;
+        assert_eq!(response["success"], false, "{response}");
+        assert!(!state.isolate_context, "{cmd}: {response}");
+        assert!(state.browser.is_none());
+        assert!(super::tab_binding::load(&state.session_id)
+            .unwrap()
+            .is_none());
+        assert!(!DaemonState::new().isolate_context);
+        let contexts = host
+            .browser
+            .as_ref()
+            .unwrap()
+            .client
+            .send_command_no_params("Target.getBrowserContexts", None)
+            .await
+            .unwrap();
+        assert!(
+            contexts["browserContextIds"].as_array().unwrap().is_empty(),
+            "{contexts}"
+        );
+        let response = execute_command(
+            &json!({"id": "flagless", "action": "launch", "cdpUrl": ws_url}),
+            &mut state,
+        )
+        .await;
+        assert_success(&response);
+        assert!(!state.browser.as_ref().unwrap().is_isolated());
+        assert!(!state.isolate_context);
+        assert_success(
+            &execute_command(&json!({"id": "close", "action": "close"}), &mut state).await,
+        );
+    }
+    let port = url::Url::parse(&ws_url).unwrap().port().unwrap();
+    for endpoint in [json!({"cdpUrl": ws_url}), json!({"cdpPort": port})] {
+        let mut command = endpoint.clone();
+        command["id"] = json!("commit");
+        command["action"] = json!("launch");
+        command["isolateContext"] = json!(true);
+        assert_success(&execute_command(&command, &mut state).await);
+        assert!(state.isolate_context);
+        assert_success(
+            &execute_command(
+                &json!({"id": "navigate", "action": "navigate", "url": base_url}),
+                &mut state,
+            )
+            .await,
+        );
+        set_isolation_probe(&mut state, "COMMITTED").await;
+        let context = state
+            .browser
+            .as_ref()
+            .unwrap()
+            .isolated_context_id()
+            .unwrap()
+            .to_string();
+        let target = state
+            .browser
+            .as_ref()
+            .unwrap()
+            .binding_snapshot()
+            .unwrap()
+            .0;
+        for requested in [None, Some(false), Some(true)] {
+            let mut command = endpoint.clone();
+            command["id"] = json!("reuse");
+            command["action"] = json!("launch");
+            if let Some(requested) = requested {
+                command["isolateContext"] = json!(requested);
+            }
+            assert_success(&execute_command(&command, &mut state).await);
+            assert!(state.isolate_context);
+            assert_eq!(
+                state.browser.as_ref().unwrap().isolated_context_id(),
+                Some(context.as_str())
+            );
+            assert_eq!(
+                state
+                    .browser
+                    .as_ref()
+                    .unwrap()
+                    .binding_snapshot()
+                    .unwrap()
+                    .0,
+                target
+            );
+            assert_isolation_probe(&read_isolation_probe(&mut state, "read").await, "COMMITTED");
+        }
+        let binding = super::tab_binding::load(&state.session_id)
+            .unwrap()
+            .unwrap();
+        let response = execute_command(
+            &json!({"id": "failed-reconnect", "action": "launch", "cdpPort": dead_port, "isolateContext": true}),
+            &mut state,
+        ).await;
+        assert_eq!(response["success"], false, "{response}");
+        assert!(state.isolate_context);
+        assert_eq!(
+            super::tab_binding::load(&state.session_id)
+                .unwrap()
+                .unwrap(),
+            binding
+        );
+        let mut command = endpoint;
+        command["id"] = json!("reconnect");
+        command["action"] = json!("launch");
+        assert_success(&execute_command(&command, &mut state).await);
+        assert_eq!(
+            state.browser.as_ref().unwrap().isolated_context_id(),
+            Some(context.as_str())
+        );
+        assert_eq!(
+            state
+                .browser
+                .as_ref()
+                .unwrap()
+                .binding_snapshot()
+                .unwrap()
+                .0,
+            target
+        );
+        assert_isolation_probe(
+            &read_isolation_probe(&mut state, "reconnected").await,
+            "COMMITTED",
+        );
+        assert!(DaemonState::new().isolate_context);
+        assert_success(
+            &execute_command(&json!({"id": "close", "action": "close"}), &mut state).await,
+        );
+        assert!(!state.isolate_context);
+        assert!(!DaemonState::new().isolate_context);
+    }
+    assert_success(
+        &execute_command(&json!({"id": "host-close", "action": "close"}), &mut host).await,
+    );
+}
+
 #[tokio::test]
 #[ignore]
 async fn e2e_isolated_recording_preserves_context_and_close_disposes_primary() {
diff --git a/cli/tests/isolate_context_cli.rs b/cli/tests/isolate_context_cli.rs
index 233fb54..c248129 100644
--- a/cli/tests/isolate_context_cli.rs
+++ b/cli/tests/isolate_context_cli.rs
@@ -31,14 +31,27 @@ impl TestServer {
                 match listener.accept() {
                     Ok((mut stream, _)) => {
                         thread::spawn(move || {
-                            let mut request = [0u8; 8192];
-                            let read = stream.read(&mut request).unwrap_or(0);
-                            let request = String::from_utf8_lossy(&request[..read]);
+                            stream
+                                .set_read_timeout(Some(Duration::from_secs(5)))
+                                .unwrap();
+                            let mut request = Vec::new();
+                            while !request.windows(4).any(|bytes| bytes == b"\r\n\r\n") {
+                                let mut buffer = [0u8; 8192];
+                                let read = stream.read(&mut buffer).unwrap_or(0);
+                                if read == 0 || request.len() + read > 65536 {
+                                    return;
+                                }
+                                request.extend_from_slice(&buffer[..read]);
+                            }
+                            let request = String::from_utf8_lossy(&request);
                             let path = request.split_whitespace().nth(1).unwrap_or("/");
-                            let body =
-                                format!("<!doctype html><title>{path}</title><main>{path}</main>");
+                            let (content_type, body) = if path.starts_with("/download/") {
+                                ("application/octet-stream", path.to_string())
+                            } else {
+                                ("text/html", format!("<!doctype html><title>{path}</title><main>{path}</main><a id=\"download\" href=\"/download{path}\" download>Download</a>"))
+                            };
                             let response = format!(
-                                "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n{}",
+                                "HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n{}",
                                 body.len(),
                                 body
                             );
@@ -155,6 +168,137 @@ impl Drop for Sessions {
     }
 }
 
+#[test]
+#[ignore]
+fn invalid_first_isolation_request_does_not_poison_daemon() {
+    let server = TestServer::start();
+    let sessions = Sessions::new();
+    let host = sessions.names[0];
+    let agent = sessions.names[1];
+    let url = server.url("127.0.0.1", "/first-request");
+    sessions.run_json(host, &["open", &url]);
+    sessions.run_json(
+        host,
+        &["eval", "document.cookie = 'first_request=HOST; Path=/'"],
+    );
+    let cdp = sessions.run_json(host, &["get", "cdp-url"])["data"]["cdpUrl"]
+        .as_str()
+        .unwrap()
+        .to_string();
+    let output = sessions
+        .command(agent)
+        .args(["--isolate-context", "open", "about:blank", "--json"])
+        .output()
+        .unwrap();
+    assert!(!output.status.success());
+    sessions.run_json(agent, &["--cdp", &cdp, "open", &url]);
+    assert_eq!(
+        sessions.run_json(agent, &["eval", "document.cookie"])["data"]["result"],
+        "first_request=HOST"
+    );
+    let binding: Value = serde_json::from_str(
+        &std::fs::read_to_string(sessions.socket_dir.path().join(format!("{agent}.target")))
+            .unwrap(),
+    )
+    .unwrap();
+    assert!(binding.get("browserContextId").is_none(), "{binding}");
+}
+
+#[test]
+#[ignore]
+fn isolated_downloads_preserve_other_context_destinations() {
+    let server = TestServer::start();
+    let sessions = Sessions::new();
+    let host = sessions.names[0];
+    let agent_a = sessions.names[1];
+    let agent_b = sessions.names[2];
+    let output = TempDir::new().unwrap();
+    sessions.run_json(
+        host,
+        &["--pin-tab", "open", &server.url("127.0.0.1", "/host")],
+    );
+    let cdp = sessions.run_json(host, &["get", "cdp-url"])["data"]["cdpUrl"]
+        .as_str()
+        .unwrap()
+        .to_string();
+    let host_file = output.path().join("host").join("first.bin");
+    let host_target = target_for_url(&sessions, host, &server.url("127.0.0.1", "/host"));
+    sessions.run_json(
+        host,
+        &["download", "#download", host_file.to_str().unwrap()],
+    );
+    assert_eq!(
+        std::fs::read_to_string(&host_file).unwrap(),
+        "/download/host"
+    );
+    for (session, page) in [(agent_a, "/a"), (agent_b, "/b")] {
+        sessions.run_json(
+            session,
+            &[
+                "--isolate-context",
+                "--cdp",
+                &cdp,
+                "open",
+                &server.url("127.0.0.1", page),
+            ],
+        );
+    }
+    for (session, name) in [(agent_a, "a"), (agent_b, "b")] {
+        let path = output.path().join(name).join("first.bin");
+        sessions.run_json(session, &["download", "#download", path.to_str().unwrap()]);
+        assert_eq!(
+            std::fs::read_to_string(&path).unwrap(),
+            format!("/download/{name}")
+        );
+    }
+    for (session, name) in [(host, "host"), (agent_a, "a"), (agent_b, "b")] {
+        if session == host {
+            sessions.run_json(host, &["tab", &host_target]);
+        }
+        assert_eq!(
+            sessions.run_json(session, &["get", "url"])["data"]["url"],
+            server.url("127.0.0.1", &format!("/{name}"))
+        );
+        sessions.run_json(session, &["click", "#download"]);
+        let directory = output.path().join(name);
+        let deadline = Instant::now() + Duration::from_secs(10);
+        loop {
+            let completed: Vec<_> = std::fs::read_dir(&directory)
+                .unwrap()
+                .map(|entry| entry.unwrap().path())
+                .filter(|path| path.file_name().unwrap() != "first.bin")
+                .filter(|path| path.extension().is_none())
+                .collect();
+            if !completed.is_empty() {
+                assert_eq!(completed.len(), 1);
+                assert_eq!(
+                    std::fs::read_to_string(&completed[0]).unwrap(),
+                    format!("/download/{name}")
+                );
+                break;
+            }
+            assert!(
+                Instant::now() < deadline,
+                "{name} download destination was changed"
+            );
+            thread::sleep(Duration::from_millis(25));
+        }
+    }
+    thread::scope(|scope| {
+        for (session, name) in [(agent_a, "a"), (agent_b, "b")] {
+            let sessions = &sessions;
+            let path = output.path().join(name).join("concurrent.bin");
+            scope.spawn(move || {
+                sessions.run_json(session, &["download", "#download", path.to_str().unwrap()]);
+                assert_eq!(
+                    std::fs::read_to_string(path).unwrap(),
+                    format!("/download/{name}")
+                );
+            });
+        }
+    });
+}
+
 fn set_probe(sessions: &Sessions, session: &str, value: &str) {
     let script = format!(
         r#"(async () => {{

INCREMENTAL FIX SINCE PRIOR REVIEW:
diff --git a/cli/src/native/actions.rs b/cli/src/native/actions.rs
index b69aba5..306f89e 100644
--- a/cli/src/native/actions.rs
+++ b/cli/src/native/actions.rs
@@ -3028,10 +3028,6 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
             .browser
             .as_ref()
             .is_some_and(BrowserManager::is_isolated);
-    if lifecycle_launched && isolated_launch && result.is_err() {
-        let _ = rollback_failed_launch(state).await;
-    }
-
     if result.is_ok() && should_validate_restore_after_action(action) {
         validate_restore_if_pending(state).await;
     }
@@ -3104,7 +3100,7 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
         } else if state
             .browser
             .as_ref()
-            .is_some_and(|manager| manager.context_recreated())
+            .is_some_and(BrowserManager::has_unpersisted_isolated_context)
             || !state.isolate_context
         {
             let _ = rollback_failed_launch(state).await;
@@ -3306,7 +3302,14 @@ async fn commit_isolated_connection(state: &mut DaemonState) -> Result<(), Strin
         .as_ref()
         .is_some_and(BrowserManager::is_isolated)
     {
-        if let Some(error) = maybe_persist_tab_binding(state) {
+        let persist_error = maybe_persist_tab_binding(state).or_else(|| {
+            state
+                .browser
+                .as_ref()
+                .is_some_and(BrowserManager::has_unpersisted_isolated_context)
+                .then(|| "isolated context has no persistable target".to_string())
+        });
+        if let Some(error) = persist_error {
             let _ = rollback_failed_launch(state).await;
             return Err(format!(
                 "cannot persist the session isolation binding: {}",
@@ -14240,6 +14243,76 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         assert_eq!(resp["data"]["url"], "https://example.com");
     }
 
+    #[tokio::test]
+    #[ignore]
+    async fn test_isolation_commit_requires_a_durable_context_without_a_target() {
+        let guard = EnvGuard::new(&[
+            "AGENT_BROWSER_SOCKET_DIR",
+            "XDG_RUNTIME_DIR",
+            "AGENT_BROWSER_SESSION",
+            "AGENT_BROWSER_ISOLATE_CONTEXT",
+        ]);
+        let dir = tempfile::tempdir().unwrap();
+        guard.set("AGENT_BROWSER_SOCKET_DIR", dir.path().to_str().unwrap());
+        guard.remove("XDG_RUNTIME_DIR");
+        guard.set("AGENT_BROWSER_SESSION", "isolation-missing-target");
+        guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
+        let mut host = BrowserManager::launch(LaunchOptions::default(), None)
+            .await
+            .unwrap();
+        for persisted in [false, true] {
+            let mut state = DaemonState::new();
+            let manager = BrowserManager::connect_cdp_isolated(host.get_cdp_url(), None)
+                .await
+                .unwrap();
+            let (target, _) = manager.binding_snapshot().unwrap();
+            state.browser = Some(manager);
+            state.subscribe_to_browser_events();
+            if persisted {
+                commit_isolated_connection(&mut state).await.unwrap();
+            }
+            host.client
+                .send_command(
+                    "Target.closeTarget",
+                    Some(json!({"targetId": target})),
+                    None,
+                )
+                .await
+                .unwrap();
+            tokio::time::timeout(std::time::Duration::from_secs(5), async {
+                loop {
+                    state.drain_cdp_events_background().await.unwrap();
+                    if state.browser.as_ref().unwrap().binding_snapshot().is_none() {
+                        break;
+                    }
+                    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
+                }
+            })
+            .await
+            .unwrap();
+            let result = commit_isolated_connection(&mut state).await;
+            if persisted {
+                assert!(result.is_ok(), "{result:?}");
+                assert!(state.isolate_context);
+                assert!(state.browser.is_some());
+                assert!(DaemonState::new().isolate_context);
+                close_current_browser(&mut state).await.unwrap();
+            } else {
+                assert!(result.is_err(), "{result:?}");
+                assert!(!state.isolate_context);
+                assert!(state.browser.is_none());
+                assert!(tab_binding::load(&state.session_id).unwrap().is_none());
+                let contexts = host
+                    .client
+                    .send_command_no_params("Target.getBrowserContexts", None)
+                    .await
+                    .unwrap();
+                assert!(contexts["browserContextIds"].as_array().unwrap().is_empty());
+            }
+        }
+        host.close().await.unwrap();
+    }
+
     #[tokio::test]
     async fn test_isolation_invalid_launch_does_not_change_sticky_state() {
         let guard = EnvGuard::new(&["AGENT_BROWSER_ISOLATE_CONTEXT"]);
diff --git a/cli/src/native/browser.rs b/cli/src/native/browser.rs
index 5ae9eec..930acc6 100644
--- a/cli/src/native/browser.rs
+++ b/cli/src/native/browser.rs
@@ -1502,6 +1502,10 @@ impl BrowserManager {
         self.isolated_context_unpersisted = false;
     }
 
+    pub fn has_unpersisted_isolated_context(&self) -> bool {
+        self.isolated_context_unpersisted
+    }
+
     pub async fn dispose_unpersisted_isolated_context(&mut self) -> Result<(), String> {
         if !self.isolated_context_unpersisted {
             return Ok(());
diff --git a/cli/src/native/e2e_tests.rs b/cli/src/native/e2e_tests.rs
index ea337de..53e1b9a 100644
--- a/cli/src/native/e2e_tests.rs
+++ b/cli/src/native/e2e_tests.rs
@@ -10597,6 +10597,18 @@ async fn e2e_isolated_context_recreates_after_chrome_restart_and_restores_state(
         .and_then(|mgr| mgr.isolated_context_id())
         .unwrap();
     assert_ne!(new_context, old_context);
+    let new_context = new_context.to_string();
+    let resp = execute_command(
+        &json!({"id": "invalid-after-recreation", "action": "launch", "isolateContext": true}),
+        &mut recreated,
+    )
+    .await;
+    assert_eq!(resp["success"], false, "{resp}");
+    assert!(recreated.browser.is_some(), "{resp}");
+    assert_eq!(
+        recreated.browser.as_ref().unwrap().isolated_context_id(),
+        Some(new_context.as_str())
+    );
 
     let resp = execute_command(
         &json!({ "id": "nav-restored", "action": "navigate", "url": base_url }),
@@ -10705,6 +10717,35 @@ async fn e2e_isolation_pinned_transition_and_implicit_validation() {
         Some(context.as_str())
     );
     assert!(DaemonState::new().isolate_context);
+    let binding = super::tab_binding::load(&implicit.session_id)
+        .unwrap()
+        .unwrap();
+    close_current_browser(&mut implicit).await.unwrap();
+    let response = execute_command(
+        &json!({"id": "reconnected-invalid-action", "action": "navigate"}),
+        &mut implicit,
+    )
+    .await;
+    assert_eq!(response["success"], false, "{response}");
+    assert!(implicit.browser.is_some(), "{response}");
+    assert!(implicit.isolate_context);
+    assert_eq!(
+        implicit.browser.as_ref().unwrap().isolated_context_id(),
+        Some(context.as_str())
+    );
+    assert_eq!(
+        super::tab_binding::load(&implicit.session_id)
+            .unwrap()
+            .unwrap(),
+        binding
+    );
+    assert_success(
+        &execute_command(
+            &json!({"id": "after-error", "action": "url"}),
+            &mut implicit,
+        )
+        .await,
+    );
     assert_success(
         &execute_command(&json!({"id": "close", "action": "close"}), &mut implicit).await,
     );

SOURCE cli/src/native/actions.rs
2339: pub(crate) async fn close_current_browser(state: &mut DaemonState) -> Result<(), String> {
2340:     let close_error = if let Some(mut mgr) = state.browser.take() {
2341:         mgr.close().await.err()
2342:     } else {
2343:         None
2344:     };
2345: 
2346:     close_active_provider_session(state).await;
2347:     state.launch_hash = None;
2348:     state.webmcp_enabled = false;
2349:     state.network_auto_attach_installed = false;
2350:     state.iframe_sessions.clear();
2351:     state.active_iframe_sessions.clear();
2352:     state.webmcp.clear_all();
2353:     state.screencasting = false;
2354:     state.reset_input_state();
2355:     state.update_stream_client().await;
2356: 
2357:     if let Some(err) = close_error {
2358:         return Err(err);
2359:     }
2360:     Ok(())
2361: }
2362: 
2363: pub(crate) async fn prepare_internal_daemon_shutdown(state: &mut DaemonState) {
2364:     if state.recording_state.active {
2365:         let _ = state.stop_recording_task().await;
2366:         let _ = recording::recording_stop(&mut state.recording_state);
2367:     }
2368:     if let Some(ref mut manager) = state.browser {
2369:         let _ = manager.dispose_child_contexts().await;
2370:     }
2371: }
2372: 
2373: /// Close every browser backend owned by the daemon.
2374: ///
2375: /// Lifecycle shutdown paths use this instead of `close_current_browser`
2376: /// because Safari and iOS sessions live outside `state.browser`.
2377: pub(crate) async fn close_all_browser_backends(state: &mut DaemonState) -> Result<(), String> {
2378:     let close_result = close_current_browser(state).await;
2379: 
2380:     if let Some(ref mut webdriver) = state.webdriver_backend {
2381:         let _ = webdriver.close().await;
2382:     }
2383:     state.webdriver_backend = None;
2384:     if let Some(ref mut appium) = state.appium {
2385:         let _ = appium.close().await;
2386:     }
2387:     state.appium = None;
2388:     if let Some(ref mut driver) = state.safari_driver {
2389:         driver.kill();
2390:     }
2391:     state.safari_driver = None;
2392:     state.backend_type = BackendType::Cdp;
2393: 
2394:     close_result
2395: }
2396: 

SOURCE cli/src/native/actions.rs
2560:             || cmd.get("restoreCheckText").is_some()
2561:             || cmd.get("restoreCheckFn").is_some();
2562:         let cmd_for_broadcast = if has_internal_fields {
2563:             broadcast_cmd = cmd.clone();
2564:             if let Some(obj) = broadcast_cmd.as_object_mut() {
2565:                 obj.remove("plugins");
2566:                 obj.remove("pinTab");
2567:                 obj.remove("restoreKey");
2568:                 obj.remove("restoreSave");
2569:                 obj.remove("restoreCheckUrl");
2570:                 obj.remove("restoreCheckText");
2571:                 obj.remove("restoreCheckFn");
2572:             }
2573:             &broadcast_cmd
2574:         } else {
2575:             cmd
2576:         };
2577:         server.broadcast_command(action, &id, cmd_for_broadcast);
2578:     }
2579: 
2580:     // Drain and apply pending CDP events (console, errors, screencast frames, target lifecycle)
2581:     if let Err(e) = state.drain_cdp_events_background().await {
2582:         return error_response(&id, &super::browser::to_ai_friendly_error(&e));
2583:     }
2584: 
2585:     // Keep element resolution in sync with the `frame` selection (see
2586:     // element::set_active_frame for why this is mirrored).
2587:     super::element::set_active_frame(state.active_frame_id.as_deref());
2588: 
2589:     // `--pin-tab` from the client enables strict tab binding even when the
2590:     // daemon was started without the flag, and `--no-pin-tab` (pinTab: false)
2591:     // disables a sticky pin restored from disk or enabled earlier. Both are
2592:     // persisted with the binding so the setting survives daemon restarts;
2593:     // absence of the field leaves the current state untouched.
2594:     match cmd.get("pinTab").and_then(|v| v.as_bool()) {
2595:         Some(pin) if pin != state.pin_tab => {
2596:             // Persist the pinned state before committing it to live state, so a
2597:             // load/save failure leaves the daemon exactly as it was instead of
2598:             // reporting an error while the isolation mode already flipped.
2599:             match tab_binding::load(&state.session_id) {
2600:                 Ok(Some(mut binding)) => {
2601:                     if binding.pinned != pin {
2602:                         binding.pinned = pin;
2603:                         if let Err(e) = tab_binding::save(&state.session_id, &binding) {
2604:                             return error_response(
2605:                                 &id,
2606:                                 &format!(
2607:                                     "cannot persist the pin-tab setting: {} — the change was \
2608:                                      not applied",
2609:                                     e
2610:                                 ),
2611:                             );
2612:                         }
2613:                     }
2614:                 }
2615:                 Ok(None) => {}
2616:                 Err(e) => {
2617:                     return error_response(
2618:                         &id,
2619:                         &format!(
2620:                             "cannot read the session tab binding to update the pin state: {} \
2621:                              — delete the binding file to reset the session",
2622:                             e
2623:                         ),
2624:                     );
2625:                 }
2626:             }
2627:             // Persistence succeeded (or there was nothing to write): commit the
2628:             // live state, and force a re-persist from the snapshot next time.
2629:             state.pin_tab = pin;
2630:             if let Some(ref mut mgr) = state.browser {
2631:                 mgr.set_pin_tab(pin);
2632:             }
2633:             state.last_persisted_binding = None;
2634:         }
2635:         _ => {}
2636:     }
2637:     if cmd.get("isolateContext").and_then(Value::as_bool) == Some(true)
2638:         && action != "launch"
2639:         && state
2640:             .browser
2641:             .as_ref()
2642:             .is_some_and(|manager| !manager.is_isolated())
2643:     {
2644:         return error_response(
2645:             &id,
2646:             "--isolate-context requires reconnecting with --cdp, --auto-connect, or connect <port|url>",
2647:         );
2648:     }
2649: 
2650:     let skip_launch = skip_launch_action(action);
2651:     let restore_key_change_needs_launch = !skip_launch
2652:         && command_changes_restore_key(cmd, state)
2653:         && has_active_browser_session(state);
2654:     let needs_launch = if !skip_launch {
2655:         // Check if existing connection is stale and needs re-launch.
2656:         // This must happen before policy evaluation so plugin capability
2657:         // actions are gated when recovery relaunches would invoke plugins.
2658:         if restore_key_change_needs_launch {
2659:             true
2660:         } else if let Some(ref mut mgr) = state.browser {
2661:             mgr.has_process_exited() || !mgr.is_connection_alive().await
2662:         } else {
2663:             true
2664:         }
2665:     } else {

SOURCE cli/src/native/actions.rs
2690:                         confirmation_required = Some(policy_action.to_string());
2691:                     }
2692:                 }
2693:             }
2694:         }
2695:         if let Some(policy_action) = confirmation_required {
2696:             state.pending_confirmation = Some(PendingConfirmation {
2697:                 action: policy_action.clone(),
2698:                 cmd: cmd.clone(),
2699:                 approved_actions: state.confirmed_policy_actions.iter().cloned().collect(),
2700:             });
2701:             return json!({
2702:                 "id": id,
2703:                 "success": true,
2704:                 "data": {
2705:                     "confirmation_required": true,
2706:                     "confirmation_id": id,
2707:                     "action": policy_action
2708:                 },
2709:             });
2710:         }
2711:     }
2712: 
2713:     // Check AGENT_BROWSER_CONFIRM_ACTIONS (category-based, independent of policy file)
2714:     if action != "confirm" && action != "deny" {
2715:         if let Some(ref ca) = state.confirm_actions {
2716:             for policy_action in &policy_actions {
2717:                 if state.confirmed_policy_actions.contains(policy_action) {
2718:                     continue;
2719:                 }
2720:                 if ca.requires_confirmation(policy_action) {
2721:                     state.pending_confirmation = Some(PendingConfirmation {
2722:                         action: policy_action.to_string(),
2723:                         cmd: cmd.clone(),
2724:                         approved_actions: state.confirmed_policy_actions.iter().cloned().collect(),
2725:                     });
2726:                     return json!({
2727:                         "id": id,
2728:                         "success": true,
2729:                         "data": {
2730:                             "confirmation_required": true,
2731:                             "confirmation_id": id,
2732:                             "action": policy_action,
2733:                         },
2734:                     });
2735:                 }
2736:             }
2737:         }
2738:     }
2739: 
2740:     let restore_transition_closed_browser =
2741:         match apply_restore_config_after_confirmation(cmd, state).await {
2742:             Ok(closed_browser) => closed_browser,
2743:             Err(err) => return error_response(&id, &err),
2744:         };
2745: 
2746:     if !skip_launch {
2747:         if needs_launch {
2748:             lifecycle_relaunched_browser = restore_transition_closed_browser
2749:                 || state.browser.is_some()
2750:                 || state.active_provider_session.is_some();
2751:             if state.browser.is_some() || state.active_provider_session.is_some() {
2752:                 let _ = auto_save_restore_state(state).await;
2753:                 let _ = close_current_browser(state).await;
2754:             }
2755:             if let Err(e) = auto_launch(
2756:                 state,
2757:                 plugins_from_command_or_env(cmd),
2758:                 state.isolate_context
2759:                     || cmd.get("isolateContext").and_then(Value::as_bool) == Some(true),
2760:             )
2761:             .await
2762:             {
2763:                 let context = auto_launch_error_context(env::var("AGENT_BROWSER_CDP").is_ok());
2764:                 return error_response(&id, &format!("{}: {}", context, e));
2765:             }
2766:             state.webmcp_enabled = launch_options_from_env().webmcp;
2767:             lifecycle_launched = true;
2768:         } else {
2769:             lifecycle_reused = true;
2770:         }
2771: 
2772:         if let Some(ref mut mgr) = state.browser {
2773:             if mgr.page_count() == 0 {
2774:                 // ensure_page itself skips creation for a pinned tab_gone
2775:                 // session, so a closed sole tab stays tab_gone instead of
2776:                 // silently recovering onto a fresh blank page.
2777:                 let _ = mgr.ensure_page().await;
2778:             }
2779:         }
2780:     }
2781: 
2782:     // WebDriver backend: reject unsupported CDP-only actions
2783:     if matches!(state.backend_type, BackendType::WebDriver)
2784:         && WEBDRIVER_UNSUPPORTED_ACTIONS.contains(&action)
2785:     {
2786:         return error_response(
2787:             &id,
2788:             &format!(
2789:                 "Action '{}' is not supported on the WebDriver backend",
2790:                 action
2791:             ),
2792:         );
2793:     }
2794: 
2795:     // A pending confirm/prompt dialog blocks the renderer's main thread, so
2796:     // any command that touches the page would hang until the client read
2797:     // timeout. Fail fast with instructions instead. Actions in skip_launch
2798:     // never touch the page; dialog/screenshot/url/title are browser-side.
2799:     // Only a dialog on the ACTIVE tab blocks: one on a background tab leaves
2800:     // the active tab's renderer responsive.
2801:     if let Some(ref dialog) = state.pending_dialog {
2802:         let active_session = state
2803:             .browser
2804:             .as_ref()
2805:             .and_then(|m| m.active_session_id().ok().map(|s| s.to_string()));
2806:         let on_active_tab = match (&dialog.session_id, &active_session) {
2807:             (Some(dialog_sid), Some(active_sid)) => dialog_sid == active_sid,
2808:             // No session on the event = top-level page dialog; no browser = be safe.
2809:             _ => true,
2810:         };
2811:         // Tab and session management must stay usable: switching or closing
2812:         // tabs is exactly how an agent escapes a tab blocked by a dialog.
2813:         let read_touches_active_tab = action == "read"
2814:             && cmd.get("url").is_none()
2815:             && cmd.get("llms").is_none()
2816:             && !cmd
2817:                 .get("requireMd")
2818:                 .and_then(|v| v.as_bool())
2819:                 .unwrap_or(false);
2820:         let safe_during_dialog = (skip_launch && !read_touches_active_tab)

SOURCE cli/src/native/actions.rs
3015:         "input_keyboard" => handle_input_keyboard(cmd, state).await,
3016:         "input_touch" => handle_input_touch(cmd, state).await,
3017:         "keydown" => handle_keydown(cmd, state).await,
3018:         "keyup" => handle_keyup(cmd, state).await,
3019:         "inserttext" => handle_inserttext(cmd, state).await,
3020:         "mousemove" => handle_mousemove(cmd, state).await,
3021:         "mousedown" => handle_mousedown(cmd, state).await,
3022:         "mouseup" => handle_mouseup(cmd, state).await,
3023:         _ => Err(format!("Not yet implemented: {}", action)),
3024:     };
3025: 
3026:     let isolated_launch = (lifecycle_launched || action == "launch")
3027:         && state
3028:             .browser
3029:             .as_ref()
3030:             .is_some_and(BrowserManager::is_isolated);
3031:     if result.is_ok() && should_validate_restore_after_action(action) {
3032:         validate_restore_if_pending(state).await;
3033:     }
3034: 
3035:     // Stamp browser-touching commands so periodic autosave waits for an
3036:     // active command burst to settle before collecting state. Stamped even on
3037:     // error: a failed click can still have navigated.
3038:     if !skip_launch {
3039:         state.last_command_finished = Some(std::time::Instant::now());
3040:     }
3041: 
3042:     // Persist the session-to-tab binding (write-on-change) so a fresh daemon
3043:     // re-attaches to this session's tab instead of adopting the browser's
3044:     // most recently active one.
3045:     let persist_error = if !skip_launch && !isolated_launch {
3046:         maybe_persist_tab_binding(state)
3047:     } else {
3048:         None
3049:     };
3050: 
3051:     let mut resp = match result {
3052:         Ok(data) => success_response(&id, data),
3053:         Err(e) => error_response(&id, &super::browser::to_ai_friendly_error(&e)),
3054:     };
3055:     attach_tab_gone_data(&mut resp, state);
3056: 
3057:     // A failed binding write is retried on the next command, but a pinned
3058:     // session must know its isolation may not survive a daemon restart.
3059:     if let Some(err) = persist_error {
3060:         if let Some(obj) = resp.as_object_mut() {
3061:             let hint = if state.pin_tab || state.isolate_context {
3062:                 " Session isolation may not survive a daemon restart until the binding persists."
3063:             } else {
3064:                 ""
3065:             };
3066:             obj.insert(
3067:                 "warning".to_string(),
3068:                 json!(format!(
3069:                     "Failed to persist the session tab binding: {}.{}",
3070:                     err, hint
3071:                 )),
3072:             );
3073:         }
3074:     }
3075:     inject_lifecycle(
3076:         &mut resp,
3077:         state,
3078:         lifecycle_reused,
3079:         lifecycle_launched,
3080:         lifecycle_relaunched_browser,
3081:     );
3082:     // Re-drain so a dialog opened by THIS command is reflected in the warning
3083:     // below; events are otherwise only drained at the start of a command.
3084:     if let Err(e) = state.drain_cdp_events_background().await {
3085:         resp = error_response(&id, &super::browser::to_ai_friendly_error(&e));
3086:         attach_tab_gone_data(&mut resp, state);
3087:         inject_lifecycle(
3088:             &mut resp,
3089:             state,
3090:             lifecycle_reused,
3091:             lifecycle_launched,
3092:             lifecycle_relaunched_browser,
3093:         );
3094:     }
3095:     if isolated_launch {
3096:         if resp.get("success").and_then(Value::as_bool) == Some(true) {
3097:             if let Err(error) = commit_isolated_connection(state).await {
3098:                 resp = error_response(&id, &error);
3099:             }
3100:         } else if state
3101:             .browser
3102:             .as_ref()
3103:             .is_some_and(BrowserManager::has_unpersisted_isolated_context)
3104:             || !state.isolate_context
3105:         {
3106:             let _ = rollback_failed_launch(state).await;
3107:         }
3108:     }
3109:     state.context_recreated = false;
3110:     attach_webmcp_availability(&mut resp, action, state).await;
3111: 
3112:     // Auto-report pending JavaScript dialog so agents know why commands may hang
3113:     if action != "dialog" {
3114:         if let Some(ref dialog) = state.pending_dialog {
3115:             if let Some(obj) = resp.as_object_mut() {
3116:                 obj.insert(
3117:                     "warning".to_string(),
3118:                     json!(format!(
3119:                         "A JavaScript {} dialog is blocking the page: \"{}\" — use `dialog accept` or `dialog dismiss` to resolve it",
3120:                         dialog.dialog_type, dialog.message
3121:                     )),
3122:                 );
3123:             }
3124:         }
3125:     }
3126: 
3127:     if let Some(ref server) = state.stream_server {
3128:         let duration_ms = cmd_start.elapsed().as_millis() as u64;
3129:         let success = resp
3130:             .get("status")
3131:             .and_then(|v| v.as_str())
3132:             .is_some_and(|s| s == "success");
3133:         let data = resp.get("data").cloned().unwrap_or(Value::Null);
3134:         server.broadcast_result(&id, action, success, &data, duration_ms);
3135: 
3136:         if let Some(ref mgr) = state.browser {
3137:             let tabs = mgr.tab_list();
3138:             let session_id = mgr.active_session_id().ok().map(|s| s.to_string());
3139:             server
3140:                 .bind_cdp_session_and_broadcast_tabs(session_id, &tabs)
3141:                 .await;
3142:         }
3143:     }
3144: 
3145:     resp
3146: }
3147: 
3148: fn auto_launch_error_context(has_cdp: bool) -> &'static str {
3149:     if has_cdp {
3150:         "CDP connection failed"
3151:     } else {
3152:         "Auto-launch failed"
3153:     }
3154: }
3155: 
3156: // ---------------------------------------------------------------------------
3157: // Session-to-tab binding
3158: // ---------------------------------------------------------------------------
3159: 
3160: /// Persist the session's tab binding when it changed. Called after every
3161: /// browser-touching command; skipped while the bound tab is gone so the
3162: /// stale binding (needed to re-derive the tab_gone state after a daemon
3163: /// restart) is not overwritten by the fallback tab.
3164: ///
3165: /// Returns the write error, if any. `last_persisted_binding` is only updated
3166: /// after a successful durable write, so a transient failure is retried on
3167: /// the next command instead of being silently treated as persisted (which
3168: /// would let a daemon restart drop the binding and, for a pinned session,
3169: /// the strict isolation boundary with it).
3170: fn maybe_persist_tab_binding(state: &mut DaemonState) -> Option<String> {
3171:     let mgr = state.browser.as_ref()?;
3172:     let (target_id, url) = mgr.binding_snapshot()?;
3173:     let binding = tab_binding::TabBinding {
3174:         target_id,
3175:         url: tab_binding::sanitize_url(&url),
3176:         pinned: state.pin_tab,
3177:         browser_context_id: mgr.isolated_context_id().map(str::to_string),
3178:     };
3179:     if state.last_persisted_binding.as_ref() == Some(&binding) {
3180:         return None;
3181:     }
3182:     match tab_binding::save(&state.session_id, &binding) {
3183:         Ok(()) => {
3184:             state.last_persisted_binding = Some(binding);
3185:             if let Some(ref mut mgr) = state.browser {
3186:                 mgr.mark_isolated_context_persisted();
3187:             }
3188:             None
3189:         }
3190:         Err(e) => Some(e),
3191:     }
3192: }
3193: 
3194: /// Re-apply this session's persisted tab binding after attaching to a
3195: /// browser over CDP, instead of keeping the default selection (the first
3196: /// target returned by `Target.getTargets`, i.e. the browser's most recently
3197: /// active tab, which in a shared browser is usually another session's tab).
3198: ///
3199: /// Returns true when the session ends up with an established selection:
3200: /// re-bound to the persisted target, entered the `tab_gone` state (pin-tab,
3201: /// bound tab dead), or bound to a fresh tab (pin-tab, no prior binding).
3202: /// Returns false when no binding existed and the legacy selection stands.
3203: async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, String> {
3204:     let session = state.session_id.clone();
3205:     // A corrupt or unreadable binding file is a recovery error, not a
3206:     // first-time session: it may have carried pinned=true, and silently
3207:     // starting fresh would drop the strict isolation boundary.
3208:     let binding = tab_binding::load(&session).map_err(|e| {
3209:         format!(
3210:             "{} — delete the file to reset the session's tab binding \
3211:              (re-run with --pin-tab afterwards if the session was pinned)",
3212:             e
3213:         )
3214:     })?;
3215:     if binding.as_ref().is_some_and(|b| b.pinned) {
3216:         state.pin_tab = true;
3217:     }
3218:     let pin = state.pin_tab;
3219:     let isolated = state
3220:         .browser
3221:         .as_ref()
3222:         .is_some_and(BrowserManager::is_isolated);
3223:     if state.browser.is_none() {
3224:         return Ok(false);
3225:     }
3226:     if let Some(ref mut mgr) = state.browser {
3227:         mgr.set_pin_tab(pin);
3228:         state.context_recreated = mgr.context_recreated();
3229:     }
3230:     let established = match binding {
3231:         Some(b) => {
3232:             let context_changed = isolated
3233:                 && b.browser_context_id.as_deref()
3234:                     != state
3235:                         .browser
3236:                         .as_ref()
3237:                         .and_then(BrowserManager::isolated_context_id);
3238:             let restored = if state.context_recreated || context_changed {
3239:                 false
3240:             } else {
3241:                 state
3242:                     .browser
3243:                     .as_mut()
3244:                     .map(|mgr| mgr.restore_target_binding(&b.target_id, &b.url))
3245:                     .unwrap_or(false)
3246:             };
3247:             if restored {
3248:                 // Attach only enables the CDP domains on the first target; the
3249:                 // restored tab needs them too (like tab_switch), or
3250:                 // lifecycle-dependent commands such as navigate hang. The tab
3251:                 // may have been discarded by Memory Saver, so revive it before
3252:                 // enabling domains instead of hanging on Page.enable.
3253:                 if let Some(ref mgr) = state.browser {
3254:                     mgr.revive_and_enable_active().await?;
3255:                 }
3256:             }
3257:             if restored || pin || isolated {
3258:                 // Restored, or entered the tab_gone state (the stale binding
3259:                 // file is intentionally kept so the state is re-derived if
3260:                 // the daemon restarts again before the agent re-binds).
3261:                 true
3262:             } else {
3263:                 // Legacy sessions fall back to the first target; drop the
3264:                 // stale binding.
3265:                 tab_binding::clear(&session);
3266:                 state.last_persisted_binding = None;
3267:                 false
3268:             }
3269:         }
3270:         None => {
3271:             if pin && !isolated {
3272:                 // A pinned session never implicitly adopts an existing tab:
3273:                 // start it on a fresh one.
3274:                 if let Some(ref mut mgr) = state.browser {
3275:                     mgr.tab_new(None, None).await?;
3276:                 }
3277:                 true
3278:             } else {
3279:                 isolated
3280:             }
3281:         }
3282:     };
3283:     if established && !isolated {
3284:         if let Some(err) = maybe_persist_tab_binding(state) {
3285:             // Strict pinning is only as durable as the binding file: fail
3286:             // the attach instead of pretending the pin is in place.
3287:             if state.pin_tab {
3288:                 return Err(format!(
3289:                     "cannot persist the session isolation binding: {}. \
3290:                      --pin-tab and --isolate-context require a writable socket directory",
3291:                     err
3292:                 ));
3293:             }
3294:         }
3295:     }
3296:     Ok(established)
3297: }
3298: 
3299: async fn commit_isolated_connection(state: &mut DaemonState) -> Result<(), String> {
3300:     if state
3301:         .browser
3302:         .as_ref()
3303:         .is_some_and(BrowserManager::is_isolated)
3304:     {
3305:         let persist_error = maybe_persist_tab_binding(state).or_else(|| {
3306:             state
3307:                 .browser
3308:                 .as_ref()
3309:                 .is_some_and(BrowserManager::has_unpersisted_isolated_context)
3310:                 .then(|| "isolated context has no persistable target".to_string())
3311:         });
3312:         if let Some(error) = persist_error {
3313:             let _ = rollback_failed_launch(state).await;
3314:             return Err(format!(
3315:                 "cannot persist the session isolation binding: {}",
3316:                 error
3317:             ));
3318:         }
3319:         state.isolate_context = true;
3320:     }
3321:     Ok(())
3322: }
3323: 
3324: fn persisted_browser_context_id(state: &DaemonState) -> Result<Option<String>, String> {
3325:     tab_binding::ensure_writable(&state.session_id)?;
3326:     let binding = tab_binding::load(&state.session_id)?;
3327:     Ok(binding.and_then(|binding| binding.browser_context_id))
3328: }
3329: 
3330: async fn connect_external_cdp(
3331:     state: &DaemonState,
3332:     endpoint: &str,
3333:     isolate_context: bool,
3334: ) -> Result<BrowserManager, String> {
3335:     if isolate_context {
3336:         let context_id = persisted_browser_context_id(state)?;
3337:         BrowserManager::connect_cdp_isolated(endpoint, context_id.as_deref()).await
3338:     } else {
3339:         BrowserManager::connect_cdp(endpoint).await
3340:     }
3341: }
3342: 
3343: async fn connect_external_auto(
3344:     state: &DaemonState,
3345:     isolate_context: bool,
3346: ) -> Result<BrowserManager, String> {
3347:     if isolate_context {
3348:         let context_id = persisted_browser_context_id(state)?;
3349:         BrowserManager::connect_auto_isolated(context_id.as_deref()).await
3350:     } else {
3351:         BrowserManager::connect_auto().await
3352:     }
3353: }
3354: 
3355: /// Run `apply_tab_binding_on_attach`, but tear the connection down on failure.

SOURCE cli/src/native/actions.rs
3938:     }
3939: 
3940:     Ok(())
3941: }
3942: 
3943: async fn auto_launch(
3944:     state: &mut DaemonState,
3945:     plugins: Vec<crate::plugins::PluginConfig>,
3946:     isolate_context: bool,
3947: ) -> Result<(), String> {
3948:     if isolate_context
3949:         && env::var("AGENT_BROWSER_CDP").is_err()
3950:         && env::var("AGENT_BROWSER_AUTO_CONNECT").is_err()
3951:     {
3952:         return Err(
3953:             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
3954:         );
3955:     }
3956:     let mut options = launch_options_from_env();
3957:     let effective_ca_cert = state.effective_ca_cert.clone();
3958:     apply_effective_ca_cert(&mut options, &effective_ca_cert);
3959:     state.plugin_init_scripts.clear();
3960:     state.session_setup = SessionSetup::default();
3961: 
3962:     // Use the stream server's viewport dimensions for --window-size so the
3963:     // content area matches the desired viewport from the start.
3964:     if let Some(ref server) = state.stream_server {
3965:         options.viewport_size = Some(server.viewport().await);
3966:     }
3967:     let engine = env::var("AGENT_BROWSER_ENGINE").ok();
3968:     let cdp = env::var("AGENT_BROWSER_CDP").ok();
3969:     let auto_connect = env::var("AGENT_BROWSER_AUTO_CONNECT").is_ok();
3970:     let provider = env::var("AGENT_BROWSER_PROVIDER").ok();
3971:     validate_ca_cert_launch_mode(
3972:         &options,
3973:         engine.as_deref(),
3974:         cdp.is_some() || auto_connect || provider.is_some(),
3975:     )?;
3976:     let enable_features = launch_enable_features_from_env();
3977:     let init_script_paths = launch_init_script_paths_from_env();
3978:     let allowed_domains = current_allowed_domains(state).await;
3979:     options.restrict_webrtc = !allowed_domains.is_empty();
3980:     // Extract storage_state before options is moved into BrowserManager::launch.
3981:     let storage_state_path = options.storage_state.clone();
3982:     let restore_key = state.session_name.clone();
3983:     let storage_state = storage_state_path.as_deref();
3984: 
3985:     // Store proxy credentials for Fetch.authRequired handling
3986:     let has_proxy_auth = options.proxy_username.is_some();
3987:     if has_proxy_auth {
3988:         let mut creds = state.proxy_credentials.write().await;
3989:         *creds = Some((
3990:             options.proxy_username.clone().unwrap_or_default(),
3991:             options.proxy_password.clone().unwrap_or_default(),
3992:         ));
3993:     }
3994: 
3995:     state.engine = engine.as_deref().unwrap_or("chrome").to_string();
3996:     write_engine_file(&state.session_id, &state.engine);
3997:     write_extensions_file(&state.session_id);
3998: 
3999:     if let Some(cdp) = cdp {
4000:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4001:             allowed_domains: &allowed_domains,
4002:             cdp_url: Some(cdp.as_str()),
4003:             cdp_port: None,
4004:             auto_connect: false,
4005:             profile: options.profile.as_deref(),
4006:             provider_name: None,
4007:             args: &options.args,
4008:             restore_key: restore_key.as_deref(),
4009:             storage_state,
4010:         })?;
4011:         let mgr = connect_external_cdp(state, &cdp, isolate_context).await?;
4012:         let hash = launch_hash(
4013:             &options,
4014:             &allowed_domains,
4015:             &state.plugin_init_scripts,
4016:             &enable_features,
4017:             &init_script_paths,
4018:             engine.as_deref(),
4019:             "cdp-url",
4020:             Some(cdp.as_str()),
4021:         );
4022:         state.reset_input_state();
4023:         state.browser = Some(mgr);
4024:         state.launch_hash = Some(hash);
4025:         state.subscribe_to_browser_events();
4026:         state.start_fetch_handler();
4027:         state.start_dialog_handler();
4028:         apply_tab_binding_on_attach_or_rollback(state).await?;
4029:         state.update_stream_client().await;
4030:         install_network_controls_or_close(state, has_proxy_auth).await?;
4031:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4032:         try_auto_restore_state(state).await;
4033:         try_load_storage_state(state, &storage_state_path).await;
4034:         return Ok(());
4035:     }
4036: 
4037:     if auto_connect {
4038:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4039:             allowed_domains: &allowed_domains,
4040:             cdp_url: None,
4041:             cdp_port: None,
4042:             auto_connect: true,
4043:             profile: options.profile.as_deref(),
4044:             provider_name: None,
4045:             args: &options.args,
4046:             restore_key: restore_key.as_deref(),
4047:             storage_state,
4048:         })?;
4049:         let hash = launch_hash(
4050:             &options,
4051:             &allowed_domains,
4052:             &state.plugin_init_scripts,
4053:             &enable_features,
4054:             &init_script_paths,
4055:             engine.as_deref(),
4056:             "auto-connect",
4057:             None,
4058:         );
4059:         state.reset_input_state();
4060:         state.browser = Some(connect_external_auto(state, isolate_context).await?);
4061:         if !apply_tab_binding_on_attach_or_rollback(state).await? {
4062:             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
4063:                 let _ = rollback_failed_launch(state).await;
4064:                 return Err(e);
4065:             }
4066:         }
4067:         state.launch_hash = Some(hash);
4068:         state.subscribe_to_browser_events();
4069:         state.start_fetch_handler();
4070:         state.start_dialog_handler();
4071:         state.update_stream_client().await;
4072:         install_network_controls_or_close(state, has_proxy_auth).await?;
4073:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4074:         try_auto_restore_state(state).await;
4075:         try_load_storage_state(state, &storage_state_path).await;
4076:         return Ok(());
4077:     }
4078: 
4079:     // Cloud provider: when AGENT_BROWSER_PROVIDER is set, connect via the
4080:     // provider API instead of launching a local Chrome instance.  This mirrors
4081:     // the logic in handle_launch() so that auto_launch (triggered by any
4082:     // command arriving before an explicit "launch") honours the provider env.
4083:     if let Some(provider) = provider {
4084:         let p = provider.to_lowercase();
4085:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4086:             allowed_domains: &allowed_domains,
4087:             cdp_url: None,
4088:             cdp_port: None,
4089:             auto_connect: false,
4090:             profile: options.profile.as_deref(),
4091:             provider_name: Some(p.as_str()),
4092:             args: &options.args,
4093:             restore_key: restore_key.as_deref(),
4094:             storage_state,
4095:         })?;
4096:         // ios/safari are device providers handled via explicit launch command
4097:         if !p.is_empty() && p != "ios" && p != "safari" {
4098:             let conn = providers::connect_provider_with_plugins(&p, &plugins).await?;
4099:             if conn.direct_page && !allowed_domains.is_empty() {
4100:                 if let Some(ref ps) = conn.session {

SOURCE cli/src/native/actions.rs
4705:     Ok(())
4706: }
4707: 
4708: async fn rollback_failed_launch(state: &mut DaemonState) -> Result<(), String> {
4709:     let dispose_result = if let Some(ref mut manager) = state.browser {
4710:         manager.dispose_unpersisted_isolated_context().await
4711:     } else {
4712:         Ok(())
4713:     };
4714:     let close_result = close_current_browser(state).await;
4715:     state.ref_map.clear();
4716:     match (dispose_result, close_result) {
4717:         (Ok(()), result) => result,
4718:         (Err(dispose), Ok(())) => Err(dispose),
4719:         (Err(dispose), Err(close)) => Err(format!(
4720:             "{} (also failed to detach browser after launch rollback: {})",
4721:             dispose, close
4722:         )),
4723:     }
4724: }
4725: 
4726: async fn load_storage_state_or_rollback(
4727:     state: &mut DaemonState,
4728:     path: &Option<String>,
4729: ) -> Result<(), String> {
4730:     if let Err(err) = load_storage_state(state, path).await {
4731:         if let Err(close_err) = rollback_failed_launch(state).await {
4732:             return Err(format!(
4733:                 "{} (also failed to roll back browser after launch: {})",
4734:                 err, close_err
4735:             ));
4736:         }
4737:         return Err(err);
4738:     }
4739: 
4740:     Ok(())
4741: }
4742: 
4743: /// Load storage state from AGENT_BROWSER_STATE if set.
4744: async fn try_load_storage_state(state: &mut DaemonState, path: &Option<String>) {
4745:     let _ = load_storage_state(state, path).await;
4746: }
4747: 
4748: // ---------------------------------------------------------------------------
4749: // Phase 1 handlers
4750: // ---------------------------------------------------------------------------
4751: 
4752: async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
4753:     let isolate_context =
4754:         state.isolate_context || cmd.get("isolateContext").and_then(Value::as_bool) == Some(true);
4755:     let effective_ca_cert = resolve_effective_ca_cert(cmd, state)?;
4756:     // Absent field falls back to the daemon's spawn-time env (mirrors
4757:     // hideScrollbars/webgpu), keeping the launch hash stable when follow-up
4758:     // commands send launch envelopes without an explicit headed choice.
4759:     let headless = cmd
4760:         .get("headless")
4761:         .and_then(|v| v.as_bool())
4762:         .unwrap_or_else(|| !headed_from_env());
4763:     let cdp_url = cmd.get("cdpUrl").and_then(|v| v.as_str());
4764:     let cdp_port = cmd.get("cdpPort").and_then(|v| v.as_u64());
4765:     let auto_connect = cmd
4766:         .get("autoConnect")
4767:         .and_then(|v| v.as_bool())
4768:         .unwrap_or(false);
4769:     let provider_name = cmd.get("provider").and_then(|v| v.as_str());
4770:     if isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
4771:         return Err(
4772:             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
4773:         );
4774:     }
4775:     let enable_features =
4776:         string_array_from_command(cmd, "enable").unwrap_or_else(launch_enable_features_from_env);
4777:     let init_script_paths = string_array_from_command(cmd, "initScripts")
4778:         .unwrap_or_else(launch_init_script_paths_from_env);
4779: 
4780:     let extensions: Option<Vec<String>> =
4781:         cmd.get("extensions").and_then(|v| v.as_array()).map(|arr| {
4782:             arr.iter()
4783:                 .filter_map(|v| v.as_str().map(String::from))
4784:                 .collect()
4785:         });
4786:     let storage_state = cmd.get("storageState").and_then(|v| v.as_str());
4787:     let storage_state_owned = storage_state.map(|s| s.to_string());
4788:     let engine = cmd
4789:         .get("engine")
4790:         .and_then(|v| v.as_str())
4791:         .map(String::from)
4792:         .or_else(|| env::var("AGENT_BROWSER_ENGINE").ok());
4793:     let profile = cmd
4794:         .get("profile")
4795:         .and_then(|v| v.as_str())
4796:         .map(String::from);
4797: 
4798:     let requested_allowed_domains = allowed_domains_from_launch_command(cmd);
4799:     let previous_domain_filter = state.domain_filter.read().await.clone();
4800:     let existing_allowed_domains = current_allowed_domains(state).await;
4801:     let allowed_domains = requested_allowed_domains
4802:         .clone()
4803:         .unwrap_or(existing_allowed_domains);
4804:     let restrict_webrtc = !allowed_domains.is_empty();
4805:     let restore_key = cmd
4806:         .get("restoreKey")
4807:         .and_then(|v| v.as_str())
4808:         .map(String::from)
4809:         .or_else(|| state.session_name.clone());
4810:     let launch_args: Vec<String> = cmd
4811:         .get("args")
4812:         .and_then(|v| v.as_array())
4813:         .map(|arr| {
4814:             arr.iter()
4815:                 .filter_map(|v| v.as_str().map(|s| s.to_string()))
4816:                 .collect::<Vec<_>>()
4817:         })
4818:         .unwrap_or_default();
4819: 
4820:     ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4821:         allowed_domains: &allowed_domains,
4822:         cdp_url,
4823:         cdp_port,
4824:         auto_connect,
4825:         profile: profile.as_deref(),
4826:         provider_name,
4827:         args: &launch_args,
4828:         restore_key: restore_key.as_deref(),
4829:         storage_state,
4830:     })?;
4831: 
4832:     let mut launch_options = LaunchOptions {
4833:         headless,
4834:         executable_path: cmd
4835:             .get("executablePath")
4836:             .and_then(|v| v.as_str())
4837:             .map(|s| s.to_string())
4838:             .or_else(|| env::var("AGENT_BROWSER_EXECUTABLE_PATH").ok()),
4839:         proxy: cmd.get("proxy").and_then(|v| {
4840:             v.as_str().map(|s| s.to_string()).or_else(|| {
4841:                 v.get("server")
4842:                     .and_then(|s| s.as_str())
4843:                     .map(|s| s.to_string())
4844:             })
4845:         }),
4846:         proxy_bypass: cmd
4847:             .get("proxy")
4848:             .and_then(|v| v.get("bypass"))
4849:             .and_then(|v| v.as_str())
4850:             .map(String::from),
4851:         proxy_username: cmd
4852:             .get("proxy")
4853:             .and_then(|v| v.get("username"))
4854:             .and_then(|v| v.as_str())
4855:             .map(String::from)
4856:             .or_else(|| env::var("AGENT_BROWSER_PROXY_USERNAME").ok()),
4857:         proxy_password: cmd
4858:             .get("proxy")
4859:             .and_then(|v| v.get("password"))
4860:             .and_then(|v| v.as_str())
4861:             .map(String::from)
4862:             .or_else(|| env::var("AGENT_BROWSER_PROXY_PASSWORD").ok()),
4863:         profile,
4864:         allow_file_access: cmd
4865:             .get("allowFileAccess")
4866:             .and_then(|v| v.as_bool())
4867:             .unwrap_or(false),
4868:         args: launch_args,
4869:         extensions,
4870:         storage_state: storage_state.map(String::from),
4871:         user_agent: cmd
4872:             .get("userAgent")
4873:             .and_then(|v| v.as_str())
4874:             .map(String::from),
4875:         ignore_https_errors: cmd
4876:             .get("ignoreHTTPSErrors")
4877:             .and_then(|v| v.as_bool())
4878:             .unwrap_or(false),
4879:         ca_cert: None,
4880:         ca_bundle: None,
4881:         ca_cert_digest: None,
4882:         prepared_nss_home: None,
4883:         color_scheme: cmd
4884:             .get("colorScheme")
4885:             .and_then(|v| v.as_str())
4886:             .map(String::from),
4887:         download_path: cmd
4888:             .get("downloadPath")
4889:             .and_then(|v| v.as_str())
4890:             .map(String::from),
4891:         hide_scrollbars: hide_scrollbars_from_launch_cmd(cmd),
4892:         viewport_size: None,
4893:         use_real_keychain: false,
4894:         webgpu: webgpu_from_launch_cmd(cmd),
4895:         webmcp: cmd
4896:             .get("webmcp")
4897:             .and_then(Value::as_bool)
4898:             .unwrap_or_else(|| {
4899:                 !matches!(
4900:                     env::var("AGENT_BROWSER_NO_WEBMCP").as_deref(),
4901:                     Ok("1" | "true" | "yes")
4902:                 )
4903:             }),
4904:         no_xvfb: no_xvfb_from_launch_cmd(cmd),
4905:         restrict_webrtc,
4906:     };
4907:     apply_effective_ca_cert(&mut launch_options, &effective_ca_cert);
4908: 
4909:     let external_launch =
4910:         cdp_url.is_some() || cdp_port.is_some() || auto_connect || provider_name.is_some();
4911:     validate_ca_cert_launch_mode(&launch_options, engine.as_deref(), external_launch)?;
4912: 
4913:     state.plugin_init_scripts.clear();
4914:     let local_launch =
4915:         cdp_url.is_none() && cdp_port.is_none() && !auto_connect && provider_name.is_none();
4916:     if local_launch {
4917:         apply_launch_mutator_plugins(state, &mut launch_options, plugins_from_command_or_env(cmd))
4918:             .await?;
4919:         validate_ca_cert_launch_mode(&launch_options, engine.as_deref(), false)?;
4920:     }
4921:     ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4922:         allowed_domains: &allowed_domains,
4923:         cdp_url,
4924:         cdp_port,
4925:         auto_connect,
4926:         profile: launch_options.profile.as_deref(),
4927:         provider_name,
4928:         args: &launch_options.args,
4929:         restore_key: restore_key.as_deref(),
4930:         storage_state,
4931:     })?;
4932: 
4933:     if let Some(domains) = requested_allowed_domains {
4934:         let mut filter = state.domain_filter.write().await;
4935:         *filter = if domains.is_empty() {
4936:             None
4937:         } else {
4938:             Some(DomainFilter::new(&domains.join(",")))
4939:         };
4940:     }
4941: 
4942:     let (connection_kind, connection_target) =
4943:         launch_connection_identity(cdp_url, cdp_port, auto_connect, provider_name);
4944:     let new_hash = launch_hash(
4945:         &launch_options,
4946:         &allowed_domains,
4947:         &state.plugin_init_scripts,
4948:         &enable_features,
4949:         &init_script_paths,
4950:         engine.as_deref(),
4951:         connection_kind,
4952:         connection_target.as_deref(),
4953:     );
4954: 
4955:     // Hash comparison and fast process-exit check are evaluated before the
4956:     // async is_connection_alive to skip the expensive CDP liveness probe
4957:     // when a relaunch is already certain.
4958:     let needs_relaunch = if let Some(ref mut mgr) = state.browser {
4959:         let is_external =
4960:             launch_connection_is_external(cdp_url, cdp_port, auto_connect, provider_name);
4961:         let was_external = mgr.is_cdp_connection();
4962:         let hash_changed = state.launch_hash != Some(new_hash);
4963:         let storage_state_requires_clean_launch = storage_state_owned.is_some() && !is_external;
4964:         let isolation_changed = is_external && isolate_context != mgr.is_isolated();
4965:         is_external != was_external
4966:             || hash_changed
4967:             || isolation_changed
4968:             || storage_state_requires_clean_launch
4969:             || mgr.has_process_exited()
4970:             || !mgr.is_connection_alive().await
4971:     } else {
4972:         true
4973:     };
4974: 
4975:     let had_browser_before_launch =
4976:         state.browser.is_some() || state.active_provider_session.is_some();
4977: 
4978:     if needs_relaunch {
4979:         if local_launch {
4980:             if let Some(ref ca) = effective_ca_cert {
4981:                 launch_options.prepared_nss_home = Some(prepare_nss_home(&ca.bundle)?);
4982:             }
4983:         }
4984:         if had_browser_before_launch {
4985:             let _ = auto_save_restore_state(state).await;
4986:             close_current_browser(state).await?;
4987:         }
4988:     } else {
4989:         load_storage_state(state, &storage_state_owned).await?;
4990:         state.effective_ca_cert = effective_ca_cert;
4991:         return Ok(json!({ "launched": true, "reused": true, "relaunchedBrowser": false }));
4992:     }
4993:     state.ref_map.clear();
4994:     state.session_setup = SessionSetup::default();
4995: 
4996:     let has_cdp = cdp_url.is_some() || cdp_port.is_some();
4997:     super::browser::validate_launch_options(
4998:         launch_options.extensions.as_deref(),
4999:         has_cdp,
5000:         launch_options.profile.as_deref(),
5001:         storage_state,
5002:         launch_options.allow_file_access,
5003:         launch_options.executable_path.as_deref(),
5004:         launch_options.ca_cert.as_deref(),
5005:     )?;
5006: 
5007:     // Store proxy credentials before any local or remote CDP branch enables
5008:     // Fetch interception with authentication handling.
5009:     let has_proxy_auth = launch_options.proxy_username.is_some();
5010:     if has_proxy_auth {
5011:         let mut creds = state.proxy_credentials.write().await;
5012:         *creds = Some((
5013:             launch_options.proxy_username.clone().unwrap_or_default(),
5014:             launch_options.proxy_password.clone().unwrap_or_default(),
5015:         ));
5016:     }
5017: 
5018:     if let Some(url) = cdp_url {
5019:         state.reset_input_state();
5020:         state.browser = Some(connect_external_cdp(state, url, isolate_context).await?);
5021:         state.launch_hash = Some(new_hash);
5022:         state.subscribe_to_browser_events();
5023:         state.start_fetch_handler();
5024:         state.start_dialog_handler();
5025:         apply_tab_binding_on_attach_or_rollback(state).await?;
5026:         state.update_stream_client().await;
5027:         install_network_controls_or_close(state, has_proxy_auth).await?;
5028:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5029:         try_auto_restore_state(state).await;
5030:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5031:         state.effective_ca_cert = effective_ca_cert;
5032:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5033:     }
5034: 
5035:     if let Some(port) = cdp_port {
5036:         state.reset_input_state();
5037:         state.browser =
5038:             Some(connect_external_cdp(state, &port.to_string(), isolate_context).await?);
5039:         state.launch_hash = Some(new_hash);
5040:         state.subscribe_to_browser_events();
5041:         state.start_fetch_handler();
5042:         state.start_dialog_handler();
5043:         apply_tab_binding_on_attach_or_rollback(state).await?;
5044:         state.update_stream_client().await;
5045:         install_network_controls_or_close(state, has_proxy_auth).await?;
5046:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5047:         try_auto_restore_state(state).await;
5048:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5049:         state.effective_ca_cert = effective_ca_cert;
5050:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5051:     }
5052: 
5053:     if auto_connect {
5054:         state.reset_input_state();
5055:         state.browser = Some(connect_external_auto(state, isolate_context).await?);
5056:         if !apply_tab_binding_on_attach_or_rollback(state).await? {
5057:             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
5058:                 let _ = rollback_failed_launch(state).await;
5059:                 return Err(e);
5060:             }
5061:         }
5062:         state.launch_hash = Some(new_hash);
5063:         state.subscribe_to_browser_events();
5064:         state.start_fetch_handler();
5065:         state.start_dialog_handler();
5066:         state.update_stream_client().await;
5067:         install_network_controls_or_close(state, has_proxy_auth).await?;
5068:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5069:         try_auto_restore_state(state).await;
5070:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5071:         state.effective_ca_cert = effective_ca_cert;
5072:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5073:     }
5074: 
5075:     if let Some(provider) = provider_name {
5076:         match provider.to_lowercase().as_str() {
5077:             "ios" => {
5078:                 let result = launch_ios(cmd, state).await;
5079:                 if result.is_ok() {
5080:                     state.effective_ca_cert = effective_ca_cert;
5081:                 }
5082:                 return result;
5083:             }
5084:             "safari" => {
5085:                 let result = launch_safari(cmd, state).await;
5086:                 if result.is_ok() {
5087:                     state.effective_ca_cert = effective_ca_cert;
5088:                 }
5089:                 return result;
5090:             }

SOURCE cli/src/native/actions.rs
7268:     Ok(json!({ "set": true }))
7269: }
7270: 
7271: async fn handle_download(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
7272:     let selector = cmd
7273:         .get("selector")
7274:         .and_then(|v| v.as_str())
7275:         .ok_or("Missing 'selector' parameter")?;
7276:     let path_str = cmd
7277:         .get("path")
7278:         .and_then(|v| v.as_str())
7279:         .ok_or("Missing 'path' parameter")?;
7280: 
7281:     // Resolve to absolute path and canonicalize to prevent path traversal
7282:     let raw_dest = if std::path::Path::new(path_str).is_absolute() {
7283:         PathBuf::from(path_str)
7284:     } else {
7285:         std::env::current_dir()
7286:             .map_err(|e| format!("Failed to get current directory: {}", e))?
7287:             .join(path_str)
7288:     };
7289: 
7290:     // Extract directory and desired filename
7291:     let download_dir = raw_dest
7292:         .parent()
7293:         .ok_or("Invalid download path: no parent directory")?
7294:         .to_path_buf();
7295: 
7296:     // Create the directory if it doesn't exist
7297:     std::fs::create_dir_all(&download_dir)
7298:         .map_err(|e| format!("Failed to create download directory: {}", e))?;
7299: 
7300:     // Canonicalize after mkdir so the path actually exists for resolution
7301:     let download_dir = download_dir
7302:         .canonicalize()
7303:         .map_err(|e| format!("Failed to resolve download directory: {}", e))?;
7304:     let dest = download_dir.join(
7305:         raw_dest
7306:             .file_name()
7307:             .ok_or("Invalid download path: no filename")?,
7308:     );
7309:     let download_dir_str = download_dir
7310:         .to_str()
7311:         .ok_or("Download directory path is not valid UTF-8")?;
7312: 
7313:     let mgr = state.browser.as_ref().ok_or("Browser not launched")?;
7314:     let session_id = mgr.active_session_id()?.to_string();
7315: 
7316:     // Set download behavior to save to the parent directory
7317:     mgr.set_download_behavior(download_dir_str).await?;
7318: 
7319:     // Subscribe to CDP events before clicking so we don't miss the download event
7320:     let mut rx = mgr.client.subscribe();
7321: 
7322:     // Click the element to trigger the download
7323:     interaction::click(
7324:         &mgr.client,
7325:         &session_id,
7326:         &state.ref_map,
7327:         selector,
7328:         "left",
7329:         1,
7330:         &state.iframe_sessions,
7331:     )
7332:     .await?;
7333: 
7334:     // Wait for download to complete
7335:     const DOWNLOAD_TIMEOUT: tokio::time::Duration = tokio::time::Duration::from_secs(30);
7336:     let deadline = tokio::time::Instant::now() + DOWNLOAD_TIMEOUT;
7337:     let mut downloaded_guid: Option<String> = None;
7338: 
7339:     loop {
7340:         let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
7341:         if remaining.is_zero() {
7342:             return Err("Timeout waiting for download to complete".to_string());
7343:         }
7344: 
7345:         match tokio::time::timeout(remaining, rx.recv()).await {
7346:             Ok(Ok(event)) => {
7347:                 // Browser-domain download events may arrive without a sessionId
7348:                 // or with a different sessionId than the page session, so we
7349:                 // accept them regardless. Page-domain events are matched by
7350:                 // session to avoid cross-tab confusion.
7351:                 let is_page_session = event.session_id.as_deref() == Some(&session_id);
7352:                 let is_download_event = |method: &str, browser_method: &str, page_method: &str| {
7353:                     method == browser_method || (method == page_method && is_page_session)
7354:                 };
7355: 
7356:                 // Capture the GUID from downloadWillBegin
7357:                 if is_download_event(
7358:                     &event.method,
7359:                     "Browser.downloadWillBegin",
7360:                     "Page.downloadWillBegin",
7361:                 ) {
7362:                     if let Some(guid) = event.params.get("guid").and_then(|v| v.as_str()) {
7363:                         downloaded_guid = Some(guid.to_string());
7364:                     }
7365:                 }
7366:                 // Check for download completion or cancellation
7367:                 if is_download_event(
7368:                     &event.method,
7369:                     "Browser.downloadProgress",
7370:                     "Page.downloadProgress",
7371:                 ) {
7372:                     match event.params.get("state").and_then(|v| v.as_str()) {
7373:                         Some("completed") => break,
7374:                         Some("canceled") => {
7375:                             return Err("Download was canceled".to_string());
7376:                         }
7377:                         _ => {}
7378:                     }
7379:                 }
7380:             }
7381:             Ok(Err(tokio::sync::broadcast::error::RecvError::Lagged(_))) => continue,
7382:             Ok(Err(_)) => return Err("Event stream closed".to_string()),
7383:             Err(_) => return Err("Timeout waiting for download to complete".to_string()),
7384:         }
7385:     }
7386: 
7387:     // With "allowAndName" behavior, Chrome saves the file using the GUID as filename.
7388:     // Rename it to the user-requested filename.
7389:     if let Some(guid) = downloaded_guid {
7390:         let guid_path = download_dir.join(&guid);
7391:         // Chrome may still be flushing the file to disk after signalling
7392:         // completion; wait briefly for it to appear.
7393:         for _ in 0..10 {
7394:             if guid_path.exists() {
7395:                 break;
7396:             }
7397:             tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
7398:         }
7399:         if guid_path.exists() {
7400:             std::fs::rename(&guid_path, &dest)
7401:                 .map_err(|e| format!("Failed to rename downloaded file: {}", e))?;
7402:         } else {
7403:             // The file might have been saved under its original name instead
7404:             // of the GUID (e.g. when Chrome falls back to "allow" behavior).
7405:             if !dest.exists() {
7406:                 return Err(format!(
7407:                     "Downloaded file not found at expected path (GUID: {})",
7408:                     guid
7409:                 ));
7410:             }
7411:         }
7412:     } else {
7413:         // GUID capture failed -- the file may have been saved under its original name
7414:         // by Chrome. Only return success if dest already exists (avoid touching
7415:         // unrelated files in the directory).
7416:         if !dest.exists() {
7417:             return Err(
7418:                 "Download completed but could not determine the downloaded file name".to_string(),
7419:             );
7420:         }
7421:     }
7422: 
7423:     let dest_str = dest.to_string_lossy().to_string();
7424:     Ok(json!({ "path": dest_str }))
7425: }

SOURCE cli/src/native/actions.rs
12442:     })
12443: }
12444: 
12445: async fn attach_webmcp_availability(resp: &mut Value, action: &str, state: &mut DaemonState) {
12446:     if action != "navigate"
12447:         || resp.get("success").and_then(Value::as_bool) != Some(true)
12448:         || matches!(state.backend_type, BackendType::WebDriver)
12449:         || state.engine != "chrome"
12450:         || !state.webmcp_enabled
12451:     {
12452:         return;
12453:     }
12454:     let Ok(tools) = wait_for_navigation_webmcp_tools(state).await else {
12455:         return;
12456:     };
12457:     let domain_filter = state.domain_filter.read().await;
12458:     attach_webmcp_availability_from_tools(resp, action, &tools, domain_filter.as_ref());
12459: }
12460: 
12461: async fn wait_for_navigation_webmcp_tools(
12462:     state: &mut DaemonState,
12463: ) -> Result<Vec<webmcp::ToolRecord>, String> {
12464:     let session_id = state
12465:         .browser
12466:         .as_ref()
12467:         .ok_or("Browser not launched")?
12468:         .active_session_id()?
12469:         .to_string();
12470:     let deadline =
12471:         tokio::time::Instant::now() + std::time::Duration::from_millis(webmcp::DISCOVERY_WINDOW_MS);
12472:     loop {
12473:         state.drain_cdp_events_background().await?;
12474:         let tools = state.webmcp.tools(&session_id)?;
12475:         let domain_filter = state.domain_filter.read().await;
12476:         let has_allowed_tool = webmcp_tool_count(&tools, domain_filter.as_ref()) > 0;
12477:         drop(domain_filter);
12478:         if has_allowed_tool {
12479:             return Ok(tools);
12480:         }
12481:         let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
12482:         if remaining.is_zero() {
12483:             return Ok(tools);
12484:         }
12485:         tokio::time::sleep(remaining.min(std::time::Duration::from_millis(10))).await;
12486:     }
12487: }
12488: 
12489: fn webmcp_tool_count(tools: &[webmcp::ToolRecord], domain_filter: Option<&DomainFilter>) -> usize {
12490:     tools

SOURCE cli/src/native/actions.rs
650:     pub fn new() -> Self {
651:         let session_id =
652:             env::var("AGENT_BROWSER_SESSION").unwrap_or_else(|_| "default".to_string());
653:         // A corrupt binding file is surfaced later, on attach; it does not
654:         // enable pinning here because its pinned state is unknowable.
655:         let pin_tab = matches!(
656:             env::var("AGENT_BROWSER_PIN_TAB").as_deref(),
657:             Ok("1" | "true" | "yes")
658:         ) || tab_binding::load(&session_id)
659:             .ok()
660:             .flatten()
661:             .is_some_and(|b| b.pinned);
662:         let isolate_context = matches!(
663:             env::var("AGENT_BROWSER_ISOLATE_CONTEXT").as_deref(),
664:             Ok("1" | "true" | "yes")
665:         ) || tab_binding::load(&session_id)
666:             .ok()
667:             .flatten()
668:             .is_some_and(|b| b.browser_context_id.is_some());
669:         Self {
670:             browser: None,
671:             appium: None,
672:             safari_driver: None,
673:             webdriver_backend: None,
674:             backend_type: BackendType::Cdp,
675:             ref_map: RefMap::new(),
676:             domain_filter: Arc::new(RwLock::new(
677:                 env::var("AGENT_BROWSER_ALLOWED_DOMAINS")
678:                     .ok()
679:                     .filter(|s| !s.trim().is_empty())
680:                     .map(|s| DomainFilter::new(&s)),

SOURCE cli/src/native/actions.rs
12490:     tools
12491:         .iter()
12492:         .filter(|tool| domain_filter.is_none_or(|filter| filter.check_url(&tool.origin).is_ok()))
12493:         .count()
12494: }
12495: 
12496: fn attach_webmcp_availability_from_tools(
12497:     resp: &mut Value,
12498:     action: &str,
12499:     tools: &[webmcp::ToolRecord],
12500:     domain_filter: Option<&DomainFilter>,
12501: ) {
12502:     if action != "navigate" || resp.get("success").and_then(Value::as_bool) != Some(true) {
12503:         return;
12504:     }
12505:     let tool_count = webmcp_tool_count(tools, domain_filter);
12506:     if tool_count == 0 {
12507:         return;
12508:     }
12509:     let Some(data) = resp.get_mut("data").and_then(Value::as_object_mut) else {
12510:         return;
12511:     };
12512:     data.insert(
12513:         "webmcp".to_string(),
12514:         json!({
12515:             "experimental": true,
12516:             "available": true,
12517:             "toolCount": tool_count,
12518:         }),
12519:     );
12520: }
12521: 
12522: fn inject_lifecycle(
12523:     resp: &mut Value,
12524:     state: &DaemonState,
12525:     reused: bool,
12526:     launched: bool,
12527:     relaunched_browser: bool,
12528: ) {
12529:     if resp.get("success").and_then(|v| v.as_bool()) != Some(true) {
12530:         return;
12531:     }
12532: 
12533:     let Some(data) = resp.get_mut("data") else {
12534:         return;
12535:     };
12536:     let Some(obj) = data.as_object_mut() else {
12537:         return;
12538:     };
12539: 
12540:     let data_reused = obj.get("reused").and_then(|v| v.as_bool()).unwrap_or(false);
12541:     let data_launched = obj
12542:         .get("launched")
12543:         .and_then(|v| v.as_bool())
12544:         .unwrap_or(false);
12545:     let data_relaunched = obj
12546:         .get("relaunchedBrowser")
12547:         .and_then(|v| v.as_bool())
12548:         .unwrap_or(false);
12549:     let effective_reused = reused || data_reused;
12550:     let effective_launched = launched || data_launched;
12551:     let effective_relaunched = relaunched_browser || data_relaunched;
12552: 
12553:     obj.insert(
12554:         "lifecycle".to_string(),
12555:         json!({
12556:             "reused": effective_reused,
12557:             "launched": effective_launched,
12558:             "relaunchedBrowser": effective_relaunched,
12559:             "restartedBackground": false,
12560:             "contextRecreated": state.context_recreated,
12561:             "restoreStatus": state.restore_status,
12562:             "saveStatus": state.restore_save_status,
12563:             "effectiveLaunch": {
12564:                 "browserLaunched": state.browser.is_some(),
12565:                 "engine": state.engine,
12566:                 "launchHash": state.launch_hash,
12567:             }
12568:         }),
12569:     );
12570: }
12571: 
12572: fn error_response(id: &str, error: &str) -> Value {
12573:     let mut resp = json!({
12574:         "id": id,
12575:         "success": false,
12576:         "error": error,
12577:     });
12578:     // Machine-readable code for "the bound tab no longer exists" so scripts
12579:     // using --json can match on it instead of parsing the message.
12580:     if error.starts_with(super::browser::TAB_GONE_PREFIX) {
12581:         resp["code"] = json!("tab_gone");
12582:     } else if let Some((code, _)) = error.split_once(": ") {
12583:         if code.starts_with("webmcp_") {
12584:             resp["code"] = json!(code);
12585:         }
12586:     }
12587:     resp
12588: }
12589: 
12590: fn attach_tab_gone_data(resp: &mut Value, state: &DaemonState) {
12591:     if resp.get("code").and_then(Value::as_str) != Some("tab_gone") {
12592:         return;
12593:     }
12594:     let Some((target_id, last_url)) = state
12595:         .browser
12596:         .as_ref()
12597:         .and_then(BrowserManager::bound_target_gone_details)
12598:     else {
12599:         return;
12600:     };
12601: 
12602:     let mut data = json!({ "targetId": target_id });
12603:     if !last_url.is_empty() {
12604:         data["lastUrl"] = json!(last_url);
12605:     }
12606:     resp["data"] = data;
12607: }
12608: 
12609: #[cfg(test)]
12610: mod tests {
12611:     use super::super::cdp::types::{AXNode, AXValue};
12612:     use super::*;
12613:     use crate::test_utils::EnvGuard;
12614:     use std::fs;
12615:     use tokio::io::{AsyncReadExt, AsyncWriteExt};

SOURCE cli/src/native/actions.rs
14240:         assert_eq!(resp["id"], "cmd-1");
14241:         assert_eq!(resp["success"], true);
14242:         assert!(resp["data"].is_object());
14243:         assert_eq!(resp["data"]["url"], "https://example.com");
14244:     }
14245: 
14246:     #[tokio::test]
14247:     #[ignore]
14248:     async fn test_isolation_commit_requires_a_durable_context_without_a_target() {
14249:         let guard = EnvGuard::new(&[
14250:             "AGENT_BROWSER_SOCKET_DIR",
14251:             "XDG_RUNTIME_DIR",
14252:             "AGENT_BROWSER_SESSION",
14253:             "AGENT_BROWSER_ISOLATE_CONTEXT",
14254:         ]);
14255:         let dir = tempfile::tempdir().unwrap();
14256:         guard.set("AGENT_BROWSER_SOCKET_DIR", dir.path().to_str().unwrap());
14257:         guard.remove("XDG_RUNTIME_DIR");
14258:         guard.set("AGENT_BROWSER_SESSION", "isolation-missing-target");
14259:         guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
14260:         let mut host = BrowserManager::launch(LaunchOptions::default(), None)
14261:             .await
14262:             .unwrap();
14263:         for persisted in [false, true] {
14264:             let mut state = DaemonState::new();
14265:             let manager = BrowserManager::connect_cdp_isolated(host.get_cdp_url(), None)
14266:                 .await
14267:                 .unwrap();
14268:             let (target, _) = manager.binding_snapshot().unwrap();
14269:             state.browser = Some(manager);
14270:             state.subscribe_to_browser_events();
14271:             if persisted {
14272:                 commit_isolated_connection(&mut state).await.unwrap();
14273:             }
14274:             host.client
14275:                 .send_command(
14276:                     "Target.closeTarget",
14277:                     Some(json!({"targetId": target})),
14278:                     None,
14279:                 )
14280:                 .await
14281:                 .unwrap();
14282:             tokio::time::timeout(std::time::Duration::from_secs(5), async {
14283:                 loop {
14284:                     state.drain_cdp_events_background().await.unwrap();
14285:                     if state.browser.as_ref().unwrap().binding_snapshot().is_none() {
14286:                         break;
14287:                     }
14288:                     tokio::time::sleep(std::time::Duration::from_millis(10)).await;
14289:                 }
14290:             })
14291:             .await
14292:             .unwrap();
14293:             let result = commit_isolated_connection(&mut state).await;
14294:             if persisted {
14295:                 assert!(result.is_ok(), "{result:?}");
14296:                 assert!(state.isolate_context);
14297:                 assert!(state.browser.is_some());
14298:                 assert!(DaemonState::new().isolate_context);
14299:                 close_current_browser(&mut state).await.unwrap();
14300:             } else {
14301:                 assert!(result.is_err(), "{result:?}");
14302:                 assert!(!state.isolate_context);
14303:                 assert!(state.browser.is_none());
14304:                 assert!(tab_binding::load(&state.session_id).unwrap().is_none());
14305:                 let contexts = host
14306:                     .client
14307:                     .send_command_no_params("Target.getBrowserContexts", None)
14308:                     .await
14309:                     .unwrap();
14310:                 assert!(contexts["browserContextIds"].as_array().unwrap().is_empty());
14311:             }
14312:         }
14313:         host.close().await.unwrap();
14314:     }
14315: 
14316:     #[tokio::test]
14317:     async fn test_isolation_invalid_launch_does_not_change_sticky_state() {
14318:         let guard = EnvGuard::new(&["AGENT_BROWSER_ISOLATE_CONTEXT"]);
14319:         guard.remove("AGENT_BROWSER_ISOLATE_CONTEXT");
14320:         for prior in [false, true] {
14321:             for cmd in [
14322:                 json!({"id": "invalid", "action": "launch", "isolateContext": true}),
14323:                 json!({"id": "invalid", "action": "launch", "isolateContext": true, "provider": "ios"}),

SOURCE cli/src/native/browser.rs
565:         }
566: 
567:         if let Some(ref ua) = user_agent {
568:             let _ = manager
569:                 .client
570:                 .send_command(
571:                     "Emulation.setUserAgentOverride",
572:                     Some(json!({ "userAgent": ua })),
573:                     Some(&session_id),
574:                 )
575:                 .await;
576:         }
577: 
578:         if let Some(ref scheme) = color_scheme {
579:             let _ = manager
580:                 .client
581:                 .send_command(
582:                     "Emulation.setEmulatedMedia",
583:                     Some(json!({ "features": [{ "name": "prefers-color-scheme", "value": scheme }] })),
584:                     Some(&session_id),
585:                 )
586:                 .await;
587:         }
588: 
589:         if let Some(ref path) = download_path {
590:             let _ = manager
591:                 .client
592:                 .send_command(
593:                     "Browser.setDownloadBehavior",
594:                     Some(json!({ "behavior": "allow", "downloadPath": path })),
595:                     None,
596:                 )
597:                 .await;
598:         }
599: 
600:         Ok(manager)
601:     }
602: 
603:     pub async fn connect_cdp(url: &str) -> Result<Self, String> {
604:         Self::connect_cdp_inner(url, false, None, None).await
605:     }
606: 
607:     pub async fn connect_cdp_isolated(
608:         url: &str,
609:         persisted_context_id: Option<&str>,
610:     ) -> Result<Self, String> {

SOURCE cli/src/native/browser.rs
1460:     /// Returns true if this manager was connected via CDP (as opposed to local launch).
1461:     pub fn is_cdp_connection(&self) -> bool {
1462:         self.browser_process.is_none()
1463:     }
1464: 
1465:     pub fn is_direct_page_connection(&self) -> bool {
1466:         self.direct_page
1467:     }
1468: 
1469:     pub fn isolated_context_id(&self) -> Option<&str> {
1470:         self.primary_browser_context_id.as_deref()
1471:     }
1472: 
1473:     pub fn context_recreated(&self) -> bool {
1474:         self.context_recreated
1475:     }
1476: 
1477:     pub fn is_isolated(&self) -> bool {
1478:         self.primary_browser_context_id.is_some()
1479:     }
1480: 
1481:     pub fn owns_target(&self, target: &TargetInfo) -> bool {
1482:         self.primary_browser_context_id.is_none()
1483:             || target
1484:                 .browser_context_id
1485:                 .as_ref()

SOURCE cli/src/native/browser.rs
610:     ) -> Result<Self, String> {
611:         Self::connect_cdp_inner(
612:             url,
613:             false,
614:             None,
615:             Some(persisted_context_id.map(str::to_string)),
616:         )
617:         .await
618:     }
619: 
620:     /// Connect to a provider CDP proxy where the WebSocket IS the page session.
621:     /// Skips browser-level Target.* commands that most proxies don't support.
622:     pub async fn connect_cdp_direct(url: &str) -> Result<Self, String> {
623:         Self::connect_cdp_inner(url, true, None, None).await
624:     }
625: 
626:     pub async fn connect_cdp_with_headers(
627:         url: &str,
628:         headers: Option<Vec<(String, String)>>,
629:     ) -> Result<Self, String> {
630:         Self::connect_cdp_inner(url, false, headers, None).await
631:     }
632: 
633:     async fn connect_cdp_inner(
634:         url: &str,
635:         direct_page: bool,
636:         headers: Option<Vec<(String, String)>>,
637:         isolation: Option<Option<String>>,
638:     ) -> Result<Self, String> {
639:         let ws_url = resolve_cdp_url(url).await?;
640:         let client = Arc::new(CdpClient::connect_with_headers(&ws_url, headers).await?);
641:         let mut manager = Self {
642:             client,
643:             browser_process: None,
644:             ws_url,
645:             pages: Vec::new(),
646:             active_page_index: 0,
647:             default_timeout_ms: 25_000,
648:             download_path: None,
649:             ignore_https_errors: false,
650:             visited_origins: HashSet::new(),
651:             next_tab_id: 1,
652:             direct_page,
653:             pin_tab: false,
654:             bound_target_id: None,
655:             bound_target_gone: None,
656:             primary_browser_context_id: None,
657:             owned_browser_context_ids: HashSet::new(),
658:             context_recreated: false,
659:             isolated_context_unpersisted: false,
660:             headless: true,
661:         };
662: 
663:         if direct_page {
664:             if isolation.is_some() {
665:                 return Err(
666:                     "--isolate-context is not supported by direct-page CDP providers".to_string(),
667:                 );
668:             }
669:             let tab_id = manager.assign_tab_id();
670:             manager.pages.push(PageInfo {
671:                 tab_id,
672:                 label: None,
673:                 target_id: "provider-page".to_string(),
674:                 session_id: String::new(),
675:                 browser_context_id: None,
676:                 url: String::new(),
677:                 title: String::new(),
678:                 target_type: "page".to_string(),
679:             });
680:             manager.active_page_index = 0;
681:             manager.enable_domains_direct().await?;
682:         } else {
683:             if let Some(persisted_context_id) = isolation {
684:                 manager
685:                     .initialize_isolated_context(persisted_context_id.as_deref())
686:                     .await?;
687:             }
688:             if let Err(error) = manager.discover_and_attach_targets().await {
689:                 let _ = manager.dispose_unpersisted_isolated_context().await;
690:                 return Err(error);
691:             }
692:         }
693:         Ok(manager)
694:     }
695: 
696:     pub async fn connect_auto() -> Result<Self, String> {
697:         let ws_url = auto_connect_cdp().await?;
698:         Self::connect_cdp(&ws_url).await
699:     }
700: 
701:     pub async fn connect_auto_isolated(persisted_context_id: Option<&str>) -> Result<Self, String> {
702:         let ws_url = auto_connect_cdp().await?;
703:         Self::connect_cdp_isolated(&ws_url, persisted_context_id).await
704:     }
705: 
706:     async fn initialize_isolated_context(
707:         &mut self,
708:         persisted_context_id: Option<&str>,
709:     ) -> Result<(), String> {
710:         let existing = self
711:             .client
712:             .send_command_no_params("Target.getBrowserContexts", None)
713:             .await?
714:             .get("browserContextIds")
715:             .and_then(Value::as_array)
716:             .cloned()
717:             .unwrap_or_default();
718:         let persisted_exists = persisted_context_id
719:             .is_some_and(|wanted| existing.iter().any(|id| id.as_str() == Some(wanted)));
720:         let context_id = if persisted_exists {
721:             persisted_context_id.unwrap().to_string()
722:         } else {
723:             let result = self
724:                 .client
725:                 .send_command_no_params("Target.createBrowserContext", None)
726:                 .await?;
727:             self.context_recreated = persisted_context_id.is_some();
728:             result
729:                 .get("browserContextId")
730:                 .and_then(Value::as_str)
731:                 .ok_or("Target.createBrowserContext did not return browserContextId")?
732:                 .to_string()
733:         };
734:         self.primary_browser_context_id = Some(context_id.clone());
735:         self.owned_browser_context_ids.insert(context_id);
736:         self.isolated_context_unpersisted = !persisted_exists;
737:         Ok(())
738:     }
739: 
740:     async fn discover_and_attach_targets(&mut self) -> Result<(), String> {

SOURCE cli/src/native/browser.rs
1500: 
1501:     pub fn mark_isolated_context_persisted(&mut self) {
1502:         self.isolated_context_unpersisted = false;
1503:     }
1504: 
1505:     pub fn has_unpersisted_isolated_context(&self) -> bool {
1506:         self.isolated_context_unpersisted
1507:     }
1508: 
1509:     pub async fn dispose_unpersisted_isolated_context(&mut self) -> Result<(), String> {
1510:         if !self.isolated_context_unpersisted {
1511:             return Ok(());
1512:         }
1513:         let Some(context_id) = self.primary_browser_context_id.clone() else {
1514:             return Ok(());
1515:         };
1516:         self.dispose_browser_context(&context_id).await
1517:     }
1518: 
1519:     pub async fn dispose_browser_context(&mut self, context_id: &str) -> Result<(), String> {
1520:         self.client
1521:             .send_command(
1522:                 "Target.disposeBrowserContext",
1523:                 Some(json!({ "browserContextId": context_id })),
1524:                 None,
1525:             )
1526:             .await?;
1527:         self.unregister_owned_context(context_id);
1528:         self.pages
1529:             .retain(|page| page.browser_context_id.as_deref() != Some(context_id));
1530:         self.update_active_page_if_needed();
1531:         Ok(())
1532:     }
1533: 
1534:     pub async fn dispose_owned_contexts(&mut self) -> Result<(), String> {
1535:         let primary = self.primary_browser_context_id.clone();
1536:         self.dispose_child_contexts().await?;
1537:         if let Some(context_id) = primary {
1538:             self.dispose_browser_context(&context_id).await?;

SOURCE cli/src/native/browser.rs
2255:         }
2256:     }
2257: 
2258:     /// The active page's `(target_id, url)` for binding persistence, or
2259:     /// `None` when there is no page or the bound tab is gone (a stale
2260:     /// binding must not be overwritten by the fallback tab).
2261:     pub fn binding_snapshot(&self) -> Option<(String, String)> {
2262:         if self.bound_target_is_gone() {
2263:             return None;
2264:         }
2265:         self.pages
2266:             .get(self.active_page_index)
2267:             .map(|p| (p.target_id.clone(), p.url.clone()))
2268:     }
2269: 
2270:     pub fn update_page_target_info(&mut self, target: &TargetInfo) -> bool {
2271:         update_page_target_info_in_pages(&mut self.pages, target)
2272:     }
2273: 
2274:     pub fn remove_page_by_target_id(&mut self, target_id: &str) {
2275:         if let Some(pos) = self.pages.iter().position(|p| p.target_id == target_id) {
2276:             let page = self.pages.remove(pos);
2277:             self.update_active_page_after_removal(pos);
2278:             // If the destroyed target was the bound tab (closed externally,
2279:             // e.g. by another session sharing this browser), fail loudly
2280:             // under pin-tab instead of silently pointing at a neighbor.

SOURCE cli/src/native/tab_binding.rs
1: //! Persistent session to tab binding.
2: //!
3: //! Each daemon session can be bound to a single CDP target (tab). The binding
4: //! is written to `{session}.target` in the daemon socket directory as a small
5: //! JSON document and, unlike the other per-session files (`.pid`, `.sock`,
6: //! `.stream`, ...), it intentionally survives daemon restarts. On the next
7: //! attach over CDP the daemon re-selects the bound target by `targetId`
8: //! instead of adopting whatever tab happens to be first in
9: //! `Target.getTargets` (the most recently active one, which in a shared
10: //! browser is usually another session's tab).
11: //!
12: //! The `pinned` field makes `--pin-tab` sticky for the session: once a
13: //! session is created with `--pin-tab`, subsequent commands and daemon
14: //! restarts keep the strict semantics without repeating the flag. Because a
15: //! lost or corrupt binding silently drops that safety boundary, writes are
16: //! atomic (temp file + rename), owner-only, and fsynced, and both `save` and
17: //! `load` report failures instead of swallowing them.
18: 
19: use serde::{Deserialize, Serialize};
20: use std::fs;
21: use std::io::Write;
22: use std::path::PathBuf;
23: 
24: /// A persisted session to tab binding.
25: #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
26: pub struct TabBinding {
27:     /// CDP target id of the bound tab. Stable across daemon restarts (unlike
28:     /// `t<N>` ids, which are per-daemon counters).
29:     #[serde(rename = "targetId")]
30:     pub target_id: String,
31:     /// Last known URL of the bound tab, used for actionable error messages
32:     /// when the tab is gone. Sanitized before persistence: credentials,
33:     /// query, and fragment are stripped (see [`sanitize_url`]).
34:     #[serde(default)]
35:     pub url: String,
36:     /// Whether strict pin-tab semantics are enabled for this session.
37:     #[serde(default)]
38:     pub pinned: bool,
39:     #[serde(skip)]
40:     pub browser_context_id: Option<String>,
41: }
42: 
43: #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
44: #[serde(rename_all = "camelCase")]
45: struct IsolatedTargetBinding {
46:     target_id: String,
47:     #[serde(default)]
48:     url: String,
49:     #[serde(default)]
50:     pinned: bool,
51: }
52: 
53: #[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
54: #[serde(rename_all = "camelCase")]
55: struct IsolatedBindingV1 {
56:     format: String,
57:     version: u32,
58:     browser_context_id: String,
59:     target: IsolatedTargetBinding,
60: }
61: 
62: const ISOLATED_BINDING_FORMAT: &str = "agent-browser-isolated-context";
63: const ISOLATED_BINDING_VERSION: u32 = 1;
64: 
65: /// Path of the binding file for a session: `{socket_dir}/{session}.target`.
66: pub fn binding_path(session: &str) -> PathBuf {
67:     crate::connection::get_socket_dir().join(format!("{}.target", session))
68: }
69: 
70: /// Reduce a URL to safe diagnostic information before it is persisted or
71: /// included in a `tab_gone` error. HTTP and HTTPS retain their origin and
72: /// path while credentials, query parameters, and fragments are stripped.
73: /// `about:blank` is retained exactly. Other schemes and malformed URLs are
74: /// dropped because their opaque payloads may contain secrets.
75: pub fn sanitize_url(raw: &str) -> String {
76:     if raw == "about:blank" {
77:         return raw.to_string();
78:     }
79: 
80:     match url::Url::parse(raw) {
81:         Ok(mut parsed) if matches!(parsed.scheme(), "http" | "https") => {
82:             let _ = parsed.set_username("");
83:             let _ = parsed.set_password(None);
84:             parsed.set_query(None);
85:             parsed.set_fragment(None);
86:             parsed.to_string()
87:         }
88:         _ => String::new(),
89:     }
90: }
91: 
92: /// Load the persisted binding for a session. `Ok(None)` means no binding
93: /// exists; `Err` means a binding file is present but unreadable or corrupt.
94: /// Callers must not treat `Err` as a first-time session: a corrupt file may
95: /// have carried `pinned: true`, and silently dropping it would remove the
96: /// strict isolation boundary.
97: pub fn load(session: &str) -> Result<Option<TabBinding>, String> {
98:     let path = binding_path(session);
99:     let raw = match fs::read_to_string(&path) {
100:         Ok(raw) => raw,
101:         Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
102:         Err(e) => {
103:             return Err(format!(
104:                 "cannot read tab binding file {}: {}",
105:                 path.display(),
106:                 e
107:             ))
108:         }
109:     };
110:     let value: serde_json::Value = serde_json::from_str(&raw)
111:         .map_err(|e| format!("corrupt tab binding file {}: {}", path.display(), e))?;
112:     if value.get("format").is_some() || value.get("version").is_some() {
113:         let isolated: IsolatedBindingV1 = serde_json::from_value(value)
114:             .map_err(|e| format!("corrupt tab binding file {}: {}", path.display(), e))?;
115:         if isolated.format != ISOLATED_BINDING_FORMAT
116:             || isolated.version != ISOLATED_BINDING_VERSION
117:         {
118:             return Err(format!(
119:                 "unsupported isolated tab binding in {}: format {}, version {}",
120:                 path.display(),
121:                 isolated.format,
122:                 isolated.version
123:             ));
124:         }
125:         return Ok(Some(TabBinding {
126:             target_id: isolated.target.target_id,
127:             url: isolated.target.url,
128:             pinned: isolated.target.pinned,
129:             browser_context_id: Some(isolated.browser_context_id),
130:         }));
131:     }
132:     let mut binding: TabBinding = serde_json::from_value(value)
133:         .map_err(|e| format!("corrupt tab binding file {}: {}", path.display(), e))?;
134:     binding.browser_context_id = None;
135:     Ok(Some(binding))
136: }
137: 
138: /// Persist the binding for a session (write-on-change is the caller's
139: /// responsibility). The write is atomic: the JSON is serialized first, then
140: /// written to an owner-only temp file in the same directory, fsynced, and
141: /// renamed over the destination, so a crash never leaves a truncated or
142: /// half-written binding. Errors are returned so callers can retry on the
143: /// next command instead of silently losing the binding.
144: pub fn save(session: &str, binding: &TabBinding) -> Result<(), String> {
145:     let path = binding_path(session);
146:     let mut safe_binding = binding.clone();
147:     safe_binding.url = sanitize_url(&safe_binding.url);
148:     let raw = if let Some(browser_context_id) = safe_binding.browser_context_id.clone() {
149:         serde_json::to_string(&IsolatedBindingV1 {
150:             format: ISOLATED_BINDING_FORMAT.to_string(),
151:             version: ISOLATED_BINDING_VERSION,
152:             browser_context_id,
153:             target: IsolatedTargetBinding {
154:                 target_id: safe_binding.target_id,
155:                 url: safe_binding.url,
156:                 pinned: safe_binding.pinned,
157:             },
158:         })
159:     } else {
160:         serde_json::to_string(&safe_binding)
161:     }
162:     .map_err(|e| format!("cannot serialize tab binding: {}", e))?;
163:     if let Some(dir) = path.parent() {
164:         fs::create_dir_all(dir)
165:             .map_err(|e| format!("cannot create socket dir {}: {}", dir.display(), e))?;
166:     }
167:     let tmp = path.with_extension(format!("target.tmp.{}", std::process::id()));
168:     let write_result = (|| -> Result<(), String> {
169:         let mut options = fs::OpenOptions::new();
170:         options.write(true).create(true).truncate(true);
171:         #[cfg(unix)]
172:         {
173:             use std::os::unix::fs::OpenOptionsExt;
174:             options.mode(0o600);
175:         }
176:         let mut file = options
177:             .open(&tmp)
178:             .map_err(|e| format!("cannot create tab binding file {}: {}", tmp.display(), e))?;
179:         file.write_all(raw.as_bytes())
180:             .map_err(|e| format!("cannot write tab binding file {}: {}", tmp.display(), e))?;
181:         file.sync_all()
182:             .map_err(|e| format!("cannot sync tab binding file {}: {}", tmp.display(), e))?;
183:         drop(file);
184:         fs::rename(&tmp, &path).map_err(|e| {
185:             format!(
186:                 "cannot rename tab binding file {} to {}: {}",
187:                 tmp.display(),
188:                 path.display(),
189:                 e
190:             )
191:         })
192:     })();
193:     if write_result.is_err() {
194:         let _ = fs::remove_file(&tmp);
195:     }
196:     write_result
197: }
198: 
199: pub fn ensure_writable(session: &str) -> Result<(), String> {
200:     let path = binding_path(session);
201:     let dir = path
202:         .parent()
203:         .ok_or_else(|| format!("invalid tab binding path {}", path.display()))?;
204:     fs::create_dir_all(dir)
205:         .map_err(|e| format!("cannot create socket dir {}: {}", dir.display(), e))?;
206:     let probe = path.with_extension(format!("target.probe.{}", std::process::id()));
207:     let mut options = fs::OpenOptions::new();
208:     options.write(true).create_new(true);
209:     #[cfg(unix)]
210:     {
211:         use std::os::unix::fs::OpenOptionsExt;
212:         options.mode(0o600);
213:     }
214:     let file = options
215:         .open(&probe)
216:         .map_err(|e| format!("cannot create tab binding probe {}: {}", probe.display(), e))?;
217:     file.sync_all()
218:         .map_err(|e| format!("cannot sync tab binding probe {}: {}", probe.display(), e))?;
219:     drop(file);
220:     fs::remove_file(&probe)
221:         .map_err(|e| format!("cannot remove tab binding probe {}: {}", probe.display(), e))
222: }
223: 
224: /// Remove the persisted binding for a session.
225: pub fn clear(session: &str) {
226:     let _ = fs::remove_file(binding_path(session));
227: }
228: 
229: #[cfg(test)]
230: mod tests {
231:     use super::*;
232: 
233:     fn with_socket_dir<F: FnOnce()>(f: F) {
234:         let guard = crate::test_utils::EnvGuard::new(&[
235:             "AGENT_BROWSER_SOCKET_DIR",

SOURCE cli/src/main.rs
103: fn attach_allowed_domains_to_launch_command(launch_cmd: &mut serde_json::Value, flags: &Flags) {
104:     if let Some(ref domains) = flags.allowed_domains {
105:         launch_cmd["allowedDomains"] = json!(domains);
106:     }
107: }
108: 
109: fn attach_pin_tab_to_command(cmd: &mut serde_json::Value, flags: &Flags) {
110:     if flags.pin_tab {
111:         cmd["pinTab"] = json!(true);
112:     } else if flags.cli_pin_tab {
113:         cmd["pinTab"] = json!(false);
114:     }
115: }
116: 
117: fn attach_isolate_context_to_command(cmd: &mut serde_json::Value, flags: &Flags) {
118:     if flags.isolate_context {
119:         cmd["isolateContext"] = json!(true);
120:     }
121: }
122: 
123: fn attach_plugins_to_command(cmd: &mut serde_json::Value, plugins: &[plugins::PluginConfig]) {
124:     cmd["plugins"] = json!(plugins);
125: }
126: 
127: fn command_is_external_launch(cmd: &serde_json::Value) -> bool {
128:     cmd.get("action").and_then(|value| value.as_str()) == Some("launch")

SOURCE cli/src/main.rs
1580:             }
1581:             let pass = pass.trim_end_matches('\n').trim_end_matches('\r');
1582:             if pass.is_empty() {
1583:                 eprintln!("{} Password from stdin is empty", color::error_indicator());
1584:                 exit(1);
1585:             }
1586:             cmd["password"] = json!(pass);
1587:             cmd.as_object_mut().unwrap().remove("passwordStdin");
1588:         }
1589:     }
1590: 
1591:     // Send plugin config with commands so an already-running daemon can use
1592:     // current config without a restart. The daemon strips this from stream
1593:     // broadcasts before observers see the command payload.
1594:     attach_plugins_to_command(&mut cmd, &flags.plugins);
1595: 
1596:     attach_pin_tab_to_command(&mut cmd, &flags);
1597:     attach_isolate_context_to_command(&mut cmd, &flags);
1598:     attach_restore_config_to_command(&mut cmd, &flags);
1599: 
1600:     // Validate restore/session persistence name before starting daemon
1601:     if let Some(name) = restore_key_from_flags(&flags) {
1602:         if !validation::is_valid_session_name(name) {
1603:             let msg = validation::session_name_error(name);
1604:             if flags.json {

SOURCE cli/src/main.rs
1744:     let daemon_restarted = daemon_result.restarted;
1745: 
1746:     // Auto-connect to existing browser. This is sent even when the daemon is
1747:     // already running so launch compatibility stays idempotent.
1748:     if flags.auto_connect {
1749:         let mut launch_cmd = json!({
1750:             "id": gen_id(),
1751:             "action": "launch",
1752:             "autoConnect": true
1753:         });
1754:         attach_script_launch_options(&mut launch_cmd, &flags);
1755:         attach_webmcp_launch_option(&mut launch_cmd, &flags);
1756:         attach_allowed_domains_to_launch_command(&mut launch_cmd, &flags);
1757:         attach_pin_tab_to_command(&mut launch_cmd, &flags);
1758:         attach_isolate_context_to_command(&mut launch_cmd, &flags);
1759:         attach_restore_config_to_command(&mut launch_cmd, &flags);
1760: 
1761:         if flags.ignore_https_errors {
1762:             launch_cmd["ignoreHTTPSErrors"] = json!(true);
1763:         }
1764: 
1765:         attach_ca_cert_to_launch_command(&mut launch_cmd, &flags);
1766: 
1767:         if let Some(ref cs) = flags.color_scheme {
1768:             launch_cmd["colorScheme"] = json!(cs);
1769:         }
1770: 

SOURCE cli/src/main.rs
1848:             json!({
1849:                 "id": gen_id(),
1850:                 "action": "launch",
1851:                 "cdpPort": cdp_port
1852:             })
1853:         };
1854: 
1855:         let mut launch_cmd = launch_cmd;
1856:         attach_script_launch_options(&mut launch_cmd, &flags);
1857:         attach_webmcp_launch_option(&mut launch_cmd, &flags);
1858:         attach_allowed_domains_to_launch_command(&mut launch_cmd, &flags);
1859:         attach_pin_tab_to_command(&mut launch_cmd, &flags);
1860:         attach_isolate_context_to_command(&mut launch_cmd, &flags);
1861:         attach_restore_config_to_command(&mut launch_cmd, &flags);
1862: 
1863:         if flags.ignore_https_errors {
1864:             launch_cmd["ignoreHTTPSErrors"] = json!(true);
1865:         }
1866: 
1867:         attach_ca_cert_to_launch_command(&mut launch_cmd, &flags);
1868: 

SOURCE cli/src/main.rs
2215:                         exit(1);
2216:                     }
2217:                 }
2218:                 continue;
2219:             }
2220:         };
2221: 
2222:         let action = parsed
2223:             .get("action")
2224:             .and_then(|v| v.as_str())
2225:             .map(|s| s.to_string());
2226:         attach_plugins_to_command(&mut parsed, &flags.plugins);
2227:         attach_restore_config_to_command(&mut parsed, flags);
2228: 
2229:         attach_pin_tab_to_command(&mut parsed, flags);
2230:         attach_isolate_context_to_command(&mut parsed, flags);
2231: 
2232:         match send_command_with_respawn(parsed, &flags.session, daemon_opts) {
2233:             Ok(resp) => {
2234:                 if flags.json {
2235:                     let mut result = json!({
2236:                         "command": cmd_args,
2237:                         "success": resp.success,
2238:                         "result": resp.data,
2239:                         "error": resp.error,
2240:                     });
