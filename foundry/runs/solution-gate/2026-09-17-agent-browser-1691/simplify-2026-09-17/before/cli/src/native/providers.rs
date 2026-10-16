//! Browser provider connections for remote CDP sessions.
//!
//! Supports AgentCore, Browserbase, Browserless, Browser Use, and Kernel providers.
//! Each provider returns a CDP WebSocket URL for connecting via BrowserManager.

use serde_json::{json, Value};
use std::env;
use std::path::PathBuf;
use std::time::Duration;

const BROWSER_USE_API_BASE: &str = "https://api.browser-use.com/api/v4";
const BROWSER_USE_CREATE_DEADLINE: Duration = Duration::from_secs(10);
const BROWSER_USE_STOP_DEADLINE: Duration = Duration::from_secs(4);

/// Provider session info for cleanup on failure.
#[derive(Debug, Clone)]
pub struct ProviderSession {
    pub provider: String,
    pub session_id: String,
}

#[derive(Debug)]
pub struct ProviderConnection {
    pub ws_url: String,
    pub session: Option<ProviderSession>,
    /// If true, the WebSocket IS the page session (no Target.* commands).
    pub direct_page: bool,
    pub metadata: Option<Value>,
}

/// Connects to the specified browser provider and returns a CDP WebSocket URL
/// along with session info for cleanup on failure.
pub async fn connect_provider(provider_name: &str) -> Result<ProviderConnection, String> {
    let plugins = crate::plugins::plugins_from_env();
    connect_provider_with_plugins(provider_name, &plugins).await
}

/// Connects to a built-in provider or a plugin provider from the supplied
/// registry. Callers that already loaded config must use this helper so policy
/// checks and provider execution consult the same plugin list.
pub async fn connect_provider_with_plugins(
    provider_name: &str,
    plugins: &[crate::plugins::PluginConfig],
) -> Result<ProviderConnection, String> {
    connect_provider_with_plugins_and_options(provider_name, plugins, None).await
}

/// Connects to a built-in provider or plugin provider with launch options
/// supplied by the command that requested the provider. Built-in providers keep
/// their existing environment-based behavior; plugin providers receive these
/// options in the stdio protocol request.
pub async fn connect_provider_with_plugins_and_options(
    provider_name: &str,
    plugins: &[crate::plugins::PluginConfig],
    launch_options: Option<Value>,
) -> Result<ProviderConnection, String> {
    match provider_name.to_lowercase().as_str() {
        "browserbase" => {
            let (url, session) = connect_browserbase().await?;
            Ok(ProviderConnection {
                ws_url: url,
                session,
                direct_page: false,
                metadata: None,
            })
        }
        "browserless" => {
            let (url, session) = connect_browserless().await?;
            Ok(ProviderConnection {
                ws_url: url,
                session,
                direct_page: false,
                metadata: None,
            })
        }
        "browser-use" | "browseruse" => {
            let (url, session) = connect_browser_use().await?;
            Ok(ProviderConnection {
                ws_url: url,
                session,
                direct_page: false,
                metadata: None,
            })
        }
        "kernel" => {
            let (url, session) = connect_kernel().await?;
            Ok(ProviderConnection {
                ws_url: url,
                session,
                direct_page: false,
                metadata: None,
            })
        }
        "agentcore" => {
            let (url, session) = connect_agentcore().await?;
            Ok(ProviderConnection {
                ws_url: url,
                session,
                direct_page: false,
                metadata: None,
            })
        }
        _ => {
            connect_plugin_provider_with_plugins_and_options(provider_name, plugins, launch_options)
                .await
        }
    }
}

/// Close a provider session (call on CDP connect failure).
pub async fn close_provider_session(session: &ProviderSession) -> Result<(), String> {
    let plugins = crate::plugins::plugins_from_env();
    close_provider_session_with_plugins(session, &plugins).await
}

/// Close a provider session with the plugin registry that created it.
pub async fn close_provider_session_with_plugins(
    session: &ProviderSession,
    plugins: &[crate::plugins::PluginConfig],
) -> Result<(), String> {
    if let Some(plugin_name) = session.provider.strip_prefix("plugin:") {
        if let Ok(cleanup) = serde_json::from_str::<Value>(&session.session_id) {
            let _ =
                crate::plugins::close_browser_provider_with_plugins(plugin_name, plugins, cleanup)
                    .await;
        }
        return Ok(());
    }

    let client = reqwest::Client::new();
    match session.provider.as_str() {
        "browserbase" => {
            if let Ok(api_key) = env::var("BROWSERBASE_API_KEY") {
                let _ = client
                    .post(format!(
                        "https://api.browserbase.com/v1/sessions/{}",
                        session.session_id
                    ))
                    .header("Content-Type", "application/json")
                    .header("X-BB-API-Key", &api_key)
                    .json(&serde_json::json!({ "status": "REQUEST_RELEASE" }))
                    .send()
                    .await;
            }
        }
        "browser-use" => {
            return stop_browser_use_session_at(
                BROWSER_USE_API_BASE,
                &session.session_id,
                BROWSER_USE_STOP_DEADLINE,
            )
            .await;
        }
        "browserless" => {
            // session_id holds the stop URL for browserless
            let _ = client.delete(&session.session_id).send().await;
        }
        "kernel" => {
            if let Ok(api_key) = env::var("KERNEL_API_KEY") {
                let endpoint = env::var("KERNEL_ENDPOINT")
                    .unwrap_or_else(|_| "https://api.onkernel.com".to_string());
                let _ = client
                    .delete(format!(
                        "{}/browsers/{}",
                        endpoint.trim_end_matches('/'),
                        session.session_id
                    ))
                    .header("Authorization", format!("Bearer {}", api_key))
                    .send()
                    .await;
            }
        }
        "agentcore" => {
            // AgentCore session cleanup is handled via signed DELETE request
            let _ = close_agentcore_session(&session.session_id).await;
        }
        _ => {}
    }
    Ok(())
}

pub async fn connect_plugin_provider_with_plugins(
    provider_name: &str,
    plugins: &[crate::plugins::PluginConfig],
) -> Result<ProviderConnection, String> {
    connect_plugin_provider_with_plugins_and_options(provider_name, plugins, None).await
}

pub async fn connect_plugin_provider_with_plugins_and_options(
    provider_name: &str,
    plugins: &[crate::plugins::PluginConfig],
    launch_options: Option<Value>,
) -> Result<ProviderConnection, String> {
    if crate::plugins::find_plugin(plugins, provider_name).is_none() {
        return Err(format!(
            "Unknown provider '{}'. Supported: browserbase, browserless, browser-use, kernel, agentcore, or a configured plugin with browser.provider",
            provider_name
        ));
    }

    let mut plugin_launch_options = serde_json::Map::new();
    plugin_launch_options.insert(
        "headed".to_string(),
        json!(env_var_is_truthy("AGENT_BROWSER_HEADED")),
    );
    plugin_launch_options.insert(
        "engine".to_string(),
        json!(env::var("AGENT_BROWSER_ENGINE").unwrap_or_else(|_| "chrome".to_string())),
    );
    plugin_launch_options.insert(
        "userAgent".to_string(),
        json!(env::var("AGENT_BROWSER_USER_AGENT").ok()),
    );
    plugin_launch_options.insert(
        "colorScheme".to_string(),
        json!(env::var("AGENT_BROWSER_COLOR_SCHEME").ok()),
    );

    if let Some(Value::Object(command_options)) = launch_options {
        for (key, value) in command_options {
            plugin_launch_options.insert(key, value);
        }
    }

    let request = json!({
        "provider": provider_name,
        "session": env::var("AGENT_BROWSER_SESSION").unwrap_or_else(|_| "default".to_string()),
        "launchOptions": Value::Object(plugin_launch_options),
    });
    let browser =
        crate::plugins::connect_browser_provider_with_plugins(provider_name, plugins, request)
            .await?;
    let session = browser.cleanup.as_ref().map(|cleanup| ProviderSession {
        provider: format!("plugin:{}", provider_name),
        session_id: serde_json::to_string(cleanup).unwrap_or_else(|_| "{}".to_string()),
    });
    Ok(ProviderConnection {
        ws_url: browser.cdp_url,
        session,
        direct_page: browser.direct_page,
        metadata: browser.metadata,
    })
}

