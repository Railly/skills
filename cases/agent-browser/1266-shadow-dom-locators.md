# Case: Pierce every stage of a boundary-crossing pipeline

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1266](https://github.com/vercel-labs/agent-browser/issues/1266) · [commit](https://github.com/Railly/agent-browser/commit/86338035313d7aef52071aa478375de410ef476b) · [branch](https://github.com/Railly/agent-browser/tree/fix/shadow-dom-locators)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

Semantic locators could not find elements inside open shadow roots. The reproduction also found text matching could report success by matching the source of a `<script>` element.

## Red signal

A local open-shadow-root fixture contained an input, button, and unique text. Placeholder lookup failed. Text lookup reported success but targeted the script containing the fixture source. Direct inspection of input value and click effect distinguished real interaction from the false positive.

## Method used

1. Trace the full mark, resolve, act, and cleanup pipeline.
2. Make every query descend through open shadow roots.
3. Add shadow-aware marker resolution and cleanup rather than changing only discovery.
4. Exclude script, style, template, and other non-content nodes from text matching.
5. Exercise fill and click effects through an end-to-end fixture and falsify the guard.

## Outcome

The branch makes semantic locator discovery, marker resolution, and cleanup shadow-aware and removes the script-source false positive. The complete suite exposed an outdated assertion, which was fixed before the final branch. No upstream PR was opened.

## Evidence

- Source: query, resolution, cleanup, and text-filter changes in the linked commit.
- Runtime: input value and click title were inspected directly.
- Tests: `e2e_semantic_locators_pierce_open_shadow_dom` was falsified against the original path.
- Artifact: local release CLI exercised against the fixture.

## Transferable lesson

When a feature crosses a new boundary, trace every pipeline stage across it. Discovery is useless when resolution, action, or cleanup still stops at the old boundary.

## Exceptions

Respect intentionally opaque boundaries such as closed shadow roots or private mounts. Do not pierce them accidentally.

## Candidate changes

- Exemplar: pipeline-wide boundary piercing with a non-content false positive.
- Eval: a search stage crosses symlinks or submodules while its action stage does not.
- Process lesson: run the full suite before publishing a commit.

## Confidentiality review

The issue, source, branch, commit, fixture, and tests are public. No external site data is included.
