# Review Gate: agent-browser protected Vercel deployments

Status: pass

Commit `1b9b77daa9de6fa8628bb6a4789696a23ef0423c` adds a bundled skill and discovery references for accessing protected Vercel deployments with short-lived OIDC tokens. The change is high risk because it handles authentication and access-control guidance.

The preferred same-project development to Preview workflow passed runtime skill discovery and a zsh smoke test. The exact JWT reached `agent-browser` as valid JSON under `x-vercel-trusted-oidc-idp-token`, produced no output, and left no `TOKEN` variable in the parent shell. The guidance agrees with official Trusted Sources documentation, the merged Vercel plugin skill, the downloaded live-tested guide, the merged v0 implementation, and Vercel CLI 59.1.4 source.

The review found no supported CLI or public REST mutation for Trusted Sources rules. The skill therefore requires an authorized human for that dashboard access-control change and for re-enabling OIDC Federation. The agent can handle same-project Preview access, deterministic linking when project and team are known, token minting, browser launch, diagnosis, and an approved static bypass change.

Same-family warning: the author and final reviewer are both GPT-5 Codex. Independent Vercel reference implementations and a shell substrate test provide the required high-risk challenge.

## Exemptions claimed

- The generic style detector flags the added em dash, but repository instructions allow sparse em dashes, all neighboring Available Skills entries use that separator, and Hunter explicitly approved it.
- MCP parity does not apply because no command, flag, runtime behavior, environment variable, or parser semantic changed.
- Inline implementation comments do not apply because the Rust change is help text only.

## Issue candidates

None.