fn env_var_is_truthy(name: &str) -> bool {
    match env::var(name) {
        Ok(val) => !matches!(val.to_ascii_lowercase().as_str(), "0" | "false" | "no" | ""),
        Err(_) => false,
    }
}

async fn connect_browserbase() -> Result<(String, Option<ProviderSession>), String> {
    let api_key = env::var("BROWSERBASE_API_KEY")
        .map_err(|_| "BROWSERBASE_API_KEY environment variable is not set")?;

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.browserbase.com/v1/sessions")
        .header("content-type", "application/json")
        .header("x-bb-api-key", &api_key)
        .body("{}")
        .send()
        .await
        .map_err(|e| format!("Browserbase request failed: {}", e))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Browserbase response: {}", e))?;

    if !status.is_success() {
        return Err(format!(
            "Browserbase API error ({}): {}",
            status.as_u16(),
            body
        ));
    }

    let json: Value =
        serde_json::from_str(&body).map_err(|e| format!("Invalid Browserbase response: {}", e))?;

    let session_id = json
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let ws_url = json
        .get("connectUrl")
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| "Browserbase response missing connectUrl".to_string())?;

    Ok((
        ws_url,
        Some(ProviderSession {
            provider: "browserbase".to_string(),
            session_id,
        }),
    ))
}

async fn connect_browserless() -> Result<(String, Option<ProviderSession>), String> {
    let api_key = env::var("BROWSERLESS_API_KEY")
        .map_err(|_| "BROWSERLESS_API_KEY environment variable is not set")?;

    let api_url = env::var("BROWSERLESS_API_URL")
        .unwrap_or_else(|_| "https://production-sfo.browserless.io".to_string());
    let browser_type =
        env::var("BROWSERLESS_BROWSER_TYPE").unwrap_or_else(|_| "chromium".to_string());

    let supported = ["chromium", "chrome"];
    if !supported.contains(&browser_type.as_str()) {
        return Err(format!(
            "BROWSERLESS_BROWSER_TYPE \"{}\" is not supported. Only {} are allowed.",
            browser_type,
            supported.join(", ")
        ));
    }

    let ttl: u64 = env::var("BROWSERLESS_TTL")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(300000);
    let stealth = env::var("BROWSERLESS_STEALTH")
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(true);

    let url = format!("{}/session", api_url.trim_end_matches('/'));

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .query(&[("token", &api_key)])
        .header("Content-Type", "application/json")
        .json(&json!({
            "ttl": ttl,
            "stealth": stealth,
            "browser": browser_type,
        }))
        .send()
        .await
        .map_err(|e| format!("Browserless request failed: {}", e))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Browserless response: {}", e))?;

    if !status.is_success() {
        return Err(format!(
            "Browserless API error ({}): {}",
            status.as_u16(),
            body
        ));
    }

    let json: Value =
        serde_json::from_str(&body).map_err(|e| format!("Invalid Browserless response: {}", e))?;

    let connect_url = json
        .get("connect")
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| "Browserless response missing 'connect' URL".to_string())?;

    let stop_url = json
        .get("stop")
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| "Browserless response missing 'stop' URL".to_string())?;

    Ok((
        connect_url,
        Some(ProviderSession {
            provider: "browserless".to_string(),
            // Store the stop URL as the session_id for cleanup
            session_id: stop_url,
        }),
    ))
}

async fn connect_browser_use() -> Result<(String, Option<ProviderSession>), String> {
    connect_browser_use_at(
        BROWSER_USE_API_BASE,
        BROWSER_USE_CREATE_DEADLINE,
        BROWSER_USE_STOP_DEADLINE,
    )
    .await
}

const BROWSER_USE_UNKNOWN_OUTCOME: &str =
    "the browser may still have been created; inspect Browser Use Cloud before retrying";

fn browser_use_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "Browser Use HTTP client could not be initialized".to_string())
}

pub fn browser_use_receipt_path(id: &uuid::Uuid) -> PathBuf {
    crate::connection::get_socket_dir().join(format!("browser-use-{}.receipt", id))
}

fn browser_use_receipt_contents(id: &uuid::Uuid) -> String {
    format!(
        "Browser Use Cloud recovery receipt\n\
         provider: browser-use\n\
         browser_id: {id}\n\
         \n\
         This receipt may remain after a confirmed stop if local cleanup fails.\n\
         Check Cloud before stopping a browser or deleting this receipt.\n\
         Stop it manually with your API key:\n\
         \n\
         curl -X PATCH {BROWSER_USE_API_BASE}/browsers/{id} \\\n\
           -H \"X-Browser-Use-API-Key: $BROWSER_USE_API_KEY\" \\\n\
           -H \"Content-Type: application/json\" \\\n\
           -d '{{\"action\":\"stop\"}}'\n\
         \n\
         Or stop it from https://cloud.browser-use.com\n\
         Delete this file once the browser is confirmed stopped.\n"
    )
}

async fn preflight_browser_use_receipt_dir() -> Result<(), String> {
    let dir = crate::connection::get_socket_dir();
    tokio::task::spawn_blocking(move || {
        std::fs::create_dir_all(&dir)?;
        let probe = dir.join(format!(".browser-use-probe-{}", uuid::Uuid::new_v4()));
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&probe)?;
        std::fs::remove_file(probe)
    })
    .await
    .map_err(|_| "Browser Use recovery storage check failed".to_string())?
    .map_err(|_| {
        "Browser Use recovery storage is not writable; refusing to create a cloud browser"
            .to_string()
    })
}

pub async fn connect_browser_use_owned<F>(
    on_session: F,
) -> Result<(String, Option<ProviderSession>), String>
where
    F: FnMut(Option<ProviderSession>),
{
    connect_browser_use_at_with_owner(
        BROWSER_USE_API_BASE,
        BROWSER_USE_CREATE_DEADLINE,
        BROWSER_USE_STOP_DEADLINE,
        on_session,
    )
    .await
}

async fn connect_browser_use_at(
    base: &str,
    create_deadline: Duration,
    stop_deadline: Duration,
) -> Result<(String, Option<ProviderSession>), String> {
    connect_browser_use_at_with_owner(base, create_deadline, stop_deadline, |_| {}).await
}

