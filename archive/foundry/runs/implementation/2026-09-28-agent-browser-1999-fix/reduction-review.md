## Findings

### 1. R4 violation: selector-evaluation rejections can leak CDP remote objects

**Context:** `cli/src/native/actions.rs`, `wait_for_any_selector`, immediately after `Runtime.evaluate`:

```rust
if result.exception_details.is_some()
    || result.result.subtype.as_deref() != Some("node")
{
    continue;
}

let Some(object_id) = result.result.object_id else {
    continue;
};
```

With `return_by_value: Some(false)`, an evaluation exception can return an `Error` remote object carrying an `objectId`. A malformed explicit CSS selector is the concrete case: `document.querySelectorAll(selector)` throws, the code reaches `continue`, and the exception object is never released. This repeats on every 100 ms poll until the auth timeout.

Non-node remote objects produced by page-modified built-ins would take the same unreleased path.

**Impact:** bounded but real remote-object accumulation on a long-lived page; it violates the requirement that objects acquired by the new auth path be released on rejection.

**Smallest correction:** release any object ID before every early `continue`:

```rust
if result.exception_details.is_some()
    || result.result.subtype.as_deref() != Some("node")
{
    if let Some(object_id) = result.result.object_id {
        let _ = client
            .send_command(
                "Runtime.releaseObject",
                Some(json!({ "objectId": object_id })),
                Some(session_id),
            )
            .await;
    }
    continue;
}
```

The selected-node path should continue to release after `DOM.describeNode`, as it already does. This does not require another helper, retry, or polling-budget change.

---

### 2. Resilience evidence omits the required timeout case

**Context:** `cli/src/native/e2e_tests.rs`, `e2e_auth_login_rejects_changed_credential_targets`:

```rust
for phase in [
    "selection",
    "focus-detach",
    "focus-redirect",
    "select-redirect",
    "focus-readonly",
    "input-detach",
    "exception",
    "normal",
]
```

The matrix covers selection detachment, focus detachment/redirection, select redirection, readonly transition, input detachment, script exception, and an implicit caller retry after restoring the form. It does not directly exercise selector exhaustion/timeout.

**Smallest correction:** add a timeout phase that leaves no usable username or password target, asserts auth rejection with no input or submit, then restores the form and immediately retries successfully. Existing timeout coverage elsewhere may satisfy this, but that evidence is not present in the supplied packet.

---

### 3. Cancellation/disconnect cleanup limitation is not recorded

`AuthLoginElement::fill` correctly attempts release after ordinary success and rejection:

```rust
let result = client.send_command_typed(...).await;
let _ = client.send_command("Runtime.releaseObject", ...).await;
let result = result?;
```

However:

- cancellation while the fill or detection future is suspended can bypass release;
- after a CDP disconnect, `Runtime.releaseObject` can no longer succeed;
- ignoring that release error is appropriate, but it cannot honestly be reported as a completed release.

The same limitation applies to the temporary object acquired by `Runtime.evaluate` in `wait_for_any_selector`.

**Smallest correction:** record this limitation in the PR/release evidence or nearby comment. Do not add release retries or credential retries.

## Declared-decision audit

| Decision | Audit |
|---|---|
| **Recreate PR #1999 on an upstream branch with human coauthor credit** | Authorized by the contract and consistent with the supplied branch name. The frozen diff cannot prove fidelity to commit `1b4cacd0`, the signed commit, replacement PR, or Jony’s trailer because no git metadata is included. R5’s coauthor requirement remains externally unverified, not contradicted. |
| **Use an auth-only synchronous native edit with exact-node and focus checks** | Supported. `AuthLoginElement::fill` is the single auth-specific fill helper, uses `Runtime.callFunctionOn` with `await_promise: false`, performs focus/select/connectedness checks, and does not edit `interaction::fill`. |
| **No automatic retarget; reject stale fields and primitive failures** | Supported for the intended behavior. `add_exact_backend_node` disables role fallback, stale backend-node resolution returns an error, and the fill function rejects disconnected, disabled, readonly, focus-redirected, exceptional, and post-input-detached targets. |

## Contract checklist

- **R1: usable visible control selection** — implementation satisfies this. The new `querySelectorAll(...).find(...)` skips hidden, disabled, hidden-input, and readonly input/textarea twins. Explicit username and submit selector paths now use the same usable-element selection path, and password selection always does. The new matrix directly proves hidden twins; disabled/readonly twins and explicit-CSS duplicates are not directly shown in the supplied test diff.
- **R2: selected-field-only delivery** — supported. The exact backend node plus active-element checks prevent retargeting. `?` exits before password fill or submit after rejection. Input detachment rejects after insertion into the selected node, which matches the new regression’s intended assertion and does not deliver elsewhere.
- **R3: ordinary fill unchanged** — supported by the diff. `interaction::fill` is untouched, and existing `RefEntry` constructors retain `allow_role_fallback: true`. Native events, React controlled-state behavior, Unicode, and replacement are supported by the supplied Chrome 152 probe statement.
- **R4: bounded polling, no credential retry, cleanup** — partially supported. Polling remains bounded and there is no retry after exact-node selection. Ordinary fill success/rejection releases the resolved object. The exception-object leak in Finding 1 and the cancellation/disconnect limitation in Finding 3 remain.
- **R5: compatibility and attribution** — no new public flag, storage schema, protocol field, dependency, or MCP surface change is present. MCP parity is preserved by leaving the existing parser/action path unchanged. Human trailer preservation cannot be audited from a diff without commit metadata.

## Reduction audit

No further behavior-preserving simplification is necessary.

The local `AuthLoginElement` plus exact `RefMap` entry is justified because both credential fill and submit click need the same exact-node/no-role-fallback guarantee. Replacing it with the original selector string would reopen the wrong-field race; moving this behavior into `interaction::fill` would violate the reduction contract.

## Review limits

This packet-only review did not run formatting, lint, unit, auth E2E, React, or ordinary-form tests and did not inspect the referenced evidence directory. Claims about Chrome 152 probe results are accepted only as supplied. Behavior outside the stated probe scope—Lightpanda, shadow DOM, iframes, contenteditable controls, empty credentials, and future Chrome versions—is not established by this packet.