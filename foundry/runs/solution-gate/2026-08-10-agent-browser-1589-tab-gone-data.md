# Solution gate run: agent-browser #1589 structured `tab_gone` data

Date: 2026-08-10
Repository: `vercel-labs/agent-browser`
Branch head inspected: `21667e987212ae9a601b39974d768c2537eb4080`
Trigger: clause 2, a public cross-process response contract changes.

Runtimes:

| Role | Runtime |
|---|---|
| Proposer A | `fable-5` |
| Proposer B | `gpt-5.6-sol` |
| Synthesizer and implementer | Codex |

Full proposal captures: `2026-08-10-agent-browser-1589-tab-gone-data-proposals.md`.

## Contract

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

## Forward chains

### Proposal A: top-level `details`

1. Add a `details` object to daemon JSON when `code` is `tab_gone` [inferred: daemon response construction is the shared origin].
2. Add `details` to `connection::Response` [inferred: serde otherwise discards unknown fields before CLI and batch formatting].
3. Single-command output serializes the new field [observed: it serializes `Response`].
4. Batch must explicitly copy the new field [observed: batch constructs a separate object].
5. MCP retains it without production changes [observed: MCP embeds parsed CLI JSON].

Harmful branch: a new top-level namespace must be propagated by every adapter and becomes part of the general error contract [inferred].

### Proposal B: top-level sibling fields

1. Add `targetId` and optional `lastUrl` beside `code` [inferred: both are available from the bound-gone tuple].
2. Add both optional fields to `connection::Response` [inferred].
3. Single-command output retains them automatically [observed].
4. Batch must explicitly copy both [observed].
5. MCP retains both through the parsed response wrapper [observed].

Harmful branch: error-specific names occupy the global response namespace and can appear meaningful for unrelated codes [inferred].

## Probe log

| Claim | Probe | Observed result |
|---|---|---|
| Current single-command JSON lacks structured recovery data | Close a pinned tab externally, then run `agent-browser --json get url` | `data` is `null`; target id and URL exist only inside `error` |
| Opaque URL payloads remain absent | Existing `data:` E2E and `sanitize_url` tests | Current head omits the opaque URL from the error text and persisted binding |
| Batch already maps response data | Inspect `cli/src/main.rs::run_batch` | `resp.data` is serialized as `result` |
| MCP already embeds CLI JSON | Inspect `cli/src/mcp.rs::tool_result_from_run` | Parsed response is stored at `structuredContent.response` |
| Safe recovery values already exist at the error source | Inspect `BrowserManager::bound_target_gone` writes | Both live paths store `(target_id, sanitize_url(last_url))` |

All proposal endpoint predictions survived the source probes. The implementation tests must still drive actual single-command, batch, and MCP output.

## Failure-shape scoring

| Shape | Proposal A | Proposal B |
|---|---|---|
| S1 Over-reach | Hit: adds a general `details` namespace. Designed out in synthesis. | Hit: adds global error-specific fields. Designed out in synthesis. |
| S2 Under-reach | Pass if batch and MCP are tested. | Pass if batch and MCP are tested. |
| S3 Direction inheritance | Pass. | Pass. |
| S4 Proxy property | Pass: reads the original bound-gone tuple. | Pass: reads the original bound-gone tuple. |
| S5 Unregistered peer | Partial hit: every adapter must learn `details`. | Partial hit: every adapter must learn both fields. |
| S6 Peer-version blindness | Accepted additive change; older clients ignore it. | Accepted additive change; older clients ignore it. |
| S7 Wrong layer | Risk unless the values are driven through CLI, batch, and MCP. | Same risk. |
| S8 Guard-derived cells | Pass if safe and opaque URLs are both tested. | Same. |
| S9 Test pins the wrong thing | Risk unless real CLI output is asserted after external close. | Same. |
| S10 Claim from prose | Pass: response paths were read and the failure was reproduced. | Pass. |

S1 and S2 receive the highest weight because this is a fix for review feedback.

## Synthesis

Kind: neither public shape exactly; graft the shared ownership and propagation findings into the existing response envelope.

Chosen contract:

```json
{
  "success": false,
  "data": {
    "targetId": "TARGET",
    "lastUrl": "https://example.com/path"
  },
  "error": "tab_gone: ...",
  "code": "tab_gone"
}
```

For unsafe or opaque URLs, `data` contains only `targetId`.

Why:

- `data` already exists and is currently `null` for this error, so no new top-level namespace is introduced.
- The change is additive for consumers that read `success`, `error`, and `code`.
- Batch already maps `data` to `result`.
- MCP already preserves the complete parsed response.
- The values remain sourced from the sanitized bound-gone tuple, never from prose.

The better material from both losing public shapes is retained: one accessor at the source, omission of an empty `lastUrl`, and verification across CLI, batch, and MCP.

## Carried assumptions

- Every client-visible `tab_gone` response still has `BrowserManager::bound_target_gone` populated.
- Enrichment after response construction, including after the second event drain replaces a response, covers all normal action failures.
- Batch and MCP preserve the nested data without extra production fields.
- Existing URL sanitization remains the only policy source.

These are implementation verification targets, not upgraded facts.
