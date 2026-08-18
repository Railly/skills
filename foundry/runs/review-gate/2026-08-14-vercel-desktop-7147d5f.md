# Review gate: vercel-desktop onboarding re-entry

Status: incomplete.

The deterministic and empirical layers passed. `pnpm check`, `pnpm test`, `pnpm build`, `git diff --check`, style, and surface checks are green. The suite passes 157 of 157 tests.

The new regression coverage was force-red before implementation. A Debug build was also opened with an authenticated incomplete-onboarding fixture using `zsh -lc`. The live accessibility snapshot showed the account picker with `Internal Playground` and `Ty`, no loading spinner, and no `Create API Key` action.

The run is marked incomplete because two final cross-family code-review processes produced no output and were aborted after bounded waits. An earlier different-family choice audit completed, found evidence-pointer quality issues in `.decisions.tsv`, and those were recorded with append-only superseding rows. It found no code defect.

## Exemptions claimed

- No persistence-format or release-metadata change is required. The diff is limited to runtime reconciliation, markup gating, tests, and the decision trail.

## Issue candidates

None.