async fn connect_browser_use_at_with_owner<F>(
    base: &str,
    create_deadline: Duration,
    stop_deadline: Duration,
    mut on_session: F,
) -> Result<(String, Option<ProviderSession>), String>
where
    F: FnMut(Option<ProviderSession>),
{
    let api_key = env::var("BROWSER_USE_API_KEY")
        .map_err(|_| "BROWSER_USE_API_KEY environment variable is not set")?;

    preflight_browser_use_receipt_dir().await?;

    let response = browser_use_client()?
        .post(format!("{}/browsers", base))
        .header("X-Browser-Use-API-Key", &api_key)
        .header("Content-Type", "application/json")
        .timeout(create_deadline)
        .json(&browser_use_create_body_from_lookup(|name| {
            env::var(name).ok()
        }))
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                format!(
                    "Browser Use create timed out after {}s; {}",
                    create_deadline.as_secs(),
                    BROWSER_USE_UNKNOWN_OUTCOME
                )
            } else {
                format!(
                    "Browser Use create request failed before a browser id was received; {}",
                    BROWSER_USE_UNKNOWN_OUTCOME
                )
            }
        })?;

    let status = response.status();
    let body = response.text().await.map_err(|e| {
        if e.is_timeout() {
            format!(
                "Browser Use create response stalled past the {}s deadline; {}",
                create_deadline.as_secs(),
                BROWSER_USE_UNKNOWN_OUTCOME
            )
        } else {
            format!(
                "Browser Use create response could not be read; {}",
                BROWSER_USE_UNKNOWN_OUTCOME
            )
        }
    })?;
    if !status.is_success() {
        return Err(format!(
            "Browser Use API error (status {}); {}",
            status.as_u16(),
            BROWSER_USE_UNKNOWN_OUTCOME
        ));
    }

    let response: Value = serde_json::from_str(&body).map_err(|_| {
        format!(
            "Browser Use returned an invalid create response; {}",
            BROWSER_USE_UNKNOWN_OUTCOME
        )
    })?;
    let id = response
        .get("id")
        .and_then(Value::as_str)
        .and_then(|raw| uuid::Uuid::parse_str(raw).ok())
        .ok_or_else(|| {
            format!(
                "Browser Use create response did not contain a valid browser id; {}",
                BROWSER_USE_UNKNOWN_OUTCOME
            )
        })?;

    if uuid::Uuid::parse_str(&api_key).ok() == Some(id) {
        return Err(format!(
            "Browser Use returned an invalid resource identity; {}",
            BROWSER_USE_UNKNOWN_OUTCOME
        ));
    }
    let session = ProviderSession {
        provider: "browser-use".to_string(),
        session_id: id.to_string(),
    };
    on_session(Some(session.clone()));
    let receipt_path = browser_use_receipt_path(&id);
    let write_path = receipt_path.clone();
    let written = tokio::task::spawn_blocking(move || {
        std::fs::write(write_path, browser_use_receipt_contents(&id))
    })
    .await;
    let ws_url = response
        .get("cdpUrl")
        .and_then(Value::as_str)
        .filter(|raw| {
            url::Url::parse(raw).is_ok_and(|url| {
                matches!(url.scheme(), "ws" | "wss" | "http" | "https") && url.host_str().is_some()
            })
        });
    let failure = if !matches!(written, Ok(Ok(()))) {
        "recovery receipt could not be written"
    } else if ws_url.is_none() {
        "browser did not include a usable cdpUrl"
    } else {
        return Ok((ws_url.unwrap().to_string(), Some(session)));
    };
    match stop_browser_use_session_at(base, &id.to_string(), stop_deadline).await {
        Ok(()) => {
            on_session(None);
            Err(format!("Browser Use {}; browser {} was stopped", failure, id))
        }
        Err(error) => Err(format!("Browser Use {}; rollback failed: {}. Retry close or stop browser {} in Browser Use Cloud", failure, error, id)),
    }
}

async fn stop_browser_use_session_at(
    base: &str,
    session_id: &str,
    deadline: Duration,
) -> Result<(), String> {
    let id = uuid::Uuid::parse_str(session_id).map_err(|_| {
        "Browser Use session id is not a valid UUID; refusing to send a stop request".to_string()
    })?;
    let api_key = env::var("BROWSER_USE_API_KEY").map_err(|_| {
        format!(
            "BROWSER_USE_API_KEY environment variable is not set; Browser Use browser {} was not stopped",
            id
        )
    })?;

    if uuid::Uuid::parse_str(&api_key).ok() == Some(id) {
        return Err(
            "Browser Use session identity matches a credential; refusing to expose it".to_string(),
        );
    }
    let response = browser_use_client()?
        .patch(format!("{}/browsers/{}", base, id))
        .header("X-Browser-Use-API-Key", &api_key)
        .header("Content-Type", "application/json")
        .timeout(deadline)
        .json(&json!({ "action": "stop" }))
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                format!(
                    "Browser Use stop timed out after {}s for browser {}",
                    deadline.as_secs(),
                    id
                )
            } else {
                format!("Browser Use stop request failed for browser {}", id)
            }
        })?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!(
            "Browser Use stop failed (status {}) for browser {}",
            status.as_u16(),
            id
        ));
    }
    let body = response.text().await.map_err(|_| {
        format!(
            "Browser Use stop response could not be read for browser {}",
            id
        )
    })?;
    let acknowledged = serde_json::from_str::<Value>(&body)
        .ok()
        .map(|view| {
            view.get("id")
                .and_then(Value::as_str)
                .and_then(|raw| uuid::Uuid::parse_str(raw).ok())
                == Some(id)
                && view.get("status").and_then(Value::as_str) == Some("stopped")
        })
        .unwrap_or(false);
    if !acknowledged {
        return Err(format!(
            "Browser Use stop response did not acknowledge browser {} as stopped",
            id
        ));
    }

    let _removal =
        tokio::task::spawn_blocking(move || std::fs::remove_file(browser_use_receipt_path(&id)));
    Ok(())
}

/// Build the supported Browser Use Cloud V4 options. Custom proxies are not exposed.
fn browser_use_create_body_from_lookup<F>(mut lookup: F) -> Value
where
    F: FnMut(&str) -> Option<String>,
{
    let mut body = serde_json::Map::new();

    if let Some(profile_id) = lookup("BROWSER_USE_PROFILE_ID").filter(|value| !value.is_empty()) {
        body.insert("profileId".to_string(), json!(profile_id));
    }

    if let Some(proxy_country) =
        lookup("BROWSER_USE_PROXY_COUNTRY").filter(|value| !value.is_empty())
    {
        let proxy_country = proxy_country.to_ascii_lowercase();
        body.insert(
            "proxyCountryCode".to_string(),
            if matches!(proxy_country.as_str(), "none" | "direct") {
                Value::Null
            } else {
                json!(proxy_country)
            },
        );
    }

    if let Some(recording) = lookup("BROWSER_USE_ENABLE_RECORDING") {
        body.insert(
            "enableRecording".to_string(),
            json!(!matches!(
                recording.to_ascii_lowercase().as_str(),
                "0" | "false" | "no" | ""
            )),
        );
    }

    Value::Object(body)
}

