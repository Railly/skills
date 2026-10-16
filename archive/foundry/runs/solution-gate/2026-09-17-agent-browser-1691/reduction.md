## Reduction assessment

The core structure is proportionate: retained ownership, manual receipts, acknowledged-stop validation, subordinate deadlines and an outer setup deadline serve different requirements. They are not interchangeable. I would make three targeted changes rather than introduce a lifecycle framework.

This assessment uses the supplied diff only; no tests were executed.

### 1. Narrow and simplify the provider attachment/error boundary

**Safe reduction:** Fold `attach_provider_cdp_inner` into a local async block inside `attach_provider_cdp`. That preserves one shared implementation of direct-page, header-bearing and ordinary CDP attachment without a separate forwarding function.

Use that same boundary to distinguish Browser Use errors from other providers’ existing errors:

- Browser Use: return fixed attachment-failure or attachment-timeout messages.
- Other providers: return their original attachment result unchanged.

**Correctness concern:** Currently, `Ok(result) => result` passes raw BrowserManager errors through for Browser Use. Both launch paths subsequently expose those errors. A credential-bearing `cdpUrl` is accepted by the URL validator, so these paths do not establish R6’s promised secret-safe error boundary. `combine_provider_failure` formats errors; it does not sanitize them. Audit the setup-timeout cleanup composition for the same issue: it includes the potentially combined browser-close error verbatim.

There is also removable error plumbing in both `direct_page && !allowed_domains.is_empty()` branches. The supplied Browser Use connection explicitly sets `direct_page: false`; all other provider/plugin cleanup paths still return `Ok(())`. Consequently, the new `cleanup_error` variables and `combine_provider_failure` calls in those branches cannot contribute an error. Restore their previous best-effort cleanup and original error return.

**Preserve:** Distinct direct-page, header-bearing and ordinary attachment behavior. Keep the existing tests and add a Browser Use attachment failure using a credential-bearing endpoint, asserting that neither endpoint nor credential appears in the returned error.

### 2. Correct the automatic-relaunch deadline boundary before simplifying wrappers

**Concrete concern:** In `execute_command`, automatic relaunch performs:

1. `auto_save_restore_state`;
2. `close_before_implicit_relaunch`;
3. `auto_launch`, whose wrapper starts the 22-second deadline.

Thus the prior close performed for this setup is outside the composite deadline, contrary to C7. Even a successful outgoing stop taking nearly four seconds can precede 22 seconds of setup and four seconds of timeout cleanup. That consumes approximately 30 seconds before response overhead or any separately charged liveness check.

**Action:** Put the automatic-relaunch close and the ensuing Browser Use setup inside one Browser Use-only deadline. Keep the existing optional state save outside that segment, as reconciled. One small orchestration boundary is preferable to adding another timeout around the existing close and treating it as an extra allowance.

Do **not** merge the auto-launch and explicit-launch wrappers into a generic timeout abstraction merely because their syntax is similar. Their provider selection and transition boundaries matter:

- Healthy reuse must not enter setup.
- Browser Use → another provider must stop pending Browser Use ownership without timing the replacement provider’s setup.
- Restore-key changes must propagate stop failure before applying the changed key.

The diff’s fixed-duration assertion and provider-level body-stall tests do not demonstrate these complete boundaries. Preserve them, but add a composite automatic-relaunch test covering prior close followed by stalled setup and bounded timeout cleanup. Also retain separate cancellation-during-receipt coverage: it tests a different invariant.

### 3. Consolidate known-ID rollback, without moving ownership registration

`connect_browser_use_at_with_owner` duplicates the same rollback protocol for receipt-write failure and unusable `cdpUrl`:

- stop the same known browser;
- clear callback ownership only after acknowledgment;
- otherwise retain ownership and return recovery information.

**Safe reduction:** Represent the two setup failures locally, then use one rollback/outcome block. Alternatively, use a small Browser Use-specific helper if that keeps the control flow clearer. Preserve distinct failure messages—receipt failure and invalid endpoint are different operator situations—but share the stop and ownership-clearing logic.

Do not turn this into a general provider transaction abstraction.

**Reduction-invalidating concerns:**

- `on_session(Some(session.clone()))` must remain before the first awaited receipt write. Moving ownership registration to successful function return loses the ID when setup is cancelled.
- Receipt-write failure must still attempt rollback even though no usable receipt exists.
- A failed rollback must retain the same ID and supply direct actionable recovery, rather than merely saying to consult a potentially absent receipt.
- Invalid-endpoint rollback must remain bounded and must not replay create.
- `on_session(None)` must follow acknowledged stop, not merely a completed PATCH or an HTTP success status.

Keep the separate receipt-cancellation, null-endpoint rollback success/failure, credential-reflection and acknowledgment-matrix regressions. Consolidating production branches is not a reason to consolidate away those observations.

## What I would leave intact

Keep the manual receipt mechanism and preflight: daemon stderr is not an adequate shutdown handoff, and no durable retry service is needed. Keep the 10/8/4-second subordinate limits alongside the corrected 22-second composite limit. Keep failed-stop ownership and same-ID retry semantics.

No launch-hash changes, new equality rules, dependencies, workers or automatic recovery are warranted. The useful reduction here is narrower provider-specific plumbing and one shared rollback protocol—not removal of lifecycle safeguards.