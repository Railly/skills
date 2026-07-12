# Case: Use a working contrast to find the correct seam

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1460](https://github.com/vercel-labs/agent-browser/issues/1460) · [commit](https://github.com/Railly/agent-browser/commit/5a48d19310b4f4ac0172f8e8a9c70e44d080da4f) · [branch](https://github.com/Railly/agent-browser/tree/fix/semantic-locators-active-frame)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

After selecting an iframe, `find text` could not find content that `snapshot` displayed in the same state.

## Red signal

A local frame contained a button with an observable click effect. In one run, snapshot saw the button while find text returned `Element not found`. This contrast eliminated frame-selection and missing-content hypotheses.

## Method used

1. Compare one path that works and one that fails under the same selected-frame state.
2. Trace the working path to its frame-aware seam.
3. Route locator evaluation and marker cleanup through that existing seam for same-process and out-of-process frames.
4. Verify successful interaction, isolation in both directions, and restoration of the main-frame mode.
5. Falsify the end-to-end guard against the original path.

## Outcome

The branch makes semantic locators honor the active frame without creating a parallel frame implementation. The full suite and local artifact passed. No upstream PR was opened.

## Evidence

- Source: frame-aware evaluation and cleanup in the linked commit.
- Runtime: snapshot-versus-find contrast and direct click effect.
- Tests: `e2e_find_text_searches_selected_frame` covers interaction, isolation, and mode restoration.
- Artifact: release CLI exercised text and role locators inside a selected frame.

## Transferable lesson

When one feature honors a mode and another ignores it, use their contrast to locate the working seam and route the failing feature through it rather than duplicating mode logic.

## Exceptions

Do not reuse the seam blindly when the two features require genuinely different mode semantics.

## Candidate changes

- Exemplar: contrast-driven seam reuse.
- Eval: a table honors a tenant or filter while export ignores it.
- Coverage gap: the adjacent #1445 and #1460 branches were not built together.

## Confidentiality review

The issue, source, branch, commit, fixtures, and tests are public.