async fn connect_kernel() -> Result<(String, Option<ProviderSession>), String> {
    let api_key = env::var("KERNEL_API_KEY").ok();
    let endpoint =
        env::var("KERNEL_ENDPOINT").unwrap_or_else(|_| "https://api.onkernel.com".to_string());

    let url = format!("{}/browsers", endpoint.trim_end_matches('/'));

    let headless = env::var("KERNEL_HEADLESS")
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(true);
    let stealth = env::var("KERNEL_STEALTH")
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(false);
    let timeout_seconds = env::var("KERNEL_TIMEOUT_SECONDS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(300);

    let mut body = json!({
        "headless": headless,
        "stealth": stealth,
        "timeout_seconds": timeout_seconds,
    });

    if let Ok(profile) = env::var("KERNEL_PROFILE_NAME") {
        if !profile.is_empty() {
            body.as_object_mut()
                .unwrap()
                .insert("profile".to_string(), json!(profile));
        }
    }

    let client = reqwest::Client::new();
    let mut request = client.post(&url).header("Content-Type", "application/json");
    if let Some(ref key) = api_key {
        request = request.header("Authorization", format!("Bearer {}", key));
    }
    let response = request
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Kernel request failed: {}", e))?;

    let status = response.status();
    let resp_body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read Kernel response: {}", e))?;

    if !status.is_success() {
        return Err(format!(
            "Kernel API error ({}): {}",
            status.as_u16(),
            resp_body
        ));
    }

    let json: Value =
        serde_json::from_str(&resp_body).map_err(|e| format!("Invalid Kernel response: {}", e))?;

    let session_id = json
        .get("session_id")
        .or_else(|| json.get("id"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let ws_url = json
        .get("cdp_ws_url")
        .or_else(|| json.get("connectUrl"))
        .or_else(|| json.get("connect_url"))
        .or_else(|| json.get("cdpUrl"))
        .or_else(|| json.get("cdp_url"))
        .and_then(|v| v.as_str())
        .map(String::from)
        .ok_or_else(|| {
            "Kernel response missing cdp_ws_url, connectUrl, connect_url, cdpUrl, or cdp_url"
                .to_string()
        })?;

    Ok((
        ws_url,
        Some(ProviderSession {
            provider: "kernel".to_string(),
            session_id,
        }),
    ))
}

// ============================================================================
// AgentCore Provider (AWS Bedrock AgentCore Browser)
// ============================================================================

mod agentcore {
    use super::*;

    /// AgentCore-specific session info for Live View URL
    pub struct AgentCoreSessionInfo {
        pub session_id: String,
        pub browser_identifier: String,
        pub region: String,
        pub live_view_url: String,
    }

    thread_local! {
        static AGENTCORE_INFO: std::cell::RefCell<Option<AgentCoreSessionInfo>> = const { std::cell::RefCell::new(None) };
        static AGENTCORE_WS_HEADERS: std::cell::RefCell<Option<Vec<(String, String)>>> = const { std::cell::RefCell::new(None) };
    }

    pub fn set_agentcore_info(info: AgentCoreSessionInfo) {
        AGENTCORE_INFO.with(|cell| *cell.borrow_mut() = Some(info));
    }

    pub fn get_agentcore_info() -> Option<AgentCoreSessionInfo> {
        AGENTCORE_INFO.with(|cell| {
            cell.borrow().as_ref().map(|i| AgentCoreSessionInfo {
                session_id: i.session_id.clone(),
                browser_identifier: i.browser_identifier.clone(),
                region: i.region.clone(),
                live_view_url: i.live_view_url.clone(),
            })
        })
    }

    pub fn set_agentcore_ws_headers(headers: Vec<(String, String)>) {
        AGENTCORE_WS_HEADERS.with(|cell| *cell.borrow_mut() = Some(headers));
    }

    pub fn take_agentcore_ws_headers() -> Option<Vec<(String, String)>> {
        AGENTCORE_WS_HEADERS.with(|cell| cell.borrow_mut().take())
    }

    pub async fn connect() -> Result<(String, Option<ProviderSession>), String> {
        let region = env::var("AGENTCORE_REGION")
            .or_else(|_| env::var("AWS_REGION"))
            .or_else(|_| env::var("AWS_DEFAULT_REGION"))
            .unwrap_or_else(|_| "us-east-1".to_string());
        let browser_id =
            env::var("AGENTCORE_BROWSER_ID").unwrap_or_else(|_| "aws.browser.v1".to_string());
        let timeout_secs: u64 = env::var("AGENTCORE_SESSION_TIMEOUT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3600);

        let host = format!("bedrock-agentcore.{}.amazonaws.com", region);
        let path = format!(
            "/browsers/{}/sessions/start",
            urlencoding::encode(&browser_id)
        );
        let url = format!("https://{}{}", host, path);

        // Generate a unique session name
        let session_name = format!("agent-browser-{}", &uuid::Uuid::new_v4().to_string()[..8]);

        let mut body_json = json!({
            "name": session_name,
            "sessionTimeoutSeconds": timeout_secs
        });
        if let Ok(profile_id) = env::var("AGENTCORE_PROFILE_ID") {
            if !profile_id.is_empty() {
                body_json.as_object_mut().unwrap().insert(
                    "profileConfiguration".to_string(),
                    json!({ "profileIdentifier": profile_id }),
                );
            }
        }
        let body = serde_json::to_string(&body_json)
            .map_err(|e| format!("Failed to serialize request body: {}", e))?;

        let signed_headers = sign_request("PUT", &url, &region, Some(&body)).await?;

        let client = reqwest::Client::new();
        let mut req = client.put(&url).body(body.clone());
        for (key, value) in &signed_headers {
            req = req.header(key.as_str(), value.as_str());
        }

        let response = req
            .send()
            .await
            .map_err(|e| format!("AgentCore request failed: {}", e))?;

        let status = response.status();
        let resp_body = response
            .text()
            .await
            .map_err(|e| format!("Failed to read AgentCore response: {}", e))?;

        if !status.is_success() {
            return Err(format!(
                "AgentCore API error ({}): {}",
                status.as_u16(),
                resp_body
            ));
        }

        let json: Value = serde_json::from_str(&resp_body)
            .map_err(|e| format!("Invalid AgentCore response: {}", e))?;

        let session_id = json
            .get("sessionId")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "AgentCore response missing sessionId".to_string())?
            .to_string();

        let browser_identifier = json
            .get("browserIdentifier")
            .and_then(|v| v.as_str())
            .unwrap_or(&browser_id)
            .to_string();

        let live_view_url = format!(
            "https://{}.console.aws.amazon.com/bedrock-agentcore/browser/{}/session/{}#",
            region, browser_identifier, session_id
        );

        set_agentcore_info(AgentCoreSessionInfo {
            session_id: session_id.clone(),
            browser_identifier: browser_identifier.clone(),
            region: region.clone(),
            live_view_url: live_view_url.clone(),
        });

        eprintln!("Session: {}", session_id);
        eprintln!("Live View: {}", live_view_url);

        let ws_path = format!(
            "/browser-streams/{}/sessions/{}/automation",
            browser_identifier, session_id
        );
        let ws_url = format!("wss://{}{}", host, ws_path);

        let ws_headers = sign_request(
            "GET",
            &format!("https://{}{}", host, ws_path),
            &region,
            None,
        )
        .await?;
        set_agentcore_ws_headers(ws_headers);

        Ok((
            ws_url,
            Some(ProviderSession {
                provider: "agentcore".to_string(),
                session_id,
            }),
        ))
    }

    /// Get AWS credentials from environment variables or AWS CLI
    fn get_aws_credentials() -> Result<(String, String, Option<String>), String> {
        // First try environment variables
        if let (Ok(access_key), Ok(secret_key)) = (
            env::var("AWS_ACCESS_KEY_ID"),
            env::var("AWS_SECRET_ACCESS_KEY"),
        ) {
            return Ok((access_key, secret_key, env::var("AWS_SESSION_TOKEN").ok()));
        }

        // Fall back to AWS CLI
        let mut cmd = std::process::Command::new("aws");
        cmd.args(["configure", "export-credentials", "--format", "env"]);

        // Honor AWS_PROFILE
        if let Ok(profile) = env::var("AWS_PROFILE") {
            cmd.args(["--profile", &profile]);
        }

        let output = cmd.output()
            .map_err(|e| format!("Failed to run aws CLI: {}. Install AWS CLI or set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "AWS CLI failed: {}. Run 'aws sso login' or set credentials",
                stderr.trim()
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut access_key = None;
        let mut secret_key = None;
        let mut session_token = None;

        for line in stdout.lines() {
            if let Some(val) = line.strip_prefix("export AWS_ACCESS_KEY_ID=") {
                access_key = Some(val.to_string());
            } else if let Some(val) = line.strip_prefix("export AWS_SECRET_ACCESS_KEY=") {
                secret_key = Some(val.to_string());
            } else if let Some(val) = line.strip_prefix("export AWS_SESSION_TOKEN=") {
                session_token = Some(val.to_string());
            }
        }

        match (access_key, secret_key) {
            (Some(ak), Some(sk)) => Ok((ak, sk, session_token)),
            _ => Err("Failed to parse credentials from AWS CLI output".to_string()),
        }
    }

    async fn sign_request(
        method: &str,
        url: &str,
        region: &str,
        body: Option<&str>,
    ) -> Result<Vec<(String, String)>, String> {
        use hmac::{Hmac, Mac};
        use sha2::{Digest, Sha256};

        // Get credentials from environment or AWS CLI
        let (access_key, secret_key, session_token) = get_aws_credentials()?;

        let parsed_url = url::Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;
        let host = parsed_url.host_str().unwrap_or("");

        // Get current time
        let now = chrono::Utc::now();
        let amz_date = now.format("%Y%m%dT%H%M%SZ").to_string();
        let date_stamp = now.format("%Y%m%d").to_string();

        // Create canonical request
        let payload_hash = if let Some(b) = body {
            let mut hasher = Sha256::new();
            hasher.update(b.as_bytes());
            hex::encode(hasher.finalize())
        } else {
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855".to_string()
            // empty string hash
        };

        let canonical_uri = parsed_url.path();
        let canonical_querystring = parsed_url.query().unwrap_or("");

        let mut signed_headers = "content-type;host;x-amz-date".to_string();
        let mut canonical_headers = format!(
            "content-type:application/json\nhost:{}\nx-amz-date:{}\n",
            host, amz_date
        );

        if let Some(ref token) = session_token {
            signed_headers = "content-type;host;x-amz-date;x-amz-security-token".to_string();
            canonical_headers = format!(
                "content-type:application/json\nhost:{}\nx-amz-date:{}\nx-amz-security-token:{}\n",
                host, amz_date, token
            );
        }

        let canonical_request = format!(
            "{}\n{}\n{}\n{}\n{}\n{}",
            method,
            canonical_uri,
            canonical_querystring,
            canonical_headers,
            signed_headers,
            payload_hash
        );

        // Create string to sign
        let algorithm = "AWS4-HMAC-SHA256";
        let credential_scope = format!("{}/{}/bedrock-agentcore/aws4_request", date_stamp, region);

        let mut hasher = Sha256::new();
        hasher.update(canonical_request.as_bytes());
        let canonical_request_hash = hex::encode(hasher.finalize());

        let string_to_sign = format!(
            "{}\n{}\n{}\n{}",
            algorithm, amz_date, credential_scope, canonical_request_hash
        );

        // Calculate signature
        type HmacSha256 = Hmac<Sha256>;

        let k_date = HmacSha256::new_from_slice(format!("AWS4{}", secret_key).as_bytes())
            .unwrap()
            .chain_update(date_stamp.as_bytes())
            .finalize()
            .into_bytes();

        let k_region = HmacSha256::new_from_slice(&k_date)
            .unwrap()
            .chain_update(region.as_bytes())
            .finalize()
            .into_bytes();

        let k_service = HmacSha256::new_from_slice(&k_region)
            .unwrap()
            .chain_update(b"bedrock-agentcore")
            .finalize()
            .into_bytes();

        let k_signing = HmacSha256::new_from_slice(&k_service)
            .unwrap()
            .chain_update(b"aws4_request")
            .finalize()
            .into_bytes();

        let signature = hex::encode(
            HmacSha256::new_from_slice(&k_signing)
                .unwrap()
                .chain_update(string_to_sign.as_bytes())
                .finalize()
                .into_bytes(),
        );

        // Build authorization header
        let authorization = format!(
            "{} Credential={}/{}, SignedHeaders={}, Signature={}",
            algorithm, access_key, credential_scope, signed_headers, signature
        );

        let mut headers = vec![
            ("host".to_string(), host.to_string()),
            ("content-type".to_string(), "application/json".to_string()),
            ("x-amz-date".to_string(), amz_date),
            ("authorization".to_string(), authorization),
        ];

        if let Some(token) = session_token {
            headers.push(("x-amz-security-token".to_string(), token));
        }

        Ok(headers)
    }

    pub async fn close_session(session_id: &str) -> Result<(), String> {
        let info = get_agentcore_info();
        let (region, browser_id) = match &info {
            Some(i) => (i.region.clone(), i.browser_identifier.clone()),
            None => {
                let region = env::var("AGENTCORE_REGION")
                    .or_else(|_| env::var("AWS_REGION"))
                    .or_else(|_| env::var("AWS_DEFAULT_REGION"))
                    .unwrap_or_else(|_| "us-east-1".to_string());
                let browser_id = env::var("AGENTCORE_BROWSER_ID")
                    .unwrap_or_else(|_| "aws.browser.v1".to_string());
                (region, browser_id)
            }
        };

        let host = format!("bedrock-agentcore.{}.amazonaws.com", region);
        let path = format!(
            "/browsers/{}/sessions/stop",
            urlencoding::encode(&browser_id)
        );
        let url = format!("https://{}{}", host, path);

        let body = serde_json::to_string(&json!({ "sessionId": session_id }))
            .map_err(|e| format!("Failed to serialize close request: {}", e))?;

        let signed_headers = sign_request("PUT", &url, &region, Some(&body)).await?;

        let client = reqwest::Client::new();
        let mut req = client.put(&url).body(body);
        for (key, value) in &signed_headers {
            req = req.header(key.as_str(), value.as_str());
        }

        let _ = req.send().await;
        Ok(())
    }
}

pub use agentcore::{get_agentcore_info, take_agentcore_ws_headers};

async fn connect_agentcore() -> Result<(String, Option<ProviderSession>), String> {
    agentcore::connect().await
}

async fn close_agentcore_session(session_id: &str) -> Result<(), String> {
    agentcore::close_session(session_id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::EnvGuard;
    use std::io::{Read, Write};

    const BROWSER_USE_ENV_VARS: &[&str] = &[
        "AGENT_BROWSER_SOCKET_DIR",
        "AGENT_BROWSER_NAMESPACE",
        "BROWSER_USE_API_KEY",
        "BROWSER_USE_PROFILE_ID",
        "BROWSER_USE_PROXY_COUNTRY",
        "BROWSER_USE_ENABLE_RECORDING",
    ];

    fn browser_use_env(socket_dir: &std::path::Path) -> EnvGuard<'static> {
        let guard = EnvGuard::new(BROWSER_USE_ENV_VARS);
        for name in BROWSER_USE_ENV_VARS {
            guard.remove(name);
        }
        guard.set(
            "AGENT_BROWSER_SOCKET_DIR",
            socket_dir.to_str().expect("socket dir should be utf-8"),
        );
        guard.set("BROWSER_USE_API_KEY", "test-key-do-not-echo");
        guard
    }

    fn http_response(status_line: &str, body: &str) -> String {
        format!(
            "HTTP/1.1 {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            status_line,
            body.len(),
            body
        )
    }

    fn read_http_request(stream: &mut std::net::TcpStream) -> String {
        let mut buf = Vec::new();
        let mut chunk = [0u8; 1024];
        loop {
            let n = stream.read(&mut chunk).unwrap_or(0);
            if n == 0 {
                break;
            }
            buf.extend_from_slice(&chunk[..n]);
            if let Some(head_end) = buf.windows(4).position(|w| w == b"\r\n\r\n") {
                let head = String::from_utf8_lossy(&buf[..head_end]).to_string();
                let content_length: usize = head
                    .lines()
                    .find_map(|line| {
                        let (name, value) = line.split_once(':')?;
                        if name.eq_ignore_ascii_case("content-length") {
                            value.trim().parse().ok()
                        } else {
                            None
                        }
                    })
                    .unwrap_or(0);
                if buf.len() >= head_end + 4 + content_length {
                    break;
                }
            }
        }
        String::from_utf8_lossy(&buf).to_string()
    }

    fn serve_responses(responses: Vec<String>) -> (String, std::thread::JoinHandle<Vec<String>>) {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let handle = std::thread::spawn(move || {
            let mut requests = Vec::new();
            for response in responses {
                let (mut stream, _) = listener.accept().unwrap();
                requests.push(read_http_request(&mut stream));
                stream.write_all(response.as_bytes()).unwrap();
                let _ = stream.flush();
            }
            requests
        });
        (base, handle)
    }

    fn serve_stalled_body() -> (String, std::thread::JoinHandle<()>) {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let handle = std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let _ = read_http_request(&mut stream);
            let _ = stream.write_all(
                b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 4096\r\n\r\n{\"id\":",
            );
            let _ = stream.flush();
            std::thread::sleep(std::time::Duration::from_secs(3));
        });
        (base, handle)
    }

    fn assert_receipt_removed(path: &std::path::Path) {
        let end = std::time::Instant::now() + Duration::from_secs(1);
        while path.exists() && std::time::Instant::now() < end {
            std::thread::sleep(Duration::from_millis(5));
        }
        assert!(!path.exists(), "acknowledged stop must remove the receipt");
    }

    const TEST_BROWSER_ID: &str = "0e6ae5d0-93cf-4b9c-8c62-2c9c07b6c0f7";

    #[test]
    fn test_browser_use_cancellation_during_receipt_retains_allocated_id() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .max_blocking_threads(1)
            .enable_all()
            .build()
            .unwrap();
        let handle = rt.handle().clone();
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let (release, blocked) = std::sync::mpsc::channel();
        let server = std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let _ = read_http_request(&mut stream);
            let (started, running) = std::sync::mpsc::channel();
            handle.spawn_blocking(move || {
                started.send(()).unwrap();
                let _ = blocked.recv_timeout(Duration::from_secs(3));
            });
            running.recv_timeout(Duration::from_secs(1)).unwrap();
            let body = format!(
                r#"{{"id":"{}","cdpUrl":"ws://127.0.0.1:1"}}"#,
                TEST_BROWSER_ID
            );
            stream
                .write_all(http_response("201 Created", &body).as_bytes())
                .unwrap();
        });
        let mut owned = None;
        let timed_out = rt.block_on(async {
            tokio::time::timeout(
                Duration::from_millis(500),
                connect_browser_use_at_with_owner(
                    &base,
                    Duration::from_secs(2),
                    Duration::from_secs(2),
                    |session| {
                        owned = session;
                    },
                ),
            )
            .await
            .is_err()
        });
        release.send(()).unwrap();
        server.join().unwrap();
        assert!(
            timed_out,
            "receipt write must be awaiting the blocked filesystem worker"
        );
        assert_eq!(owned.unwrap().session_id, TEST_BROWSER_ID);
    }

    #[cfg(unix)]
    #[test]
    fn test_browser_use_unwritable_existing_storage_prevents_create() {
        use std::os::unix::fs::PermissionsExt;
        if unsafe { libc::geteuid() } == 0 {
            return;
        }
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        std::fs::set_permissions(dir.path(), std::fs::Permissions::from_mode(0o500)).unwrap();
        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(connect_browser_use_at(
            "http://127.0.0.1:1",
            Duration::from_secs(1),
            Duration::from_secs(1),
        ));
        std::fs::set_permissions(dir.path(), std::fs::Permissions::from_mode(0o700)).unwrap();
        assert!(result.unwrap_err().contains("storage is not writable"));
    }

    #[test]
    fn test_browser_use_uuid_shaped_credential_is_not_reflected() {
        let dir = tempfile::tempdir().unwrap();
        let guard = browser_use_env(dir.path());
        guard.set("BROWSER_USE_API_KEY", TEST_BROWSER_ID);
        let rt = tokio::runtime::Runtime::new().unwrap();
        let body = format!(
            r#"{{"id":"{}","cdpUrl":"ws://127.0.0.1:1"}}"#,
            TEST_BROWSER_ID.to_uppercase()
        );
        let (base, server) = serve_responses(vec![http_response("201 Created", &body)]);
        let error = rt
            .block_on(connect_browser_use_at(
                &base,
                Duration::from_secs(1),
                Duration::from_secs(1),
            ))
            .unwrap_err();
        server.join().unwrap();
        assert!(!error.to_lowercase().contains(TEST_BROWSER_ID));
        assert!(
            !browser_use_receipt_path(&uuid::Uuid::parse_str(TEST_BROWSER_ID).unwrap()).exists()
        );
    }

    #[test]
    fn test_browser_use_deadlines_are_fixed() {
        assert_eq!(BROWSER_USE_CREATE_DEADLINE, Duration::from_secs(10));
        assert_eq!(BROWSER_USE_STOP_DEADLINE, Duration::from_secs(4));
        assert_eq!(BROWSER_USE_API_BASE, "https://api.browser-use.com/api/v4");
    }

    #[test]
    fn test_browser_use_receipt_contents_are_safe() {
        let id = uuid::Uuid::parse_str(TEST_BROWSER_ID).unwrap();
        let contents = browser_use_receipt_contents(&id);
        assert!(contents.contains(TEST_BROWSER_ID));
        assert!(contents.contains("browser-use"));
        assert!(contents.contains("action"));
        assert!(!contents.contains("test-key-do-not-echo"));
        assert!(!contents.contains("cdpUrl"));
    }

    #[test]
    fn test_browser_use_create_success_writes_receipt_and_stop_removes_it() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();

        let create_body = format!(
            r#"{{"id":"{}","status":"active","cdpUrl":"ws://127.0.0.1:1/devtools/browser/x"}}"#,
            TEST_BROWSER_ID
        );
        let (base, server) = serve_responses(vec![http_response("200 OK", &create_body)]);
        let (ws_url, session) = rt
            .block_on(connect_browser_use_at(
                &base,
                Duration::from_secs(2),
                Duration::from_secs(2),
            ))
            .unwrap();
        let requests = server.join().unwrap();
        assert!(requests[0].starts_with("POST /browsers HTTP/1.1"));
        assert_eq!(ws_url, "ws://127.0.0.1:1/devtools/browser/x");
        let session = session.unwrap();
        assert_eq!(session.provider, "browser-use");
        assert_eq!(session.session_id, TEST_BROWSER_ID);

        let id = uuid::Uuid::parse_str(TEST_BROWSER_ID).unwrap();
        let receipt = browser_use_receipt_path(&id);
        let contents = std::fs::read_to_string(&receipt).unwrap();
        assert!(contents.contains(TEST_BROWSER_ID));
        assert!(!contents.contains("test-key-do-not-echo"));

        let stop_body = format!(r#"{{"id":"{}","status":"stopped"}}"#, TEST_BROWSER_ID);
        let (base, server) = serve_responses(vec![http_response("200 OK", &stop_body)]);
        rt.block_on(stop_browser_use_session_at(
            &base,
            TEST_BROWSER_ID,
            Duration::from_secs(2),
        ))
        .unwrap();
        let requests = server.join().unwrap();
        assert!(requests[0].starts_with(&format!("PATCH /browsers/{} HTTP/1.1", TEST_BROWSER_ID)));
        assert!(requests[0].contains(r#"{"action":"stop"}"#));
        assert_receipt_removed(&receipt);
    }

    #[test]
    fn test_browser_use_accepts_http_cdp_endpoint() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();
        let body = format!(
            r#"{{"id":"{}","cdpUrl":"http://127.0.0.1:9222"}}"#,
            TEST_BROWSER_ID
        );
        let (base, server) = serve_responses(vec![http_response("201 Created", &body)]);
        let (endpoint, session) = rt
            .block_on(connect_browser_use_at(
                &base,
                Duration::from_secs(1),
                Duration::from_secs(1),
            ))
            .unwrap();
        server.join().unwrap();
        assert_eq!(endpoint, "http://127.0.0.1:9222");
        assert_eq!(session.unwrap().session_id, TEST_BROWSER_ID);
    }

    #[test]
    fn test_browser_use_create_failures_are_safe_and_leave_no_receipt() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();

        let cases = vec![
            (
                http_response(
                    "500 Internal Server Error",
                    r#"{"detail":"hostile-secret-body"}"#,
                ),
                vec!["status 500"],
                vec!["hostile-secret-body"],
            ),
            (
                http_response("200 OK", "this is not json"),
                vec!["invalid create response", "inspect Browser Use Cloud"],
                vec!["this is not json"],
            ),
            (
                http_response("200 OK", r#"{"cdpUrl":"ws://127.0.0.1:1/x"}"#),
                vec!["valid browser id", "inspect Browser Use Cloud"],
                vec![],
            ),
            (
                http_response("200 OK", r#"{"id":"../../etc/passwd","cdpUrl":"ws://x"}"#),
                vec!["valid browser id"],
                vec!["etc/passwd"],
            ),
        ];
        for (response, expected, forbidden) in cases {
            let (base, server) = serve_responses(vec![response]);
            let error = rt
                .block_on(connect_browser_use_at(
                    &base,
                    Duration::from_secs(2),
                    Duration::from_secs(2),
                ))
                .unwrap_err();
            server.join().unwrap();
            for fragment in expected {
                assert!(
                    error.contains(fragment),
                    "{:?} missing in {:?}",
                    fragment,
                    error
                );
            }
            for fragment in forbidden {
                assert!(
                    !error.contains(fragment),
                    "{:?} leaked in {:?}",
                    fragment,
                    error
                );
            }
            assert!(!error.contains("test-key-do-not-echo"));
        }
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 0);
    }

    #[test]
    fn test_browser_use_create_body_stall_is_bounded() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();

        let (base, server) = serve_stalled_body();
        let started = std::time::Instant::now();
        let error = rt
            .block_on(connect_browser_use_at(
                &base,
                Duration::from_millis(500),
                Duration::from_millis(500),
            ))
            .unwrap_err();
        assert!(started.elapsed() < Duration::from_secs(2));
        assert!(
            error.contains("stalled") || error.contains("timed out"),
            "{error}"
        );
        assert!(error.contains("inspect Browser Use Cloud"));
        server.join().unwrap();
    }

    #[test]
    fn test_browser_use_null_cdp_url_triggers_bounded_rollback() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();
        let id = uuid::Uuid::parse_str(TEST_BROWSER_ID).unwrap();

        let create_body = format!(r#"{{"id":"{}","cdpUrl":null}}"#, TEST_BROWSER_ID);
        let stop_body = format!(r#"{{"id":"{}","status":"stopped"}}"#, TEST_BROWSER_ID);
        let (base, server) = serve_responses(vec![
            http_response("200 OK", &create_body),
            http_response("200 OK", &stop_body),
        ]);
        let error = rt
            .block_on(connect_browser_use_at(
                &base,
                Duration::from_secs(2),
                Duration::from_secs(2),
            ))
            .unwrap_err();
        let requests = server.join().unwrap();
        assert!(requests[1].starts_with(&format!("PATCH /browsers/{} HTTP/1.1", TEST_BROWSER_ID)));
        assert!(error.contains("cdpUrl"));
        assert!(error.contains("was stopped"));
        assert_receipt_removed(&browser_use_receipt_path(&id));

        let (base, server) = serve_responses(vec![
            http_response("200 OK", &create_body),
            http_response("500 Internal Server Error", "{}"),
        ]);
        let error = rt
            .block_on(connect_browser_use_at(
                &base,
                Duration::from_secs(2),
                Duration::from_secs(2),
            ))
            .unwrap_err();
        server.join().unwrap();
        assert!(error.contains(TEST_BROWSER_ID));
        assert!(error.contains("rollback failed"));
        assert!(browser_use_receipt_path(&id).exists());
    }

    #[test]
    fn test_browser_use_stop_acknowledgment_matrix() {
        let dir = tempfile::tempdir().unwrap();
        let _guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();
        let id = uuid::Uuid::parse_str(TEST_BROWSER_ID).unwrap();

        let cases = vec![
            (
                http_response(
                    "200 OK",
                    r#"{"id":"11111111-1111-4111-8111-111111111111","status":"stopped"}"#,
                ),
                "did not acknowledge",
            ),
            (
                http_response(
                    "200 OK",
                    &format!(r#"{{"id":"{}","status":"active"}}"#, TEST_BROWSER_ID),
                ),
                "did not acknowledge",
            ),
            (http_response("200 OK", "not json"), "did not acknowledge"),
            (http_response("404 Not Found", "{}"), "status 404"),
            (
                http_response(
                    "500 Internal Server Error",
                    r#"{"detail":"hostile-secret-body"}"#,
                ),
                "status 500",
            ),
        ];
        for (response, expected) in cases {
            std::fs::write(browser_use_receipt_path(&id), "receipt").unwrap();
            let (base, server) = serve_responses(vec![response]);
            let error = rt
                .block_on(stop_browser_use_session_at(
                    &base,
                    TEST_BROWSER_ID,
                    Duration::from_secs(2),
                ))
                .unwrap_err();
            server.join().unwrap();
            assert!(
                error.contains(expected),
                "{:?} missing in {:?}",
                expected,
                error
            );
            assert!(error.contains(TEST_BROWSER_ID));
            assert!(!error.contains("hostile-secret-body"));
            assert!(!error.contains("test-key-do-not-echo"));
            assert!(browser_use_receipt_path(&id).exists());
        }
    }

    #[test]
    fn test_browser_use_stop_precondition_failures() {
        let dir = tempfile::tempdir().unwrap();
        let guard = browser_use_env(dir.path());
        let rt = tokio::runtime::Runtime::new().unwrap();

        let error = rt
            .block_on(stop_browser_use_session_at(
                "http://127.0.0.1:1",
                "../../etc/passwd",
                Duration::from_millis(200),
            ))
            .unwrap_err();
        assert!(error.contains("not a valid UUID"));
        assert!(!error.contains("etc/passwd"));

        guard.remove("BROWSER_USE_API_KEY");
        let error = rt
            .block_on(stop_browser_use_session_at(
                "http://127.0.0.1:1",
                TEST_BROWSER_ID,
                Duration::from_millis(200),
            ))
            .unwrap_err();
        assert!(error.contains("BROWSER_USE_API_KEY"));
        assert!(error.contains(TEST_BROWSER_ID));
        assert!(error.contains("was not stopped"));
    }

    #[test]
    fn test_browser_use_v4_options_and_response() {
        let values = std::collections::HashMap::from([
            ("BROWSER_USE_PROFILE_ID", "profile-123"),
            ("BROWSER_USE_PROXY_COUNTRY", "DE"),
            ("BROWSER_USE_ENABLE_RECORDING", "true"),
        ]);
        let body = browser_use_create_body_from_lookup(|name| {
            values.get(name).map(|value| (*value).to_string())
        });
        assert_eq!(
            body,
            json!({
                "profileId": "profile-123",
                "proxyCountryCode": "de",
                "enableRecording": true,
            })
        );
        assert!(body.get("customProxy").is_none());
    }

    #[test]
    fn test_browser_use_managed_proxy_can_be_disabled() {
        let body = browser_use_create_body_from_lookup(|name| {
            (name == "BROWSER_USE_PROXY_COUNTRY").then(|| "direct".to_string())
        });
        assert_eq!(body, json!({ "proxyCountryCode": null }));
    }

    #[test]
    fn test_connect_provider_unknown() {
        let guard = EnvGuard::new(&["AGENT_BROWSER_PLUGINS"]);
        guard.remove("AGENT_BROWSER_PLUGINS");

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(connect_provider("unknown-provider"));
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown provider"));
    }

    #[test]
    fn test_connect_provider_with_supplied_registry_does_not_fallback_to_env_plugins() {
        let guard = EnvGuard::new(&["AGENT_BROWSER_PLUGINS"]);
        guard.set(
            "AGENT_BROWSER_PLUGINS",
            r#"[{"name":"env-cloud","command":"should-not-run","capabilities":["browser.provider"]}]"#,
        );

        let rt = tokio::runtime::Runtime::new().unwrap();
        let result = rt.block_on(connect_provider_with_plugins("env-cloud", &[]));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown provider"));
    }

    #[test]
    fn test_agentcore_env_defaults() {
        // Test that default values are used when env vars not set
        std::env::remove_var("AGENTCORE_REGION");
        std::env::remove_var("AGENTCORE_BROWSER_ID");
        std::env::remove_var("AGENTCORE_SESSION_TIMEOUT");

        // These would be used in connect() - just verify they don't panic
        let region = std::env::var("AGENTCORE_REGION")
            .or_else(|_| std::env::var("AWS_REGION"))
            .unwrap_or_else(|_| "us-east-1".to_string());
        assert_eq!(region, "us-east-1");

        let browser_id =
            std::env::var("AGENTCORE_BROWSER_ID").unwrap_or_else(|_| "aws.browser.v1".to_string());
        assert_eq!(browser_id, "aws.browser.v1");
    }

    #[test]
    fn test_agentcore_session_info_storage() {
        let info = agentcore::AgentCoreSessionInfo {
            session_id: "test-session".to_string(),
            browser_identifier: "aws.browser.v1".to_string(),
            region: "us-east-1".to_string(),
            live_view_url: "https://example.com".to_string(),
        };

        agentcore::set_agentcore_info(info);
        let retrieved = get_agentcore_info();
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.session_id, "test-session");
        assert_eq!(retrieved.region, "us-east-1");
    }

    #[test]
    fn test_agentcore_ws_headers_storage() {
        let headers = vec![
            (
                "Authorization".to_string(),
                "AWS4-HMAC-SHA256...".to_string(),
            ),
            ("X-Amz-Date".to_string(), "20260304T180000Z".to_string()),
        ];

        agentcore::set_agentcore_ws_headers(headers);
        let taken = take_agentcore_ws_headers();
        assert!(taken.is_some());
        assert_eq!(taken.unwrap().len(), 2);

        // Should be None after take
        let taken_again = take_agentcore_ws_headers();
        assert!(taken_again.is_none());
    }

    #[cfg(unix)]
    #[test]
    fn test_plugin_provider_cleanup_uses_supplied_registry() {
        use std::os::unix::fs::PermissionsExt;

        let rt = tokio::runtime::Runtime::new().unwrap();
        let dir = tempfile::tempdir().unwrap();
        let marker_path = dir.path().join("cleanup-request.json");
        let plugin_path = dir.path().join("mock-cleanup-plugin");
        std::fs::write(
            &plugin_path,
            r#"#!/bin/sh
cat > "$1"
printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"data":{}}'
"#,
        )
        .unwrap();
        let mut perms = std::fs::metadata(&plugin_path).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&plugin_path, perms).unwrap();

        let session = ProviderSession {
            provider: "plugin:cloud-browser".to_string(),
            session_id: r#"{"sessionId":"s1"}"#.to_string(),
        };
        let plugins = vec![crate::plugins::PluginConfig {
            name: "cloud-browser".to_string(),
            command: plugin_path.to_string_lossy().to_string(),
            args: vec![marker_path.to_string_lossy().to_string()],
            capabilities: vec![crate::plugins::CAPABILITY_BROWSER_PROVIDER.to_string()],
            ..crate::plugins::PluginConfig::default()
        }];

        rt.block_on(close_provider_session_with_plugins(&session, &plugins))
            .unwrap();

        let request = std::fs::read_to_string(marker_path).unwrap();
        assert!(request.contains(r#""type":"browser.close""#));
        assert!(request.contains(r#""sessionId":"s1""#));
    }

    #[cfg(unix)]
    #[test]
    fn test_plugin_provider_falsey_headed_env_is_false() {
        use std::os::unix::fs::PermissionsExt;

        let guard = EnvGuard::new(&[
            "AGENT_BROWSER_HEADED",
            "AGENT_BROWSER_ENGINE",
            "AGENT_BROWSER_SESSION",
        ]);
        guard.set("AGENT_BROWSER_HEADED", "false");
        guard.set("AGENT_BROWSER_ENGINE", "chrome");
        guard.set("AGENT_BROWSER_SESSION", "provider-test");

        let rt = tokio::runtime::Runtime::new().unwrap();
        let dir = tempfile::tempdir().unwrap();
        let request_path = dir.path().join("browser-launch-request.json");
        let plugin_path = dir.path().join("mock-provider-plugin");
        std::fs::write(
            &plugin_path,
            r#"#!/bin/sh
cat > "$1"
printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"browser":{"cdpUrl":"ws://127.0.0.1:9222/devtools/browser/test"}}'
"#,
        )
        .unwrap();
        let mut perms = std::fs::metadata(&plugin_path).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&plugin_path, perms).unwrap();

        let plugins = vec![crate::plugins::PluginConfig {
            name: "cloud-browser".to_string(),
            command: plugin_path.to_string_lossy().to_string(),
            args: vec![request_path.to_string_lossy().to_string()],
            capabilities: vec![crate::plugins::CAPABILITY_BROWSER_PROVIDER.to_string()],
            ..crate::plugins::PluginConfig::default()
        }];

        rt.block_on(connect_provider_with_plugins("cloud-browser", &plugins))
            .unwrap();

        let request: Value =
            serde_json::from_str(&std::fs::read_to_string(request_path).unwrap()).unwrap();
        assert_eq!(request["request"]["launchOptions"]["headed"], false);
    }

    #[cfg(unix)]
    #[test]
    fn test_plugin_provider_receives_command_launch_options() {
        use std::os::unix::fs::PermissionsExt;

        let guard = EnvGuard::new(&[
            "AGENT_BROWSER_COLOR_SCHEME",
            "AGENT_BROWSER_ENGINE",
            "AGENT_BROWSER_HEADED",
            "AGENT_BROWSER_SESSION",
            "AGENT_BROWSER_USER_AGENT",
        ]);
        guard.set("AGENT_BROWSER_COLOR_SCHEME", "light");
        guard.set("AGENT_BROWSER_ENGINE", "chrome");
        guard.set("AGENT_BROWSER_HEADED", "false");
        guard.set("AGENT_BROWSER_SESSION", "provider-test");
        guard.set("AGENT_BROWSER_USER_AGENT", "env-agent");

        let rt = tokio::runtime::Runtime::new().unwrap();
        let dir = tempfile::tempdir().unwrap();
        let request_path = dir.path().join("browser-launch-request.json");
        let plugin_path = dir.path().join("mock-provider-plugin");
        std::fs::write(
            &plugin_path,
            r#"#!/bin/sh
cat > "$1"
printf '%s' '{"protocol":"agent-browser.plugin.v1","success":true,"browser":{"cdpUrl":"ws://127.0.0.1:9222/devtools/browser/test"}}'
"#,
        )
        .unwrap();
        let mut perms = std::fs::metadata(&plugin_path).unwrap().permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&plugin_path, perms).unwrap();

        let plugins = vec![crate::plugins::PluginConfig {
            name: "cloud-browser".to_string(),
            command: plugin_path.to_string_lossy().to_string(),
            args: vec![request_path.to_string_lossy().to_string()],
            capabilities: vec![crate::plugins::CAPABILITY_BROWSER_PROVIDER.to_string()],
            ..crate::plugins::PluginConfig::default()
        }];

        rt.block_on(connect_provider_with_plugins_and_options(
            "cloud-browser",
            &plugins,
            Some(json!({
                "colorScheme": "dark",
                "engine": "lightpanda",
                "headed": true,
                "userAgent": "cli-agent"
            })),
        ))
        .unwrap();

        let request: Value =
            serde_json::from_str(&std::fs::read_to_string(request_path).unwrap()).unwrap();
        assert_eq!(request["request"]["launchOptions"]["colorScheme"], "dark");
        assert_eq!(request["request"]["launchOptions"]["engine"], "lightpanda");
        assert_eq!(request["request"]["launchOptions"]["headed"], true);
        assert_eq!(
            request["request"]["launchOptions"]["userAgent"],
            "cli-agent"
        );
    }
}
