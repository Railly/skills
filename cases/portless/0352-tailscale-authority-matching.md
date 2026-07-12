# Case: Match Tailscale routes by authority before hostname

Status: candidate
Validation: contributor-validated
Human review: contributor-complete
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Source: https://github.com/vercel-labs/portless/pull/352

## Observed failure

Portless stored a full Tailscale URL but `findRoute` matched only a hostname. Requests addressed to a Tailscale hostname could miss the intended route, and multiple applications sharing one `.ts.net` hostname on different ports could resolve to the first hostname match.

## Red signal

The public PR records five proxy tests covering the funnel hostname, worktree-prefixed strict routing, a negative case, and two port cases. Reverting the proxy change made the port and issue tests fail.

## Method

1. Preserve the existing local-hostname match.
2. Add exact Tailscale authority matching, including the port.
3. Keep hostname-only Tailscale matching as a non-breaking fallback.
4. Keep wildcard routing last.
5. Drive both HTTP request and WebSocket paths through the shared matcher.

## Outcome

- Patch: commit `f6569f1` on PR #352.
- Tests: contributor-reported red-before-green proxy coverage.
- Delivery: PR open as of 2026-07-12.
- Maintainer acceptance: pending.

## Transferable lesson

> When multiple resources share a partial identifier, match the full discriminator before applying a compatibility fallback.

## Limits

- This case uses only public PR evidence.
- It does not claim a merged or released artifact.
- It is not loaded as a skill exemplar.
