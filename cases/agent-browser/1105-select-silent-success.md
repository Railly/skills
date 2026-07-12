# Case: Detect swallowed exceptions behind silent success

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1105](https://github.com/vercel-labs/agent-browser/issues/1105) · [commit](https://github.com/Railly/agent-browser/commit/323ce85106fa85f001f61ae1fc4ae0eddb352af8) · [branch](https://github.com/Railly/agent-browser/tree/fix/select-non-select-errors)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

The issue reported `select` failing on an ARIA combobox. On current main, the command instead reported success while leaving the widget unchanged.

## Red signal

A local ARIA combobox fixture returned `success:true` and `selected:["Product Manager"]`, but direct DOM inspection showed the title, button text, and listbox state were unchanged. A native `<select>` control succeeded.

## Method used

1. Verify the effect against the DOM rather than trusting the command output under investigation.
2. Trace the host-to-browser bridge and inspect its separate exception channel.
3. Find that `Runtime.callFunctionOn` returned `exceptionDetails` while the Rust path only inspected the nominal result value.
4. Reject unreliable synthetic ARIA selection and return directed guidance instead.
5. Preserve native-select behavior and falsify the end-to-end guard.

## Outcome

The branch reports explicit errors for ARIA comboboxes and non-select elements while retaining native-select behavior. The end-to-end test was falsified against the original silent-success path. No upstream PR was opened.

## Evidence

- Source: exception-channel handling and element-type guidance in the linked commit.
- Runtime: the red record included literal success output alongside unchanged DOM state.
- Tests: `e2e_select_on_aria_combobox_fails_with_guidance` covers combobox, generic element, and native select.
- Artifact: local release CLI exercised against the fixture.

## Transferable lesson

When code executes inside another runtime, inspect that runtime's exception channel explicitly. For a lying success signal, verify the effect against the substrate rather than the command's own output.

## Exceptions

The extra exception-channel check is unnecessary when the transport already materializes embedded exceptions as host errors.

## Candidate changes

- Reference rule: Unfold Review should observe the substrate directly when the reported failure is silent success.
- Eval: a command returns success while DOM, filesystem, or database state remains unchanged.
- Coverage gap: other `Runtime.callFunctionOn` call sites were not audited.

## Confidentiality review

The issue, source, branch, commit, and tests are public. The reporter's external widget was not copied or exercised.
