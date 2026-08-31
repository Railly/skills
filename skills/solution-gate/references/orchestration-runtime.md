# Orchestration runtime

Load this before launching any isolated pass.

## Capability circuit breaker

For each requested pass:

1. Attempt the declared runtime once.
2. On the first schema or capability error, inspect available capability once.
3. Never retry the same invalid call with the same schema.
4. Continue in this order:
   - FX worker through `skills/review-gate/scripts/run-fx-review.mjs`;
   - native subagent;
   - visible Herdr worker;
   - sequential isolated pass with a fresh artifact and frozen input;
   - mark the obligation unavailable.
5. Stop orchestration after one schema failure for the operation or three across the turn.

Record:

```yaml
execution_mode: fx_worker | native_subagent | herdr_worker | sequential_isolated | single_context | unavailable
degraded_from: null | fx_worker | native_subagent | herdr_worker | sequential_isolated | single_context | unavailable
independence_gap: null | precise limitation
schema_failures: 0
```

The FX worker must report `auth=AI_GATEWAY_API_KEY` before review. The packaged wrapper reads the `Vercel AI Gateway` / `vercel-ai-gateway` item from macOS Keychain, disables stored-session lookup for that process, and passes the credential only to the FX subprocess. Link its sanitized JSON artifact from the Review Gate report. Never write the credential into a prompt, artifact, manifest, or log. Cursor and `cursor-agent` are not supported review runtimes.

A sequential isolated pass can reduce contamination by hiding earlier reasoning, but it is not an independent model or reviewer. Never use it to satisfy an obligation that explicitly requires independent judgment.
