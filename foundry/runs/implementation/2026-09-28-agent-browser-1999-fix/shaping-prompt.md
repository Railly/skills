Perform independent blind Shaping. Do not use tools or inspect other files. Respond with a complete R table, distinct shapes/parts, a binary fit check with flagged uncertainties, and recommended probes. You are not the implementer.

# Frozen problem packet

User request: recreate external auth-login PR with human coauthor credit and fix verified blocker. Do not inspect the candidate PR or sibling branches.

Observed: normal CLI auth login times out when an unusable matching username, password, or submit control precedes a usable visible control in DOM order. Correct result fills the intended usable fields and submits, leaving hidden controls untouched.
Observed: an examined implementation reports login success after a selected password input is replaced, placing its password into the previously focused username field; username replacement similarly writes to a decoy. The corresponding base implementation fills the replacement correctly. The discriminator is real DOM input-event targets and field values, not the CLI success result.
Specified requirements: visible usable duplicate controls work; each credential goes only to its chosen field; stale/nonfocusable/focus-redirected controls fail without entering text into another field; no submission after a rejected fill; existing explicit CSS selectors, no-navigate same-origin binding, delayed SPA forms and ordinary fill must retain working contracts; preserve useful native input/controlled form compatibility; bounded retries/remote-handle cleanup. Do not add broad framework changes or backend policy.
Allowed outcome when the chosen field becomes stale: return an error before credential insertion rather than silently retarget. Exact no-retry policy is not settled.
Facts from base source: interaction::fill resolves an element then performs focus, clear/input-event, and page-level insertion as separate operations (cli/src/native/interaction.rs:129-194). All repo source is at base d01253d9db28d75080e36da3c1c31ef89454731e. Browser is actual Chrome 152 on macOS; Rust1.98.1.
Unknowns: which synchronous browser primitive preserves native form input behavior while guaranteeing the destination despite focus/clear/input event callbacks; how detached object resolution differs from attachment; exceptions and handle cleanup.
No candidate mechanism is provided. Read base source only and use shaping native R/Shape/fit-check format. Record proposed browser primitives as unverified until actual probes.


BASE SOURCE interaction::fill
pub async fn fill(
    client: &CdpClient,
    session_id: &str,
    ref_map: &RefMap,
    selector_or_ref: &str,
    value: &str,
    iframe_sessions: &HashMap<String, String>,
) -> Result<(), String> {
    let (object_id, effective_session_id) = resolve_element_object_id(
        client,
        session_id,
        ref_map,
        selector_or_ref,
        iframe_sessions,
    )
    .await?;

    // Focus the element
    client
        .send_command_typed::<_, Value>(
            "Runtime.callFunctionOn",
            &CallFunctionOnParams {
                function_declaration: "function() { this.focus(); }".to_string(),
                object_id: Some(object_id.clone()),
                arguments: None,
                return_by_value: Some(true),
                await_promise: Some(false),
            },
            Some(&effective_session_id),
        )
        .await?;

    // Select all + delete to clear
    client
        .send_command_typed::<_, Value>(
            "Runtime.callFunctionOn",
            &CallFunctionOnParams {
                function_declaration: r#"function() {
                    this.select && this.select();
                    this.value = '';
                    this.dispatchEvent(new Event('input', { bubbles: true }));
                }"#
                .to_string(),
                object_id: Some(object_id),
                arguments: None,
                return_by_value: Some(true),
                await_promise: Some(false),
            },
            Some(&effective_session_id),
        )
        .await?;

    // Insert text (keyboard input dispatched at page level, use parent session_id)
    client
        .send_command_typed::<_, Value>(
            "Input.insertText",
            &InsertTextParams {
                text: value.to_string(),
            },
            Some(session_id),
        )
        .await?;

    Ok(())
}

#[allow(clippy::too_many_arguments)]
