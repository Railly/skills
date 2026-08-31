# Review Gate: Vercel Desktop CLI agents and fx

Status: incomplete.

The exact HEAD `861f7d4` passes strict markup checks, 181 tests, ReleaseFast build, package, signature verification, DMG verification, style, surfaces, stale-value, and caller gates. Four force-red mutations rejected realistic wrong implementations and restored green.

Three findings were fixed before this report: early agent association during key replacement, collapsed fx OAuth/key state, and ignored Keychain failure after successful CLI setup.

The run remains incomplete because Fable, Sonnet, Grok, and Codex exact-head reviewers failed to produce reports due to network or authentication errors. The final packaged UI also was not reopened for a visual dogfood pass. The cross-family Grok candidate audit remains the independent high-risk challenge, but it does not replace exact-head review.

## Exemptions claimed

- `CHANGELOG.md` is unchanged because release notes and version metadata require a separate release PR.
- `src/agents.zig` remains because earlier Desktop-managed configs still need exact backup restore, created-file deletion, and shell-block cleanup.

## Issue candidates

- Public Vercel CLI 59.1.4 still advertises four agents. Desktop now follows the installed CLI automatically; additional agent releases belong upstream.
- OAuth usage attribution for fx remains dependent on upstream Gateway, IAM, and reporting work and is outside this PR.
