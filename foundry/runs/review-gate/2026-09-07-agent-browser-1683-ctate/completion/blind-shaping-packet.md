Blind shaping phase. NO TOOLS. You are a new isolated FX request, do not inspect candidate code, other reviewer outputs, files, or prior artifacts. Start/root is Kai per user, but only this packet is input. You are one of two different non-implementer families. Use Shaping's native R table, shapes/parts, flagged unknowns and binary fit-check, not a bespoke proposal schema. The previous blind-contract drafts were reconciled by the orchestrator into the contract below. No candidate mechanism has been revealed.

Produce at least two materially distinct shapes when physically possible. For each, include concrete parts, three forward effects (observed/inferred/guessed), harmful branches, weakest falsifiable predictions, negative discriminator probes, compatibility cost and rejected alternatives. Give a binary full R x Shape fit-check with failure notes; unknown mechanisms fail until probed. Recommend a survivor conditionally, identify actual blocking probes. Do not imply tests ran. Keep to 1800 words.

Reconciled contract for new candidate-admission audit (candidate remains sealed).
R0 settled: Isolated downloads reach completion and produce correct bytes in requested destination; default/other isolated sessions retain their configuration and destinations.
R1 settled: Invalid requests and failed connection/setup/post-processing may not newly publish isolation intent or durable binding; flagless subsequent requests and new daemon state remain as before.
R2 settled: Whole-request success on compatible isolated connection persists intent across omission, false (not clear), repetition, reconnect, and daemon restart.
R3 settled: Previously committed intent and existing BrowserContext/target/URL/storage survive ordinary subsequent errors and compatible reuse. Dead browser may need a new context/restore; newly created context from a failed request must not become published success.
R4 settled: Explicit close clears isolated intent/binding and disposes own context under available transport; legacy/pinned formats, user-defined env, owned-vs-external modes and main recording-current-page behavior remain compatible.
R5 settled: Launch and action envelopes are separate. Later action failure does not undo completed launch; mandatory work inside a single request may still invalidate it before success response.
R6 settled scope: Cooperative session partition only. No hostile global-CDP controller guarantee. If transport/host is unavailable, cleanup is best effort; no crash-atomicity guarantee. Even then: no false publication, no corruption of other contexts. Known residuals and retries must be measured.
R7 settled: Only local fix, no public flags/wire formats/unrelated features or remote publication.

Discriminators shared by both drafts: own/default/third download bytes+destinations, new request validation/refusal/postattach/late failures+restart, prior true error/reuse, false-vs-close, dead-browser recovery, separate envelopes, transport unavailable. We reject Gemini's derived assertion that all global-layer changes are forbidden: this is not in the supplied contract. Its suggested native CDP primitive is a hypothesis, not a settled R. Exact default-directory readback is a proxy; later actual downloads are the oracle.

Baseline/source observations supplied below resolve missing ownership stages without revealing the candidate fix. Base has the current defects. Normative CDP Browser.setDownloadBehavior supports a browserContextId; absence configures the default context. behavior allowAndName uses GUID names; downloadPath is required; download events are opt-in. Target.createBrowserContext can optionally dispose its context on client detach, default false. Persisting an isolated context across daemon reconnect is a required contract, so detach semantics must be considered. Primary sources re-read 2026-09-07: https://chromedevtools.github.io/devtools-protocol/tot/Browser/ and /tot/Target/. Real Chrome still must confirm behavior.

BASE SOURCE cli/src/native/actions.rs
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

