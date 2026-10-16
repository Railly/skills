# Blind proposals: Portless path routing

- Date: 2026-08-13
- Isolated base: `origin/main` at `93acac4e1ea3ed02bd5ecb2778e9c31f82d25622`
- Proposal A: `claude-fable-5-thinking-high`
- Proposal B: `gemini-3.1-pro`
- Neither proposer could inspect PR #165 or another branch.

## Neutral contract

Property: one local hostname may intentionally map different canonical URL path-prefix regions to different backends, and every request is resolved by one deterministic route identity and precedence rule.

Observable: with root, `/api`, and `/api/admin` routes on one hostname, HTTP and WebSocket requests reach the backend selected by the canonical pathname and longest segment-boundary prefix; configuration can explicitly select root or a prefix.

Must not change:

- Existing hostname and Tailscale authority precedence.
- Wildcard strictness.
- Full request path forwarding.
- Route ownership, force, and stale cleanup semantics.
- Hosts and mDNS hostname behavior.
- Current CLI argument ownership.
- Multi-TLD behavior.
- Sharing behavior.
- Compatibility with existing route state.

## Proposal A

### Shape

Extend route identity from `hostname` to `(hostname, canonical path prefix)`, stored as an optional field on each flat `routes.json` entry. An absent field means root, so existing state loads without migration.

Use a dedicated `--path <prefix>` flag and matching per-app config field. Keep the name grammar unchanged. Canonicalize at registration: absolute paths only, no empty, `.` or `..` segments, query, or fragment. Explicit `/` normalizes to the absent root representation.

Resolution is two-stage:

1. Preserve the current authority precedence and choose the winning hostname candidate set.
2. Within that set, choose the longest segment-boundary prefix. Root is the floor. If the winning hostname has no matching prefix, return 404 without falling through to another authority tier.

HTTP, HTTP/1.1 upgrades, and HTTP/2 extended CONNECT use the same resolver. The backend receives the original `req.url` unchanged.

Conflict, force, update, and removal use tuple identity. Hostname-only consumers deduplicate hostnames and keep an entry published until the last route for that hostname disappears.

### Predictions

1. Root, `/api`, and `/api/admin` route deterministically: `/api/admin/users` reaches the admin backend, `/api?x=1` reaches the API backend, and `/apiary` reaches root.
2. HTTP and both WebSocket paths choose the same backend for the same authority and pathname.
3. The backend observes the original request path and query unchanged.
4. State from the current release continues to load as root routes, and force applies only to the selected tuple.

### Cost

One shared resolver stage, widened route-store identity, prefix validation, CLI and config plumbing, hostname projection fixes, display updates, and documentation. No new dependency. Per-request matching remains linear in the in-memory routes.

### What it makes worse

- An older proxy cannot safely interpret new state containing duplicate hostnames.
- Same-hostname backends share browser origin state.
- Backends may need base-path configuration because prefixes are not stripped.
- Hostname lifecycle and partial force takeover become more subtle.

### Rejected alternatives

- `app/api` positional syntax because the existing name parser already strips slash suffixes.
- Prefix stripping because it changes full-path forwarding.
- Regex and glob matchers because overlap makes precedence less deterministic.
- Registration-order matching because state order can change.
- Nested state because it complicates compatibility and lifecycle without adding capability.
- Cross-authority path competition because it changes current hostname and Tailscale precedence.

## Proposal B

### Shape

Extend identity to `(hostname, path)` with an optional state field. Parse positional names such as `app/api` into hostname `app` and prefix `/api`. Apply the path to every hostname generated for multiple TLDs.

Group routes by existing authority tiers, then select the highest tier that contains any matching path and choose its longest segment-boundary prefix. Host integrations continue receiving hostname only. Forward the full path.

### Predictions

1. `portless app/api ...` and `portless app/api/admin ...` coexist, and `/api/admin/users` reaches the admin backend.
2. `/api-docs` reaches root rather than `/api`.
3. An older CLI reading the new state sees duplicate hostnames and fails safely when registering root.

### Cost

More expensive route evaluation and path plumbing through add, remove, list, and prune.

### What it makes worse

- Denser CLI and 404 output.
- Downgrade collisions and force behavior.
- Backend base-path configuration friction.

### Rejected alternatives

- Prefix stripping.
- Encoding a path inside the stored hostname.
- Allowing wildcard path matches to override exact hostname matches.
- Regex routing.
