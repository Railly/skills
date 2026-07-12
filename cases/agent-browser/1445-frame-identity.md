# Case: Test the reporter's boundary and resolve authoritative identity

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1445](https://github.com/vercel-labs/agent-browser/issues/1445) · [commit](https://github.com/Railly/agent-browser/commit/12191bd3ce6749d13257cfa3e71dfd5599c123f8) · [branch](https://github.com/Railly/agent-browser/tree/fix/frame-select-oopif)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

The issue attributed frame selection failure to dynamically injected cross-origin iframes. A static cross-origin control failed too, disproving that boundary on current main.

## Red signal

Local parent and child servers created dynamic and static cross-origin frames plus a same-origin control. Both cross-origin variants returned `Frame not found` before the fix. After the patch, all three could be selected and their contents observed.

## Method used

1. Run the non-dynamic control before accepting the reporter's dynamic-versus-static boundary.
2. Compare selector and reference paths for frame selection.
3. Find display-attribute matching against a partial frame tree in the selector path.
4. Reuse the sibling path that resolves authoritative frame IDs through the DOM API.
5. Cover reported, newly discovered, and no-regression variants.

## Outcome

The branch removes display-name matching for selector-based frame selection and resolves identity through the authoritative API. The end-to-end test was falsified with the original error. No upstream PR was opened.

## Evidence

- Source: selector-to-frame-ID resolution in the linked commit.
- Runtime: dynamic, static cross-origin, and same-origin controls were exercised.
- Tests: `e2e_frame_select_works_for_dynamic_cross_origin_iframe` was falsified.
- Artifact: release CLI selected the frames and observed their content.

## Transferable lesson

The boundary stated in an issue is a hypothesis. Run the non-boundary control before accepting it, then prefer authoritative identity over display attributes and partial registries.

## Exceptions

When no authoritative ID resolution exists, attribute matching may be unavoidable and its ambiguity should be explicit.

## Candidate changes

- Reference rule: Unfold Triage should test the control outside the reporter's claimed boundary.
- Eval: a dynamic-only report where the static control also fails.
- Coverage gap: exact OOPIF placement and the reporter's older version were not reproduced.

## Confidentiality review

The issue, source, branch, commit, local fixtures, and tests are public.
