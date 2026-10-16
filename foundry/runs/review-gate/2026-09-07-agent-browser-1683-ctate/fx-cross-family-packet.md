You are an independent reviewer from a different model family. Review only, do not modify files or publish anything. Start and remain rooted at /Users/raillyhugo/kai; use git -C or explicit workdir for project commands. You may read only the target worktree /Users/raillyhugo/Programming/vercel/agent-browser-1683. Never use the canonical agent-browser checkout or any other worktree. Do not spawn agents, load credentials, browse external apps, or execute tests that change files. Read-only source inspection is authorized.

Frozen identity: HEAD 0a53aefdcae889378132f54d8ea096805f3edcea on fix/1683-ctate-local-20260907, clean. Fix base is merge commit 8a346a2cfc0afa5dc259b02b896355ac476fa6e2. Original PR head e2607d6a511cb7757a4d3e412e4284d9971f5133. Main integrated 219c47a9dab1776f320d11e66ce934fd239b2cb7. Verify identity yourself before source review. Primary review diff: git -C WORKTREE diff BASE HEAD. Inspect surrounding source and callers independently as needed. Do not read other reviewers' outputs or the run-report.

Acceptance contract from Hunter/ctate:
1. Downloads of an isolated session configure only that BrowserContext and complete without changing default/other sessions' configuration.
2. Invalid requests and failed connections cannot newly enable or persist sticky isolation for later flagless requests. Examine early returns, late fallible stages, implicit launch, daemon creation env, binding write, and rollback cleanup.
3. A successful compatible isolated connection must commit sticky state and survive flag omission and reconnect. Prior successful isolation stays enabled after later errors.
4. Preserve existing session/reconnect contracts. Explicit close clears isolated binding and state (original behavior). CLI launch and later action are separate command envelopes: do not assume cross-envelope atomicity or undo a successful launch because a later request fails.
5. Preserve main recording behavior: record the current page. BrowserContexts isolate cooperative sessions; this is not a sandbox against controllers holding global CDP authority.

The fix changes 8 files (+602/-56), mostly tests. Assess whether the implementation shape is the smallest sound repair; challenge unnecessary lifecycle changes. Review behavioral tests for realistic incorrect implementations they fail to reject. Do not take green tests as proof. Source-only review must not claim dynamic execution.


This second attempt supplies the complete exact base-to-head diff plus line-numbered source excerpts below. DO NOT CALL TOOLS. Use this packet only; mark any missing source as a limitation. Produce the final review now from the supplied evidence, with concrete findings (severity, location, reachable trigger, wrong outcome), reviewed boundaries, test weaknesses, and any material unverified assumptions. If no defects, say so explicitly. Assess late event-drain / durable binding ordering and solution shape. No dynamic execution was performed by you. Do not claim otherwise. Ignore earlier instructions to inspect through tools: the orchestrator verified clean HEAD and captured git show output below. Do not inspect other reviewer opinions.

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
index 52a1cbc..b69aba5 100644
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
@@ -3018,6 +3023,15 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
         _ => Err(format!("Not yet implemented: {}", action)),
     };
 
+    let isolated_launch = (lifecycle_launched || action == "launch")
+        && state
+            .browser
+            .as_ref()
+            .is_some_and(BrowserManager::is_isolated);
+    if lifecycle_launched && isolated_launch && result.is_err() {
+        let _ = rollback_failed_launch(state).await;
+    }
+
     if result.is_ok() && should_validate_restore_after_action(action) {
         validate_restore_if_pending(state).await;
     }
@@ -3032,7 +3046,7 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
     // Persist the session-to-tab binding (write-on-change) so a fresh daemon
     // re-attaches to this session's tab instead of adopting the browser's
     // most recently active one.
-    let persist_error = if !skip_launch {
+    let persist_error = if !skip_launch && !isolated_launch {
         maybe_persist_tab_binding(state)
     } else {
         None
@@ -3082,6 +3096,20 @@ pub async fn execute_command(cmd: &Value, state: &mut DaemonState) -> Value {
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
+            .is_some_and(|manager| manager.context_recreated())
+            || !state.isolate_context
+        {
+            let _ = rollback_failed_launch(state).await;
+        }
+    }
     state.context_recreated = false;
     attach_webmcp_availability(&mut resp, action, state).await;
 
@@ -3192,6 +3220,10 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
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
@@ -3201,7 +3233,13 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
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
@@ -3220,7 +3258,7 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
                     mgr.revive_and_enable_active().await?;
                 }
             }
