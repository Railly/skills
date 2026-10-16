# Review Gate: vercel-labs/emulate d390632

Date: 2026-08-18
Branch: `feat/github-app-cli-generated-secrets`
Base: `576eb0ebff376e9d407f44454b56327953f367d5`
HEAD: `d39063244be9b9abbc99cd60dcd1aade88758c85`

## Verdict

Pass. No blocking findings.

Same-family warning: the author and reviewer use the GPT-5 family, so shared blind spots remain possible.

## Change model

The test must force the Portless probe to fail after the generated-secret artifact is published, while leaving unrelated platform tools available. The previous test replaced the complete `PATH`, which also hid Linux ACL tools and caused publication to fail before reaching Portless.

The correction prepends a failing Portless shim to the original `PATH`, records its arguments, restores both environment variables, and asserts that `portless --version` was actually invoked.

## Deterministic checks

- style: pass
- surfaces: pass
- `git diff --check`: pass
- focused suite: 41 tests pass
- type-check: pass
- lint: pass
- formatting: pass

## Focused lenses

- shim hermeticity: pass; the shim wins command lookup without hiding system tools, and the exact probe is asserted
- error-path forcing: pass; the shim exits nonzero and the expected Portless error, artifact rollback, and immediate retry remain asserted
- substrate verification: pass for the test harness; the original Linux CI failure proves the old harness hid `setfacl`, while the corrected harness preserves the original `PATH`

Radius found one changed module and seven impacted symbols, with no convergence items. Its 20,801 unresolved calls exceed its 4,927 edges, so it was treated as under-covering and used only for orientation.

## Exemptions claimed

- No documentation update is needed because this commit changes only test isolation, not user-visible behavior.

## Issue candidates

None.
