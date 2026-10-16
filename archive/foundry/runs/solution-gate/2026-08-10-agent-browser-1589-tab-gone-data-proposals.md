# Solution gate proposals: agent-browser #1589 structured `tab_gone` data

Date: 2026-08-10
Repository: `vercel-labs/agent-browser`
Branch head inspected: `21667e987212ae9a601b39974d768c2537eb4080`

## Shared brief

### Property

A machine-readable `tab_gone` failure must expose the recovery identifiers a caller needs without requiring prose parsing, while any exposed URL remains restricted to the existing safe diagnostic form.

### Observable

Single-command CLI JSON, batch JSON, and MCP structured output expose the dead CDP target id and the optional sanitized last URL. Opaque URL payloads remain absent.

### Must not change

- Existing success envelopes.
- The top-level `code: "tab_gone"` field.
- Exit status.
- Human-readable error text.
- Non-`tab_gone` failures.
- Recovery commands and pin/fallback behavior.
- URL sanitization.
- Compatibility for consumers that only read existing fields.

## Proposer A: Fable

### Shape

The source tuple remains in `BrowserManager::bound_target_gone`. Add a read-only accessor for its target id and sanitized last URL. When the daemon creates a `tab_gone` response, enrich the response with a new top-level `details` object:

```json
{
  "success": false,
  "data": null,
  "error": "tab_gone: ...",
  "code": "tab_gone",
  "details": {
    "targetId": "TARGET",
    "lastUrl": "https://example.com/path"
  }
}
```

Omit `lastUrl` when the stored sanitized value is empty. Extend the client `Response` type so single-command and batch output retain `details`. MCP needs no separate protocol because it already embeds the parsed CLI response under `structuredContent.response`.

### Predictions

1. After externally closing a pinned HTTP tab, `agent-browser --json get url | jq -r '.details.targetId'` returns the closed target id, and `.details.lastUrl` returns the sanitized URL.
2. After externally closing a pinned `data:` tab, `.details.targetId` exists and `.details.lastUrl` does not.
3. A batch failure retains the same details object, and an MCP result exposes it under `.structuredContent.response.details`.

### Cost

One browser accessor, daemon response enrichment, a new optional response field, client/batch propagation, and tests for CLI, batch, MCP, safe URLs, and opaque URLs.

### What it makes worse

It adds another top-level namespace to every structured error contract and requires every response adapter to remember the new field.

### Rejected alternatives

- Parsing the human message, rejected because target ids and URLs would remain coupled to prose.
- Returning the values only through MCP, rejected because CLI and batch callers have the same recovery need.
- A typed error hierarchy refactor, rejected as broader than the reported contract gap.

## Proposer B: GPT-5.6-sol

### Shape

Keep `BrowserManager::bound_target_gone` as the source of truth and expose it through an accessor. Add `targetId` and optional `lastUrl` as top-level siblings of `code` in the daemon error response:

```json
{
  "success": false,
  "data": null,
  "error": "tab_gone: ...",
  "code": "tab_gone",
  "targetId": "TARGET",
  "lastUrl": "https://example.com/path"
}
```

The client `Response` type and batch serializer must preserve both fields. MCP inherits them through its parsed response wrapper. Do not emit `lastUrl` for an empty sanitized value.

### Predictions

1. A pinned HTTP tab closed externally produces top-level `targetId` and sanitized `lastUrl` in single-command JSON.
2. An opaque URL produces `targetId` but no `lastUrl`.
3. Existing consumers matching `code` continue to work because the code, message, and exit status are unchanged.

### Cost

One accessor, two optional public response fields, propagation through the client and batch layers, and focused tests across all three public machine surfaces.

### What it makes worse

It expands the top-level error namespace and makes names that are specific to one error code appear globally available.

### Rejected alternatives

- Using `data`, rejected because the proposer treated it as a success payload.
- A nested `details` object, rejected as an additional wrapper for only two values.
- Regexing the error string, rejected as a brittle machine contract.
