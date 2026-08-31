# Solution Gate decision

Verdict: Pass to detail.

Selected shape: E in `shaping.md`.

Both independent passes selected aggregate CLI delegation and rejected Desktop-owned agent identifiers. The installed CLI 59.1.4 produced useful agentless dry-run JSON without exposing the supplied key. Latest CLI source confirms that machine dry-run exits before writes and returns changes, migrations, skipped items, and warnings. A non-TTY `fx login` did not open a browser, so login must use a visible terminal. Release v0.0.4 publishes per-archive SHA-256 assets, so a pinned no-rc installer is possible.

Failure scoring:

| Shape | Result |
|---|---|
| S1 over-reach | Designed out. Spend, Gateway, IAM, existing files, and legacy persistence are unchanged. |
| S2 under-reach | Designed out. Agentless detection covers the CLI class, not four known IDs. |
| S3 direction inheritance | Designed out. Gateway and direct fx providers are both represented. |
| S4 proxy property | Designed out. CLI exit plus parsed machine status gates success. fx state comes from its public status command. |
| S5 unregistered peer | Designed out. Desktop creates no agent config or receipt. |
| S6 peer-version blindness | Old or incapable CLI output is a recoverable preview failure. |
| S7 wrong layer | Preview and errors appear in Desktop. OAuth and install occur visibly in Terminal. |
| S8 guard-derived cells | Tests derive malformed, truncated, empty, warning, migration, direct-provider, and expiry cells from the external contracts. |
| S9 test pins wrong thing | Force-red mutations must break agentless argv, success-gated association, and provider classification. |
| S10 claim from prose | Load-bearing CLI and fx behavior was probed against installed artifacts and latest source. |
| S11 asymmetric validation | Desktop whitelists parsed fields and never renders raw CLI output. |
| S12 primitive mismatch | A visible TTY terminal matches fx login semantics; a pinned checksum install matches the install promise. |
| S13 invocation-state collapse | Omission preserves legacy files and association. Only successful apply replaces the association. |

Carried assumption: agent detection can change between preview and apply. Desktop deliberately does not pin it because the CLI remains the authority. The confirmation states that the CLI will re-check installed agents before applying.

Visual format: compact Markdown tables are sufficient because ownership and sequence, not spatial layout, distinguish the shapes.
