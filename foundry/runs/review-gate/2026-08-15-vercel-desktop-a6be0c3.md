# Review gate: vercel-desktop PR #9

Status: pass with same-family reviewer warning.

PR #9 changes Vercel CLI probes from an interactive login shell to a non-interactive login shell and preserves the team-selection surface when onboarding team discovery fails. The amended regression test now drives the actual transition from successful `whoami` to failed `teams list`, then checks that loading ends, the authenticated identity remains visible, and error plus retry controls are exposed.

`pnpm check`, all 158 tests, `pnpm build`, `git diff --check`, style, and surface checks passed. The exact `/bin/zsh -lc` command used by the app successfully returned Vercel CLI 58.4.4 and the current team list.

The test was force-red by temporarily removing failed onboarding from `showTeamSelection`. Only the new regression test failed, at the expected blank-state assertion. Restoring the fix returned the full suite to green.

## Exemptions claimed

- No release metadata or changelog update belongs in this PR. Repository instructions reserve those changes for a separate release PR.

## Issue candidates

None.
