# Solution Gate: Portless path routing

- Date: 2026-08-13
- Target: `vercel-labs/portless` at `93acac4e1ea3ed02bd5ecb2778e9c31f82d25622`
- Trigger: the feature changes route identity, request resolution, persistent state, CLI/config contracts, and lifecycle ownership. Multiple solution shapes exist.
- Proposers: `claude-fable-5-thinking-high` and `gemini-3.1-pro`, blind to each other and isolated from PR #165.
- Coordinator: `cursor-grok-4.6-high`
- Failure-shape scorer: `gpt-5.6-sol-high`
- Synthesizer and future implementer: Codex root runtime, which proposed neither shape.
- Proposals: `2026-08-13-portless-path-routing-93acac4-proposals.md`
- Drawing: `2026-08-13-portless-path-routing-93acac4.html`

## 0. Trigger

Fires. This introduces a new route identity and alters contracts between the CLI, route store, proxy request handlers, DNS projections, and persistent state.

## 1. Neutral contract

### Property

One local hostname can own multiple canonical path-prefix regions, and every request resolves through one deterministic authority-then-path rule.

### Observable

Given root, `/api`, and `/api/admin` routes on one hostname:

- HTTP and WebSocket requests reach the backend selected by the canonical pathname.
- Longest segment-boundary prefix wins.
- Configuration can explicitly select root or a prefix.

### Must not change

- Exact hostname, Tailscale authority, Tailscale hostname, and wildcard tier order.
- Strict wildcard behavior.
- Full request path forwarding.
- Route owner, force, update, removal, and stale cleanup semantics.
- Hostname projection to hosts, mDNS, and certificates.
- CLI argument ownership.
- Multi-TLD generation.
- Existing sharing behavior.
- New code reading existing route state.

## 2. Independent proposals

Proposal A uses a dedicated `--path` and config field, tuple identity, canonical stored prefixes, authority-first resolution, tuple lifecycle, and hostname projection deduplication.

Proposal B overloads positional `app/api` syntax and chooses the first authority tier containing a path match.

Both are preserved in the proposals record.

## 3. Forward chains

### Proposal A

1. Dedicated path input enters CLI/config ownership (`inferred`) through the same parser sites as `--app-port`.
2. Canonical prefix is stored beside hostname (`inferred`), while missing fields remain root (`observed`: current validator accepts extra or absent optional fields).
3. Existing authority tier selects one candidate set (`observed`: current `findRoute` order), then longest segment-boundary prefix selects within it (`inferred`).
4. One resolver feeds HTTP, upgrade, and extended CONNECT (`observed`: all three already call `findRoute`) and all continue forwarding `req.url` (`observed`).
5. Tuple lifecycle isolates siblings (`inferred`) while hostname projections deduplicate (`inferred`).

Harmful branches:

- Missing any parser ownership set causes later Portless flags to become child arguments.
- Hostname-only remove/update wipes or mutates a sibling route.
- Removing one sibling can unpublish a hostname still used by another.
- An old proxy silently first-matches duplicate hostnames in new state.

### Proposal B

1. `app/api` changes from a name whose suffix is discarded to a route declaration (`observed` mechanism: `parseHostname(...).split("/")[0]`).
2. Mixed old/new CLIs assign different meanings to the same command (`inferred`).
3. Path-gated authority selection can skip an exact hostname with no path match and fall into Tailscale or wildcard (`inferred` from the proposal and current tier order).
4. An old proxy first-matches duplicate hostname rows (`observed` from current `findRoute`), while old add/force removes all rows for that hostname (`observed` from `addRoute`).

Harmful branches:

- Existing input silently changes meaning.
- Authority precedence changes.
- Downgrade fails open rather than safely.
- Hostname-only cleanup removes siblings.

## 4. Probe log

| Probe | Command or source | Observed result |
|---|---|---|
| Positional slash grammar | `node --experimental-strip-types --input-type=module -e 'import { parseHostname } from "./packages/portless/src/utils.ts"; ...'` | Both `app/api` and `http://app.localhost/api` return `app.localhost`. Proposal B changes an existing input contract. |
| Current authority order | `proxy.ts:121-133` | Exact hostname, Tailscale authority, Tailscale hostname, then wildcard. Path must not select a weaker tier. |
| Old duplicate-host resolution | Replay current `findRoute` with two same-hostname rows | The first row wins and path is ignored. Downgrade does not fail closed. |
| Old duplicate-host registration | Replay `routes.ts:229-246` | Adding one hostname filters out every row with that hostname and writes one pathless row. |
| Tuple cleanup need | `routes.ts:359-367` plus multi-app `process.pid` ownership | Hostname plus shared parent PID removes every sibling. Tuple identity must reach removal. |
| CLI ownership | `cli.ts:4207-4239` | Value-taking flags are enumerated separately for leading, run, and named modes. `--path` must be added to each relevant set. |
| Config ownership | `config.ts:315-409` | Unknown app keys are warned and ignored. `path` must be a known, validated field before it is relied upon. |
| Forwarding parity | `proxy.ts` request, upgrade, and extended CONNECT handlers | Every backend hop uses raw `req.url`; the selected shape can preserve no-strip behavior. |
| Hostname projections | `cli.ts:587-654` | Hosts, mDNS, and reload maps currently operate per route or hostname-keyed last-wins. Multiple path rows require set semantics. |
| Baseline unit probe | `pnpm exec vitest run src/utils.test.ts src/routes.test.ts` | `utils.test.ts` passed. One existing parallel lock test failed because its spawned helpers exited in the detached worktree; it does not distinguish either proposal. |