BASE SOURCE cli/src/native/actions.rs
2390:     }
2391:     state.safari_driver = None;
2392:     state.backend_type = BackendType::Cdp;
2393: 
2394:     close_result
2395: }
2396: 
2397: async fn close_after_network_control_failure(
2398:     state: &mut DaemonState,
2399:     error: String,
2400: ) -> Result<(), String> {
2401:     let close_error = close_current_browser(state).await.err();
2402:     Err(match close_error {
2403:         Some(close_error) => format!(
2404:             "Failed to install browser network controls: {} (also failed to close browser: {})",
2405:             error, close_error
2406:         ),
2407:         None => format!("Failed to install browser network controls: {}", error),
2408:     })
2409: }
2410: 
2411: fn provider_plugin_launch_options_from_command(cmd: &Value) -> Value {
2412:     let mut options = serde_json::Map::new();
2413:     if let Some(headless) = cmd.get("headless").and_then(|v| v.as_bool()) {
2414:         options.insert("headed".to_string(), json!(!headless));
2415:     }

BASE SOURCE cli/src/native/actions.rs
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
2637:     if cmd.get("isolateContext").and_then(Value::as_bool) == Some(true) {
2638:         if action != "launch"
2639:             && state
2640:                 .browser
2641:                 .as_ref()
2642:                 .is_some_and(|manager| !manager.is_isolated())
2643:         {
2644:             return error_response(
2645:                 &id,
2646:                 "--isolate-context requires reconnecting with --cdp, --auto-connect, or connect <port|url>",
2647:             );
2648:         }
2649:         state.isolate_context = true;
2650:     }
2651: 
2652:     let skip_launch = skip_launch_action(action);
2653:     let restore_key_change_needs_launch = !skip_launch
2654:         && command_changes_restore_key(cmd, state)
2655:         && has_active_browser_session(state);
2656:     let needs_launch = if !skip_launch {
2657:         // Check if existing connection is stale and needs re-launch.
2658:         // This must happen before policy evaluation so plugin capability
2659:         // actions are gated when recovery relaunches would invoke plugins.
2660:         if restore_key_change_needs_launch {
2661:             true
2662:         } else if let Some(ref mut mgr) = state.browser {
2663:             mgr.has_process_exited() || !mgr.is_connection_alive().await
2664:         } else {
2665:             true

BASE SOURCE cli/src/native/actions.rs
3005:         "confirm" => handle_confirm(cmd, state).await,
3006:         "deny" => handle_deny(cmd, state).await,
3007:         "swipe" => handle_swipe(cmd, state).await,
3008:         "device_list" => handle_device_list().await,
3009:         "input_mouse" => handle_input_mouse(cmd, state).await,
3010:         "input_keyboard" => handle_input_keyboard(cmd, state).await,
3011:         "input_touch" => handle_input_touch(cmd, state).await,
3012:         "keydown" => handle_keydown(cmd, state).await,
3013:         "keyup" => handle_keyup(cmd, state).await,
3014:         "inserttext" => handle_inserttext(cmd, state).await,
3015:         "mousemove" => handle_mousemove(cmd, state).await,
3016:         "mousedown" => handle_mousedown(cmd, state).await,
3017:         "mouseup" => handle_mouseup(cmd, state).await,
3018:         _ => Err(format!("Not yet implemented: {}", action)),
3019:     };
3020: 
3021:     if result.is_ok() && should_validate_restore_after_action(action) {
3022:         validate_restore_if_pending(state).await;
3023:     }
3024: 
3025:     // Stamp browser-touching commands so periodic autosave waits for an
3026:     // active command burst to settle before collecting state. Stamped even on
3027:     // error: a failed click can still have navigated.
3028:     if !skip_launch {
3029:         state.last_command_finished = Some(std::time::Instant::now());
3030:     }
3031: 
3032:     // Persist the session-to-tab binding (write-on-change) so a fresh daemon
3033:     // re-attaches to this session's tab instead of adopting the browser's
3034:     // most recently active one.
3035:     let persist_error = if !skip_launch {
3036:         maybe_persist_tab_binding(state)
3037:     } else {
3038:         None
3039:     };
3040: 
3041:     let mut resp = match result {
3042:         Ok(data) => success_response(&id, data),
3043:         Err(e) => error_response(&id, &super::browser::to_ai_friendly_error(&e)),
3044:     };
3045:     attach_tab_gone_data(&mut resp, state);
3046: 
3047:     // A failed binding write is retried on the next command, but a pinned
3048:     // session must know its isolation may not survive a daemon restart.
3049:     if let Some(err) = persist_error {
3050:         if let Some(obj) = resp.as_object_mut() {
3051:             let hint = if state.pin_tab || state.isolate_context {
3052:                 " Session isolation may not survive a daemon restart until the binding persists."
3053:             } else {
3054:                 ""
3055:             };
3056:             obj.insert(
3057:                 "warning".to_string(),
3058:                 json!(format!(
3059:                     "Failed to persist the session tab binding: {}.{}",
3060:                     err, hint
3061:                 )),
3062:             );
3063:         }
3064:     }
3065:     inject_lifecycle(
3066:         &mut resp,
3067:         state,
3068:         lifecycle_reused,
3069:         lifecycle_launched,
3070:         lifecycle_relaunched_browser,
3071:     );
3072:     // Re-drain so a dialog opened by THIS command is reflected in the warning
3073:     // below; events are otherwise only drained at the start of a command.
3074:     if let Err(e) = state.drain_cdp_events_background().await {
3075:         resp = error_response(&id, &super::browser::to_ai_friendly_error(&e));
3076:         attach_tab_gone_data(&mut resp, state);
3077:         inject_lifecycle(
3078:             &mut resp,
3079:             state,
3080:             lifecycle_reused,
3081:             lifecycle_launched,
3082:             lifecycle_relaunched_browser,
3083:         );
3084:     }
3085:     state.context_recreated = false;
3086:     attach_webmcp_availability(&mut resp, action, state).await;
3087: 
3088:     // Auto-report pending JavaScript dialog so agents know why commands may hang
3089:     if action != "dialog" {
3090:         if let Some(ref dialog) = state.pending_dialog {
3091:             if let Some(obj) = resp.as_object_mut() {
3092:                 obj.insert(
3093:                     "warning".to_string(),
3094:                     json!(format!(
3095:                         "A JavaScript {} dialog is blocking the page: \"{}\" — use `dialog accept` or `dialog dismiss` to resolve it",
3096:                         dialog.dialog_type, dialog.message
3097:                     )),
3098:                 );
3099:             }
3100:         }
3101:     }
3102: 
3103:     if let Some(ref server) = state.stream_server {
3104:         let duration_ms = cmd_start.elapsed().as_millis() as u64;
3105:         let success = resp

BASE SOURCE cli/src/native/actions.rs
3150:         target_id,
3151:         url: tab_binding::sanitize_url(&url),
3152:         pinned: state.pin_tab,
3153:         browser_context_id: mgr.isolated_context_id().map(str::to_string),
3154:     };
3155:     if state.last_persisted_binding.as_ref() == Some(&binding) {
3156:         return None;
3157:     }
3158:     match tab_binding::save(&state.session_id, &binding) {
3159:         Ok(()) => {
3160:             state.last_persisted_binding = Some(binding);
3161:             if let Some(ref mut mgr) = state.browser {
3162:                 mgr.mark_isolated_context_persisted();
3163:             }
3164:             None
3165:         }
3166:         Err(e) => Some(e),
3167:     }
3168: }
3169: 
3170: /// Re-apply this session's persisted tab binding after attaching to a
3171: /// browser over CDP, instead of keeping the default selection (the first
3172: /// target returned by `Target.getTargets`, i.e. the browser's most recently
3173: /// active tab, which in a shared browser is usually another session's tab).
3174: ///
3175: /// Returns true when the session ends up with an established selection:
3176: /// re-bound to the persisted target, entered the `tab_gone` state (pin-tab,
3177: /// bound tab dead), or bound to a fresh tab (pin-tab, no prior binding).
3178: /// Returns false when no binding existed and the legacy selection stands.
3179: async fn apply_tab_binding_on_attach(state: &mut DaemonState) -> Result<bool, String> {
3180:     let session = state.session_id.clone();
3181:     // A corrupt or unreadable binding file is a recovery error, not a
3182:     // first-time session: it may have carried pinned=true, and silently
3183:     // starting fresh would drop the strict isolation boundary.
3184:     let binding = tab_binding::load(&session).map_err(|e| {
3185:         format!(
3186:             "{} — delete the file to reset the session's tab binding \
3187:              (re-run with --pin-tab afterwards if the session was pinned)",
3188:             e
3189:         )
3190:     })?;
3191:     if binding.as_ref().is_some_and(|b| b.pinned) {
3192:         state.pin_tab = true;
3193:     }
3194:     let pin = state.pin_tab;
3195:     if state.browser.is_none() {
3196:         return Ok(false);
3197:     }
3198:     if let Some(ref mut mgr) = state.browser {
3199:         mgr.set_pin_tab(pin);
3200:         state.context_recreated = mgr.context_recreated();
3201:     }
3202:     let established = match binding {
3203:         Some(b) => {
3204:             let restored = if state.context_recreated {
3205:                 false
3206:             } else {
3207:                 state
3208:                     .browser
3209:                     .as_mut()
3210:                     .map(|mgr| mgr.restore_target_binding(&b.target_id, &b.url))
3211:                     .unwrap_or(false)
3212:             };
3213:             if restored {
3214:                 // Attach only enables the CDP domains on the first target; the
3215:                 // restored tab needs them too (like tab_switch), or
3216:                 // lifecycle-dependent commands such as navigate hang. The tab
3217:                 // may have been discarded by Memory Saver, so revive it before
3218:                 // enabling domains instead of hanging on Page.enable.
3219:                 if let Some(ref mgr) = state.browser {
3220:                     mgr.revive_and_enable_active().await?;
3221:                 }
3222:             }
3223:             if restored || pin || state.isolate_context {
3224:                 // Restored, or entered the tab_gone state (the stale binding
3225:                 // file is intentionally kept so the state is re-derived if
3226:                 // the daemon restarts again before the agent re-binds).
3227:                 true
3228:             } else {
3229:                 // Legacy sessions fall back to the first target; drop the
3230:                 // stale binding.
3231:                 tab_binding::clear(&session);
3232:                 state.last_persisted_binding = None;
3233:                 false
3234:             }
3235:         }
3236:         None => {
3237:             if pin && !state.isolate_context {
3238:                 // A pinned session never implicitly adopts an existing tab:
3239:                 // start it on a fresh one.
3240:                 if let Some(ref mut mgr) = state.browser {
3241:                     mgr.tab_new(None, None).await?;
3242:                 }
3243:                 true
3244:             } else {
3245:                 state.isolate_context
3246:             }
3247:         }
3248:     };
3249:     if established {
3250:         if let Some(err) = maybe_persist_tab_binding(state) {
3251:             // Strict pinning is only as durable as the binding file: fail
3252:             // the attach instead of pretending the pin is in place.
3253:             if state.pin_tab || state.isolate_context {
3254:                 return Err(format!(
3255:                     "cannot persist the session isolation binding: {}. \
3256:                      --pin-tab and --isolate-context require a writable socket directory",
3257:                     err
3258:                 ));
3259:             }
3260:         }
3261:     }
3262:     Ok(established)
3263: }
3264: 
3265: fn persisted_browser_context_id(state: &DaemonState) -> Result<Option<String>, String> {
3266:     tab_binding::ensure_writable(&state.session_id)?;
3267:     let binding = tab_binding::load(&state.session_id)?;
3268:     Ok(binding.and_then(|binding| binding.browser_context_id))
3269: }
3270: 
3271: async fn connect_external_cdp(
3272:     state: &DaemonState,
3273:     endpoint: &str,
3274: ) -> Result<BrowserManager, String> {
3275:     if state.isolate_context {
3276:         let context_id = persisted_browser_context_id(state)?;
3277:         BrowserManager::connect_cdp_isolated(endpoint, context_id.as_deref()).await
3278:     } else {
3279:         BrowserManager::connect_cdp(endpoint).await
3280:     }
3281: }
3282: 
3283: async fn connect_external_auto(state: &DaemonState) -> Result<BrowserManager, String> {
3284:     if state.isolate_context {
3285:         let context_id = persisted_browser_context_id(state)?;
3286:         BrowserManager::connect_auto_isolated(context_id.as_deref()).await
3287:     } else {
3288:         BrowserManager::connect_auto().await
3289:     }
3290: }

BASE SOURCE cli/src/native/actions.rs
3880: async fn auto_launch(
3881:     state: &mut DaemonState,
3882:     plugins: Vec<crate::plugins::PluginConfig>,
3883: ) -> Result<(), String> {
3884:     if state.isolate_context
3885:         && env::var("AGENT_BROWSER_CDP").is_err()
3886:         && env::var("AGENT_BROWSER_AUTO_CONNECT").is_err()
3887:     {
3888:         return Err(
3889:             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
3890:         );
3891:     }
3892:     let mut options = launch_options_from_env();
3893:     let effective_ca_cert = state.effective_ca_cert.clone();
3894:     apply_effective_ca_cert(&mut options, &effective_ca_cert);
3895:     state.plugin_init_scripts.clear();
3896:     state.session_setup = SessionSetup::default();
3897: 
3898:     // Use the stream server's viewport dimensions for --window-size so the
3899:     // content area matches the desired viewport from the start.
3900:     if let Some(ref server) = state.stream_server {
3901:         options.viewport_size = Some(server.viewport().await);
3902:     }
3903:     let engine = env::var("AGENT_BROWSER_ENGINE").ok();
3904:     let cdp = env::var("AGENT_BROWSER_CDP").ok();
3905:     let auto_connect = env::var("AGENT_BROWSER_AUTO_CONNECT").is_ok();
3906:     let provider = env::var("AGENT_BROWSER_PROVIDER").ok();
3907:     validate_ca_cert_launch_mode(
3908:         &options,
3909:         engine.as_deref(),
3910:         cdp.is_some() || auto_connect || provider.is_some(),
3911:     )?;
3912:     let enable_features = launch_enable_features_from_env();
3913:     let init_script_paths = launch_init_script_paths_from_env();
3914:     let allowed_domains = current_allowed_domains(state).await;
3915:     options.restrict_webrtc = !allowed_domains.is_empty();
3916:     // Extract storage_state before options is moved into BrowserManager::launch.
3917:     let storage_state_path = options.storage_state.clone();
3918:     let restore_key = state.session_name.clone();
3919:     let storage_state = storage_state_path.as_deref();
3920: 
3921:     // Store proxy credentials for Fetch.authRequired handling
3922:     let has_proxy_auth = options.proxy_username.is_some();
3923:     if has_proxy_auth {
3924:         let mut creds = state.proxy_credentials.write().await;
3925:         *creds = Some((
3926:             options.proxy_username.clone().unwrap_or_default(),
3927:             options.proxy_password.clone().unwrap_or_default(),
3928:         ));
3929:     }
3930: 
3931:     state.engine = engine.as_deref().unwrap_or("chrome").to_string();
3932:     write_engine_file(&state.session_id, &state.engine);
3933:     write_extensions_file(&state.session_id);
3934: 
3935:     if let Some(cdp) = cdp {
3936:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
3937:             allowed_domains: &allowed_domains,
3938:             cdp_url: Some(cdp.as_str()),
3939:             cdp_port: None,
3940:             auto_connect: false,
3941:             profile: options.profile.as_deref(),
3942:             provider_name: None,
3943:             args: &options.args,
3944:             restore_key: restore_key.as_deref(),
3945:             storage_state,
3946:         })?;
3947:         let mgr = connect_external_cdp(state, &cdp).await?;
3948:         let hash = launch_hash(
3949:             &options,
3950:             &allowed_domains,
3951:             &state.plugin_init_scripts,
3952:             &enable_features,
3953:             &init_script_paths,
3954:             engine.as_deref(),
3955:             "cdp-url",
3956:             Some(cdp.as_str()),
3957:         );
3958:         state.reset_input_state();
3959:         state.browser = Some(mgr);
3960:         state.launch_hash = Some(hash);
3961:         state.subscribe_to_browser_events();
3962:         state.start_fetch_handler();
3963:         state.start_dialog_handler();
3964:         apply_tab_binding_on_attach_or_rollback(state).await?;
3965:         state.update_stream_client().await;
3966:         install_network_controls_or_close(state, has_proxy_auth).await?;
3967:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
3968:         try_auto_restore_state(state).await;
3969:         try_load_storage_state(state, &storage_state_path).await;
3970:         return Ok(());
3971:     }
3972: 
3973:     if auto_connect {
3974:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
3975:             allowed_domains: &allowed_domains,
3976:             cdp_url: None,
3977:             cdp_port: None,
3978:             auto_connect: true,
3979:             profile: options.profile.as_deref(),
3980:             provider_name: None,
3981:             args: &options.args,
3982:             restore_key: restore_key.as_deref(),
3983:             storage_state,
3984:         })?;
3985:         let hash = launch_hash(
3986:             &options,
3987:             &allowed_domains,
3988:             &state.plugin_init_scripts,
3989:             &enable_features,
3990:             &init_script_paths,
3991:             engine.as_deref(),
3992:             "auto-connect",
3993:             None,
3994:         );
3995:         state.reset_input_state();
3996:         state.browser = Some(connect_external_auto(state).await?);
3997:         if !apply_tab_binding_on_attach_or_rollback(state).await? {
3998:             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
3999:                 let _ = rollback_failed_launch(state).await;
4000:                 return Err(e);
4001:             }
4002:         }
4003:         state.launch_hash = Some(hash);
4004:         state.subscribe_to_browser_events();
4005:         state.start_fetch_handler();
4006:         state.start_dialog_handler();
4007:         state.update_stream_client().await;
4008:         install_network_controls_or_close(state, has_proxy_auth).await?;
4009:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4010:         try_auto_restore_state(state).await;
4011:         try_load_storage_state(state, &storage_state_path).await;
4012:         return Ok(());
4013:     }
4014: 
4015:     // Cloud provider: when AGENT_BROWSER_PROVIDER is set, connect via the
4016:     // provider API instead of launching a local Chrome instance.  This mirrors
4017:     // the logic in handle_launch() so that auto_launch (triggered by any
4018:     // command arriving before an explicit "launch") honours the provider env.
4019:     if let Some(provider) = provider {
4020:         let p = provider.to_lowercase();
4021:         ensure_allowed_domains_supported_for_launch(AllowedDomainsLaunchSupport {
4022:             allowed_domains: &allowed_domains,
4023:             cdp_url: None,
4024:             cdp_port: None,
4025:             auto_connect: false,

BASE SOURCE cli/src/native/actions.rs
4650:     let close_result = close_current_browser(state).await;
4651:     state.ref_map.clear();
4652:     match (dispose_result, close_result) {
4653:         (Ok(()), result) => result,
4654:         (Err(dispose), Ok(())) => Err(dispose),
4655:         (Err(dispose), Err(close)) => Err(format!(
4656:             "{} (also failed to detach browser after launch rollback: {})",
4657:             dispose, close
4658:         )),
4659:     }
4660: }
4661: 
4662: async fn load_storage_state_or_rollback(
4663:     state: &mut DaemonState,
4664:     path: &Option<String>,
4665: ) -> Result<(), String> {
4666:     if let Err(err) = load_storage_state(state, path).await {
4667:         if let Err(close_err) = rollback_failed_launch(state).await {
4668:             return Err(format!(
4669:                 "{} (also failed to roll back browser after launch: {})",
4670:                 err, close_err
4671:             ));
4672:         }
4673:         return Err(err);
4674:     }
4675: 
4676:     Ok(())
4677: }
4678: 
4679: /// Load storage state from AGENT_BROWSER_STATE if set.
4680: async fn try_load_storage_state(state: &mut DaemonState, path: &Option<String>) {
4681:     let _ = load_storage_state(state, path).await;
4682: }
4683: 
4684: // ---------------------------------------------------------------------------
4685: // Phase 1 handlers
4686: // ---------------------------------------------------------------------------
4687: 
4688: async fn handle_launch(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
4689:     let effective_ca_cert = resolve_effective_ca_cert(cmd, state)?;
4690:     // Absent field falls back to the daemon's spawn-time env (mirrors
4691:     // hideScrollbars/webgpu), keeping the launch hash stable when follow-up
4692:     // commands send launch envelopes without an explicit headed choice.
4693:     let headless = cmd
4694:         .get("headless")
4695:         .and_then(|v| v.as_bool())
4696:         .unwrap_or_else(|| !headed_from_env());
4697:     let cdp_url = cmd.get("cdpUrl").and_then(|v| v.as_str());
4698:     let cdp_port = cmd.get("cdpPort").and_then(|v| v.as_u64());
4699:     let auto_connect = cmd
4700:         .get("autoConnect")
4701:         .and_then(|v| v.as_bool())
4702:         .unwrap_or(false);
4703:     let provider_name = cmd.get("provider").and_then(|v| v.as_str());
4704:     if state.isolate_context && cdp_url.is_none() && cdp_port.is_none() && !auto_connect {
4705:         return Err(
4706:             "--isolate-context requires --cdp, --auto-connect, or connect <port|url>".to_string(),
4707:         );
4708:     }
4709:     let enable_features =
4710:         string_array_from_command(cmd, "enable").unwrap_or_else(launch_enable_features_from_env);
4711:     let init_script_paths = string_array_from_command(cmd, "initScripts")
4712:         .unwrap_or_else(launch_init_script_paths_from_env);
4713: 
4714:     let extensions: Option<Vec<String>> =
4715:         cmd.get("extensions").and_then(|v| v.as_array()).map(|arr| {
4716:             arr.iter()
4717:                 .filter_map(|v| v.as_str().map(String::from))
4718:                 .collect()
4719:         });
4720:     let storage_state = cmd.get("storageState").and_then(|v| v.as_str());
4721:     let storage_state_owned = storage_state.map(|s| s.to_string());
4722:     let engine = cmd
4723:         .get("engine")
4724:         .and_then(|v| v.as_str())
4725:         .map(String::from)
4726:         .or_else(|| env::var("AGENT_BROWSER_ENGINE").ok());
4727:     let profile = cmd
4728:         .get("profile")
4729:         .and_then(|v| v.as_str())
4730:         .map(String::from);

BASE SOURCE cli/src/native/actions.rs
4920:             close_current_browser(state).await?;
4921:         }
4922:     } else {
4923:         load_storage_state(state, &storage_state_owned).await?;
4924:         state.effective_ca_cert = effective_ca_cert;
4925:         return Ok(json!({ "launched": true, "reused": true, "relaunchedBrowser": false }));
4926:     }
4927:     state.ref_map.clear();
4928:     state.session_setup = SessionSetup::default();
4929: 
4930:     let has_cdp = cdp_url.is_some() || cdp_port.is_some();
4931:     super::browser::validate_launch_options(
4932:         launch_options.extensions.as_deref(),
4933:         has_cdp,
4934:         launch_options.profile.as_deref(),
4935:         storage_state,
4936:         launch_options.allow_file_access,
4937:         launch_options.executable_path.as_deref(),
4938:         launch_options.ca_cert.as_deref(),
4939:     )?;
4940: 
4941:     // Store proxy credentials before any local or remote CDP branch enables
4942:     // Fetch interception with authentication handling.
4943:     let has_proxy_auth = launch_options.proxy_username.is_some();
4944:     if has_proxy_auth {
4945:         let mut creds = state.proxy_credentials.write().await;
4946:         *creds = Some((
4947:             launch_options.proxy_username.clone().unwrap_or_default(),
4948:             launch_options.proxy_password.clone().unwrap_or_default(),
4949:         ));
4950:     }
4951: 
4952:     if let Some(url) = cdp_url {
4953:         state.reset_input_state();
4954:         state.browser = Some(connect_external_cdp(state, url).await?);
4955:         state.launch_hash = Some(new_hash);
4956:         state.subscribe_to_browser_events();
4957:         state.start_fetch_handler();
4958:         state.start_dialog_handler();
4959:         apply_tab_binding_on_attach_or_rollback(state).await?;
4960:         state.update_stream_client().await;
4961:         install_network_controls_or_close(state, has_proxy_auth).await?;
4962:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4963:         try_auto_restore_state(state).await;
4964:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
4965:         state.effective_ca_cert = effective_ca_cert;
4966:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
4967:     }
4968: 
4969:     if let Some(port) = cdp_port {
4970:         state.reset_input_state();
4971:         state.browser = Some(connect_external_cdp(state, &port.to_string()).await?);
4972:         state.launch_hash = Some(new_hash);
4973:         state.subscribe_to_browser_events();
4974:         state.start_fetch_handler();
4975:         state.start_dialog_handler();
4976:         apply_tab_binding_on_attach_or_rollback(state).await?;
4977:         state.update_stream_client().await;
4978:         install_network_controls_or_close(state, has_proxy_auth).await?;
4979:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
4980:         try_auto_restore_state(state).await;
4981:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
4982:         state.effective_ca_cert = effective_ca_cert;
4983:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
4984:     }
4985: 
4986:     if auto_connect {
4987:         state.reset_input_state();
4988:         state.browser = Some(connect_external_auto(state).await?);
4989:         if !apply_tab_binding_on_attach_or_rollback(state).await? {
4990:             if let Err(e) = open_fresh_tab_for_auto_connect(state).await {
4991:                 let _ = rollback_failed_launch(state).await;
4992:                 return Err(e);
4993:             }
4994:         }
4995:         state.launch_hash = Some(new_hash);
4996:         state.subscribe_to_browser_events();
4997:         state.start_fetch_handler();
4998:         state.start_dialog_handler();
4999:         state.update_stream_client().await;
5000:         install_network_controls_or_close(state, has_proxy_auth).await?;
5001:         apply_launch_init_scripts(state, &enable_features, &init_script_paths).await;
5002:         try_auto_restore_state(state).await;
5003:         load_storage_state_or_rollback(state, &storage_state_owned).await?;
5004:         state.effective_ca_cert = effective_ca_cert;
5005:         return Ok(json!({ "launched": true, "relaunchedBrowser": had_browser_before_launch }));
5006:     }
5007: 
5008:     if let Some(provider) = provider_name {
5009:         match provider.to_lowercase().as_str() {
5010:             "ios" => {
5011:                 let result = launch_ios(cmd, state).await;
5012:                 if result.is_ok() {
5013:                     state.effective_ca_cert = effective_ca_cert;
5014:                 }
5015:                 return result;

BASE SOURCE cli/src/native/actions.rs
5480:                 .get("script")
5481:                 .and_then(|v| v.as_str())
5482:                 .ok_or("Missing 'script' parameter")?;
5483:             let result = wb.evaluate(script).await?;
5484:             let url = wb.get_url().await.unwrap_or_default();
5485:             return Ok(json!({ "result": result, "origin": url }));
5486:         }
5487:     }
5488:     let mgr = state.browser.as_ref().ok_or("Browser not launched")?;
5489:     let script = cmd
5490:         .get("script")
5491:         .and_then(|v| v.as_str())
5492:         .ok_or("Missing 'script' parameter")?;
5493: 
5494:     let result = mgr.evaluate(script, None).await?;
5495:     let url = mgr.get_url().await.unwrap_or_default();
5496:     Ok(json!({ "result": result, "origin": url }))
5497: }
5498: 
5499: async fn handle_close(state: &mut DaemonState) -> Result<Value, String> {
5500:     prepare_internal_daemon_shutdown(state).await;
5501:     let save_result = auto_save_restore_state(state).await;
5502:     if let Some(ref mut manager) = state.browser {
5503:         if manager.is_isolated() {
5504:             manager.dispose_owned_contexts().await?;
5505:             tab_binding::clear(&state.session_id);
5506:             state.last_persisted_binding = None;
5507:             state.isolate_context = false;
5508:             state.context_recreated = false;
5509:         }
5510:     }
5511:     close_all_browser_backends(state).await?;
5512: 
5513:     // Stop background Fetch handler
5514:     if let Some(task) = state.fetch_handler_task.take() {
5515:         task.abort();
5516:     }
5517:     {
5518:         let mut map = state.origin_headers.write().await;
5519:         map.clear();
5520:     }
5521:     state.session_setup = SessionSetup::default();
5522: 
5523:     if let Some(server) = state.inspect_server.take() {
5524:         server.shutdown();
5525:     }
5526: 
5527:     state.ref_map.clear();
5528:     match save_result {
5529:         Ok(Some(path)) => Ok(json!({
5530:             "closed": true,
5531:             "restoreStatus": state.restore_status,
5532:             "saveStatus": state.restore_save_status,
5533:             "statePath": path
5534:         })),
5535:         Ok(None) => Ok(json!({
5536:             "closed": true,
5537:             "restoreStatus": state.restore_status,
5538:             "saveStatus": state.restore_save_status
5539:         })),
5540:         Err(err) => Ok(json!({
5541:             "closed": true,
5542:             "restoreStatus": state.restore_status,
5543:             "saveStatus": state.restore_save_status,
5544:             "saveError": err
5545:         })),
5546:     }
5547: }
5548: 
5549: // ---------------------------------------------------------------------------
5550: // Phase 2 handlers
5551: // ---------------------------------------------------------------------------
5552: 
5553: async fn handle_snapshot(cmd: &Value, state: &mut DaemonState) -> Result<Value, String> {
5554:     let mgr = state.browser.as_ref().ok_or("Browser not launched")?;
5555:     let session_id = mgr.active_session_id()?.to_string();
5556: 
5557:     let options = SnapshotOptions {
5558:         selector: cmd
5559:             .get("selector")
5560:             .and_then(|v| v.as_str())
5561:             .map(String::from),
5562:         interactive: cmd
5563:             .get("interactive")
5564:             .and_then(|v| v.as_bool())
5565:             .unwrap_or(false),
5566:         compact: cmd
5567:             .get("compact")
5568:             .and_then(|v| v.as_bool())
5569:             .unwrap_or(false),
5570:         depth: cmd

BASE SOURCE cli/src/native/browser.rs
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

BASE SOURCE cli/src/native/browser.rs
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
1486:                 .is_some_and(|id| self.owned_browser_context_ids.contains(id))
1487:     }
1488: 
1489:     pub fn register_owned_context(&mut self, context_id: String) {
1490:         self.owned_browser_context_ids.insert(context_id);
1491:     }
1492: 
1493:     pub fn unregister_owned_context(&mut self, context_id: &str) {
1494:         self.owned_browser_context_ids.remove(context_id);
1495:         if self.primary_browser_context_id.as_deref() == Some(context_id) {
1496:             self.primary_browser_context_id = None;
1497:             self.isolated_context_unpersisted = false;
1498:         }
1499:     }
1500: 
1501:     pub fn mark_isolated_context_persisted(&mut self) {
1502:         self.isolated_context_unpersisted = false;
1503:     }
1504: 
1505:     pub async fn dispose_unpersisted_isolated_context(&mut self) -> Result<(), String> {
1506:         if !self.isolated_context_unpersisted {
1507:             return Ok(());
1508:         }
1509:         let Some(context_id) = self.primary_browser_context_id.clone() else {
1510:             return Ok(());
1511:         };
1512:         self.dispose_browser_context(&context_id).await
1513:     }
1514: 
1515:     pub async fn dispose_browser_context(&mut self, context_id: &str) -> Result<(), String> {
1516:         self.client
1517:             .send_command(
1518:                 "Target.disposeBrowserContext",
1519:                 Some(json!({ "browserContextId": context_id })),
1520:                 None,
1521:             )
1522:             .await?;
1523:         self.unregister_owned_context(context_id);
1524:         self.pages
1525:             .retain(|page| page.browser_context_id.as_deref() != Some(context_id));

BASE SOURCE cli/src/native/browser.rs
2340:     }
2341: 
2342:     pub fn pages_list(&self) -> Vec<PageInfo> {
2343:         self.pages.clone()
2344:     }
2345: 
2346:     pub fn visited_origins(&self) -> &HashSet<String> {
2347:         &self.visited_origins
2348:     }
2349: 
2350:     pub async fn set_download_behavior(&self, download_path: &str) -> Result<(), String> {
2351:         let session_id = self.active_session_id()?;
2352:         self.client
2353:             .send_command(
2354:                 "Browser.setDownloadBehavior",
2355:                 Some(json!({
2356:                     "behavior": "allowAndName",
2357:                     "downloadPath": download_path,
2358:                     "eventsEnabled": true,
2359:                 })),
2360:                 Some(session_id),
2361:             )
2362:             .await?;
2363:         Ok(())
2364:     }
2365: }
2366: 
2367: /// Core network-idle polling loop, extracted so it can be unit-tested without a
2368: /// full `BrowserManager` / CDP connection.
2369: ///
2370: /// Returns `Ok(())` once no network requests have been in-flight for at least
2371: /// 500 ms, or `Err` if `overall_timeout` elapses first.
2372: async fn poll_network_idle(
2373:     session_id: &str,
2374:     rx: &mut broadcast::Receiver<CdpEvent>,
2375:     overall_timeout: tokio::time::Duration,

BASE SOURCE cli/src/connection.rs
560:     }
561:     if let Some(ap) = opts.action_policy {
562:         cmd.env("AGENT_BROWSER_ACTION_POLICY", ap);
563:     }
564:     if let Some(ca) = opts.confirm_actions {
565:         cmd.env("AGENT_BROWSER_CONFIRM_ACTIONS", ca);
566:     }
567:     if let Some(engine) = opts.engine {
568:         cmd.env("AGENT_BROWSER_ENGINE", engine);
569:     }
570:     if opts.auto_connect {
571:         cmd.env("AGENT_BROWSER_AUTO_CONNECT", "1");
572:     }
573:     if opts.pin_tab {
574:         cmd.env("AGENT_BROWSER_PIN_TAB", "1");
575:     }
576:     if opts.isolate_context {
577:         cmd.env("AGENT_BROWSER_ISOLATE_CONTEXT", "1");
578:     }
579:     if let Some(idle) = opts.idle_timeout {
580:         cmd.env("AGENT_BROWSER_IDLE_TIMEOUT_MS", idle);
581:     }
582:     if let Some(timeout) = opts.default_timeout {
583:         cmd.env("AGENT_BROWSER_DEFAULT_TIMEOUT", timeout.to_string());
584:     }
585:     if let Some(cdp) = opts.cdp {
586:         cmd.env("AGENT_BROWSER_CDP", cdp);
587:     }
588:     if opts.no_auto_dialog {
589:         cmd.env("AGENT_BROWSER_NO_AUTO_DIALOG", "1");
590:     }