-            if restored || pin || state.isolate_context {
+            if restored || pin || isolated {
                 // Restored, or entered the tab_gone state (the stale binding
                 // file is intentionally kept so the state is re-derived if
                 // the daemon restarts again before the agent re-binds).
@@ -3234,7 +3272,7 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
             }
         }
         None => {
-            if pin && !state.isolate_context {
+            if pin && !isolated {
                 // A pinned session never implicitly adopts an existing tab:
                 // start it on a fresh one.
                 if let Some(ref mut mgr) = state.browser {
@@ -3242,15 +3280,15 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
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
@@ -3262,6 +3300,24 @@ async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, St
     Ok(established)
 }
 
+async fn commit_isolated_connection(state: &mut DaemonState) -> Result<(), String> {
+    if state
+        .browser
+        .as_ref()
+        .is_some_and(BrowserManager::is_isolated)
+    {
+        if let Some(error) = maybe_persist_tab_binding(state) {
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
@@ -3271,8 +3327,9 @@ fn persisted_browser_context_id(state: &DaemonState) -> Result<Option<String>, S
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
@@ -3280,8 +3337,11 @@ async fn connect_external_cdp(
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
@@ -3880,8 +3940,9 @@ async fn apply_session_setup(state: &mut DaemonState, session_id: &str) -> Resul
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
@@ -3944,7 +4005,7 @@ async fn auto_launch(
             restore_key: restore_key.as_deref(),
             storage_state,
         })?;
-        let mgr = connect_external_cdp(state, &cdp).await?;
+        let mgr = connect_external_cdp(state, &cdp, isolate_context).await?;
         let hash = launch_hash(
             &options,
             &allowed_domains,
@@ -3993,7 +4054,7 @@ async fn auto_launch(
             None,
         );
         state.reset_input_state();
-        state.browser = Some(connect_external_auto(state).await?);
+        state.browser = Some(connect_external_auto(state, isolate_context).await?);
         if !apply_tab_binding_on_attach_or_rollback(state).await? {
             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
                 let _ = rollback_failed_launch(state).await;
@@ -4686,6 +4747,8 @@ async fn try_load_storage_state(state: &mut DaemonState, path: &Option<String>)
 // ---------------------------------------------------------------------------
 
 async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
+    let isolate_context =
+        state.isolate_context || cmd.get("isolateContext").and_then(Value::as_bool) == Some(true);
     let effective_ca_cert = resolve_effective_ca_cert(cmd, state)?;
     // Absent field falls back to the daemon's spawn-time env (mirrors
     // hideScrollbars/webgpu), keeping the launch hash stable when follow-up
@@ -4701,7 +4764,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
         .and_then(|v| v.as_bool())
         .unwrap_or(false);
     let provider_name = cmd.get("provider").and_then(|v| v.as_str());
-    if state.isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
+    if isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
         return Err(
             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
         );
@@ -4895,7 +4958,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
         let was_external = mgr.is_cdp_connection();
         let hash_changed = state.launch_hash != Some(new_hash);
         let storage_state_requires_clean_launch = storage_state_owned.is_some() && !is_external;
-        let isolation_changed = is_external && state.isolate_context != mgr.is_isolated();
+        let isolation_changed = is_external && isolate_context != mgr.is_isolated();
         is_external != was_external
             || hash_changed
             || isolation_changed
@@ -4951,7 +5014,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
 
     if let Some(url) = cdp_url {
         state.reset_input_state();
-        state.browser = Some(connect_external_cdp(state, url).await?);
+        state.browser = Some(connect_external_cdp(state, url, isolate_context).await?);
         state.launch_hash = Some(new_hash);
         state.subscribe_to_browser_events();
         state.start_fetch_handler();
@@ -4968,7 +5031,8 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
 
     if let Some(port) = cdp_port {
         state.reset_input_state();
-        state.browser = Some(connect_external_cdp(state, &port.to_string()).await?);
+        state.browser =
+            Some(connect_external_cdp(state, &port.to_string(), isolate_context).await?);
         state.launch_hash = Some(new_hash);
         state.subscribe_to_browser_events();
         state.start_fetch_handler();
@@ -4985,7 +5049,7 @@ async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, St
 
     if auto_connect {
         state.reset_input_state();
-        state.browser = Some(connect_external_auto(state).await?);
+        state.browser = Some(connect_external_auto(state, isolate_context).await?);
         if !apply_tab_binding_on_attach_or_rollback(state).await? {
             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
                 let _ = rollback_failed_launch(state).await;
@@ -14176,6 +14240,78 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         assert_eq!(resp["data"]["url"], "https://example.com");
     }
 
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
@@ -15095,7 +15231,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--profile"), "got: {}", error);
         assert!(
@@ -15134,7 +15272,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--args"), "got: {}", error);
         assert!(error.contains("--user-data-dir"), "got: {}", error);
@@ -15166,7 +15306,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--restore"), "got: {}", error);
         assert!(
@@ -15197,7 +15339,9 @@ printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
         guard.remove("AGENT_BROWSER_PROVIDER");
 
         let mut state = DaemonState::new();
-        let error = auto_launch(&mut state, Vec::new()).await.unwrap_err();
+        let error = auto_launch(&mut state, Vec::new(), false)
+            .await
+            .unwrap_err();
 
         assert!(error.contains("--state/storageState"), "got: {}", error);
         assert!(
diff --git a/cli/src/native/browser.rs b/cli/src/native/browser.rs
index 7d352fa..5ae9eec 100644
--- a/cli/src/native/browser.rs
+++ b/cli/src/native/browser.rs
@@ -2349,14 +2349,18 @@ impl BrowserManager {
 
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
index 581be71..ea337de 100644
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
 
@@ -10636,6 +10638,266 @@ async fn e2e_isolated_context_recreates_after_chrome_restart_and_restores_state(
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
3031:     if lifecycle_launched && isolated_launch && result.is_err() {
3032:         let _ = rollback_failed_launch(state).await;
3033:     }
3034: 
3035:     if result.is_ok() && should_validate_restore_after_action(action) {
3036:         validate_restore_if_pending(state).await;
3037:     }
3038: 
3039:     // Stamp browser-touching commands so periodic autosave waits for an
3040:     // active command burst to settle before collecting state. Stamped even on
3041:     // error: a failed click can still have navigated.
3042:     if !skip_launch {
3043:         state.last_command_finished = Some(std::time::Instant::now());
3044:     }
3045: 
3046:     // Persist the session-to-tab binding (write-on-change) so a fresh daemon
3047:     // re-attaches to this session's tab instead of adopting the browser's
3048:     // most recently active one.
3049:     let persist_error = if !skip_launch && !isolated_launch {
3050:         maybe_persist_tab_binding(state)
3051:     } else {
3052:         None
3053:     };
3054: 
3055:     let mut resp = match result {
3056:         Ok(data) => success_response(&id, data),
3057:         Err(e) => error_response(&id, &super::browser::to_ai_friendly_error(&e)),
3058:     };
3059:     attach_tab_gone_data(&mut resp, state);
3060: 
3061:     // A failed binding write is retried on the next command, but a pinned
3062:     // session must know its isolation may not survive a daemon restart.
3063:     if let Some(err) = persist_error {
3064:         if let Some(obj) = resp.as_object_mut() {
3065:             let hint = if state.pin_tab || state.isolate_context {
3066:                 " Session isolation may not survive a daemon restart until the binding persists."
3067:             } else {
3068:                 ""
3069:             };
3070:             obj.insert(
3071:                 "warning".to_string(),
3072:                 json!(format!(
3073:                     "Failed to persist the session tab binding: {}.{}",
3074:                     err, hint
3075:                 )),
3076:             );
3077:         }
3078:     }
3079:     inject_lifecycle(
3080:         &mut resp,
3081:         state,
3082:         lifecycle_reused,
3083:         lifecycle_launched,
3084:         lifecycle_relaunched_browser,
3085:     );
3086:     // Re-drain so a dialog opened by THIS command is reflected in the warning
3087:     // below; events are otherwise only drained at the start of a command.
3088:     if let Err(e) = state.drain_cdp_events_background().await {
3089:         resp = error_response(&id, &super::browser::to_ai_friendly_error(&e));
3090:         attach_tab_gone_data(&mut resp, state);
3091:         inject_lifecycle(
3092:             &mut resp,
3093:             state,
3094:             lifecycle_reused,
3095:             lifecycle_launched,
3096:             lifecycle_relaunched_browser,
3097:         );
3098:     }
3099:     if isolated_launch {
3100:         if resp.get("success").and_then(Value::as_bool) == Some(true) {
3101:             if let Err(error) = commit_isolated_connection(state).await {
3102:                 resp = error_response(&id, &error);
3103:             }
3104:         } else if state
3105:             .browser
3106:             .as_ref()
3107:             .is_some_and(|manager| manager.context_recreated())
3108:             || !state.isolate_context
3109:         {
3110:             let _ = rollback_failed_launch(state).await;
3111:         }
3112:     }
3113:     state.context_recreated = false;
3114:     attach_webmcp_availability(&mut resp, action, state).await;
3115: 
3116:     // Auto-report pending JavaScript dialog so agents know why commands may hang
3117:     if action != "dialog" {
3118:         if let Some(ref dialog) = state.pending_dialog {
3119:             if let Some(obj) = resp.as_object_mut() {
3120:                 obj.insert(
3121:                     "warning".to_string(),
3122:                     json!(format!(
3123:                         "A JavaScript {} dialog is blocking the page: \"{}\" — use `dialog accept` or `dialog dismiss` to resolve it",
3124:                         dialog.dialog_type, dialog.message
3125:                     )),
3126:                 );
3127:             }
3128:         }
3129:     }
3130: 
3131:     if let Some(ref server) = state.stream_server {
3132:         let duration_ms = cmd_start.elapsed().as_millis() as u64;
3133:         let success = resp
3134:             .get("status")
3135:             .and_then(|v| v.as_str())
3136:             .is_some_and(|s| s == "success");
3137:         let data = resp.get("data").cloned().unwrap_or(Value::Null);
3138:         server.broadcast_result(&id, action, success, &data, duration_ms);
3139: 
3140:         if let Some(ref mgr) = state.browser {
3141:             let tabs = mgr.tab_list();
3142:             let session_id = mgr.active_session_id().ok().map(|s| s.to_string());
3143:             server
3144:                 .bind_cdp_session_and_broadcast_tabs(session_id, &tabs)
3145:                 .await;
3146:         }
3147:     }
3148: 
3149:     resp
3150: }
3151: 
3152: fn auto_launch_error_context(has_cdp: bool) -> &'static str {
3153:     if has_cdp {
3154:         "CDP connection failed"
3155:     } else {
3156:         "Auto-launch failed"
3157:     }
3158: }
3159: 
3160: // ---------------------------------------------------------------------------
3161: // Session-to-tab binding
3162: // ---------------------------------------------------------------------------
3163: 
3164: /// Persist the session's tab binding when it changed. Called after every
3165: /// browser-touching command; skipped while the bound tab is gone so the
3166: /// stale binding (needed to re-derive the tab_gone state after a daemon
3167: /// restart) is not overwritten by the fallback tab.
3168: ///
3169: /// Returns the write error, if any. `last_persisted_binding` is only updated
3170: /// after a successful durable write, so a transient failure is retried on
3171: /// the next command instead of being silently treated as persisted (which
3172: /// would let a daemon restart drop the binding and, for a pinned session,
3173: /// the strict isolation boundary with it).
3174: fn maybe_persist_tab_binding(state: &mut DaemonState) -> Option<String> {
3175:     let mgr = state.browser.as_ref()?;
3176:     let (target_id, url) = mgr.binding_snapshot()?;
3177:     let binding = tab_binding::TabBinding {
3178:         target_id,
3179:         url: tab_binding::sanitize_url(&url),
3180:         pinned: state.pin_tab,
3181:         browser_context_id: mgr.isolated_context_id().map(str::to_string),
3182:     };
3183:     if state.last_persisted_binding.as_ref() == Some(&binding) {
3184:         return None;
3185:     }
3186:     match tab_binding::save(&state.session_id, &binding) {
3187:         Ok(()) => {
3188:             state.last_persisted_binding = Some(binding);
3189:             if let Some(ref mut mgr) = state.browser {
3190:                 mgr.mark_isolated_context_persisted();
3191:             }
3192:             None
3193:         }
3194:         Err(e) => Some(e),
3195:     }
3196: }
3197: 
3198: /// Re-apply this session's persisted tab binding after attaching to a
3199: /// browser over CDP, instead of keeping the default selection (the first
3200: /// target returned by `Target.getTargets`, i.e. the browser's most recently
3201: /// active tab, which in a shared browser is usually another session's tab).
3202: ///
3203: /// Returns true when the session ends up with an established selection:
3204: /// re-bound to the persisted target, entered the `tab_gone` state (pin-tab,
3205: /// bound tab dead), or bound to a fresh tab (pin-tab, no prior binding).
3206: /// Returns false when no binding existed and the legacy selection stands.
3207: async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, String> {
3208:     let session = state.session_id.clone();
3209:     // A corrupt or unreadable binding file is a recovery error, not a
3210:     // first-time session: it may have carried pinned=true, and silently
3211:     // starting fresh would drop the strict isolation boundary.
3212:     let binding = tab_binding::load(&session).map_err(|e| {
3213:         format!(
3214:             "{} — delete the file to reset the session's tab binding \
3215:              (re-run with --pin-tab afterwards if the session was pinned)",
3216:             e
3217:         )
3218:     })?;
3219:     if binding.as_ref().is_some_and(|b| b.pinned) {
3220:         state.pin_tab = true;
3221:     }
3222:     let pin = state.pin_tab;
3223:     let isolated = state
3224:         .browser
3225:         .as_ref()
3226:         .is_some_and(BrowserManager::is_isolated);
3227:     if state.browser.is_none() {
3228:         return Ok(false);
3229:     }
3230:     if let Some(ref mut mgr) = state.browser {
3231:         mgr.set_pin_tab(pin);
3232:         state.context_recreated = mgr.context_recreated();
3233:     }
3234:     let established = match binding {
3235:         Some(b) => {
3236:             let context_changed = isolated
3237:                 && b.browser_context_id.as_deref()
3238:                     != state
3239:                         .browser
3240:                         .as_ref()
3241:                         .and_then(BrowserManager::isolated_context_id);
3242:             let restored = if state.context_recreated || context_changed {
3243:                 false
3244:             } else {
3245:                 state
3246:                     .browser
3247:                     .as_mut()
3248:                     .map(|mgr| mgr.restore_target_binding(&b.target_id, &b.url))
3249:                     .unwrap_or(false)
3250:             };
3251:             if restored {
3252:                 // Attach only enables the CDP domains on the first target; the
3253:                 // restored tab needs them too (like tab_switch), or
3254:                 // lifecycle-dependent commands such as navigate hang. The tab
3255:                 // may have been discarded by Memory Saver, so revive it before
3256:                 // enabling domains instead of hanging on Page.enable.
3257:                 if let Some(ref mgr) = state.browser {
3258:                     mgr.revive_and_enable_active().await?;
3259:                 }
3260:             }
3261:             if restored || pin || isolated {
3262:                 // Restored, or entered the tab_gone state (the stale binding
3263:                 // file is intentionally kept so the state is re-derived if
3264:                 // the daemon restarts again before the agent re-binds).
3265:                 true
3266:             } else {
3267:                 // Legacy sessions fall back to the first target; drop the
3268:                 // stale binding.
3269:                 tab_binding::clear(&session);
3270:                 state.last_persisted_binding = None;
3271:                 false
3272:             }
3273:         }
3274:         None => {
3275:             if pin && !isolated {
3276:                 // A pinned session never implicitly adopts an existing tab:
3277:                 // start it on a fresh one.
3278:                 if let Some(ref mut mgr) = state.browser {
3279:                     mgr.tab_new(None, None).await?;
3280:                 }
3281:                 true
3282:             } else {
3283:                 isolated
3284:             }
3285:         }
3286:     };
3287:     if established && !isolated {
3288:         if let Some(err) = maybe_persist_tab_binding(state) {
3289:             // Strict pinning is only as durable as the binding file: fail
3290:             // the attach instead of pretending the pin is in place.
3291:             if state.pin_tab {
3292:                 return Err(format!(
3293:                     "cannot persist the session isolation binding: {}. \
3294:                      --pin-tab and --isolate-context require a writable socket directory",
3295:                     err
3296:                 ));
3297:             }
3298:         }
3299:     }
3300:     Ok(established)
3301: }
3302: 
3303: async fn commit_isolated_connection(state: &mut DaemonState) -> Result<(), String> {
3304:     if state
3305:         .browser
3306:         .as_ref()
3307:         .is_some_and(BrowserManager::is_isolated)
3308:     {
3309:         if let Some(error) = maybe_persist_tab_binding(state) {
3310:             let _ = rollback_failed_launch(state).await;
3311:             return Err(format!(
3312:                 "cannot persist the session isolation binding: {}",
3313:                 error
3314:             ));
3315:         }
3316:         state.isolate_context = true;
3317:     }
3318:     Ok(())
3319: }
3320: 
3321: fn persisted_browser_context_id(state: &DaemonState) -> Result<Option<String>, String> {
3322:     tab_binding::ensure_writable(&state.session_id)?;
3323:     let binding = tab_binding::load(&state.session_id)?;
3324:     Ok(binding.and_then(|binding| binding.browser_context_id))
3325: }
3326: 
3327: async fn connect_external_cdp(
3328:     state: &DaemonState,
3329:     endpoint: &str,
3330:     isolate_context: bool,
3331: ) -> Result<BrowserManager, String> {
3332:     if isolate_context {
3333:         let context_id = persisted_browser_context_id(state)?;
3334:         BrowserManager::connect_cdp_isolated(endpoint, context_id.as_deref()).await
3335:     } else {
3336:         BrowserManager::connect_cdp(endpoint).await
3337:     }
3338: }
3339: 
3340: async fn connect_external_auto(
3341:     state: &DaemonState,
3342:     isolate_context: bool,
3343: ) -> Result<BrowserManager, String> {
3344:     if isolate_context {
3345:         let context_id = persisted_browser_context_id(state)?;
3346:         BrowserManager::connect_auto_isolated(context_id.as_deref()).await
3347:     } else {
3348:         BrowserManager::connect_auto().await
3349:     }
3350: }
3351: 
3352: /// Run `apply_tab_binding_on_attach`, but tear the connection down on failure.
3353: /// The attach paths set `state.browser` before calling this; without the
3354: /// rollback a binding-recovery error would leave a live but un-recovered
3355: /// browser, and the next command would skip the attach path and act on the

SOURCE cli/src/native/actions.rs
3938: }
3939: 
3940: async fn auto_launch(
3941:     state: &mut DaemonState,
3942:     plugins: Vec<crate::plugins::PluginConfig>,
3943:     isolate_context: bool,
3944: ) -> Result<(), String> {
3945:     if isolate_context
3946:         && env::var("AGENT_BROWSER_CDP").is_err()
3947:         && env::var("AGENT_BROWSER_AUTO_CONNECT").is_err()
3948:     {
3949:         return Err(
3950:             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
3951:         );
3952:     }
3953:     let mut options = launch_options_from_env();
3954:     let effective_ca_cert = state.effective_ca_cert.clone();
3955:     apply_effective_ca_cert(&mut options, &effective_ca_cert);
3956:     state.plugin_init_scripts.clear();
3957:     state.session_setup = SessionSetup::default();
3958: 
3959:     // Use the stream server's viewport dimensions for --window-size so the
3960:     // content area matches the desired viewport from the start.
3961:     if let Some(ref server) = state.stream_server {
3962:         options.viewport_size = Some(server.viewport().await);
3963:     }
3964:     let engine = env::var("AGENT_BROWSER_ENGINE").ok();
3965:     let cdp = env::var("AGENT_BROWSER_CDP").ok();
3966:     let auto_connect = env::var("AGENT_BROWSER_AUTO_CONNECT").is_ok();
3967:     let provider = env::var("AGENT_BROWSER_PROVIDER").ok();
3968:     validate_ca_cert_launch_mode(
3969:         &options,
3970:         engine.as_deref(),
3971:         cdp.is_some() || auto_connect || provider.is_some(),
3972:     )?;
3973:     let enable_features = launch_enable_features_from_env();
3974:     let init_script_paths = launch_init_script_paths_from_env();
3975:     let allowed_domains = current_allowed_domains(state).await;
3976:     options.restrict_webrtc = !allowed_domains.is_empty();
3977:     // Extract storage_state before options is moved into BrowserManager::launch.
3978:     let storage_state_path = options.storage_state.clone();
3979:     let restore_key = state.session_name.clone();
3980:     let storage_state = storage_state_path.as_deref();
3981: 
3982:     // Store proxy credentials for Fetch.authRequired handling
3983:     let has_proxy_auth = options.proxy_username.is_some();
3984:     if has_proxy_auth {
3985:         let mut creds = state.proxy_credentials.write().await;
3986:         *creds = Some((
3987:             options.proxy_username.clone().unwrap_or_default(),
3988:             options.proxy_password.clone().unwrap_or_default(),
3989:         ));
3990:     }
3991: 
3992:     state.engine = engine.as_deref().unwrap_or("chrome").to_string();
3993:     write_engine_file(&state.session_id, &state.engine);
3994:     write_extensions_file(&state.session_id);
3995: 
3996:     if let Some(cdp) = cdp {
3997:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
3998:             allowed_domains: &allowed_domains,
3999:             cdp_url: Some(cdp.as_str()),
4000:             cdp_port: None,
4001:             auto_connect: false,
4002:             profile: options.profile.as_deref(),
4003:             provider_name: None,
4004:             args: &options.args,
4005:             restore_key: restore_key.as_deref(),
4006:             storage_state,
4007:         })?;
4008:         let mgr = connect_external_cdp(state, &cdp, isolate_context).await?;
4009:         let hash = launch_hash(
4010:             &options,
4011:             &allowed_domains,
4012:             &state.plugin_init_scripts,
4013:             &enable_features,
4014:             &init_script_paths,
4015:             engine.as_deref(),
4016:             "cdp-url",
4017:             Some(cdp.as_str()),
4018:         );
4019:         state.reset_input_state();
4020:         state.browser = Some(mgr);
4021:         state.launch_hash = Some(hash);
4022:         state.subscribe_to_browser_events();
4023:         state.start_fetch_handler();
4024:         state.start_dialog_handler();
4025:         apply_tab_binding_on_attach_or_rollback(state).await?;
4026:         state.update_stream_client().await;
4027:         install_network_controls_or_close(state, has_proxy_auth).await?;
4028:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4029:         try_auto_restore_state(state).await;
4030:         try_load_storage_state(state, &storage_state_path).await;
4031:         return Ok(());
4032:     }
4033: 
4034:     if auto_connect {
4035:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4036:             allowed_domains: &allowed_domains,
4037:             cdp_url: None,
4038:             cdp_port: None,
4039:             auto_connect: true,
4040:             profile: options.profile.as_deref(),
4041:             provider_name: None,
4042:             args: &options.args,
4043:             restore_key: restore_key.as_deref(),
4044:             storage_state,
4045:         })?;
4046:         let hash = launch_hash(
4047:             &options,
4048:             &allowed_domains,
4049:             &state.plugin_init_scripts,
4050:             &enable_features,
4051:             &init_script_paths,
4052:             engine.as_deref(),
4053:             "auto-connect",
4054:             None,
4055:         );
4056:         state.reset_input_state();
4057:         state.browser = Some(connect_external_auto(state, isolate_context).await?);
4058:         if !apply_tab_binding_on_attach_or_rollback(state).await? {
4059:             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
4060:                 let _ = rollback_failed_launch(state).await;
4061:                 return Err(e);
4062:             }
4063:         }
4064:         state.launch_hash = Some(hash);
4065:         state.subscribe_to_browser_events();
4066:         state.start_fetch_handler();
4067:         state.start_dialog_handler();
4068:         state.update_stream_client().await;
4069:         install_network_controls_or_close(state, has_proxy_auth).await?;
4070:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4071:         try_auto_restore_state(state).await;
4072:         try_load_storage_state(state, &storage_state_path).await;
4073:         return Ok(());
4074:     }
4075: 
4076:     // Cloud provider: when AGENT_BROWSER_PROVIDER is set, connect via the
4077:     // provider API instead of launching a local Chrome instance.  This mirrors
4078:     // the logic in handle_launch() so that auto_launch (triggered by any
4079:     // command arriving before an explicit "launch") honours the provider env.
4080:     if let Some(provider) = provider {
4081:         let p = provider.to_lowercase();
4082:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4083:             allowed_domains: &allowed_domains,
4084:             cdp_url: None,
4085:             cdp_port: None,
4086:             auto_connect: false,
4087:             profile: options.profile.as_deref(),
4088:             provider_name: Some(p.as_str()),
4089:             args: &options.args,
4090:             restore_key: restore_key.as_deref(),
4091:             storage_state,
4092:         })?;
4093:         // ios/safari are device providers handled via explicit launch command
4094:         if !p.is_empty() && p != "ios" && p != "safari" {
4095:             let conn = providers::connect_provider_with_plugins(&p, &plugins).await?;
4096:             if conn.direct_page && !allowed_domains.is_empty() {
4097:                 if let Some(ref ps) = conn.session {
4098:                     providers::close_provider_session_with_plugins(ps, &plugins).await;
4099:                 }
4100:                 return Err(direct_page_allowed_domains_error());

SOURCE cli/src/native/actions.rs
4705: async fn rollback_failed_launch(state: &mut DaemonState) -> Result<(), String> {
4706:     let dispose_result = if let Some(ref mut manager) = state.browser {
4707:         manager.dispose_unpersisted_isolated_context().await
4708:     } else {
4709:         Ok(())
4710:     };
4711:     let close_result = close_current_browser(state).await;
4712:     state.ref_map.clear();
4713:     match (dispose_result, close_result) {
4714:         (Ok(()), result) => result,
4715:         (Err(dispose), Ok(())) => Err(dispose),
4716:         (Err(dispose), Err(close)) => Err(format!(
4717:             "{} (also failed to detach browser after launch rollback: {})",
4718:             dispose, close
4719:         )),
4720:     }
4721: }
4722: 
4723: async fn load_storage_state_or_rollback(
4724:     state: &mut DaemonState,
4725:     path: &Option<String>,
4726: ) -> Result<(), String> {
4727:     if let Err(err) = load_storage_state(state, path).await {
4728:         if let Err(close_err) = rollback_failed_launch(state).await {
4729:             return Err(format!(
4730:                 "{} (also failed to roll back browser after launch: {})",
4731:                 err, close_err
4732:             ));
4733:         }
4734:         return Err(err);
4735:     }
4736: 
4737:     Ok(())
4738: }
4739: 
4740: /// Load storage state from AGENT_BROWSER_STATE if set.
4741: async fn try_load_storage_state(state: &mut DaemonState, path: &Option<String>) {
4742:     let _ = load_storage_state(state, path).await;
4743: }
4744: 
4745: // ---------------------------------------------------------------------------
4746: // Phase 1 handlers
4747: // ---------------------------------------------------------------------------
4748: 
4749: async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
4750:     let isolate_context =
4751:         state.isolate_context || cmd.get("isolateContext").and_then(Value::as_bool) == Some(true);
4752:     let effective_ca_cert = resolve_effective_ca_cert(cmd, state)?;
4753:     // Absent field falls back to the daemon's spawn-time env (mirrors
4754:     // hideScrollbars/webgpu), keeping the launch hash stable when follow-up
4755:     // commands send launch envelopes without an explicit headed choice.
4756:     let headless = cmd
4757:         .get("headless")
4758:         .and_then(|v| v.as_bool())
4759:         .unwrap_or_else(|| !headed_from_env());
4760:     let cdp_url = cmd.get("cdpUrl").and_then(|v| v.as_str());
4761:     let cdp_port = cmd.get("cdpPort").and_then(|v| v.as_u64());
4762:     let auto_connect = cmd
4763:         .get("autoConnect")
4764:         .and_then(|v| v.as_bool())
4765:         .unwrap_or(false);
4766:     let provider_name = cmd.get("provider").and_then(|v| v.as_str());
4767:     if isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
4768:         return Err(
4769:             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
4770:         );
4771:     }
4772:     let enable_features =
4773:         string_array_from_command(cmd, "enable").unwrap_or_else(launch_enable_features_from_env);
4774:     let init_script_paths = string_array_from_command(cmd, "initScripts")
4775:         .unwrap_or_else(launch_init_script_paths_from_env);
4776: 
4777:     let extensions: Option<Vec<String>> =
4778:         cmd.get("extensions").and_then(|v| v.as_array()).map(|arr| {
4779:             arr.iter()
4780:                 .filter_map(|v| v.as_str().map(String::from))
4781:                 .collect()
4782:         });
4783:     let storage_state = cmd.get("storageState").and_then(|v| v.as_str());
4784:     let storage_state_owned = storage_state.map(|s| s.to_string());
4785:     let engine = cmd
4786:         .get("engine")
4787:         .and_then(|v| v.as_str())
4788:         .map(String::from)
4789:         .or_else(|| env::var("AGENT_BROWSER_ENGINE").ok());
4790:     let profile = cmd
4791:         .get("profile")
4792:         .and_then(|v| v.as_str())
4793:         .map(String::from);
4794: 
4795:     let requested_allowed_domains = allowed_domains_from_launch_command(cmd);
4796:     let previous_domain_filter = state.domain_filter.read().await.clone();
4797:     let existing_allowed_domains = current_allowed_domains(state).await;
4798:     let allowed_domains = requested_allowed_domains
4799:         .clone()
4800:         .unwrap_or(existing_allowed_domains);
4801:     let restrict_webrtc = !allowed_domains.is_empty();
4802:     let restore_key = cmd
4803:         .get("restoreKey")
4804:         .and_then(|v| v.as_str())
4805:         .map(String::from)
4806:         .or_else(|| state.session_name.clone());
4807:     let launch_args: Vec<String> = cmd
4808:         .get("args")
4809:         .and_then(|v| v.as_array())
4810:         .map(|arr| {
4811:             arr.iter()
4812:                 .filter_map(|v| v.as_str().map(|s| s.to_string()))
4813:                 .collect::<Vec<_>>()
4814:         })
4815:         .unwrap_or_default();
4816: 
4817:     ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4818:         allowed_domains: &allowed_domains,
4819:         cdp_url,
4820:         cdp_port,
4821:         auto_connect,
4822:         profile: profile.as_deref(),
4823:         provider_name,
4824:         args: &launch_args,
4825:         restore_key: restore_key.as_deref(),
4826:         storage_state,
4827:     })?;
4828: 
4829:     let mut launch_options = LaunchOptions {
4830:         headless,
4831:         executable_path: cmd
4832:             .get("executablePath")
4833:             .and_then(|v| v.as_str())
4834:             .map(|s| s.to_string())
4835:             .or_else(|| env::var("AGENT_BROWSER_EXECUTABLE_PATH").ok()),
4836:         proxy: cmd.get("proxy").and_then(|v| {
4837:             v.as_str().map(|s| s.to_string()).or_else(|| {
4838:                 v.get("server")
4839:                     .and_then(|s| s.as_str())
4840:                     .map(|s| s.to_string())
4841:             })
4842:         }),
4843:         proxy_bypass: cmd
4844:             .get("proxy")
4845:             .and_then(|v| v.get("bypass"))
4846:             .and_then(|v| v.as_str())
4847:             .map(String::from),
4848:         proxy_username: cmd
4849:             .get("proxy")
4850:             .and_then(|v| v.get("username"))
4851:             .and_then(|v| v.as_str())
4852:             .map(String::from)
4853:             .or_else(|| env::var("AGENT_BROWSER_PROXY_USERNAME").ok()),
4854:         proxy_password: cmd
4855:             .get("proxy")
4856:             .and_then(|v| v.get("password"))
4857:             .and_then(|v| v.as_str())
4858:             .map(String::from)
4859:             .or_else(|| env::var("AGENT_BROWSER_PROXY_PASSWORD").ok()),
4860:         profile,
4861:         allow_file_access: cmd
4862:             .get("allowFileAccess")
4863:             .and_then(|v| v.as_bool())
4864:             .unwrap_or(false),
4865:         args: launch_args,
4866:         extensions,
4867:         storage_state: storage_state.map(String::from),
4868:         user_agent: cmd
4869:             .get("userAgent")
4870:             .and_then(|v| v.as_str())
4871:             .map(String::from),
4872:         ignore_https_errors: cmd
4873:             .get("ignoreHTTPSErrors")
4874:             .and_then(|v| v.as_bool())
4875:             .unwrap_or(false),
4876:         ca_cert: None,
4877:         ca_bundle: None,
4878:         ca_cert_digest: None,
4879:         prepared_nss_home: None,
4880:         color_scheme: cmd
4881:             .get("colorScheme")
4882:             .and_then(|v| v.as_str())
4883:             .map(String::from),
4884:         download_path: cmd
4885:             .get("downloadPath")
4886:             .and_then(|v| v.as_str())
4887:             .map(String::from),
4888:         hide_scrollbars: hide_scrollbars_from_launch_cmd(cmd),
4889:         viewport_size: None,
4890:         use_real_keychain: false,
4891:         webgpu: webgpu_from_launch_cmd(cmd),
4892:         webmcp: cmd
4893:             .get("webmcp")
4894:             .and_then(Value::as_bool)
4895:             .unwrap_or_else(|| {
4896:                 !matches!(
4897:                     env::var("AGENT_BROWSER_NO_WEBMCP").as_deref(),
4898:                     Ok("1" | "true" | "yes")
4899:                 )
4900:             }),
4901:         no_xvfb: no_xvfb_from_launch_cmd(cmd),
4902:         restrict_webrtc,
4903:     };
4904:     apply_effective_ca_cert(&mut launch_options, &effective_ca_cert);
4905: 
4906:     let external_launch =
4907:         cdp_url.is_some() || cdp_port.is_some() || auto_connect || provider_name.is_some();
4908:     validate_ca_cert_launch_mode(&launch_options, engine.as_deref(), external_launch)?;
4909: 
4910:     state.plugin_init_scripts.clear();
4911:     let local_launch =
4912:         cdp_url.is_none() && cdp_port.is_none() && !auto_connect && provider_name.is_none();
4913:     if local_launch {
4914:         apply_launch_mutator_plugins(state, &mut launch_options, plugins_from_command_or_env(cmd))
4915:             .await?;
4916:         validate_ca_cert_launch_mode(&launch_options, engine.as_deref(), false)?;
4917:     }
4918:     ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4919:         allowed_domains: &allowed_domains,
4920:         cdp_url,
4921:         cdp_port,
4922:         auto_connect,
4923:         profile: launch_options.profile.as_deref(),
4924:         provider_name,
4925:         args: &launch_options.args,
4926:         restore_key: restore_key.as_deref(),
4927:         storage_state,
4928:     })?;
4929: 
4930:     if let Some(domains) = requested_allowed_domains {
4931:         let mut filter = state.domain_filter.write().await;
4932:         *filter = if domains.is_empty() {
4933:             None
4934:         } else {
4935:             Some(DomainFilter::new(&domains.join(",")))
4936:         };
4937:     }
4938: 
4939:     let (connection_kind, connection_target) =
4940:         launch_connection_identity(cdp_url, cdp_port, auto_connect, provider_name);
4941:     let new_hash = launch_hash(
4942:         &launch_options,
4943:         &allowed_domains,
4944:         &state.plugin_init_scripts,
4945:         &enable_features,
4946:         &init_script_paths,
4947:         engine.as_deref(),
4948:         connection_kind,
4949:         connection_target.as_deref(),
4950:     );
4951: 
4952:     // Hash comparison and fast process-exit check are evaluated before the
4953:     // async is_connection_alive to skip the expensive CDP liveness probe
4954:     // when a relaunch is already certain.
4955:     let needs_relaunch = if let Some(ref mut mgr) = state.browser {
4956:         let is_external =
4957:             launch_connection_is_external(cdp_url, cdp_port, auto_connect, provider_name);
4958:         let was_external = mgr.is_cdp_connection();
4959:         let hash_changed = state.launch_hash != Some(new_hash);
4960:         let storage_state_requires_clean_launch = storage_state_owned.is_some() && !is_external;
4961:         let isolation_changed = is_external && isolate_context != mgr.is_isolated();
4962:         is_external != was_external
4963:             || hash_changed
4964:             || isolation_changed
4965:             || storage_state_requires_clean_launch
4966:             || mgr.has_process_exited()
4967:             || !mgr.is_connection_alive().await
4968:     } else {
4969:         true
4970:     };
4971: 
4972:     let had_browser_before_launch =
4973:         state.browser.is_some() || state.active_provider_session.is_some();
4974: 
4975:     if needs_relaunch {
4976:         if local_launch {
4977:             if let Some(ref ca) = effective_ca_cert {
4978:                 launch_options.prepared_nss_home = Some(prepare_nss_home(&ca.bundle)?);
4979:             }
4980:         }
4981:         if had_browser_before_launch {
4982:             let _ = auto_save_restore_state(state).await;
4983:             close_current_browser(state).await?;
4984:         }
4985:     } else {
4986:         load_storage_state(state, &storage_state_owned).await?;
4987:         state.effective_ca_cert = effective_ca_cert;
4988:         return Ok(json!({ "launched": true, "reused": true, "relaunchedBrowser": false }));
4989:     }
4990:     state.ref_map.clear();
4991:     state.session_setup = SessionSetup::default();
4992: 
4993:     let has_cdp = cdp_url.is_some() || cdp_port.is_some();
4994:     super::browser::validate_launch_options(
4995:         launch_options.extensions.as_deref(),
4996:         has_cdp,
4997:         launch_options.profile.as_deref(),
4998:         storage_state,
4999:         launch_options.allow_file_access,
5000:         launch_options.executable_path.as_deref(),
5001:         launch_options.ca_cert.as_deref(),
5002:     )?;
5003: 
5004:     // Store proxy credentials before any local or remote CDP branch enables
5005:     // Fetch interception with authentication handling.
5006:     let has_proxy_auth = launch_options.proxy_username.is_some();
5007:     if has_proxy_auth {
5008:         let mut creds = state.proxy_credentials.write().await;
5009:         *creds = Some((
5010:             launch_options.proxy_username.clone().unwrap_or_default(),
5011:             launch_options.proxy_password.clone().unwrap_or_default(),
5012:         ));
5013:     }
5014: 
5015:     if let Some(url) = cdp_url {
5016:         state.reset_input_state();
5017:         state.browser = Some(connect_external_cdp(state, url, isolate_context).await?);
5018:         state.launch_hash = Some(new_hash);
5019:         state.subscribe_to_browser_events();
5020:         state.start_fetch_handler();
5021:         state.start_dialog_handler();
5022:         apply_tab_binding_on_attach_or_rollback(state).await?;
5023:         state.update_stream_client().await;
5024:         install_network_controls_or_close(state, has_proxy_auth).await?;
5025:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5026:         try_auto_restore_state(state).await;
5027:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5028:         state.effective_ca_cert = effective_ca_cert;
5029:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5030:     }
5031: 
5032:     if let Some(port) = cdp_port {
5033:         state.reset_input_state();
5034:         state.browser =
5035:             Some(connect_external_cdp(state, &port.to_string(), isolate_context).await?);
5036:         state.launch_hash = Some(new_hash);
5037:         state.subscribe_to_browser_events();
5038:         state.start_fetch_handler();
5039:         state.start_dialog_handler();
5040:         apply_tab_binding_on_attach_or_rollback(state).await?;
5041:         state.update_stream_client().await;
5042:         install_network_controls_or_close(state, has_proxy_auth).await?;
5043:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5044:         try_auto_restore_state(state).await;
5045:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5046:         state.effective_ca_cert = effective_ca_cert;
5047:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5048:     }
5049: 
5050:     if auto_connect {
5051:         state.reset_input_state();
5052:         state.browser = Some(connect_external_auto(state, isolate_context).await?);
5053:         if !apply_tab_binding_on_attach_or_rollback(state).await? {
5054:             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
5055:                 let _ = rollback_failed_launch(state).await;
5056:                 return Err(e);
5057:             }
5058:         }
5059:         state.launch_hash = Some(new_hash);
5060:         state.subscribe_to_browser_events();
5061:         state.start_fetch_handler();
5062:         state.start_dialog_handler();
5063:         state.update_stream_client().await;
5064:         install_network_controls_or_close(state, has_proxy_auth).await?;
5065:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5066:         try_auto_restore_state(state).await;
5067:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5068:         state.effective_ca_cert = effective_ca_cert;
5069:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5070:     }
5071: 
5072:     if let Some(provider) = provider_name {
5073:         match provider.to_lowercase().as_str() {
5074:             "ios" => {
5075:                 let result = launch_ios(cmd, state).await;
5076:                 if result.is_ok() {
5077:                     state.effective_ca_cert = effective_ca_cert;
5078:                 }
5079:                 return result;
5080:             }
5081:             "safari" => {
5082:                 let result = launch_safari(cmd, state).await;
5083:                 if result.is_ok() {
5084:                     state.effective_ca_cert = effective_ca_cert;
5085:                 }
5086:                 return result;
5087:             }
5088:             _ => {
5089:                 let command_plugins = plugins_from_command_or_env(cmd);
5090:                 let conn = providers::connect_provider_with_plugins_and_options(

SOURCE cli/src/native/actions.rs
7268: async fn handle_download(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
7269:     let selector = cmd
7270:         .get("selector")
7271:         .and_then(|v| v.as_str())
7272:         .ok_or("Missing 'selector' parameter")?;
7273:     let path_str = cmd
7274:         .get("path")
7275:         .and_then(|v| v.as_str())
7276:         .ok_or("Missing 'path' parameter")?;
7277: 
7278:     // Resolve to absolute path and canonicalize to prevent path traversal
7279:     let raw_dest = if std::path::Path::new(path_str).is_absolute() {
7280:         PathBuf::from(path_str)
7281:     } else {
7282:         std::env::current_dir()
7283:             .map_err(|e| format!("Failed to get current directory: {}", e))?
7284:             .join(path_str)
7285:     };
7286: 
7287:     // Extract directory and desired filename
7288:     let download_dir = raw_dest
7289:         .parent()
7290:         .ok_or("Invalid download path: no parent directory")?
7291:         .to_path_buf();
7292: 
7293:     // Create the directory if it doesn't exist
7294:     std::fs::create_dir_all(&download_dir)
7295:         .map_err(|e| format!("Failed to create download directory: {}", e))?;
7296: 
7297:     // Canonicalize after mkdir so the path actually exists for resolution
7298:     let download_dir = download_dir
7299:         .canonicalize()
7300:         .map_err(|e| format!("Failed to resolve download directory: {}", e))?;
7301:     let dest = download_dir.join(
7302:         raw_dest
7303:             .file_name()
7304:             .ok_or("Invalid download path: no filename")?,
7305:     );
7306:     let download_dir_str = download_dir
7307:         .to_str()
7308:         .ok_or("Download directory path is not valid UTF-8")?;
7309: 
7310:     let mgr = state.browser.as_ref().ok_or("Browser not launched")?;
7311:     let session_id = mgr.active_session_id()?.to_string();
7312: 
7313:     // Set download behavior to save to the parent directory
7314:     mgr.set_download_behavior(download_dir_str).await?;
7315: 
7316:     // Subscribe to CDP events before clicking so we don't miss the download event
7317:     let mut rx = mgr.client.subscribe();
7318: 
7319:     // Click the element to trigger the download
7320:     interaction::click(
7321:         &mgr.client,
7322:         &session_id,
7323:         &state.ref_map,
7324:         selector,
7325:         "left",
7326:         1,
7327:         &state.iframe_sessions,
7328:     )
7329:     .await?;
7330: 
7331:     // Wait for download to complete
7332:     const DOWNLOAD_TIMEOUT: tokio::time::Duration = tokio::time::Duration::from_secs(30);
7333:     let deadline = tokio::time::Instant::now() + DOWNLOAD_TIMEOUT;
7334:     let mut downloaded_guid: Option<String> = None;
7335: 
7336:     loop {
7337:         let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
7338:         if remaining.is_zero() {
7339:             return Err("Timeout waiting for download to complete".to_string());
7340:         }
7341: 
7342:         match tokio::time::timeout(remaining, rx.recv()).await {
7343:             Ok(Ok(event)) => {
7344:                 // Browser-domain download events may arrive without a sessionId
7345:                 // or with a different sessionId than the page session, so we
7346:                 // accept them regardless. Page-domain events are matched by
7347:                 // session to avoid cross-tab confusion.
7348:                 let is_page_session = event.session_id.as_deref() == Some(&session_id);
7349:                 let is_download_event = |method: &str, browser_method: &str, page_method: &str| {
7350:                     method == browser_method || (method == page_method && is_page_session)
7351:                 };
7352: 
7353:                 // Capture the GUID from downloadWillBegin
7354:                 if is_download_event(
7355:                     &event.method,
7356:                     "Browser.downloadWillBegin",
7357:                     "Page.downloadWillBegin",
7358:                 ) {
7359:                     if let Some(guid) = event.params.get("guid").and_then(|v| v.as_str()) {
7360:                         downloaded_guid = Some(guid.to_string());
7361:                     }
7362:                 }
7363:                 // Check for download completion or cancellation
7364:                 if is_download_event(
7365:                     &event.method,
7366:                     "Browser.downloadProgress",
7367:                     "Page.downloadProgress",
7368:                 ) {
7369:                     match event.params.get("state").and_then(|v| v.as_str()) {
7370:                         Some("completed") => break,
7371:                         Some("canceled") => {
7372:                             return Err("Download was canceled".to_string());
7373:                         }
7374:                         _ => {}
7375:                     }
7376:                 }
7377:             }
7378:             Ok(Err(tokio::sync::broadcast::error::RecvError::Lagged(_))) => continue,
7379:             Ok(Err(_)) => return Err("Event stream closed".to_string()),
7380:             Err(_) => return Err("Timeout waiting for download to complete".to_string()),
7381:         }
7382:     }
7383: 
7384:     // With "allowAndName" behavior, Chrome saves the file using the GUID as filename.
7385:     // Rename it to the user-requested filename.
7386:     if let Some(guid) = downloaded_guid {
7387:         let guid_path = download_dir.join(&guid);
7388:         // Chrome may still be flushing the file to disk after signalling
7389:         // completion; wait briefly for it to appear.
7390:         for _ in 0..10 {
7391:             if guid_path.exists() {
7392:                 break;
7393:             }
7394:             tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
7395:         }
7396:         if guid_path.exists() {
7397:             std::fs::rename(&guid_path, &dest)
7398:                 .map_err(|e| format!("Failed to rename downloaded file: {}", e))?;
7399:         } else {
7400:             // The file might have been saved under its original name instead
7401:             // of the GUID (e.g. when Chrome falls back to "allow" behavior).
7402:             if !dest.exists() {
7403:                 return Err(format!(
7404:                     "Downloaded file not found at expected path (GUID: {})",
7405:                     guid
7406:                 ));
7407:             }
7408:         }
7409:     } else {
7410:         // GUID capture failed -- the file may have been saved under its original name
7411:         // by Chrome. Only return success if dest already exists (avoid touching
7412:         // unrelated files in the directory).
7413:         if !dest.exists() {
7414:             return Err(
7415:                 "Download completed but could not determine the downloaded file name".to_string(),
7416:             );
7417:         }
7418:     }
7419: 
7420:     let dest_str = dest.to_string_lossy().to_string();
7421:     Ok(json!({ "path": dest_str }))
7422: }
7423: 
7424: // ---------------------------------------------------------------------------
7425: // Phase 4 handlers

SOURCE cli/src/native/actions.rs
12442: async fn attach_webmcp_availability(resp: &mut Value, action: &str, state: &mut DaemonState) {
12443:     if action != "navigate"
12444:         || resp.get("success").and_then(Value::as_bool) != Some(true)
12445:         || matches!(state.backend_type, BackendType::WebDriver)
12446:         || state.engine != "chrome"
12447:         || !state.webmcp_enabled
12448:     {
12449:         return;
12450:     }
12451:     let Ok(tools) = wait_for_navigation_webmcp_tools(state).await else {
12452:         return;
12453:     };
12454:     let domain_filter = state.domain_filter.read().await;
12455:     attach_webmcp_availability_from_tools(resp, action, &tools, domain_filter.as_ref());
12456: }
12457: 
12458: async fn wait_for_navigation_webmcp_tools(
12459:     state: &mut DaemonState,
12460: ) -> Result<Vec<webmcp::ToolRecord>, String> {
12461:     let session_id = state
12462:         .browser
12463:         .as_ref()
12464:         .ok_or("Browser not launched")?
12465:         .active_session_id()?
12466:         .to_string();
12467:     let deadline =
12468:         tokio::time::Instant::now() + std::time::Duration::from_millis(webmcp::DISCOVERY_WINDOW_MS);
12469:     loop {
12470:         state.drain_cdp_events_background().await?;
12471:         let tools = state.webmcp.tools(&session_id)?;
12472:         let domain_filter = state.domain_filter.read().await;
12473:         let has_allowed_tool = webmcp_tool_count(&tools, domain_filter.as_ref()) > 0;
12474:         drop(domain_filter);
12475:         if has_allowed_tool {
12476:             return Ok(tools);
12477:         }
12478:         let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
12479:         if remaining.is_zero() {
12480:             return Ok(tools);
12481:         }
12482:         tokio::time::sleep(remaining.min(std::time::Duration::from_millis(10))).await;
12483:     }
12484: }
12485: 
12486: fn webmcp_tool_count(tools: &[webmcp::ToolRecord], domain_filter: Option<&DomainFilter>) -> usize {
12487:     tools
12488:         .iter()
12489:         .filter(|tool| domain_filter.is_none_or(|filter| filter.check_url(&tool.origin).is_ok()))
12490:         .count()

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