The external coordinator could read and replay code but Ask mode blocked live commands. The root runtime reran the load-bearing executable probes above.

## 5. Failure-shape scoring

| Shape | Proposal A | Proposal B |
|---|---|---|
| S1 over-reach | Designed out by dedicated syntax and authority-first resolution. | Hit: repurposes slash-bearing names and changes authority selection. Rejected. |
| S2 under-reach | Designed out if tuple identity reaches add, update, remove, force, cleanup, alias, and all request handlers. | Hit: tuple storage alone leaves hostname-keyed lifecycle and mixed-version behavior broken. Rejected. |
| S3 direction inheritance | Both root-to-prefix and prefix-to-root explicit precedence must be tested. | Root and absent semantics are unspecified. Rejected. |
| S4 proxy property | Canonical stored prefix and selected authority set directly model the needed properties. | "Tier with any path match" proves an adjacent property and can choose the wrong authority. Rejected. |
| S5 unregistered peer | New field must be registered with state validation, display, cleanup, and projections. Designed into A's checklist. | Host integrations and lifecycle are left implicit. Hit. |
| S6 peer-version blindness | Accepted cost: new code reads old state, but old code cannot safely serve new duplicate-host state. | Claimed safe downgrade is refuted. Rejected. |
| S7 wrong layer | One shared resolver feeds all three request paths. | Only safe if all handlers migrate; not independently specified. |
| S8 guard-derived cells | Tests derive from authority, pathname, lifecycle, and projection domains. | Positional examples inherit the new parser's own assumption. Hit. |
| S9 test pins wrong thing | Require independent mutation of authority ordering, boundary matching, tuple cleanup, and raw forwarding. | "Old CLI fails safely" prediction is false on current code. Rejected. |
| S10 claim from prose | All load-bearing grammar and state claims were checked against current code. | Safe downgrade and positional compatibility were prose claims contradicted by execution/source. Rejected. |

Independent weighted score: Proposal A `24/28`; Proposal B `5/28`.

## 6. Synthesis

**Kind: Proposal A whole.**

Do not graft Proposal B's positional `app/api` syntax. Its only distinct contribution is shorter syntax, and that syntax breaks an existing grammar, changes mixed-version meaning, and adds no capability missing from `--path`.

### Accepted shape

1. Route identity is `(hostname, canonicalPathPrefix)`.
2. Missing `pathPrefix` is the single stored representation of root.
3. A dedicated `--path` plus validated config selects the prefix. Explicit `/` must remain distinguishable from "not provided" until precedence resolution finishes.
4. Existing authority precedence selects the winning hostname candidate set first.
5. Longest segment-boundary prefix selects only within that set.
6. No prefix match in the winning set returns 404. It never falls through to a weaker authority tier.
7. HTTP, HTTP/1.1 WebSocket, and HTTP/2 extended CONNECT share the resolver and forward the full original path.
8. Add, conflict, force, update, remove, alias, rollback, and exit cleanup use tuple identity.
9. Hosts, mDNS, certificates, and hostname health checks use set projection and remain active until the last tuple for that hostname is removed.
10. New code reads old state as root. Safe downgrade of new duplicate-hostname state is not promised.

### Staged implementation

PR 1 owns the routing contract:

- Canonical prefix type and root representation.
- Route-store tuple identity and backward read compatibility.
- Authority-first, path-second resolver.
- HTTP and both WebSocket paths.
- Focused state, matching, lifecycle, and force tests.

PR 2 owns user inputs and projections:

- `--path`, config, explicit-root precedence, alias, get/list/doctor.
- Multi-app and multi-TLD plumbing.
- Hosts and mDNS set projection.
- Required README, CLI help, web docs, and skill updates.

Sharing remains unchanged in these two PRs. Path plus Tailscale/ngrok must be either explicitly unsupported initially or defined in a separate contract before implementation. Do not silently append prefixes to shared URLs.

## 7. Carried assumptions and verification targets

1. Percent-encoded separators are matched using WHATWG `URL.pathname` semantics without decoding reserved slashes again.
2. Canonicalization rejects standalone `.` and `..` segments before storage.
3. An explicit root flag overrides environment and config even though root stores as an absent field.
4. A winning authority set with no path match returns 404.
5. Wildcard hostname specificity is resolved before path specificity.
6. Removing one tuple leaves hostname projections active while siblings exist.
7. Force kills and replaces only the exact tuple owner.
8. Old state loads as root; new state on an old proxy is documented as unsupported.
9. Sharing behavior is not inferred from local routing behavior.
10. Each mechanism has a mutation that makes its test fail independently.

## 8. Verdict

**Accepted.** Implementation may begin with PR 1 only. PR 2 starts after PR 1's contract is merged or approved. A separate decision is required before path routing changes Tailscale or ngrok behavior.
