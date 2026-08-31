# Review Gate: agent-browser PR #1719 update

Status: pass

Verdict: safe to merge at `0cdaaa03e40ba850f64533f061e4a9821bbb4197`.

## Result

Tate fixed the previous blocker. `diff snapshot` now builds a replacement map separately and commits it only after snapshot capture and baseline reading succeed. Failed snapshot diffs preserve the prior actionable refs.

URL diffs deliberately invalidate refs before each navigation. A failed navigation can leave the browser on a different document, so preserving old refs would be unsafe. Successful URL diffs install the refs from URL2, the page the browser remains on.

## Verification

- Both changed Chrome E2Es pass serially under isolated namespaces, including the invalid-selector and failed-URL cases.
- Three fix-absent mutations turn the matching tests red for the intended state/ref assertion; both tests pass after snapshot restoration.
- Built CLI dogfood confirms failed snapshot diffs preserve `@e1`, failed URL navigations invalidate it, and successful URL diffs leave URL2 refs actionable.
- Format, clippy with warnings denied, 1,148 non-ignored tests across binaries, style, callers, and diff checks pass.
- CI is green. Native E2E Tests are skipped in GitHub, but the changed E2Es passed locally with real Chrome.
- Radius reports 8 changed symbols, 138 impacted, 8,030 edges, and 2,445 unresolved calls. Its broad `execute_command` fan-in over-covers and does not replace the state-lifecycle checks.

## Exemptions claimed

- README, docs, MCP, output, and skill updates are not required because command names, flags, output shape, and documented final-page behavior are unchanged.
- No stale-value, timing, shell, persistent-artifact, external-executable, or parser gate triggers.

## Issue candidates

- `diff snapshot` without `--baseline` still does not use the latest session snapshot as documented. This predates and is untouched by the PR.
- `diff url` still ignores selector, compact, depth, screenshot, and full-page fields in the native handler. This predates and is untouched by the PR.
