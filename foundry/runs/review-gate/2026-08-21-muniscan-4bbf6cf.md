# Muniscan recurring census review gate

Status: pass

Exact head: `4bbf6cf019a50484d2de311b1bacbe54b1929669`

The collector now unions current discovery with municipalities from the newest earlier published index, ignores failed intermediate directories as baselines, and records restored counts separately. Non-2xx pages become explicit errors.

The archived GitHub Actions artifacts were driven through the real union function. They produce 1,853 and 1,881 unique municipalities instead of 1,441 and 1,495. Three fix-absent mutations each failed at the intended assertion, and the restored tree passes 27 tests, typecheck, diff check, and five repeated focused runs.

The Radius map reports 247 unresolved calls against 121 edges, so it under-covers and was used only for orientation. The same model family authored and reviewed the change, so shared-prior risk is recorded. The archived artifacts and published census provide an independent substrate corpus.

## Exemptions claimed

- `src/enrich.ts` is unaffected: it already maps every `get().ok === false` result into an `ERR:*` row, so the new non-2xx outcome propagates correctly without an edit.
- `DATA-LICENSE.md` and `src/score.ts` mention municipalities but do not describe discovery or baseline selection.
- `previousCount` remains a valid local parameter name in the completeness function; only the retired filesystem resolver was replaced.
- A live 85-minute patched scan is deferred to the post-merge workflow and is not represented as completed.

## Issue candidates

- Cross-workflow resume is still artifact-only: a rerun does not automatically download the previous attempt's partial `enriched.jsonl`. The census-memory repair makes recurrence independent of this optimization.
